import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bot, Sparkles, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';

interface AIAssistantPanelProps {
  channel: any;
  onClose: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  channel,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [aiResponse, setAiResponse] = useState('');

  const tabs = [
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'summary', label: 'Summary', icon: MessageSquare },
    { id: 'members', label: 'Members', icon: Users },
  ];

  const insights = [
    {
      type: 'sentiment',
      title: 'Channel Sentiment',
      value: 'Positive',
      change: '+12%',
      color: 'text-green-400'
    },
    {
      type: 'activity',
      title: 'Activity Level',
      value: 'High',
      change: '+5%',
      color: 'text-blue-400'
    },
    {
      type: 'engagement',
      title: 'Engagement',
      value: '85%',
      change: '+3%',
      color: 'text-purple-400'
    }
  ];

  const recentActivity = [
    { user: 'John Doe', action: 'shared a document', time: '2m ago' },
    { user: 'Jane Smith', action: 'reacted to a message', time: '5m ago' },
    { user: 'AI Assistant', action: 'generated summary', time: '10m ago' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white/5 backdrop-blur-md border-l border-white/10 z-50"
    >
      <GlassCard className="h-full rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-accent-pink" />
            <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all
                  ${activeTab === tab.id
                    ? 'text-accent-pink border-b-2 border-accent-pink'
                    : 'text-white/50 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Channel Insights</h3>
              
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm">{insight.title}</span>
                    <span className={`text-sm font-medium ${insight.color}`}>
                      {insight.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">{insight.value}</div>
                </motion.div>
              ))}

              <div className="mt-6">
                <h4 className="text-white font-medium mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-accent-pink rounded-full" />
                      <span className="text-white/70">{activity.user}</span>
                      <span className="text-white/50">{activity.action}</span>
                      <span className="text-white/30 ml-auto">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Channel Summary</h3>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent-pink" />
                  <span className="text-white font-medium">AI Generated Summary</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  This channel has been very active today with 15 messages discussing the new project timeline. 
                  The team seems positive about the proposed changes, with 85% positive sentiment. 
                  Key action items include finalizing the design mockups by Friday and scheduling a client meeting.
                </p>
              </div>

              <div className="bg-primary-purple/10 border border-primary-purple/20 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {['Project Timeline', 'Design Mockups', 'Client Meeting', 'Budget Review'].map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1 bg-primary-purple/20 text-primary-purple text-xs rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <GradientButton
                onClick={() => setAiResponse('Generating new summary...')}
                variant="primary"
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate New Summary
              </GradientButton>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Channel Members</h3>
              
              <div className="space-y-3">
                {[
                  { name: 'John Doe', role: 'Admin', status: 'online', avatar: '/avatar1.jpg' },
                  { name: 'Jane Smith', role: 'Member', status: 'online', avatar: '/avatar2.jpg' },
                  { name: 'Bob Johnson', role: 'Member', status: 'away', avatar: '/avatar3.jpg' },
                  { name: 'AI Assistant', role: 'Bot', status: 'online', avatar: '/ai-avatar.jpg' },
                ].map((member, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className={`
                        absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white/10
                        ${member.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'}
                      `} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{member.name}</span>
                        {member.role === 'Bot' && (
                          <Bot className="w-3 h-3 text-accent-pink" />
                        )}
                      </div>
                      <span className="text-white/50 text-sm capitalize">{member.role}</span>
                    </div>
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${member.status === 'online' 
                        ? 'bg-green-400/20 text-green-400' 
                        : 'bg-yellow-400/20 text-yellow-400'
                      }
                    `}>
                      {member.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};
