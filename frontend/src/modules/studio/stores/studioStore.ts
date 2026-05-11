import { create } from 'zustand';
import { api } from '@/lib/api';

export interface StudioPage {
  id: number;
  name: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  state: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudioState {
  pages: StudioPage[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  create: (data: Partial<StudioPage>) => Promise<StudioPage | null>;
  update: (id: number, data: Partial<StudioPage>) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
  publish: (id: number) => Promise<boolean>;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  pages: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await api.get<StudioPage[]>('/studio/pages');
    if (error) {
      set({ loading: false, error });
    } else {
      set({ pages: data || [], loading: false });
    }
  },

  create: async (data) => {
    const { data: result, error } = await api.post<StudioPage>('/studio/pages', data);
    if (!error && result) {
      set(s => ({ pages: [...s.pages, result] }));
      return result;
    }
    return null;
  },

  update: async (id, data) => {
    const { data: result, error } = await api.patch<StudioPage>(`/studio/pages/${id}`, data);
    if (!error && result) {
      set(s => ({ pages: s.pages.map(p => p.id === id ? result : p) }));
      return true;
    }
    return false;
  },

  remove: async (id) => {
    const { error } = await api.delete(`/studio/pages/${id}`);
    if (!error) {
      set(s => ({ pages: s.pages.filter(p => p.id !== id) }));
      return true;
    }
    return false;
  },

  publish: async (id) => {
    return get().update(id, { state: 'published' });
  },
}));
