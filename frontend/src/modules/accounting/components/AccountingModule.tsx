import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooDataGrid } from '@/components/shared/OdooDataGrid';
import { useAccountingStore, AccountMove, AccountMoveLine } from '../stores/accountingStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { useInventoryStore } from '@/modules/inventory/stores/inventoryStore';
import { ChevronRight, TrendingUp, TrendingDown, DollarSign, FileText, BookOpen, PackageOpen, BarChart3, Landmark, CheckCircle2, XCircle, RefreshCw, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { MetricGrid } from '@/components/shared/MetricCard';
import { GlassCard } from '@/components/shared/GlassCard';
import { ChatterPanel } from '@/components/shared/ChatterPanel';
import { AiActionsPanel } from '@/components/shared/AiActionsPanel';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

type AccountingTab = 'out_invoice' | 'in_invoice' | 'entry' | 'reports' | 'bank';

export const AccountingModule: React.FC = () => {
    const {
        moves,
        journals,
        accounts,
        fetchMoves,
        fetchJournals,
        fetchAccounts,
        createMove,
        updateMove,
        postMove,
        registerPayment,
    } = useAccountingStore();

    const { partners, fetchPartners } = usePartnerStore();
    const { products, fetchAllProducts } = useInventoryStore();

    const [activeTab, setActiveTab] = useState<AccountingTab>('out_invoice');
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [activeRecord, setActiveRecord] = useState<AccountMove | null>(null);
    const [formData, setFormData] = useState<Partial<AccountMove>>({});
    const [lines, setLines] = useState<AccountMoveLine[]>([]);

    useEffect(() => {
        fetchJournals();
        fetchAccounts();
        fetchPartners();
        fetchAllProducts();
    }, []);

    useEffect(() => {
        fetchMoves(activeTab);
    }, [activeTab]);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            moveType: activeTab,
            state: 'draft',
            paymentState: 'not_paid',
            partnerId: undefined,
            journalId: journals.length > 0 ? journals[0].id : undefined,
            amountUntaxed: 0,
            amountTax: 0,
            amountTotal: 0,
            date: new Date().toISOString()
        });
        setLines([]);
        setCurrentView('form');
    };

    const handleRowClick = (move: AccountMove) => {
        setActiveRecord(move);
        setFormData(move);
        setLines(move.lines || []);
        setCurrentView('form');
    };

    const calculateTotals = (currentLines: AccountMoveLine[]) => {
        let amountUntaxed = formData.amountUntaxed || 0;
        let amountTax = formData.amountTax || 0;
        let amountTotal = formData.amountTotal || 0;

        if (['out_invoice', 'in_invoice'].includes(activeTab)) {
            amountUntaxed = currentLines.reduce((sum, line) => sum + ((line.quantity || 0) * (line.priceUnit || 0)), 0);
            amountTax = amountUntaxed * 0.20; // 20% VAT default — actual rate applied server-side via computeTotalsFromDb()
            amountTotal = amountUntaxed + amountTax;
        }

        setFormData(prev => ({
            ...prev,
            amountUntaxed,
            amountTax,
            amountTotal
        }));
    };

    const handleAddLine = () => {
        const newLine: AccountMoveLine = {
            name: '',
            quantity: 1,
            priceUnit: 0,
            priceSubtotal: 0,
            priceTotal: 0,
            debit: 0,
            credit: 0,
            balance: 0,
            accountId: null,
            productId: null
        };
        const newLines = [...lines, newLine];
        setLines(newLines);
        calculateTotals(newLines);
    };

    const handleRowChange = (index: number, updatedRow: AccountMoveLine) => {
        const newLines = [...lines];

        // Recalculate line subtotal if it's an invoice
        if (['out_invoice', 'in_invoice'].includes(activeTab)) {
            const qty = Number(updatedRow.quantity) || 0;
            const price = Number(updatedRow.priceUnit) || 0;
            updatedRow.priceSubtotal = qty * price;
            updatedRow.priceTotal = qty * price * 1.15; // with tax

            // Auto-fill price if product changes
            if (updatedRow.productId !== newLines[index].productId) {
                const prod = products.find(p => p.id === updatedRow.productId);
                if (prod) {
                    updatedRow.name = prod.name;
                    updatedRow.priceUnit = activeTab === 'out_invoice' ? prod.salePrice : prod.costPrice;
                    updatedRow.priceSubtotal = (updatedRow.quantity || 1) * updatedRow.priceUnit;
                }
            }
        } else {
            // Journal entry logic
            const debit = Number(updatedRow.debit) || 0;
            const credit = Number(updatedRow.credit) || 0;
            updatedRow.debit = debit;
            updatedRow.credit = credit;
            updatedRow.balance = debit - credit;
        }

        newLines[index] = updatedRow;
        setLines(newLines);
        calculateTotals(newLines);
    };

    const handleRemoveLine = (index: number) => {
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
        calculateTotals(newLines);
    };

    const handleSave = async () => {
        const payload = { ...formData, lines };

        try {
            if (activeRecord) {
                await updateMove(activeRecord.id, payload);
            } else {
                const newMove = await createMove(payload);
                if (newMove) setActiveRecord(newMove);
            }
            setCurrentView('list');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to save entry.', { position: 'bottom-center' });
        }
    };

    const handlePost = async () => {
        if (!activeRecord) return;
        try {
            await postMove(activeRecord.id);
            toast.success('Entry posted successfully!', { position: 'bottom-center' });
            setCurrentView('list');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || useAccountingStore.getState().error || 'Failed to post entry.', { position: 'bottom-center' });
        }
    };

    const handleRegisterPayment = async () => {
        if (!activeRecord) return;
        try {
            await registerPayment(activeRecord.id);
            toast.success('Payment registered successfully!', { position: 'bottom-center' });
            setCurrentView('list');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to register payment.', { position: 'bottom-center' });
        }
    };

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'draft': return 'bg-gray-500/20 text-gray-400';
            case 'posted': return 'bg-blue-500/20 text-blue-400';
            case 'cancel': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getGridColumns = () => {
        if (['out_invoice', 'in_invoice'].includes(activeTab)) {
            return [
                {
                    key: 'productId',
                    label: 'Product',
                    type: 'select' as const,
                    width: '25%',
                    options: products.map(p => ({ value: p.id, label: p.name }))
                },
                { key: 'name', label: 'Label', type: 'string' as const, width: '30%' },
                { key: 'quantity', label: 'Quantity', type: 'number' as const, width: '15%', align: 'right' as const },
                { key: 'priceUnit', label: 'Price', type: 'number' as const, width: '15%', align: 'right' as const },
                {
                    key: 'priceSubtotal',
                    label: 'Subtotal',
                    type: 'number' as const,
                    width: '15%',
                    align: 'right' as const,
                    editable: false,
                    format: (val: any) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                }
            ];
        } else {
            return [
                {
                    key: 'accountId',
                    label: 'Account',
                    type: 'select' as const,
                    width: '35%',
                    options: accounts.map(a => ({ value: a.id, label: `${a.code} ${a.name}` }))
                },
                { key: 'name', label: 'Label', type: 'string' as const, width: '35%' },
                { key: 'debit', label: 'Debit', type: 'number' as const, width: '15%', align: 'right' as const },
                { key: 'credit', label: 'Credit', type: 'number' as const, width: '15%', align: 'right' as const }
            ];
        }
    };

    return (
        <OdooViewManager
            title={currentView === 'dashboard' ? 'Accounting Dashboard' : activeTab === 'out_invoice' ? 'Customer Invoices' : activeTab === 'in_invoice' ? 'Vendor Bills' : 'Journal Entries'}
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('list')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['dashboard', 'list', 'form']}
        >
            {currentView !== 'dashboard' && (
                <div className="flex gap-4 border-b border-white/10 mb-6 px-4">
                    {[
                        { id: 'out_invoice', label: 'Customer Invoices' },
                        { id: 'in_invoice', label: 'Vendor Bills' },
                        { id: 'entry', label: 'Journal Entries' },
                        { id: 'reports', label: '📊 Reports' },
                        { id: 'bank', label: '🏦 Bank' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`pb - 3 px - 2 font - medium transition - colors border - b - 2 ${activeTab === tab.id ? 'border-primary-500 text-primary-500' : 'border-transparent text-white/60 hover:text-white'
                                } `}
                            onClick={() => {
                                setActiveTab(tab.id as AccountingTab);
                                setCurrentView('list');
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {currentView === 'dashboard' && (
                <div className="space-y-6">
                    <MetricGrid
                        metrics={[
                            {
                                title: 'Total Receivables',
                                value: `$${moves.filter(m => m.moveType === 'out_invoice' && m.state === 'posted' && m.paymentState !== 'paid').reduce((sum, m) => sum + (m.amountTotal || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                icon: TrendingUp,
                                color: 'text-green-400',
                            },
                            {
                                title: 'Total Payables',
                                value: `$${moves.filter(m => m.moveType === 'in_invoice' && m.state === 'posted' && m.paymentState !== 'paid').reduce((sum, m) => sum + (m.amountTotal || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                icon: TrendingDown,
                                color: 'text-red-400',
                            },
                            {
                                title: 'Bank Balance',
                                value: '$0.00',
                                icon: DollarSign,
                                color: 'text-blue-400',
                            },
                            {
                                title: 'Unposted Operations',
                                value: moves.filter(m => m.state === 'draft').length,
                                icon: FileText,
                                color: 'text-yellow-400',
                            }
                        ]}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Customer Invoices */}
                        <GlassCard className="p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => { setActiveTab('out_invoice'); setCurrentView('list'); }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="heading-3 text-white font-bold text-xl">Customer Invoices</h3>
                                    <p className="text-white/60 text-sm mt-1">{moves.filter(m => m.moveType === 'out_invoice').length} total invoices</p>
                                </div>
                                <div className="p-3 bg-blue-500/20 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                            <div className="flex items-center text-blue-400 text-sm font-medium mt-4">
                                View Invoices <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </GlassCard>

                        {/* Vendor Bills */}
                        <GlassCard className="p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => { setActiveTab('in_invoice'); setCurrentView('list'); }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="heading-3 text-white font-bold text-xl">Vendor Bills</h3>
                                    <p className="text-white/60 text-sm mt-1">{moves.filter(m => m.moveType === 'in_invoice').length} total bills</p>
                                </div>
                                <div className="p-3 bg-pink-500/20 rounded-lg">
                                    <PackageOpen className="w-6 h-6 text-pink-400" />
                                </div>
                            </div>
                            <div className="flex items-center text-pink-400 text-sm font-medium mt-4">
                                View Bills <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </GlassCard>

                        {/* Journal Entries */}
                        <GlassCard className="p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => { setActiveTab('entry'); setCurrentView('list'); }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="heading-3 text-white font-bold text-xl">Miscellaneous Operations</h3>
                                    <p className="text-white/60 text-sm mt-1">{moves.filter(m => m.moveType === 'entry').length} journal entries</p>
                                </div>
                                <div className="p-3 bg-amber-500/20 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-amber-400" />
                                </div>
                            </div>
                            <div className="flex items-center text-amber-400 text-sm font-medium mt-4">
                                View Operations <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            {currentView === 'list' && (
                <OdooListBase
                    data={moves.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                    onRowClick={handleRowClick}
                    keyExtractor={(m) => m.id.toString()}
                    columns={[
                        { key: 'name', label: 'Number', render: (m) => <span className="font-bold">{m.name}</span> },
                        { key: 'date', label: 'Date', render: (m) => new Date(m.date).toLocaleDateString() },
                        { key: 'partner', label: activeTab === 'out_invoice' ? 'Customer' : activeTab === 'in_invoice' ? 'Vendor' : 'Partner', render: (m) => m.partner?.name || '-' },
                        {
                            key: 'amountTotal',
                            label: 'Total',
                            render: (m) => <span className="font-medium text-white/90">${m.amountTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        },
                        {
                            key: 'state',
                            label: 'Status',
                            render: (m) => (
                                <span className={`px - 2 py - 1 rounded - full text - xs font - medium uppercase ${getStatusColor(m.state)} `}>
                                    {m.state}
                                </span>
                            )
                        },
                        {
                            key: 'paymentState',
                            label: 'Payment',
                            render: (m) => (
                                m.state === 'posted' && ['in_invoice', 'out_invoice'].includes(m.moveType) ? (
                                    <span className={`px - 2 py - 1 rounded - full text - xs font - medium uppercase ${m.paymentState === 'paid' ? 'bg-green-500/20 text-green-400' :
                                        m.paymentState === 'in_payment' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        } `}>
                                        {m.paymentState === 'not_paid' ? 'Not Paid' : m.paymentState}
                                    </span>
                                ) : <span />
                            )
                        }
                    ]}
                />
            )}

            {currentView === 'form' && (
                <OdooFormBase
                    statusRibbon={
                        <div className="flex items-center justify-between w-full">
                            <div className="flex gap-2">
                                {formData.state === 'draft' && activeRecord && (
                                    <button
                                        onClick={handlePost}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-orange-600 text-white font-bold rounded-md shadow-lg"
                                    >
                                        Post
                                    </button>
                                )}
                                {/* Register Payment: only for posted invoices/bills that are not yet paid */}
                                {formData.state === 'posted' &&
                                    ['out_invoice', 'in_invoice'].includes(formData.moveType || '') &&
                                    activeRecord &&
                                    activeRecord.paymentState !== 'paid' && (
                                        <button
                                            onClick={handleRegisterPayment}
                                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-md shadow-lg"
                                        >
                                            💳 Register Payment
                                        </button>
                                    )}
                            </div>

                            {/* Progress chevrons */}
                            <div className="flex text-sm font-medium">
                                {['draft', 'posted', 'paid'].map((state, idx) => {
                                    const isActive =
                                        formData.state === state ||
                                        (state === 'paid' && activeRecord?.paymentState === 'paid');
                                    const isPast =
                                        (state === 'draft' && formData.state !== 'draft') ||
                                        (state === 'posted' && activeRecord?.paymentState === 'paid');
                                    return (
                                        <div key={state} className="flex items-center relative">
                                            <div className={`px-4 py-2 flex items-center pr-6 uppercase
                                                ${isActive ? 'text-primary-500 font-bold' : isPast ? 'text-white/80' : 'text-white/40'}
                                            `}>
                                                {state === 'paid' ? 'In Payment' : state}
                                            </div>
                                            {idx < 2 && <ChevronRight className="w-5 h-5 absolute -right-2 text-white/20 z-10" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    }
                    headerContent={
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                {formData.name || 'New'}
                            </h2>
                        </div>
                    }
                    leftPanels={
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {['out_invoice', 'in_invoice'].includes(activeTab) && (
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">
                                            {activeTab === 'out_invoice' ? 'Customer' : 'Vendor'}
                                        </label>
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
                                )}
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Accounting Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                        value={formData.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Journal</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                        value={formData.journalId || ''}
                                        onChange={(e) => setFormData({ ...formData, journalId: parseInt(e.target.value) })}
                                    >
                                        <option value="" className="text-black">Select...</option>
                                        {journals.map(j => (
                                            <option key={j.id} value={j.id} className="text-black">{j.name} ({j.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Lines DataGrid */}
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-lg font-medium text-white mb-4">
                                    {activeTab === 'entry' ? 'Journal Items' : 'Invoice Lines'}
                                </h3>

                                <OdooDataGrid
                                    columns={getGridColumns()}
                                    data={lines}
                                    onRowChange={handleRowChange}
                                    onAddRow={handleAddLine}
                                    onDeleteRow={handleRemoveLine}
                                    readonly={formData.state === 'posted' || formData.state === 'cancel'}
                                />

                                {['out_invoice', 'in_invoice'].includes(activeTab) && (
                                    <div className="mt-8 flex justify-end">
                                        <div className="w-64 space-y-3">
                                            <div className="flex justify-between text-white/70">
                                                <span>Untaxed Amount:</span>
                                                <span>${formData.amountUntaxed?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-white/70">
                                                <span>Taxes:</span>
                                                <span>${formData.amountTax?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-xl font-bold text-white pt-3 border-t border-white/10">
                                                <span>Total:</span>
                                                <span>${formData.amountTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                                            </div>
                                            {activeRecord && activeRecord.paymentState === 'paid' && (
                                                <div className="flex justify-between text-green-400 font-medium">
                                                    <span>Amount Due:</span>
                                                    <span>$0.00</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'entry' && (
                                    <div className="mt-8 flex justify-end">
                                        {/* Show balanced status */}
                                        <div className="w-64 space-y-3">
                                            <div className="flex justify-between text-white/70">
                                                <span>Total Debits:</span>
                                                <span>${lines.reduce((sum, l) => sum + (l.debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-white/70">
                                                <span>Total Credits:</span>
                                                <span>${lines.reduce((sum, l) => sum + (l.credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                    rightPanels={
                        <div className="space-y-4">
                            {activeRecord && (
                                <AiActionsPanel
                                    entityType="AccountMove"
                                    entityId={String(activeRecord.id)}
                                    agentKey="invoice-anomaly"
                                />
                            )}
                            {activeRecord && (
                                <ChatterPanel
                                    ownerType="AccountMove"
                                    ownerId={activeRecord.id}
                                    showTimeline
                                />
                            )}
                        </div>
                    }
                />
            )}

            {/* ── Financial Reports Panel ─────────────────────────────── */}
            {activeTab === 'reports' && <AccountingReports />}

            {/* ── Bank Reconciliation Panel ────────────────────────────── */}
            {activeTab === 'bank' && <BankReconciliationPanel />}
        </OdooViewManager>
    );
};

// ── Accounting Reports Component ────────────────────────────────────────────
type ReportType = 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'aged-receivable';

const AccountingReports: React.FC = () => {
    const [activeReport, setActiveReport] = useState<ReportType>('profit-loss');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
    const [asOf, setAsOf] = useState(() => new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (activeReport !== 'aged-receivable') {
                if (activeReport === 'balance-sheet') { params.as_of = asOf; }
                else { params.date_from = dateFrom; params.date_to = dateTo; }
            }
            const qs = new URLSearchParams(params).toString();
            const res = await axios.get(`${API_BASE}/api/accounting/reports/${activeReport}${qs ? '?' + qs : ''}`);
            setData(res.data);
        } catch (e: any) {
            toast.error(e?.response?.data?.error?.message || 'Failed to load report');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, [activeReport]);

    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const cls = (n: number) => n < 0 ? 'text-red-400' : n > 0 ? 'text-green-400' : 'text-white/60';

    const reports: { id: ReportType; label: string }[] = [
        { id: 'profit-loss', label: 'Profit & Loss' },
        { id: 'balance-sheet', label: 'Balance Sheet' },
        { id: 'trial-balance', label: 'Trial Balance' },
        { id: 'aged-receivable', label: 'Aged Receivables' },
    ];

    return (
        <div className="px-4 space-y-6">
            {/* Report type selector */}
            <div className="flex gap-2 flex-wrap">
                {reports.map(r => (
                    <button key={r.id} onClick={() => setActiveReport(r.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeReport === r.id ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}>
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Date filters */}
            <div className="flex gap-4 items-center flex-wrap">
                {activeReport === 'balance-sheet' ? (
                    <label className="flex items-center gap-2 text-white/60 text-sm">
                        As of:
                        <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-primary-500 [&::-webkit-calendar-picker-indicator]:filter-invert" />
                    </label>
                ) : activeReport !== 'aged-receivable' ? (
                    <>
                        <label className="flex items-center gap-2 text-white/60 text-sm">
                            From: <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-primary-500 [&::-webkit-calendar-picker-indicator]:filter-invert" />
                        </label>
                        <label className="flex items-center gap-2 text-white/60 text-sm">
                            To: <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-primary-500 [&::-webkit-calendar-picker-indicator]:filter-invert" />
                        </label>
                    </>
                ) : null}
                <button onClick={fetchReport} disabled={loading}
                    className="bg-primary-500 hover:bg-primary-500/80 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40">
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            {/* Report output */}
            {loading && <div className="text-white/40 text-sm">Generating report…</div>}

            {!loading && data && activeReport === 'profit-loss' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-white font-semibold mb-3 text-lg">Income</h3>
                        <table className="w-full text-sm"><tbody>
                            {data.income.lines.map((l: any) => (
                                <tr key={l.code} className="border-b border-white/5">
                                    <td className="py-2 text-white/60">{l.code}</td>
                                    <td className="py-2 text-white px-4">{l.name}</td>
                                    <td className={`py-2 text-right font-mono ${cls(l.amount)}`}>{fmt(l.amount)}</td>
                                </tr>
                            ))}
                            <tr className="font-bold border-t border-white/20">
                                <td colSpan={2} className="py-2 text-white">Total Income</td>
                                <td className={`py-2 text-right font-mono ${cls(data.income.total)}`}>{fmt(data.income.total)}</td>
                            </tr>
                        </tbody></table>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-3 text-lg">Expenses</h3>
                        <table className="w-full text-sm"><tbody>
                            {data.expenses.lines.map((l: any) => (
                                <tr key={l.code} className="border-b border-white/5">
                                    <td className="py-2 text-white/60">{l.code}</td>
                                    <td className="py-2 text-white px-4">{l.name}</td>
                                    <td className={`py-2 text-right font-mono ${cls(l.amount)}`}>{fmt(l.amount)}</td>
                                </tr>
                            ))}
                            <tr className="font-bold border-t border-white/20">
                                <td colSpan={2} className="py-2 text-white">Total Expenses</td>
                                <td className={`py-2 text-right font-mono text-red-400`}>{fmt(data.expenses.total)}</td>
                            </tr>
                        </tbody></table>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-white font-bold text-lg">Net Income</span>
                        <span className={`text-2xl font-bold font-mono ${cls(data.netIncome)}`}>{fmt(data.netIncome)}</span>
                    </div>
                </div>
            )}

            {!loading && data && activeReport === 'trial-balance' && (
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/10 text-white/60">
                        <th className="py-2 text-left">Code</th>
                        <th className="py-2 text-left px-4">Account</th>
                        <th className="py-2 text-right">Debit</th>
                        <th className="py-2 text-right">Credit</th>
                        <th className="py-2 text-right">Balance</th>
                    </tr></thead>
                    <tbody>
                        {data.rows.map((r: any) => (
                            <tr key={r.accountId} className="border-b border-white/5">
                                <td className="py-1.5 text-white/60">{r.code}</td>
                                <td className="py-1.5 text-white px-4">{r.name}</td>
                                <td className="py-1.5 text-right font-mono text-white/80">{fmt(r.debit)}</td>
                                <td className="py-1.5 text-right font-mono text-white/80">{fmt(r.credit)}</td>
                                <td className={`py-1.5 text-right font-mono ${cls(r.balance)}`}>{fmt(r.balance)}</td>
                            </tr>
                        ))}
                        <tr className="border-t-2 border-white/20 font-bold">
                            <td colSpan={2} className="py-2 text-white">Totals</td>
                            <td className="py-2 text-right font-mono text-white">{fmt(data.totals.debit)}</td>
                            <td className="py-2 text-right font-mono text-white">{fmt(data.totals.credit)}</td>
                            <td className={`py-2 text-right font-mono ${cls(data.totals.balance)}`}>{fmt(data.totals.balance)}</td>
                        </tr>
                    </tbody>
                </table>
            )}

            {!loading && data && activeReport === 'balance-sheet' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { title: 'Assets', section: data.assets, positive: true },
                        { title: 'Liabilities', section: data.liabilities, positive: false },
                    ].map(({ title, section }) => (
                        <div key={title}>
                            <h3 className="text-white font-semibold mb-3 text-lg">{title}</h3>
                            <table className="w-full text-sm"><tbody>
                                {section.lines.map((l: any) => (
                                    <tr key={l.code} className="border-b border-white/5">
                                        <td className="py-1.5 text-white/60">{l.code}</td>
                                        <td className="py-1.5 text-white px-3">{l.name}</td>
                                        <td className={`py-1.5 text-right font-mono ${cls(l.amount)}`}>{fmt(l.amount)}</td>
                                    </tr>
                                ))}
                                <tr className="border-t border-white/20 font-bold">
                                    <td colSpan={2} className="py-2 text-white">Total {title}</td>
                                    <td className={`py-2 text-right font-mono ${cls(section.total)}`}>{fmt(section.total)}</td>
                                </tr>
                            </tbody></table>
                        </div>
                    ))}
                    <div className="md:col-span-2">
                        <h3 className="text-white font-semibold mb-3 text-lg">Equity</h3>
                        <table className="w-full text-sm"><tbody>
                            {data.equity.lines.map((l: any) => (
                                <tr key={l.code} className="border-b border-white/5">
                                    <td className="py-1.5 text-white/60">{l.code}</td>
                                    <td className="py-1.5 text-white px-3">{l.name}</td>
                                    <td className={`py-1.5 text-right font-mono ${cls(l.amount)}`}>{fmt(l.amount)}</td>
                                </tr>
                            ))}
                            <tr className="border-t border-white/20 font-bold">
                                <td colSpan={2} className="py-2 text-white">Total Equity</td>
                                <td className={`py-2 text-right font-mono ${cls(data.equity.total)}`}>{fmt(data.equity.total)}</td>
                            </tr>
                        </tbody></table>
                        <div className={`mt-4 text-sm font-medium ${data.balanced ? 'text-green-400' : 'text-red-400'}`}>
                            {data.balanced ? '✓ Balance sheet is balanced' : '⚠ Balance sheet is not balanced — check for unposted entries'}
                        </div>
                    </div>
                </div>
            )}

            {!loading && data && activeReport === 'aged-receivable' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-4">
                        {Object.entries(data.buckets).map(([bucket, amount]) => (
                            <div key={bucket} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                <div className="text-white/60 text-xs mb-1">{bucket}</div>
                                <div className={`text-lg font-bold font-mono ${(amount as number) > 0 ? 'text-red-400' : 'text-white/40'}`}>{fmt(amount as number)}</div>
                            </div>
                        ))}
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-white/10 text-white/60">
                            <th className="py-2 text-left">Customer</th>
                            <th className="py-2 text-left px-4">Invoice</th>
                            <th className="py-2 text-left">Due Date</th>
                            <th className="py-2 text-right">Days Overdue</th>
                            <th className="py-2 text-right">Amount</th>
                        </tr></thead>
                        <tbody>
                            {data.rows.map((r: any, i: number) => (
                                <tr key={i} className="border-b border-white/5">
                                    <td className="py-1.5 text-white">{r.partnerName}</td>
                                    <td className="py-1.5 text-white/70 px-4">{r.invoiceName}</td>
                                    <td className="py-1.5 text-white/60">{r.dueDate}</td>
                                    <td className={`py-1.5 text-right ${r.daysOverdue > 90 ? 'text-red-400' : r.daysOverdue > 30 ? 'text-yellow-400' : 'text-white/60'}`}>{r.daysOverdue}</td>
                                    <td className="py-1.5 text-right font-mono text-white">{fmt(r.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-right text-white/60 text-sm font-medium">Total outstanding: <span className="text-red-400 font-bold">{fmt(data.total)}</span></div>
                </div>
            )}

            {!loading && data && data.rows?.length === 0 && data.income?.lines?.length === 0 && (
                <div className="text-center text-white/40 py-12">No posted entries found for this period. Post some invoices or journal entries first.</div>
            )}
        </div>
    );
};

// ── Bank Reconciliation Panel ────────────────────────────────────────────────

interface BankStatement {
    id: number;
    name: string;
    dateStart: string | null;
    dateEnd: string | null;
    balance: number;
    state: 'open' | 'reconciled';
    createdAt: string;
    _count?: { lines: number };
}

interface BankStatementLine {
    id: number;
    date: string;
    paymentRef: string | null;
    partnerId: string | null;
    amount: number;
    reconciled: boolean;
    accountMoveId: number | null;
}

interface BankSuggestion {
    lineId: number;
    moveId: number;
    moveName: string;
    amount: number;
    score: number;
}

const BankReconciliationPanel: React.FC = () => {
    const qc = useQueryClient();
    const [selectedStmt, setSelectedStmt] = useState<number | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [expandedLine, setExpandedLine] = useState<number | null>(null);

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n);

    // List statements
    const { data: stmtsData, isLoading: stmtsLoading } = useQuery({
        queryKey: ['bank-statements'],
        queryFn: () =>
            axios.get(`${API_BASE}/api/accounting/bank/statements`).then(r => r.data),
    });
    const statements: BankStatement[] = stmtsData?.data ?? [];

    // Lines for selected statement
    const { data: stmtDetail, isLoading: linesLoading } = useQuery({
        queryKey: ['bank-statement', selectedStmt],
        queryFn: () =>
            axios.get(`${API_BASE}/api/accounting/bank/statements/${selectedStmt}`).then(r => r.data),
        enabled: !!selectedStmt,
    });
    const lines: BankStatementLine[] = stmtDetail?.lines ?? [];

    // Suggestions for an expanded line
    const { data: suggestionsData } = useQuery({
        queryKey: ['bank-suggestions', selectedStmt, expandedLine],
        queryFn: () =>
            axios
                .get(`${API_BASE}/api/accounting/bank/statements/${selectedStmt}/suggestions`, {
                    params: { lineId: expandedLine },
                })
                .then(r => r.data),
        enabled: !!selectedStmt && !!expandedLine,
    });
    const suggestions: BankSuggestion[] = suggestionsData?.suggestions ?? [];

    // Create statement
    const createStmt = useMutation({
        mutationFn: () =>
            axios.post(`${API_BASE}/api/accounting/bank/statements`, { name: newName }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bank-statements'] });
            setShowNewForm(false);
            setNewName('');
            toast.success('Bank statement created');
        },
        onError: () => toast.error('Failed to create statement'),
    });

    // Match line to move
    const matchLine = useMutation({
        mutationFn: ({ lineId, moveId }: { lineId: number; moveId: number }) =>
            axios.post(
                `${API_BASE}/api/accounting/bank/statements/${selectedStmt}/match`,
                { lineId, moveId },
            ),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bank-statement', selectedStmt] });
            qc.invalidateQueries({ queryKey: ['bank-statements'] });
            setExpandedLine(null);
            toast.success('Line reconciled');
        },
        onError: () => toast.error('Failed to reconcile line'),
    });

    // Unmatch line
    const unmatchLine = useMutation({
        mutationFn: (lineId: number) =>
            axios.delete(
                `${API_BASE}/api/accounting/bank/statements/${selectedStmt}/match/${lineId}`,
            ),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bank-statement', selectedStmt] });
            qc.invalidateQueries({ queryKey: ['bank-statements'] });
            toast.success('Line unreconciled');
        },
        onError: () => toast.error('Failed to unreconcile line'),
    });

    const reconciledCount = lines.filter(l => l.reconciled).length;
    const progress = lines.length > 0 ? Math.round((reconciledCount / lines.length) * 100) : 0;

    return (
        <div className="grid grid-cols-3 gap-6 h-full">
            {/* ── Left: Statement list ─────────────────────────────── */}
            <div className="col-span-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Landmark size={16} className="text-primary-500" />
                        Bank Statements
                    </h3>
                    <button
                        onClick={() => setShowNewForm(v => !v)}
                        className="p-1.5 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-500 transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {showNewForm && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-2">
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Statement name…"
                            className="flex-1 bg-transparent text-white text-sm border-b border-white/20 focus:border-primary-500 outline-none"
                            onKeyDown={e => e.key === 'Enter' && newName && createStmt.mutate()}
                        />
                        <button
                            disabled={!newName || createStmt.isPending}
                            onClick={() => createStmt.mutate()}
                            className="text-xs px-2 py-1 bg-primary-500 rounded text-white disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                )}

                {stmtsLoading ? (
                    <div className="text-white/40 text-sm text-center py-6 animate-pulse">Loading…</div>
                ) : statements.length === 0 ? (
                    <div className="text-white/40 text-sm text-center py-10">
                        No statements yet. Create one to start reconciling.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto">
                        {statements.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStmt(s.id)}
                                className={`text-left p-3 rounded-xl border transition-colors ${
                                    selectedStmt === s.id
                                        ? 'border-primary-500/60 bg-primary-500/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/8'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white text-sm font-medium truncate">{s.name}</span>
                                    <span
                                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            s.state === 'reconciled'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}
                                    >
                                        {s.state}
                                    </span>
                                </div>
                                <div className="text-white/50 text-xs">{fmt(s.balance)} · {s._count?.lines ?? 0} lines</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Right: Lines ─────────────────────────────────────── */}
            <div className="col-span-2 flex flex-col gap-4">
                {!selectedStmt ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
                        <Landmark size={40} />
                        <span>Select a statement to reconcile</span>
                    </div>
                ) : linesLoading ? (
                    <div className="text-white/40 text-sm text-center py-12 animate-pulse">Loading lines…</div>
                ) : (
                    <>
                        {/* Progress bar */}
                        <div>
                            <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                                <span>{reconciledCount}/{lines.length} lines reconciled</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-400 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {lines.length === 0 ? (
                            <div className="text-white/40 text-center py-10 text-sm">No lines in this statement.</div>
                        ) : (
                            <div className="flex flex-col gap-2 overflow-y-auto">
                                {lines.map(line => (
                                    <div
                                        key={line.id}
                                        className={`border rounded-xl transition-colors ${
                                            line.reconciled
                                                ? 'border-green-500/20 bg-green-500/5'
                                                : 'border-white/10 bg-white/5'
                                        }`}
                                    >
                                        {/* Line header */}
                                        <div className="flex items-center gap-3 p-3">
                                            {line.reconciled ? (
                                                <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                                            ) : (
                                                <XCircle size={16} className="text-white/30 shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-sm truncate">
                                                    {line.paymentRef ?? 'No reference'}
                                                </div>
                                                <div className="text-white/40 text-xs">
                                                    {new Date(line.date).toLocaleDateString()}
                                                    {line.partnerId && ` · ${line.partnerId}`}
                                                </div>
                                            </div>
                                            <span
                                                className={`font-mono text-sm font-medium ${
                                                    line.amount >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}
                                            >
                                                {fmt(line.amount)}
                                            </span>
                                            {line.reconciled ? (
                                                <button
                                                    onClick={() => unmatchLine.mutate(line.id)}
                                                    title="Unreconcile"
                                                    className="p-1 text-white/30 hover:text-red-400 transition-colors"
                                                >
                                                    <RefreshCw size={13} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        setExpandedLine(
                                                            expandedLine === line.id ? null : line.id,
                                                        )
                                                    }
                                                    className="p-1 text-white/30 hover:text-primary-500 transition-colors"
                                                >
                                                    {expandedLine === line.id ? (
                                                        <ChevronUp size={13} />
                                                    ) : (
                                                        <ChevronDown size={13} />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Suggestions drawer */}
                                        {expandedLine === line.id && !line.reconciled && (
                                            <div className="border-t border-white/10 px-3 pb-3 pt-2">
                                                <div className="text-white/50 text-xs mb-2">Suggested matches</div>
                                                {suggestions.length === 0 ? (
                                                    <div className="text-white/30 text-xs">No matching payments found.</div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        {suggestions.map(s => (
                                                            <button
                                                                key={s.moveId}
                                                                onClick={() =>
                                                                    matchLine.mutate({
                                                                        lineId: line.id,
                                                                        moveId: s.moveId,
                                                                    })
                                                                }
                                                                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-primary-500/20 border border-white/10 hover:border-primary-500/40 transition-colors text-sm"
                                                            >
                                                                <span className="text-white/70">{s.moveName}</span>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-mono text-white/60">{fmt(s.amount)}</span>
                                                                    <span className="text-xs text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded">
                                                                        {Math.round(s.score * 100)}% match
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
