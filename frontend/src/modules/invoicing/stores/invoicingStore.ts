// Invoicing Store for FusionAI Enterprise Suite
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { 
  Customer, Product, Invoice, Payment, CreditNote, RecurringInvoiceTemplate,
  InvoicingState, CustomerFormData, ProductFormData, InvoiceFormData,
  PaymentFormData, CreditNoteFormData, RecurringInvoiceTemplateFormData,
  InvoiceAnalytics, CustomerStatement
} from '../types';

// API base URL
const API_BASE = '/api/v1/invoicing';

// Create the store with devtools middleware
export const useInvoicingStore = create<InvoicingState & {
  // Actions
  fetchCustomers: () => Promise<void>;
  createCustomer: (customer: CustomerFormData) => Promise<Customer>;
  updateCustomer: (id: number, customer: CustomerFormData) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;
  
  fetchProducts: () => Promise<void>;
  createProduct: (product: ProductFormData) => Promise<Product>;
  updateProduct: (id: number, product: ProductFormData) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  
  fetchInvoices: () => Promise<void>;
  createInvoice: (invoice: InvoiceFormData) => Promise<Invoice>;
  updateInvoice: (id: number, invoice: InvoiceFormData) => Promise<Invoice>;
  deleteInvoice: (id: number) => Promise<void>;
  sendInvoice: (id: number) => Promise<Invoice>;
  cancelInvoice: (id: number) => Promise<Invoice>;
  
  createPayment: (payment: PaymentFormData) => Promise<Payment>;
  updatePayment: (id: number, payment: PaymentFormData) => Promise<Payment>;
  deletePayment: (id: number) => Promise<void>;
  
  createCreditNote: (creditNote: CreditNoteFormData) => Promise<CreditNote>;
  updateCreditNote: (id: number, creditNote: CreditNoteFormData) => Promise<CreditNote>;
  deleteCreditNote: (id: number) => Promise<void>;
  issueCreditNote: (id: number) => Promise<CreditNote>;
  
  fetchRecurringTemplates: () => Promise<void>;
  createRecurringTemplate: (template: RecurringInvoiceTemplateFormData) => Promise<RecurringInvoiceTemplate>;
  updateRecurringTemplate: (id: number, template: RecurringInvoiceTemplateFormData) => Promise<RecurringInvoiceTemplate>;
  deleteRecurringTemplate: (id: number) => Promise<void>;
  
  fetchInvoiceAnalytics: (startDate: string, endDate: string) => Promise<InvoiceAnalytics>;
  fetchCustomerStatement: (customerId: number, startDate: string, endDate: string) => Promise<CustomerStatement>;
}>()(
  devtools((set, get) => ({
    // Initial state
    customers: [],
    products: [],
    invoices: [],
    payments: [],
    creditNotes: [],
    recurringTemplates: [],
    loading: false,
    error: null,
    
    // Customer actions
    fetchCustomers: async () => {
      set({ loading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/customers`);
        set({ customers: response.data, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch customers', loading: false });
      }
    },
    
    createCustomer: async (customer) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/customers`, customer);
        const newCustomer = response.data;
        set(state => ({
          customers: [...state.customers, newCustomer],
          loading: false
        }));
        return newCustomer;
      } catch (error) {
        set({ error: 'Failed to create customer', loading: false });
        throw error;
      }
    },
    
    updateCustomer: async (id, customer) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/customers/${id}`, customer);
        const updatedCustomer = response.data;
        set(state => ({
          customers: state.customers.map(c => c.id === id ? updatedCustomer : c),
          loading: false
        }));
        return updatedCustomer;
      } catch (error) {
        set({ error: 'Failed to update customer', loading: false });
        throw error;
      }
    },
    
    deleteCustomer: async (id) => {
      set({ loading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/customers/${id}`);
        set(state => ({
          customers: state.customers.filter(c => c.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete customer', loading: false });
        throw error;
      }
    },
    
    // Product actions
    fetchProducts: async () => {
      set({ loading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/products`);
        set({ products: response.data, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch products', loading: false });
      }
    },
    
    createProduct: async (product) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/products`, product);
        const newProduct = response.data;
        set(state => ({
          products: [...state.products, newProduct],
          loading: false
        }));
        return newProduct;
      } catch (error) {
        set({ error: 'Failed to create product', loading: false });
        throw error;
      }
    },
    
    updateProduct: async (id, product) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/products/${id}`, product);
        const updatedProduct = response.data;
        set(state => ({
          products: state.products.map(p => p.id === id ? updatedProduct : p),
          loading: false
        }));
        return updatedProduct;
      } catch (error) {
        set({ error: 'Failed to update product', loading: false });
        throw error;
      }
    },
    
    deleteProduct: async (id) => {
      set({ loading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/products/${id}`);
        set(state => ({
          products: state.products.filter(p => p.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete product', loading: false });
        throw error;
      }
    },
    
    // Invoice actions
    fetchInvoices: async () => {
      set({ loading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/invoices`);
        set({ invoices: response.data, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch invoices', loading: false });
      }
    },
    
    createInvoice: async (invoice) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/invoices`, invoice);
        const newInvoice = response.data;
        set(state => ({
          invoices: [...state.invoices, newInvoice],
          loading: false
        }));
        return newInvoice;
      } catch (error) {
        set({ error: 'Failed to create invoice', loading: false });
        throw error;
      }
    },
    
    updateInvoice: async (id, invoice) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/invoices/${id}`, invoice);
        const updatedInvoice = response.data;
        set(state => ({
          invoices: state.invoices.map(i => i.id === id ? updatedInvoice : i),
          loading: false
        }));
        return updatedInvoice;
      } catch (error) {
        set({ error: 'Failed to update invoice', loading: false });
        throw error;
      }
    },
    
    deleteInvoice: async (id) => {
      set({ loading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/invoices/${id}`);
        set(state => ({
          invoices: state.invoices.filter(i => i.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete invoice', loading: false });
        throw error;
      }
    },
    
    sendInvoice: async (id) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/invoices/${id}/send`);
        const updatedInvoice = response.data;
        set(state => ({
          invoices: state.invoices.map(i => i.id === id ? updatedInvoice : i),
          loading: false
        }));
        return updatedInvoice;
      } catch (error) {
        set({ error: 'Failed to send invoice', loading: false });
        throw error;
      }
    },
    
    cancelInvoice: async (id) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/invoices/${id}/cancel`);
        const updatedInvoice = response.data;
        set(state => ({
          invoices: state.invoices.map(i => i.id === id ? updatedInvoice : i),
          loading: false
        }));
        return updatedInvoice;
      } catch (error) {
        set({ error: 'Failed to cancel invoice', loading: false });
        throw error;
      }
    },
    
    // Payment actions
    createPayment: async (payment) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/payments`, payment);
        const newPayment = response.data;
        set(state => ({
          payments: [...state.payments, newPayment],
          loading: false
        }));
        return newPayment;
      } catch (error) {
        set({ error: 'Failed to create payment', loading: false });
        throw error;
      }
    },
    
    updatePayment: async (id, payment) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/payments/${id}`, payment);
        const updatedPayment = response.data;
        set(state => ({
          payments: state.payments.map(p => p.id === id ? updatedPayment : p),
          loading: false
        }));
        return updatedPayment;
      } catch (error) {
        set({ error: 'Failed to update payment', loading: false });
        throw error;
      }
    },
    
    deletePayment: async (id) => {
      set({ loading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/payments/${id}`);
        set(state => ({
          payments: state.payments.filter(p => p.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete payment', loading: false });
        throw error;
      }
    },
    
    // Credit Note actions
    createCreditNote: async (creditNote) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/credit-notes`, creditNote);
        const newCreditNote = response.data;
        set(state => ({
          creditNotes: [...state.creditNotes, newCreditNote],
          loading: false
        }));
        return newCreditNote;
      } catch (error) {
        set({ error: 'Failed to create credit note', loading: false });
        throw error;
      }
    },
    
    updateCreditNote: async (id, creditNote) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/credit-notes/${id}`, creditNote);
        const updatedCreditNote = response.data;
        set(state => ({
          creditNotes: state.creditNotes.map(cn => cn.id === id ? updatedCreditNote : cn),
          loading: false
        }));
        return updatedCreditNote;
      } catch (error) {
        set({ error: 'Failed to update credit note', loading: false });
        throw error;
      }
    },
    
    deleteCreditNote: async (id) => {
      set({ loading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/credit-notes/${id}`);
        set(state => ({
          creditNotes: state.creditNotes.filter(cn => cn.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete credit note', loading: false });
        throw error;
      }
    },
    
    issueCreditNote: async (id) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/credit-notes/${id}/issue`);
        const updatedCreditNote = response.data;
        set(state => ({
          creditNotes: state.creditNotes.map(cn => cn.id === id ? updatedCreditNote : cn),
          loading: false
        }));
        return updatedCreditNote;
      } catch (error) {
        set({ error: 'Failed to issue credit note', loading: false });
        throw error;
      }
    },
    
    // Recurring Template actions
    fetchRecurringTemplates: async () => {
      set({ loading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/recurring-templates`);
        set({ recurringTemplates: response.data, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch recurring templates', loading: false });
      }
    },
    
    createRecurringTemplate: async (template) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/recurring-templates`, template);
        const newTemplate = response.data;
        set(state => ({
          recurringTemplates: [...state.recurringTemplates, newTemplate],
          loading: false
        }));
        return newTemplate;
      } catch (error) {
        set({ error: 'Failed to create recurring template', loading: false });
        throw error;
      }
    },
    
    updateRecurringTemplate: async (id, template) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/recurring-templates/${id}`, template);
        const updatedTemplate = response.data;
        set(state => ({
          recurringTemplates: state.recurringTemplates.map(rt => rt.id === id ? updatedTemplate : rt),
          loading: false
        }));
        return updatedTemplate;
      } catch (error) {
        set({ error: 'Failed to update recurring template', loading: false });
        throw error;
      }
    },
    
    deleteRecurringTemplate: async (id) => {
      set({ loading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/recurring-templates/${id}`);
        set(state => ({
          recurringTemplates: state.recurringTemplates.filter(rt => rt.id !== id),
          loading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete recurring template', loading: false });
        throw error;
      }
    },
    
    // Analytics actions
    fetchInvoiceAnalytics: async (startDate, endDate) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/analytics/invoice`, {
          params: { start_date: startDate, end_date: endDate }
        });
        set({ loading: false });
        return response.data;
      } catch (error) {
        set({ error: 'Failed to fetch invoice analytics', loading: false });
        throw error;
      }
    },
    
    fetchCustomerStatement: async (customerId, startDate, endDate) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/customer-statement`, {
          customer_id: customerId,
          start_date: startDate,
          end_date: endDate
        });
        set({ loading: false });
        return response.data;
      } catch (error) {
        set({ error: 'Failed to fetch customer statement', loading: false });
        throw error;
      }
    }
  }))
);

export default useInvoicingStore;