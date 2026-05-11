import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Bot, Sparkles, MessageSquare, TrendingUp, Users, Loader2 } from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';
import { AiActionsPanel } from '../../../components/shared/AiActionsPanel';
import { aiActionsApi } from '@/lib/api';
import { useDiscussStore } from '../stores/discussStore';
import { Channel } from '../types';

interface AIAssistantPanelProps {
  channel: Channel | null;
  onClose: () => void;
}

interface SummaryState {
  text: string | null;
  topics: string[];
  loading: boolean;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ channel, onClose }) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [summary, setSummary] = useState<SummaryState>({ text: null, topics: [], loading: false });
  const messages = useDiscussStore((s) => s.messages);

  const tabs = [
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'summary', label: 'Summary', icon: MessageSquare },
    { id: 'members', label: 'Members', icon: Users },
  ];

  const generateSummary = useCallback(async () => {
    if (!channel) return;
    setSummary({ text: null, topics: [], loading: true });
    try {
      const res = await aiActionsApi.run('customer-summary', 'MailChannel', String(channel.id));
      const output = res.data?.output ?? {};
      setSummary({
        text: output.summary ?? 'No summary generated.',
        topics: output.metadata?.topics ?? [],
        loading: false,
      });
    } catch {
      setSummary({ text: 'Failed to generate summary. Please try again.', topics: [], loading: false });
    }
  }, [channel]);

  // Derive unique senders from current channel messages
  const members = React.useMemo(() => {
    const channelMessages = messages.filter(m => m.channel_id === channel?.id && !m.is_deleted);
    const seen = new Map<number, string>();
    for (const m of channelMessages) {
      if (!seen.has(m.sender_id)) seen.set(m.sender_id, m.sender_name);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [messages, channel?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white/5 backdrop-blur-md border-l border-white/10 z-50"
    >
      <GlassCard className="h-full rounded-none flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-accent-pink" />
            <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 shrink-0">
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
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
                AI Suggestions for this channel
              </h3>
              {channel ? (
                <AiActionsPanel
                  entityType="MailChannel"
                  entityId={channel.id}
                  agentKey="customer-summary"
                />
              ) : (
                <p className="text-xs text-white/30 italic">Select a channel to see AI insights.</p>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Channel Summary</h3>

              {summary.text && (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-accent-pink" />
                    <span className="text-white font-medium">AI Generated Summary</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{summary.text}</p>
                </div>
              )}

              {summary.topics.length > 0 && (
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Key Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-primary-500/20 text-primary-500 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!summary.text && !summary.loading && (
                <p className="text-xs text-white/30 italic">
                  Click below to generate an AI summary of this channel.
                </p>
              )}

              <GradientButton
                onClick={generateSummary}
                variant="primary"
                className="w-full"
                disabled={!channel || summary.loading}
              >
                {summary.loading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Sparkles className="w-4 h-4 mr-2" />
                }
                {summary.loading ? 'Generating…' : 'Generate Summary'}
              </GradientButton>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Active Participants</h3>
              {members.length === 0 ? (
                <p className="text-xs text-white/30 italic">
                  No messages in this channel yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {members.map(({ id, name }) => (
                    <div key={id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center text-white font-semibold text-sm">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-medium">{name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};
