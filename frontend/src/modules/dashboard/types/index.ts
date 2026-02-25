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

export interface DashboardLayout {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  layout_config: Record<string, any>;
  theme_settings?: Record<string, any>;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DashboardAnalytics {
  id: number;
  widget_id: number;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  timestamp: string;
  period_start?: string;
  period_end?: string;
  context?: Record<string, any>;
  tags?: string[];
}

export interface DashboardData {
  widgets: Widget[];
  insights: AIInsight[];
  layout?: Record<string, any>;
  analytics?: Record<string, any>;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  default_config: Record<string, any>;
  default_size: {
    width: number;
    height: number;
  };
}

export interface WidgetCreateRequest {
  title: string;
  description?: string;
  widget_type: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config?: Record<string, any>;
  data_source?: string;
  refresh_interval: number;
  theme: string;
  color_scheme: string;
  is_public: boolean;
}

export interface WidgetUpdateRequest {
  title?: string;
  description?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  config?: Record<string, any>;
  data_source?: string;
  refresh_interval?: number;
  theme?: string;
  color_scheme?: string;
  is_active?: boolean;
  is_public?: boolean;
}

export interface InsightCreateRequest {
  widget_id?: number;
  title: string;
  content: string;
  insight_type: string;
  confidence_score: number;
  data_period?: string;
  metrics?: Record<string, any>;
  recommendations?: string[];
  model_used?: string;
  priority: string;
}

export interface AnalyticsDataRequest {
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  context?: Record<string, any>;
  tags?: string[];
}

export interface DashboardSummary {
  total_widgets: number;
  insights: {
    total: number;
    high_priority: number;
    unacknowledged: number;
    avg_confidence: number;
  };
  recent_insights: Array<{
    id: number;
    title: string;
    type: string;
    confidence: number;
    generated_at: string;
  }>;
  widget_types: Record<string, number>;
}

export interface WidgetMetrics {
  widget_id: number;
  total_views: number;
  avg_load_time: number;
  error_rate: number;
  last_updated: string;
  data_points: number;
}

export interface InsightSummary {
  total_insights: number;
  high_priority: number;
  unacknowledged: number;
  avg_confidence: number;
  recent_insights: Array<{
    id: number;
    title: string;
    type: string;
    confidence: number;
    generated_at: string;
  }>;
}

export type WidgetType = 'kpi' | 'chart' | 'table' | 'ai_insight' | 'custom';
export type InsightType = 'prediction' | 'anomaly' | 'recommendation' | 'trend' | 'alert';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ColorScheme = 'purple' | 'blue' | 'green' | 'red' | 'yellow' | 'gray';
export type Theme = 'default' | 'dark' | 'light' | 'minimal';

export interface DashboardFilters {
  widget_type?: WidgetType;
  insight_type?: InsightType;
  priority?: Priority;
  color_scheme?: ColorScheme;
  theme?: Theme;
  is_active?: boolean;
  is_public?: boolean;
  created_after?: string;
  created_before?: string;
}

export interface DashboardSort {
  field: 'title' | 'created_at' | 'updated_at' | 'widget_type' | 'priority';
  direction: 'asc' | 'desc';
}

export interface DashboardPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface DashboardSearch {
  query: string;
  fields: ('title' | 'description' | 'content')[];
}

export interface WebSocketMessage {
  type: 'dashboard_update' | 'widget_update' | 'insight_update' | 'analytics_update';
  data: any;
  timestamp: string;
}

export interface DashboardError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}




