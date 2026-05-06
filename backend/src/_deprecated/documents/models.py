"""
Documents Module Models
Handles document storage, processing, OCR, and AI analysis
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float, ForeignKey, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

Base = declarative_base()


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


class Document(Base):
    """Document model for file storage and metadata"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    document_type = Column(String(50), nullable=False)  # DocumentType enum
    
    # File content (for small files) or reference to storage
    content = Column(LargeBinary, nullable=True)
    storage_url = Column(String(500), nullable=True)  # URL to cloud storage
    
    # Processing status
    processing_status = Column(String(20), default=ProcessingStatus.PENDING.value)
    processing_started_at = Column(DateTime(timezone=True), nullable=True)
    processing_completed_at = Column(DateTime(timezone=True), nullable=True)
    processing_error = Column(Text, nullable=True)
    
    # AI-extracted metadata
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=True)  # List of keywords
    categories = Column(JSON, nullable=True)  # List of categories
    tags = Column(JSON, nullable=True)  # List of tags
    
    # OCR results
    ocr_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)  # 0.0 to 1.0
    ocr_language = Column(String(10), nullable=True)  # ISO language code
    
    # Vision AI results
    vision_analysis = Column(JSON, nullable=True)  # Image analysis results
    detected_objects = Column(JSON, nullable=True)  # List of detected objects
    text_regions = Column(JSON, nullable=True)  # Text regions with coordinates
    layout_analysis = Column(JSON, nullable=True)  # Document layout structure
    
    # Embeddings for semantic search
    embedding_vector = Column(JSON, nullable=True)  # Vector embedding
    embedding_model = Column(String(100), nullable=True)
    embedding_dimension = Column(Integer, nullable=True)
    
    # Document classification
    classification = Column(String(100), nullable=True)  # AI classification
    classification_confidence = Column(Float, nullable=True)
    is_invoice = Column(Boolean, default=False)
    is_contract = Column(Boolean, default=False)
    is_receipt = Column(Boolean, default=False)
    
    # Business metadata
    invoice_number = Column(String(100), nullable=True)
    invoice_date = Column(DateTime(timezone=True), nullable=True)
    invoice_amount = Column(Float, nullable=True)
    invoice_currency = Column(String(3), nullable=True)
    vendor_name = Column(String(255), nullable=True)
    customer_name = Column(String(255), nullable=True)
    
    # Access control
    is_public = Column(Boolean, default=False)
    is_encrypted = Column(Boolean, default=False)
    encryption_key_id = Column(String(100), nullable=True)
    
    # Version control
    version = Column(Integer, default=1)
    parent_document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User", back_populates="created_documents")
    parent_document = relationship("Document", remote_side=[id], back_populates="child_documents")
    child_documents = relationship("Document", back_populates="parent_document")
    annotations = relationship("DocumentAnnotation", back_populates="document", cascade="all, delete-orphan")
    shares = relationship("DocumentShare", back_populates="document", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename='{self.filename}', type='{self.document_type}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "document_type": self.document_type,
            "storage_url": self.storage_url,
            "processing_status": self.processing_status,
            "processing_started_at": self.processing_started_at.isoformat() if self.processing_started_at else None,
            "processing_completed_at": self.processing_completed_at.isoformat() if self.processing_completed_at else None,
            "processing_error": self.processing_error,
            "title": self.title,
            "description": self.description,
            "keywords": self.keywords or [],
            "categories": self.categories or [],
            "tags": self.tags or [],
            "ocr_text": self.ocr_text,
            "ocr_confidence": self.ocr_confidence,
            "ocr_language": self.ocr_language,
            "vision_analysis": self.vision_analysis or {},
            "detected_objects": self.detected_objects or [],
            "text_regions": self.text_regions or [],
            "layout_analysis": self.layout_analysis or {},
            "classification": self.classification,
            "classification_confidence": self.classification_confidence,
            "is_invoice": self.is_invoice,
            "is_contract": self.is_contract,
            "is_receipt": self.is_receipt,
            "invoice_number": self.invoice_number,
            "invoice_date": self.invoice_date.isoformat() if self.invoice_date else None,
            "invoice_amount": self.invoice_amount,
            "invoice_currency": self.invoice_currency,
            "vendor_name": self.vendor_name,
            "customer_name": self.customer_name,
            "is_public": self.is_public,
            "is_encrypted": self.is_encrypted,
            "version": self.version,
            "parent_document_id": self.parent_document_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by": self.created_by
        }


class DocumentAnnotation(Base):
    """Document annotations and comments"""
    __tablename__ = "document_annotations"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    
    # Annotation content
    annotation_type = Column(String(50), nullable=False)  # highlight, comment, note, etc.
    content = Column(Text, nullable=False)
    
    # Position information
    page_number = Column(Integer, nullable=True)
    x_coordinate = Column(Float, nullable=True)
    y_coordinate = Column(Float, nullable=True)
    width = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    
    # Selection text (for highlights)
    selected_text = Column(Text, nullable=True)
    start_position = Column(Integer, nullable=True)
    end_position = Column(Integer, nullable=True)
    
    # Styling
    color = Column(String(7), nullable=True)  # Hex color code
    opacity = Column(Float, default=1.0)
    
    # Status
    is_resolved = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    document = relationship("Document", back_populates="annotations")
    creator = relationship("User", back_populates="created_annotations")
    
    def __repr__(self):
        return f"<DocumentAnnotation(id={self.id}, type='{self.annotation_type}', document_id={self.document_id})>"


class DocumentShare(Base):
    """Document sharing and permissions"""
    __tablename__ = "document_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    
    # Sharing details
    shared_with_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    shared_with_email = Column(String(255), nullable=True)
    share_token = Column(String(255), nullable=True, unique=True)
    
    # Permissions
    can_view = Column(Boolean, default=True)
    can_edit = Column(Boolean, default=False)
    can_download = Column(Boolean, default=True)
    can_share = Column(Boolean, default=False)
    can_comment = Column(Boolean, default=True)
    
    # Access control
    expires_at = Column(DateTime(timezone=True), nullable=True)
    password_protected = Column(Boolean, default=False)
    password_hash = Column(String(255), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    access_count = Column(Integer, default=0)
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    document = relationship("Document", back_populates="shares")
    shared_with_user = relationship("User", foreign_keys=[shared_with_user_id])
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<DocumentShare(id={self.id}, document_id={self.document_id}, shared_with='{self.shared_with_email}')>"


class DocumentVersion(Base):
    """Document version history"""
    __tablename__ = "document_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    
    # Version details
    version_number = Column(Integer, nullable=False)
    version_name = Column(String(255), nullable=True)
    change_description = Column(Text, nullable=True)
    
    # File information
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    checksum = Column(String(64), nullable=False)  # SHA-256 hash
    
    # Processing status
    processing_status = Column(String(20), default=ProcessingStatus.PENDING.value)
    processing_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    document = relationship("Document")
    creator = relationship("User")
    
    def __repr__(self):
        return f"<DocumentVersion(id={self.id}, document_id={self.document_id}, version={self.version_number})>"


class DocumentCollection(Base):
    """Document collections and folders"""
    __tablename__ = "document_collections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Collection structure
    parent_collection_id = Column(Integer, ForeignKey("document_collections.id"), nullable=True)
    path = Column(String(500), nullable=True)  # Full path for hierarchy
    
    # Settings
    is_public = Column(Boolean, default=False)
    auto_classify = Column(Boolean, default=True)
    auto_tag = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    parent_collection = relationship("DocumentCollection", remote_side=[id])
    child_collections = relationship("DocumentCollection", back_populates="parent_collection")
    creator = relationship("User")
    
    def __repr__(self):
        return f"<DocumentCollection(id={self.id}, name='{self.name}')>"


class User(Base):
    """User model (referenced by document models)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # Document relationships
    created_documents = relationship("Document", back_populates="creator")
    created_annotations = relationship("DocumentAnnotation", back_populates="creator")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


# Pydantic models for API validation
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DocumentCreate(BaseModel):
    """Schema for creating a new document"""
    filename: str = Field(..., min_length=1, max_length=255)
    original_filename: str = Field(..., min_length=1, max_length=255)
    file_path: str = Field(..., min_length=1, max_length=500)
    file_size: int = Field(..., ge=0)
    mime_type: str = Field(..., min_length=1, max_length=100)
    document_type: str = Field(..., pattern="^(pdf|image|word|excel|powerpoint|text|email|invoice|contract|receipt|other)$")
    content: Optional[bytes] = None
    storage_url: Optional[str] = None
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_public: bool = Field(default=False)
    is_encrypted: bool = Field(default=False)
    parent_document_id: Optional[int] = None


class DocumentUpdate(BaseModel):
    """Schema for updating a document"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_encrypted: Optional[bool] = None


class DocumentResponse(BaseModel):
    """Schema for document responses"""
    id: int
    filename: str
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
    title: Optional[str]
    description: Optional[str]
    keywords: List[str]
    categories: List[str]
    tags: List[str]
    ocr_text: Optional[str]
    ocr_confidence: Optional[float]
    ocr_language: Optional[str]
    vision_analysis: Dict[str, Any]
    detected_objects: List[str]
    text_regions: List[Dict[str, Any]]
    layout_analysis: Dict[str, Any]
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
    is_public: bool
    is_encrypted: bool
    version: int
    parent_document_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]


class DocumentSearch(BaseModel):
    """Schema for document search"""
    query: Optional[str] = None
    document_type: Optional[str] = None
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
    processing_status: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


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


class AnnotationCreate(BaseModel):
    """Schema for creating document annotation"""
    document_id: int
    annotation_type: str = Field(..., pattern="^(highlight|comment|note|stamp|drawing)$")
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


class ShareCreate(BaseModel):
    """Schema for creating document share"""
    document_id: int
    shared_with_email: Optional[str] = Field(None, max_length=255)
    can_view: bool = Field(default=True)
    can_edit: bool = Field(default=False)
    can_download: bool = Field(default=True)
    can_share: bool = Field(default=False)
    can_comment: bool = Field(default=True)
    expires_at: Optional[datetime] = None
    password_protected: bool = Field(default=False)
    password: Optional[str] = Field(None, min_length=6, max_length=50)
