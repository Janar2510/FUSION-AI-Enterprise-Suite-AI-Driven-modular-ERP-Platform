import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useFleetStore, FleetVehicle, FleetContract } from '../stores/fleetStore';
import { Car, FileText, BarChart2, AlertTriangle, CheckCircle } from 'lucide-react';

const FUEL_TYPES = ['gasoline', 'diesel', 'electric', 'hybrid', 'lpg'];
const LOG_TYPES = ['fuel', 'repair', 'service', 'other'];
const CONTRACT_TYPES = ['insurance', 'leasing', 'service'];

const VEHICLE_STATE: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    inactive: 'bg-gray-500/20 text-gray-400',
    reserved: 'bg-amber-500/20 text-amber-400',
};

type Tab = 'vehicles' | 'contracts' | 'analytics';

export const FleetModule: React.FC = () => {
    const { vehicles, contracts, analytics, fetchVehicles, createVehicle, updateVehicle, deleteVehicle, addVehicleLog, fetchContracts, createContract, updateContract, deleteContract, fetchAnalytics } = useFleetStore();

    const [tab, setTab] = useState<Tab>('vehicles');
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeVehicle, setActiveVehicle] = useState<FleetVehicle | null>(null);
    const [vehicleForm, setVehicleForm] = useState<Partial<FleetVehicle>>({ state: 'active', odometer: 0, fuelType: 'gasoline' });
    const [showLogForm, setShowLogForm] = useState(false);
    const [logForm, setLogForm] = useState({ type: 'service', description: '', amount: 0, odometer: 0 });

    const [activeContract, setActiveContract] = useState<FleetContract | null>(null);
    const [contractForm, setContractForm] = useState<Partial<FleetContract>>({});

    useEffect(() => { fetchVehicles(); fetchContracts(); fetchAnalytics(); }, []);

    const renderBadge = (state: string, map: Record<string, string>) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${map[state] || 'bg-gray-500/20 text-gray-400'}`}>{state}</span>
    );

    // ── Vehicles ───────────────────────────────────────────────────────────────

    const filteredVehicles = vehicles.filter(v => {
        const t = searchTerm.toLowerCase();
        return v.name.toLowerCase().includes(t) || v.licensePlate?.toLowerCase().includes(t) || v.brand?.toLowerCase().includes(t);
    });

    const handleNewVehicle = () => { setActiveVehicle(null); setVehicleForm({ state: 'active', odometer: 0, fuelType: 'gasoline' }); setCurrentView('form'); };
    const handleVehicleRowClick = (v: FleetVehicle) => { setActiveVehicle(v); setVehicleForm(v); setShowLogForm(false); setCurrentView('form'); };

    const handleSaveVehicle = async () => {
        const { logs, contracts: _c, _count, ...rest } = vehicleForm as any;
        if (activeVehicle) await updateVehicle(activeVehicle.id, rest);
        else await createVehicle(rest);
        setCurrentView('list');
    };

    const handleAddLog = async () => {
        if (!activeVehicle) return;
        await addVehicleLog(activeVehicle.id, logForm);
        if (logForm.odometer > (vehicleForm.odometer || 0)) {
            setVehicleForm(p => ({ ...p, odometer: logForm.odometer }));
        }
        setLogForm({ type: 'service', description: '', amount: 0, odometer: 0 });
        setShowLogForm(false);
        await fetchVehicles();
    };

    const renderVehicleList = () => (
        <>
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Fleet Size</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{vehicles.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Active</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{vehicles.filter(v => v.state === 'active').length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Cost</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">${(analytics?.totalCost || 0).toLocaleString()}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Expiring Contracts</p><p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">{analytics?.expiringContracts?.length || 0}</p></div>
            </div>
            <OdooListBase data={filteredVehicles} onRowClick={handleVehicleRowClick} keyExtractor={v => v.id.toString()} columns={[
                { key: 'name', label: 'Vehicle', render: v => <span className="font-bold">{v.name}</span> },
                { key: 'brand', label: 'Brand/Model', render: v => `${v.brand || '—'} ${v.model || ''}`.trim() },
                { key: 'licensePlate', label: 'Plate', render: v => <span className="font-mono">{v.licensePlate || '—'}</span> },
                { key: 'fuelType', label: 'Fuel', render: v => v.fuelType || '—' },
                { key: 'odometer', label: 'Odometer', render: v => `${v.odometer.toLocaleString()} km` },
                { key: 'state', label: 'Status', render: v => renderBadge(v.state, VEHICLE_STATE) },
                { key: 'logs', label: 'Logs', render: v => v._count?.logs || 0 },
            ]} />
        </>
    );

    const renderVehicleForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {['active', 'inactive', 'reserved'].map(s => (
                            <button key={s} onClick={async () => { await updateVehicle(activeVehicle!.id, { state: s }); setVehicleForm(p => ({ ...p, state: s })); }}
                                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${vehicleForm.state === s ? 'bg-primary-purple border-primary-purple text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    {activeVehicle && (
                        <button onClick={async () => { if (window.confirm('Delete vehicle and all logs?')) { await deleteVehicle(activeVehicle.id); setCurrentView('list'); } }}
                            className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Delete</button>
                    )}
                </div>
            }
            headerContent={
                <input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent outline-none focus:border-primary-purple w-full"
                    placeholder="Vehicle name..."
                    value={vehicleForm.name || ''} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} />
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2"><label className="text-white/60 text-sm">Brand</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={vehicleForm.brand || ''} onChange={e => setVehicleForm({ ...vehicleForm, brand: e.target.value })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Model</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={vehicleForm.model || ''} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">License Plate</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white font-mono outline-none" value={vehicleForm.licensePlate || ''} onChange={e => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Color</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={vehicleForm.color || ''} onChange={e => setVehicleForm({ ...vehicleForm, color: e.target.value })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Fuel Type</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={vehicleForm.fuelType || 'gasoline'} onChange={e => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}>
                                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Odometer (km)</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={vehicleForm.odometer || 0} onChange={e => setVehicleForm({ ...vehicleForm, odometer: parseFloat(e.target.value) })} /></div>
                    </div>

                    {/* Cost log entry */}
                    {activeVehicle && (
                        <div className="pt-4 border-t border-white/10">
                            <button onClick={() => setShowLogForm(!showLogForm)} className="text-primary-purple hover:underline text-sm">+ Add Cost Log</button>
                            {showLogForm && (
                                <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-white/60 text-xs">Type</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none text-sm" value={logForm.type} onChange={e => setLogForm({ ...logForm, type: e.target.value })}>
                                            {LOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1"><label className="text-white/60 text-xs">Amount ($)</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none text-sm" value={logForm.amount} onChange={e => setLogForm({ ...logForm, amount: parseFloat(e.target.value) })} /></div>
                                    <div className="space-y-1"><label className="text-white/60 text-xs">Odometer</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none text-sm" value={logForm.odometer} onChange={e => setLogForm({ ...logForm, odometer: parseFloat(e.target.value) })} /></div>
                                    <div className="space-y-1"><label className="text-white/60 text-xs">Description</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none text-sm" value={logForm.description} onChange={e => setLogForm({ ...logForm, description: e.target.value })} /></div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button onClick={() => setShowLogForm(false)} className="px-4 py-1.5 rounded text-sm text-white/60 hover:text-white">Cancel</button>
                                        <button onClick={handleAddLog} className="bg-primary-purple text-white px-4 py-1.5 rounded text-sm">Save Log</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-blue-400" /> Vehicle Summary</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Status</span>{renderBadge(vehicleForm.state || 'active', VEHICLE_STATE)}</div>
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Odometer</span><span className="text-white font-mono">{(vehicleForm.odometer || 0).toLocaleString()} km</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Logs</span><span className="text-white">{activeVehicle?._count?.logs || 0}</span></div>
                    </div>
                </div>
            }
        />
    );

    // ── Contracts ──────────────────────────────────────────────────────────────

    const filteredContracts = contracts.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.vehicle?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleNewContract = () => { setActiveContract(null); setContractForm({ state: 'new', contractType: 'insurance', costPerMonth: 0 }); setCurrentView('form'); };
    const handleContractRowClick = (c: FleetContract) => { setActiveContract(c); setContractForm(c); setCurrentView('form'); };
    const handleSaveContract = async () => {
        const { vehicle, ...rest } = contractForm as any;
        if (activeContract) await updateContract(activeContract.id, rest); else await createContract(rest);
        setCurrentView('list');
    };

    const isExpiringSoon = (dateStr: string | null) => {
        if (!dateStr) return false;
        const days = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return days <= 30 && days >= 0;
    };

    const renderContractList = () => (
        <>
            {analytics?.expiringContracts?.length ? (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4 text-sm text-amber-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {analytics.expiringContracts.length} contract(s) expiring within 30 days
                </div>
            ) : null}
            <OdooListBase data={filteredContracts} onRowClick={handleContractRowClick} keyExtractor={c => c.id.toString()} columns={[
                { key: 'name', label: 'Contract', render: c => <span className="font-bold">{c.name}</span> },
                { key: 'vehicle', label: 'Vehicle', render: c => c.vehicle?.name || '—' },
                { key: 'contractType', label: 'Type', render: c => c.contractType },
                { key: 'costPerMonth', label: 'Cost/Month', render: c => `$${c.costPerMonth.toLocaleString()}` },
                { key: 'expirationDate', label: 'Expires', render: c => c.expirationDate ? (
                    <span className={isExpiringSoon(c.expirationDate) ? 'text-amber-400 font-bold' : ''}>{new Date(c.expirationDate).toLocaleDateString()}</span>
                ) : 'Open-ended' },
                { key: 'state', label: 'Status', render: c => <span className="px-2 py-0.5 rounded-full text-xs font-medium uppercase bg-blue-500/20 text-blue-400">{c.state}</span> },
            ]} />
        </>
    );

    const renderContractForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex justify-end w-full">
                    {activeContract && <button onClick={async () => { if (window.confirm('Delete contract?')) { await deleteContract(activeContract.id); setCurrentView('list'); } }} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm border border-red-500/30">Delete</button>}
                </div>
            }
            headerContent={<input type="text" className="text-4xl font-bold bg-transparent text-white border-b border-transparent outline-none focus:border-primary-purple w-full" placeholder="Contract name..." value={contractForm.name || ''} onChange={e => setContractForm({ ...contractForm, name: e.target.value })} />}
            leftPanels={
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2"><label className="text-white/60 text-sm">Vehicle</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={contractForm.vehicleId || ''} onChange={e => setContractForm({ ...contractForm, vehicleId: parseInt(e.target.value) })}>
                            <option value="">Select vehicle...</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Contract Type</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={contractForm.contractType || 'insurance'} onChange={e => setContractForm({ ...contractForm, contractType: e.target.value })}>
                            {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Cost / Month</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={contractForm.costPerMonth || 0} onChange={e => setContractForm({ ...contractForm, costPerMonth: parseFloat(e.target.value) })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Insurer / Provider</label><input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={contractForm.insurer || ''} onChange={e => setContractForm({ ...contractForm, insurer: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Start Date</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={contractForm.startDate ? contractForm.startDate.slice(0, 10) : ''} onChange={e => setContractForm({ ...contractForm, startDate: new Date(e.target.value).toISOString() })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Expiration Date</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={contractForm.expirationDate ? contractForm.expirationDate.slice(0, 10) : ''} onChange={e => setContractForm({ ...contractForm, expirationDate: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                    <div className="space-y-2 col-span-2"><label className="text-white/60 text-sm">Notes</label><textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none resize-none" value={contractForm.notes || ''} onChange={e => setContractForm({ ...contractForm, notes: e.target.value })} /></div>
                </div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /> Contract Summary</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Monthly Cost</span><span className="text-white font-mono">${(contractForm.costPerMonth || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Annual Cost</span><span className="text-white font-mono">${((contractForm.costPerMonth || 0) * 12).toLocaleString()}</span></div>
                    </div>
                </div>
            }
        />
    );

    // ── Analytics ──────────────────────────────────────────────────────────────

    const renderAnalytics = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Vehicles</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{analytics?.totalVehicles || 0}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Cost</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">${(analytics?.totalCost || 0).toLocaleString()}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Last 30 Days</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">${(analytics?.last30DaysCost || 0).toLocaleString()}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Expiring Contracts</p><p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">{analytics?.expiringContracts?.length || 0}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-purple-400" /> Cost by Category</h3>
                    {analytics?.costByType?.length ? (
                        <div className="space-y-3">
                            {analytics.costByType.map(c => (
                                <div key={c.type}>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-white/60 capitalize">{c.type}</span><span className="text-white font-mono">${c.total.toLocaleString()} ({c.count} logs)</span></div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${Math.min(100, (c.total / (analytics.totalCost || 1)) * 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-white/40 text-sm">No cost logs yet.</p>}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" /> Expiring Contracts</h3>
                    {analytics?.expiringContracts?.length ? (
                        <div className="space-y-3">
                            {analytics.expiringContracts.map(c => (
                                <div key={c.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                                    <div><p className="text-white font-medium">{c.name}</p><p className="text-white/50 text-xs">{c.vehicle?.name}</p></div>
                                    <span className="text-amber-400 font-medium">{c.expirationDate ? new Date(c.expirationDate).toLocaleDateString() : '—'}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-white/40 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> No contracts expiring soon.</p>}
                </div>
            </div>
        </div>
    );

    // ── Tab routing ────────────────────────────────────────────────────────────

    const handleTabChange = (t: Tab) => { setTab(t); setCurrentView('list'); setSearchTerm(''); };
    const handleNew = () => { if (tab === 'vehicles') handleNewVehicle(); else if (tab === 'contracts') handleNewContract(); };
    const handleSave = () => { if (tab === 'vehicles') handleSaveVehicle(); else if (tab === 'contracts') handleSaveContract(); };

    return (
        <OdooViewManager title="Fleet" currentView={currentView} onViewChange={setCurrentView} onNew={tab !== 'analytics' ? handleNew : undefined} onSave={handleSave} onDiscard={() => setCurrentView('list')} searchTerm={searchTerm} onSearchChange={setSearchTerm} viewsAvailable={['list', 'form']}>
            {currentView === 'list' && (
                <>
                    <div className="flex gap-1 mb-6 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
                        {[{ id: 'vehicles', label: 'Vehicles', icon: Car }, { id: 'contracts', label: 'Contracts', icon: FileText }, { id: 'analytics', label: 'Analytics', icon: BarChart2 }].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => handleTabChange(id as Tab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-primary-purple text-white' : 'text-white/60 hover:text-white'}`}>
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </div>
                    {tab === 'vehicles' && renderVehicleList()}
                    {tab === 'contracts' && renderContractList()}
                    {tab === 'analytics' && renderAnalytics()}
                </>
            )}
            {currentView === 'form' && tab === 'vehicles' && renderVehicleForm()}
            {currentView === 'form' && tab === 'contracts' && renderContractForm()}
        </OdooViewManager>
    );
};
