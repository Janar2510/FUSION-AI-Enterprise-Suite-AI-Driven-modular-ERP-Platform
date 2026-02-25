import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrAppraisal {
    id: number; state: string; deadline: string | null; finalInterview: string | null;
    managerFeedback: string | null; employeeFeedback: string | null; overallRating: number;
    employeeId: number; employee?: { id: number; name: string }; createdAt: string;
}
interface S {
    appraisals: HrAppraisal[]; total: number; loading: boolean; error: string | null;
    fetch: () => Promise<void>; create: (d: Partial<HrAppraisal>) => Promise<HrAppraisal | undefined>;
    update: (id: number, d: Partial<HrAppraisal>) => Promise<void>; remove: (id: number) => Promise<void>;
}
export const useAppraisalStore = create<S>((set, get) => ({
    appraisals: [], total: 0, loading: false, error: null,
    fetch: async () => { try { set({ loading: true, error: null }); const r = await axios.get(`${API}/api/appraisals?limit=200`); const p = r.data; set({ appraisals: p.data || p, total: p.total || (p.data || p).length, loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    create: async (d) => { try { set({ loading: true }); const r = await axios.post(`${API}/api/appraisals`, d); await get().fetch(); set({ loading: false }); return r.data; } catch (e: any) { set({ error: e.message, loading: false }); } },
    update: async (id, d) => { try { set({ loading: true }); await axios.put(`${API}/api/appraisals/${id}`, d); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    remove: async (id) => { try { set({ loading: true }); await axios.delete(`${API}/api/appraisals/${id}`); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
}));
