import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooKanbanBase } from '@/components/views/OdooKanbanBase';
import { useHelpdeskStore, HelpdeskTicket } from '../stores/helpdeskStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AiActionsPanel } from '@/components/shared/AiActionsPanel';
import { ChatterPanel } from '@/components/shared/ChatterPanel';

export const HelpdeskModule: React.FC = () => {
    const {
        tickets,
        stages,
        fetchTickets,
        fetchStages,
        createTicket,
        updateTicket,
        updateTicketStage,
        createTask,
        addTimesheet,
    } = useHelpdeskStore();

    const { partners, fetchPartners } = usePartnerStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<HelpdeskTicket | null>(null);
    const [formData, setFormData] = useState<Partial<HelpdeskTicket>>({});
    const [taskId, setTaskId] = useState<number | null>(null);
    const [timesheetHours, setTimesheetHours] = useState('');
    const [showTimesheetRow, setShowTimesheetRow] = useState(false);

    useEffect(() => {
        fetchTickets();
        fetchStages();
        fetchPartners();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            active: true,
            stageId: stages.length > 0 ? stages[0].id : undefined,
            priority: 0,
            kanbanState: 'normal'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: HelpdeskTicket) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateTicket(activeRecord.id, formData);
        } else {
            const newTicket = await createTicket(formData);
            if (newTicket) setActiveRecord(newTicket);
        }
        setCurrentView('kanban');
    };

    const handleStageChange = async (ticketId: string, newStageId: string) => {
        await updateTicketStage(parseInt(ticketId), parseInt(newStageId));
    };

    // --------------------------------------------------------------------------
    // KANBAN VIEW
    // --------------------------------------------------------------------------
    const renderKanban = () => {
        const columns = stages.map(st => ({
            id: st.id.toString(),
            title: st.name,
            items: tickets.filter(t => t.stageId === st.id && t.name.toLowerCase().includes(searchTerm.toLowerCase()))
        }));

        return (
            <OdooKanbanBase
                columns={columns}
                onDragEnd={(result) => {
                    if (!result.destination) return;
                    handleStageChange(result.draggableId, result.destination.droppableId);
                }}
                keyExtractor={(t) => t.id.toString()}
                renderCard={(t) => (
                    <div className="space-y-3 cursor-pointer" onClick={() => handleRowClick(t)}>
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-white/90 leading-tight">{t.name}</h4>
                        </div>
                        {t.partner && (
                            <div className="text-sm text-white/70">
                                {t.partner.name}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            {t.dateDeadline && (
                                <span className="flex items-center gap-1 text-red-400">
                                    <Clock className="w-3 h-3" />
                                    {new Date(t.dateDeadline).toLocaleDateString()}
                                </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full ${t.priority > 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'}`}>
                                Priority: {t.priority > 0 ? 'High' : 'Normal'}
                            </span>
                        </div>
                    </div>
                )}
            />
        );
    };

    const renderList = () => (
        <OdooListBase
            data={tickets.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(t) => t.id.toString()}
            columns={[
                { key: 'name', label: 'Ticket', render: (t) => <span className="font-bold">{t.name}</span> },
                { key: 'partner', label: 'Customer', render: (t) => t.partner?.name || '' },
                { key: 'stage', label: 'Stage', render: (t) => t.stage?.name || '' },
                { key: 'deadline', label: 'Deadline', render: (t) => t.dateDeadline ? new Date(t.dateDeadline).toLocaleDateString() : '' },
            ]}
        />
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full flex-wrap gap-2">
                    <div className="flex gap-2 flex-wrap">
                        {activeRecord && !taskId && (
                            <button
                                onClick={async () => {
                                    try {
                                        const result = await createTask(activeRecord.id);
                                        if (result?.taskId) {
                                            setTaskId(result.taskId);
                                            toast.success('Task created');
                                        }
                                    } catch {
                                        toast.error('Failed to create task');
                                    }
                                }}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
                            >
                                Create Task
                            </button>
                        )}
                        {activeRecord && taskId && !showTimesheetRow && (
                            <button
                                onClick={() => setShowTimesheetRow(true)}
                                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-md transition-colors"
                            >
                                Log Time
                            </button>
                        )}
                        {showTimesheetRow && taskId && activeRecord && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0.25"
                                    step="0.25"
                                    placeholder="Hours"
                                    value={timesheetHours}
                                    onChange={(e) => setTimesheetHours(e.target.value)}
                                    className="w-24 bg-white/5 border border-white/20 rounded-md px-2 py-1.5 text-white text-sm outline-none focus:border-amber-400"
                                />
                                <button
                                    onClick={async () => {
                                        const hours = parseFloat(timesheetHours);
                                        if (!hours || hours <= 0) { toast.error('Enter valid hours'); return; }
                                        try {
                                            await addTimesheet(activeRecord.id, { taskId: taskId!, hours });
                                            toast.success(`${hours}h logged`);
                                            setShowTimesheetRow(false);
                                            setTimesheetHours('');
                                        } catch {
                                            toast.error('Failed to log time');
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => { setShowTimesheetRow(false); setTimesheetHours(''); }}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-md transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex text-sm font-medium">
                        {stages.map((stage) => (
                            <button
                                key={stage.id}
                                onClick={() => {
                                    setFormData({ ...formData, stageId: stage.id });
                                    if (activeRecord) handleStageChange(activeRecord.id.toString(), stage.id.toString());
                                }}
                                className={`px-4 py-2 flex items-center border-l border-white/10 uppercase transition-colors
                        ${formData.stageId === stage.id ? 'text-primary-500 font-bold bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}
                        `}
                            >
                                {stage.name}
                            </button>
                        ))}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
                        placeholder="Ticket Subject..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    {activeRecord && (
                        <AiActionsPanel
                            entityType="HelpdeskTicket"
                            entityId={activeRecord.id}
                            agentKey="helpdesk-triage"
                        />
                    )}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Customer</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.partnerId || ''}
                                onChange={(e) => setFormData({ ...formData, partnerId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select...</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Deadline</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.dateDeadline?.split('T')[0] || ''}
                                onChange={(e) => setFormData({ ...formData, dateDeadline: new Date(e.target.value).toISOString() })}
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <label className="text-white/60 text-sm font-medium">Description</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all h-48"
                                placeholder="Ticket description..."
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            }
            rightPanels={
                activeRecord ? (
                    <ChatterPanel
                        ownerType="HelpdeskTicket"
                        ownerId={activeRecord.id}
                        showTimeline
                    />
                ) : undefined
            }
        />
    );

    return (
        <OdooViewManager
            title="Helpdesk Tickets"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('kanban')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'form']}
        >
            {currentView === 'list' && renderList()}
            {currentView === 'kanban' && renderKanban()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
