import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrLeaveType {
    id: number;
    name: string;
    color: string;
    allocationMode: string;
    validationMode: string;
    maxAllowance: number;
    isCarryover: boolean;
    requireAttachment: boolean;
    active: boolean;
}

export interface HrLeaveAllocation {
    id: number;
    name: string | null;
    state: string;
    numberOfDays: number;
    dateFrom: string | null;
    dateTo: string | null;
    employeeId: number;
    leaveTypeId: number;
    employee?: { id: number; name: string };
    leaveType?: HrLeaveType;
    createdAt: string;
}

export interface HrLeaveBalance {
    leaveTypeId: number;
    leaveTypeName: string;
    color: string;
    allocated: number;
    taken: number;
    remaining: number;
}

export interface HrLeave {
    id: number;
    name: string | null;
    state: string;
    leaveType: string;
    leaveTypeId: number | null;
    dateFrom: string;
    dateTo: string;
    numberOfDays: number;
    notes: string | null;
    employeeId: number;
    employee?: { id: number; name: string };
    createdAt: string;
}

interface LeavesStore {
    leaves: HrLeave[];
    leaveTypes: HrLeaveType[];
    allocations: HrLeaveAllocation[];
    balances: HrLeaveBalance[];
    total: number;
    loading: boolean;
    error: string | null;

    fetchLeaves: () => Promise<void>;
    createLeave: (data: Partial<HrLeave>) => Promise<HrLeave | undefined>;
    updateLeave: (id: number, data: Partial<HrLeave>) => Promise<void>;
    deleteLeave: (id: number) => Promise<void>;
    approveLeave: (id: number) => Promise<void>;
    refuseLeave: (id: number) => Promise<void>;

    fetchLeaveTypes: () => Promise<void>;
    createLeaveType: (data: Partial<HrLeaveType>) => Promise<HrLeaveType | undefined>;
    updateLeaveType: (id: number, data: Partial<HrLeaveType>) => Promise<void>;
    deleteLeaveType: (id: number) => Promise<void>;

    fetchAllocations: () => Promise<void>;
    createAllocation: (data: Partial<HrLeaveAllocation>) => Promise<HrLeaveAllocation | undefined>;
    updateAllocation: (id: number, data: Partial<HrLeaveAllocation>) => Promise<void>;
    approveAllocation: (id: number) => Promise<void>;
    refuseAllocation: (id: number) => Promise<void>;
    deleteAllocation: (id: number) => Promise<void>;

    fetchBalance: (employeeId: number) => Promise<void>;
}

export const useLeavesStore = create<LeavesStore>((set, get) => ({
    leaves: [],
    leaveTypes: [],
    allocations: [],
    balances: [],
    total: 0,
    loading: false,
    error: null,

    fetchLeaves: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/hr/leaves?limit=200`);
            const payload = res.data;
            set({ leaves: payload.data || payload, total: payload.total || (payload.data || payload).length, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    createLeave: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/hr/leaves`, data);
            await get().fetchLeaves();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    updateLeave: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/hr/leaves/${id}`, data);
            await get().fetchLeaves();
            set({ loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    deleteLeave: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/hr/leaves/${id}`);
            await get().fetchLeaves();
            set({ loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    approveLeave: async (id) => {
        try {
            await axios.patch(`${API_BASE}/api/hr/leaves/${id}/approve`);
            await get().fetchLeaves();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    refuseLeave: async (id) => {
        try {
            await axios.patch(`${API_BASE}/api/hr/leaves/${id}/refuse`);
            await get().fetchLeaves();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    fetchLeaveTypes: async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/hr/leave-types`);
            set({ leaveTypes: res.data });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    createLeaveType: async (data) => {
        try {
            const res = await axios.post(`${API_BASE}/api/hr/leave-types`, data);
            await get().fetchLeaveTypes();
            return res.data;
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    updateLeaveType: async (id, data) => {
        try {
            await axios.put(`${API_BASE}/api/hr/leave-types/${id}`, data);
            await get().fetchLeaveTypes();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteLeaveType: async (id) => {
        try {
            await axios.delete(`${API_BASE}/api/hr/leave-types/${id}`);
            await get().fetchLeaveTypes();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    fetchAllocations: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/hr/leave-allocations?limit=200`);
            const payload = res.data;
            set({ allocations: payload.data || payload, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    createAllocation: async (data) => {
        try {
            const res = await axios.post(`${API_BASE}/api/hr/leave-allocations`, data);
            await get().fetchAllocations();
            return res.data;
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    updateAllocation: async (id, data) => {
        try {
            await axios.put(`${API_BASE}/api/hr/leave-allocations/${id}`, data);
            await get().fetchAllocations();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    approveAllocation: async (id) => {
        try {
            await axios.patch(`${API_BASE}/api/hr/leave-allocations/${id}/approve`);
            await get().fetchAllocations();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    refuseAllocation: async (id) => {
        try {
            await axios.patch(`${API_BASE}/api/hr/leave-allocations/${id}/refuse`);
            await get().fetchAllocations();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteAllocation: async (id) => {
        try {
            await axios.delete(`${API_BASE}/api/hr/leave-allocations/${id}`);
            await get().fetchAllocations();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    fetchBalance: async (employeeId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/hr/leave-balance/${employeeId}`);
            set({ balances: res.data });
        } catch (err: any) {
            set({ error: err.message });
        }
    },
}));

export default useLeavesStore;
