import { create } from 'zustand';
import { fieldServiceApi } from '@/lib/api';

export interface FsTask {
    id: number;
    name: string;
    description: string | null;
    state: string; // new, planned, done, cancelled
    priority: number;
    scheduledDate: string | null;
    dateDeadline: string | null;
    partnerId: number | null;
    partner?: { id: number; name: string };
    employeeId: number | null;
    employee?: { id: number; name: string };
    street: string | null;
    city: string | null;
    zip: string | null;
}

interface FieldServiceStore {
    tasks: FsTask[];
    loading: boolean;
    error: string | null;

    fetchTasks: () => Promise<void>;
    createTask: (data: Partial<FsTask>) => Promise<FsTask | undefined>;
    updateTask: (id: number, data: Partial<FsTask>) => Promise<void>;
}

export const useFieldServiceStore = create<FieldServiceStore>((set, get) => ({
    tasks: [],
    loading: false,
    error: null,

    fetchTasks: async () => {
        try {
            set({ loading: true, error: null });
            const res = await fieldServiceApi.listTasks({ limit: 1000 });
            set({ tasks: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createTask: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await fieldServiceApi.createTask(data);
            await get().fetchTasks();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateTask: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await fieldServiceApi.updateTask(id, data);
            await get().fetchTasks();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useFieldServiceStore;
