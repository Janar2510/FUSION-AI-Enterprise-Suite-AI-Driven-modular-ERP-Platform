import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings2, ShieldCheck, Users, Zap } from 'lucide-react';
import { useCRMStore } from '../stores/crmStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { BreadcrumbHeader } from '@/components/shared/BreadcrumbHeader';

export const CRMSettings: React.FC = () => {
    const { pipelineStages } = useCRMStore();
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState({
        multiTeams: false,
        leadMining: false,
        predictiveScoring: true,
        ruleBasedAssignment: false
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="flex flex-col h-full h-[calc(100vh-theme(spacing.16))]">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-20">
                <BreadcrumbHeader customLabels={{ '/module/crm/settings': 'Settings' }} />
                <div className="flex items-center gap-4">
                    <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-orange-600 text-white rounded-md font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save
                    </button>
                    {saved && <span className="text-green-400 text-sm">Saved!</span>}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full space-y-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                            <Settings2 className="w-5 h-5 text-primary-500" /> CRM Features
                        </h2>
                        <p className="text-white/60 text-sm">Enable or disable advanced CRM tracking and AI functionalities.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="p-6">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input type="checkbox" checked={settings.multiTeams} onChange={e => setSettings(s => ({ ...s, multiTeams: e.target.checked }))} className="w-4 h-4 bg-transparent border-white/20 rounded text-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <div className="text-white font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4 text-white/50" /> Multi Teams
                                    </div>
                                    <p className="text-white/50 text-sm mt-1">Assign leads to specific sales teams instead of individual salespeople.</p>
                                </div>
                            </label>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input type="checkbox" checked={settings.leadMining} onChange={e => setSettings(s => ({ ...s, leadMining: e.target.checked }))} className="w-4 h-4 bg-transparent border-white/20 rounded text-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <div className="text-white font-medium flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-white/50" /> Lead Mining
                                    </div>
                                    <p className="text-white/50 text-sm mt-1">Generate leads directly from website visitor IP addresses.</p>
                                </div>
                            </label>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input type="checkbox" checked={settings.predictiveScoring} onChange={e => setSettings(s => ({ ...s, predictiveScoring: e.target.checked }))} className="w-4 h-4 bg-transparent border-white/20 rounded text-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <div className="text-white font-medium flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-white/50" /> Predictive Lead Scoring
                                    </div>
                                    <p className="text-white/50 text-sm mt-1">Use AI to automatically assign probability and priority to incoming leads.</p>
                                </div>
                            </label>
                        </GlassCard>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6 pt-6 border-t border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Pipeline Stages</h2>
                        <p className="text-white/60 text-sm">Configure your sales funnel. You have {pipelineStages.length} active stages.</p>
                    </div>

                    <GlassCard className="p-0 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="py-3 px-4 text-white/50 text-sm font-medium">Sequence</th>
                                    <th className="py-3 px-4 text-white/50 text-sm font-medium">Stage Name</th>
                                    <th className="py-3 px-4 text-white/50 text-sm font-medium">Folded</th>
                                    <th className="py-3 px-4 text-white/50 text-sm font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pipelineStages.map((stage) => (
                                    <tr key={stage.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-4 text-white/80">{stage.sequence}</td>
                                        <td className="py-3 px-4 text-white font-medium">{stage.name}</td>
                                        <td className="py-3 px-4 text-white/60">{stage.foldedKanban ? 'Yes' : 'No'}</td>
                                        <td className="py-3 px-4 text-right">
                                            <button className="text-primary-500 hover:text-white transition-colors text-sm">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
};
