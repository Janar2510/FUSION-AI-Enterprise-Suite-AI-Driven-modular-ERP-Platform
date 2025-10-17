// Inventory Module Types
export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category_id?: number;
  warehouse_id?: number;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  cost_price?: number;
  selling_price?: number;
  msrp?: number;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  status: ProductStatus;
  is_trackable: boolean;
  is_serialized: boolean;
  barcode?: string;
  tags?: string[];
  last_restocked?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface WarehouseLocation {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_number?: string;
  reference_type?: string;
  reference_id?: number;
  reason?: string;
  notes?: string;
  serial_numbers?: string[];
  created_by?: number;
  created_at: string;
}

export interface DemandForecast {
  id: number;
  product_id: number;
  forecast_period: string;
  forecast_date: string;
  forecasted_quantity: number;
  confidence_level: number;
  historical_demand?: number[];
  seasonal_factors?: Record<string, number>;
  forecast_method: string;
  model_parameters?: Record<string, any>;
  mape?: number;
  rmse?: number;
  created_at: string;
  updated_at?: string;
}

export interface InventoryAlert {
  id: number;
  product_id: number;
  alert_type: string;
  severity: string;
  message: string;
  current_stock: number;
  threshold_value: number;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: number;
  created_at: string;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  warehouse_id: number;
  transaction_type: string;
  quantity: number;
  unit_price?: number;
  total_value?: number;
  reference_document?: string;
  reference_id?: number;
  description?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
}

// Enums
export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONTINUED = "discontinued",
  OUT_OF_STOCK = "out_of_stock"
}

export enum StockMovementType {
  INBOUND = "inbound",
  OUTBOUND = "outbound",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
  RETURN = "return",
  DAMAGE = "damage",
  LOSS = "loss"
}

// Dashboard and Analytics Types
export interface InventoryDashboardMetrics {
  period_days: number;
  total_products: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  overstock_items: number;
  stock_turnover_rate: number;
  top_moving_products: any[];
  stock_value_by_category: any[];
  warehouse_utilization: any[];
  demand_forecast_accuracy: number;
}

export interface InventoryDashboard {
  metrics_30d: InventoryDashboardMetrics;
  metrics_7d: InventoryDashboardMetrics;
  stock_report: StockLevelReport[];
  low_stock_products: Product[];
  out_of_stock_products: Product[];
  timestamp: string;
}

export interface StockLevelReport {
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  status: string;
  last_movement_date?: string;
  stock_value: number;
  days_of_supply?: number;
}

export interface DemandForecastReport {
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  forecasted_demand: number;
  confidence_level: number;
  forecast_method: string;
  recommended_action: string;
  suggested_reorder_quantity: number;
  forecast_date: string;
}

// Filter Types
export interface ProductFilters {
  page?: number;
  limit?: number;
  category_id?: number;
  warehouse_id?: number;
  status?: ProductStatus;
  search?: string;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean;
}

export interface StockMovementFilters {
  page?: number;
  limit?: number;
  product_id?: number;
  warehouse_id?: number;
  movement_type?: StockMovementType;
  start_date?: string;
  end_date?: string;
}



