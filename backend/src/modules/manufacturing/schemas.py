"""
Manufacturing Module Pydantic Schemas
Data validation and serialization for manufacturing operations
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class ProductionStatus(str, Enum):
    """Production status enumeration"""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class QualityStatus(str, Enum):
    """Quality status enumeration"""
    PENDING = "pending"
    IN_INSPECTION = "in_inspection"
    PASSED = "passed"
    FAILED = "failed"
    NEEDS_REWORK = "needs_rework"


class OrderPriority(str, Enum):
    """Order priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"


class InventoryType(str, Enum):
    """Inventory type enumeration"""
    RAW_MATERIAL = "raw_material"
    WORK_IN_PROGRESS = "work_in_progress"
    FINISHED_GOOD = "finished_good"
    COMPONENT = "component"
    SUPPLY = "supply"


class CheckType(str, Enum):
    """Quality check type enumeration"""
    INCOMING = "incoming"
    IN_PROCESS = "in_process"
    FINAL = "final"
    RANDOM = "random"


# Base schemas
class ProductionOrderBase(BaseModel):
    """Base production order schema"""
    product_name: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., ge=1)
    priority: OrderPriority = Field(default=OrderPriority.MEDIUM)
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    work_center_id: Optional[int] = None
    routing_id: Optional[int] = None
    quality_standards: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    customer_order_id: Optional[int] = None


class ProductionOrderCreate(ProductionOrderBase):
    """Schema for creating a production order"""
    product_id: int


class ProductionOrderUpdate(BaseModel):
    """Schema for updating a production order"""
    quantity: Optional[int] = Field(None, ge=1)
    priority: Optional[OrderPriority] = None
    status: Optional[ProductionStatus] = None
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    work_center_id: Optional[int] = None
    routing_id: Optional[int] = None
    quality_standards: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None


class ProductionOrderResponse(ProductionOrderBase):
    """Schema for production order responses"""
    id: int
    order_number: str
    product_id: int
    status: str
    actual_start_date: Optional[datetime]
    actual_end_date: Optional[datetime]
    completion_percentage: float
    units_completed: int
    units_scrapped: int
    estimated_cost: Optional[float]
    actual_cost: Optional[float]
    material_cost: Optional[float]
    labor_cost: Optional[float]
    overhead_cost: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    """Base product schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    product_type: Optional[str] = None
    category: Optional[str] = None
    unit_of_measure: str = Field(default="pcs", max_length=20)
    dimensions: Optional[Dict[str, Any]] = None
    weight: Optional[float] = None
    specifications: Optional[Dict[str, Any]] = None
    standard_cycle_time: Optional[float] = None
    is_make_to_order: bool = Field(default=False)
    is_make_to_stock: bool = Field(default=True)
    minimum_stock_level: int = Field(default=0)
    maximum_stock_level: Optional[int] = None
    reorder_point: int = Field(default=0)


class ProductCreate(ProductBase):
    """Schema for creating a product"""
    product_code: str = Field(..., min_length=1, max_length=50)


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    product_type: Optional[str] = None
    category: Optional[str] = None
    unit_of_measure: Optional[str] = None
    dimensions: Optional[Dict[str, Any]] = None
    weight: Optional[float] = None
    specifications: Optional[Dict[str, Any]] = None
    standard_cycle_time: Optional[float] = None
    is_make_to_order: Optional[bool] = None
    is_make_to_stock: Optional[bool] = None
    minimum_stock_level: Optional[int] = None
    maximum_stock_level: Optional[int] = None
    reorder_point: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    """Schema for product responses"""
    id: int
    product_code: str
    standard_cost: Optional[float]
    material_cost: Optional[float]
    labor_cost: Optional[float]
    overhead_cost: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class WorkCenterBase(BaseModel):
    """Base work center schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    work_center_type: Optional[str] = None
    capacity: Optional[int] = None
    efficiency: float = Field(default=100.0)
    location: Optional[str] = None
    setup_time: Optional[float] = None
    hourly_rate: Optional[float] = None
    overhead_rate: Optional[float] = None


class WorkCenterCreate(WorkCenterBase):
    """Schema for creating a work center"""
    code: str = Field(..., min_length=1, max_length=20)


class WorkCenterUpdate(BaseModel):
    """Schema for updating a work center"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    work_center_type: Optional[str] = None
    capacity: Optional[int] = None
    efficiency: Optional[float] = None
    location: Optional[str] = None
    setup_time: Optional[float] = None
    hourly_rate: Optional[float] = None
    overhead_rate: Optional[float] = None
    is_active: Optional[bool] = None
    is_available: Optional[bool] = None


class WorkCenterResponse(WorkCenterBase):
    """Schema for work center responses"""
    id: int
    code: str
    is_active: bool
    is_available: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class RoutingBase(BaseModel):
    """Base routing schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    version: str = Field(default="1.0", max_length=20)


class RoutingCreate(RoutingBase):
    """Schema for creating a routing"""
    routing_number: str = Field(..., min_length=1, max_length=50)
    product_id: Optional[int] = None


class RoutingResponse(RoutingBase):
    """Schema for routing responses"""
    id: int
    routing_number: str
    product_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class RoutingOperationBase(BaseModel):
    """Base routing operation schema"""
    operation_number: str = Field(..., min_length=1, max_length=20)
    operation_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    work_center_id: int
    setup_time: Optional[float] = None
    run_time: Optional[float] = None
    queue_time: Optional[float] = None
    wait_time: Optional[float] = None
    sequence_number: int


class RoutingOperationCreate(RoutingOperationBase):
    """Schema for creating a routing operation"""
    routing_id: int


class RoutingOperationResponse(RoutingOperationBase):
    """Schema for routing operation responses"""
    id: int
    routing_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class BOMBase(BaseModel):
    """Base BOM schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    version: str = Field(default="1.0", max_length=20)


class BOMCreate(BOMBase):
    """Schema for creating a BOM"""
    bom_number: str = Field(..., min_length=1, max_length=50)
    product_id: int


class BOMResponse(BOMBase):
    """Schema for BOM responses"""
    id: int
    bom_number: str
    product_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class BOMItemBase(BaseModel):
    """Base BOM item schema"""
    quantity: float = Field(..., ge=0)
    unit_of_measure: str = Field(default="pcs", max_length=20)
    notes: Optional[str] = None
    is_optional: bool = Field(default=False)


class BOMItemCreate(BOMItemBase):
    """Schema for creating a BOM item"""
    bom_id: int
    component_id: int


class BOMItemResponse(BOMItemBase):
    """Schema for BOM item responses"""
    id: int
    bom_id: int
    component_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class InventoryItemBase(BaseModel):
    """Base inventory item schema"""
    item_type: InventoryType = Field(default=InventoryType.RAW_MATERIAL)
    location: Optional[str] = None
    batch_number: Optional[str] = None
    serial_number: Optional[str] = None
    quantity_on_hand: float = Field(default=0, ge=0)
    quantity_reserved: float = Field(default=0, ge=0)
    quantity_available: float = Field(default=0, ge=0)
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None


class InventoryItemCreate(InventoryItemBase):
    """Schema for creating an inventory item"""
    product_id: int


class InventoryItemUpdate(BaseModel):
    """Schema for updating an inventory item"""
    item_type: Optional[InventoryType] = None
    location: Optional[str] = None
    batch_number: Optional[str] = None
    serial_number: Optional[str] = None
    quantity_on_hand: Optional[float] = Field(None, ge=0)
    quantity_reserved: Optional[float] = Field(None, ge=0)
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    is_active: Optional[bool] = None


class InventoryItemResponse(InventoryItemBase):
    """Schema for inventory item responses"""
    id: int
    product_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_counted: Optional[datetime]

    class Config:
        from_attributes = True


class QualityCheckBase(BaseModel):
    """Base quality check schema"""
    check_type: CheckType
    quantity_checked: int = Field(..., ge=1)
    specifications: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class QualityCheckCreate(QualityCheckBase):
    """Schema for creating a quality check"""
    production_order_id: int
    operation_id: Optional[int] = None


class QualityCheckUpdate(BaseModel):
    """Schema for updating a quality check"""
    status: Optional[QualityStatus] = None
    quantity_passed: Optional[int] = Field(None, ge=0)
    quantity_failed: Optional[int] = Field(None, ge=0)
    test_results: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    corrective_actions: Optional[str] = None
    completed_at: Optional[datetime] = None


class QualityCheckResponse(QualityCheckBase):
    """Schema for quality check responses"""
    id: int
    check_number: str
    production_order_id: int
    operation_id: Optional[int]
    inspector_id: Optional[int]
    status: str
    quantity_passed: int
    quantity_failed: int
    test_results: Optional[Dict[str, Any]]
    corrective_actions: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class MaterialRequirementBase(BaseModel):
    """Base material requirement schema"""
    required_quantity: float = Field(..., ge=0)
    unit_of_measure: str = Field(default="pcs", max_length=20)
    required_date: Optional[datetime] = None


class MaterialRequirementCreate(MaterialRequirementBase):
    """Schema for creating a material requirement"""
    production_order_id: int
    product_id: int


class MaterialRequirementResponse(MaterialRequirementBase):
    """Schema for material requirement responses"""
    id: int
    production_order_id: int
    product_id: int
    allocated_quantity: float
    issued_quantity: float
    allocated_date: Optional[datetime]
    issued_date: Optional[datetime]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Search and filter schemas
class ProductionOrderSearch(BaseModel):
    """Schema for production order search"""
    query: Optional[str] = None
    status: Optional[List[ProductionStatus]] = None
    priority: Optional[List[OrderPriority]] = None
    product_id: Optional[int] = None
    work_center_id: Optional[int] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    planned_start_after: Optional[datetime] = None
    planned_start_before: Optional[datetime] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class ProductionOrderSearchResponse(BaseModel):
    """Schema for production order search response"""
    orders: List[ProductionOrderResponse]
    total_count: int
    offset: int
    limit: int
    has_more: bool


class ProductSearch(BaseModel):
    """Schema for product search"""
    query: Optional[str] = None
    product_type: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    is_make_to_order: Optional[bool] = None
    is_make_to_stock: Optional[bool] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# Statistics and analytics schemas
class ManufacturingStatistics(BaseModel):
    """Schema for manufacturing statistics"""
    total_orders: int
    active_orders: int
    completed_orders: int
    on_hold_orders: int
    cancelled_orders: int
    average_completion_time: float
    total_production_value: float
    orders_by_status: Dict[str, int]
    orders_by_priority: Dict[str, int]
    productivity_metrics: Dict[str, Any]


class QualityStatistics(BaseModel):
    """Schema for quality statistics"""
    total_checks: int
    passed_checks: int
    failed_checks: int
    pass_rate: float
    checks_by_type: Dict[str, int]
    quality_trends: List[Dict[str, Any]]


class InventoryStatistics(BaseModel):
    """Schema for inventory statistics"""
    total_items: int
    total_value: float
    items_by_type: Dict[str, int]
    low_stock_items: int
    out_of_stock_items: int
    inventory_turnover: float


class ManufacturingDashboardMetrics(BaseModel):
    """Schema for manufacturing dashboard metrics"""
    production_statistics: ManufacturingStatistics
    quality_statistics: QualityStatistics
    inventory_statistics: InventoryStatistics
    recent_orders: List[ProductionOrderResponse]
    top_products: List[Dict[str, Any]]
    production_efficiency: Dict[str, Any]
    quality_trends: List[Dict[str, Any]]


class ManufacturingAnalytics(BaseModel):
    """Schema for manufacturing analytics"""
    period_days: int
    production_volume_trends: List[Dict[str, Any]]
    efficiency_trends: List[Dict[str, Any]]
    quality_trends: List[Dict[str, Any]]
    cost_trends: List[Dict[str, Any]]
    order_status_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    work_center_performance: List[Dict[str, Any]]
    product_performance: List[Dict[str, Any]]


# Validation helpers
@validator('dimensions', pre=True)
def validate_dimensions(cls, v):
    """Validate and clean dimensions"""
    if v is None:
        return None
    if isinstance(v, str):
        try:
            import json
            return json.loads(v)
        except json.JSONDecodeError:
            return None
    return v


@validator('specifications', pre=True)
def validate_specifications(cls, v):
    """Validate and clean specifications"""
    if v is None:
        return None
    if isinstance(v, str):
        try:
            import json
            return json.loads(v)
        except json.JSONDecodeError:
            return None
    return v


@validator('quality_standards', pre=True)
def validate_quality_standards(cls, v):
    """Validate and clean quality standards"""
    if v is None:
        return None
    if isinstance(v, str):
        try:
            import json
            return json.loads(v)
        except json.JSONDecodeError:
            return None
    return v



