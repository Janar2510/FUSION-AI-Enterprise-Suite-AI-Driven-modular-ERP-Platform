import { create } from 'zustand';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface PlanningSlot {
    id: number;
    role: string | null;
    hours: number;
    startDate: string;
    endDate: string;
    note: string | null;
    state: string;
    employeeId: number | null;
    projectId: number | null;
    isRecurring: boolean;
    recurrenceRule: string | null;
    employee?: {
        id: number;
        name: string;
        skills?: { skill: { name: string } }[]
    } | null;
    project?: { id: number; name: string } | null;
}

export interface ResourceRecommendation {
    employee: {
        id: number;
        name: string;
        skills: { skill: { name: string } }[];
    };
    matchScore: number;
}

interface PlanningStore {
    items: PlanningSlot[];
    recommendations: ResourceRecommendation[];
    loading: boolean;
    conflict: any | null;
    total: number;
    fetch: () => Promise<void>;
    fetchRecommendations: (skillIds: number[], start: string, end: string) => Promise<void>;
    create: (data: Partial<PlanningSlot>) => Promise<boolean>;
    update: (id: number, data: Partial<PlanningSlot>) => Promise<boolean>;
    remove: (id: number) => Promise<void>;
    publishSlots: (slotIds?: number[], notify?: boolean) => Promise<number>;
}

export const usePlanningStore = create<PlanningStore>((set, get) => ({
    items: [],
    recommendations: [],
    loading: false,
    conflict: null,
    total: 0,

    fetch: async () => {
        set({ loading: true });
        try {
            const { data } = await axios.get(`${API}/api/planning`);
            set({ items: data.data, total: data.total });
        } finally {
            set({ loading: false });
        }
    },

    fetchRecommendations: async (skillIds, start, end) => {
        try {
            const res = await axios.get(`${API}/api/planning/recommendations`, {
                params: { skillIds: skillIds.join(','), startDate: start, endDate: end }
            });
            set({ recommendations: res.data });
        } catch (err) {
            console.error(err);
        }
    },

    create: async (d) => {
        set({ conflict: null });
        try {
            await axios.post(`${API}/api/planning`, d);
            await get().fetch();
            return true;
        } catch (err: any) {
            if (err.response?.status === 409) {
                set({ conflict: err.response.data.conflicts });
            }
            return false;
        }
    },

    update: async (id, d) => {
        set({ conflict: null });
        try {
            await axios.put(`${API}/api/planning/${id}`, d);
            await get().fetch();
            return true;
        } catch (err: any) {
            if (err.response?.status === 409) {
                set({ conflict: err.response.data.conflicts });
            }
            return false;
        }
    },

    remove: async (id) => {
        await axios.delete(`${API}/api/planning/${id}`);
        await get().fetch();
    },

    publishSlots: async (slotIds?, notify = false) => {
        try {
            const res = await axios.patch(`${API}/api/planning/publish`, { slotIds, notify });
            await get().fetch();
            return res.data.updated ?? 0;
        } catch (err) {
            console.error(err);
            return 0;
        }
    },
}));
