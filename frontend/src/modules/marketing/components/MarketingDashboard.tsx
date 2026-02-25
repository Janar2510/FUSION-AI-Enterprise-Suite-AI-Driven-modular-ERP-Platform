import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useCampaignStore, MarketingCampaign } from '../stores/campaignStore';
import { Target } from 'lucide-react';

const STATE_BADGES: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
  active: { label: 'Active', cls: 'bg-green-500/20 text-green-400' },
  completed: { label: 'Completed', cls: 'bg-blue-500/20 text-blue-400' },
  paused: { label: 'Paused', cls: 'bg-yellow-500/20 text-yellow-400' },
};

export const MarketingModule: React.FC = () => {
  const { items, fetch, create, update, remove } = useCampaignStore();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecord, setActiveRecord] = useState<MarketingCampaign | null>(null);
  const [formData, setFormData] = useState<any>({ name: '', type: 'email', state: 'draft', budget: 0, spent: 0, leads: 0, conversions: 0 });

  useEffect(() => { fetch(); }, []);

  const totalLeads = items.reduce((s, c) => s + c.leads, 0);
  const totalConversions = items.reduce((s, c) => s + c.conversions, 0);
  const totalSpent = items.reduce((s, c) => s + c.spent, 0);

  const filtered = items.filter(c => {
    const t = searchTerm.toLowerCase();
    return (c.name?.toLowerCase().includes(t) || c.type?.toLowerCase().includes(t));
  });

  const handleNew = () => { setActiveRecord(null); setFormData({ name: '', type: 'email', state: 'draft', budget: 0, spent: 0, leads: 0, conversions: 0, description: '' }); setCurrentView('form'); };
  const handleRowClick = (r: MarketingCampaign) => { setActiveRecord(r); setFormData({ ...r }); setCurrentView('form'); };
  const handleSave = async () => {
    const payload = { ...formData, budget: parseFloat(formData.budget) || 0, spent: parseFloat(formData.spent) || 0, leads: parseInt(formData.leads) || 0, conversions: parseInt(formData.conversions) || 0 };
    if (activeRecord) { const { createdAt, id, updatedAt, ...rest } = payload; await update(activeRecord.id, rest); }
    else await create(payload);
    setCurrentView('list');
  };
  const handleDelete = async () => { if (activeRecord && window.confirm('Delete this campaign?')) { await remove(activeRecord.id); setCurrentView('list'); } };

  const renderStateBadge = (state: string) => { const s = STATE_BADGES[state] || STATE_BADGES.draft; return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>; };

  const renderDashboard = () => {
    const cards = [
      { label: 'Total Leads', value: totalLeads, color: 'from-blue-500 to-cyan-500' },
      { label: 'Conversions', value: totalConversions, color: 'from-green-500 to-emerald-500' },
      { label: 'Conv. Rate', value: `${totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : 0}%`, color: 'from-orange-500 to-amber-500' },
      { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, color: 'from-purple-500 to-pink-500' },
    ];
    return (<div className="grid grid-cols-4 gap-4 mb-6">{cards.map(c => (
      <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
        <p className="text-white/50 text-sm mb-1">{c.label}</p>
        <p className={`text-3xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</p>
      </div>
    ))}</div>);
  };

  const renderList = () => (
    <>
      {renderDashboard()}
      <OdooListBase<MarketingCampaign>
        data={filtered}
        onRowClick={handleRowClick}
        keyExtractor={(c) => c.id.toString()}
        columns={[
          { key: 'name', label: 'Campaign', render: (c) => <span className="font-bold">{c.name}</span> },
          { key: 'type', label: 'Type', render: (c) => <span className="px-2 py-0.5 bg-white/10 text-white/70 rounded text-xs">{c.type}</span> },
          { key: 'state', label: 'Status', render: (c) => renderStateBadge(c.state) },
          { key: 'leads', label: 'Leads', render: (c) => <span className="font-mono">{c.leads}</span> },
          { key: 'conversions', label: 'Conv.', render: (c) => <span className="font-mono text-green-400">{c.conversions}</span> },
          { key: 'budget', label: 'Budget', render: (c) => <span className="font-mono">${c.budget.toLocaleString()}</span> },
          {
            key: 'spent', label: 'Spent', render: (c) => {
              const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
              return (<div className="flex items-center gap-2"><div className="w-16 bg-white/10 rounded-full h-1.5"><div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div><span className="text-white/40 text-xs">{pct}%</span></div>);
            }
          },
        ]}
      />
    </>
  );

  const renderForm = () => (
    <OdooFormBase
      statusRibbon={
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2">
            {activeRecord && formData.state === 'draft' && (
              <button onClick={async () => { await update(activeRecord.id, { state: 'active' }); setFormData((p: any) => ({ ...p, state: 'active' })); }}
                className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-green-500/30">Launch</button>
            )}
            {activeRecord && formData.state === 'active' && (
              <>
                <button onClick={async () => { await update(activeRecord.id, { state: 'paused' }); setFormData((p: any) => ({ ...p, state: 'paused' })); }}
                  className="bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-yellow-500/30">Pause</button>
                <button onClick={async () => { await update(activeRecord.id, { state: 'completed' }); setFormData((p: any) => ({ ...p, state: 'completed' })); }}
                  className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-blue-500/30">Complete</button>
              </>
            )}
            {renderStateBadge(formData.state || 'draft')}
          </div>
          {activeRecord && (
            <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">Delete</button>
          )}
        </div>
      }
      headerContent={
        <input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
          placeholder="Campaign name..." value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      }
      leftPanels={
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-medium">Type</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.type || 'email'} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="email">Email</option>
                <option value="social">Social</option>
                <option value="multi_channel">Multi-channel</option>
                <option value="content">Content</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-medium">Budget ($)</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.budget || 0} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-medium">Spent ($)</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.spent || 0} onChange={(e) => setFormData({ ...formData, spent: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-medium">Leads</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.leads || 0} onChange={(e) => setFormData({ ...formData, leads: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-medium">Conversions</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.conversions || 0} onChange={(e) => setFormData({ ...formData, conversions: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-medium">Start Date</label>
              <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.startDate ? formData.startDate.slice(0, 10) : ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-white/10">
            <label className="text-white/60 text-sm font-medium">Description</label>
            <textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none resize-none" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
        </div>
      }
      rightPanels={
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-orange-400" />Performance</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Leads</span><span className="text-white font-medium font-mono">{formData.leads || 0}</span></div>
            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Conversions</span><span className="text-green-400 font-medium font-mono">{formData.conversions || 0}</span></div>
            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Conv. Rate</span><span className="text-white font-medium">{(formData.leads || 0) > 0 ? ((formData.conversions / formData.leads) * 100).toFixed(1) : 0}%</span></div>
            <div className="flex justify-between"><span className="text-white/60">ROI</span><span className="text-white font-medium">{(formData.spent || 0) > 0 ? `$${((formData.conversions * 500 - formData.spent) / formData.spent * 100).toFixed(0)}%` : '—'}</span></div>
          </div>
        </div>
      }
    />
  );

  return (
    <OdooViewManager
      title="Marketing"
      currentView={currentView}
      onViewChange={setCurrentView}
      onNew={handleNew}
      onSave={handleSave}
      onDiscard={() => setCurrentView('list')}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewsAvailable={['list', 'form']}
    >
      {currentView === 'list' && renderList()}
      {currentView === 'form' && renderForm()}
    </OdooViewManager>
  );
};

export default MarketingModule;
