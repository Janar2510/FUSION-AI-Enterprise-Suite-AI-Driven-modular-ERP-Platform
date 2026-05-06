"""
Helpdesk Module Models
Customer support with ticketing system and AI-powered automation
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

Base = declarative_base()


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


class SupportAgent(Base):
    """Support agent model"""
    __tablename__ = "support_agents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_code = Column(String(20), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Agent settings
    is_active = Column(Boolean, default=True)
    max_tickets = Column(Integer, default=10)
    working_hours = Column(JSON, nullable=True)  # {"monday": {"start": "09:00", "end": "17:00"}, ...}
    timezone = Column(String(50), default="UTC")
    
    # Skills and categories
    specializations = Column(JSON, nullable=True)  # List of categories they handle
    skills = Column(JSON, nullable=True)  # List of skills
    languages = Column(JSON, nullable=True)  # List of supported languages
    
    # Performance metrics
    total_tickets_handled = Column(Integer, default=0)
    average_resolution_time = Column(Float, default=0.0)
    customer_satisfaction_score = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tickets = relationship("Ticket", back_populates="assigned_agent")
    responses = relationship("TicketResponse", back_populates="agent")


class Ticket(Base):
    """Main ticket model"""
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, nullable=False)
    
    # Customer information
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=True)
    customer_company = Column(String(255), nullable=True)
    
    # Ticket details
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default=TicketCategory.GENERAL.value)
    priority = Column(String(20), nullable=False, default=TicketPriority.MEDIUM.value)
    status = Column(String(30), nullable=False, default=TicketStatus.OPEN.value)
    source = Column(String(30), nullable=False, default=TicketSource.WEB_FORM.value)
    
    # Assignment
    assigned_agent_id = Column(Integer, ForeignKey("support_agents.id"), nullable=True)
    assigned_team_id = Column(Integer, ForeignKey("support_teams.id"), nullable=True)
    
    # SLA tracking
    sla_due_date = Column(DateTime(timezone=True), nullable=True)
    first_response_due = Column(DateTime(timezone=True), nullable=True)
    resolution_due_date = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    first_response_at = Column(DateTime(timezone=True), nullable=True)
    last_response_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Customer satisfaction
    satisfaction_score = Column(Integer, nullable=True)  # 1-5 rating
    satisfaction_comment = Column(Text, nullable=True)
    satisfaction_submitted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional data
    tags = Column(JSON, nullable=True)  # List of tags
    ticket_metadata = Column(JSON, nullable=True)  # Additional metadata
    attachments = Column(JSON, nullable=True)  # List of attachment URLs
    
    # AI processing
    ai_classification = Column(String(100), nullable=True)
    ai_priority_suggestion = Column(String(20), nullable=True)
    ai_category_suggestion = Column(String(50), nullable=True)
    ai_summary = Column(Text, nullable=True)
    sentiment_score = Column(Float, nullable=True)  # -1 to 1
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    assigned_agent = relationship("SupportAgent", back_populates="tickets")
    assigned_team = relationship("SupportTeam", back_populates="tickets")
    responses = relationship("TicketResponse", back_populates="ticket", cascade="all, delete-orphan")
    activities = relationship("TicketActivity", back_populates="ticket", cascade="all, delete-orphan")
    customer = relationship("User", foreign_keys=[customer_id])
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<Ticket(id={self.id}, ticket_number='{self.ticket_number}', status='{self.status}')>"


class TicketResponse(Base):
    """Ticket response/comment model"""
    __tablename__ = "ticket_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    
    # Response details
    content = Column(Text, nullable=False)
    response_type = Column(String(20), nullable=False, default="reply")  # reply, note, internal
    is_internal = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    
    # Author information
    agent_id = Column(Integer, ForeignKey("support_agents.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_name = Column(String(255), nullable=False)
    author_email = Column(String(255), nullable=False)
    
    # Response metadata
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)
    attachments = Column(JSON, nullable=True)  # List of attachment URLs
    
    # AI processing
    ai_sentiment = Column(Float, nullable=True)  # -1 to 1
    ai_tone = Column(String(50), nullable=True)  # professional, friendly, etc.
    ai_suggestions = Column(JSON, nullable=True)  # AI suggestions for improvement
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    ticket = relationship("Ticket", back_populates="responses")
    agent = relationship("SupportAgent", back_populates="responses")
    author = relationship("User", foreign_keys=[user_id])


class TicketActivity(Base):
    """Ticket activity log"""
    __tablename__ = "ticket_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    
    # Activity details
    activity_type = Column(String(50), nullable=False)  # created, assigned, status_changed, etc.
    description = Column(Text, nullable=False)
    old_value = Column(String(255), nullable=True)
    new_value = Column(String(255), nullable=True)
    
    # Actor information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    agent_id = Column(Integer, ForeignKey("support_agents.id"), nullable=True)
    actor_name = Column(String(255), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    ticket = relationship("Ticket", back_populates="activities")
    user = relationship("User", foreign_keys=[user_id])
    agent = relationship("SupportAgent", foreign_keys=[agent_id])


class SupportTeam(Base):
    """Support team model"""
    __tablename__ = "support_teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Team settings
    is_active = Column(Boolean, default=True)
    escalation_rules = Column(JSON, nullable=True)  # Escalation configuration
    working_hours = Column(JSON, nullable=True)  # Team working hours
    timezone = Column(String(50), default="UTC")
    
    # Team metrics
    total_tickets_handled = Column(Integer, default=0)
    average_resolution_time = Column(Float, default=0.0)
    customer_satisfaction_score = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    tickets = relationship("Ticket", back_populates="assigned_team")
    team_members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class TeamMember(Base):
    """Team member model"""
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("support_teams.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("support_agents.id"), nullable=False)
    
    # Role in team
    role = Column(String(50), nullable=False, default="member")  # member, lead, manager
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    team = relationship("SupportTeam", back_populates="team_members")
    agent = relationship("SupportAgent")


class KnowledgeBase(Base):
    """Knowledge base article model"""
    __tablename__ = "knowledge_base"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    
    # Article details
    category = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=True)  # List of tags
    keywords = Column(JSON, nullable=True)  # List of keywords for search
    
    # Visibility and access
    is_public = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    
    # Article status
    status = Column(String(20), default="draft")  # draft, published, archived
    version = Column(Integer, default=1)
    
    # SEO and search
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    search_vector = Column(JSON, nullable=True)  # For full-text search
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])


class User(Base):
    """User model (referenced by helpdesk models)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # User relationships for helpdesk
    created_tickets = relationship("Ticket", foreign_keys="Ticket.created_by")
    ticket_responses = relationship("TicketResponse", foreign_keys="TicketResponse.user_id")
    ticket_activities = relationship("TicketActivity", foreign_keys="TicketActivity.user_id")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


# Pydantic models for API validation
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SupportAgentCreate(BaseModel):
    """Schema for creating a support agent"""
    user_id: int
    agent_code: str = Field(..., min_length=3, max_length=20)
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    max_tickets: int = Field(default=10, ge=1, le=100)
    specializations: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None


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


class SupportAgentResponse(BaseModel):
    """Schema for support agent responses"""
    id: int
    user_id: int
    agent_code: str
    name: str
    email: str
    phone: Optional[str]
    is_active: bool
    max_tickets: int
    specializations: Optional[List[str]]
    skills: Optional[List[str]]
    languages: Optional[List[str]]
    total_tickets_handled: int
    average_resolution_time: float
    customer_satisfaction_score: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TicketCreate(BaseModel):
    """Schema for creating a ticket"""
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


class TicketResponse(BaseModel):
    """Schema for ticket responses"""
    id: int
    ticket_number: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str]
    customer_company: Optional[str]
    title: str
    description: str
    category: str
    priority: str
    status: str
    source: str
    assigned_agent_id: Optional[int]
    assigned_team_id: Optional[int]
    satisfaction_score: Optional[int]
    satisfaction_comment: Optional[str]
    tags: Optional[List[str]]
    attachments: Optional[List[str]]
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


class TicketResponseCreate(BaseModel):
    """Schema for creating a ticket response"""
    ticket_id: int
    content: str = Field(..., min_length=1)
    response_type: str = Field(default="reply", pattern="^(reply|note|internal)$")
    is_internal: bool = Field(default=False)
    is_public: bool = Field(default=True)
    attachments: Optional[List[str]] = None


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


class KnowledgeBaseCreate(BaseModel):
    """Schema for creating knowledge base article"""
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    summary: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    is_public: bool = Field(default=True)
    is_featured: bool = Field(default=False)


class KnowledgeBaseResponse(BaseModel):
    """Schema for knowledge base responses"""
    id: int
    title: str
    content: str
    summary: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]]
    keywords: Optional[List[str]]
    is_public: bool
    is_featured: bool
    view_count: int
    status: str
    version: int
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]

    class Config:
        from_attributes = True
