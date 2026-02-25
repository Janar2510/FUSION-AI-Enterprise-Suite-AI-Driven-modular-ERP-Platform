import { create } from 'zustand';
import axios from 'axios';
const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrAttendance {
    id: number; checkIn: string; checkOut: string | null; workedHours: number;
    employeeId: number; employee?: { id: number; name: string }; createdAt: string;
}
interface S {
    records: HrAttendance[]; total: number; loading: boolean; error: string | null;
    fetch: () => Promise<void>; create: (d: Partial<HrAttendance>) => Promise<HrAttendance | undefined>;
    update: (id: number, d: Partial<HrAttendance>) => Promise<void>; remove: (id: number) => Promise<void>;
}
export const useAttendanceStore = create<S>((set, get) => ({
    records: [], total: 0, loading: false, error: null,
    fetch: async () => { try { set({ loading: true, error: null }); const r = await axios.get(`${API}/api/attendance?limit=200`); const p = r.data; set({ records: p.data || p, total: p.total || (p.data || p).length, loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    create: async (d) => { try { set({ loading: true }); const r = await axios.post(`${API}/api/attendance`, d); await get().fetch(); set({ loading: false }); return r.data; } catch (e: any) { set({ error: e.message, loading: false }); } },
    update: async (id, d) => { try { set({ loading: true }); await axios.put(`${API}/api/attendance/${id}`, d); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
    remove: async (id) => { try { set({ loading: true }); await axios.delete(`${API}/api/attendance/${id}`); await get().fetch(); set({ loading: false }); } catch (e: any) { set({ error: e.message, loading: false }); } },
}));
