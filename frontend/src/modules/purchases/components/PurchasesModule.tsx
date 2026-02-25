import React, { useEffect, useState, useMemo } from 'react';
import { usePurchasesStore, PurchaseOrder, PurchaseOrderLine } from '../stores/purchasesStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';
import { OdooDataGrid } from '@/components/shared/OdooDataGrid';
import { OdooViewManager, ViewType } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { ShoppingCart, Building2, DollarSign, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const PurchasesModule: React.FC = () => {
    const {
        orders,
        partners,
        products,
        fetchOrders,
        fetchPartners,
        fetchProducts,
        createOrder,
        updateOrder,
        confirmOrder,
        cancelOrder,
    } = usePurchasesStore();

    // UI state
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders'>('dashboard');

    // Form state
    const [activeOrder, setActiveOrder] = useState<PurchaseOrder | null>(null);
    const [formData, setFormData] = useState<Partial<PurchaseOrder>>({ state: 'draft' });
    const [orderLines, setOrderLines] = useState<Partial<PurchaseOrderLine>[]>([]);

    useEffect(() => {
        fetchOrders();
        fetchPartners();
        fetchProducts();
    }, []);

    const filteredOrders = useMemo(() => {
        return (orders || []).filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [orders, searchTerm]);

    const handleNewOrder = () => {
        setActiveOrder(null);
        setFormData({ state: 'draft', partnerId: (partners || [])[0]?.id || 0 });
        setOrderLines([]);
        setCurrentView('form');
        setActiveTab('orders');
    };

    const handleSaveOrder = async () => {
        try {
            if (activeOrder) {
                await updateOrder(activeOrder.id, { ...formData, lines: orderLines as any });
                toast.success('Purchase Order updated successfully');
            } else {
                await createOrder({ ...formData, lines: orderLines as any });
                toast.success('Purchase Order created successfully');
            }
            setCurrentView('list');
        } catch (error) {
            toast.error('Failed to save Purchase Order');
        }
    };

    const handleConfirm = async () => {
        if (!activeOrder) return;
        try {
            await confirmOrder(activeOrder.id);
            toast.success('Order Confirmed!');
            setCurrentView('list');
        } catch (error) {
            toast.error('Failed to confirm order');
        }
    };

    const handleCancel = async () => {
        if (!activeOrder) return;
        try {
            await cancelOrder(activeOrder.id);
            toast.success('Order Cancelled');
            setCurrentView('list');
        } catch (error) {
            toast.error('Failed to cancel order');
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // METRICS CALCULATIONS
    // ─────────────────────────────────────────────────────────────────
    const safeOrders = orders || [];
    const toApproveCount = safeOrders.filter(o => o.state === 'draft' || o.state === 'to approve').length;
    const confirmedCount = safeOrders.filter(o => o.state === 'purchase').length;
    const totalPurchased = safeOrders.filter(o => o.state === 'purchase').reduce((acc, curr) => acc + curr.amountTotal, 0);

    const metricsData = [
        { title: 'RFQs / To Approve', value: toApproveCount.toString(), change: '+2', icon: FileText, color: 'text-yellow-400' },
        { title: 'Confirmed Orders', value: confirmedCount.toString(), change: '+5', icon: CheckCircle2, color: 'text-emerald-400' },
        { title: 'Total Spend (YTD)', value: `$${totalPurchased.toLocaleString()}`, change: '+12%', icon: DollarSign, color: 'text-blue-400' },
    ];

    // ─────────────────────────────────────────────────────────────────
    // RENDER FACTORIES
    // ─────────────────────────────────────────────────────────────────
    const renderDashboard = () => (
        <div className="space-y-8 animate-fade-in py-6">
            <MetricGrid metrics={metricsData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <GlassCard className="min-h-[300px] p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <ShoppingCart className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-xl font-medium text-white">Recent RFQs</h3>
                    </div>
                    <div className="space-y-4">
                        {(orders || []).filter(o => o.state === 'draft').slice(0, 5).map(o => (
                            <div key={o.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => { setActiveOrder(o); setFormData(o); setOrderLines(o.lines); setCurrentView('form'); setActiveTab('orders'); }}>
                                <div>
                                    <div className="font-medium text-white">{o.name}</div>
                                    <div className="text-sm text-white/50">{o.partner?.name || 'Unknown Vendor'}</div>
                                </div>
                                <div className="text-emerald-400 font-medium">${o.amountTotal.toLocaleString()}</div>
                            </div>
                        ))}
                        {(orders || []).filter(o => o.state === 'draft').length === 0 && (
                            <div className="text-center font-medium text-white/40 py-12 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                No recent RFQs
                            </div>
                        )}
                    </div>
                </GlassCard>
                <GlassCard className="min-h-[300px] p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-xl font-medium text-white">Top Vendors</h3>
                    </div>
                    <div className="space-y-4">
                        {(partners || []).slice(0, 5).map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-white/80">{p.name}</span>
                                <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">Vendor</span>
                            </div>
                        ))}
                        {(partners || []).length === 0 && (
                            <div className="text-center font-medium text-white/40 py-12 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                No vendors found
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );

    const renderOrdersList = () => (
        <div className="animate-fade-in p-2">
            <OdooListBase
                data={filteredOrders}
                keyExtractor={(o) => String(o.id)}
                columns={[
                    { key: 'name', label: 'Reference' },
                    { key: 'partner.name', label: 'Vendor' },
                    { key: 'dateOrder', label: 'Order Date', render: (o) => new Date(o.dateOrder).toLocaleDateString() },
                    { key: 'state', label: 'Status' },
                    { key: 'amountUntaxed', label: 'Untaxed', render: (o) => `$${o.amountUntaxed?.toLocaleString()}` },
                    { key: 'amountTotal', label: 'Total', render: (o) => `$${o.amountTotal?.toLocaleString()}` },
                ]}
                onRowClick={(order) => {
                    setActiveOrder(order);
                    setFormData(order);
                    setOrderLines(order.lines);
                    setCurrentView('form');
                }}
            />
        </div>
    );

    const renderOrderForm = () => {
        const lineColumns = [
            { key: 'productId', label: 'Product', type: 'select' as const, width: '30%', editable: formData.state === 'draft', options: (products || []).map(p => ({ value: p.id, label: p.name })) },
            { key: 'name', label: 'Description', type: 'string' as const, width: '30%', editable: formData.state === 'draft' },
            { key: 'productQty', label: 'Quantity', type: 'number' as const, editable: formData.state === 'draft', align: 'right' as const },
            { key: 'qtyReceived', label: 'Received', type: 'number' as const, editable: false, align: 'right' as const },
            { key: 'qtyInvoiced', label: 'Billed', type: 'number' as const, editable: false, align: 'right' as const },
            { key: 'priceUnit', label: 'Unit Price', type: 'number' as const, editable: formData.state === 'draft', align: 'right' as const },
            { key: 'priceSubtotal', label: 'Subtotal', type: 'number' as const, editable: false, align: 'right' as const },
        ];

        return (
            <div className="animate-fade-in space-y-8 pb-12">
                {/* Odoo Status Bar & Smart Buttons */}
                <div className="flex border-b border-white/10 pb-4 justify-between items-center">
                    <div className="flex space-x-3">
                        {formData.state === 'draft' && (
                            <button onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm shadow-lg shadow-emerald-500/20">
                                Confirm Order
                            </button>
                        )}
                        {formData.state !== 'cancel' && (
                            <button onClick={handleCancel} className="bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm border border-white/10">
                                Cancel
                            </button>
                        )}
                        <button onClick={handleSaveOrder} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm ml-4">
                            Save Progress
                        </button>
                    </div>

                    <div className="flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                        <span className={`h-2 w-2 rounded-full ${formData.state === 'purchase' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : formData.state === 'cancel' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                        <span className="text-sm font-medium text-white tracking-wide uppercase">
                            {formData.state === 'purchase' ? 'Confirmed Order' : formData.state === 'cancel' ? 'Cancelled' : 'Request for Quotation'}
                        </span>
                    </div>
                </div>

                {/* Form Body - Deep Spacing and Typography Focus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2 tracking-wide uppercase">Vendor</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                                value={formData.partnerId || ''}
                                onChange={(e) => setFormData({ ...formData, partnerId: parseInt(e.target.value) })}
                                disabled={formData.state !== 'draft'}
                            >
                                <option value="" className="bg-dark-900 text-white/50">Select Vendor...</option>
                                {(partners || []).map((p) => (
                                    <option key={p.id} value={p.id} className="bg-dark-900 text-white">{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2 tracking-wide uppercase">Vendor Reference</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                                value={formData.partnerRef || ''}
                                onChange={(e) => setFormData({ ...formData, partnerRef: e.target.value })}
                                placeholder="e.g. SO-10294"
                                disabled={formData.state !== 'draft'}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2 tracking-wide uppercase">Order Date</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter-invert"
                                value={formData.dateOrder ? new Date(formData.dateOrder).toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, dateOrder: new Date(e.target.value).toISOString() })}
                                disabled={formData.state !== 'draft'}
                            />
                        </div>
                    </div>
                </div>

                {/* DataGrid Area */}
                <div className="pt-10">
                    <h3 className="text-xl font-medium text-white mb-6 border-b border-white/10 pb-4">Products</h3>
                    <div className="bg-dark-800/50 rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/5">
                        <OdooDataGrid
                            data={orderLines}
                            columns={lineColumns}
                            onRowChange={(idx, updated) => {
                                const newLines = [...orderLines];
                                newLines[idx] = updated;
                                setOrderLines(newLines);
                            }}
                            onAddRow={() => formData.state === 'draft' && setOrderLines([...orderLines, { name: 'Item', productQty: 1, priceUnit: 0, productId: products?.[0]?.id || 0, qtyReceived: 0, qtyInvoiced: 0, priceSubtotal: 0 }])}
                            onDeleteRow={formData.state === 'draft' ? (idx) => setOrderLines(orderLines.filter((_, i) => i !== idx)) : undefined}
                            className="bg-transparent"
                        />
                    </div>

                    {/* Totals Section */}
                    {activeOrder && (
                        <div className="flex justify-end pt-8">
                            <div className="w-64 space-y-4 text-sm bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
                                <div className="flex justify-between text-white/70">
                                    <span>Untaxed Amount:</span>
                                    <span>${activeOrder.amountUntaxed?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-white/70">
                                    <span>Taxes:</span>
                                    <span>${activeOrder.amountTax?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-xl font-semibold text-white border-t border-white/20 pt-4 mt-2">
                                    <span>Total:</span>
                                    <span className="text-emerald-400">${activeOrder.amountTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col pt-4">
            {/* Custom Tab Navigation mapped to FusionAI design limits */}
            <div className="flex bg-white/5 rounded-full border border-white/10 p-1 mb-8 w-fit ml-8">
                {(['dashboard', 'orders'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setCurrentView(tab === 'dashboard' ? 'dashboard' : 'list'); }}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <GlassCard className="flex-1 overflow-hidden m-8 mt-0 p-8 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl">
                <OdooViewManager
                    title="Purchases"
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    onNew={handleNewOrder}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    viewsAvailable={activeTab === 'dashboard' ? ['dashboard'] : ['list', 'form']}
                >
                    {activeTab === 'dashboard' && currentView === 'dashboard' && renderDashboard()}
                    {activeTab === 'orders' && currentView === 'list' && renderOrdersList()}
                    {activeTab === 'orders' && currentView === 'form' && renderOrderForm()}
                </OdooViewManager>
            </GlassCard>
        </div>
    );
};
