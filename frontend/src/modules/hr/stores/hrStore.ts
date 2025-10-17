import { create } from 'zustand';
import api from '@/lib/api';

interface DashboardMetrics {
  total_employees: number;
  new_hires: number;
  on_leave: number;
  attendance_rate: number;
  open_positions: number;
  training_hours: number;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  hire_date: string;
  status: string;
  salary?: number;
}

interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  check_in: string;
  check_out: string;
  hours_worked: number;
  status: string;
}

interface HRStore {
  // State
  dashboardMetrics: DashboardMetrics | null;
  employees: Employee[] | null;
  attendance: Attendance[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboardMetrics: (period_days?: number) => Promise<void>;
  fetchEmployees: () => Promise<void>;
  fetchAttendance: () => Promise<void>;
  createEmployee: (employeeData: any) => Promise<void>;
  updateEmployee: (id: number, employeeData: any) => Promise<void>;
  deleteEmployee: (id: number) => Promise<void>;
}

export const useHRStore = create<HRStore>((set, get) => ({
  // Initial state
  dashboardMetrics: null,
  employees: null,
  attendance: null,
  loading: false,
  error: null,
  
  // Actions
  fetchDashboardMetrics: async (period_days = 30) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/api/v1/hr/dashboard?period_days=${period_days}`);
      set({ 
        dashboardMetrics: response.data.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch dashboard metrics',
        loading: false 
      });
    }
  },
  
  fetchEmployees: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/hr/employees');
      set({ employees: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch employees',
        loading: false 
      });
    }
  },
  
  fetchAttendance: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/hr/attendance');
      set({ attendance: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch attendance',
        loading: false 
      });
    }
  },
  
  createEmployee: async (employeeData: any) => {
    try {
      set({ loading: true, error: null });
      await api.post('/api/v1/hr/employees', employeeData);
      await get().fetchDashboardMetrics();
      await get().fetchEmployees();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create employee',
        loading: false 
      });
    }
  },
  
  updateEmployee: async (id: number, employeeData: any) => {
    try {
      set({ loading: true, error: null });
      await api.put(`/api/v1/hr/employees/${id}`, employeeData);
      await get().fetchDashboardMetrics();
      await get().fetchEmployees();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update employee',
        loading: false 
      });
    }
  },
  
  deleteEmployee: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/api/v1/hr/employees/${id}`);
      await get().fetchDashboardMetrics();
      await get().fetchEmployees();
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to delete employee',
        loading: false 
      });
    }
  },
}));