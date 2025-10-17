"""
Documents Module Services
Business logic for document processing, OCR, AI analysis, and management
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple, BinaryIO
from datetime import datetime, timedelta
import os
import hashlib
import mimetypes
from pathlib import Path
import json
import asyncio
from dataclasses import dataclass
from enum import Enum

from .models import (
    Document, DocumentAnnotation, DocumentShare, DocumentVersion, DocumentCollection,
    DocumentType, ProcessingStatus
)
from .agents import DocumentAgent


class SearchOperator(str, Enum):
    """Search operators for advanced queries"""
    AND = "and"
    OR = "or"
    NOT = "not"


@dataclass
class DocumentMetadata:
    """Document metadata extraction result"""
    title: Optional[str]
    description: Optional[str]
    keywords: List[str]
    categories: List[str]
    classification: Optional[str]
    confidence: float
    is_invoice: bool
    is_contract: bool
    is_receipt: bool
    business_metadata: Dict[str, Any]


@dataclass
class OCRResult:
    """OCR processing result"""
    text: str
    confidence: float
    language: str
    text_regions: List[Dict[str, Any]]
    layout_analysis: Dict[str, Any]


@dataclass
class VisionAnalysis:
    """Computer vision analysis result"""
    detected_objects: List[str]
    text_regions: List[Dict[str, Any]]
    layout_analysis: Dict[str, Any]
    confidence: float


class DocumentService:
    """Main document service class"""
    
    def __init__(self, db: Session):
        self.db = db
        self.agent = DocumentAgent()
        self.storage_path = "documents"
    
    async def create_document(
        self,
        filename: str,
        content: bytes,
        mime_type: str,
        user_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_public: bool = False
    ) -> Document:
        """Create a new document with file storage"""
        
        # Determine document type
        document_type = self._get_document_type(mime_type, filename)
        
        # Generate file path
        file_hash = hashlib.sha256(content).hexdigest()
        file_extension = Path(filename).suffix
        file_path = f"{self.storage_path}/{user_id}/{file_hash}{file_extension}"
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Create document record
        document = Document(
            filename=filename,
            original_filename=filename,
            file_path=file_path,
            file_size=len(content),
            mime_type=mime_type,
            document_type=document_type,
            content=content if len(content) < 1024 * 1024 else None,  # Store small files in DB
            storage_url=file_path if len(content) >= 1024 * 1024 else None,
            title=title or filename,
            description=description,
            tags=tags or [],
            is_public=is_public,
            created_by=user_id
        )
        
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        
        return document
    
    async def process_document(
        self,
        document: Document,
        force_reprocess: bool = False
    ) -> Document:
        """Process document with OCR, AI analysis, and classification"""
        
        if document.processing_status == ProcessingStatus.COMPLETED.value and not force_reprocess:
            return document
        
        try:
            # Update processing status
            document.processing_status = ProcessingStatus.PROCESSING.value
            document.processing_started_at = datetime.utcnow()
            self.db.commit()
            
            # Read document content
            content = await self._get_document_content(document)
            
            # OCR processing
            if document.document_type in [DocumentType.PDF.value, DocumentType.IMAGE.value]:
                ocr_result = await self._perform_ocr(content, document.mime_type)
                document.ocr_text = ocr_result.text
                document.ocr_confidence = ocr_result.confidence
                document.ocr_language = ocr_result.language
                document.text_regions = ocr_result.text_regions
                document.layout_analysis = ocr_result.layout_analysis
            
            # Vision analysis for images
            if document.document_type == DocumentType.IMAGE.value:
                vision_result = await self._perform_vision_analysis(content)
                document.vision_analysis = {
                    "detected_objects": vision_result.detected_objects,
                    "confidence": vision_result.confidence
                }
                document.detected_objects = vision_result.detected_objects
            
            # AI metadata extraction
            metadata = await self._extract_metadata(document, content)
            document.title = metadata.title or document.title
            document.description = metadata.description
            document.keywords = metadata.keywords
            document.categories = metadata.categories
            document.classification = metadata.classification
            document.classification_confidence = metadata.confidence
            document.is_invoice = metadata.is_invoice
            document.is_contract = metadata.is_contract
            document.is_receipt = metadata.is_receipt
            
            # Extract business metadata
            if metadata.business_metadata:
                document.invoice_number = metadata.business_metadata.get("invoice_number")
                document.invoice_date = metadata.business_metadata.get("invoice_date")
                document.invoice_amount = metadata.business_metadata.get("invoice_amount")
                document.invoice_currency = metadata.business_metadata.get("invoice_currency")
                document.vendor_name = metadata.business_metadata.get("vendor_name")
                document.customer_name = metadata.business_metadata.get("customer_name")
            
            # Generate embedding for semantic search
            embedding = await self._generate_embedding(document)
            if embedding:
                document.embedding_vector = embedding
                document.embedding_model = "text-embedding-ada-002"
                document.embedding_dimension = len(embedding)
            
            # Update processing status
            document.processing_status = ProcessingStatus.COMPLETED.value
            document.processing_completed_at = datetime.utcnow()
            self.db.commit()
            
            return document
            
        except Exception as e:
            # Update error status
            document.processing_status = ProcessingStatus.FAILED.value
            document.processing_error = str(e)
            self.db.commit()
            raise e
    
    async def search_documents(
        self,
        query: Optional[str] = None,
        document_type: Optional[str] = None,
        classification: Optional[str] = None,
        tags: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        is_invoice: Optional[bool] = None,
        is_contract: Optional[bool] = None,
        is_receipt: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        file_size_min: Optional[int] = None,
        file_size_max: Optional[int] = None,
        processing_status: Optional[str] = None,
        user_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Document], int]:
        """Search documents with various filters"""
        
        db_query = self.db.query(Document)
        
        # User filtering
        if user_id is not None:
            db_query = db_query.filter(Document.created_by == user_id)
        
        if is_public is not None:
            db_query = db_query.filter(Document.is_public == is_public)
        
        # Document type filtering
        if document_type:
            db_query = db_query.filter(Document.document_type == document_type)
        
        if classification:
            db_query = db_query.filter(Document.classification == classification)
        
        # Tag and category filtering
        if tags:
            db_query = db_query.filter(Document.tags.contains(tags))
        
        if categories:
            db_query = db_query.filter(Document.categories.contains(categories))
        
        # Business type filtering
        if is_invoice is not None:
            db_query = db_query.filter(Document.is_invoice == is_invoice)
        
        if is_contract is not None:
            db_query = db_query.filter(Document.is_contract == is_contract)
        
        if is_receipt is not None:
            db_query = db_query.filter(Document.is_receipt == is_receipt)
        
        # Date filtering
        if created_after:
            db_query = db_query.filter(Document.created_at >= created_after)
        
        if created_before:
            db_query = db_query.filter(Document.created_at <= created_before)
        
        # File size filtering
        if file_size_min:
            db_query = db_query.filter(Document.file_size >= file_size_min)
        
        if file_size_max:
            db_query = db_query.filter(Document.file_size <= file_size_max)
        
        # Processing status filtering
        if processing_status:
            db_query = db_query.filter(Document.processing_status == processing_status)
        
        # Text search
        if query:
            search_term = f"%{query}%"
            db_query = db_query.filter(
                (Document.title.ilike(search_term)) |
                (Document.description.ilike(search_term)) |
                (Document.ocr_text.ilike(search_term)) |
                (Document.filename.ilike(search_term))
            )
        
        # Get total count
        total_count = db_query.count()
        
        # Apply pagination and ordering
        documents = db_query.order_by(Document.created_at.desc()).offset(offset).limit(limit).all()
        
        return documents, total_count
    
    async def semantic_search(
        self,
        query: str,
        user_id: Optional[int] = None,
        limit: int = 20
    ) -> List[Document]:
        """Semantic search using vector embeddings"""
        
        # Generate query embedding
        query_embedding = await self._generate_embedding_for_text(query)
        if not query_embedding:
            return []
        
        # Search for similar documents
        # This would typically use a vector database like Pinecone or Weaviate
        # For now, we'll do a simple similarity search in the database
        
        documents = self.db.query(Document).filter(
            Document.embedding_vector.isnot(None)
        )
        
        if user_id is not None:
            documents = documents.filter(Document.created_by == user_id)
        
        # Calculate similarity scores (simplified)
        results = []
        for doc in documents.all():
            if doc.embedding_vector:
                similarity = self._calculate_similarity(query_embedding, doc.embedding_vector)
                if similarity > 0.7:  # Threshold for relevance
                    results.append((doc, similarity))
        
        # Sort by similarity and return top results
        results.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in results[:limit]]
    
    async def get_document_content(self, document: Document) -> bytes:
        """Get document content as bytes"""
        return await self._get_document_content(document)
    
    async def create_annotation(
        self,
        document_id: int,
        annotation_type: str,
        content: str,
        user_id: int,
        page_number: Optional[int] = None,
        coordinates: Optional[Dict[str, float]] = None,
        selected_text: Optional[str] = None,
        color: Optional[str] = None,
        is_public: bool = False
    ) -> DocumentAnnotation:
        """Create a document annotation"""
        
        annotation = DocumentAnnotation(
            document_id=document_id,
            annotation_type=annotation_type,
            content=content,
            page_number=page_number,
            x_coordinate=coordinates.get("x") if coordinates else None,
            y_coordinate=coordinates.get("y") if coordinates else None,
            width=coordinates.get("width") if coordinates else None,
            height=coordinates.get("height") if coordinates else None,
            selected_text=selected_text,
            color=color,
            is_public=is_public,
            created_by=user_id
        )
        
        self.db.add(annotation)
        self.db.commit()
        self.db.refresh(annotation)
        
        return annotation
    
    async def share_document(
        self,
        document_id: int,
        shared_with_email: Optional[str] = None,
        permissions: Dict[str, bool] = None,
        expires_at: Optional[datetime] = None,
        password: Optional[str] = None,
        created_by: int = None
    ) -> DocumentShare:
        """Share a document with another user"""
        
        # Generate share token
        import secrets
        share_token = secrets.token_urlsafe(32)
        
        # Hash password if provided
        password_hash = None
        if password:
            password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        share = DocumentShare(
            document_id=document_id,
            shared_with_email=shared_with_email,
            share_token=share_token,
            can_view=permissions.get("can_view", True),
            can_edit=permissions.get("can_edit", False),
            can_download=permissions.get("can_download", True),
            can_share=permissions.get("can_share", False),
            can_comment=permissions.get("can_comment", True),
            expires_at=expires_at,
            password_protected=password is not None,
            password_hash=password_hash,
            created_by=created_by
        )
        
        self.db.add(share)
        self.db.commit()
        self.db.refresh(share)
        
        return share
    
    async def get_document_statistics(
        self,
        user_id: Optional[int] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get document statistics for a user or globally"""
        
        query = self.db.query(Document)
        
        if user_id is not None:
            query = query.filter(Document.created_by == user_id)
        
        # Date range
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Document.created_at >= start_date)
        
        # Basic counts
        total_documents = query.count()
        processed_documents = query.filter(Document.processing_status == ProcessingStatus.COMPLETED.value).count()
        failed_documents = query.filter(Document.processing_status == ProcessingStatus.FAILED.value).count()
        
        # Document types
        type_counts = {}
        for doc_type in DocumentType:
            count = query.filter(Document.document_type == doc_type.value).count()
            if count > 0:
                type_counts[doc_type.value] = count
        
        # Classifications
        classification_counts = {}
        classifications = self.db.query(Document.classification).filter(
            Document.classification.isnot(None)
        ).distinct().all()
        
        for (classification,) in classifications:
            count = query.filter(Document.classification == classification).count()
            if count > 0:
                classification_counts[classification] = count
        
        # File sizes
        size_stats = self.db.query(
            func.min(Document.file_size),
            func.max(Document.file_size),
            func.avg(Document.file_size)
        ).filter(Document.created_at >= start_date).first()
        
        return {
            "total_documents": total_documents,
            "processed_documents": processed_documents,
            "failed_documents": failed_documents,
            "processing_rate": processed_documents / total_documents if total_documents > 0 else 0,
            "document_types": type_counts,
            "classifications": classification_counts,
            "file_size_stats": {
                "min": size_stats[0],
                "max": size_stats[1],
                "avg": float(size_stats[2]) if size_stats[2] else 0
            },
            "period_days": days
        }
    
    async def cleanup_old_documents(
        self,
        days_old: int = 365,
        dry_run: bool = True
    ) -> Dict[str, Any]:
        """Clean up old documents and their files"""
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        old_documents = self.db.query(Document).filter(
            Document.created_at < cutoff_date,
            Document.is_public == False  # Don't delete public documents
        ).all()
        
        deleted_count = 0
        freed_space = 0
        errors = []
        
        for document in old_documents:
            try:
                if not dry_run:
                    # Delete file from filesystem
                    if os.path.exists(document.file_path):
                        file_size = os.path.getsize(document.file_path)
                        os.remove(document.file_path)
                        freed_space += file_size
                    
                    # Delete from database
                    self.db.delete(document)
                    deleted_count += 1
                else:
                    # Dry run - just count
                    if os.path.exists(document.file_path):
                        freed_space += os.path.getsize(document.file_path)
                    deleted_count += 1
                    
            except Exception as e:
                errors.append(f"Error deleting document {document.id}: {str(e)}")
        
        if not dry_run:
            self.db.commit()
        
        return {
            "deleted_count": deleted_count,
            "freed_space_bytes": freed_space,
            "freed_space_mb": freed_space / (1024 * 1024),
            "errors": errors,
            "dry_run": dry_run
        }
    
    def _get_document_type(self, mime_type: str, filename: str) -> str:
        """Determine document type from MIME type and filename"""
        if mime_type.startswith("image/"):
            return DocumentType.IMAGE.value
        elif mime_type == "application/pdf":
            return DocumentType.PDF.value
        elif mime_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            return DocumentType.WORD.value
        elif mime_type in ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]:
            return DocumentType.EXCEL.value
        elif mime_type in ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]:
            return DocumentType.POWERPOINT.value
        elif mime_type.startswith("text/"):
            return DocumentType.TEXT.value
        elif mime_type == "message/rfc822":
            return DocumentType.EMAIL.value
        else:
            # Try to determine from filename
            filename_lower = filename.lower()
            if "invoice" in filename_lower:
                return DocumentType.INVOICE.value
            elif "contract" in filename_lower:
                return DocumentType.CONTRACT.value
            elif "receipt" in filename_lower:
                return DocumentType.RECEIPT.value
            else:
                return DocumentType.OTHER.value
    
    async def _get_document_content(self, document: Document) -> bytes:
        """Get document content from storage or database"""
        if document.content:
            return document.content
        elif document.storage_url and os.path.exists(document.storage_url):
            with open(document.storage_url, "rb") as f:
                return f.read()
        else:
            raise FileNotFoundError(f"Document content not found for {document.id}")
    
    async def _perform_ocr(self, content: bytes, mime_type: str) -> OCRResult:
        """Perform OCR on document content"""
        # This would integrate with OCR services like Tesseract, AWS Textract, or Google Vision
        # For now, return a mock result
        
        return OCRResult(
            text="Mock OCR text",
            confidence=0.85,
            language="en",
            text_regions=[],
            layout_analysis={}
        )
    
    async def _perform_vision_analysis(self, content: bytes) -> VisionAnalysis:
        """Perform computer vision analysis on image content"""
        # This would integrate with vision AI services
        # For now, return a mock result
        
        return VisionAnalysis(
            detected_objects=["text", "table", "signature"],
            text_regions=[],
            layout_analysis={},
            confidence=0.90
        )
    
    async def _extract_metadata(self, document: Document, content: bytes) -> DocumentMetadata:
        """Extract metadata using AI agent"""
        return await self.agent.extract_metadata(document, content)
    
    async def _generate_embedding(self, document: Document) -> Optional[List[float]]:
        """Generate embedding vector for document"""
        return await self.agent.generate_embedding(document)
    
    async def _generate_embedding_for_text(self, text: str) -> Optional[List[float]]:
        """Generate embedding vector for text"""
        return await self.agent.generate_embedding_for_text(text)
    
    def _calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        import numpy as np
        
        # Convert to numpy arrays
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)


class DocumentCollectionService:
    """Service for managing document collections"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_collection(
        self,
        name: str,
        description: Optional[str] = None,
        parent_collection_id: Optional[int] = None,
        user_id: int = None
    ) -> DocumentCollection:
        """Create a new document collection"""
        
        # Build path for hierarchy
        path = name
        if parent_collection_id:
            parent = self.db.query(DocumentCollection).filter(
                DocumentCollection.id == parent_collection_id
            ).first()
            if parent:
                path = f"{parent.path}/{name}"
        
        collection = DocumentCollection(
            name=name,
            description=description,
            parent_collection_id=parent_collection_id,
            path=path,
            created_by=user_id
        )
        
        self.db.add(collection)
        self.db.commit()
        self.db.refresh(collection)
        
        return collection
    
    async def get_collection_hierarchy(
        self,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get document collection hierarchy"""
        
        query = self.db.query(DocumentCollection)
        if user_id is not None:
            query = query.filter(DocumentCollection.created_by == user_id)
        
        collections = query.all()
        
        # Build hierarchy
        hierarchy = []
        collection_map = {c.id: c for c in collections}
        
        for collection in collections:
            if collection.parent_collection_id is None:
                hierarchy.append(self._build_collection_tree(collection, collection_map))
        
        return hierarchy
    
    def _build_collection_tree(
        self,
        collection: DocumentCollection,
        collection_map: Dict[int, DocumentCollection]
    ) -> Dict[str, Any]:
        """Build tree structure for a collection"""
        
        children = [
            self._build_collection_tree(child, collection_map)
            for child in collection.child_collections
        ]
        
        return {
            "id": collection.id,
            "name": collection.name,
            "description": collection.description,
            "path": collection.path,
            "children": children,
            "created_at": collection.created_at.isoformat(),
            "document_count": len(collection.documents) if hasattr(collection, 'documents') else 0
        }




