import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooDataGrid } from '@/components/shared/OdooDataGrid';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';
import { useInventoryStore, Product, StockPicking, StockMove } from '../stores/inventoryStore';
import { Package, Truck, ArrowRightLeft, Database, ChevronRight, LayoutDashboard, ListChecks } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const InventoryModule: React.FC = () => {
    const {
        products,
        pickings,
        pickingTypes,
        quants,
        fetchAllProducts,
        fetchCategories,
        fetchAllPickings,
        fetchPickingTypes,
        fetchQuants,
        createProduct,
        updateProduct,
        createPicking,
        validatePicking
    } = useInventoryStore();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'pickings' | 'products' | 'quants'>('dashboard');
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeProduct, setActiveProduct] = useState<Product | null>(null);
    const [productFormData, setProductFormData] = useState<Partial<Product>>({});

    const [activePicking, setActivePicking] = useState<StockPicking | null>(null);
    const [pickingFormData, setPickingFormData] = useState<Partial<StockPicking>>({});
    const [moves, setMoves] = useState<StockMove[]>([]);

    // Filter picking lists based on dashboard clicks
    const [currentPickingTypeId, setCurrentPickingTypeId] = useState<number | undefined>();

    useEffect(() => {
        fetchAllProducts();
        fetchCategories();
        fetchPickingTypes();
        fetchAllPickings();
        fetchQuants();
    }, []);

    const handleTabChange = (tab: 'dashboard' | 'pickings' | 'products' | 'quants') => {
        setActiveTab(tab);
        setCurrentView(tab === 'dashboard' ? 'dashboard' : 'list');
        setSearchTerm('');
        setCurrentPickingTypeId(undefined);
    };

    const handleNew = () => {
        if (activeTab === 'products') {
            setCurrentView('form');
            setActiveProduct(null);
            setProductFormData({ type: 'product', salePrice: 0, costPrice: 0, qtyOnHand: 0, qtyForecasted: 0, active: true });
        } else {
            // For both pickings and dashboard, default to creating a new Transfer
            setActiveTab('pickings');
            setCurrentView('form');
            setActivePicking(null);
            setPickingFormData({ state: 'draft', pickingTypeId: currentPickingTypeId || pickingTypes[0]?.id });
            setMoves([]);
        }
    };

    const handleSave = async () => {
        try {
            if (activeTab === 'products') {
                if (activeProduct) await updateProduct(activeProduct.id, productFormData);
                else await createProduct(productFormData);
            } else if (activeTab === 'pickings') {
                if (activePicking) {
                    toast('Update for existing pickings not implemented. Validate instead.', { icon: 'ℹ️' });
                } else {
                    const payload = { ...pickingFormData, moves };
                    await createPicking(payload);
                    toast.success('Transfer created successfully');
                }
            }
            setCurrentView('list');
        } catch (e: any) {
            toast.error(e.message || 'Error saving record');
        }
    };

    const renderDashboard = () => {
        const metrics = [
            { title: 'Total Products', value: products.length.toString(), icon: Package },
            { title: 'Total Transfers', value: pickings.length.toString(), icon: Truck },
            { title: 'To Process', value: pickings.filter(p => !['done', 'cancel'].includes(p.state)).length.toString(), icon: ListChecks }
        ];

        return (
            <div className="space-y-6">
                <MetricGrid metrics={metrics} />
                <h3 className="text-xl font-medium text-white px-2 mt-8 mb-4">Operations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pickingTypes.map(pt => (
                        <GlassCard key={pt.id} className="p-6 cursor-pointer hover:border-primary-purple/50 transition-colors" onClick={() => {
                            setCurrentPickingTypeId(pt.id);
                            fetchAllPickings(pt.id);
                            handleTabChange('pickings');
                        }}>
                            <div className="flex flex-col h-full space-y-4">
                                <div className="flex justify-between items-start text-white">
                                    <h4 className="text-lg font-bold">{pt.name}</h4>
                                    <ArrowRightLeft className={`w-5 h-5 ${pt.code === 'incoming' ? 'text-green-400' : pt.code === 'outgoing' ? 'text-blue-400' : 'text-orange-400'}`} />
                                </div>
                                <div className="flex-1"></div>
                                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                                    <div>
                                        <span className="text-2xl font-bold text-white block">{pt._count?.pickings || 0}</span>
                                        <span className="text-xs text-white/50 uppercase font-semibold">To Process</span>
                                    </div>
                                    <div className="text-primary-purple bg-primary-purple/10 p-2 rounded-lg hover:bg-primary-purple/20 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        );
    };

    const renderProductsList = () => (
        <OdooListBase
            data={products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.internalRef?.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={(prod) => { setActiveProduct(prod); setProductFormData(prod); setCurrentView('form'); }}
            keyExtractor={(p) => p.id.toString()}
            columns={[
                { key: 'internalRef', label: 'Internal Reference', render: (p) => p.internalRef || '-' },
                { key: 'name', label: 'Name', render: (p) => <span className="font-bold">{p.name}</span> },
                { key: 'salePrice', label: 'Sales Price', render: (p) => `$${p.salePrice.toLocaleString()}` },
                { key: 'costPrice', label: 'Cost', render: (p) => `$${p.costPrice.toLocaleString()}` },
                { key: 'type', label: 'Product Type', render: (p) => <span className="uppercase text-xs font-semibold text-white/60">{p.type}</span> }
            ]}
        />
    );

    const renderProductsForm = () => (
        <OdooFormBase
            statusRibbon={<div className="flex justify-end w-full"><span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold uppercase">Active</span></div>}
            headerContent={
                <div className="flex flex-col gap-4">
                    <input type="text" placeholder="e.g. Mechanical Keyboard" className="text-4xl font-bold bg-transparent border-none outline-none text-white focus:ring-0 p-0 placeholder-white/20" value={productFormData.name || ''} onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })} />
                    <div className="flex gap-4 mt-2">
                        <GlassCard className="!p-3 flex gap-3 items-center min-w-[120px]">
                            <Database className="text-blue-400 w-6 h-6" />
                            <div>
                                <span className="block text-2xl font-bold text-white">{quants.filter(q => q.productId === activeProduct?.id).reduce((sum, q) => sum + q.quantity, 0)}</span>
                                <span className="block text-[10px] uppercase text-white/50 font-bold">On Hand</span>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2"><label className="text-white/60 text-sm font-medium">Product Type</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all" value={productFormData.type || 'consu'} onChange={(e) => setProductFormData({ ...productFormData, type: e.target.value })}>
                                <option value="consu" className="text-black">Consumable</option><option value="service" className="text-black">Service</option><option value="product" className="text-black">Storable Product</option>
                            </select>
                        </div>
                        <div className="space-y-2"><label className="text-white/60 text-sm font-medium">Internal Reference</label>
                            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all" value={productFormData.internalRef || ''} onChange={(e) => setProductFormData({ ...productFormData, internalRef: e.target.value })} />
                        </div>
                        <div className="space-y-2"><label className="text-white/60 text-sm font-medium">Sales Price</label>
                            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all" value={productFormData.salePrice || 0} onChange={(e) => setProductFormData({ ...productFormData, salePrice: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-2"><label className="text-white/60 text-sm font-medium">Cost Price</label>
                            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all" value={productFormData.costPrice || 0} onChange={(e) => setProductFormData({ ...productFormData, costPrice: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                </div>
            }
            rightPanels={<div />}
        />
    );

    const renderPickingsList = () => (
        <OdooListBase
            data={pickings.filter(p => !currentPickingTypeId || p.pickingTypeId === currentPickingTypeId).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.origin?.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={(pick) => { setActivePicking(pick); setPickingFormData(pick); setMoves(pick.moves || []); setCurrentView('form'); }}
            keyExtractor={(p) => p.id.toString()}
            columns={[
                { key: 'name', label: 'Reference', render: (p) => <span className="font-bold">{p.name}</span> },
                { key: 'location', label: 'From', render: (p) => p.location?.completeName || '-' },
                { key: 'locationDest', label: 'To', render: (p) => p.locationDest?.completeName || '-' },
                { key: 'origin', label: 'Source Document', render: (p) => p.origin || '-' },
                { key: 'createdAt', label: 'Scheduled Date', render: (p) => p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString() : '-' },
                {
                    key: 'state', label: 'Status', render: (p) => (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${p.state === 'done' ? 'bg-purple-500/20 text-purple-400' : p.state === 'draft' ? 'bg-gray-500/20 text-gray-400' : 'bg-blue-500/20 text-blue-400'}`}>{p.state}</span>
                    )
                }
            ]}
        />
    );

    const renderPickingsForm = () => {
        const gridColumns = [
            { key: 'productId', label: 'Product', type: 'select' as const, width: '30%', editable: !activePicking, options: products.map(p => ({ value: p.id, label: p.name })) },
            { key: 'name', label: 'Description', type: 'string' as const, editable: !activePicking },
            { key: 'productQty', label: 'Demand', type: 'number' as const, editable: !activePicking, align: 'right' as const },
            { key: 'qtyDone', label: 'Done', type: 'number' as const, editable: pickingFormData.state !== 'done', align: 'right' as const },
        ];

        return (
            <OdooFormBase
                statusRibbon={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex gap-2">
                            {pickingFormData.state !== 'done' && activePicking && (
                                <button onClick={async () => {
                                    try { await validatePicking(activePicking.id); toast.success('Picking Validated'); setCurrentView('list'); }
                                    catch (e: any) { toast.error(e.message || 'Validation failed'); }
                                }} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-md shadow-lg transition-transform hover:scale-105 active:scale-95">Validate</button>
                            )}
                        </div>
                        <div className="flex text-sm font-medium">
                            {['draft', 'waiting', 'ready', 'done'].map((state, idx) => (
                                <div key={state} className="flex items-center relative">
                                    <div className={`px-4 py-2 flex items-center pr-6 uppercase ${pickingFormData.state === state || (pickingFormData.state === 'done' && state === 'done') ? 'text-primary-purple font-bold' : 'text-white/40'}`}>{state}</div>
                                    {idx < 3 && <ChevronRight className="w-5 h-5 absolute -right-2 text-white/20 z-10" />}
                                </div>
                            ))}
                        </div>
                    </div>
                }
                headerContent={<h2 className="text-3xl font-bold text-white">{pickingFormData.name || 'New Transfer'}</h2>}
                leftPanels={
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="text-white/60 text-sm font-medium">Operation Type</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all" value={pickingFormData.pickingTypeId || ''} onChange={(e) => setPickingFormData({ ...pickingFormData, pickingTypeId: parseInt(e.target.value) })} disabled={!!activePicking}>
                                    <option value="" className="text-black">Select Type...</option>
                                    {pickingTypes.map(pt => <option key={pt.id} value={pt.id} className="text-black">{pt.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-white/60 text-sm font-medium">Source Document</label>
                                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all" value={pickingFormData.origin || ''} onChange={(e) => setPickingFormData({ ...pickingFormData, origin: e.target.value })} disabled={!!activePicking} />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-white/10">
                            <h3 className="text-lg font-medium text-white mb-4">Operations</h3>
                            <OdooDataGrid data={moves} columns={gridColumns} onRowChange={(idx, updatedRow) => { const nm = [...moves]; nm[idx] = updatedRow; setMoves(nm); }} onAddRow={() => !activePicking && setMoves([...moves, { name: 'Item', productQty: 1, qtyDone: 0, locationId: pickingTypes.find(p => p.id === pickingFormData.pickingTypeId)?.defaultLocationSrcId || 0, locationDestId: pickingTypes.find(p => p.id === pickingFormData.pickingTypeId)?.defaultLocationDestId || 0, productId: products[0]?.id || 0, state: 'draft' }])} onDeleteRow={!activePicking ? (idx) => setMoves(moves.filter((_, i) => i !== idx)) : undefined} />
                        </div>
                    </div>
                }
            />
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex bg-white/5 rounded-lg border border-white/10 p-1 mb-4 w-fit ml-6 mt-4 relative z-10">
                <button onClick={() => handleTabChange('dashboard')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-primary-purple text-white shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}><LayoutDashboard className="w-4 h-4" /> Overview</button>
                <button onClick={() => handleTabChange('pickings')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'pickings' ? 'bg-primary-purple text-white shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}><Truck className="w-4 h-4" /> Transfers</button>
                <button onClick={() => handleTabChange('products')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'products' ? 'bg-primary-purple text-white shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}><Package className="w-4 h-4" /> Products</button>
            </div>

            <OdooViewManager
                title={activeTab === 'dashboard' ? 'Inventory Overview' : activeTab === 'products' ? 'Products' : 'Transfers'}
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

                {activeTab === 'products' && currentView === 'list' && renderProductsList()}
                {activeTab === 'products' && currentView === 'form' && renderProductsForm()}

                {activeTab === 'pickings' && currentView === 'list' && renderPickingsList()}
                {activeTab === 'pickings' && currentView === 'form' && renderPickingsForm()}
            </OdooViewManager>
        </div>
    );
};
