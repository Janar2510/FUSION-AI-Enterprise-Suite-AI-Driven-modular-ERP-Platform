import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboardStore } from '../stores/dashboardStore';

// Mock the dashboard store
vi.mock('../stores/dashboardStore');
vi.mock('../../../hooks/useWebSocket');
vi.mock('../../../lib/api');

// Mock react-grid-layout
vi.mock('react-grid-layout', () => ({
  Grid: ({ children, onLayoutChange }: any) => (
    <div data-testid="grid" onClick={() => onLayoutChange && onLayoutChange([])}>
      {children}
    </div>
  ),
  GridItem: ({ children, i }: any) => (
    <div data-testid={`grid-item-${i}`}>{children}</div>
  )
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AnimatePresence: ({ children }: any) => <div>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

const mockDashboardData = {
  widgets: [
    {
      id: 1,
      title: 'Test Widget 1',
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
    },
    {
      id: 2,
      title: 'Test Widget 2',
      description: 'Test Description 2',
      widget_type: 'chart',
      position: { x: 4, y: 0, width: 4, height: 3 },
      config: {},
      data_source: '/api/test2',
      refresh_interval: 600,
      theme: 'default',
      color_scheme: 'blue',
      is_active: true,
      is_public: true,
      created_at: '2024-01-01T00:00:00Z',
      created_by: 1
    }
  ],
  insights: [
    {
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
    }
  ]
};

const mockUseDashboardStore = {
  dashboardData: mockDashboardData,
  selectedWidget: null,
  isEditMode: false,
  showInsights: true,
  isFullscreen: false,
  loading: false,
  error: null,
  showWidgetCreator: false,
  totalWidgets: 2,
  totalInsights: 1,
  highPriorityInsights: [mockDashboardData.insights[0]],
  unacknowledgedInsights: [mockDashboardData.insights[0]],
  activeWidgets: mockDashboardData.widgets,
  publicWidgets: [mockDashboardData.widgets[1]],
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

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboardStore as any).mockReturnValue(mockUseDashboardStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dashboard layout correctly', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('2 widgets • 1 insights')).toBeInTheDocument();
  });

  it('renders widgets in grid layout', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(screen.getByTestId('grid-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('grid-item-2')).toBeInTheDocument();
  });

  it('shows insights panel when enabled', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Total Insights')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Unacknowledged')).toBeInTheDocument();
  });

  it('handles edit mode toggle', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockUseDashboardStore.toggleEditMode).toHaveBeenCalled();
  });

  it('handles insights toggle', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    const insightsButton = screen.getByText('Hide Insights');
    fireEvent.click(insightsButton);

    expect(mockUseDashboardStore.toggleInsights).toHaveBeenCalled();
  });

  it('handles fullscreen toggle', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    const fullscreenButton = screen.getByRole('button', { name: /maximize/i });
    fireEvent.click(fullscreenButton);

    expect(mockUseDashboardStore.toggleFullscreen).toHaveBeenCalled();
  });

  it('handles add widget button click', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    const addButton = screen.getByText('Add Widget');
    fireEvent.click(addButton);

    expect(mockUseDashboardStore.openWidgetCreator).toHaveBeenCalled();
  });

  it('handles generate insights button click', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    const generateButton = screen.getByText('Generate Insights');
    fireEvent.click(generateButton);

    expect(mockUseDashboardStore.handleGenerateInsights).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const loadingStore = { ...mockUseDashboardStore, loading: true };
    (useDashboardStore as any).mockReturnValue(loadingStore);

    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorStore = { 
      ...mockUseDashboardStore, 
      error: 'Failed to load dashboard data' 
    };
    (useDashboardStore as any).mockReturnValue(errorStore);

    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles layout change', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    const grid = screen.getByTestId('grid');
    fireEvent.click(grid);

    expect(mockUseDashboardStore.handleLayoutChange).toHaveBeenCalled();
  });

  it('displays widget information correctly', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Widget 1')).toBeInTheDocument();
    expect(screen.getByText('Test Widget 2')).toBeInTheDocument();
  });

  it('displays insight information correctly', () => {
    render(
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Insight')).toBeInTheDocument();
    expect(screen.getByText('This is a test insight')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });
});




