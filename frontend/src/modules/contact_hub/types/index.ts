// Contact Hub Types

export interface Contact {
  id: string;
  external_id?: string;
  type: ContactType;
  email?: string;
  phone?: string;
  mobile?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  title?: string;
  company_name?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  lifecycle_stage?: LifecycleStage;
  engagement_score: number;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  email?: string;
  industry?: string;
  company_type?: string;
  employee_count?: number;
  annual_revenue?: number;
  description?: string;
  founded_year?: number;
  headquarters?: string;
  logo_url?: string;
  social_profiles: Record<string, any>;
  technologies_used: string[];
  keywords: string[];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  account_status?: string;
  customer_since?: string;
  health_score?: number;
  churn_risk?: number;
  expansion_potential?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AppProfile {
  id: string;
  contact_id: string;
  app_name: string;
  profile_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Activity {
  id: string;
  contact_id?: string;
  company_id?: string;
  app_name: string;
  activity_type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  importance: ImportanceLevel;
  sentiment_score?: number;
  engagement_score?: number;
  intent_signals: Record<string, any>;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}

export interface Relationship {
  id: string;
  source_contact_id: string;
  target_contact_id: string;
  relationship_type: string;
  metadata: Record<string, any>;
  created_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface TimelineEvent {
  id: string;
  activity_type: string;
  app_name: string;
  title: string;
  description?: string;
  created_at: string;
  sentiment_score?: number;
  engagement_score?: number;
  metadata?: Record<string, any>;
}

export interface ContactTimelineResponse {
  contact_id: string;
  events: TimelineEvent[];
  count: number;
}

export interface CrossModuleInsights {
  total_interactions: number;
  modules_used: string[];
  last_activity?: string;
  engagement_trend: number;
  lifetime_value: number;
  churn_risk: number;
  next_best_action: Record<string, any>;
}

export interface SearchResponse {
  results: Contact[];
  count: number;
  query: string;
}

export enum ContactType {
  PERSON = "person",
  COMPANY = "company",
  VENDOR = "vendor",
  CUSTOMER = "customer",
  EMPLOYEE = "employee"
}

export enum LifecycleStage {
  LEAD = "lead",
  PROSPECT = "prospect",
  CUSTOMER = "customer",
  PARTNER = "partner",
  CHURNED = "churned"
}

export enum ImportanceLevel {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  CRITICAL = "critical"
}

// UI State Types
export interface ContactHubState {
  contacts: Contact[];
  companies: Company[];
  selectedContact: Contact | null;
  selectedCompany: Company | null;
  timelineEvents: TimelineEvent[];
  searchResults: Contact[];
  loading: {
    contacts: boolean;
    companies: boolean;
    contactDetail: boolean;
    companyDetail: boolean;
    timeline: boolean;
    search: boolean;
  };
  error: string | null;
}

// Form Data Types
export interface ContactFormData {
  type: ContactType;
  email?: string;
  phone?: string;
  mobile?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  title?: string;
  company_name?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  lifecycle_stage?: LifecycleStage;
}

export interface CompanyFormData {
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  email?: string;
  industry?: string;
  company_type?: string;
  employee_count?: number;
  annual_revenue?: number;
  description?: string;
  founded_year?: number;
  headquarters?: string;
  logo_url?: string;
  social_profiles: Record<string, any>;
  technologies_used: string[];
  keywords: string[];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  account_status?: string;
  customer_since?: string;
  health_score?: number;
  churn_risk?: number;
  expansion_potential?: number;
}

export interface ActivityFormData {
  contact_id?: string;
  company_id?: string;
  app_name: string;
  activity_type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  importance: ImportanceLevel;
  sentiment_score?: number;
  engagement_score?: number;
  intent_signals: Record<string, any>;
  created_by?: string;
}

export interface RelationshipFormData {
  source_contact_id: string;
  target_contact_id: string;
  relationship_type: string;
  metadata: Record<string, any>;
}