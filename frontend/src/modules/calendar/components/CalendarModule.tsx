import React, { useEffect, useState } from 'react';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooListBase } from '@/components/views/OdooListBase';
import { useCalendarStore, CalendarEvent } from '../stores/calendarStore';
import { CalendarGrid } from './CalendarGrid';
import { Calendar as CalendarIcon, List, Users, MapPin, LayoutGrid } from 'lucide-react';

type AppView = 'grid' | 'list' | 'form';

export const CalendarModule: React.FC = () => {
    const { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent } = useCalendarStore();

    const [currentView, setCurrentView] = useState<AppView>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRecord, setActiveRecord] = useState<CalendarEvent | null>(null);
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({
        allday: false,
        start: new Date().toISOString(),
        stop: new Date(Date.now() + 3_600_000).toISOString(),
    });

    useEffect(() => { fetchEvents(); }, []);

    const handleNew = (start?: string) => {
        setActiveRecord(null);
        setFormData({
            allday: false,
            name: 'New Event',
            start: start ?? new Date().toISOString(),
            stop: new Date((start ? new Date(start).getTime() : Date.now()) + 3_600_000).toISOString(),
        });
        setCurrentView('form');
    };

    const handleEventClick = (event: CalendarEvent) => {
        setActiveRecord(event);
        setFormData(event);
        setCurrentView('form');
    };

    const handleRowClick = handleEventClick;

    const handleSave = async () => {
        if (activeRecord) {
            await updateEvent(activeRecord.id, formData);
        } else {
            await createEvent(formData);
        }
        setCurrentView('grid');
    };

    const handleDelete = async () => {
        if (!activeRecord) return;
        if (window.confirm('Are you sure you want to delete this event?')) {
            await deleteEvent(activeRecord.id);
            setCurrentView('grid');
        }
    };

    const filteredEvents = events.filter(e =>
        e.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── View switcher toolbar ───────────────────────────────────────────────

    const renderTopBar = () => (
        <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}
        >
            <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
                <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Calendar</h1>
            </div>
            <div className="flex items-center gap-2">
                {/* Search */}
                {currentView !== 'form' && (
                    <input
                        type="text"
                        placeholder="Search events…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-lg outline-none"
                        style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                            width: 180,
                        }}
                    />
                )}
                {/* View buttons */}
                {currentView !== 'form' && (
                    <>
                        <button
                            onClick={() => setCurrentView('grid')}
                            className="p-1.5 rounded-lg transition-colors"
                            title="Calendar grid"
                            style={currentView === 'grid' ? { background: 'var(--accent-muted)', color: 'var(--accent-text)' } : { color: 'var(--text-tertiary)' }}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentView('list')}
                            className="p-1.5 rounded-lg transition-colors"
                            title="List view"
                            style={currentView === 'list' ? { background: 'var(--accent-muted)', color: 'var(--accent-text)' } : { color: 'var(--text-tertiary)' }}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </>
                )}
                {/* Back / New */}
                {currentView === 'form' ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentView('grid')}
                            className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                            style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: 'var(--accent-gradient)', color: '#000' }}
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleNew()}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: 'var(--accent-gradient)', color: '#000' }}
                    >
                        + New Event
                    </button>
                )}
            </div>
        </div>
    );

    // ── Form view ──────────────────────────────────────────────────────────

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                activeRecord ? (
                    <button
                        onClick={handleDelete}
                        className="px-4 py-1.5 rounded text-sm transition-colors"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                        Delete
                    </button>
                ) : null
            }
            headerContent={
                <input
                    type="text"
                    className="text-4xl font-bold bg-transparent border-b border-transparent placeholder-white/30 outline-none focus:border-amber-400 transition-all w-full"
                    style={{ color: 'var(--text-primary)' }}
                    placeholder="Event Subject…"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Start</label>
                            <input
                                type={formData.allday ? 'date' : 'datetime-local'}
                                className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                value={formData.start ? formData.start.slice(0, formData.allday ? 10 : 16) : ''}
                                onChange={e => setFormData({ ...formData, start: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>End</label>
                            <input
                                type={formData.allday ? 'date' : 'datetime-local'}
                                className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                value={formData.stop ? formData.stop.slice(0, formData.allday ? 10 : 16) : ''}
                                onChange={e => setFormData({ ...formData, stop: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.allday || false}
                                    onChange={e => setFormData({ ...formData, allday: e.target.checked })}
                                    className="rounded"
                                />
                                All Day
                            </label>
                        </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Description</label>
                        <textarea
                            className="w-full h-32 rounded-lg px-4 py-3 text-sm outline-none resize-none transition-all"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                            placeholder="Add meeting agenda or notes…"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <MapPin className="w-4 h-4" style={{ color: '#f87171' }} />
                            Location
                        </h3>
                        <input
                            type="text"
                            className="w-full rounded px-3 py-2 text-sm outline-none"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                            placeholder="Conference Room A…"
                            value={formData.location || ''}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Users className="w-4 h-4" style={{ color: '#93c5fd' }} />
                            Attendees
                        </h3>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {formData.attendees?.length ?? 0} attendee(s) — manage after saving
                        </div>
                    </div>
                    <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Recurrence (RRULE)</h3>
                        <input
                            type="text"
                            className="w-full rounded px-3 py-2 text-sm outline-none font-mono"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                            placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
                            value={formData.rrule || ''}
                            onChange={e => setFormData({ ...formData, rrule: e.target.value || null })}
                        />
                        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>RFC 5545 RRULE string. Leave blank for one-time event.</p>
                    </div>
                </div>
            }
        />
    );

    // ── List view ──────────────────────────────────────────────────────────

    const renderList = () => (
        <OdooListBase
            data={filteredEvents}
            onRowClick={handleRowClick}
            keyExtractor={e => e.id.toString()}
            columns={[
                { key: 'name',      label: 'Subject',   render: e => <span className="font-semibold">{e.name}{e.rrule ? ' 🔁' : ''}</span> },
                { key: 'start',     label: 'Start',     render: e => new Date(e.start).toLocaleString() },
                { key: 'stop',      label: 'End',       render: e => new Date(e.stop).toLocaleString() },
                { key: 'attendees', label: 'Attendees', render: e => e.attendees?.length ?? 0 },
                { key: 'location',  label: 'Location',  render: e => e.location || '—' },
            ]}
        />
    );

    // ── Root ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>
            {renderTopBar()}
            <div className="flex-1 p-4 min-h-0">
                {loading && currentView !== 'form' && (
                    <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Loading events…
                    </div>
                )}
                {!loading && currentView === 'grid' && (
                    <div className="h-full" style={{ minHeight: 560 }}>
                        <CalendarGrid
                            events={filteredEvents}
                            onNewAt={handleNew}
                            onEventClick={handleEventClick}
                        />
                    </div>
                )}
                {currentView === 'list' && renderList()}
                {currentView === 'form' && renderForm()}
            </div>
        </div>
    );
};
