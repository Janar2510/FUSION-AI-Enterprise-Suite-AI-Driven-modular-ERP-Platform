import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface EventRegistration {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string; // draft, confirmed, attended, cancelled
    eventId: number;
    partnerId: number | null;
}

export interface EventEvent {
    id: number;
    name: string;
    description: string | null;
    dateBegin: string;
    dateEnd: string;
    location: string | null;
    seatsMax: number;
    seatsAvailable: number;
    active: boolean;
    _count?: { registrations: number };
    registrations?: EventRegistration[];
}

interface EventsStore {
    events: EventEvent[];
    loading: boolean;
    error: string | null;

    fetchEvents: () => Promise<void>;
    createEvent: (data: Partial<EventEvent>) => Promise<EventEvent | undefined>;
    updateEvent: (id: number, data: Partial<EventEvent>) => Promise<void>;
    deleteEvent: (id: number) => Promise<void>;
}

export const useEventsStore = create<EventsStore>((set, get) => ({
    events: [],
    loading: false,
    error: null,

    fetchEvents: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/events?limit=1000`);
            set({ events: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createEvent: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/events`, data);
            await get().fetchEvents();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateEvent: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/events/${id}`, data);
            await get().fetchEvents();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    deleteEvent: async (id) => {
        try {
            set({ loading: true, error: null });
            await axios.delete(`${API_BASE}/api/events/${id}`);
            await get().fetchEvents();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useEventsStore;
