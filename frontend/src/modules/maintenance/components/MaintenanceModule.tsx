import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useMaintenanceStore, MaintenanceRequest, MaintenanceEquipment } from '../stores/maintenanceStore';
import { Wrench, Cpu, BarChart2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const STAGE_LABELS: Record<string, { label: string; cls: string }> = {
    new: { label: 'New', cls: 'bg-gray-500/20 text-gray-400' },
    in_progress: { label: 'In Progress', cls: 'bg-blue-500/20 text-blue-400' },
    done: { label: 'Done', cls: 'bg-green-500/20 text-green-400' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-400' },
};

const PRIORITY_LABELS = ['Low', 'Normal', 'High', 'Critical'];

type Tab = 'requests' | 'equipment' | 'analytics';

export const MaintenanceModule: React.FC = () => {
    const { requests, equipment, analytics, fetchRequests, createRequest, updateRequest, markDone, deleteRequest, fetchEquipment, createEquipment, updateEquipment, deleteEquipment, fetchAnalytics } = useMaintenanceStore();

    const [tab, setTab] = useState<Tab>('requests');
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeReq, setActiveReq] = useState<MaintenanceRequest | null>(null);
    const [reqForm, setReqForm] = useState<Partial<MaintenanceRequest>>({ stage: 'new', maintenanceType: 'corrective', priority: 0 });

    const [activeEq, setActiveEq] = useState<MaintenanceEquipment | null>(null);
    const [eqForm, setEqForm] = useState<Partial<MaintenanceEquipment>>({});

    useEffect(() => { fetchRequests(); fetchEquipment(); fetchAnalytics(); }, []);

    const renderStageBadge = (stage: string) => {
        const s = STAGE_LABELS[stage] || STAGE_LABELS.new;
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${s.cls}`}>{s.label}</span>;
    };

    // ── Requests ───────────────────────────────────────────────────────────────

    const filteredReqs = requests.filter(r => {
        const t = searchTerm.toLowerCase();
        return r.name.toLowerCase().includes(t) || r.equipment?.name?.toLowerCase().includes(t);
    });

    const handleNewReq = () => { setActiveReq(null); setReqForm({ stage: 'new', maintenanceType: 'corrective', priority: 0, name: 'New Maintenance Request' }); setCurrentView('form'); };
    const handleReqRowClick = (r: MaintenanceRequest) => { setActiveReq(r); setReqForm(r); setCurrentView('form'); };
    const handleSaveReq = async () => {
        const { equipment: _eq, createdAt, id, ...rest } = reqForm as any;
        if (activeReq) await updateRequest(activeReq.id, rest); else await createRequest(rest);
        setCurrentView('list');
    };

    const renderRequestList = () => (
        <>
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{requests.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Open</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">{requests.filter(r => r.stage !== 'done' && r.stage !== 'cancelled').length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Done</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{requests.filter(r => r.stage === 'done').length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">MTTR (hrs)</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">{analytics?.mttrHours ?? '—'}</p></div>
            </div>
            <OdooListBase data={filteredReqs} onRowClick={handleReqRowClick} keyExtractor={r => r.id.toString()} columns={[
                { key: 'name', label: 'Request', render: r => <span className="font-bold">{r.name}</span> },
                { key: 'equipment', label: 'Equipment', render: r => r.equipment?.name || '—' },
                { key: 'maintenanceType', label: 'Type', render: r => r.maintenanceType },
                { key: 'priority', label: 'Priority', render: r => PRIORITY_LABELS[r.priority] || 'Low' },
                { key: 'requestDate', label: 'Requested', render: r => new Date(r.requestDate).toLocaleDateString() },
                { key: 'stage', label: 'Stage', render: r => renderStageBadge(r.stage) },
            ]} />
        </>
    );

    const renderRequestForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {activeReq && reqForm.stage !== 'done' && reqForm.stage !== 'cancelled' && (
                            <button onClick={async () => {
                                const hrs = parseFloat(window.prompt('Duration in hours (optional):', '0') || '0') || undefined;
                                await markDone(activeReq.id, hrs);
                                setReqForm(p => ({ ...p, stage: 'done' }));
                            }} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm border border-green-500/30 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Mark Done
                            </button>
                        )}
                        {renderStageBadge(reqForm.stage || 'new')}
                    </div>
                    {activeReq && <button onClick={async () => { if (window.confirm('Delete request?')) { await deleteRequest(activeReq.id); setCurrentView('list'); } }} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Delete</button>}
                </div>
            }
            headerContent={<input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent outline-none focus:border-primary-500 w-full" placeholder="Request title..." value={reqForm.name || ''} onChange={e => setReqForm({ ...reqForm, name: e.target.value })} />}
            leftPanels={
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2"><label className="text-white/60 text-sm">Equipment</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={reqForm.equipmentId || ''} onChange={e => setReqForm({ ...reqForm, equipmentId: e.target.value ? parseInt(e.target.value) : null })}>
                            <option value="">None</option>{equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Type</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={reqForm.maintenanceType || 'corrective'} onChange={e => setReqForm({ ...reqForm, maintenanceType: e.target.value })}>
                            <option value="corrective">Corrective</option><option value="preventive">Preventive</option>
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Priority</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={reqForm.priority ?? 0} onChange={e => setReqForm({ ...reqForm, priority: parseInt(e.target.value) })}>
                            {PRIORITY_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Stage</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={reqForm.stage || 'new'} onChange={e => setReqForm({ ...reqForm, stage: e.target.value })}>
                            {Object.keys(STAGE_LABELS).map(s => <option key={s} value={s}>{STAGE_LABELS[s].label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2 col-span-2"><label className="text-white/60 text-sm">Description</label><textarea className="w-full h-28 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none resize-none" value={reqForm.description || ''} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} /></div>
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-400" /> Summary</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Type</span><span className="text-white">{reqForm.maintenanceType}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Priority</span><span className="text-white">{PRIORITY_LABELS[reqForm.priority ?? 0]}</span></div>
                        {activeReq?.durationHours && <div className="flex justify-between"><span className="text-white/60">Duration</span><span className="text-white">{activeReq.durationHours}h</span></div>}
                    </div>
                </div>
            }
        />
    );

    // ── Equipment ──────────────────────────────────────────────────────────────

    const filteredEq = equipment.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.category?.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleNewEq = () => { setActiveEq(null); setEqForm({ active: true, cost: 0 }); setCurrentView('form'); };
    const handleEqRowClick = (e: MaintenanceEquipment) => { setActiveEq(e); setEqForm(e); setCurrentView('form'); };
    const handleSaveEq = async () => {
        const { requests: _r, _count, ...rest } = eqForm as any;
        if (activeEq) await updateEquipment(activeEq.id, rest); else await createEquipment(rest);
        setCurrentView('list');
    };

    const renderEquipmentList = () => (
        <>
            {analytics?.overduePreventive?.length ? (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4 text-sm text-amber-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {analytics.overduePreventive.length} equipment item(s) overdue for preventive maintenance
                </div>
            ) : null}
            <OdooListBase data={filteredEq} onRowClick={handleEqRowClick} keyExtractor={e => e.id.toString()} columns={[
                { key: 'name', label: 'Equipment', render: e => <span className="font-bold">{e.name}</span> },
                { key: 'category', label: 'Category', render: e => e.category || '—' },
                { key: 'location', label: 'Location', render: e => e.location || '—' },
                { key: 'serialNo', label: 'Serial', render: e => <span className="font-mono text-xs">{e.serialNo || '—'}</span> },
                { key: 'nextMaintenanceDate', label: 'Next PM', render: e => e.nextMaintenanceDate ? (
                    <span className={new Date(e.nextMaintenanceDate) < new Date() ? 'text-red-400 font-bold' : ''}>{new Date(e.nextMaintenanceDate).toLocaleDateString()}</span>
                ) : '—' },
                { key: 'requests', label: 'Requests', render: e => e._count?.requests || 0 },
            ]} />
        </>
    );

    const renderEquipmentForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex justify-end w-full">
                    {activeEq && <button onClick={async () => { if (window.confirm('Archive equipment?')) { await deleteEquipment(activeEq.id); setCurrentView('list'); } }} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Archive</button>}
                </div>
            }
            headerContent={<input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent outline-none focus:border-primary-500 w-full" placeholder="Equipment name..." value={eqForm.name || ''} onChange={e => setEqForm({ ...eqForm, name: e.target.value })} />}
            leftPanels={
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2"><label className="text-white/60 text-sm">Serial Number</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white font-mono outline-none" value={eqForm.serialNo || ''} onChange={e => setEqForm({ ...eqForm, serialNo: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Model</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={eqForm.model || ''} onChange={e => setEqForm({ ...eqForm, model: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Category</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={eqForm.category || ''} onChange={e => setEqForm({ ...eqForm, category: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Location</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={eqForm.location || ''} onChange={e => setEqForm({ ...eqForm, location: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Purchase Cost</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={eqForm.cost || 0} onChange={e => setEqForm({ ...eqForm, cost: parseFloat(e.target.value) })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Assign Date</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={eqForm.assignDate ? eqForm.assignDate.slice(0, 10) : ''} onChange={e => setEqForm({ ...eqForm, assignDate: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Preventive Freq. (days, 0 = off)</label><input type="number" min={0} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={eqForm.preventiveFreqDays ?? ''} onChange={e => setEqForm({ ...eqForm, preventiveFreqDays: e.target.value ? parseInt(e.target.value) : null })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Next Maintenance Date</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={eqForm.nextMaintenanceDate ? eqForm.nextMaintenanceDate.slice(0, 10) : ''} onChange={e => setEqForm({ ...eqForm, nextMaintenanceDate: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                    <div className="space-y-2 col-span-2"><label className="text-white/60 text-sm">Notes</label><textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none resize-none" value={eqForm.note || ''} onChange={e => setEqForm({ ...eqForm, note: e.target.value })} /></div>
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-400" /> Equipment Info</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Cost</span><span className="text-white font-mono">${(eqForm.cost || 0).toLocaleString()}</span></div>
                        {eqForm.lastMaintenanceDate && <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Last PM</span><span className="text-white">{new Date(eqForm.lastMaintenanceDate).toLocaleDateString()}</span></div>}
                        {eqForm.preventiveFreqDays && <div className="flex justify-between"><span className="text-white/60">PM Interval</span><span className="text-white">{eqForm.preventiveFreqDays} days</span></div>}
                    </div>
                </div>
            }
        />
    );

    // ── Analytics ──────────────────────────────────────────────────────────────

    const renderAnalytics = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Equipment</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{analytics?.totalEquipment || 0}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Open Requests</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">{analytics?.openRequests || 0}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">MTTR (hrs)</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{analytics?.mttrHours ?? '—'}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">MTBF (days)</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">{analytics?.mtbfDays ?? '—'}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-amber-400" /> Requests by Stage</h3>
                    {analytics?.byStage?.length ? (
                        <div className="space-y-3">
                            {analytics.byStage.map(s => (
                                <div key={s.stage} className="flex items-center justify-between text-sm">
                                    <span className="text-white/60 capitalize">{s.stage.replace('_', ' ')}</span>
                                    <span className="text-white font-bold">{s._count}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-white/40 text-sm">No data yet.</p>}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-400" /> Overdue Preventive PM</h3>
                    {analytics?.overduePreventive?.length ? (
                        <div className="space-y-3">
                            {analytics.overduePreventive.map(e => (
                                <div key={e.id} className="flex justify-between text-sm border-b border-white/5 pb-2">
                                    <span className="text-white font-medium">{e.name}</span>
                                    <span className="text-red-400">{new Date(e.nextMaintenanceDate).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-white/40 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> All equipment up to date.</p>}
                </div>
            </div>
        </div>
    );

    // ── Tab routing ────────────────────────────────────────────────────────────

    const handleTabChange = (t: Tab) => { setTab(t); setCurrentView('list'); setSearchTerm(''); };
    const handleNew = () => { if (tab === 'requests') handleNewReq(); else if (tab === 'equipment') handleNewEq(); };
    const handleSave = () => { if (tab === 'requests') handleSaveReq(); else if (tab === 'equipment') handleSaveEq(); };

    return (
        <OdooViewManager title="Maintenance" currentView={currentView} onViewChange={setCurrentView} onNew={tab !== 'analytics' ? handleNew : undefined} onSave={handleSave} onDiscard={() => setCurrentView('list')} searchTerm={searchTerm} onSearchChange={setSearchTerm} viewsAvailable={['list', 'form']}>
            {currentView === 'list' && (
                <>
                    <div className="flex gap-1 mb-6 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
                        {[{ id: 'requests', label: 'Requests', icon: Wrench }, { id: 'equipment', label: 'Equipment', icon: Cpu }, { id: 'analytics', label: 'Analytics', icon: BarChart2 }].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => handleTabChange(id as Tab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-primary-500 text-white' : 'text-white/60 hover:text-white'}`}>
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </div>
                    {tab === 'requests' && renderRequestList()}
                    {tab === 'equipment' && renderEquipmentList()}
                    {tab === 'analytics' && renderAnalytics()}
                </>
            )}
            {currentView === 'form' && tab === 'requests' && renderRequestForm()}
            {currentView === 'form' && tab === 'equipment' && renderEquipmentForm()}
        </OdooViewManager>
    );
};
