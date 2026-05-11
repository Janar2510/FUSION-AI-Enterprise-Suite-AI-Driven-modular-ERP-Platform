import { create } from 'zustand';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface MaintenanceEquipment {
    id: number;
    name: string;
    serialNo: string | null;
    model: string | null;
    category: string | null;
    location: string | null;
    assignDate: string | null;
    cost: number;
    note: string | null;
    active: boolean;
    preventiveFreqDays: number | null;
    nextMaintenanceDate: string | null;
    nextDueDate: string | null;
    lastMaintenanceDate: string | null;
    _count?: { requests: number };
}

export interface MaintenanceRequest {
    id: number;
    name: string;
    description: string | null;
    requestDate: string;
    closeDate: string | null;
    durationHours: number | null;
    priority: number;
    stage: string; // new, in_progress, done, cancelled
    maintenanceType: string; // corrective, preventive
    equipmentId: number | null;
    equipment?: MaintenanceEquipment;
    createdAt: string;
}

export interface MaintenanceAnalytics {
    totalEquipment: number;
    openRequests: number;
    byStage: { stage: string; _count: number }[];
    mttrHours: number;
    mtbfDays: number | null;
    overduePreventive: { id: number; name: string; nextMaintenanceDate: string }[];
}

interface MaintenanceStore {
    requests: MaintenanceRequest[];
    equipment: MaintenanceEquipment[];
    analytics: MaintenanceAnalytics | null;
    loading: boolean;
    error: string | null;

    fetchRequests: () => Promise<void>;
    createRequest: (d: Partial<MaintenanceRequest>) => Promise<MaintenanceRequest | undefined>;
    updateRequest: (id: number, d: Partial<MaintenanceRequest>) => Promise<void>;
    markDone: (id: number, durationHours?: number) => Promise<void>;
    deleteRequest: (id: number) => Promise<void>;

    fetchEquipment: () => Promise<void>;
    createEquipment: (d: Partial<MaintenanceEquipment>) => Promise<MaintenanceEquipment | undefined>;
    updateEquipment: (id: number, d: Partial<MaintenanceEquipment>) => Promise<void>;
    deleteEquipment: (id: number) => Promise<void>;

    fetchAnalytics: () => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
    requests: [],
    equipment: [],
    analytics: null,
    loading: false,
    error: null,

    fetchRequests: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API}/api/maintenance/requests?limit=1000`);
            set({ requests: res.data.data || res.data, loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    createRequest: async (d) => {
        try {
            set({ loading: true });
            const res = await axios.post(`${API}/api/maintenance/requests`, d);
            await get().fetchRequests();
            set({ loading: false });
            return res.data;
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    updateRequest: async (id, d) => {
        try {
            set({ loading: true });
            await axios.put(`${API}/api/maintenance/requests/${id}`, d);
            await get().fetchRequests();
            set({ loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    markDone: async (id, durationHours) => {
        try {
            await axios.patch(`${API}/api/maintenance/requests/${id}/done`, { durationHours });
            await get().fetchRequests();
            await get().fetchEquipment();
        } catch (e: any) { set({ error: e.message }); }
    },

    deleteRequest: async (id) => {
        try {
            set({ loading: true });
            await axios.delete(`${API}/api/maintenance/requests/${id}`);
            await get().fetchRequests();
            set({ loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    fetchEquipment: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API}/api/maintenance/equipment?limit=1000`);
            set({ equipment: res.data.data || res.data, loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    createEquipment: async (d) => {
        try {
            const res = await axios.post(`${API}/api/maintenance/equipment`, d);
            await get().fetchEquipment();
            return res.data;
        } catch (e: any) { set({ error: e.message }); }
    },

    updateEquipment: async (id, d) => {
        try {
            await axios.put(`${API}/api/maintenance/equipment/${id}`, d);
            await get().fetchEquipment();
        } catch (e: any) { set({ error: e.message }); }
    },

    deleteEquipment: async (id) => {
        try {
            await axios.delete(`${API}/api/maintenance/equipment/${id}`);
            await get().fetchEquipment();
        } catch (e: any) { set({ error: e.message }); }
    },

    fetchAnalytics: async () => {
        try {
            const res = await axios.get(`${API}/api/maintenance/analytics`);
            set({ analytics: res.data });
        } catch (e: any) { set({ error: e.message }); }
    },
}));

export default useMaintenanceStore;
