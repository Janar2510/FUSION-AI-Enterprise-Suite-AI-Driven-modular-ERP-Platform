import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface SubscriptionLine {
    id: number;
    subscriptionId: number;
    name: string;
    productId?: string | null;
    quantity: number;
    priceUnit: number;
    discount: number;
    priceSubtotal: number;
    product?: { id: string; name: string } | null;
}

export interface Subscription {
    id: number;
    name: string | null;
    state: string;
    plan: string;
    mrr: number;
    startDate: string;
    nextBilling: string | null;
    endDate: string | null;
    recurringInterval: number;
    recurringRule: string;
    partnerId: string | null;
    partner?: { id: string; name: string; email?: string } | null;
    lines?: SubscriptionLine[];
}

interface SubscriptionStore {
    items: Subscription[];
    loading: boolean;
    total: number;
    analytics: { active: number; paused: number; cancelled: number; mrr: number; arr: number } | null;

    fetch: () => Promise<void>;
    fetchAnalytics: () => Promise<void>;
    create: (data: Partial<Subscription> & { lines?: Partial<SubscriptionLine>[] }) => Promise<Subscription | undefined>;
    update: (id: number, data: Partial<Subscription>) => Promise<void>;
    remove: (id: number) => Promise<void>;

    activate: (id: number) => Promise<void>;
    pause: (id: number) => Promise<void>;
    cancel: (id: number) => Promise<void>;
    renew: (id: number) => Promise<any>;

    addLine: (subscriptionId: number, line: Partial<SubscriptionLine>) => Promise<void>;
    updateLine: (subscriptionId: number, lineId: number, data: Partial<SubscriptionLine>) => Promise<void>;
    removeLine: (subscriptionId: number, lineId: number) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
    items: [],
    loading: false,
    total: 0,
    analytics: null,

    fetch: async () => {
        set({ loading: true });
        try {
            const { data } = await axios.get(`${API}/api/subscriptions`);
            set({ items: data.data, total: data.total });
        } finally { set({ loading: false }); }
    },

    fetchAnalytics: async () => {
        try {
            const { data } = await axios.get(`${API}/api/subscriptions/analytics/mrr`);
            set({ analytics: data });
        } catch { }
    },

    create: async (d) => {
        const { data } = await axios.post(`${API}/api/subscriptions`, d);
        await get().fetch();
        return data;
    },

    update: async (id, d) => {
        await axios.put(`${API}/api/subscriptions/${id}`, d);
        await get().fetch();
    },

    remove: async (id) => {
        await axios.delete(`${API}/api/subscriptions/${id}`);
        await get().fetch();
    },

    activate: async (id) => {
        await axios.patch(`${API}/api/subscriptions/${id}/activate`);
        await get().fetch();
    },

    pause: async (id) => {
        await axios.patch(`${API}/api/subscriptions/${id}/pause`);
        await get().fetch();
    },

    cancel: async (id) => {
        await axios.patch(`${API}/api/subscriptions/${id}/cancel`);
        await get().fetch();
    },

    renew: async (id) => {
        const { data } = await axios.post(`${API}/api/subscriptions/${id}/renew`);
        await get().fetch();
        return data;
    },

    addLine: async (subscriptionId, line) => {
        await axios.post(`${API}/api/subscriptions/${subscriptionId}/lines`, line);
        await get().fetch();
    },

    updateLine: async (subscriptionId, lineId, data) => {
        await axios.put(`${API}/api/subscriptions/${subscriptionId}/lines/${lineId}`, data);
        await get().fetch();
    },

    removeLine: async (subscriptionId, lineId) => {
        await axios.delete(`${API}/api/subscriptions/${subscriptionId}/lines/${lineId}`);
        await get().fetch();
    },
}));
