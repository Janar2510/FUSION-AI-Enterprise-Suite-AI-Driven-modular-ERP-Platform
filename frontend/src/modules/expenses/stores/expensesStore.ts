import { create } from 'zustand';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrExpense {
    id: number;
    name: string;
    date: string;
    state: string;
    totalAmount: number;
    quantity: number;
    unitAmount: number;
    description: string | null;
    paymentMode: string;
    receipt: string | null;
    category: string | null;
    employeeId: number;
    sheetId: number | null;
    employee?: { id: number; name: string };
    createdAt: string;
}

export interface HrExpenseSheet {
    id: number;
    name: string;
    state: string; // draft, submitted, approved, posted, refused
    totalAmount: number;
    paymentMode: string;
    employeeId: number;
    accountMoveId: number | null;
    employee?: { id: number; name: string };
    expenses?: HrExpense[];
    createdAt: string;
}

interface ExpensesStore {
    expenses: HrExpense[];
    sheets: HrExpenseSheet[];
    total: number;
    loading: boolean;
    error: string | null;

    fetchExpenses: () => Promise<void>;
    createExpense: (d: Partial<HrExpense>) => Promise<HrExpense | undefined>;
    updateExpense: (id: number, d: Partial<HrExpense>) => Promise<void>;
    deleteExpense: (id: number) => Promise<void>;
    approveExpense: (id: number) => Promise<void>;
    refuseExpense: (id: number) => Promise<void>;

    fetchSheets: () => Promise<void>;
    createSheet: (d: Partial<HrExpenseSheet> & { expenseIds?: number[] }) => Promise<HrExpenseSheet | undefined>;
    updateSheet: (id: number, d: Partial<HrExpenseSheet>) => Promise<void>;
    submitSheet: (id: number) => Promise<void>;
    approveSheet: (id: number) => Promise<void>;
    refuseSheet: (id: number) => Promise<void>;
    postSheet: (id: number) => Promise<void>;
    deleteSheet: (id: number) => Promise<void>;
}

export const useExpensesStore = create<ExpensesStore>((set, get) => ({
    expenses: [],
    sheets: [],
    total: 0,
    loading: false,
    error: null,

    fetchExpenses: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API}/api/hr/expenses?limit=200`);
            const p = res.data;
            set({ expenses: p.data || p, total: p.total || (p.data || p).length, loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    createExpense: async (d) => {
        try {
            set({ loading: true });
            const res = await axios.post(`${API}/api/hr/expenses`, d);
            await get().fetchExpenses();
            set({ loading: false });
            return res.data;
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    updateExpense: async (id, d) => {
        try {
            set({ loading: true });
            await axios.put(`${API}/api/hr/expenses/${id}`, d);
            await get().fetchExpenses();
            set({ loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    deleteExpense: async (id) => {
        try {
            set({ loading: true });
            await axios.delete(`${API}/api/hr/expenses/${id}`);
            await get().fetchExpenses();
            set({ loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    approveExpense: async (id) => {
        try {
            await axios.patch(`${API}/api/hr/expenses/${id}/approve`);
            await get().fetchExpenses();
        } catch (e: any) { set({ error: e.message }); }
    },

    refuseExpense: async (id) => {
        try {
            await axios.patch(`${API}/api/hr/expenses/${id}/refuse`);
            await get().fetchExpenses();
        } catch (e: any) { set({ error: e.message }); }
    },

    fetchSheets: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API}/api/hr/expense-sheets?limit=200`);
            const p = res.data;
            set({ sheets: p.data || p, loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    createSheet: async (d) => {
        try {
            set({ loading: true });
            const res = await axios.post(`${API}/api/hr/expense-sheets`, d);
            await get().fetchSheets();
            set({ loading: false });
            return res.data;
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    updateSheet: async (id, d) => {
        try {
            await axios.put(`${API}/api/hr/expense-sheets/${id}`, d);
            await get().fetchSheets();
        } catch (e: any) { set({ error: e.message }); }
    },

    submitSheet: async (id) => {
        try {
            await axios.patch(`${API}/api/hr/expense-sheets/${id}/submit`);
            await get().fetchSheets();
        } catch (e: any) { set({ error: e.message }); }
    },

    approveSheet: async (id) => {
        try {
            await axios.patch(`${API}/api/hr/expense-sheets/${id}/approve`);
            await get().fetchSheets();
        } catch (e: any) { set({ error: e.message }); }
    },

    refuseSheet: async (id) => {
        try {
            await axios.patch(`${API}/api/hr/expense-sheets/${id}/refuse`);
            await get().fetchSheets();
        } catch (e: any) { set({ error: e.message }); }
    },

    postSheet: async (id) => {
        try {
            await axios.patch(`${API}/api/hr/expense-sheets/${id}/post`);
            await get().fetchSheets();
        } catch (e: any) { set({ error: e.message }); }
    },

    deleteSheet: async (id) => {
        try {
            await axios.delete(`${API}/api/hr/expense-sheets/${id}`);
            await get().fetchSheets();
        } catch (e: any) { set({ error: e.message }); }
    },
}));

export default useExpensesStore;
