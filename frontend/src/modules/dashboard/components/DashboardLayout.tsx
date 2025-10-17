import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GridLayout from 'react-grid-layout';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';
import { GlobalMetricsCard } from '../../../components/shared/GlobalMetricsCard';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { api } from '../../../lib/api';

interface Widget {
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
}

interface AIInsight {
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

interface DashboardData {
  widgets: Widget[];
  insights: AIInsight[];
  layout?: Record<string, any>;
  analytics?: Record<string, any>;
}

const DashboardLayout: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({ widgets: [], insights: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { socket, isConnected } = useWebSocket('/dashboard/ws');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/');
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    if (socket) {
      socket.on('dashboard_update', (data) => {
        console.log('Dashboard update received:', data);
        // Refresh dashboard data when updates are received
        fetchDashboardData();
      });

      return () => {
        socket.off('dashboard_update');
      };
    }
  }, [socket, fetchDashboardData]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh based on widget refresh intervals
  useEffect(() => {
    const intervals = dashboardData.widgets.map(widget => {
      return setInterval(() => {
        fetchWidgetData(widget.id);
      }, widget.refresh_interval * 1000);
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [dashboardData.widgets]);

  const fetchWidgetData = async (widgetId: number) => {
    try {
      const response = await api.get(`/dashboard/analytics/${widgetId}`);
      // Update widget data in state
      setDashboardData(prev => ({
        ...prev,
        widgets: prev.widgets.map(widget => 
          widget.id === widgetId 
            ? { ...widget, data: response.data }
            : widget
        )
      }));
    } catch (err) {
      console.error(`Failed to fetch data for widget ${widgetId}:`, err);
    }
  };

  const handleAddWidget = () => {
    // Open widget creation modal
    console.log('Add widget clicked');
  };

  const handleEditWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setIsEditMode(true);
  };

  const handleDeleteWidget = async (widgetId: number) => {
    try {
      await api.delete(`/dashboard/widgets/${widgetId}`);
      setDashboardData(prev => ({
        ...prev,
        widgets: prev.widgets.filter(w => w.id !== widgetId)
      }));
    } catch (err) {
      console.error('Failed to delete widget:', err);
    }
  };

  const handleLayoutChange = async (layout: any[]) => {
    // Update widget positions
    for (const item of layout) {
      try {
        await api.put(`/dashboard/widgets/${item.i}`, {
          position_x: item.x,
          position_y: item.y,
          width: item.w,
          height: item.h
        });
      } catch (err) {
        console.error(`Failed to update widget ${item.i}:`, err);
      }
    }
  };

  const handleGenerateInsights = async () => {
    try {
      await api.post('/dashboard/generate-insights');
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
  };

  const getWidgetComponent = (widget: Widget) => {
    switch (widget.widget_type) {
      case 'kpi':
        return <KPICard widget={widget} />;
      case 'chart':
        return <ChartWidget widget={widget} />;
      case 'table':
        return <TableWidget widget={widget} />;
      case 'ai_insight':
        return <AIInsightWidget widget={widget} insights={dashboardData.insights} />;
      default:
        return <CustomWidget widget={widget} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-purple-500" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GlassCard className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <GradientButton onClick={fetchDashboardData}>
            Try Again
          </GradientButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/20 to-dark-bg ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="p-6 border-b border-glass-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              {dashboardData.widgets.length} widgets • {dashboardData.insights.length} insights
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={() => setShowInsights(!showInsights)}
            >
              {showInsights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showInsights ? 'Hide' : 'Show'} Insights
            </GradientButton>
            
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={handleGenerateInsights}
            >
              <BarChart3 className="w-4 h-4" />
              Generate Insights
            </GradientButton>
            
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <Settings className="w-4 h-4" />
              {isEditMode ? 'Done' : 'Edit'}
            </GradientButton>
            
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </GradientButton>
            
            <GradientButton onClick={handleAddWidget}>
              <Plus className="w-4 h-4" />
              Add Widget
            </GradientButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Global Metrics Card */}
        <div className="mb-6">
          <GlobalMetricsCard />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Widgets Grid */}
          <div className="lg:col-span-3">
            <GridLayout
              className="layout"
              cols={12}
              rowHeight={60}
              width={1200}
              onLayoutChange={handleLayoutChange}
              isDraggable={isEditMode}
              isResizable={isEditMode}
            >
              {dashboardData.widgets.map((widget) => (
                <div
                  key={widget.id}
                  data-grid={{
                    x: widget.position.x,
                    y: widget.position.y,
                    w: widget.position.width,
                    h: widget.position.height,
                    i: widget.id.toString()
                  }}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    {getWidgetComponent(widget)}
                  </motion.div>
                </div>
              ))}
            </GridLayout>
          </div>

          {/* AI Insights Sidebar */}
          {showInsights && (
            <div className="lg:col-span-1">
              <AIInsightsPanel insights={dashboardData.insights} />
            </div>
          )}
        </div>
      </div>

      {/* Widget Edit Modal */}
      <AnimatePresence>
        {selectedWidget && isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedWidget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-glass-bg backdrop-blur-md border border-glass-border rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Edit Widget</h3>
              {/* Widget edit form would go here */}
              <div className="flex justify-end space-x-3 mt-6">
                <GradientButton
                  variant="ghost"
                  onClick={() => setSelectedWidget(null)}
                >
                  Cancel
                </GradientButton>
                <GradientButton
                  onClick={() => handleDeleteWidget(selectedWidget.id)}
                >
                  Delete
                </GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Widget Components
const KPICard: React.FC<{ widget: Widget }> = ({ widget }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Fetch KPI data
    const fetchData = async () => {
      try {
        const response = await api.get(`/dashboard/analytics/${widget.id}`);
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch KPI data:', err);
      }
    };

    fetchData();
  }, [widget.id]);

  return (
    <GlassCard className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{widget.title}</h3>
        <TrendingUp className="w-5 h-5 text-purple-400" />
      </div>
      
      {data ? (
        <div className="space-y-2">
          <div className="text-3xl font-bold text-white">
            {data.current_value?.toLocaleString() || 'N/A'}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${data.trend === 'up' ? 'text-green-400' : data.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
              {data.change_percentage > 0 ? '+' : ''}{data.change_percentage}%
            </span>
            <span className="text-xs text-gray-400">vs previous</span>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">Loading...</div>
      )}
    </GlassCard>
  );
};

const ChartWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  return (
    <GlassCard className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{widget.title}</h3>
        <BarChart3 className="w-5 h-5 text-purple-400" />
      </div>
      <div className="h-32 bg-glass-bg rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Chart visualization would go here</span>
      </div>
    </GlassCard>
  );
};

const TableWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  return (
    <GlassCard className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{widget.title}</h3>
      </div>
      <div className="h-32 bg-glass-bg rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Table data would go here</span>
      </div>
    </GlassCard>
  );
};

const AIInsightWidget: React.FC<{ widget: Widget; insights: AIInsight[] }> = ({ widget, insights }) => {
  const widgetInsights = insights.filter(insight => insight.widget_id === widget.id);

  return (
    <GlassCard className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{widget.title}</h3>
        <AlertTriangle className="w-5 h-5 text-purple-400" />
      </div>
      <div className="space-y-3">
        {widgetInsights.slice(0, 3).map((insight) => (
          <div key={insight.id} className="p-3 bg-glass-bg rounded-lg">
            <div className="text-sm font-medium text-white mb-1">{insight.title}</div>
            <div className="text-xs text-gray-400">{insight.content}</div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs px-2 py-1 rounded ${
                insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {insight.priority}
              </span>
              <span className="text-xs text-gray-400">
                {Math.round(insight.confidence_score * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const CustomWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  return (
    <GlassCard className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{widget.title}</h3>
      </div>
      <div className="h-32 bg-glass-bg rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Custom widget content</span>
      </div>
    </GlassCard>
  );
};

const AIInsightsPanel: React.FC<{ insights: AIInsight[] }> = ({ insights }) => {
  const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
  const unacknowledgedInsights = insights.filter(insight => !insight.is_acknowledged);

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Total Insights</span>
            <span className="text-white font-medium">{insights.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">High Priority</span>
            <span className="text-red-400 font-medium">{highPriorityInsights.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Unacknowledged</span>
            <span className="text-yellow-400 font-medium">{unacknowledgedInsights.length}</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <h4 className="text-md font-semibold mb-3">Recent Insights</h4>
        <div className="space-y-3">
          {insights.slice(0, 5).map((insight) => (
            <div key={insight.id} className="p-3 bg-glass-bg rounded-lg">
              <div className="text-sm font-medium text-white mb-1">{insight.title}</div>
              <div className="text-xs text-gray-400 mb-2">{insight.content}</div>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${
                  insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {insight.priority}
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round(insight.confidence_score * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default DashboardLayout;
