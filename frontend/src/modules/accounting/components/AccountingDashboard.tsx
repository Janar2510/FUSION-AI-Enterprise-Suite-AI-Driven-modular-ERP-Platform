import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Calendar, 
  BarChart3,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';
import { useAccountingStore } from '../stores/accountingStore';

const AccountingDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'entries' | 'accounts' | 'reports'>('entries');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    journalEntries,
    chartOfAccounts,
    fetchJournalEntries,
    fetchChartOfAccounts
  } = useAccountingStore();

  useEffect(() => {
    fetchJournalEntries(0, 10);
    fetchChartOfAccounts(0, 10);
  }, []);

  // Mock metrics for now
  const metrics = {
    total_entries: journalEntries.length,
    total_accounts: chartOfAccounts.length,
    pending_entries: 5,
    this_month_revenue: 125000
  };

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
                Accounting
              </h1>
              <p className="text-white/70 text-lg">
                Financial management and bookkeeping
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Entry
              </button>
            </div>
          </div>
        </motion.div>

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
                  placeholder="Search journal entries, accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
                />
              </div>
              <button className="px-6 py-3 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter
              </button>
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
                title: "Total Entries",
                value: metrics.total_entries,
                icon: FileText,
                color: 'text-blue-400'
              },
              {
                title: "Chart of Accounts",
                value: metrics.total_accounts,
                icon: BarChart3,
                color: 'text-green-400'
              },
              {
                title: "Pending Entries",
                value: metrics.pending_entries,
                icon: Calendar,
                color: 'text-purple-400'
              },
              {
                title: "Revenue (MTD)",
                value: `$${metrics.this_month_revenue.toLocaleString()}`,
                icon: TrendingUp,
                color: 'text-orange-400'
              }
            ]}
          />
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          {(['entries', 'accounts', 'reports'] as const).map((view) => (
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
          {activeView === 'entries' && (
            <motion.div
              key="entries"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Journal Entries</h3>
                  <div className="space-y-4">
                    {journalEntries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="font-medium text-white">{entry.entry_number}</p>
                          <p className="text-white/60 text-sm">{entry.reference || 'No reference'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/80">{new Date(entry.date).toLocaleDateString()}</p>
                          <p className="text-xs text-white/60 capitalize">{entry.state}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
                
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-white text-sm">New Journal Entry</p>
                    </button>
                    <button className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-white text-sm">Balance Sheet</p>
                    </button>
                    <button className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-white text-sm">Income Statement</p>
                    </button>
                    <button className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <Calendar className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <p className="text-white text-sm">Close Period</p>
                    </button>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeView === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Chart of Accounts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 text-white/80">Code</th>
                        <th className="text-left py-3 text-white/80">Name</th>
                        <th className="text-left py-3 text-white/80">Type</th>
                        <th className="text-right py-3 text-white/80">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartOfAccounts.slice(0, 8).map((account) => (
                        <tr key={account.id} className="border-b border-white/10 hover:bg-white/5">
                          <td className="py-3 text-white">{account.code}</td>
                          <td className="py-3 text-white">{account.name}</td>
                          <td className="py-3 text-white/80 capitalize">{account.type}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-1 rounded text-xs ${
                              account.active 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {account.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeView === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Financial Reports</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Balance Sheet</span>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-white">Income Statement</span>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-purple-400" />
                        <span className="text-white">Cash Flow Statement</span>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-orange-400" />
                        <span className="text-white">Trial Balance</span>
                      </div>
                    </button>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">AI Insights</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                      <p className="text-white font-medium">Cash Flow Forecast</p>
                      <p className="text-white/80 text-sm mt-1">Expected positive cash flow next quarter</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg">
                      <p className="text-white font-medium">Tax Optimization</p>
                      <p className="text-white/80 text-sm mt-1">Potential savings of $12,500 identified</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg">
                      <p className="text-white font-medium">Fraud Alert</p>
                      <p className="text-white/80 text-sm mt-1">2 suspicious transactions detected</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccountingDashboard;