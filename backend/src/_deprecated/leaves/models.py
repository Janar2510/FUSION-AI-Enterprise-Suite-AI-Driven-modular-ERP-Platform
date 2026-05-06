from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, JSON, Numeric, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ...core.database import Base

class LeaveState(str, Enum):
    DRAFT = "draft"
    CONFIRM = "confirm"
    VALIDATE1 = "validate1"
    VALIDATE = "validate"
    REFUSE = "refuse"
    CANCEL = "cancel"

class HrLeave(Base):
    """Employee time off / leaves"""
    __tablename__ = "hr_leaves"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True) # Description / Reason
    state = Column(SQLEnum(LeaveState), default=LeaveState.DRAFT)
    
    # Relations
    employee_id = Column(Integer, ForeignKey("hr_employees.id"), nullable=False)
    holiday_status_id = Column(String(50), nullable=False) # Simplified mapping
    
    # Dates
    date_from = Column(DateTime(timezone=True), nullable=False)
    date_to = Column(DateTime(timezone=True), nullable=False)
    request_date_from = Column(Date, nullable=True)
    request_date_to = Column(Date, nullable=True)
    
    # Duration
    number_of_days = Column(Float, default=0.0)
    number_of_hours = Column(Float, default=0.0)
    request_unit_half = Column(Boolean, default=False)
    request_unit_hours = Column(Boolean, default=False)
    
    # Notes 
    notes = Column(Text, nullable=True)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("HrEmployee", foreign_keys=[employee_id])
