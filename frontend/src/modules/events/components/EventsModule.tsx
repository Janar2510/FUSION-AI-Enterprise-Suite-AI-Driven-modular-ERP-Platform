import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useEventsStore, EventEvent } from '../stores/eventsStore';
import { Ticket, Calendar, Users, Clock } from 'lucide-react';

export const EventsModule: React.FC = () => {
    const {
        events,
        fetchEvents,
        createEvent,
        updateEvent
    } = useEventsStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // kanban view = dashboard cards
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<EventEvent | null>(null);
    const [formData, setFormData] = useState<Partial<EventEvent>>({
        active: true,
        seatsMax: 0,
        dateBegin: new Date().toISOString(),
        dateEnd: new Date(Date.now() + 86400000).toISOString(),
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            active: true,
            seatsMax: 0,
            dateBegin: new Date().toISOString(),
            dateEnd: new Date(Date.now() + 86400000).toISOString(),
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: EventEvent) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateEvent(activeRecord.id, formData);
        } else {
            const newEvent = await createEvent(formData);
            if (newEvent) setActiveRecord(newEvent);
        }
        setCurrentView('list');
    };

    const handleAction = async (isActive: boolean) => {
        if (!activeRecord) return;
        const updates: Partial<EventEvent> = { active: isActive };
        await updateEvent(activeRecord.id, updates);
        setActiveRecord({ ...activeRecord, ...updates });
        setFormData({ ...formData, ...updates });
    };

    const upcoming = events.filter(e => new Date(e.dateBegin) >= new Date());
    const totalRegs = events.reduce((s, e) => s + (e._count?.registrations || 0), 0);

    const renderDashboardCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-fuchsia-500/20 rounded-lg flex items-center justify-center text-fuchsia-400">
                        <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Events</p>
                        <h3 className="text-2xl font-bold text-white">
                            {events.length}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Upcoming</p>
                        <h3 className="text-2xl font-bold text-white">
                            {upcoming.length}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Registrations</p>
                        <h3 className="text-2xl font-bold text-white">
                            {totalRegs}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Active</p>
                        <h3 className="text-2xl font-bold text-white">
                            {events.filter(e => e.active).length}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div>
            {renderDashboardCards()}
            <OdooListBase
                data={events.filter((t: EventEvent) => t.name?.toLowerCase().includes(searchTerm.toLowerCase()))}
                onRowClick={handleRowClick}
                keyExtractor={(t: EventEvent) => t.id.toString()}
                columns={[
                    { key: 'name', label: 'Event Name', render: (t: EventEvent) => <span className="font-bold">{t.name}</span> },
                    { key: 'dateBegin', label: 'Start Date', render: (t: EventEvent) => new Date(t.dateBegin).toLocaleString() },
                    { key: 'dateEnd', label: 'End Date', render: (t: EventEvent) => new Date(t.dateEnd).toLocaleString() },
                    { key: 'location', label: 'Location', render: (t: EventEvent) => t.location || '-' },
                    { key: 'attendees', label: 'Attendees', render: (t: EventEvent) => `${t._count?.registrations || 0} / ${t.seatsMax > 0 ? t.seatsMax : '∞'}` },
                    {
                        key: 'state', label: 'Status', render: (t: EventEvent) => {
                            const isUp = new Date(t.dateBegin) >= new Date();
                            return (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                                ${!t.active ? 'bg-red-500/20 text-red-400' :
                                        isUp ? 'bg-green-500/20 text-green-400' :
                                            'bg-white/10 text-white/60'}
                            `}>
                                    {!t.active ? 'Cancelled' : isUp ? 'Upcoming' : 'Past'}
                                </span>
                            )
                        }
                    },
                ]}
            />
        </div>
    );

    const renderList = () => (
        renderDashboard()
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {formData.active ? (
                            <button onClick={() => handleAction(false)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-sm transition-colors">Archive / Cancel</button>
                        ) : (
                            <button onClick={() => handleAction(true)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Restore</button>
                        )}
                        <button className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-blue-500/30">Go to Website</button>
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
                        placeholder="Event Name..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Start Date</label>
                            <input
                                type="datetime-local"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.dateBegin ? new Date(formData.dateBegin).toISOString().slice(0, 16) : ''}
                                onChange={(e) => setFormData({ ...formData, dateBegin: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">End Date</label>
                            <input
                                type="datetime-local"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                                value={formData.dateEnd ? new Date(formData.dateEnd).toISOString().slice(0, 16) : ''}
                                onChange={(e) => setFormData({ ...formData, dateEnd: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-white/60 text-sm font-medium">Location</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                            placeholder="Venue name or address online link..."
                            value={formData.location || ''}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2 pt-4">
                        <label className="text-white/60 text-sm font-medium">Description</label>
                        <textarea
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-500 transition-all resize-none"
                            placeholder="Add event details here..."
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
                            <Users className="w-5 h-5 text-green-400" />
                            Registrations
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-white/60 text-xs font-medium uppercase text-center block">Maximum Attendees</label>
                                <input
                                    type="number"
                                    className="w-24 mx-auto block bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-center outline-none focus:border-primary-500 transition-all text-lg font-bold"
                                    value={formData.seatsMax || 0}
                                    onChange={(e) => setFormData({ ...formData, seatsMax: parseInt(e.target.value) })}
                                />
                                <p className="text-white/40 text-xs text-center">Set to 0 for unlimited</p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/10">
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-white/60">Registered</span>
                                    <span className="text-green-400 font-bold">{formData._count?.registrations || 0}</span>
                                </div>
                                {formData.seatsMax ? (
                                    <div className="flex justify-between items-center text-sm pt-2">
                                        <span className="text-white/60">Available</span>
                                        <span className="text-white font-bold">{Math.max(0, formData.seatsMax - (formData._count?.registrations || 0))}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Events"
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
