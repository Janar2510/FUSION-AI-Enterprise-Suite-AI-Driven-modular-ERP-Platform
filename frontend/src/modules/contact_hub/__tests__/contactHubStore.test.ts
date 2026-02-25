import { useContactHubStore } from '../stores/contactHubStore';

// Mock fetch globally
global.fetch = jest.fn();

describe('ContactHubStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useContactHubStore.getState();
    
    expect(store.contacts).toEqual([]);
    expect(store.companies).toEqual([]);
    expect(store.selectedContact).toBeNull();
    expect(store.selectedCompany).toBeNull();
    expect(store.timelineEvents).toEqual([]);
    expect(store.searchResults).toEqual([]);
    expect(store.loading).toEqual({
      contacts: false,
      companies: false,
      contactDetail: false,
      companyDetail: false,
      timeline: false,
      search: false
    });
    expect(store.error).toBeNull();
  });

  it('should handle contact creation', async () => {
    const mockContact = {
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
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContact
    });

    const store = useContactHubStore.getState();
    const initialContactCount = store.contacts.length;

    await store.createContact({
      type: 'person',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      tags: [],
      custom_fields: {}
    });

    const updatedStore = useContactHubStore.getState();
    expect(updatedStore.contacts).toHaveLength(initialContactCount + 1);
    expect(updatedStore.contacts[0]).toEqual(mockContact);
  });

  it('should handle contact fetching', async () => {
    const mockContacts = [
      {
        id: '1',
        type: 'person',
        email: 'test1@example.com',
        first_name: 'Test1',
        last_name: 'User1',
        full_name: 'Test1 User1',
        tags: [],
        custom_fields: {},
        engagement_score: 50,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        type: 'person',
        email: 'test2@example.com',
        first_name: 'Test2',
        last_name: 'User2',
        full_name: 'Test2 User2',
        tags: [],
        custom_fields: {},
        engagement_score: 75,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContacts
    });

    const store = useContactHubStore.getState();
    await store.fetchContacts();

    const updatedStore = useContactHubStore.getState();
    expect(updatedStore.contacts).toEqual(mockContacts);
  });

  it('should handle contact selection', () => {
    const mockContact = {
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
    };

    const store = useContactHubStore.getState();
    store.setSelectedContact(mockContact);

    const updatedStore = useContactHubStore.getState();
    expect(updatedStore.selectedContact).toEqual(mockContact);
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

    const store = useContactHubStore.getState();
    await store.searchContacts('test');

    const updatedStore = useContactHubStore.getState();
    expect(updatedStore.searchResults).toEqual(mockSearchResults.results);
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const store = useContactHubStore.getState();
    try {
      await store.fetchContacts();
    } catch (error) {
      // Expected error
    }

    const updatedStore = useContactHubStore.getState();
    expect(updatedStore.error).toBe('Network error');
  });
});