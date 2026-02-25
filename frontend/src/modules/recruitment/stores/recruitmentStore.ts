import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrApplicant {
    id: number; name: string; partnerName: string | null; email: string | null; phone: string | null;
    stage: string; priority: number; salary: number; source: string | null; description: string | null;
    jobId: number | null; departmentId: number | null; job?: { id: number; name: string }; department?: { id: number; name: string };
    createdAt: string;
}
interface S {
    applicants: HrApplicant[]; total: number; loading: boolean; error: string | null;
    fetch: () => Promise<void>; create: (d: Partial<HrApplicant>) => Promise<HrApplicant | undefined>;
    update: (id: number, d: Partial<HrApplicant>) => Promise<void>; remove: (id: number) => Promise<void>;
}
export const useRecruitmentStore = create<S>((set, get) => ({
    applicants: [], total: 0, loading: false, error: null,
    fetch: async () => { try { set({ loading: true, error: null }); const r = await axios.get(`${API}/api/recruitment?limit=200`); const p = r.data; set({ applicants: p.data || p, total: p.total || (p.data || p).length, loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    create: async (d) => { try { set({ loading: true }); const r = await axios.post(`${API}/api/recruitment`, d); await get().fetch(); set({ loading: false }); return r.data; } catch (e: any) { set({ error: e.message, loading: false }); } },
    update: async (id, d) => { try { set({ loading: true }); await axios.put(`${API}/api/recruitment/${id}`, d); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    remove: async (id) => { try { set({ loading: true }); await axios.delete(`${API}/api/recruitment/${id}`); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
}));
