import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface KnowledgeWorkspace {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    _count?: { articles: number };
}

export interface KnowledgeArticleRevision {
    id: number;
    articleId: number;
    content: string;
    reason: string | null;
    createdAt: string;
}

export interface KnowledgeArticle {
    id: number;
    title: string;
    body: string | null;
    category: string | null;
    isPublished: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    workspaceId: number | null;
    parentId?: number | null;
    workspace?: KnowledgeWorkspace;
    parent?: { id: number; title: string } | null;
    children?: { id: number; title: string; isPublished: boolean }[];
    revisions?: KnowledgeArticleRevision[];
    _count?: { children: number };
}

interface KnowledgeStore {
    articles: KnowledgeArticle[];
    workspaces: KnowledgeWorkspace[];
    currentArticle: KnowledgeArticle | null;
    loading: boolean;
    error: string | null;

    fetchArticles: (parentId?: number | null, topLevel?: boolean) => Promise<void>;
    fetchWorkspaces: () => Promise<void>;
    fetchArticleDetails: (id: number) => Promise<void>;
    createArticle: (data: Partial<KnowledgeArticle>) => Promise<KnowledgeArticle | undefined>;
    updateArticle: (id: number, data: Partial<KnowledgeArticle>) => Promise<void>;
    deleteArticle: (id: number) => Promise<void>;
    createWorkspace: (data: Partial<KnowledgeWorkspace>) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
    articles: [],
    workspaces: [],
    currentArticle: null,
    loading: false,
    error: null,

    fetchArticles: async (parentId?: number | null, topLevel?: boolean) => {
        try {
            set({ loading: true, error: null });
            const params: Record<string, string> = { limit: '1000' };
            if (topLevel) params.topLevel = 'true';
            else if (parentId !== undefined && parentId !== null) params.parentId = String(parentId);
            const res = await axios.get(`${API_BASE}/api/knowledge`, { params });
            set({ articles: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchWorkspaces: async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/knowledge/workspaces`);
            set({ workspaces: res.data });
        } catch (err: any) {
            console.error(err);
        }
    },

    fetchArticleDetails: async (id) => {
        try {
            set({ loading: true });
            const res = await axios.get(`${API_BASE}/api/knowledge/${id}`);
            set({ currentArticle: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ loading: false });
        }
    },

    createArticle: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/knowledge`, data);
            await get().fetchArticles();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateArticle: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/knowledge/${id}`, data);
            await get().fetchArticles();
            if (get().currentArticle?.id === id) {
                await get().fetchArticleDetails(id);
            }
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deleteArticle: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/knowledge/${id}`);
            await get().fetchArticles();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createWorkspace: async (data) => {
        try {
            await axios.post(`${API_BASE}/api/knowledge/workspaces`, data);
            await get().fetchWorkspaces();
        } catch (err: any) {
            console.error(err);
        }
    }
}));

export default useKnowledgeStore;
