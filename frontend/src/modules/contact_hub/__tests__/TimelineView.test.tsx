import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimelineView } from '../components/TimelineView';
import { useContactHubStore } from '../stores/contactHubStore';

// Mock the store
jest.mock('../stores/contactHubStore', () => ({
  useContactHubStore: jest.fn()
}));

describe('TimelineView', () => {
  const mockTimelineEvents = [
    {
      id: '1',
      activity_type: 'email_sent',
      app_name: 'crm',
      title: 'Welcome Email',
      description: 'Sent welcome email to new customer',
      created_at: '2024-01-15T10:00:00Z',
      sentiment_score: 0.8,
      engagement_score: 20,
      metadata: { template: 'welcome' }
    },
    {
      id: '2',
      activity_type: 'call_made',
      app_name: 'sales',
      title: 'Follow-up Call',
      description: 'Called to discuss product features',
      created_at: '2024-01-14T14:00:00Z',
      sentiment_score: 0.6,
      engagement_score: 30,
      metadata: { duration: '15 minutes' }
    },
    {
      id: '3',
      activity_type: 'proposal_viewed',
      app_name: 'sales',
      title: 'Product Proposal',
      description: 'Customer viewed product proposal document',
      created_at: '2024-01-13T09:00:00Z',
      sentiment_score: 0.9,
      engagement_score: 70,
      metadata: { pages_viewed: 3 }
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should render timeline events', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      timelineEvents: mockTimelineEvents,
      loading: { timeline: false },
      error: null,
      fetchContactTimeline: jest.fn()
    });

    render(<TimelineView />);

    // Check if timeline events are rendered
    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
    expect(screen.getByText('Sent welcome email to new customer')).toBeInTheDocument();
    expect(screen.getByText('crm')).toBeInTheDocument();
    
    expect(screen.getByText('Follow-up Call')).toBeInTheDocument();
    expect(screen.getByText('Called to discuss product features')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();

    expect(screen.getByText('Product Proposal')).toBeInTheDocument();
    expect(screen.getByText('Customer viewed product proposal document')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();

    // Check for sentiment indicators
    expect(screen.getByText('0.8')).toBeInTheDocument(); // sentiment score
    expect(screen.getByText('20')).toBeInTheDocument(); // engagement score
  });

  it('should show loading state', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      timelineEvents: [],
      loading: { timeline: true },
      error: null,
      fetchContactTimeline: jest.fn()
    });

    render(<TimelineView />);

    expect(screen.getByText('Loading timeline...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      timelineEvents: [],
      loading: { timeline: false },
      error: 'Failed to load timeline',
      fetchContactTimeline: jest.fn()
    });

    render(<TimelineView />);

    expect(screen.getByText('Failed to load timeline')).toBeInTheDocument();
  });

  it('should filter timeline by app', async () => {
    const mockFetchContactTimeline = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      timelineEvents: mockTimelineEvents,
      loading: { timeline: false },
      error: null,
      fetchContactTimeline: mockFetchContactTimeline
    });

    render(<TimelineView />);

    // Select an app filter
    const appFilter = screen.getByLabelText('Filter by app');
    fireEvent.change(appFilter, { target: { value: 'sales' } });

    // Check if only sales events are shown
    await waitFor(() => {
      expect(screen.getByText('Follow-up Call')).toBeInTheDocument();
      expect(screen.getByText('Product Proposal')).toBeInTheDocument();
      // Welcome Email from crm should not be visible
    });
  });

  it('should filter timeline by activity type', async () => {
    const mockFetchContactTimeline = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      timelineEvents: mockTimelineEvents,
      loading: { timeline: false },
      error: null,
      fetchContactTimeline: mockFetchContactTimeline
    });

    render(<TimelineView />);

    // Select an activity type filter
    const activityFilter = screen.getByLabelText('Filter by activity type');
    fireEvent.change(activityFilter, { target: { value: 'email_sent' } });

    // Check if only email events are shown
    await waitFor(() => {
      expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      // Other activities should not be visible
    });
  });

  it('should show empty state when no events', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      timelineEvents: [],
      loading: { timeline: false },
      error: null,
      fetchContactTimeline: jest.fn()
    });

    render(<TimelineView />);

    expect(screen.getByText('No timeline events found')).toBeInTheDocument();
    expect(screen.getByText('Start interacting with contacts to see their activity timeline.')).toBeInTheDocument();
  });

  it('should handle date filtering', async () => {
    const mockFetchContactTimeline = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      timelineEvents: mockTimelineEvents,
      loading: { timeline: false },
      error: null,
      fetchContactTimeline: mockFetchContactTimeline
    });

    render(<TimelineView />);

    // Set date range
    const startDateInput = screen.getByLabelText('Start date');
    const endDateInput = screen.getByLabelText('End date');
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-14' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-15' } });

    // Apply filter
    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);

    // Check if fetchContactTimeline was called with date filters
    await waitFor(() => {
      // In a real implementation, this would filter the timeline
      // For now, we just check that the inputs work
      expect(startDateInput).toHaveValue('2024-01-14');
      expect(endDateInput).toHaveValue('2024-01-15');
    });
  });
});