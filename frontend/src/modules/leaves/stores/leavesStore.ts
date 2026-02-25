import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrLeave {
    id: number;
    name: string | null;
    state: string; // draft, confirm, validate, refuse
    leaveType: string; // legal, sick, compensatory, unpaid
    dateFrom: string;
    dateTo: string;
    numberOfDays: number;
    notes: string | null;
    employeeId: number;
    employee?: { id: number; name: string };
    createdAt: string;
}

interface LeavesStore {
    leaves: HrLeave[];
    total: number;
    loading: boolean;
    error: string | null;

    fetchLeaves: () => Promise<void>;
    createLeave: (data: Partial<HrLeave>) => Promise<HrLeave | undefined>;
    updateLeave: (id: number, data: Partial<HrLeave>) => Promise<void>;
    deleteLeave: (id: number) => Promise<void>;
    approveLeave: (id: number) => Promise<void>;
    refuseLeave: (id: number) => Promise<void>;
}

export const useLeavesStore = create<LeavesStore>((set, get) => ({
    leaves: [],
    total: 0,
    loading: false,
    error: null,

    fetchLeaves: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/hr/leaves?limit=200`);
            const payload = res.data;
            set({ leaves: payload.data || payload, total: payload.total || (payload.data || payload).length, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createLeave: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/hr/leaves`, data);
            await get().fetchLeaves();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateLeave: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/hr/leaves/${id}`, data);
            await get().fetchLeaves();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deleteLeave: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/hr/leaves/${id}`);
            await get().fetchLeaves();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    approveLeave: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.patch(`${API_BASE}/api/hr/leaves/${id}/approve`);
            await get().fetchLeaves();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    refuseLeave: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.patch(`${API_BASE}/api/hr/leaves/${id}/refuse`);
            await get().fetchLeaves();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useLeavesStore;
