import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, MessageSquare, Zap, Brain, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/GlassCard'
import { GradientButton } from '@/components/shared/GradientButton'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI business assistant. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I understand your request. This is a demo response. In the full implementation, I would connect to your AI backend to provide intelligent assistance with your business operations.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    { icon: TrendingUp, label: 'Analyze Sales Data', prompt: 'Can you analyze my sales performance this month?' },
    { icon: Brain, label: 'Business Insights', prompt: 'What insights can you provide about my business?' },
    { icon: Zap, label: 'Automation Ideas', prompt: 'Suggest ways to automate my business processes' },
    { icon: MessageSquare, label: 'Customer Support', prompt: 'Help me improve customer support efficiency' }
  ]

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="heading-1 mb-2">AI Assistant</h1>
        <p className="text-white/70">
          Chat with your AI-powered business assistant
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <GlassCard className="h-[600px] flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`}>
                        {message.type === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                      </div>
                      <div className={`rounded-lg px-4 py-2 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                          : 'bg-white/5 border border-white/10'
                      }`}>
                        <p className="text-white/90 text-sm">{message.content}</p>
                        <p className="text-white/50 text-xs mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-white/70 text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your business..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-500/50"
                  disabled={isTyping}
                />
                <GradientButton
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="px-4"
                >
                  <Send className="w-4 h-4" />
                </GradientButton>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <action.icon className="w-5 h-5 text-purple-400" />
                    <span className="text-white/90 text-sm">{action.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default AIChat

