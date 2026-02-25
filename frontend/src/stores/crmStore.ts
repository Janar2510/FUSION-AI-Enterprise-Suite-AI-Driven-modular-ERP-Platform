import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Contact {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  phone?: string;
  company?: {
    id: number;
    name: string;
    industry: string;
  };
  lead_score: number;
  lead_status: string;
  engagement_score: number;
  total_interactions: number;
  email_opens: number;
  email_clicks: number;
  lifetime_value: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: number;
  name: string;
  domain: string;
  website: string;
  industry: string;
  employee_count: number;
  annual_revenue: number;
  account_status: string;
  health_score: number;
  churn_risk: number;
  created_at: string;
}

interface Deal {
  id: number;
  name: string;
  amount: number;
  currency: string;
  probability: number;
  expected_close_date: string;
  actual_close_date?: string;
  status: string;
  deal_type: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
  contact?: Contact;
  company?: Company;
  stage?: {
    id: number;
    name: string;
    probability: number;
  };
  owner?: {
    id: number;
    name: string;
  };
  tags: string[];
}

interface Pipeline {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  stages: Stage[];
}

interface Stage {
  id: number;
  name: string;
  order: number;
  probability: number;
  color: string;
}

interface DashboardMetrics {
  total_contacts: number;
  qualified_leads: number;
  pipeline_value: number;
  win_rate: number;
  contacts_growth: number;
  leads_growth: number;
  pipeline_growth: number;
  win_rate_change: number;
}

interface CRMState {
  // Data
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  pipelines: Pipeline[];
  metrics: DashboardMetrics | null;
  selectedContact: Contact | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboard: () => Promise<void>;
  fetchContacts: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchCompanies: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchDeals: (filters?: any) => Promise<void>;
  fetchPipeline: () => Promise<void>;
  
  // Contact Actions
  createContact: (contactData: any) => Promise<Contact>;
  updateContact: (contactId: number, updates: any) => Promise<void>;
  deleteContact: (contactId: number) => Promise<void>;
  getContact: (contactId: number) => Promise<Contact>;
  searchContacts: (query: string) => Promise<void>;
  scoreContact: (contactId: number) => Promise<any>;
  enrichContact: (contactId: number) => Promise<any>;
  generateEmail: (contactId: number, purpose: string) => Promise<any>;
  
  // Deal Actions
  createDeal: (dealData: any) => Promise<Deal>;
  updateDeal: (dealId: number, updates: any) => Promise<void>;
  deleteDeal: (dealId: number) => Promise<void>;
  moveDeal: (dealId: number, newStageId: number) => Promise<void>;
  getDeal: (dealId: number) => Promise<Deal>;
  
  // Pipeline Actions
  createPipeline: (pipelineData: any) => Promise<Pipeline>;
  updatePipeline: (pipelineId: number, updates: any) => Promise<void>;
  deletePipeline: (pipelineId: number) => Promise<void>;
  
  // Utility Actions
  setSelectedContact: (contact: Contact | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const API_BASE = '/api/v1/crm';

export const useCRMStore = create<CRMState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    contacts: [],
    companies: [],
    deals: [],
    pipelines: [],
    metrics: null,
    selectedContact: null,
    loading: false,
    error: null,

    // Dashboard
    fetchDashboard: async () => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/dashboard`);
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        
        const data = await response.json();
        set({ 
          metrics: data.data.metrics,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },

    // Contacts
    fetchContacts: async (page = 1, limit = 50, filters = {}) => {
      set({ loading: true, error: null });
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...filters
        });
        
        const response = await fetch(`${API_BASE}/contacts?${params}`);
        if (!response.ok) throw new Error('Failed to fetch contacts');
        
        const data = await response.json();
        set({ 
          contacts: data.data.items,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },

    createContact: async (contactData) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData)
        });
        
        if (!response.ok) throw new Error('Failed to create contact');
        
        const data = await response.json();
        const newContact = data.data.contact;
        
        set(state => ({
          contacts: [...state.contacts, newContact],
          loading: false
        }));
        
        return newContact;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
        throw error;
      }
    },

    updateContact: async (contactId, updates) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update contact');
        
        set(state => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId ? { ...contact, ...updates } : contact
          ),
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },

    getContact: async (contactId) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}`);
        if (!response.ok) throw new Error('Failed to fetch contact');
        
        const data = await response.json();
        set({ loading: false });
        return data.data.contact;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
        throw error;
      }
    },

    searchContacts: async (query) => {
      if (!query.trim()) {
        get().fetchContacts();
        return;
      }
      
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts?search=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search contacts');
        
        const data = await response.json();
        set({ 
          contacts: data.data.items,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },

    scoreContact: async (contactId) => {
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/score`, {
          method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to score contact');
        
        const data = await response.json();
        return data.data;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    enrichContact: async (contactId) => {
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/enrich`, {
          method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to enrich contact');
        
        const data = await response.json();
        return data;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    generateEmail: async (contactId, purpose) => {
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/email?purpose=${purpose}`, {
          method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to generate email');
        
        const data = await response.json();
        return data.data;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Companies
    fetchCompanies: async (page = 1, limit = 50, filters = {}) => {
      set({ loading: true, error: null });
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...filters
        });
        
        const response = await fetch(`${API_BASE}/companies?${params}`);
        if (!response.ok) throw new Error('Failed to fetch companies');
        
        const data = await response.json();
        set({ 
          companies: data.data.items,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },

    // Deals
    fetchDeals: async (filters = {}) => {
      set({ loading: true, error: null });
      try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE}/deals?${params}`);
        if (!response.ok) throw new Error('Failed to fetch deals');
        
        const data = await response.json();
        set({ 
          deals: data.data.items,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },

    createDeal: async (dealData) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/deals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dealData)
        });
        
        if (!response.ok) throw new Error('Failed to create deal');
        
        const data = await response.json();
        const newDeal = data.data;
        
        set(state => ({
          deals: [...state.deals, newDeal],
          loading: false
        }));
        
        return newDeal;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
        throw error;
      }
    },

    moveDeal: async (dealId, newStageId) => {
      try {
        const response = await fetch(`${API_BASE}/pipelines/deals/${dealId}/move`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage_id: newStageId, user_id: 1 })
        });
        
        if (!response.ok) throw new Error('Failed to move deal');
        
        const data = await response.json();
        const updatedDeal = data.data;
        
        set(state => ({
          deals: state.deals.map(deal =>
            deal.id === dealId ? { ...deal, stage_id: newStageId } : deal
          )
        }));
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Pipeline
    fetchPipeline: async () => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/pipelines`);
        if (!response.ok) throw new Error('Failed to fetch pipeline');
        
        const data = await response.json();
        set({ 
          pipelines: data.data,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },

    // Utility Actions
    setSelectedContact: (contact) => set({ selectedContact: contact }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // Placeholder methods for future implementation
    deleteContact: async () => {},
    deleteDeal: async () => {},
    getDeal: async () => ({} as Deal),
    updateDeal: async () => {},
    createPipeline: async () => ({} as Pipeline),
    updatePipeline: async () => {},
    deletePipeline: async () => {},
  }))
);


