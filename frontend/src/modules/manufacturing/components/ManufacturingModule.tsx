import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooDataGrid, ColumnDef } from '@/components/shared/OdooDataGrid';
import { useManufacturingStore, MrpBom, MrpProduction, MrpBomLine, MrpWorkcenter, MrpRouting, MrpRoutingOperation } from '../stores/manufacturingStore';
import { useInventoryStore } from '@/modules/inventory/stores/inventoryStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';
import {
    LayoutDashboard, Factory, Cpu, Layers, Brain, GitCommit, Box, Package, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HierarchyView, HierarchyNode } from '@/components/views/HierarchyView';

import { WorkcenterDashboard } from './WorkcenterDashboard';

type ManufacturingView = 'dashboard' | 'orders' | 'boms' | 'workcenters' | 'routings' | 'quality';

export const ManufacturingModule: React.FC = () => {
    const {
        boms,
        orders,
        workcenters,
        routings,
        qualityChecks,
        fetchBoms,
        fetchOrders,
        fetchWorkcenters,
        fetchRoutings,
        fetchQualityChecks,
        createBom,
        createOrder,
        createWorkcenter,
        createRouting,
        startOrder,
        finishOrder,
        optimizeSchedule,
        aiSchedule,
        recordQualityData
    } = useManufacturingStore();

    const { products, fetchAllProducts } = useInventoryStore();

    const [view, setView] = useState<ManufacturingView>('dashboard');
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
        fetchWorkcenters();
        fetchRoutings();
        fetchQualityChecks();
        fetchAllProducts();
    }, []);

    const [activeWorkcenter, setActiveWorkcenter] = useState<MrpWorkcenter | null>(null);
    const [workcenterFormData, setWorkcenterFormData] = useState<Partial<MrpWorkcenter>>({
        active: true,
        timeEfficiency: 100,
        capacity: 1,
        oeeTarget: 90
    });

    const [activeRouting, setActiveRouting] = useState<MrpRouting | null>(null);
    const [routingFormData, setRoutingFormData] = useState<Partial<MrpRouting>>({
        active: true,
        operations: []
    });

    const handleNew = () => {
        if (view === 'dashboard' || view === 'orders') {
            setView('orders');
            setActiveOrder(null);
            setOrderFormData({ state: 'draft', productQty: 1, qtyProduced: 0 });
        } else if (view === 'boms') {
            setActiveBom(null);
            setBomFormData({ active: true, type: 'normal', productQty: 1, lines: [] });
        } else if (view === 'workcenters') {
            setActiveWorkcenter(null);
            setWorkcenterFormData({ active: true, timeEfficiency: 100, capacity: 1, oeeTarget: 90 });
        } else if (view === 'routings') {
            setActiveRouting(null);
            setRoutingFormData({ active: true, operations: [] });
        }
        setCurrentView('form');
    };

    const handleRowClick = (record: any) => {
        if (view === 'orders') {
            setActiveOrder(record);
            setOrderFormData(record);
        } else if (view === 'boms') {
            setActiveBom(record);
            setBomFormData(record);
        } else if (view === 'workcenters') {
            setActiveWorkcenter(record);
            setWorkcenterFormData(record);
        } else if (view === 'routings') {
            setActiveRouting(record);
            setRoutingFormData(record);
        }
        setCurrentView('form');
    };

    const handleSave = async () => {
        try {
            if (view === 'orders') {
                if (!activeOrder) await createOrder(orderFormData);
                else toast.error("Update not implemented");
            } else if (view === 'boms') {
                if (!activeBom) await createBom(bomFormData);
                else toast.error("Update not implemented");
            } else if (view === 'workcenters') {
                await createWorkcenter(workcenterFormData);
                toast.success("Work Center saved");
            } else if (view === 'routings') {
                await createRouting(routingFormData);
                toast.success("Routing saved");
            }
            setCurrentView('list');
            // Refresh data
            if (view === 'workcenters') fetchWorkcenters();
            if (view === 'routings') fetchRoutings();
        } catch (e) {
            toast.error("Failed to save");
        }
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
            { title: 'Manufacturing Orders', value: orders.length.toString(), icon: Factory, color: 'text-blue-400' },
            { title: 'In Progress', value: orders.filter(o => o.state === 'progress').length.toString(), icon: Cpu, color: 'text-yellow-400' },
            { title: 'Work Centers', value: workcenters.length.toString(), icon: Layers, color: 'text-green-400' }
        ];

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Manufacturing Overview</h2>
                    <button onClick={async () => {
                        try {
                            await optimizeSchedule();
                            toast.success("AI Production Schedule Optimized");
                        } catch (e: any) {
                            toast.error("AI Optimization failed");
                        }
                    }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-md shadow-lg transition-transform hover:scale-105 active:scale-95">
                        <Brain className="w-5 h-5" />
                        AI Optimize Schedule
                    </button>
                </div>

                {aiSchedule && aiSchedule.schedule && (
                    <GlassCard className="p-4 mb-6 border-blue-500/50">
                        <div className="flex items-center gap-3 mb-3">
                            <Brain className="w-6 h-6 text-blue-400" />
                            <h3 className="text-lg font-bold text-white">Optimized Schedule</h3>
                            <span className="text-xs bg-white/10 px-2 py-1 object-center rounded tracking-wider text-white/70">Efficiency: {(aiSchedule.metadata.efficiencyScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {aiSchedule.schedule.map((order: any, idx: number) => (
                                <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/10">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-bold text-white">Order #{order.orderId}</p>
                                        <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Priority {order.priorityScore}</span>
                                    </div>
                                    <p className="text-xs text-white/60 mb-2">{order.reasoning}</p>
                                    <div className="flex items-center gap-2 text-xs text-white/80">
                                        <GitCommit className="w-3 h-3 text-emerald-400" />
                                        Workcenter: {order.allocatedWorkcenter}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/80">
                                        ⏱ Start: {new Date(order.estimatedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {aiSchedule.qualityAlert && (
                            <div className="mt-4 p-3 rounded bg-red-500/10 border border-red-500/20">
                                <p className="text-sm font-semibold text-red-400">⚠️ Quality Alert</p>
                                <p className="text-xs text-red-400/80">{aiSchedule.qualityAlert}</p>
                            </div>
                        )}
                    </GlassCard>
                )}

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
                                <div key={o.id} className="flex justify-between items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors" onClick={() => { setView('orders'); handleRowClick(o); }}>
                                    <span className="text-white font-medium">{o.name}</span>
                                    <span className="text-white/60 text-sm bg-black/20 px-2 py-1 rounded">{o.state}</span>
                                </div>
                            ))}
                            {orders.length === 0 && <span className="text-white/40 italic">No recent orders</span>}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h3 className="text-xl font-medium text-white">Log Quality Data</h3>
                        </div>
                        <form className="space-y-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            try {
                                await recordQualityData(
                                    parseInt(formData.get('workcenterId') as string),
                                    parseFloat(formData.get('passRate') as string),
                                    parseFloat(formData.get('defectRate') as string),
                                    formData.get('temp') ? parseFloat(formData.get('temp') as string) : null,
                                    formData.get('humidity') ? parseFloat(formData.get('humidity') as string) : null
                                );
                                toast.success("Quality data logged to AI model");
                                e.currentTarget.reset();
                            } catch (e: any) {
                                toast.error("Failed to log quality data");
                            }
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">Work Center ID</label>
                                    <input name="workcenterId" type="number" required className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">Pass Rate (0-100)</label>
                                    <input name="passRate" type="number" step="0.1" required className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">Defect Rate (0-100)</label>
                                    <input name="defectRate" type="number" step="0.1" required className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">Temp (°C)</label>
                                    <input name="temp" type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">Humidity (%)</label>
                                    <input name="humidity" type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded text-sm font-bold transition-colors">
                                Submit to AI Analyzer
                            </button>
                        </form>
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


    const renderHierarchy = () => {
        if (view === 'boms' && activeBom) {
            const buildBomTree = (bom: MrpBom): HierarchyNode => ({
                id: bom.id,
                name: bom.name || bom.code || `BOM ${bom.id}`,
                subtitle: `Main Assembly - ${bom.productQty} Units`,
                color: '#8b5cf6',
                details: [
                    { icon: <Package className="w-3 h-3" />, text: bom.type === 'normal' ? 'Manufacture' : 'Kit' }
                ],
                children: (bom.lines || []).map(line => ({
                    id: `line-${line.id}`,
                    name: products.find(p => p.id === line.productId)?.name || `Component ${line.productId}`,
                    subtitle: `${line.productQty} Units`,
                    color: '#10b981',
                    details: [
                        { icon: <Box className="w-3 h-3" />, text: 'Component' }
                    ]
                }))
            });

            return <HierarchyView data={[buildBomTree(activeBom)]} />;
        } else if (view === 'boms') {
            return (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                    <Layers className="w-16 h-16 mb-4" />
                    <p className="text-xl font-bold uppercase tracking-widest">Select a BOM to View Hierarchy</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex bg-white/5 rounded-lg border border-white/10 p-1 mb-4 w-fit ml-6 mt-4 relative z-10 overflow-x-auto max-w-[calc(100vw-4rem)]">
                {[
                    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, viewType: 'dashboard' },
                    { id: 'orders', label: 'Operations', icon: Factory, viewType: 'list' },
                    { id: 'boms', label: 'Bills of Material', icon: Layers, viewType: 'list' },
                    { id: 'workcenters', label: 'Work Centers', icon: Cpu, viewType: 'list' },
                    { id: 'routings', label: 'Routings', icon: GitCommit, viewType: 'list' },
                    { id: 'quality', label: 'Quality', icon: Activity, viewType: 'list' },
                ].map(nav => {
                    const Icon = nav.icon;
                    const isActive = view === nav.id;
                    return (
                        <button
                            key={nav.id}
                            onClick={() => { setView(nav.id as ManufacturingView); setCurrentView(nav.viewType as ViewType); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-primary-purple text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" /> {nav.label}
                        </button>
                    );
                })}
            </div>

            <OdooViewManager
                title={(() => {
                    switch (view) {
                        case 'dashboard': return 'Manufacturing Overview';
                        case 'orders': return 'Manufacturing Orders';
                        case 'boms': return 'Bills of Material';
                        case 'workcenters': return 'Work Centers Hub';
                        case 'routings': return 'Production Routings';
                        case 'quality': return 'Quality Control';
                        default: return 'Manufacturing';
                    }
                })()}
                currentView={currentView}
                onViewChange={setCurrentView}
                onNew={handleNew}
                onSave={handleSave}
                onDiscard={() => setCurrentView('list')}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                viewsAvailable={(() => {
                    if (view === 'dashboard') return ['dashboard'];
                    if (view === 'boms') return ['list', 'hierarchy', 'form'];
                    return ['list', 'form'];
                })()}
            >
                {view === 'dashboard' && currentView === 'dashboard' && renderDashboard()}
                {view === 'orders' && currentView === 'list' && renderOrdersList()}
                {view === 'orders' && currentView === 'form' && renderOrderForm()}
                {view === 'boms' && currentView === 'list' && renderBomsList()}
                {view === 'boms' && currentView === 'hierarchy' && renderHierarchy()}
                {view === 'boms' && currentView === 'form' && renderBomForm()}

                {view === 'workcenters' && currentView === 'list' && (
                    <WorkcenterDashboard workcenters={workcenters} />
                )}
                {view === 'workcenters' && currentView === 'form' && (
                    <OdooFormBase
                        headerContent={<h1 className="text-4xl font-bold text-white">{activeWorkcenter ? activeWorkcenter.name : 'New Work Center'}</h1>}
                        leftPanels={
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm">Name</label>
                                        <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" value={workcenterFormData.name || ''} onChange={e => setWorkcenterFormData({ ...workcenterFormData, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm">Code</label>
                                        <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" value={workcenterFormData.code || ''} onChange={e => setWorkcenterFormData({ ...workcenterFormData, code: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm">OEE Target (%)</label>
                                        <input type="number" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" value={workcenterFormData.oeeTarget || 90} onChange={e => setWorkcenterFormData({ ...workcenterFormData, oeeTarget: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm">Capacity (units/hr)</label>
                                        <input type="number" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" value={workcenterFormData.capacity || 1} onChange={e => setWorkcenterFormData({ ...workcenterFormData, capacity: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                        }
                    />
                )}

                {view === 'routings' && currentView === 'list' && (
                    <OdooListBase
                        data={routings.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                        onRowClick={handleRowClick}
                        keyExtractor={(r) => r.id.toString()}
                        columns={[
                            { key: 'name', label: 'Routing Name', render: (r) => <span className="font-bold">{r.name}</span> },
                            { key: 'active', label: 'Active', render: (r) => r.active ? 'Yes' : 'No' },
                            { key: 'ops', label: 'Operations', render: (r) => `${r.operations?.length || 0} Steps` }
                        ]}
                    />
                )}
                {view === 'routings' && currentView === 'form' && (
                    <OdooFormBase
                        headerContent={<h1 className="text-4xl font-bold text-white">{activeRouting ? activeRouting.name : 'New Routing'}</h1>}
                        leftPanels={
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm">Routing Name</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" value={routingFormData.name || ''} onChange={e => setRoutingFormData({ ...routingFormData, name: e.target.value })} />
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-white font-medium mb-4">Operations</h3>
                                    <OdooDataGrid
                                        columns={[
                                            { key: 'name', label: 'Operation', type: 'string', editable: true },
                                            { key: 'workcenterId', label: 'Work Center', type: 'select', options: workcenters.map(wc => ({ value: wc.id, label: wc.name })), editable: true },
                                            { key: 'duration', label: 'Duration (m)', type: 'number', editable: true }
                                        ]}
                                        data={routingFormData.operations || []}
                                        onRowChange={(idx, row) => {
                                            const ops = [...(routingFormData.operations || [])];
                                            ops[idx] = row;
                                            setRoutingFormData({ ...routingFormData, operations: ops });
                                        }}
                                        onDeleteRow={(idx) => {
                                            const ops = [...(routingFormData.operations || [])];
                                            ops.splice(idx, 1);
                                            setRoutingFormData({ ...routingFormData, operations: ops });
                                        }}
                                    />
                                    <button onClick={() => setRoutingFormData({ ...routingFormData, operations: [...(routingFormData.operations || []), { id: Date.now(), name: 'New Op', workcenterId: workcenters[0]?.id, duration: 60, sequence: (routingFormData.operations?.length || 0) + 1, routingId: activeRouting?.id || 0 } as MrpRoutingOperation] })} className="mt-4 text-primary-purple text-sm font-medium">+ Add Operation</button>
                                </div>
                            </div>
                        }
                    />
                )}

                {view === 'quality' && currentView === 'list' && (
                    <div className="p-6">
                        <OdooListBase
                            data={qualityChecks.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                            columns={[
                                { key: 'name', label: 'Check', render: (c) => <span className="font-bold">{c.name}</span> },
                                { key: 'production', label: 'Source', render: (c) => (c as any).production?.name || '-' },
                                {
                                    key: 'state', label: 'Status', render: (c) => (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.state === 'pass' ? 'bg-green-500/20 text-green-400' :
                                            c.state === 'fail' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {c.state.toUpperCase()}
                                        </span>
                                    )
                                }
                            ]}
                            keyExtractor={(c) => c.id.toString()}
                        />
                    </div>
                )}
            </OdooViewManager>
        </div>
    );
};
