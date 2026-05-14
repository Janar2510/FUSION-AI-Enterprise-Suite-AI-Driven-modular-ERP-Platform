import { create } from 'zustand';
import { crmApi } from '@/lib/api';

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
  /** Many2one partner (cuid). */
  partnerId?: string | null;
  stageId: number;
  createdAt: string;
  updatedAt: string;
  tags: { id: number; name: string; color: number }[];
  partner?: { id: string; name: string };
  stage?: CrmStage;
  /** Per GET /api/crm/pipeline — open activities / overdue / next due */
  activitySummary?: {
    openCount: number;
    overdueCount: number;
    nextDueAt: string | null;
  };
}

export interface CrmStage {
  id: number;
  name: string;
  sequence: number;
  foldedKanban: boolean;
  leads: CrmLead[];
}

/** Matches GET /api/crm/analytics */
export interface CrmAnalytics {
  totalLeads: number;
  openOpportunities: number;
  newThisMonth: number;
  avgDealSize: number;
  /** Sum of expectedRevenue × probability/100 for active leads with value (scoped). */
  weightedPipeline: number;
  /** Closed-won count this month (dateClosed in range, scoped). */
  wonThisMonth: number;
  /** Soft-deleted / lost count this month (updatedAt in range, scoped). */
  lostThisMonth: number;
  stageBreakdown: {
    id: number;
    name: string;
    count: number;
    pipelineValue?: number;
    weightedPipeline?: number;
  }[];
  wonLostTrend?: { month: string; won: number; lost: number }[];
  revenueByOwner?: {
    userId: string | null;
    name: string | null;
    email: string | null;
    leadCount: number;
    pipelineValue: number;
    weightedPipeline: number;
  }[];
}

interface CRMStore {
  // State
  pipelineStages: CrmStage[];
  allLeads: CrmLead[];
  loading: boolean;
  error: string | null;
  crmAnalytics: CrmAnalytics | null;
  /** When set (managers only), narrows pipeline/leads/analytics/calendar via `user_id` query. */
  crmScopeUserId: string | undefined;
  setCrmScopeUserId: (userId: string | undefined) => void;

  // CRUD actions
  fetchPipeline: () => Promise<void>;
  fetchAllLeads: () => Promise<void>;
  fetchCrmAnalytics: () => Promise<void>;
  createLead: (data: Partial<CrmLead>) => Promise<CrmLead | undefined>;
  updateLead: (id: number, data: Partial<CrmLead>) => Promise<void>;
  moveLeadStage: (leadId: number, newStageId: number) => Promise<void>;
  deleteLead: (id: number) => Promise<void>;

  // Phase 3 flow actions (Flow A: Lead → Won → Quotation)
  qualifyLead: (id: number) => Promise<void>;
  markWon: (id: number) => Promise<void>;
  newQuotation: (id: number) => Promise<{ saleOrderId: number } | undefined>;
}

export const useCRMStore = create<CRMStore>((set, get) => ({
  pipelineStages: [],
  allLeads: [],
  loading: false,
  error: null,
  crmAnalytics: null,
  crmScopeUserId: undefined,

  setCrmScopeUserId: (userId) => {
    set({ crmScopeUserId: userId });
    void get().fetchPipeline();
    void get().fetchAllLeads();
  },

  fetchCrmAnalytics: async () => {
    try {
      const uid = get().crmScopeUserId;
      const res = await crmApi.analytics(uid ? { user_id: uid } : undefined);
      set({ crmAnalytics: res.data });
    } catch {
      /* keep previous snapshot */
    }
  },

  fetchPipeline: async () => {
    try {
      set({ loading: true, error: null });
      const uid = get().crmScopeUserId;
      const res = await crmApi.pipeline(uid ? { user_id: uid } : undefined);
      set({ pipelineStages: res.data, loading: false });
      void get().fetchCrmAnalytics();
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchAllLeads: async () => {
    try {
      set({ loading: true, error: null });
      const uid = get().crmScopeUserId;
      const res = await crmApi.list({ limit: 1000, ...(uid ? { user_id: uid } : {}) });
      set({ allLeads: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createLead: async (data) => {
    try {
      set({ loading: true, error: null });
      if (!data.stageId && get().pipelineStages.length > 0) {
        data.stageId = get().pipelineStages[0].id;
      }
      const res = await crmApi.create(data as Record<string, unknown>);
      await get().fetchAllLeads();
      await get().fetchPipeline();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateLead: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await crmApi.update(id, data as Record<string, unknown>);
      await get().fetchAllLeads();
      await get().fetchPipeline();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  moveLeadStage: async (leadId, newStageId) => {
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

    try {
      await crmApi.moveStage(leadId, newStageId);
      void get().fetchCrmAnalytics();
    } catch (err: any) {
      set({ error: err.message });
      await get().fetchPipeline(); // Rollback on failure
    }
  },

  deleteLead: async (id) => {
    try {
      set({ loading: true, error: null });
      await crmApi.delete(id);
      await get().fetchAllLeads();
      await get().fetchPipeline();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  // ── Phase 3 Flow A actions ────────────────────────────────────────────────

  qualifyLead: async (id) => {
    try {
      set({ loading: true, error: null });
      await crmApi.qualify(id);
      await get().fetchAllLeads();
      await get().fetchPipeline();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  markWon: async (id) => {
    try {
      set({ loading: true, error: null });
      await crmApi.markWon(id);
      await get().fetchAllLeads();
      await get().fetchPipeline();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  newQuotation: async (id) => {
    try {
      set({ loading: true, error: null });
      const res = await crmApi.newQuotation(id);
      await get().fetchAllLeads();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));