import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooDataGrid, ColumnDef } from '@/components/shared/OdooDataGrid';
import { useManufacturingStore, MrpBom, MrpProduction, MrpBomLine } from '../stores/manufacturingStore';
import { useInventoryStore } from '@/modules/inventory/stores/inventoryStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';
import { LayoutDashboard, Factory, Cpu, Layers } from 'lucide-react';

export const ManufacturingModule: React.FC = () => {
    const {
        boms,
        orders,
        fetchBoms,
        fetchOrders,
        createBom,
        createOrder,
        startOrder,
        finishOrder
    } = useManufacturingStore();

    const { products, fetchAllProducts } = useInventoryStore();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'boms'>('dashboard');
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeOrder, setActiveOrder] = useState<MrpProduction | null>(null);
    const [activeBom, setActiveBom] = useState<MrpBom | null>(null);

    const [orderFormData, setOrderFormData] = useState<Partial<MrpProduction>>({});
    const [bomFormData, setBomFormData] = useState<Partial<MrpBom>>({
        lines: []
    });

    useEffect(() => {
        fetchBoms();
        fetchOrders();
        fetchAllProducts();
    }, []);

    const handleNew = () => {
        if (activeTab === 'dashboard' || activeTab === 'orders') {
            setActiveTab('orders');
            setActiveOrder(null);
            setOrderFormData({
                state: 'draft',
                productQty: 1,
                qtyProduced: 0
            });
        } else {
            setActiveBom(null);
            setBomFormData({
                active: true,
                type: 'normal',
                productQty: 1,
                lines: []
            });
        }
        setCurrentView('form');
    };

    const handleRowClick = (record: any) => {
        if (activeTab === 'orders') {
            setActiveOrder(record);
            setOrderFormData(record);
        } else {
            setActiveBom(record);
            setBomFormData(record);
        }
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeTab === 'orders') {
            if (!activeOrder) {
                const newOrder = await createOrder(orderFormData);
                if (newOrder) setActiveOrder(newOrder);
            }
        } else {
            if (!activeBom) {
                const newBom = await createBom(bomFormData);
                if (newBom) setActiveBom(newBom);
            }
        }
        setCurrentView('list');
    };

    const handleStartOrder = async () => {
        if (activeOrder) {
            await startOrder(activeOrder.id);
            setActiveOrder({ ...activeOrder, state: 'progress' });
            setOrderFormData({ ...orderFormData, state: 'progress' });
        }
    };

    const handleFinishOrder = async () => {
        if (activeOrder) {
            await finishOrder(activeOrder.id);
            setActiveOrder({ ...activeOrder, state: 'done' });
            setOrderFormData({ ...orderFormData, state: 'done' });
        }
    };

    // Add line to BOM form
    const addBomLine = () => {
        setBomFormData(prev => ({
            ...prev,
            lines: [...(prev.lines || []), { id: Date.now(), productId: 0, productQty: 1 } as MrpBomLine] // temporary id
        }));
    };

    const updateBomLine = (index: number, field: keyof MrpBomLine, value: any) => {
        setBomFormData(prev => {
            const newLines = [...(prev.lines || [])];
            newLines[index] = { ...newLines[index], [field]: value };
            return { ...prev, lines: newLines };
        });
    };

    const removeBomLine = (index: number) => {
        setBomFormData(prev => {
            const newLines = [...(prev.lines || [])];
            newLines.splice(index, 1);
            return { ...prev, lines: newLines };
        });
    };

    // --------------------------------------------------------------------------
    // DASHBOARD VIEW
    // --------------------------------------------------------------------------
    const renderDashboard = () => {
        const metrics = [
            { title: 'Manufacturing Orders', value: orders.length.toString(), icon: Factory },
            { title: 'In Progress', value: orders.filter(o => o.state === 'progress').length.toString(), icon: Cpu },
            { title: 'Bills of Material', value: boms.length.toString(), icon: Layers }
        ];

        return (
            <div className="space-y-6">
                <MetricGrid metrics={metrics} />
                <h3 className="text-xl font-medium text-white px-2 mt-8 mb-4">Operations</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Factory className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-xl font-medium text-white">Recent Orders</h3>
                        </div>
                        <div className="space-y-3">
                            {orders.slice(0, 5).map(o => (
                                <div key={o.id} className="flex justify-between items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors" onClick={() => { setActiveTab('orders'); handleRowClick(o); }}>
                                    <span className="text-white font-medium">{o.name}</span>
                                    <span className="text-white/60 text-sm bg-black/20 px-2 py-1 rounded">{o.state}</span>
                                </div>
                            ))}
                            {orders.length === 0 && <span className="text-white/40 italic">No recent orders</span>}
                        </div>
                    </GlassCard>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // ORDERS VIEW
    // --------------------------------------------------------------------------
    const renderOrdersList = () => (
        <OdooListBase
            data={orders.filter(o => o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.bom?.name?.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(o) => o.id.toString()}
            columns={[
                { key: 'name', label: 'Reference', render: (o) => <span className="font-bold">{o.name}</span> },
                { key: 'bom', label: 'Bill of Material', render: (o) => o.bom?.name || o.bomId || '' },
                { key: 'qty', label: 'Quantity', render: (o) => `${o.productQty}` },
                {
                    key: 'state', label: 'Status', render: (o) => (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                ${o.state === 'draft' ? 'bg-white/10 text-white/60' :
                                o.state === 'progress' ? 'bg-blue-500/20 text-blue-400' :
                                    o.state === 'done' ? 'bg-green-500/20 text-green-400' :
                                        'bg-red-500/20 text-red-400'
                            }
            `}>
                            {o.state}
                        </span>
                    )
                },
            ]}
        />
    );

    const renderOrderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full h-4">
                </div>
            }
            headerContent={
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-4xl font-bold text-white">{activeOrder ? activeOrder.name : 'New Manufacturing Order'}</h1>
                    <div className="flex gap-2">
                        {activeOrder?.state === 'draft' && (
                            <button
                                onClick={handleStartOrder}
                                className="bg-primary-purple hover:bg-primary-purple/80 text-white px-4 py-2 flex items-center gap-2 rounded-md transition-colors"
                            >
                                Start Production
                            </button>
                        )}
                        {activeOrder?.state === 'progress' && (
                            <button
                                onClick={handleFinishOrder}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 flex items-center gap-2 rounded-md transition-colors"
                            >
                                Mark as Done
                            </button>
                        )}
                    </div>
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Bill of Material</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={orderFormData.bomId || ''}
                                disabled={activeOrder?.state !== 'draft' && !!activeOrder}
                                onChange={(e) => setOrderFormData({ ...orderFormData, bomId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select...</option>
                                {boms.map(b => (
                                    <option key={b.id} value={b.id} className="text-black">{b.name || b.code || `BOM ${b.id}`}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Product to Produce</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={orderFormData.productId || ''}
                                disabled={activeOrder?.state !== 'draft' && !!activeOrder}
                                onChange={(e) => setOrderFormData({ ...orderFormData, productId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select Product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Quantity to Produce</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={orderFormData.productQty || 1}
                                disabled={activeOrder?.state !== 'draft' && !!activeOrder}
                                onChange={(e) => setOrderFormData({ ...orderFormData, productQty: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="mt-8 border border-white/10 rounded-xl overflow-hidden bg-white/5">
                        {orderFormData.bomId ? (() => {
                            const selectedBom = boms.find(b => b.id === orderFormData.bomId);
                            if (!selectedBom) return null;

                            const bomLinesColumns: ColumnDef<any>[] = [
                                {
                                    key: 'product',
                                    label: 'Component',
                                    format: (val: any) => val?.name || ''
                                },
                                {
                                    key: 'productQty',
                                    label: 'To Consume',
                                    type: 'number',
                                    format: (val: any) => ((val || 1) * (orderFormData.productQty || 1)).toFixed(2)
                                }
                            ];

                            return (
                                <OdooDataGrid
                                    columns={bomLinesColumns}
                                    data={selectedBom.lines || []}
                                />
                            );
                        })() : (
                            <div className="p-4 text-center text-white/30 italic text-sm">Select a BOM to preview consumed components</div>
                        )}
                    </div>

                </div>
            }
        />
    );

    // --------------------------------------------------------------------------
    // BOMS VIEW
    // --------------------------------------------------------------------------
    const renderBomsList = () => (
        <OdooListBase
            data={boms.filter(b => b.name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.code?.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(b) => b.id.toString()}
            columns={[
                { key: 'name', label: 'BOM Name', render: (b) => <span className="font-bold">{b.name}</span> },
                { key: 'code', label: 'Code', render: (b) => b.code || '' },
                { key: 'type', label: 'Type', render: (b) => b.type || 'normal' },
                { key: 'components', label: 'Components', render: (b) => `${b.lines?.length || 0} items` },
            ]}
        />
    );

    const renderBomForm = () => (
        <OdooFormBase
            statusRibbon={<div className="h-4"></div>}
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Main Product / BOM Name"
                        value={bomFormData.name || ''}
                        onChange={(e) => setBomFormData({ ...bomFormData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">BOM Type</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={bomFormData.type || 'normal'}
                                onChange={(e) => setBomFormData({ ...bomFormData, type: e.target.value })}
                            >
                                <option value="normal" className="text-black">Manufacture this product</option>
                                <option value="phantom" className="text-black">Kit (phantom)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Reference Code</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={bomFormData.code || ''}
                                onChange={(e) => setBomFormData({ ...bomFormData, code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mt-8 border border-white/10 rounded-xl overflow-hidden bg-white/5">
                        <OdooDataGrid
                            columns={[
                                {
                                    key: 'productId',
                                    label: 'Component',
                                    type: 'select',
                                    options: products.map(p => ({ value: p.id, label: p.name })),
                                    editable: true
                                },
                                {
                                    key: 'productQty',
                                    label: 'Quantity',
                                    type: 'number',
                                    editable: true
                                }
                            ]}
                            data={bomFormData.lines || []}
                            onRowChange={(index: number, updatedRow: any) => {
                                updateBomLine(index, 'productId', updatedRow.productId);
                                updateBomLine(index, 'productQty', updatedRow.productQty);
                            }}
                            onDeleteRow={(index: number) => {
                                removeBomLine(index);
                            }}
                        />
                        {!activeBom && (
                            <div className="px-4 py-3 border-t border-white/10">
                                <button onClick={addBomLine} className="text-sm font-medium text-primary-purple hover:text-primary-purple/80">
                                    + Add a line
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            }
        />
    );


    return (
        <div className="h-full flex flex-col">
            <div className="flex bg-white/5 rounded-lg border border-white/10 p-1 mb-4 w-fit ml-6 mt-4 relative z-10">
                <button onClick={() => { setActiveTab('dashboard'); setCurrentView('dashboard'); }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-primary-purple text-white shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}><LayoutDashboard className="w-4 h-4" /> Overview</button>
                <button onClick={() => { setActiveTab('orders'); setCurrentView('list'); }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'bg-primary-purple text-white shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}><Factory className="w-4 h-4" /> Operations</button>
                <button onClick={() => { setActiveTab('boms'); setCurrentView('list'); }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'boms' ? 'bg-primary-purple text-white shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}><Layers className="w-4 h-4" /> Bills of Material</button>
            </div>

            <OdooViewManager
                title={activeTab === 'dashboard' ? 'Manufacturing Overview' : activeTab === 'orders' ? 'Manufacturing Orders' : 'Bills of Material'}
                currentView={currentView}
                onViewChange={setCurrentView}
                onNew={handleNew}
                onSave={handleSave}
                onDiscard={() => setCurrentView('list')}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                viewsAvailable={activeTab === 'dashboard' ? ['dashboard'] : ['list', 'form']}
            >
                {activeTab === 'dashboard' && currentView === 'dashboard' && renderDashboard()}
                {activeTab === 'orders' && currentView === 'list' && renderOrdersList()}
                {activeTab === 'orders' && currentView === 'form' && renderOrderForm()}
                {activeTab === 'boms' && currentView === 'list' && renderBomsList()}
                {activeTab === 'boms' && currentView === 'form' && renderBomForm()}
            </OdooViewManager>
        </div>
    );
};
