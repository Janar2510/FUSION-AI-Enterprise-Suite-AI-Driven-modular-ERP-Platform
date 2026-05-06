"""
Purchase Module Models
Procurement management with vendor relations and purchase order tracking
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

Base = declarative_base()


class PurchaseOrderStatus(str, Enum):
    """Purchase order status enumeration"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    SENT = "sent"
    ACKNOWLEDGED = "acknowledged"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    INVOICED = "invoiced"
    PAID = "paid"
    CANCELLED = "cancelled"


class VendorStatus(str, Enum):
    """Vendor status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class InvoiceStatus(str, Enum):
    """Invoice status enumeration"""
    DRAFT = "draft"
    SENT = "sent"
    RECEIVED = "received"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"


class Vendor(Base):
    """Vendor model"""
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_code = Column(String(20), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    
    # Contact information
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    fax = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Address information
    billing_address = Column(JSON, nullable=True)
    shipping_address = Column(JSON, nullable=True)
    
    # Business information
    tax_id = Column(String(50), nullable=True)
    business_type = Column(String(50), nullable=True)
    industry = Column(String(100), nullable=True)
    company_size = Column(String(50), nullable=True)
    
    # Financial information
    currency = Column(String(3), default="USD")
    payment_terms = Column(String(100), nullable=True)
    credit_limit = Column(Numeric(15, 2), nullable=True)
    current_balance = Column(Numeric(15, 2), default=0)
    
    # Vendor details
    status = Column(String(20), default=VendorStatus.ACTIVE.value)
    rating = Column(Integer, default=0)  # 1-5 rating
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    
    # Performance metrics
    total_orders = Column(Integer, default=0)
    total_value = Column(Numeric(15, 2), default=0)
    average_delivery_time = Column(Float, nullable=True)
    quality_rating = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")
    invoices = relationship("Invoice", back_populates="vendor")


class PurchaseOrder(Base):
    """Purchase order model"""
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, nullable=False)
    
    # Vendor information
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    vendor_name = Column(String(255), nullable=False)
    
    # Order details
    status = Column(String(30), default=PurchaseOrderStatus.DRAFT.value)
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    expected_delivery_date = Column(DateTime(timezone=True), nullable=True)
    actual_delivery_date = Column(DateTime(timezone=True), nullable=True)
    
    # Financial information
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    shipping_amount = Column(Numeric(15, 2), default=0)
    discount_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    currency = Column(String(3), default="USD")
    
    # Shipping information
    shipping_address = Column(JSON, nullable=True)
    shipping_method = Column(String(100), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    
    # Additional information
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)
    
    # Approval workflow
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="purchase_orders")
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    receipts = relationship("PurchaseReceipt", back_populates="purchase_order", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="purchase_order")


class PurchaseOrderItem(Base):
    """Purchase order item model"""
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    
    # Product information
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_code = Column(String(50), nullable=True)
    product_name = Column(String(255), nullable=False)
    product_description = Column(Text, nullable=True)
    
    # Quantity and pricing
    quantity_ordered = Column(Numeric(10, 4), nullable=False)
    quantity_received = Column(Numeric(10, 4), default=0)
    quantity_pending = Column(Numeric(10, 4), nullable=False)
    unit_price = Column(Numeric(10, 4), nullable=False)
    total_price = Column(Numeric(15, 2), nullable=False)
    
    # Additional information
    unit_of_measure = Column(String(20), default="pcs")
    specifications = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")


class Product(Base):
    """Product model (referenced by purchase items)"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Product details
    category = Column(String(100), nullable=True)
    unit_of_measure = Column(String(20), default="pcs")
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Product(id={self.id}, product_code='{self.product_code}')>"


class PurchaseReceipt(Base):
    """Purchase receipt model"""
    __tablename__ = "purchase_receipts"
    
    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String(50), unique=True, nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    
    # Receipt details
    receipt_date = Column(DateTime(timezone=True), server_default=func.now())
    received_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Shipping information
    carrier = Column(String(100), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    condition = Column(String(50), default="good")  # good, damaged, etc.
    
    # Additional information
    notes = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=True)  # Receipt documents, photos
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="receipts")
    receiver = relationship("User", foreign_keys=[received_by])
    items = relationship("PurchaseReceiptItem", back_populates="receipt", cascade="all, delete-orphan")


class PurchaseReceiptItem(Base):
    """Purchase receipt item model"""
    __tablename__ = "purchase_receipt_items"
    
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("purchase_receipts.id"), nullable=False)
    purchase_order_item_id = Column(Integer, ForeignKey("purchase_order_items.id"), nullable=False)
    
    # Item details
    quantity_received = Column(Numeric(10, 4), nullable=False)
    condition = Column(String(50), default="good")
    batch_number = Column(String(50), nullable=True)
    serial_number = Column(String(50), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    
    # Quality information
    quality_notes = Column(Text, nullable=True)
    inspection_required = Column(Boolean, default=False)
    inspection_completed = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    receipt = relationship("PurchaseReceipt", back_populates="items")
    purchase_order_item = relationship("PurchaseOrderItem")


class Invoice(Base):
    """Invoice model"""
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    vendor_invoice_number = Column(String(50), nullable=True)
    
    # Related entities
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    
    # Invoice details
    status = Column(String(20), default=InvoiceStatus.DRAFT.value)
    invoice_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    
    # Financial information
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    paid_amount = Column(Numeric(15, 2), default=0)
    currency = Column(String(3), default="USD")
    
    # Additional information
    notes = Column(Text, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="invoices")
    purchase_order = relationship("PurchaseOrder", back_populates="invoices")
    creator = relationship("User", foreign_keys=[created_by])
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(50), unique=True, nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    # Payment details
    status = Column(String(20), default=PaymentStatus.PENDING.value)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="USD")
    
    # Payment method
    payment_method = Column(String(50), nullable=True)  # check, wire, ach, credit_card
    payment_reference = Column(String(100), nullable=True)  # check number, transaction id
    
    # Bank information
    bank_account = Column(String(100), nullable=True)
    bank_routing = Column(String(20), nullable=True)
    
    # Additional information
    notes = Column(Text, nullable=True)
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    creator = relationship("User", foreign_keys=[created_by])
    processor = relationship("User", foreign_keys=[processed_by])


class User(Base):
    """User model (referenced by purchase models)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # User relationships for purchase
    created_vendors = relationship("Vendor", foreign_keys="Vendor.created_by")
    created_purchase_orders = relationship("PurchaseOrder", foreign_keys="PurchaseOrder.created_by")
    approved_purchase_orders = relationship("PurchaseOrder", foreign_keys="PurchaseOrder.approved_by")
    received_purchase_receipts = relationship("PurchaseReceipt", foreign_keys="PurchaseReceipt.received_by")
    created_invoices = relationship("Invoice", foreign_keys="Invoice.created_by")
    created_payments = relationship("Payment", foreign_keys="Payment.created_by")
    processed_payments = relationship("Payment", foreign_keys="Payment.processed_by")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


# Pydantic models for API validation
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class VendorCreate(BaseModel):
    """Schema for creating a vendor"""
    vendor_code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    fax: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    billing_address: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None
    tax_id: Optional[str] = Field(None, max_length=50)
    business_type: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, max_length=50)
    currency: str = Field(default="USD", max_length=3)
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class VendorUpdate(BaseModel):
    """Schema for updating a vendor"""
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    fax: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    billing_address: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None
    tax_id: Optional[str] = Field(None, max_length=50)
    business_type: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, max_length=50)
    currency: Optional[str] = Field(None, max_length=3)
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = None
    status: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class VendorResponse(BaseModel):
    """Schema for vendor responses"""
    id: int
    vendor_code: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    fax: Optional[str]
    website: Optional[str]
    billing_address: Optional[Dict[str, Any]]
    shipping_address: Optional[Dict[str, Any]]
    tax_id: Optional[str]
    business_type: Optional[str]
    industry: Optional[str]
    company_size: Optional[str]
    currency: str
    payment_terms: Optional[str]
    credit_limit: Optional[float]
    current_balance: float
    status: str
    rating: int
    notes: Optional[str]
    tags: Optional[List[str]]
    total_orders: int
    total_value: float
    average_delivery_time: Optional[float]
    quality_rating: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PurchaseOrderCreate(BaseModel):
    """Schema for creating a purchase order"""
    vendor_id: int
    vendor_name: str = Field(..., min_length=1, max_length=255)
    expected_delivery_date: Optional[datetime] = None
    subtotal: float = Field(default=0, ge=0)
    tax_amount: float = Field(default=0, ge=0)
    shipping_amount: float = Field(default=0, ge=0)
    discount_amount: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    currency: str = Field(default="USD", max_length=3)
    shipping_address: Optional[Dict[str, Any]] = None
    shipping_method: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class PurchaseOrderUpdate(BaseModel):
    """Schema for updating a purchase order"""
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None
    subtotal: Optional[float] = Field(None, ge=0)
    tax_amount: Optional[float] = Field(None, ge=0)
    shipping_amount: Optional[float] = Field(None, ge=0)
    discount_amount: Optional[float] = Field(None, ge=0)
    total_amount: Optional[float] = Field(None, ge=0)
    shipping_address: Optional[Dict[str, Any]] = None
    shipping_method: Optional[str] = Field(None, max_length=100)
    tracking_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class PurchaseOrderResponse(BaseModel):
    """Schema for purchase order responses"""
    id: int
    po_number: str
    vendor_id: int
    vendor_name: str
    status: str
    order_date: datetime
    expected_delivery_date: Optional[datetime]
    actual_delivery_date: Optional[datetime]
    subtotal: float
    tax_amount: float
    shipping_amount: float
    discount_amount: float
    total_amount: float
    currency: str
    shipping_address: Optional[Dict[str, Any]]
    shipping_method: Optional[str]
    tracking_number: Optional[str]
    notes: Optional[str]
    internal_notes: Optional[str]
    terms_and_conditions: Optional[str]
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PurchaseOrderItemCreate(BaseModel):
    """Schema for creating a purchase order item"""
    purchase_order_id: int
    product_id: Optional[int] = None
    product_code: Optional[str] = Field(None, max_length=50)
    product_name: str = Field(..., min_length=1, max_length=255)
    product_description: Optional[str] = None
    quantity_ordered: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    total_price: float = Field(..., ge=0)
    unit_of_measure: str = Field(default="pcs", max_length=20)
    specifications: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class PurchaseOrderItemResponse(BaseModel):
    """Schema for purchase order item responses"""
    id: int
    purchase_order_id: int
    product_id: Optional[int]
    product_code: Optional[str]
    product_name: str
    product_description: Optional[str]
    quantity_ordered: float
    quantity_received: float
    quantity_pending: float
    unit_price: float
    total_price: float
    unit_of_measure: str
    specifications: Optional[Dict[str, Any]]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    """Schema for creating an invoice"""
    invoice_number: str = Field(..., min_length=1, max_length=50)
    vendor_invoice_number: Optional[str] = Field(None, max_length=50)
    vendor_id: int
    purchase_order_id: Optional[int] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    subtotal: float = Field(default=0, ge=0)
    tax_amount: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    currency: str = Field(default="USD", max_length=3)
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class InvoiceResponse(BaseModel):
    """Schema for invoice responses"""
    id: int
    invoice_number: str
    vendor_invoice_number: Optional[str]
    vendor_id: int
    purchase_order_id: Optional[int]
    status: str
    invoice_date: datetime
    due_date: Optional[datetime]
    payment_date: Optional[datetime]
    subtotal: float
    tax_amount: float
    total_amount: float
    paid_amount: float
    currency: str
    notes: Optional[str]
    terms_and_conditions: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True



