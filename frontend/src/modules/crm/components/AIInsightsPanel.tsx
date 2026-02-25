import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, TrendingUp, Target, AlertTriangle, 
  CheckCircle, Clock, DollarSign, Users, X, RefreshCw
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';

interface Insight {
  id: string;
  type: 'recommendation' | 'alert' | 'opportunity' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  impact?: string;
}

interface AIInsightsPanelProps {
  contactId?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ 
  contactId, 
  isOpen, 
  onClose 
}) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'predictions'>('insights');

  useEffect(() => {
    if (isOpen) {
      loadInsights();
    }
  }, [isOpen, contactId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Mock AI insights - in real implementation, this would call the backend
      const mockInsights: Insight[] = [
        {
          id: '1',
          type: 'recommendation',
          title: 'Schedule Follow-up Call',
          description: 'High engagement score indicates readiness for next conversation. Optimal timing: within 48 hours.',
          confidence: 0.85,
          priority: 'high',
          action: 'Schedule call',
          impact: 'Increases conversion probability by 35%'
        },
        {
          id: '2',
          type: 'opportunity',
          title: 'Upsell Premium Package',
          description: 'Customer has shown interest in advanced features. Previous usage patterns suggest high value potential.',
          confidence: 0.72,
          priority: 'medium',
          action: 'Send personalized proposal',
          impact: 'Potential revenue increase: $15,000'
        },
        {
          id: '3',
          type: 'alert',
          title: 'Churn Risk Detected',
          description: 'Decreased engagement over past 2 weeks. Immediate intervention recommended.',
          confidence: 0.68,
          priority: 'high',
          action: 'Personal outreach',
          impact: 'Prevents potential loss of $45,000 ARR'
        },
        {
          id: '4',
          type: 'prediction',
          title: 'Deal Closure Probability',
          description: 'Based on interaction patterns and historical data, this deal has an 82% chance of closing this quarter.',
          confidence: 0.82,
          priority: 'medium',
          impact: 'Expected close date: March 15, 2024'
        }
      ];
      
      setInsights(mockInsights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'prediction':
        return <Brain className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low':
        return 'border-green-500/50 bg-green-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <GlassCard className="h-full flex flex-col" glow>
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Insights</h2>
                  <p className="text-white/60">
                    {contactId ? `Insights for Contact #${contactId}` : 'General AI Recommendations'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={loadInsights}
                  disabled={loading}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {[
                { id: 'insights', label: 'All Insights' },
                { id: 'recommendations', label: 'Recommendations' },
                { id: 'predictions', label: 'Predictions' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-purple text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4"></div>
                  <p className="text-white/60">Analyzing data with AI...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {insights
                    .filter(insight => 
                      activeTab === 'insights' || 
                      (activeTab === 'recommendations' && insight.type === 'recommendation') ||
                      (activeTab === 'predictions' && insight.type === 'prediction')
                    )
                    .map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GlassCard className={`p-4 border-l-4 ${getPriorityColor(insight.priority)}`}>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {getInsightIcon(insight.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-semibold">{insight.title}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(insight.confidence)} bg-white/10`}>
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                                insight.priority === 'high' ? 'text-red-400 bg-red-500/20' :
                                insight.priority === 'medium' ? 'text-yellow-400 bg-yellow-500/20' :
                                'text-green-400 bg-green-500/20'
                              }`}>
                                {insight.priority}
                              </span>
                            </div>
                            
                            <p className="text-white/70 mb-3">{insight.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm">
                              {insight.action && (
                                <div className="flex items-center gap-1 text-blue-400">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Action: {insight.action}</span>
                                </div>
                              )}
                              {insight.impact && (
                                <div className="flex items-center gap-1 text-green-400">
                                  <DollarSign className="w-4 h-4" />
                                  <span>Impact: {insight.impact}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {insights.length === 0 && (
                  <GlassCard className="p-12 text-center">
                    <Brain className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No insights available</h3>
                    <p className="text-white/60">
                      AI is analyzing your data. Check back later for personalized insights and recommendations.
                    </p>
                  </GlassCard>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Powered by AI • Updated 2 minutes ago</span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm">
                  Export Insights
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg text-sm">
                  Apply Recommendations
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};


