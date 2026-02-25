import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface AccountJournal {
  id: number;
  name: string;
  code: string;
  type: string;
  active: boolean;
}

export interface AccountAccount {
  id: number;
  name: string;
  code: string;
  accountType: string;
}

export interface AccountMoveLine {
  id?: number;
  name: string;
  quantity: number;
  priceUnit: number;
  priceSubtotal: number;
  priceTotal: number;
  debit: number;
  credit: number;
  balance: number;
  accountId?: number | null;
  account?: AccountAccount;
  productId?: number | null;
  product?: { id: number; name: string };
}

export interface AccountMove {
  id: number;
  name: string;
  moveType: string;
  state: string;
  date: string;
  dueDate: string | null;
  ref: string | null;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  amountResidual: number;
  paymentState: string;
  journalId: number;
  journal?: AccountJournal;
  partnerId?: number | null;
  partner?: { id: number; name: string };
  lines: AccountMoveLine[];
}

interface AccountingStore {
  journals: AccountJournal[];
  accounts: AccountAccount[];
  moves: AccountMove[];
  loading: boolean;
  error: string | null;

  fetchJournals: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchMoves: (type?: string) => Promise<void>;
  createMove: (data: Partial<AccountMove>) => Promise<AccountMove | undefined>;
  updateMove: (id: number, data: Partial<AccountMove>) => Promise<void>;
  postMove: (id: number) => Promise<void>;
}

export const useAccountingStore = create<AccountingStore>((set, get) => ({
  journals: [],
  accounts: [],
  moves: [],
  loading: false,
  error: null,

  fetchJournals: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/accounting/journals`);
      set({ journals: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchAccounts: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/accounting/accounts?limit=500`);
      set({ accounts: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchMoves: async (type?: string) => {
    try {
      set({ loading: true, error: null });
      const url = type
        ? `${API_BASE}/api/accounting/moves?limit=500&type=${type}`
        : `${API_BASE}/api/accounting/moves?limit=500`;
      const res = await axios.get(url);
      set({ moves: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createMove: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/accounting/moves`, data);
      await get().fetchMoves(data.moveType);
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },

  updateMove: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`${API_BASE}/api/accounting/moves/${id}`, data);
      await get().fetchMoves(data.moveType);
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },

  postMove: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.post(`${API_BASE}/api/accounting/moves/${id}/post`);
      await get().fetchMoves();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  }
}));

export default useAccountingStore;