import { create } from 'zustand';
import { api } from '@/lib/api';
import {
  Project,
  ProjectTask,
  ProjectTimeEntry,
  ProjectAnalytics,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectTaskCreateRequest,
  ProjectTaskUpdateRequest,
  ProjectTimeEntryCreateRequest,
  ProjectTimeEntryUpdateRequest,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  ProjectType
} from '../types';

interface ProjectState {
  // Dashboard and Analytics
  dashboardMetrics: any;
  analytics: ProjectAnalytics | null;
  
  // Projects
  projects: Project[];
  selectedProject: Project | null;
  
  // Tasks
  tasks: ProjectTask[];
  selectedTask: ProjectTask | null;
  
  // Time Entries
  timeEntries: ProjectTimeEntry[];
  
  // Loading and Error States
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardMetrics: () => Promise<void>;
  fetchAnalytics: (periodDays?: number) => Promise<void>;
  
  // Project Actions
  fetchProjects: (params?: {
    page?: number;
    limit?: number;
    status?: ProjectStatus;
    project_type?: ProjectType;
    project_manager_id?: number;
    search?: string;
  }) => Promise<void>;
  createProject: (data: ProjectCreateRequest) => Promise<Project | null>;
  updateProject: (id: number, data: ProjectUpdateRequest) => Promise<Project | null>;
  deleteProject: (id: number) => Promise<boolean>;
  getProject: (id: number) => Promise<Project | null>;
  
  // Task Actions
  fetchTasks: (params?: {
    project_id?: number;
    page?: number;
    limit?: number;
    status?: TaskStatus;
    assigned_to_id?: number;
    search?: string;
  }) => Promise<void>;
  createTask: (data: ProjectTaskCreateRequest) => Promise<ProjectTask | null>;
  updateTask: (id: number, data: ProjectTaskUpdateRequest) => Promise<ProjectTask | null>;
  deleteTask: (id: number) => Promise<boolean>;
  getTask: (id: number) => Promise<ProjectTask | null>;
  
  // Time Entry Actions
  fetchTimeEntries: (params?: {
    project_id?: number;
    task_id?: number;
    employee_id?: number;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createTimeEntry: (data: ProjectTimeEntryCreateRequest) => Promise<ProjectTimeEntry | null>;
  updateTimeEntry: (id: number, data: ProjectTimeEntryUpdateRequest) => Promise<ProjectTimeEntry | null>;
  deleteTimeEntry: (id: number) => Promise<boolean>;
  
  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial State
  dashboardMetrics: null,
  analytics: null,
  projects: [],
  selectedProject: null,
  tasks: [],
  selectedTask: null,
  timeEntries: [],
  loading: false,
  error: null,

  // Dashboard and Analytics Actions
  fetchDashboardMetrics: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/project/dashboard');
      set({ dashboardMetrics: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch dashboard metrics',
        loading: false 
      });
    }
  },

  fetchAnalytics: async (periodDays = 30) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/api/v1/project/analytics?period_days=${periodDays}`);
      set({ analytics: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch analytics',
        loading: false 
      });
    }
  },

  // Project Actions
  fetchProjects: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/v1/project/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      set({ projects: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch projects',
        loading: false 
      });
    }
  },

  createProject: async (data: ProjectCreateRequest) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/api/v1/project/projects', data);
      const newProject = response.data.data;
      
      set(state => ({
        projects: [newProject, ...state.projects],
        loading: false
      }));
      
      return newProject;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create project',
        loading: false 
      });
      return null;
    }
  },

  updateProject: async (id: number, data: ProjectUpdateRequest) => {
    try {
      set({ loading: true, error: null });
      const response = await api.put(`/api/v1/project/projects/${id}`, data);
      const updatedProject = response.data.data;
      
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p),
        selectedProject: state.selectedProject?.id === id ? updatedProject : state.selectedProject,
        loading: false
      }));
      
      return updatedProject;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update project',
        loading: false 
      });
      return null;
    }
  },

  deleteProject: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/api/v1/project/projects/${id}`);
      
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
        loading: false
      }));
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to delete project',
        loading: false 
      });
      return false;
    }
  },

  getProject: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/api/v1/project/projects/${id}`);
      const project = response.data.data;
      
      set({ selectedProject: project, loading: false });
      return project;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch project',
        loading: false 
      });
      return null;
    }
  },

  // Task Actions
  fetchTasks: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/v1/project/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      set({ tasks: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch tasks',
        loading: false 
      });
    }
  },

  createTask: async (data: ProjectTaskCreateRequest) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/api/v1/project/tasks', data);
      const newTask = response.data.data;
      
      set(state => ({
        tasks: [newTask, ...state.tasks],
        loading: false
      }));
      
      return newTask;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create task',
        loading: false 
      });
      return null;
    }
  },

  updateTask: async (id: number, data: ProjectTaskUpdateRequest) => {
    try {
      set({ loading: true, error: null });
      const response = await api.put(`/api/v1/project/tasks/${id}`, data);
      const updatedTask = response.data.data;
      
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
        loading: false
      }));
      
      return updatedTask;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update task',
        loading: false 
      });
      return null;
    }
  },

  deleteTask: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/api/v1/project/tasks/${id}`);
      
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        loading: false
      }));
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to delete task',
        loading: false 
      });
      return false;
    }
  },

  getTask: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/api/v1/project/tasks/${id}`);
      const task = response.data.data;
      
      set({ selectedTask: task, loading: false });
      return task;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch task',
        loading: false 
      });
      return null;
    }
  },

  // Time Entry Actions
  fetchTimeEntries: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/v1/project/time-entries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      set({ timeEntries: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch time entries',
        loading: false 
      });
    }
  },

  createTimeEntry: async (data: ProjectTimeEntryCreateRequest) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/api/v1/project/time-entries', data);
      const newTimeEntry = response.data.data;
      
      set(state => ({
        timeEntries: [newTimeEntry, ...state.timeEntries],
        loading: false
      }));
      
      return newTimeEntry;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create time entry',
        loading: false 
      });
      return null;
    }
  },

  updateTimeEntry: async (id: number, data: ProjectTimeEntryUpdateRequest) => {
    try {
      set({ loading: true, error: null });
      const response = await api.put(`/api/v1/project/time-entries/${id}`, data);
      const updatedTimeEntry = response.data.data;
      
      set(state => ({
        timeEntries: state.timeEntries.map(te => te.id === id ? updatedTimeEntry : te),
        loading: false
      }));
      
      return updatedTimeEntry;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update time entry',
        loading: false 
      });
      return null;
    }
  },

  deleteTimeEntry: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/api/v1/project/time-entries/${id}`);
      
      set(state => ({
        timeEntries: state.timeEntries.filter(te => te.id !== id),
        loading: false
      }));
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to delete time entry',
        loading: false 
      });
      return false;
    }
  },

  // Utility Actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));