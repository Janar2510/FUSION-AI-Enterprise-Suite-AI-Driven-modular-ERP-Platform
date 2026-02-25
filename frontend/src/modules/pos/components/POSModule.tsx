import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { usePosStore } from '../stores/posStore';

export const POSModule: React.FC = () => {
    const {
        configs,
        sessions,
        fetchConfigs,
        fetchSessions,
        openSession,
        closeSession
    } = usePosStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // We treat kanban as the cards view
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchConfigs();
        fetchSessions();
    }, []);

    const getActiveSessionForConfig = (configId: number) => {
        return sessions.find(s => s.configId === configId && s.state === 'opened');
    };

    const handleOpenSession = async (configId: number) => {
        await openSession(configId);
    };

    const handleCloseSession = async (sessionId: number) => {
        await closeSession(sessionId);
    };

    // We override standard views heavily here because POS doesn't quite fit standard CRUD
    const renderPOSDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {configs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((config) => {
                const activeSession = getActiveSessionForConfig(config.id);

                return (
                    <div key={config.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-56">
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">{config.name}</h3>
                                <p className="text-sm text-white/50 mb-4">Point of Sale terminal</p>

                                {activeSession ? (
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-blue-400">
                                            Status: <span>Opened ({activeSession.name})</span>
                                        </div>
                                        <div className="text-xs text-white/40">
                                            Started at {new Date(activeSession.startAt).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-white/40">
                                            Orders: {activeSession._count?.orders || 0}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm font-medium text-white/40">
                                        Status: <span>Closed</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 border-t border-white/10 flex justify-between items-center gap-3">
                            <div className="flex gap-2 w-full">
                                {activeSession ? (
                                    <>
                                        <button
                                            // TODO: Route to actual terminal UI
                                            className="flex-1 bg-primary-purple hover:bg-primary-purple/80 text-white py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Resume
                                        </button>
                                        <button
                                            onClick={() => handleCloseSession(activeSession.id)}
                                            className="flex-1 bg-white/10 hover:bg-white/20 text-white/80 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Close Session
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleOpenSession(config.id)}
                                        className="flex-1 bg-primary-purple hover:bg-primary-purple/80 text-white py-2 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] shadow-primary-purple/20"
                                    >
                                        New Session
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderSessionsList = () => (
        <div className="pt-4">
            <h2 className="text-xl font-bold text-white mb-4 px-4">Past Sessions</h2>
            <OdooListBase
                data={sessions.filter(s => s.state === 'closed' && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.config?.name.toLowerCase().includes(searchTerm.toLowerCase())))}
                onRowClick={() => { }} // Read only for now
                keyExtractor={(s) => s.id.toString()}
                columns={[
                    { key: 'name', label: 'Session', render: (s) => <span className="font-bold">{s.name}</span> },
                    { key: 'config', label: 'Point of Sale', render: (s) => s.config?.name || '' },
                    { key: 'start', label: 'Start Time', render: (s) => new Date(s.startAt).toLocaleString() },
                    { key: 'stop', label: 'Stop Time', render: (s) => s.stopAt ? new Date(s.stopAt).toLocaleString() : '' },
                    { key: 'orders', label: 'Orders', render: (s) => s._count?.orders || 0 },
                ]}
            />
        </div>
    );

    return (
        <OdooViewManager
            title="Point of Sale"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={() => { }} // No 'new config' from UI for now
            onSave={() => { }}
            onDiscard={() => { }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
        >
            {currentView === 'kanban' && renderPOSDashboard()}
            {currentView === 'list' && renderSessionsList()}
        </OdooViewManager>
    );
};
