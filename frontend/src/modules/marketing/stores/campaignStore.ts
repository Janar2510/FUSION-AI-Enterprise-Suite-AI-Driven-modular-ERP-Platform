import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface MarketingCampaign {
    id: number; name: string; type: string; state: string; budget: number; spent: number;
    leads: number; conversions: number; startDate: string | null; endDate: string | null;
    description: string | null;
}

interface CampaignStore {
    items: MarketingCampaign[]; loading: boolean; total: number;
    fetch: () => Promise<void>;
    create: (data: Partial<MarketingCampaign>) => Promise<void>;
    update: (id: number, data: Partial<MarketingCampaign>) => Promise<void>;
    remove: (id: number) => Promise<void>;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
    items: [], loading: false, total: 0,
    fetch: async () => { set({ loading: true }); try { const { data } = await axios.get(`${API}/api/campaigns`); set({ items: data.data, total: data.total }); } finally { set({ loading: false }); } },
    create: async (d) => { await axios.post(`${API}/api/campaigns`, d); get().fetch(); },
    update: async (id, d) => { await axios.put(`${API}/api/campaigns/${id}`, d); get().fetch(); },
    remove: async (id) => { await axios.delete(`${API}/api/campaigns/${id}`); get().fetch(); },
}));
