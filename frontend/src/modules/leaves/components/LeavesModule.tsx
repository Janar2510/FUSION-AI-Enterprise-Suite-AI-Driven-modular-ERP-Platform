import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useLeavesStore, HrLeave, HrLeaveType, HrLeaveAllocation } from '../stores/leavesStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { CalendarOff, CheckCircle, XCircle, Clock, Tag, Users } from 'lucide-react';

const LEGACY_LEAVE_TYPES = [
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

type Tab = 'requests' | 'allocations' | 'types';

export const LeavesModule: React.FC = () => {
    const {
        leaves, fetchLeaves, createLeave, updateLeave, deleteLeave, approveLeave, refuseLeave,
        leaveTypes, fetchLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType,
        allocations, fetchAllocations, createAllocation, updateAllocation, approveAllocation, refuseAllocation, deleteAllocation,
    } = useLeavesStore();
    const { employees, fetchEmployees } = useHRStore();

    const [tab, setTab] = useState<Tab>('requests');
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    // Leave request form state
    const [activeLeave, setActiveLeave] = useState<HrLeave | null>(null);
    const [leaveForm, setLeaveForm] = useState<Partial<HrLeave>>({});

    // Leave type form state
    const [activeType, setActiveType] = useState<HrLeaveType | null>(null);
    const [typeForm, setTypeForm] = useState<Partial<HrLeaveType>>({});

    // Allocation form state
    const [activeAlloc, setActiveAlloc] = useState<HrLeaveAllocation | null>(null);
    const [allocForm, setAllocForm] = useState<Partial<HrLeaveAllocation>>({});

    useEffect(() => {
        fetchLeaves();
        fetchLeaveTypes();
        fetchAllocations();
        fetchEmployees();
    }, []);

    const renderStateBadge = (state: string) => {
        const s = STATE_LABELS[state] || STATE_LABELS.draft;
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${s.cls}`}>{s.label}</span>;
    };

    // ── Requests ──────────────────────────────────────────────────────────────

    const handleNewLeave = () => {
        setActiveLeave(null);
        setLeaveForm({ state: 'draft', leaveType: 'legal', numberOfDays: 1, dateFrom: new Date().toISOString(), dateTo: new Date(Date.now() + 86400000).toISOString(), name: 'New Leave Request' });
        setCurrentView('form');
    };

    const handleLeaveRowClick = (record: HrLeave) => {
        setActiveLeave(record);
        setLeaveForm(record);
        setCurrentView('form');
    };

    const handleSaveLeave = async () => {
        const { employee, createdAt, id, hrLeaveType, ...rest } = leaveForm as any;
        if (activeLeave) await updateLeave(activeLeave.id, rest);
        else await createLeave(rest);
        setCurrentView('list');
    };

    const handleDeleteLeave = async () => {
        if (!activeLeave || !window.confirm('Delete this leave request?')) return;
        await deleteLeave(activeLeave.id);
        setCurrentView('list');
    };

    const filteredLeaves = leaves.filter(l => {
        const t = searchTerm.toLowerCase();
        return (l.name?.toLowerCase().includes(t) || l.employee?.name?.toLowerCase().includes(t) || l.leaveType?.toLowerCase().includes(t));
    });

    const renderLeaveList = () => (
        <>
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total', value: leaves.length, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Approved', value: leaves.filter(l => l.state === 'validate').length, color: 'from-green-500 to-emerald-500' },
                    { label: 'Pending', value: leaves.filter(l => l.state === 'draft' || l.state === 'confirm').length, color: 'from-amber-500 to-yellow-500' },
                    { label: 'Refused', value: leaves.filter(l => l.state === 'refuse').length, color: 'from-red-500 to-pink-500' },
                ].map(c => (
                    <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <p className="text-white/50 text-sm mb-1">{c.label}</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</p>
                    </div>
                ))}
            </div>
            <OdooListBase
                data={filteredLeaves}
                onRowClick={handleLeaveRowClick}
                keyExtractor={t => t.id.toString()}
                columns={[
                    { key: 'name', label: 'Description', render: t => <span className="font-bold">{t.name || '—'}</span> },
                    { key: 'employee', label: 'Employee', render: t => t.employee?.name || '—' },
                    { key: 'leaveType', label: 'Type', render: t => LEGACY_LEAVE_TYPES.find(lt => lt.value === t.leaveType)?.label || t.leaveType },
                    { key: 'dateFrom', label: 'From', render: t => new Date(t.dateFrom).toLocaleDateString() },
                    { key: 'dateTo', label: 'To', render: t => new Date(t.dateTo).toLocaleDateString() },
                    { key: 'numberOfDays', label: 'Days', render: t => t.numberOfDays },
                    { key: 'state', label: 'Status', render: t => renderStateBadge(t.state) },
                ]}
            />
        </>
    );

    const renderLeaveForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {activeLeave && leaveForm.state !== 'validate' && leaveForm.state !== 'refuse' && (
                            <>
                                <button onClick={async () => { await approveLeave(activeLeave.id); setLeaveForm(p => ({ ...p, state: 'validate' })); }}
                                    className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-green-500/30 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={async () => { await refuseLeave(activeLeave.id); setLeaveForm(p => ({ ...p, state: 'refuse' })); }}
                                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Refuse
                                </button>
                            </>
                        )}
                        {activeLeave && renderStateBadge(leaveForm.state || 'draft')}
                    </div>
                    {activeLeave && (
                        <button onClick={handleDeleteLeave} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">Delete</button>
                    )}
                </div>
            }
            headerContent={
                <input type="text"
                    className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                    placeholder="Leave description..."
                    value={leaveForm.name || ''}
                    onChange={e => setLeaveForm({ ...leaveForm, name: e.target.value })}
                />
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Employee</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple appearance-none"
                                value={leaveForm.employeeId || ''}
                                onChange={e => setLeaveForm({ ...leaveForm, employeeId: parseInt(e.target.value) })}>
                                <option value="">Select employee...</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Leave Type</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple appearance-none"
                                value={leaveForm.leaveType || 'legal'}
                                onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}>
                                {LEGACY_LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">From</label>
                            <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple"
                                value={leaveForm.dateFrom ? leaveForm.dateFrom.slice(0, 10) : ''}
                                onChange={e => setLeaveForm({ ...leaveForm, dateFrom: new Date(e.target.value).toISOString() })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">To</label>
                            <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple"
                                value={leaveForm.dateTo ? leaveForm.dateTo.slice(0, 10) : ''}
                                onChange={e => setLeaveForm({ ...leaveForm, dateTo: new Date(e.target.value).toISOString() })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Number of Days</label>
                            <input type="number" min={0.5} step={0.5} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple"
                                value={leaveForm.numberOfDays || 1}
                                onChange={e => setLeaveForm({ ...leaveForm, numberOfDays: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-white/60 text-sm font-medium">Notes</label>
                        <textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-purple resize-none"
                            placeholder="Any additional notes..."
                            value={leaveForm.notes || ''}
                            onChange={e => setLeaveForm({ ...leaveForm, notes: e.target.value })} />
                    </div>
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <CalendarOff className="w-5 h-5 text-amber-400" /> Summary
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-white/60">Type</span>
                            <span className="text-white font-medium">{LEGACY_LEAVE_TYPES.find(lt => lt.value === leaveForm.leaveType)?.label || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-white/60">Duration</span>
                            <span className="text-white font-medium">{leaveForm.numberOfDays || 0} day(s)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/60">Status</span>
                            {renderStateBadge(leaveForm.state || 'draft')}
                        </div>
                    </div>
                </div>
            }
        />
    );

    // ── Allocations ────────────────────────────────────────────────────────────

    const handleNewAlloc = () => {
        setActiveAlloc(null);
        setAllocForm({ state: 'draft', numberOfDays: 0, name: 'New Allocation' });
        setCurrentView('form');
    };

    const handleAllocRowClick = (r: HrLeaveAllocation) => {
        setActiveAlloc(r);
        setAllocForm(r);
        setCurrentView('form');
    };

    const handleSaveAlloc = async () => {
        const { employee, leaveType, createdAt, id, ...rest } = allocForm as any;
        if (activeAlloc) await updateAllocation(activeAlloc.id, rest);
        else await createAllocation(rest);
        setCurrentView('list');
    };

    const filteredAllocs = allocations.filter(a => {
        const t = searchTerm.toLowerCase();
        return (a.name?.toLowerCase().includes(t) || a.employee?.name?.toLowerCase().includes(t) || a.leaveType?.name?.toLowerCase().includes(t));
    });

    const renderAllocList = () => (
        <OdooListBase
            data={filteredAllocs}
            onRowClick={handleAllocRowClick}
            keyExtractor={a => a.id.toString()}
            columns={[
                { key: 'name', label: 'Description', render: a => <span className="font-bold">{a.name || '—'}</span> },
                { key: 'employee', label: 'Employee', render: a => a.employee?.name || '—' },
                { key: 'leaveType', label: 'Leave Type', render: a => a.leaveType?.name || '—' },
                { key: 'numberOfDays', label: 'Days Allocated', render: a => <span className="font-bold text-green-400">{a.numberOfDays}</span> },
                { key: 'state', label: 'Status', render: a => renderStateBadge(a.state) },
            ]}
        />
    );

    const renderAllocForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {activeAlloc && allocForm.state !== 'validate' && allocForm.state !== 'refuse' && (
                            <>
                                <button onClick={async () => { await approveAllocation(activeAlloc.id); setAllocForm(p => ({ ...p, state: 'validate' })); }}
                                    className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-green-500/30 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={async () => { await refuseAllocation(activeAlloc.id); setAllocForm(p => ({ ...p, state: 'refuse' })); }}
                                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Refuse
                                </button>
                            </>
                        )}
                        {activeAlloc && renderStateBadge(allocForm.state || 'draft')}
                    </div>
                    {activeAlloc && (
                        <button onClick={async () => { if (window.confirm('Delete?')) { await deleteAllocation(activeAlloc.id); setCurrentView('list'); } }}
                            className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Delete</button>
                    )}
                </div>
            }
            headerContent={
                <input type="text"
                    className="text-4xl font-bold bg-transparent text-white border-b border-transparent outline-none focus:border-primary-purple w-full"
                    placeholder="Allocation description..."
                    value={allocForm.name || ''}
                    onChange={e => setAllocForm({ ...allocForm, name: e.target.value })} />
            }
            leftPanels={
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Employee</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none"
                            value={allocForm.employeeId || ''}
                            onChange={e => setAllocForm({ ...allocForm, employeeId: parseInt(e.target.value) })}>
                            <option value="">Select employee...</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Leave Type</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none"
                            value={allocForm.leaveTypeId || ''}
                            onChange={e => setAllocForm({ ...allocForm, leaveTypeId: parseInt(e.target.value) })}>
                            <option value="">Select type...</option>
                            {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Days Allocated</label>
                        <input type="number" min={0} step={0.5} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                            value={allocForm.numberOfDays || 0}
                            onChange={e => setAllocForm({ ...allocForm, numberOfDays: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Valid From</label>
                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                            value={allocForm.dateFrom ? allocForm.dateFrom.slice(0, 10) : ''}
                            onChange={e => setAllocForm({ ...allocForm, dateFrom: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Expires</label>
                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                            value={allocForm.dateTo ? allocForm.dateTo.slice(0, 10) : ''}
                            onChange={e => setAllocForm({ ...allocForm, dateTo: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" /> Allocation Summary
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-white/60">Days</span>
                            <span className="text-green-400 font-bold">{allocForm.numberOfDays || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/60">Status</span>
                            {renderStateBadge(allocForm.state || 'draft')}
                        </div>
                    </div>
                </div>
            }
        />
    );

    // ── Leave Types ────────────────────────────────────────────────────────────

    const handleNewType = () => {
        setActiveType(null);
        setTypeForm({ name: 'New Leave Type', color: 'blue', allocationMode: 'fixed', validationMode: 'manager', maxAllowance: 0, isCarryover: false, requireAttachment: false });
        setCurrentView('form');
    };

    const handleTypeRowClick = (r: HrLeaveType) => {
        setActiveType(r);
        setTypeForm(r);
        setCurrentView('form');
    };

    const handleSaveType = async () => {
        const { leaves, allocations: _allocs, ...rest } = typeForm as any;
        if (activeType) await updateLeaveType(activeType.id, rest);
        else await createLeaveType(rest);
        setCurrentView('list');
    };

    const filteredTypes = leaveTypes.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderTypeList = () => (
        <OdooListBase
            data={filteredTypes}
            onRowClick={handleTypeRowClick}
            keyExtractor={t => t.id.toString()}
            columns={[
                { key: 'name', label: 'Name', render: t => <span className="font-bold">{t.name}</span> },
                { key: 'allocationMode', label: 'Allocation', render: t => t.allocationMode },
                { key: 'validationMode', label: 'Validation', render: t => t.validationMode },
                { key: 'maxAllowance', label: 'Max Days', render: t => t.maxAllowance === 0 ? 'Unlimited' : t.maxAllowance },
                { key: 'isCarryover', label: 'Carry Over', render: t => t.isCarryover ? <span className="text-green-400">Yes</span> : <span className="text-white/40">No</span> },
            ]}
        />
    );

    const renderTypeForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex justify-end w-full">
                    {activeType && (
                        <button onClick={async () => { if (window.confirm('Archive this leave type?')) { await deleteLeaveType(activeType.id); setCurrentView('list'); } }}
                            className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Archive</button>
                    )}
                </div>
            }
            headerContent={
                <input type="text"
                    className="text-4xl font-bold bg-transparent text-white border-b border-transparent outline-none focus:border-primary-purple w-full"
                    placeholder="Leave type name..."
                    value={typeForm.name || ''}
                    onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} />
            }
            leftPanels={
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Allocation Mode</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none"
                            value={typeForm.allocationMode || 'fixed'}
                            onChange={e => setTypeForm({ ...typeForm, allocationMode: e.target.value })}>
                            <option value="fixed">Fixed by HR</option>
                            <option value="request">Employee Request</option>
                            <option value="no">No Allocation</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Approval</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none"
                            value={typeForm.validationMode || 'manager'}
                            onChange={e => setTypeForm({ ...typeForm, validationMode: e.target.value })}>
                            <option value="no_validation">No Validation</option>
                            <option value="manager">Manager Approval</option>
                            <option value="both">HR + Manager</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Max Allowance (days, 0 = unlimited)</label>
                        <input type="number" min={0} step={1} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                            value={typeForm.maxAllowance ?? 0}
                            onChange={e => setTypeForm({ ...typeForm, maxAllowance: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-4 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded"
                                checked={typeForm.isCarryover || false}
                                onChange={e => setTypeForm({ ...typeForm, isCarryover: e.target.checked })} />
                            <span className="text-white/80 text-sm">Allow carry-over to next year</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded"
                                checked={typeForm.requireAttachment || false}
                                onChange={e => setTypeForm({ ...typeForm, requireAttachment: e.target.checked })} />
                            <span className="text-white/80 text-sm">Require supporting document</span>
                        </label>
                    </div>
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-purple-400" /> Leave Type Info
                    </h3>
                    <div className="space-y-3 text-sm text-white/60">
                        <p>Allocation mode controls who creates allocations: <strong className="text-white">Fixed</strong> = HR team; <strong className="text-white">Request</strong> = employees submit requests.</p>
                        <p>Approval controls who signs off on leave requests for this type.</p>
                    </div>
                </div>
            }
        />
    );

    // ── Tab switching ──────────────────────────────────────────────────────────

    const handleTabChange = (newTab: Tab) => {
        setTab(newTab);
        setCurrentView('list');
        setSearchTerm('');
    };

    const handleNew = () => {
        if (tab === 'requests') handleNewLeave();
        else if (tab === 'allocations') handleNewAlloc();
        else handleNewType();
    };

    const handleSave = () => {
        if (tab === 'requests') handleSaveLeave();
        else if (tab === 'allocations') handleSaveAlloc();
        else handleSaveType();
    };

    const renderTabBar = () => (
        <div className="flex gap-1 mb-6 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
            {[
                { id: 'requests', label: 'Requests', icon: CalendarOff },
                { id: 'allocations', label: 'Allocations', icon: Users },
                { id: 'types', label: 'Leave Types', icon: Tag },
            ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => handleTabChange(id as Tab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-primary-purple text-white' : 'text-white/60 hover:text-white'}`}>
                    <Icon className="w-4 h-4" /> {label}
                </button>
            ))}
        </div>
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
            {currentView === 'list' && (
                <>
                    {renderTabBar()}
                    {tab === 'requests' && renderLeaveList()}
                    {tab === 'allocations' && renderAllocList()}
                    {tab === 'types' && renderTypeList()}
                </>
            )}
            {currentView === 'form' && tab === 'requests' && renderLeaveForm()}
            {currentView === 'form' && tab === 'allocations' && renderAllocForm()}
            {currentView === 'form' && tab === 'types' && renderTypeForm()}
        </OdooViewManager>
    );
};
