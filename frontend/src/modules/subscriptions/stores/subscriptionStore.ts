import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface Subscription {
    id: number; name: string | null; state: string; plan: string; mrr: number;
    startDate: string; nextBilling: string | null; endDate: string | null;
    recurringInterval: number; recurringRule: string; partnerId: number | null;
    partner?: { id: number; name: string } | null;
}

interface SubscriptionStore {
    items: Subscription[]; loading: boolean; total: number;
    fetch: () => Promise<void>;
    create: (data: Partial<Subscription>) => Promise<void>;
    update: (id: number, data: Partial<Subscription>) => Promise<void>;
    remove: (id: number) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
    items: [], loading: false, total: 0,
    fetch: async () => { set({ loading: true }); try { const { data } = await axios.get(`${API}/api/subscriptions`); set({ items: data.data, total: data.total }); } finally { set({ loading: false }); } },
    create: async (d) => { await axios.post(`${API}/api/subscriptions`, d); get().fetch(); },
    update: async (id, d) => { await axios.put(`${API}/api/subscriptions/${id}`, d); get().fetch(); },
    remove: async (id) => { await axios.delete(`${API}/api/subscriptions/${id}`); get().fetch(); },
}));
