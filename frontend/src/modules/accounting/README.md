# Accounting Module (Frontend)

The frontend component for the Accounting module provides a comprehensive user interface for financial accounting and bookkeeping operations.

## Features

- **Dashboard**: Overview of financial metrics and recent activities
- **Chart of Accounts**: Management of the complete chart of accounts
- **Journal Entries**: Creation and management of double-entry journal entries
- **Financial Reports**: Generation of balance sheets, income statements, and other reports
- **AI Insights**: Fraud detection, cash flow forecasting, and tax optimization

## Architecture

```
accounting/
├── components/         # React components
├── stores/             # Zustand stores for state management
├── types/              # TypeScript interfaces and types
└── README.md           # This file
```

## Components

### AccountingDashboard
Main dashboard component providing an overview of accounting activities:
- Financial metrics display
- Recent journal entries
- Quick action buttons
- Navigation between different accounting sections

### ChartOfAccountsList
Component for managing the chart of accounts:
- List view of all accounts
- Account creation and editing
- Account hierarchy visualization
- Account status management

### JournalEntryForm
Component for creating and editing journal entries:
- Double-entry form with validation
- Account selection with search
- Debit/credit balancing
- Entry posting workflow

### FinancialReports
Component for generating and viewing financial reports:
- Balance sheet generation
- Income statement creation
- Cash flow statements
- Trial balance reports

## State Management

The module uses Zustand for state management with the following structure:

```typescript
interface AccountingState {
  chartOfAccounts: ChartOfAccount[];
  fiscalYears: FiscalYear[];
  journalEntries: JournalEntry[];
  taxes: Tax[];
  bankStatements: BankStatement[];
  paymentTerms: PaymentTerm[];
  selectedAccount: ChartOfAccount | null;
  selectedEntry: JournalEntry | null;
  balanceSheet: BalanceSheetResponse | null;
  loading: {
    chartOfAccounts: boolean;
    fiscalYears: boolean;
    journalEntries: boolean;
    taxes: boolean;
    bankStatements: boolean;
    paymentTerms: boolean;
    balanceSheet: boolean;
  };
  error: string | null;
}
```

## Usage

### Importing Components
```typescript
import { AccountingDashboard, useAccountingStore } from '@/modules/accounting';
```

### Using the Store
```typescript
const { journalEntries, fetchJournalEntries, createJournalEntry } = useAccountingStore();

useEffect(() => {
  fetchJournalEntries();
}, []);
```

## Data Models

### ChartOfAccount
```typescript
interface ChartOfAccount {
  id: number;
  code: string;
  name: string;
  type: string; // asset, liability, equity, revenue, expense
  parent_id: number | null;
  company_id: number;
  currency_id: number;
  active: boolean;
  created_at: string;
}
```

### JournalEntry
```typescript
interface JournalEntry {
  id: number;
  entry_number: string;
  date: string;
  reference: string | null;
  state: string; // draft, posted, cancelled
  company_id: number;
  fiscal_year_id: number | null;
  created_by: number;
  posted_by: number | null;
  posted_at: string | null;
  created_at: string;
  lines: JournalEntryLine[];
}
```

## Extending the Module

To add new features:
1. Extend the TypeScript interfaces in `types/index.ts`
2. Add new actions to the store in `stores/accountingStore.ts`
3. Create new components in the `components/` directory
4. Update the dashboard to include new features