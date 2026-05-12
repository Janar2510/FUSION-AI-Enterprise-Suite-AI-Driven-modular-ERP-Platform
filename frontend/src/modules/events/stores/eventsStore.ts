import { create } from 'zustand';
import { eventsApi } from '@/lib/api';

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
    /** Workflow / list filter stage when provided by API */
    state?: string;
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
            const res = await eventsApi.list({ limit: 1000 });
            set({ events: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createEvent: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await eventsApi.create(data);
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
            await eventsApi.update(id, data);
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
            await eventsApi.delete(id);
            await get().fetchEvents();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useEventsStore;
