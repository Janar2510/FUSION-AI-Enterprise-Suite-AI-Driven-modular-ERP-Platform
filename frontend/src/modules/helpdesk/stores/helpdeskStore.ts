import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

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
}

export const useHelpdeskStore = create<HelpdeskStore>((set, get) => ({
  tickets: [],
  stages: [],
  loading: false,
  error: null,

  fetchStages: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/helpdesk/stages`);
      set({ stages: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchTickets: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/helpdesk/tickets?limit=500`);
      set({ tickets: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createTicket: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/helpdesk/tickets`, data);
      await get().fetchTickets();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  updateTicket: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`${API_BASE}/api/helpdesk/tickets/${id}`, data);
      await get().fetchTickets();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  updateTicketStage: async (id, stageId) => {
    try {
      set({ loading: true, error: null });
      await axios.patch(`${API_BASE}/api/helpdesk/tickets/${id}/stage`, { stageId });
      await get().fetchTickets();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  }
}));

export default useHelpdeskStore;
