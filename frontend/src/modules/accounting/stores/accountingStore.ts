import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  ChartOfAccount, 
  FiscalYear, 
  JournalEntry, 
  Tax, 
  BankStatement, 
  PaymentTerm,
  BalanceSheetResponse,
  AccountingState,
  ChartOfAccountFormData,
  FiscalYearFormData,
  JournalEntryFormData,
  TaxFormData,
  BankStatementFormData,
  PaymentTermFormData
} from '../types';

const API_BASE = '/api/v1/accounting';

export const useAccountingStore = create<AccountingState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    chartOfAccounts: [],
    fiscalYears: [],
    journalEntries: [],
    taxes: [],
    bankStatements: [],
    paymentTerms: [],
    selectedAccount: null,
    selectedEntry: null,
    balanceSheet: null,
    loading: {
      chartOfAccounts: false,
      fiscalYears: false,
      journalEntries: false,
      taxes: false,
      bankStatements: false,
      paymentTerms: false,
      balanceSheet: false
    },
    error: null,

    // Chart of Accounts
    fetchChartOfAccounts: async (skip = 0, limit = 50) => {
      set({ loading: { ...get().loading, chartOfAccounts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/chart-of-accounts?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch chart of accounts');
        
        const chartOfAccounts = await response.json();
        set({ 
          chartOfAccounts,
          loading: { ...get().loading, chartOfAccounts: false }
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, chartOfAccounts: false }
        });
      }
    },

    createChartOfAccount: async (accountData: ChartOfAccountFormData) => {
      set({ loading: { ...get().loading, chartOfAccounts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/chart-of-accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountData)
        });
        
        if (!response.ok) throw new Error('Failed to create chart of account');
        
        const newAccount = await response.json();
        
        set(state => ({
          chartOfAccounts: [...state.chartOfAccounts, newAccount],
          loading: { ...state.loading, chartOfAccounts: false }
        }));
        
        return newAccount;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, chartOfAccounts: false }
        });
        throw error;
      }
    },

    getChartOfAccount: async (accountId: number) => {
      set({ loading: { ...get().loading, chartOfAccounts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/chart-of-accounts/${accountId}`);
        if (!response.ok) throw new Error('Failed to fetch chart of account');
        
        const account = await response.json();
        set({ 
          selectedAccount: account,
          loading: { ...get().loading, chartOfAccounts: false }
        });
        return account;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, chartOfAccounts: false }
        });
        throw error;
      }
    },

    updateChartOfAccount: async (accountId: number, updates: Partial<ChartOfAccountFormData>) => {
      set({ loading: { ...get().loading, chartOfAccounts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/chart-of-accounts/${accountId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update chart of account');
        
        const updatedAccount = await response.json();
        
        set(state => ({
          chartOfAccounts: state.chartOfAccounts.map(account =>
            account.id === accountId ? { ...account, ...updatedAccount } : account
          ),
          selectedAccount: state.selectedAccount?.id === accountId ? { ...state.selectedAccount, ...updatedAccount } : state.selectedAccount,
          loading: { ...state.loading, chartOfAccounts: false }
        }));
        
        return updatedAccount;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, chartOfAccounts: false }
        });
        throw error;
      }
    },

    deleteChartOfAccount: async (accountId: number) => {
      set({ loading: { ...get().loading, chartOfAccounts: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/chart-of-accounts/${accountId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete chart of account');
        
        set(state => ({
          chartOfAccounts: state.chartOfAccounts.filter(account => account.id !== accountId),
          selectedAccount: state.selectedAccount?.id === accountId ? null : state.selectedAccount,
          loading: { ...state.loading, chartOfAccounts: false }
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, chartOfAccounts: false }
        });
        throw error;
      }
    },

    // Fiscal Years
    fetchFiscalYears: async (skip = 0, limit = 50) => {
      set({ loading: { ...get().loading, fiscalYears: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/fiscal-years?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch fiscal years');
        
        const fiscalYears = await response.json();
        set({ 
          fiscalYears,
          loading: { ...get().loading, fiscalYears: false }
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, fiscalYears: false }
        });
      }
    },

    createFiscalYear: async (fiscalYearData: FiscalYearFormData) => {
      set({ loading: { ...get().loading, fiscalYears: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/fiscal-years`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fiscalYearData)
        });
        
        if (!response.ok) throw new Error('Failed to create fiscal year');
        
        const newFiscalYear = await response.json();
        
        set(state => ({
          fiscalYears: [...state.fiscalYears, newFiscalYear],
          loading: { ...state.loading, fiscalYears: false }
        }));
        
        return newFiscalYear;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, fiscalYears: false }
        });
        throw error;
      }
    },

    getFiscalYear: async (fiscalYearId: number) => {
      set({ loading: { ...get().loading, fiscalYears: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/fiscal-years/${fiscalYearId}`);
        if (!response.ok) throw new Error('Failed to fetch fiscal year');
        
        const fiscalYear = await response.json();
        set({ 
          loading: { ...get().loading, fiscalYears: false }
        });
        return fiscalYear;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, fiscalYears: false }
        });
        throw error;
      }
    },

    updateFiscalYear: async (fiscalYearId: number, updates: Partial<FiscalYearFormData>) => {
      set({ loading: { ...get().loading, fiscalYears: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/fiscal-years/${fiscalYearId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update fiscal year');
        
        const updatedFiscalYear = await response.json();
        
        set(state => ({
          fiscalYears: state.fiscalYears.map(fy =>
            fy.id === fiscalYearId ? { ...fy, ...updatedFiscalYear } : fy
          ),
          loading: { ...state.loading, fiscalYears: false }
        }));
        
        return updatedFiscalYear;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, fiscalYears: false }
        });
        throw error;
      }
    },

    deleteFiscalYear: async (fiscalYearId: number) => {
      set({ loading: { ...get().loading, fiscalYears: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/fiscal-years/${fiscalYearId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete fiscal year');
        
        set(state => ({
          fiscalYears: state.fiscalYears.filter(fy => fy.id !== fiscalYearId),
          loading: { ...state.loading, fiscalYears: false }
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, fiscalYears: false }
        });
        throw error;
      }
    },

    // Journal Entries
    fetchJournalEntries: async (skip = 0, limit = 50, stateFilter: string | null = null) => {
      set({ loading: { ...get().loading, journalEntries: true }, error: null });
      try {
        let url = `${API_BASE}/journal-entries?skip=${skip}&limit=${limit}`;
        if (stateFilter) {
          url += `&state=${stateFilter}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch journal entries');
        
        const journalEntries = await response.json();
        set({ 
          journalEntries,
          loading: { ...get().loading, journalEntries: false }
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, journalEntries: false }
        });
      }
    },

    createJournalEntry: async (entryData: JournalEntryFormData) => {
      set({ loading: { ...get().loading, journalEntries: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/journal-entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData)
        });
        
        if (!response.ok) throw new Error('Failed to create journal entry');
        
        const newEntry = await response.json();
        
        set(state => ({
          journalEntries: [...state.journalEntries, newEntry],
          loading: { ...state.loading, journalEntries: false }
        }));
        
        return newEntry;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, journalEntries: false }
        });
        throw error;
      }
    },

    getJournalEntry: async (entryId: number) => {
      set({ loading: { ...get().loading, journalEntries: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/journal-entries/${entryId}`);
        if (!response.ok) throw new Error('Failed to fetch journal entry');
        
        const entry = await response.json();
        set({ 
          selectedEntry: entry,
          loading: { ...get().loading, journalEntries: false }
        });
        return entry;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, journalEntries: false }
        });
        throw error;
      }
    },

    updateJournalEntry: async (entryId: number, updates: Partial<JournalEntryFormData>) => {
      set({ loading: { ...get().loading, journalEntries: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/journal-entries/${entryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update journal entry');
        
        const updatedEntry = await response.json();
        
        set(state => ({
          journalEntries: state.journalEntries.map(entry =>
            entry.id === entryId ? { ...entry, ...updatedEntry } : entry
          ),
          selectedEntry: state.selectedEntry?.id === entryId ? { ...state.selectedEntry, ...updatedEntry } : state.selectedEntry,
          loading: { ...state.loading, journalEntries: false }
        }));
        
        return updatedEntry;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, journalEntries: false }
        });
        throw error;
      }
    },

    deleteJournalEntry: async (entryId: number) => {
      set({ loading: { ...get().loading, journalEntries: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/journal-entries/${entryId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete journal entry');
        
        set(state => ({
          journalEntries: state.journalEntries.filter(entry => entry.id !== entryId),
          selectedEntry: state.selectedEntry?.id === entryId ? null : state.selectedEntry,
          loading: { ...state.loading, journalEntries: false }
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, journalEntries: false }
        });
        throw error;
      }
    },

    postJournalEntry: async (entryId: number) => {
      set({ loading: { ...get().loading, journalEntries: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/journal-entries/${entryId}/post`, {
          method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to post journal entry');
        
        const postedEntry = await response.json();
        
        set(state => ({
          journalEntries: state.journalEntries.map(entry =>
            entry.id === entryId ? { ...entry, ...postedEntry } : entry
          ),
          selectedEntry: state.selectedEntry?.id === entryId ? { ...state.selectedEntry, ...postedEntry } : state.selectedEntry,
          loading: { ...state.loading, journalEntries: false }
        }));
        
        return postedEntry;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, journalEntries: false }
        });
        throw error;
      }
    },

    // Taxes
    fetchTaxes: async (skip = 0, limit = 50) => {
      set({ loading: { ...get().loading, taxes: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/taxes?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch taxes');
        
        const taxes = await response.json();
        set({ 
          taxes,
          loading: { ...get().loading, taxes: false }
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, taxes: false }
        });
      }
    },

    createTax: async (taxData: TaxFormData) => {
      set({ loading: { ...get().loading, taxes: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/taxes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taxData)
        });
        
        if (!response.ok) throw new Error('Failed to create tax');
        
        const newTax = await response.json();
        
        set(state => ({
          taxes: [...state.taxes, newTax],
          loading: { ...state.loading, taxes: false }
        }));
        
        return newTax;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, taxes: false }
        });
        throw error;
      }
    },

    getTax: async (taxId: number) => {
      set({ loading: { ...get().loading, taxes: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/taxes/${taxId}`);
        if (!response.ok) throw new Error('Failed to fetch tax');
        
        const tax = await response.json();
        set({ 
          loading: { ...get().loading, taxes: false }
        });
        return tax;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, taxes: false }
        });
        throw error;
      }
    },

    updateTax: async (taxId: number, updates: Partial<TaxFormData>) => {
      set({ loading: { ...get().loading, taxes: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/taxes/${taxId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update tax');
        
        const updatedTax = await response.json();
        
        set(state => ({
          taxes: state.taxes.map(t =>
            t.id === taxId ? { ...t, ...updatedTax } : t
          ),
          loading: { ...state.loading, taxes: false }
        }));
        
        return updatedTax;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, taxes: false }
        });
        throw error;
      }
    },

    deleteTax: async (taxId: number) => {
      set({ loading: { ...get().loading, taxes: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/taxes/${taxId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete tax');
        
        set(state => ({
          taxes: state.taxes.filter(t => t.id !== taxId),
          loading: { ...state.loading, taxes: false }
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, taxes: false }
        });
        throw error;
      }
    },

    // Financial Reports
    fetchBalanceSheet: async (asOfDate: string, companyId: number) => {
      set({ loading: { ...get().loading, balanceSheet: true }, error: null });
      try {
        const response = await fetch(`${API_BASE}/financial-statements/balance-sheet?as_of_date=${asOfDate}&company_id=${companyId}`);
        if (!response.ok) throw new Error('Failed to fetch balance sheet');
        
        const balanceSheet: BalanceSheetResponse = await response.json();
        set({ 
          balanceSheet,
          loading: { ...get().loading, balanceSheet: false }
        });
        return balanceSheet;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: { ...get().loading, balanceSheet: false }
        });
        throw error;
      }
    },

    // Utility Actions
    setSelectedAccount: (account: ChartOfAccount | null) => set({ selectedAccount: account }),
    setSelectedEntry: (entry: JournalEntry | null) => set({ selectedEntry: entry }),
    clearError: () => set({ error: null })
  }))
);

export default useAccountingStore;