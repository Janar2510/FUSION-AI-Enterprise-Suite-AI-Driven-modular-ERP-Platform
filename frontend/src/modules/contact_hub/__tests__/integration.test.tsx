import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactHubDashboard } from '../components/ContactHubDashboard';
import { useContactHubStore } from '../stores/contactHubStore';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  Building: () => <div data-testid="building-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Target: () => <div data-testid="target-icon" />
}));

// Mock the GlassCard component
jest.mock('@/components/shared/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  )
}));

// Mock the MetricGrid component
jest.mock('@/components/shared/MetricCard', () => ({
  MetricGrid: ({ metrics }: any) => (
    <div data-testid="metric-grid">
      {metrics.map((metric: any, index: number) => (
        <div key={index} data-testid={`metric-${index}`}>
          <span>{metric.title}</span>
          <span>{metric.value}</span>
        </div>
      ))}
    </div>
  )
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

describe('ContactHub Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the store state
    useContactHubStore.setState({
      contacts: [],
      companies: [],
      selectedContact: null,
      selectedCompany: null,
      timelineEvents: [],
      searchResults: [],
      loading: {
        contacts: false,
        companies: false,
        contactDetail: false,
        companyDetail: false,
        timeline: false,
        search: false
      },
      error: null
    });
  });

  it('should render the contact hub dashboard', () => {
    render(<ContactHubDashboard />);
    
    expect(screen.getByText('Contact Hub')).toBeInTheDocument();
    expect(screen.getByText('Unified contact management across all modules')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search contacts, companies, emails...')).toBeInTheDocument();
  });

  it('should display metrics correctly', () => {
    render(<ContactHubDashboard />);
    
    expect(screen.getByTestId('metric-grid')).toBeInTheDocument();
    expect(screen.getByText('Total Contacts')).toBeInTheDocument();
    expect(screen.getByText('Total Companies')).toBeInTheDocument();
    expect(screen.getByText('Active Engagements')).toBeInTheDocument();
    expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
  });

  it('should switch between different views', () => {
    render(<ContactHubDashboard />);
    
    // Check that contacts view is active by default
    expect(screen.getByText('contacts')).toHaveClass('text-white');
    
    // Switch to companies view
    const companiesTab = screen.getByText('companies');
    fireEvent.click(companiesTab);
    expect(companiesTab).toHaveClass('text-white');
    
    // Switch to timeline view
    const timelineTab = screen.getByText('timeline');
    fireEvent.click(timelineTab);
    expect(timelineTab).toHaveClass('text-white');
  });

  it('should handle search functionality', async () => {
    const mockSearchResults = {
      results: [
        {
          id: '1',
          type: 'person',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          tags: [],
          custom_fields: {},
          engagement_score: 50,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      count: 1,
      query: 'test'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults
    });

    render(<ContactHubDashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search contacts, companies, emails...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Wait for the search to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contact-hub/search?q=test'),
        expect.any(Object)
      );
    });
  });

  it('should toggle AI assistant panel', () => {
    render(<ContactHubDashboard />);
    
    // AI panel should be hidden initially
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
    
    // Click the AI assistant button
    const aiButton = screen.getByText('AI Assistant');
    fireEvent.click(aiButton);
    
    // AI panel should now be visible
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    
    // Close the panel
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    // AI panel should be hidden again
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
  });

  it('should fetch contacts on mount', async () => {
    const mockContacts = [
      {
        id: '1',
        type: 'person',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        tags: [],
        custom_fields: {},
        engagement_score: 75,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockContacts
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    render(<ContactHubDashboard />);
    
    // Wait for the contacts to be fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contact-hub/contacts'),
        expect.any(Object)
      );
    });
  });

  it('should fetch companies on mount', async () => {
    const mockCompanies = [
      {
        id: '1',
        name: 'Acme Corp',
        domain: 'acme.com',
        industry: 'Technology',
        employee_count: 100,
        annual_revenue: 1000000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        social_profiles: {},
        technologies_used: [],
        keywords: []
      }
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompanies
      });

    render(<ContactHubDashboard />);
    
    // Wait for the companies to be fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contact-hub/companies'),
        expect.any(Object)
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ContactHubDashboard />);
    
    // The component should handle the error without crashing
    expect(screen.getByText('Contact Hub')).toBeInTheDocument();
  });
});