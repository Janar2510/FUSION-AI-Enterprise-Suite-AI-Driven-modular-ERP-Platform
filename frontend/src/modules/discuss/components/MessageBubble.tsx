import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Reply, Pin, Trash, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showDate: boolean;
  onReaction: (emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showDate,
  onReaction
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-400';
    if (sentiment < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-2xl ${isOwn ? 'items-end' : 'items-start'}`}>
        {showDate && (
          <div className="text-center text-white/40 text-xs mb-4">
            {new Date(message.created_at).toLocaleDateString()}
          </div>
        )}
        
        <div className="flex items-end gap-2">
          {!isOwn && (
            <img 
              src={message.sender_avatar || '/default-avatar.png'}
              alt={message.sender_name}
              className="w-8 h-8 rounded-full"
            />
          )}
          
          <div>
            {!isOwn && (
              <div className="text-white/70 text-sm mb-1">
                {message.sender_name}
              </div>
            )}
            
            <div
              className={`
                relative group px-4 py-2 rounded-2xl
                ${isOwn 
                  ? 'bg-gradient-to-r from-primary-purple to-secondary-purple text-white' 
                  : 'bg-white/10 backdrop-blur-md text-white'
                }
              `}
            >
              {/* AI Summary Badge */}
              {message.summary && (
                <div className="mb-2 p-2 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                    <CheckCircle className="w-3 h-3" />
                    AI Summary
                  </div>
                  <p className="text-sm">{message.summary}</p>
                </div>
              )}
              
              {/* Message Content */}
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              
              {/* Action Items */}
              {message.action_items?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <div className="text-xs text-white/60 mb-1">Action Items:</div>
                  {message.action_items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-1 text-sm">
                      <AlertCircle className="w-3 h-3 text-yellow-400" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Reactions */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex gap-1 mt-2">
                  {Object.entries(message.reactions).map(([emoji, users]: [string, any]) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(emoji)}
                      className="px-2 py-1 bg-black/20 rounded-full text-sm hover:bg-black/30"
                    >
                      {emoji} {users.length}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Time and Sentiment */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/40">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
                {message.sentiment_score !== null && (
                  <span className={`text-xs ${getSentimentColor(message.sentiment_score)}`}>
                    •
                  </span>
                )}
              </div>
              
              {/* Quick Reactions */}
              {showReactionPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-full mb-2 flex gap-1 p-2 bg-black/80 backdrop-blur rounded-lg"
                >
                  {commonReactions.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReaction(emoji);
                        setShowReactionPicker(false);
                      }}
                      className="hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            
            {/* Action Menu */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0, x: isOwn ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="p-1 text-white/40 hover:text-white/60"
                >
                  😊
                </button>
                <button className="p-1 text-white/40 hover:text-white/60">
                  <Reply className="w-4 h-4" />
                </button>
                {isOwn && (
                  <>
                    <button className="p-1 text-white/40 hover:text-white/60">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-white/40 hover:text-red-400">
                      <Trash className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button className="p-1 text-white/40 hover:text-white/60">
                  <Pin className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};




