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
const genAI = new GoogleGenerativeAI("Gemini API Key")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

const auth = getAuth()
const db = getFirestore()

// Utility function to generate context-aware prompts
const generateContextualPrompt = (userData, messages, userInput) => {
  return `You are an intelligent financial assistant. Here is the user's current financial data:

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
  loading: () => <div className="p-4">Loading...</div>,
  ssr: false
})

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
    setIsLoading(true)
    await saveMessage(userMessage)

    try {
      const aiResponse = await generateResponse(input)
      const botMessage = {
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, botMessage])
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

      const BLAND_API_KEY = "Bland API Key"
      
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
    <div className="flex h-screen bg-gray-100">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-blue-500">
                  <AvatarImage src="src\components\components\Images\robot.png" />
                  <AvatarFallback>
                    🤖 {/* You can also add a different emoji or text */}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">AI Assistant</h1>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                    {isLoading ? 'Thinking...' : 'Online'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleCall}
                  variant="outline"
                  className="rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Phone className="h-4 w-4 text-blue-500 mr-2" />
                  Call
                </Button>
                <ProfileButton
                  user={user}
                  onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                  onLogout={() => auth.signOut()}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-1`}
            >
              {/* Avatar for Bot */}
              {message.sender === 'bot' && (
                <Avatar className="h-8 w-8 bg-blue-500 flex-shrink-0">
                  <AvatarImage src="src\components\components\Images\robot.png" />
                </Avatar>
              )}
              
              {/* Chat Bubble */}
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' // User message style
                      : 'bg-green-100 text-green-800 border border-green-300' // Bot message style
                  }`}
                >
                  {message.text}
                </div>
                {/* Timestamp */}
                <span className={`text-xs text-gray-500 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        <footer className="bg-white border-t p-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {showEmojiPicker ? (
                  <X className="h-5 w-5" />
                ) : (
                  <SmilePlus className="h-5 w-5" />
                )}
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-10 shadow-xl rounded-lg">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
            </div>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="rounded-full border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              className="rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}