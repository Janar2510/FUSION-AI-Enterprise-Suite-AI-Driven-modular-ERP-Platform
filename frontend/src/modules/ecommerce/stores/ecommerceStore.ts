import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface WebProduct {
    id: number;
    name: string;
    sku: string;
    stock: number;
    price: number;
    category: string;
    image_url?: string;
}

export interface WebCartItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}

export interface WebCart {
    id: number;
    session_id: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    items: WebCartItem[];
}

interface EcommerceStore {
    products: WebProduct[];
    cart: WebCart | null;
    sessionId: string | null;
    aiRecommendations: any[];
    loading: boolean;
    error: string | null;

    initSession: () => void;
    fetchProducts: (categoryId?: number) => Promise<void>;
    fetchCart: () => Promise<void>;
    addToCart: (productId: number, quantity: number) => Promise<void>;
    checkout: (email: string, name: string) => Promise<any>;
    getRecommendations: (productId?: number) => Promise<void>;
}

export const useEcommerceStore = create<EcommerceStore>((set, get) => ({
    products: [],
    cart: null,
    sessionId: null,
    aiRecommendations: [],
    loading: false,
    error: null,

    initSession: () => {
        let sid = localStorage.getItem('fusion_ecom_session');
        if (!sid) {
            sid = `session_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('fusion_ecom_session', sid);
        }
        set({ sessionId: sid });
    },

    fetchProducts: async (_categoryId?: number) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/products`);
            // Node.js API returns paginated data: { data: [...], total: ... }
            const items = (res.data.data || res.data).map((p: any) => ({
                ...p,
                price: p.salePrice || 0,
                category: p.category?.name || 'General',
                sku: p.internalRef || ''
            }));
            set({ products: items, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchCart: async () => {
        const { sessionId } = get();
        if (!sessionId) return;
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/ecommerce/cart/${sessionId}`);
            set({ cart: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    addToCart: async (productId: number, quantity: number) => {
        const { sessionId } = get();
        if (!sessionId) return;
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/ecommerce/cart/${sessionId}/items`, {
                productId,
                quantity
            });
            set({ cart: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    checkout: async (email: string, name: string) => {
        const { sessionId } = get();
        if (!sessionId) return;
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/ecommerce/cart/${sessionId}/checkout`, { email, name });
            // Reset session after successful checkout
            localStorage.removeItem('fusion_ecom_session');
            get().initSession();
            set({ cart: null, loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    getRecommendations: async (productId?: number) => {
        const { sessionId } = get();
        if (!sessionId) return;
        try {
            const res = await axios.post(`${API_BASE}/api/ecommerce/ai/recommendations`, {
                sessionId,
                productId
            });
            const items = res.data.map((p: any) => ({
                ...p,
                price: p.salePrice || 0,
                category: p.category?.name || 'General'
            }));
            set({ aiRecommendations: items });
        } catch (err: any) {
            console.error("AI Recommendation error:", err);
        }
    }
}));
