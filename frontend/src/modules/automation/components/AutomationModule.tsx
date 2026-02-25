import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Zap,
    Trash2,
    CheckCircle2,
    Mail,
    Bell,
    RefreshCw,
    Database,
    BrainCircuit,
    Code
} from 'lucide-react';
import { useAutomationStore } from '../stores/automationStore';
import { Workflow, WorkflowTrigger } from '../types';
import { GlassCard } from '@/components/shared/GlassCard';
import { OdooViewManager } from '@/components/views/OdooViewManager';

export const AutomationModule: React.FC = () => {
    const {
        workflows,
        fetchWorkflows,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        toggleWorkflow
    } = useAutomationStore();

    const [currentView, setCurrentView] = useState<'kanban' | 'form'>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
    const [formData, setFormData] = useState<Partial<Workflow>>({});

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const handleNew = () => {
        setActiveWorkflow(null);
        setFormData({
            name: 'New Automation',
            trigger: 'ON_CREATE',
            model: 'Partner',
            active: true,
            action: JSON.stringify({ type: 'NOTIFICATION', config: { message: 'Workflow triggered!' } })
        });
        setCurrentView('form');
    };

    const handleRowClick = (workflow: Workflow) => {
        setActiveWorkflow(workflow);
        setFormData(workflow);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeWorkflow) {
            await updateWorkflow(activeWorkflow.id, formData);
        } else {
            await createWorkflow(formData);
        }
        setCurrentView('kanban');
    };

    const renderKanban = () => {
        const filtered = workflows.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                <AnimatePresence>
                    {filtered.map((w) => (
                        <motion.div
                            key={w.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <GlassCard
                                className={`relative p-6 border-t-4 transition-all group overflow-hidden ${w.active ? 'border-primary-purple' : 'border-white/10'}`}
                                onClick={() => handleRowClick(w)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-primary-purple/20 transition-colors">
                                        <Zap className={`w-6 h-6 ${w.active ? 'text-primary-purple' : 'text-white/20'}`} />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWorkflow(w.id, !w.active);
                                        }}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${w.active
                                            ? 'bg-primary-purple/20 border-primary-purple text-primary-purple'
                                            : 'bg-white/5 border-white/10 text-white/40'
                                            }`}
                                    >
                                        {w.active ? 'Active' : 'Paused'}
                                    </button>
                                </div>

                                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1 truncate">{w.name}</h3>
                                <p className="text-xs text-white/40 mb-6 flex items-center gap-2">
                                    <Database className="w-3 h-3" /> {w.model}
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                                        <span>Trigger</span>
                                        <span className="text-white/60">{w.trigger}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                                        <span>Last Run</span>
                                        <span className="text-white/60">2h ago</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                        <RefreshCw className="w-4 h-4 text-white/40" />
                                    </div>
                                    <div className="flex-1" />
                                    <button
                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group/del"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteWorkflow(w.id);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 text-white/20 group-hover/del:text-red-400" />
                                    </button>
                                </div>

                                {/* Animated Background Glow */}
                                {w.active && (
                                    <motion.div
                                        animate={{ opacity: [0.1, 0.2, 0.1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="absolute -right-4 -top-4 w-24 h-24 bg-primary-purple/20 blur-3xl rounded-full"
                                    />
                                )}
                            </GlassCard>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNew}
                    className="h-[300px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-white/20 hover:text-white/40 hover:border-white/20 transition-all bg-white/[0.02]"
                >
                    <div className="p-4 rounded-full bg-white/5">
                        <Plus className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">New Workflow</span>
                </motion.button>
            </div>
        );
    };

    const renderForm = () => {
        const action = formData.action ? JSON.parse(formData.action) : { type: 'NOTIFICATION', config: {} };

        return (
            <div className="max-w-6xl mx-auto p-12 space-y-12">
                <div className="flex justify-between items-end border-b border-white/10 pb-12">
                    <div className="space-y-2 flex-1">
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-transparent text-6xl font-black text-white outline-none border-b border-transparent focus:border-primary-purple transition-all placeholder-white/10 italic"
                            placeholder="WORKFLOW_NAME"
                        />
                        <div className="flex items-center gap-4 text-white/30 uppercase font-black text-xs tracking-widest">
                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                <Database className="w-3 h-3" />
                                {formData.model}
                            </span>
                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                <Zap className="w-3 h-3" />
                                {formData.trigger}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setCurrentView('kanban')}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-4 bg-primary-purple text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all"
                        >
                            Deploy Workflow
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-12">
                    {/* Left Column: Triggers & Conditions */}
                    <div className="col-span-12 lg:col-span-7 space-y-12">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Phase 01: The Trigger</h4>
                            <GlassCard className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Trigger Type</label>
                                        <select
                                            value={formData.trigger}
                                            onChange={(e) => setFormData({ ...formData, trigger: e.target.value as WorkflowTrigger })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-purple/50 appearance-none bg-chevron-down"
                                        >
                                            <option value="ON_CREATE" className="bg-[#1a1a1a]">On Creation</option>
                                            <option value="ON_UPDATE" className="bg-[#1a1a1a]">On Update</option>
                                            <option value="ON_DELETE" className="bg-[#1a1a1a]">On Deletion</option>
                                            <option value="CRON" className="bg-[#1a1a1a]">Scheduled (Cron)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Target Model</label>
                                        <input
                                            type="text"
                                            value={formData.model || ''}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-purple/50"
                                            placeholder="e.g. SaleOrder"
                                        />
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Phase 02: Neural Conditions</h4>
                            <GlassCard className="p-8 space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <BrainCircuit className="w-12 h-12 text-primary-purple/10" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Requirement Formula</label>
                                        <span className="text-[9px] font-black text-primary-purple uppercase tracking-tighter bg-primary-purple/10 px-2 py-0.5 rounded leading-none">Powered by Neural Formula BI</span>
                                    </div>
                                    <textarea
                                        value={formData.condition || ''}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-mono text-sm outline-none focus:border-primary-purple/50 placeholder-white/5"
                                        placeholder="=CRM.Probability > 80 && ACCOUNTING.TotalDebt < 1000"
                                    />
                                    <p className="text-[10px] text-white/20 italic">Use cross-module formulas to filter triggers dynamically.</p>
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="col-span-12 lg:col-span-5 space-y-12">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Phase 03: Automated Response</h4>
                            <div className="space-y-4">
                                {[
                                    { id: 'NOTIFICATION', icon: <Bell className="w-5 h-5" />, label: 'In-App Notification', desc: 'Alert users instantly in-app.' },
                                    { id: 'EMAIL', icon: <Mail className="w-5 h-5" />, label: 'Dynamic Email', desc: 'Send automated PDF/HTML emails.' },
                                    { id: 'UPDATE_RECORD', icon: <RefreshCw className="w-5 h-5" />, label: 'Field Update', desc: 'Auto-modify record values.' },
                                    { id: 'SERVER_ACTION', icon: <Code className="w-5 h-5" />, label: 'Custom Script', desc: 'Execute server-side logic.' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setFormData({ ...formData, action: JSON.stringify({ type: opt.id, config: action.config }) })}
                                        className={`w-full text-left p-6 rounded-3xl border transition-all flex items-start gap-5 group ${action.type === opt.id
                                            ? 'bg-primary-purple/10 border-primary-purple/40 shadow-lg'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-2xl ${action.type === opt.id ? 'bg-primary-purple/20 text-primary-purple' : 'bg-white/5 text-white/40 group-hover:text-white/60'}`}>
                                            {opt.icon}
                                        </div>
                                        <div>
                                            <h5 className="text-white font-black text-sm uppercase tracking-wider">{opt.label}</h5>
                                            <p className="text-xs text-white/30">{opt.desc}</p>
                                        </div>
                                        {action.type === opt.id && (
                                            <div className="ml-auto">
                                                <CheckCircle2 className="w-5 h-5 text-primary-purple" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <OdooViewManager
            title="Automation Studio"
            currentView={currentView}
            onViewChange={setCurrentView as any}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('kanban')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'form']}
        >
            <div className="h-full">
                {currentView === 'kanban' ? renderKanban() : renderForm()}
            </div>
        </OdooViewManager>
    );
};
