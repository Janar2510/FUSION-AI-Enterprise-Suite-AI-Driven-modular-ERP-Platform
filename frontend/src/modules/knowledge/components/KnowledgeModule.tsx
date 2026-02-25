import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useKnowledgeStore, KnowledgeArticle } from '../stores/knowledgeStore';
import { BookOpen, Folder, Eye, Archive } from 'lucide-react';

export const KnowledgeModule: React.FC = () => {
    const {
        articles,
        fetchArticles,
        createArticle,
        updateArticle
    } = useKnowledgeStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // acts as dashboard layout
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<KnowledgeArticle | null>(null);
    const [formData, setFormData] = useState<Partial<KnowledgeArticle>>({
        isPublished: true,
        category: 'General'
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            isPublished: false,
            title: 'New Article',
            category: 'General'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: KnowledgeArticle) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateArticle(activeRecord.id, formData);
        } else {
            const newArticle = await createArticle(formData);
            if (newArticle) setActiveRecord(newArticle);
        }
        setCurrentView('list');
    };

    const handleAction = async (isPublished: boolean) => {
        if (!activeRecord) return;
        const updates: Partial<KnowledgeArticle> = { isPublished };
        await updateArticle(activeRecord.id, updates);
        setActiveRecord({ ...activeRecord, ...updates });
        setFormData({ ...formData, ...updates });
    };

    const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));

    const renderDashboardCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Articles</p>
                        <h3 className="text-2xl font-bold text-white">
                            {articles.length}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                        <Eye className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Views</p>
                        <h3 className="text-2xl font-bold text-white">
                            {articles.reduce((acc, a) => acc + (a.viewCount || 0), 0).toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                        <Folder className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Categories</p>
                        <h3 className="text-2xl font-bold text-white">
                            {categories.length}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-500">
                        <Archive className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Drafts</p>
                        <h3 className="text-2xl font-bold text-white">
                            {articles.filter(a => !a.isPublished).length}
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
                data={articles.filter(t => t.title?.toLowerCase().includes(searchTerm.toLowerCase()))}
                onRowClick={handleRowClick}
                keyExtractor={(t) => t.id.toString()}
                columns={[
                    { key: 'title', label: 'Article Title', render: (t) => <span className="font-bold">{t.title}</span> },
                    { key: 'category', label: 'Category', render: (t) => t.category || 'Uncategorized' },
                    { key: 'views', label: 'Views', render: (t) => t.viewCount.toLocaleString() },
                    { key: 'updated', label: 'Last Updated', render: (t) => new Date(t.updatedAt).toLocaleDateString() },
                    {
                        key: 'state', label: 'Status', render: (t) => (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                            ${t.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}
                        `}>
                                {t.isPublished ? 'Published' : 'Draft'}
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
                        {formData.isPublished ? (
                            <button onClick={() => handleAction(false)} className="bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-yellow-500/30">Unpublish</button>
                        ) : (
                            <button onClick={() => handleAction(true)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)] shadow-green-500/20">Publish Article</button>
                        )}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Article Title..."
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary-purple" />
                            Article Content (Markdown)
                        </h3>
                        <textarea
                            className="w-full h-96 bg-black/20 border border-white/10 rounded-md px-4 py-3 text-white font-mono text-sm outline-none focus:border-primary-purple transition-all resize-none"
                            placeholder="# Welcome to the Knowledge Base\n\nWrite your content here..."
                            value={formData.body || ''}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        />
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Folder className="w-5 h-5 text-purple-400" />
                            Organization
                        </h3>
                        <div className="space-y-2">
                            <label className="text-white/60 text-xs font-medium uppercase">Category</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary-purple transition-all text-sm font-medium"
                                value={formData.category || ''}
                                placeholder="E.g. Engineering, HR, Sales"
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                    </div>

                    {activeRecord && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-400" />
                                Stats
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-white/60">Total Views</span>
                                    <span className="text-white font-bold">{formData.viewCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-2">
                                    <span className="text-white/60">Created</span>
                                    <span className="text-white/80 font-mono text-xs">{new Date(formData.createdAt || Date.now()).toLocaleDateString()}</span>
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
            title="Knowledge Base"
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
