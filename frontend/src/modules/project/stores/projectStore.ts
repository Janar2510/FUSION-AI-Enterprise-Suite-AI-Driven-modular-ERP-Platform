import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface ProjectStage {
  id: number;
  name: string;
  sequence: number;
  foldedKanban: boolean;
}

export interface ProjectProject {
  id: number;
  name: string;
  description?: string | null;
  color: number;
  active: boolean;
  dateStart?: string | null;
  date?: string | null;
  taskCount: number;
  _count?: { tasks: number };
}

export interface ProjectTask {
  id: number;
  name: string;
  description?: string | null;
  priority: number;
  sequence: number;
  color: number;
  active: boolean;
  dateDeadline?: string | null;
  dateEnd?: string | null;
  kanbanState: string;
  stageId: number;
  stage?: ProjectStage;
  projectId: number;
  project?: ProjectProject;
  parentId?: number | null;
}

interface ProjectStore {
  projects: ProjectProject[];
  tasks: ProjectTask[];
  stages: ProjectStage[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchStages: () => Promise<void>;
  fetchTasks: (projectId: number) => Promise<void>;
  createProject: (data: Partial<ProjectProject>) => Promise<ProjectProject | undefined>;
  updateProject: (id: number, data: Partial<ProjectProject>) => Promise<void>;
  createTask: (projectId: number, data: Partial<ProjectTask>) => Promise<ProjectTask | undefined>;
  updateTaskStage: (id: number, stageId: number, projectId: number) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  tasks: [],
  stages: [],
  loading: false,
  error: null,

  fetchStages: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/projects/stages`);
      set({ stages: res.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchProjects: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/projects?limit=500`);
      set({ projects: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  fetchTasks: async (projectId: number) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`${API_BASE}/api/projects/${projectId}/tasks?limit=1000`);
      set({ tasks: res.data.data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createProject: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/projects`, data);
      await get().fetchProjects();
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  updateProject: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`${API_BASE}/api/projects/${id}`, data);
      await get().fetchProjects();
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  createTask: async (projectId, data) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/api/projects/${projectId}/tasks`, data);
      await get().fetchTasks(projectId);
      set({ loading: false });
      return res.data;
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  },

  updateTaskStage: async (id, stageId, projectId) => {
    try {
      set({ loading: true, error: null });
      await axios.patch(`${API_BASE}/api/projects/tasks/${id}/stage`, { stageId });
      await get().fetchTasks(projectId);
      set({ loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, loading: false });
    }
  }
}));

export default useProjectStore;