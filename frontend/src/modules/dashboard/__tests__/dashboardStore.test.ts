import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../stores/dashboardStore';
import { api } from '../../../lib/api';

// Mock the API
vi.mock('../../../lib/api');

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

(api as any) = mockApi;

const mockWidget = {
  id: 1,
  title: 'Test Widget',
  description: 'Test Description',
  widget_type: 'kpi',
  position: { x: 0, y: 0, width: 4, height: 3 },
  config: {},
  data_source: '/api/test',
  refresh_interval: 300,
  theme: 'default',
  color_scheme: 'purple',
  is_active: true,
  is_public: false,
  created_at: '2024-01-01T00:00:00Z',
  created_by: 1
};

const mockInsight = {
  id: 1,
  widget_id: 1,
  title: 'Test Insight',
  content: 'This is a test insight',
  insight_type: 'recommendation',
  confidence_score: 0.85,
  data_period: 'last_30_days',
  metrics: { accuracy: 0.9 },
  recommendations: ['Test recommendation'],
  model_used: 'gpt-4',
  is_active: true,
  is_acknowledged: false,
  priority: 'high',
  generated_at: '2024-01-01T00:00:00Z'
};

const mockDashboardData = {
  widgets: [mockWidget],
  insights: [mockInsight],
  layout: {},
  analytics: {}
};

describe('Dashboard Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDashboardStore.getState().dashboardData = { widgets: [], insights: [] };
    useDashboardStore.getState().loading = false;
    useDashboardStore.getState().error = null;
  });

  describe('fetchDashboardData', () => {
    it('should fetch dashboard data successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockDashboardData });

      await useDashboardStore.getState().fetchDashboardData();

      expect(mockApi.get).toHaveBeenCalledWith('/dashboard/');
      expect(useDashboardStore.getState().dashboardData).toEqual(mockDashboardData);
      expect(useDashboardStore.getState().loading).toBe(false);
      expect(useDashboardStore.getState().error).toBe(null);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch');
      mockApi.get.mockRejectedValue(error);

      await useDashboardStore.getState().fetchDashboardData();

      expect(useDashboardStore.getState().error).toBe('Failed to load dashboard data');
      expect(useDashboardStore.getState().loading).toBe(false);
    });
  });

  describe('addWidget', () => {
    it('should add widget to dashboard data', () => {
      const newWidget = { ...mockWidget, id: 2, title: 'New Widget' };

      useDashboardStore.getState().addWidget(newWidget);

      const state = useDashboardStore.getState();
      expect(state.dashboardData.widgets).toHaveLength(1);
      expect(state.dashboardData.widgets[0]).toEqual(newWidget);
    });
  });

  describe('updateWidget', () => {
    it('should update existing widget', () => {
      useDashboardStore.getState().addWidget(mockWidget);
      
      const updates = { title: 'Updated Widget', width: 6 };
      useDashboardStore.getState().updateWidget(1, updates);

      const state = useDashboardStore.getState();
      const updatedWidget = state.dashboardData.widgets.find(w => w.id === 1);
      expect(updatedWidget?.title).toBe('Updated Widget');
      expect(updatedWidget?.width).toBe(6);
    });

    it('should not update non-existent widget', () => {
      const updates = { title: 'Updated Widget' };
      useDashboardStore.getState().updateWidget(999, updates);

      const state = useDashboardStore.getState();
      expect(state.dashboardData.widgets).toHaveLength(0);
    });
  });

  describe('deleteWidget', () => {
    it('should delete widget successfully', async () => {
      useDashboardStore.getState().addWidget(mockWidget);
      mockApi.delete.mockResolvedValue({ data: { message: 'Widget deleted' } });

      await useDashboardStore.getState().deleteWidget(1);

      expect(mockApi.delete).toHaveBeenCalledWith('/dashboard/widgets/1');
      expect(useDashboardStore.getState().dashboardData.widgets).toHaveLength(0);
    });

    it('should handle delete error', async () => {
      useDashboardStore.getState().addWidget(mockWidget);
      mockApi.delete.mockRejectedValue(new Error('Delete failed'));

      await useDashboardStore.getState().deleteWidget(1);

      expect(useDashboardStore.getState().error).toBe('Failed to delete widget');
    });
  });

  describe('refreshWidget', () => {
    it('should refresh widget data successfully', async () => {
      useDashboardStore.getState().addWidget(mockWidget);
      const mockData = { current_value: 100, trend: 'up' };
      mockApi.get.mockResolvedValue({ data: mockData });

      await useDashboardStore.getState().refreshWidget(1);

      expect(mockApi.get).toHaveBeenCalledWith('/dashboard/analytics/1');
      const state = useDashboardStore.getState();
      const widget = state.dashboardData.widgets.find(w => w.id === 1);
      expect(widget?.data).toEqual(mockData);
      expect(widget?.loading).toBe(false);
      expect(widget?.error).toBe(null);
    });

    it('should handle refresh error', async () => {
      useDashboardStore.getState().addWidget(mockWidget);
      mockApi.get.mockRejectedValue(new Error('Refresh failed'));

      await useDashboardStore.getState().refreshWidget(1);

      const state = useDashboardStore.getState();
      const widget = state.dashboardData.widgets.find(w => w.id === 1);
      expect(widget?.loading).toBe(false);
      expect(widget?.error).toBe('Failed to load data');
    });
  });

  describe('updateWidgetLayout', () => {
    it('should update widget layout successfully', async () => {
      useDashboardStore.getState().addWidget(mockWidget);
      mockApi.put.mockResolvedValue({ data: { message: 'Layout updated' } });

      const newPosition = { x: 2, y: 3, width: 6, height: 4 };
      await useDashboardStore.getState().updateWidgetLayout(1, newPosition);

      expect(mockApi.put).toHaveBeenCalledWith('/dashboard/widgets/1', {
        position_x: 2,
        position_y: 3,
        width: 6,
        height: 4
      });

      const state = useDashboardStore.getState();
      const widget = state.dashboardData.widgets.find(w => w.id === 1);
      expect(widget?.position).toEqual(newPosition);
    });

    it('should handle layout update error', async () => {
      useDashboardStore.getState().addWidget(mockWidget);
      mockApi.put.mockRejectedValue(new Error('Layout update failed'));

      const newPosition = { x: 2, y: 3, width: 6, height: 4 };
      await useDashboardStore.getState().updateWidgetLayout(1, newPosition);

      // Should not throw error, just log it
      expect(mockApi.put).toHaveBeenCalled();
    });
  });

  describe('generateInsights', () => {
    it('should generate insights successfully', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Insights generated' } });
      const fetchSpy = vi.spyOn(useDashboardStore.getState(), 'fetchDashboardData');

      await useDashboardStore.getState().generateInsights();

      expect(mockApi.post).toHaveBeenCalledWith('/dashboard/generate-insights');
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should handle generate insights error', async () => {
      mockApi.post.mockRejectedValue(new Error('Generate failed'));

      await useDashboardStore.getState().generateInsights();

      expect(useDashboardStore.getState().error).toBe('Failed to generate insights');
    });
  });

  describe('acknowledgeInsight', () => {
    it('should acknowledge insight successfully', async () => {
      useDashboardStore.getState().addWidget(mockWidget);
      useDashboardStore.setState(state => ({
        dashboardData: {
          ...state.dashboardData,
          insights: [mockInsight]
        }
      }));

      mockApi.put.mockResolvedValue({ data: { message: 'Insight acknowledged' } });

      await useDashboardStore.getState().acknowledgeInsight(1);

      expect(mockApi.put).toHaveBeenCalledWith('/dashboard/insights/1/acknowledge');
      
      const state = useDashboardStore.getState();
      const insight = state.dashboardData.insights.find(i => i.id === 1);
      expect(insight?.is_acknowledged).toBe(true);
      expect(insight?.acknowledged_at).toBeDefined();
    });

    it('should handle acknowledge insight error', async () => {
      mockApi.put.mockRejectedValue(new Error('Acknowledge failed'));

      await useDashboardStore.getState().acknowledgeInsight(1);

      // Should not throw error, just log it
      expect(mockApi.put).toHaveBeenCalled();
    });
  });

  describe('addAnalyticsData', () => {
    it('should add analytics data successfully', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Analytics added' } });

      await useDashboardStore.getState().addAnalyticsData(1, 'test_metric', 100.5, { source: 'test' });

      expect(mockApi.post).toHaveBeenCalledWith('/dashboard/analytics/1', {
        metric_name: 'test_metric',
        metric_value: 100.5,
        context: { source: 'test' }
      });
    });

    it('should handle add analytics error', async () => {
      mockApi.post.mockRejectedValue(new Error('Add analytics failed'));

      await useDashboardStore.getState().addAnalyticsData(1, 'test_metric', 100.5);

      // Should not throw error, just log it
      expect(mockApi.post).toHaveBeenCalled();
    });
  });

  describe('getWidgetAnalytics', () => {
    it('should get widget analytics successfully', async () => {
      const mockAnalytics = { data_points: 10, metrics: [] };
      mockApi.get.mockResolvedValue({ data: mockAnalytics });

      const result = await useDashboardStore.getState().getWidgetAnalytics(1, 24);

      expect(mockApi.get).toHaveBeenCalledWith('/dashboard/analytics/1?hours=24');
      expect(result).toEqual(mockAnalytics);
    });

    it('should handle get analytics error', async () => {
      mockApi.get.mockRejectedValue(new Error('Get analytics failed'));

      await expect(useDashboardStore.getState().getWidgetAnalytics(1)).rejects.toThrow('Get analytics failed');
    });
  });

  describe('UI State Management', () => {
    it('should set selected widget', () => {
      useDashboardStore.getState().setSelectedWidget(mockWidget);
      expect(useDashboardStore.getState().selectedWidget).toEqual(mockWidget);
    });

    it('should set edit mode', () => {
      useDashboardStore.getState().setEditMode(true);
      expect(useDashboardStore.getState().isEditMode).toBe(true);
    });

    it('should set show insights', () => {
      useDashboardStore.getState().setShowInsights(false);
      expect(useDashboardStore.getState().showInsights).toBe(false);
    });

    it('should set fullscreen', () => {
      useDashboardStore.getState().setFullscreen(true);
      expect(useDashboardStore.getState().isFullscreen).toBe(true);
    });

    it('should set show widget creator', () => {
      useDashboardStore.getState().setShowWidgetCreator(true);
      expect(useDashboardStore.getState().showWidgetCreator).toBe(true);
    });
  });
});




