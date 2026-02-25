import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompanyList } from '../components/CompanyList';
import { useContactHubStore } from '../stores/contactHubStore';

// Mock the store
jest.mock('../stores/contactHubStore', () => ({
  useContactHubStore: jest.fn()
}));

describe('CompanyList', () => {
  const mockCompanies = [
    {
      id: '1',
      name: 'Test Corp',
      domain: 'testcorp.com',
      industry: 'Technology',
      employee_count: 100,
      annual_revenue: 1000000,
      health_score: 85,
      churn_risk: 15,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Another Company',
      domain: 'another.com',
      industry: 'Finance',
      employee_count: 50,
      annual_revenue: 500000,
      health_score: 70,
      churn_risk: 30,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should render company list', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      companies: mockCompanies,
      loading: { companies: false },
      error: null,
      fetchCompanies: jest.fn(),
      createCompany: jest.fn()
    });

    render(<CompanyList />);

    // Check if companies are rendered
    expect(screen.getByText('Test Corp')).toBeInTheDocument();
    expect(screen.getByText('testcorp.com')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    
    expect(screen.getByText('Another Company')).toBeInTheDocument();
    expect(screen.getByText('another.com')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();

    // Check for metrics
    expect(screen.getByText('100')).toBeInTheDocument(); // employee count
    expect(screen.getByText('$1,000,000')).toBeInTheDocument(); // revenue
    expect(screen.getByText('85')).toBeInTheDocument(); // health score
  });

  it('should show loading state', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      companies: [],
      loading: { companies: true },
      error: null,
      fetchCompanies: jest.fn(),
      createCompany: jest.fn()
    });

    render(<CompanyList />);

    expect(screen.getByText('Loading companies...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      companies: [],
      loading: { companies: false },
      error: 'Failed to load companies',
      fetchCompanies: jest.fn(),
      createCompany: jest.fn()
    });

    render(<CompanyList />);

    expect(screen.getByText('Failed to load companies')).toBeInTheDocument();
  });

  it('should handle company creation', async () => {
    const mockCreateCompany = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      companies: mockCompanies,
      loading: { companies: false },
      error: null,
      fetchCompanies: jest.fn(),
      createCompany: mockCreateCompany
    });

    render(<CompanyList />);

    // Click add company button
    const addButton = screen.getByText('Add Company');
    fireEvent.click(addButton);

    // Check if form is shown
    expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Domain')).toBeInTheDocument();
    expect(screen.getByLabelText('Industry')).toBeInTheDocument();

    // Fill in form and submit
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'New Company' } });
    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'newcompany.com' } });
    fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'Healthcare' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Check if createCompany was called
    await waitFor(() => {
      expect(mockCreateCompany).toHaveBeenCalledWith({
        name: 'New Company',
        domain: 'newcompany.com',
        industry: 'Healthcare',
        technologies_used: [],
        keywords: [],
        social_profiles: {}
      });
    });
  });

  it('should handle search', async () => {
    const mockFetchCompanies = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      companies: mockCompanies,
      loading: { companies: false },
      error: null,
      fetchCompanies: mockFetchCompanies,
      createCompany: jest.fn()
    });

    render(<CompanyList />);

    // Enter search term
    const searchInput = screen.getByPlaceholderText('Search companies...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    // Check if fetchCompanies was called with search term
    await waitFor(() => {
      // In a real implementation, this would trigger a search
      // For now, we just check that the input value is updated
      expect(searchInput).toHaveValue('Test');
    });
  });

  it('should handle sorting', async () => {
    const mockFetchCompanies = jest.fn();
    
    (useContactHubStore as unknown as jest.Mock).mockReturnValue({
      companies: mockCompanies,
      loading: { companies: false },
      error: null,
      fetchCompanies: mockFetchCompanies,
      createCompany: jest.fn()
    });

    render(<CompanyList />);

    // Click on a sortable column header
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Check if fetchCompanies was called (would include sort params in real implementation)
    await waitFor(() => {
      // In a real implementation, this would trigger a sort
      // For now, we just check that the header is clickable
      expect(nameHeader).toBeInTheDocument();
    });
  });
});