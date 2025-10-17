# Accounting Module

The Accounting module provides comprehensive financial accounting and bookkeeping capabilities for the FusionAI Enterprise Suite.

## Features

- **Chart of Accounts**: Complete chart of accounts management with account hierarchy
- **Journal Entries**: Double-entry bookkeeping with validation
- **Fiscal Years**: Multi-year fiscal period management
- **Financial Reporting**: Real-time balance sheets and financial statements
- **Bank Reconciliation**: AI-powered bank statement reconciliation
- **Tax Management**: Tax configuration and compliance tracking
- **Payment Terms**: Flexible payment term definitions
- **AI-Powered Insights**: Fraud detection, cash flow forecasting, and tax optimization

## Architecture

```
accounting/
├── models.py           # Database models
├── schemas.py          # Pydantic schemas for API validation
├── service.py          # Business logic layer
├── api.py              # REST API endpoints
├── ai_services.py      # AI-powered accounting services
├── ai_api.py           # AI REST API endpoints
├── test_service.py     # Service layer tests
├── test_api.py         # API tests
└── README.md           # This file
```

## Database Schema

### Core Tables

- `chart_of_accounts`: Chart of accounts with full hierarchy support
- `fiscal_years`: Fiscal period management
- `journal_entries`: Journal entry headers
- `journal_entry_lines`: Journal entry details
- `taxes`: Tax configuration
- `bank_statements`: Bank statement tracking
- `payment_terms`: Payment term definitions

## API Endpoints

### Chart of Accounts
- `POST /api/v1/accounting/chart-of-accounts` - Create a new chart of account
- `GET /api/v1/accounting/chart-of-accounts/{id}` - Get a chart of account by ID
- `PUT /api/v1/accounting/chart-of-accounts/{id}` - Update a chart of account
- `DELETE /api/v1/accounting/chart-of-accounts/{id}` - Delete a chart of account
- `GET /api/v1/accounting/chart-of-accounts` - List chart of accounts

### Journal Entries
- `POST /api/v1/accounting/journal-entries` - Create a new journal entry
- `GET /api/v1/accounting/journal-entries/{id}` - Get a journal entry by ID
- `PUT /api/v1/accounting/journal-entries/{id}` - Update a journal entry
- `DELETE /api/v1/accounting/journal-entries/{id}` - Delete a journal entry
- `POST /api/v1/accounting/journal-entries/{id}/post` - Post a journal entry
- `GET /api/v1/accounting/journal-entries` - List journal entries

### Fiscal Years
- `POST /api/v1/accounting/fiscal-years` - Create a new fiscal year
- `GET /api/v1/accounting/fiscal-years/{id}` - Get a fiscal year by ID
- `PUT /api/v1/accounting/fiscal-years/{id}` - Update a fiscal year
- `DELETE /api/v1/accounting/fiscal-years/{id}` - Delete a fiscal year

### Financial Reports
- `GET /api/v1/accounting/financial-statements/balance-sheet` - Generate balance sheet
- `POST /api/v1/accounting/bank-reconciliation` - AI-powered bank reconciliation

### AI-Powered Features
- `POST /api/v1/accounting/ai/analyze-journal-entry/{id}` - Analyze journal entry for anomalies
- `POST /api/v1/accounting/ai/suggest-journal-entry` - Suggest journal entries
- `POST /api/v1/accounting/ai/forecast-cash-flow` - Cash flow forecasting
- `POST /api/v1/accounting/ai/detect-fraud` - Fraud pattern detection
- `POST /api/v1/accounting/ai/optimize-tax-strategy` - Tax optimization suggestions
- `POST /api/v1/accounting/ai/chat` - Chat with AI accounting assistant

## Data Models

### ChartOfAccount
```python
class ChartOfAccount(BaseModel):
    code: str
    name: str
    type: str  # asset, liability, equity, revenue, expense
    parent_id: Optional[int] = None
    company_id: int
    currency_id: int
    active: bool = True
```

### JournalEntry
```python
class JournalEntry(BaseModel):
    date: date
    reference: Optional[str] = None
    company_id: int
    fiscal_year_id: Optional[int] = None
    lines: List[JournalEntryLine]
```

### FiscalYear
```python
class FiscalYear(BaseModel):
    name: Optional[str] = None
    start_date: date
    end_date: date
    company_id: int
    state: str = "open"  # open, closed
```

## AI Capabilities

### Journal Entry Analysis
- Anomaly detection in transactions
- Compliance checking
- Risk scoring

### Intelligent Suggestions
- Automatic journal entry suggestions
- Account mapping recommendations

### Financial Forecasting
- Cash flow predictions
- Trend analysis

### Fraud Detection
- Pattern recognition for suspicious activities
- Risk assessment

### Tax Optimization
- Deduction maximization suggestions
- Timing strategies

## Testing

The module includes comprehensive tests:
- Unit tests for business logic
- API endpoint tests
- Integration tests for complex workflows

Run tests with:
```bash
pytest backend/src/modules/accounting/test_service.py
pytest backend/src/modules/accounting/test_api.py
```

## Extending the Module

To add new features:
1. Extend the models in `models.py`
2. Add new schemas in `schemas.py`
3. Implement business logic in `service.py`
4. Create new API endpoints in `api.py`
5. Add AI capabilities in `ai_services.py`
6. Create AI API endpoints in `ai_api.py`
7. Add tests for new functionality