// Project Module Types

export enum ProjectStatus {
  PLANNING = "planning",
  ACTIVE = "active",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export enum ProjectType {
  SOFTWARE_DEVELOPMENT = "software_development",
  MARKETING_CAMPAIGN = "marketing_campaign",
  RESEARCH = "research",
  INFRASTRUCTURE = "infrastructure",
  PRODUCT_LAUNCH = "product_launch",
  OTHER = "other"
}

export interface Project {
  id: number;
  project_code: string;
  name: string;
  description?: string;
  project_type: ProjectType;
  status: ProjectStatus;
  project_manager_id?: number;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  budget?: number;
  actual_cost?: number;
  currency: string;
  progress_percentage?: number;
  tags?: string[];
  project_metadata?: Record<string, any>;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  task_code: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_id?: number;
  assigned_by_id?: number;
  due_date?: string;
  start_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  depends_on_task_id?: number;
  tags?: string[];
  task_metadata?: Record<string, any>;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectMilestone {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  milestone_date: string;
  completed_date?: string;
  is_completed: boolean;
  tags?: string[];
  milestone_metadata?: Record<string, any>;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectResource {
  id: number;
  project_id: number;
  resource_type: string;
  resource_name: string;
  description?: string;
  allocated_quantity?: number;
  used_quantity?: number;
  unit_cost?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  resource_metadata?: Record<string, any>;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectTimeEntry {
  id: number;
  project_id: number;
  task_id?: number;
  employee_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_hours?: number;
  description?: string;
  billable: boolean;
  hourly_rate?: number;
  total_amount?: number;
  approved_by_id?: number;
  approved_at?: string;
  is_approved: boolean;
  tags?: string[];
  time_entry_metadata?: Record<string, any>;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectComment {
  id: number;
  project_id?: number;
  task_id?: number;
  employee_id: number;
  content: string;
  comment_type: string;
  tags?: string[];
  comment_metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface ProjectDocument {
  id: number;
  project_id: number;
  task_id?: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_hash?: string;
  title?: string;
  description?: string;
  document_type?: string;
  version?: string;
  tags?: string[];
  document_metadata?: Record<string, any>;
  uploaded_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectDashboardMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  overdue_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_budget: number;
  actual_cost: number;
  budget_utilization: number;
  avg_project_duration: number;
  team_productivity: number;
}

export interface ProjectAnalytics {
  period_days: number;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_tasks: number;
  completed_tasks: number;
  total_budget: number;
  actual_cost: number;
  hours_logged: number;
  budget_utilization: number;
  projects_completed: number;
  tasks_completed: number;
  budget_variance: number;
  timeline_variance: number;
  resource_utilization: number;
  team_performance: number;
  client_satisfaction?: number;
}

export interface ProjectCreateRequest {
  project_code: string;
  name: string;
  description?: string;
  project_type: ProjectType;
  status?: ProjectStatus;
  project_manager_id?: number;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  tags?: string[];
  project_metadata?: Record<string, any>;
  notes?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  project_manager_id?: number;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  budget?: number;
  actual_cost?: number;
  currency?: string;
  progress_percentage?: number;
  tags?: string[];
  project_metadata?: Record<string, any>;
  notes?: string;
}

export interface ProjectTaskCreateRequest {
  project_id: number;
  task_code: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to_id?: number;
  assigned_by_id?: number;
  due_date?: string;
  start_date?: string;
  estimated_hours?: number;
  depends_on_task_id?: number;
  tags?: string[];
  task_metadata?: Record<string, any>;
  notes?: string;
}

export interface ProjectTaskUpdateRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to_id?: number;
  due_date?: string;
  start_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  depends_on_task_id?: number;
  tags?: string[];
  task_metadata?: Record<string, any>;
  notes?: string;
}

export interface ProjectTimeEntryCreateRequest {
  project_id: number;
  task_id?: number;
  employee_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_hours?: number;
  description?: string;
  billable?: boolean;
  hourly_rate?: number;
  tags?: string[];
  time_entry_metadata?: Record<string, any>;
  notes?: string;
}

export interface ProjectTimeEntryUpdateRequest {
  date?: string;
  start_time?: string;
  end_time?: string;
  duration_hours?: number;
  description?: string;
  billable?: boolean;
  hourly_rate?: number;
  approved_by_id?: number;
  approved_at?: string;
  is_approved?: boolean;
  tags?: string[];
  time_entry_metadata?: Record<string, any>;
  notes?: string;
}



