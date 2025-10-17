"""
Documents Module Service
Business logic for document management, processing, and operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

from .models import (
    Document, DocumentAnnotation, DocumentShare, DocumentVersion, DocumentCollection,
    DocumentType, ProcessingStatus
)
from .schemas import (
    DocumentCreate, DocumentUpdate, DocumentResponse,
    DocumentSearch, DocumentSearchResponse,
    DocumentUpload, DocumentStatistics,
    DocumentDashboardMetrics, DocumentAnalytics,
    AnnotationCreate, AnnotationResponse,
    ShareCreate, ShareResponse,
    CollectionCreate, CollectionResponse
)


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(self) -> Dict:
        """Get document dashboard metrics"""
        try:
            # Get basic counts
            total_documents_result = await self.db.execute(select(func.count(Document.id)))
            total_documents = total_documents_result.scalar() or 0
            
            # Recent uploads (last 7 days)
            recent_date = datetime.utcnow() - timedelta(days=7)
            recent_uploads_result = await self.db.execute(
                select(func.count(Document.id))
                .where(Document.created_at >= recent_date)
            )
            recent_uploads = recent_uploads_result.scalar() or 0
            
            # Processing stats
            pending_result = await self.db.execute(
                select(func.count(Document.id))
                .where(Document.processing_status == ProcessingStatus.PENDING.value)
            )
            pending_count = pending_result.scalar() or 0
            
            processing_result = await self.db.execute(
                select(func.count(Document.id))
                .where(Document.processing_status == ProcessingStatus.PROCESSING.value)
            )
            processing_count = processing_result.scalar() or 0
            
            completed_result = await self.db.execute(
                select(func.count(Document.id))
                .where(Document.processing_status == ProcessingStatus.COMPLETED.value)
            )
            completed_count = completed_result.scalar() or 0
            
            failed_result = await self.db.execute(
                select(func.count(Document.id))
                .where(Document.processing_status == ProcessingStatus.FAILED.value)
            )
            failed_count = failed_result.scalar() or 0
            
            # Document types
            type_counts = {}
            for doc_type in DocumentType:
                type_result = await self.db.execute(
                    select(func.count(Document.id))
                    .where(Document.document_type == doc_type.value)
                )
                count = type_result.scalar() or 0
                if count > 0:
                    type_counts[doc_type.value] = count
            
            # Storage usage
            storage_result = await self.db.execute(
                select(func.sum(Document.file_size))
            )
            total_storage = storage_result.scalar() or 0
            
            # Recent documents
            recent_docs_result = await self.db.execute(
                select(Document)
                .order_by(desc(Document.created_at))
                .limit(5)
            )
            recent_documents = recent_docs_result.scalars().all()
            
            return {
                "status": "success",
                "data": {
                    "total_documents": total_documents,
                    "recent_uploads": recent_uploads,
                    "processing_stats": {
                        "pending": pending_count,
                        "processing": processing_count,
                        "completed": completed_count,
                        "failed": failed_count,
                        "success_rate": completed_count / (completed_count + failed_count) if (completed_count + failed_count) > 0 else 0
                    },
                    "document_types": type_counts,
                    "storage_usage": {
                        "total_bytes": total_storage,
                        "total_mb": total_storage / (1024 * 1024) if total_storage > 0 else 0,
                        "total_gb": total_storage / (1024 * 1024 * 1024) if total_storage > 0 else 0
                    },
                    "recent_documents": [self._serialize_document(doc) for doc in recent_documents],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            print(f"Error getting document dashboard metrics: {e}")
            return {
                "status": "error",
                "message": str(e),
                "data": {
                    "total_documents": 0,
                    "recent_uploads": 0,
                    "processing_stats": {"pending": 0, "processing": 0, "completed": 0, "failed": 0, "success_rate": 0},
                    "document_types": {},
                    "storage_usage": {"total_bytes": 0, "total_mb": 0, "total_gb": 0},
                    "recent_documents": [],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

    async def get_document_analytics(self, period_days: int = 30) -> Dict:
        """Get document analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Upload trends
            upload_trends = []
            for i in range(period_days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                day_uploads_result = await self.db.execute(
                    select(func.count(Document.id))
                    .where(
                        and_(
                            Document.created_at >= day_start,
                            Document.created_at < day_end
                        )
                    )
                )
                day_uploads = day_uploads_result.scalar() or 0
                
                upload_trends.append({
                    "date": day_start.date().isoformat(),
                    "uploads": day_uploads
                })
            
            # Processing trends
            processing_trends = []
            for i in range(period_days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                day_processed_result = await self.db.execute(
                    select(func.count(Document.id))
                    .where(
                        and_(
                            Document.processing_completed_at >= day_start,
                            Document.processing_completed_at < day_end,
                            Document.processing_status == ProcessingStatus.COMPLETED.value
                        )
                    )
                )
                day_processed = day_processed_result.scalar() or 0
                
                processing_trends.append({
                    "date": day_start.date().isoformat(),
                    "processed": day_processed
                })
            
            # Document type distribution
            type_distribution = {}
            for doc_type in DocumentType:
                type_result = await self.db.execute(
                    select(func.count(Document.id))
                    .where(
                        and_(
                            Document.document_type == doc_type.value,
                            Document.created_at >= start_date
                        )
                    )
                )
                count = type_result.scalar() or 0
                if count > 0:
                    type_distribution[doc_type.value] = count
            
            # Storage growth
            storage_growth = []
            for i in range(0, period_days, 7):  # Weekly intervals
                week_start = start_date + timedelta(days=i)
                week_end = week_start + timedelta(days=7)
                
                week_storage_result = await self.db.execute(
                    select(func.sum(Document.file_size))
                    .where(
                        and_(
                            Document.created_at >= start_date,
                            Document.created_at < week_end
                        )
                    )
                )
                week_storage = week_storage_result.scalar() or 0
                
                storage_growth.append({
                    "date": week_start.date().isoformat(),
                    "storage_mb": week_storage / (1024 * 1024) if week_storage > 0 else 0
                })
            
            return {
                "period_days": period_days,
                "upload_trends": upload_trends,
                "processing_trends": processing_trends,
                "document_type_distribution": type_distribution,
                "storage_growth": storage_growth,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting document analytics: {e}")
            return {
                "period_days": period_days,
                "upload_trends": [],
                "processing_trends": [],
                "document_type_distribution": {},
                "storage_growth": [],
                "timestamp": datetime.utcnow().isoformat()
            }

    # Document Management
    async def get_documents(
        self, 
        page: int = 1, 
        limit: int = 50,
        document_type: Optional[str] = None,
        processing_status: Optional[str] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None,
        created_by: Optional[int] = None
    ) -> List[Dict]:
        """Get paginated documents with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Document)
            
            # Apply filters
            filters = []
            if document_type:
                filters.append(Document.document_type == document_type)
            if processing_status:
                filters.append(Document.processing_status == processing_status)
            if is_public is not None:
                filters.append(Document.is_public == is_public)
            if created_by:
                filters.append(Document.created_by == created_by)
            if search:
                filters.append(
                    or_(
                        Document.filename.ilike(f"%{search}%"),
                        Document.title.ilike(f"%{search}%"),
                        Document.description.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Document.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            documents = result.scalars().all()
            
            return [self._serialize_document(document) for document in documents]
        except Exception as e:
            print(f"Error getting documents: {e}")
            return []

    async def create_document(self, document_data: DocumentCreate, user_id: int) -> Dict:
        """Create a new document"""
        try:
            document = Document(
                filename=document_data.filename,
                original_filename=document_data.original_filename,
                file_path=document_data.file_path,
                file_size=document_data.file_size,
                mime_type=document_data.mime_type,
                document_type=document_data.document_type.value,
                content=document_data.content,
                storage_url=document_data.storage_url,
                title=document_data.title,
                description=document_data.description,
                tags=document_data.tags or [],
                is_public=document_data.is_public,
                is_encrypted=document_data.is_encrypted,
                parent_document_id=document_data.parent_document_id,
                created_by=user_id
            )
            
            self.db.add(document)
            await self.db.commit()
            await self.db.refresh(document)
            
            return self._serialize_document(document)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating document: {e}")
            raise

    async def get_document_by_id(self, document_id: int) -> Optional[Dict]:
        """Get document by ID"""
        try:
            result = await self.db.execute(
                select(Document)
                .where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            
            if document:
                return self._serialize_document(document)
            return None
        except Exception as e:
            print(f"Error getting document: {e}")
            return None

    async def update_document(self, document_id: int, document_data: DocumentUpdate, user_id: int) -> Optional[Dict]:
        """Update document"""
        try:
            result = await self.db.execute(
                select(Document)
                .where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            
            if not document:
                return None
            
            # Update fields
            update_data = document_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(document, field, value)
            
            document.updated_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(document)
            
            return self._serialize_document(document)
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating document: {e}")
            raise

    async def delete_document(self, document_id: int) -> bool:
        """Delete document"""
        try:
            result = await self.db.execute(
                select(Document)
                .where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            
            if not document:
                return False
            
            await self.db.delete(document)
            await self.db.commit()
            
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error deleting document: {e}")
            raise

    # Annotation Management
    async def get_annotations(self, document_id: int) -> List[Dict]:
        """Get annotations for a document"""
        try:
            result = await self.db.execute(
                select(DocumentAnnotation)
                .where(DocumentAnnotation.document_id == document_id)
                .order_by(desc(DocumentAnnotation.created_at))
            )
            annotations = result.scalars().all()
            
            return [self._serialize_annotation(annotation) for annotation in annotations]
        except Exception as e:
            print(f"Error getting annotations: {e}")
            return []

    async def create_annotation(self, annotation_data: AnnotationCreate, user_id: int) -> Dict:
        """Create a new annotation"""
        try:
            annotation = DocumentAnnotation(
                document_id=annotation_data.document_id,
                annotation_type=annotation_data.annotation_type.value,
                content=annotation_data.content,
                page_number=annotation_data.page_number,
                x_coordinate=annotation_data.x_coordinate,
                y_coordinate=annotation_data.y_coordinate,
                width=annotation_data.width,
                height=annotation_data.height,
                selected_text=annotation_data.selected_text,
                start_position=annotation_data.start_position,
                end_position=annotation_data.end_position,
                color=annotation_data.color,
                opacity=annotation_data.opacity,
                is_public=annotation_data.is_public,
                created_by=user_id
            )
            
            self.db.add(annotation)
            await self.db.commit()
            await self.db.refresh(annotation)
            
            return self._serialize_annotation(annotation)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating annotation: {e}")
            raise

    # Share Management
    async def create_share(self, share_data: ShareCreate, user_id: int) -> Dict:
        """Create a document share"""
        try:
            import secrets
            share_token = secrets.token_urlsafe(32)
            
            share = DocumentShare(
                document_id=share_data.document_id,
                shared_with_email=share_data.shared_with_email,
                share_token=share_token,
                can_view=share_data.can_view,
                can_edit=share_data.can_edit,
                can_download=share_data.can_download,
                can_share=share_data.can_share,
                can_comment=share_data.can_comment,
                expires_at=share_data.expires_at,
                password_protected=share_data.password_protected,
                created_by=user_id
            )
            
            self.db.add(share)
            await self.db.commit()
            await self.db.refresh(share)
            
            return {
                "share_id": share.id,
                "share_token": share_token,
                "share_url": f"/documents/shared/{share_token}",
                "expires_at": share.expires_at.isoformat() if share.expires_at else None
            }
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating share: {e}")
            raise

    # Search functionality
    async def search_documents(self, search_data: DocumentSearch, user_id: Optional[int] = None) -> Dict:
        """Advanced document search"""
        try:
            query = select(Document)
            
            # Apply search filters
            filters = []
            
            if user_id is not None:
                filters.append(Document.created_by == user_id)
            
            if search_data.document_type:
                filters.append(Document.document_type == search_data.document_type.value)
            
            if search_data.classification:
                filters.append(Document.classification == search_data.classification)
            
            if search_data.tags:
                # Note: This is a simplified tag search - in production you'd use proper array operations
                for tag in search_data.tags:
                    filters.append(Document.tags.contains([tag]))
            
            if search_data.categories:
                for category in search_data.categories:
                    filters.append(Document.categories.contains([category]))
            
            if search_data.is_invoice is not None:
                filters.append(Document.is_invoice == search_data.is_invoice)
            
            if search_data.is_contract is not None:
                filters.append(Document.is_contract == search_data.is_contract)
            
            if search_data.is_receipt is not None:
                filters.append(Document.is_receipt == search_data.is_receipt)
            
            if search_data.created_after:
                filters.append(Document.created_at >= search_data.created_after)
            
            if search_data.created_before:
                filters.append(Document.created_at <= search_data.created_before)
            
            if search_data.file_size_min:
                filters.append(Document.file_size >= search_data.file_size_min)
            
            if search_data.file_size_max:
                filters.append(Document.file_size <= search_data.file_size_max)
            
            if search_data.processing_status:
                filters.append(Document.processing_status == search_data.processing_status.value)
            
            # Text search
            if search_data.query:
                search_term = f"%{search_data.query}%"
                filters.append(
                    or_(
                        Document.title.ilike(search_term),
                        Document.description.ilike(search_term),
                        Document.filename.ilike(search_term)
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            # Get total count
            count_result = await self.db.execute(select(func.count(Document.id)).select_from(query.subquery()))
            total_count = count_result.scalar() or 0
            
            # Apply pagination and ordering
            query = query.order_by(desc(Document.created_at)).offset(search_data.offset).limit(search_data.limit)
            
            result = await self.db.execute(query)
            documents = result.scalars().all()
            
            return {
                "documents": [self._serialize_document(doc) for doc in documents],
                "total_count": total_count,
                "offset": search_data.offset,
                "limit": search_data.limit,
                "has_more": search_data.offset + search_data.limit < total_count
            }
        except Exception as e:
            print(f"Error searching documents: {e}")
            return {
                "documents": [],
                "total_count": 0,
                "offset": search_data.offset,
                "limit": search_data.limit,
                "has_more": False
            }

    # Serialization methods
    def _serialize_document(self, document: Document) -> Dict:
        """Serialize document to dict"""
        return {
            "id": document.id,
            "filename": document.filename,
            "original_filename": document.original_filename,
            "file_path": document.file_path,
            "file_size": document.file_size,
            "mime_type": document.mime_type,
            "document_type": document.document_type,
            "storage_url": document.storage_url,
            "processing_status": document.processing_status,
            "processing_started_at": document.processing_started_at.isoformat() if document.processing_started_at else None,
            "processing_completed_at": document.processing_completed_at.isoformat() if document.processing_completed_at else None,
            "processing_error": document.processing_error,
            "title": document.title,
            "description": document.description,
            "keywords": document.keywords or [],
            "categories": document.categories or [],
            "tags": document.tags or [],
            "ocr_text": document.ocr_text,
            "ocr_confidence": float(document.ocr_confidence) if document.ocr_confidence else None,
            "ocr_language": document.ocr_language,
            "vision_analysis": document.vision_analysis or {},
            "detected_objects": document.detected_objects or [],
            "text_regions": document.text_regions or [],
            "layout_analysis": document.layout_analysis or {},
            "classification": document.classification,
            "classification_confidence": float(document.classification_confidence) if document.classification_confidence else None,
            "is_invoice": document.is_invoice,
            "is_contract": document.is_contract,
            "is_receipt": document.is_receipt,
            "invoice_number": document.invoice_number,
            "invoice_date": document.invoice_date.isoformat() if document.invoice_date else None,
            "invoice_amount": float(document.invoice_amount) if document.invoice_amount else None,
            "invoice_currency": document.invoice_currency,
            "vendor_name": document.vendor_name,
            "customer_name": document.customer_name,
            "is_public": document.is_public,
            "is_encrypted": document.is_encrypted,
            "version": document.version,
            "parent_document_id": document.parent_document_id,
            "created_at": document.created_at.isoformat() if document.created_at else None,
            "updated_at": document.updated_at.isoformat() if document.updated_at else None,
            "created_by": document.created_by
        }

    def _serialize_annotation(self, annotation: DocumentAnnotation) -> Dict:
        """Serialize annotation to dict"""
        return {
            "id": annotation.id,
            "document_id": annotation.document_id,
            "annotation_type": annotation.annotation_type,
            "content": annotation.content,
            "page_number": annotation.page_number,
            "x_coordinate": float(annotation.x_coordinate) if annotation.x_coordinate else None,
            "y_coordinate": float(annotation.y_coordinate) if annotation.y_coordinate else None,
            "width": float(annotation.width) if annotation.width else None,
            "height": float(annotation.height) if annotation.height else None,
            "selected_text": annotation.selected_text,
            "start_position": annotation.start_position,
            "end_position": annotation.end_position,
            "color": annotation.color,
            "opacity": float(annotation.opacity) if annotation.opacity else None,
            "is_resolved": annotation.is_resolved,
            "is_public": annotation.is_public,
            "created_at": annotation.created_at.isoformat() if annotation.created_at else None,
            "updated_at": annotation.updated_at.isoformat() if annotation.updated_at else None,
            "created_by": annotation.created_by
        }



