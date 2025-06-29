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
import DarkModeToggle from "../components/ui/DarkModeToggle"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEN_AI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
const auth = getAuth()
const db = getFirestore()

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

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data())
        }

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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleOffline = () => {
      toast.error("You're offline. Please check your Internet Connection.", {
        toastId: "offline-toast",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      })
    }

    const handleOnline = () => {
      toast.dismiss("offline-toast")
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const generateResponse = async (userInput) => {
    try {
      const prompt = generateContextualPrompt(userData, messages, userInput)
      const result = await model.generateContent(prompt)
      return await result.response.text()
    } catch (error) {
      console.error('Error generating response:', error)
      return "Sorry, I ran into an issue. Please try again."
    }
  }

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
    } catch {
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex h-screen">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsSidebarOpen(false)} />
        )}

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />

        <div className="flex-1 flex flex-col w-full">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 w-full">
            <div className="w-full px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-500">
                    <AvatarImage src="/assets/robot.png" alt="AI Assistant" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-white">AI Assistant</h1>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                      {isLoading ? 'Thinking...' : 'Online'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                 
                  <Button variant="outline" onClick={() => alert("Call functionality here")}>
                    <Phone className="h-4 w-4 mr-1" /> Call
                  </Button>
                  <ProfileButton user={user} onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
                </div>
              </div>
            </div>
          </header>

          {/* Chat area */}
          <main className="flex-grow overflow-y-auto px-4 py-4 bg-white dark:bg-gray-900">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}>
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8 bg-blue-500 flex-shrink-0 mt-1">
                      <AvatarImage src="/assets/robot.png" alt="AI" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col gap-1 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-3 py-2 max-w-[280px] sm:max-w-md md:max-w-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                    }`}>
                      <div className="text-sm sm:text-base whitespace-pre-wrap">{message.text}</div>
                    </div>
                    <span className="text-xs text-gray-500 px-1">{formatTime(message.timestamp)}</span>
                  </div>

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

          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t p-3 sticky bottom-0 z-10 w-full">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  {showEmojiPicker ? <X className="h-5 w-5" /> : <SmilePlus className="h-5 w-5" />}
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-10 shadow-lg rounded-lg">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="rounded-full border-gray-200 pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base py-2 dark:bg-gray-700 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
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
