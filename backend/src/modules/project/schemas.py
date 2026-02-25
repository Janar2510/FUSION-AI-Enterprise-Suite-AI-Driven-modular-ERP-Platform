from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

# Enums
class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ProjectType(str, Enum):
    SOFTWARE_DEVELOPMENT = "software_development"
    MARKETING_CAMPAIGN = "marketing_campaign"
    RESEARCH = "research"
    INFRASTRUCTURE = "infrastructure"
    PRODUCT_LAUNCH = "product_launch"
    OTHER = "other"

# Project Schemas
class ProjectBase(BaseModel):
    project_code: str
    name: str
    description: Optional[str] = None
    project_type: ProjectType
    status: ProjectStatus = ProjectStatus.PLANNING
    project_manager_id: Optional[int] = None
    client_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = None
    currency: str = "USD"
    tags: Optional[List[str]] = None
    project_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[ProjectType] = None
    status: Optional[ProjectStatus] = None
    project_manager_id: Optional[int] = None
    client_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    budget: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    currency: Optional[str] = None
    progress_percentage: Optional[Decimal] = None
    tags: Optional[List[str]] = None
    project_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    actual_cost: Optional[Decimal] = None
    progress_percentage: Optional[Decimal] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Task Schemas
class ProjectTaskBase(BaseModel):
    project_id: int
    task_code: str
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to_id: Optional[int] = None
    assigned_by_id: Optional[int] = None
    due_date: Optional[date] = None
    start_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = None
    depends_on_task_id: Optional[int] = None
    tags: Optional[List[str]] = None
    task_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectTaskCreate(ProjectTaskBase):
    pass

class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[date] = None
    start_date: Optional[date] = None
    completed_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None
    depends_on_task_id: Optional[int] = None
    tags: Optional[List[str]] = None
    task_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectTaskResponse(ProjectTaskBase):
    id: int
    completed_date: Optional[date] = None
    actual_hours: Optional[Decimal] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Milestone Schemas
class ProjectMilestoneBase(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    milestone_date: date
    tags: Optional[List[str]] = None
    milestone_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectMilestoneCreate(ProjectMilestoneBase):
    pass

class ProjectMilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    milestone_date: Optional[date] = None
    completed_date: Optional[date] = None
    is_completed: Optional[bool] = None
    tags: Optional[List[str]] = None
    milestone_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectMilestoneResponse(ProjectMilestoneBase):
    id: int
    completed_date: Optional[date] = None
    is_completed: bool = False
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Resource Schemas
class ProjectResourceBase(BaseModel):
    project_id: int
    resource_type: str
    resource_name: str
    description: Optional[str] = None
    allocated_quantity: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    tags: Optional[List[str]] = None
    resource_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectResourceCreate(ProjectResourceBase):
    pass

class ProjectResourceUpdate(BaseModel):
    resource_type: Optional[str] = None
    resource_name: Optional[str] = None
    description: Optional[str] = None
    allocated_quantity: Optional[Decimal] = None
    used_quantity: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    tags: Optional[List[str]] = None
    resource_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectResourceResponse(ProjectResourceBase):
    id: int
    used_quantity: Optional[Decimal] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Time Entry Schemas
class ProjectTimeEntryBase(BaseModel):
    project_id: int
    task_id: Optional[int] = None
    employee_id: int
    date: date
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_hours: Optional[Decimal] = None
    description: Optional[str] = None
    billable: bool = True
    hourly_rate: Optional[Decimal] = None
    tags: Optional[List[str]] = None
    time_entry_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectTimeEntryCreate(ProjectTimeEntryBase):
    pass

class ProjectTimeEntryUpdate(BaseModel):
    date: Optional[date] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_hours: Optional[Decimal] = None
    description: Optional[str] = None
    billable: Optional[bool] = None
    hourly_rate: Optional[Decimal] = None
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    is_approved: Optional[bool] = None
    tags: Optional[List[str]] = None
    time_entry_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProjectTimeEntryResponse(ProjectTimeEntryBase):
    id: int
    total_amount: Optional[Decimal] = None
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    is_approved: bool = False
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Comment Schemas
class ProjectCommentBase(BaseModel):
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    employee_id: int
    content: str
    comment_type: str = "comment"
    tags: Optional[List[str]] = None
    comment_metadata: Optional[Dict[str, Any]] = None

class ProjectCommentCreate(ProjectCommentBase):
    pass

class ProjectCommentResponse(ProjectCommentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Document Schemas
class ProjectDocumentBase(BaseModel):
    project_id: int
    task_id: Optional[int] = None
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[str] = None
    version: Optional[str] = None
    tags: Optional[List[str]] = None
    document_metadata: Optional[Dict[str, Any]] = None

class ProjectDocumentCreate(ProjectDocumentBase):
    pass

class ProjectDocumentResponse(ProjectDocumentBase):
    id: int
    file_hash: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Dashboard and Analytics Schemas
class ProjectDashboardMetrics(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    overdue_projects: int
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    total_budget: Decimal
    actual_cost: Decimal
    budget_utilization: Decimal
    avg_project_duration: int
    team_productivity: Decimal

class ProjectAnalytics(BaseModel):
    period_days: int
    projects_completed: int
    tasks_completed: int
    hours_logged: Decimal
    budget_variance: Decimal
    timeline_variance: Decimal
    resource_utilization: Decimal
    team_performance: Decimal
    client_satisfaction: Optional[Decimal] = None



