import { create } from 'zustand';
import { accountingApi } from '@/lib/api';

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
  // Phase 3 flow actions (Flows C / D)
  postMove: (id: number) => Promise<void>;
  registerPayment: (id: number, data?: Record<string, unknown>) => Promise<void>;
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
      const res = await accountingApi.listJournals();
      set({ journals: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchAccounts: async () => {
    try {
      set({ loading: true, error: null });
      const res = await accountingApi.listAccounts({ limit: 500 });
      set({ accounts: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchMoves: async (type?: string) => {
    try {
      set({ loading: true, error: null });
      const res = await accountingApi.listMoves(type ? { limit: 500, type } : { limit: 500 });
      set({ moves: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createMove: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await accountingApi.createMove(data as Record<string, unknown>);
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
      await accountingApi.updateMove(id, data as Record<string, unknown>);
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
      await accountingApi.postMove(id);
      await get().fetchMoves();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },

  registerPayment: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await accountingApi.payMove(id, data);
      await get().fetchMoves();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },
}));

export default useAccountingStore;
