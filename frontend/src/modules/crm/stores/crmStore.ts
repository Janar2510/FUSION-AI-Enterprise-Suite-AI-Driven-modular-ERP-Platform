import { create } from 'zustand';
import axios from 'axios';

// The URL comes from environment or defaults to relative path in production
const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface CrmLead {
  id: number;
  name: string;
  type: string;
  active: boolean;
  priority: number;
  expectedRevenue: number;
  probability: number;
  contactName: string | null;
  emailFrom: string | null;
  phone: string | null;
  stageId: number;
  createdAt: string;
  updatedAt: string;
  tags: { id: number; name: string; color: number }[];
  partner?: { id: number; name: string };
  stage?: CrmStage;
}

export interface CrmStage {
  id: number;
  name: string;
  sequence: number;
  foldedKanban: boolean;
  leads: CrmLead[];
}

interface CRMStore {
  // State
  pipelineStages: CrmStage[];
  allLeads: CrmLead[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPipeline: () => Promise<void>;
  fetchAllLeads: () => Promise<void>;
  createLead: (data: Partial<CrmLead>) => Promise<CrmLead | undefined>;
  updateLead: (id: number, data: Partial<CrmLead>) => Promise<void>;
  moveLeadStage: (leadId: number, newStageId: number) => Promise<void>;
  deleteLead: (id: number) => Promise<void>;
}

export const useCRMStore = create<CRMStore>((set, get) => ({
  pipelineStages: [],
  allLeads: [],
  loading: false,
  error: null,

  fetchPipeline: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/crm/pipeline`);
      set({ pipelineStages: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchAllLeads: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/crm/leads?limit=1000`);
      set({ allLeads: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createLead: async (data) => {
    try {
      set({ loading: true, error: null });
      // Needs default stage if not provided
      if (!data.stageId && get().pipelineStages.length > 0) {
        data.stageId = get().pipelineStages[0].id; // Put in first stage by default
      }
      const res = await axios.post(`${API_BASE}/api/crm/leads`, data);
      await get().fetchAllLeads();
      await get().fetchPipeline();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  updateLead: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`${API_BASE}/api/crm/leads/${id}`, data);
      await get().fetchAllLeads();
      await get().fetchPipeline();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  moveLeadStage: async (leadId, newStageId) => {
    try {
      // Optimistic update for snappy UI
      const stages = [...get().pipelineStages];
      let movedLead: CrmLead | undefined;

      stages.forEach(stage => {
        const index = stage.leads.findIndex(l => l.id === leadId);
        if (index > -1) {
          movedLead = stage.leads[index];
          stage.leads.splice(index, 1);
        }
      });

      if (movedLead) {
        movedLead.stageId = newStageId;
        const targetStage = stages.find(s => s.id === newStageId);
        if (targetStage) targetStage.leads.unshift(movedLead);
      }

      set({ pipelineStages: stages });

      // Actual DB update
      await axios.patch(`${API_BASE}/api/crm/leads/${leadId}/stage`, { stageId: newStageId });
      // Re-sync just to be sure
      // await get().fetchPipeline();
    } catch (err: any) {
      console.error(err);
      set({ error: err.message });
      await get().fetchPipeline(); // Rollback if failed
    }
  },

  deleteLead: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.delete(`${API_BASE}/api/crm/leads/${id}`);
      await get().fetchAllLeads();
      await get().fetchPipeline();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  }
}));