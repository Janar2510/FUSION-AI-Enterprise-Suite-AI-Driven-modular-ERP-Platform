import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface HrDepartment {
  id: number;
  name: string;
  active: boolean;
  parentId?: number | null;
  managerId?: number | null;
  manager?: HrEmployee | null;
  _count?: {
    employees: number;
  };
}

export interface HrJob {
  id: number;
  name: string;
  description?: string | null;
  expectedEmployees: number;
  noOfEmployee: number;
  state: string; // recruit, open
  _count?: {
    employees: number;
  };
}

export interface HrEmployee {
  id: number;
  name: string;
  employeeNumber?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  departmentId?: number | null;
  department?: HrDepartment | null;
  jobId?: number | null;
  job?: HrJob | null;
  managerId?: number | null;
  manager?: HrEmployee | null;
  coachId?: number | null;
  coach?: HrEmployee | null;
  active: boolean;
}

export interface HrEmployeePrivate {
  id: number;
  privateInfo: string | null;
  ssnLast4: string | null;
  maritalStatus: string | null;
  dependents: number | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  bankAccount: string | null;
  notes: string | null;
}

interface HRStore {
  employees: HrEmployee[];
  departments: HrDepartment[];
  jobs: HrJob[];
  employeePrivate: HrEmployeePrivate | null;
  loading: boolean;
  error: string | null;

  fetchEmployees: (departmentId?: number) => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchJobs: () => Promise<void>;
  createEmployee: (data: Partial<HrEmployee>) => Promise<HrEmployee | undefined>;
  updateEmployee: (id: number, data: Partial<HrEmployee>) => Promise<void>;
  createDepartment: (data: Partial<HrDepartment>) => Promise<HrDepartment | undefined>;
  fetchEmployeePrivate: (id: number) => Promise<HrEmployeePrivate | null>;
  updateEmployeePrivate: (id: number, data: Partial<HrEmployeePrivate>) => Promise<void>;
}

export const useHRStore = create<HRStore>((set, get) => ({
  employees: [],
  departments: [],
  jobs: [],
  employeePrivate: null,
  loading: false,
  error: null,

  fetchEmployees: async (departmentId?: number) => {
    try {
      set({ loading: true, error: null });
      const url = departmentId
        ? `${API_BASE}/api/hr/employees?limit=500&department_id=${departmentId}`
        : `${API_BASE}/api/hr/employees?limit=500`;
      const res = await axios.get(url);
      set({ employees: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchDepartments: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/hr/departments`);
      set({ departments: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchJobs: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/hr/jobs`);
      set({ jobs: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createEmployee: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/hr/employees`, data);
      await get().fetchEmployees();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  updateEmployee: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`${API_BASE}/api/hr/employees/${id}`, data);
      await get().fetchEmployees();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createDepartment: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/hr/departments`, data);
      await get().fetchDepartments();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchEmployeePrivate: async (id) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/hr/employees/${id}/private`);
      set({ employeePrivate: res.data, loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
      return null;
    }
  },

  updateEmployeePrivate: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.put(`${API_BASE}/api/hr/employees/${id}/private`, data);
      set({ employeePrivate: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  }
}
}));

export default useHRStore;