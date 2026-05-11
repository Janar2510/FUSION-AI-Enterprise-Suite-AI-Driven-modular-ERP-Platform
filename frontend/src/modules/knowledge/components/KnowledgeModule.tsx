import React, { useEffect, useState, lazy, Suspense } from 'react';
import axios from 'axios';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useKnowledgeStore, KnowledgeArticle } from '../stores/knowledgeStore';
import { Eye, Plus, Sparkles, History, ChevronRight, Layers, Database, BarChart3, Info, FileText, FolderOpen, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy-load ReactQuill to avoid SSR issues and reduce initial bundle
const ReactQuill = lazy(() => import('react-quill'));

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

const GRAFT_METRICS = [
    { label: 'CRM_LEAD_CONVERSION', value: '24.8%', icon: BarChart3, color: 'text-blue-400' },
    { label: 'RESOURCE_UTILIZATION', value: '78.2%', icon: Layers, color: 'text-amber-400' },
    { label: 'PROJECT_ON_TIME_RATE', value: '92.4%', icon: Sparkles, color: 'text-green-400' },
];

// Minimal Quill styling injected once into the document
const QUILL_STYLE = `
.ql-container { font-family: inherit; border: none !important; }
.ql-editor { min-height: 500px; color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.8; padding: 2rem 2.5rem; }
.ql-editor.ql-blank::before { color: rgba(255,255,255,0.1); font-style: normal; }
.ql-toolbar { border: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; padding: 0.75rem 1rem; }
.ql-toolbar button, .ql-toolbar .ql-picker { color: rgba(255,255,255,0.5) !important; }
.ql-toolbar button:hover, .ql-toolbar button.ql-active { color: white !important; }
.ql-toolbar .ql-stroke { stroke: rgba(255,255,255,0.5) !important; }
.ql-toolbar button:hover .ql-stroke, .ql-toolbar button.ql-active .ql-stroke { stroke: white !important; }
.ql-toolbar .ql-fill { fill: rgba(255,255,255,0.5) !important; }
.ql-toolbar button:hover .ql-fill, .ql-toolbar button.ql-active .ql-fill { fill: white !important; }
.ql-editor h1, .ql-editor h2, .ql-editor h3 { color: white; }
.ql-editor a { color: rgb(168,85,247); }
.ql-editor blockquote { border-left: 4px solid rgba(245,158,11,0.4); color: rgba(255,255,255,0.5); }
`;

const quillModules = {
    toolbar: [
        [{ heading: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
    ],
};

export const KnowledgeModule: React.FC = () => {
    const {
        articles,
        workspaces,
        currentArticle,
        fetchArticles,
        fetchWorkspaces,
        fetchArticleDetails,
        createArticle,
        updateArticle,
        createWorkspace
    } = useKnowledgeStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [isDraftingWithAI, setIsDraftingWithAI] = useState(false);
    const [aiDraftPreview, setAiDraftPreview] = useState<{ title: string; body: string; summary: string } | null>(null);
    const [showDraftPreview, setShowDraftPreview] = useState(false);

    const [activeRecord, setActiveRecord] = useState<KnowledgeArticle | null>(null);
    const [formData, setFormData] = useState<Partial<KnowledgeArticle>>({
        isPublished: true,
        workspaceId: null
    });

    // Breadcrumb stack for nesting navigation: array of { id, title }
    const [breadcrumb, setBreadcrumb] = useState<{ id: number; title: string }[]>([]);

    // Inject Quill CSS once
    useEffect(() => {
        if (document.getElementById('quill-dark-style')) return;
        const style = document.createElement('style');
        style.id = 'quill-dark-style';
        style.textContent = QUILL_STYLE;
        document.head.appendChild(style);
    }, []);

    useEffect(() => {
        fetchArticles();
        fetchWorkspaces();
    }, []);

    const handleNew = (parentId?: number) => {
        setActiveRecord(null);
        setFormData({
            isPublished: false,
            title: 'New Article',
            workspaceId: selectedWorkspaceId,
            parentId: parentId ?? null,
        });
        setCurrentView('form');
    };

    const handleRowClick = async (record: KnowledgeArticle) => {
        setActiveRecord(record);
        setFormData(record);
        await fetchArticleDetails(record.id);
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

    const handleGenerateAI = async () => {
        if (!formData.title) return;
        setIsAIGenerating(true);
        try {
            const res = await axios.post(`${API_BASE}/api/knowledge/ai/generate`, {
                title: formData.title,
                category: formData.category,
                existingBody: formData.body || undefined,
            });
            setFormData(prev => ({ ...prev, body: res.data.body }));
        } catch (err: any) {
            console.error('AI generation failed', err);
        } finally {
            setIsAIGenerating(false);
        }
    };

    const handleDraftWithAI = async () => {
        if (!formData.title) return;
        setIsDraftingWithAI(true);
        try {
            const res = await axios.post(`${API_BASE}/api/ai/run`, {
                agentKey: 'knowledge-article-draft',
                entityType: 'knowledge_article',
                entityId: String(activeRecord?.id ?? 'new'),
                input: { topic: formData.title },
            });
            setAiDraftPreview(res.data.output ?? res.data);
            setShowDraftPreview(true);
        } catch (err: any) {
            console.error('AI draft failed', err);
        } finally {
            setIsDraftingWithAI(false);
        }
    };

    const handleApplyDraft = () => {
        if (!aiDraftPreview) return;
        setFormData(prev => ({ ...prev, title: aiDraftPreview.title, body: aiDraftPreview.body }));
        setShowDraftPreview(false);
        setAiDraftPreview(null);
    };

    const handleGraftMetric = (metric: typeof GRAFT_METRICS[0]) => {
        const graftString = `\n<blockquote><strong>GRAFTED_METRIC: ${metric.label}</strong><br/>Value: ${metric.value}<br/>Timestamp: ${new Date().toLocaleString()}</blockquote>`;
        setFormData(prev => ({ ...prev, body: (prev.body || '') + graftString }));
    };

    const handleDrillDown = async (child: { id: number; title: string }) => {
        // Navigate into a child article
        if (activeRecord) {
            setBreadcrumb(prev => [...prev, { id: activeRecord.id, title: activeRecord.title }]);
        }
        const res = await axios.get(`${API_BASE}/api/knowledge/${child.id}`);
        const article = res.data;
        setActiveRecord(article);
        setFormData(article);
        await fetchArticleDetails(article.id);
    };

    const handleBreadcrumbNavigate = async (idx: number) => {
        const target = breadcrumb[idx];
        const newCrumb = breadcrumb.slice(0, idx);
        setBreadcrumb(newCrumb);
        const res = await axios.get(`${API_BASE}/api/knowledge/${target.id}`);
        const article = res.data;
        setActiveRecord(article);
        setFormData(article);
        await fetchArticleDetails(article.id);
    };

    const filteredArticles = articles.filter(a => {
        const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWorkspace = selectedWorkspaceId ? a.workspaceId === selectedWorkspaceId : true;
        return matchesSearch && matchesWorkspace;
    });

    const renderWorkspaceSidebar = () => (
        <div className="w-64 flex flex-col gap-2 pr-6 border-r border-white/10 h-full">
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[3px] mb-4">Workspaces</h3>
            <button
                onClick={() => setSelectedWorkspaceId(null)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${!selectedWorkspaceId ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
                <Layers className="w-4 h-4" />
                <span>All Documents</span>
            </button>
            {workspaces.map(ws => (
                <button
                    key={ws.id}
                    onClick={() => setSelectedWorkspaceId(ws.id)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${selectedWorkspaceId === ws.id ? 'bg-white/10 text-white border border-white/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: ws.color || '#fff' }}></div>
                        <span>{ws.name}</span>
                    </div>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40 font-bold">{ws._count?.articles || 0}</span>
                </button>
            ))}
            <button
                onClick={() => createWorkspace({ name: 'New Workspace', color: '#f59e0b' })}
                className="flex items-center gap-3 px-3 py-2.5 mt-4 rounded-xl text-white/40 hover:text-white hover:bg-white/5 text-xs border border-dashed border-white/10 transition-all font-medium"
            >
                <Plus className="w-3 h-3" />
                <span>Create Namespace</span>
            </button>
        </div>
    );

    const renderDashboard = () => (
        <div className="flex h-full min-h-[600px] pt-4">
            {renderWorkspaceSidebar()}
            <div className="flex-1 pl-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredArticles.slice(0, 3).map(article => (
                        <motion.div
                            key={article.id}
                            whileHover={{ y: -4, scale: 1.02 }}
                            onClick={() => handleRowClick(article)}
                            className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary-500/40 hover:bg-white/[0.08] transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-5 h-5 text-primary-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-3 h-3 rounded-full ${article.isPublished ? 'bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]'}`}></div>
                                <span className="text-[10px] text-white/40 font-black uppercase tracking-[2px]">{article.workspace?.name || 'GENERIC_BUFFER'}</span>
                                {(article._count?.children ?? 0) > 0 && (
                                    <span className="ml-auto text-[9px] bg-amber-500/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">
                                        {article._count?.children} sub
                                    </span>
                                )}
                            </div>
                            <h4 className="text-white font-black text-xl mb-3 tracking-tight group-hover:text-primary-500 transition-colors leading-tight">{article.title}</h4>
                            <p className="text-white/40 text-[13px] line-clamp-3 leading-relaxed font-medium">{article.body?.replace(/<[^>]+>/g, '') || 'Memory core empty. Documentation required for synchronization.'}</p>
                            <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                                <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.viewCount}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
                    <OdooListBase
                        data={filteredArticles}
                        onRowClick={handleRowClick}
                        keyExtractor={(t) => t.id.toString()}
                        columns={[
                            { key: 'title', label: 'Article Title', render: (t) => <span className="font-bold text-white/90">{t.title}</span> },
                            { key: 'workspace', label: 'Namespace', render: (t) => <span className="text-white/40 font-mono text-xs">{t.workspace?.name || 'ROOT'}</span> },
                            { key: 'children', label: 'Sub-articles', render: (t) => <span className="text-amber-400 font-bold">{t._count?.children || 0}</span> },
                            { key: 'views', label: 'Engagement', render: (t) => <span className="text-primary-500 font-bold">{t.viewCount.toLocaleString()}</span> },
                            { key: 'updated', label: 'Sync_Time', render: (t) => <span className="text-white/30 text-xs">{new Date(t.updatedAt).toLocaleDateString()}</span> },
                            {
                                key: 'state', label: 'Protocol', render: (t) => (
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                                    ${t.isPublished ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'}
                                `}>
                                        {t.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                )
                            },
                        ]}
                    />
                </div>
            </div>
        </div>
    );

    const renderForm = () => {
        const detailedArticle = currentArticle?.id === activeRecord?.id ? currentArticle : null;
        const children = detailedArticle?.children ?? [];
        const parentInfo = detailedArticle?.parent ?? null;

        return (
            <OdooFormBase
                statusRibbon={
                    <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex gap-4">
                            {/* Breadcrumb navigation */}
                            {breadcrumb.length > 0 && (
                                <div className="flex items-center gap-2 mr-4">
                                    <button
                                        onClick={() => handleBreadcrumbNavigate(breadcrumb.length - 1)}
                                        className="flex items-center gap-1 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                        {breadcrumb[breadcrumb.length - 1].title}
                                    </button>
                                    <ChevronRight className="w-3 h-3 text-white/20" />
                                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{formData.title}</span>
                                </div>
                            )}
                            {formData.isPublished ? (
                                <button onClick={() => handleAction(false)} className="bg-white/5 hover:bg-white/10 text-white/60 px-6 py-2 rounded-none text-[10px] font-black transition-all border border-white/10 uppercase tracking-[3px]">Decommission</button>
                            ) : (
                                <button onClick={() => handleAction(true)} className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded-none text-[10px] font-black transition-all uppercase tracking-[3px] shadow-[0_0_25px_rgba(34,197,94,0.3)]">Establish Article</button>
                            )}
                            <button
                                onClick={handleDraftWithAI}
                                disabled={isDraftingWithAI || !formData.title}
                                className={`flex items-center gap-3 px-8 py-2 rounded-none text-[10px] font-black transition-all uppercase tracking-[3px] ${isDraftingWithAI ? 'bg-secondary-500/20 text-white/40 cursor-not-allowed border border-white/5' : 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)]'}`}
                            >
                                {isDraftingWithAI ? (
                                    <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 animate-spin" /> Processing...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Draft with AI</span>
                                )}
                            </button>
                            <button
                                onClick={handleGenerateAI}
                                disabled={isAIGenerating || !formData.title}
                                className={`flex items-center gap-3 px-8 py-2 rounded-none text-[10px] font-black transition-all uppercase tracking-[3px] ${isAIGenerating ? 'bg-primary-500/20 text-white/40 cursor-not-allowed border border-white/5' : 'bg-primary-500 hover:bg-primary-500/80 text-white shadow-[0_0_25px_rgba(245,158,11,0.4)]'}`}
                            >
                                <Sparkles className={`w-3.5 h-3.5 ${isAIGenerating ? 'animate-spin' : ''}`} />
                                {isAIGenerating ? 'Processing...' : 'Neural Draft'}
                            </button>
                        </div>
                    </div>
                }
                headerContent={
                    <div className="flex flex-col gap-3 py-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-6 bg-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[5px]">Core_Intelligence.doc</span>
                            {parentInfo && (
                                <span className="ml-4 text-[9px] text-white/30 flex items-center gap-1 font-mono">
                                    <FolderOpen className="w-3 h-3" />
                                    Sub-article of: <span className="text-primary-500">{parentInfo.title}</span>
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            className="text-6xl font-black bg-transparent text-white border-b-2 border-transparent placeholder-white/5 outline-none focus:border-primary-500/30 transition-all w-full leading-none py-4 tracking-tighter"
                            placeholder="UNTITLED_PROTOCOL"
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                }
                leftPanels={
                    <div className="space-y-8">
                        {/* Rich text editor replacing textarea */}
                        <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.04] shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
                            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-white/5">
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[4px] flex items-center gap-4">
                                    <Database className="w-4 h-4 text-primary-500" />
                                    Documentation_Workspace.os
                                </h3>
                                <div className="flex gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/20"></div>
                                </div>
                            </div>
                            <Suspense fallback={<div className="h-[500px] flex items-center justify-center text-white/20 text-xs">Loading editor...</div>}>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.body || ''}
                                    onChange={(val) => setFormData(prev => ({ ...prev, body: val }))}
                                    modules={quillModules}
                                    placeholder="// Command: Enter strategic intelligence here..."
                                />
                            </Suspense>
                        </div>

                        {/* Sub-articles (children) list */}
                        {children.length > 0 && (
                            <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.04] shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[4px] flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-amber-400" />
                                        Sub-Articles ({children.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {children.map(child => (
                                        <button
                                            key={child.id}
                                            onClick={() => handleDrillDown(child)}
                                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${child.isPublished ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                                                <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{child.title}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary-500 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                                <div className="px-6 py-4 border-t border-white/5">
                                    <button
                                        onClick={() => handleNew(activeRecord?.id)}
                                        className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white transition-colors font-bold uppercase tracking-wider"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Sub-Article
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Add first sub-article prompt if no children yet */}
                        {activeRecord && children.length === 0 && (
                            <button
                                onClick={() => handleNew(activeRecord.id)}
                                className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-white/10 rounded-2xl text-white/30 hover:text-white/60 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-wider"
                            >
                                <Plus className="w-3 h-3" />
                                Add Sub-Article
                            </button>
                        )}
                    </div>
                }
                rightPanels={
                    <div className="space-y-8">
                        {activeRecord && (
                            <ChatterPanel ownerType="KnowledgeArticle" ownerId={activeRecord.id} showTimeline />
                        )}
                        {/* Knowledge Grafting Panel */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-8 flex items-center gap-4">
                                <div className="w-5 h-5 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <Plus className="w-3 h-3 text-green-400" />
                                </div>
                                Knowledge_Grafting
                            </h3>
                            <div className="space-y-4">
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-4">Live Module Metrics</p>
                                {GRAFT_METRICS.map(metric => (
                                    <button
                                        key={metric.label}
                                        onClick={() => handleGraftMetric(metric)}
                                        className="w-full group flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl hover:border-green-400/40 hover:bg-white/5 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-wider">{metric.label.replace(/_/g, ' ')}</p>
                                                <p className={`text-lg font-black ${metric.color}`}>{metric.value}</p>
                                            </div>
                                        </div>
                                        <Plus className="w-4 h-4 text-white/10 group-hover:text-green-400 transition-colors" />
                                    </button>
                                ))}
                            </div>
                            <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                                <p className="text-[10px] text-blue-300 font-medium leading-relaxed uppercase tracking-wider">
                                    Grafting embeds real-time analytics directly into the protocol body for live intelligence updates.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-8 flex items-center gap-4">
                                <div className="w-5 h-5 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                    <Layers className="w-3 h-3 text-amber-400" />
                                </div>
                                Core_Metadata
                            </h3>
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px]">Target_Namespace</label>
                                    <select
                                        className="w-full bg-black/50 border border-white/10 rounded-none px-5 py-4 text-white/80 text-xs font-black outline-none focus:border-primary-500/50 transition-all appearance-none cursor-pointer tracking-widest"
                                        value={formData.workspaceId || ''}
                                        onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value ? +e.target.value : null })}
                                    >
                                        <option value="">ROOT_DIRECTORY</option>
                                        {workspaces.map(ws => (
                                            <option key={ws.id} value={ws.id}>{ws.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px]">Neural_Category</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/50 border border-white/10 rounded-none px-5 py-4 text-white font-black text-xs outline-none focus:border-primary-500/50 transition-all tracking-[2px]"
                                        value={formData.category || ''}
                                        placeholder="E.g. SYSTEM_FLOW"
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                                {/* Parent article selector */}
                                <div className="space-y-3">
                                    <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px]">Parent_Article</label>
                                    <select
                                        className="w-full bg-black/50 border border-white/10 rounded-none px-5 py-4 text-white/80 text-xs font-black outline-none focus:border-primary-500/50 transition-all appearance-none cursor-pointer tracking-widest"
                                        value={formData.parentId || ''}
                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? +e.target.value : null })}
                                    >
                                        <option value="">TOP_LEVEL</option>
                                        {articles
                                            .filter(a => a.id !== activeRecord?.id)
                                            .map(a => (
                                                <option key={a.id} value={a.id}>{a.title}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {currentArticle?.revisions && currentArticle.revisions.length > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-8 flex items-center gap-4">
                                    <div className="w-5 h-5 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <History className="w-3 h-3 text-blue-400" />
                                    </div>
                                    Temporal_Log
                                </h3>
                                <div className="space-y-6">
                                    {currentArticle.revisions.map(rev => (
                                        <div key={rev.id} className="group flex flex-col gap-2 border-l-2 border-white/10 pl-6 py-2 hover:border-primary-500 transition-all cursor-pointer">
                                            <span className="text-[10px] text-white font-black uppercase tracking-widest leading-none">{rev.reason || 'LOG_UPDATE'}</span>
                                            <span className="text-[9px] text-white/30 font-mono italic">{new Date(rev.createdAt).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                }
            />
        );
    };

    return (
        <OdooViewManager
            title="Strategic Knowledge"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={() => handleNew()}
            onSave={handleSave}
            onDiscard={() => { setCurrentView('list'); setBreadcrumb([]); }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'form']}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentView}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    {(currentView === 'kanban' || currentView === 'list') && renderDashboard()}
                    {currentView === 'form' && renderForm()}
                </motion.div>
            </AnimatePresence>

            {/* AI Draft Preview Modal */}
            <AnimatePresence>
                {showDraftPreview && aiDraftPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowDraftPreview(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white/5 border border-white/20 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl backdrop-blur-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-secondary-500" />
                                    <h3 className="text-white font-black text-lg">AI Draft Preview</h3>
                                </div>
                                <button
                                    onClick={() => setShowDraftPreview(false)}
                                    className="text-white/40 hover:text-white text-xl leading-none"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Title</label>
                                    <div className="text-white font-black text-2xl">{aiDraftPreview.title}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Summary</label>
                                    <div className="text-white/60 text-sm">{aiDraftPreview.summary}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Body Preview</label>
                                    <div className="text-white/70 text-sm leading-relaxed max-h-60 overflow-y-auto border border-white/10 rounded-xl p-4 bg-black/20">
                                        {aiDraftPreview.body?.replace(/<[^>]+>/g, '') || 'No content generated.'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleApplyDraft}
                                    className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white font-black text-xs py-3 rounded-xl uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                                >
                                    Apply Draft
                                </button>
                                <button
                                    onClick={() => { setShowDraftPreview(false); setAiDraftPreview(null); }}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-black text-xs py-3 rounded-xl uppercase tracking-widest transition-colors border border-white/10"
                                >
                                    Discard
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </OdooViewManager>
    );
};

export default KnowledgeModule;
