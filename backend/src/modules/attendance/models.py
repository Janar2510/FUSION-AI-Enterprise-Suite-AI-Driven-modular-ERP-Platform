from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, JSON, Numeric, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from enum import Enum
from ...core.database import Base

class HrAttendance(Base):
    """Employee attendance records"""
    __tablename__ = "hr_attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("hr_employees.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("hr_departments.id"), nullable=True)
    
    # Time Tracking
    check_in = Column(DateTime(timezone=True), nullable=False)
    check_out = Column(DateTime(timezone=True), nullable=True)
    worked_hours = Column(Float, default=0.0)
    expected_hours = Column(Float, default=8.0)
    
    # Geo Tracking & Devices
    in_mode = Column(String(50), default="manual")
    out_mode = Column(String(50), default="manual")
    in_latitude = Column(Float, nullable=True)
    in_longitude = Column(Float, nullable=True)
    out_latitude = Column(Float, nullable=True)
    out_longitude = Column(Float, nullable=True)
    in_ip_address = Column(String(50), nullable=True)
    out_ip_address = Column(String(50), nullable=True)
    in_browser = Column(String(255), nullable=True)
    out_browser = Column(String(255), nullable=True)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("HrEmployee", foreign_keys=[employee_id])
    department = relationship("HrDepartment", foreign_keys=[department_id])
