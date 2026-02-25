import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface MassMailing {
    id: number;
    subject: string;
    bodyHtml: string | null;
    state: string; // draft, in_queue, sending, done
    sentDate: string | null;
    scheduledDate: string | null;
    sentCount: number;
    openedCount: number;
    clickedCount: number;
    bouncedCount: number;
}

interface EmailStore {
    mailings: MassMailing[];
    loading: boolean;
    error: string | null;

    fetchMailings: () => Promise<void>;
    createMailing: (data: Partial<MassMailing>) => Promise<MassMailing | undefined>;
    updateMailing: (id: number, data: Partial<MassMailing>) => Promise<void>;
    deleteMailing: (id: number) => Promise<void>;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
    mailings: [],
    loading: false,
    error: null,

    fetchMailings: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/marketing-web/mailings?limit=1000`);
            set({ mailings: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createMailing: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/marketing-web/mailings`, data);
            await get().fetchMailings();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateMailing: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/marketing-web/mailings/${id}`, data);
            await get().fetchMailings();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deleteMailing: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/marketing-web/mailings/${id}`);
            await get().fetchMailings();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useEmailStore;
