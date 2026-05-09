import { create } from 'zustand';
import axios from 'axios';

interface Orderpoint {
    id: number;
    name: string;
    productId: number;
    locationId: number;
    productMinQty: number;
    productMaxQty: number;
    active: boolean;
    product: { name: string; qtyOnHand: number };
    location: { name: string };
}

interface StockRoute {
    id: number;
    name: string;
    rules: any[];
}

interface SupplyChainState {
    orderpoints: Orderpoint[];
    routes: StockRoute[];
    loading: boolean;
    stats: {
        totalOrderpoints: number;
        activeRoutes: number;
        avgLeadTime: number | null;
    };
    fetchData: () => Promise<void>;
    runReplenishment: () => Promise<void>;
    createOrderpoint: (data: Partial<Orderpoint>) => Promise<void>;
    updateOrderpoint: (id: number, data: Partial<Orderpoint>) => Promise<void>;
    deleteOrderpoint: (id: number) => Promise<void>;
}

export const useSupplyChainStore = create<SupplyChainState>((set, get) => ({
    orderpoints: [],
    routes: [],
    loading: false,
    stats: {
        totalOrderpoints: 0,
        activeRoutes: 0,
        avgLeadTime: 0,
    },
    fetchData: async () => {
        set({ loading: true });
        try {
            const [opRes, routeRes, leadTimeRes] = await Promise.all([
                axios.get('/api/inventory/orderpoints'),
                axios.get('/api/inventory/routes'),
                axios.get('/api/purchases/stats/lead-time').catch(() => ({ data: { avgLeadTime: null } })),
            ]);

            set({
                orderpoints: opRes.data.data,
                routes: routeRes.data,
                stats: {
                    totalOrderpoints: opRes.data.total,
                    activeRoutes: routeRes.data.length,
                    avgLeadTime: leadTimeRes.data.avgLeadTime ?? 0,
                }
            });
        } catch (error) {
            console.error('Supply Chain Data Fetch Error:', error);
        } finally {
            set({ loading: false });
        }
    },
    runReplenishment: async () => {
        set({ loading: true });
        try {
            await axios.post('/api/inventory/replenish/run');
            await get().fetchData();
        } catch (error) {
            console.error('Replenishment Trigger Error:', error);
        } finally {
            set({ loading: false });
        }
    },
    createOrderpoint: async (data) => {
        set({ loading: true });
        try {
            await axios.post('/api/inventory/orderpoints', data);
            await get().fetchData();
        } catch (error) {
            console.error('Create Orderpoint Error:', error);
        } finally {
            set({ loading: false });
        }
    },
    updateOrderpoint: async (id, data) => {
        set({ loading: true });
        try {
            await axios.put(`/api/inventory/orderpoints/${id}`, data);
            await get().fetchData();
        } catch (error) {
            console.error('Update Orderpoint Error:', error);
        } finally {
            set({ loading: false });
        }
    },
    deleteOrderpoint: async (id) => {
        set({ loading: true });
        try {
            await axios.delete(`/api/inventory/orderpoints/${id}`);
            await get().fetchData();
        } catch (error) {
            console.error('Delete Orderpoint Error:', error);
        } finally {
            set({ loading: false });
        }
    },
}));
