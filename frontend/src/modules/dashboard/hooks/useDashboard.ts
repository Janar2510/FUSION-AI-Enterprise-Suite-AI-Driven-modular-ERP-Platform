import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import { useWebSocket } from '../../../hooks/useWebSocket';

export const useDashboard = () => {
  const {
    dashboardData,
    selectedWidget,
    isEditMode,
    showInsights,
    isFullscreen,
    loading,
    error,
    showWidgetCreator,
    fetchDashboardData,
    addWidget,
    updateWidget,
    deleteWidget,
    refreshWidget,
    refreshAllWidgets,
    updateWidgetLayout,
    handleLayoutChange,
    setSelectedWidget,
    setEditMode,
    setShowInsights,
    setFullscreen,
    setShowWidgetCreator,
    generateInsights,
    acknowledgeInsight,
    addAnalyticsData,
    getWidgetAnalytics
  } = useDashboardStore();

  const { socket, isConnected } = useWebSocket('/dashboard/ws');

  // WebSocket event handlers
  useEffect(() => {
    if (socket) {
      const handleDashboardUpdate = (data: any) => {
        console.log('Dashboard update received:', data);
        fetchDashboardData();
      };

      const handleWidgetUpdate = (data: any) => {
        console.log('Widget update received:', data);
        if (data.widget_id) {
          refreshWidget(data.widget_id);
        }
      };

      const handleInsightUpdate = (data: any) => {
        console.log('Insight update received:', data);
        fetchDashboardData();
      };

      socket.on('dashboard_update', handleDashboardUpdate);
      socket.on('widget_update', handleWidgetUpdate);
      socket.on('insight_update', handleInsightUpdate);

      return () => {
        socket.off('dashboard_update', handleDashboardUpdate);
        socket.off('widget_update', handleWidgetUpdate);
        socket.off('insight_update', handleInsightUpdate);
      };
    }
  }, [socket, fetchDashboardData, refreshWidget]);

  // Auto-refresh widgets based on their refresh intervals
  useEffect(() => {
    const intervals = dashboardData.widgets.map(widget => {
      if (widget.refresh_interval > 0) {
        return setInterval(() => {
          refreshWidget(widget.id);
        }, widget.refresh_interval * 1000);
      }
      return null;
    }).filter(Boolean);

    return () => {
      intervals.forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [dashboardData.widgets, refreshWidget]);

  // Widget actions
  const handleAddWidget = useCallback((widget: any) => {
    addWidget(widget);
    setShowWidgetCreator(false);
  }, [addWidget, setShowWidgetCreator]);

  const handleEditWidget = useCallback((widget: any) => {
    setSelectedWidget(widget);
    setEditMode(true);
  }, [setSelectedWidget, setEditMode]);

  const handleDeleteWidget = useCallback(async (widgetId: number) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      await deleteWidget(widgetId);
      setSelectedWidget(null);
      setEditMode(false);
    }
  }, [deleteWidget, setSelectedWidget, setEditMode]);

  const handleDuplicateWidget = useCallback((widget: any) => {
    const duplicatedWidget = {
      ...widget,
      id: Date.now(), // Temporary ID
      title: `${widget.title} (Copy)`,
      position: {
        ...widget.position,
        x: widget.position.x + 1,
        y: widget.position.y + 1
      }
    };
    addWidget(duplicatedWidget);
  }, [addWidget]);

  const handleMaximizeWidget = useCallback((widget: any) => {
    setSelectedWidget(widget);
    setFullscreen(true);
  }, [setSelectedWidget, setFullscreen]);

  const handleRefreshWidget = useCallback(async (widgetId: number) => {
    await refreshWidget(widgetId);
  }, [refreshWidget]);

  const handleRefreshAllWidgets = useCallback(async () => {
    await refreshAllWidgets();
  }, [refreshAllWidgets]);

  // Layout actions
  const handleLayoutChangeCallback = useCallback(async (layout: any[]) => {
    await handleLayoutChange(layout);
  }, [handleLayoutChange]);

  // AI actions
  const handleGenerateInsights = useCallback(async () => {
    await generateInsights();
  }, [generateInsights]);

  const handleAcknowledgeInsight = useCallback(async (insightId: number) => {
    await acknowledgeInsight(insightId);
  }, [acknowledgeInsight]);

  // Analytics actions
  const handleAddAnalyticsData = useCallback(async (
    widgetId: number, 
    metricName: string, 
    metricValue: number, 
    context?: Record<string, any>
  ) => {
    await addAnalyticsData(widgetId, metricName, metricValue, context);
  }, [addAnalyticsData]);

  const handleGetWidgetAnalytics = useCallback(async (widgetId: number, hours?: number) => {
    return await getWidgetAnalytics(widgetId, hours);
  }, [getWidgetAnalytics]);

  // UI actions
  const toggleEditMode = useCallback(() => {
    setEditMode(!isEditMode);
    if (isEditMode) {
      setSelectedWidget(null);
    }
  }, [isEditMode, setEditMode, setSelectedWidget]);

  const toggleInsights = useCallback(() => {
    setShowInsights(!showInsights);
  }, [showInsights, setShowInsights]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setSelectedWidget(null);
    }
  }, [isFullscreen, setFullscreen, setSelectedWidget]);

  const openWidgetCreator = useCallback(() => {
    setShowWidgetCreator(true);
  }, [setShowWidgetCreator]);

  const closeWidgetCreator = useCallback(() => {
    setShowWidgetCreator(false);
  }, [setShowWidgetCreator]);

  const closeSelectedWidget = useCallback(() => {
    setSelectedWidget(null);
  }, [setSelectedWidget]);

  // Computed values
  const totalWidgets = dashboardData.widgets.length;
  const totalInsights = dashboardData.insights.length;
  const highPriorityInsights = dashboardData.insights.filter(insight => insight.priority === 'high');
  const unacknowledgedInsights = dashboardData.insights.filter(insight => !insight.is_acknowledged);
  const activeWidgets = dashboardData.widgets.filter(widget => widget.is_active);
  const publicWidgets = dashboardData.widgets.filter(widget => widget.is_public);

  return {
    // Data
    dashboardData,
    selectedWidget,
    isEditMode,
    showInsights,
    isFullscreen,
    loading,
    error,
    showWidgetCreator,
    isConnected,

    // Computed values
    totalWidgets,
    totalInsights,
    highPriorityInsights,
    unacknowledgedInsights,
    activeWidgets,
    publicWidgets,

    // Widget actions
    handleAddWidget,
    handleEditWidget,
    handleDeleteWidget,
    handleDuplicateWidget,
    handleMaximizeWidget,
    handleRefreshWidget,
    handleRefreshAllWidgets,

    // Layout actions
    handleLayoutChange,

    // AI actions
    handleGenerateInsights,
    handleAcknowledgeInsight,

    // Analytics actions
    handleAddAnalyticsData,
    handleGetWidgetAnalytics,

    // UI actions
    toggleEditMode,
    toggleInsights,
    toggleFullscreen,
    openWidgetCreator,
    closeWidgetCreator,
    closeSelectedWidget,

    // Data fetching
    fetchDashboardData
  };
};
