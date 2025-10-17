export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  storage_url?: string;
  processing_status: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  title?: string;
  description?: string;
  keywords: string[];
  categories: string[];
  tags: string[];
  ocr_text?: string;
  ocr_confidence?: number;
  ocr_language?: string;
  vision_analysis?: Record<string, any>;
  detected_objects?: string[];
  text_regions?: any[];
  layout_analysis?: Record<string, any>;
  classification?: string;
  classification_confidence?: number;
  is_invoice: boolean;
  is_contract: boolean;
  is_receipt: boolean;
  invoice_number?: string;
  invoice_date?: string;
  invoice_amount?: number;
  invoice_currency?: string;
  vendor_name?: string;
  customer_name?: string;
  is_public: boolean;
  is_encrypted: boolean;
  version: number;
  parent_document_id?: number;
  created_at: string;
  updated_at?: string;
  created_by?: number;
}

export interface DocumentAnnotation {
  id: number;
  document_id: number;
  annotation_type: string;
  content: string;
  page_number?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  width?: number;
  height?: number;
  selected_text?: string;
  start_position?: number;
  end_position?: number;
  color?: string;
  opacity: number;
  is_resolved: boolean;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
}

export interface DocumentShare {
  id: number;
  document_id: number;
  shared_with_user_id?: number;
  shared_with_email?: string;
  share_token: string;
  can_view: boolean;
  can_edit: boolean;
  can_download: boolean;
  can_share: boolean;
  can_comment: boolean;
  expires_at?: string;
  password_protected: boolean;
  is_active: boolean;
  access_count: number;
  last_accessed_at?: string;
  created_at: string;
  created_by?: number;
}

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  version_name?: string;
  change_description?: string;
  file_path: string;
  file_size: number;
  checksum: string;
  processing_status: string;
  processing_completed_at?: string;
  created_at: string;
  created_by?: number;
}

export interface DocumentCollection {
  id: number;
  name: string;
  description?: string;
  parent_collection_id?: number;
  path: string;
  is_public: boolean;
  auto_classify: boolean;
  auto_tag: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
}

export interface DocumentUpload {
  filename: string;
  mime_type: string;
  content: File;
  title?: string;
  description?: string;
  tags?: string[];
  is_public: boolean;
  collection_id?: number;
}

export interface DocumentSearch {
  query?: string;
  document_type?: string;
  classification?: string;
  tags?: string[];
  categories?: string[];
  is_invoice?: boolean;
  is_contract?: boolean;
  is_receipt?: boolean;
  created_after?: string;
  created_before?: string;
  file_size_min?: number;
  file_size_max?: number;
  processing_status?: string;
  limit: number;
  offset: number;
}

export interface DocumentFilters {
  document_type: string;
  classification: string;
  tags: string[];
  is_invoice: boolean | null;
  is_contract: boolean | null;
  is_receipt: boolean | null;
  processing_status: string;
  created_after: string;
  created_before: string;
}

export interface DocumentResponse {
  documents: Document[];
  total_count: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface DocumentStats {
  total: number;
  processed: number;
  processing: number;
  failed: number;
  pending: number;
  invoices: number;
  contracts: number;
  receipts: number;
}

export interface DocumentTypes {
  pdf: number;
  image: number;
  word: number;
  excel: number;
  powerpoint: number;
  text: number;
  other: number;
}

export interface DocumentClassifications {
  [key: string]: number;
}

export interface DocumentPreview {
  document_id: number;
  filename: string;
  mime_type: string;
  page: number;
  total_pages: number;
  preview_url: string;
}

export interface DocumentProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export interface DocumentMetadata {
  title?: string;
  description?: string;
  keywords: string[];
  categories: string[];
  classification?: string;
  confidence: number;
  is_invoice: boolean;
  is_contract: boolean;
  is_receipt: boolean;
  business_metadata: Record<string, any>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  text_regions: Array<{
    text: string;
    bbox: number[];
    confidence: number;
  }>;
  layout_analysis: Record<string, any>;
}

export interface VisionAnalysis {
  detected_objects: string[];
  text_regions: Array<{
    text: string;
    bbox: number[];
    confidence: number;
  }>;
  layout_analysis: Record<string, any>;
  confidence: number;
}

export interface DocumentSummary {
  summary: string;
  key_points: string[];
  action_items: string[];
  important_dates: string[];
  key_numbers: string[];
  confidence: number;
}

export interface DocumentEntities {
  people: string[];
  organizations: string[];
  locations: string[];
  dates: string[];
  numbers: string[];
  products: string[];
  contacts: string[];
}

export interface DocumentAnomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  confidence: number;
}

export interface DocumentSearchResult {
  document: Document;
  relevance_score: number;
  matched_fields: string[];
  highlights: string[];
}

export interface DocumentSimilarity {
  document_id: number;
  similarity: number;
  relevance_score: number;
}

export type DocumentType = 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'text' | 'email' | 'invoice' | 'contract' | 'receipt' | 'other';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'archived';
export type AnnotationType = 'highlight' | 'comment' | 'note' | 'stamp' | 'drawing';
export type SharePermission = 'view' | 'edit' | 'download' | 'share' | 'comment';

export interface DocumentUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface DocumentBatchOperation {
  document_ids: number[];
  operation: 'delete' | 'share' | 'process' | 'classify' | 'tag';
  parameters?: Record<string, any>;
}

export interface DocumentBatchResult {
  success: number[];
  failed: Array<{
    document_id: number;
    error: string;
  }>;
  total: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  document_type: DocumentType;
  fields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    required: boolean;
    options?: string[];
  }>;
  layout: Record<string, any>;
}

export interface DocumentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    type: 'upload' | 'process' | 'review' | 'approve' | 'reject';
    required: boolean;
    assignee?: string;
    due_date?: string;
  }>;
  triggers: Array<{
    event: 'upload' | 'process_complete' | 'approval' | 'rejection';
    conditions: Record<string, any>;
  }>;
}

export interface DocumentAuditLog {
  id: number;
  document_id: number;
  action: string;
  user_id: number;
  timestamp: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface DocumentPermission {
  user_id: number;
  document_id: number;
  permissions: SharePermission[];
  granted_by: number;
  granted_at: string;
  expires_at?: string;
}

export interface DocumentComment {
  id: number;
  document_id: number;
  content: string;
  page_number?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  parent_comment_id?: number;
  is_resolved: boolean;
  created_at: string;
  updated_at?: string;
  created_by: number;
}

export interface DocumentTag {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_at: string;
  created_by: number;
}

export interface DocumentCategory {
  id: number;
  name: string;
  description?: string;
  parent_category_id?: number;
  created_at: string;
  created_by: number;
}

export interface DocumentSearchFilters {
  query?: string;
  document_type?: DocumentType;
  classification?: string;
  tags?: string[];
  categories?: string[];
  is_invoice?: boolean;
  is_contract?: boolean;
  is_receipt?: boolean;
  created_after?: string;
  created_before?: string;
  file_size_min?: number;
  file_size_max?: number;
  processing_status?: ProcessingStatus;
  created_by?: number;
  is_public?: boolean;
  has_ocr?: boolean;
  has_classification?: boolean;
  confidence_min?: number;
  confidence_max?: number;
}

export interface DocumentSortOptions {
  field: 'filename' | 'created_at' | 'updated_at' | 'file_size' | 'document_type' | 'classification' | 'processing_status';
  direction: 'asc' | 'desc';
}

export interface DocumentPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface DocumentSearchResult {
  documents: Document[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
  facets: {
    document_types: Record<string, number>;
    classifications: Record<string, number>;
    tags: Record<string, number>;
    categories: Record<string, number>;
    processing_status: Record<string, number>;
  };
}

export interface DocumentWebSocketMessage {
  type: 'document_uploaded' | 'document_processed' | 'document_updated' | 'document_deleted' | 'document_shared';
  document_id: number;
  data: any;
  timestamp: string;
}

export interface DocumentError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}




