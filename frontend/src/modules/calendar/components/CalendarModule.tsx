import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useCalendarStore, CalendarEvent } from '../stores/calendarStore';
import { Calendar as CalendarIcon, Users, MapPin } from 'lucide-react';

export const CalendarModule: React.FC = () => {
    const {
        events,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent
    } = useCalendarStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<CalendarEvent | null>(null);
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({
        allday: false,
        start: new Date().toISOString(),
        stop: new Date(Date.now() + 3600000).toISOString()
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            allday: false,
            start: new Date().toISOString(),
            stop: new Date(Date.now() + 3600000).toISOString(),
            name: 'New Event'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: CalendarEvent) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateEvent(activeRecord.id, formData);
        } else {
            const ev = await createEvent(formData);
            if (ev) setActiveRecord(ev);
        }
        setCurrentView('list');
    };

    const handleDelete = async () => {
        if (!activeRecord) return;
        if (window.confirm("Are you sure you want to delete this event?")) {
            await deleteEvent(activeRecord.id);
            setCurrentView('list');
        }
    };

    const filteredEvents = events.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderDashboard = () => (
        <div className="bg-white/5 border border-white/10 p-8 rounded-xl flex flex-col items-center justify-center h-64">
            <CalendarIcon className="w-12 h-12 text-white/30 mb-4" />
            <h3 className="text-xl font-medium text-white/60 mb-2">Calendar View is in List Format</h3>
            <p className="text-white/40 text-sm">Switch to the List view to see upcoming events or create new ones.</p>
        </div>
    );

    const renderList = () => (
        <OdooListBase
            data={filteredEvents}
            onRowClick={handleRowClick}
            keyExtractor={(t) => t.id.toString()}
            columns={[
                { key: 'name', label: 'Subject', render: (t) => <span className="font-bold">{t.name}</span> },
                { key: 'start', label: 'Start Date', render: (t) => new Date(t.start).toLocaleString() },
                { key: 'stop', label: 'End Date', render: (t) => new Date(t.stop).toLocaleString() },
                { key: 'attendees', label: 'Attendees', render: (t) => t.attendees?.length || 0 },
                { key: 'location', label: 'Location', render: (t) => t.location || '-' },
            ]}
        />
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex justify-between w-full">
                    <div className="flex gap-2">
                        {activeRecord && (
                            <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">
                                Delete Event
                            </button>
                        )}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Meeting Subject..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Starting at</label>
                            <input
                                type={formData.allday ? "date" : "datetime-local"}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.start ? formData.start.slice(0, formData.allday ? 10 : 16) : ''}
                                onChange={(e) => setFormData({ ...formData, start: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Ending at</label>
                            <input
                                type={formData.allday ? "date" : "datetime-local"}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={formData.stop ? formData.stop.slice(0, formData.allday ? 10 : 16) : ''}
                                onChange={(e) => setFormData({ ...formData, stop: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-white/20 bg-white/5 text-primary-purple focus:ring-primary-purple focus:ring-offset-gray-900"
                                    checked={formData.allday || false}
                                    onChange={(e) => setFormData({ ...formData, allday: e.target.checked })}
                                />
                                All Day
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-white/60 text-sm font-medium">Description</label>
                        <textarea
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-purple transition-all resize-none"
                            placeholder="Add meeting agenda or notes here..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-400" />
                            Location
                        </h3>
                        <div className="space-y-2">
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary-purple transition-all text-sm"
                                placeholder="E.g. Conference Room A, or Zoom Link"
                                value={formData.location || ''}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            Attendees
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2 mb-2">
                                <span className="text-white/60">Total Invited</span>
                                <span className="text-white font-bold">{formData.attendees?.length || 0}</span>
                            </div>
                            {formData.attendees?.map(a => (
                                <div key={a.id} className="text-sm bg-white/5 px-3 py-2 rounded flex justify-between">
                                    <span>{a.partner?.name || 'Unknown'}</span>
                                    <span className="text-white/40 capitalize">{a.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Calendar"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('list')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'form']}
        >
            {currentView === 'kanban' && renderDashboard()}
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
