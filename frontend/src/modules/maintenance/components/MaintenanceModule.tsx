import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useMaintenanceStore, MaintenanceRequest } from '../stores/maintenanceStore';
import { Wrench, ShieldAlert, Cpu } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';

const STAGES = [
    { id: 'new', label: 'New Request' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'repaired', label: 'Repaired / Done' },
    { id: 'scrap', label: 'Scrap' }
] as const;

export const MaintenanceModule: React.FC = () => {
    const {
        requests,
        equipment,
        fetchRequests,
        fetchEquipment,
        createRequest,
        updateRequest
    } = useMaintenanceStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<MaintenanceRequest | null>(null);
    const [formData, setFormData] = useState<Partial<MaintenanceRequest>>({
        stage: 'new',
        maintenanceType: 'corrective',
        priority: 0
    });

    useEffect(() => {
        fetchRequests();
        fetchEquipment();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            stage: 'new',
            maintenanceType: 'corrective',
            priority: 0,
            name: 'New Maintenance Request'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: MaintenanceRequest) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateRequest(activeRecord.id, formData);
        } else {
            const req = await createRequest(formData);
            if (req) setActiveRecord(req);
        }
        setCurrentView('kanban');
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const reqId = parseInt(draggableId);
        const newStage = destination.droppableId;
        await updateRequest(reqId, { stage: newStage });
    };

    const filteredRequests = requests.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderKanban = () => (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-[calc(100vh-180px)] overflow-x-auto pb-4 pt-4">
                {STAGES.map(stage => {
                    const stageRequests = filteredRequests.filter(r => r.stage === stage.id);
                    return (
                        <div key={stage.id} className="min-w-[320px] max-w-[320px] flex flex-col bg-black/20 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-medium mb-4 flex items-center justify-between">
                                {stage.label}
                                <span className="bg-white/10 text-white/70 text-xs py-0.5 px-2 rounded-full">
                                    {stageRequests.length}
                                </span>
                            </h3>

                            <Droppable droppableId={stage.id}>
                                {(provided: DroppableProvided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 space-y-3 overflow-y-auto min-h-[150px]">
                                        {stageRequests.map((req, index) => (
                                            <Draggable key={req.id.toString()} draggableId={req.id.toString()} index={index}>
                                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => handleRowClick(req)}
                                                        className={`bg-white/5 border border-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-all ${snapshot.isDragging ? 'shadow-2xl shadow-primary-purple/20 ring-1 ring-primary-purple' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="text-white font-medium line-clamp-2">{req.name}</h4>
                                                        </div>
                                                        {req.equipment && (
                                                            <div className="flex items-center gap-1.5 text-blue-400 text-xs mb-3 bg-blue-500/10 w-fit px-2 py-1 rounded">
                                                                <Cpu className="w-3 h-3" />
                                                                {req.equipment.name}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between text-xs text-white/50">
                                                            <div className="flex items-center gap-1">
                                                                <span className="uppercase">{req.maintenanceType}</span>
                                                            </div>
                                                            <div className="flex gap-1 items-center">
                                                                {req.priority > 0 && <span className="text-yellow-500">{'★'.repeat(req.priority)}</span>}
                                                            </div>
                                                        </div>
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
        <OdooListBase
            data={filteredRequests}
            onRowClick={handleRowClick}
            keyExtractor={(t) => t.id.toString()}
            columns={[
                { key: 'name', label: 'Request', render: (t) => <span className="font-bold">{t.name}</span> },
                { key: 'equipment', label: 'Equipment', render: (t) => t.equipment?.name || '-' },
                { key: 'type', label: 'Type', render: (t) => <span className="capitalize">{t.maintenanceType}</span> },
                { key: 'date', label: 'Request Date', render: (t) => new Date(t.requestDate).toLocaleDateString() },
                {
                    key: 'stage', label: 'Stage', render: (t) => (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                        ${t.stage === 'repaired' ? 'bg-green-500/20 text-green-400' :
                                t.stage === 'scrap' ? 'bg-red-500/20 text-red-500' :
                                    t.stage === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-white/10 text-white/60'}
                    `}>
                            {t.stage.replace('_', ' ')}
                        </span>
                    )
                },
            ]}
        />
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex space-x-2">
                    {STAGES.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => {
                                setFormData({ ...formData, stage: s.id });
                                if (activeRecord) updateRequest(activeRecord.id, { stage: s.id });
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.stage === s.id
                                ? 'bg-primary-purple text-white shadow-lg'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2 w-full">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Maintenance Request Name..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Equipment</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.equipmentId || ''}
                                onChange={(e) => setFormData({ ...formData, equipmentId: parseInt(e.target.value) || null })}
                            >
                                <option value="" className="bg-gray-900 text-white/50">Select Equipment...</option>
                                {equipment.map(eq => (
                                    <option key={eq.id} value={eq.id} className="bg-gray-900">{eq.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Maintenance Type</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.maintenanceType || 'corrective'}
                                onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                            >
                                <option value="corrective" className="bg-gray-900">Corrective</option>
                                <option value="preventive" className="bg-gray-900">Preventive</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-white/60 text-sm font-medium">Description</label>
                        <textarea
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-purple transition-all resize-none"
                            placeholder="Detail the issue or the preventive task..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-yellow-500" />
                            Priority
                        </h3>
                        <div className="flex gap-2 text-2xl">
                            {[1, 2, 3].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: star === formData.priority ? 0 : star })}
                                    className={`transition-colors ${star <= (formData.priority || 0) ? 'text-yellow-500' : 'text-white/20 hover:text-white/40'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-gray-400" />
                            Dates
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-white/60 text-xs font-medium uppercase">Request Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary-purple transition-all text-sm font-medium"
                                    value={formData.requestDate ? new Date(formData.requestDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                                    onChange={(e) => setFormData({ ...formData, requestDate: new Date(e.target.value).toISOString() })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Maintenance"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('kanban')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'form']}
        >
            {currentView === 'kanban' && renderKanban()}
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
