from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

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

# Quote Item Schemas
class QuoteItemBase(BaseModel):
    product_name: str
    product_description: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: float = Field(1.0, ge=0)
    unit_price: float = Field(0.0, ge=0)
    discount_rate: float = Field(0.0, ge=0, le=100)
    sort_order: int = Field(0, ge=0)

class QuoteItemCreate(QuoteItemBase):
    pass

class QuoteItemResponse(QuoteItemBase):
    id: int
    quote_id: int
    discount_amount: float
    line_total: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Quote Schemas
class QuoteBase(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    title: str
    description: Optional[str] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    terms_conditions: Optional[str] = None

class QuoteCreate(QuoteBase):
    items: List[QuoteItemCreate] = []

class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[QuoteStatus] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    terms_conditions: Optional[str] = None
    tax_rate: Optional[float] = Field(None, ge=0, le=100)
    discount_rate: Optional[float] = Field(None, ge=0, le=100)

class QuoteResponse(QuoteBase):
    id: int
    quote_number: str
    status: QuoteStatus
    subtotal: float
    tax_rate: float
    tax_amount: float
    discount_rate: float
    discount_amount: float
    total_amount: float
    quote_date: datetime
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[QuoteItemResponse] = []
    
    class Config:
        from_attributes = True

# Order Item Schemas
class OrderItemBase(BaseModel):
    product_name: str
    product_description: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: float = Field(1.0, ge=0)
    unit_price: float = Field(0.0, ge=0)
    discount_rate: float = Field(0.0, ge=0, le=100)
    sort_order: int = Field(0, ge=0)

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    discount_amount: float
    line_total: float
    quantity_shipped: float
    quantity_delivered: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    quote_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    title: str
    description: Optional[str] = None
    shipping_address: Optional[Dict[str, Any]] = None
    shipping_method: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = []

class OrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    shipping_address: Optional[Dict[str, Any]] = None
    shipping_method: Optional[str] = None
    tracking_number: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    tax_rate: Optional[float] = Field(None, ge=0, le=100)
    discount_rate: Optional[float] = Field(None, ge=0, le=100)
    shipping_cost: Optional[float] = Field(None, ge=0)

class OrderResponse(OrderBase):
    id: int
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal: float
    tax_rate: float
    tax_amount: float
    discount_rate: float
    discount_amount: float
    shipping_cost: float
    total_amount: float
    payment_due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    tracking_number: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    order_date: datetime
    expected_delivery: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True

# Revenue Schemas
class RevenueBase(BaseModel):
    order_id: int
    revenue_type: str = Field(..., pattern="^(sale|refund|adjustment)$")
    amount: float
    currency: str = "USD"
    description: Optional[str] = None

class RevenueCreate(RevenueBase):
    pass

class RevenueResponse(RevenueBase):
    id: int
    revenue_date: datetime
    period_year: int
    period_month: int
    period_quarter: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics Schemas
class SalesAnalytics(BaseModel):
    period: str
    total_revenue: float
    total_orders: int
    total_quotes: int
    conversion_rate: float
    average_order_value: float
    top_products: List[Dict[str, Any]]
    revenue_by_month: List[Dict[str, Any]]
    order_status_distribution: Dict[str, int]
    payment_status_distribution: Dict[str, int]

class SalesForecast(BaseModel):
    period: str
    forecasted_revenue: float
    confidence_level: float
    factors: List[str]
    recommendations: List[str]
