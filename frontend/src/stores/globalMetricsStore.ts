import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface GlobalMetrics {
  // CRM Metrics
  total_contacts: number;
  qualified_leads: number;
  pipeline_value: number;
  win_rate: number;
  contacts_growth: number;
  leads_growth: number;
  pipeline_growth: number;
  win_rate_change: number;
  
  // Financial Metrics
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  revenue_growth: number;
  
  // Inventory Metrics
  low_stock_items: number;
  total_inventory_value: number;
  inventory_turnover: number;
  
  // Project Metrics
  active_projects: number;
  project_completion_rate: number;
  projects_on_time: number;
  
  // Sales Metrics
  current_month_sales: number;
  sales_growth: number;
  customer_acquisition: number;
}

interface GlobalMetricsState {
  metrics: GlobalMetrics | null;
  loading: boolean;
  error: string | null;
  
  fetchGlobalMetrics: () => Promise<void>;
  fetchModuleMetrics: (moduleName: string) => Promise<void>;
}

const API_BASE = '/dashboard';

export const useGlobalMetricsStore = create<GlobalMetricsState>()(
  subscribeWithSelector((set, get) => ({
    metrics: null,
    loading: false,
    error: null,

    fetchGlobalMetrics: async () => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/global-metrics`);
        if (!response.ok) throw new Error('Failed to fetch global metrics');
        
        const data = await response.json();
        set({ 
          metrics: data.data,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    },

    fetchModuleMetrics: async (moduleName: string) => {
      set({ loading: true, error: null });
      try {
        // For now, we'll use the global metrics endpoint and filter on the frontend
        // In the future, we might want a specific endpoint for module metrics
        const response = await fetch(`${API_BASE}/global-metrics`);
        if (!response.ok) throw new Error('Failed to fetch module metrics');
        
        const data = await response.json();
        set({ 
          metrics: data.data,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        });
      }
    }
  }))
);