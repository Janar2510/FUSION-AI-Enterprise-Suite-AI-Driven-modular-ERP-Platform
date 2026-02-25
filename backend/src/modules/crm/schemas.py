from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"

class DealStatus(str, Enum):
    OPEN = "open"
    WON = "won"
    LOST = "lost"
    PENDING = "pending"

class ContactCreate(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    company_id: Optional[int] = None
    lead_source: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = {}

class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    lead_status: Optional[LeadStatus] = None
    lead_source: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ContactResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    full_name: Optional[str]
    phone: Optional[str]
    mobile: Optional[str]
    job_title: Optional[str]
    department: Optional[str]
    lead_status: LeadStatus
    lead_source: Optional[str]
    lead_score: int
    engagement_score: float
    total_interactions: int
    email_opens: int
    email_clicks: int
    lifetime_value: float
    last_activity: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CompanyCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    industry: Optional[str] = None
    company_type: Optional[str] = None
    employee_count: Optional[int] = None
    annual_revenue: Optional[float] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None

class CompanyResponse(BaseModel):
    id: int
    name: str
    domain: Optional[str]
    website: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    industry: Optional[str]
    company_type: Optional[str]
    employee_count: Optional[int]
    annual_revenue: Optional[float]
    account_status: Optional[str]
    health_score: Optional[float]
    churn_risk: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

class DealCreate(BaseModel):
    name: str
    contact_id: int
    company_id: Optional[int] = None
    amount: float
    currency: str = "USD"
    probability: int = 10
    expected_close_date: Optional[datetime] = None
    pipeline_id: Optional[int] = None
    stage_id: Optional[int] = None
    deal_type: str = "new"
    lead_source: Optional[str] = None
    products: Optional[List[Dict[str, Any]]] = []
    custom_fields: Optional[Dict[str, Any]] = {}

class DealUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    stage_id: Optional[int] = None
    status: Optional[DealStatus] = None
    lost_reason: Optional[str] = None
    products: Optional[List[Dict[str, Any]]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class DealResponse(BaseModel):
    id: int
    name: str
    amount: float
    currency: str
    probability: int
    expected_close_date: Optional[datetime]
    actual_close_date: Optional[datetime]
    status: DealStatus
    deal_type: str
    created_at: datetime
    updated_at: datetime
    last_activity: Optional[datetime]
    contact: Optional[ContactResponse] = None
    company: Optional[CompanyResponse] = None
    
    class Config:
        from_attributes = True

class PipelineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False
    team_id: Optional[int] = None

class StageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    position: int
    probability: int = 10
    color: str = "#6B46C1"
    requirements: Optional[Dict[str, Any]] = {}
    automations: Optional[Dict[str, Any]] = {}

class ActivityCreate(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    completed: bool = False

class LeadScoringResponse(BaseModel):
    lead_score: int
    qualification: str
    scoring_factors: List[str]
    recommended_action: str
    next_best_action: Dict[str, Any]
    conversion_probability: float
    estimated_deal_size: Optional[float] = None

class EmailGenerationResponse(BaseModel):
    primary_version: Dict[str, str]
    ab_test_variations: List[Dict[str, str]]
    personalization_score: float
    predicted_open_rate: float
    optimal_send_time: Optional[datetime]
    follow_up_sequence: Optional[List[Dict[str, Any]]] = None

class OpportunityResponse(BaseModel):
    type: str  # upsell, cross-sell
    product: str
    reason: str
    probability: float
    estimated_value: float
    timing: str
    action: str

class ChurnRiskResponse(BaseModel):
    churn_probability: float
    risk_level: str
    alert_level: str
    risk_factors: Dict[str, Any]
    prevention_actions: List[Dict[str, Any]]
    estimated_revenue_at_risk: float
    recommended_intervention: Optional[Dict[str, Any]] = None

class DealAnalysisResponse(BaseModel):
    win_probability: float
    health_score: float
    health_factors: Dict[str, Any]
    risks: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    optimal_actions: List[Dict[str, Any]]
    forecast_confidence: float

class DashboardMetrics(BaseModel):
    total_contacts: int
    qualified_leads: int
    pipeline_value: float
    win_rate: float
    contacts_growth: float
    leads_growth: float
    pipeline_growth: float
    win_rate_change: float

class ExecutiveInsights(BaseModel):
    key_insights: List[str]
    recommendations: List[str]
    alerts: List[Dict[str, Any]]
    trends: Dict[str, Any]

class DealMove(BaseModel):
    stage_id: int
    user_id: int

class ContactTimelineEvent(BaseModel):
    id: int
    activity_type: str
    module: str
    title: str
    description: Optional[str]
    created_at: datetime
    sentiment_score: Optional[float]
    engagement_score: Optional[float]
    metadata: Optional[Dict[str, Any]] = {}
    
    class Config:
        from_attributes = True