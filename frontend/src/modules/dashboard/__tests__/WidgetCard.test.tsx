import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WidgetCard from '../components/WidgetCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

const mockWidget = {
  id: 1,
  title: 'Test Widget',
  description: 'Test Description',
  widget_type: 'kpi',
  position: { x: 0, y: 0, width: 4, height: 3 },
  config: { test: 'value' },
  data_source: '/api/test',
  refresh_interval: 300,
  theme: 'default',
  color_scheme: 'purple',
  is_active: true,
  is_public: false,
  created_at: '2024-01-01T00:00:00Z',
  created_by: 1
};

const mockData = {
  current_value: 100,
  previous_value: 90,
  change_percentage: 11.11,
  trend: 'up'
};

describe('WidgetCard', () => {
  const defaultProps = {
    widget: mockWidget,
    data: mockData,
    loading: false,
    error: null,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    onRefresh: vi.fn(),
    onMaximize: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders widget card correctly', () => {
    render(<WidgetCard {...defaultProps} />);

    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Refresh: 300s')).toBeInTheDocument();
  });

  it('displays widget data when available', () => {
    render(<WidgetCard {...defaultProps} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('+11.11%')).toBeInTheDocument();
    expect(screen.getByText('vs previous')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<WidgetCard {...defaultProps} loading={true} />);

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load data'
    };

    render(<WidgetCard {...errorProps} />);

    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows inactive state', () => {
    const inactiveWidget = { ...mockWidget, is_active: false };
    const inactiveProps = { ...defaultProps, widget: inactiveWidget };

    render(<WidgetCard {...inactiveProps} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows public widget indicator', () => {
    const publicWidget = { ...mockWidget, is_public: true };
    const publicProps = { ...defaultProps, widget: publicWidget };

    render(<WidgetCard {...publicProps} />);

    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('shows widget type badge', () => {
    render(<WidgetCard {...defaultProps} />);

    expect(screen.getByText('kpi')).toBeInTheDocument();
  });

  it('handles menu toggle', () => {
    render(<WidgetCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Maximize')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('handles edit action', () => {
    render(<WidgetCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(menuButton);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockWidget);
  });

  it('handles duplicate action', () => {
    render(<WidgetCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(menuButton);

    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);

    expect(defaultProps.onDuplicate).toHaveBeenCalledWith(mockWidget);
  });

  it('handles maximize action', () => {
    render(<WidgetCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(menuButton);

    const maximizeButton = screen.getByText('Maximize');
    fireEvent.click(maximizeButton);

    expect(defaultProps.onMaximize).toHaveBeenCalledWith(mockWidget);
  });

  it('handles refresh action', () => {
    render(<WidgetCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(menuButton);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(defaultProps.onRefresh).toHaveBeenCalledWith(mockWidget.id);
  });

  it('handles delete action', () => {
    render(<WidgetCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(menuButton);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockWidget.id);
  });

  it('closes menu when clicking outside', () => {
    render(<WidgetCard {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();

    // Click outside
    fireEvent.click(document.body);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('displays correct icon for different widget types', () => {
    const chartWidget = { ...mockWidget, widget_type: 'chart' };
    const tableWidget = { ...mockWidget, widget_type: 'table' };
    const aiWidget = { ...mockWidget, widget_type: 'ai_insight' };

    const { rerender } = render(<WidgetCard {...defaultProps} widget={chartWidget} />);
    expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();

    rerender(<WidgetCard {...defaultProps} widget={tableWidget} />);
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();

    rerender(<WidgetCard {...defaultProps} widget={aiWidget} />);
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('shows last refresh time when available', () => {
    const widgetWithRefresh = {
      ...mockWidget,
      last_refresh: new Date('2024-01-01T12:00:00Z')
    };

    render(<WidgetCard {...defaultProps} widget={widgetWithRefresh} />);

    expect(screen.getByText(/Last: 12:00:00/)).toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    render(<WidgetCard {...defaultProps} data={null} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('applies correct color scheme styling', () => {
    const blueWidget = { ...mockWidget, color_scheme: 'blue' };
    const greenWidget = { ...mockWidget, color_scheme: 'green' };

    const { rerender } = render(<WidgetCard {...defaultProps} widget={blueWidget} />);
    expect(screen.getByText('blue')).toBeInTheDocument();

    rerender(<WidgetCard {...defaultProps} widget={greenWidget} />);
    expect(screen.getByText('green')).toBeInTheDocument();
  });

  it('handles auto-refresh based on refresh interval', async () => {
    const shortIntervalWidget = { ...mockWidget, refresh_interval: 1 }; // 1 second
    const shortIntervalProps = { ...defaultProps, widget: shortIntervalWidget };

    render(<WidgetCard {...shortIntervalProps} />);

    // Wait for auto-refresh to trigger
    await waitFor(() => {
      expect(defaultProps.onRefresh).toHaveBeenCalledWith(shortIntervalWidget.id);
    }, { timeout: 2000 });
  });

  it('does not auto-refresh when refresh interval is 0', async () => {
    const noRefreshWidget = { ...mockWidget, refresh_interval: 0 };
    const noRefreshProps = { ...defaultProps, widget: noRefreshWidget };

    render(<WidgetCard {...noRefreshProps} />);

    // Wait a bit to ensure no refresh happens
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(defaultProps.onRefresh).not.toHaveBeenCalled();
  });
});




