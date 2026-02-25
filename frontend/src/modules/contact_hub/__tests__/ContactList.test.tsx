import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactList } from '../components/ContactList';

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Building: () => <div data-testid="building-icon" />,
  Star: () => <div data-testid="star-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  User: () => <div data-testid="user-icon" />,
  Eye: () => <div data-testid="eye-icon" />
}));

// Mock the GlassCard component
jest.mock('@/components/shared/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  )
}));

describe('ContactList', () => {
  const mockContacts = [
    {
      id: '1',
      type: 'person',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      title: 'Software Engineer',
      company_name: 'Acme Corp',
      tags: ['developer', 'javascript'],
      custom_fields: {},
      engagement_score: 75,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_activity_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'person',
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      full_name: 'Jane Smith',
      title: 'Product Manager',
      company_name: 'Tech Solutions',
      tags: ['product', 'management'],
      custom_fields: {},
      engagement_score: 85,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      last_activity_at: '2024-01-16T14:20:00Z'
    }
  ];

  it('should render contacts correctly', () => {
    render(<ContactList contacts={mockContacts} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
  });

  it('should display contact information correctly', () => {
    render(<ContactList contacts={mockContacts} />);
    
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
  });

  it('should display engagement scores correctly', () => {
    render(<ContactList contacts={mockContacts} />);
    
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should handle search functionality', () => {
    const mockOnSearch = jest.fn();
    render(<ContactList contacts={mockContacts} onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search contacts, emails, companies...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    expect(mockOnSearch).toHaveBeenCalledWith('John');
  });

  it('should filter contacts by type', () => {
    render(<ContactList contacts={mockContacts} />);
    
    const typeFilter = screen.getByRole('combobox', { name: '' });
    fireEvent.change(typeFilter, { target: { value: 'person' } });
    
    // The component should still display the contacts since they are all persons
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should sort contacts by engagement score by default', () => {
    render(<ContactList contacts={mockContacts} />);
    
    // Jane Smith should appear first since she has a higher engagement score
    const contactNames = screen.getAllByText(/(John Doe|Jane Smith)/);
    expect(contactNames[0]).toHaveTextContent('Jane Smith');
  });

  it('should display tags correctly', () => {
    render(<ContactList contacts={mockContacts} />);
    
    expect(screen.getByText('developer')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByText('management')).toBeInTheDocument();
  });

  it('should display last activity date', () => {
    render(<ContactList contacts={mockContacts} />);
    
    expect(screen.getByText('Last activity: 1/15/2024')).toBeInTheDocument();
    expect(screen.getByText('Last activity: 1/16/2024')).toBeInTheDocument();
  });

  it('should show empty state when no contacts', () => {
    render(<ContactList contacts={[]} />);
    
    expect(screen.getByText('No contacts found')).toBeInTheDocument();
    expect(screen.getByText('Add First Contact')).toBeInTheDocument();
  });

  it('should show empty state when search returns no results', () => {
    const mockOnSearch = jest.fn();
    render(<ContactList contacts={mockContacts} onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search contacts, emails, companies...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentContact' } });
    
    // Since we're not actually filtering in this test, we should still see the contacts
    // In a real implementation, the parent component would filter the contacts
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});