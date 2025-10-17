import { create } from 'zustand';
import api from '@/lib/api';

interface DashboardMetrics {
  total_products: number;
  low_stock_items: number;
  out_of_stock: number;
  total_value: number;
  pending_orders: number;
  warehouses: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  price: number;
  category: string;
}

interface StockLevelReport {
  low_stock: any[];
  out_of_stock: any[];
  overstocked: any[];
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity: number;
  current_stock: number;
}

interface InventoryStore {
  // State
  dashboardMetrics: DashboardMetrics | null;
  products: { items: Product[]; total: number } | null;
  stockLevelReport: StockLevelReport | null;
  warehouses: Warehouse[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboardMetrics: () => Promise<void>;
  fetchProducts: (params?: { limit?: number; page?: number; category?: string }) => Promise<void>;
  fetchStockLevelReport: () => Promise<void>;
  fetchWarehouses: () => Promise<void>;
  createProduct: (productData: any) => Promise<void>;
  updateProduct: (id: number, productData: any) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  // Initial state
  dashboardMetrics: null,
  products: null,
  stockLevelReport: null,
  warehouses: null,
  loading: false,
  error: null,

  // Actions
  fetchDashboardMetrics: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/inventory/dashboard');
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

  fetchProducts: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/v1/inventory/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      set({ products: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch products',
        loading: false 
      });
    }
  },

  fetchStockLevelReport: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/inventory/stock-level-report');
      set({ stockLevelReport: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch stock level report',
        loading: false 
      });
    }
  },

  fetchWarehouses: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/inventory/warehouses');
      set({ warehouses: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch warehouses',
        loading: false 
      });
    }
  },

  createProduct: async (productData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/inventory/products', productData);
      await get().fetchDashboardMetrics();
      await get().fetchProducts();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create product',
        loading: false 
      });
    }
  },

  updateProduct: async (id: number, productData: any) => {
    try {
      set({ loading: true, error: null });
      await api.put(`/api/v1/inventory/products/${id}`, productData);
      await get().fetchDashboardMetrics();
      await get().fetchProducts();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update product',
        loading: false 
      });
    }
  },

  deleteProduct: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/api/v1/inventory/products/${id}`);
      await get().fetchDashboardMetrics();
      await get().fetchProducts();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to delete product',
        loading: false 
      });
    }
  },
}));