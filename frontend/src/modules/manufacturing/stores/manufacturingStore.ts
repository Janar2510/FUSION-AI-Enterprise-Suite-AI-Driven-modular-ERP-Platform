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

export interface MrpRoutingOperation {
    id: number;
    name: string;
    sequence: number;
    routingId: number;
    workcenterId: number;
    duration: number;
    workcenter?: MrpWorkcenter;
}

export interface MrpRouting {
    id: number;
    name: string;
    active: boolean;
    operations: MrpRoutingOperation[];
}

export interface MrpWorkorder {
    id: number;
    name: string;
    state: string; // pending, ready, progress, done, cancel
    duration: number;
    durationActual: number;
    sequence: number;
    productionId: number;
    workcenterId?: number;
    workcenter?: MrpWorkcenter;
}

export interface QualityCheck {
    id: number;
    name: string;
    state: string; // none, pass, fail
    testType: string;
    measureValue?: number;
    notes?: string;
    pointId?: number;
    productId?: number;
    productionId?: number;
    workorderId?: number;
    createdAt: string;
}

export interface MrpProduction {
    id: number;
    name: string;
    state: string;
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
    qualityChecks?: QualityCheck[];
}

interface ManufacturingStore {
    boms: MrpBom[];
    orders: MrpProduction[];
    workcenters: MrpWorkcenter[];
    routings: MrpRouting[];
    qualityChecks: QualityCheck[];
    loading: boolean;
    error: string | null;
    aiSchedule: any;

    fetchBoms: () => Promise<void>;
    createBom: (data: Partial<MrpBom>) => Promise<MrpBom | undefined>;

    fetchWorkcenters: () => Promise<void>;
    createWorkcenter: (data: Partial<MrpWorkcenter>) => Promise<void>;

    fetchRoutings: () => Promise<void>;
    createRouting: (data: Partial<MrpRouting>) => Promise<void>;

    fetchOrders: () => Promise<void>;
    fetchOrderDetails: (id: number) => Promise<MrpProduction | undefined>;
    createOrder: (data: Partial<MrpProduction>) => Promise<MrpProduction | undefined>;
    startOrder: (id: number) => Promise<void>;
    finishOrder: (id: number) => Promise<void>;

    fetchQualityChecks: () => Promise<void>;
    updateQualityCheck: (id: number, data: Partial<QualityCheck>) => Promise<void>;

    optimizeSchedule: () => Promise<void>;
    recordQualityData: (workcenterId: number, passRate: number, defectRate: number, temp: number | null, humidity: number | null) => Promise<void>;
}

export const useManufacturingStore = create<ManufacturingStore>((set, get) => ({
    boms: [],
    orders: [],
    workcenters: [],
    routings: [],
    qualityChecks: [],
    loading: false,
    error: null,
    aiSchedule: null,

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

    createWorkcenter: async (data) => {
        try {
            set({ loading: true, error: null });
            await axios.post(`${API_BASE}/api/manufacturing/workcenters`, data);
            await get().fetchWorkcenters();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchRoutings: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/manufacturing/routings`);
            set({ routings: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createRouting: async (data) => {
        try {
            set({ loading: true, error: null });
            await axios.post(`${API_BASE}/api/manufacturing/routings`, data);
            await get().fetchRoutings();
            set({ loading: false });
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

    fetchOrderDetails: async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/api/manufacturing/orders/${id}`);
            return res.data;
        } catch (err: any) {
            console.error(err);
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
    },

    optimizeSchedule: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/manufacturing/ai/optimize-schedule`);
            set({ aiSchedule: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    recordQualityData: async (workcenterId, passRate, defectRate, temp, humidity) => {
        try {
            set({ loading: true, error: null });
            await axios.post(`${API_BASE}/api/manufacturing/ai/quality-data`, {
                workcenter_id: workcenterId,
                pass_rate: passRate,
                defect_rate: defectRate,
                temperature: temp,
                humidity: humidity
            });
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchQualityChecks: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/quality/checks`);
            set({ qualityChecks: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateQualityCheck: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/quality/checks/${id}`, data);
            await get().fetchQualityChecks();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }

}));

export default useManufacturingStore;
