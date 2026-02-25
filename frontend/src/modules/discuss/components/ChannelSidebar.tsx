import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Lock, Users, Bot, Plus, Search } from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { useDiscussStore } from '../stores/discussStore';

export const ChannelSidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { channels, currentChannel, setCurrentChannel } = useDiscussStore();

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public': return <Hash className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'direct': return <Users className="w-4 h-4" />;
      case 'ai_assisted': return <Bot className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white/5 backdrop-blur-md border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white mb-4">Channels</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent-pink"
          />
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredChannels.map((channel) => (
          <motion.button
            key={channel.id}
            onClick={() => setCurrentChannel(channel)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
              ${currentChannel?.id === channel.id
                ? 'bg-primary-purple/20 text-white border border-primary-purple/30'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {getChannelIcon(channel.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{channel.name}</span>
                {channel.ai_assistant_enabled && (
                  <Bot className="w-3 h-3 text-accent-pink" />
                )}
              </div>
              {channel.description && (
                <p className="text-xs text-white/50 truncate">
                  {channel.description}
                </p>
              )}
            </div>
            {channel.unread_count > 0 && (
              <span className="px-2 py-1 bg-accent-pink text-white text-xs rounded-full">
                {channel.unread_count}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Add Channel Button */}
      <div className="p-4 border-t border-white/10">
        <button className="w-full flex items-center gap-3 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
          <Plus className="w-4 h-4" />
          <span>Add Channel</span>
        </button>
      </div>
    </div>
  );
};
