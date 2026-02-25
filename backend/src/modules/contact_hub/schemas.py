"""
Contact Hub Schemas for FusionAI Enterprise Suite
Pydantic models for API validation and serialization
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
import uuid

class ContactType(str, Enum):
    PERSON = "person"
    COMPANY = "company"
    VENDOR = "vendor"
    CUSTOMER = "customer"
    EMPLOYEE = "employee"

class LifecycleStage(str, Enum):
    LEAD = "lead"
    PROSPECT = "prospect"
    CUSTOMER = "customer"
    PARTNER = "partner"
    CHURNED = "churned"

class ImportanceLevel(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

class ContactBase(BaseModel):
    """Base contact model with common fields"""
    type: ContactType
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    title: Optional[str] = None
    company_name: Optional[str] = None
    tax_id: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    lifecycle_stage: Optional[LifecycleStage] = None

class ContactCreate(ContactBase):
    """Model for creating a new contact"""
    external_id: Optional[str] = None

class ContactUpdate(ContactBase):
    """Model for updating an existing contact"""
    pass

class ContactResponse(ContactBase):
    """Model for returning contact data"""
    id: uuid.UUID
    engagement_score: float = 0.0
    created_at: datetime
    updated_at: datetime
    last_activity_at: Optional[datetime] = None
    created_by: Optional[uuid.UUID] = None
    updated_by: Optional[uuid.UUID] = None

class CompanyBase(BaseModel):
    """Base company model with common fields"""
    name: str
    domain: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    industry: Optional[str] = None
    company_type: Optional[str] = None
    employee_count: Optional[int] = None
    annual_revenue: Optional[float] = None
    description: Optional[str] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    logo_url: Optional[str] = None
    social_profiles: Dict[str, Any] = {}
    technologies_used: List[str] = []
    keywords: List[str] = []
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    account_status: Optional[str] = None
    customer_since: Optional[datetime] = None
    health_score: Optional[float] = None
    churn_risk: Optional[float] = None
    expansion_potential: Optional[float] = None

class CompanyCreate(CompanyBase):
    """Model for creating a new company"""
    pass

class CompanyUpdate(CompanyBase):
    """Model for updating an existing company"""
    pass

class CompanyResponse(CompanyBase):
    """Model for returning company data"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None
    updated_by: Optional[uuid.UUID] = None

class AppProfileBase(BaseModel):
    """Base app profile model"""
    app_name: str
    profile_data: Dict[str, Any]

class AppProfileCreate(AppProfileBase):
    """Model for creating a new app profile"""
    contact_id: uuid.UUID

class AppProfileUpdate(AppProfileBase):
    """Model for updating an existing app profile"""
    pass

class AppProfileResponse(AppProfileBase):
    """Model for returning app profile data"""
    id: uuid.UUID
    contact_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None
    updated_by: Optional[uuid.UUID] = None

class ActivityBase(BaseModel):
    """Base activity model"""
    app_name: str
    activity_type: str
    title: str
    description: Optional[str] = None
    metadata: Dict[str, Any] = {}
    importance: ImportanceLevel = ImportanceLevel.NORMAL
    sentiment_score: Optional[float] = None
    engagement_score: Optional[float] = None
    intent_signals: Dict[str, Any] = {}

class ActivityCreate(ActivityBase):
    """Model for creating a new activity"""
    contact_id: Optional[uuid.UUID] = None
    company_id: Optional[uuid.UUID] = None
    created_by: Optional[str] = None

class ActivityUpdate(ActivityBase):
    """Model for updating an existing activity"""
    pass

class ActivityResponse(ActivityBase):
    """Model for returning activity data"""
    id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    company_id: Optional[uuid.UUID] = None
    created_at: datetime
    created_by: Optional[str] = None
    updated_at: datetime
    updated_by: Optional[uuid.UUID] = None

class RelationshipBase(BaseModel):
    """Base relationship model"""
    source_contact_id: uuid.UUID
    target_contact_id: uuid.UUID
    relationship_type: str
    metadata: Dict[str, Any] = {}

class RelationshipCreate(RelationshipBase):
    """Model for creating a new relationship"""
    pass

class RelationshipUpdate(BaseModel):
    """Model for updating an existing relationship"""
    relationship_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class RelationshipResponse(RelationshipBase):
    """Model for returning relationship data"""
    id: uuid.UUID
    created_at: datetime
    created_by: Optional[uuid.UUID] = None
    updated_by: Optional[uuid.UUID] = None

class TimelineEvent(BaseModel):
    """Model for timeline events"""
    id: uuid.UUID
    activity_type: str
    app_name: str
    title: str
    description: Optional[str]
    created_at: datetime
    sentiment_score: Optional[float]
    engagement_score: Optional[float]
    metadata: Optional[Dict[str, Any]] = {}

class ContactTimelineResponse(BaseModel):
    """Model for contact timeline response"""
    contact_id: uuid.UUID
    events: List[TimelineEvent]
    count: int

class CrossModuleInsights(BaseModel):
    """Model for cross-module insights"""
    total_interactions: int
    modules_used: List[str]
    last_activity: Optional[datetime]
    engagement_trend: float
    lifetime_value: float
    churn_risk: float
    next_best_action: Dict[str, Any]

class SearchResponse(BaseModel):
    """Model for search response"""
    results: List[ContactResponse]
    count: int
    query: str