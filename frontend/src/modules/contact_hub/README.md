# Contact Hub Module

The Contact Hub is a unified contact management system that provides a single source of truth for all contact-related information across the FusionAI Enterprise Suite.

## Features

- **Unified Contact Management**: Centralized storage for all contacts, companies, and relationships
- **Cross-Module Tracking**: Activity tracking across all ERP modules
- **AI-Powered Insights**: Engagement scoring, churn prediction, and opportunity identification
- **Relationship Mapping**: Visualize connections between contacts and companies
- **Real-time Timeline**: Chronological view of all contact interactions
- **Advanced Search**: Full-text search across all contact data
- **Custom Fields**: Extensible data model for specific business needs

## Architecture

```
contact_hub/
├── components/           # React components
├── stores/              # Zustand stores for state management
├── types/               # TypeScript interfaces and types
├── __tests__/           # Unit and integration tests
├── index.ts             # Module exports
└── README.md            # This file
```

## API Endpoints

### Contacts
- `POST /api/v1/contact-hub/contacts` - Create a new contact
- `GET /api/v1/contact-hub/contacts/{id}` - Get a contact by ID
- `PUT /api/v1/contact-hub/contacts/{id}` - Update a contact
- `DELETE /api/v1/contact-hub/contacts/{id}` - Delete a contact
- `GET /api/v1/contact-hub/contacts` - List contacts with pagination
- `GET /api/v1/contact-hub/search` - Search contacts

### Audit Trail
All entities include audit trail information:
- `created_by`: User ID of the creator
- `updated_by`: User ID of the last modifier
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

### Companies
- `POST /api/v1/contact-hub/companies` - Create a new company
- `GET /api/v1/contact-hub/companies/{id}` - Get a company by ID
- `PUT /api/v1/contact-hub/companies/{id}` - Update a company
- `GET /api/v1/contact-hub/companies` - List companies with pagination

### Activities
- `POST /api/v1/contact-hub/activities` - Add a new activity
- `GET /api/v1/contact-hub/contacts/{id}/timeline` - Get contact timeline

### Relationships
- `POST /api/v1/contact-hub/relationships` - Create a new relationship
- `GET /api/v1/contact-hub/contacts/{id}/insights` - Get cross-module insights

## Data Model

### Contact
```typescript
interface Contact {
  id: string;
  external_id?: string;
  type: ContactType; // person, company, vendor, customer, employee
  email?: string;
  phone?: string;
  mobile?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  title?: string;
  company_name?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  lifecycle_stage?: LifecycleStage;
  engagement_score: number;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  created_by?: string;
  updated_by?: string;
}
```

### Company
```typescript
interface Company {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  email?: string;
  industry?: string;
  company_type?: string;
  employee_count?: number;
  annual_revenue?: number;
  description?: string;
  founded_year?: number;
  headquarters?: string;
  logo_url?: string;
  social_profiles: Record<string, any>;
  technologies_used: string[];
  keywords: string[];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  account_status?: string;
  customer_since?: string;
  health_score?: number;
  churn_risk?: number;
  expansion_potential?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}
```

## Usage

### Importing Components
```typescript
import { ContactHubDashboard, ContactList, ContactDetail } from '@/modules/contact_hub';
import { useContactHubStore } from '@/modules/contact_hub/stores/contactHubStore';
```

### Using the Store
```typescript
const { contacts, fetchContacts, createContact } = useContactHubStore();

useEffect(() => {
  fetchContacts();
}, []);
```

## Testing

The module includes comprehensive tests:
- Unit tests for the store
- Component tests for UI elements
- Integration tests for the complete module
- Backend service tests

Run frontend tests with:
```bash
npm test contact_hub
```

Run backend tests with:
```bash
pytest backend/src/modules/contact_hub/test_contact_hub.py
```

## Extending the Module

To add new features:
1. Extend the TypeScript interfaces in `types/index.ts`
2. Add new API endpoints in the backend
3. Create new components in the `components/` directory
4. Update the store with new actions
5. Add tests for new functionality