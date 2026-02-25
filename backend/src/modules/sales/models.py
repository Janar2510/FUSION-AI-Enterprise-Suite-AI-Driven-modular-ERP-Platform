from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ...core.database import Base

class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    OVERDUE = "overdue"
    REFUNDED = "refunded"

class SalesQuote(Base):
    __tablename__ = "sales_quotes"
    
    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("crm_contacts.id"))
    customer_name = Column(String)
    customer_email = Column(String)
    
    # Quote Details
    title = Column(String)
    description = Column(Text)
    status = Column(SQLEnum(QuoteStatus), default=QuoteStatus.DRAFT)
    
    # Financial
    subtotal = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_rate = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    
    # Dates
    quote_date = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    viewed_at = Column(DateTime(timezone=True))
    accepted_at = Column(DateTime(timezone=True))
    
    # Metadata
    notes = Column(Text)
    terms_conditions = Column(Text)
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    items = relationship("SalesQuoteItem", back_populates="quote", cascade="all, delete-orphan")
    customer = relationship("CRMContact", foreign_keys=[customer_id])

class SalesQuoteItem(Base):
    __tablename__ = "sales_quote_items"
    
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("sales_quotes.id"))
    
    # Product Details
    product_name = Column(String)
    product_description = Column(Text)
    product_sku = Column(String)
    
    # Pricing
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    discount_rate = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    line_total = Column(Float, default=0.0)
    
    # Metadata
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    quote = relationship("SalesQuote", back_populates="items")

class SalesOrder(Base):
    __tablename__ = "sales_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    quote_id = Column(Integer, ForeignKey("sales_quotes.id"))
    customer_id = Column(Integer, ForeignKey("crm_contacts.id"))
    customer_name = Column(String)
    customer_email = Column(String)
    
    # Order Details
    title = Column(String)
    description = Column(Text)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    
    # Financial
    subtotal = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_rate = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    shipping_cost = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    
    # Payment
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_method = Column(String)
    payment_due_date = Column(DateTime(timezone=True))
    paid_at = Column(DateTime(timezone=True))
    
    # Shipping
    shipping_address = Column(JSON)
    shipping_method = Column(String)
    tracking_number = Column(String)
    shipped_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    
    # Dates
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    expected_delivery = Column(DateTime(timezone=True))
    
    # Metadata
    notes = Column(Text)
    internal_notes = Column(Text)
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    items = relationship("SalesOrderItem", back_populates="order", cascade="all, delete-orphan")
    customer = relationship("CRMContact", foreign_keys=[customer_id])
    quote = relationship("SalesQuote", foreign_keys=[quote_id])

class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"))
    
    # Product Details
    product_name = Column(String)
    product_description = Column(Text)
    product_sku = Column(String)
    
    # Pricing
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    discount_rate = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    line_total = Column(Float, default=0.0)
    
    # Fulfillment
    quantity_shipped = Column(Float, default=0.0)
    quantity_delivered = Column(Float, default=0.0)
    
    # Metadata
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("SalesOrder", back_populates="items")

class SalesRevenue(Base):
    __tablename__ = "sales_revenue"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"))
    
    # Revenue Details
    revenue_type = Column(String)  # 'sale', 'refund', 'adjustment'
    amount = Column(Float)
    currency = Column(String, default="USD")
    
    # Dates
    revenue_date = Column(DateTime(timezone=True), server_default=func.now())
    period_year = Column(Integer)
    period_month = Column(Integer)
    period_quarter = Column(Integer)
    
    # Metadata
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("SalesOrder", foreign_keys=[order_id])




