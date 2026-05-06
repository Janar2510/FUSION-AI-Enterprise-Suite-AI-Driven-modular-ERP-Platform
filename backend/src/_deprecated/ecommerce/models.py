from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ...core.database import Base

class WebCartStatus(str, Enum):
    ACTIVE = "active"
    ABANDONED = "abandoned"
    CHECKOUT = "checkout"
    COMPLETED = "completed"

class WebCart(Base):
    __tablename__ = "web_carts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("crm_contacts.id"), nullable=True)
    
    # Financial
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    
    # State
    status = Column(SQLEnum(WebCartStatus), default=WebCartStatus.ACTIVE)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    items = relationship("WebCartItem", back_populates="cart", cascade="all, delete-orphan")
    customer = relationship("CRMContact", foreign_keys=[customer_id])

class WebCartItem(Base):
    __tablename__ = "web_cart_items"
    
    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("web_carts.id"))
    product_id = Column(Integer, nullable=False)  # Usually refers to InventoryProduct
    
    # Product Details
    product_name = Column(String)
    product_sku = Column(String)
    
    # Pricing
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    line_total = Column(Float, default=0.0)
    
    # Metadata
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    cart = relationship("WebCart", back_populates="items")

class WebOrder(Base):
    """Links an online Web storefront order to a core SalesOrder"""
    __tablename__ = "web_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    sale_order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=True)
    cart_id = Column(Integer, ForeignKey("web_carts.id"), nullable=True)
    
    # Session Details
    browser_ip = Column(String)
    user_agent = Column(String)
    
    # Payment / Checkout Gateway Details
    transaction_id = Column(String)
    gateway_status = Column(String)
    
    # Flow
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sale_order = relationship("SalesOrder", foreign_keys=[sale_order_id])
    cart = relationship("WebCart", foreign_keys=[cart_id])

class CustomerReview(Base):
    __tablename__ = "web_customer_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("crm_contacts.id"), nullable=True)
    
    # Rating
    rating = Column(Integer, default=5) # 1-5 scale
    title = Column(String)
    content = Column(Text)
    
    # State
    is_published = Column(Boolean, default=False)
    is_verified_purchase = Column(Boolean, default=False)
    
    # Flow
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("CRMContact", foreign_keys=[customer_id])
