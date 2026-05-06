"""
Purchase Module Pydantic Schemas
Data validation and serialization for purchase operations
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


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


class PaymentMethod(str, Enum):
    """Payment method enumeration"""
    CHECK = "check"
    WIRE_TRANSFER = "wire_transfer"
    ACH = "ach"
    CREDIT_CARD = "credit_card"
    CASH = "cash"
    OTHER = "other"


# Base schemas
class VendorBase(BaseModel):
    """Base vendor schema"""
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


class VendorCreate(VendorBase):
    """Schema for creating a vendor"""
    vendor_code: str = Field(..., min_length=1, max_length=20)


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
    status: Optional[VendorStatus] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class VendorResponse(VendorBase):
    """Schema for vendor responses"""
    id: int
    vendor_code: str
    current_balance: float
    status: str
    rating: int
    total_orders: int
    total_value: float
    average_delivery_time: Optional[float]
    quality_rating: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    """Base purchase order schema"""
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


class PurchaseOrderCreate(PurchaseOrderBase):
    """Schema for creating a purchase order"""
    vendor_id: int


class PurchaseOrderUpdate(BaseModel):
    """Schema for updating a purchase order"""
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = Field(None, max_length=255)
    status: Optional[PurchaseOrderStatus] = None
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


class PurchaseOrderResponse(PurchaseOrderBase):
    """Schema for purchase order responses"""
    id: int
    po_number: str
    vendor_id: int
    status: str
    order_date: datetime
    actual_delivery_date: Optional[datetime]
    tracking_number: Optional[str]
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PurchaseOrderItemBase(BaseModel):
    """Base purchase order item schema"""
    product_name: str = Field(..., min_length=1, max_length=255)
    product_description: Optional[str] = None
    quantity_ordered: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    total_price: float = Field(..., ge=0)
    unit_of_measure: str = Field(default="pcs", max_length=20)
    specifications: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    """Schema for creating a purchase order item"""
    purchase_order_id: int
    product_id: Optional[int] = None
    product_code: Optional[str] = Field(None, max_length=50)


class PurchaseOrderItemUpdate(BaseModel):
    """Schema for updating a purchase order item"""
    product_id: Optional[int] = None
    product_code: Optional[str] = Field(None, max_length=50)
    product_name: Optional[str] = Field(None, max_length=255)
    product_description: Optional[str] = None
    quantity_ordered: Optional[float] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, ge=0)
    total_price: Optional[float] = Field(None, ge=0)
    unit_of_measure: Optional[str] = Field(None, max_length=20)
    specifications: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    """Schema for purchase order item responses"""
    id: int
    purchase_order_id: int
    product_id: Optional[int]
    product_code: Optional[str]
    quantity_received: float
    quantity_pending: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PurchaseReceiptBase(BaseModel):
    """Base purchase receipt schema"""
    receipt_date: Optional[datetime] = None
    carrier: Optional[str] = Field(None, max_length=100)
    tracking_number: Optional[str] = Field(None, max_length=100)
    condition: str = Field(default="good", max_length=50)
    notes: Optional[str] = None
    attachments: Optional[List[str]] = None


class PurchaseReceiptCreate(PurchaseReceiptBase):
    """Schema for creating a purchase receipt"""
    purchase_order_id: int


class PurchaseReceiptResponse(PurchaseReceiptBase):
    """Schema for purchase receipt responses"""
    id: int
    receipt_number: str
    purchase_order_id: int
    received_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PurchaseReceiptItemBase(BaseModel):
    """Base purchase receipt item schema"""
    quantity_received: float = Field(..., gt=0)
    condition: str = Field(default="good", max_length=50)
    batch_number: Optional[str] = Field(None, max_length=50)
    serial_number: Optional[str] = Field(None, max_length=50)
    expiry_date: Optional[datetime] = None
    quality_notes: Optional[str] = None
    inspection_required: bool = Field(default=False)


class PurchaseReceiptItemCreate(PurchaseReceiptItemBase):
    """Schema for creating a purchase receipt item"""
    receipt_id: int
    purchase_order_item_id: int


class PurchaseReceiptItemResponse(PurchaseReceiptItemBase):
    """Schema for purchase receipt item responses"""
    id: int
    receipt_id: int
    purchase_order_item_id: int
    inspection_completed: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    """Base invoice schema"""
    vendor_invoice_number: Optional[str] = Field(None, max_length=50)
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    subtotal: float = Field(default=0, ge=0)
    tax_amount: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    currency: str = Field(default="USD", max_length=3)
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    """Schema for creating an invoice"""
    invoice_number: str = Field(..., min_length=1, max_length=50)
    vendor_id: int
    purchase_order_id: Optional[int] = None


class InvoiceUpdate(BaseModel):
    """Schema for updating an invoice"""
    vendor_invoice_number: Optional[str] = Field(None, max_length=50)
    status: Optional[InvoiceStatus] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    subtotal: Optional[float] = Field(None, ge=0)
    tax_amount: Optional[float] = Field(None, ge=0)
    total_amount: Optional[float] = Field(None, ge=0)
    paid_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    """Schema for invoice responses"""
    id: int
    invoice_number: str
    vendor_id: int
    purchase_order_id: Optional[int]
    status: str
    payment_date: Optional[datetime]
    paid_amount: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    """Base payment schema"""
    payment_date: Optional[datetime] = None
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = Field(None, max_length=100)
    bank_account: Optional[str] = Field(None, max_length=100)
    bank_routing: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    """Schema for creating a payment"""
    invoice_id: int


class PaymentUpdate(BaseModel):
    """Schema for updating a payment"""
    status: Optional[PaymentStatus] = None
    payment_date: Optional[datetime] = None
    amount: Optional[float] = Field(None, gt=0)
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = Field(None, max_length=100)
    bank_account: Optional[str] = Field(None, max_length=100)
    bank_routing: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    """Schema for payment responses"""
    id: int
    payment_number: str
    invoice_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Search and filter schemas
class PurchaseOrderSearch(BaseModel):
    """Schema for purchase order search"""
    query: Optional[str] = None
    status: Optional[List[PurchaseOrderStatus]] = None
    vendor_id: Optional[int] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    expected_delivery_after: Optional[datetime] = None
    expected_delivery_before: Optional[datetime] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class VendorSearch(BaseModel):
    """Schema for vendor search"""
    query: Optional[str] = None
    status: Optional[List[VendorStatus]] = None
    industry: Optional[str] = None
    business_type: Optional[str] = None
    rating_min: Optional[int] = Field(None, ge=1, le=5)
    rating_max: Optional[int] = Field(None, ge=1, le=5)
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# Statistics and analytics schemas
class PurchaseStatistics(BaseModel):
    """Schema for purchase statistics"""
    total_orders: int
    total_value: float
    pending_orders: int
    approved_orders: int
    received_orders: int
    cancelled_orders: int
    average_order_value: float
    orders_by_status: Dict[str, int]
    top_vendors: List[Dict[str, Any]]
    monthly_trends: List[Dict[str, Any]]


class VendorStatistics(BaseModel):
    """Schema for vendor statistics"""
    total_vendors: int
    active_vendors: int
    inactive_vendors: int
    suspended_vendors: int
    average_rating: float
    vendors_by_status: Dict[str, int]
    vendors_by_industry: Dict[str, int]
    top_performing_vendors: List[Dict[str, Any]]


class PurchaseDashboardMetrics(BaseModel):
    """Schema for purchase dashboard metrics"""
    purchase_statistics: PurchaseStatistics
    vendor_statistics: VendorStatistics
    recent_orders: List[PurchaseOrderResponse]
    pending_approvals: List[PurchaseOrderResponse]
    overdue_invoices: List[InvoiceResponse]
    top_categories: List[Dict[str, Any]]
    spending_trends: List[Dict[str, Any]]


class PurchaseAnalytics(BaseModel):
    """Schema for purchase analytics"""
    period_days: int
    spending_trends: List[Dict[str, Any]]
    vendor_performance: List[Dict[str, Any]]
    category_analysis: List[Dict[str, Any]]
    cost_savings: List[Dict[str, Any]]
    order_status_distribution: Dict[str, int]
    payment_status_distribution: Dict[str, int]
    vendor_ratings: List[Dict[str, Any]]


# Validation helpers
@validator('billing_address', pre=True)
def validate_billing_address(cls, v):
    """Validate and clean billing address"""
    if v is None:
        return None
    if isinstance(v, str):
        try:
            import json
            return json.loads(v)
        except json.JSONDecodeError:
            return None
    return v


@validator('shipping_address', pre=True)
def validate_shipping_address(cls, v):
    """Validate and clean shipping address"""
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


@validator('tags', pre=True)
def validate_tags(cls, v):
    """Validate and clean tags"""
    if v is None:
        return []
    if isinstance(v, str):
        return [tag.strip() for tag in v.split(',') if tag.strip()]
    return v


@validator('attachments', pre=True)
def validate_attachments(cls, v):
    """Validate and clean attachments"""
    if v is None:
        return []
    if isinstance(v, str):
        return [attachment.strip() for attachment in v.split(',') if attachment.strip()]
    return v



