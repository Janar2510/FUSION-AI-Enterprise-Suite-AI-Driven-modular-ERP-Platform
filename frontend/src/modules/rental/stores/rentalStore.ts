import { create } from 'zustand';
import { rentalApi } from '@/lib/api';

export interface RentalOrderLine {
    id: number;
    productId: number;
    product?: { id: number; name: string; salePrice: number };
    productQty: number;
    priceUnit: number;
    priceSubtotal: number;
}

export interface RentalOrder {
    id: number;
    name: string;
    state: string; // draft, pickup, return, done, cancel
    pickupDate: string;
    returnDate: string;
    partnerId: number;
    partner?: { id: number; name: string };
    amountTotal: number;
    lines: RentalOrderLine[];
}

interface RentalStore {
    orders: RentalOrder[];
    loading: boolean;
    error: string | null;

    fetchOrders: () => Promise<void>;
    createOrder: (data: Partial<RentalOrder>) => Promise<RentalOrder | undefined>;
    updateOrder: (id: number, data: Partial<RentalOrder>) => Promise<void>;
}

export const useRentalStore = create<RentalStore>((set, get) => ({
    orders: [],
    loading: false,
    error: null,

    fetchOrders: async () => {
        try {
            set({ loading: true, error: null });
            const res = await rentalApi.list({ limit: 1000 });
            set({ orders: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createOrder: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await rentalApi.create(data);
            await get().fetchOrders();
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
            await rentalApi.update(id, data);
            await get().fetchOrders();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useRentalStore;
