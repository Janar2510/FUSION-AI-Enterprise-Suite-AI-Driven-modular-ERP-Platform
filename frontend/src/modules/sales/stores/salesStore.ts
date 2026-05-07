import { create } from 'zustand';
import { salesApi } from '@/lib/api';

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
  // Phase 3 flow actions (Flows B / C)
  confirmOrder: (id: number) => Promise<void>;
  cancelOrder: (id: number) => Promise<void>;
  createInvoice: (id: number) => Promise<{ moveId: number } | undefined>;
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchAllOrders: async () => {
    try {
      set({ loading: true, error: null });
      const res = await salesApi.list({ limit: 500 });
      set({ orders: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createOrder: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await salesApi.create(data as Record<string, unknown>);
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
      await salesApi.update(id, data as Record<string, unknown>);
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
      await salesApi.confirm(id);
      await get().fetchAllOrders();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },

  cancelOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      await salesApi.cancel(id);
      await get().fetchAllOrders();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },

  createInvoice: async (id) => {
    try {
      set({ loading: true, error: null });
      const res = await salesApi.invoice(id);
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },
}));
