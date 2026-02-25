import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface WebsitePage {
    id: number;
    name: string;
    url: string;
    content: string | null;
    isPublished: boolean;
    viewCount: number;
    seoTitle: string | null;
    seoDescription: string | null;
}

interface WebsiteStore {
    pages: WebsitePage[];
    loading: boolean;
    error: string | null;

    fetchPages: () => Promise<void>;
    createPage: (data: Partial<WebsitePage>) => Promise<WebsitePage | undefined>;
    updatePage: (id: number, data: Partial<WebsitePage>) => Promise<void>;
    deletePage: (id: number) => Promise<void>;
}

export const useWebsiteStore = create<WebsiteStore>((set, get) => ({
    pages: [],
    loading: false,
    error: null,

    fetchPages: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/marketing-web/pages?limit=1000`);
            set({ pages: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createPage: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/marketing-web/pages`, data);
            await get().fetchPages();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updatePage: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/marketing-web/pages/${id}`, data);
            await get().fetchPages();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deletePage: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/marketing-web/pages/${id}`);
            await get().fetchPages();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useWebsiteStore;
