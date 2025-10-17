from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, JSON, Numeric, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ...core.database import Base

class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"
    PROBATION = "probation"

class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"
    FREELANCE = "freelance"

class PayrollStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    PAID = "paid"
    CANCELLED = "cancelled"

class PerformanceRating(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    SATISFACTORY = "satisfactory"
    NEEDS_IMPROVEMENT = "needs_improvement"
    UNSATISFACTORY = "unsatisfactory"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class LeaveType(str, Enum):
    ANNUAL = "annual"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    BEREAVEMENT = "bereavement"
    UNPAID = "unpaid"

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True)
    
    # Personal Information
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    date_of_birth = Column(Date)
    gender = Column(String)
    marital_status = Column(String)
    
    # Address Information
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    postal_code = Column(String)
    
    # Employment Information
    position = Column(String, index=True)
    department = Column(String, index=True)
    manager_id = Column(Integer, ForeignKey("employees.id"))
    employment_type = Column(SQLEnum(EmploymentType))
    status = Column(SQLEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE)
    
    # Dates
    hire_date = Column(Date)
    termination_date = Column(Date)
    probation_end_date = Column(Date)
    
    # Compensation
    salary = Column(Numeric(15, 2))
    hourly_rate = Column(Numeric(10, 2))
    currency = Column(String, default="USD")
    
    # Additional Information
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    emergency_contact_relationship = Column(String)
    
    # System Fields
    notes = Column(Text)
    employee_metadata = Column(JSON)
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    manager = relationship("Employee", back_populates="subordinates", remote_side=[id])
    subordinates = relationship("Employee", back_populates="manager")
    payroll_records = relationship("PayrollRecord", back_populates="employee")
    performance_reviews = relationship("PerformanceReview", back_populates="employee", foreign_keys="PerformanceReview.employee_id")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="LeaveRequest.employee_id")
    time_entries = relationship("TimeEntry", back_populates="employee", foreign_keys="TimeEntry.employee_id")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    manager_id = Column(Integer, ForeignKey("employees.id"))
    budget = Column(Numeric(15, 2))
    cost_center = Column(String)
    
    # Additional Information
    location = Column(String)
    is_active = Column(Boolean, default=True)
    
    # System Fields
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    manager = relationship("Employee")

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    description = Column(Text)
    requirements = Column(Text)
    
    # Compensation
    min_salary = Column(Numeric(15, 2))
    max_salary = Column(Numeric(15, 2))
    currency = Column(String, default="USD")
    
    # Additional Information
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    department = relationship("Department")

class PayrollRecord(Base):
    __tablename__ = "payroll_records"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    # Payroll Period
    pay_period_start = Column(Date)
    pay_period_end = Column(Date)
    pay_date = Column(Date)
    
    # Earnings
    base_salary = Column(Numeric(15, 2))
    overtime_hours = Column(Numeric(8, 2), default=0.0)
    overtime_rate = Column(Numeric(10, 2), default=0.0)
    overtime_amount = Column(Numeric(15, 2), default=0.0)
    bonus = Column(Numeric(15, 2), default=0.0)
    commission = Column(Numeric(15, 2), default=0.0)
    other_earnings = Column(Numeric(15, 2), default=0.0)
    gross_pay = Column(Numeric(15, 2))
    
    # Deductions
    federal_tax = Column(Numeric(15, 2), default=0.0)
    state_tax = Column(Numeric(15, 2), default=0.0)
    social_security = Column(Numeric(15, 2), default=0.0)
    medicare = Column(Numeric(15, 2), default=0.0)
    health_insurance = Column(Numeric(15, 2), default=0.0)
    retirement_401k = Column(Numeric(15, 2), default=0.0)
    other_deductions = Column(Numeric(15, 2), default=0.0)
    total_deductions = Column(Numeric(15, 2))
    
    # Net Pay
    net_pay = Column(Numeric(15, 2))
    
    # Status and Processing
    status = Column(SQLEnum(PayrollStatus), default=PayrollStatus.PENDING)
    processed_at = Column(DateTime(timezone=True))
    processed_by = Column(Integer)  # User ID
    
    # Additional Information
    notes = Column(Text)
    employee_metadata = Column(JSON)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("Employee", back_populates="payroll_records")

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    reviewer_id = Column(Integer, ForeignKey("employees.id"))
    
    # Review Period
    review_period_start = Column(Date)
    review_period_end = Column(Date)
    review_date = Column(Date)
    
    # Ratings
    overall_rating = Column(SQLEnum(PerformanceRating))
    technical_skills_rating = Column(SQLEnum(PerformanceRating))
    communication_rating = Column(SQLEnum(PerformanceRating))
    teamwork_rating = Column(SQLEnum(PerformanceRating))
    leadership_rating = Column(SQLEnum(PerformanceRating))
    initiative_rating = Column(SQLEnum(PerformanceRating))
    
    # Review Content
    goals_achieved = Column(Text)
    strengths = Column(Text)
    areas_for_improvement = Column(Text)
    development_plan = Column(Text)
    comments = Column(Text)
    
    # Additional Information
    next_review_date = Column(Date)
    salary_recommendation = Column(Numeric(15, 2))
    promotion_recommendation = Column(Boolean, default=False)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("Employee", back_populates="performance_reviews", foreign_keys=[employee_id])
    reviewer = relationship("Employee", foreign_keys=[reviewer_id])

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    # Leave Details
    leave_type = Column(SQLEnum(LeaveType))
    start_date = Column(Date)
    end_date = Column(Date)
    total_days = Column(Numeric(5, 2))
    reason = Column(Text)
    
    # Status and Approval
    status = Column(SQLEnum(LeaveStatus), default=LeaveStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("employees.id"))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    
    # Additional Information
    notes = Column(Text)
    employee_metadata = Column(JSON)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("Employee", back_populates="leave_requests", foreign_keys=[employee_id])
    approver = relationship("Employee", foreign_keys=[approved_by])

class TimeEntry(Base):
    __tablename__ = "time_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    # Time Details
    date = Column(Date)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    break_duration = Column(Numeric(5, 2), default=0.0)  # in hours
    total_hours = Column(Numeric(5, 2))
    
    # Project/Activity
    project_name = Column(String)
    activity_description = Column(Text)
    billable = Column(Boolean, default=False)
    hourly_rate = Column(Numeric(10, 2))
    
    # Approval
    approved_by = Column(Integer, ForeignKey("employees.id"))
    approved_at = Column(DateTime(timezone=True))
    
    # Additional Information
    notes = Column(Text)
    employee_metadata = Column(JSON)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("Employee", back_populates="time_entries", foreign_keys=[employee_id])
    approver = relationship("Employee", foreign_keys=[approved_by])

class RecruitmentJob(Base):
    __tablename__ = "recruitment_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    # Job Details
    description = Column(Text)
    requirements = Column(Text)
    responsibilities = Column(Text)
    benefits = Column(Text)
    
    # Compensation
    salary_min = Column(Numeric(15, 2))
    salary_max = Column(Numeric(15, 2))
    currency = Column(String, default="USD")
    
    # Status and Dates
    status = Column(String, default="open")  # open, closed, on_hold
    posted_date = Column(Date)
    application_deadline = Column(Date)
    
    # Additional Information
    location = Column(String)
    employment_type = Column(SQLEnum(EmploymentType))
    remote_allowed = Column(Boolean, default=False)
    
    # System Fields
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    department = relationship("Department")
    applications = relationship("JobApplication", back_populates="job")

class JobApplication(Base):
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("recruitment_jobs.id"))
    
    # Applicant Information
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    phone = Column(String)
    
    # Application Details
    resume_url = Column(String)
    cover_letter = Column(Text)
    application_date = Column(Date)
    
    # Status and Evaluation
    status = Column(String, default="submitted")  # submitted, reviewed, interviewed, offered, rejected, hired
    interview_date = Column(Date)
    interview_notes = Column(Text)
    evaluation_score = Column(Numeric(5, 2))
    
    # Additional Information
    notes = Column(Text)
    employee_metadata = Column(JSON)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    job = relationship("RecruitmentJob", back_populates="applications")

class TrainingProgram(Base):
    __tablename__ = "training_programs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    
    # Program Details
    duration_hours = Column(Numeric(5, 2))
    cost = Column(Numeric(15, 2))
    currency = Column(String, default="USD")
    
    # Status and Dates
    status = Column(String, default="active")  # active, inactive, completed
    start_date = Column(Date)
    end_date = Column(Date)
    
    # Additional Information
    instructor = Column(String)
    location = Column(String)
    max_participants = Column(Integer)
    
    # System Fields
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class TrainingEnrollment(Base):
    __tablename__ = "training_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    training_program_id = Column(Integer, ForeignKey("training_programs.id"))
    
    # Enrollment Details
    enrollment_date = Column(Date)
    completion_date = Column(Date)
    status = Column(String, default="enrolled")  # enrolled, in_progress, completed, dropped
    
    # Evaluation
    grade = Column(Numeric(5, 2))
    feedback = Column(Text)
    
    # Additional Information
    notes = Column(Text)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("Employee")
    training_program = relationship("TrainingProgram")
