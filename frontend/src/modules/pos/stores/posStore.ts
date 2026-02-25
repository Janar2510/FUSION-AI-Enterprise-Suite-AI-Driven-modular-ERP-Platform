import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface PosConfig {
    id: number;
    name: string;
    active: boolean;
    companyId?: number;
}

export interface PosSession {
    id: number;
    name: string;
    state: string; // opened, closed
    startAt: string;
    stopAt?: string | null;
    configId: number;
    config?: PosConfig;
    _count?: { orders: number };
}

export interface PosOrderLine {
    id: number;
    productQty: number;
    priceUnit: number;
    priceSubtotal: number;
    productId: number;
    product?: { id: number; name: string };
}

export interface PosOrder {
    id: number;
    name: string;
    state: string; // draft, paid, done, invoiced
    amountTotal: number;
    amountPaid: number;
    amountReturn: number;
    dateOrder: string;
    sessionId: number;
    session?: PosSession;
    partnerId?: number | null;
    partner?: { id: number; name: string };
    lines: PosOrderLine[];
}

export interface LoyaltyProgram {
    id: number;
    name: string;
    points_per_dollar: number;
    is_active: boolean;
}

export interface LoyaltyCard {
    id: number;
    program_id: number;
    customer_id: number;
    points: number;
}

interface PosStore {
    configs: PosConfig[];
    sessions: PosSession[];
    orders: PosOrder[];
    loading: boolean;
    error: string | null;

    fetchConfigs: () => Promise<void>;

    fetchSessions: () => Promise<void>;
    openSession: (configId: number) => Promise<PosSession | undefined>;
    closeSession: (id: number) => Promise<void>;

    fetchOrders: (sessionId?: number) => Promise<void>;
    createOrder: (data: Partial<PosOrder>) => Promise<PosOrder | undefined>;
    payOrder: (id: number, amount: number) => Promise<void>;

    loyaltyPrograms: LoyaltyProgram[];
    currentLoyaltyCard: LoyaltyCard | null;
    fetchLoyaltyPrograms: () => Promise<void>;
    fetchLoyaltyCard: (customerId: number) => Promise<void>;
    addLoyaltyPoints: (customerId: number, points: number) => Promise<void>;
}

export const usePosStore = create<PosStore>((set, get) => ({
    configs: [],
    sessions: [],
    orders: [],
    loading: false,
    error: null,

    fetchConfigs: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/pos/configs`);
            set({ configs: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchSessions: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/pos/sessions`);
            set({ sessions: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    openSession: async (configId) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/pos/sessions`, { configId });
            await get().fetchSessions();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    closeSession: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.post(`${API_BASE}/api/pos/sessions/${id}/close`);
            await get().fetchSessions();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchOrders: async (sessionId) => {
        try {
            set({ loading: true, error: null });
            const query = sessionId ? `?session_id=${sessionId}&limit=1000` : '?limit=1000';
            const res = await axios.get(`${API_BASE}/api/pos/orders${query}`);
            set({ orders: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createOrder: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/pos/orders`, data);
            if (data.sessionId) {
                await get().fetchOrders(data.sessionId);
            } else {
                await get().fetchOrders();
            }
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    payOrder: async (id, amount) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/pos/orders/${id}/pay`, { amount });
            const session_id = res.data.sessionId;
            await get().fetchOrders(session_id);
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    loyaltyPrograms: [],
    currentLoyaltyCard: null,

    fetchLoyaltyPrograms: async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/pos/loyalty-programs`);
            set({ loyaltyPrograms: res.data });
        } catch (err: any) {
            console.error('Error fetching loyalty programs', err);
        }
    },

    fetchLoyaltyCard: async (customerId: number) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/pos/loyalty-cards/${customerId}`);
            set({ currentLoyaltyCard: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    addLoyaltyPoints: async (customerId: number, points: number) => {
        try {
            const res = await axios.post(`${API_BASE}/api/pos/loyalty-cards/${customerId}/add-points?points=${points}`);
            set({ currentLoyaltyCard: res.data });
        } catch (err: any) {
            console.error(err);
        }
    }

}));

export default usePosStore;
