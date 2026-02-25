import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface MrpBomLine {
    id: number;
    productQty: number;
    productId: number;
    product?: { id: number; name: string; price: number };
}

export interface MrpBom {
    id: number;
    name?: string | null;
    code?: string | null;
    type: string;
    productQty: number;
    active: boolean;
    lines: MrpBomLine[];
}

export interface MrpWorkcenter {
    id: number;
    name: string;
    code?: string;
    timeEfficiency: number;
    capacity: number;
    oeeTarget: number;
    timeStart: number;
    timeStop: number;
    costsHour: number;
    active: boolean;
}

export interface MrpWorkorder {
    id: number;
    name: string;
    state: string;
    duration: number;
    durationActual: number;
    sequence: number;
    productionId: number;
    workcenterId?: number;
    workcenter?: MrpWorkcenter;
}

export interface MrpProduction {
    id: number;
    name: string;
    state: string; // draft, confirmed, progress, done, cancel
    productQty: number;
    qtyProduced: number;
    dateStart?: string | null;
    dateFinished?: string | null;
    origin?: string | null;
    bomId?: number | null;
    productId?: number | null;
    bom?: MrpBom | null;
    product?: { id: number; name: string };
    workOrders?: MrpWorkorder[];
}

interface ManufacturingStore {
    boms: MrpBom[];
    orders: MrpProduction[];
    workcenters: MrpWorkcenter[];
    loading: boolean;
    error: string | null;

    fetchBoms: () => Promise<void>;
    createBom: (data: Partial<MrpBom>) => Promise<MrpBom | undefined>;

    fetchWorkcenters: () => Promise<void>;

    fetchOrders: () => Promise<void>;
    createOrder: (data: Partial<MrpProduction>) => Promise<MrpProduction | undefined>;
    startOrder: (id: number) => Promise<void>;
    finishOrder: (id: number) => Promise<void>;
}

export const useManufacturingStore = create<ManufacturingStore>((set, get) => ({
    boms: [],
    orders: [],
    workcenters: [],
    loading: false,
    error: null,

    fetchWorkcenters: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/manufacturing/workcenters`);
            set({ workcenters: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchBoms: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/manufacturing/boms`);
            set({ boms: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createBom: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/manufacturing/boms`, data);
            await get().fetchBoms();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchOrders: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/manufacturing/orders?limit=1000`);
            set({ orders: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createOrder: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/manufacturing/orders`, data);
            await get().fetchOrders();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    startOrder: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.post(`${API_BASE}/api/manufacturing/orders/${id}/start`);
            await get().fetchOrders();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    finishOrder: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.post(`${API_BASE}/api/manufacturing/orders/${id}/done`);
            await get().fetchOrders();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }

}));

export default useManufacturingStore;
