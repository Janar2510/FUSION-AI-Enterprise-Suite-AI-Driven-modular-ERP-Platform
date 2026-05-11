import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useWebsiteStore, WebsitePage } from '../stores/websiteStore';
import { Monitor, FileText, Share2, BarChart3, Globe } from 'lucide-react';

export const WebsiteModule: React.FC = () => {
    const {
        pages,
        fetchPages,
        createPage,
        updatePage,
        deletePage
    } = useWebsiteStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // Actually kanban view acts as "dashboard cards"
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<WebsitePage | null>(null);
    const [formData, setFormData] = useState<Partial<WebsitePage>>({
        isPublished: false,
        name: '',
        url: ''
    });

    useEffect(() => {
        fetchPages();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            isPublished: false,
            name: 'New Page',
            url: '/new-page'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: WebsitePage) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updatePage(activeRecord.id, formData);
        } else {
            const newPage = await createPage(formData);
            if (newPage) setActiveRecord(newPage);
        }
        setCurrentView('list');
    };

    const togglePublish = async () => {
        if (!activeRecord) return;
        const newStatus = !formData.isPublished;
        setFormData({ ...formData, isPublished: newStatus });
        await updatePage(activeRecord.id, { isPublished: newStatus });
        setActiveRecord({ ...activeRecord, isPublished: newStatus });
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (confirm('Delete this page?')) {
            await deletePage(id);
        }
    };

    const renderDashboard = () => (
        <div className="pt-4 space-y-8">
            <div className="flex gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex-1 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                            <Monitor className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Total Views (30 days)</p>
                            <h3 className="text-2xl font-bold text-white">
                                {pages.reduce((acc, p) => acc + p.viewCount, 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex-1 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Published Pages</p>
                            <h3 className="text-2xl font-bold text-white">
                                {pages.filter(p => p.isPublished).length}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex-1 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Total Pages</p>
                            <h3 className="text-2xl font-bold text-white">
                                {pages.length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                <OdooListBase
                    data={pages.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.url?.toLowerCase().includes(searchTerm.toLowerCase()))}
                    onRowClick={handleRowClick}
                    keyExtractor={(t) => t.id.toString()}
                    columns={[
                        { key: 'name', label: 'Page Name', render: (t) => <span className="font-bold">{t.name}</span> },
                        { key: 'url', label: 'URL / Path', render: (t) => <span className="text-white/70 font-mono text-xs">{t.url}</span> },
                        { key: 'views', label: 'Views', render: (t) => t.viewCount.toLocaleString() },
                        {
                            key: 'state', label: 'Status', render: (t) => (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                                ${t.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}
                            `}>
                                    {t.isPublished ? 'Published' : 'Draft'}
                                </span>
                            )
                        },
                        {
                            key: 'actions', label: '', render: (t) => (
                                <button onClick={(e) => handleDelete(e, t.id)} className="text-red-400/50 hover:text-red-400 p-1">
                                    Delete
                                </button>
                            )
                        },
                    ]}
                />
            </div>
        </div>
    );

    const renderList = () => (
        renderDashboard() // Just alias for now
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {formData.isPublished ? (
                            <button onClick={togglePublish} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-sm transition-colors">
                                Unpublish
                            </button>
                        ) : (
                            <button onClick={togglePublish} className="bg-primary-500 hover:bg-primary-500/80 text-white px-4 py-1.5 rounded text-sm transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] shadow-primary-500/20">
                                Publish
                            </button>
                        )}
                        <button className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-blue-500/30">
                            Launch Editor
                        </button>
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
                        placeholder="Page Name..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-white/40">fusionai.com</span>
                        <input
                            type="text"
                            className="bg-transparent text-white/80 border-b border-white/20 outline-none focus:border-primary-500 transition-all text-sm font-mono w-64"
                            placeholder="/your-url"
                            value={formData.url || ''}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value.replace(/[^a-zA-Z0-9-/]/g, '').toLowerCase() })}
                        />
                    </div>
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-primary-500" />
                            Page Content
                        </h3>
                        <div className="flex items-center justify-center h-48 border border-white/10 border-dashed rounded bg-black/20 text-white/40 flex-col gap-3">
                            <p>Use the visual builder to edit page content.</p>
                            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-colors">
                                Launch Website Editor
                            </button>
                        </div>
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-blue-400" />
                            SEO Data
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-white/60 text-xs font-medium uppercase">SEO Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary-500 transition-all text-sm font-medium"
                                    value={formData.seoTitle || ''}
                                    placeholder={formData.name}
                                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-white/60 text-xs font-medium uppercase">Meta Description</label>
                                <textarea
                                    className="w-full h-24 bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary-500 transition-all text-sm resize-none"
                                    value={formData.seoDescription || ''}
                                    placeholder="Brief description for search engines..."
                                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-400" />
                            Analytics
                        </h3>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60">Total Views</span>
                            <span className="text-white font-bold">{formData.viewCount || 0}</span>
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Website Pages"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('list')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'form']} // kanban works as dashboard
        >
            {currentView === 'kanban' && renderDashboard()}
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
