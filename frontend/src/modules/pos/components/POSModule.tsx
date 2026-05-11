import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { usePosStore } from '../stores/posStore';
import { Search, UserCheck, Award, Sparkles } from 'lucide-react';
import { SelfOrderKiosk } from './SelfOrderKiosk';

export const POSModule: React.FC = () => {
    const {
        configs,
        sessions,
        currentLoyaltyCard,
        fetchConfigs,
        fetchSessions,
        openSession,
        closeSession,
        fetchLoyaltyPrograms,
        fetchLoyaltyCard,
    } = usePosStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // We treat kanban as the cards view
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTerminalId, setActiveTerminalId] = useState<number | null>(null);
    const [loyaltySearch, setLoyaltySearch] = useState('');

    useEffect(() => {
        fetchConfigs();
        fetchSessions();
        fetchLoyaltyPrograms();
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
                                            onClick={() => setActiveTerminalId(activeSession.id)}
                                            className="flex-1 bg-primary-500 hover:bg-primary-500/80 text-white py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Resume Terminal
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
                                        className="flex-1 bg-primary-500 hover:bg-primary-500/80 text-white py-2 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] shadow-primary-500/20"
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

    const renderTerminalView = () => {
        const session = sessions.find(s => s.id === activeTerminalId);
        if (!session) return null;

        return (
            <div className="flex h-full gap-6 text-white pt-4">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Checkout: {session.config?.name}</h2>
                        <button
                            onClick={() => setActiveTerminalId(null)}
                            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg"
                        >
                            Exit
                        </button>
                    </div>

                    {/* Mock Cart */}
                    <div className="flex-1 border-y border-white/10 py-4 flex flex-col justify-center items-center text-white/40">
                        <p>Items will appear here.</p>
                        <p className="text-sm mt-2">Use product scanner to begin transaction.</p>
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-auto">
                        <div className="flex justify-between text-lg mb-2">
                            <span>Subtotal</span>
                            <span>$0.00</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-primary-500">
                            <span>Total</span>
                            <span>$0.00</span>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 py-4 rounded-xl font-bold text-xl border border-green-500/50">
                                Pay Cash
                            </button>
                            <button className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 py-4 rounded-xl font-bold text-xl border border-blue-500/50">
                                Pay Card
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-96 flex flex-col gap-6">
                    {/* Customer & Loyalty Panel */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-primary-500" />
                            Customer Profile
                        </h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Customer ID or Email..."
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                value={loyaltySearch}
                                onChange={(e) => setLoyaltySearch(e.target.value)}
                            />
                            <button
                                onClick={() => fetchLoyaltyCard(parseInt(loyaltySearch) || 1)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>

                        {currentLoyaltyCard ? (
                            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-primary-500/20 p-2 rounded-full hidden md:block">
                                        <Award className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">Loyalty Member</div>
                                        <div className="text-sm text-white/60">ID: {currentLoyaltyCard.customer_id}</div>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-primary-500 mt-4">
                                    {Math.round(currentLoyaltyCard.points)} <span className="text-sm font-normal text-white/60">Points</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-primary-500/20">
                                    <button className="w-full bg-primary-500 hover:bg-primary-500/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        Apply Top Reward ($10 Off)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-white/40 py-6">
                                No customer selected. Search for a customer to view loyalty status.
                            </div>
                        )}
                    </div>

                    {/* AI Retail Intelligence */}
                    <div className="bg-gradient-to-br from-primary-500/20 to-transparent border border-primary-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                            Retail Intelligence
                        </h3>
                        {currentLoyaltyCard ? (
                            <div className="space-y-4">
                                <div className="text-sm border-l-2 border-primary-500 pl-3 py-1">
                                    <p className="font-bold text-white/90 mb-1">AI Recommendation:</p>
                                    <p className="text-white/60">"High value customer. Suggest 15% discount on next purchase to drive retention."</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                    <div className="text-xs text-white/40 uppercase font-bold mb-2">Smart Up-sell</div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span>Product Protection Plan</span>
                                        <span className="font-bold">$12.99</span>
                                    </div>
                                    <button className="w-full mt-3 bg-white/10 hover:bg-primary-500 text-xs py-1.5 rounded-lg transition-colors border border-white/10">
                                        Add to Order
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-white/40 text-center py-2">
                                AI Assistant waiting for customer identification...
                            </div>
                        )}
                    </div>

                    {/* Kiosk Mode Toggle */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h4 className="font-bold mb-2">Self-Order Kiosk Mode</h4>
                        <p className="text-sm text-white/50 mb-4">Transform this terminal into a customer-facing self-service kiosk.</p>
                        <button
                            onClick={() => setIsKioskMode(true)}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg transition-colors border border-white/10 hover:border-white/30"
                        >
                            Launch Kiosk
                        </button>
                    </div>

                </div>
            </div>
        );
    };

    const [isKioskMode, setIsKioskMode] = useState(false);

    if (isKioskMode) {
        const session = sessions.find(s => s.id === activeTerminalId);
        return (
            <SelfOrderKiosk
                onExit={() => setIsKioskMode(false)}
                terminalName={session?.config?.name || 'Terminal 1'}
            />
        );
    }

    if (activeTerminalId) {
        return (
            <div className="h-full px-6 pt-3 pb-6 flex flex-col">
                {renderTerminalView()}
            </div>
        );
    }

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
