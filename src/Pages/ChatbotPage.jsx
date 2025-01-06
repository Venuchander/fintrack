'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "../components/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/components/ui/avatar"
import { Badge } from "../components/components/ui/badge"
import { Input } from "../components/components/ui/input"
import { Lightbulb, Send, SmilePlus, Phone, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Layout from './Layout'
import { GoogleGenerativeAI } from "@google/generative-ai"


// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyDAlB1aWf6GFj1cORf1pI5oh9K_adYsXLg")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// Create chat history
let chatHistory = [];

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
    }
  ])
  const [input, setInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const generateResponse = async (userInput) => {
    try {
      const result = await model.generateContent(userInput)
      const response = await result.response.text()
      return response
    } catch (error) {
      console.error('Error generating response:', error)
      return "I apologize, but I encountered an error processing your request. Please try again."
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    // Add user message
    const userMessage = { text: input, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Get AI response
      const aiResponse = await generateResponse(input)
      
      // Add AI response to messages
      setMessages(prev => [...prev, {
        text: aiResponse,
        sender: 'bot'
      }])
    } catch (error) {
      console.error('Error in handleSend:', error)
      // Add error message
      setMessages(prev => [...prev, {
        text: "I apologize, but I encountered an error. Please try again.",
        sender: 'bot'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleCall = () => {
    alert('Initiating call...')
  }

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-gray-100">
        <header className="bg-white shadow-sm p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-blue-500">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  <Lightbulb className="h-5 w-5 text-white" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-gray-800">AI Assistant</h1>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                  {isLoading ? 'Thinking...' : 'Online'}
                </Badge>
              </div>
            </div>
            <Button
              onClick={handleCall}
              variant="outline"
              className="rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Phone className="h-4 w-4 text-blue-500 mr-2" />
              Call
            </Button>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col gap-2 max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
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
    </Layout>
  )
}