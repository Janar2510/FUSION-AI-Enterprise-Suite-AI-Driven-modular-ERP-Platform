import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useLeavesStore, HrLeave } from '../stores/leavesStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { CalendarOff, CheckCircle, XCircle } from 'lucide-react';

const LEAVE_TYPES = [
    { value: 'legal', label: 'Legal / Annual' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'compensatory', label: 'Compensatory' },
    { value: 'unpaid', label: 'Unpaid' },
];

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
    confirm: { label: 'Confirmed', cls: 'bg-blue-500/20 text-blue-400' },
    validate: { label: 'Approved', cls: 'bg-green-500/20 text-green-400' },
    refuse: { label: 'Refused', cls: 'bg-red-500/20 text-red-400' },
};

export const LeavesModule: React.FC = () => {
    const { leaves, fetchLeaves, createLeave, updateLeave, deleteLeave, approveLeave, refuseLeave } = useLeavesStore();
    const { employees, fetchEmployees } = useHRStore();

    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRecord, setActiveRecord] = useState<HrLeave | null>(null);
    const [formData, setFormData] = useState<Partial<HrLeave>>({
        state: 'draft',
        leaveType: 'legal',
        numberOfDays: 1,
        dateFrom: new Date().toISOString(),
        dateTo: new Date(Date.now() + 86400000).toISOString(),
    });

    useEffect(() => {
        fetchLeaves();
        fetchEmployees();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            state: 'draft', leaveType: 'legal', numberOfDays: 1,
            dateFrom: new Date().toISOString(),
            dateTo: new Date(Date.now() + 86400000).toISOString(),
            name: 'New Leave Request',
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: HrLeave) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            const { employee, createdAt, id, ...rest } = formData as any;
            await updateLeave(activeRecord.id, rest);
        } else {
            await createLeave(formData);
        }
        setCurrentView('list');
    };

    const handleDelete = async () => {
        if (!activeRecord) return;
        if (window.confirm('Delete this leave request?')) {
            await deleteLeave(activeRecord.id);
            setCurrentView('list');
        }
    };

    const filteredLeaves = leaves.filter(l => {
        const term = searchTerm.toLowerCase();
        return (l.name?.toLowerCase().includes(term) || l.employee?.name?.toLowerCase().includes(term) || l.leaveType?.toLowerCase().includes(term));
    });

    const renderStateBadge = (state: string) => {
        const s = STATE_LABELS[state] || STATE_LABELS.draft;
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${s.cls}`}>{s.label}</span>;
    };

    const renderDashboardCards = () => {
        const approved = leaves.filter(l => l.state === 'validate').length;
        const pending = leaves.filter(l => l.state === 'draft' || l.state === 'confirm').length;
        const refused = leaves.filter(l => l.state === 'refuse').length;
        const cards = [
            { label: 'Total Requests', value: leaves.length, color: 'from-blue-500 to-cyan-500' },
            { label: 'Approved', value: approved, color: 'from-green-500 to-emerald-500' },
            { label: 'Pending', value: pending, color: 'from-amber-500 to-yellow-500' },
            { label: 'Refused', value: refused, color: 'from-red-500 to-pink-500' },
        ];
        return (
            <div className="grid grid-cols-4 gap-4 mb-6">
                {cards.map(c => (
                    <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <p className="text-white/50 text-sm mb-1">{c.label}</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</p>
                    </div>
                ))}
            </div>
        );
    };

    const renderList = () => (
        <>
            {renderDashboardCards()}
            <OdooListBase
                data={filteredLeaves}
                onRowClick={handleRowClick}
                keyExtractor={(t) => t.id.toString()}
                columns={[
                    { key: 'name', label: 'Description', render: (t) => <span className="font-bold">{t.name || '—'}</span> },
                    { key: 'employee', label: 'Employee', render: (t) => t.employee?.name || '—' },
                    { key: 'leaveType', label: 'Type', render: (t) => LEAVE_TYPES.find(lt => lt.value === t.leaveType)?.label || t.leaveType },
                    { key: 'dateFrom', label: 'From', render: (t) => new Date(t.dateFrom).toLocaleDateString() },
                    { key: 'dateTo', label: 'To', render: (t) => new Date(t.dateTo).toLocaleDateString() },
                    { key: 'numberOfDays', label: 'Days', render: (t) => t.numberOfDays },
                    { key: 'state', label: 'Status', render: (t) => renderStateBadge(t.state) },
                ]}
            />
        </>
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {activeRecord && formData.state !== 'validate' && formData.state !== 'refuse' && (
                            <>
                                <button onClick={async () => { await approveLeave(activeRecord.id); setFormData(p => ({ ...p, state: 'validate' })); }}
                                    className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-green-500/30 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={async () => { await refuseLeave(activeRecord.id); setFormData(p => ({ ...p, state: 'refuse' })); }}
                                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Refuse
                                </button>
                            </>
                        )}
                        {activeRecord && renderStateBadge(formData.state || 'draft')}
                    </div>
                    {activeRecord && (
                        <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">
                            Delete
                        </button>
                    )}
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Leave description..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Employee</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all appearance-none"
                                value={formData.employeeId || ''}
                                onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}>
                                <option value="">Select employee...</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Leave Type</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all appearance-none"
                                value={formData.leaveType || 'legal'}
                                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}>
                                {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">From</label>
                            <input type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.dateFrom ? formData.dateFrom.slice(0, 10) : ''}
                                onChange={(e) => setFormData({ ...formData, dateFrom: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">To</label>
                            <input type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.dateTo ? formData.dateTo.slice(0, 10) : ''}
                                onChange={(e) => setFormData({ ...formData, dateTo: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Number of Days</label>
                            <input type="number" min={0.5} step={0.5}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.numberOfDays || 1}
                                onChange={(e) => setFormData({ ...formData, numberOfDays: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-white/60 text-sm font-medium">Notes</label>
                        <textarea
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-purple transition-all resize-none"
                            placeholder="Any additional notes..."
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <CalendarOff className="w-5 h-5 text-amber-400" /> Summary
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-white/60">Type</span>
                                <span className="text-white font-medium">{LEAVE_TYPES.find(lt => lt.value === formData.leaveType)?.label || '—'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-white/60">Duration</span>
                                <span className="text-white font-medium">{formData.numberOfDays || 0} day(s)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Status</span>
                                {renderStateBadge(formData.state || 'draft')}
                            </div>
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Time Off"
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
