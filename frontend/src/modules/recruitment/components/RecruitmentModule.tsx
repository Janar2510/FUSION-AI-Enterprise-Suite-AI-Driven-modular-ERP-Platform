import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useRecruitmentStore, HrApplicant } from '../stores/recruitmentStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const STAGES = [
    { id: 'new', label: 'New' }, { id: 'qualified', label: 'Qualified' },
    { id: 'interview', label: 'Interview' }, { id: 'offer', label: 'Offer' },
    { id: 'hired', label: 'Hired' }, { id: 'refused', label: 'Refused' },
];

export const RecruitmentModule: React.FC = () => {
    const { applicants, fetch, create, update, remove } = useRecruitmentStore();
    const { departments, jobs, fetchDepartments, fetchJobs } = useHRStore();
    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRecord, setActiveRecord] = useState<HrApplicant | null>(null);
    const [formData, setFormData] = useState<Partial<HrApplicant>>({ stage: 'new', priority: 0 });

    useEffect(() => { fetch(); fetchDepartments(); fetchJobs(); }, []);

    const handleNew = () => { setActiveRecord(null); setFormData({ stage: 'new', priority: 0, name: 'New Application' }); setCurrentView('form'); };
    const handleRowClick = (r: HrApplicant) => { setActiveRecord(r); setFormData(r); setCurrentView('form'); };
    const handleSave = async () => {
        const { job, department, createdAt, id, ...rest } = formData as any;
        if (activeRecord) await update(activeRecord.id, rest); else await create(rest);
        setCurrentView('kanban');
    };
    const handleDelete = async () => { if (!activeRecord) return; if (window.confirm('Delete?')) { await remove(activeRecord.id); setCurrentView('kanban'); } };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        if (result.destination.droppableId === result.source.droppableId) return;
        await update(parseInt(result.draggableId), { stage: result.destination.droppableId });
    };

    const filtered = applicants.filter(a => a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderKanban = () => (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-[calc(100vh-180px)] overflow-x-auto pb-4 pt-4">
                {STAGES.filter(s => s.id !== 'refused').map(stage => {
                    const items = filtered.filter(a => a.stage === stage.id);
                    return (
                        <div key={stage.id} className="min-w-[280px] max-w-[280px] flex flex-col bg-black/20 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-medium mb-3 flex justify-between items-center">
                                {stage.label} <span className="bg-white/10 text-xs py-0.5 px-2 rounded-full text-white/60">{items.length}</span>
                            </h3>
                            <Droppable droppableId={stage.id}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 space-y-2 overflow-y-auto min-h-[100px]">
                                        {items.map((a, i) => (
                                            <Draggable key={a.id.toString()} draggableId={a.id.toString()} index={i}>
                                                {(prov, snap) => (
                                                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                                        onClick={() => handleRowClick(a)}
                                                        className={`bg-white/5 border border-white/10 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-all ${snap.isDragging ? 'ring-1 ring-primary-500 shadow-xl' : ''}`}>
                                                        <p className="text-white font-medium text-sm">{a.name}</p>
                                                        {a.partnerName && <p className="text-white/50 text-xs mt-1">{a.partnerName}</p>}
                                                        {a.job && <span className="inline-block mt-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">{a.job.name}</span>}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );

    const renderList = () => (
        <OdooListBase data={filtered} onRowClick={handleRowClick} keyExtractor={t => t.id.toString()} columns={[
            { key: 'name', label: 'Subject', render: t => <span className="font-bold">{t.name}</span> },
            { key: 'partnerName', label: 'Applicant', render: t => t.partnerName || '—' },
            { key: 'email', label: 'Email', render: t => t.email || '—' },
            { key: 'job', label: 'Applied For', render: t => t.job?.name || '—' },
            { key: 'stage', label: 'Stage', render: t => <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70 uppercase">{t.stage}</span> },
        ]} />
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">{STAGES.map(s => (
                        <button key={s.id} onClick={() => { setFormData({ ...formData, stage: s.id }); if (activeRecord) update(activeRecord.id, { stage: s.id }); }}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${formData.stage === s.id ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>{s.label}</button>
                    ))}</div>
                    {activeRecord && <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">Delete</button>}
                </div>
            }
            headerContent={<input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full" placeholder="Application subject..." value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />}
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2"><label className="text-white/60 text-sm">Applicant Name</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500" value={formData.partnerName || ''} onChange={e => setFormData({ ...formData, partnerName: e.target.value })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Email</label><input type="email" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Phone</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Expected Salary</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500" value={formData.salary || 0} onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Applied For (Job)</label><select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={formData.jobId || ''} onChange={e => setFormData({ ...formData, jobId: parseInt(e.target.value) })}><option value="">Select...</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Department</label><select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={formData.departmentId || ''} onChange={e => setFormData({ ...formData, departmentId: parseInt(e.target.value) })}><option value="">Select...</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Source</label><select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={formData.source || ''} onChange={e => setFormData({ ...formData, source: e.target.value })}><option value="">Select...</option><option value="linkedin">LinkedIn</option><option value="website">Website</option><option value="referral">Referral</option><option value="other">Other</option></select></div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-white/10"><label className="text-white/60 text-sm">Notes</label><textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-500 resize-none" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                </div>
            }
            rightPanels={null}
        />
    );

    return (
        <OdooViewManager title="Recruitment" currentView={currentView} onViewChange={setCurrentView} onNew={handleNew} onSave={handleSave} onDiscard={() => setCurrentView('kanban')} searchTerm={searchTerm} onSearchChange={setSearchTerm} viewsAvailable={['kanban', 'list', 'form']}>
            {currentView === 'kanban' && renderKanban()}
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
