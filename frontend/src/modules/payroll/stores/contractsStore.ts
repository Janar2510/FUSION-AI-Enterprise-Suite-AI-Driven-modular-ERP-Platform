import { create } from 'zustand';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrContract {
    id: number;
    name: string;
    state: string; // new, open, close, cancel
    contractType: string; // employee, worker, freelance
    dateStart: string;
    dateEnd: string | null;
    wage: number;
    trialDateEnd: string | null;
    notes: string | null;
    employeeId: number;
    employee?: { id: number; name: string };
    createdAt: string;
}

interface ContractsStore {
    contracts: HrContract[];
    total: number;
    loading: boolean;
    error: string | null;
    fetch: (employeeId?: number) => Promise<void>;
    create: (d: Partial<HrContract>) => Promise<HrContract | undefined>;
    update: (id: number, d: Partial<HrContract>) => Promise<void>;
    open: (id: number) => Promise<void>;
    close: (id: number) => Promise<void>;
    remove: (id: number) => Promise<void>;
}

export const useContractsStore = create<ContractsStore>((set, get) => ({
    contracts: [],
    total: 0,
    loading: false,
    error: null,

    fetch: async (employeeId) => {
        try {
            set({ loading: true, error: null });
            const url = employeeId
                ? `${API}/api/hr/contracts?employee_id=${employeeId}&limit=200`
                : `${API}/api/hr/contracts?limit=200`;
            const res = await axios.get(url);
            const p = res.data;
            set({ contracts: p.data || p, total: p.total || (p.data || p).length, loading: false });
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },

    create: async (d) => {
        try {
            set({ loading: true });
            const res = await axios.post(`${API}/api/hr/contracts`, d);
            await get().fetch();
            set({ loading: false });
            return res.data;
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },

    update: async (id, d) => {
        try {
            set({ loading: true });
            await axios.put(`${API}/api/hr/contracts/${id}`, d);
            await get().fetch();
            set({ loading: false });
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },

    open: async (id) => {
        try {
            await axios.patch(`${API}/api/hr/contracts/${id}/open`);
            await get().fetch();
        } catch (e: any) {
            set({ error: e.message });
        }
    },

    close: async (id) => {
        try {
            await axios.patch(`${API}/api/hr/contracts/${id}/close`);
            await get().fetch();
        } catch (e: any) {
            set({ error: e.message });
        }
    },

    remove: async (id) => {
        try {
            set({ loading: true });
            await axios.delete(`${API}/api/hr/contracts/${id}`);
            await get().fetch();
            set({ loading: false });
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },
}));
