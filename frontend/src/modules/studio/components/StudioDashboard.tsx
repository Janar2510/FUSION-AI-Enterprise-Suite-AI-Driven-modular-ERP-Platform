import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brush, Code, Database, Layout, Plus, Settings } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';

const mockCustomizations = [
  { id: 1, name: 'Custom Sales Pipeline View', type: 'view', module: 'CRM', modified: '2025-02-22', status: 'active' },
  { id: 2, name: 'Product Category Field', type: 'field', module: 'Inventory', modified: '2025-02-20', status: 'active' },
  { id: 3, name: 'Approval Workflow', type: 'automation', module: 'Purchase', modified: '2025-02-18', status: 'active' },
  { id: 4, name: 'Custom Invoice Template', type: 'report', module: 'Accounting', modified: '2025-02-15', status: 'draft' },
  { id: 5, name: 'Employee Dashboard Widget', type: 'view', module: 'HR', modified: '2025-02-12', status: 'active' },
];

const StudioDashboard: React.FC = () => {
  const [items] = useState(mockCustomizations);
  const typeIcons: Record<string, JSX.Element> = { view: <Layout className="w-4 h-4" />, field: <Database className="w-4 h-4" />, automation: <Settings className="w-4 h-4" />, report: <Code className="w-4 h-4" /> };
  const typeColors: Record<string, string> = { view: 'bg-blue-500/20 text-blue-400', field: 'bg-green-500/20 text-green-400', automation: 'bg-amber-500/20 text-amber-400', report: 'bg-orange-500/20 text-orange-400' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-500 to-secondary-purple p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 blur-3xl"
            style={{ width: `${280 + i * 90}px`, height: `${280 + i * 90}px`, left: `${12 + i * 26}%`, top: `${6 + i * 22}%` }}
            animate={{ x: [0, 50, 0], y: [0, -35, 0] }} transition={{ duration: 22 + i * 3, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3"><Brush className="w-10 h-10 text-amber-400" />Studio</h1>
              <p className="text-white/70 text-lg">No-code customization and app builder</p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"><Plus className="w-5 h-5" />New Customization</button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <MetricGrid metrics={[
            { title: 'Customizations', value: items.length, icon: Brush, color: 'text-amber-400' },
            { title: 'Views', value: items.filter(i => i.type === 'view').length, icon: Layout, color: 'text-blue-400' },
            { title: 'Automations', value: items.filter(i => i.type === 'automation').length, icon: Settings, color: 'text-green-400' },
            { title: 'Active', value: items.filter(i => i.status === 'active').length, icon: Code, color: 'text-amber-400' },
          ]} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-6 hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${typeColors[item.type]}`}>{typeIcons[item.type]}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{item.status}</span>
                </div>
                <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                <div className="flex items-center justify-between text-sm text-white/40">
                  <span>{item.module}</span>
                  <span>{item.modified}</span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudioDashboard;
