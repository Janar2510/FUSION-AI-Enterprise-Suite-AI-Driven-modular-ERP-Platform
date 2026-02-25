import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { usePlanningStore, PlanningSlot } from '../stores/planningStore';
import { CalendarRange } from 'lucide-react';

const STATE_BADGES: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
  published: { label: 'Published', cls: 'bg-green-500/20 text-green-400' },
};

export const PlanningModule: React.FC = () => {
  const { items, fetch, create, update, remove } = usePlanningStore();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecord, setActiveRecord] = useState<PlanningSlot | null>(null);
  const [formData, setFormData] = useState<any>({ role: '', hours: 0, state: 'draft', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 5 * 86400000).toISOString() });

  useEffect(() => { fetch(); }, []);

  const totalHours = items.reduce((s, sl) => s + sl.hours, 0);
  const uniqueProjects = new Set(items.filter(s => s.project).map(s => s.project!.name)).size;

  const filtered = items.filter(s => {
    const t = searchTerm.toLowerCase();
    return (s.role?.toLowerCase().includes(t) || s.employee?.name?.toLowerCase().includes(t) || s.project?.name?.toLowerCase().includes(t));
  });

  const handleNew = () => { setActiveRecord(null); setFormData({ role: '', hours: 0, state: 'draft', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 5 * 86400000).toISOString(), note: '' }); setCurrentView('form'); };
  const handleRowClick = (r: PlanningSlot) => { setActiveRecord(r); setFormData({ ...r }); setCurrentView('form'); };
  const handleSave = async () => {
    const payload = { ...formData, hours: parseFloat(formData.hours) || 0, employeeId: formData.employeeId ? +formData.employeeId : null, projectId: formData.projectId ? +formData.projectId : null };
    if (activeRecord) { const { employee, project, createdAt, id, updatedAt, ...rest } = payload; await update(activeRecord.id, rest); }
    else await create(payload);
    setCurrentView('list');
  };
  const handleDelete = async () => { if (activeRecord && window.confirm('Delete this slot?')) { await remove(activeRecord.id); setCurrentView('list'); } };

  const renderStateBadge = (state: string) => { const s = STATE_BADGES[state] || STATE_BADGES.draft; return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>; };

  const renderDashboard = () => {
    const cards = [
      { label: 'Resources', value: items.length, color: 'from-indigo-500 to-violet-500' },
      { label: 'Total Hours', value: totalHours, color: 'from-blue-500 to-cyan-500' },
      { label: 'Projects', value: uniqueProjects, color: 'from-green-500 to-emerald-500' },
      { label: 'Published', value: items.filter(s => s.state === 'published').length, color: 'from-amber-500 to-yellow-500' },
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
      <OdooListBase<PlanningSlot>
        data={filtered}
        onRowClick={handleRowClick}
        keyExtractor={(s) => s.id.toString()}
        columns={[
          { key: 'employee', label: 'Resource', render: (s) => <span className="font-bold">{s.employee?.name || 'Unassigned'}</span> },
          { key: 'role', label: 'Role' },
          { key: 'project', label: 'Project', render: (s) => s.project?.name || '—' },
          { key: 'hours', label: 'Hours', render: (s) => <span className="font-mono">{s.hours}h</span> },
          { key: 'startDate', label: 'Start', render: (s) => new Date(s.startDate).toLocaleDateString() },
          { key: 'endDate', label: 'End', render: (s) => new Date(s.endDate).toLocaleDateString() },
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
              <button onClick={async () => { await update(activeRecord.id, { state: 'published' }); setFormData((p: any) => ({ ...p, state: 'published' })); }}
                className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-green-500/30">
                Publish
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
        <div className="flex items-center gap-3">
          <CalendarRange className="w-8 h-8 text-indigo-400" />
          <span className="text-3xl font-bold text-white">{activeRecord ? `Slot #${activeRecord.id}` : 'New Planning Slot'}</span>
        </div>
      }
      leftPanels={
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">Role</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">Hours</label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.hours || 0} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">Start Date</label>
            <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.startDate ? formData.startDate.slice(0, 10) : ''} onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value).toISOString() })} />
          </div>
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">End Date</label>
            <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.endDate ? formData.endDate.slice(0, 10) : ''} onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value).toISOString() })} />
          </div>
          <div className="col-span-2 space-y-2 pt-4 border-t border-white/10">
            <label className="text-white/60 text-sm font-medium">Notes</label>
            <textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none resize-none" value={formData.note || ''} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
          </div>
        </div>
      }
      rightPanels={
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><CalendarRange className="w-5 h-5 text-indigo-400" />Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Resource</span><span className="text-white font-medium">{formData.employee?.name || 'Unassigned'}</span></div>
            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Project</span><span className="text-white font-medium">{formData.project?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Hours</span><span className="text-white font-medium font-mono">{formData.hours || 0}h</span></div>
          </div>
        </div>
      }
    />
  );

  return (
    <OdooViewManager
      title="Planning"
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

export default PlanningModule;
