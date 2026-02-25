import { create } from 'zustand';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface QualityPoint {
    id: number;
    name: string;
    testType: string;
    productId?: number;
    teamId?: string;
    notes?: string;
    createdAt: string;
    product?: { id: number; name: string };
}

export interface QualityCheck {
    id: number;
    name: string;
    state: string; // none, pass, fail
    testType: string;
    measureValue?: number;
    notes?: string;
    picture?: string;
    pointId?: number;
    productId?: number;
    productionId?: number;
    pickingId?: number;
    createdAt: string;
    point?: QualityPoint;
    product?: { id: number; name: string };
    production?: { id: number; name: string };
    picking?: { id: number; name: string };
}

interface QualityStore {
    points: QualityPoint[];
    checks: QualityCheck[];
    loading: boolean;
    error: string | null;

    fetchPoints: () => Promise<void>;
    createPoint: (d: Partial<QualityPoint>) => Promise<QualityPoint | undefined>;
    updatePoint: (id: number, d: Partial<QualityPoint>) => Promise<QualityPoint | undefined>;
    deletePoint: (id: number) => Promise<void>;

    fetchChecks: () => Promise<void>;
    createCheck: (d: Partial<QualityCheck>) => Promise<QualityCheck | undefined>;
    updateCheck: (id: number, d: Partial<QualityCheck>) => Promise<QualityCheck | undefined>;
    deleteCheck: (id: number) => Promise<void>;
}

export const useQualityStore = create<QualityStore>((set, get) => ({
    points: [],
    checks: [],
    loading: false,
    error: null,

    fetchPoints: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API}/api/quality/points?limit=200`);
            set({ points: res.data.data || res.data, loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },
    createPoint: async (d) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API}/api/quality/points`, d);
            set(state => ({ points: [res.data, ...state.points], loading: false }));
            return res.data;
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },
    updatePoint: async (id, d) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.put(`${API}/api/quality/points/${id}`, d);
            set(state => ({ points: state.points.map(p => p.id === id ? res.data : p), loading: false }));
            return res.data;
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },
    deletePoint: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API}/api/quality/points/${id}`);
            set(state => ({ points: state.points.filter(p => p.id !== id), loading: false }));
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    fetchChecks: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API}/api/quality/checks?limit=200`);
            set({ checks: res.data.data || res.data, loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },
    createCheck: async (d) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API}/api/quality/checks`, d);
            set(state => ({ checks: [res.data, ...state.checks], loading: false }));
            return res.data;
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },
    updateCheck: async (id, d) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.put(`${API}/api/quality/checks/${id}`, d);
            set(state => ({ checks: state.checks.map(c => c.id === id ? res.data : c), loading: false }));
            return res.data;
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },
    deleteCheck: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API}/api/quality/checks/${id}`);
            set(state => ({ checks: state.checks.filter(c => c.id !== id), loading: false }));
        } catch (e: any) { set({ error: e.message, loading: false }); }
    }
}));
