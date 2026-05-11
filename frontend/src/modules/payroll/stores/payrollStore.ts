import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrPayslip {
    id: number; name: string; state: string; dateFrom: string; dateTo: string;
    basicWage: number; grossSalary: number; netSalary: number; deductions: number;
    employeeId: number; employee?: { id: number; name: string }; createdAt: string;
}
interface S {
    payslips: HrPayslip[]; total: number; loading: boolean; error: string | null;
    fetch: () => Promise<void>; create: (d: Partial<HrPayslip>) => Promise<HrPayslip | undefined>;
    update: (id: number, d: Partial<HrPayslip>) => Promise<void>; remove: (id: number) => Promise<void>;
    confirm: (id: number) => Promise<void>; pay: (id: number) => Promise<void>;
}
export const usePayrollStore = create<S>((set, get) => ({
    payslips: [], total: 0, loading: false, error: null,
    fetch: async () => { try { set({ loading: true, error: null }); const r = await axios.get(`${API}/api/hr/payslips?limit=200`); const p = r.data; set({ payslips: p.data || p, total: p.total || (p.data || p).length, loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    create: async (d) => { try { set({ loading: true }); const r = await axios.post(`${API}/api/hr/payslips`, d); await get().fetch(); set({ loading: false }); return r.data; } catch (e: any) { set({ error: e.message, loading: false }); } },
    update: async (id, d) => { try { set({ loading: true }); await axios.put(`${API}/api/hr/payslips/${id}`, d); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    remove: async (id) => { try { set({ loading: true }); await axios.delete(`${API}/api/hr/payslips/${id}`); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    confirm: async (id) => { try { set({ loading: true }); await axios.patch(`${API}/api/hr/payslips/${id}/confirm`); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    pay: async (id) => { try { set({ loading: true }); await axios.patch(`${API}/api/hr/payslips/${id}/pay`); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
}));
