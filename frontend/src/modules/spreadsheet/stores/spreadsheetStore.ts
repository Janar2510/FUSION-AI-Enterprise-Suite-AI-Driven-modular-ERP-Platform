import { create } from 'zustand';
import { spreadsheetApi } from '@/lib/api';
import type { SpreadsheetData, SpreadsheetCell } from '../types';

export type { SpreadsheetData, SpreadsheetCell };
export interface SpreadsheetMetadata { id: number; name: string; updatedAt: string; }
export interface Spreadsheet { id: number; name: string; data: SpreadsheetData; userId: number; createdAt: string; updatedAt: string; }

interface SpreadsheetStore {
    spreadsheets: SpreadsheetMetadata[];
    currentSpreadsheet: Spreadsheet | null;
    loading: boolean;
    error: string | null;

    fetchSpreadsheets: () => Promise<void>;
    fetchSpreadsheet: (id: number) => Promise<void>;
    createSpreadsheet: (name: string, data?: SpreadsheetData) => Promise<Spreadsheet | undefined>;
    updateSpreadsheet: (id: number, data: Partial<SpreadsheetData>) => Promise<void>;
    deleteSpreadsheet: (id: number) => Promise<void>;

    // Spreadsheet Logic
    updateCell: (row: number, col: string, cell: Partial<SpreadsheetCell>) => void;
    evaluateFormula: (formula: string) => any;
}

export const useSpreadsheetStore = create<SpreadsheetStore>((set, get) => ({
    spreadsheets: [],
    currentSpreadsheet: null,
    loading: false,
    error: null,

    fetchSpreadsheets: async () => {
        try {
            set({ loading: true, error: null });
            const res = await spreadsheetApi.list({ limit: 1000 });
            set({ spreadsheets: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    fetchSpreadsheet: async (id: number) => {
        try {
            set({ loading: true, error: null });
            const res = await spreadsheetApi.get(id);
            set({ currentSpreadsheet: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createSpreadsheet: async (name: string, data?: SpreadsheetData) => {
        try {
            set({ loading: true, error: null });
            const initialData = data || { rows: {}, columnWidths: {} };
            const res = await spreadsheetApi.create({ name, data: initialData });
            await get().fetchSpreadsheets();
            set({ currentSpreadsheet: res.data.data, loading: false });
            return res.data.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.response?.data?.error || err.message, loading: false });
        }
    },

    updateSpreadsheet: async (id, data) => {
        try {
            // Optimistic update
            const current = get().currentSpreadsheet;
            if (current && current.id === id) {
                set({
                    currentSpreadsheet: {
                        ...current,
                        data: { ...current.data, ...data }
                    }
                });
            }

            await spreadsheetApi.update(id, { data });
        } catch (err: any) {
            console.error(err);
            set({ error: err.response?.data?.error || err.message });
        }
    },

    deleteSpreadsheet: async (id) => {
        try {
            await spreadsheetApi.delete(id);
            set({
                spreadsheets: get().spreadsheets.filter(s => s.id !== id),
                currentSpreadsheet: get().currentSpreadsheet?.id === id ? null : get().currentSpreadsheet
            });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message });
        }
    },

    updateCell: (row, col, cellUpdate) => {
        const current = get().currentSpreadsheet;
        if (!current) return;

        const newData = { ...current.data };
        if (!newData.rows[row]) {
            newData.rows[row] = { cells: {} };
        }

        const currentCell = newData.rows[row].cells[col] || { value: '' };
        newData.rows[row].cells[col] = { ...currentCell, ...cellUpdate };

        // If it's a formula, we might want to trigger a re-eval of affected cells
        // For now, we just update the piece of state
        set({ currentSpreadsheet: { ...current, data: newData } });
    },

    evaluateFormula: (formula: string) => {
        if (!formula.startsWith('=')) return formula;

        const expression = formula.substring(1).toUpperCase();

        // Basic evaluation logic (placeholder for more advanced parser)
        // Supports basic math and cross-module placeholders like {CRM:total_leads}
        try {
            // This will be expanded in the next steps to actually fetch/calculate
            return `CALC: ${expression}`;
        } catch (e) {
            return '#ERROR!';
        }
    }
}));
