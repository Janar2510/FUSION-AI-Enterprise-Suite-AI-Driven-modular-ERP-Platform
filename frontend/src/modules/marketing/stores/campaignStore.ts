import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface MarketingCampaign {
    id: number; name: string; type: string; state: string; budget: number; spent: number;
    leads: number; conversions: number; startDate: string | null; endDate: string | null;
    description: string | null;
}

export interface CampaignActivity {
    id: number; name: string; type: string; sequence: number;
    delayValue: number; delayUnit: string; subject?: string; body?: string;
    serverAction?: string; state: string; successCount: number; rejectedCount: number;
}

export interface CampaignParticipant {
    id: number; name: string; email: string; phone: string; state: string;
    targetModel: string; lastActivityId: number | null; nextActionAt: string | null;
}

export interface CampaignTrace {
    id: number; status: string; reason?: string; scheduledAt: string;
    dispatchedAt?: string; activity: { id: number; name: string; type: string };
    participant: { id: number; name: string; email: string };
}

export interface CampaignAnalytics {
    campaign: { id: number; name: string; state: string; leads: number; conversions: number };
    participants: { total: number; queued: number; active: number; completed: number };
    tracesByStatus: Record<string, number>;
    activities: Array<CampaignActivity & { traceCounts: Array<{ status: string; _count: number }> }>;
}

export interface CampaignTemplate {
    id: string; name: string; description: string; type: string;
    activities: Array<{ name: string; type: string; sequence: number; delayValue: number; delayUnit: string; subject?: string; body?: string; serverAction?: string }>;
}

interface CampaignStore {
    items: MarketingCampaign[]; loading: boolean; total: number;
    templates: CampaignTemplate[];
    fetch: () => Promise<void>;
    fetchTemplates: () => Promise<void>;
    create: (data: Partial<MarketingCampaign>) => Promise<void>;
    createFromTemplate: (templateId: string, name?: string, extra?: Partial<MarketingCampaign>) => Promise<any>;
    update: (id: number, data: Partial<MarketingCampaign>) => Promise<void>;
    remove: (id: number) => Promise<void>;
    launch: (id: number) => Promise<void>;
    fetchActivities: (campaignId: number) => Promise<CampaignActivity[]>;
    fetchParticipants: (campaignId: number) => Promise<CampaignParticipant[]>;
    resolveParticipants: (campaignId: number, targetModel: string, filters: any) => Promise<any>;
    fetchTraces: (campaignId: number, page?: number) => Promise<{ data: CampaignTrace[]; total: number }>;
    fetchAnalytics: (campaignId: number) => Promise<CampaignAnalytics>;
    sendTest: (campaignId: number, email: string) => Promise<any>;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
    items: [], loading: false, total: 0, templates: [],
    fetch: async () => { set({ loading: true }); try { const { data } = await axios.get(`${API}/api/campaigns`); set({ items: data.data, total: data.total }); } finally { set({ loading: false }); } },
    fetchTemplates: async () => { const { data } = await axios.get(`${API}/api/campaigns/templates`); set({ templates: data }); },
    create: async (d) => { await axios.post(`${API}/api/campaigns`, d); get().fetch(); },
    createFromTemplate: async (templateId, name, extra) => { const { data } = await axios.post(`${API}/api/campaigns/from-template`, { templateId, name, ...extra }); get().fetch(); return data; },
    update: async (id, d) => { await axios.put(`${API}/api/campaigns/${id}`, d); get().fetch(); },
    remove: async (id) => { await axios.delete(`${API}/api/campaigns/${id}`); get().fetch(); },
    launch: async (id) => { await axios.post(`${API}/api/campaigns/${id}/launch`); get().fetch(); },
    fetchActivities: async (campaignId) => { const { data } = await axios.get(`${API}/api/campaigns/${campaignId}/activities`); return data; },
    fetchParticipants: async (campaignId) => { const { data } = await axios.get(`${API}/api/campaigns/${campaignId}/participants`); return data; },
    resolveParticipants: async (campaignId, targetModel, filters) => { const { data } = await axios.post(`${API}/api/campaigns/${campaignId}/participants/resolve`, { targetModel, filters }); return data; },
    fetchTraces: async (campaignId, page = 1) => { const { data } = await axios.get(`${API}/api/campaigns/${campaignId}/traces?page=${page}&limit=50`); return { data: data.data, total: data.total }; },
    fetchAnalytics: async (campaignId) => { const { data } = await axios.get(`${API}/api/campaigns/${campaignId}/analytics`); return data; },
    sendTest: async (campaignId, email) => { const { data } = await axios.post(`${API}/api/campaigns/${campaignId}/test`, { email }); return data; },
}));
