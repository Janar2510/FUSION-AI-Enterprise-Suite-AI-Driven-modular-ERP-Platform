// Sales Module Exports for FusionAI Enterprise Suite

export { SalesDashboard } from './components/SalesDashboard';
export { useSalesStore } from './stores/salesStore';
export * from './types';

// Re-export commonly used types
export type {
  Quote,
  Order,
  Revenue,
  SalesAnalytics,
  SalesDashboard as SalesDashboardType,
  CreateQuoteRequest,
  CreateOrderRequest,
  CreateRevenueRequest,
  QuoteFilters,
  OrderFilters
} from './types';




