"""
Documents Module API Endpoints
Handles document upload, processing, search, and management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import hashlib
import mimetypes
from pathlib import Path
import io

from ...core.database import get_async_session
from .models import (
    Document, DocumentAnnotation, DocumentShare, DocumentVersion, DocumentCollection,
    DocumentType, ProcessingStatus
)
from .schemas import (
    DocumentCreate, DocumentUpdate, DocumentResponse, DocumentSearch, 
    DocumentUpload, AnnotationCreate, ShareCreate, DocumentSearchResponse
)
from .service import DocumentService

router = APIRouter()

# Dashboard and Analytics
@router.get("/dashboard")
async def get_documents_dashboard(
    db: AsyncSession = Depends(get_async_session)
):
    """Get documents dashboard metrics"""
    try:
        service = DocumentService(db)
        return await service.get_dashboard_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_documents_analytics(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_async_session)
):
    """Get documents analytics"""
    try:
        service = DocumentService(db)
        analytics = await service.get_document_analytics(period_days)
        return {
            "status": "success",
            "data": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Document Management
@router.get("/documents")
async def get_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    document_type: Optional[str] = None,
    processing_status: Optional[str] = None,
    is_public: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated documents with filters"""
    try:
        service = DocumentService(db)
        documents = await service.get_documents(
            page=page,
            limit=limit,
            document_type=document_type,
            processing_status=processing_status,
            is_public=is_public,
            search=search
        )
        return {
            "status": "success",
            "data": documents,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(documents)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents")
async def create_document(
    document_data: DocumentCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new document"""
    try:
        service = DocumentService(db)
        document = await service.create_document(document_data, user_id=1)  # TODO: Get from auth
        return {
            "status": "success",
            "data": document
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{document_id}")
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get document by ID"""
    try:
        service = DocumentService(db)
        document = await service.get_document_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return {
            "status": "success",
            "data": document
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/documents/{document_id}")
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update document"""
    try:
        service = DocumentService(db)
        document = await service.update_document(document_id, document_data, user_id=1)  # TODO: Get from auth
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return {
            "status": "success",
            "data": document
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete document"""
    try:
        service = DocumentService(db)
        success = await service.delete_document(document_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        return {
            "status": "success",
            "message": "Document deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Document Upload
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_public: bool = Form(False),
    db: AsyncSession = Depends(get_async_session)
):
    """Upload a new document"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Get file content
        content = await file.read()
        file_size = len(content)
        
        # Determine document type
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        document_type = _get_document_type(mime_type, file.filename)
        
        # Generate file path
        file_hash = hashlib.sha256(content).hexdigest()
        file_extension = Path(file.filename).suffix
        file_path = f"documents/uploads/{file_hash}{file_extension}"
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Parse tags
        tags_list = []
        if tags:
            try:
                import json
                tags_list = json.loads(tags)
            except:
                tags_list = [tag.strip() for tag in tags.split(",")]
        
        # Create document record
        document_data = DocumentCreate(
            filename=file.filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            document_type=document_type,
            content=content if file_size < 1024 * 1024 else None,
            storage_url=file_path if file_size >= 1024 * 1024 else None,
            title=title or file.filename,
            description=description,
            tags=tags_list,
            is_public=is_public
        )
        
        service = DocumentService(db)
        document = await service.create_document(document_data, user_id=1)  # TODO: Get from auth
        
        return {
            "status": "success",
            "data": document
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

# Document Download
@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Download a document"""
    try:
        service = DocumentService(db)
        document = await service.get_document_by_id(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Return file
        if document.get('content'):
            # Small file stored in database
            return StreamingResponse(
                io.BytesIO(document['content']),
                media_type=document['mime_type'],
                headers={"Content-Disposition": f"attachment; filename={document['original_filename']}"}
            )
        else:
            # Large file stored on filesystem
            if not os.path.exists(document['file_path']):
                raise HTTPException(status_code=404, detail="File not found on disk")
            
            return FileResponse(
                document['file_path'],
                media_type=document['mime_type'],
                filename=document['original_filename']
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download document: {str(e)}")

# Annotation Management
@router.get("/documents/{document_id}/annotations")
async def get_document_annotations(
    document_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get annotations for a document"""
    try:
        service = DocumentService(db)
        annotations = await service.get_annotations(document_id)
        return {
            "status": "success",
            "data": annotations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/{document_id}/annotations")
async def create_annotation(
    document_id: int,
    annotation_data: AnnotationCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new annotation"""
    try:
        service = DocumentService(db)
        annotation = await service.create_annotation(annotation_data, user_id=1)  # TODO: Get from auth
        return {
            "status": "success",
            "data": annotation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Share Management
@router.post("/documents/{document_id}/share")
async def share_document(
    document_id: int,
    share_data: ShareCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Share a document with another user"""
    try:
        service = DocumentService(db)
        share = await service.create_share(share_data, user_id=1)  # TODO: Get from auth
        return {
            "status": "success",
            "data": share
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Search
@router.post("/search")
async def search_documents(
    search_data: DocumentSearch,
    db: AsyncSession = Depends(get_async_session)
):
    """Advanced document search"""
    try:
        service = DocumentService(db)
        results = await service.search_documents(search_data)
        return {
            "status": "success",
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@router.get("/health")
async def documents_health():
    """Documents module health check"""
    return {
        "status": "healthy",
        "module": "documents",
        "timestamp": datetime.utcnow().isoformat()
    }

# Helper functions
def _get_document_type(mime_type: str, filename: str) -> DocumentType:
    """Determine document type from MIME type and filename"""
    if mime_type.startswith("image/"):
        return DocumentType.IMAGE
    elif mime_type == "application/pdf":
        return DocumentType.PDF
    elif mime_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        return DocumentType.WORD
    elif mime_type in ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]:
        return DocumentType.EXCEL
    elif mime_type in ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]:
        return DocumentType.POWERPOINT
    elif mime_type.startswith("text/"):
        return DocumentType.TEXT
    elif mime_type == "message/rfc822":
        return DocumentType.EMAIL
    else:
        # Try to determine from filename
        filename_lower = filename.lower()
        if "invoice" in filename_lower:
            return DocumentType.INVOICE
        elif "contract" in filename_lower:
            return DocumentType.CONTRACT
        elif "receipt" in filename_lower:
            return DocumentType.RECEIPT
        else:
            return DocumentType.OTHER