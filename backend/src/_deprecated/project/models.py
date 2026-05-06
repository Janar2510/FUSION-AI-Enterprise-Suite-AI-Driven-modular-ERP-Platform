from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Boolean, ForeignKey, Numeric, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date
from decimal import Decimal
import enum

from ...core.database import Base

class ProjectStatus(enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskStatus(enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ProjectType(enum.Enum):
    SOFTWARE_DEVELOPMENT = "software_development"
    MARKETING_CAMPAIGN = "marketing_campaign"
    RESEARCH = "research"
    INFRASTRUCTURE = "infrastructure"
    PRODUCT_LAUNCH = "product_launch"
    OTHER = "other"

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    project_type = Column(SQLEnum(ProjectType))
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.PLANNING)
    
    # Project Management
    project_manager_id = Column(Integer, ForeignKey("employees.id"))
    client_id = Column(Integer, ForeignKey("crm_contacts.id"))
    
    # Timeline
    start_date = Column(Date)
    end_date = Column(Date)
    actual_start_date = Column(Date)
    actual_end_date = Column(Date)
    
    # Budget
    budget = Column(Numeric(15, 2))
    actual_cost = Column(Numeric(15, 2))
    currency = Column(String, default="USD")
    
    # Progress
    progress_percentage = Column(Numeric(5, 2), default=0.0)
    
    # Additional Information
    tags = Column(JSON)
    project_metadata = Column(JSON)
    notes = Column(Text)
    
    # System Fields
    created_by = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project_manager = relationship("Employee", foreign_keys=[project_manager_id])
    client = relationship("CRMContact")
    tasks = relationship("ProjectTask", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("ProjectMilestone", back_populates="project", cascade="all, delete-orphan")
    resources = relationship("ProjectResource", back_populates="project", cascade="all, delete-orphan")
    time_entries = relationship("ProjectTimeEntry", back_populates="project", cascade="all, delete-orphan")

class ProjectTask(Base):
    __tablename__ = "project_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    task_code = Column(String, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM)
    
    # Assignment
    assigned_to_id = Column(Integer, ForeignKey("employees.id"))
    assigned_by_id = Column(Integer, ForeignKey("employees.id"))
    
    # Timeline
    due_date = Column(Date)
    start_date = Column(Date)
    completed_date = Column(Date)
    
    # Effort Estimation
    estimated_hours = Column(Numeric(8, 2))
    actual_hours = Column(Numeric(8, 2))
    
    # Dependencies
    depends_on_task_id = Column(Integer, ForeignKey("project_tasks.id"))
    
    # Additional Information
    tags = Column(JSON)
    task_metadata = Column(JSON)
    notes = Column(Text)
    
    # System Fields
    created_by = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assigned_to = relationship("Employee", foreign_keys=[assigned_to_id])
    assigned_by = relationship("Employee", foreign_keys=[assigned_by_id])
    depends_on = relationship("ProjectTask", remote_side=[id])
    time_entries = relationship("ProjectTimeEntry", back_populates="task", cascade="all, delete-orphan")
    comments = relationship("ProjectComment", back_populates="task", cascade="all, delete-orphan")

class ProjectMilestone(Base):
    __tablename__ = "project_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, index=True)
    description = Column(Text)
    milestone_date = Column(Date)
    completed_date = Column(Date)
    is_completed = Column(Boolean, default=False)
    
    # Additional Information
    tags = Column(JSON)
    milestone_metadata = Column(JSON)
    notes = Column(Text)
    
    # System Fields
    created_by = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="milestones")

class ProjectResource(Base):
    __tablename__ = "project_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    resource_type = Column(String)  # human, equipment, material, etc.
    resource_name = Column(String, index=True)
    description = Column(Text)
    
    # Allocation
    allocated_quantity = Column(Numeric(10, 2))
    used_quantity = Column(Numeric(10, 2))
    unit_cost = Column(Numeric(10, 2))
    
    # Timeline
    start_date = Column(Date)
    end_date = Column(Date)
    
    # Additional Information
    tags = Column(JSON)
    resource_metadata = Column(JSON)
    notes = Column(Text)
    
    # System Fields
    created_by = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="resources")

class ProjectTimeEntry(Base):
    __tablename__ = "project_time_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    task_id = Column(Integer, ForeignKey("project_tasks.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    # Time Tracking
    date = Column(Date)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration_hours = Column(Numeric(8, 2))
    description = Column(Text)
    
    # Billing
    billable = Column(Boolean, default=True)
    hourly_rate = Column(Numeric(10, 2))
    total_amount = Column(Numeric(15, 2))
    
    # Approval
    approved_by_id = Column(Integer, ForeignKey("employees.id"))
    approved_at = Column(DateTime)
    is_approved = Column(Boolean, default=False)
    
    # Additional Information
    tags = Column(JSON)
    time_entry_metadata = Column(JSON)
    notes = Column(Text)
    
    # System Fields
    created_by = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="time_entries")
    task = relationship("ProjectTask", back_populates="time_entries")
    employee = relationship("Employee", foreign_keys=[employee_id])
    approved_by = relationship("Employee", foreign_keys=[approved_by_id])

class ProjectComment(Base):
    __tablename__ = "project_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    task_id = Column(Integer, ForeignKey("project_tasks.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    # Comment Content
    content = Column(Text)
    comment_type = Column(String)  # comment, update, question, etc.
    
    # Additional Information
    tags = Column(JSON)
    comment_metadata = Column(JSON)
    
    # System Fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project")
    task = relationship("ProjectTask", back_populates="comments")
    employee = relationship("Employee")

class ProjectDocument(Base):
    __tablename__ = "project_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    task_id = Column(Integer, ForeignKey("project_tasks.id"))
    
    # Document Information
    filename = Column(String, index=True)
    original_filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String)
    file_hash = Column(String)
    
    # Document Metadata
    title = Column(String)
    description = Column(Text)
    document_type = Column(String)  # specification, design, report, etc.
    version = Column(String)
    
    # Additional Information
    tags = Column(JSON)
    document_metadata = Column(JSON)
    
    # System Fields
    uploaded_by = Column(Integer, ForeignKey("employees.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project")
    task = relationship("ProjectTask")
    uploaded_by_user = relationship("Employee")



