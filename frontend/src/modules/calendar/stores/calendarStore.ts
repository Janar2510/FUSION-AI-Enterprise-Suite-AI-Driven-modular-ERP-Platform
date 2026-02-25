import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface CalendarAttendee {
    id: number;
    status: string; // needsAction, accepted, declined, tentative
    eventId: number;
    partnerId: number;
    partner?: { id: number, name: string, email: string | null };
}

export interface CalendarEvent {
    id: number;
    name: string;
    start: string;
    stop: string;
    allday: boolean;
    location: string | null;
    description: string | null;
    attendees?: CalendarAttendee[];
}

interface CalendarStore {
    events: CalendarEvent[];
    loading: boolean;
    error: string | null;

    fetchEvents: () => Promise<void>;
    createEvent: (data: Partial<CalendarEvent>) => Promise<CalendarEvent | undefined>;
    updateEvent: (id: number, data: Partial<CalendarEvent>) => Promise<void>;
    deleteEvent: (id: number) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
    events: [],
    loading: false,
    error: null,

    fetchEvents: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/calendar`);
            set({ events: res.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createEvent: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/calendar`, data);
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
            await axios.put(`${API_BASE}/api/calendar/${id}`, data);
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
            await axios.delete(`${API_BASE}/api/calendar/${id}`);
            await get().fetchEvents();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useCalendarStore;
