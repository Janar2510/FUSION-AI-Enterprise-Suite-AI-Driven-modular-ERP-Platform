// Sales Module Types for FusionAI Enterprise Suite

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded'
}

export interface QuoteItem {
  id?: number;
  quote_id?: number;
  product_name: string;
  product_description?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  discount_amount: number;
  line_total: number;
  sort_order: number;
  created_at?: string;
}

export interface Quote {
  id: number;
  quote_number: string;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  title: string;
  description?: string;
  status: QuoteStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  quote_date: string;
  valid_until?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  notes?: string;
  terms_conditions?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
  items: QuoteItem[];
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_name: string;
  product_description?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  discount_amount: number;
  line_total: number;
  quantity_shipped: number;
  quantity_delivered: number;
  sort_order: number;
  created_at?: string;
}

export interface Order {
  id: number;
  order_number: string;
  quote_id?: number;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  title: string;
  description?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_method?: string;
  payment_due_date?: string;
  paid_at?: string;
  shipping_address?: Record<string, any>;
  shipping_method?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  order_date: string;
  expected_delivery?: string;
  notes?: string;
  internal_notes?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface Revenue {
  id: number;
  order_id: number;
  revenue_type: 'sale' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  description?: string;
  revenue_date: string;
  period_year: number;
  period_month: number;
  period_quarter: number;
  created_at: string;
}

export interface SalesAnalytics {
  period_days: number;
  total_revenue: number;
  total_orders: number;
  total_quotes: number;
  conversion_rate: number;
  average_order_value: number;
  top_products: Array<{
    product_name: string;
    revenue: number;
    quantity_sold: number;
  }>;
  revenue_by_month: Array<{
    month: string;
    revenue: number;
  }>;
  order_status_distribution: Record<string, number>;
  payment_status_distribution: Record<string, number>;
}

export interface SalesForecast {
  period: string;
  forecasted_revenue: number;
  confidence_level: number;
  factors: string[];
  recommendations: string[];
}

export interface SalesDashboard {
  metrics_30d: SalesAnalytics;
  metrics_7d: SalesAnalytics;
  recent_quotes: Quote[];
  recent_orders: Order[];
  timestamp: string;
}

// Form Types
export interface CreateQuoteRequest {
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  title: string;
  description?: string;
  valid_until?: string;
  notes?: string;
  terms_conditions?: string;
  items: Array<{
    product_name: string;
    product_description?: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
    discount_rate: number;
    sort_order: number;
  }>;
}

export interface CreateOrderRequest {
  quote_id?: number;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  title: string;
  description?: string;
  shipping_address?: Record<string, any>;
  shipping_method?: string;
  payment_method?: string;
  notes?: string;
  internal_notes?: string;
  items: Array<{
    product_name: string;
    product_description?: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
    discount_rate: number;
    sort_order: number;
  }>;
}

export interface CreateRevenueRequest {
  order_id: number;
  revenue_type: 'sale' | 'refund' | 'adjustment';
  amount: number;
  currency?: string;
  description?: string;
}

// Filter Types
export interface QuoteFilters {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  customer_id?: number;
  search?: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  customer_id?: number;
  search?: string;
}

// Status Colors
export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [QuoteStatus.SENT]: 'bg-blue-100 text-blue-800',
  [QuoteStatus.VIEWED]: 'bg-yellow-100 text-yellow-800',
  [QuoteStatus.ACCEPTED]: 'bg-green-100 text-green-800',
  [QuoteStatus.REJECTED]: 'bg-red-100 text-red-800',
  [QuoteStatus.EXPIRED]: 'bg-orange-100 text-orange-800'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-gray-100 text-gray-800',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.PROCESSING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [OrderStatus.RETURNED]: 'bg-orange-100 text-orange-800'
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-gray-100 text-gray-800',
  [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
  [PaymentStatus.PARTIAL]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.OVERDUE]: 'bg-red-100 text-red-800',
  [PaymentStatus.REFUNDED]: 'bg-orange-100 text-orange-800'
};




