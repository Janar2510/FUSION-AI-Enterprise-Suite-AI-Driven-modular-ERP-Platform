import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { crmApi } from '@/lib/api';

export interface CrmActivity {
    id: number;
    type: string;
    summary: string;
    body?: string;
    dueAt?: string;
    doneAt?: string;
    createdAt: string;
}

const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'task', 'deadline'] as const;

const TYPE_ICONS: Record<string, string> = {
    call: '📞',
    email: '✉️',
    meeting: '📅',
    task: '✅',
    deadline: '⏰',
};

export const CrmActivitiesPanel: React.FC<{ leadId: number }> = ({ leadId }) => {
    const [activities, setActivities] = useState<CrmActivity[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: 'call', summary: '', dueAt: '' });
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const load = async () => {
        try {
            setListError(null);
            const res = await crmApi.listActivities(leadId);
            setActivities(res.data ?? []);
        } catch {
            setListError('Could not load activities');
            setActivities([]);
        }
    };

    useEffect(() => {
        load();
    }, [leadId]);

    const handleCreate = async () => {
        if (!form.summary) return;
        setLoading(true);
        try {
            await crmApi.createActivity(leadId, form);
            setForm({ type: 'call', summary: '', dueAt: '' });
            setShowForm(false);
            await load();
        } catch {
            setListError('Could not create activity');
        } finally {
            setLoading(false);
        }
    };

    const handleDone = async (id: number) => {
        try {
            await crmApi.markActivityDone(id);
            await load();
        } catch {
            setListError('Could not mark activity done');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await crmApi.deleteActivity(id);
            await load();
        } catch {
            setListError('Could not delete activity');
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm font-medium uppercase tracking-wide">Activities</span>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1 text-primary-500 text-xs hover:text-primary-500/80 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> Schedule
                </button>
            </div>

            {showForm && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                        {ACTIVITY_TYPES.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setForm({ ...form, type: t })}
                                className={`px-2 py-1 rounded text-xs capitalize transition-all ${
                                    form.type === t
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                                }`}
                            >
                                {TYPE_ICONS[t]} {t}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Summary"
                        value={form.summary}
                        onChange={(e) => setForm({ ...form, summary: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-primary-500"
                    />
                    <input
                        type="date"
                        value={form.dueAt}
                        onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-primary-500 [&::-webkit-calendar-picker-indicator]:filter-invert"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={loading || !form.summary}
                            className="bg-primary-500 hover:bg-primary-500/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="bg-white/5 text-white/60 px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/10"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {listError && (
                <div className="text-amber-400/90 text-xs py-1">{listError}</div>
            )}

            <div className="space-y-2">
                {activities.length === 0 && !listError && (
                    <div className="text-white/30 text-xs text-center py-2">No activities yet</div>
                )}
                {activities.map((a) => (
                    <div
                        key={a.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border ${
                            a.doneAt ? 'border-white/5 opacity-50' : 'border-white/10 bg-white/3'
                        }`}
                    >
                        <span className="text-base mt-0.5 flex-shrink-0">{TYPE_ICONS[a.type] ?? '●'}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">{a.summary}</div>
                            {a.dueAt && (
                                <div className="text-white/40 text-xs">
                                    {new Date(a.dueAt).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                            {!a.doneAt && (
                                <button
                                    type="button"
                                    onClick={() => handleDone(a.id)}
                                    title="Mark done"
                                    className="text-white/30 hover:text-green-400 transition-colors p-0.5"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => handleDelete(a.id)}
                                title="Delete"
                                className="text-white/30 hover:text-red-400 transition-colors p-0.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
