import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooKanbanBase } from '@/components/views/OdooKanbanBase';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useCRMStore, CrmLead } from '../stores/crmStore';
import { useSalesStore } from '@/modules/sales/stores/salesStore';
import { Mail, Phone, DollarSign, Target, Briefcase, ShoppingCart } from 'lucide-react';
import { DropResult } from 'react-beautiful-dnd';
import { BreadcrumbHeader } from '@/components/shared/BreadcrumbHeader';
import { SmartButton } from '@/components/shared/SmartButton';
import { CRMSettings } from './CRMSettings';
import { AiActionsPanel } from '@/components/shared/AiActionsPanel';
import { crmApi } from '@/lib/api';
import { CrmActivitiesPanel } from './CrmActivitiesPanel';
import { CrmActivitiesCalendar } from './CrmActivitiesCalendar';
import { CrmPipelineAnalyticsBar } from './CrmPipelineAnalyticsBar';
import { ChatterPanel } from '@/components/shared/ChatterPanel';

// Internal form wrapper removed as nested routing is now handling CRM views

export const CRMModule: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        pipelineStages,
        allLeads,
        fetchPipeline,
        fetchAllLeads,
        createLead,
        updateLead,
        moveLeadStage,
        qualifyLead,
        markWon,
        newQuotation,
    } = useCRMStore();
    const { orders, fetchAllOrders } = useSalesStore();

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPipeline();
        fetchAllLeads();
        fetchAllOrders();
    }, [fetchPipeline, fetchAllLeads, fetchAllOrders]);

    let currentView: ViewType = 'kanban';
    if (location.pathname.includes('/activities/calendar')) currentView = 'calendar';
    else if (location.pathname.includes('/leads/list')) currentView = 'list';
    else if (location.pathname.includes('/leads/') || location.pathname.includes('/new')) currentView = 'form';
    else if (location.pathname.endsWith('/list')) currentView = 'list';

    // Route transitions
    const handleViewChange = (view: ViewType) => {
        if (view === 'list') navigate('/module/crm/leads/list');
        else if (view === 'kanban') navigate('/module/crm');
        else if (view === 'calendar') navigate('/module/crm/activities/calendar');
        else if (view === 'form') navigate('/module/crm/leads/new');
    };

    const handleNew = () => navigate('/module/crm/leads/new');

    const handleDiscard = () => navigate('/module/crm');

    // Current Form State
    const [formData, setFormData] = useState<Partial<CrmLead>>({});
    const [activeRecord, setActiveRecord] = useState<CrmLead | null>(null);
    const [markLostModal, setMarkLostModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' });

    // Sync form data with URL
    useEffect(() => {
        if (currentView === 'form') {
            const isNew = location.pathname.endsWith('/new');
            if (isNew) {
                setActiveRecord(null);
                setFormData({
                    name: 'New Deal',
                    type: 'opportunity',
                    expectedRevenue: 0,
                    probability: 10,
                    stageId: pipelineStages[0]?.id
                });
            } else {
                const match = location.pathname.match(/\/(?:leads\/)?(\d+)/);
                if (match) {
                    const id = parseInt(match[1]);
                    const lead = allLeads.find(l => l.id === id);
                    if (lead) {
                        setActiveRecord(lead);
                        setFormData(lead);
                    }
                }
            }
        }
    }, [location.pathname, currentView, allLeads, pipelineStages]);

    const handleSave = async () => {
        if (activeRecord) {
            await updateLead(activeRecord.id, formData);
        } else {
            await createLead(formData);
        }
        navigate('/module/crm');
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const leadId = parseInt(result.draggableId);
        const newStageId = parseInt(result.destination.droppableId);

        if (result.source.droppableId !== result.destination.droppableId) {
            moveLeadStage(leadId, newStageId);
        }
    };

    const handleRowClick = (lead: CrmLead) => {
        navigate(`/module/crm/leads/${lead.id}`);
    };

    // Breadcrumbs Logic
    const customLabels = useMemo(() => {
        const labels: Record<string, string> = {
            '/module/crm/leads': 'Leads'
        };
        if (location.pathname.includes('/activities/calendar')) {
            labels['/module/crm/activities/calendar'] = 'Activities calendar';
        }
        if (activeRecord) {
            labels[`/module/crm/leads/${activeRecord.id}`] = activeRecord.name;
        } else if (location.pathname.endsWith('/new')) {
            labels['/module/crm/leads/new'] = 'New Lead';
        }
        return labels;
    }, [activeRecord, location.pathname]);

    const renderKanbanCard = (lead: CrmLead) => {
        const getBadgeColor = (colorIndex: number) => {
            const colors = ['text-gray-400 bg-gray-400/10', 'text-red-400 bg-red-400/10', 'text-orange-400 bg-orange-400/10', 'text-yellow-400 bg-yellow-400/10', 'text-green-400 bg-green-400/10', 'text-teal-400 bg-teal-400/10', 'text-blue-400 bg-blue-400/10', 'text-amber-400 bg-amber-400/10', 'text-amber-400 bg-amber-400/10', 'text-secondary-400 bg-secondary-400/10'];
            return colors[(colorIndex || 0) % colors.length];
        };

        const sum = lead.activitySummary;
        const nextDue = sum?.nextDueAt ? new Date(sum.nextDueAt) : null;
        const dueLabel =
            nextDue && !Number.isNaN(nextDue.getTime())
                ? nextDue.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : null;

        return (
            <div onClick={() => handleRowClick(lead)}>
                <h4 className="font-bold text-white mb-2 line-clamp-2">{lead.name}</h4>
                {sum && (sum.overdueCount > 0 || dueLabel) && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {sum.overdueCount > 0 && (
                            <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-red-500/25 text-red-300 border border-red-400/30"
                                title={`${sum.overdueCount} open activit${sum.overdueCount === 1 ? 'y' : 'ies'} past due`}
                            >
                                Overdue{sum.overdueCount > 1 ? ` ×${sum.overdueCount}` : ''}
                            </span>
                        )}
                        {dueLabel && sum.overdueCount === 0 && (
                            <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-200/90 border border-amber-400/20"
                                title="Next open activity due date"
                            >
                                Due {dueLabel}
                            </span>
                        )}
                        {dueLabel && sum.overdueCount > 0 && (
                            <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-white/10 text-white/70 border border-white/10"
                                title="Next upcoming due date (after overdue items)"
                            >
                                Next {dueLabel}
                            </span>
                        )}
                    </div>
                )}
                {lead.tags && lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {lead.tags.map(tag => (
                            <span key={tag.id} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${getBadgeColor(tag.color)}`}>
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center text-white/70 text-sm gap-2">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="truncate">{lead.partner?.name || lead.contactName || 'No Contact'}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <div className="flex gap-0.5">
                            {[1, 2, 3].map(p => (
                                <span key={p} className={`text-sm ${lead.priority >= p ? 'text-yellow-500' : 'text-white/20'}`}>★</span>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            {!!lead.expectedRevenue && lead.expectedRevenue > 0 && (
                                <span className="font-semibold text-white/90 text-sm">
                                    ${lead.expectedRevenue.toLocaleString()}
                                </span>
                            )}
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-orange-600 flex items-center justify-center text-[10px] text-white font-bold shadow-sm" title="Assigned / Contact">
                                {lead.partner?.name ? lead.partner.name.charAt(0).toUpperCase() : (lead.contactName ? lead.contactName.charAt(0).toUpperCase() : 'U')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Linked Sales Orders logic
    const linkedOrders = useMemo(() => {
        if (!activeRecord?.partner?.id) return [];
        return orders.filter(o => o.partnerId === activeRecord.partner?.id);
    }, [activeRecord, orders]);

    const totalOrderValue = linkedOrders.reduce((sum, o) => sum + (o.amountTotal || 0), 0);

    const [showMessages, setShowMessages] = useState(false);

    return (
        <OdooViewManager
            title={<BreadcrumbHeader customLabels={customLabels} />}
            currentView={currentView}
            onViewChange={handleViewChange}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={handleDiscard}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['list', 'kanban', 'calendar', 'form']}
            onSettings={() => navigate('/module/crm/settings')}
        >
            <Routes>
                <Route path="/" element={
                    <div className="flex flex-col gap-4 min-h-0">
                        <CrmPipelineAnalyticsBar />
                        <OdooKanbanBase
                        columns={pipelineStages.map(stage => {
                            const filteredLeads = (stage.leads || []).filter(lead =>
                                !searchTerm ||
                                lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (lead.contactName && lead.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (lead.partner?.name && lead.partner.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            );

                            const expectedRevenueSum = filteredLeads.reduce((sum, lead) => sum + (lead.expectedRevenue || 0), 0);
                            return {
                                id: stage.id.toString(),
                                title: stage.name,
                                items: filteredLeads,
                                headerExtra: (
                                    <div className="w-full text-xs text-white/70 font-medium tracking-wide">
                                        ${expectedRevenueSum.toLocaleString()}
                                    </div>
                                )
                            };
                        })}
                        onDragEnd={handleDragEnd}
                        renderCard={renderKanbanCard}
                        keyExtractor={(lead) => lead.id.toString()}
                        onCardAdd={(stageId) => {
                            setFormData(prev => ({ ...prev, stageId: parseInt(stageId) }));
                            navigate('/module/crm/leads/new');
                        }}
                    />
                    </div>
                } />

                <Route path="/activities/calendar" element={
                    <div className="flex flex-col gap-4 min-h-0 flex-1">
                        <CrmPipelineAnalyticsBar />
                        <CrmActivitiesCalendar />
                    </div>
                } />

                <Route path="/leads/list" element={
                    <div className="flex flex-col gap-4 min-h-0">
                        <CrmPipelineAnalyticsBar />
                        <OdooListBase
                        data={allLeads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                        onRowClick={handleRowClick}
                        keyExtractor={(l) => l.id.toString()}
                        columns={[
                            { key: 'name', label: 'Opportunity' },
                            {
                                key: 'contactName',
                                label: 'Contact',
                                render: (l) => l.partner?.name || l.contactName || '-'
                            },
                            { key: 'emailFrom', label: 'Email' },
                            { key: 'phone', label: 'Phone' },
                            {
                                key: 'expectedRevenue',
                                label: 'Expected Revenue',
                                render: (l) => `$${l.expectedRevenue?.toLocaleString() || 0}`
                            },
                            {
                                key: 'stage',
                                label: 'Stage',
                                render: (l) => (
                                    <span className="bg-primary-500/20 text-primary-500 px-2 py-1 rounded-full text-xs font-medium">
                                        {l.stage?.name || 'Unknown'}
                                    </span>
                                )
                            }
                        ]}
                    />
                    </div>
                } />

                <Route path="/leads/*" element={
                    <OdooFormBase
                        statusRibbon={
                            <div className="flex gap-1 mb-2">
                                {pipelineStages.map(stage => (
                                    <button
                                        key={stage.id}
                                        onClick={() => setFormData({ ...formData, stageId: stage.id })}
                                        className={`px-4 py-2 border-r border-y first:border-l first:rounded-l-full last:rounded-r-full border-white/10 text-sm font-medium transition-colors
                        ${formData.stageId === stage.id ? 'bg-primary-500 text-white shadow-inner' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                    >
                                        {stage.name}
                                    </button>
                                ))}
                            </div>
                        }
                        smartButtons={
                            <>
                                <SmartButton
                                    icon={ShoppingCart}
                                    label="Sales"
                                    value={linkedOrders.length > 0 ? `$${totalOrderValue.toLocaleString()}` : '0'}
                                    onClick={() => navigate('/module/sales')}
                                    isActive={linkedOrders.length > 0}
                                />
                                <SmartButton
                                    icon={Mail}
                                    label="Messages"
                                    value={showMessages ? "Hide" : "Show"}
                                    onClick={() => setShowMessages(!showMessages)}
                                    isActive={showMessages}
                                />
                            </>
                        }
                        headerContent={
                            <div className="flex flex-col gap-4 relative">
                                {formData.active === false && (
                                    <div className="absolute top-0 right-0 overflow-hidden w-32 h-32 pointer-events-none -mt-4 -mr-4">
                                        <div className="absolute bg-red-600/90 text-white shadow-lg text-sm font-bold uppercase py-1 px-10 text-center right-[-35px] top-[32px] transform rotate-45 border border-red-500/30">
                                            Lost
                                        </div>
                                    </div>
                                )}
                                {pipelineStages.findIndex(s => s.id === formData.stageId) === pipelineStages.length - 1 && formData.active !== false && (
                                    <div className="absolute top-0 right-0 overflow-hidden w-32 h-32 pointer-events-none -mt-4 -mr-4">
                                        <div className="absolute bg-green-500/90 text-white shadow-lg text-sm font-bold uppercase py-1 px-10 text-center right-[-35px] top-[32px] transform rotate-45 border border-green-500/30">
                                            Won
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {/* Qualify: only shown for leads (not yet opportunities) */}
                                    {activeRecord && formData.type !== 'opportunity' && (
                                        <button
                                            className="px-4 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-md text-sm font-medium transition-colors"
                                            onClick={async () => {
                                                await qualifyLead(activeRecord.id);
                                                setFormData(f => ({ ...f, type: 'opportunity' }));
                                            }}
                                        >
                                            ✓ Qualify
                                        </button>
                                    )}
                                    {/* Mark Won: only for active leads */}
                                    {formData.active !== false && (
                                        <button
                                            className="px-4 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md text-sm font-medium transition-colors"
                                            onClick={async () => {
                                                if (activeRecord) {
                                                    await markWon(activeRecord.id);
                                                    setFormData(f => ({ ...f, stageId: pipelineStages[pipelineStages.length - 1]?.id, active: true }));
                                                } else {
                                                    setFormData(f => ({ ...f, stageId: pipelineStages[pipelineStages.length - 1]?.id, active: true }));
                                                }
                                            }}
                                        >
                                            🏆 Mark Won
                                        </button>
                                    )}
                                    {/* Mark Lost: only for active leads */}
                                    {formData.active !== false && (
                                        <button
                                            className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-md text-sm font-medium transition-colors"
                                            onClick={() => setMarkLostModal({ open: true, reason: '' })}
                                        >
                                            ✗ Mark Lost
                                        </button>
                                    )}
                                    {/* New Quotation: shown for Won leads */}
                                    {activeRecord && pipelineStages.findIndex(s => s.id === formData.stageId) === pipelineStages.length - 1 && formData.active !== false && (
                                        <button
                                            className="px-4 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-md text-sm font-medium transition-colors"
                                            onClick={async () => {
                                                const result = await newQuotation(activeRecord.id);
                                                if (result?.saleOrderId) {
                                                    navigate(`/module/sales/${result.saleOrderId}`);
                                                }
                                            }}
                                        >
                                            📋 New Quotation
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="e.g. Product Pricing Model"
                                    className="text-4xl font-bold bg-transparent border-none outline-none text-white focus:ring-0 p-0 placeholder-white/20"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <div className="flex gap-4">
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-md text-sm font-semibold border border-green-500/30 w-fit shrink-0 flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        <input
                                            type="number"
                                            className="bg-transparent border-none p-0 outline-none w-24 text-green-400"
                                            value={formData.expectedRevenue || 0}
                                            onChange={(e) => setFormData({ ...formData, expectedRevenue: parseFloat(e.target.value) })}
                                        />
                                    </span>
                                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md text-sm font-semibold border border-blue-500/30 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        <input
                                            type="number"
                                            className="bg-transparent border-none p-0 outline-none w-12 text-blue-400"
                                            value={formData.probability || 0}
                                            onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) })}
                                        />
                                        %
                                    </span>
                                </div>
                            </div>
                        }
                        leftPanels={
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" /> Customer
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Customer Name"
                                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none active:border-white/20 focus:border-primary-500 transition-all"
                                            value={formData.contactName || ''}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> Email
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                            value={formData.emailFrom || ''}
                                            onChange={(e) => setFormData({ ...formData, emailFrom: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4" /> Phone
                                        </label>
                                        <input
                                            type="tel"
                                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        }
                        rightPanels={
                            <div className="space-y-6">
                                {activeRecord?.partner && (
                                    <AiActionsPanel
                                        entityType="CrmLead"
                                        entityId={String(activeRecord.id)}
                                        agentKey="next-best-action"
                                    />
                                )}
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Expected Closing</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all [&::-webkit-calendar-picker-indicator]:filter-invert"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Priority</label>
                                    <div className="flex gap-2">
                                        {[0, 1, 2, 3].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setFormData({ ...formData, priority: p })}
                                                className={`w-8 h-8 rounded-full border border-white/10 transition-colors ${formData.priority === p ? 'bg-yellow-500 text-black' : 'hover:bg-white/10 text-white/40'}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Activities panel */}
                                {activeRecord && <CrmActivitiesPanel leadId={activeRecord.id} />}
                            </div>
                        }
                        chatter={
                            showMessages &&
                            (activeRecord ? (
                                <ChatterPanel
                                    ownerType="crm.lead"
                                    ownerId={activeRecord.id}
                                    showTimeline
                                    className="mt-6"
                                />
                            ) : (
                                <p className="text-sm text-white/50 mt-6 px-1">
                                    Save the lead to enable record chatter and timeline.
                                </p>
                            ))
                        }
                    />
                } />

                <Route path="/list" element={<Navigate to="/module/crm/leads/list" replace />} />
                <Route path="/new" element={<Navigate to="/module/crm/leads/new" replace />} />
                <Route path="/settings" element={<CRMSettings />} />
            </Routes>

            {/* ── Mark Lost Modal ────────────────────────────────────────── */}
            {markLostModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-1">Mark as Lost</h3>
                        <p className="text-white/50 text-sm mb-4">Optionally provide a reason why this opportunity was lost.</p>
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50 placeholder-white/20"
                            rows={3}
                            placeholder="e.g. Budget constraints, chose competitor…"
                            value={markLostModal.reason}
                            onChange={e => setMarkLostModal(m => ({ ...m, reason: e.target.value }))}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
                                onClick={() => setMarkLostModal({ open: false, reason: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                                onClick={async () => {
                                    if (activeRecord) {
                                        await crmApi.markLost(activeRecord.id, markLostModal.reason || undefined);
                                        setFormData(f => ({ ...f, active: false, lostReason: markLostModal.reason }));
                                        fetchPipeline();
                                        fetchAllLeads();
                                    }
                                    setMarkLostModal({ open: false, reason: '' });
                                }}
                            >
                                Mark Lost
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </OdooViewManager>
    );
};
