import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

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
}

export interface MaintenanceRequest {
    id: number;
    name: string;
    description: string | null;
    requestDate: string;
    closeDate: string | null;
    priority: number;
    stage: string; // new, in_progress, repaired, scrap
    maintenanceType: string; // corrective, preventive
    equipmentId: number | null;
    equipment?: MaintenanceEquipment;
}

interface MaintenanceStore {
    requests: MaintenanceRequest[];
    equipment: MaintenanceEquipment[];
    loading: boolean;
    error: string | null;

    fetchRequests: () => Promise<void>;
    fetchEquipment: () => Promise<void>;
    createRequest: (data: Partial<MaintenanceRequest>) => Promise<MaintenanceRequest | undefined>;
    updateRequest: (id: number, data: Partial<MaintenanceRequest>) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
    requests: [],
    equipment: [],
    loading: false,
    error: null,

    fetchRequests: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/maintenance/requests?limit=1000`);
            set({ requests: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchEquipment: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/maintenance/equipment?limit=1000`);
            set({ equipment: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createRequest: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/maintenance/requests`, data);
            await get().fetchRequests();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateRequest: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/maintenance/requests/${id}`, data);
            await get().fetchRequests();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useMaintenanceStore;
