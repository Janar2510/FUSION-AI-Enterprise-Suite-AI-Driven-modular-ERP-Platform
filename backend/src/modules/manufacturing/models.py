"""
Manufacturing Module Models
Production management with quality control and supply chain coordination
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

Base = declarative_base()


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


class ProductionOrder(Base):
    """Production order model"""
    __tablename__ = "production_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False)
    
    # Order details
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    priority = Column(String(20), nullable=False, default=OrderPriority.MEDIUM.value)
    status = Column(String(30), nullable=False, default=ProductionStatus.PLANNED.value)
    
    # Scheduling
    planned_start_date = Column(DateTime(timezone=True), nullable=True)
    planned_end_date = Column(DateTime(timezone=True), nullable=True)
    actual_start_date = Column(DateTime(timezone=True), nullable=True)
    actual_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Work center and routing
    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=True)
    routing_id = Column(Integer, ForeignKey("routings.id"), nullable=True)
    
    # Quality requirements
    quality_standards = Column(JSON, nullable=True)  # Quality specifications
    inspection_required = Column(Boolean, default=True)
    
    # Costs and pricing
    estimated_cost = Column(Numeric(10, 2), nullable=True)
    actual_cost = Column(Numeric(10, 2), nullable=True)
    material_cost = Column(Numeric(10, 2), nullable=True)
    labor_cost = Column(Numeric(10, 2), nullable=True)
    overhead_cost = Column(Numeric(10, 2), nullable=True)
    
    # Progress tracking
    completion_percentage = Column(Float, default=0.0)
    units_completed = Column(Integer, default=0)
    units_scrapped = Column(Integer, default=0)
    
    # Additional data
    notes = Column(Text, nullable=True)
    specifications = Column(JSON, nullable=True)
    customer_order_id = Column(Integer, nullable=True)  # Link to customer order
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    product = relationship("Product")
    work_center = relationship("WorkCenter")
    routing = relationship("Routing")
    creator = relationship("User", foreign_keys=[created_by])
    operations = relationship("ProductionOperation", back_populates="production_order", cascade="all, delete-orphan")
    quality_checks = relationship("QualityCheck", back_populates="production_order", cascade="all, delete-orphan")
    material_requirements = relationship("MaterialRequirement", back_populates="production_order", cascade="all, delete-orphan")


class Product(Base):
    """Product model"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Product details
    product_type = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True)
    unit_of_measure = Column(String(20), default="pcs")
    
    # Specifications
    dimensions = Column(JSON, nullable=True)  # Length, width, height
    weight = Column(Float, nullable=True)
    specifications = Column(JSON, nullable=True)
    
    # Manufacturing details
    standard_routing_id = Column(Integer, ForeignKey("routings.id"), nullable=True)
    standard_bom_id = Column(Integer, ForeignKey("bills_of_material.id"), nullable=True)
    standard_cycle_time = Column(Float, nullable=True)  # Standard production time
    
    # Inventory
    is_make_to_order = Column(Boolean, default=False)
    is_make_to_stock = Column(Boolean, default=True)
    minimum_stock_level = Column(Integer, default=0)
    maximum_stock_level = Column(Integer, nullable=True)
    reorder_point = Column(Integer, default=0)
    
    # Costs
    standard_cost = Column(Numeric(10, 2), nullable=True)
    material_cost = Column(Numeric(10, 2), nullable=True)
    labor_cost = Column(Numeric(10, 2), nullable=True)
    overhead_cost = Column(Numeric(10, 2), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    standard_routing = relationship("Routing", foreign_keys=[standard_routing_id])
    standard_bom = relationship("BillOfMaterial", foreign_keys=[standard_bom_id])
    production_orders = relationship("ProductionOrder", back_populates="product")
    bom_items = relationship("BOMItem", back_populates="product")
    inventory_items = relationship("InventoryItem", back_populates="product")


class WorkCenter(Base):
    """Work center model"""
    __tablename__ = "work_centers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Work center details
    work_center_type = Column(String(50), nullable=True)  # Machine, Assembly, etc.
    capacity = Column(Integer, nullable=True)  # Units per hour
    efficiency = Column(Float, default=100.0)  # Efficiency percentage
    
    # Location and setup
    location = Column(String(255), nullable=True)
    setup_time = Column(Float, nullable=True)  # Setup time in hours
    
    # Costs
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    overhead_rate = Column(Numeric(10, 2), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    operations = relationship("ProductionOperation", back_populates="work_center")
    routings = relationship("Routing", back_populates="work_center")


class Routing(Base):
    """Routing model"""
    __tablename__ = "routings"
    
    id = Column(Integer, primary_key=True, index=True)
    routing_number = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Routing details
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    version = Column(String(20), default="1.0")
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    product = relationship("Product", foreign_keys=[product_id])
    operations = relationship("RoutingOperation", back_populates="routing", cascade="all, delete-orphan")


class RoutingOperation(Base):
    """Routing operation model"""
    __tablename__ = "routing_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    routing_id = Column(Integer, ForeignKey("routings.id"), nullable=False)
    operation_number = Column(String(20), nullable=False)
    
    # Operation details
    operation_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=False)
    
    # Timing
    setup_time = Column(Float, nullable=True)  # Setup time in hours
    run_time = Column(Float, nullable=True)  # Run time per unit in hours
    queue_time = Column(Float, nullable=True)  # Queue time in hours
    wait_time = Column(Float, nullable=True)  # Wait time in hours
    
    # Sequence
    sequence_number = Column(Integer, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    routing = relationship("Routing", back_populates="operations")
    work_center = relationship("WorkCenter")


class ProductionOperation(Base):
    """Production operation model"""
    __tablename__ = "production_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    operation_number = Column(String(20), nullable=False)
    
    # Operation details
    operation_name = Column(String(255), nullable=False)
    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=False)
    
    # Status and timing
    status = Column(String(30), default=ProductionStatus.PLANNED.value)
    planned_start = Column(DateTime(timezone=True), nullable=True)
    planned_end = Column(DateTime(timezone=True), nullable=True)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    
    # Quantities
    planned_quantity = Column(Integer, nullable=False)
    completed_quantity = Column(Integer, default=0)
    scrapped_quantity = Column(Integer, default=0)
    
    # Times
    setup_time = Column(Float, nullable=True)
    run_time = Column(Float, nullable=True)
    actual_setup_time = Column(Float, nullable=True)
    actual_run_time = Column(Float, nullable=True)
    
    # Quality
    quality_status = Column(String(30), default=QualityStatus.PENDING.value)
    
    # Additional data
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    production_order = relationship("ProductionOrder", back_populates="operations")
    work_center = relationship("WorkCenter")


class BillOfMaterial(Base):
    """Bill of material model"""
    __tablename__ = "bills_of_material"
    
    id = Column(Integer, primary_key=True, index=True)
    bom_number = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # BOM details
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    version = Column(String(20), default="1.0")
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    product = relationship("Product", foreign_keys=[product_id])
    items = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")


class BOMItem(Base):
    """BOM item model"""
    __tablename__ = "bom_items"
    
    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("bills_of_material.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Item details
    quantity = Column(Numeric(10, 4), nullable=False)
    unit_of_measure = Column(String(20), default="pcs")
    
    # Additional data
    notes = Column(Text, nullable=True)
    is_optional = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    bom = relationship("BillOfMaterial", back_populates="items")
    product = relationship("Product", back_populates="bom_items")


class InventoryItem(Base):
    """Inventory item model"""
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Inventory details
    item_type = Column(String(30), nullable=False, default=InventoryType.RAW_MATERIAL.value)
    location = Column(String(255), nullable=True)
    batch_number = Column(String(50), nullable=True)
    serial_number = Column(String(50), nullable=True)
    
    # Quantities
    quantity_on_hand = Column(Numeric(10, 4), default=0)
    quantity_reserved = Column(Numeric(10, 4), default=0)
    quantity_available = Column(Numeric(10, 4), default=0)
    
    # Costs
    unit_cost = Column(Numeric(10, 4), nullable=True)
    total_cost = Column(Numeric(10, 4), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_counted = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    product = relationship("Product", back_populates="inventory_items")


class MaterialRequirement(Base):
    """Material requirement model"""
    __tablename__ = "material_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Requirement details
    required_quantity = Column(Numeric(10, 4), nullable=False)
    allocated_quantity = Column(Numeric(10, 4), default=0)
    issued_quantity = Column(Numeric(10, 4), default=0)
    unit_of_measure = Column(String(20), default="pcs")
    
    # Timing
    required_date = Column(DateTime(timezone=True), nullable=True)
    allocated_date = Column(DateTime(timezone=True), nullable=True)
    issued_date = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    status = Column(String(30), default="pending")  # pending, allocated, issued, completed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    production_order = relationship("ProductionOrder", back_populates="material_requirements")
    product = relationship("Product")


class QualityCheck(Base):
    """Quality check model"""
    __tablename__ = "quality_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    check_number = Column(String(50), unique=True, nullable=False)
    
    # Check details
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    operation_id = Column(Integer, ForeignKey("production_operations.id"), nullable=True)
    
    # Check information
    check_type = Column(String(50), nullable=False)  # incoming, in_process, final
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Results
    status = Column(String(30), default=QualityStatus.PENDING.value)
    quantity_checked = Column(Integer, nullable=False)
    quantity_passed = Column(Integer, default=0)
    quantity_failed = Column(Integer, default=0)
    
    # Specifications
    specifications = Column(JSON, nullable=True)
    test_results = Column(JSON, nullable=True)
    
    # Additional data
    notes = Column(Text, nullable=True)
    corrective_actions = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    production_order = relationship("ProductionOrder", back_populates="quality_checks")
    operation = relationship("ProductionOperation")
    inspector = relationship("User", foreign_keys=[inspector_id])


class User(Base):
    """User model (referenced by manufacturing models)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # User relationships for manufacturing
    created_production_orders = relationship("ProductionOrder", foreign_keys="ProductionOrder.created_by")
    quality_inspections = relationship("QualityCheck", foreign_keys="QualityCheck.inspector_id")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


# Pydantic models for API validation
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProductionOrderCreate(BaseModel):
    """Schema for creating a production order"""
    product_id: int
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


class ProductionOrderResponse(BaseModel):
    """Schema for production order responses"""
    id: int
    order_number: str
    product_id: int
    product_name: str
    quantity: int
    priority: str
    status: str
    planned_start_date: Optional[datetime]
    planned_end_date: Optional[datetime]
    actual_start_date: Optional[datetime]
    actual_end_date: Optional[datetime]
    work_center_id: Optional[int]
    routing_id: Optional[int]
    completion_percentage: float
    units_completed: int
    units_scrapped: int
    estimated_cost: Optional[float]
    actual_cost: Optional[float]
    notes: Optional[str]
    specifications: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    """Schema for creating a product"""
    product_code: str = Field(..., min_length=1, max_length=50)
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


class ProductResponse(BaseModel):
    """Schema for product responses"""
    id: int
    product_code: str
    name: str
    description: Optional[str]
    product_type: Optional[str]
    category: Optional[str]
    unit_of_measure: str
    dimensions: Optional[Dict[str, Any]]
    weight: Optional[float]
    specifications: Optional[Dict[str, Any]]
    standard_cycle_time: Optional[float]
    is_make_to_order: bool
    is_make_to_stock: bool
    minimum_stock_level: int
    maximum_stock_level: Optional[int]
    reorder_point: int
    standard_cost: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class WorkCenterCreate(BaseModel):
    """Schema for creating a work center"""
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    work_center_type: Optional[str] = None
    capacity: Optional[int] = None
    efficiency: float = Field(default=100.0)
    location: Optional[str] = None
    setup_time: Optional[float] = None
    hourly_rate: Optional[float] = None
    overhead_rate: Optional[float] = None


class WorkCenterResponse(BaseModel):
    """Schema for work center responses"""
    id: int
    code: str
    name: str
    description: Optional[str]
    work_center_type: Optional[str]
    capacity: Optional[int]
    efficiency: float
    location: Optional[str]
    setup_time: Optional[float]
    hourly_rate: Optional[float]
    overhead_rate: Optional[float]
    is_active: bool
    is_available: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class QualityCheckCreate(BaseModel):
    """Schema for creating a quality check"""
    production_order_id: int
    operation_id: Optional[int] = None
    check_type: str = Field(..., min_length=1, max_length=50)
    quantity_checked: int = Field(..., ge=1)
    specifications: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class QualityCheckResponse(BaseModel):
    """Schema for quality check responses"""
    id: int
    check_number: str
    production_order_id: int
    operation_id: Optional[int]
    check_type: str
    inspector_id: Optional[int]
    status: str
    quantity_checked: int
    quantity_passed: int
    quantity_failed: int
    specifications: Optional[Dict[str, Any]]
    test_results: Optional[Dict[str, Any]]
    notes: Optional[str]
    corrective_actions: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True



