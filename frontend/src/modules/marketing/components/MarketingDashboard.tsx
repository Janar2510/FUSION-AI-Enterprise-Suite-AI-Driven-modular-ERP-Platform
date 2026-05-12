import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useCampaignStore, MarketingCampaign, CampaignActivity, CampaignTemplate } from '../stores/campaignStore';
import { Target, Mail, MessageSquare, Zap, Users, BarChart3, Plus, Send, Trash2 } from 'lucide-react';

const STATE_BADGES: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
  active: { label: 'Active', cls: 'bg-green-500/20 text-green-400' },
  completed: { label: 'Completed', cls: 'bg-blue-500/20 text-blue-400' },
  paused: { label: 'Paused', cls: 'bg-yellow-500/20 text-yellow-400' },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4 text-blue-400" />,
  sms: <MessageSquare className="w-4 h-4 text-green-400" />,
  server_action: <Zap className="w-4 h-4 text-yellow-400" />,
};

export const MarketingModule: React.FC = () => {
  const { items, fetch: fetchCampaigns, create, update, remove, launch, templates, fetchTemplates, createFromTemplate,
    fetchActivities, fetchParticipants, resolveParticipants, fetchTraces, fetchAnalytics, sendTest } = useCampaignStore();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [activeTab, setActiveTab] = useState<'details' | 'activities' | 'participants' | 'traces'>('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecord, setActiveRecord] = useState<MarketingCampaign | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activities, setActivities] = useState<CampaignActivity[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [traces, setTraces] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');
  const [formData, setFormData] = useState<any>({ name: '', type: 'email', state: 'draft', budget: 0, spent: 0, leads: 0, conversions: 0 });

  useEffect(() => { fetchCampaigns(); fetchTemplates(); }, []);

  useEffect(() => {
    if (activeRecord?.id) {
      loadActivities();
      loadParticipants();
      loadTraces();
      loadAnalytics();
    }
  }, [activeRecord?.id]);

  const loadActivities = async () => {
    if (!activeRecord?.id) return;
    const data = await fetchActivities(activeRecord.id);
    setActivities(data);
  };

  const loadParticipants = async () => {
    if (!activeRecord?.id) return;
    const data = await fetchParticipants(activeRecord.id);
    setParticipants(data);
  };

  const loadTraces = async () => {
    if (!activeRecord?.id) return;
    const result = await fetchTraces(activeRecord.id);
    setTraces(result.data);
  };

  const loadAnalytics = async () => {
    if (!activeRecord?.id) return;
    const data = await fetchAnalytics(activeRecord.id);
    setAnalytics(data);
  };

  const totalLeads = items.reduce((s, c) => s + c.leads, 0);
  const totalConversions = items.reduce((s, c) => s + c.conversions, 0);
  const totalSpent = items.reduce((s, c) => s + c.spent, 0);

  const filtered = items.filter(c => {
    const t = searchTerm.toLowerCase();
    return (c.name?.toLowerCase().includes(t) || c.type?.toLowerCase().includes(t));
  });

  const handleNew = () => { setShowTemplates(true); };
  const handleTemplateSelect = async (template: CampaignTemplate) => {
    setShowTemplates(false);
    const campaign = await createFromTemplate(template.id, template.name);
    setActiveRecord(campaign);
    setFormData({ ...campaign });
    setActivities(campaign.activities || []);
    setCurrentView('form');
    setActiveTab('activities');
  };
  const handleRowClick = (r: MarketingCampaign) => { setActiveRecord(r); setFormData({ ...r }); setCurrentView('form'); setActiveTab('details'); };
  const handleSave = async () => {
    const payload = { ...formData, budget: parseFloat(formData.budget) || 0, spent: parseFloat(formData.spent) || 0, leads: parseInt(formData.leads) || 0, conversions: parseInt(formData.conversions) || 0 };
    if (activeRecord) { const { createdAt, id, updatedAt, ...rest } = payload; await update(activeRecord.id, rest); setActiveRecord({ ...activeRecord, ...rest }); }
    else { await create(payload); }
    setCurrentView('list');
  };
  const handleDelete = async () => { if (activeRecord && window.confirm('Delete this campaign?')) { await remove(activeRecord.id); setCurrentView('list'); } };

  const renderStateBadge = (state: string) => { const s = STATE_BADGES[state] || STATE_BADGES.draft; return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>; };

  const renderTemplatePicker = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-dark-800 border border-white/10 rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6">Choose a Campaign Template</h2>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((t) => (
            <button key={t.id} onClick={() => handleTemplateSelect(t)}
              className="bg-white/5 border border-white/10 hover:border-primary-500 hover:bg-primary-500/10 rounded-xl p-4 text-left transition-all group">
              <h3 className="text-white font-medium mb-1 group-hover:text-primary-400">{t.name}</h3>
              <p className="text-white/50 text-sm">{t.description}</p>
              <p className="text-white/30 text-xs mt-2">{t.activities.length} activities</p>
            </button>
          ))}
        </div>
        <button onClick={() => setShowTemplates(false)} className="mt-4 w-full py-2 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-white/30 transition-colors">
          Start from scratch
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const cards = [
      { label: 'Total Leads', value: totalLeads, color: 'from-blue-500 to-cyan-500' },
      { label: 'Conversions', value: totalConversions, color: 'from-green-500 to-emerald-500' },
      { label: 'Conv. Rate', value: `${totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : 0}%`, color: 'from-orange-500 to-amber-500' },
      { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, color: 'from-amber-500 to-secondary-500' },
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

  const renderActivitiesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Activity Chain</h3>
        {activeRecord && (activeRecord.state === 'draft' || activeRecord.state === 'paused') && (
          <button
            onClick={async () => {
              const name = prompt('Campaign name:');
              if (!name) return;
              await globalThis.fetch(`/api/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type: 'email', state: 'draft' }) });
              // Simple inline add
            }}
            className="flex items-center gap-2 bg-primary-600/20 hover:bg-primary-600 text-primary-400 px-3 py-1.5 rounded-lg text-sm border border-primary-500/30">
            <Plus className="w-4 h-4" /> Add Activity
          </button>
        )}
      </div>
      {activities.length === 0 ? (
        <div className="text-center py-12 text-white/40">No activities yet. Launch the campaign to start the workflow.</div>
      ) : (
        <div className="space-y-2">
          {activities.map((a, i) => (
            <div key={a.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">{a.sequence}</div>
              {ACTIVITY_ICONS[a.type] || <Mail className="w-4 h-4" />}
              <div className="flex-1">
                <p className="text-white font-medium">{a.name}</p>
                <p className="text-white/40 text-sm">{a.type} · {a.delayValue} {a.delayUnit} delay</p>
              </div>
              <div className="text-right text-sm">
                <span className="text-green-400 font-mono">{a.successCount} ✓</span>
                <span className="text-red-400/60 font-mono ml-2">{a.rejectedCount} ✗</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderParticipantsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Participants ({participants.length})</h3>
        {activeRecord && activeRecord.state === 'draft' && (
          <button
            onClick={async () => {
              const result = await resolveParticipants(activeRecord.id, 'partner', { consentMarketing: true });
              loadParticipants();
            }}
            className="flex items-center gap-2 bg-primary-600/20 hover:bg-primary-600 text-primary-400 px-3 py-1.5 rounded-lg text-sm border border-primary-500/30">
            <Users className="w-4 h-4" /> Resolve from Contacts
          </button>
        )}
      </div>
      {participants.length === 0 ? (
        <div className="text-center py-12 text-white/40">No participants resolved yet.</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {participants.slice(0, 12).map((p) => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-white font-medium text-sm truncate">{p.name}</p>
              <p className="text-white/40 text-xs truncate">{p.email}</p>
              <span className={`mt-2 inline-block px-2 py-0.5 rounded text-xs ${p.state === 'completed' ? 'bg-blue-500/20 text-blue-400' : p.state === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{p.state}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTracesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Activity Traces ({traces.length})</h3>
        <div className="flex gap-2">
          <input type="email" placeholder="Test email address..." value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm w-48 outline-none" />
          <button onClick={async () => { if (!testEmail || !activeRecord) return; await sendTest(activeRecord.id, testEmail); alert('Test email sent!'); }} className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 px-3 py-1.5 rounded text-sm border border-blue-500/30">
            <Send className="w-4 h-4" /> Send Test
          </button>
        </div>
      </div>
      {analytics && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <p className="text-white/40 text-xs mb-1">Total</p>
            <p className="text-white text-xl font-bold">{analytics.participants.total}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <p className="text-white/40 text-xs mb-1">Queued</p>
            <p className="text-yellow-400 text-xl font-bold">{analytics.participants.queued}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <p className="text-white/40 text-xs mb-1">Active</p>
            <p className="text-green-400 text-xl font-bold">{analytics.participants.active}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <p className="text-white/40 text-xs mb-1">Completed</p>
            <p className="text-blue-400 text-xl font-bold">{analytics.participants.completed}</p>
          </div>
        </div>
      )}
      {traces.length === 0 ? (
        <div className="text-center py-12 text-white/40">No traces yet. Launch the campaign to see activity.</div>
      ) : (
        <div className="space-y-2">
          {traces.slice(0, 20).map((t) => (
            <div key={t.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3 text-sm">
              {ACTIVITY_ICONS[t.activity?.type] || <Mail className="w-4 h-4" />}
              <div className="flex-1">
                <span className="text-white">{t.activity?.name || 'Activity'}</span>
                <span className="text-white/40 ml-2">{t.participant?.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${
                t.status === 'delivered' || t.status === 'dispatched' ? 'bg-green-500/20 text-green-400' :
                t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <OdooFormBase
      statusRibbon={
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2">
            {activeRecord && formData.state === 'draft' && (
              <button onClick={async () => { await launch(activeRecord.id); setFormData((p: any) => ({ ...p, state: 'active' })); }}
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
        <div>
          <input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
            placeholder="Campaign name..." value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          {activeRecord && (
            <div className="flex gap-1 mt-3">
              {(['details', 'activities', 'participants', 'traces'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-colors capitalize ${activeTab === tab ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-white/50 hover:text-white/70'}`}>
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
      }
      leftPanels={
        activeTab === 'details' ? (
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
        ) : activeTab === 'activities' ? renderActivitiesTab() :
           activeTab === 'participants' ? renderParticipantsTab() :
           renderTracesTab()
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
    <>
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
      {showTemplates && renderTemplatePicker()}
    </>
  );
};

export default MarketingModule;
