import { create } from 'zustand';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface MrpEco {
    id: number;
    name: string;
    stage: string;
    type: string;
    description: string | null;
    effectivity: string | null;
    effectivityDate: string | null;
    approvalState: string;
    createdAt: string;
    productId?: number;
    bomId?: number;
    product?: { id: number; name: string };
    bom?: { id: number; name: string; code?: string; lines?: any[] };
}

interface PlmStore {
    ecos: MrpEco[];
    loading: boolean;
    error: string | null;
    fetch: () => Promise<void>;
    create: (d: Partial<MrpEco>) => Promise<MrpEco | undefined>;
    update: (id: number, d: Partial<MrpEco>) => Promise<MrpEco | undefined>;
    remove: (id: number) => Promise<void>;
}

export const usePlmStore = create<PlmStore>((set, get) => ({
    ecos: [],
    loading: false,
    error: null,

    fetch: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API}/api/plm?limit=200`);
            set({ ecos: res.data.data || res.data, loading: false });
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },
    create: async (d) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API}/api/plm`, d);
            set(state => ({ ecos: [res.data, ...state.ecos], loading: false }));
            return res.data;
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },
    update: async (id, d) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.put(`${API}/api/plm/${id}`, d);
            set(state => ({
                ecos: state.ecos.map(e => e.id === id ? res.data : e),
                loading: false
            }));
            return res.data;
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },
    remove: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API}/api/plm/${id}`);
            set(state => ({ ecos: state.ecos.filter(e => e.id !== id), loading: false }));
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    }
}));
