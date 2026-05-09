import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooDataGrid } from '@/components/shared/OdooDataGrid';
import { useAccountingStore, AccountMove, AccountMoveLine } from '../stores/accountingStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { useInventoryStore } from '@/modules/inventory/stores/inventoryStore';
import { ChevronRight, TrendingUp, TrendingDown, DollarSign, FileText, BookOpen, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { MetricGrid } from '@/components/shared/MetricCard';
import { GlassCard } from '@/components/shared/GlassCard';
import { ChatterPanel } from '@/components/shared/ChatterPanel';
import { AiActionsPanel } from '@/components/shared/AiActionsPanel';

type AccountingTab = 'out_invoice' | 'in_invoice' | 'entry';

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
                        { id: 'entry', label: 'Journal Entries' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`pb - 3 px - 2 font - medium transition - colors border - b - 2 ${activeTab === tab.id ? 'border-primary-purple text-primary-purple' : 'border-transparent text-white/60 hover:text-white'
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
                                <div className="p-3 bg-purple-500/20 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-purple-400" />
                                </div>
                            </div>
                            <div className="flex items-center text-purple-400 text-sm font-medium mt-4">
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
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-md shadow-lg"
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
                                                ${isActive ? 'text-primary-purple font-bold' : isPast ? 'text-white/80' : 'text-white/40'}
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
                                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
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
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                        value={formData.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Journal</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
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
        </OdooViewManager>
    );
};
