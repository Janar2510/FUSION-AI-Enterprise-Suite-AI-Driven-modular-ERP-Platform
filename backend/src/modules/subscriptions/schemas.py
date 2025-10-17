"""
Subscriptions Module Pydantic Schemas
Data validation and serialization for subscription operations
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


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


class CustomerType(str, Enum):
    """Customer type enumeration"""
    INDIVIDUAL = "individual"
    BUSINESS = "business"


# Base schemas
class SubscriptionPlanBase(BaseModel):
    """Base subscription plan schema"""
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
    metadata: Optional[Dict[str, Any]] = None


class SubscriptionPlanCreate(SubscriptionPlanBase):
    """Schema for creating a subscription plan"""
    plan_code: str = Field(..., min_length=1, max_length=50)


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
    metadata: Optional[Dict[str, Any]] = None


class SubscriptionPlanResponse(SubscriptionPlanBase):
    """Schema for subscription plan responses"""
    id: int
    plan_code: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    """Base customer schema"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    company_name: Optional[str] = Field(None, max_length=255)
    company_size: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    billing_address: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None
    customer_type: CustomerType = Field(default=CustomerType.INDIVIDUAL)
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    """Schema for creating a customer"""
    customer_code: str = Field(..., min_length=1, max_length=50)


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
    customer_type: Optional[CustomerType] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    """Schema for customer responses"""
    id: int
    customer_code: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SubscriptionBase(BaseModel):
    """Base subscription schema"""
    billing_cycle: BillingCycle = Field(default=BillingCycle.MONTHLY)
    base_price: float = Field(..., ge=0)
    currency: str = Field(default="USD", max_length=3)
    trial_days: int = Field(default=0, ge=0)
    start_date: Optional[datetime] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SubscriptionCreate(SubscriptionBase):
    """Schema for creating a subscription"""
    customer_id: int
    plan_id: int


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
    metadata: Optional[Dict[str, Any]] = None


class SubscriptionResponse(SubscriptionBase):
    """Schema for subscription responses"""
    id: int
    subscription_code: str
    customer_id: int
    plan_id: int
    status: str
    addon_price: float
    total_price: float
    end_date: Optional[datetime]
    trial_end_date: Optional[datetime]
    next_billing_date: Optional[datetime]
    cancelled_at: Optional[datetime]
    setup_fee_paid: bool
    current_usage: int
    usage_limit: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    """Base payment schema"""
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
    metadata: Optional[Dict[str, Any]] = None


class PaymentCreate(PaymentBase):
    """Schema for creating a payment"""
    customer_id: int
    subscription_id: Optional[int] = None


class PaymentUpdate(BaseModel):
    """Schema for updating a payment"""
    status: Optional[PaymentStatus] = None
    amount: Optional[float] = Field(None, gt=0)
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_reference: Optional[str] = Field(None, max_length=100)
    payment_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PaymentResponse(PaymentBase):
    """Schema for payment responses"""
    id: int
    payment_code: str
    customer_id: int
    subscription_id: Optional[int]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class UsageRecordBase(BaseModel):
    """Base usage record schema"""
    feature_name: str = Field(..., min_length=1, max_length=100)
    usage_amount: int = Field(..., gt=0)
    usage_unit: str = Field(default="count", max_length=20)
    usage_date: Optional[datetime] = None
    billing_period_start: Optional[datetime] = None
    billing_period_end: Optional[datetime] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UsageRecordCreate(UsageRecordBase):
    """Schema for creating a usage record"""
    customer_id: int
    subscription_id: Optional[int] = None


class UsageRecordUpdate(BaseModel):
    """Schema for updating a usage record"""
    feature_name: Optional[str] = Field(None, max_length=100)
    usage_amount: Optional[int] = Field(None, gt=0)
    usage_unit: Optional[str] = Field(None, max_length=20)
    usage_date: Optional[datetime] = None
    billing_period_start: Optional[datetime] = None
    billing_period_end: Optional[datetime] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UsageRecordResponse(UsageRecordBase):
    """Schema for usage record responses"""
    id: int
    customer_id: int
    subscription_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Search and filter schemas
class SubscriptionSearch(BaseModel):
    """Schema for subscription search"""
    query: Optional[str] = None
    status: Optional[List[SubscriptionStatus]] = None
    plan_type: Optional[List[PlanType]] = None
    billing_cycle: Optional[List[BillingCycle]] = None
    customer_id: Optional[int] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class CustomerSearch(BaseModel):
    """Schema for customer search"""
    query: Optional[str] = None
    customer_type: Optional[List[CustomerType]] = None
    status: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# Statistics and analytics schemas
class SubscriptionStatistics(BaseModel):
    """Schema for subscription statistics"""
    total_subscriptions: int
    active_subscriptions: int
    trial_subscriptions: int
    cancelled_subscriptions: int
    expired_subscriptions: int
    monthly_recurring_revenue: float
    annual_recurring_revenue: float
    average_revenue_per_user: float
    churn_rate: float
    subscriptions_by_status: Dict[str, int]
    subscriptions_by_plan: Dict[str, int]
    subscriptions_by_billing_cycle: Dict[str, int]


class CustomerStatistics(BaseModel):
    """Schema for customer statistics"""
    total_customers: int
    active_customers: int
    trial_customers: int
    churned_customers: int
    customers_by_type: Dict[str, int]
    customers_by_industry: Dict[str, int]
    customers_by_company_size: Dict[str, int]
    top_customers_by_revenue: List[Dict[str, Any]]


class RevenueStatistics(BaseModel):
    """Schema for revenue statistics"""
    total_revenue: float
    monthly_revenue: float
    quarterly_revenue: float
    annual_revenue: float
    revenue_by_plan: Dict[str, float]
    revenue_by_billing_cycle: Dict[str, float]
    revenue_trends: List[Dict[str, Any]]
    payment_status_distribution: Dict[str, int]


class SubscriptionDashboardMetrics(BaseModel):
    """Schema for subscription dashboard metrics"""
    subscription_statistics: SubscriptionStatistics
    customer_statistics: CustomerStatistics
    revenue_statistics: RevenueStatistics
    recent_subscriptions: List[SubscriptionResponse]
    upcoming_renewals: List[SubscriptionResponse]
    failed_payments: List[PaymentResponse]
    usage_alerts: List[Dict[str, Any]]


class SubscriptionAnalytics(BaseModel):
    """Schema for subscription analytics"""
    period_days: int
    subscription_growth: List[Dict[str, Any]]
    revenue_trends: List[Dict[str, Any]]
    churn_analysis: List[Dict[str, Any]]
    usage_patterns: List[Dict[str, Any]]
    customer_lifecycle: List[Dict[str, Any]]
    plan_performance: List[Dict[str, Any]]
    payment_success_rates: List[Dict[str, Any]]


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


@validator('features', pre=True)
def validate_features(cls, v):
    """Validate and clean features"""
    if v is None:
        return []
    if isinstance(v, str):
        return [feature.strip() for feature in v.split(',') if feature.strip()]
    return v


@validator('tags', pre=True)
def validate_tags(cls, v):
    """Validate and clean tags"""
    if v is None:
        return []
    if isinstance(v, str):
        return [tag.strip() for tag in v.split(',') if tag.strip()]
    return v


@validator('metadata', pre=True)
def validate_metadata(cls, v):
    """Validate and clean metadata"""
    if v is None:
        return None
    if isinstance(v, str):
        try:
            import json
            return json.loads(v)
        except json.JSONDecodeError:
            return None
    return v



