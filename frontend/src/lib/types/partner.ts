/**
 * Unified Partner Types — Odoo res.partner pattern
 * 
 * Single source of truth for contacts, companies, and vendors.
 * Both ContactHub and CRM modules consume these types.
 */

// ── Core Partner Interface (mirrors Prisma Partner model) ────
export interface Partner {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    website?: string | null;
    vat?: string | null;
    isCompany: boolean;
    type: PartnerType;
    street?: string | null;
    street2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
    title?: string | null;
    jobPosition?: string | null;
    notes?: string | null;
    image?: string | null;
    lang?: string | null;
    color: number;
    active: boolean;
    isCustomer: boolean;
    isVendor: boolean;

    // Parent company
    parentId?: number | null;
    parent?: Partner | null;
    children?: Partner[];

    // Tags
    tags?: PartnerTag[];

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface PartnerTag {
    id: number;
    name: string;
    color: number;
}

export type PartnerType = 'contact' | 'invoice' | 'delivery' | 'other';

// ── Form Data (for create/update) ────────────────────────────
export interface PartnerFormData {
    name: string;
    email?: string;
    phone?: string;
    mobile?: string;
    website?: string;
    vat?: string;
    isCompany?: boolean;
    type?: PartnerType;
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    title?: string;
    jobPosition?: string;
    notes?: string;
    image?: string;
    isCustomer?: boolean;
    isVendor?: boolean;
    parentId?: number | null;
}

// ── API Response Types ───────────────────────────────────────
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ── Store State ──────────────────────────────────────────────
export interface PartnerStoreState {
    // Data
    partners: Partner[];
    companies: Partner[];
    contacts: Partner[];
    selectedPartner: Partner | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };

    // UI State
    searchQuery: string;
    loading: boolean;
    error: string | null;

    // Actions
    fetchPartners: (params?: PartnerFetchParams) => Promise<void>;
    fetchCompanies: (params?: PartnerFetchParams) => Promise<void>;
    fetchContacts: (params?: PartnerFetchParams) => Promise<void>;
    getPartner: (id: number) => Promise<Partner>;
    createPartner: (data: PartnerFormData) => Promise<Partner>;
    updatePartner: (id: number, data: Partial<PartnerFormData>) => Promise<Partner>;
    archivePartner: (id: number) => Promise<void>;
    searchPartners: (query: string) => Promise<void>;

    // Utilities
    setSelectedPartner: (partner: Partner | null) => void;
    setSearchQuery: (query: string) => void;
    clearError: () => void;
}

export interface PartnerFetchParams {
    page?: number;
    limit?: number;
    search?: string;
    is_company?: boolean;
    type?: PartnerType;
}
