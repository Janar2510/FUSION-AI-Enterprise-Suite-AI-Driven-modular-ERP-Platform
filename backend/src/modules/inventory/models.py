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

class WarehouseLocation(Base):
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
    products = relationship("Product", back_populates="warehouse")
    stock_movements = relationship("StockMovement", back_populates="warehouse")

class ProductCategory(Base):
    __tablename__ = "product_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("product_categories.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
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
    
    # Inventory
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

class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouse_locations.id"))
    
    # Movement Details
    movement_type = Column(SQLEnum(StockMovementType))
    quantity = Column(Integer)
    unit_cost = Column(Numeric(10, 2))
    total_cost = Column(Numeric(10, 2))
    
    # Reference Information
    reference_number = Column(String)  # PO number, SO number, etc.
    reference_type = Column(String)  # "purchase_order", "sales_order", "transfer"
    reference_id = Column(Integer)  # ID of the referenced document
    
    # Additional Details
    reason = Column(String)
    notes = Column(Text)
    serial_numbers = Column(JSON)  # For serialized products
    
    # User and Timestamp
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="stock_movements")
    warehouse = relationship("WarehouseLocation", back_populates="stock_movements")

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



