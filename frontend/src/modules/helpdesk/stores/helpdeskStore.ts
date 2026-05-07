import { create } from 'zustand';
import { helpdeskApi } from '@/lib/api';

export interface HelpdeskStage {
  id: number;
  name: string;
  sequence: number;
  foldedKanban: boolean;
}

export interface HelpdeskTicket {
  id: number;
  name: string;
  description?: string | null;
  priority: number;
  kanbanState: string;
  active: boolean;
  stageId: number;
  stage?: HelpdeskStage;
  partnerId?: number | null;
  partner?: { id: number; name: string };
  dateDeadline?: string | null;
  dateClosed?: string | null;
  createdAt: string;
}

interface HelpdeskStore {
  tickets: HelpdeskTicket[];
  stages: HelpdeskStage[];
  loading: boolean;
  error: string | null;

  fetchStages: () => Promise<void>;
  fetchTickets: () => Promise<void>;
  createTicket: (data: Partial<HelpdeskTicket>) => Promise<HelpdeskTicket | undefined>;
  updateTicket: (id: number, data: Partial<HelpdeskTicket>) => Promise<void>;
  updateTicketStage: (id: number, stageId: number) => Promise<void>;
  createTask: (ticketId: number) => Promise<{ taskId: number } | undefined>;
  addTimesheet: (ticketId: number, data: { taskId: number; hours: number; description?: string }) => Promise<void>;
}

export const useHelpdeskStore = create<HelpdeskStore>((set, get) => ({
  tickets: [],
  stages: [],
  loading: false,
  error: null,

  fetchStages: async () => {
    try {
      set({ loading: true, error: null });
      const res = await helpdeskApi.stages();
      set({ stages: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchTickets: async () => {
    try {
      set({ loading: true, error: null });
      const res = await helpdeskApi.list({ limit: 500 });
      set({ tickets: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createTicket: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await helpdeskApi.create(data as Record<string, unknown>);
      await get().fetchTickets();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateTicket: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await helpdeskApi.update(id, data as Record<string, unknown>);
      await get().fetchTickets();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateTicketStage: async (id, stageId) => {
    try {
      set({ loading: true, error: null });
      await helpdeskApi.moveStage(id, stageId);
      await get().fetchTickets();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createTask: async (ticketId) => {
    try {
      set({ loading: true, error: null });
      const res = await helpdeskApi.createTask(ticketId);
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addTimesheet: async (ticketId, data) => {
    try {
      set({ loading: true, error: null });
      await helpdeskApi.addTimesheet(ticketId, data);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));

export default useHelpdeskStore;
