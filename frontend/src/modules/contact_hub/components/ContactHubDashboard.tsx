import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building, TrendingUp, Activity, Search,
  Plus, Brain, UserPlus
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';
import { ContactList } from './ContactList';
import { CompanyList } from './CompanyList';
import { TimelineView } from './TimelineView';
import { usePartnerStore } from '@/stores/partnerStore';

export const ContactHubDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'contacts' | 'companies' | 'timeline'>('contacts');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  const {
    partners,
    contacts,
    companies,
    loading,
    error,
    pagination,
    fetchPartners,
    fetchContacts,
    fetchCompanies,
    searchPartners,
    createPartner,
  } = usePartnerStore();

  useEffect(() => {
    fetchPartners();
    fetchContacts();
    fetchCompanies();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchPartners(query);
    } else {
      fetchPartners();
    }
  };

  const handleCreateContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createPartner({
        name: formData.get('name') as string,
        email: formData.get('email') as string || undefined,
        phone: formData.get('phone') as string || undefined,
        jobPosition: formData.get('jobPosition') as string || undefined,
        isCompany: formData.get('isCompany') === 'true',
      });
      setShowForm(false);
      fetchPartners();
      fetchContacts();
      fetchCompanies();
    } catch {
      // Error is set in the store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-500 to-secondary-purple p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-primary-500/20 to-accent-pink/20 blur-3xl"
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
                Contact Hub
              </h1>
              <p className="text-white/70 text-lg">
                Unified contact management across all modules
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                New Contact
              </button>
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-pink text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Brain className="w-5 h-5" />
                AI Assistant
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
            <div className="px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg">
              {error}
            </div>
          </motion.div>
        )}

        {/* New Contact Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Create New Contact</h3>
                <form onSubmit={handleCreateContact} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input name="name" required placeholder="Full Name *"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                  <input name="email" type="email" placeholder="Email"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                  <input name="phone" placeholder="Phone"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                  <input name="jobPosition" placeholder="Job Position"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                  <select name="isCompany"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                    <option value="false">Individual</option>
                    <option value="true">Company</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50">
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)}
                      className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20">
                      Cancel
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search contacts, companies, emails..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <MetricGrid
            metrics={[
              {
                title: "Total Contacts",
                value: contacts.length,
                icon: Users,
                color: 'text-blue-400'
              },
              {
                title: "Total Companies",
                value: companies.length,
                icon: Building,
                color: 'text-green-400'
              },
              {
                title: "Customers",
                value: partners.filter(p => p.isCustomer).length,
                icon: Activity,
                color: 'text-amber-400'
              },
              {
                title: "Vendors",
                value: partners.filter(p => p.isVendor).length,
                icon: TrendingUp,
                color: 'text-orange-400'
              }
            ]}
          />
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          {(['contacts', 'companies', 'timeline'] as const).map((view) => (
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
                  className="absolute inset-0 bg-gradient-to-r from-primary-500/30 to-accent-pink/30 rounded-lg"
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
            <motion.div key="contacts" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <ContactList partners={contacts} loading={loading} />
            </motion.div>
          )}

          {activeView === 'companies' && (
            <motion.div key="companies" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <CompanyList partners={companies} loading={loading} />
            </motion.div>
          )}

          {activeView === 'timeline' && (
            <motion.div key="timeline" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <TimelineView />
            </motion.div>
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
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-white/80 text-sm">
                      Ask me anything about your contacts, companies, or relationships.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 text-left">
                      Analyze contact engagement patterns
                    </button>
                    <button className="w-full p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 text-left">
                      Identify relationship opportunities
                    </button>
                    <button className="w-full p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 text-left">
                      Find duplicate contacts
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
export default ContactHubDashboard;
