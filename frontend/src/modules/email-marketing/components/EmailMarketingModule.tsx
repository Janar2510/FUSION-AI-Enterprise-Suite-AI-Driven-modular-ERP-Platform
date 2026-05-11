import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useEmailStore, MassMailing } from '../stores/emailStore';
import { Mail, CheckCircle, Clock, AlertTriangle, BarChart3 } from 'lucide-react';

export const EmailMarketingModule: React.FC = () => {
    const {
        mailings,
        fetchMailings,
        createMailing,
        updateMailing
    } = useEmailStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // acts as dashboard layout
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<MassMailing | null>(null);
    const [formData, setFormData] = useState<Partial<MassMailing>>({
        state: 'draft',
        subject: ''
    });

    useEffect(() => {
        fetchMailings();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            state: 'draft',
            subject: 'New Campaign'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: MassMailing) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateMailing(activeRecord.id, formData);
        } else {
            const newMailing = await createMailing(formData);
            if (newMailing) setActiveRecord(newMailing);
        }
        setCurrentView('list');
    };

    const handleAction = async (newState: string) => {
        if (!activeRecord) return;
        const updates: Partial<MassMailing> = { state: newState };
        if (newState === 'sending') {
            updates.sentDate = new Date().toISOString();
        }
        await updateMailing(activeRecord.id, updates);
        setActiveRecord({ ...activeRecord, ...updates });
        setFormData({ ...formData, ...updates });
    };

    const renderDashboardCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Sent</p>
                        <h3 className="text-2xl font-bold text-white">
                            {mailings.reduce((acc: number, m: MassMailing) => acc + (m.sentCount || 0), 0).toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Avg Open Rate</p>
                        <h3 className="text-2xl font-bold text-white">
                            {mailings.length > 0 && mailings.reduce((acc: number, m: MassMailing) => acc + (m.sentCount || 0), 0) > 0 ?
                                Math.round((mailings.reduce((acc: number, m: MassMailing) => acc + (m.openedCount || 0), 0) / mailings.reduce((acc: number, m: MassMailing) => acc + (m.sentCount || 0), 0)) * 100)
                                : 0}%
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Scheduled</p>
                        <h3 className="text-2xl font-bold text-white">
                            {mailings.filter((m: MassMailing) => m.state === 'in_queue').length}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Avg Bounce Rate</p>
                        <h3 className="text-2xl font-bold text-white">
                            {mailings.length > 0 && mailings.reduce((acc: number, m: MassMailing) => acc + (m.sentCount || 0), 0) > 0 ?
                                Math.round((mailings.reduce((acc: number, m: MassMailing) => acc + (m.bouncedCount || 0), 0) / mailings.reduce((acc: number, m: MassMailing) => acc + (m.sentCount || 0), 0)) * 100)
                                : 0}%
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
                data={mailings.filter((t: MassMailing) => t.subject?.toLowerCase().includes(searchTerm.toLowerCase()))}
                onRowClick={handleRowClick}
                keyExtractor={(t: MassMailing) => t.id.toString()}
                columns={[
                    { key: 'subject', label: 'Subject', render: (t: MassMailing) => <span className="font-bold">{t.subject}</span> },
                    { key: 'sent', label: 'Sent', render: (t: MassMailing) => t.sentCount > 0 ? t.sentCount.toLocaleString() : '-' },
                    { key: 'opened', label: 'Opened', render: (t: MassMailing) => t.openedCount > 0 ? `${Math.round((t.openedCount / (t.sentCount || 1)) * 100)}%` : '-' },
                    { key: 'clicked', label: 'Clicked', render: (t: MassMailing) => t.clickedCount > 0 ? `${Math.round((t.clickedCount / (t.sentCount || 1)) * 100)}%` : '-' },
                    { key: 'date', label: 'Date', render: (t: MassMailing) => t.sentDate ? new Date(t.sentDate).toLocaleDateString() : t.scheduledDate ? `Scheduled for ${new Date(t.scheduledDate).toLocaleDateString()}` : '-' },
                    {
                        key: 'state', label: 'Status', render: (t: MassMailing) => (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                            ${t.state === 'draft' ? 'bg-white/10 text-white/60' :
                                    t.state === 'in_queue' ? 'bg-yellow-500/20 text-yellow-500' :
                                        t.state === 'sending' ? 'bg-blue-500/20 text-blue-400' :
                                            t.state === 'done' ? 'bg-green-500/20 text-green-400' :
                                                'bg-white/10 text-white/60'}
                        `}>
                                {t.state.replace('_', ' ')}
                            </span>
                        )
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
                        {formData.state === 'draft' && <button onClick={() => handleAction('in_queue')} className="bg-primary-500 hover:bg-primary-500/80 text-white px-4 py-1.5 rounded text-sm transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] shadow-primary-500/20">Schedule</button>}
                        {formData.state === 'draft' && <button onClick={() => handleAction('sending')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Send Now</button>}
                        {formData.state === 'in_queue' && <button onClick={() => handleAction('draft')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-sm transition-colors">Cancel Schedule</button>}
                        {formData.state === 'sending' && <button onClick={() => handleAction('done')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Mark as Done</button>}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
                        placeholder="Campaign Subject..."
                        value={formData.subject || ''}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        disabled={formData.state !== 'draft'}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary-500" />
                            Email Body (HTML)
                        </h3>
                        <textarea
                            className="w-full h-80 bg-black/20 border border-white/10 rounded-md px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary-500 transition-all resize-none"
                            placeholder="<h1>Hello World</h1>..."
                            value={formData.bodyHtml || ''}
                            onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                            disabled={formData.state !== 'draft'}
                        />
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    {formData.state === 'draft' || formData.state === 'in_queue' ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-400" />
                                Scheduling
                            </h3>
                            <div className="space-y-2">
                                <label className="text-white/60 text-xs font-medium uppercase">Scheduled Send Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary-500 transition-all text-sm font-medium"
                                    value={formData.scheduledDate ? new Date(formData.scheduledDate).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setFormData({ ...formData, scheduledDate: new Date(e.target.value).toISOString() })}
                                    disabled={formData.state !== 'draft'}
                                />
                                {formData.state === 'in_queue' && (
                                    <p className="text-xs text-yellow-500 mt-2">This email is queued and will be sent automatically.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                Delivery Metrics
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-white/60">Sent</span>
                                    <span className="text-white font-bold">{formData.sentCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-white/60">Opened</span>
                                    <span className="text-green-400 font-bold">{formData.openedCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-white/60">Clicked</span>
                                    <span className="text-blue-400 font-bold">{formData.clickedCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-2">
                                    <span className="text-white/60">Bounced</span>
                                    <span className="text-red-400 font-bold">{formData.bouncedCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Email Marketing"
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
