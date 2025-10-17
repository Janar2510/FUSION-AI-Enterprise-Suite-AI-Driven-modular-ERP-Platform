export type SignatureStatus = 'pending' | 'in_progress' | 'signed' | 'rejected' | 'approved' | 'expired';
export type SignatureMethod = 'draw' | 'type' | 'upload';
export type VerificationStatus = 'pending' | 'verified' | 'failed';
export type SignerRole = 'client' | 'service_provider' | 'employee' | 'hr_manager' | 'witness' | 'other';

export interface Signer {
  id: number;
  name: string;
  email: string;
  role: SignerRole;
  status: SignatureStatus;
  signed_at: string | null;
  signature_data: string | null;
  signature_method: SignatureMethod | null;
  ip_address: string | null;
  verification_status: VerificationStatus | null;
}

export interface SignatureRequest {
  id: number;
  document_title: string;
  document_url: string;
  status: SignatureStatus;
  created_at: string;
  updated_at: string | null;
  due_date: string;
  signers: Signer[];
  created_by: number;
  is_urgent: boolean;
  requires_witness: boolean;
  witness_email: string | null;
  witness_name: string | null;
  witness_signed_at: string | null;
  witness_signature_data: string | null;
  witness_ip_address: string | null;
  message: string;
  metadata: Record<string, any>;
}

export interface Signature {
  id: string;
  request_id: number;
  signer_id: number;
  signature_data: string;
  signed_at: string;
  method: SignatureMethod;
  ip_address: string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  document_template: string;
  signer_roles: SignerRole[];
  requires_witness: boolean;
  is_urgent: boolean;
  default_message: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface SignatureWorkflow {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    type: 'signature' | 'approval' | 'review' | 'notification';
    required: boolean;
    assignee_role: SignerRole;
    due_date_offset: number; // days from start
    conditions: Record<string, any>;
  }>;
  triggers: Array<{
    event: 'document_upload' | 'signature_complete' | 'approval_given' | 'deadline_approaching';
    conditions: Record<string, any>;
  }>;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface SignatureAnalytics {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  rejected_requests: number;
  expired_requests: number;
  average_completion_time: number; // hours
  completion_rate: number; // percentage
  rejection_rate: number; // percentage
  urgent_requests: number;
  witness_required_requests: number;
  signatures_by_method: {
    draw: number;
    type: number;
    upload: number;
  };
  signatures_by_role: Record<SignerRole, number>;
  completion_trend: Array<{
    date: string;
    completed: number;
    pending: number;
    rejected: number;
  }>;
}

export interface SignatureNotification {
  id: string;
  request_id: number;
  signer_id: number;
  type: 'signature_required' | 'signature_completed' | 'request_approved' | 'request_rejected' | 'deadline_reminder' | 'witness_required';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface SignatureAuditLog {
  id: string;
  request_id: number;
  action: string;
  user_id: number;
  user_name: string;
  user_email: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface SignatureCompliance {
  request_id: number;
  is_compliant: boolean;
  compliance_score: number; // 0-100
  issues: Array<{
    type: 'missing_signature' | 'invalid_signature' | 'expired_request' | 'unauthorized_signer' | 'witness_required';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion: string;
  }>;
  legal_requirements: Array<{
    requirement: string;
    met: boolean;
    evidence: string;
  }>;
  audit_trail: SignatureAuditLog[];
  last_checked: string;
}

export interface SignatureSettings {
  default_due_days: number;
  reminder_days: number[];
  auto_reminder: boolean;
  require_witness: boolean;
  allow_typed_signatures: boolean;
  allow_drawn_signatures: boolean;
  allow_uploaded_signatures: boolean;
  signature_verification: boolean;
  ip_tracking: boolean;
  audit_logging: boolean;
  retention_days: number;
  encryption_required: boolean;
  watermark_signatures: boolean;
  signature_position: 'bottom_right' | 'bottom_left' | 'top_right' | 'top_left' | 'center';
  signature_size: 'small' | 'medium' | 'large';
  signature_color: string;
  signature_opacity: number;
}

export interface SignatureWebSocketMessage {
  type: 'signature_request_created' | 'signature_request_updated' | 'signature_completed' | 'signature_rejected' | 'request_approved' | 'request_rejected' | 'deadline_reminder';
  request_id: number;
  signer_id?: number;
  data: any;
  timestamp: string;
}

export interface SignatureError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SignatureSearchFilters {
  status?: SignatureStatus[];
  signer_email?: string;
  created_after?: string;
  created_before?: string;
  due_after?: string;
  due_before?: string;
  is_urgent?: boolean;
  requires_witness?: boolean;
  created_by?: number;
  document_title?: string;
}

export interface SignatureSortOptions {
  field: 'created_at' | 'updated_at' | 'due_date' | 'document_title' | 'status';
  direction: 'asc' | 'desc';
}

export interface SignaturePagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface SignatureSearchResult {
  requests: SignatureRequest[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
  facets: {
    status: Record<SignatureStatus, number>;
    signer_roles: Record<SignerRole, number>;
    is_urgent: { true: number; false: number };
    requires_witness: { true: number; false: number };
  };
}

export interface SignatureBulkAction {
  request_ids: number[];
  action: 'approve' | 'reject' | 'remind' | 'extend_due_date' | 'delete';
  parameters?: Record<string, any>;
}

export interface SignatureBulkResult {
  success: number[];
  failed: Array<{
    request_id: number;
    error: string;
  }>;
  total: number;
}

export interface SignatureReport {
  id: string;
  name: string;
  description: string;
  type: 'completion' | 'performance' | 'compliance' | 'custom';
  filters: SignatureSearchFilters;
  group_by: string[];
  metrics: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    day_of_week?: number;
    day_of_month?: number;
    time: string;
    recipients: string[];
  };
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface SignatureIntegration {
  id: string;
  name: string;
  type: 'crm' | 'erp' | 'document_management' | 'email' | 'webhook' | 'api';
  configuration: Record<string, any>;
  is_active: boolean;
  last_sync: string | null;
  sync_errors: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface SignatureWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface SignatureTemplateField {
  id: string;
  template_id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'signature' | 'initial';
  required: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  validation: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    options?: string[];
  };
  styling: {
    font_family: string;
    font_size: number;
    color: string;
    background_color: string;
    border_color: string;
    border_width: number;
  };
  created_at: string;
  updated_at: string;
}

export interface SignatureFieldValue {
  id: string;
  request_id: number;
  field_id: string;
  signer_id: number;
  value: string;
  filled_at: string;
  ip_address: string;
  user_agent: string;
}

export interface SignatureDocument {
  id: string;
  request_id: number;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  page_count: number;
  thumbnail_url: string;
  is_encrypted: boolean;
  encryption_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignaturePage {
  id: string;
  document_id: string;
  page_number: number;
  width: number;
  height: number;
  thumbnail_url: string;
  signature_fields: Array<{
    id: string;
    field_id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    signer_id: number;
    filled: boolean;
    value: string | null;
  }>;
  created_at: string;
  updated_at: string;
}

export interface SignatureField {
  id: string;
  request_id: number;
  page_id: string;
  page_number: number;
  field_type: 'signature' | 'initial' | 'text' | 'date' | 'checkbox';
  name: string;
  description: string;
  required: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  assigned_to: number; // signer_id
  filled: boolean;
  value: string | null;
  filled_at: string | null;
  filled_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface SignatureValidation {
  is_valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  compliance_issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface SignatureExport {
  id: string;
  request_id: number;
  format: 'pdf' | 'zip' | 'json';
  includes: Array<'document' | 'signatures' | 'audit_log' | 'metadata'>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_path: string | null;
  file_size: number | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string;
  created_by: number;
}

export interface SignatureReminder {
  id: string;
  request_id: number;
  signer_id: number;
  type: 'email' | 'sms' | 'push' | 'in_app';
  message: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened' | 'clicked';
  response: string | null;
  created_at: string;
  scheduled_for: string;
}

export interface SignatureDeadline {
  request_id: number;
  due_date: string;
  is_overdue: boolean;
  days_remaining: number;
  hours_remaining: number;
  auto_remind: boolean;
  reminder_sent: boolean;
  last_reminder: string | null;
  escalation_level: number;
  escalation_actions: string[];
}

export interface SignatureMetrics {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  rejected_requests: number;
  expired_requests: number;
  average_completion_time: number;
  completion_rate: number;
  rejection_rate: number;
  urgent_requests: number;
  witness_required_requests: number;
  signatures_by_method: Record<SignatureMethod, number>;
  signatures_by_role: Record<SignerRole, number>;
  completion_trend: Array<{
    date: string;
    completed: number;
    pending: number;
    rejected: number;
  }>;
  performance_metrics: {
    average_response_time: number;
    peak_usage_hours: number[];
    error_rate: number;
    uptime: number;
  };
  compliance_metrics: {
    compliance_score: number;
    audit_trail_completeness: number;
    legal_requirements_met: number;
    security_incidents: number;
  };
}




