/**
 * ChatterPanel — Odoo-style record-level chatter.
 * Shows messages (internal notes + customer messages) and timeline events
 * for any business record (SaleOrder, HelpdeskTicket, AccountMove, PurchaseOrder, …).
 *
 * Usage:
 *   <ChatterPanel ownerType="SaleOrder" ownerId={order.id} />
 *   <ChatterPanel ownerType="HelpdeskTicket" ownerId={ticket.id} showTimeline />
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare, Clock, Lock, Globe, Send, Loader2, RefreshCw } from 'lucide-react';
import { chatterApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { GlassCard } from './GlassCard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatterMessage {
    id: string;
    body: string;
    isInternal: boolean;
    authorId: string | null;
    createdAt: string;
}

interface TimelineEvent {
    id: string;
    eventKey: string;
    summary: string;
    createdAt: string;
}

interface Props {
    ownerType: string;
    ownerId: string | number;
    showTimeline?: boolean;
    className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function eventKeyLabel(key: string): string {
    const map: Record<string, string> = {
        'STATUS_CHANGE': 'Status changed',
        'PAYMENT_RECEIVED': 'Payment received',
        'CREATED': 'Created',
        'UPDATED': 'Updated',
        'NOTE': 'Note',
        'EMAIL_SENT': 'Email sent',
        'CALL_LOGGED': 'Call logged',
        'MEETING_SCHEDULED': 'Meeting scheduled',
        'DOCUMENT_ATTACHED': 'Document attached',
    };
    return map[key] ?? key;
}

// ── Feed item — combined message + timeline ───────────────────────────────────

type FeedItem =
    | { kind: 'message'; data: ChatterMessage }
    | { kind: 'timeline'; data: TimelineEvent };

// ── Component ─────────────────────────────────────────────────────────────────

export const ChatterPanel: React.FC<Props> = ({
    ownerType,
    ownerId,
    showTimeline = true,
    className,
}) => {
    const [messages, setMessages] = useState<ChatterMessage[]>([]);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const [isInternal, setIsInternal] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'timeline'>('all');
    const bottomRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        if (!ownerId) return;
        setLoading(true);
        try {
            const res = await chatterApi.load(ownerType, ownerId);
            setMessages(res.data.messages ?? []);
            setTimeline(res.data.timeline ?? []);
        } catch {
            // Silently ignore — chatter is non-critical
        } finally {
            setLoading(false);
        }
    }, [ownerType, ownerId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, timeline]);

    const handleSend = async () => {
        const body = draft.trim();
        if (!body) return;
        setSending(true);
        try {
            await chatterApi.post(ownerType, ownerId, body, isInternal);
            setDraft('');
            await load();
        } catch {
            toast.error('Failed to post message');
        } finally {
            setSending(false);
        }
    };

    // Build merged + sorted feed
    const feed: FeedItem[] = [];
    if (activeTab !== 'timeline') {
        messages.forEach(m => feed.push({ kind: 'message', data: m }));
    }
    if (activeTab !== 'messages' && showTimeline) {
        timeline.forEach(t => feed.push({ kind: 'timeline', data: t }));
    }
    feed.sort((a, b) =>
        new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()
    );

    return (
        <GlassCard className={`flex flex-col border-white/5 ${className ?? ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-white/60" />
                    <span className="text-sm font-semibold text-white/80">Chatter</span>
                    {loading && <Loader2 className="w-3 h-3 text-white/40 animate-spin" />}
                </div>
                <div className="flex items-center gap-1">
                    {(['all', 'messages', 'timeline'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                                activeTab === tab
                                    ? 'bg-white/15 text-white font-medium'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                    <button
                        onClick={load}
                        className="p-1 text-white/30 hover:text-white/60 transition-colors ml-1"
                        title="Refresh"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-80 min-h-[120px]">
                {feed.length === 0 && !loading && (
                    <p className="text-xs text-white/30 text-center py-6 italic">No messages yet.</p>
                )}

                {feed.map(item => {
                    if (item.kind === 'message') {
                        const msg = item.data;
                        return (
                            <div key={`msg-${msg.id}`} className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-amber-500/30 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold text-amber-300 shrink-0">
                                    {msg.authorId ? msg.authorId.slice(0, 2).toUpperCase() : 'SY'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-white/70">
                                            {msg.authorId ? `User ${msg.authorId.slice(0, 6)}…` : 'System'}
                                        </span>
                                        {msg.isInternal
                                            ? <Lock className="w-2.5 h-2.5 text-yellow-400/70" title="Internal note" />
                                            : <Globe className="w-2.5 h-2.5 text-green-400/70" title="Customer message" />
                                        }
                                        <span className="text-[10px] text-white/30">{timeAgo(msg.createdAt)}</span>
                                    </div>
                                    <div className={`text-xs text-white/80 leading-relaxed px-2.5 py-2 rounded-lg ${
                                        msg.isInternal
                                            ? 'bg-yellow-500/5 border border-yellow-500/15'
                                            : 'bg-white/5 border border-white/10'
                                    }`}>
                                        {msg.body}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Timeline event
                    const ev = item.data;
                    return (
                        <div key={`tl-${ev.id}`} className="flex items-start gap-2.5 pl-1">
                            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Clock className="w-2.5 h-2.5 text-white/30" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] text-amber-300/70 uppercase tracking-wide font-medium">
                                    {eventKeyLabel(ev.eventKey)}
                                </span>
                                <p className="text-xs text-white/50 leading-relaxed">{ev.summary}</p>
                                <span className="text-[10px] text-white/25">{timeAgo(ev.createdAt)}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div className="border-t border-white/10 px-4 pt-3 pb-4">
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => setIsInternal(true)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors ${
                            isInternal
                                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                                : 'bg-transparent border-white/10 text-white/40 hover:text-white/60'
                        }`}
                    >
                        <Lock className="w-3 h-3" /> Note
                    </button>
                    <button
                        onClick={() => setIsInternal(false)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors ${
                            !isInternal
                                ? 'bg-green-500/20 border-green-500/40 text-green-300'
                                : 'bg-transparent border-white/10 text-white/40 hover:text-white/60'
                        }`}
                    >
                        <Globe className="w-3 h-3" /> Message
                    </button>
                </div>

                <div className="flex gap-2">
                    <textarea
                        rows={2}
                        placeholder={isInternal ? 'Add an internal note…' : 'Send a message to the customer…'}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-amber-500/50 transition-colors resize-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !draft.trim()}
                        className="self-end p-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg transition-colors"
                        title="Send (Ctrl+Enter)"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-[10px] text-white/25 mt-1">Ctrl+Enter to send</p>
            </div>
        </GlassCard>
    );
};

export default ChatterPanel;
