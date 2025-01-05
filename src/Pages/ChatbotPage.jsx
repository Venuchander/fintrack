'use client'

import { useState } from 'react'
import { Card, CardContent } from '../components/components/ui/card';
import { Button } from "../components/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/components/ui/avatar"
import { Badge } from "../components/components/ui/badge"
import { Input } from "../components/components/ui/input"
import { Lightbulb, Send, SmilePlus, Phone, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Layout from './Layout';

// Dynamically import EmojiPicker to reduce initial bundle size
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

  const handleSend = () => {
    if (!input.trim()) return
    
    setMessages([...messages, { text: input, sender: 'user' }])
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "I'll help you analyze your current portfolio and suggest optimization strategies. What's your primary investment goal?",
        sender: 'bot'
      }])
    }, 1000)
    setInput('')
  }

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleCall = () => {
    // Implement call functionality here
    alert('Initiating call...')
  }

  return (
    <Layout>
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Financial Assistant</h1>
          <p className="text-gray-600">Get real-time answers to your financial questions</p>
        </div>

        <Card className="border-0 shadow-lg">
          <div className="p-4 border-b bg-white rounded-t-xl">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-blue-500">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  <Lightbulb className="h-5 w-5 text-white" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">FinBot</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                  Online
                </Badge>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Add fixed height and scrollable container for chat only */}
            <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-4'
                          : 'bg-gray-100 text-gray-800 mr-4'
                      }`}
                    >
                      {message.text}
                    </div>
                    {message.quickActions && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.quickActions.map((action, i) => (
                          <button
                            key={i}
                            className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors text-sm"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t bg-white rounded-b-xl">
              <div className="flex items-center gap-3">
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
                />
                <Button
                  onClick={handleCall}
                  variant="outline"
                  className="rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Phone className="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                  onClick={handleSend}
                  className="rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>

        </Card>
      </div>
    </div>
    </Layout>
  )
}
