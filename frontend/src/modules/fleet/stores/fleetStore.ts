import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface FleetVehicleLog {
    id: number;
    date: string;
    type: string;
    description: string | null;
    amount: number;
    odometer: number;
    vehicleId: number;
}

export interface FleetVehicle {
    id: number;
    name: string;
    licensePlate: string | null;
    model: string | null;
    brand: string | null;
    color: string | null;
    fuelType: string | null;
    odometer: number;
    state: string; // active, inactive
    logs?: FleetVehicleLog[];
    _count?: { logs: number };
}

interface FleetStore {
    vehicles: FleetVehicle[];
    loading: boolean;
    error: string | null;

    fetchVehicles: () => Promise<void>;
    createVehicle: (data: Partial<FleetVehicle>) => Promise<FleetVehicle | undefined>;
    updateVehicle: (id: number, data: Partial<FleetVehicle>) => Promise<void>;
    addVehicleLog: (vehicleId: number, data: Partial<FleetVehicleLog>) => Promise<void>;
}

export const useFleetStore = create<FleetStore>((set, get) => ({
    vehicles: [],
    loading: false,
    error: null,

    fetchVehicles: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API_BASE}/api/fleet/vehicles?limit=1000`);
            set({ vehicles: res.data.data, loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    createVehicle: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await axios.post(`${API_BASE}/api/fleet/vehicles`, data);
            await get().fetchVehicles();
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    updateVehicle: async (id, data) => {
        try {
            set({ loading: true, error: null });
            await axios.put(`${API_BASE}/api/fleet/vehicles/${id}`, data);
            await get().fetchVehicles();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    },

    addVehicleLog: async (vehicleId, data) => {
        try {
            set({ loading: true, error: null });
            await axios.post(`${API_BASE}/api/fleet/vehicles/${vehicleId}/logs`, data);
            await get().fetchVehicles();
            set({ loading: false });
        } catch (err: any) {
            console.error(err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useFleetStore;
