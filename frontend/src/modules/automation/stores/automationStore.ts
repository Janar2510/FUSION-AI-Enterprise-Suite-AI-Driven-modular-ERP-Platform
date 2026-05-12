import { create } from 'zustand';
import { api } from '@/lib/api';
import { Workflow } from '../types';

function axiosMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const r = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        if (typeof r === 'string' && r.length) return r;
    }
    if (err instanceof Error) return err.message;
    return 'Request failed';
}

interface AutomationState {
    workflows: Workflow[];
    loading: boolean;
    cronSyncing: boolean;
    error: string | null;
    fetchWorkflows: () => Promise<void>;
    createWorkflow: (data: Partial<Workflow>) => Promise<Workflow | void>;
    updateWorkflow: (id: number, data: Partial<Workflow>) => Promise<void>;
    deleteWorkflow: (id: number) => Promise<void>;
    toggleWorkflow: (id: number, active: boolean) => Promise<void>;
    syncCronSchedules: () => Promise<boolean>;
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
    workflows: [],
    loading: false,
    cronSyncing: false,
    error: null,

    fetchWorkflows: async () => {
        try {
            set({ loading: true, error: null });
            const res = await api.get<{ data: Workflow[] }>('/api/automation/workflows');
            set({ workflows: res.data.data, loading: false });
        } catch (err: unknown) {
            set({ error: axiosMessage(err), loading: false });
        }
    },

    createWorkflow: async (data: Partial<Workflow>) => {
        try {
            set({ loading: true, error: null });
            const res = await api.post<{ data: Workflow }>('/api/automation/workflows', data);
            await get().fetchWorkflows();
            set({ loading: false });
            return res.data.data;
        } catch (err: unknown) {
            set({ error: axiosMessage(err), loading: false });
        }
    },

    updateWorkflow: async (id: number, data: Partial<Workflow>) => {
        try {
            set({ loading: true, error: null });
            await api.put(`/api/automation/workflows/${id}`, data);
            await get().fetchWorkflows();
            set({ loading: false });
        } catch (err: unknown) {
            set({ error: axiosMessage(err), loading: false });
        }
    },

    deleteWorkflow: async (id: number) => {
        try {
            set({ loading: true, error: null });
            await api.delete(`/api/automation/workflows/${id}`);
            await get().fetchWorkflows();
            set({ loading: false });
        } catch (err: unknown) {
            set({ error: axiosMessage(err), loading: false });
        }
    },

    toggleWorkflow: async (id: number, active: boolean) => {
        try {
            await api.patch(`/api/automation/workflows/${id}/toggle`, { active });
            set({
                workflows: get().workflows.map(w => (w.id === id ? { ...w, active } : w))
            });
        } catch (err: unknown) {
            set({ error: axiosMessage(err) });
        }
    },

    syncCronSchedules: async () => {
        try {
            set({ cronSyncing: true, error: null });
            await api.post('/api/automation/cron/sync');
            set({ cronSyncing: false });
            return true;
        } catch (err: unknown) {
            set({ error: axiosMessage(err), cronSyncing: false });
            return false;
        }
    }
}));
