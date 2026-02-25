import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface SaleOrder {
  id: number;
  name: string;
  state: string; // 'draft' | 'sent' | 'sale' | 'done' | 'cancel'
  dateOrder: string;
  validityDate: string | null;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  partnerId: number;
  partner?: { id: number; name: string };
  lines: SaleOrderLine[];
  createdAt: string;
}

export interface SaleOrderLine {
  id?: number;
  sequence: number;
  name: string;
  productQty: number;
  priceUnit: number;
  discount: number;
  priceSubtotal: number;
  productId?: number | null;
}

interface SalesStore {
  orders: SaleOrder[];
  loading: boolean;
  error: string | null;

  fetchAllOrders: () => Promise<void>;
  createOrder: (data: Partial<SaleOrder>) => Promise<SaleOrder | undefined>;
  updateOrder: (id: number, data: Partial<SaleOrder>) => Promise<void>;
  confirmOrder: (id: number) => Promise<void>;
  cancelOrder: (id: number) => Promise<void>;
  createInvoice: (id: number) => Promise<any>;
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchAllOrders: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/sales?limit=500`);
      set({ orders: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createOrder: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/sales`, data);
      await get().fetchAllOrders();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  updateOrder: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`${API_BASE}/api/sales/${id}`, data);
      await get().fetchAllOrders();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  confirmOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.post(`${API_BASE}/api/sales/${id}/confirm`);
      await get().fetchAllOrders();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  cancelOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.post(`${API_BASE}/api/sales/${id}/cancel`);
      await get().fetchAllOrders();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createInvoice: async (id) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/sales/${id}/invoice`);
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));