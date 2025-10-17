import { create } from 'zustand';
import api from '@/lib/api';

interface DashboardMetrics {
  crm_statistics: {
    total_contacts: number;
    total_leads: number;
    total_opportunities: number;
    conversion_rate: number;
    revenue_pipeline: number;
  };
  recent_activities: any[];
  top_contacts: any[];
  pipeline_summary: any;
}

interface Contact {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  revenue?: number;
  created_at: string;
}

interface Lead {
  id: number;
  source: string;
  status: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  created_at: string;
}

interface Opportunity {
  id: number;
  value: number;
  stage: string;
  name: string;
  company: string;
  probability: number;
  expected_close_date: string;
}

interface CRMStore {
  // State
  dashboardMetrics: DashboardMetrics | null;
  analytics: any;
  contacts: Contact[] | null;
  leads: Lead[] | null;
  opportunities: Opportunity[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboardMetrics: () => Promise<void>;
  fetchAnalytics: (period: string) => Promise<void>;
  fetchContacts: () => Promise<void>;
  fetchLeads: () => Promise<void>;
  fetchOpportunities: () => Promise<void>;
  createContact: (contactData: any) => Promise<void>;
  createLead: (leadData: any) => Promise<void>;
  createOpportunity: (opportunityData: any) => Promise<void>;
}

export const useCRMStore = create<CRMStore>((set, get) => ({
  // Initial state
  dashboardMetrics: null,
  analytics: null,
  contacts: null,
  leads: null,
  opportunities: null,
  loading: false,
  error: null,

  // Actions
  fetchDashboardMetrics: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/crm/dashboard');
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

  fetchAnalytics: async (period: string) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/api/v1/crm/analytics?period=${period}`);
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

  fetchContacts: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/crm/contacts');
      set({ contacts: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch contacts',
        loading: false 
      });
    }
  },

  fetchLeads: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/crm/leads');
      set({ leads: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch leads',
        loading: false 
      });
    }
  },

  fetchOpportunities: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/crm/opportunities');
      set({ opportunities: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch opportunities',
        loading: false 
      });
    }
  },

  createContact: async (contactData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/crm/contacts', contactData);
      await get().fetchDashboardMetrics();
      await get().fetchContacts();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create contact',
        loading: false 
      });
    }
  },

  createLead: async (leadData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/crm/leads', leadData);
      await get().fetchDashboardMetrics();
      await get().fetchLeads();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create lead',
        loading: false 
      });
    }
  },

  createOpportunity: async (opportunityData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/crm/opportunities', opportunityData);
      await get().fetchDashboardMetrics();
      await get().fetchOpportunities();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create opportunity',
        loading: false 
      });
    }
  },
}));