// ChatbotPage.jsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Lightbulb, Send, SmilePlus, Phone, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { GoogleGenerativeAI } from "@google/generative-ai"
import axios from 'axios'
import ProfileButton from '../components/components/profile'
import Sidebar from '../components/components/Sidebar'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, getDoc, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEN_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

const auth = getAuth()
const db = getFirestore()

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Utility function to generate context-aware prompts
const generateContextualPrompt = (userData, messages, userInput) => {
  return `You are an intelligent financial assistant. Here is the user's current financial data, remember that data is based on the INR/₹ not dollar:

Financial Overview:
- Total Balance: ${userData?.totalBalance || 0}
- Monthly Income: ${userData?.accounts?.reduce((sum, acc) => sum + (acc.isRecurringIncome ? acc.recurringAmount : 0), 0) || 0}
- Savings Goal: ${userData?.savingsGoal || 0}

Recent Activity:
${userData?.expenses?.slice(-3).map(exp => 
  `- ${exp.category}: ${exp.amount} (${new Date(exp.date).toLocaleDateString()})`
).join('\n')}

Current conversation:
${messages.slice(-3).map(m => `${m.sender}: ${m.text}`).join('\n')}

User's new message: ${userInput}

Please provide a helpful, personalized response based on this context.`
}

// Dynamically import EmojiPicker
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  ),
  ssr: false
});

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { 
      text: "Hello! I'm your AI financial assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const messagesEndRef = useRef(null)

  //✨ Toast network status
    useEffect(() => {
      const handleOffline = () => {
        toast.error("You're offline. Please check your Internet Connection.", {
          toastId: "offline-toast",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        });
      };
  
      const handleOnline = () => {
        toast.dismiss("offline-toast");
      };
  
      window.addEventListener("offline", handleOffline);
      window.addEventListener("online", handleOnline);
  
      return () => {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
      };
    }, []);


  // Fetch user data and chat history
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (user) {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data())
        }

        // Fetch chat history
        const chatQuery = query(
          collection(db, 'chats'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'asc')
        )
        const chatSnapshot = await getDocs(chatQuery)
        const chatHistory = chatSnapshot.docs.map(doc => doc.data())
        
        if (chatHistory.length > 0) {
          setMessages(prev => [...prev, ...chatHistory])
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // Scroll to bottom effect
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Generate AI response with context
  const generateResponse = async (userInput) => {
    try {
      const prompt = generateContextualPrompt(userData, messages, userInput)
      const result = await model.generateContent(prompt)
      return await result.response.text()
    } catch (error) {
      console.error('Error generating response:', error)
      return "I apologize, but I encountered an error processing your request. Please try again."
    }
  }

  // Save message to Firestore
  const saveMessage = async (message) => {
    try {
      await addDoc(collection(db, 'chats'), {
        ...message,
        userId: user.uid,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = { 
      text: input, 
      sender: 'user',
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    const loadingMessage = {
      text: '<div class="animate-pulse font-semibold">Thinking...</div>',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isLoading: true
    }
setMessages(prev => [...prev, loadingMessage])
    setIsLoading(true)
    await saveMessage(userMessage)

    try {
      const aiResponse = await generateResponse(input)
      const botMessage = {
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => {
        const updated = [...prev]
        const lastIndex = updated.findIndex(m => m.isLoading)
        if (lastIndex !== -1) {
          updated[lastIndex] = botMessage
        } else {
          updated.push(botMessage)
        }
        return updated
      })
      await saveMessage(botMessage)
    } catch (error) {
      console.error('Error in handleSend:', error)
      const errorMessage = {
        text: "I apologize, but I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      await saveMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCall = async () => {
    if (!user) {
      alert('Please log in to make a call')
      return
    }

    try {
      const userPhoneNumber = userData?.phoneNumber
      if (!userPhoneNumber) {
        alert('Phone number not found in your profile')
        return
      }

      const BLAND_API_KEY = import.meta.env.VITE_BLAND_API_KEY;
      
      // Create a detailed task description using the same financial data as Gemini
      const taskDescription = `
Task: Financial consultation call

User Profile:
- Total Balance: ${userData?.totalBalance || 0}
- Monthly Income: ${userData?.accounts?.reduce((sum, acc) => sum + (acc.isRecurringIncome ? acc.recurringAmount : 0), 0) || 0}
- Savings Goal: ${userData?.savingsGoal || 0}

Recent Activity:
${userData?.expenses?.slice(-3).map(exp => 
  `- ${exp.category}: ${exp.amount} (${new Date(exp.date).toLocaleDateString()})`
).join('\n')}

Recent Chat History:
${messages.slice(-3).map(m => `${m.sender}: ${m.text}`).join('\n')}

Instructions for Voice Call:
1. Start by greeting the user and verifying their identity
2. Reference their current financial situation and recent transactions
3. Provide personalized financial advice based on their data
4. Be attentive to their questions and provide clear explanations
5. Keep the conversation professional but friendly
6. Everything is in Rupees (₹) not dollars

Key Points to Discuss:
- Current savings progress towards their goal
- Recent spending patterns
- Personalized financial recommendations
- Any specific concerns from recent chat history

Security Guidelines:
- Verify user identity before discussing specific financial details
- Do not share exact account balances unless user confirms identity
- Keep responses focused and relevant to financial consultation`

      const callData = {
        phone_number: userPhoneNumber.startsWith('+') ? userPhoneNumber : `+${userPhoneNumber}`,
        task: taskDescription,
        model: "enhanced",
        voice: "nat",
        max_duration: 15,
        record: true,
        temperature: 0.7,
        first_message: "Hello! I'm your AI financial assistant. For security purposes, could you please verify your identity by confirming your name and the last transaction you made?",
        speech_model: "nova-2",
        caller_id: "AI Financial Advisor",
        interrupt: true,
        request_callbacks: {
          transcripts: false,
          audio: true
        },
        voice_settings: {
          stability: 0.7,
          similarity: 0.7,
          speed: 1.0,
          pause_duration: 0.7
        },
        custom_instructions: {
          context: taskDescription,
          goals: [
            "Review current financial status and recent transactions",
            "Provide personalized financial advice",
            "Address any concerns from recent chat history",
            "Help user progress toward savings goals"
          ],
          constraints: [
            "Must verify user identity before discussing specific financial details",
            "Keep information security in mind - no sharing of exact balances until identity verified",
            "Focus on actionable financial advice",
            "Keep responses clear and concise"
          ],
          error_handling: {
            on_user_unavailable: "I'll leave a brief message about scheduling another consultation.",
            on_unclear_response: "I'll politely ask for clarification.",
            on_technical_issues: "I'll apologize and suggest continuing via chat."
          }
        }
      }

      const response = await axios.post('https://api.bland.ai/v1/calls', 
        callData, 
        { 
          headers: {
            'Authorization': `Bearer ${BLAND_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      )
      
      if (response.status === 200) {
        // Save call initiation to chat history
        const callMessage = {
          text: "📞 Voice call initiated for financial consultation",
          sender: 'system',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, callMessage])
        await saveMessage(callMessage)
        
      } else {
        alert(`Call initiation failed: ${response.data.message}`)
      }
    } catch (error) {
      console.error('Error initiating call:', error)
      alert(`Error initiating call: ${error.message}`)
    }
  }

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div>
      <div className="flex h-screen w-full">
      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />

      {/* Main content area - full width with no constraints */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header - full width */}
        <header className="bg-white shadow-sm sticky top-0 z-10 w-full">
          <div className="w-full px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-500">
                  <AvatarImage src="/assets/robot.png" alt="AI Assistant" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-base sm:text-xl font-semibold text-gray-800">AI Assistant</h1>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                    {isLoading ? 'Thinking...' : 'Online'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCall}
                  variant="outline"
                  className="text-xs sm:text-sm px-2 py-1 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Call</span>
                </Button>
                
                <ProfileButton
                  user={user}
                  onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                  onLogout={() => auth.signOut()}
                  hideNameOnMobile={true}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main chat area - full width with padding */}
        <main className="flex-grow overflow-y-auto px-4 py-4 bg-white">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}
              >
                {/* Avatar for Bot */}
                {message.sender === 'bot' && (
                  <Avatar className="h-8 w-8 bg-blue-500 flex-shrink-0 mt-1">
                    <AvatarImage src="/assets/robot.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                
                {/* Chat Bubble */}
                <div className={`flex flex-col gap-1 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 max-w-[280px] sm:max-w-md md:max-w-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-sm sm:text-base whitespace-pre-wrap">
                      <span dangerouslySetInnerHTML={{
                        __html: message.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold **text**
                          .replace(/\n/g, '<br />') // line breaks
                      }} />
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <span className="text-xs text-gray-500 px-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                {/* User Avatar */}
                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8 bg-blue-600 flex-shrink-0 mt-1">
                    <AvatarFallback className="text-white">{user?.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input area - full width */}
        <footer className="bg-white border-t p-3 sticky bottom-0 z-10 w-full">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {showEmojiPicker ? (
                  <X className="h-5 w-5" />
                ) : (
                  <SmilePlus className="h-5 w-5" />
                )}
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-10 shadow-lg rounded-lg transform scale-90 sm:scale-100 origin-bottom-left">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="rounded-full border-gray-200 pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base py-2"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 p-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600 transition-colors"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
      </footer>
    </div>
    </div>
    <ToastContainer position="top-center" />
</div>
  )
}