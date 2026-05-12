import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  Contact,
  Company,
  Activity,
  Relationship,
  ContactTimelineResponse,
  ContactFormData,
  CompanyFormData,
  ActivityFormData,
  RelationshipFormData,
  TimelineEvent,
  SearchResponse,
  ContactHubState,
} from '../types';

const API_BASE = '/api/v1/contact-hub';

type ContactHubStore = ContactHubState & {
  fetchContacts: (skip?: number, limit?: number) => Promise<void>;
  createContact: (contactData: ContactFormData) => Promise<Contact>;
  getContact: (contactId: string) => Promise<Contact>;
  updateContact: (contactId: string, updates: Partial<ContactFormData>) => Promise<Contact>;
  deleteContact: (contactId: string) => Promise<void>;
  fetchCompanies: (skip?: number, limit?: number) => Promise<void>;
  createCompany: (companyData: CompanyFormData) => Promise<Company>;
  getCompany: (companyId: string) => Promise<Company>;
  updateCompany: (companyId: string, updates: Partial<CompanyFormData>) => Promise<Company>;
  addActivity: (activityData: ActivityFormData) => Promise<Activity>;
  fetchContactTimeline: (contactId: string, limit?: number) => Promise<TimelineEvent[]>;
  createRelationship: (relationshipData: RelationshipFormData) => Promise<Relationship>;
  searchContacts: (query: string, limit?: number) => Promise<SearchResponse>;
  fetchContactInsights: (contactId: string) => Promise<unknown>;
  setSelectedContact: (contact: Contact | null) => void;
  setSelectedCompany: (company: Company | null) => void;
  clearSearchResults: () => void;
  clearError: () => void;
};

export const useContactHubStore = create<ContactHubStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    contacts: [],
    companies: [],
    selectedContact: null,
    selectedCompany: null,
    timelineEvents: [],
    searchResults: [],
    loading: {
      contacts: false,
      companies: false,
      contactDetail: false,
      companyDetail: false,
      timeline: false,
      search: false
    },
    error: null,

    // Contacts
    fetchContacts: async (skip = 0, limit = 50) => {
      set({ loading: { ...get().loading, contacts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch contacts');
        
        const contacts = await response.json();
        set({ 
          contacts,
          loading: { ...get().loading, contacts: false }
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, contacts: false }
        });
      }
    },

    createContact: async (contactData: ContactFormData) => {
      set({ loading: { ...get().loading, contacts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData)
        });
        
        if (!response.ok) throw new Error('Failed to create contact');
        
        const newContact = await response.json();
        
        set((state: ContactHubState) => ({
          contacts: [...state.contacts, newContact],
          loading: { ...state.loading, contacts: false }
        }));
        
        return newContact;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, contacts: false }
        });
        throw error;
      }
    },

    getContact: async (contactId: string) => {
      set({ loading: { ...get().loading, contactDetail: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}`);
        if (!response.ok) throw new Error('Failed to fetch contact');
        
        const contact = await response.json();
        set({ 
          selectedContact: contact,
          loading: { ...get().loading, contactDetail: false }
        });
        return contact;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, contactDetail: false }
        });
        throw error;
      }
    },

    updateContact: async (contactId: string, updates: Partial<ContactFormData>) => {
      set({ loading: { ...get().loading, contacts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update contact');
        
        const updatedContact = await response.json();
        
        set((state: ContactHubState) => ({
          contacts: state.contacts.map((contact: Contact) =>
            contact.id === contactId ? { ...contact, ...updatedContact } : contact
          ),
          selectedContact: state.selectedContact?.id === contactId ? { ...state.selectedContact, ...updatedContact } : state.selectedContact,
          loading: { ...state.loading, contacts: false }
        }));
        
        return updatedContact;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, contacts: false }
        });
        throw error;
      }
    },

    deleteContact: async (contactId: string) => {
      set({ loading: { ...get().loading, contacts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete contact');
        
        set((state: ContactHubState) => ({
          contacts: state.contacts.filter((contact: Contact) => contact.id !== contactId),
          selectedContact: state.selectedContact?.id === contactId ? null : state.selectedContact,
          loading: { ...state.loading, contacts: false }
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, contacts: false }
        });
        throw error;
      }
    },

    // Companies
    fetchCompanies: async (skip = 0, limit = 50) => {
      set({ loading: { ...get().loading, companies: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/companies?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch companies');
        
        const companies = await response.json();
        set({ 
          companies,
          loading: { ...get().loading, companies: false }
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, companies: false }
        });
      }
    },

    createCompany: async (companyData: CompanyFormData) => {
      set({ loading: { ...get().loading, companies: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData)
        });
        
        if (!response.ok) throw new Error('Failed to create company');
        
        const newCompany = await response.json();
        
        set((state: ContactHubState) => ({
          companies: [...state.companies, newCompany],
          loading: { ...state.loading, companies: false }
        }));
        
        return newCompany;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, companies: false }
        });
        throw error;
      }
    },

    getCompany: async (companyId: string) => {
      set({ loading: { ...get().loading, companyDetail: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/companies/${companyId}`);
        if (!response.ok) throw new Error('Failed to fetch company');
        
        const company = await response.json();
        set({ 
          selectedCompany: company,
          loading: { ...get().loading, companyDetail: false }
        });
        return company;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, companyDetail: false }
        });
        throw error;
      }
    },

    updateCompany: async (companyId: string, updates: Partial<CompanyFormData>) => {
      set({ loading: { ...get().loading, companies: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/companies/${companyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update company');
        
        const updatedCompany = await response.json();
        
        set((state: ContactHubState) => ({
          companies: state.companies.map((company: Company) =>
            company.id === companyId ? { ...company, ...updatedCompany } : company
          ),
          selectedCompany: state.selectedCompany?.id === companyId ? { ...state.selectedCompany, ...updatedCompany } : state.selectedCompany,
          loading: { ...state.loading, companies: false }
        }));
        
        return updatedCompany;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, companies: false }
        });
        throw error;
      }
    },

    // Activities
    addActivity: async (activityData: ActivityFormData) => {
      try {
        const response = await fetch(`${API_BASE}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activityData)
        });
        
        if (!response.ok) throw new Error('Failed to add activity');
        
        const newActivity = await response.json();
        return newActivity;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Timeline
    fetchContactTimeline: async (contactId: string, limit = 50) => {
      set({ loading: { ...get().loading, timeline: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/timeline?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch timeline');
        
        const timelineData: ContactTimelineResponse = await response.json();
        set({ 
          timelineEvents: timelineData.events,
          loading: { ...get().loading, timeline: false }
        });
        return timelineData.events;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, timeline: false }
        });
        return [];
      }
    },

    // Relationships
    createRelationship: async (relationshipData: RelationshipFormData) => {
      try {
        const response = await fetch(`${API_BASE}/relationships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(relationshipData)
        });
        
        if (!response.ok) throw new Error('Failed to create relationship');
        
        const newRelationship = await response.json();
        return newRelationship;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Search
    searchContacts: async (query: string, limit = 20) => {
      set({ loading: { ...get().loading, search: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to search contacts');
        
        const searchResults: SearchResponse = await response.json();
        set({ 
          searchResults: searchResults.results,
          loading: { ...get().loading, search: false }
        });
        return searchResults;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, search: false }
        });
        throw error;
      }
    },

    // Cross-module insights
    fetchContactInsights: async (contactId: string) => {
      try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/insights`);
        if (!response.ok) throw new Error('Failed to fetch contact insights');
        
        const insights = await response.json();
        return insights;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },

    // Utility Actions
    setSelectedContact: (contact: Contact | null) => set({ selectedContact: contact }),
    setSelectedCompany: (company: Company | null) => set({ selectedCompany: company }),
    clearSearchResults: () => set({ searchResults: [] }),
    clearError: () => set({ error: null })
  }))
);