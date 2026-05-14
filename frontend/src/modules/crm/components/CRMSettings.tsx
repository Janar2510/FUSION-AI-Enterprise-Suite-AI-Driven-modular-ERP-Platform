import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings2, ShieldCheck, Shuffle, Users, Zap } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useCRMStore, type CrmStage } from '../stores/crmStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { BreadcrumbHeader } from '@/components/shared/BreadcrumbHeader';
import { crmApi, moduleSettingsApi } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const CRM_FEATURE_DEFAULTS = {
    multiTeams: false,
    leadMining: false,
    predictiveScoring: true,
    ruleBasedAssignment: false,
};

type CrmFeatureSettings = typeof CRM_FEATURE_DEFAULTS;

function mergeCrmSettings(raw: Record<string, unknown>): CrmFeatureSettings {
    const bool = (v: unknown, d: boolean) =>
        typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : d;
    return {
        multiTeams: bool(raw.multiTeams, CRM_FEATURE_DEFAULTS.multiTeams),
        leadMining: bool(raw.leadMining, CRM_FEATURE_DEFAULTS.leadMining),
        predictiveScoring: bool(raw.predictiveScoring, CRM_FEATURE_DEFAULTS.predictiveScoring),
        ruleBasedAssignment: bool(raw.ruleBasedAssignment, CRM_FEATURE_DEFAULTS.ruleBasedAssignment),
    };
}

type StageDraft = { id: number; name: string; sequence: number; foldedKanban: boolean };

function stageToDraft(stage: CrmStage): StageDraft {
    return {
        id: stage.id,
        name: stage.name,
        sequence: stage.sequence,
        foldedKanban: stage.foldedKanban,
    };
}

export const CRMSettings: React.FC = () => {
    const { pipelineStages, fetchPipeline } = useCRMStore();
    const queryClient = useQueryClient();
    const [saved, setSaved] = useState(false);
    const [stageDraft, setStageDraft] = useState<StageDraft | null>(null);

    const [settings, setSettings] = useState<CrmFeatureSettings>(CRM_FEATURE_DEFAULTS);

    useEffect(() => {
        void fetchPipeline();
    }, [fetchPipeline]);

    const { data: crmPayload, isLoading } = useQuery({
        queryKey: ['settings', 'crm'],
        queryFn: async () => {
            const res = await moduleSettingsApi.get('crm');
            return mergeCrmSettings(res.data ?? {});
        },
    });

    useEffect(() => {
        if (crmPayload) setSettings(crmPayload);
    }, [crmPayload]);

    const saveMutation = useMutation({
        mutationFn: async (body: CrmFeatureSettings) => {
            await moduleSettingsApi.put('crm', body);
        },
        onSuccess: () => {
            toast.success('CRM settings saved');
            queryClient.invalidateQueries({ queryKey: ['settings', 'crm'] });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        },
        onError: () => {
            toast.error('Could not save CRM settings');
        },
    });

    const updateStageMutation = useMutation({
        mutationFn: async (draft: StageDraft) => {
            await crmApi.updateStage(draft.id, {
                name: draft.name.trim(),
                sequence: draft.sequence,
                foldedKanban: draft.foldedKanban,
            });
        },
        onSuccess: () => {
            toast.success('Pipeline stage updated');
            setStageDraft(null);
            void fetchPipeline();
        },
        onError: (err: unknown) => {
            let msg = 'Could not update stage';
            if (axios.isAxiosError(err)) {
                const e = err.response?.data as { error?: string } | undefined;
                if (typeof e?.error === 'string') msg = e.error;
            }
            toast.error(msg);
        },
    });

    const handleSave = () => {
        saveMutation.mutate(settings);
    };

    const handleSaveStage = () => {
        if (!stageDraft) return;
        if (!stageDraft.name.trim()) {
            toast.error('Stage name is required');
            return;
        }
        updateStageMutation.mutate(stageDraft);
    };

    return (
        <div className="flex flex-col h-full h-[calc(100vh-theme(spacing.16))]">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-20">
                <BreadcrumbHeader customLabels={{ '/module/crm/settings': 'Settings' }} />
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading || saveMutation.isPending}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-orange-600 text-white rounded-md font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
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

                        <GlassCard className="p-6">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input type="checkbox" checked={settings.ruleBasedAssignment} onChange={e => setSettings(s => ({ ...s, ruleBasedAssignment: e.target.checked }))} className="w-4 h-4 bg-transparent border-white/20 rounded text-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <div className="text-white font-medium flex items-center gap-2">
                                        <Shuffle className="w-4 h-4 text-white/50" /> Rule-Based Assignment
                                    </div>
                                    <p className="text-white/50 text-sm mt-1">Distribute new leads by territory, load, or custom rules.</p>
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
                                            <button
                                                type="button"
                                                onClick={() => setStageDraft(stageToDraft(stage))}
                                                className="text-primary-500 hover:text-white transition-colors text-sm"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassCard>
                </motion.div>
            </div>

            <Modal
                open={stageDraft !== null}
                onClose={() => {
                    if (!updateStageMutation.isPending) setStageDraft(null);
                }}
                title="Edit pipeline stage"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => setStageDraft(null)}
                            disabled={updateStageMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="button"
                            onClick={handleSaveStage}
                            loading={updateStageMutation.isPending}
                            disabled={updateStageMutation.isPending}
                        >
                            Save stage
                        </Button>
                    </>
                }
            >
                {stageDraft && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1.5">Stage name</label>
                            <input
                                type="text"
                                value={stageDraft.name}
                                onChange={(e) => setStageDraft((d) => (d ? { ...d, name: e.target.value } : null))}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1.5">Sequence</label>
                            <input
                                type="number"
                                value={stageDraft.sequence}
                                onChange={(e) =>
                                    setStageDraft((d) =>
                                        d
                                            ? {
                                                  ...d,
                                                  sequence: Number.parseInt(e.target.value, 10) || 0,
                                              }
                                            : null
                                    )
                                }
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            />
                            <p className="text-white/40 text-xs mt-1">Lower numbers appear earlier in the pipeline.</p>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={stageDraft.foldedKanban}
                                onChange={(e) =>
                                    setStageDraft((d) => (d ? { ...d, foldedKanban: e.target.checked } : null))
                                }
                                className="w-4 h-4 bg-transparent border-white/20 rounded text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-white/80 text-sm">Folded in kanban (collapsed column)</span>
                        </label>
                    </div>
                )}
            </Modal>
        </div>
    );
};
