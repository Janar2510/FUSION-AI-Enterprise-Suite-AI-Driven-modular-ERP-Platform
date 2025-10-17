export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  company?: string;
  job_title?: string;
  department?: string;
  industry?: string;
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  contact_type: ContactType;
  lead_source?: string;
  lead_score: number;
  status: LeadStatus;
  ai_insights: Record<string, any>;
  predicted_value?: number;
  churn_risk?: number;
  next_best_action?: string;
  custom_fields: Record<string, any>;
  tags: string[];
  social_media: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
  assigned_to?: number;
}

export interface Opportunity {
  id: number;
  contact_id: number;
  name: string;
  description?: string;
  stage: OpportunityStage;
  estimated_value?: number;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  win_probability?: number;
  predicted_close_date?: string;
  recommended_actions: string[];
  custom_fields: Record<string, any>;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
  assigned_to?: number;
}

export interface Interaction {
  id: number;
  contact_id: number;
  opportunity_id?: number;
  interaction_type: InteractionType;
  subject: string;
  description?: string;
  outcome?: string;
  interaction_date: string;
  duration_minutes?: number;
  follow_up_date?: string;
  sentiment: {
    score?: number;
    label?: string;
  };
  key_topics: string[];
  action_items: string[];
  custom_fields: Record<string, any>;
  tags: string[];
  is_important: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
}

export interface CRMAnalytics {
  total_contacts: number;
  total_opportunities: number;
  total_interactions: number;
  lead_conversion_rate: number;
  opportunity_win_rate: number;
  average_deal_size: number;
  sales_pipeline_value: number;
  top_lead_sources: Array<{
    source: string;
    count: number;
  }>;
  stage_distribution: Record<string, number>;
  monthly_trends: Array<{
    month: string;
    contacts: number;
    opportunities: number;
  }>;
  ai_insights: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
  }>;
}

export interface SalesPipeline {
  [stage: string]: {
    count: number;
    total_value: number;
    average_deal_size: number;
    opportunities: Opportunity[];
  };
}

export interface CRMDashboard {
  recent_contacts: Contact[];
  recent_opportunities: Opportunity[];
  recent_interactions: Interaction[];
  upcoming_follow_ups: Interaction[];
  high_value_opportunities: Opportunity[];
  summary: {
    total_contacts: number;
    total_opportunities: number;
    total_interactions: number;
    pending_follow_ups: number;
  };
}

export interface ContactCreateRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  company?: string;
  job_title?: string;
  department?: string;
  industry?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_type: ContactType;
  lead_source?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  facebook_url?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  assigned_to?: number;
}

export interface ContactUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  job_title?: string;
  department?: string;
  industry?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_type?: ContactType;
  lead_source?: string;
  status?: LeadStatus;
  linkedin_url?: string;
  twitter_handle?: string;
  facebook_url?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  assigned_to?: number;
  is_active?: boolean;
}

export interface OpportunityCreateRequest {
  contact_id: number;
  name: string;
  description?: string;
  stage: OpportunityStage;
  estimated_value?: number;
  probability: number;
  expected_close_date?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  assigned_to?: number;
}

export interface OpportunityUpdateRequest {
  name?: string;
  description?: string;
  stage?: OpportunityStage;
  estimated_value?: number;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  assigned_to?: number;
  is_active?: boolean;
}

export interface InteractionCreateRequest {
  contact_id: number;
  opportunity_id?: number;
  interaction_type: InteractionType;
  subject: string;
  description?: string;
  outcome?: string;
  interaction_date: string;
  duration_minutes?: number;
  follow_up_date?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  is_important: boolean;
}

export interface InteractionUpdateRequest {
  subject?: string;
  description?: string;
  outcome?: string;
  interaction_date?: string;
  duration_minutes?: number;
  follow_up_date?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  is_important?: boolean;
}

export interface CRMFilter {
  contact_type?: ContactType;
  status?: LeadStatus;
  stage?: OpportunityStage;
  interaction_type?: InteractionType;
  assigned_to?: number;
  created_after?: string;
  created_before?: string;
  tags?: string[];
  search_query?: string;
}

export interface CRMInsights {
  contact_analysis: Record<string, any>;
  opportunities_insights: Array<{
    opportunity_id: number;
    insights: Record<string, any>;
  }>;
  interaction_patterns: Record<string, any>;
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
  }>;
  generated_at: string;
}

export interface LeadScore {
  score: number;
  max_score: number;
  score_breakdown: Record<string, number>;
  insights: Record<string, any>;
  recommendations: string[];
}

export interface AIAnalysisRequest {
  analysis_type: 'contacts' | 'opportunities' | 'interactions';
  filters?: Record<string, any>;
}

export interface AIAnalysisResponse {
  total_analyzed: number;
  insights: Record<string, any>;
  generated_at: string;
}

// Enums
export type ContactType = 'lead' | 'customer' | 'prospect' | 'partner' | 'vendor';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type OpportunityStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type InteractionType = 'email' | 'phone' | 'meeting' | 'demo' | 'proposal' | 'follow_up' | 'support';

// UI State Types
export interface CRMState {
  contacts: Contact[];
  opportunities: Opportunity[];
  interactions: Interaction[];
  analytics: CRMAnalytics | null;
  dashboard: CRMDashboard | null;
  pipeline: SalesPipeline | null;
  selectedContact: Contact | null;
  selectedOpportunity: Opportunity | null;
  selectedInteraction: Interaction | null;
  filters: CRMFilter;
  loading: {
    contacts: boolean;
    opportunities: boolean;
    interactions: boolean;
    analytics: boolean;
    dashboard: boolean;
  };
  error: string | null;
}

export interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  company: string;
  job_title: string;
  department: string;
  industry: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  contact_type: ContactType;
  lead_source: string;
  linkedin_url: string;
  twitter_handle: string;
  facebook_url: string;
  tags: string[];
  assigned_to: number | null;
}

export interface OpportunityFormData {
  contact_id: number;
  name: string;
  description: string;
  stage: OpportunityStage;
  estimated_value: number;
  probability: number;
  expected_close_date: string;
  tags: string[];
  assigned_to: number | null;
}

export interface InteractionFormData {
  contact_id: number;
  opportunity_id: number | null;
  interaction_type: InteractionType;
  subject: string;
  description: string;
  outcome: string;
  interaction_date: string;
  duration_minutes: number;
  follow_up_date: string;
  is_important: boolean;
  tags: string[];
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface PipelineChartData {
  stages: string[];
  values: number[];
  counts: number[];
  colors: string[];
}

export interface TrendChartData {
  months: string[];
  contacts: number[];
  opportunities: number[];
  interactions: number[];
}

// Table Types
export interface ContactTableRow {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  lead_score: number;
  last_interaction: string;
  assigned_to: string;
  actions: string[];
}

export interface OpportunityTableRow {
  id: number;
  name: string;
  contact: string;
  stage: OpportunityStage;
  value: number;
  probability: number;
  close_date: string;
  win_probability: number;
  assigned_to: string;
  actions: string[];
}

export interface InteractionTableRow {
  id: number;
  subject: string;
  contact: string;
  opportunity: string;
  type: InteractionType;
  date: string;
  sentiment: string;
  outcome: string;
  actions: string[];
}

// Search and Filter Types
export interface SearchFilters {
  query: string;
  contact_type: ContactType[];
  status: LeadStatus[];
  stage: OpportunityStage[];
  interaction_type: InteractionType[];
  assigned_to: number[];
  date_range: {
    start: string;
    end: string;
  };
  tags: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Notification Types
export interface CRMNotification {
  id: string;
  type: 'contact' | 'opportunity' | 'interaction' | 'follow_up' | 'ai_insight';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  action_url?: string;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters: CRMFilter;
  date_range: {
    start: string;
    end: string;
  };
}

export interface ExportResult {
  download_url: string;
  filename: string;
  size: number;
  expires_at: string;
}




