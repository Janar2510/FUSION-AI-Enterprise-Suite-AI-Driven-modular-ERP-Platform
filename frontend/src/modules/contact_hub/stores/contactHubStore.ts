import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  Contact, 
  Company, 
  Activity, 
  Relationship, 
  ContactHubState,
  ContactFormData,
  CompanyFormData,
  ActivityFormData,
  RelationshipFormData,
  TimelineEvent,
  SearchResponse
} from '../types';

const API_BASE = '/api/v1/contact-hub';

export const useContactHubStore = create<ContactHubState>()(
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
        
        set(state => ({
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
        
        set(state => ({
          contacts: state.contacts.map(contact =>
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
        
        set(state => ({
          contacts: state.contacts.filter(contact => contact.id !== contactId),
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
        
        set(state => ({
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
        
        set(state => ({
          companies: state.companies.map(company =>
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
        
        const timelineData = await response.json();
        set({ 
          timelineEvents: timelineData.events,
          loading: { ...get().loading, timeline: false }
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, timeline: false }
        });
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
    setSelectedContact: (contact) => set({ selectedContact: contact }),
    setSelectedCompany: (company) => set({ selectedCompany: company }),
    clearSearchResults: () => set({ searchResults: [] }),
    clearError: () => set({ error: null })
  }))
);