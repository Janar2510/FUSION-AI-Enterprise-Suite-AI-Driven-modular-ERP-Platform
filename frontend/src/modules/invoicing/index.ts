// Invoicing Module Index - Export all components, types, and stores

// Types
export * from './types';

// Components
export { default as InvoicingDashboard } from './components/InvoicingDashboard';

// Stores
export { default as useInvoicingStore } from './stores/invoicingStore';

// Module metadata
export const invoicingModule = {
  id: 'invoicing',
  name: 'Invoicing',
  description: 'Complete invoice management and billing system',
  icon: '📄',
  color: 'blue',
  version: '1.0.0',
  dependencies: ['accounting'],
  features: [
    'Customer Management',
    'Product Catalog',
    'Invoice Creation',
    'Payment Tracking',
    'Credit Notes',
    'Recurring Invoices',
    'Analytics & Reporting'
  ]
};