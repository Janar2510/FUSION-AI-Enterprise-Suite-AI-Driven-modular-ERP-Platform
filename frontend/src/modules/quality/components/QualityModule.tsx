import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useQualityStore, QualityCheck, QualityPoint, QualityAlert } from '../stores/qualityStore';
import { useInventoryStore } from '@/modules/inventory/stores/inventoryStore';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Bell } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';

type QualityTab = 'checks' | 'alerts';

export const QualityModule: React.FC = () => {
    const { checks, points, alerts, fetchChecks, fetchPoints, fetchAlerts, createCheck, updateCheck, createAlert, updateAlert, moveAlertStage, deleteAlert } = useQualityStore();
    const { products, fetchAllProducts } = useInventoryStore();

    const [activeTab, setActiveTab] = useState<QualityTab>('checks');
    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // Kanban acts as Dashboard
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCheck, setActiveCheck] = useState<QualityCheck | null>(null);
    const [formData, setFormData] = useState<Partial<QualityCheck>>({});
    const [activeAlert, setActiveAlert] = useState<QualityAlert | null>(null);
    const [alertFormData, setAlertFormData] = useState<Partial<QualityAlert>>({});
    const [alertView, setAlertView] = useState<'list' | 'form'>('list');

    useEffect(() => {
        fetchChecks();
        fetchPoints();
        fetchAlerts();
        fetchAllProducts();
    }, []);

    const handleNew = () => {
        setActiveCheck(null);
        setFormData({
            state: 'none',
            testType: 'passfail',
            name: 'New Quality Check'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: QualityCheck) => {
        setActiveCheck(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeCheck) {
            await updateCheck(activeCheck.id, formData);
        } else {
            const newCheck = await createCheck(formData);
            if (newCheck) {
                setActiveCheck(newCheck);
                setFormData(newCheck);
            }
        }
        setCurrentView('list');
    };

    const handleAction = async (state: string) => {
        if (!activeCheck) return;
        const res = await updateCheck(activeCheck.id, { state });
        if (res) {
            setActiveCheck(res);
            setFormData(res);
        }
    };

    // --- DASHBOARD (Kanban) VIEW ---
    const renderDashboard = () => {
        const passCount = checks.filter(c => c.state === 'pass').length;
        const failCount = checks.filter(c => c.state === 'fail').length;
        const pendingCount = checks.filter(c => c.state === 'none').length;
        const total = checks.length;

        const passRate = total ? Math.round((passCount / total) * 100) : 0;

        return (
            <div className="space-y-8">
                {/* Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white/60 text-sm">Pass Rate</p>
                                <h3 className="text-2xl font-bold text-white">{passRate}%</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white/60 text-sm">Passed</p>
                                <h3 className="text-2xl font-bold text-white">{passCount}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white/60 text-sm">Failed</p>
                                <h3 className="text-2xl font-bold text-white">{failCount}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-500">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white/60 text-sm">Pending Checks</p>
                                <h3 className="text-2xl font-bold text-white">{pendingCount}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Checks Kanban-style list */}
                <div>
                    <h3 className="text-lg font-medium text-white mb-4">Pending Quality Checks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {checks.filter(c => c.state === 'none').map(check => (
                            <GlassCard
                                key={check.id}
                                onClick={() => handleRowClick(check)}
                                className="p-5 cursor-pointer hover:border-primary-purple/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-bold text-white">{check.name}</span>
                                    <span className="bg-white/10 text-white/60 text-xs px-2 py-1 rounded-full uppercase">Pending</span>
                                </div>

                                <div className="space-y-2 text-sm text-white/70">
                                    <div className="flex justify-between">
                                        <span>Product:</span>
                                        <span className="font-medium text-white">{check.product?.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Type:</span>
                                        <span className="font-medium text-white capitalize">{check.testType}</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveCheck(check); handleAction('pass'); }}
                                        className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white py-1.5 rounded transition-colors text-sm font-medium"
                                    >Pass</button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveCheck(check); handleAction('fail'); }}
                                        className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white py-1.5 rounded transition-colors text-sm font-medium"
                                    >Fail</button>
                                </div>
                            </GlassCard>
                        ))}
                        {pendingCount === 0 && (
                            <div className="col-span-full border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-white/[0.02]">
                                <ShieldCheck className="w-8 h-8 text-white/20 mb-3" />
                                <span className="text-white/60">No pending checks. You're all caught up!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // --- LIST VIEW ---
    const renderList = () => (
        <OdooListBase
            data={checks.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={c => c.id.toString()}
            columns={[
                { key: 'name', label: 'Reference', render: c => <span className="font-bold">{c.name}</span> },
                { key: 'product', label: 'Product', render: c => c.product?.name || '-' },
                { key: 'testType', label: 'Test Type', render: c => <span className="capitalize">{c.testType}</span> },
                {
                    key: 'state', label: 'Status', render: c => (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${c.state === 'pass' ? 'bg-green-500/20 text-green-400' :
                            c.state === 'fail' ? 'bg-red-500/20 text-red-500' :
                                'bg-yellow-500/20 text-yellow-500'
                            }`}>
                            {c.state === 'none' ? 'Pending' : c.state}
                        </span>
                    )
                },
                { key: 'point', label: 'Quality Point', render: c => c.point?.name || '-' },
            ]}
        />
    );

    // --- FORM VIEW ---
    const renderForm = () => {
        const isReadonly = activeCheck?.state !== 'none';

        return (
            <OdooFormBase
                statusRibbon={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            {/* Action Buttons */}
                            {activeCheck?.state === 'none' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleAction('pass')} className="bg-green-600 hover:bg-green-500 text-white px-6 py-1.5 rounded text-sm transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)] shadow-green-500/20 font-medium">Pass</button>
                                    <button onClick={() => handleAction('fail')} className="bg-red-600 hover:bg-red-500 text-white px-6 py-1.5 rounded text-sm transition-colors font-medium">Fail</button>
                                </div>
                            )}
                        </div>

                        {/* Status Bubbles */}
                        {activeCheck && (
                            <span className={`px-4 py-1.5 text-sm font-bold rounded-full uppercase border ${activeCheck.state === 'pass' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                                activeCheck.state === 'fail' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                                    'border-yellow-500/50 text-yellow-500 bg-yellow-500/10'
                                }`}>
                                {activeCheck.state === 'none' ? 'Pending' : activeCheck.state}
                            </span>
                        )}
                    </div>
                }
                headerContent={
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                            placeholder="Check Reference"
                            value={formData.name || ''}
                            readOnly={isReadonly}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                }
                leftPanels={
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Check Details</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Product</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                        value={formData.productId || ''}
                                        disabled={isReadonly}
                                        onChange={(e) => setFormData({ ...formData, productId: parseInt(e.target.value) })}
                                    >
                                        <option value="" className="text-black">Select Product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Quality Point</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                        value={formData.pointId || ''}
                                        disabled={isReadonly}
                                        onChange={(e) => setFormData({ ...formData, pointId: parseInt(e.target.value) })}
                                    >
                                        <option value="" className="text-black">Select Point...</option>
                                        {points.map(p => (
                                            <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-white/60 text-sm font-medium">Test Type</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                        value={formData.testType || 'passfail'}
                                        disabled={isReadonly}
                                        onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                                    >
                                        <option value="passfail" className="text-black">Pass / Fail</option>
                                        <option value="measure" className="text-black">Measure</option>
                                    </select>
                                </div>

                                {formData.testType === 'measure' && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-white/60 text-sm font-medium">Measured Value</label>
                                        <input
                                            type="number"
                                            className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                            value={formData.measureValue || 0}
                                            readOnly={isReadonly}
                                            onChange={(e) => setFormData({ ...formData, measureValue: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <label className="text-white/60 text-sm font-medium mb-2 block">Notes</label>
                            <textarea
                                className="w-full min-h-[120px] bg-black/20 border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-primary-purple transition-all resize-y"
                                placeholder="Inspector notes..."
                                value={formData.notes || ''}
                                readOnly={isReadonly}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </GlassCard>
                    </div>
                }
                rightPanels={
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Document Link</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/60">Manufacturing Order</span>
                                    <span className="text-white font-medium cursor-pointer hover:text-primary-purple transition-colors">
                                        {formData.production?.name || 'Not Linked'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/60">Receipt / Transfer</span>
                                    <span className="text-white font-medium cursor-pointer hover:text-primary-purple transition-colors">
                                        {formData.picking?.name || 'Not Linked'}
                                    </span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                }
            />
        );
    };

    const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
        0: { label: 'Normal', color: 'text-white/60' },
        1: { label: 'Important', color: 'text-yellow-400' },
        2: { label: 'Critical', color: 'text-red-400' },
    };

    const ALERT_STAGES = ['new', 'in_progress', 'done', 'cancel'];

    const renderAlertsPanel = () => {
        if (alertView === 'form') {
            return (
                <OdooFormBase
                    statusRibbon={
                        <div className="flex items-center gap-2 flex-wrap">
                            {ALERT_STAGES.map(s => (
                                <button key={s} onClick={async () => {
                                    if (!activeAlert) return;
                                    const updated = await moveAlertStage(activeAlert.id, s);
                                    if (updated) { setActiveAlert(updated); setAlertFormData(updated); }
                                }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${alertFormData.stage === s ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                                    {s.replace('_', ' ')}
                                </button>
                            ))}
                            <div className="flex-1" />
                            {activeAlert && (
                                <button onClick={async () => { await deleteAlert(activeAlert.id); setAlertView('list'); }}
                                    className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-3 py-1.5 rounded text-sm transition-colors border border-red-500/30">
                                    Delete
                                </button>
                            )}
                        </div>
                    }
                    headerContent={
                        <input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-white/20 placeholder-white/30 outline-none focus:border-orange-500 transition-all w-full pb-2 mb-4"
                            placeholder="Alert Title..." value={alertFormData.name || ''}
                            onChange={e => setAlertFormData({ ...alertFormData, name: e.target.value })} />
                    }
                    leftPanels={
                        <div className="space-y-6">
                            <div>
                                <label className="text-white/60 text-sm font-medium mb-2 block uppercase tracking-wide">Priority</label>
                                <div className="flex gap-2">
                                    {[0, 1, 2].map(p => (
                                        <button key={p} onClick={() => setAlertFormData({ ...alertFormData, priority: p })}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${alertFormData.priority === p ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                                            {PRIORITY_LABELS[p]?.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-white/60 text-sm font-medium mb-2 block uppercase tracking-wide">Description</label>
                                <textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-orange-500 transition-all resize-none text-sm"
                                    placeholder="Describe the quality issue..." value={alertFormData.description || ''}
                                    onChange={e => setAlertFormData({ ...alertFormData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-white/60 text-sm font-medium mb-2 block uppercase tracking-wide">Root Cause</label>
                                <textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-orange-500 transition-all resize-none text-sm"
                                    placeholder="Identified root cause..." value={alertFormData.rootCause || ''}
                                    onChange={e => setAlertFormData({ ...alertFormData, rootCause: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-white/60 text-sm font-medium mb-2 block uppercase tracking-wide">Corrective Action</label>
                                <textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-orange-500 transition-all resize-none text-sm"
                                    placeholder="Planned corrective action..." value={alertFormData.correctiveAction || ''}
                                    onChange={e => setAlertFormData({ ...alertFormData, correctiveAction: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={async () => {
                                    if (activeAlert) { await updateAlert(activeAlert.id, alertFormData); }
                                    else { await createAlert(alertFormData); }
                                    setAlertView('list');
                                }} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm">
                                    Save
                                </button>
                                <button onClick={() => setAlertView('list')} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm">
                                    Discard
                                </button>
                            </div>
                        </div>
                    }
                />
            );
        }

        const filteredAlerts = alerts.filter(a => a.name?.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="text-white/60 text-sm">{filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}</div>
                    <button onClick={() => { setActiveAlert(null); setAlertFormData({ name: 'New Quality Alert', stage: 'new', priority: 0 }); setAlertView('form'); }}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <Bell className="w-4 h-4" /> New Alert
                    </button>
                </div>
                {filteredAlerts.length === 0 ? (
                    <div className="text-center text-white/40 py-16">No quality alerts — production is running clean</div>
                ) : (
                    <div className="space-y-3">
                        {filteredAlerts.map(alert => (
                            <div key={alert.id} onClick={() => { setActiveAlert(alert); setAlertFormData(alert); setAlertView('form'); }}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-white font-medium">{alert.name}</h4>
                                            <span className={`text-xs font-bold uppercase ${PRIORITY_LABELS[alert.priority]?.color}`}>
                                                {PRIORITY_LABELS[alert.priority]?.label}
                                            </span>
                                        </div>
                                        {alert.description && <p className="text-white/50 text-sm line-clamp-2">{alert.description}</p>}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ml-4 flex-shrink-0 ${
                                        alert.stage === 'done' ? 'bg-green-500/20 text-green-400' :
                                        alert.stage === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                        alert.stage === 'cancel' ? 'bg-white/10 text-white/40' :
                                        'bg-orange-500/20 text-orange-400'}`}>
                                        {alert.stage.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Tab navigation */}
            <div className="flex bg-white/5 rounded-full border border-white/10 p-1 mb-6 w-fit mx-8 mt-4">
                {([
                    { id: 'checks', label: 'Quality Checks' },
                    { id: 'alerts', label: `Alerts${alerts.filter(a => a.stage === 'new').length > 0 ? ` (${alerts.filter(a => a.stage === 'new').length})` : ''}` },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === tab.id ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'checks' && (
                <OdooViewManager
                    title="Quality Control"
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    onNew={handleNew}
                    onSave={handleSave}
                    onDiscard={() => setCurrentView('kanban')}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    viewsAvailable={['kanban', 'list', 'form']}
                >
                    {currentView === 'kanban' && renderDashboard()}
                    {currentView === 'list' && renderList()}
                    {currentView === 'form' && renderForm()}
                </OdooViewManager>
            )}

            {activeTab === 'alerts' && (
                <div className="flex-1 px-8 overflow-auto">
                    <div className="mb-4">
                        <input type="search" placeholder="Search alerts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-orange-500 transition-all w-64" />
                    </div>
                    {renderAlertsPanel()}
                </div>
            )}
        </div>
    );
};
