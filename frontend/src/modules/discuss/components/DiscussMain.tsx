import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, Hash, Lock, Users, Bot, Search, Plus } from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { MessageBubble } from './MessageBubble';
import { ChannelSidebar } from './ChannelSidebar';
import { AIAssistantPanel } from './AIAssistantPanel';
import { useDiscussStore } from '../stores/discussStore';
import EmojiPicker from 'emoji-picker-react';

export const DiscussMain: React.FC = () => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentChannel,
    messages,
    channels,
    sendMessage,
    setCurrentChannel,
    addReaction
  } = useDiscussStore();
  
  const { data: wsData, send: wsSend } = useWebSocket(
    `/discuss/ws/${currentChannel?.id}`
  );

  useEffect(() => {
    if (wsData) {
      // Handle real-time updates
      if (wsData.type === 'message') {
        // New message received
      } else if (wsData.type === 'typing') {
        // Someone is typing
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }
  }, [wsData]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !currentChannel) return;
    
    await sendMessage({
      channel_id: currentChannel.id,
      content: message,
      type: 'text'
    });
    
    setMessage('');
  };

  const handleTyping = () => {
    wsSend({ type: 'typing', channel_id: currentChannel?.id });
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public': return <Hash className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'direct': return <Users className="w-4 h-4" />;
      case 'ai_assisted': return <Bot className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-dark-bg via-primary-purple to-secondary-purple">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-accent-pink/20 to-primary-purple/20 blur-3xl"
            style={{
              width: `${400 + i * 100}px`,
              height: `${400 + i * 100}px`,
              left: `${-200 + i * 300}px`,
              top: `${-200 + i * 200}px`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <ChannelSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <GlassCard className="rounded-none border-b border-white/10">
          <div className="flex items-center justify-between py-4 px-6">
            <div className="flex items-center gap-3">
              {currentChannel && getChannelIcon(currentChannel.type)}
              <h2 className="text-xl font-semibold text-white">
                {currentChannel?.name || 'Select a channel'}
              </h2>
              {currentChannel?.ai_assistant_enabled && (
                <span className="px-2 py-1 bg-accent-pink/20 text-accent-pink text-xs rounded-full flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  AI Assisted
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Bot className="w-5 h-5 text-white" />
              </button>
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === 1} // Replace with actual current user ID
                showDate={index === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[index - 1]?.created_at).toDateString()}
                onReaction={(emoji) => addReaction(msg.id, emoji)}
              />
            ))}
          </AnimatePresence>
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 text-white/50"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-white/50 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 0.5,
                        delay: i * 0.1,
                        repeat: Infinity
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm">Someone is typing...</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <GlassCard className="rounded-none border-t border-white/10">
          <div className="p-4">
            {/* AI Suggestions */}
            {currentChannel?.ai_assistant_enabled && message.length > 0 && (
              <div className="mb-3 flex gap-2">
                {['👍 Sounds good!', '❓ Can you clarify?', '✅ I\'ll handle it'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setMessage(suggestion)}
                    className="px-3 py-1 bg-primary-purple/20 text-primary-purple text-sm rounded-full hover:bg-primary-purple/30 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex items-end gap-3">
              <button className="p-2 text-white/70 hover:text-white transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:border-accent-pink"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                
                {/* Emoji Picker */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-2 bottom-2 text-white/70 hover:text-white transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0">
                    <EmojiPicker
                      onEmojiClick={(emoji) => {
                        setMessage(message + emoji.emoji);
                        setShowEmojiPicker(false);
                      }}
                      theme="dark"
                    />
                  </div>
                )}
              </div>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!message.trim()}
                className={`
                  p-2 rounded-lg transition-all
                  ${message.trim() 
                    ? 'bg-gradient-to-r from-primary-purple to-accent-pink text-white shadow-lg' 
                    : 'bg-white/10 text-white/30'
                  }
                `}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAIPanel && (
          <AIAssistantPanel
            channel={currentChannel}
            onClose={() => setShowAIPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
