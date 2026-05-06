"""
Contact Hub Models for FusionAI Enterprise Suite
Universal contact management and tracking across all modules
"""

from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Float, Text, Boolean, ARRAY, UUID as SQLUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
from typing import Dict, List, Optional
from ...core.database import Base

class Contact(Base):
    """Unified contact model for all entity types"""
    __tablename__ = "contacts"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String(255), unique=True)  # For external system references
    type = Column(String(50), nullable=False)  # person, company, vendor, customer, employee
    
    # Basic information
    email = Column(String(255))
    phone = Column(String(50))
    mobile = Column(String(50))
    
    # Person fields
    first_name = Column(String(100))
    last_name = Column(String(100))
    full_name = Column(String(255))
    title = Column(String(100))
    
    # Company fields  
    company_name = Column(String(255))
    tax_id = Column(String(50))
    
    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(2))
    
    # Metadata
    tags = Column(ARRAY(String))  # Array of tags
    custom_fields = Column(JSON, default={})
    
    # Scoring and status
    engagement_score = Column(Float, default=0)
    lifecycle_stage = Column(String(50))  # lead, customer, partner, etc
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_activity_at = Column(DateTime)
    
    # Audit columns
    created_by = Column(SQLUUID)
    updated_by = Column(SQLUUID)
    
    # Relationships
    activities = relationship("Activity", back_populates="contact")
    app_profiles = relationship("AppProfile", back_populates="contact")
    source_relationships = relationship("Relationship", foreign_keys="Relationship.source_contact_id", back_populates="source_contact")
    target_relationships = relationship("Relationship", foreign_keys="Relationship.target_contact_id", back_populates="target_contact")

class Company(Base):
    """Company model for organization entities"""
    __tablename__ = "companies"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True)
    website = Column(String(500))
    phone = Column(String(50))
    email = Column(String(255))
    industry = Column(String(100))
    company_type = Column(String(50))  # B2B, B2C, Non-profit, etc.
    employee_count = Column(Integer)
    annual_revenue = Column(Float)
    description = Column(Text)
    founded_year = Column(Integer)
    headquarters = Column(String(255))
    logo_url = Column(String(500))
    social_profiles = Column(JSON)
    technologies_used = Column(JSON)
    keywords = Column(JSON)
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    account_status = Column(String(50))  # prospect, customer, churned
    customer_since = Column(DateTime)
    health_score = Column(Float)  # 0-100, AI-calculated
    churn_risk = Column(Float)  # 0-100, AI-predicted
    expansion_potential = Column(Float)  # 0-100, AI-predicted
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Audit columns
    created_by = Column(SQLUUID)
    updated_by = Column(SQLUUID)
    
    # Relationships
    activities = relationship("Activity", back_populates="company")
    contacts = relationship("Contact", back_populates="company")

class AppProfile(Base):
    """App-specific profile data for contacts"""
    __tablename__ = "app_profiles"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(PG_UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"))
    app_name = Column(String(50), nullable=False)
    profile_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Audit columns
    created_by = Column(SQLUUID)
    updated_by = Column(SQLUUID)
    
    # Relationships
    contact = relationship("Contact", back_populates="app_profiles")

class Activity(Base):
    """Unified activity stream for all contact interactions"""
    __tablename__ = "activities"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(PG_UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"))
    company_id = Column(PG_UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    app_name = Column(String(50), nullable=False)
    activity_type = Column(String(100), nullable=False)
    title = Column(String(255))
    description = Column(Text)
    metadata_json = Column(JSON)
    importance = Column(String(20), default="normal")  # low, normal, high, critical
    sentiment_score = Column(Float)  # -1 to 1
    engagement_score = Column(Float)  # 0 to 100
    intent_signals = Column(JSON)
    created_at = Column(DateTime, default=func.now())
    created_by = Column(String(255))
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(SQLUUID)
    
    # Relationships
    contact = relationship("Contact", back_populates="activities")
    company = relationship("Company", back_populates="activities")

class Relationship(Base):
    """Relationships between contacts"""
    __tablename__ = "relationships"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_contact_id = Column(PG_UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"))
    target_contact_id = Column(PG_UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"))
    relationship_type = Column(String(50))  # parent, subsidiary, employer, spouse, etc
    metadata_json = Column(JSON)
    created_at = Column(DateTime, default=func.now())
    
    # Audit columns
    created_by = Column(SQLUUID)
    updated_by = Column(SQLUUID)
    
    # Relationships
    source_contact = relationship("Contact", foreign_keys=[source_contact_id], back_populates="source_relationships")
    target_contact = relationship("Contact", foreign_keys=[target_contact_id], back_populates="target_relationships")
