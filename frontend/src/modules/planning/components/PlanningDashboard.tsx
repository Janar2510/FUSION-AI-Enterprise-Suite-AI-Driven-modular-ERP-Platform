import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { usePlanningStore, PlanningSlot } from '../stores/planningStore';
import { PlanningTimeline } from './PlanningTimeline';
import { CalendarRange, Sparkles, AlertTriangle, CheckCircle2, UserPlus, Search, Info, TrendingUp, Users, Target } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const STATE_BADGES: Record<string, { label: string; cls: string }> = {
  draft: { label: 'DRAFT_SPEC', cls: 'bg-white/5 text-white/30 border-white/10 shadow-none' },
  published: { label: 'LIVE_ALLOCATION', cls: 'bg-primary-purple/10 text-primary-purple border-primary-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' },
};

export const PlanningModule: React.FC = () => {
  const { items, recommendations, conflict, fetch, fetchRecommendations, create, update, remove } = usePlanningStore();
  const [currentView, setCurrentView] = useState<ViewType>('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecord, setActiveRecord] = useState<PlanningSlot | null>(null);
  const [formData, setFormData] = useState<any>({
    role: '',
    hours: 8,
    state: 'draft',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 5 * 86400000).toISOString()
  });

  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);

  useEffect(() => {
    fetch();
    const API = (import.meta as any).env.VITE_API_URL || '';
    axios.get(`${API}/api/skills`).then(res => setAvailableSkills(res.data.data));
  }, []);

  const handleNew = () => {
    setActiveRecord(null);
    setFormData({
      role: '',
      hours: 8,
      state: 'draft',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      note: ''
    });
    setCurrentView('form');
  };

  const handleRowClick = (r: PlanningSlot) => {
    setActiveRecord(r);
    setFormData({ ...r });
    setCurrentView('form');
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      hours: parseFloat(formData.hours) || 0,
      employeeId: formData.employeeId ? +formData.employeeId : null,
      projectId: formData.projectId ? +formData.projectId : null
    };

    let success = false;
    if (activeRecord) {
      const { employee, project, createdAt, id, updatedAt, ...rest } = payload;
      success = await update(activeRecord.id, rest);
    } else {
      success = await create(payload);
    }

    if (success) setCurrentView('timeline');
  };

  const handleDelete = async () => {
    if (activeRecord && window.confirm('Delete this slot?')) {
      await remove(activeRecord.id);
      setCurrentView('timeline');
    }
  };

  const renderStateBadge = (state: string) => {
    const s = STATE_BADGES[state] || STATE_BADGES.draft;
    return <span className={`px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-[2px] border transition-all ${s.cls}`}>{s.label}</span>;
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 pt-4">
      {[
        { label: 'ACTIVE_SLOTS', value: items.length, icon: CalendarRange, color: 'text-white' },
        { label: 'TOTAL_CAPACITY', value: `${items.reduce((s, sl) => s + sl.hours, 0)}H`, icon: TrendingUp, color: 'text-primary-purple' },
        { label: 'RESOURCES_ALLOCATED', value: new Set(items.map(s => s.employeeId)).size, icon: Users, color: 'text-white' },
        { label: 'PUBLISH_RATE', value: `${Math.round((items.filter(s => s.state === 'published').length / (items.length || 1)) * 100)}%`, icon: Target, color: 'text-green-400' },
      ].map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white/5 border border-white/10 p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <c.icon className="w-12 h-12 text-white" />
          </div>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[4px] mb-3">{c.label}</p>
          <p className={`text-4xl font-black tracking-tighter ${c.color}`}>{c.value}</p>
        </motion.div>
      ))}
    </div>
  );

  const renderForm = () => (
    <OdooFormBase
      statusRibbon={
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex gap-6 items-center">
            {activeRecord && formData.state === 'draft' && (
              <button
                onClick={async () => {
                  await update(activeRecord.id, { state: 'published' });
                  setFormData((p: any) => ({ ...p, state: 'published' }));
                }}
                className="bg-primary-purple hover:bg-primary-purple/80 text-white px-8 py-2 rounded-none text-[10px] font-black uppercase tracking-[3px] shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all"
              >
                Execute Allocation
              </button>
            )}
            {renderStateBadge(formData.state || 'draft')}
          </div>
          {activeRecord && (
            <button onClick={handleDelete} className="text-red-500/40 hover:text-red-400 text-[10px] font-black uppercase tracking-[3px] underline underline-offset-8 transition-all hover:bg-red-500/5 px-4 py-2">TERMINATE_SEQUENCE</button>
          )}
        </div>
      }
      headerContent={
        <div className="flex flex-col gap-3 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-primary-purple shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[6px]">Planning_Protocol.obs</span>
          </div>
          <h2 className="text-6xl font-black text-white tracking-tighter">{activeRecord ? `SLOT_ID_${activeRecord.id}` : 'NEW_ALLOCATION_PRTC'}</h2>
        </div>
      }
      leftPanels={
        <div className="space-y-12">
          {conflict && conflict.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 flex flex-col gap-6 backdrop-blur-2xl ring-1 ring-red-500/20"
            >
              <div className="flex items-center gap-4 text-red-400">
                <AlertTriangle className="w-8 h-8" />
                <span className="text-xs font-black uppercase tracking-[4px]">Critical Scheduling Conflict Detected</span>
              </div>
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-wider">The assigned resource is already locked for the following sequences:</p>
              <div className="space-y-3">
                {conflict.map((c: any) => (
                  <div key={c.id} className="bg-black/40 p-4 border border-white/5 rounded-xl text-xs flex justify-between items-center group hover:border-red-400/40 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-white uppercase tracking-wider">{c.project?.name || 'UNIDENTIFIED_PROJECT'}</span>
                      <span className="text-white/30 font-mono text-[10px] uppercase">Timeline: {format(new Date(c.startDate), 'MMM d')} - {format(new Date(c.endDate), 'MMM d')}</span>
                    </div>
                    <span className="text-[10px] font-black text-red-500/60 uppercase tracking-widest bg-red-500/5 px-3 py-1 rounded-full">LOCKED</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/10 flex gap-4">
                <Info className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-[10px] text-red-300 font-medium leading-relaxed uppercase tracking-widest">
                  Overlapping allocations may result in resource burnout. Adjust timeline or switch resources.
                </p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-10">
            {[
              { label: 'Job_Classification', key: 'role', type: 'text', icon: UserPlus, placeholder: 'E.g. SR_NEURAL_ENG' },
              { label: 'Capacity_Hours', key: 'hours', type: 'number', icon: TrendingUp },
              { label: 'Timestamp_Start', key: 'startDate', type: 'date' },
              { label: 'Timestamp_End', key: 'endDate', type: 'date' },
            ].map((f) => (
              <div key={f.key} className="space-y-4">
                <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">{f.label}</label>
                <div className="relative group">
                  <input
                    type={f.type}
                    className="w-full bg-black/40 border border-white/10 px-5 py-4 text-white font-black text-sm outline-none focus:border-primary-purple/50 transition-all tracking-[2px] rounded-none placeholder-white/10"
                    value={f.type === 'date' ? (formData[f.key]?.slice(0, 10)) : (formData[f.key] || '')}
                    placeholder={f.placeholder}
                    onChange={(e) => setFormData({ ...formData, [f.key]: f.type === 'date' ? new Date(e.target.value).toISOString() : e.target.value })}
                  />
                  <div className="absolute inset-0 border border-primary-purple/0 group-focus-within:border-primary-purple/30 transition-all pointer-events-none scale-105 opacity-0 group-focus-within:opacity-100"></div>
                </div>
              </div>
            ))}
            <div className="col-span-2 space-y-4">
              <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">Strategic_Context</label>
              <textarea
                className="w-full h-40 bg-black/40 border border-white/10 px-6 py-5 text-white text-sm font-medium outline-none focus:border-primary-purple/50 transition-all resize-none leading-relaxed tracking-wider rounded-none placeholder-white/5"
                placeholder="// Enter deployment notes..."
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
        </div>
      }
      rightPanels={
        <div className="space-y-10">
          <div className="bg-white/5 border border-white/10 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 rounded-2xl">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[5px] mb-8 flex items-center gap-4">
              <div className="w-5 h-5 bg-primary-purple/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              </div>
              Neural_Resource_Scan
            </h3>
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px]">Validation_Parameters</label>
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {availableSkills.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkillIds(prev => prev.includes(skill.id) ? prev.filter(i => i !== skill.id) : [...prev, skill.id])}
                      className={`px-4 py-2 text-[9px] font-black tracking-widest border transition-all rounded-none uppercase ${selectedSkillIds.includes(skill.id) ? 'bg-primary-purple border-primary-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white hover:bg-white/10'}`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => fetchRecommendations(selectedSkillIds, formData.startDate, formData.endDate)}
                  disabled={selectedSkillIds.length === 0}
                  className="w-full bg-primary-purple/10 hover:bg-primary-purple/20 text-white text-xs font-black uppercase tracking-[4px] py-4 transition-all flex items-center justify-center gap-3 border border-primary-purple/30 disabled:opacity-20 backdrop-blur-xl group"
                >
                  <Search className="w-4 h-4 text-primary-purple group-hover:scale-110 transition-transform" />
                  INITIATE_MATCH_SEQUENCE
                </button>
              </div>

              {recommendations.length > 0 && (
                <div className="space-y-6 border-t border-white/10 pt-8 animate-in fade-in slide-in-from-bottom-4">
                  <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px]">Matched_Entities</label>
                  <div className="space-y-4">
                    {recommendations.map(rec => (
                      <motion.div
                        key={rec.employee.id}
                        whileHover={{ x: 4 }}
                        onClick={() => setFormData((p: any) => ({ ...p, employeeId: rec.employee.id }))}
                        className={`group p-5 border transition-all cursor-pointer flex items-center justify-between rounded-xl ${formData.employeeId === rec.employee.id ? 'bg-primary-purple/20 border-primary-purple ring-1 ring-primary-purple/40' : 'bg-black/60 border-white/5 hover:border-white/20'}`}
                      >
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-black text-white tracking-wide uppercase">{rec.employee.name}</span>
                          <div className="flex gap-2 flex-wrap">
                            {rec.employee.skills.map(s => (
                              <span key={s.skill.name} className="text-[8px] text-white/30 font-black uppercase tracking-[1px] bg-white/5 px-2 py-0.5">{s.skill.name}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-primary-purple tracking-tighter">{Math.round(rec.matchScore)}%</span>
                          </div>
                          <AnimatePresence>
                            {formData.employeeId === rec.employee.id && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <CheckCircle2 className="w-5 h-5 text-primary-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-5">
            <Info className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-[10px] text-blue-300 font-black uppercase tracking-[2px]">Planning_Assistance</p>
              <p className="text-[11px] text-blue-200/60 font-medium leading-relaxed tracking-wider uppercase">
                Neural scan results are prioritized by skill compatibility and historical throughput metrics.
              </p>
            </div>
          </div>
        </div>
      }
    />
  );

  const filtered = items.filter(i =>
    i.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <OdooViewManager
      title="Strategic Planning"
      currentView={currentView}
      onViewChange={setCurrentView}
      onNew={handleNew}
      onSave={handleSave}
      onDiscard={() => { setFormData(null); setCurrentView('timeline'); }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewsAvailable={['timeline', 'list', 'form']}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {currentView === 'timeline' && (
            <div className="pt-4">
              {renderDashboard()}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl shadow-2xl p-1 p-b-0 ring-1 ring-white/10">
                <PlanningTimeline slots={items} onSlotClick={handleRowClick} />
              </div>
            </div>
          )}
          {currentView === 'list' && (
            <div className="pt-4">
              {renderDashboard()}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl shadow-2xl ring-1 ring-white/10">
                <OdooListBase<PlanningSlot>
                  data={filtered}
                  onRowClick={handleRowClick}
                  keyExtractor={(s) => s.id.toString()}
                  columns={[
                    { key: 'employee', label: 'RESOURCE', render: (s) => <span className="font-black text-white uppercase tracking-wider">{s.employee?.name || 'ROOT_EMPTY'}</span> },
                    { key: 'role', label: 'JOB_ROLE', render: (s) => <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">{s.role}</span> },
                    { key: 'project', label: 'ACTIVE_PROJECT', render: (s) => <span className="text-white/60 font-medium">{s.project?.name || '—'}</span> },
                    { key: 'hours', label: 'ALLOC_HOURS', render: (s) => <span className="font-black text-primary-purple text-lg tracking-tighter">{s.hours}H</span> },
                    { key: 'startDate', label: 'SCHEDULED_DATE', render: (s) => <span className="text-white/30 font-mono text-[11px]">{new Date(s.startDate).toLocaleDateString()}</span> },
                    { key: 'state', label: 'LIFECYCLE', render: (s) => renderStateBadge(s.state) },
                  ]}
                />
              </div>
            </div>
          )}
          {currentView === 'form' && renderForm()}
        </motion.div>
      </AnimatePresence>
    </OdooViewManager>
  );
};

export default PlanningModule;
