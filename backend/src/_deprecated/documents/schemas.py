"""
Documents Module Pydantic Schemas
Data validation and serialization for document operations
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
    """Document types"""
    PDF = "pdf"
    IMAGE = "image"
    WORD = "word"
    EXCEL = "excel"
    POWERPOINT = "powerpoint"
    TEXT = "text"
    EMAIL = "email"
    INVOICE = "invoice"
    CONTRACT = "contract"
    RECEIPT = "receipt"
    OTHER = "other"


class ProcessingStatus(str, Enum):
    """Document processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class AnnotationType(str, Enum):
    """Annotation types"""
    HIGHLIGHT = "highlight"
    COMMENT = "comment"
    NOTE = "note"
    STAMP = "stamp"
    DRAWING = "drawing"


# Base schemas
class DocumentBase(BaseModel):
    """Base document schema"""
    filename: str = Field(..., min_length=1, max_length=255)
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: bool = Field(default=False)
    is_encrypted: bool = Field(default=False)


class DocumentCreate(DocumentBase):
    """Schema for creating a new document"""
    original_filename: str = Field(..., min_length=1, max_length=255)
    file_path: str = Field(..., min_length=1, max_length=500)
    file_size: int = Field(..., ge=0)
    mime_type: str = Field(..., min_length=1, max_length=100)
    document_type: DocumentType
    content: Optional[bytes] = None
    storage_url: Optional[str] = None
    parent_document_id: Optional[int] = None


class DocumentUpload(BaseModel):
    """Schema for document upload"""
    filename: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=1, max_length=100)
    content: bytes = Field(..., min_length=1)
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: bool = Field(default=False)
    collection_id: Optional[int] = None


class DocumentUpdate(BaseModel):
    """Schema for updating a document"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_encrypted: Optional[bool] = None


class DocumentResponse(DocumentBase):
    """Schema for document responses"""
    id: int
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    document_type: str
    storage_url: Optional[str]
    processing_status: str
    processing_started_at: Optional[datetime]
    processing_completed_at: Optional[datetime]
    processing_error: Optional[str]
    keywords: Optional[List[str]]
    categories: Optional[List[str]]
    ocr_text: Optional[str]
    ocr_confidence: Optional[float]
    ocr_language: Optional[str]
    vision_analysis: Optional[Dict[str, Any]]
    detected_objects: Optional[List[str]]
    text_regions: Optional[List[Dict[str, Any]]]
    layout_analysis: Optional[Dict[str, Any]]
    classification: Optional[str]
    classification_confidence: Optional[float]
    is_invoice: bool
    is_contract: bool
    is_receipt: bool
    invoice_number: Optional[str]
    invoice_date: Optional[datetime]
    invoice_amount: Optional[float]
    invoice_currency: Optional[str]
    vendor_name: Optional[str]
    customer_name: Optional[str]
    version: int
    parent_document_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]

    class Config:
        from_attributes = True


class DocumentSearch(BaseModel):
    """Schema for document search"""
    query: Optional[str] = None
    document_type: Optional[DocumentType] = None
    classification: Optional[str] = None
    tags: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    is_invoice: Optional[bool] = None
    is_contract: Optional[bool] = None
    is_receipt: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    file_size_min: Optional[int] = None
    file_size_max: Optional[int] = None
    processing_status: Optional[ProcessingStatus] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class DocumentSearchResponse(BaseModel):
    """Schema for document search response"""
    documents: List[DocumentResponse]
    total_count: int
    offset: int
    limit: int
    has_more: bool


# Annotation schemas
class AnnotationBase(BaseModel):
    """Base annotation schema"""
    annotation_type: AnnotationType
    content: str = Field(..., min_length=1)
    page_number: Optional[int] = Field(None, ge=1)
    x_coordinate: Optional[float] = Field(None, ge=0)
    y_coordinate: Optional[float] = Field(None, ge=0)
    width: Optional[float] = Field(None, ge=0)
    height: Optional[float] = Field(None, ge=0)
    selected_text: Optional[str] = None
    start_position: Optional[int] = Field(None, ge=0)
    end_position: Optional[int] = Field(None, ge=0)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)
    is_public: bool = Field(default=False)


class AnnotationCreate(AnnotationBase):
    """Schema for creating document annotation"""
    document_id: int


class AnnotationUpdate(BaseModel):
    """Schema for updating annotation"""
    content: Optional[str] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    opacity: Optional[float] = Field(None, ge=0.0, le=1.0)
    is_resolved: Optional[bool] = None
    is_public: Optional[bool] = None


class AnnotationResponse(AnnotationBase):
    """Schema for annotation responses"""
    id: int
    document_id: int
    is_resolved: bool
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]

    class Config:
        from_attributes = True


# Share schemas
class ShareBase(BaseModel):
    """Base share schema"""
    can_view: bool = Field(default=True)
    can_edit: bool = Field(default=False)
    can_download: bool = Field(default=True)
    can_share: bool = Field(default=False)
    can_comment: bool = Field(default=True)
    expires_at: Optional[datetime] = None
    password_protected: bool = Field(default=False)


class ShareCreate(ShareBase):
    """Schema for creating document share"""
    document_id: int
    shared_with_email: Optional[str] = Field(None, max_length=255)
    password: Optional[str] = Field(None, min_length=6, max_length=50)


class ShareUpdate(BaseModel):
    """Schema for updating share"""
    can_view: Optional[bool] = None
    can_edit: Optional[bool] = None
    can_download: Optional[bool] = None
    can_share: Optional[bool] = None
    can_comment: Optional[bool] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class ShareResponse(ShareBase):
    """Schema for share responses"""
    id: int
    document_id: int
    shared_with_email: Optional[str]
    share_token: str
    is_active: bool
    access_count: int
    last_accessed_at: Optional[datetime]
    created_at: datetime
    created_by: Optional[int]

    class Config:
        from_attributes = True


class ShareAccessResponse(BaseModel):
    """Schema for accessing shared document"""
    share_id: int
    share_token: str
    share_url: str
    expires_at: Optional[datetime]
    permissions: Dict[str, bool]


# Collection schemas
class CollectionBase(BaseModel):
    """Base collection schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = Field(default=False)
    auto_classify: bool = Field(default=True)
    auto_tag: bool = Field(default=True)


class CollectionCreate(CollectionBase):
    """Schema for creating document collection"""
    parent_collection_id: Optional[int] = None


class CollectionUpdate(BaseModel):
    """Schema for updating collection"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_public: Optional[bool] = None
    auto_classify: Optional[bool] = None
    auto_tag: Optional[bool] = None


class CollectionResponse(CollectionBase):
    """Schema for collection responses"""
    id: int
    parent_collection_id: Optional[int]
    path: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]

    class Config:
        from_attributes = True


class CollectionHierarchy(BaseModel):
    """Schema for collection hierarchy"""
    id: int
    name: str
    description: Optional[str]
    path: str
    children: List['CollectionHierarchy']
    document_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# Statistics schemas
class DocumentStatistics(BaseModel):
    """Schema for document statistics"""
    total_documents: int
    processed_documents: int
    failed_documents: int
    processing_rate: float
    document_types: Dict[str, int]
    classifications: Dict[str, int]
    file_size_stats: Dict[str, Union[int, float]]
    period_days: int


class ProcessingStats(BaseModel):
    """Schema for processing statistics"""
    pending_count: int
    processing_count: int
    completed_count: int
    failed_count: int
    archived_count: int
    average_processing_time: Optional[float]
    success_rate: float


# Dashboard schemas
class DocumentDashboardMetrics(BaseModel):
    """Schema for document dashboard metrics"""
    total_documents: int
    recent_uploads: int
    processing_stats: ProcessingStats
    document_types: Dict[str, int]
    storage_usage: Dict[str, Union[int, float]]
    recent_documents: List[DocumentResponse]
    top_tags: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]


class DocumentAnalytics(BaseModel):
    """Schema for document analytics"""
    period_days: int
    upload_trends: List[Dict[str, Any]]
    processing_trends: List[Dict[str, Any]]
    document_type_distribution: Dict[str, int]
    classification_distribution: Dict[str, int]
    storage_growth: List[Dict[str, Any]]
    user_activity: List[Dict[str, Any]]


# Error schemas
class DocumentError(BaseModel):
    """Schema for document errors"""
    error_type: str
    message: str
    document_id: Optional[int] = None
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None


class ProcessingError(BaseModel):
    """Schema for processing errors"""
    document_id: int
    error_type: str
    error_message: str
    processing_stage: str
    timestamp: datetime
    retry_count: int
    max_retries: int


# WebSocket schemas
class DocumentEvent(BaseModel):
    """Schema for document events"""
    event_type: str  # upload, process, update, delete, share, annotate
    document_id: int
    user_id: Optional[int]
    timestamp: datetime
    data: Optional[Dict[str, Any]] = None


class ProcessingUpdate(BaseModel):
    """Schema for processing updates"""
    document_id: int
    status: ProcessingStatus
    progress: Optional[float] = None
    stage: Optional[str] = None
    message: Optional[str] = None
    timestamp: datetime


# Validation helpers
@validator('tags', pre=True)
def validate_tags(cls, v):
    """Validate and clean tags"""
    if v is None:
        return []
    if isinstance(v, str):
        return [tag.strip() for tag in v.split(',') if tag.strip()]
    return v


@validator('categories', pre=True)
def validate_categories(cls, v):
    """Validate and clean categories"""
    if v is None:
        return []
    if isinstance(v, str):
        return [cat.strip() for cat in v.split(',') if cat.strip()]
    return v


# Update forward references
CollectionHierarchy.model_rebuild()
