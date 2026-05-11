import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useExpensesStore, HrExpense, HrExpenseSheet } from '../stores/expensesStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { Receipt, CheckCircle, XCircle, DollarSign, FileText, BookOpen } from 'lucide-react';

type Tab = 'expenses' | 'reports';

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
    reported: { label: 'Reported', cls: 'bg-blue-500/20 text-blue-400' },
    approved: { label: 'Approved', cls: 'bg-green-500/20 text-green-400' },
    done: { label: 'Paid', cls: 'bg-emerald-500/20 text-emerald-400' },
    refused: { label: 'Refused', cls: 'bg-red-500/20 text-red-400' },
};

const PAYMENT_MODES = [
    { value: 'own_account', label: 'Employee (to reimburse)' },
    { value: 'company_account', label: 'Company' },
];

const SHEET_STATE_LABELS: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
    submitted: { label: 'Submitted', cls: 'bg-blue-500/20 text-blue-400' },
    approved: { label: 'Approved', cls: 'bg-green-500/20 text-green-400' },
    posted: { label: 'Posted', cls: 'bg-emerald-500/20 text-emerald-400' },
    refused: { label: 'Refused', cls: 'bg-red-500/20 text-red-400' },
};

export const ExpensesModule: React.FC = () => {
    const { expenses, fetchExpenses, createExpense, updateExpense, deleteExpense, approveExpense, refuseExpense, sheets, fetchSheets, createSheet, submitSheet, approveSheet, refuseSheet, postSheet, deleteSheet } = useExpensesStore();
    const { employees, fetchEmployees } = useHRStore();

    const [tab, setTab] = useState<Tab>('expenses');
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRecord, setActiveRecord] = useState<HrExpense | null>(null);
    const [formData, setFormData] = useState<Partial<HrExpense>>({
        state: 'draft',
        paymentMode: 'own_account',
        quantity: 1,
        unitAmount: 0,
        totalAmount: 0,
        date: new Date().toISOString(),
    });

    const [activeSheet, setActiveSheet] = useState<HrExpenseSheet | null>(null);
    const [sheetForm, setSheetForm] = useState<Partial<HrExpenseSheet> & { expenseIds?: number[] }>({});

    useEffect(() => {
        fetchExpenses();
        fetchSheets();
        fetchEmployees();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            state: 'draft', paymentMode: 'own_account', quantity: 1, unitAmount: 0, totalAmount: 0,
            date: new Date().toISOString(), name: 'New Expense',
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: HrExpense) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        const payload = { ...formData };
        payload.totalAmount = (payload.quantity || 1) * (payload.unitAmount || 0);
        if (activeRecord) {
            const { employee, createdAt, id, ...rest } = payload as any;
            await updateExpense(activeRecord.id, rest);
        } else {
            await createExpense(payload);
        }
        setCurrentView('list');
    };

    const handleDelete = async () => {
        if (!activeRecord) return;
        if (window.confirm('Delete this expense?')) {
            await deleteExpense(activeRecord.id);
            setCurrentView('list');
        }
    };

    const filteredExpenses = expenses.filter(e => {
        const term = searchTerm.toLowerCase();
        return (e.name?.toLowerCase().includes(term) || e.employee?.name?.toLowerCase().includes(term));
    });

    const renderStateBadge = (state: string) => {
        const s = STATE_LABELS[state] || STATE_LABELS.draft;
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${s.cls}`}>{s.label}</span>;
    };

    const renderDashboardCards = () => {
        const totalAmount = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
        const approved = expenses.filter(e => e.state === 'approved' || e.state === 'done');
        const approvedAmount = approved.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
        const pending = expenses.filter(e => e.state === 'draft' || e.state === 'reported').length;
        const cards = [
            { label: 'Total Expenses', value: `$${totalAmount.toLocaleString()}`, color: 'from-blue-500 to-cyan-500' },
            { label: 'Approved Amount', value: `$${approvedAmount.toLocaleString()}`, color: 'from-green-500 to-emerald-500' },
            { label: 'Pending', value: pending, color: 'from-amber-500 to-yellow-500' },
            { label: 'Total Records', value: expenses.length, color: 'from-amber-500 to-secondary-500' },
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
                data={filteredExpenses}
                onRowClick={handleRowClick}
                keyExtractor={(t) => t.id.toString()}
                columns={[
                    { key: 'name', label: 'Description', render: (t) => <span className="font-bold">{t.name}</span> },
                    { key: 'employee', label: 'Employee', render: (t) => t.employee?.name || '—' },
                    { key: 'date', label: 'Date', render: (t) => new Date(t.date).toLocaleDateString() },
                    { key: 'totalAmount', label: 'Amount', render: (t) => <span className="font-mono">${t.totalAmount.toFixed(2)}</span> },
                    { key: 'paymentMode', label: 'Paid By', render: (t) => PAYMENT_MODES.find(p => p.value === t.paymentMode)?.label || t.paymentMode },
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
                        {activeRecord && formData.state !== 'approved' && formData.state !== 'done' && formData.state !== 'refused' && (
                            <>
                                <button onClick={async () => { await approveExpense(activeRecord.id); setFormData(p => ({ ...p, state: 'approved' })); }}
                                    className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-green-500/30 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={async () => { await refuseExpense(activeRecord.id); setFormData(p => ({ ...p, state: 'refused' })); }}
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
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
                        placeholder="Expense description..."
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
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all appearance-none"
                                value={formData.employeeId || ''}
                                onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}>
                                <option value="">Select employee...</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Date</label>
                            <input type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.date ? formData.date.slice(0, 10) : ''}
                                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Unit Price</label>
                            <input type="number" min={0} step={0.01}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.unitAmount || 0}
                                onChange={(e) => {
                                    const unitAmount = parseFloat(e.target.value);
                                    setFormData({ ...formData, unitAmount, totalAmount: unitAmount * (formData.quantity || 1) });
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Quantity</label>
                            <input type="number" min={1} step={1}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.quantity || 1}
                                onChange={(e) => {
                                    const quantity = parseFloat(e.target.value);
                                    setFormData({ ...formData, quantity, totalAmount: quantity * (formData.unitAmount || 0) });
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Paid By</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all appearance-none"
                                value={formData.paymentMode || 'own_account'}
                                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}>
                                {PAYMENT_MODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-white/60 text-sm font-medium">Description</label>
                        <textarea
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-500 transition-all resize-none"
                            placeholder="Expense details..."
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
                            <DollarSign className="w-5 h-5 text-green-400" /> Total
                        </h3>
                        <div className="text-4xl font-bold text-white mb-4">
                            ${((formData.quantity || 1) * (formData.unitAmount || 0)).toFixed(2)}
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-white/60">Payment Mode</span>
                                <span className="text-white font-medium">{PAYMENT_MODES.find(p => p.value === formData.paymentMode)?.label || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Status</span>
                                {renderStateBadge(formData.state || 'draft')}
                            </div>
                        </div>
                    </div>

                    {formData.receipt && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-amber-400" /> Receipt
                            </h3>
                            <a href={formData.receipt} target="_blank" rel="noreferrer" className="text-primary-500 underline text-sm">
                                View attached receipt
                            </a>
                        </div>
                    )}
                </div>
            }
        />
    );

    // ── Expense Reports (Sheets) ───────────────────────────────────────────────

    const handleNewSheet = () => {
        setActiveSheet(null);
        setSheetForm({ state: 'draft', paymentMode: 'own_account', name: 'New Expense Report', expenseIds: [] });
        setCurrentView('form');
    };

    const handleSheetRowClick = (s: HrExpenseSheet) => { setActiveSheet(s); setSheetForm(s); setCurrentView('form'); };

    const handleSaveSheet = async () => {
        const { employee, expenses: _exps, ...rest } = sheetForm as any;
        if (activeSheet) {
            const { expenseIds: _ids, ...updateRest } = rest;
            await useExpensesStore.getState().updateSheet(activeSheet.id, updateRest);
        } else {
            await createSheet(rest);
        }
        setCurrentView('list');
    };

    const filteredSheets = sheets.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderSheetStateBadge = (state: string) => {
        const s = SHEET_STATE_LABELS[state] || SHEET_STATE_LABELS.draft;
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${s.cls}`}>{s.label}</span>;
    };

    const renderSheetList = () => (
        <>
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Reports</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{sheets.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Pending Approval</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">{sheets.filter(s => s.state === 'submitted').length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Posted to GL</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{sheets.filter(s => s.state === 'posted').length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Amount</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-secondary-500 bg-clip-text text-transparent">${sheets.reduce((s, r) => s + r.totalAmount, 0).toLocaleString()}</p></div>
            </div>
            <OdooListBase data={filteredSheets} onRowClick={handleSheetRowClick} keyExtractor={s => s.id.toString()} columns={[
                { key: 'name', label: 'Report', render: s => <span className="font-bold">{s.name}</span> },
                { key: 'employee', label: 'Employee', render: s => s.employee?.name || '—' },
                { key: 'totalAmount', label: 'Total', render: s => <span className="font-bold text-green-400">${s.totalAmount.toFixed(2)}</span> },
                { key: 'paymentMode', label: 'Payment', render: s => s.paymentMode === 'own_account' ? 'Reimburse' : 'Company' },
                { key: 'state', label: 'Status', render: s => renderSheetStateBadge(s.state) },
                { key: 'accountMoveId', label: 'Journal Entry', render: s => s.accountMoveId ? <span className="text-green-400">#{s.accountMoveId}</span> : '—' },
            ]} />
        </>
    );

    const renderSheetForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {activeSheet && sheetForm.state === 'draft' && (
                            <button onClick={async () => { await submitSheet(activeSheet.id); setSheetForm(p => ({ ...p, state: 'submitted' })); }}
                                className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-1.5 rounded text-sm border border-blue-500/30 flex items-center gap-1">
                                <FileText className="w-4 h-4" /> Submit
                            </button>
                        )}
                        {activeSheet && sheetForm.state === 'submitted' && (
                            <>
                                <button onClick={async () => { await approveSheet(activeSheet.id); setSheetForm(p => ({ ...p, state: 'approved' })); }}
                                    className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm border border-green-500/30 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={async () => { await refuseSheet(activeSheet.id); setSheetForm(p => ({ ...p, state: 'refused' })); }}
                                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Refuse
                                </button>
                            </>
                        )}
                        {activeSheet && sheetForm.state === 'approved' && (
                            <button onClick={async () => { await postSheet(activeSheet.id); setSheetForm(p => ({ ...p, state: 'posted' })); }}
                                className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-4 py-1.5 rounded text-sm border border-emerald-500/30 flex items-center gap-1">
                                <BookOpen className="w-4 h-4" /> Post to GL
                            </button>
                        )}
                        {renderSheetStateBadge(sheetForm.state || 'draft')}
                    </div>
                    {activeSheet && <button onClick={async () => { if (window.confirm('Delete report?')) { await deleteSheet(activeSheet.id); setCurrentView('list'); } }} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Delete</button>}
                </div>
            }
            headerContent={<input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent outline-none focus:border-primary-500 w-full" placeholder="Expense report name..." value={sheetForm.name || ''} onChange={e => setSheetForm({ ...sheetForm, name: e.target.value })} />}
            leftPanels={
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2"><label className="text-white/60 text-sm">Employee</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={sheetForm.employeeId || ''} onChange={e => setSheetForm({ ...sheetForm, employeeId: parseInt(e.target.value) })}>
                            <option value="">Select...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Payment Mode</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={sheetForm.paymentMode || 'own_account'} onChange={e => setSheetForm({ ...sheetForm, paymentMode: e.target.value })}>
                            <option value="own_account">Employee (reimburse)</option><option value="company">Company</option>
                        </select>
                    </div>
                    {/* Expenses attached to this sheet */}
                    {activeSheet?.expenses?.length ? (
                        <div className="col-span-2 space-y-2">
                            <label className="text-white/60 text-sm">Expenses</label>
                            <div className="space-y-2">
                                {activeSheet.expenses.map(exp => (
                                    <div key={exp.id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm">
                                        <span className="text-white">{exp.name}</span>
                                        <span className="text-green-400 font-mono">${exp.totalAmount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Report Summary</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Total</span><span className="text-green-400 font-bold font-mono">${(sheetForm.totalAmount || activeSheet?.totalAmount || 0).toFixed(2)}</span></div>
                        {activeSheet?.accountMoveId && <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Journal Entry</span><span className="text-white">#{activeSheet.accountMoveId}</span></div>}
                        <div className="flex justify-between"><span className="text-white/60">Status</span>{renderSheetStateBadge(sheetForm.state || 'draft')}</div>
                    </div>
                </div>
            }
        />
    );

    // ── Tab routing ────────────────────────────────────────────────────────────

    const handleTabChange = (t: Tab) => { setTab(t); setCurrentView('list'); setSearchTerm(''); };
    const handleNewForTab = () => { if (tab === 'expenses') handleNew(); else handleNewSheet(); };
    const handleSaveForTab = () => { if (tab === 'expenses') handleSave(); else handleSaveSheet(); };

    return (
        <OdooViewManager
            title="Expenses"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNewForTab}
            onSave={handleSaveForTab}
            onDiscard={() => setCurrentView('list')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['list', 'form']}
        >
            {currentView === 'list' && (
                <>
                    <div className="flex gap-1 mb-6 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
                        {[{ id: 'expenses', label: 'Expenses', icon: Receipt }, { id: 'reports', label: 'Expense Reports', icon: FileText }].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => handleTabChange(id as Tab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-primary-500 text-white' : 'text-white/60 hover:text-white'}`}>
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </div>
                    {tab === 'expenses' && renderList()}
                    {tab === 'reports' && renderSheetList()}
                </>
            )}
            {currentView === 'form' && tab === 'expenses' && renderForm()}
            {currentView === 'form' && tab === 'reports' && renderSheetForm()}
        </OdooViewManager>
    );
};
