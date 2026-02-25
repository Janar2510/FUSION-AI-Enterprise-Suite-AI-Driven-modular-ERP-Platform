# Invoicing Module - Frontend

## Overview
The frontend invoicing module provides a comprehensive user interface for managing invoices, customers, products, payments, and credit notes. It integrates with the backend invoicing API to provide a seamless user experience.

## Features
- Customer management with billing and shipping information
- Product catalog with pricing and tax information
- Invoice creation with line items and tax calculation
- Payment tracking and reconciliation
- Credit note processing for refunds and adjustments
- Recurring invoice templates for automated billing
- Multi-currency support
- Comprehensive reporting and analytics dashboard

## Components
- `InvoicingDashboard` - Main dashboard with metrics and quick actions
- (Additional components to be implemented)

## Types
- `Customer` - Customer information interface
- `Product` - Product catalog interface
- `Invoice` - Invoice header and line items interface
- `Payment` - Payment tracking interface
- `CreditNote` - Credit note interface
- `RecurringInvoiceTemplate` - Recurring invoice template interface

## Stores
- `useInvoicingStore` - Zustand store for managing invoicing state and API calls

## Integration
The frontend invoicing module integrates with:
- Backend invoicing API
- Accounting module for tax and payment term information
- Contact Hub for customer information

## Usage
To use the invoicing module in your application:

```typescript
import { InvoicingDashboard, useInvoicingStore } from './modules/invoicing';

// In your component
const MyComponent = () => {
  return (
    <div>
      <InvoicingDashboard />
    </div>
  );
};

// Using the store
const { customers, fetchCustomers } = useInvoicingStore();
```

## Dependencies
- React 18+
- Zustand for state management
- Axios for API calls
- Tailwind CSS for styling

## Development
To run the invoicing module in development:

1. Ensure the backend invoicing API is running
2. Import and use the components in your application
3. Customize the styling and behavior as needed

## Testing
The module includes:
- TypeScript type definitions for all interfaces
- Zustand store with proper state management
- Component examples for integration

## Future Enhancements
- Additional form components for customer, product, and invoice management
- Advanced reporting and analytics views
- Email notification integration
- PDF generation for invoices and credit notes
- Export functionality (CSV, Excel)