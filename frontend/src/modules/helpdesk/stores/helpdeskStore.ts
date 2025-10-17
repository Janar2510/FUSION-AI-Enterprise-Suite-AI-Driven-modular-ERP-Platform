import { create } from 'zustand';
import api from '@/lib/api';

interface DashboardMetrics {
  ticket_statistics: {
    total_tickets: number;
    open_tickets: number;
    closed_tickets: number;
    avg_response_time: number;
    satisfaction_score: number;
  };
  recent_tickets: any[];
  top_agents: any[];
}

interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  customer_name: string;
  assigned_agent: string;
  created_at: string;
  updated_at: string;
}

interface TicketResponse {
  id: number;
  ticket_id: number;
  agent_name: string;
  message: string;
  created_at: string;
}

interface HelpdeskStore {
  // State
  dashboardMetrics: DashboardMetrics | null;
  analytics: any;
  tickets: { data: Ticket[]; total: number } | null;
  responses: TicketResponse[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboardMetrics: () => Promise<void>;
  fetchAnalytics: (period_days: number) => Promise<void>;
  fetchTickets: (params?: { limit?: number; page?: number; status?: string }) => Promise<void>;
  fetchResponses: (params?: { limit?: number; page?: number }) => Promise<void>;
  createTicket: (ticketData: any) => Promise<void>;
  updateTicket: (id: number, ticketData: any) => Promise<void>;
  createResponse: (responseData: any) => Promise<void>;
}

export const useHelpdeskStore = create<HelpdeskStore>((set, get) => ({
  // Initial state
  dashboardMetrics: null,
  analytics: null,
  tickets: null,
  responses: null,
  loading: false,
  error: null,

  // Actions
  fetchDashboardMetrics: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/helpdesk/dashboard');
      set({ 
        dashboardMetrics: response.data.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch dashboard metrics',
        loading: false 
      });
    }
  },

  fetchAnalytics: async (period_days: number) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/api/v1/helpdesk/analytics?period_days=${period_days}`);
      set({ 
        analytics: response.data.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch analytics',
        loading: false 
      });
    }
  },

  fetchTickets: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/v1/helpdesk/tickets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      set({ tickets: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch tickets',
        loading: false 
      });
    }
  },

  fetchResponses: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/v1/helpdesk/responses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      set({ responses: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch responses',
        loading: false 
      });
    }
  },

  createTicket: async (ticketData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/helpdesk/tickets', ticketData);
      await get().fetchDashboardMetrics();
      await get().fetchTickets();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create ticket',
        loading: false 
      });
    }
  },

  updateTicket: async (id: number, ticketData: any) => {
    try {
      set({ loading: true, error: null });
      await api.put(`/api/v1/helpdesk/tickets/${id}`, ticketData);
      await get().fetchDashboardMetrics();
      await get().fetchTickets();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update ticket',
        loading: false 
      });
    }
  },

  createResponse: async (responseData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/helpdesk/responses', responseData);
      await get().fetchDashboardMetrics();
      await get().fetchResponses();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create response',
        loading: false 
      });
    }
  },
}));



