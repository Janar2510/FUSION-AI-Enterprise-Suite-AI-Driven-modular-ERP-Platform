from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum

class ProductStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONTINUED = "discontinued"
    OUT_OF_STOCK = "out_of_stock"

class StockMovementType(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    RETURN = "return"
    DAMAGE = "damage"
    LOSS = "loss"

# Warehouse Location Schemas
class WarehouseLocationBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    is_active: bool = True

class WarehouseLocationCreate(WarehouseLocationBase):
    pass

class WarehouseLocationResponse(WarehouseLocationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Product Category Schemas
class ProductCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool = True

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryResponse(ProductCategoryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, Any]] = None
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    msrp: Optional[Decimal] = None
    min_stock_level: int = 0
    max_stock_level: int = 1000
    reorder_point: int = 10
    reorder_quantity: int = 50
    status: ProductStatus = ProductStatus.ACTIVE
    is_trackable: bool = True
    is_serialized: bool = False
    barcode: Optional[str] = None
    tags: Optional[List[str]] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, Any]] = None
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    msrp: Optional[Decimal] = None
    min_stock_level: Optional[int] = None
    max_stock_level: Optional[int] = None
    reorder_point: Optional[int] = None
    reorder_quantity: Optional[int] = None
    status: Optional[ProductStatus] = None
    is_trackable: Optional[bool] = None
    is_serialized: Optional[bool] = None
    barcode: Optional[str] = None
    tags: Optional[List[str]] = None

class ProductResponse(ProductBase):
    id: int
    current_stock: int
    last_restocked: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Stock Movement Schemas
class StockMovementBase(BaseModel):
    product_id: int
    warehouse_id: int
    movement_type: StockMovementType
    quantity: int
    unit_cost: Optional[Decimal] = None
    reference_number: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    serial_numbers: Optional[List[str]] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementResponse(StockMovementBase):
    id: int
    total_cost: Optional[Decimal] = None
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Demand Forecast Schemas
class DemandForecastBase(BaseModel):
    product_id: int
    forecast_period: str
    forecast_date: datetime
    forecasted_quantity: int
    confidence_level: float = Field(..., ge=0.0, le=1.0)
    historical_demand: Optional[List[int]] = None
    seasonal_factors: Optional[Dict[str, float]] = None
    forecast_method: str
    model_parameters: Optional[Dict[str, Any]] = None

class DemandForecastCreate(DemandForecastBase):
    pass

class DemandForecastResponse(DemandForecastBase):
    id: int
    mape: Optional[float] = None
    rmse: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Inventory Alert Schemas
class InventoryAlertBase(BaseModel):
    product_id: int
    alert_type: str
    severity: str
    message: str
    current_stock: int
    threshold_value: int

class InventoryAlertCreate(InventoryAlertBase):
    pass

class InventoryAlertResponse(InventoryAlertBase):
    id: int
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Inventory Transaction Schemas
class InventoryTransactionBase(BaseModel):
    product_id: int
    warehouse_id: int
    transaction_type: str
    quantity: int
    unit_price: Optional[Decimal] = None
    reference_document: Optional[str] = None
    reference_id: Optional[int] = None
    description: Optional[str] = None
    notes: Optional[str] = None

class InventoryTransactionCreate(InventoryTransactionBase):
    pass

class InventoryTransactionResponse(InventoryTransactionBase):
    id: int
    total_value: Optional[Decimal] = None
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics Schemas
class InventoryAnalytics(BaseModel):
    period_days: int
    total_products: int
    total_value: float
    low_stock_items: int
    out_of_stock_items: int
    overstock_items: int
    stock_turnover_rate: float
    top_moving_products: List[Dict[str, Any]]
    stock_value_by_category: List[Dict[str, Any]]
    warehouse_utilization: List[Dict[str, Any]]
    demand_forecast_accuracy: float

class StockLevelReport(BaseModel):
    product_id: int
    product_name: str
    sku: str
    current_stock: int
    min_stock_level: int
    max_stock_level: int
    reorder_point: int
    reorder_quantity: int
    status: str
    last_movement_date: Optional[datetime] = None
    stock_value: float
    days_of_supply: Optional[int] = None

class DemandForecastReport(BaseModel):
    product_id: int
    product_name: str
    sku: str
    current_stock: int
    forecasted_demand: int
    confidence_level: float
    forecast_method: str
    recommended_action: str
    suggested_reorder_quantity: int
    forecast_date: datetime

# Filter Schemas
class ProductFilters(BaseModel):
    page: Optional[int] = Field(1, ge=1)
    limit: Optional[int] = Field(50, ge=1, le=100)
    category_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    status: Optional[ProductStatus] = None
    search: Optional[str] = None
    low_stock_only: Optional[bool] = None
    out_of_stock_only: Optional[bool] = None

class StockMovementFilters(BaseModel):
    page: Optional[int] = Field(1, ge=1)
    limit: Optional[int] = Field(50, ge=1, le=100)
    product_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    movement_type: Optional[StockMovementType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None



