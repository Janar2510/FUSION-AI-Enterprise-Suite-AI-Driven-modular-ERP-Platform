import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../../../lib/api';

export interface Widget {
  id: number;
  title: string;
  description?: string;
  widget_type: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  data_source?: string;
  refresh_interval: number;
  theme: string;
  color_scheme: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
  data?: any;
  loading?: boolean;
  error?: string;
}

export interface AIInsight {
  id: number;
  widget_id?: number;
  title: string;
  content: string;
  insight_type: string;
  confidence_score: number;
  data_period?: string;
  metrics: Record<string, any>;
  recommendations: string[];
  model_used?: string;
  is_active: boolean;
  is_acknowledged: boolean;
  priority: string;
  generated_at: string;
  expires_at?: string;
  acknowledged_at?: string;
}

export interface DashboardData {
  widgets: Widget[];
  insights: AIInsight[];
  layout?: Record<string, any>;
  analytics?: Record<string, any>;
}

export interface DashboardState {
  // Data
  dashboardData: DashboardData;
  selectedWidget: Widget | null;
  isEditMode: boolean;
  showInsights: boolean;
  isFullscreen: boolean;
  
  // UI State
  loading: boolean;
  error: string | null;
  showWidgetCreator: boolean;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  addWidget: (widget: Widget) => void;
  updateWidget: (widgetId: number, updates: Partial<Widget>) => void;
  deleteWidget: (widgetId: number) => Promise<void>;
  refreshWidget: (widgetId: number) => Promise<void>;
  refreshAllWidgets: () => Promise<void>;
  
  // Layout Actions
  updateWidgetLayout: (widgetId: number, position: { x: number; y: number; width: number; height: number }) => Promise<void>;
  handleLayoutChange: (layout: any[]) => Promise<void>;
  
  // UI Actions
  setSelectedWidget: (widget: Widget | null) => void;
  setEditMode: (enabled: boolean) => void;
  setShowInsights: (show: boolean) => void;
  setFullscreen: (enabled: boolean) => void;
  setShowWidgetCreator: (show: boolean) => void;
  
  // AI Actions
  generateInsights: () => Promise<void>;
  acknowledgeInsight: (insightId: number) => Promise<void>;
  
  // Analytics Actions
  addAnalyticsData: (widgetId: number, metricName: string, metricValue: number, context?: Record<string, any>) => Promise<void>;
  getWidgetAnalytics: (widgetId: number, hours?: number) => Promise<any>;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Initial State
      dashboardData: { widgets: [], insights: [] },
      selectedWidget: null,
      isEditMode: false,
      showInsights: true,
      isFullscreen: false,
      loading: false,
      error: null,
      showWidgetCreator: false,

      // Data Actions
      fetchDashboardData: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.get('/dashboard/');
          set({ 
            dashboardData: response.data, 
            loading: false 
          });
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
          set({ 
            error: 'Failed to load dashboard data', 
            loading: false 
          });
        }
      },

      addWidget: (widget: Widget) => {
        set((state) => ({
          dashboardData: {
            ...state.dashboardData,
            widgets: [...state.dashboardData.widgets, widget]
          }
        }));
      },

      updateWidget: (widgetId: number, updates: Partial<Widget>) => {
        set((state) => ({
          dashboardData: {
            ...state.dashboardData,
            widgets: state.dashboardData.widgets.map(widget =>
              widget.id === widgetId ? { ...widget, ...updates } : widget
            )
          }
        }));
      },

      deleteWidget: async (widgetId: number) => {
        try {
          await api.delete(`/dashboard/widgets/${widgetId}`);
          set((state) => ({
            dashboardData: {
              ...state.dashboardData,
              widgets: state.dashboardData.widgets.filter(w => w.id !== widgetId)
            }
          }));
        } catch (error) {
          console.error('Failed to delete widget:', error);
          set({ error: 'Failed to delete widget' });
        }
      },

      refreshWidget: async (widgetId: number) => {
        set((state) => ({
          dashboardData: {
            ...state.dashboardData,
            widgets: state.dashboardData.widgets.map(widget =>
              widget.id === widgetId ? { ...widget, loading: true } : widget
            )
          }
        }));

        try {
          const response = await api.get(`/dashboard/analytics/${widgetId}`);
          set((state) => ({
            dashboardData: {
              ...state.dashboardData,
              widgets: state.dashboardData.widgets.map(widget =>
                widget.id === widgetId 
                  ? { ...widget, data: response.data, loading: false, error: null }
                  : widget
              )
            }
          }));
        } catch (error) {
          console.error(`Failed to refresh widget ${widgetId}:`, error);
          set((state) => ({
            dashboardData: {
              ...state.dashboardData,
              widgets: state.dashboardData.widgets.map(widget =>
                widget.id === widgetId 
                  ? { ...widget, loading: false, error: 'Failed to load data' }
                  : widget
              )
            }
          }));
        }
      },

      refreshAllWidgets: async () => {
        const { dashboardData } = get();
        const refreshPromises = dashboardData.widgets.map(widget => 
          get().refreshWidget(widget.id)
        );
        await Promise.all(refreshPromises);
      },

      // Layout Actions
      updateWidgetLayout: async (widgetId: number, position: { x: number; y: number; width: number; height: number }) => {
        try {
          await api.put(`/dashboard/widgets/${widgetId}`, {
            position_x: position.x,
            position_y: position.y,
            width: position.width,
            height: position.height
          });
          
          set((state) => ({
            dashboardData: {
              ...state.dashboardData,
              widgets: state.dashboardData.widgets.map(widget =>
                widget.id === widgetId 
                  ? { 
                      ...widget, 
                      position: {
                        ...widget.position,
                        ...position
                      }
                    }
                  : widget
              )
            }
          }));
        } catch (error) {
          console.error(`Failed to update widget layout ${widgetId}:`, error);
        }
      },

      handleLayoutChange: async (layout: any[]) => {
        const { updateWidgetLayout } = get();
        
        // Update all widgets with new positions
        for (const item of layout) {
          await updateWidgetLayout(parseInt(item.i), {
            x: item.x,
            y: item.y,
            width: item.w,
            height: item.h
          });
        }
      },

      // UI Actions
      setSelectedWidget: (widget: Widget | null) => {
        set({ selectedWidget: widget });
      },

      setEditMode: (enabled: boolean) => {
        set({ isEditMode: enabled });
      },

      setShowInsights: (show: boolean) => {
        set({ showInsights: show });
      },

      setFullscreen: (enabled: boolean) => {
        set({ isFullscreen: enabled });
      },

      setShowWidgetCreator: (show: boolean) => {
        set({ showWidgetCreator: show });
      },

      // AI Actions
      generateInsights: async () => {
        try {
          await api.post('/dashboard/generate-insights');
          await get().fetchDashboardData();
        } catch (error) {
          console.error('Failed to generate insights:', error);
          set({ error: 'Failed to generate insights' });
        }
      },

      acknowledgeInsight: async (insightId: number) => {
        try {
          await api.put(`/dashboard/insights/${insightId}/acknowledge`);
          set((state) => ({
            dashboardData: {
              ...state.dashboardData,
              insights: state.dashboardData.insights.map(insight =>
                insight.id === insightId 
                  ? { ...insight, is_acknowledged: true, acknowledged_at: new Date().toISOString() }
                  : insight
              )
            }
          }));
        } catch (error) {
          console.error(`Failed to acknowledge insight ${insightId}:`, error);
        }
      },

      // Analytics Actions
      addAnalyticsData: async (widgetId: number, metricName: string, metricValue: number, context?: Record<string, any>) => {
        try {
          await api.post(`/dashboard/analytics/${widgetId}`, {
            metric_name: metricName,
            metric_value: metricValue,
            context: context
          });
        } catch (error) {
          console.error(`Failed to add analytics data for widget ${widgetId}:`, error);
        }
      },

      getWidgetAnalytics: async (widgetId: number, hours: number = 24) => {
        try {
          const response = await api.get(`/dashboard/analytics/${widgetId}?hours=${hours}`);
          return response.data;
        } catch (error) {
          console.error(`Failed to get analytics for widget ${widgetId}:`, error);
          throw error;
        }
      }
    }),
    {
      name: 'dashboard-store',
    }
  )
);




