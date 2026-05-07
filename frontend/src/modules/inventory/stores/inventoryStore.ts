import { create } from 'zustand';
import axios from 'axios';
import { inventoryApi } from '@/lib/api';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface ProductCategory {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  internalRef: string | null;
  barcode: string | null;
  type: string; // consu, service, product
  salePrice: number;
  costPrice: number;
  description: string | null;
  qtyOnHand: number;
  qtyForecasted: number;
  categoryId: number | null;
  category?: ProductCategory;
  active: boolean;
}

export interface StockLocation {
  id: number;
  name: string;
  completeName: string;
  usage: string;
}

export interface StockPickingType {
  id: number;
  name: string;
  code: string;
  sequenceCode: string;
  warehouseId: number | null;
  defaultLocationSrcId: number | null;
  defaultLocationDestId: number | null;
  _count?: { pickings: number };
}

export interface StockPicking {
  id: number;
  name: string;
  pickingTypeId: number;
  pickingType?: StockPickingType;
  state: string; // draft, waiting, confirmed, assigned, done, cancel
  scheduledDate: string | null;
  dateDone: string | null;
  origin: string | null;
  warehouseId: number | null;
  locationId: number | null;
  locationDestId: number | null;
  location?: StockLocation;
  locationDest?: StockLocation;
  moves: StockMove[];
}

export interface StockMove {
  id?: number;
  name: string;
  state: string;
  productQty: number;
  qtyDone: number;
  locationId: number;
  locationDestId: number;
  productId: number;
  product?: Product;
}

export interface StockQuant {
  id: number;
  productId: number;
  locationId: number;
  quantity: number;
  product?: Product;
  location?: StockLocation;
}

interface InventoryStore {
  products: Product[];
  categories: ProductCategory[];
  pickings: StockPicking[];
  pickingTypes: StockPickingType[];
  quants: StockQuant[];
  loading: boolean;
  error: string | null;
  aiForecast: any;
  aiOptimization: any;

  fetchAllProducts: (search?: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<Product | undefined>;
  updateProduct: (id: number, data: Partial<Product>) => Promise<void>;

  fetchPickingTypes: () => Promise<void>;
  fetchAllPickings: (pickingTypeId?: number) => Promise<void>;
  createPicking: (data: Partial<StockPicking>) => Promise<StockPicking | undefined>;
  markReady: (id: number) => Promise<void>;
  validatePicking: (id: number) => Promise<void>;

  fetchQuants: () => Promise<void>;

  forecastDemand: (productId: number, days: number) => Promise<void>;
  optimizeReorders: () => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  categories: [],
  pickings: [],
  pickingTypes: [],
  quants: [],
  loading: false,
  error: null,
  aiForecast: null,
  aiOptimization: null,

  fetchAllProducts: async (search = '') => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/products?limit=500${search ? `&search=${search}` : ''}`);
      set({ products: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/products/categories`);
      set({ categories: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createProduct: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/products`, data);
      await get().fetchAllProducts();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  updateProduct: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`${API_BASE}/api/products/${id}`, data);
      await get().fetchAllProducts();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchPickingTypes: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/inventory/picking-types`);
      set({ pickingTypes: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchAllPickings: async (pickingTypeId?: number) => {
    try {
      set({ loading: true, error: null });
      const url = pickingTypeId
        ? `${API_BASE}/api/inventory/pickings?limit=500&pickingTypeId=${pickingTypeId}`
        : `${API_BASE}/api/inventory/pickings?limit=500`;
      const res = await axios.get(url);
      set({ pickings: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createPicking: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/inventory/pickings`, data);
      await get().fetchAllPickings();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  markReady: async (id) => {
    try {
      set({ loading: true, error: null });
      await inventoryApi.markReady(id);
      await get().fetchAllPickings();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  validatePicking: async (id) => {
    try {
      set({ loading: true, error: null });
      await inventoryApi.validate(id);
      await get().fetchAllPickings();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchQuants: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/inventory/quants?limit=500`);
      set({ quants: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  forecastDemand: async (productId: number, days: number = 30) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/inventory/ai/forecast/${productId}?days_ahead=${days}`);
      set({ aiForecast: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  optimizeReorders: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/inventory/ai/optimize-reorders`);
      set({ aiOptimization: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  }
}));