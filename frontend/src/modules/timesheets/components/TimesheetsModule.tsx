import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useTimesheetsStore, TimesheetEntry } from '../stores/timesheetsStore';
import { useProjectStore } from '@/modules/project/stores/projectStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { ChatterPanel } from '@/components/shared/ChatterPanel';
import { AiActionsPanel } from '@/components/shared/AiActionsPanel';

export const TimesheetsModule: React.FC = () => {
    const {
        timesheets,
        fetchTimesheets,
        createTimesheet,
        updateTimesheet,
        deleteTimesheet
    } = useTimesheetsStore();

    const { projects, tasks, fetchProjects, fetchTasks } = useProjectStore();
    const { employees, fetchEmployees } = useHRStore();

    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<TimesheetEntry | null>(null);
    const [formData, setFormData] = useState<Partial<TimesheetEntry>>({});

    useEffect(() => {
        fetchTimesheets();
        fetchProjects();
        fetchEmployees();
    }, []);

    // When project changes, fetch its tasks
    useEffect(() => {
        if (formData.projectId) {
            fetchTasks(formData.projectId);
        }
    }, [formData.projectId]);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            date: new Date().toISOString(),
            unitAmount: 0
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: TimesheetEntry) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateTimesheet(activeRecord.id, formData);
        } else {
            const newEntry = await createTimesheet(formData);
            if (newEntry) setActiveRecord(newEntry);
        }
        setCurrentView('list');
    };

    const handleDelete = async () => {
        if (activeRecord) {
            if (window.confirm('Delete this timesheet entry?')) {
                await deleteTimesheet(activeRecord.id);
                setCurrentView('list');
            }
        }
    };

    // --------------------------------------------------------------------------
    // LIST VIEW
    // --------------------------------------------------------------------------
    const renderList = () => (
        <OdooListBase
            data={timesheets.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(t) => t.id.toString()}
            columns={[
                { key: 'date', label: 'Date', render: (t) => t.date ? new Date(t.date).toLocaleDateString() : '' },
                { key: 'employee', label: 'Employee', render: (t) => t.employee?.name || '' },
                { key: 'project', label: 'Project', render: (t) => t.project?.name || '' },
                { key: 'task', label: 'Task', render: (t) => t.task?.name || '' },
                { key: 'name', label: 'Description', render: (t) => t.name || '' },
                { key: 'unitAmount', label: 'Hours', render: (t) => <span className="font-bold">{t.unitAmount?.toFixed(2) || '0.00'}</span> },
                { key: 'isBillable', label: 'Billable', render: (t) => t.isBillable ? <span className="text-green-400 text-xs font-medium">● Billable</span> : <span className="text-white/30 text-xs">Non-billable</span> },
            ]}
        />
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={<div className="h-4"></div>}
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Description..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Date</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.date?.split('T')[0] || ''}
                                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Employee</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.employeeId || ''}
                                onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id} className="text-black">{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Project</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.projectId || ''}
                                onChange={(e) => setFormData({ ...formData, projectId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Task</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                disabled={!formData.projectId}
                                value={formData.taskId || ''}
                                onChange={(e) => setFormData({ ...formData, taskId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select...</option>
                                {tasks.map(t => (
                                    <option key={t.id} value={t.id} className="text-black">{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Duration (Hours)</label>
                            <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all font-mono"
                                value={formData.unitAmount || 0}
                                onChange={(e) => setFormData({ ...formData, unitAmount: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-white/60 text-sm font-medium mb-2">Billable</label>
                            <button
                                onClick={() => setFormData({ ...formData, isBillable: !formData.isBillable })}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.isBillable ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
                            >
                                {formData.isBillable ? '✓ Billable' : 'Non-Billable'}
                            </button>
                        </div>
                    </div>

                    {activeRecord && (
                        <div className="pt-8 border-t border-white/10 mt-8">
                            <button
                                onClick={handleDelete}
                                className="text-white hover:text-red-400 bg-white/5 hover:bg-red-500/10 transition-colors px-4 py-2 rounded-md font-medium"
                            >
                                Delete Entry
                            </button>
                        </div>
                    )}
                </div>
            }
            rightPanels={
                <div className="space-y-4">
                    {activeRecord && (
                        <AiActionsPanel
                            entityType="HrTimesheet"
                            entityId={String(activeRecord.id)}
                        />
                    )}
                    {activeRecord && (
                        <ChatterPanel
                            ownerType="HrTimesheet"
                            ownerId={activeRecord.id}
                            showTimeline
                        />
                    )}
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Timesheets"
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
