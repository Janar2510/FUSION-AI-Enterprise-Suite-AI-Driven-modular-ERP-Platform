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

function errMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    type AxiosLike = {
      response?: { data?: { error?: string; message?: string } };
      message?: string;
    };
    const ae = err as AxiosLike;
    const d = ae.response?.data;
    return d?.error ?? d?.message ?? String(ae.message ?? err);
  }
  return String(err instanceof Error ? err.message : err);
}

export const useStudioStore = create<StudioState>((set, get) => ({
  pages: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<StudioPage[]>('/studio/pages');
      const list = Array.isArray(data)
        ? data
        : (data as { data?: StudioPage[] })?.data ?? [];
      set({ pages: list, loading: false });
    } catch (e) {
      set({ loading: false, error: errMessage(e) });
    }
  },

  create: async (data) => {
    try {
      const { data: result } = await api.post<StudioPage>('/studio/pages', data);
      if (result) {
        set(s => ({ pages: [...s.pages, result], error: null }));
        return result;
      }
    } catch (e) {
      set({ error: errMessage(e) });
    }
    return null;
  },

  update: async (id, data) => {
    try {
      const { data: result } = await api.patch<StudioPage>(`/studio/pages/${id}`, data);
      if (result) {
        set(s => ({ pages: s.pages.map(p => (p.id === id ? result : p)), error: null }));
        return true;
      }
    } catch (e) {
      set({ error: errMessage(e) });
    }
    return false;
  },

  remove: async (id) => {
    try {
      await api.delete(`/studio/pages/${id}`);
      set(s => ({ pages: s.pages.filter(p => p.id !== id), error: null }));
      return true;
    } catch (e) {
      set({ error: errMessage(e) });
      return false;
    }
  },

  publish: async (id) => {
    return get().update(id, { state: 'published' });
  },
}));
