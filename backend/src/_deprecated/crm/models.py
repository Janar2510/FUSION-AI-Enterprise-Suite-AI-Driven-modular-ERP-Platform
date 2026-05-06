from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float, Text, Boolean, Enum as SQLEnum, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ...core.contact_tracker import Base, ContactActivity

# Many-to-many relationships
contact_tags = Table('crm_contact_tags', Base.metadata,
    Column('contact_id', Integer, ForeignKey('crm_contacts.id')),
    Column('tag_id', Integer, ForeignKey('crm_tags.id'))
)

contact_companies = Table('crm_contact_companies', Base.metadata,
    Column('contact_id', Integer, ForeignKey('crm_contacts.id')),
    Column('company_id', Integer, ForeignKey('crm_companies.id'))
)

class LeadStatus(enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"

class DealStatus(enum.Enum):
    OPEN = "open"
    WON = "won"
    LOST = "lost"
    PENDING = "pending"

class ActivityType(str, enum.Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"
    QUOTE_SENT = "quote_sent"
    CONTRACT_SENT = "contract_sent"

class CRMContact(Base):
    __tablename__ = "crm_contacts"
    
    id = Column(Integer, primary_key=True)
    
    # Basic Information
    email = Column(String(255), unique=True, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    full_name = Column(String(200))
    phone = Column(String(50))
    mobile = Column(String(50))
    
    # Professional Information
    job_title = Column(String(200))
    department = Column(String(100))
    companies = relationship("CRMCompany", secondary=contact_companies, back_populates="contacts")
    linkedin_url = Column(String(500))
    twitter_handle = Column(String(100))
    
    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    
    # Lead Information
    lead_status = Column(SQLEnum(LeadStatus), default=LeadStatus.NEW)
    lead_source = Column(String(100))  # website, referral, campaign, etc.
    lead_score = Column(Integer, default=0)  # AI-calculated score
    
    # AI-Enriched Data
    personality_insights = Column(JSON)  # DISC, Myers-Briggs, etc.
    communication_preferences = Column(JSON)  # email, phone, time preferences
    interests = Column(JSON)  # Detected from interactions
    pain_points = Column(JSON)  # Identified needs
    buying_signals = Column(JSON)  # AI-detected signals
    
    # Engagement Metrics
    engagement_score = Column(Float, default=0.0)  # 0-100
    last_contacted = Column(DateTime)
    last_activity = Column(DateTime)
    total_interactions = Column(Integer, default=0)
    email_opens = Column(Integer, default=0)
    email_clicks = Column(Integer, default=0)
    
    # Relationship Management
    owner_id = Column(Integer, ForeignKey("users.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    tags = relationship("CRMTag", secondary=contact_tags, back_populates="contacts")
    
    # Financial
    lifetime_value = Column(Float, default=0.0)
    total_revenue = Column(Float, default=0.0)
    outstanding_amount = Column(Float, default=0.0)
    credit_limit = Column(Float)
    
    # Preferences and Consent
    email_opted_in = Column(Boolean, default=True)
    sms_opted_in = Column(Boolean, default=False)
    marketing_consent = Column(Boolean, default=True)
    preferred_language = Column(String(10), default='en')
    timezone = Column(String(50))
    
    # Custom Fields
    custom_fields = Column(JSON, default=dict)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source = Column(String(50))  # manual, import, api, auto_tracked
    
    # Relationships
    activities = relationship("ContactActivity", back_populates="contact")
    deals = relationship("CRMDeal", back_populates="contact")
    tasks = relationship("CRMTask", back_populates="contact")
    notes = relationship("CRMNote", back_populates="contact")
    emails = relationship("CRMEmail", back_populates="contact")
    meetings = relationship("CRMMeeting", back_populates="contact")

class CRMCompany(Base):
    __tablename__ = "crm_companies"
    
    id = Column(Integer, primary_key=True)
    
    # Basic Information
    name = Column(String(255), unique=True)
    domain = Column(String(255), unique=True, index=True)
    website = Column(String(500))
    phone = Column(String(50))
    email = Column(String(255))
    
    # Company Details
    industry = Column(String(100))
    sub_industry = Column(String(100))
    company_type = Column(String(50))  # B2B, B2C, Non-profit, etc.
    employee_count = Column(Integer)
    employee_range = Column(String(50))  # 1-10, 11-50, etc.
    annual_revenue = Column(Float)
    revenue_range = Column(String(50))
    
    # AI-Enriched Data (from APIs like Clearbit, etc.)
    description = Column(Text)
    founded_year = Column(Integer)
    headquarters = Column(String(255))
    logo_url = Column(String(500))
    social_profiles = Column(JSON)  # LinkedIn, Twitter, Facebook, etc.
    technologies_used = Column(JSON)  # Tech stack detection
    keywords = Column(JSON)  # SEO keywords, industry terms
    
    # Firmographics
    market_cap = Column(Float)
    funding_total = Column(Float)
    funding_rounds = Column(JSON)
    investors = Column(JSON)
    parent_company = Column(String(255))
    subsidiaries = Column(JSON)
    
    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    
    # Engagement
    account_status = Column(String(50))  # prospect, customer, churned
    customer_since = Column(DateTime)
    health_score = Column(Float)  # 0-100, AI-calculated
    churn_risk = Column(Float)  # 0-100, AI-predicted
    expansion_potential = Column(Float)  # 0-100, AI-predicted
    
    # Relationships
    contacts = relationship("CRMContact", secondary=contact_companies, back_populates="companies")
    activities = relationship("ContactActivity", back_populates="company")
    deals = relationship("CRMDeal", back_populates="company")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CRMPipeline(Base):
    __tablename__ = "crm_pipelines"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    description = Column(Text)
    is_default = Column(Boolean, default=False)
    team_id = Column(Integer, ForeignKey("teams.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Pipeline Configuration
    stages = relationship("CRMStage", back_populates="pipeline", order_by="CRMStage.order")
    automation_rules = Column(JSON)  # Stage transition rules
    
    created_at = Column(DateTime, default=datetime.utcnow)

class CRMStage(Base):
    __tablename__ = "crm_pipeline_stages"
    
    id = Column(Integer, primary_key=True)
    pipeline_id = Column(Integer, ForeignKey("crm_pipelines.id"))
    name = Column(String(100))
    order = Column(Integer)
    probability = Column(Integer)  # Default probability for this stage
    color = Column(String(20), default="#6B46C1")  # Stage color
    
    # Stage Configuration
    requirements = Column(JSON)  # Required fields/actions to move to this stage
    automations = Column(JSON)  # Actions to trigger on stage entry
    
    pipeline = relationship("CRMPipeline", back_populates="stages")
    deals = relationship("CRMDeal", back_populates="stage")

class CRMDeal(Base):
    __tablename__ = "crm_deals"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    
    # Deal Information
    amount = Column(Float)
    currency = Column(String(3), default='USD')
    probability = Column(Integer, default=10)  # 0-100%
    expected_close_date = Column(DateTime)
    actual_close_date = Column(DateTime)
    
    # Pipeline
    pipeline_id = Column(Integer, ForeignKey("crm_pipelines.id"))
    stage_id = Column(Integer, ForeignKey("crm_pipeline_stages.id"))
    stage_entered_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    contact_id = Column(Integer, ForeignKey("crm_contacts.id"))
    company_id = Column(Integer, ForeignKey("crm_companies.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    contact = relationship("CRMContact", back_populates="deals")
    company = relationship("CRMCompany", back_populates="deals")
    pipeline = relationship("CRMPipeline")
    stage = relationship("CRMStage", back_populates="deals")
    
    # AI Insights
    win_probability = Column(Float)  # AI-predicted
    risk_factors = Column(JSON)
    recommended_actions = Column(JSON)
    competitor_analysis = Column(JSON)
    
    # Deal Details
    deal_type = Column(String(50))  # new, renewal, upsell, cross-sell
    lead_source = Column(String(100))
    campaign_id = Column(Integer)
    
    # Products/Services
    products = Column(JSON)  # List of products/services with quantities and prices
    total_items = Column(Integer, default=0)
    discount_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    
    # Status
    status = Column(SQLEnum(DealStatus))  # open, won, lost
    lost_reason = Column(String(255))
    won_date = Column(DateTime)
    lost_date = Column(DateTime)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = Column(DateTime)
    next_activity = Column(DateTime)
    
    # Custom Fields
    custom_fields = Column(JSON, default=dict)
    tags = Column(JSON, default=[])
    
    # Relationships
    activities = relationship("DealActivity", back_populates="deal", order_by="DealActivity.created_at.desc()")
    documents = relationship("DealDocument", back_populates="deal")
    invoices = relationship("DealInvoice", back_populates="deal")
    quotes = relationship("DealQuote", back_populates="deal")

class DealActivity(Base):
    __tablename__ = "crm_deal_activities"
    
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("crm_deals.id"))
    type = Column(SQLEnum(ActivityType))
    title = Column(String)
    description = Column(Text)
    completed = Column(Boolean, default=False)
    scheduled_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    deal = relationship("CRMDeal", back_populates="activities")

class DealDocument(Base):
    __tablename__ = "crm_deal_documents"
    
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("crm_deals.id"))
    document_type = Column(String)  # contract, proposal, etc
    file_name = Column(String)
    file_path = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    deal = relationship("CRMDeal", back_populates="documents")

class DealInvoice(Base):
    __tablename__ = "crm_deal_invoices"
    
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("crm_deals.id"))
    invoice_number = Column(String)
    amount = Column(Float)
    status = Column(String)  # draft, sent, paid
    due_date = Column(DateTime)
    
    deal = relationship("CRMDeal", back_populates="invoices")

class DealQuote(Base):
    __tablename__ = "crm_deal_quotes"
    
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("crm_deals.id"))
    quote_number = Column(String)
    amount = Column(Float)
    valid_until = Column(DateTime)
    status = Column(String)  # draft, sent, accepted, rejected
    
    deal = relationship("CRMDeal", back_populates="quotes")

class CRMTag(Base):
    __tablename__ = "crm_tags"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)
    color = Column(String(7), default="#6B46C1")
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    contacts = relationship("CRMContact", secondary=contact_tags, back_populates="tags")

class CRMTask(Base):
    __tablename__ = "crm_tasks"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255))
    description = Column(Text)
    contact_id = Column(Integer, ForeignKey("crm_contacts.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"))
    due_date = Column(DateTime)
    completed = Column(Boolean, default=False)
    priority = Column(String(20), default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    contact = relationship("CRMContact", back_populates="tasks")

class CRMNote(Base):
    __tablename__ = "crm_notes"
    
    id = Column(Integer, primary_key=True)
    content = Column(Text)
    contact_id = Column(Integer, ForeignKey("crm_contacts.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    contact = relationship("CRMContact", back_populates="notes")

class CRMEmail(Base):
    __tablename__ = "crm_emails"
    
    id = Column(Integer, primary_key=True)
    subject = Column(String(500))
    content = Column(Text)
    contact_id = Column(Integer, ForeignKey("crm_contacts.id"))
    sent_by = Column(Integer, ForeignKey("users.id"))
    sent_at = Column(DateTime, default=datetime.utcnow)
    opened = Column(Boolean, default=False)
    clicked = Column(Boolean, default=False)
    
    contact = relationship("CRMContact", back_populates="emails")

class CRMMeeting(Base):
    __tablename__ = "crm_meetings"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255))
    description = Column(Text)
    contact_id = Column(Integer, ForeignKey("crm_contacts.id"))
    scheduled_by = Column(Integer, ForeignKey("users.id"))
    scheduled_at = Column(DateTime)
    duration = Column(Integer)  # minutes
    location = Column(String(500))
    meeting_url = Column(String(500))
    status = Column(String(20), default="scheduled")  # scheduled, completed, cancelled
    
    contact = relationship("CRMContact", back_populates="meetings")