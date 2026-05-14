import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin } from 'lucide-react';
import { CalendarEvent } from '../stores/calendarStore';

type GridView = 'month' | 'week' | 'day';

interface Props {
    events: CalendarEvent[];
    onNewAt?: (start: string) => void;
    onEventClick?: (event: CalendarEvent) => void;
    /** Fires when the user changes month/week/day or navigates; use to refetch server-backed events. */
    onVisibleRangeChange?: (range: { from: Date; to: Date }) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const HOUR_HEIGHT = 56; // px per hour in week/day view
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

// Colour pool — cycles per event id
const EVENT_COLORS = [
    { bg: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.55)',  text: '#fbbf24' },
    { bg: 'rgba(99,102,241,0.18)',  border: 'rgba(99,102,241,0.55)',  text: '#a5b4fc' },
    { bg: 'rgba(16,185,129,0.18)',  border: 'rgba(16,185,129,0.55)',  text: '#6ee7b7' },
    { bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.55)',   text: '#fca5a5' },
    { bg: 'rgba(59,130,246,0.18)',  border: 'rgba(59,130,246,0.55)',  text: '#93c5fd' },
    { bg: 'rgba(217,70,239,0.18)',  border: 'rgba(217,70,239,0.55)',  text: '#e879f9' },
];
const eventColor = (id: number) => EVENT_COLORS[id % EVENT_COLORS.length];

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addDays(d: Date, n: number) {
    const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function getVisibleRange(anchor: Date, view: GridView): { from: Date; to: Date } {
    if (view === 'month') {
        const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0);
        const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
        return { from, to };
    }
    if (view === 'week') {
        const weekStart = new Date(anchor);
        weekStart.setDate(anchor.getDate() - anchor.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const to = new Date(weekStart);
        to.setDate(weekStart.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        return { from: weekStart, to };
    }
    const from = new Date(anchor);
    from.setHours(0, 0, 0, 0);
    const to = new Date(anchor);
    to.setHours(23, 59, 59, 999);
    return { from, to };
}

// ── EventChip ─────────────────────────────────────────────────────────────────

const EventChip: React.FC<{ event: CalendarEvent; onClick: () => void; compact?: boolean }> = ({ event, onClick, compact }) => {
    const c = eventColor(event.id);
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            title={event.name}
            style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text }}
            className={`w-full text-left rounded-r-md px-1.5 overflow-hidden truncate transition-opacity hover:opacity-80 ${compact ? 'text-[10px] py-0.5' : 'text-xs py-1'}`}
        >
            {!compact && !event.allday && (
                <span className="opacity-70 mr-1">{formatTime(event.start)}</span>
            )}
            {event.name}
        </button>
    );
};

// ── Tooltip / mini popup ──────────────────────────────────────────────────────

const EventPopup: React.FC<{ event: CalendarEvent; onClose: () => void; onEdit: () => void }> = ({ event, onClose, onEdit }) => {
    const c = eventColor(event.id);
    return (
        <div
            className="absolute z-50 w-72 rounded-xl shadow-2xl"
            style={{ background: 'var(--bg-base)', border: `1px solid ${c.border}`, boxShadow: `0 8px 32px rgba(0,0,0,0.6), ${c.border} 0 0 0 1px` }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* header stripe */}
            <div className="h-1.5 rounded-t-xl" style={{ background: `linear-gradient(90deg,${c.border},transparent)` }} />
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: c.text }}>{event.name}</h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white/80 shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-1.5 text-xs text-white/60">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {event.allday
                            ? `All day · ${new Date(event.start).toLocaleDateString()}`
                            : `${formatTime(event.start)} – ${formatTime(event.stop)} · ${new Date(event.start).toLocaleDateString()}`
                        }
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {event.location}
                        </div>
                    )}
                    {event.description && (
                        <p className="pt-1 text-white/50 line-clamp-3">{event.description}</p>
                    )}
                </div>
                <button
                    onClick={onEdit}
                    className="mt-3 w-full text-xs py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                    Edit event
                </button>
            </div>
        </div>
    );
};

// ── Month view ────────────────────────────────────────────────────────────────

const MonthView: React.FC<{
    anchor: Date;
    events: CalendarEvent[];
    onDayClick: (d: Date) => void;
    onEventClick: (e: CalendarEvent) => void;
}> = ({ anchor, events, onDayClick, onEventClick }) => {
    const today = new Date();

    // Build 6-week grid starting from the first Sunday of the month display
    const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());

    const weeks = Array.from({ length: 6 }, (_, w) =>
        Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d))
    );

    const eventsOnDay = useCallback((day: Date) =>
        events.filter(ev => {
            const s = new Date(ev.start);
            const e = new Date(ev.stop);
            // span all days the event covers
            const ds = new Date(day); ds.setHours(0, 0, 0, 0);
            const de = new Date(day); de.setHours(23, 59, 59, 999);
            return s <= de && e >= ds;
        }), [events]);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Day header */}
            <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-default)' }}>
                {DAY_NAMES.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{d}</div>
                ))}
            </div>
            {/* Grid */}
            <div className="flex-1 grid grid-rows-6 min-h-0">
                {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                        {week.map((day, di) => {
                            const isToday = sameDay(day, today);
                            const isCurrentMonth = day.getMonth() === anchor.getMonth();
                            const dayEvents = eventsOnDay(day);
                            return (
                                <div
                                    key={di}
                                    onClick={() => onDayClick(day)}
                                    className="border-r p-1 cursor-pointer transition-colors group"
                                    style={{
                                        borderColor: 'var(--border-subtle)',
                                        background: isToday ? 'rgba(245,158,11,0.04)' : undefined,
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span
                                            className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors
                                                ${isToday ? 'text-black font-bold' : isCurrentMonth ? '' : 'opacity-30'}
                                            `}
                                            style={isToday ? { background: 'var(--accent-primary)' } : { color: 'var(--text-secondary)' }}
                                        >
                                            {day.getDate()}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDayClick(day); }}
                                            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                                        >
                                            <Plus className="w-3 h-3" style={{ color: 'var(--accent-text)' }} />
                                        </button>
                                    </div>
                                    <div className="space-y-0.5 overflow-hidden" style={{ maxHeight: 'calc(100% - 28px)' }}>
                                        {dayEvents.slice(0, 3).map(ev => (
                                            <EventChip key={ev.id} event={ev} onClick={() => onEventClick(ev)} compact />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className="text-[10px] pl-1" style={{ color: 'var(--text-tertiary)' }}>
                                                +{dayEvents.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Week / Day views (shared timed grid) ─────────────────────────────────────

const TimedGrid: React.FC<{
    days: Date[];
    events: CalendarEvent[];
    onSlotClick: (d: Date, hour: number) => void;
    onEventClick: (e: CalendarEvent) => void;
}> = ({ days, events, onSlotClick, onEventClick }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const timedEventsForDay = (day: Date) =>
        events.filter(ev => {
            if (ev.allday) return false;
            const s = new Date(ev.start);
            return sameDay(s, day);
        });

    const allDayEventsForDay = (day: Date) =>
        events.filter(ev => {
            if (!ev.allday) return false;
            const s = new Date(ev.start);
            const e = new Date(ev.stop);
            const ds = new Date(day); ds.setHours(0, 0, 0, 0);
            const de = new Date(day); de.setHours(23, 59, 59, 999);
            return s <= de && e >= ds;
        });

    const eventStyle = (ev: CalendarEvent): React.CSSProperties => {
        const s = new Date(ev.start);
        const e = new Date(ev.stop);
        const top = (s.getHours() + s.getMinutes() / 60) * HOUR_HEIGHT;
        const duration = Math.max((e.getTime() - s.getTime()) / 3_600_000, 0.25);
        const height = duration * HOUR_HEIGHT;
        const c = eventColor(ev.id);
        return {
            position: 'absolute',
            top,
            left: '2px',
            right: '2px',
            height,
            background: c.bg,
            borderLeft: `3px solid ${c.border}`,
            color: c.text,
            borderRadius: 'var(--radius-sm)',
            zIndex: 1,
            overflow: 'hidden',
            padding: '2px 4px',
            fontSize: 11,
        };
    };

    const today = new Date();

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* All-day row */}
            <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border-default)' }}>
                <div className="w-14 shrink-0 border-r py-1 text-center" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: 10 }}>all-day</div>
                {days.map((day, i) => (
                    <div key={i} className="flex-1 border-r min-h-[28px] px-1 space-y-0.5 py-0.5" style={{ borderColor: 'var(--border-subtle)' }}>
                        {allDayEventsForDay(day).map(ev => (
                            <EventChip key={ev.id} event={ev} onClick={() => onEventClick(ev)} compact />
                        ))}
                    </div>
                ))}
            </div>
            {/* Scrollable hour grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex" style={{ minHeight: HOUR_HEIGHT * 24 }}>
                    {/* Hour labels */}
                    <div className="w-14 shrink-0 relative">
                        {hours.map(h => (
                            <div
                                key={h}
                                style={{ height: HOUR_HEIGHT, borderTop: h > 0 ? `1px solid var(--border-subtle)` : 'none' }}
                                className="flex items-start justify-end pr-2 pt-0.5"
                            >
                                {h > 0 && (
                                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: -7 }}>
                                        {h.toString().padStart(2, '0')}:00
                                    </span>
                                )}
                            </div>
                        ))}
                        {/* current time marker label */}
                        {sameDay(days[0], today) || days.some(d => sameDay(d, today)) ? (() => {
                            const now = new Date();
                            const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
                            return (
                                <div className="absolute right-0 flex items-center" style={{ top: top - 6, zIndex: 5 }}>
                                    <span style={{ fontSize: 9, color: 'var(--accent-primary)', marginRight: 2 }}>
                                        {formatTime(now.toISOString())}
                                    </span>
                                </div>
                            );
                        })() : null}
                    </div>
                    {/* Day columns */}
                    {days.map((day, di) => {
                        const isToday = sameDay(day, today);
                        return (
                            <div
                                key={di}
                                className="flex-1 relative border-l"
                                style={{ borderColor: 'var(--border-subtle)', background: isToday ? 'rgba(245,158,11,0.025)' : undefined }}
                            >
                                {/* Hour cells */}
                                {hours.map(h => (
                                    <div
                                        key={h}
                                        onClick={() => onSlotClick(day, h)}
                                        style={{ height: HOUR_HEIGHT, borderTop: `1px solid var(--border-subtle)` }}
                                        className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    />
                                ))}
                                {/* Current time line */}
                                {isToday && (() => {
                                    const now = new Date();
                                    const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
                                    return (
                                        <div
                                            className="absolute left-0 right-0 pointer-events-none"
                                            style={{ top, height: 2, background: 'var(--accent-primary)', zIndex: 4, boxShadow: '0 0 6px rgba(245,158,11,0.6)' }}
                                        />
                                    );
                                })()}
                                {/* Events */}
                                {timedEventsForDay(day).map(ev => (
                                    <button
                                        key={ev.id}
                                        style={eventStyle(ev)}
                                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                                        className="text-left hover:opacity-80 transition-opacity cursor-pointer"
                                    >
                                        <div className="font-medium truncate" style={{ fontSize: 11 }}>{ev.name}</div>
                                        <div className="opacity-70 truncate" style={{ fontSize: 10 }}>{formatTime(ev.start)}</div>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ── CalendarGrid (main export) ────────────────────────────────────────────────

export const CalendarGrid: React.FC<Props> = ({ events, onNewAt, onEventClick, onVisibleRangeChange }) => {
    const [view, setView] = useState<GridView>('month');
    const [anchor, setAnchor] = useState(() => new Date());
    const [popup, setPopup] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);

    useEffect(() => {
        onVisibleRangeChange?.(getVisibleRange(anchor, view));
    }, [anchor, view, onVisibleRangeChange]);

    // Navigation
    const navigate = (dir: 1 | -1) => {
        setAnchor(prev => {
            const d = new Date(prev);
            if (view === 'month') d.setMonth(d.getMonth() + dir);
            else if (view === 'week') d.setDate(d.getDate() + dir * 7);
            else d.setDate(d.getDate() + dir);
            return d;
        });
    };

    const goToday = () => setAnchor(new Date());

    // Title
    const title = useMemo(() => {
        if (view === 'month') return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
        if (view === 'week') {
            const weekStart = addDays(anchor, -anchor.getDay());
            const weekEnd = addDays(weekStart, 6);
            return `${weekStart.toLocaleDateString()} – ${weekEnd.toLocaleDateString()}`;
        }
        return anchor.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }, [anchor, view]);

    // Days for week/day view
    const weekDays = useMemo(() => {
        if (view === 'week') {
            const start = addDays(anchor, -anchor.getDay());
            return Array.from({ length: 7 }, (_, i) => addDays(start, i));
        }
        return [anchor];
    }, [anchor, view]);

    const handleEventClick = useCallback((ev: CalendarEvent) => {
        if (onEventClick) onEventClick(ev);
        setPopup(null); // handled externally
    }, [onEventClick]);

    const handleDayClick = (d: Date) => {
        if (onNewAt) {
            const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0).toISOString();
            onNewAt(iso);
        }
    };

    const handleSlotClick = (d: Date, hour: number) => {
        if (onNewAt) {
            const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0).toISOString();
            onNewAt(iso);
        }
    };

    const today = new Date();

    return (
        <div
            className="flex flex-col rounded-xl overflow-hidden h-full"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            onClick={() => setPopup(null)}
        >
            {/* ── Toolbar ── */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                style={{ borderColor: 'var(--border-default)' }}
            >
                {/* Left: nav */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToday}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
                    >
                        Today
                    </button>
                    <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <ChevronLeft className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <h2 className="text-sm font-semibold ml-1" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                </div>

                {/* Right: view switcher + new */}
                <div className="flex items-center gap-2">
                    {(['month', 'week', 'day'] as GridView[]).map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
                            style={view === v
                                ? { background: 'var(--accent-muted)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }
                                : { background: 'transparent', color: 'var(--text-tertiary)' }
                            }
                        >
                            {v}
                        </button>
                    ))}
                    {onNewAt && (
                        <button
                            onClick={() => onNewAt(new Date().toISOString())}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-1"
                            style={{ background: 'var(--accent-gradient)', color: '#000' }}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New
                        </button>
                    )}
                </div>
            </div>

            {/* ── Week/Day column headers ── */}
            {view !== 'month' && (
                <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="w-14 shrink-0" />
                    {weekDays.map((d, i) => {
                        const isToday = sameDay(d, today);
                        return (
                            <div key={i} className="flex-1 py-2 text-center border-l" style={{ borderColor: 'var(--border-subtle)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {DAY_NAMES[d.getDay()]}
                                </div>
                                <div
                                    className="text-sm font-semibold w-8 h-8 flex items-center justify-center mx-auto rounded-full"
                                    style={isToday
                                        ? { background: 'var(--accent-primary)', color: '#000' }
                                        : { color: 'var(--text-primary)' }
                                    }
                                >
                                    {d.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Grid body ── */}
            {view === 'month' && (
                <MonthView
                    anchor={anchor}
                    events={events}
                    onDayClick={handleDayClick}
                    onEventClick={handleEventClick}
                />
            )}
            {(view === 'week' || view === 'day') && (
                <TimedGrid
                    days={weekDays}
                    events={events}
                    onSlotClick={handleSlotClick}
                    onEventClick={handleEventClick}
                />
            )}
        </div>
    );
};

export default CalendarGrid;
