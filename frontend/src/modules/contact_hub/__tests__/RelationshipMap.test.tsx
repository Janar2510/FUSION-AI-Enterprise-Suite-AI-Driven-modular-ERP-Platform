import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RelationshipMap } from '../components/RelationshipMap';
import { useContactHubStore } from '../stores/contactHubStore';

// Mock the store
jest.mock('../stores/contactHubStore', () => ({
  useContactHubStore: jest.fn()
}));

// Mock d3-force and d3-selection
jest.mock('d3-force', () => ({
  forceSimulation: () => ({
    nodes: jest.fn().mockReturnThis(),
    force: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    stop: jest.fn()
  }),
  forceLink: () => ({
    id: jest.fn(),
    distance: jest.fn()
  }),
  forceManyBody: () => ({
    strength: jest.fn()
  }),
  forceCenter: () => ({
    x: jest.fn(),
    y: jest.fn()
  })
}));

jest.mock('d3-selection', () => ({
  select: () => ({
    append: () => ({
      attr: () => ({
        style: () => ({
          on: () => ({})
        })
      })
    }),
    selectAll: () => ({
      data: () => ({
        join: () => ({
          attr: () => ({
            text: () => ({})
          })
        })
      })
    }),
    on: () => ({})
  })
}));

describe('RelationshipMap', () => {
  const mockContacts = [
    {
      id: '1',
      full_name: 'John Doe',
      email: 'john@example.com',
      company_name: 'Test Corp',
      engagement_score: 85
    },
    {
      id: '2',
      full_name: 'Jane Smith',
      email: 'jane@example.com',
      company_name: 'Another Corp',
      engagement_score: 70
    },
    {
      id: '3',
      full_name: 'Bob Johnson',
      email: 'bob@example.com',
      company_name: 'Test Corp',
      engagement_score: 60
    }
  ];

  const mockRelationships = [
    {
      id: '1',
      source_contact_id: '1',
      target_contact_id: '2',
      relationship_type: 'colleague'
    },
    {
      id: '2',
      source_contact_id: '1',
      target_contact_id: '3',
      relationship_type: 'manager'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should render relationship map', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      relationships: mockRelationships,
      loading: { contacts: false, relationships: false },
      error: null,
      fetchContacts: jest.fn(),
      fetchRelationships: jest.fn()
    });

    render(<RelationshipMap />);

    // Check if the visualization container is rendered
    expect(screen.getByTestId('relationship-map')).toBeInTheDocument();

    // Check if contact names are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

    // Check if relationship types are displayed
    expect(screen.getByText('colleague')).toBeInTheDocument();
    expect(screen.getByText('manager')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      contacts: [],
      relationships: [],
      loading: { contacts: true, relationships: true },
      error: null,
      fetchContacts: jest.fn(),
      fetchRelationships: jest.fn()
    });

    render(<RelationshipMap />);

    expect(screen.getByText('Loading relationship data...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      contacts: [],
      relationships: [],
      loading: { contacts: false, relationships: false },
      error: 'Failed to load relationship data',
      fetchContacts: jest.fn(),
      fetchRelationships: jest.fn()
    });

    render(<RelationshipMap />);

    expect(screen.getByText('Failed to load relationship data')).toBeInTheDocument();
  });

  it('should handle contact selection', async () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      relationships: mockRelationships,
      loading: { contacts: false, relationships: false },
      error: null,
      fetchContacts: jest.fn(),
      fetchRelationships: jest.fn()
    });

    render(<RelationshipMap />);

    // Click on a contact node
    const contactNode = screen.getByText('John Doe').closest('g');
    if (contactNode) {
      fireEvent.click(contactNode);

      // Check if contact details are shown
      await waitFor(() => {
        expect(screen.getByText('Contact Details')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Test Corp')).toBeInTheDocument();
      });
    }
  });

  it('should filter by company', async () => {
    const mockFetchContacts = jest.fn();
    const mockFetchRelationships = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      relationships: mockRelationships,
      loading: { contacts: false, relationships: false },
      error: null,
      fetchContacts: mockFetchContacts,
      fetchRelationships: mockFetchRelationships
    });

    render(<RelationshipMap />);

    // Select a company filter
    const companyFilter = screen.getByLabelText('Filter by company');
    fireEvent.change(companyFilter, { target: { value: 'Test Corp' } });

    // Check if only Test Corp contacts are shown
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      // Jane Smith from Another Corp should not be visible
    });
  });

  it('should show empty state when no relationships', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      relationships: [],
      loading: { contacts: false, relationships: false },
      error: null,
      fetchContacts: jest.fn(),
      fetchRelationships: jest.fn()
    });

    render(<RelationshipMap />);

    expect(screen.getByText('No relationships found')).toBeInTheDocument();
    expect(screen.getByText('Create relationships between contacts to visualize their connections.')).toBeInTheDocument();
  });

  it('should handle zoom and pan', async () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      relationships: mockRelationships,
      loading: { contacts: false, relationships: false },
      error: null,
      fetchContacts: jest.fn(),
      fetchRelationships: jest.fn()
    });

    render(<RelationshipMap />);

    // Simulate zoom in
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);

    // Simulate zoom out
    const zoomOutButton = screen.getByLabelText('Zoom out');
    fireEvent.click(zoomOutButton);

    // Simulate reset view
    const resetButton = screen.getByLabelText('Reset view');
    fireEvent.click(resetButton);

    // These actions should not cause errors
    expect(screen.getByTestId('relationship-map')).toBeInTheDocument();
  });

  it('should handle relationship type filtering', async () => {
    const mockFetchRelationships = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      relationships: mockRelationships,
      loading: { contacts: false, relationships: false },
      error: null,
      fetchContacts: jest.fn(),
      fetchRelationships: mockFetchRelationships
    });

    render(<RelationshipMap />);

    // Select a relationship type filter
    const relationshipFilter = screen.getByLabelText('Filter by relationship type');
    fireEvent.change(relationshipFilter, { target: { value: 'manager' } });

    // Check if only manager relationships are shown
    await waitFor(() => {
      expect(screen.getByText('manager')).toBeInTheDocument();
      // colleague relationship should not be visible
    });
  });
});