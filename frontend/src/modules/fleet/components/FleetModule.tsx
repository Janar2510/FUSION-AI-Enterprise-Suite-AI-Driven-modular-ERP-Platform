import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useFleetStore, FleetVehicle } from '../stores/fleetStore';
import { Car, Settings, Battery, Gauge, Activity } from 'lucide-react';

export const FleetModule: React.FC = () => {
    const {
        vehicles,
        fetchVehicles,
        createVehicle,
        updateVehicle,
        addVehicleLog
    } = useFleetStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<FleetVehicle | null>(null);
    const [formData, setFormData] = useState<Partial<FleetVehicle>>({
        state: 'active',
        odometer: 0,
        fuelType: 'gasoline'
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            state: 'active',
            odometer: 0,
            fuelType: 'gasoline'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: FleetVehicle) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateVehicle(activeRecord.id, formData);
        } else {
            const newVehicle = await createVehicle(formData);
            if (newVehicle) setActiveRecord(newVehicle);
        }
        setCurrentView('list');
    };

    const handleAction = async (state: string) => {
        if (!activeRecord) return;
        const updates: Partial<FleetVehicle> = { state };
        await updateVehicle(activeRecord.id, updates);
        setActiveRecord({ ...activeRecord, ...updates });
        setFormData({ ...formData, ...updates });
    };

    const handleAddLog = async () => {
        if (!activeRecord) return;
        const type = window.prompt("Log Type (fuel, service, other)", "service");
        if (!type) return;
        const desc = window.prompt("Description", "");
        const amount = parseFloat(window.prompt("Cost Amount", "0") || "0");
        const odo = parseFloat(window.prompt("Current Odometer", formData.odometer?.toString() || "0") || "0");

        await addVehicleLog(activeRecord.id, {
            type, description: desc, amount, odometer: odo
        });

        // update top level odometer
        if (odo > (formData.odometer || 0)) {
            await updateVehicle(activeRecord.id, { odometer: odo });
            setFormData(prev => ({ ...prev, odometer: odo }));
        }
    };

    const activeCount = vehicles.filter(v => v.state === 'active').length;
    const totalLogs = vehicles.reduce((acc, v) => acc + (v._count?.logs || 0), 0);
    const evCount = vehicles.filter(v => v.fuelType === 'electric').length;

    const renderDashboardCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                        <Car className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Active Vehicles</p>
                        <h3 className="text-2xl font-bold text-white">
                            {activeCount}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                        <Battery className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Electric Vehicles</p>
                        <h3 className="text-2xl font-bold text-white">
                            {evCount}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Services</p>
                        <h3 className="text-2xl font-bold text-white">
                            {totalLogs}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div>
            {renderDashboardCards()}
            <OdooListBase
                data={vehicles.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || JSON.stringify(t).toLowerCase().includes(searchTerm.toLowerCase()))}
                onRowClick={handleRowClick}
                keyExtractor={(t) => t.id.toString()}
                columns={[
                    { key: 'name', label: 'Vehicle Name', render: (t) => <span className="font-bold">{t.name}</span> },
                    { key: 'licensePlate', label: 'License Plate', render: (t) => t.licensePlate || '-' },
                    { key: 'brandModel', label: 'Brand & Model', render: (t) => `${t.brand || ''} ${t.model || ''}`.trim() || '-' },
                    { key: 'fuelType', label: 'Engine', render: (t) => <span className="capitalize">{t.fuelType || '-'}</span> },
                    { key: 'odometer', label: 'Odometer', render: (t) => t.odometer.toLocaleString() },
                    {
                        key: 'state', label: 'Status', render: (t) => (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                            ${t.state === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}
                        `}>
                                {t.state}
                            </span>
                        )
                    },
                ]}
            />
        </div>
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {formData.state === 'active' ? (
                            <button onClick={() => handleAction('inactive')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-sm transition-colors border border-white/10">Retire</button>
                        ) : (
                            <button onClick={() => handleAction('active')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Re-activate</button>
                        )}
                        {activeRecord && (
                            <button onClick={handleAddLog} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-blue-500/30">
                                Add Log
                            </button>
                        )}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Vehicle Name (e.g. Truck 01)..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="flex gap-4 mt-2">
                        <input
                            type="text"
                            className="bg-transparent text-xl text-yellow-500 font-mono border-b border-white/20 outline-none focus:border-primary-purple transition-all w-48 placeholder-white/20 font-bold"
                            placeholder="License Plate"
                            value={formData.licensePlate || ''}
                            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                        />
                    </div>
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Brand</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.brand || ''}
                                placeholder="E.g. Ford, Tesla"
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Model</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.model || ''}
                                placeholder="E.g. F-150, Model 3"
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Color</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.color || ''}
                                placeholder="E.g. White"
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Engine / Fuel Type</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.fuelType || ''}
                                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                            >
                                <option value="gasoline">Gasoline</option>
                                <option value="diesel">Diesel</option>
                                <option value="electric">Electric</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Gauge className="w-5 h-5 text-purple-400" />
                            Current Odometer
                        </h3>
                        <div className="space-y-2 flex items-baseline gap-2">
                            <input
                                type="number"
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary-purple transition-all text-2xl font-bold font-mono text-right"
                                value={formData.odometer || 0}
                                onChange={(e) => setFormData({ ...formData, odometer: parseFloat(e.target.value) })}
                            />
                            <span className="text-white/40">km</span>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            Service Logs
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                <span className="text-white/60">Total Logs</span>
                                <span className="text-white font-bold">{formData._count?.logs || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Fleet"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('list')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'form']}
        >
            {currentView === 'kanban' && renderDashboard()}
            {currentView === 'list' && renderDashboard()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
