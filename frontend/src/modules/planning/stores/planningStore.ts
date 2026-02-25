import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface PlanningSlot {
    id: number; role: string | null; hours: number; startDate: string; endDate: string;
    note: string | null; state: string; employeeId: number | null; projectId: number | null;
    employee?: { id: number; name: string } | null;
    project?: { id: number; name: string } | null;
}

interface PlanningStore {
    items: PlanningSlot[]; loading: boolean; total: number;
    fetch: () => Promise<void>;
    create: (data: Partial<PlanningSlot>) => Promise<void>;
    update: (id: number, data: Partial<PlanningSlot>) => Promise<void>;
    remove: (id: number) => Promise<void>;
}

export const usePlanningStore = create<PlanningStore>((set, get) => ({
    items: [], loading: false, total: 0,
    fetch: async () => { set({ loading: true }); try { const { data } = await axios.get(`${API}/api/planning`); set({ items: data.data, total: data.total }); } finally { set({ loading: false }); } },
    create: async (d) => { await axios.post(`${API}/api/planning`, d); get().fetch(); },
    update: async (id, d) => { await axios.put(`${API}/api/planning/${id}`, d); get().fetch(); },
    remove: async (id) => { await axios.delete(`${API}/api/planning/${id}`); get().fetch(); },
}));
