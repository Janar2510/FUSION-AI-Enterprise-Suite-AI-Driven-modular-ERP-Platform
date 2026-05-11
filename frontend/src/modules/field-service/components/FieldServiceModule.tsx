import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useFieldServiceStore, FsTask } from '../stores/fieldServiceStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';

export const FieldServiceModule: React.FC = () => {
    const {
        tasks,
        fetchTasks,
        createTask,
        updateTask
    } = useFieldServiceStore();

    const { partners, fetchPartners } = usePartnerStore();
    const { employees, fetchEmployees } = useHRStore();

    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<FsTask | null>(null);
    const [formData, setFormData] = useState<Partial<FsTask>>({
        state: 'new',
        priority: 0,
    });

    useEffect(() => {
        fetchTasks();
        fetchPartners();
        fetchEmployees();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            state: 'new',
            priority: 0,
            scheduledDate: new Date().toISOString(),
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: FsTask) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateTask(activeRecord.id, formData);
        } else {
            const newTask = await createTask(formData);
            if (newTask) setActiveRecord(newTask);
        }
        setCurrentView('list');
    };

    const handleAction = async (newState: string) => {
        if (!activeRecord) return;
        await updateTask(activeRecord.id, { ...formData, state: newState });
        setActiveRecord({ ...activeRecord, state: newState });
        setFormData({ ...formData, state: newState });
    };

    const renderList = () => (
        <OdooListBase
            data={tasks.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(t) => t.id.toString()}
            columns={[
                { key: 'name', label: 'Task Name', render: (t) => <span className="font-bold">{t.name}</span> },
                { key: 'partner', label: 'Customer', render: (t) => t.partner?.name || '' },
                { key: 'employee', label: 'Assigned To', render: (t) => t.employee?.name || '' },
                { key: 'scheduled', label: 'Scheduled', render: (t) => t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString() : '' },
                {
                    key: 'state', label: 'Status', render: (t) => (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                        ${t.state === 'new' ? 'bg-white/10 text-white/60' :
                                t.state === 'planned' ? 'bg-blue-500/20 text-blue-400' :
                                    t.state === 'done' ? 'bg-green-500/20 text-green-400' :
                                        'bg-red-500/20 text-red-400'}
                    `}>
                            {t.state}
                        </span>
                    )
                },
            ]}
        />
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {formData.state === 'new' && <button onClick={() => handleAction('planned')} className="bg-primary-500 hover:bg-primary-500/80 text-white px-4 py-1.5 rounded text-sm transition-colors">Mark as Planned</button>}
                        {formData.state === 'planned' && <button onClick={() => handleAction('done')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Mark as Done</button>}
                        {formData.state !== 'done' && formData.state !== 'cancelled' && <button onClick={() => handleAction('cancelled')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-sm transition-colors">Cancel</button>}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
                        placeholder="Task Title..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
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
                            <label className="text-white/60 text-sm font-medium">Assigned Employee</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.employeeId || ''}
                                onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Unassigned</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id} className="text-black">{e.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-white/10">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Street</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.street || ''}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">City</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Scheduled Date</label>
                        <input
                            type="datetime-local"
                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                            value={formData.scheduledDate ? new Date(formData.scheduledDate).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setFormData({ ...formData, scheduledDate: new Date(e.target.value).toISOString() })}
                        />
                    </div>

                    <div className="space-y-2 pt-4">
                        <label className="text-white/60 text-sm font-medium">Description</label>
                        <textarea
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all resize-none"
                            placeholder="Add task details here..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Field Service Tasks"
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
