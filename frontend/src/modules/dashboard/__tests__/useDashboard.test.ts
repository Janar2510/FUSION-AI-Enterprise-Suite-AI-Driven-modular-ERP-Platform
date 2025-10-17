import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboard } from '../hooks/useDashboard';
import { useDashboardStore } from '../stores/dashboardStore';
import { useWebSocket } from '../../../hooks/useWebSocket';

// Mock the dependencies
vi.mock('../stores/dashboardStore');
vi.mock('../../../hooks/useWebSocket');

const mockUseDashboardStore = {
  dashboardData: { widgets: [], insights: [] },
  selectedWidget: null,
  isEditMode: false,
  showInsights: true,
  isFullscreen: false,
  loading: false,
  error: null,
  showWidgetCreator: false,
  totalWidgets: 0,
  totalInsights: 0,
  highPriorityInsights: [],
  unacknowledgedInsights: [],
  activeWidgets: [],
  publicWidgets: [],
  handleAddWidget: vi.fn(),
  handleEditWidget: vi.fn(),
  handleDeleteWidget: vi.fn(),
  handleDuplicateWidget: vi.fn(),
  handleMaximizeWidget: vi.fn(),
  handleRefreshWidget: vi.fn(),
  handleRefreshAllWidgets: vi.fn(),
  handleLayoutChange: vi.fn(),
  handleGenerateInsights: vi.fn(),
  handleAcknowledgeInsight: vi.fn(),
  handleAddAnalyticsData: vi.fn(),
  handleGetWidgetAnalytics: vi.fn(),
  toggleEditMode: vi.fn(),
  toggleInsights: vi.fn(),
  toggleFullscreen: vi.fn(),
  openWidgetCreator: vi.fn(),
  closeWidgetCreator: vi.fn(),
  closeSelectedWidget: vi.fn(),
  fetchDashboardData: vi.fn()
};

const mockUseWebSocket = {
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  },
  isConnected: true
};

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboardStore as any).mockReturnValue(mockUseDashboardStore);
    (useWebSocket as any).mockReturnValue(mockUseWebSocket);
  });

  it('should return dashboard data and handlers', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.dashboardData).toEqual(mockUseDashboardStore.dashboardData);
    expect(result.current.selectedWidget).toBe(mockUseDashboardStore.selectedWidget);
    expect(result.current.isEditMode).toBe(mockUseDashboardStore.isEditMode);
    expect(result.current.showInsights).toBe(mockUseDashboardStore.showInsights);
    expect(result.current.isFullscreen).toBe(mockUseDashboardStore.isFullscreen);
    expect(result.current.loading).toBe(mockUseDashboardStore.loading);
    expect(result.current.error).toBe(mockUseDashboardStore.error);
    expect(result.current.showWidgetCreator).toBe(mockUseDashboardStore.showWidgetCreator);
    expect(result.current.isConnected).toBe(mockUseWebSocket.isConnected);
  });

  it('should return computed values', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.totalWidgets).toBe(mockUseDashboardStore.totalWidgets);
    expect(result.current.totalInsights).toBe(mockUseDashboardStore.totalInsights);
    expect(result.current.highPriorityInsights).toEqual(mockUseDashboardStore.highPriorityInsights);
    expect(result.current.unacknowledgedInsights).toEqual(mockUseDashboardStore.unacknowledgedInsights);
    expect(result.current.activeWidgets).toEqual(mockUseDashboardStore.activeWidgets);
    expect(result.current.publicWidgets).toEqual(mockUseDashboardStore.publicWidgets);
  });

  it('should return widget action handlers', () => {
    const { result } = renderHook(() => useDashboard());

    expect(typeof result.current.handleAddWidget).toBe('function');
    expect(typeof result.current.handleEditWidget).toBe('function');
    expect(typeof result.current.handleDeleteWidget).toBe('function');
    expect(typeof result.current.handleDuplicateWidget).toBe('function');
    expect(typeof result.current.handleMaximizeWidget).toBe('function');
    expect(typeof result.current.handleRefreshWidget).toBe('function');
    expect(typeof result.current.handleRefreshAllWidgets).toBe('function');
  });

  it('should return layout action handlers', () => {
    const { result } = renderHook(() => useDashboard());

    expect(typeof result.current.handleLayoutChange).toBe('function');
  });

  it('should return AI action handlers', () => {
    const { result } = renderHook(() => useDashboard());

    expect(typeof result.current.handleGenerateInsights).toBe('function');
    expect(typeof result.current.handleAcknowledgeInsight).toBe('function');
  });

  it('should return analytics action handlers', () => {
    const { result } = renderHook(() => useDashboard());

    expect(typeof result.current.handleAddAnalyticsData).toBe('function');
    expect(typeof result.current.handleGetWidgetAnalytics).toBe('function');
  });

  it('should return UI action handlers', () => {
    const { result } = renderHook(() => useDashboard());

    expect(typeof result.current.toggleEditMode).toBe('function');
    expect(typeof result.current.toggleInsights).toBe('function');
    expect(typeof result.current.toggleFullscreen).toBe('function');
    expect(typeof result.current.openWidgetCreator).toBe('function');
    expect(typeof result.current.closeWidgetCreator).toBe('function');
    expect(typeof result.current.closeSelectedWidget).toBe('function');
  });

  it('should return data fetching handler', () => {
    const { result } = renderHook(() => useDashboard());

    expect(typeof result.current.fetchDashboardData).toBe('function');
  });

  describe('handleAddWidget', () => {
    it('should call store addWidget and closeWidgetCreator', () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidget = { id: 1, title: 'Test Widget' };

      act(() => {
        result.current.handleAddWidget(mockWidget);
      });

      expect(mockUseDashboardStore.handleAddWidget).toHaveBeenCalledWith(mockWidget);
      expect(mockUseDashboardStore.closeWidgetCreator).toHaveBeenCalled();
    });
  });

  describe('handleEditWidget', () => {
    it('should call store setSelectedWidget and setEditMode', () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidget = { id: 1, title: 'Test Widget' };

      act(() => {
        result.current.handleEditWidget(mockWidget);
      });

      expect(mockUseDashboardStore.setSelectedWidget).toHaveBeenCalledWith(mockWidget);
      expect(mockUseDashboardStore.setEditMode).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDeleteWidget', () => {
    it('should call store deleteWidget and reset UI state', async () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidgetId = 1;

      // Mock window.confirm
      global.confirm = vi.fn(() => true);

      await act(async () => {
        await result.current.handleDeleteWidget(mockWidgetId);
      });

      expect(mockUseDashboardStore.handleDeleteWidget).toHaveBeenCalledWith(mockWidgetId);
      expect(mockUseDashboardStore.setSelectedWidget).toHaveBeenCalledWith(null);
      expect(mockUseDashboardStore.setEditMode).toHaveBeenCalledWith(false);
    });

    it('should not delete if user cancels confirmation', async () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidgetId = 1;

      // Mock window.confirm to return false
      global.confirm = vi.fn(() => false);

      await act(async () => {
        await result.current.handleDeleteWidget(mockWidgetId);
      });

      expect(mockUseDashboardStore.handleDeleteWidget).not.toHaveBeenCalled();
    });
  });

  describe('handleDuplicateWidget', () => {
    it('should call store addWidget with duplicated widget', () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidget = { 
        id: 1, 
        title: 'Test Widget',
        position: { x: 0, y: 0, width: 4, height: 3 }
      };

      act(() => {
        result.current.handleDuplicateWidget(mockWidget);
      });

      expect(mockUseDashboardStore.handleAddWidget).toHaveBeenCalledWith({
        ...mockWidget,
        id: expect.any(Number),
        title: 'Test Widget (Copy)',
        position: { x: 1, y: 1, width: 4, height: 3 }
      });
    });
  });

  describe('handleMaximizeWidget', () => {
    it('should call store setSelectedWidget and setFullscreen', () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidget = { id: 1, title: 'Test Widget' };

      act(() => {
        result.current.handleMaximizeWidget(mockWidget);
      });

      expect(mockUseDashboardStore.setSelectedWidget).toHaveBeenCalledWith(mockWidget);
      expect(mockUseDashboardStore.setFullscreen).toHaveBeenCalledWith(true);
    });
  });

  describe('handleRefreshWidget', () => {
    it('should call store refreshWidget', async () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidgetId = 1;

      await act(async () => {
        await result.current.handleRefreshWidget(mockWidgetId);
      });

      expect(mockUseDashboardStore.handleRefreshWidget).toHaveBeenCalledWith(mockWidgetId);
    });
  });

  describe('handleRefreshAllWidgets', () => {
    it('should call store refreshAllWidgets', async () => {
      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        await result.current.handleRefreshAllWidgets();
      });

      expect(mockUseDashboardStore.handleRefreshAllWidgets).toHaveBeenCalled();
    });
  });

  describe('handleLayoutChange', () => {
    it('should call store handleLayoutChange', async () => {
      const { result } = renderHook(() => useDashboard());
      const mockLayout = [{ i: '1', x: 0, y: 0, w: 4, h: 3 }];

      await act(async () => {
        await result.current.handleLayoutChange(mockLayout);
      });

      expect(mockUseDashboardStore.handleLayoutChange).toHaveBeenCalledWith(mockLayout);
    });
  });

  describe('handleGenerateInsights', () => {
    it('should call store handleGenerateInsights', async () => {
      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        await result.current.handleGenerateInsights();
      });

      expect(mockUseDashboardStore.handleGenerateInsights).toHaveBeenCalled();
    });
  });

  describe('handleAcknowledgeInsight', () => {
    it('should call store handleAcknowledgeInsight', async () => {
      const { result } = renderHook(() => useDashboard());
      const mockInsightId = 1;

      await act(async () => {
        await result.current.handleAcknowledgeInsight(mockInsightId);
      });

      expect(mockUseDashboardStore.handleAcknowledgeInsight).toHaveBeenCalledWith(mockInsightId);
    });
  });

  describe('handleAddAnalyticsData', () => {
    it('should call store handleAddAnalyticsData', async () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidgetId = 1;
      const mockMetricName = 'test_metric';
      const mockMetricValue = 100.5;
      const mockContext = { source: 'test' };

      await act(async () => {
        await result.current.handleAddAnalyticsData(mockWidgetId, mockMetricName, mockMetricValue, mockContext);
      });

      expect(mockUseDashboardStore.handleAddAnalyticsData).toHaveBeenCalledWith(
        mockWidgetId, 
        mockMetricName, 
        mockMetricValue, 
        mockContext
      );
    });
  });

  describe('handleGetWidgetAnalytics', () => {
    it('should call store handleGetWidgetAnalytics', async () => {
      const { result } = renderHook(() => useDashboard());
      const mockWidgetId = 1;
      const mockHours = 24;

      await act(async () => {
        await result.current.handleGetWidgetAnalytics(mockWidgetId, mockHours);
      });

      expect(mockUseDashboardStore.handleGetWidgetAnalytics).toHaveBeenCalledWith(mockWidgetId, mockHours);
    });
  });

  describe('toggleEditMode', () => {
    it('should call store toggleEditMode', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.toggleEditMode();
      });

      expect(mockUseDashboardStore.toggleEditMode).toHaveBeenCalled();
    });
  });

  describe('toggleInsights', () => {
    it('should call store toggleInsights', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.toggleInsights();
      });

      expect(mockUseDashboardStore.toggleInsights).toHaveBeenCalled();
    });
  });

  describe('toggleFullscreen', () => {
    it('should call store toggleFullscreen', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(mockUseDashboardStore.toggleFullscreen).toHaveBeenCalled();
    });
  });

  describe('openWidgetCreator', () => {
    it('should call store openWidgetCreator', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.openWidgetCreator();
      });

      expect(mockUseDashboardStore.openWidgetCreator).toHaveBeenCalled();
    });
  });

  describe('closeWidgetCreator', () => {
    it('should call store closeWidgetCreator', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.closeWidgetCreator();
      });

      expect(mockUseDashboardStore.closeWidgetCreator).toHaveBeenCalled();
    });
  });

  describe('closeSelectedWidget', () => {
    it('should call store closeSelectedWidget', () => {
      const { result } = renderHook(() => useDashboard());

      act(() => {
        result.current.closeSelectedWidget();
      });

      expect(mockUseDashboardStore.closeSelectedWidget).toHaveBeenCalled();
    });
  });
});




