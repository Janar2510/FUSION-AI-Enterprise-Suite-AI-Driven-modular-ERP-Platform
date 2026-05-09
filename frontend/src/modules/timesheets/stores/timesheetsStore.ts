import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface TimesheetEntry {
    id: number;
    name: string;
    date: string;
    unitAmount: number; // Hours
    isBillable: boolean;
    billedAmount: number;
    employeeId?: number | null;
    employee?: { id: number; name: string };
    projectId: number;
    project?: { id: number; name: string };
    taskId?: number | null;
    task?: { id: number; name: string };
}

interface TimesheetsStore {
    timesheets: TimesheetEntry[];
    loading: boolean;
    error: string | null;

    fetchTimesheets: () => Promise<void>;
    createTimesheet: (data: Partial<TimesheetEntry>) => Promise<TimesheetEntry | undefined>;
    updateTimesheet: (id: number, data: Partial<TimesheetEntry>) => Promise<void>;
    deleteTimesheet: (id: number) => Promise<void>;
}

export const useTimesheetsStore = create<TimesheetsStore>((set, get) => ({
    timesheets: [],
    loading: false,
    error: null,

    fetchTimesheets: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/hr/timesheets?limit=1000`);
            if (res.data && res.data.data) {
                set({ timesheets: res.data.data, loading: false });
            } else if (Array.isArray(res.data)) {
                set({ timesheets: res.data, loading: false });
            }
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createTimesheet: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/hr/timesheets`, data);
            await get().fetchTimesheets();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateTimesheet: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/hr/timesheets/${id}`, data);
            await get().fetchTimesheets();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deleteTimesheet: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/hr/timesheets/${id}`);
            await get().fetchTimesheets();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useTimesheetsStore;
