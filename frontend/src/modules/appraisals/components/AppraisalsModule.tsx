import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useAppraisalStore, HrAppraisal } from '../stores/appraisalStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { Star } from 'lucide-react';

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
    new: { label: 'New', cls: 'bg-gray-500/20 text-gray-400' },
    pending: { label: 'Pending', cls: 'bg-amber-500/20 text-amber-400' },
    done: { label: 'Done', cls: 'bg-green-500/20 text-green-400' },
    cancel: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-400' },
};

export const AppraisalsModule: React.FC = () => {
    const { appraisals, fetch, create, update, remove } = useAppraisalStore();
    const { employees, fetchEmployees } = useHRStore();
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRecord, setActiveRecord] = useState<HrAppraisal | null>(null);
    const [formData, setFormData] = useState<Partial<HrAppraisal>>({ state: 'new', overallRating: 0 });

    useEffect(() => { fetch(); fetchEmployees(); }, []);

    const handleNew = () => { setActiveRecord(null); setFormData({ state: 'new', overallRating: 0 }); setCurrentView('form'); };
    const handleRowClick = (r: HrAppraisal) => { setActiveRecord(r); setFormData(r); setCurrentView('form'); };
    const handleSave = async () => {
        const { employee, createdAt, id, ...rest } = formData as any;
        if (activeRecord) await update(activeRecord.id, rest); else await create(rest);
        setCurrentView('list');
    };
    const handleDelete = async () => { if (!activeRecord) return; if (window.confirm('Delete?')) { await remove(activeRecord.id); setCurrentView('list'); } };

    const filtered = appraisals.filter(a => a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderStateBadge = (state: string) => { const s = STATE_LABELS[state] || STATE_LABELS.new; return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${s.cls}`}>{s.label}</span>; };
    const renderStars = (rating: number, onSet?: (v: number) => void) => (
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map(v => (
            <Star key={v} className={`w-5 h-5 ${v <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} ${onSet ? 'cursor-pointer hover:text-yellow-300' : ''}`}
                onClick={onSet ? () => onSet(v) : undefined} />
        ))}</div>
    );

    const renderList = () => (
        <>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Appraisals</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{appraisals.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Avg Rating</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">{appraisals.length ? (appraisals.reduce((s, a) => s + a.overallRating, 0) / appraisals.length).toFixed(1) : '—'}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Completed</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{appraisals.filter(a => a.state === 'done').length}</p></div>
            </div>
            <OdooListBase data={filtered} onRowClick={handleRowClick} keyExtractor={t => t.id.toString()} columns={[
                { key: 'employee', label: 'Employee', render: t => <span className="font-bold">{t.employee?.name || '—'}</span> },
                { key: 'overallRating', label: 'Rating', render: t => renderStars(t.overallRating) },
                { key: 'deadline', label: 'Deadline', render: t => t.deadline ? new Date(t.deadline).toLocaleDateString() : '—' },
                { key: 'state', label: 'Status', render: t => renderStateBadge(t.state) },
            ]} />
        </>
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">{Object.entries(STATE_LABELS).map(([k, v]) => (
                        <button key={k} onClick={() => { setFormData({ ...formData, state: k }); if (activeRecord) update(activeRecord.id, { state: k }); }}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${formData.state === k ? 'bg-primary-purple text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>{v.label}</button>
                    ))}</div>
                    {activeRecord && <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">Delete</button>}
                </div>
            }
            headerContent={<h2 className="text-3xl font-bold text-white">{activeRecord ? `Appraisal — ${activeRecord.employee?.name || ''}` : 'New Appraisal'}</h2>}
            leftPanels={
                <div className="space-y-6"><div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2"><label className="text-white/60 text-sm">Employee</label><select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={formData.employeeId || ''} onChange={e => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}><option value="">Select...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Overall Rating</label>{renderStars(formData.overallRating || 0, v => setFormData({ ...formData, overallRating: v }))}</div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Deadline</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.deadline ? formData.deadline.slice(0, 10) : ''} onChange={e => setFormData({ ...formData, deadline: new Date(e.target.value).toISOString() })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Final Interview</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.finalInterview ? formData.finalInterview.slice(0, 10) : ''} onChange={e => setFormData({ ...formData, finalInterview: new Date(e.target.value).toISOString() })} /></div>
                </div>
                    <div className="space-y-2 pt-4 border-t border-white/10"><label className="text-white/60 text-sm">Manager Feedback</label><textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none resize-none" value={formData.managerFeedback || ''} onChange={e => setFormData({ ...formData, managerFeedback: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Employee Self-Evaluation</label><textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none resize-none" value={formData.employeeFeedback || ''} onChange={e => setFormData({ ...formData, employeeFeedback: e.target.value })} /></div>
                </div>
            }
            rightPanels={null}
        />
    );

    return (
        <OdooViewManager title="Appraisals" currentView={currentView} onViewChange={setCurrentView} onNew={handleNew} onSave={handleSave} onDiscard={() => setCurrentView('list')} searchTerm={searchTerm} onSearchChange={setSearchTerm} viewsAvailable={['list', 'form']}>
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
