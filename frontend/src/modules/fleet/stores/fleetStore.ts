import { create } from 'zustand';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export interface FleetVehicleLog {
    id: number;
    date: string;
    type: string;
    description: string | null;
    amount: number;
    odometer: number;
    vehicleId: number;
}

export interface FleetContract {
    id: number;
    name: string;
    state: string;
    contractType: string;
    startDate: string;
    expirationDate: string | null;
    costPerMonth: number;
    insurer: string | null;
    notes: string | null;
    vehicleId: number;
    vehicle?: { id: number; name: string };
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
    state: string;
    logs?: FleetVehicleLog[];
    contracts?: FleetContract[];
    _count?: { logs: number; contracts: number };
}

export interface FleetAnalytics {
    totalVehicles: number;
    totalCost: number;
    last30DaysCost: number;
    costByType: { type: string; total: number; count: number }[];
    expiringContracts: FleetContract[];
}

interface FleetStore {
    vehicles: FleetVehicle[];
    contracts: FleetContract[];
    analytics: FleetAnalytics | null;
    loading: boolean;
    error: string | null;

    fetchVehicles: () => Promise<void>;
    createVehicle: (d: Partial<FleetVehicle>) => Promise<FleetVehicle | undefined>;
    updateVehicle: (id: number, d: Partial<FleetVehicle>) => Promise<void>;
    deleteVehicle: (id: number) => Promise<void>;

    addVehicleLog: (vehicleId: number, d: Partial<FleetVehicleLog>) => Promise<void>;

    fetchContracts: () => Promise<void>;
    createContract: (d: Partial<FleetContract>) => Promise<FleetContract | undefined>;
    updateContract: (id: number, d: Partial<FleetContract>) => Promise<void>;
    deleteContract: (id: number) => Promise<void>;

    fetchAnalytics: () => Promise<void>;
}

export const useFleetStore = create<FleetStore>((set, get) => ({
    vehicles: [],
    contracts: [],
    analytics: null,
    loading: false,
    error: null,

    fetchVehicles: async () => {
        try {
            set({ loading: true, error: null });
            const res = await axios.get(`${API}/api/fleet/vehicles?limit=1000`);
            set({ vehicles: res.data.data || res.data, loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    createVehicle: async (d) => {
        try {
            set({ loading: true });
            const res = await axios.post(`${API}/api/fleet/vehicles`, d);
            await get().fetchVehicles();
            set({ loading: false });
            return res.data;
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    updateVehicle: async (id, d) => {
        try {
            set({ loading: true });
            await axios.put(`${API}/api/fleet/vehicles/${id}`, d);
            await get().fetchVehicles();
            set({ loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    deleteVehicle: async (id) => {
        try {
            set({ loading: true });
            await axios.delete(`${API}/api/fleet/vehicles/${id}`);
            await get().fetchVehicles();
            set({ loading: false });
        } catch (e: any) { set({ error: e.message, loading: false }); }
    },

    addVehicleLog: async (vehicleId, d) => {
        try {
            await axios.post(`${API}/api/fleet/vehicles/${vehicleId}/logs`, d);
            await get().fetchVehicles();
        } catch (e: any) { set({ error: e.message }); }
    },

    fetchContracts: async () => {
        try {
            const res = await axios.get(`${API}/api/fleet/contracts?limit=200`);
            set({ contracts: res.data.data || res.data });
        } catch (e: any) { set({ error: e.message }); }
    },

    createContract: async (d) => {
        try {
            const res = await axios.post(`${API}/api/fleet/contracts`, d);
            await get().fetchContracts();
            return res.data;
        } catch (e: any) { set({ error: e.message }); }
    },

    updateContract: async (id, d) => {
        try {
            await axios.put(`${API}/api/fleet/contracts/${id}`, d);
            await get().fetchContracts();
        } catch (e: any) { set({ error: e.message }); }
    },

    deleteContract: async (id) => {
        try {
            await axios.delete(`${API}/api/fleet/contracts/${id}`);
            await get().fetchContracts();
        } catch (e: any) { set({ error: e.message }); }
    },

    fetchAnalytics: async () => {
        try {
            const res = await axios.get(`${API}/api/fleet/analytics`);
            set({ analytics: res.data });
        } catch (e: any) { set({ error: e.message }); }
    },
}));

export default useFleetStore;
