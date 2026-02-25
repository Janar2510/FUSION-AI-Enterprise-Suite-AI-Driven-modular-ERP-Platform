import React, { useEffect, useState, useMemo } from 'react';
import { Truck, Zap, RefreshCw, AlertTriangle, Box, Database, Network, Plus, Settings } from 'lucide-react';
import { useSupplyChainStore } from '../stores/supplyChainStore';
import { OdooViewManager, ViewType } from '../../../components/views/OdooViewManager';
import { HierarchyView } from '../../../components/views/HierarchyView';
import { MetricGrid } from '../../../components/shared/MetricCard';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';
import { OdooDataGrid, ColumnDef } from '../../../components/shared/OdooDataGrid';
import { OrderpointModal } from './OrderpointModal';
import { clsx } from 'clsx';

const SupplyChainModule: React.FC = () => {
    const {
        orderpoints,
        routes,
        stats,
        loading,
        fetchData,
        runReplenishment,
        createOrderpoint,
        updateOrderpoint,
        deleteOrderpoint
    } = useSupplyChainStore();

    const [view, setView] = useState<'dashboard' | 'rules' | 'flow'>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrderpoint, setSelectedOrderpoint] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const metrics = [
        { title: 'Reordering Rules', value: stats.totalOrderpoints, icon: Zap, color: 'text-yellow-400' },
        { title: 'Active Routes', value: stats.activeRoutes, icon: Network, color: 'text-blue-400' },
        { title: 'Avg Lead Time', value: `${stats.avgLeadTime} Days`, icon: Truck, color: 'text-purple-400' },
        { title: 'Stock Alerts', value: orderpoints.filter(op => op.product.qtyOnHand < op.productMinQty).length, icon: AlertTriangle, color: 'text-red-400' },
    ];

    const columns = useMemo<ColumnDef<any>[]>(() => [
        { key: 'name', label: 'Reference', width: '150px', editable: true },
        { key: 'product.name', label: 'Product', width: '250px' },
        { key: 'location.name', label: 'Location', width: '200px' },
        { key: 'productMinQty', label: 'Min Qty', type: 'number', width: '100px', editable: true, align: 'center' },
        { key: 'productMaxQty', label: 'Max Qty', type: 'number', width: '100px', editable: true, align: 'center' },
        { key: 'active', label: 'Active', type: 'boolean', width: '80px', editable: true, align: 'center' }
    ], []);

    const renderDashboard = () => (
        <div className="space-y-8 animate-in fade-in duration-700">
            <MetricGrid metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Replenishment Control Center */}
                <GlassCard className="lg:col-span-2 p-10 relative overflow-hidden group border-primary-purple/20">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary-purple/10 rounded-lg">
                                <Zap className="w-6 h-6 text-primary-purple" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Neural Replenishment</h2>
                        </div>
                        <p className="text-white/60 text-lg mb-8 max-w-xl leading-relaxed">
                            Orchestrate AI-driven procurement across your global supply chain. The engine analyzes real-time velocity to auto-generate draft RFQs for optimal vendors.
                        </p>
                        <GradientButton
                            onClick={runReplenishment}
                            isLoading={loading}
                            icon={RefreshCw}
                            size="lg"
                            className="shadow-2xl shadow-primary-purple/20"
                        >
                            Execute Global Run
                        </GradientButton>
                    </div>
                    <Database className="absolute -bottom-20 -right-20 w-80 h-80 text-primary-purple/5 group-hover:text-primary-purple/10 transition-all duration-1000 rotate-12 group-hover:rotate-0" />
                </GlassCard>

                {/* Quick Stock Forecast */}
                <GlassCard className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Box className="w-6 h-6 text-primary-purple" />
                        Critical Alerts
                    </h3>
                    <div className="space-y-4">
                        {orderpoints
                            .filter(op => op.product.qtyOnHand < op.productMinQty)
                            .slice(0, 5)
                            .map((op, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                    <div>
                                        <p className="font-bold text-white">{op.product.name}</p>
                                        <p className="text-xs text-white/40 uppercase tracking-widest">{op.location.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-red-400 tabular-nums">{op.product.qtyOnHand}</p>
                                        <p className="text-[10px] text-white/40 font-bold uppercase">Min: {op.productMinQty}</p>
                                    </div>
                                </div>
                            ))}
                        {orderpoints.length === 0 && (
                            <div className="py-12 text-center text-white/20 italic">
                                No critical alerts detected.
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );

    const renderFlow = () => (
        <div className="h-[calc(100vh-250px)] animate-in zoom-in-95 duration-500">
            <GlassCard className="h-full overflow-hidden p-0 border-white/5">
                <HierarchyView
                    data={routes.map(r => ({
                        id: r.id.toString(),
                        name: r.name,
                        type: 'route',
                        children: (r.rules || []).map((rule: any) => ({
                            id: `rule-${rule.id}`,
                            name: rule.name || 'Untitled Rule',
                            type: 'rule',
                            children: [
                                { id: `loc-src-${rule.id}`, name: rule.locationSrc?.name || 'Input', type: 'location' },
                                { id: `loc-dest-${rule.id}`, name: rule.locationDest?.name || 'Output', type: 'location' }
                            ]
                        }))
                    }))}
                />
            </GlassCard>
        </div>
    );

    const handleNew = () => {
        setSelectedOrderpoint(null);
        setIsModalOpen(true);
    };

    const handleRowChange = async (index: number, updatedRow: any) => {
        await updateOrderpoint(updatedRow.id, updatedRow);
    };

    const handleDelete = async (index: number) => {
        const op = orderpoints[index];
        if (confirm(`Are you sure you want to delete ${op.name}?`)) {
            await deleteOrderpoint(op.id);
        }
    };

    return (
        <div className="p-8 pb-20">
            <OdooViewManager
                title={
                    <div className="flex items-center gap-3">
                        <Truck className="w-8 h-8 text-primary-purple" />
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Supply Chain Hub</h1>
                    </div>
                }
                currentView={view === 'dashboard' ? 'dashboard' : view === 'flow' ? 'hierarchy' : 'list'}
                onViewChange={(v: ViewType) => {
                    if (v === 'dashboard') setView('dashboard');
                    else if (v === 'hierarchy') setView('flow');
                    else setView('rules');
                }}
                onNew={handleNew}
                viewsAvailable={['dashboard', 'list', 'hierarchy']}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            >
                <div className="mt-6 font-sans">
                    {view === 'dashboard' && renderDashboard()}
                    {view === 'rules' && (
                        <GlassCard className="p-0 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <OdooDataGrid
                                columns={columns}
                                data={orderpoints}
                                onRowChange={handleRowChange}
                                onDeleteRow={handleDelete}
                            />
                        </GlassCard>
                    )}
                    {view === 'flow' && renderFlow()}
                </div>
            </OdooViewManager>

            <OrderpointModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={selectedOrderpoint ? (data) => updateOrderpoint(selectedOrderpoint.id, data) : createOrderpoint}
                initialData={selectedOrderpoint}
            />
        </div>
    );
};

export default SupplyChainModule;
