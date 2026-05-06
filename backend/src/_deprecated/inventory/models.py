from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, JSON, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ...core.database import Base

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
    PRODUCTION = "production"

class LocationType(str, Enum):
    SUPPLIER = "supplier"
    VIEW = "view"
    INTERNAL = "internal"
    CUSTOMER = "customer"
    INVENTORY = "inventory"
    PRODUCTION = "production"
    TRANSIT = "transit"

class RuleAction(str, Enum):
    PULL = "pull"
    PUSH = "push"
    PULL_PUSH = "pull_push"
    BUY = "buy"
    MANUFACTURE = "manufacture"

class WarehouseLocation(Base):
    """Corresponds to Odoo's stock.warehouse"""
    __tablename__ = "warehouse_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    postal_code = Column(String)
    contact_person = Column(String)
    contact_phone = Column(String)
    contact_email = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    locations = relationship("StockLocation", back_populates="warehouse")
    products = relationship("Product", back_populates="warehouse")
    stock_movements = relationship("StockMovement", back_populates="warehouse")

class StockLocation(Base):
    """Corresponds to Odoo's stock.location - Hierarchical storage"""
    __tablename__ = "stock_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    complete_name = Column(String, index=True) # E.g., WH/Stock/Shelf 1
    location_type = Column(SQLEnum(LocationType), default=LocationType.INTERNAL)
    
    parent_id = Column(Integer, ForeignKey("stock_locations.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouse_locations.id"))
    
    is_scrap = Column(Boolean, default=False)
    is_return = Column(Boolean, default=False)
    barcode = Column(String, unique=True, index=True)
    
    # Capacity constraints
    max_weight = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    warehouse = relationship("WarehouseLocation", back_populates="locations")
    children = relationship("StockLocation", back_populates="parent")
    parent = relationship("StockLocation", back_populates="children", remote_side=[id])

class StockRule(Base):
    """Corresponds to Odoo's stock.rule - Push/Pull engine"""
    __tablename__ = "stock_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    action = Column(SQLEnum(RuleAction))
    
    source_location_id = Column(Integer, ForeignKey("stock_locations.id"))
    destination_location_id = Column(Integer, ForeignKey("stock_locations.id"))
    
    # Lead times
    delay = Column(Integer, default=0) # Days
    
    # Relationships
    source_location = relationship("StockLocation", foreign_keys=[source_location_id])
    destination_location = relationship("StockLocation", foreign_keys=[destination_location_id])

class ProductCategory(Base):
    __tablename__ = "product_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("product_categories.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    costing_method = Column(String, default="standard") # standard, fifo, avco
    putaway_strategy_id = Column(Integer, ForeignKey("stock_locations.id"))
    
    # Relationships
    products = relationship("Product", back_populates="category")
    children = relationship("ProductCategory", back_populates="parent")
    parent = relationship("ProductCategory", back_populates="children", remote_side=[id])

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("product_categories.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouse_locations.id"))
    
    # Product Details
    brand = Column(String)
    model = Column(String)
    color = Column(String)
    size = Column(String)
    weight = Column(Float)
    dimensions = Column(JSON)  # {"length": 10, "width": 5, "height": 2}
    
    # Pricing
    cost_price = Column(Numeric(10, 2))
    selling_price = Column(Numeric(10, 2))
    msrp = Column(Numeric(10, 2))  # Manufacturer's Suggested Retail Price
    
    # Inventory Tracking
    tracking = Column(String, default="none") # none, lot, serial
    current_stock = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=0)
    max_stock_level = Column(Integer, default=1000)
    reorder_point = Column(Integer, default=10)
    reorder_quantity = Column(Integer, default=50)
    
    # Status and Metadata
    status = Column(SQLEnum(ProductStatus), default=ProductStatus.ACTIVE)
    is_trackable = Column(Boolean, default=True)
    is_serialized = Column(Boolean, default=False)
    barcode = Column(String, unique=True, index=True)
    tags = Column(JSON)  # ["electronics", "gadgets"]
    
    # Dates
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_restocked = Column(DateTime(timezone=True))
    
    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    warehouse = relationship("WarehouseLocation", back_populates="products")
    stock_movements = relationship("StockMovement", back_populates="product")
    demand_forecasts = relationship("DemandForecast", back_populates="product")
    lots = relationship("LotSerialNumber", back_populates="product")

class LotSerialNumber(Base):
    """Corresponds to Odoo's stock.lot for traceability"""
    __tablename__ = "lot_serial_numbers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True) # The actual lot/serial string
    product_id = Column(Integer, ForeignKey("products.id"))
    
    expiration_date = Column(DateTime(timezone=True))
    removal_date = Column(DateTime(timezone=True)) # For FEFO
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    product = relationship("Product", back_populates="lots")
    movements = relationship("StockMovement", back_populates="lot")

class StockMovement(Base):
    """Corresponds to Odoo's stock.move.line for granular tracking"""
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouse_locations.id"))
    
    # Specific Locations
    source_location_id = Column(Integer, ForeignKey("stock_locations.id"))
    dest_location_id = Column(Integer, ForeignKey("stock_locations.id"))
    
    # Traceability
    lot_id = Column(Integer, ForeignKey("lot_serial_numbers.id"))
    
    # Movement Details
    movement_type = Column(SQLEnum(StockMovementType))
    quantity = Column(Integer)
    unit_cost = Column(Numeric(10, 2))
    total_cost = Column(Numeric(10, 2))
    
    # Reference Information
    reference_number = Column(String)  # PO number, SO number, etc.
    reference_type = Column(String)  # "purchase_order", "sales_order", "transfer"
    reference_id = Column(Integer)  # ID of the referenced document
    rule_id = Column(Integer, ForeignKey("stock_rules.id")) # Which routing rule caused this
    
    # Additional Details
    reason = Column(String)
    notes = Column(Text)
    serial_numbers = Column(JSON)  # For serialized products (legacy fallback)
    
    # User and Timestamp
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="stock_movements")
    warehouse = relationship("WarehouseLocation", back_populates="stock_movements")
    source_location = relationship("StockLocation", foreign_keys=[source_location_id])
    dest_location = relationship("StockLocation", foreign_keys=[dest_location_id])
    lot = relationship("LotSerialNumber", back_populates="movements")
    rule = relationship("StockRule")

class LandedCost(Base):
    """Corresponds to Odoo's stock.landed.cost"""
    __tablename__ = "landed_costs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    
    cost_amount = Column(Numeric(10, 2))
    split_method = Column(String) # equal, by_quantity, by_current_cost, by_weight, by_volume
    
    # Links to the inbound transfer
    receipt_reference = Column(String)
    
    notes = Column(Text)

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    
    # Forecast Details
    forecast_period = Column(String)  # "daily", "weekly", "monthly", "quarterly"
    forecast_date = Column(DateTime(timezone=True))
    forecasted_quantity = Column(Integer)
    confidence_level = Column(Float)  # 0.0 to 1.0
    
    # Historical Data
    historical_demand = Column(JSON)  # Array of historical demand values
    seasonal_factors = Column(JSON)  # Seasonal adjustment factors
    
    # Forecast Method
    forecast_method = Column(String)  # "moving_average", "exponential_smoothing", "arima", "ml_model"
    model_parameters = Column(JSON)  # Model-specific parameters
    
    # Accuracy Metrics
    mape = Column(Float)  # Mean Absolute Percentage Error
    rmse = Column(Float)  # Root Mean Square Error
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="demand_forecasts")

class InventoryAlert(Base):
    __tablename__ = "inventory_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    
    # Alert Details
    alert_type = Column(String)  # "low_stock", "out_of_stock", "overstock", "reorder_point"
    severity = Column(String)  # "low", "medium", "high", "critical"
    message = Column(Text)
    
    # Thresholds
    current_stock = Column(Integer)
    threshold_value = Column(Integer)
    
    # Status
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer)  # User ID
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product")

class InventoryTransaction(Base):
    """High level aggregation of stock.movements"""
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouse_locations.id"))
    
    # Transaction Details
    transaction_type = Column(String)  # "purchase", "sale", "transfer", "adjustment"
    quantity = Column(Integer)
    unit_price = Column(Numeric(10, 2))
    total_value = Column(Numeric(10, 2))
    
    # Reference Information
    reference_document = Column(String)  # Document type
    reference_id = Column(Integer)  # Document ID
    
    # Additional Details
    description = Column(Text)
    notes = Column(Text)
    
    # User and Timestamp
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product")
    warehouse = relationship("WarehouseLocation")




