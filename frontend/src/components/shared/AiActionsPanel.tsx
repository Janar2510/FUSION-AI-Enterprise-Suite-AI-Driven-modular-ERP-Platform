/**
 * AiActionsPanel — shows pending AI suggestions for a given entity,
 * with approve / reject / dismiss controls.
 *
 * Usage:
 *   <AiActionsPanel entityType="HelpdeskTicket" entityId="42" />
 *   <AiActionsPanel entityType="Partner" entityId="cj..." />
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Brain, Check, X, ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import { aiActionsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { GlassCard } from './GlassCard';

interface AgentSuggestion {
    field: string;
    suggestedValue: unknown;
    reasoning: string;
    isSensitive?: boolean;
}

interface AiAction {
    id: string;
    agentKey: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'ROLLED_BACK';
    confidence: number;
    output: {
        summary: string;
        suggestions: AgentSuggestion[];
        metadata?: Record<string, unknown>;
    };
    createdAt: string;
}

interface Props {
    entityType: string;
    entityId: string | number;
    /** If provided, show a "Run agent" button */
    agentKey?: string;
    className?: string;
}

const AGENT_LABELS: Record<string, string> = {
    'helpdesk-triage': 'Helpdesk Triage',
    'customer-summary': 'Account Intelligence',
    'lead-scoring': 'Lead Score',
    'invoice-anomaly': 'Anomaly Check',
    'stock-reorder': 'Reorder Recommender',
    'document-intelligence': 'Document Classifier',
    'partner-dedup': 'Dedup Check',
    'next-best-action': 'Next Best Action',
    'quote-drafter': 'Draft Quote',
    'manufacturing-scheduler': 'Schedule Optimizer',
};

const CONFIDENCE_COLOR = (c: number) =>
    c >= 0.8 ? 'text-green-400' : c >= 0.6 ? 'text-yellow-400' : 'text-red-400';

export const AiActionsPanel: React.FC<Props> = ({ entityType, entityId, agentKey, className }) => {
    const [actions, setActions] = useState<AiAction[]>([]);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await aiActionsApi.pending(entityType, String(entityId));
            setActions(res.data.data ?? []);
        } catch {
            // Silently ignore if AI layer not yet deployed
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId]);

    useEffect(() => { load(); }, [load]);

    const handleRun = async () => {
        if (!agentKey) return;
        setRunning(true);
        try {
            await aiActionsApi.run(agentKey, entityType, String(entityId));
            toast.success('AI analysis started — results will appear shortly');
            setTimeout(load, 1500);
        } catch {
            toast.error('AI agent failed to start');
        } finally {
            setRunning(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await aiActionsApi.approve(id);
            toast.success('Suggestion approved');
            load();
        } catch { toast.error('Failed to approve'); }
    };

    const handleReject = async (id: string) => {
        try {
            await aiActionsApi.reject(id);
            toast.success('Suggestion dismissed');
            load();
        } catch { toast.error('Failed to reject'); }
    };

    const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    if (!loading && actions.length === 0 && !agentKey) return null;

    return (
        <GlassCard className={`p-4 border-blue-500/20 bg-blue-500/5 ${className ?? ''}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white/80">AI Suggestions</span>
                    {loading && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                </div>
                {agentKey && (
                    <button
                        onClick={handleRun}
                        disabled={running}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-md transition-colors disabled:opacity-50"
                    >
                        {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                        {AGENT_LABELS[agentKey] ?? agentKey}
                    </button>
                )}
            </div>

            {actions.length === 0 && !loading && (
                <p className="text-xs text-white/30 italic">No pending AI suggestions.</p>
            )}

            <div className="space-y-3">
                {actions.map(action => (
                    <div key={action.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-start justify-between p-3 gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-blue-300 uppercase tracking-wide">
                                        {AGENT_LABELS[action.agentKey] ?? action.agentKey}
                                    </span>
                                    <span className={`text-xs font-bold ${CONFIDENCE_COLOR(action.confidence)}`}>
                                        {Math.round(action.confidence * 100)}%
                                    </span>
                                    {action.confidence < 0.6 && (
                                        <AlertTriangle className="w-3 h-3 text-yellow-400" title="Low confidence — review carefully" />
                                    )}
                                </div>
                                <p className="text-xs text-white/70 leading-relaxed">{action.output.summary}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleApprove(action.id)}
                                    className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-md transition-colors"
                                    title="Approve"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleReject(action.id)}
                                    className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-md transition-colors"
                                    title="Dismiss"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => toggleExpand(action.id)}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-white/50 rounded-md transition-colors"
                                    title="Toggle details"
                                >
                                    {expanded[action.id]
                                        ? <ChevronUp className="w-3.5 h-3.5" />
                                        : <ChevronDown className="w-3.5 h-3.5" />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Expanded suggestions */}
                        {expanded[action.id] && action.output.suggestions.length > 0 && (
                            <div className="border-t border-white/10 px-3 pb-3 pt-2 space-y-2">
                                {action.output.suggestions.map((s, i) => (
                                    <div key={i} className="flex gap-2 text-xs">
                                        <span className="text-white/40 font-mono shrink-0">{s.field}</span>
                                        <span className="text-white/60 flex-1">
                                            {typeof s.suggestedValue === 'object'
                                                ? JSON.stringify(s.suggestedValue)
                                                : String(s.suggestedValue)}
                                        </span>
                                        {s.isSensitive && (
                                            <span className="text-yellow-400 text-[10px] font-semibold shrink-0">SENSITIVE</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

export default AiActionsPanel;
