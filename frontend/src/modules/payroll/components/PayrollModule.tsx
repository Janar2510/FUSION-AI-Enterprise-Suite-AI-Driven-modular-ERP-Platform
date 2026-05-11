import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { usePayrollStore, HrPayslip } from '../stores/payrollStore';
import { useContractsStore, HrContract } from '../stores/contractsStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { CheckCircle, DollarSign, FileText, CreditCard, ChevronRight } from 'lucide-react';
import { ChatterPanel } from '@/components/shared/ChatterPanel';
import { AiActionsPanel } from '@/components/shared/AiActionsPanel';

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
    verify: { label: 'Waiting', cls: 'bg-blue-500/20 text-blue-400' },
    done: { label: 'Confirmed', cls: 'bg-green-500/20 text-green-400' },
    paid: { label: 'Paid', cls: 'bg-amber-500/20 text-amber-400' },
    cancel: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-400' },
};

const CONTRACT_STATE_LABELS: Record<string, { label: string; cls: string }> = {
    new: { label: 'New', cls: 'bg-gray-500/20 text-gray-400' },
    open: { label: 'Running', cls: 'bg-green-500/20 text-green-400' },
    close: { label: 'Expired', cls: 'bg-amber-500/20 text-amber-400' },
    cancel: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-400' },
};

type Tab = 'payslips' | 'contracts';

export const PayrollModule: React.FC = () => {
    const { payslips, fetch, create, update, remove, confirm, pay } = usePayrollStore();
    const { contracts, fetch: fetchContracts, create: createContract, update: updateContract, open: openContract, close: closeContract, remove: removeContract } = useContractsStore();
    const { employees, fetchEmployees } = useHRStore();

    const [tab, setTab] = useState<Tab>('payslips');
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    // Payslip form
    const [activePayslip, setActivePayslip] = useState<HrPayslip | null>(null);
    const [payslipForm, setPayslipForm] = useState<Partial<HrPayslip>>({ state: 'draft', basicWage: 0, grossSalary: 0, netSalary: 0, deductions: 0 });

    // Contract form
    const [activeContract, setActiveContract] = useState<HrContract | null>(null);
    const [contractForm, setContractForm] = useState<Partial<HrContract>>({});

    useEffect(() => { fetch(); fetchContracts(); fetchEmployees(); }, []);

    const renderBadge = (state: string, map: Record<string, { label: string; cls: string }>) => {
        const s = map[state] || map.draft || map.new;
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${s?.cls}`}>{s?.label}</span>;
    };

    // ── Payslips ───────────────────────────────────────────────────────────────

    const handleNewPayslip = () => {
        setActivePayslip(null);
        setPayslipForm({ state: 'draft', name: `SLIP/${new Date().getFullYear()}/${String(payslips.length + 1).padStart(3, '0')}`, dateFrom: new Date().toISOString(), dateTo: new Date().toISOString(), basicWage: 0, grossSalary: 0, netSalary: 0, deductions: 0 });
        setCurrentView('form');
    };

    const handlePayslipRowClick = (r: HrPayslip) => { setActivePayslip(r); setPayslipForm(r); setCurrentView('form'); };

    const handleSavePayslip = async () => {
        const { employee, createdAt, id, ...rest } = payslipForm as any;
        rest.grossSalary = rest.basicWage || 0;
        rest.netSalary = (rest.basicWage || 0) - (rest.deductions || 0);
        if (activePayslip) await update(activePayslip.id, rest); else await create(rest);
        setCurrentView('list');
    };

    // When an employee is selected, auto-fill wage from their active contract
    const handlePayslipEmployeeChange = async (employeeId: number) => {
        const activeContracts = contracts.filter(c => c.employeeId === employeeId && c.state === 'open');
        const wage = activeContracts.length > 0 ? activeContracts[0].wage : 0;
        setPayslipForm(p => ({ ...p, employeeId, basicWage: wage, grossSalary: wage, netSalary: wage - (p.deductions || 0) }));
    };

    const filteredPayslips = payslips.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalNet = payslips.reduce((s, p) => s + (p.netSalary || 0), 0);

    const renderPayslipList = () => (
        <>
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Payslips</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{payslips.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Net Salary</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">${totalNet.toLocaleString()}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Draft</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">{payslips.filter(p => p.state === 'draft').length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Confirmed</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-secondary-500 bg-clip-text text-transparent">{payslips.filter(p => p.state === 'done').length}</p></div>
            </div>
            <OdooListBase data={filteredPayslips} onRowClick={handlePayslipRowClick} keyExtractor={t => t.id.toString()} columns={[
                { key: 'name', label: 'Reference', render: t => <span className="font-bold font-mono">{t.name}</span> },
                { key: 'employee', label: 'Employee', render: t => t.employee?.name || '—' },
                { key: 'dateFrom', label: 'Period', render: t => `${new Date(t.dateFrom).toLocaleDateString()} — ${new Date(t.dateTo).toLocaleDateString()}` },
                { key: 'grossSalary', label: 'Gross', render: t => `$${t.grossSalary.toFixed(2)}` },
                { key: 'deductions', label: 'Deductions', render: t => `$${t.deductions.toFixed(2)}` },
                { key: 'netSalary', label: 'Net', render: t => <span className="font-bold text-green-400">${t.netSalary.toFixed(2)}</span> },
                { key: 'state', label: 'Status', render: t => renderBadge(t.state, STATE_LABELS) },
            ]} />
        </>
    );

    const renderPayslipForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        {activePayslip && payslipForm.state === 'draft' && (
                            <button onClick={async () => { await confirm(activePayslip.id); setPayslipForm(p => ({ ...p, state: 'done' })); }}
                                className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm border border-green-500/30 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Confirm
                            </button>
                        )}
                        {activePayslip && payslipForm.state === 'done' && (
                            <button onClick={async () => { await pay(activePayslip.id); setPayslipForm(p => ({ ...p, state: 'paid' })); }}
                                className="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white px-4 py-1.5 rounded text-sm border border-amber-500/30 flex items-center gap-1">
                                <CreditCard className="w-4 h-4" /> Register Payment
                            </button>
                        )}
                        {renderBadge(payslipForm.state || 'draft', STATE_LABELS)}
                        <div className="flex text-xs font-medium ml-4">
                            {['draft', 'done', 'paid'].map((s, idx) => (
                                <div key={s} className="flex items-center">
                                    <span className={`px-3 py-1 uppercase ${payslipForm.state === s ? 'text-primary-500 font-bold' : 'text-white/30'}`}>{s === 'done' ? 'Confirmed' : s}</span>
                                    {idx < 2 && <ChevronRight className="w-4 h-4 text-white/20" />}
                                </div>
                            ))}
                        </div>
                    </div>
                    {activePayslip && <button onClick={async () => { if (window.confirm('Delete?')) { await remove(activePayslip.id); setCurrentView('list'); } }} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Delete</button>}
                </div>
            }
            headerContent={<input type="text" className="text-4xl font-bold bg-transparent text-white font-mono border-b border-transparent outline-none focus:border-primary-500 w-full" value={payslipForm.name || ''} onChange={e => setPayslipForm({ ...payslipForm, name: e.target.value })} />}
            leftPanels={
                <div className="space-y-6"><div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2"><label className="text-white/60 text-sm">Employee</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none"
                            value={payslipForm.employeeId || ''}
                            onChange={e => handlePayslipEmployeeChange(parseInt(e.target.value))}>
                            <option value="">Select...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Basic Wage</label><input type="number" step={100} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={payslipForm.basicWage || 0} onChange={e => { const v = parseFloat(e.target.value); setPayslipForm({ ...payslipForm, basicWage: v, grossSalary: v, netSalary: v - (payslipForm.deductions || 0) }); }} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Period From</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={payslipForm.dateFrom ? payslipForm.dateFrom.slice(0, 10) : ''} onChange={e => setPayslipForm({ ...payslipForm, dateFrom: new Date(e.target.value).toISOString() })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Period To</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={payslipForm.dateTo ? payslipForm.dateTo.slice(0, 10) : ''} onChange={e => setPayslipForm({ ...payslipForm, dateTo: new Date(e.target.value).toISOString() })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Deductions</label><input type="number" step={50} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={payslipForm.deductions || 0} onChange={e => { const v = parseFloat(e.target.value); setPayslipForm({ ...payslipForm, deductions: v, netSalary: (payslipForm.basicWage || 0) - v }); }} /></div>
                </div></div>
            }
            rightPanels={
                <div className="space-y-4">
                    {activePayslip && (
                        <>
                            <AiActionsPanel entityType="HrPayslip" entityId={String(activePayslip.id)} />
                            <ChatterPanel ownerType="HrPayslip" ownerId={activePayslip.id} showTimeline />
                        </>
                    )}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Salary Breakdown</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Basic Wage</span><span className="text-white font-mono">${(payslipForm.basicWage || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Deductions</span><span className="text-red-400 font-mono">-${(payslipForm.deductions || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between pt-1"><span className="text-white font-bold">Net Salary</span><span className="text-green-400 font-bold font-mono text-lg">${((payslipForm.basicWage || 0) - (payslipForm.deductions || 0)).toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            }
        />
    );

    // ── Contracts ──────────────────────────────────────────────────────────────

    const handleNewContract = () => {
        setActiveContract(null);
        setContractForm({ state: 'new', contractType: 'employee', dateStart: new Date().toISOString(), wage: 0 });
        setCurrentView('form');
    };

    const handleContractRowClick = (r: HrContract) => { setActiveContract(r); setContractForm(r); setCurrentView('form'); };

    const handleSaveContract = async () => {
        const { employee, createdAt, id, ...rest } = contractForm as any;
        if (activeContract) await updateContract(activeContract.id, rest); else await createContract(rest);
        setCurrentView('list');
    };

    const filteredContracts = contracts.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const runningContracts = contracts.filter(c => c.state === 'open');

    const renderContractList = () => (
        <>
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{contracts.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Running</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{runningContracts.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">New</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">{contracts.filter(c => c.state === 'new').length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Payroll</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-secondary-500 bg-clip-text text-transparent">${runningContracts.reduce((s, c) => s + c.wage, 0).toLocaleString()}</p></div>
            </div>
            <OdooListBase data={filteredContracts} onRowClick={handleContractRowClick} keyExtractor={c => c.id.toString()} columns={[
                { key: 'name', label: 'Contract', render: c => <span className="font-bold">{c.name}</span> },
                { key: 'employee', label: 'Employee', render: c => c.employee?.name || '—' },
                { key: 'contractType', label: 'Type', render: c => c.contractType },
                { key: 'dateStart', label: 'Start', render: c => new Date(c.dateStart).toLocaleDateString() },
                { key: 'dateEnd', label: 'End', render: c => c.dateEnd ? new Date(c.dateEnd).toLocaleDateString() : 'Open-ended' },
                { key: 'wage', label: 'Wage', render: c => <span className="font-bold text-green-400">${c.wage.toLocaleString()}</span> },
                { key: 'state', label: 'Status', render: c => renderBadge(c.state, CONTRACT_STATE_LABELS) },
            ]} />
        </>
    );

    const renderContractForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {activeContract && contractForm.state === 'new' && (
                            <button onClick={async () => { await openContract(activeContract.id); setContractForm(p => ({ ...p, state: 'open' })); }}
                                className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm border border-green-500/30 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Set Running
                            </button>
                        )}
                        {activeContract && contractForm.state === 'open' && (
                            <button onClick={async () => { await closeContract(activeContract.id); setContractForm(p => ({ ...p, state: 'close' })); }}
                                className="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white px-4 py-1.5 rounded text-sm border border-amber-500/30">
                                Archive
                            </button>
                        )}
                        {renderBadge(contractForm.state || 'new', CONTRACT_STATE_LABELS)}
                    </div>
                    {activeContract && <button onClick={async () => { if (window.confirm('Delete this contract?')) { await removeContract(activeContract.id); setCurrentView('list'); } }} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Delete</button>}
                </div>
            }
            headerContent={
                <input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent outline-none focus:border-primary-500 w-full"
                    placeholder="Contract name..."
                    value={contractForm.name || ''} onChange={e => setContractForm({ ...contractForm, name: e.target.value })} />
            }
            leftPanels={
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2"><label className="text-white/60 text-sm">Employee</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none"
                            value={contractForm.employeeId || ''}
                            onChange={e => setContractForm({ ...contractForm, employeeId: parseInt(e.target.value) })}>
                            <option value="">Select...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Contract Type</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none"
                            value={contractForm.contractType || 'employee'}
                            onChange={e => setContractForm({ ...contractForm, contractType: e.target.value })}>
                            <option value="employee">Employee</option>
                            <option value="worker">Worker</option>
                            <option value="freelance">Freelance</option>
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Wage / Month</label>
                        <input type="number" step={100} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                            value={contractForm.wage || 0} onChange={e => setContractForm({ ...contractForm, wage: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Start Date</label>
                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                            value={contractForm.dateStart ? contractForm.dateStart.slice(0, 10) : ''}
                            onChange={e => setContractForm({ ...contractForm, dateStart: new Date(e.target.value).toISOString() })} />
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">End Date (leave blank = open-ended)</label>
                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                            value={contractForm.dateEnd ? contractForm.dateEnd.slice(0, 10) : ''}
                            onChange={e => setContractForm({ ...contractForm, dateEnd: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Trial End Date</label>
                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                            value={contractForm.trialDateEnd ? contractForm.trialDateEnd.slice(0, 10) : ''}
                            onChange={e => setContractForm({ ...contractForm, trialDateEnd: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <label className="text-white/60 text-sm">Notes</label>
                        <textarea className="w-full h-28 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-500 resize-none"
                            value={contractForm.notes || ''}
                            onChange={e => setContractForm({ ...contractForm, notes: e.target.value })} />
                    </div>
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /> Contract Summary</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Monthly Wage</span><span className="text-green-400 font-bold font-mono">${(contractForm.wage || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Annual Salary</span><span className="text-white font-mono">${((contractForm.wage || 0) * 12).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Status</span>{renderBadge(contractForm.state || 'new', CONTRACT_STATE_LABELS)}</div>
                    </div>
                </div>
            }
        />
    );

    // ── Tab routing ────────────────────────────────────────────────────────────

    const handleTabChange = (newTab: Tab) => { setTab(newTab); setCurrentView('list'); setSearchTerm(''); };

    const handleNew = () => { if (tab === 'payslips') handleNewPayslip(); else handleNewContract(); };
    const handleSave = () => { if (tab === 'payslips') handleSavePayslip(); else handleSaveContract(); };

    return (
        <OdooViewManager title="Payroll" currentView={currentView} onViewChange={setCurrentView} onNew={handleNew} onSave={handleSave} onDiscard={() => setCurrentView('list')} searchTerm={searchTerm} onSearchChange={setSearchTerm} viewsAvailable={['list', 'form']}>
            {currentView === 'list' && (
                <>
                    <div className="flex gap-1 mb-6 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
                        {[
                            { id: 'payslips', label: 'Payslips', icon: DollarSign },
                            { id: 'contracts', label: 'Contracts', icon: FileText },
                        ].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => handleTabChange(id as Tab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-primary-500 text-white' : 'text-white/60 hover:text-white'}`}>
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </div>
                    {tab === 'payslips' && renderPayslipList()}
                    {tab === 'contracts' && renderContractList()}
                </>
            )}
            {currentView === 'form' && tab === 'payslips' && renderPayslipForm()}
            {currentView === 'form' && tab === 'contracts' && renderContractForm()}
        </OdooViewManager>
    );
};
