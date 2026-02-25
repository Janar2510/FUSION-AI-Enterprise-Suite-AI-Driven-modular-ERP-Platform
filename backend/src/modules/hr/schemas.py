from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

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

# Employee Schemas
class EmployeeBase(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    
    # Address Information
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Employment Information
    position: str
    department: str
    manager_id: Optional[int] = None
    employment_type: EmploymentType
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    
    # Dates
    hire_date: date
    termination_date: Optional[date] = None
    probation_end_date: Optional[date] = None
    
    # Compensation
    salary: Optional[Decimal] = None
    hourly_rate: Optional[Decimal] = None
    currency: str = "USD"
    
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    
    # Additional Information
    notes: Optional[str] = None
    employee_metadata: Optional[Dict[str, Any]] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    
    # Address Information
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Employment Information
    position: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[int] = None
    employment_type: Optional[EmploymentType] = None
    status: Optional[EmployeeStatus] = None
    
    # Dates
    hire_date: Optional[date] = None
    termination_date: Optional[date] = None
    probation_end_date: Optional[date] = None
    
    # Compensation
    salary: Optional[Decimal] = None
    hourly_rate: Optional[Decimal] = None
    currency: Optional[str] = None
    
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    
    # Additional Information
    notes: Optional[str] = None
    employee_metadata: Optional[Dict[str, Any]] = None

class EmployeeResponse(EmployeeBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[int] = None
    budget: Optional[Decimal] = None
    cost_center: Optional[str] = None
    location: Optional[str] = None
    is_active: bool = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Payroll Schemas
class PayrollRecordBase(BaseModel):
    employee_id: int
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    
    # Earnings
    base_salary: Decimal
    overtime_hours: Decimal = Field(default=0.0, ge=0.0)
    overtime_rate: Decimal = Field(default=0.0, ge=0.0)
    overtime_amount: Decimal = Field(default=0.0, ge=0.0)
    bonus: Decimal = Field(default=0.0, ge=0.0)
    commission: Decimal = Field(default=0.0, ge=0.0)
    other_earnings: Decimal = Field(default=0.0, ge=0.0)
    
    # Deductions
    federal_tax: Decimal = Field(default=0.0, ge=0.0)
    state_tax: Decimal = Field(default=0.0, ge=0.0)
    social_security: Decimal = Field(default=0.0, ge=0.0)
    medicare: Decimal = Field(default=0.0, ge=0.0)
    health_insurance: Decimal = Field(default=0.0, ge=0.0)
    retirement_401k: Decimal = Field(default=0.0, ge=0.0)
    other_deductions: Decimal = Field(default=0.0, ge=0.0)
    
    # Additional Information
    notes: Optional[str] = None
    employee_metadata: Optional[Dict[str, Any]] = None

class PayrollRecordCreate(PayrollRecordBase):
    pass

class PayrollRecordResponse(PayrollRecordBase):
    id: int
    gross_pay: Decimal
    total_deductions: Decimal
    net_pay: Decimal
    status: PayrollStatus
    processed_at: Optional[datetime] = None
    processed_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Performance Review Schemas
class PerformanceReviewBase(BaseModel):
    employee_id: int
    reviewer_id: int
    review_period_start: date
    review_period_end: date
    review_date: date
    
    # Ratings
    overall_rating: PerformanceRating
    technical_skills_rating: PerformanceRating
    communication_rating: PerformanceRating
    teamwork_rating: PerformanceRating
    leadership_rating: PerformanceRating
    initiative_rating: PerformanceRating
    
    # Review Content
    goals_achieved: Optional[str] = None
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    development_plan: Optional[str] = None
    comments: Optional[str] = None
    
    # Additional Information
    next_review_date: Optional[date] = None
    salary_recommendation: Optional[Decimal] = None
    promotion_recommendation: bool = False

class PerformanceReviewCreate(PerformanceReviewBase):
    pass

class PerformanceReviewResponse(PerformanceReviewBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Leave Request Schemas
class LeaveRequestBase(BaseModel):
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: Decimal
    reason: str
    notes: Optional[str] = None
    employee_metadata: Optional[Dict[str, Any]] = None

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    status: LeaveStatus
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Time Entry Schemas
class TimeEntryBase(BaseModel):
    employee_id: int
    date: date
    start_time: datetime
    end_time: datetime
    break_duration: Decimal = Field(default=0.0, ge=0.0)
    project_name: Optional[str] = None
    activity_description: Optional[str] = None
    billable: bool = False
    hourly_rate: Optional[Decimal] = None
    notes: Optional[str] = None
    employee_metadata: Optional[Dict[str, Any]] = None

class TimeEntryCreate(TimeEntryBase):
    pass

class TimeEntryResponse(TimeEntryBase):
    id: int
    total_hours: Decimal
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Recruitment Schemas
class RecruitmentJobBase(BaseModel):
    job_title: str
    department_id: int
    description: str
    requirements: str
    responsibilities: str
    benefits: Optional[str] = None
    
    # Compensation
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    currency: str = "USD"
    
    # Status and Dates
    status: str = "open"
    posted_date: date
    application_deadline: Optional[date] = None
    
    # Additional Information
    location: Optional[str] = None
    employment_type: EmploymentType
    remote_allowed: bool = False

class RecruitmentJobCreate(RecruitmentJobBase):
    pass

class RecruitmentJobResponse(RecruitmentJobBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class JobApplicationBase(BaseModel):
    job_id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    notes: Optional[str] = None
    employee_metadata: Optional[Dict[str, Any]] = None

class JobApplicationCreate(JobApplicationBase):
    pass

class JobApplicationResponse(JobApplicationBase):
    id: int
    application_date: date
    status: str
    interview_date: Optional[date] = None
    interview_notes: Optional[str] = None
    evaluation_score: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Training Schemas
class TrainingProgramBase(BaseModel):
    name: str
    description: str
    duration_hours: Decimal
    cost: Optional[Decimal] = None
    currency: str = "USD"
    status: str = "active"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructor: Optional[str] = None
    location: Optional[str] = None
    max_participants: Optional[int] = None

class TrainingProgramCreate(TrainingProgramBase):
    pass

class TrainingProgramResponse(TrainingProgramBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TrainingEnrollmentBase(BaseModel):
    employee_id: int
    training_program_id: int
    enrollment_date: date
    notes: Optional[str] = None

class TrainingEnrollmentCreate(TrainingEnrollmentBase):
    pass

class TrainingEnrollmentResponse(TrainingEnrollmentBase):
    id: int
    completion_date: Optional[date] = None
    status: str
    grade: Optional[Decimal] = None
    feedback: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Analytics Schemas
class HRAnalytics(BaseModel):
    period_days: int
    total_employees: int
    active_employees: int
    new_hires: int
    terminations: int
    turnover_rate: float
    average_salary: float
    total_payroll_cost: float
    pending_leave_requests: int
    open_job_positions: int
    training_completion_rate: float
    performance_review_completion_rate: float

class PayrollAnalytics(BaseModel):
    period_days: int
    total_payroll_cost: float
    average_salary: float
    overtime_cost: float
    bonus_payments: float
    tax_deductions: float
    benefit_costs: float
    net_pay_distributed: float
    payroll_processing_time: float

class RecruitmentAnalytics(BaseModel):
    period_days: int
    open_positions: int
    applications_received: int
    interviews_conducted: int
    offers_made: int
    hires_completed: int
    time_to_hire: float
    cost_per_hire: float
    application_conversion_rate: float

# Filter Schemas
class EmployeeFilters(BaseModel):
    page: Optional[int] = Field(1, ge=1)
    limit: Optional[int] = Field(50, ge=1, le=100)
    department: Optional[str] = None
    position: Optional[str] = None
    status: Optional[EmployeeStatus] = None
    employment_type: Optional[EmploymentType] = None
    manager_id: Optional[int] = None
    search: Optional[str] = None

class PayrollFilters(BaseModel):
    page: Optional[int] = Field(1, ge=1)
    limit: Optional[int] = Field(50, ge=1, le=100)
    employee_id: Optional[int] = None
    department: Optional[str] = None
    pay_period_start: Optional[date] = None
    pay_period_end: Optional[date] = None
    status: Optional[PayrollStatus] = None

class LeaveRequestFilters(BaseModel):
    page: Optional[int] = Field(1, ge=1)
    limit: Optional[int] = Field(50, ge=1, le=100)
    employee_id: Optional[int] = None
    leave_type: Optional[LeaveType] = None
    status: Optional[LeaveStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
