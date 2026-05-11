import { create } from 'zustand';
import { notesApi } from '@/lib/api';

export interface Note {
    id: number;
    name: string;
    body: string | null;
    stage: string; // new, in_progress, done
    color: number;
    sequence: number;
    tags: string[];
}

interface NotesStore {
    notes: Note[];
    loading: boolean;
    error: string | null;

    fetchNotes: () => Promise<void>;
    createNote: (data: Partial<Note>) => Promise<Note | undefined>;
    updateNote: (id: number, data: Partial<Note>) => Promise<void>;
    deleteNote: (id: number) => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
    notes: [],
    loading: false,
    error: null,

    fetchNotes: async () => {
        try {
            set({ loading: true, error: null });
            const res = await notesApi.list();
            set({ notes: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createNote: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await notesApi.create(data);
            await get().fetchNotes();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateNote: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await notesApi.update(id, data);
            await get().fetchNotes();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deleteNote: async (id) => {
        try {
            set({ loading: true, error: null });
            await notesApi.delete(id);
            await get().fetchNotes();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useNotesStore;
