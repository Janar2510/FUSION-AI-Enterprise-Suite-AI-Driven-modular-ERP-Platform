import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooDataGrid } from '@/components/shared/OdooDataGrid';
import { usePlmStore, MrpEco } from '../stores/plmStore';
import { useInventoryStore } from '@/modules/inventory/stores/inventoryStore';
import { useManufacturingStore } from '@/modules/manufacturing/stores/manufacturingStore';
import { GitCommit, GitBranch, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';

export const PlmModule: React.FC = () => {
    const { ecos, fetch, create, update, loading } = usePlmStore();
    const { products, fetchAllProducts } = useInventoryStore();
    const { boms, fetchBoms } = useManufacturingStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeEco, setActiveEco] = useState<MrpEco | null>(null);
    const [formData, setFormData] = useState<Partial<MrpEco>>({});

    useEffect(() => {
        fetch();
        fetchAllProducts();
        fetchBoms();
    }, []);

    const handleNew = () => {
        setActiveEco(null);
        setFormData({
            stage: 'draft',
            type: 'product',
            approvalState: 'none',
            name: 'New ECO'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: MrpEco) => {
        setActiveEco(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeEco) {
            await update(activeEco.id, formData);
        } else {
            const newEco = await create(formData);
            if (newEco) {
                setActiveEco(newEco);
                setFormData(newEco);
            }
        }
        setCurrentView('kanban');
    };

    const handleAction = async (action: string) => {
        if (!activeEco) return;
        let updates: Partial<MrpEco> = {};

        switch (action) {
            case 'confirm': updates = { stage: 'confirmed' }; break;
            case 'approve': updates = { approvalState: 'approved' }; break;
            case 'reject': updates = { approvalState: 'rejected' }; break;
            case 'apply': updates = { stage: 'done' }; break; // Backend handles effectivityDate
        }

        const res = await update(activeEco.id, updates);
        if (res) {
            setActiveEco(res);
            setFormData(res);
        }
    };

    // --- KANBAN VIEW ---
    const renderKanban = () => {
        const stages = ['draft', 'confirmed', 'progress', 'done'];

        return (
            <div className="flex gap-6 h-full overflow-x-auto pb-4">
                {stages.map(stage => {
                    const stageEcos = ecos.filter(e =>
                        e.stage === stage &&
                        (e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    return (
                        <div key={stage} className="flex-none w-80 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-medium capitalize flex items-center gap-2">
                                    {stage === 'draft' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
                                    {stage === 'confirmed' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                                    {stage === 'progress' && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
                                    {stage === 'done' && <div className="w-2 h-2 rounded-full bg-green-400" />}
                                    {stage}
                                </h3>
                                <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-full">
                                    {stageEcos.length}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {stageEcos.map(eco => (
                                    <GlassCard
                                        key={eco.id}
                                        onClick={() => handleRowClick(eco)}
                                        className="p-4 cursor-pointer hover:border-primary-purple/50 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-white group-hover:text-primary-purple transition-colors">{eco.name}</span>
                                            {eco.approvalState === 'approved' && <CheckCircle className="w-4 h-4 text-green-400" />}
                                        </div>
                                        <p className="text-white/60 text-xs line-clamp-2 mb-3 h-8">
                                            {eco.description || 'No description provided.'}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-white/40 mt-auto pt-2 border-t border-white/10">
                                            <span className="flex items-center gap-1">
                                                <GitBranch className="w-3 h-3" /> {eco.type}
                                            </span>
                                            <span className="font-mono">{new Date(eco.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </GlassCard>
                                ))}

                                {stageEcos.length === 0 && (
                                    <div className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white/[0.02]">
                                        <GitCommit className="w-6 h-6 text-white/20 mb-2" />
                                        <span className="text-white/40 text-sm">No ECOs</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- LIST VIEW ---
    const renderList = () => (
        <OdooListBase
            data={ecos.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={e => e.id.toString()}
            columns={[
                { key: 'name', label: 'Reference', render: e => <span className="font-bold">{e.name}</span> },
                { key: 'type', label: 'Type', render: e => <span className="capitalize">{e.type}</span> },
                { key: 'product', label: 'Product', render: e => e.product?.name || '-' },
                { key: 'bom', label: 'BOM', render: e => e.bom?.name || e.bom?.code || '-' },
                {
                    key: 'approvalState', label: 'Approval', render: e => (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${e.approvalState === 'approved' ? 'bg-green-500/20 text-green-400' :
                            e.approvalState === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                'bg-white/10 text-white/60'
                            }`}>
                            {e.approvalState}
                        </span>
                    )
                },
                { key: 'stage', label: 'Stage', render: e => <span className="capitalize bg-black/20 px-2 py-1 rounded-full text-xs">{e.stage}</span> },
            ]}
        />
    );

    // --- FORM VIEW ---
    const renderForm = () => {
        const isReadonly = activeEco?.stage === 'done';

        return (
            <OdooFormBase
                statusRibbon={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            {/* Action Buttons */}
                            {activeEco?.stage === 'draft' && (
                                <button onClick={() => handleAction('confirm')} className="bg-primary-purple hover:bg-primary-purple/80 text-white px-4 py-1.5 rounded text-sm transition-colors">Start Revision</button>
                            )}

                            {activeEco?.stage === 'confirmed' && activeEco?.approvalState === 'none' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleAction('approve')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Approve
                                    </button>
                                    <button onClick={() => handleAction('reject')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Reject</button>
                                </div>
                            )}

                            {activeEco?.stage === 'confirmed' && activeEco?.approvalState === 'approved' && (
                                <button onClick={() => handleAction('apply')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] shadow-blue-500/20">Apply Changes</button>
                            )}
                        </div>

                        {/* Status Bubbles */}
                        {activeEco && (
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full uppercase border ${activeEco.approvalState === 'approved' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                    activeEco.approvalState === 'rejected' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                        'border-white/20 text-white/60 bg-white/5'
                                    }`}>
                                    {activeEco.approvalState}
                                </span>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full uppercase border border-primary-purple/30 text-primary-purple bg-primary-purple/10`}>
                                    {activeEco.stage}
                                </span>
                            </div>
                        )}
                    </div>
                }
                headerContent={
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                            placeholder="ECO Reference"
                            value={formData.name || ''}
                            readOnly={isReadonly}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                }
                leftPanels={
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Type</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                        value={formData.type || 'product'}
                                        disabled={isReadonly}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="product" className="text-black">Product Update</option>
                                        <option value="bom" className="text-black">BOM Revision</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Product</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                        value={formData.productId || ''}
                                        disabled={isReadonly}
                                        onChange={(e) => setFormData({ ...formData, productId: parseInt(e.target.value) })}
                                    >
                                        <option value="" className="text-black">Select Product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {formData.type === 'bom' && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-white/60 text-sm font-medium">Bill of Material to Revise</label>
                                        <select
                                            className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                            value={formData.bomId || ''}
                                            disabled={isReadonly}
                                            onChange={(e) => setFormData({ ...formData, bomId: parseInt(e.target.value) })}
                                        >
                                            <option value="" className="text-black">Select BOM...</option>
                                            {boms.map(b => (
                                                <option key={b.id} value={b.id} className="text-black">{b.name || b.code || `BOM ${b.id}`}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <label className="text-white/60 text-sm font-medium mb-2 block">Reason for Change</label>
                            <textarea
                                className="w-full min-h-[120px] bg-black/20 border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-primary-purple transition-all resize-y"
                                placeholder="Describe why this ECO is necessary..."
                                value={formData.description || ''}
                                readOnly={isReadonly}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </GlassCard>

                        {formData.type === 'bom' && formData.bom && (
                            <GlassCard className="p-6">
                                <h3 className="text-lg font-medium text-white mb-4">BOM Revision Lines</h3>
                                <div className="h-64 rounded-lg overflow-hidden border border-white/10">
                                    <OdooDataGrid
                                        data={formData.bom.lines || []}
                                        columns={[
                                            {
                                                key: 'product',
                                                label: 'Component',
                                                format: (val: any) => val?.name || 'Unknown Component'
                                            },
                                            {
                                                key: 'productQty',
                                                label: 'Quantity',
                                                width: '150px'
                                            }
                                        ]}
                                    />
                                </div>
                                <p className="text-xs text-white/40 mt-3 pt-3 border-t border-white/10">
                                    * Editing BOM component lines through ECOs requires Odoo PLM versioning features (Coming in v2).
                                </p>
                            </GlassCard>
                        )}
                    </div>
                }
                rightPanels={
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" /> Effectivity
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm">When to apply?</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all text-sm"
                                        value={formData.effectivity || 'as_soon_as_possible'}
                                        disabled={isReadonly}
                                        onChange={(e) => setFormData({ ...formData, effectivity: e.target.value })}
                                    >
                                        <option value="as_soon_as_possible" className="text-black">As soon as possible</option>
                                        <option value="date" className="text-black">At Date</option>
                                    </select>
                                </div>
                                {formData.effectivityDate && (
                                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded flex justify-between items-center text-sm">
                                        <span className="text-green-400 font-medium">Applied On:</span>
                                        <span className="text-white font-mono">{new Date(formData.effectivityDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                }
            />
        );
    };

    return (
        <OdooViewManager
            title="PLM / Engineering Change Orders"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('kanban')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'form']}
        >
            {currentView === 'kanban' && renderKanban()}
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
