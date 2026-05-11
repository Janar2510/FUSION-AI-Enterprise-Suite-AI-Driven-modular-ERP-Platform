import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useSubscriptionStore, Subscription, SubscriptionLine } from '../stores/subscriptionStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { useInventoryStore } from '@/modules/inventory/stores/inventoryStore';
import { CreditCard, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PLAN_BADGES: Record<string, string> = {
    enterprise: 'bg-amber-500/20 text-amber-400',
    pro: 'bg-blue-500/20 text-blue-400',
    starter: 'bg-gray-500/20 text-gray-400',
};
const STATE_BADGES: Record<string, { label: string; cls: string }> = {
    draft:     { label: 'Draft',      cls: 'bg-gray-500/20 text-gray-400' },
    active:    { label: 'Active',     cls: 'bg-green-500/20 text-green-400' },
    paused:    { label: 'Paused',     cls: 'bg-yellow-500/20 text-yellow-400' },
    cancelled: { label: 'Cancelled',  cls: 'bg-red-500/20 text-red-400' },
    expired:   { label: 'Expired',    cls: 'bg-white/10 text-white/40' },
    // legacy keys
    in_progress: { label: 'Active',  cls: 'bg-green-500/20 text-green-400' },
    churned:     { label: 'Churned', cls: 'bg-red-500/20 text-red-400' },
    closed:      { label: 'Closed',  cls: 'bg-yellow-500/20 text-yellow-400' },
};

export const SubscriptionsModule: React.FC = () => {
    const {
        items, analytics, fetch, fetchAnalytics, create, update, remove,
        activate, pause, cancel, renew,
        addLine, updateLine, removeLine,
    } = useSubscriptionStore();
    const partners = usePartnerStore(s => s.partners);
    const fetchPartners = usePartnerStore(s => s.fetchPartners);
    const { products, fetchAllProducts } = useInventoryStore();

    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRecord, setActiveRecord] = useState<Subscription | null>(null);
    const [formData, setFormData] = useState<any>({ state: 'draft', plan: 'starter', mrr: 0, recurringRule: 'monthly' });
    const [newLine, setNewLine] = useState<Partial<SubscriptionLine>>({ name: '', quantity: 1, priceUnit: 0, discount: 0 });

    useEffect(() => { fetch(); fetchAnalytics(); fetchPartners(); fetchAllProducts(); }, []);

    const activeSubs = items.filter(s => ['active', 'in_progress'].includes(s.state));
    const totalMrr = analytics?.mrr ?? activeSubs.reduce((s, sub) => s + sub.mrr, 0);

    const filtered = items.filter(s => {
        const t = searchTerm.toLowerCase();
        return (s.name?.toLowerCase().includes(t) || s.partner?.name?.toLowerCase().includes(t));
    });

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({ name: '', state: 'draft', plan: 'starter', mrr: 0, recurringRule: 'monthly', partnerId: null });
        setCurrentView('form');
    };

    const handleRowClick = (r: Subscription) => {
        setActiveRecord(r);
        setFormData({ ...r });
        setCurrentView('form');
    };

    const handleSave = async () => {
        const payload = { ...formData, mrr: parseFloat(formData.mrr) || 0 };
        try {
            if (activeRecord) {
                const { partner, lines, createdAt, id, updatedAt, ...rest } = payload;
                await update(activeRecord.id, rest);
            } else {
                await create(payload);
            }
            setCurrentView('list');
        } catch (e: any) {
            toast.error(e.message || 'Failed to save');
        }
    };

    const handleDelete = async () => {
        if (activeRecord && window.confirm('Delete this subscription?')) {
            await remove(activeRecord.id);
            setCurrentView('list');
        }
    };

    const renderStateBadge = (state: string) => {
        const s = STATE_BADGES[state] ?? STATE_BADGES.draft;
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
    };

    const renderDashboard = () => {
        const cards = [
            { label: 'MRR', value: `$${Math.round(totalMrr).toLocaleString()}`, color: 'from-green-500 to-emerald-500' },
            { label: 'ARR', value: `$${Math.round(totalMrr * 12).toLocaleString()}`, color: 'from-blue-500 to-cyan-500' },
            { label: 'Active', value: analytics?.active ?? activeSubs.length, color: 'from-amber-500 to-orange-500' },
            { label: 'Paused', value: analytics?.paused ?? 0, color: 'from-yellow-500 to-orange-500' },
        ];
        return (
            <div className="grid grid-cols-4 gap-4 mb-6">
                {cards.map(c => (
                    <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <p className="text-white/50 text-sm mb-1">{c.label}</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</p>
                    </div>
                ))}
            </div>
        );
    };

    const renderList = () => (
        <>
            {renderDashboard()}
            <OdooListBase<Subscription>
                data={filtered}
                onRowClick={handleRowClick}
                keyExtractor={(s) => s.id.toString()}
                columns={[
                    { key: 'name', label: 'Name', render: (s) => <span className="font-bold">{s.name || '—'}</span> },
                    { key: 'partner', label: 'Customer', render: (s) => s.partner?.name || '—' },
                    { key: 'plan', label: 'Plan', render: (s) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGES[s.plan] || PLAN_BADGES.starter}`}>{s.plan}</span> },
                    { key: 'mrr', label: 'MRR', render: (s) => <span className="font-mono text-green-400">${s.mrr.toLocaleString()}</span> },
                    { key: 'recurringRule', label: 'Billing', render: (s) => <span className="capitalize">{s.recurringRule}</span> },
                    { key: 'nextBilling', label: 'Next Bill', render: (s) => s.nextBilling ? new Date(s.nextBilling).toLocaleDateString() : '—' },
                    { key: 'state', label: 'Status', render: (s) => renderStateBadge(s.state) },
                ]}
            />
        </>
    );

    const currentLines = activeRecord?.lines ?? formData.lines ?? [];
    const linesTotal = currentLines.reduce((s: number, l: SubscriptionLine) => s + l.priceSubtotal, 0);

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center gap-2 flex-wrap w-full">
                    {activeRecord && formData.state === 'draft' && (
                        <button onClick={async () => { await activate(activeRecord.id); setFormData((p: any) => ({ ...p, state: 'active' })); toast.success('Subscription activated'); }}
                            className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-3 py-1.5 rounded text-sm transition-colors border border-green-500/30">
                            Activate
                        </button>
                    )}
                    {activeRecord && formData.state === 'active' && (
                        <>
                            <button onClick={async () => {
                                try {
                                    const result = await renew(activeRecord.id);
                                    toast.success(`Renewal invoice ${result.invoice?.name} created`);
                                } catch { toast.error('Renewal failed'); }
                            }}
                                className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded text-sm transition-colors border border-blue-500/30 flex items-center gap-1">
                                <RefreshCw className="w-3.5 h-3.5" /> Renew
                            </button>
                            <button onClick={async () => { await pause(activeRecord.id); setFormData((p: any) => ({ ...p, state: 'paused' })); }}
                                className="bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white px-3 py-1.5 rounded text-sm transition-colors border border-yellow-500/30">
                                Pause
                            </button>
                            <button onClick={async () => { if (window.confirm('Cancel subscription?')) { await cancel(activeRecord.id); setFormData((p: any) => ({ ...p, state: 'cancelled' })); } }}
                                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded text-sm transition-colors border border-red-500/30">
                                Cancel
                            </button>
                        </>
                    )}
                    {activeRecord && formData.state === 'paused' && (
                        <button onClick={async () => { await activate(activeRecord.id); setFormData((p: any) => ({ ...p, state: 'active' })); }}
                            className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-3 py-1.5 rounded text-sm transition-colors border border-green-500/30">
                            Resume
                        </button>
                    )}
                    <div className="flex-1" />
                    {renderStateBadge(formData.state || 'draft')}
                    {activeRecord && (
                        <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-3 py-1.5 rounded text-sm transition-colors border border-red-500/30">
                            Delete
                        </button>
                    )}
                </div>
            }
            headerContent={
                <input type="text"
                    className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
                    placeholder="Subscription name..." value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            }
            leftPanels={
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Customer</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500"
                                value={formData.partnerId || ''} onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}>
                                <option value="">Select customer...</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Plan</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500"
                                value={formData.plan || 'starter'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}>
                                <option value="starter">Starter</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Billing Cycle</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500"
                                value={formData.recurringRule || 'monthly'} onChange={(e) => setFormData({ ...formData, recurringRule: e.target.value })}>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annual">Annual</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Start Date</label>
                            <input type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 [&::-webkit-calendar-picker-indicator]:filter-invert"
                                value={formData.startDate?.split('T')[0] || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                        </div>
                    </div>

                    {/* Subscription Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-medium">Line Items</h3>
                            {activeRecord && (
                                <button onClick={async () => {
                                    if (!newLine.name) return;
                                    const qty = newLine.quantity ?? 1;
                                    const price = newLine.priceUnit ?? 0;
                                    const disc = newLine.discount ?? 0;
                                    await addLine(activeRecord.id, {
                                        ...newLine,
                                        priceSubtotal: qty * price * (1 - disc / 100),
                                    });
                                    setNewLine({ name: '', quantity: 1, priceUnit: 0, discount: 0 });
                                    await fetch();
                                    const updated = useSubscriptionStore.getState().items.find(i => i.id === activeRecord.id);
                                    if (updated) { setActiveRecord(updated); setFormData(updated); }
                                }}
                                    className="text-primary-500 text-xs hover:text-white flex items-center gap-1 transition-colors">
                                    <Plus className="w-3.5 h-3.5" /> Add Line
                                </button>
                            )}
                        </div>

                        <div className="bg-white/3 rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-white/10 text-white/50 text-xs">
                                    <th className="py-2 px-3 text-left">Description</th>
                                    <th className="py-2 px-3 text-right w-16">Qty</th>
                                    <th className="py-2 px-3 text-right w-24">Price</th>
                                    <th className="py-2 px-3 text-right w-16">Disc%</th>
                                    <th className="py-2 px-3 text-right w-24">Subtotal</th>
                                    {activeRecord && <th className="py-2 px-3 w-8"></th>}
                                </tr></thead>
                                <tbody>
                                    {currentLines.map((l: SubscriptionLine) => (
                                        <tr key={l.id} className="border-b border-white/5">
                                            <td className="py-2 px-3 text-white">{l.name}{l.product && <span className="text-white/40 text-xs ml-2">({l.product.name})</span>}</td>
                                            <td className="py-2 px-3 text-right text-white/70 font-mono">{l.quantity}</td>
                                            <td className="py-2 px-3 text-right text-white/70 font-mono">${l.priceUnit.toFixed(2)}</td>
                                            <td className="py-2 px-3 text-right text-white/50">{l.discount > 0 ? `${l.discount}%` : '—'}</td>
                                            <td className="py-2 px-3 text-right text-green-400 font-mono font-bold">${l.priceSubtotal.toFixed(2)}</td>
                                            {activeRecord && (
                                                <td className="py-2 px-3">
                                                    <button onClick={async () => { await removeLine(activeRecord.id, l.id); await fetch(); const updated = useSubscriptionStore.getState().items.find(i => i.id === activeRecord.id); if (updated) { setActiveRecord(updated); setFormData(updated); } }}
                                                        className="text-white/30 hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {activeRecord && (
                                        <tr className="border-b border-white/5 bg-primary-500/5">
                                            <td className="py-2 px-3">
                                                <input type="text" placeholder="Description…" value={newLine.name || ''}
                                                    onChange={e => setNewLine({ ...newLine, name: e.target.value })}
                                                    className="w-full bg-transparent text-white text-sm outline-none placeholder-white/30" />
                                            </td>
                                            <td className="py-2 px-3"><input type="number" min="0" step="1" value={newLine.quantity ?? 1}
                                                onChange={e => setNewLine({ ...newLine, quantity: parseFloat(e.target.value) })}
                                                className="w-full bg-transparent text-white text-sm outline-none text-right font-mono" /></td>
                                            <td className="py-2 px-3"><input type="number" min="0" step="0.01" value={newLine.priceUnit ?? 0}
                                                onChange={e => setNewLine({ ...newLine, priceUnit: parseFloat(e.target.value) })}
                                                className="w-full bg-transparent text-white text-sm outline-none text-right font-mono" /></td>
                                            <td className="py-2 px-3"><input type="number" min="0" max="100" value={newLine.discount ?? 0}
                                                onChange={e => setNewLine({ ...newLine, discount: parseFloat(e.target.value) })}
                                                className="w-full bg-transparent text-white text-sm outline-none text-right font-mono" /></td>
                                            <td className="py-2 px-3 text-right text-white/40 text-sm font-mono">
                                                ${((newLine.quantity ?? 1) * (newLine.priceUnit ?? 0) * (1 - (newLine.discount ?? 0) / 100)).toFixed(2)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    )}
                                    {currentLines.length > 0 && (
                                        <tr className="font-bold">
                                            <td colSpan={activeRecord ? 4 : 4} className="py-2 px-3 text-white">Total MRR</td>
                                            <td className="py-2 px-3 text-right text-green-400 font-mono">${linesTotal.toFixed(2)}</td>
                                            {activeRecord && <td></td>}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {currentLines.length === 0 && !activeRecord && (
                                <div className="py-6 text-center text-white/30 text-sm">No line items — save the subscription first, then add products</div>
                            )}
                            {currentLines.length === 0 && activeRecord && (
                                <div className="py-4 text-center text-white/30 text-sm">Click "Add Line" to add products or services</div>
                            )}
                        </div>
                    </div>
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-amber-400" /> Summary
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-white/60">Plan</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGES[formData.plan] || ''}`}>{formData.plan}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-white/60">MRR</span>
                            <span className="text-green-400 font-medium font-mono">${Math.round(linesTotal || formData.mrr || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-white/60">ARR</span>
                            <span className="text-white font-medium font-mono">${Math.round((linesTotal || formData.mrr || 0) * 12).toLocaleString()}</span>
                        </div>
                        {formData.nextBilling && (
                            <div className="flex justify-between">
                                <span className="text-white/60">Next Billing</span>
                                <span className="text-white/80 text-xs">{new Date(formData.nextBilling).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Subscriptions"
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

export default SubscriptionsModule;
