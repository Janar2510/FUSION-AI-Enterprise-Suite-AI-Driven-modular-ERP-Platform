// Accounting Module Types
export interface ChartOfAccounts {
  id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account_id?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AccountingTransaction {
  id: number;
  transaction_number: string;
  account_id: number;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  description?: string;
  reference_number?: string;
  reference_type?: string;
  reference_id?: number;
  transaction_date: string;
  due_date?: string;
  posted_date?: string;
  notes?: string;
  tags?: string[];
  transaction_metadata?: Record<string, any>;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer_name: string;
  customer_email: string;
  title: string;
  description?: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_reference?: string;
  invoice_date: string;
  due_date: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  terms_conditions?: string;
  notes?: string;
  internal_notes?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_name: string;
  product_description?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  discount_amount: number;
  line_total: number;
  sort_order: number;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: number;
  payment_number: string;
  invoice_id: number;
  customer_id?: number;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference?: string;
  payment_date: string;
  notes?: string;
  payment_metadata?: Record<string, any>;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface JournalEntry {
  id: number;
  entry_number: string;
  description: string;
  reference_number?: string;
  reference_type?: string;
  entry_date: string;
  posted_date?: string;
  notes?: string;
  tags?: string[];
  created_by?: number;
  created_at: string;
  updated_at?: string;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: number;
  journal_entry_id: number;
  account_id: number;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface FinancialReport {
  id: number;
  report_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  report_data?: Record<string, any>;
  description?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: number;
  tax_type: string;
  description?: string;
  is_active: boolean;
  effective_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface Budget {
  id: number;
  budget_name: string;
  budget_type: string;
  period_start: string;
  period_end: string;
  total_budget: number;
  currency: string;
  description?: string;
  notes?: string;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at?: string;
  items: BudgetItem[];
}

export interface BudgetItem {
  id: number;
  budget_id: number;
  account_id: number;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Enums
export enum AccountType {
  ASSET = "asset",
  LIABILITY = "liability",
  EQUITY = "equity",
  REVENUE = "revenue",
  EXPENSE = "expense"
}

export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
  ASSET = "asset",
  LIABILITY = "liability",
  EQUITY = "equity"
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
  PARTIAL = "partial"
}

export enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  VIEWED = "viewed",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled"
}

// Dashboard and Analytics Types
export interface AccountingAnalytics {
  period_days: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  total_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  total_payments: number;
  accounts_receivable: number;
  accounts_payable: number;
  cash_flow: number;
  profit_margin: number;
  revenue_growth: number;
  expense_growth: number;
}

export interface AccountingDashboard {
  metrics_30d: AccountingAnalytics;
  metrics_7d: AccountingAnalytics;
  recent_invoices: Invoice[];
  recent_payments: Payment[];
  timestamp: string;
}

export interface InvoiceAnalytics {
  period_days: number;
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  average_invoice_value: number;
  payment_rate: number;
  overdue_rate: number;
  top_customers: Array<{
    customer_name: string;
    total_amount: number;
    invoice_count: number;
  }>;
  invoice_trends: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface CashFlowReport {
  period_start: string;
  period_end: string;
  opening_balance: number;
  closing_balance: number;
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  net_cash_flow: number;
  cash_flow_items: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'inflow' | 'outflow';
  }>;
}

// Filter Types
export interface InvoiceFilters {
  page?: number;
  limit?: number;
  customer_id?: number;
  status?: InvoiceStatus;
  payment_status?: PaymentStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  account_id?: number;
  transaction_type?: TransactionType;
  start_date?: string;
  end_date?: string;
  search?: string;
}

// Form Types
export interface InvoiceCreateData {
  customer_id?: number;
  customer_name: string;
  customer_email: string;
  title: string;
  description?: string;
  subtotal: number;
  tax_rate: number;
  discount_rate: number;
  invoice_date: string;
  due_date: string;
  terms_conditions?: string;
  notes?: string;
  internal_notes?: string;
  items: InvoiceItemCreateData[];
}

export interface InvoiceItemCreateData {
  product_name: string;
  product_description?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  sort_order: number;
  notes?: string;
}

export interface PaymentCreateData {
  invoice_id: number;
  customer_id?: number;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference?: string;
  payment_date: string;
  notes?: string;
  payment_metadata?: Record<string, any>;
}

// Accounting Types

export interface ChartOfAccount {
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

export interface FiscalYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  company_id: number;
  state: string; // open, closed
  created_at: string;
}

export interface JournalEntryLine {
  id: number;
  journal_entry_id: number;
  account_id: number;
  debit: number;
  credit: number;
  description: string | null;
  partner_id: number | null;
  tax_id: number | null;
  analytic_account_id: number | null;
}

export interface JournalEntry {
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

export interface Tax {
  id: number;
  name: string;
  type: string | null; // percent, fixed, group
  amount: number | null;
  account_id: number | null;
  company_id: number;
  active: boolean;
}

export interface BankStatement {
  id: number;
  bank_account_id: number;
  statement_number: string | null;
  start_date: string | null;
  end_date: string | null;
  balance_start: number | null;
  balance_end: number | null;
  state: string; // draft, confirmed, reconciled
}

export interface PaymentTerm {
  id: number;
  name: string | null;
  days: number | null;
  type: string | null; // net, percent, fixed
  value: number | null;
}

export interface BalanceSheetResponse {
  as_of_date: string;
  company_id: number;
  assets: Array<{id: number, code: string, name: string, balance: number}>;
  liabilities: Array<{id: number, code: string, name: string, balance: number}>;
  equity: Array<{id: number, code: string, name: string, balance: number}>;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

export interface BankReconciliationCreate {
  bank_account_id: number;
  start_date: string;
  end_date: string;
}

export interface BankReconciliationResponse {
  total_bank_transactions: number;
  total_journal_entries: number;
  auto_matched: number;
  manual_review_required: number;
  unmatched_bank: number;
  unmatched_journal: number;
}

// UI State Types
export interface AccountingState {
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
  fetchChartOfAccounts: (skip?: number, limit?: number) => Promise<void>;
  fetchJournalEntries: (skip?: number, limit?: number, stateFilter?: string | null) => Promise<void>;
}

// Form Data Types
export interface ChartOfAccountFormData {
  code: string;
  name: string;
  type: string;
  parent_id: number | null;
  company_id: number;
  currency_id: number;
  active: boolean;
}

export interface FiscalYearFormData {
  name: string;
  start_date: string;
  end_date: string;
  company_id: number;
  state: string;
}

export interface JournalEntryLineFormData {
  account_id: number;
  debit: number;
  credit: number;
  description: string | null;
  partner_id: number | null;
  tax_id: number | null;
  analytic_account_id: number | null;
}

export interface JournalEntryFormData {
  date: string;
  reference: string | null;
  company_id: number;
  fiscal_year_id: number | null;
  lines: JournalEntryLineFormData[];
}

export interface TaxFormData {
  name: string;
  type: string | null;
  amount: number | null;
  account_id: number | null;
  company_id: number;
  active: boolean;
}

export interface BankStatementFormData {
  bank_account_id: number;
  statement_number: string | null;
  start_date: string | null;
  end_date: string | null;
  balance_start: number | null;
  balance_end: number | null;
  state: string;
}

export interface PaymentTermFormData {
  name: string | null;
  days: number | null;
  type: string | null;
  value: number | null;
}
