/**
 * Unified Partner Store — Odoo res.partner pattern
 * 
 * Shared Zustand store consumed by ContactHub, CRM, Sales, and any
 * module that needs partner/contact data. All data comes from the
 * Prisma API `/api/partners` endpoint.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { prismaApi } from '@/lib/api/prismaApi';
import type {
    Partner,
    PartnerFormData,
    PartnerStoreState,
    PartnerFetchParams,
    PaginatedResponse,
} from '@/lib/types/partner';

export const usePartnerStore = create<PartnerStoreState>()(
    subscribeWithSelector((set) => ({
        // ── Initial State ─────────────────────────────────
        partners: [],
        companies: [],
        contacts: [],
        selectedPartner: null,
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        searchQuery: '',
        loading: false,
        error: null,

        // ── Fetch Partners (all) ──────────────────────────
        fetchPartners: async (params?: PartnerFetchParams) => {
            set({ loading: true, error: null });
            try {
                const query = new URLSearchParams();
                if (params?.page) query.set('page', String(params.page));
                if (params?.limit) query.set('limit', String(params.limit));
                if (params?.search) query.set('search', params.search);
                if (params?.is_company !== undefined) query.set('is_company', String(params.is_company));

                const result = await prismaApi.get<PaginatedResponse<Partner>>(
                    `/api/partners?${query.toString()}`
                );

                set({
                    partners: result.data,
                    pagination: result.pagination,
                    loading: false,
                });
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Failed to fetch partners',
                    loading: false,
                });
            }
        },

        // ── Fetch Companies only (isCompany=true) ─────────
        fetchCompanies: async (params?: PartnerFetchParams) => {
            set({ loading: true, error: null });
            try {
                const query = new URLSearchParams({ is_company: 'true' });
                if (params?.page) query.set('page', String(params.page));
                if (params?.limit) query.set('limit', String(params.limit));
                if (params?.search) query.set('search', params.search);

                const result = await prismaApi.get<PaginatedResponse<Partner>>(
                    `/api/partners?${query.toString()}`
                );

                set({ companies: result.data, loading: false });
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Failed to fetch companies',
                    loading: false,
                });
            }
        },

        // ── Fetch Contacts only (isCompany=false) ─────────
        fetchContacts: async (params?: PartnerFetchParams) => {
            set({ loading: true, error: null });
            try {
                const query = new URLSearchParams({ is_company: 'false' });
                if (params?.page) query.set('page', String(params.page));
                if (params?.limit) query.set('limit', String(params.limit));
                if (params?.search) query.set('search', params.search);

                const result = await prismaApi.get<PaginatedResponse<Partner>>(
                    `/api/partners?${query.toString()}`
                );

                set({ contacts: result.data, loading: false });
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Failed to fetch contacts',
                    loading: false,
                });
            }
        },

        // ── Get Single Partner ────────────────────────────
        getPartner: async (id: number) => {
            set({ loading: true, error: null });
            try {
                const partner = await prismaApi.get<Partner>(`/api/partners/${id}`);
                set({ selectedPartner: partner, loading: false });
                return partner;
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Failed to fetch partner',
                    loading: false,
                });
                throw error;
            }
        },

        // ── Create Partner ────────────────────────────────
        createPartner: async (data: PartnerFormData) => {
            set({ loading: true, error: null });
            try {
                const partner = await prismaApi.post<Partner>('/api/partners', data);

                set(state => ({
                    partners: [...state.partners, partner],
                    ...(partner.isCompany
                        ? { companies: [...state.companies, partner] }
                        : { contacts: [...state.contacts, partner] }),
                    loading: false,
                }));

                return partner;
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Failed to create partner',
                    loading: false,
                });
                throw error;
            }
        },

        // ── Update Partner ────────────────────────────────
        updatePartner: async (id: number, data: Partial<PartnerFormData>) => {
            set({ loading: true, error: null });
            try {
                const partner = await prismaApi.put<Partner>(`/api/partners/${id}`, data);

                const updateList = (list: Partner[]) =>
                    list.map(p => (p.id === id ? { ...p, ...partner } : p));

                set(state => ({
                    partners: updateList(state.partners),
                    companies: updateList(state.companies),
                    contacts: updateList(state.contacts),
                    selectedPartner: state.selectedPartner?.id === id
                        ? { ...state.selectedPartner, ...partner }
                        : state.selectedPartner,
                    loading: false,
                }));

                return partner;
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Failed to update partner',
                    loading: false,
                });
                throw error;
            }
        },

        // ── Archive (soft delete) Partner ──────────────────
        archivePartner: async (id: number) => {
            set({ loading: true, error: null });
            try {
                await prismaApi.delete(`/api/partners/${id}`);

                const removeFromList = (list: Partner[]) =>
                    list.filter(p => p.id !== id);

                set(state => ({
                    partners: removeFromList(state.partners),
                    companies: removeFromList(state.companies),
                    contacts: removeFromList(state.contacts),
                    selectedPartner: state.selectedPartner?.id === id ? null : state.selectedPartner,
                    loading: false,
                }));
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Failed to archive partner',
                    loading: false,
                });
                throw error;
            }
        },

        // ── Search Partners ───────────────────────────────
        searchPartners: async (query: string) => {
            set({ loading: true, error: null, searchQuery: query });
            try {
                const result = await prismaApi.get<PaginatedResponse<Partner>>(
                    `/api/partners?search=${encodeURIComponent(query)}`
                );
                set({
                    partners: result.data,
                    pagination: result.pagination,
                    loading: false,
                });
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Search failed',
                    loading: false,
                });
            }
        },

        // ── Utilities ─────────────────────────────────────
        setSelectedPartner: (partner) => set({ selectedPartner: partner }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        clearError: () => set({ error: null }),
    }))
);
