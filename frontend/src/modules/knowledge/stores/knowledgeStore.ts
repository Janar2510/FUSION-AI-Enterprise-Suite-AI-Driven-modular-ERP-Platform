import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface KnowledgeArticle {
    id: number;
    title: string;
    body: string | null;
    category: string | null;
    isPublished: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

interface KnowledgeStore {
    articles: KnowledgeArticle[];
    loading: boolean;
    error: string | null;

    fetchArticles: () => Promise<void>;
    createArticle: (data: Partial<KnowledgeArticle>) => Promise<KnowledgeArticle | undefined>;
    updateArticle: (id: number, data: Partial<KnowledgeArticle>) => Promise<void>;
    deleteArticle: (id: number) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
    articles: [],
    loading: false,
    error: null,

    fetchArticles: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/knowledge?limit=1000`);
            set({ articles: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
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
    }
}));

export default useKnowledgeStore;
