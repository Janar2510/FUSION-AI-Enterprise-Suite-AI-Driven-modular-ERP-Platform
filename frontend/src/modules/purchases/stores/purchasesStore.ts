import { create } from 'zustand';
import { purchasesApi, partnersApi, productsApi } from '@/lib/api';

export interface Product {
    id: number;
    name: string;
    salePrice: number;
    costPrice: number;
}

export interface Partner {
    id: number;
    name: string;
    isCompany: boolean;
}

export interface PurchaseOrderLine {
    id: number;
    orderId: number;
    productId: number;
    product: Product;
    name: string;
    productQty: number;
    qtyReceived: number;
    qtyInvoiced: number;
    priceUnit: number;
    priceSubtotal: number;
    sequence: number;
}

export interface PurchaseOrder {
    id: number;
    name: string;
    state: string;
    partnerId: number;
    partner: Partner;
    partnerRef?: string;
    dateOrder: string;
    dateApprove?: string;
    amountUntaxed: number;
    amountTax: number;
    amountTotal: number;
    lines: PurchaseOrderLine[];
}

interface PurchasesState {
    orders: PurchaseOrder[];
    partners: Partner[];
    products: Product[];
    isLoading: boolean;
    error: string | null;

    fetchOrders: () => Promise<void>;
    fetchPartners: () => Promise<void>;
    fetchProducts: () => Promise<void>;
    createOrder: (data: Partial<PurchaseOrder>) => Promise<PurchaseOrder>;
    updateOrder: (id: number, data: Partial<PurchaseOrder>) => Promise<PurchaseOrder>;
    confirmOrder: (id: number) => Promise<PurchaseOrder>;
    cancelOrder: (id: number) => Promise<PurchaseOrder>;
    createBill: (id: number) => Promise<void>;
    postBill: (id: number) => Promise<void>;
    payBill: (id: number) => Promise<void>;
}

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
    orders: [],
    partners: [],
    products: [],
    isLoading: false,
    error: null,

    fetchOrders: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await purchasesApi.list();
            set({ orders: response.data.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchPartners: async () => {
        try {
            const response = await partnersApi.list({ isVendor: true });
            set({ partners: response.data.data });
        } catch (error: any) {
            console.error('Failed to fetch partners:', error);
        }
    },

    fetchProducts: async () => {
        try {
            const response = await productsApi.list();
            set({ products: response.data.data });
        } catch (error: any) {
            console.error('Failed to fetch products:', error);
        }
    },

    createOrder: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await purchasesApi.create(data as Record<string, unknown>);
            await get().fetchOrders();
            set({ isLoading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateOrder: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await purchasesApi.update(id, data as Record<string, unknown>);
            await get().fetchOrders();
            set({ isLoading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    confirmOrder: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await purchasesApi.confirm(id);
            await get().fetchOrders();
            set({ isLoading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    cancelOrder: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await purchasesApi.cancel(id);
            await get().fetchOrders();
            set({ isLoading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    createBill: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await purchasesApi.createBill(id);
            await get().fetchOrders();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    postBill: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await purchasesApi.postBill(id);
            await get().fetchOrders();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    payBill: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await purchasesApi.payBill(id);
            await get().fetchOrders();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },
}));
