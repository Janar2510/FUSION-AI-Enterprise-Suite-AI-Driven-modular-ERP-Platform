import { create } from 'zustand';
import api from '@/lib/api';

interface DashboardMetrics {
  sales_statistics: {
    total_sales: number;
    orders_today: number;
    conversion_rate: number;
    average_order_value: number;
    monthly_target: number;
    target_achievement: number;
    top_products: any[];
  };
  recent_orders: any[];
  top_customers: any[];
}

interface Quote {
  id: number;
  quote_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  valid_until: string;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  order_date: string;
  items: any[];
}

interface SalesStore {
  // State
  dashboardMetrics: DashboardMetrics | null;
  analytics: any;
  quotes: Quote[] | null;
  orders: Order[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboardMetrics: () => Promise<void>;
  fetchAnalytics: (period_days: number) => Promise<void>;
  fetchQuotes: (params?: { limit?: number; page?: number; status?: string }) => Promise<void>;
  fetchOrders: (params?: { limit?: number; page?: number; status?: string }) => Promise<void>;
  createQuote: (quoteData: any) => Promise<void>;
  createOrder: (orderData: any) => Promise<void>;
  updateQuote: (id: number, quoteData: any) => Promise<void>;
  updateOrder: (id: number, orderData: any) => Promise<void>;
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  // Initial state
  dashboardMetrics: null,
  analytics: null,
  quotes: null,
  orders: null,
  loading: false,
  error: null,

  // Actions
  fetchDashboardMetrics: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/sales/dashboard');
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

  fetchAnalytics: async (period_days: number) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/api/v1/sales/analytics?period_days=${period_days}`);
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

  fetchQuotes: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/v1/sales/quotes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      set({ quotes: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch quotes',
        loading: false 
      });
    }
  },

  fetchOrders: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/v1/sales/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      set({ orders: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch orders',
        loading: false 
      });
    }
  },

  createQuote: async (quoteData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/sales/quotes', quoteData);
      await get().fetchDashboardMetrics();
      await get().fetchQuotes();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create quote',
        loading: false 
      });
    }
  },

  createOrder: async (orderData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/sales/orders', orderData);
      await get().fetchDashboardMetrics();
      await get().fetchOrders();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create order',
        loading: false 
      });
    }
  },

  updateQuote: async (id: number, quoteData: any) => {
    try {
      set({ loading: true, error: null });
      await api.put(`/api/v1/sales/quotes/${id}`, quoteData);
      await get().fetchDashboardMetrics();
      await get().fetchQuotes();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update quote',
        loading: false 
      });
    }
  },

  updateOrder: async (id: number, orderData: any) => {
    try {
      set({ loading: true, error: null });
      await api.put(`/api/v1/sales/orders/${id}`, orderData);
      await get().fetchDashboardMetrics();
      await get().fetchOrders();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update order',
        loading: false 
      });
    }
  },
}));