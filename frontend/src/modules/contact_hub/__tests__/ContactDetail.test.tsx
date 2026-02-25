import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactDetail } from '../components/ContactDetail';
import { useContactHubStore } from '../stores/contactHubStore';

// Mock the store
jest.mock('../stores/contactHubStore', () => ({
  useContactHubStore: jest.fn()
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn()
}));

describe('ContactDetail', () => {
  const mockContact = {
    id: '1',
    type: 'person',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    company_name: 'Test Corp',
    tags: ['important', 'vip'],
    custom_fields: { department: 'Engineering' },
    engagement_score: 85,
    lifecycle_stage: 'customer',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_activity_at: '2024-01-15T00:00:00Z'
  };

  const mockTimelineEvents = [
    {
      id: '1',
      activity_type: 'email_sent',
      app_name: 'crm',
      title: 'Welcome Email',
      description: 'Sent welcome email to new customer',
      created_at: '2024-01-15T10:00:00Z',
      sentiment_score: 0.8,
      engagement_score: 20
    },
    {
      id: '2',
      activity_type: 'call_made',
      app_name: 'sales',
      title: 'Follow-up Call',
      description: 'Called to discuss product features',
      created_at: '2024-01-14T14:00:00Z',
      sentiment_score: 0.6,
      engagement_score: 30
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should render contact details', async () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      selectedContact: mockContact,
      timelineEvents: mockTimelineEvents,
      loading: { contactDetail: false, timeline: false },
      error: null,
      getContact: jest.fn(),
      fetchContactTimeline: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn()
    });

    render(<ContactDetail />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test Corp')).toBeInTheDocument();
      expect(screen.getByText('customer')).toBeInTheDocument();
    });

    // Check for engagement score
    expect(screen.getByText('85')).toBeInTheDocument();

    // Check for tags
    expect(screen.getByText('important')).toBeInTheDocument();
    expect(screen.getByText('vip')).toBeInTheDocument();

    // Check for timeline events
    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
    expect(screen.getByText('Follow-up Call')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      selectedContact: null,
      timelineEvents: [],
      loading: { contactDetail: true, timeline: true },
      error: null,
      getContact: jest.fn(),
      fetchContactTimeline: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn()
    });

    render(<ContactDetail />);

    expect(screen.getByText('Loading contact details...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      selectedContact: null,
      timelineEvents: [],
      loading: { contactDetail: false, timeline: false },
      error: 'Failed to load contact',
      getContact: jest.fn(),
      fetchContactTimeline: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn()
    });

    render(<ContactDetail />);

    expect(screen.getByText('Failed to load contact')).toBeInTheDocument();
  });

  it('should handle edit contact', async () => {
    const mockUpdateContact = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      selectedContact: mockContact,
      timelineEvents: mockTimelineEvents,
      loading: { contactDetail: false, timeline: false },
      error: null,
      getContact: jest.fn(),
      fetchContactTimeline: jest.fn(),
      updateContact: mockUpdateContact,
      deleteContact: jest.fn()
    });

    render(<ContactDetail />);

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Check if edit form is shown
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();

    // Fill in form and submit
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Updated' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Check if updateContact was called
    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalledWith('1', {
        first_name: 'Updated',
        last_name: 'User',
        email: 'test@example.com',
        company_name: 'Test Corp',
        type: 'person',
        tags: ['important', 'vip'],
        custom_fields: { department: 'Engineering' },
        lifecycle_stage: 'customer'
      });
    });
  });

  it('should handle delete contact', async () => {
    const mockDeleteContact = jest.fn();
    const mockNavigate = jest.fn();
    
    // Mock useNavigate
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      selectedContact: mockContact,
      timelineEvents: mockTimelineEvents,
      loading: { contactDetail: false, timeline: false },
      error: null,
      getContact: jest.fn(),
      fetchContactTimeline: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: mockDeleteContact
    });

    render(<ContactDetail />);

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Check if deleteContact was called
    await waitFor(() => {
      expect(mockDeleteContact).toHaveBeenCalledWith('1');
    });

    // Check if navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/contact-hub');
    });
  });
});