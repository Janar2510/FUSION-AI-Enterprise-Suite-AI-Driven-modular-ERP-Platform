from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, JSON, Numeric, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from enum import Enum
from ...core.database import Base

class HrApplicant(Base):
    """Job applicants"""
    __tablename__ = "hr_applicants"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Applicant details
    partner_name = Column(String(255), nullable=False)
    email_from = Column(String(255), nullable=False)
    partner_phone = Column(String(50), nullable=True)
    linkedin_profile = Column(String(255), nullable=True)
    type_id = Column(String(100), nullable=True)  # Degree/Type
    
    # Job/Department Mapping
    job_id = Column(Integer, ForeignKey("hr_jobs.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("hr_departments.id"), nullable=True)
    
    # Pipeline & State
    stage_id = Column(String(100), default="Initial Qualification") 
    kanban_state = Column(String(50), default="normal") # normal, done, blocked, waiting
    refuse_reason_id = Column(String(100), nullable=True)
    
    # Availability & Output
    availability = Column(Date, nullable=True)
    salary_expected = Column(Float, default=0.0)
    salary_proposed = Column(Float, default=0.0)
    
    # internal relations
    user_id = Column(Integer, ForeignKey("hr_users_mock.id"), nullable=True) # Recruiter
    employee_id = Column(Integer, ForeignKey("hr_employees.id"), nullable=True) # The created employee
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    job = relationship("HrJob", foreign_keys=[job_id])
    department = relationship("HrDepartment", foreign_keys=[department_id])
    user = relationship("User", foreign_keys=[user_id])
    employee = relationship("HrEmployee", foreign_keys=[employee_id])
