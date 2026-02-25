"""
Subscriptions Module Models
Subscription management with billing cycles, plan management, and customer lifecycle tracking
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

Base = declarative_base()


class SubscriptionStatus(str, Enum):
    """Subscription status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    PAUSED = "paused"
    EXPIRED = "expired"
    PENDING = "pending"
    TRIAL = "trial"
    SUSPENDED = "suspended"


class BillingCycle(str, Enum):
    """Billing cycle enumeration"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    WEEKLY = "weekly"
    DAILY = "daily"
    ONE_TIME = "one_time"


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


class PlanType(str, Enum):
    """Plan type enumeration"""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"


class UsageType(str, Enum):
    """Usage type enumeration"""
    METERED = "metered"
    UNLIMITED = "unlimited"
    QUOTA = "quota"


class SubscriptionPlan(Base):
    """Subscription plan model"""
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Plan details
    plan_type = Column(String(20), default=PlanType.BASIC.value)
    billing_cycle = Column(String(20), default=BillingCycle.MONTHLY.value)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    
    # Usage and limits
    usage_type = Column(String(20), default=UsageType.UNLIMITED.value)
    usage_limit = Column(Integer, nullable=True)  # For quota-based plans
    features = Column(JSON, nullable=True)  # List of features included
    
    # Trial and setup
    trial_days = Column(Integer, default=0)
    setup_fee = Column(Numeric(10, 2), default=0)
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    is_popular = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    plan_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    subscriptions = relationship("Subscription", back_populates="plan")
    addons = relationship("PlanAddon", back_populates="plan", cascade="all, delete-orphan")


class PlanAddon(Base):
    """Plan addon model"""
    __tablename__ = "plan_addons"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Addon details
    price = Column(Numeric(10, 2), nullable=False)
    billing_cycle = Column(String(20), default=BillingCycle.MONTHLY.value)
    usage_type = Column(String(20), default=UsageType.UNLIMITED.value)
    usage_limit = Column(Integer, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_required = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    plan = relationship("SubscriptionPlan", back_populates="addons")
    subscription_addons = relationship("SubscriptionAddon", back_populates="addon")


class Customer(Base):
    """Customer model"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, nullable=False)
    
    # Customer details
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Company information
    company_name = Column(String(255), nullable=True)
    company_size = Column(String(50), nullable=True)
    industry = Column(String(100), nullable=True)
    
    # Address information
    billing_address = Column(JSON, nullable=True)
    shipping_address = Column(JSON, nullable=True)
    
    # Customer metadata
    customer_type = Column(String(50), default="individual")  # individual, business
    status = Column(String(20), default="active")
    tags = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    subscriptions = relationship("Subscription", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")
    usage_records = relationship("UsageRecord", back_populates="customer")


class Subscription(Base):
    """Subscription model"""
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_code = Column(String(50), unique=True, nullable=False)
    
    # Customer and plan
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    
    # Subscription details
    status = Column(String(20), default=SubscriptionStatus.ACTIVE.value)
    billing_cycle = Column(String(20), default=BillingCycle.MONTHLY.value)
    
    # Pricing
    base_price = Column(Numeric(10, 2), nullable=False)
    addon_price = Column(Numeric(10, 2), default=0)
    total_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    
    # Dates
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)
    trial_end_date = Column(DateTime(timezone=True), nullable=True)
    next_billing_date = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Trial and setup
    trial_days = Column(Integer, default=0)
    setup_fee_paid = Column(Boolean, default=False)
    
    # Usage tracking
    current_usage = Column(Integer, default=0)
    usage_limit = Column(Integer, nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    subscription_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    creator = relationship("User", foreign_keys=[created_by])
    addons = relationship("SubscriptionAddon", back_populates="subscription", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="subscription")
    usage_records = relationship("UsageRecord", back_populates="subscription")


class SubscriptionAddon(Base):
    """Subscription addon model"""
    __tablename__ = "subscription_addons"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    addon_id = Column(Integer, ForeignKey("plan_addons.id"), nullable=False)
    
    # Addon details
    quantity = Column(Integer, default=1)
    price = Column(Numeric(10, 2), nullable=False)
    billing_cycle = Column(String(20), default=BillingCycle.MONTHLY.value)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Dates
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subscription = relationship("Subscription", back_populates="addons")
    addon = relationship("PlanAddon", back_populates="subscription_addons")


class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_code = Column(String(50), unique=True, nullable=False)
    
    # Related entities
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    
    # Payment details
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(20), default=PaymentStatus.PENDING.value)
    
    # Payment method
    payment_method = Column(String(50), nullable=True)  # card, bank_transfer, paypal, etc.
    payment_reference = Column(String(100), nullable=True)  # transaction id, invoice number
    
    # Dates
    payment_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    
    # Billing period
    billing_period_start = Column(DateTime(timezone=True), nullable=True)
    billing_period_end = Column(DateTime(timezone=True), nullable=True)
    
    # Additional information
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    payment_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")
    creator = relationship("User", foreign_keys=[created_by])


class UsageRecord(Base):
    """Usage record model"""
    __tablename__ = "usage_records"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Related entities
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    
    # Usage details
    feature_name = Column(String(100), nullable=False)
    usage_amount = Column(Integer, nullable=False)
    usage_unit = Column(String(20), default="count")
    
    # Period
    usage_date = Column(DateTime(timezone=True), server_default=func.now())
    billing_period_start = Column(DateTime(timezone=True), nullable=True)
    billing_period_end = Column(DateTime(timezone=True), nullable=True)
    
    # Additional information
    description = Column(Text, nullable=True)
    usage_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="usage_records")
    subscription = relationship("Subscription", back_populates="usage_records")


class User(Base):
    """User model (referenced by subscription models)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # User relationships for subscriptions
    created_plans = relationship("SubscriptionPlan", foreign_keys="SubscriptionPlan.created_by")
    created_customers = relationship("Customer", foreign_keys="Customer.created_by")
    created_subscriptions = relationship("Subscription", foreign_keys="Subscription.created_by")
    created_payments = relationship("Payment", foreign_keys="Payment.created_by")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


# Pydantic models for API validation
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SubscriptionPlanCreate(BaseModel):
    """Schema for creating a subscription plan"""
    plan_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    plan_type: PlanType = Field(default=PlanType.BASIC)
    billing_cycle: BillingCycle = Field(default=BillingCycle.MONTHLY)
    price: float = Field(..., ge=0)
    currency: str = Field(default="USD", max_length=3)
    usage_type: UsageType = Field(default=UsageType.UNLIMITED)
    usage_limit: Optional[int] = Field(None, ge=0)
    features: Optional[List[str]] = None
    trial_days: int = Field(default=0, ge=0)
    setup_fee: float = Field(default=0, ge=0)
    is_popular: bool = Field(default=False)
    sort_order: int = Field(default=0)
    plan_metadata: Optional[Dict[str, Any]] = None


class SubscriptionPlanUpdate(BaseModel):
    """Schema for updating a subscription plan"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    plan_type: Optional[PlanType] = None
    billing_cycle: Optional[BillingCycle] = None
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    usage_type: Optional[UsageType] = None
    usage_limit: Optional[int] = Field(None, ge=0)
    features: Optional[List[str]] = None
    trial_days: Optional[int] = Field(None, ge=0)
    setup_fee: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None
    sort_order: Optional[int] = None
    plan_metadata: Optional[Dict[str, Any]] = None


class SubscriptionPlanResponse(BaseModel):
    """Schema for subscription plan responses"""
    id: int
    plan_code: str
    name: str
    description: Optional[str]
    plan_type: str
    billing_cycle: str
    price: float
    currency: str
    usage_type: str
    usage_limit: Optional[int]
    features: Optional[List[str]]
    trial_days: int
    setup_fee: float
    is_active: bool
    is_popular: bool
    sort_order: int
    plan_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CustomerCreate(BaseModel):
    """Schema for creating a customer"""
    customer_code: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    company_name: Optional[str] = Field(None, max_length=255)
    company_size: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    billing_address: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None
    customer_type: str = Field(default="individual", max_length=50)
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    company_name: Optional[str] = Field(None, max_length=255)
    company_size: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    billing_address: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None
    customer_type: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    """Schema for customer responses"""
    id: int
    customer_code: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    company_name: Optional[str]
    company_size: Optional[str]
    industry: Optional[str]
    billing_address: Optional[Dict[str, Any]]
    shipping_address: Optional[Dict[str, Any]]
    customer_type: str
    status: str
    tags: Optional[List[str]]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    """Schema for creating a subscription"""
    customer_id: int
    plan_id: int
    billing_cycle: BillingCycle = Field(default=BillingCycle.MONTHLY)
    base_price: float = Field(..., ge=0)
    currency: str = Field(default="USD", max_length=3)
    trial_days: int = Field(default=0, ge=0)
    start_date: Optional[datetime] = None
    notes: Optional[str] = None
    plan_metadata: Optional[Dict[str, Any]] = None


class SubscriptionUpdate(BaseModel):
    """Schema for updating a subscription"""
    plan_id: Optional[int] = None
    status: Optional[SubscriptionStatus] = None
    billing_cycle: Optional[BillingCycle] = None
    base_price: Optional[float] = Field(None, ge=0)
    addon_price: Optional[float] = Field(None, ge=0)
    total_price: Optional[float] = Field(None, ge=0)
    end_date: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    current_usage: Optional[int] = Field(None, ge=0)
    usage_limit: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    plan_metadata: Optional[Dict[str, Any]] = None


class SubscriptionResponse(BaseModel):
    """Schema for subscription responses"""
    id: int
    subscription_code: str
    customer_id: int
    plan_id: int
    status: str
    billing_cycle: str
    base_price: float
    addon_price: float
    total_price: float
    currency: str
    start_date: datetime
    end_date: Optional[datetime]
    trial_end_date: Optional[datetime]
    next_billing_date: Optional[datetime]
    cancelled_at: Optional[datetime]
    trial_days: int
    setup_fee_paid: bool
    current_usage: int
    usage_limit: Optional[int]
    notes: Optional[str]
    subscription_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    """Schema for creating a payment"""
    customer_id: int
    subscription_id: Optional[int] = None
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_reference: Optional[str] = Field(None, max_length=100)
    payment_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    billing_period_start: Optional[datetime] = None
    billing_period_end: Optional[datetime] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    plan_metadata: Optional[Dict[str, Any]] = None


class PaymentResponse(BaseModel):
    """Schema for payment responses"""
    id: int
    payment_code: str
    customer_id: int
    subscription_id: Optional[int]
    amount: float
    currency: str
    status: str
    payment_method: Optional[str]
    payment_reference: Optional[str]
    payment_date: Optional[datetime]
    due_date: Optional[datetime]
    billing_period_start: Optional[datetime]
    billing_period_end: Optional[datetime]
    description: Optional[str]
    notes: Optional[str]
    payment_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class UsageRecordCreate(BaseModel):
    """Schema for creating a usage record"""
    customer_id: int
    subscription_id: Optional[int] = None
    feature_name: str = Field(..., min_length=1, max_length=100)
    usage_amount: int = Field(..., gt=0)
    usage_unit: str = Field(default="count", max_length=20)
    usage_date: Optional[datetime] = None
    billing_period_start: Optional[datetime] = None
    billing_period_end: Optional[datetime] = None
    description: Optional[str] = None
    plan_metadata: Optional[Dict[str, Any]] = None


class UsageRecordResponse(BaseModel):
    """Schema for usage record responses"""
    id: int
    customer_id: int
    subscription_id: Optional[int]
    feature_name: str
    usage_amount: int
    usage_unit: str
    usage_date: datetime
    billing_period_start: Optional[datetime]
    billing_period_end: Optional[datetime]
    description: Optional[str]
    usage_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
