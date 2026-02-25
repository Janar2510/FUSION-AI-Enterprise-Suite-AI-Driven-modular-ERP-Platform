import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useRentalStore, RentalOrder, RentalOrderLine } from '../stores/rentalStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { useInventoryStore } from '@/modules/inventory/stores/inventoryStore';

export const RentalModule: React.FC = () => {
    const {
        orders,
        fetchOrders,
        createOrder,
        updateOrder
    } = useRentalStore();

    const { partners, fetchPartners } = usePartnerStore();
    const { products, fetchAllProducts } = useInventoryStore();

    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeOrder, setActiveOrder] = useState<RentalOrder | null>(null);
    const [formData, setFormData] = useState<Partial<RentalOrder>>({
        state: 'draft',
        lines: []
    });

    useEffect(() => {
        fetchOrders();
        fetchPartners();
        fetchAllProducts(''); // Ensure we have the base product catalog
    }, []);

    const handleNew = () => {
        setActiveOrder(null);
        setFormData({
            state: 'draft',
            pickupDate: new Date().toISOString(),
            returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week default
            lines: []
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: RentalOrder) => {
        setActiveOrder(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeOrder) {
            await updateOrder(activeOrder.id, formData);
        } else {
            const newOrder = await createOrder(formData);
            if (newOrder) setActiveOrder(newOrder);
        }
        setCurrentView('list');
    };

    const handleAction = async (newState: string) => {
        if (!activeOrder) return;
        await updateOrder(activeOrder.id, { ...formData, state: newState });
        setActiveOrder({ ...activeOrder, state: newState });
        setFormData({ ...formData, state: newState });
    };

    // Form Line Editors
    const addLine = () => {
        setFormData(prev => ({
            ...prev,
            lines: [...(prev.lines || []), { id: Date.now(), productId: 0, productQty: 1, priceUnit: 0, priceSubtotal: 0 }]
        }));
    };

    const updateLine = (index: number, field: keyof RentalOrderLine, value: any) => {
        setFormData(prev => {
            const newLines = [...(prev.lines || [])];
            newLines[index] = { ...newLines[index], [field]: value };

            // Auto-calculate subtotal
            if (field === 'productQty' || field === 'priceUnit') {
                newLines[index].priceSubtotal = newLines[index].productQty * newLines[index].priceUnit;
            }

            // Auto-fetch product price
            if (field === 'productId') {
                const product = products.find(p => p.id === value);
                if (product) {
                    newLines[index].priceUnit = product.salePrice || 0;
                    newLines[index].priceSubtotal = newLines[index].productQty * newLines[index].priceUnit;
                }
            }

            // Update Total
            const total = newLines.reduce((sum, line) => sum + (line.priceSubtotal || 0), 0);

            return { ...prev, lines: newLines, amountTotal: total };
        });
    };

    const removeLine = (index: number) => {
        setFormData(prev => {
            const newLines = [...(prev.lines || [])];
            newLines.splice(index, 1);
            const total = newLines.reduce((sum, line) => sum + (line.priceSubtotal || 0), 0);
            return { ...prev, lines: newLines, amountTotal: total };
        });
    };


    const renderList = () => (
        <OdooListBase
            data={orders.filter(o => o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(o) => o.id.toString()}
            columns={[
                { key: 'name', label: 'Reference', render: (o) => <span className="font-bold">{o.name}</span> },
                { key: 'partner', label: 'Customer', render: (o) => o.partner?.name || '' },
                { key: 'pickup', label: 'Pickup Date', render: (o) => new Date(o.pickupDate).toLocaleDateString() },
                { key: 'return', label: 'Return Date', render: (o) => new Date(o.returnDate).toLocaleDateString() },
                { key: 'amount', label: 'Total', render: (o) => `$${o.amountTotal?.toFixed(2) || '0.00'}` },
                {
                    key: 'state', label: 'Status', render: (o) => (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                        ${o.state === 'draft' ? 'bg-white/10 text-white/60' :
                                o.state === 'pickup' ? 'bg-blue-500/20 text-blue-400' :
                                    o.state === 'return' ? 'bg-yellow-500/20 text-yellow-400' :
                                        o.state === 'done' ? 'bg-green-500/20 text-green-400' :
                                            'bg-red-500/20 text-red-400'}
                    `}>
                            {o.state}
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
                        {formData.state === 'draft' && <button onClick={() => handleAction('pickup')} className="bg-primary-purple hover:bg-primary-purple/80 text-white px-4 py-1.5 rounded text-sm transition-colors">Confirm Pickup</button>}
                        {formData.state === 'pickup' && <button onClick={() => handleAction('return')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Register Return</button>}
                        {formData.state === 'return' && <button onClick={() => handleAction('done')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Mark Done</button>}
                        {formData.state !== 'done' && formData.state !== 'cancel' && <button onClick={() => handleAction('cancel')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-sm transition-colors">Cancel</button>}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold text-white mb-2">{activeOrder ? activeOrder.name : 'New Rental'}</h1>
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
                                disabled={formData.state !== 'draft'}
                            >
                                <option value="" className="text-black">Select...</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Pickup Date</label>
                            <input
                                type="datetime-local"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.pickupDate ? new Date(formData.pickupDate).toISOString().slice(0, 16) : ''}
                                onChange={(e) => setFormData({ ...formData, pickupDate: new Date(e.target.value).toISOString() })}
                                disabled={formData.state !== 'draft'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Return Date</label>
                            <input
                                type="datetime-local"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.returnDate ? new Date(formData.returnDate).toISOString().slice(0, 16) : ''}
                                onChange={(e) => setFormData({ ...formData, returnDate: new Date(e.target.value).toISOString() })}
                                disabled={formData.state !== 'draft' && formData.state !== 'pickup'}
                            />
                        </div>
                    </div>

                    <div className="mt-8 border border-white/10 rounded-xl overflow-hidden">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 grid grid-cols-12 gap-4 text-sm font-medium text-white/60">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-2">Quantity</div>
                            <div className="col-span-2">Unit Price</div>
                            <div className="col-span-2 text-right">Subtotal</div>
                        </div>
                        <div className="divide-y divide-white/5 min-h-[100px]">
                            {formData.lines?.map((line, index) => (
                                <div key={line.id} className="grid grid-cols-12 gap-4 px-4 py-2 items-center hover:bg-white/5 group transition-colors">
                                    <div className="col-span-6">
                                        <select
                                            className="w-full bg-transparent border-none text-white outline-none focus:ring-1 focus:ring-primary-purple rounded"
                                            value={line.productId || ''}
                                            onChange={(e) => updateLine(index, 'productId', parseInt(e.target.value))}
                                            disabled={formData.state !== 'draft'}
                                        >
                                            <option value="" className="text-black disabled">Select Product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number" min="1"
                                            className="w-full bg-transparent border-none text-white outline-none focus:ring-1 focus:ring-primary-purple rounded"
                                            value={line.productQty}
                                            onChange={(e) => updateLine(index, 'productQty', parseInt(e.target.value))}
                                            disabled={formData.state !== 'draft'}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number" min="0" step="0.01"
                                            className="w-full bg-transparent border-none text-white outline-none focus:ring-1 focus:ring-primary-purple rounded"
                                            value={line.priceUnit}
                                            onChange={(e) => updateLine(index, 'priceUnit', parseFloat(e.target.value))}
                                            disabled={formData.state !== 'draft'}
                                        />
                                    </div>
                                    <div className="col-span-2 flex justify-between items-center text-white">
                                        <span>${line.priceSubtotal?.toFixed(2) || '0.00'}</span>
                                        {formData.state === 'draft' && (
                                            <button onClick={() => removeLine(index)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {formData.state === 'draft' && (
                                <div className="px-4 py-3 border-t border-white/5">
                                    <button onClick={addLine} className="text-sm font-medium text-primary-purple hover:text-primary-purple/80">
                                        + Add a product
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Rental Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-white/60">
                                <span>Untaxed Amount:</span>
                                <span>${formData.amountTotal?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between text-white/60">
                                <span>Taxes (0%):</span>
                                <span>$0.00</span>
                            </div>
                            <div className="pt-3 border-t border-white/10 flex justify-between text-xl font-bold text-white">
                                <span>Total:</span>
                                <span>${formData.amountTotal?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Rental Orders"
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
