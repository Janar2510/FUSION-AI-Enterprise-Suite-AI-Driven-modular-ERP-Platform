import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useSubscriptionStore, Subscription } from '../stores/subscriptionStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { CreditCard, DollarSign } from 'lucide-react';

const PLAN_BADGES: Record<string, string> = { enterprise: 'bg-violet-500/20 text-violet-400', pro: 'bg-blue-500/20 text-blue-400', starter: 'bg-gray-500/20 text-gray-400' };
const STATE_BADGES: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
  in_progress: { label: 'Active', cls: 'bg-green-500/20 text-green-400' },
  churned: { label: 'Churned', cls: 'bg-red-500/20 text-red-400' },
  closed: { label: 'Closed', cls: 'bg-yellow-500/20 text-yellow-400' },
};

export const SubscriptionsModule: React.FC = () => {
  const { items, fetch, create, update, remove } = useSubscriptionStore();
  const partners = usePartnerStore(s => s.partners);
  const fetchPartners = usePartnerStore(s => s.fetchPartners);
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecord, setActiveRecord] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState<any>({ state: 'draft', plan: 'starter', mrr: 0, recurringRule: 'monthly' });

  useEffect(() => { fetch(); fetchPartners(); }, []);

  const activeSubs = items.filter(s => s.state === 'in_progress');
  const totalMRR = activeSubs.reduce((sum, s) => sum + s.mrr, 0);

  const filtered = items.filter(s => {
    const t = searchTerm.toLowerCase();
    return (s.name?.toLowerCase().includes(t) || s.partner?.name?.toLowerCase().includes(t) || s.plan?.toLowerCase().includes(t));
  });

  const handleNew = () => { setActiveRecord(null); setFormData({ name: '', state: 'draft', plan: 'starter', mrr: 0, recurringRule: 'monthly', partnerId: null }); setCurrentView('form'); };
  const handleRowClick = (r: Subscription) => { setActiveRecord(r); setFormData({ ...r }); setCurrentView('form'); };
  const handleSave = async () => {
    const payload = { ...formData, mrr: parseFloat(formData.mrr) || 0, partnerId: formData.partnerId ? +formData.partnerId : null };
    if (activeRecord) { const { partner, createdAt, id, updatedAt, ...rest } = payload; await update(activeRecord.id, rest); }
    else await create(payload);
    setCurrentView('list');
  };
  const handleDelete = async () => { if (activeRecord && window.confirm('Delete this subscription?')) { await remove(activeRecord.id); setCurrentView('list'); } };

  const renderStateBadge = (state: string) => { const s = STATE_BADGES[state] || STATE_BADGES.draft; return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>; };

  const renderDashboard = () => {
    const cards = [
      { label: 'Total MRR', value: `$${totalMRR.toLocaleString()}`, color: 'from-green-500 to-emerald-500' },
      { label: 'Active', value: activeSubs.length, color: 'from-violet-500 to-purple-500' },
      { label: 'ARR', value: `$${(totalMRR * 12).toLocaleString()}`, color: 'from-blue-500 to-cyan-500' },
      { label: 'Churned', value: items.filter(s => s.state === 'churned').length, color: 'from-red-500 to-pink-500' },
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
      <OdooListBase<Subscription>
        data={filtered}
        onRowClick={handleRowClick}
        keyExtractor={(s) => s.id.toString()}
        columns={[
          { key: 'name', label: 'Name', render: (s) => <span className="font-bold">{s.name || '—'}</span> },
          { key: 'partner', label: 'Customer', render: (s) => s.partner?.name || '—' },
          { key: 'plan', label: 'Plan', render: (s) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGES[s.plan] || PLAN_BADGES.starter}`}>{s.plan}</span> },
          { key: 'mrr', label: 'MRR', render: (s) => <span className="font-mono">${s.mrr.toLocaleString()}</span> },
          { key: 'recurringRule', label: 'Billing', render: (s) => s.recurringRule },
          { key: 'state', label: 'Status', render: (s) => renderStateBadge(s.state) },
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
              <button onClick={async () => { await update(activeRecord.id, { state: 'in_progress' }); setFormData((p: any) => ({ ...p, state: 'in_progress' })); }}
                className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-green-500/30">
                Activate
              </button>
            )}
            {activeRecord && formData.state === 'in_progress' && (
              <button onClick={async () => { await update(activeRecord.id, { state: 'churned' }); setFormData((p: any) => ({ ...p, state: 'churned' })); }}
                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">
                Churn
              </button>
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
          placeholder="Subscription name..." value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      }
      leftPanels={
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">Customer</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.partnerId || ''} onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}>
              <option value="">Select customer...</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">Plan</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.plan || 'starter'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">MRR ($)</label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.mrr || 0}
              onChange={(e) => setFormData({ ...formData, mrr: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">Billing Cycle</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.recurringRule || 'monthly'} onChange={(e) => setFormData({ ...formData, recurringRule: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      }
      rightPanels={
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-violet-400" />Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Plan</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGES[formData.plan] || ''}`}>{formData.plan}</span></div>
            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">MRR</span><span className="text-white font-medium font-mono">${parseFloat(formData.mrr || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-white/60">ARR</span><span className="text-white font-medium font-mono">${(parseFloat(formData.mrr || 0) * 12).toLocaleString()}</span></div>
          </div>
        </div>
      }
    />
  );

  return (
    <OdooViewManager
      title="Subscriptions"
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

export default SubscriptionsModule;
