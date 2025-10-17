"""
Helpdesk Module Pydantic Schemas
Data validation and serialization for helpdesk operations
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class TicketStatus(str, Enum):
    """Ticket status enumeration"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING_CUSTOMER = "pending_customer"
    PENDING_VENDOR = "pending_vendor"
    RESOLVED = "resolved"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class TicketPriority(str, Enum):
    """Ticket priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"


class TicketCategory(str, Enum):
    """Ticket category enumeration"""
    TECHNICAL = "technical"
    BILLING = "billing"
    GENERAL = "general"
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"
    ACCOUNT = "account"
    OTHER = "other"


class TicketSource(str, Enum):
    """Ticket source enumeration"""
    EMAIL = "email"
    WEB_FORM = "web_form"
    PHONE = "phone"
    CHAT = "chat"
    API = "api"
    MANUAL = "manual"
    SOCIAL_MEDIA = "social_media"
    MOBILE_APP = "mobile_app"


class ResponseType(str, Enum):
    """Response type enumeration"""
    REPLY = "reply"
    NOTE = "note"
    INTERNAL = "internal"


class TeamRole(str, Enum):
    """Team role enumeration"""
    MEMBER = "member"
    LEAD = "lead"
    MANAGER = "manager"


class ArticleStatus(str, Enum):
    """Knowledge base article status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# Base schemas
class SupportAgentBase(BaseModel):
    """Base support agent schema"""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    max_tickets: int = Field(default=10, ge=1, le=100)
    specializations: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None


class SupportAgentCreate(SupportAgentBase):
    """Schema for creating a support agent"""
    user_id: int
    agent_code: str = Field(..., min_length=3, max_length=20)


class SupportAgentUpdate(BaseModel):
    """Schema for updating a support agent"""
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None
    max_tickets: Optional[int] = Field(None, ge=1, le=100)
    specializations: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None


class SupportAgentResponse(SupportAgentBase):
    """Schema for support agent responses"""
    id: int
    user_id: int
    agent_code: str
    is_active: bool
    total_tickets_handled: int
    average_resolution_time: float
    customer_satisfaction_score: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TicketBase(BaseModel):
    """Base ticket schema"""
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: str = Field(..., max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_company: Optional[str] = Field(None, max_length=255)
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    category: TicketCategory = Field(default=TicketCategory.GENERAL)
    priority: TicketPriority = Field(default=TicketPriority.MEDIUM)
    source: TicketSource = Field(default=TicketSource.WEB_FORM)
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None


class TicketCreate(TicketBase):
    """Schema for creating a ticket"""
    pass


class TicketUpdate(BaseModel):
    """Schema for updating a ticket"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[TicketCategory] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_agent_id: Optional[int] = None
    assigned_team_id: Optional[int] = None
    tags: Optional[List[str]] = None
    satisfaction_score: Optional[int] = Field(None, ge=1, le=5)
    satisfaction_comment: Optional[str] = None


class TicketResponse(TicketBase):
    """Schema for ticket responses"""
    id: int
    ticket_number: str
    status: str
    assigned_agent_id: Optional[int]
    assigned_team_id: Optional[int]
    satisfaction_score: Optional[int]
    satisfaction_comment: Optional[str]
    ai_classification: Optional[str]
    ai_priority_suggestion: Optional[str]
    ai_category_suggestion: Optional[str]
    ai_summary: Optional[str]
    sentiment_score: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]
    first_response_at: Optional[datetime]
    last_response_at: Optional[datetime]
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TicketResponseBase(BaseModel):
    """Base ticket response schema"""
    content: str = Field(..., min_length=1)
    response_type: ResponseType = Field(default=ResponseType.REPLY)
    is_internal: bool = Field(default=False)
    is_public: bool = Field(default=True)
    attachments: Optional[List[str]] = None


class TicketResponseCreate(TicketResponseBase):
    """Schema for creating a ticket response"""
    ticket_id: int


class TicketResponseUpdate(BaseModel):
    """Schema for updating a ticket response"""
    content: Optional[str] = None
    response_type: Optional[ResponseType] = None
    is_internal: Optional[bool] = None
    is_public: Optional[bool] = None
    attachments: Optional[List[str]] = None


class TicketResponseResponse(TicketResponseBase):
    """Schema for ticket response responses"""
    id: int
    ticket_id: int
    author_name: str
    author_email: str
    agent_id: Optional[int]
    user_id: Optional[int]
    email_sent: bool
    email_sent_at: Optional[datetime]
    ai_sentiment: Optional[float]
    ai_tone: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TicketActivityResponse(BaseModel):
    """Schema for ticket activity responses"""
    id: int
    ticket_id: int
    activity_type: str
    description: str
    old_value: Optional[str]
    new_value: Optional[str]
    actor_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class SupportTeamBase(BaseModel):
    """Base support team schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    escalation_rules: Optional[Dict[str, Any]] = None
    working_hours: Optional[Dict[str, Any]] = None
    timezone: str = Field(default="UTC")


class SupportTeamCreate(SupportTeamBase):
    """Schema for creating a support team"""
    pass


class SupportTeamUpdate(BaseModel):
    """Schema for updating a support team"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    escalation_rules: Optional[Dict[str, Any]] = None
    working_hours: Optional[Dict[str, Any]] = None
    timezone: Optional[str] = None


class SupportTeamResponse(SupportTeamBase):
    """Schema for support team responses"""
    id: int
    total_tickets_handled: int
    average_resolution_time: float
    customer_satisfaction_score: float
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]

    class Config:
        from_attributes = True


class TeamMemberCreate(BaseModel):
    """Schema for adding team member"""
    team_id: int
    agent_id: int
    role: TeamRole = Field(default=TeamRole.MEMBER)
    is_active: bool = Field(default=True)


class TeamMemberResponse(BaseModel):
    """Schema for team member responses"""
    id: int
    team_id: int
    agent_id: int
    role: str
    is_active: bool
    joined_at: datetime
    left_at: Optional[datetime]

    class Config:
        from_attributes = True


class KnowledgeBaseBase(BaseModel):
    """Base knowledge base schema"""
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    summary: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    is_public: bool = Field(default=True)
    is_featured: bool = Field(default=False)


class KnowledgeBaseCreate(KnowledgeBaseBase):
    """Schema for creating knowledge base article"""
    pass


class KnowledgeBaseUpdate(BaseModel):
    """Schema for updating knowledge base article"""
    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_featured: Optional[bool] = None
    status: Optional[ArticleStatus] = None


class KnowledgeBaseResponse(KnowledgeBaseBase):
    """Schema for knowledge base responses"""
    id: int
    view_count: int
    status: str
    version: int
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    created_by: Optional[int]

    class Config:
        from_attributes = True


# Search and filter schemas
class TicketSearch(BaseModel):
    """Schema for ticket search"""
    query: Optional[str] = None
    status: Optional[List[TicketStatus]] = None
    priority: Optional[List[TicketPriority]] = None
    category: Optional[List[TicketCategory]] = None
    source: Optional[List[TicketSource]] = None
    assigned_agent_id: Optional[int] = None
    assigned_team_id: Optional[int] = None
    customer_email: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    tags: Optional[List[str]] = None
    satisfaction_score: Optional[int] = Field(None, ge=1, le=5)
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class TicketSearchResponse(BaseModel):
    """Schema for ticket search response"""
    tickets: List[TicketResponse]
    total_count: int
    offset: int
    limit: int
    has_more: bool


class KnowledgeBaseSearch(BaseModel):
    """Schema for knowledge base search"""
    query: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_featured: Optional[bool] = None
    status: Optional[ArticleStatus] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# Statistics and analytics schemas
class TicketStatistics(BaseModel):
    """Schema for ticket statistics"""
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
    average_resolution_time: float
    first_response_time: float
    customer_satisfaction_score: float
    tickets_by_priority: Dict[str, int]
    tickets_by_category: Dict[str, int]
    tickets_by_status: Dict[str, int]
    tickets_by_source: Dict[str, int]


class AgentStatistics(BaseModel):
    """Schema for agent statistics"""
    total_agents: int
    active_agents: int
    agents_with_open_tickets: int
    average_tickets_per_agent: float
    top_performing_agents: List[Dict[str, Any]]
    agent_satisfaction_scores: Dict[str, float]


class HelpdeskDashboardMetrics(BaseModel):
    """Schema for helpdesk dashboard metrics"""
    ticket_statistics: TicketStatistics
    agent_statistics: AgentStatistics
    recent_tickets: List[TicketResponse]
    top_categories: List[Dict[str, Any]]
    satisfaction_trends: List[Dict[str, Any]]
    response_time_trends: List[Dict[str, Any]]
    knowledge_base_stats: Dict[str, Any]


class HelpdeskAnalytics(BaseModel):
    """Schema for helpdesk analytics"""
    period_days: int
    ticket_volume_trends: List[Dict[str, Any]]
    resolution_time_trends: List[Dict[str, Any]]
    satisfaction_trends: List[Dict[str, Any]]
    category_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    source_distribution: Dict[str, int]
    agent_performance: List[Dict[str, Any]]
    customer_insights: Dict[str, Any]


# SLA and escalation schemas
class SLARule(BaseModel):
    """Schema for SLA rules"""
    priority: TicketPriority
    first_response_hours: int
    resolution_hours: int
    escalation_hours: int


class EscalationRule(BaseModel):
    """Schema for escalation rules"""
    condition: str  # e.g., "overdue", "high_priority", "unassigned"
    action: str  # e.g., "assign_to_manager", "notify_admin", "change_priority"
    parameters: Optional[Dict[str, Any]] = None


class SLASettings(BaseModel):
    """Schema for SLA settings"""
    business_hours: Dict[str, Any]  # Working hours configuration
    holidays: List[str]  # List of holiday dates
    sla_rules: List[SLARule]
    escalation_rules: List[EscalationRule]
    auto_escalation_enabled: bool = True


# Validation helpers
@validator('tags', pre=True)
def validate_tags(cls, v):
    """Validate and clean tags"""
    if v is None:
        return []
    if isinstance(v, str):
        return [tag.strip() for tag in v.split(',') if tag.strip()]
    return v


@validator('specializations', pre=True)
def validate_specializations(cls, v):
    """Validate and clean specializations"""
    if v is None:
        return []
    if isinstance(v, str):
        return [spec.strip() for spec in v.split(',') if spec.strip()]
    return v


@validator('skills', pre=True)
def validate_skills(cls, v):
    """Validate and clean skills"""
    if v is None:
        return []
    if isinstance(v, str):
        return [skill.strip() for skill in v.split(',') if skill.strip()]
    return v


@validator('languages', pre=True)
def validate_languages(cls, v):
    """Validate and clean languages"""
    if v is None:
        return []
    if isinstance(v, str):
        return [lang.strip() for lang in v.split(',') if lang.strip()]
    return v


@validator('keywords', pre=True)
def validate_keywords(cls, v):
    """Validate and clean keywords"""
    if v is None:
        return []
    if isinstance(v, str):
        return [keyword.strip() for keyword in v.split(',') if keyword.strip()]
    return v



