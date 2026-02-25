import React, { useEffect, useState } from 'react';
import { OdooDataGrid } from '@/components/shared/OdooDataGrid';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useSalesStore, SaleOrder, SaleOrderLine } from '../stores/salesStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const SalesModule: React.FC = () => {
    const { orders, fetchAllOrders, createOrder, updateOrder, confirmOrder, cancelOrder, createInvoice } = useSalesStore();
    const { partners, fetchPartners } = usePartnerStore(); // We'll need this to quickly select customers

    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [activeRecord, setActiveRecord] = useState<SaleOrder | null>(null);
    const [formData, setFormData] = useState<Partial<SaleOrder>>({});
    const [lines, setLines] = useState<SaleOrderLine[]>([]);

    useEffect(() => {
        fetchAllOrders();
        fetchPartners();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            state: 'draft',
            partnerId: undefined, // Needs selection
            amountUntaxed: 0,
            amountTax: 0,
            amountTotal: 0
        });
        setLines([]);
        setCurrentView('form');
    };

    const handleRowClick = (order: SaleOrder) => {
        setActiveRecord(order);
        setFormData(order);
        setLines(order.lines || []);
        setCurrentView('form');
    };

    const calculateTotals = (currentLines: SaleOrderLine[]) => {
        const amountUntaxed = currentLines.reduce((sum, line) => sum + (line.productQty * line.priceUnit * (1 - line.discount / 100)), 0);
        const amountTax = amountUntaxed * 0.15; // Assuming 15% flat tax for MVP
        const amountTotal = amountUntaxed + amountTax;

        setFormData(prev => ({
            ...prev,
            amountUntaxed,
            amountTax,
            amountTotal
        }));
    };

    const handleAddLine = () => {
        const newLine: SaleOrderLine = {
            sequence: lines.length * 10,
            name: '',
            productQty: 1,
            priceUnit: 0,
            discount: 0,
            priceSubtotal: 0
        };
        const newLines = [...lines, newLine];
        setLines(newLines);
        calculateTotals(newLines);
    };


    const handleRowChange = (index: number, updatedRow: SaleOrderLine) => {
        const newLines = [...lines];
        const qty = Number(updatedRow.productQty) || 0;
        const price = Number(updatedRow.priceUnit) || 0;
        const disc = Number(updatedRow.discount) || 0;
        updatedRow.priceSubtotal = qty * price * (1 - disc / 100);
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

        if (activeRecord) {
            await updateOrder(activeRecord.id, payload);
        } else {
            const newOrder = await createOrder(payload);
            if (newOrder) setActiveRecord(newOrder);
        }
        setCurrentView('list');
    };

    const handleCreateInvoice = async () => {
        if (!activeRecord) return;
        try {
            await createInvoice(activeRecord.id);
            toast.success('Invoice created successfully! View it in Accounting.', { position: 'bottom-center' });
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to create invoice', { position: 'bottom-center' });
        }
    };

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'draft': return 'bg-gray-500/20 text-gray-400';
            case 'sent': return 'bg-blue-500/20 text-blue-400';
            case 'sale': return 'bg-green-500/20 text-green-400';
            case 'done': return 'bg-purple-500/20 text-purple-400';
            case 'cancel': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <OdooViewManager
            title="Sales Orders"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('list')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['list', 'form']} // Kanban is less typical for purely SOs
        >
            {currentView === 'list' && (
                <OdooListBase
                    data={orders.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                    onRowClick={handleRowClick}
                    keyExtractor={(o) => o.id.toString()}
                    columns={[
                        { key: 'name', label: 'Order Number', render: (o) => <span className="font-bold">{o.name}</span> },
                        { key: 'dateOrder', label: 'Order Date', render: (o) => new Date(o.dateOrder).toLocaleDateString() },
                        { key: 'partner', label: 'Customer', render: (o) => o.partner?.name || 'Unknown' },
                        {
                            key: 'amountTotal',
                            label: 'Total',
                            render: (o) => <span className="font-medium text-green-400">${o.amountTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        },
                        {
                            key: 'state',
                            label: 'Status',
                            render: (o) => (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(o.state)}`}>
                                    {o.state === 'sale' ? 'Sales Order' : o.state}
                                </span>
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
                                    <button onClick={() => confirmOrder(activeRecord.id)} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-md shadow-lg">
                                        Confirm Order
                                    </button>
                                )}
                                {formData.state === 'sale' && (
                                    <button
                                        onClick={handleCreateInvoice}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-md shadow-lg"
                                    >
                                        Create Invoice
                                    </button>
                                )}
                                {['draft', 'sale'].includes(formData.state || '') && activeRecord && (
                                    <button onClick={() => cancelOrder(activeRecord.id)} className="px-4 py-2 bg-white/5 text-white/70 hover:bg-white/10 rounded-md transition-colors">
                                        Cancel
                                    </button>
                                )}
                            </div>

                            {/* Odoo Chevron Progress Bar */}
                            <div className="flex text-sm font-medium">
                                {['draft', 'sent', 'sale'].map((state, idx) => (
                                    <div key={state} className="flex items-center relative">
                                        <div className={`px-4 py-2 flex items-center pr-6 uppercase
                      ${formData.state === state ? 'text-primary-purple font-bold' : 'text-white/40'}
                      ${formData.state === 'sale' && idx < 2 ? 'text-white/80' : ''}
                    `}>
                                            {state === 'draft' ? 'Quotation' : state === 'sent' ? 'Quotation Sent' : 'Sales Order'}
                                        </div>
                                        {idx < 2 && <ChevronRight className="w-5 h-5 absolute -right-2 text-white/20 z-10" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    }
                    headerContent={
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                {formData.name || 'New Quotation'}
                            </h2>
                        </div>
                    }
                    leftPanels={
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Customer</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                        value={formData.partnerId || ''}
                                        onChange={(e) => setFormData({ ...formData, partnerId: parseInt(e.target.value) })}
                                    >
                                        <option value="" className="text-black">Select a customer...</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Expiration Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                        value={formData.validityDate?.split('T')[0] || ''}
                                        onChange={(e) => setFormData({ ...formData, validityDate: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                            </div>

                            {/* Order Lines Notebook / Tabs equivalent in Odoo */}
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-lg font-medium text-white mb-4">Order Lines</h3>

                                <OdooDataGrid
                                    columns={[
                                        { key: 'name', label: 'Description', type: 'string', width: '40%' },
                                        { key: 'productQty', label: 'Quantity', type: 'number', width: '15%', align: 'right' },
                                        { key: 'priceUnit', label: 'Unit Price', type: 'number', width: '15%', align: 'right' },
                                        { key: 'discount', label: 'Disc.%', type: 'number', width: '15%', align: 'right' },
                                        {
                                            key: 'priceSubtotal',
                                            label: 'Subtotal',
                                            type: 'number',
                                            editable: false,
                                            width: '15%',
                                            align: 'right',
                                            format: (val: any) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                        }
                                    ]}
                                    data={lines}
                                    onRowChange={handleRowChange}
                                    onAddRow={handleAddLine}
                                    onDeleteRow={handleRemoveLine}
                                    readonly={formData.state === 'done' || formData.state === 'cancel'}
                                />

                                {/* Totals Calculation block */}
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                />
            )}
        </OdooViewManager>
    );
};
