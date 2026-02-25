import { create } from 'zustand';
import axios from 'axios';
import { Workflow } from '../types';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

interface AutomationState {
    workflows: Workflow[];
    loading: boolean;
    error: string | null;
    fetchWorkflows: () => Promise<void>;
    createWorkflow: (data: Partial<Workflow>) => Promise<Workflow | void>;
    updateWorkflow: (id: number, data: Partial<Workflow>) => Promise<void>;
    deleteWorkflow: (id: number) => Promise<void>;
    toggleWorkflow: (id: number, active: boolean) => Promise<void>;
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
    workflows: [],
    loading: false,
    error: null,

    fetchWorkflows: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/automation/workflows`);
            set({ workflows: res.data.data, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    createWorkflow: async (data: Partial<Workflow>) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/automation/workflows`, data);
            await get().fetchWorkflows();
            set({ loading: false });
            return res.data.data;
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    updateWorkflow: async (id: number, data: Partial<Workflow>) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/automation/workflows/${id}`, data);
            await get().fetchWorkflows();
            set({ loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    deleteWorkflow: async (id: number) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/automation/workflows/${id}`);
            await get().fetchWorkflows();
            set({ loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    toggleWorkflow: async (id: number, active: boolean) => {
        try {
            await axios.patch(`${API_BASE}/api/automation/workflows/${id}/toggle`, { active });
            set({
                workflows: get().workflows.map(w => w.id === id ? { ...w, active } : w)
            });
        } catch (err: any) {
            set({ error: err.message });
        }
    }
}));
