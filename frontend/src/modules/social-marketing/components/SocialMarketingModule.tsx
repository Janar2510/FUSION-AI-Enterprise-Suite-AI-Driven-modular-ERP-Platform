import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { MessageSquare, ThumbsUp, Share2, MousePointerClick, Facebook, Twitter, Linkedin, BarChart3 } from 'lucide-react';

export const SocialMarketingModule: React.FC = () => {
    const {
        posts,
        fetchPosts,
        createPost,
        updatePost
    } = useSocialStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // kanban view = metrics cards
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<SocialPost | null>(null);
    const [formData, setFormData] = useState<Partial<SocialPost>>({
        state: 'draft',
        content: '',
        postFacebook: true,
        postTwitter: true,
        postLinkedin: true,
    });

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            state: 'draft',
            content: '',
            postFacebook: true,
            postTwitter: true,
            postLinkedin: true,
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: SocialPost) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updatePost(activeRecord.id, formData);
        } else {
            const newPost = await createPost(formData);
            if (newPost) setActiveRecord(newPost);
        }
        setCurrentView('list');
    };

    const handleAction = async (newState: string) => {
        if (!activeRecord) return;
        const updates: Partial<SocialPost> = { state: newState };
        if (newState === 'posted') {
            updates.publishedDate = new Date().toISOString();
        }
        await updatePost(activeRecord.id, updates);
        setActiveRecord({ ...activeRecord, ...updates });
        setFormData({ ...formData, ...updates });
    };

    const renderDashboardCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                        <ThumbsUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Likes</p>
                        <h3 className="text-2xl font-bold text-white">
                            {posts.reduce((acc: number, p: SocialPost) => acc + (p.likes || 0), 0).toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Comments</p>
                        <h3 className="text-2xl font-bold text-white">
                            {posts.reduce((acc: number, p: SocialPost) => acc + (p.comments || 0), 0).toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                        <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Shares</p>
                        <h3 className="text-2xl font-bold text-white">
                            {posts.reduce((acc: number, p: SocialPost) => acc + (p.shares || 0), 0).toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                        <MousePointerClick className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Link Clicks</p>
                        <h3 className="text-2xl font-bold text-white">
                            {posts.reduce((acc: number, p: SocialPost) => acc + (p.clicks || 0), 0).toLocaleString()}
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
                data={posts.filter((t: SocialPost) => t.content?.toLowerCase().includes(searchTerm.toLowerCase()))}
                onRowClick={handleRowClick}
                keyExtractor={(t: SocialPost) => t.id.toString()}
                columns={[
                    { key: 'content', label: 'Message', render: (t: SocialPost) => <span className="font-medium truncate max-w-sm block" title={t.content || ''}>{t.content || '(Empty)'}</span> },
                    {
                        key: 'platforms', label: 'Platforms', render: (t: SocialPost) => (
                            <div className="flex gap-2 text-white/40">
                                {t.postFacebook && <Facebook className="w-4 h-4 text-blue-500" />}
                                {t.postTwitter && <Twitter className="w-4 h-4 text-sky-400" />}
                                {t.postLinkedin && <Linkedin className="w-4 h-4 text-blue-700" />}
                            </div>
                        )
                    },
                    { key: 'engagement', label: 'Engagement', render: (t: SocialPost) => t.likes + t.comments + t.shares },
                    {
                        key: 'state', label: 'Status', render: (t: SocialPost) => (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                            ${t.state === 'draft' ? 'bg-white/10 text-white/60' :
                                    t.state === 'scheduled' ? 'bg-yellow-500/20 text-yellow-500' :
                                        'bg-green-500/20 text-green-400'}
                        `}>
                                {t.state}
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
                        {formData.state === 'draft' && <button onClick={() => handleAction('scheduled')} className="bg-primary-purple hover:bg-primary-purple/80 text-white px-4 py-1.5 rounded text-sm transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] shadow-primary-purple/20">Schedule Options</button>}
                        {formData.state === 'draft' && <button onClick={() => handleAction('posted')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Post Now</button>}
                        {formData.state === 'scheduled' && <button onClick={() => handleAction('draft')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-sm transition-colors">Cancel Schedule</button>}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold text-white mb-2">{activeRecord ? 'Edit Post' : 'New Social Post'}</h1>
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary-purple" />
                            Message Content
                        </h3>
                        <textarea
                            className="w-full h-48 bg-black/20 border border-white/10 rounded-md px-4 py-3 text-white text-base outline-none focus:border-primary-purple transition-all resize-none"
                            placeholder="What's on your mind?"
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            disabled={formData.state !== 'draft'}
                        />
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-blue-400" />
                            Target Platforms
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="accent-primary-purple w-4 h-4" checked={formData.postFacebook} onChange={(e) => setFormData({ ...formData, postFacebook: e.target.checked })} disabled={formData.state !== 'draft'} />
                                <div className="flex items-center gap-2 flex-1"><Facebook className="w-4 h-4 text-blue-500" /><span className="text-white text-sm">Facebook</span></div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="accent-primary-purple w-4 h-4" checked={formData.postTwitter} onChange={(e) => setFormData({ ...formData, postTwitter: e.target.checked })} disabled={formData.state !== 'draft'} />
                                <div className="flex items-center gap-2 flex-1"><Twitter className="w-4 h-4 text-sky-400" /><span className="text-white text-sm">X (Twitter)</span></div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="accent-primary-purple w-4 h-4" checked={formData.postLinkedin} onChange={(e) => setFormData({ ...formData, postLinkedin: e.target.checked })} disabled={formData.state !== 'draft'} />
                                <div className="flex items-center gap-2 flex-1"><Linkedin className="w-4 h-4 text-blue-700" /><span className="text-white text-sm">LinkedIn</span></div>
                            </label>
                        </div>
                    </div>
                    {formData.state === 'posted' && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-green-400" />
                                Engagement
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-white/60">Likes</span>
                                    <span className="text-white font-bold">{formData.likes || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-white/60">Comments</span>
                                    <span className="text-white font-bold">{formData.comments || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-white/60">Shares</span>
                                    <span className="text-white font-bold">{formData.shares || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-2">
                                    <span className="text-white/60">Clicks</span>
                                    <span className="text-white font-bold">{formData.clicks || 0}</span>
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
            title="Social Marketing"
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
