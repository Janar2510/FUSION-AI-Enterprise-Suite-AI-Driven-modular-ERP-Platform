import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface SocialPost {
    id: number;
    content: string;
    state: string; // draft, scheduled, posted
    scheduledDate: string | null;
    publishedDate: string | null;
    postFacebook: boolean;
    postTwitter: boolean;
    postLinkedin: boolean;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
}

interface SocialStore {
    posts: SocialPost[];
    loading: boolean;
    error: string | null;

    fetchPosts: () => Promise<void>;
    createPost: (data: Partial<SocialPost>) => Promise<SocialPost | undefined>;
    updatePost: (id: number, data: Partial<SocialPost>) => Promise<void>;
    deletePost: (id: number) => Promise<void>;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
    posts: [],
    loading: false,
    error: null,

    fetchPosts: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/marketing-web/social?limit=1000`);
            set({ posts: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createPost: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/marketing-web/social`, data);
            await get().fetchPosts();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updatePost: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/marketing-web/social/${id}`, data);
            await get().fetchPosts();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deletePost: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/marketing-web/social/${id}`);
            await get().fetchPosts();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useSocialStore;
