import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Building, TrendingUp, DollarSign, AlertCircle,
  Mail, Phone, Calendar, Target, Brain, Sparkles, Eye, EyeOff
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';
import { ContactList } from './ContactList';
import { ContactDetail } from './ContactDetail';
import { DealPipeline } from './DealPipeline';
import { AIInsightsPanel } from './AIInsightsPanel';
import { useCRMStore } from '@/stores/crmStore';
import { useGlobalMetricsStore } from '@/stores/globalMetricsStore';

// Import the Contact interface from the store or define it here
interface Contact {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  company?: {
    name: string;
    industry: string;
  };
  lead_score: number;
  lead_status: string;
  engagement_score: number;
  total_interactions: number;
  last_activity: string;
  created_at: string;
}

export const CRMDashboard: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeView, setActiveView] = useState<'contacts' | 'companies' | 'deals' | 'insights'>('contacts');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  
  const {
    contacts,
    companies,
    deals,
    fetchDashboard,
    searchContacts
  } = useCRMStore();

  const { metrics, fetchModuleMetrics } = useGlobalMetricsStore();

  useEffect(() => {
    fetchModuleMetrics('crm');
  }, []);

  // Use standardized ModuleMetricsCard

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-purple to-secondary-purple p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-primary-purple/20 to-accent-pink/20 blur-3xl"
              style={{
                width: `${200 + i * 80}px`,
                height: `${200 + i * 80}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20 + i * 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                CRM Intelligence Hub
              </h1>
              <p className="text-white/70 text-lg">
                AI-powered relationship management across all touchpoints
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPipeline(!showPipeline)}
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-medium shadow-lg hover:bg-white/20 transition-all flex items-center gap-2"
              >
                {showPipeline ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                {showPipeline ? 'Hide' : 'Show'} Pipeline
              </button>
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="px-6 py-3 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Brain className="w-5 h-5" />
                AI Assistant
              </button>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <MetricGrid
            metrics={[
              {
                title: "Total Contacts",
                value: metrics?.total_contacts || 0,
                change: metrics?.contacts_growth ? `${metrics.contacts_growth}%` : undefined,
                trend: metrics?.contacts_growth && metrics.contacts_growth > 0 ? 'up' : 'neutral',
                icon: Users,
                color: 'text-blue-400'
              },
              {
                title: "Qualified Leads",
                value: metrics?.qualified_leads || 0,
                change: metrics?.leads_growth ? `${metrics.leads_growth}%` : undefined,
                trend: metrics?.leads_growth && metrics.leads_growth > 0 ? 'up' : 'neutral',
                icon: Target,
                color: 'text-green-400'
              },
              {
                title: "Pipeline Value",
                value: `$${metrics?.pipeline_value?.toLocaleString() || '0'}`,
                change: metrics?.pipeline_growth ? `${metrics.pipeline_growth}%` : undefined,
                trend: metrics?.pipeline_growth && metrics.pipeline_growth > 0 ? 'up' : 'neutral',
                icon: DollarSign,
                color: 'text-purple-400'
              },
              {
                title: "Win Rate",
                value: `${metrics?.win_rate || 0}%`,
                change: metrics?.win_rate_change ? `${metrics.win_rate_change}%` : undefined,
                trend: metrics?.win_rate_change && metrics.win_rate_change > 0 ? 'up' : 'neutral',
                icon: TrendingUp,
                color: 'text-orange-400'
              }
            ]}
          />
        </motion.div>

        {/* Pipeline View Toggle */}
        <AnimatePresence>
          {showPipeline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <DealPipeline />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          {(['contacts', 'companies', 'deals', 'insights'] as const).map((view) => (
            <motion.button
              key={view}
              onClick={() => setActiveView(view)}
              className={`
                px-6 py-3 rounded-lg font-medium capitalize transition-all relative
                ${activeView === view
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {activeView === view && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-primary-purple/30 to-accent-pink/30 rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{view}</span>
            </motion.button>
          ))}
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {activeView === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ContactList
                contacts={contacts}
                onSelectContact={setSelectedContact}
                onSearch={searchContacts}
              />
            </motion.div>
          )}

          {activeView === 'companies' && (
            <motion.div
              key="companies"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Companies</h2>
                <p className="text-white/60">Company management interface coming soon...</p>
              </GlassCard>
            </motion.div>
          )}

          {activeView === 'deals' && (
            <motion.div
              key="deals"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Deals</h2>
                <p className="text-white/60">Deal management interface coming soon...</p>
              </GlassCard>
            </motion.div>
          )}

          {activeView === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <AIInsightsPanel isOpen={true} onClose={() => setActiveView('contacts')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact Detail Modal */}
        <AnimatePresence>
          {selectedContact && (
            <ContactDetail
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
            />
          )}
        </AnimatePresence>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-96 bg-black/80 backdrop-blur-xl border-l border-white/10 z-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Brain className="w-6 h-6 text-accent-pink" />
                    AI Assistant
                  </h3>
                  <button
                    onClick={() => setShowAIPanel(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-white/80 text-sm">
                      Ask me anything about your CRM data, leads, or sales performance.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 text-left">
                      Analyze lead quality trends
                    </button>
                    <button className="w-full p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 text-left">
                      Identify upsell opportunities
                    </button>
                    <button className="w-full p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 text-left">
                      Predict churn risk
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};