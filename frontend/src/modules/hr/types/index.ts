// HR Module Types
export interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  position?: string;
  department?: string;
  manager_id?: number;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  hire_date?: string;
  termination_date?: string;
  probation_end_date?: string;
  salary?: number;
  hourly_rate?: number;
  currency: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  notes?: string;
  employee_metadata?: Record<string, any>;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager_id?: number;
  budget?: number;
  cost_center?: string;
  location?: string;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface PayrollRecord {
  id: number;
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  base_salary: number;
  overtime_hours?: number;
  overtime_rate?: number;
  overtime_amount?: number;
  bonus?: number;
  commission?: number;
  other_earnings?: number;
  gross_pay: number;
  federal_tax?: number;
  state_tax?: number;
  social_security?: number;
  medicare?: number;
  health_insurance?: number;
  retirement_401k?: number;
  other_deductions?: number;
  total_deductions: number;
  net_pay: number;
  status: PayrollStatus;
  processed_at?: string;
  processed_by?: number;
  notes?: string;
  employee_metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface PerformanceReview {
  id: number;
  employee_id: number;
  reviewer_id: number;
  review_period_start: string;
  review_period_end: string;
  review_date: string;
  overall_rating: PerformanceRating;
  technical_skills_rating: PerformanceRating;
  communication_rating: PerformanceRating;
  teamwork_rating: PerformanceRating;
  leadership_rating: PerformanceRating;
  initiative_rating: PerformanceRating;
  goals_achieved?: string;
  strengths?: string;
  areas_for_improvement?: string;
  development_plan?: string;
  comments?: string;
  next_review_date?: string;
  salary_recommendation?: number;
  promotion_recommendation?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: LeaveStatus;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  employee_metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface TimeEntry {
  id: number;
  employee_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  break_duration?: number;
  total_hours?: number;
  project_name?: string;
  activity_description?: string;
  billable: boolean;
  hourly_rate?: number;
  approved_by?: number;
  approved_at?: string;
  notes?: string;
  employee_metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface RecruitmentJob {
  id: number;
  job_title: string;
  department_id?: number;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  status: string;
  posted_date?: string;
  application_deadline?: string;
  location?: string;
  employment_type: EmploymentType;
  remote_allowed: boolean;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
  application_date: string;
  status: string;
  interview_date?: string;
  interview_notes?: string;
  evaluation_score?: number;
  notes?: string;
  employee_metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface TrainingProgram {
  id: number;
  name: string;
  description?: string;
  duration_hours?: number;
  cost?: number;
  currency: string;
  status: string;
  start_date?: string;
  end_date?: string;
  instructor?: string;
  location?: string;
  max_participants?: number;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface TrainingEnrollment {
  id: number;
  employee_id: number;
  training_program_id: number;
  enrollment_date: string;
  completion_date?: string;
  status: string;
  grade?: number;
  feedback?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Enums
export enum EmployeeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  TERMINATED = "terminated",
  ON_LEAVE = "on_leave",
  PROBATION = "probation"
}

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
  INTERN = "intern",
  FREELANCE = "freelance"
}

export enum PayrollStatus {
  PENDING = "pending",
  PROCESSED = "processed",
  PAID = "paid",
  CANCELLED = "cancelled"
}

export enum PerformanceRating {
  EXCELLENT = "excellent",
  GOOD = "good",
  SATISFACTORY = "satisfactory",
  NEEDS_IMPROVEMENT = "needs_improvement",
  UNSATISFACTORY = "unsatisfactory"
}

export enum LeaveStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled"
}

export enum LeaveType {
  ANNUAL = "annual",
  SICK = "sick",
  PERSONAL = "personal",
  MATERNITY = "maternity",
  PATERNITY = "paternity",
  BEREAVEMENT = "bereavement",
  UNPAID = "unpaid"
}

// Dashboard and Analytics Types
export interface HRDashboardMetrics {
  analytics: HRAnalytics;
  recent_employees: Employee[];
  recent_leave_requests: LeaveRequest[];
  recent_payroll_records: PayrollRecord[];
  timestamp: string;
}

export interface HRAnalytics {
  period_days: number;
  total_employees: number;
  active_employees: number;
  new_hires: number;
  terminations: number;
  turnover_rate: number;
  average_salary: number;
  total_payroll_cost: number;
  pending_leave_requests: number;
  open_job_positions: number;
  training_completion_rate: number;
  performance_review_completion_rate: number;
}

// Form Types
export interface EmployeeCreate {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  position?: string;
  department?: string;
  manager_id?: number;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  hire_date?: string;
  probation_end_date?: string;
  salary?: number;
  hourly_rate?: number;
  currency: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  notes?: string;
  employee_metadata?: Record<string, any>;
}

export interface EmployeeUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  position?: string;
  department?: string;
  manager_id?: number;
  employment_type?: EmploymentType;
  status?: EmployeeStatus;
  hire_date?: string;
  termination_date?: string;
  probation_end_date?: string;
  salary?: number;
  hourly_rate?: number;
  currency?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  notes?: string;
  employee_metadata?: Record<string, any>;
}

export interface LeaveRequestCreate {
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  notes?: string;
  employee_metadata?: Record<string, any>;
}

export interface PayrollRecordCreate {
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  base_salary: number;
  overtime_hours?: number;
  overtime_rate?: number;
  overtime_amount?: number;
  bonus?: number;
  commission?: number;
  other_earnings?: number;
  gross_pay: number;
  federal_tax?: number;
  state_tax?: number;
  social_security?: number;
  medicare?: number;
  health_insurance?: number;
  retirement_401k?: number;
  other_deductions?: number;
  total_deductions: number;
  net_pay: number;
  notes?: string;
  employee_metadata?: Record<string, any>;
}



