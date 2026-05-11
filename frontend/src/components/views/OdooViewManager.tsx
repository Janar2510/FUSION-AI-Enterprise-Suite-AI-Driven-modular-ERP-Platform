import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, ArrowLeft, LayoutList, LayoutGrid, LayoutDashboard, Settings, Network, Table } from 'lucide-react';

export type ViewType = 'list' | 'kanban' | 'form' | 'dashboard' | 'timeline' | 'hierarchy';

interface OdooViewManagerProps {
    title: React.ReactNode;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onNew?: () => void;
    onSave?: () => void;
    onDiscard?: () => void;
    onSettings?: () => void;
    onExport?: () => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    viewsAvailable?: ViewType[];
    children: React.ReactNode;
}

export function OdooViewManager({
    title,
    currentView,
    onViewChange,
    onNew,
    onSave,
    onDiscard,
    onSettings,
    onExport,
    searchTerm,
    onSearchChange,
    viewsAvailable = ['list', 'kanban', 'form'],
    children
}: OdooViewManagerProps) {
    return (
        <div className="flex flex-col w-full min-w-0 h-full h-[calc(100vh-theme(spacing.16))]">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    {(currentView === 'form' || (currentView === 'list' && viewsAvailable.includes('dashboard'))) && (
                        <button
                            onClick={() => {
                                if (currentView === 'form') {
                                    onViewChange(viewsAvailable.includes('list') ? 'list' : viewsAvailable[0]);
                                } else if (currentView === 'list' && viewsAvailable.includes('dashboard')) {
                                    onViewChange('dashboard');
                                }
                            }}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}

                    {typeof title === 'string' ? (
                        <h1 className="text-2xl font-bold text-white">{title}</h1>
                    ) : (
                        title
                    )}

                    {currentView === 'form' ? (
                        <div className="flex items-center gap-2 ml-4">
                            <button onClick={onSave} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-orange-600 text-white rounded-md font-medium shadow-lg hover:shadow-xl transition-all">
                                Save
                            </button>
                            <button onClick={onDiscard} className="px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-md font-medium transition-colors">
                                Discard
                            </button>
                        </div>
                    ) : (
                        <button onClick={onNew} className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-orange-600 text-white rounded-md font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {currentView !== 'form' && (
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 w-64"
                            />
                        </div>
                    )}

                    {currentView !== 'form' && (
                        <button className="p-2 text-white/60 hover:text-white bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                            <Filter className="w-5 h-5" />
                        </button>
                    )}

                    {onSettings && (
                        <button onClick={onSettings} className="p-2 text-white/60 hover:text-white bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    )}

                    {onExport && (
                        <button
                            onClick={onExport}
                            className="p-2 text-primary-500 hover:text-white bg-primary-500/10 border border-primary-500/20 rounded-md hover:bg-primary-500 transition-all flex items-center gap-2 group"
                            title="Export to Neural Spreadsheet"
                        >
                            <Table className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Intelligence</span>
                        </button>
                    )}

                    <div className="flex items-center bg-white/5 rounded-md p-1 border border-white/10">
                        {viewsAvailable.includes('dashboard') && (
                            <button
                                onClick={() => onViewChange('dashboard')}
                                className={`p-1.5 rounded-sm transition-colors ${currentView === 'dashboard' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                            </button>
                        )}
                        {viewsAvailable.includes('list') && (
                            <button
                                onClick={() => onViewChange('list')}
                                className={`p-1.5 rounded-sm transition-colors ${currentView === 'list' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                        )}
                        {viewsAvailable.includes('kanban') && (
                            <button
                                onClick={() => onViewChange('kanban')}
                                className={`p-1.5 rounded-sm transition-colors ${currentView === 'kanban' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        )}
                        {viewsAvailable.includes('hierarchy') && (
                            <button
                                onClick={() => onViewChange('hierarchy')}
                                className={`p-1.5 rounded-sm transition-colors ${currentView === 'hierarchy' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
                            >
                                <Network className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6">
                <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
