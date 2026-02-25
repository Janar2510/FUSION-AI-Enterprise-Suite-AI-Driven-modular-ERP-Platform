import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrExpense {
    id: number;
    name: string;
    date: string;
    state: string; // draft, reported, approved, done, refused
    totalAmount: number;
    quantity: number;
    unitAmount: number;
    description: string | null;
    paymentMode: string; // own_account, company_account
    receipt: string | null;
    employeeId: number;
    employee?: { id: number; name: string };
    createdAt: string;
}

interface ExpensesStore {
    expenses: HrExpense[];
    total: number;
    loading: boolean;
    error: string | null;

    fetchExpenses: () => Promise<void>;
    createExpense: (data: Partial<HrExpense>) => Promise<HrExpense | undefined>;
    updateExpense: (id: number, data: Partial<HrExpense>) => Promise<void>;
    deleteExpense: (id: number) => Promise<void>;
    approveExpense: (id: number) => Promise<void>;
    refuseExpense: (id: number) => Promise<void>;
}

export const useExpensesStore = create<ExpensesStore>((set, get) => ({
    expenses: [],
    total: 0,
    loading: false,
    error: null,

    fetchExpenses: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/hr/expenses?limit=200`);
            const payload = res.data;
            set({ expenses: payload.data || payload, total: payload.total || (payload.data || payload).length, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createExpense: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/hr/expenses`, data);
            await get().fetchExpenses();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateExpense: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/hr/expenses/${id}`, data);
            await get().fetchExpenses();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deleteExpense: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/hr/expenses/${id}`);
            await get().fetchExpenses();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    approveExpense: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.patch(`${API_BASE}/api/hr/expenses/${id}/approve`);
            await get().fetchExpenses();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    refuseExpense: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.patch(`${API_BASE}/api/hr/expenses/${id}/refuse`);
            await get().fetchExpenses();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useExpensesStore;
