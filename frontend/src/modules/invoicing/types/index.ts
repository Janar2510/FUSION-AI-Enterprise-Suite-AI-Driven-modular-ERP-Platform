// Invoicing Types for FusionAI Enterprise Suite

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  taxId?: string;
  paymentTermsId?: number;
  currencyId?: number;
  creditLimit?: number;
  outstandingBalance: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  cost?: number;
  taxId?: number;
  category?: string;
  inventoryItem: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: number;
  invoiceId: number;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxId?: number;
  taxAmount: number;
  lineTotal: number;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currencyId?: number;
  paymentTermsId?: number;
  notes?: string;
  terms?: string;
  sentAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
}

export interface Payment {
  id: number;
  invoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'credit_card' | 'bank_transfer';
  reference?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteLine {
  id: number;
  creditNoteId: number;
  invoiceLineId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxId?: number;
  taxAmount: number;
  lineTotal: number;
  createdAt: string;
}

export interface CreditNote {
  id: number;
  creditNoteNumber: string;
  invoiceId: number;
  customerId: number;
  creditDate: string;
  status: 'draft' | 'issued' | 'applied';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  issuedAt?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
  lines: CreditNoteLine[];
}

export interface RecurringTemplateLine {
  id: number;
  templateId: number;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxId?: number;
  taxAmount: number;
  lineTotal: number;
  createdAt: string;
}

export interface RecurringInvoiceTemplate {
  id: number;
  name: string;
  customerId: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextInvoiceDate?: string;
  status: 'active' | 'paused' | 'completed';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currencyId?: number;
  paymentTermsId?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines: RecurringTemplateLine[];
}

// UI State Types
export interface InvoicingState {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  payments: Payment[];
  creditNotes: CreditNote[];
  recurringTemplates: RecurringInvoiceTemplate[];
  loading: boolean;
  error: string | null;
}

// Form Data Types
export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  taxId?: string;
  paymentTermsId?: number;
  currencyId?: number;
  creditLimit?: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  cost?: number;
  taxId?: number;
  category?: string;
  inventoryItem: boolean;
  active: boolean;
}

export interface InvoiceLineFormData {
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxId?: number;
}

export interface InvoiceFormData {
  customerId: number;
  invoiceDate: string;
  dueDate: string;
  paymentTermsId?: number;
  notes?: string;
  terms?: string;
  lines: InvoiceLineFormData[];
}

export interface PaymentFormData {
  invoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'credit_card' | 'bank_transfer';
  reference?: string;
  notes?: string;
}

export interface CreditNoteLineFormData {
  invoiceLineId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxId?: number;
}

export interface CreditNoteFormData {
  invoiceId: number;
  customerId: number;
  creditDate: string;
  notes?: string;
  lines: CreditNoteLineFormData[];
}

export interface RecurringTemplateLineFormData {
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxId?: number;
}

export interface RecurringInvoiceTemplateFormData {
  name: string;
  customerId: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  paymentTermsId?: number;
  notes?: string;
  lines: RecurringTemplateLineFormData[];
}

// Analytics Types
export interface InvoiceAnalytics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  paidInvoices: number;
  overdueInvoices: number;
  averagePaymentTime: number;
  customerMetrics: Array<{
    customerId: number;
    customerName: string;
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
  }>;
}

export interface CustomerStatement {
  customer: Customer;
  openingBalance: number;
  closingBalance: number;
  transactions: Array<{
    date: string;
    type: string;
    reference: string;
    amount: number;
    balance: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}