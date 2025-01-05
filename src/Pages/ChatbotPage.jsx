import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/components/ui/card';
import { Input } from '../components/components/ui/input';
import { Button } from '../components/components/ui/button';
import { Mic, Send } from 'lucide-react';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { text: input, sender: 'user' }]);
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "Thanks for your message! I'm here to help with your financial questions.",
        sender: 'ai'
      }]);
    }, 1000);
    setInput('');
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="p-6">
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
          <CardTitle>Financial Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </CardContent>
        <div className="p-4 border-t flex gap-2">
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Chatbot;