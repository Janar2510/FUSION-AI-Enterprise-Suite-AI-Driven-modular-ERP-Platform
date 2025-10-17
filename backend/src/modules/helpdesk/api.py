"""
Helpdesk Module API Endpoints
FastAPI routes for ticket management and support operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from ...core.database import get_async_session
from .service import HelpdeskService
from .schemas import (
    TicketCreate, TicketUpdate, TicketResponse,
    TicketResponseCreate, TicketResponseResponse,
    KnowledgeBaseCreate, KnowledgeBaseResponse,
    HelpdeskDashboardMetrics, HelpdeskAnalytics
)

router = APIRouter(prefix="/helpdesk", tags=["Helpdesk"])


@router.get("/dashboard", response_model=dict)
async def get_helpdesk_dashboard(
    db: AsyncSession = Depends(get_async_session)
):
    """Get helpdesk dashboard metrics and statistics"""
    try:
        service = HelpdeskService(db)
        return await service.get_dashboard_metrics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get helpdesk dashboard: {str(e)}"
        )


@router.get("/analytics", response_model=dict)
async def get_helpdesk_analytics(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_async_session)
):
    """Get helpdesk analytics for the specified period"""
    try:
        service = HelpdeskService(db)
        return await service.get_helpdesk_analytics(period_days)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get helpdesk analytics: {str(e)}"
        )


# Ticket Management Endpoints
@router.get("/tickets", response_model=List[dict])
async def get_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    assigned_agent_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session),
):
    """Get paginated tickets with filters"""
    try:
        service = HelpdeskService(db)
        tickets = await service.get_tickets(
            page=page,
            limit=limit,
            status=status,
            priority=priority,
            category=category,
            assigned_agent_id=assigned_agent_id,
            search=search
        )
        return tickets
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tickets: {str(e)}"
        )


@router.post("/tickets", response_model=dict)
async def create_ticket(
    ticket_data: TicketCreate,
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new support ticket"""
    try:
        service = HelpdeskService(db)
        ticket = await service.create_ticket(ticket_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Ticket created successfully",
            "data": ticket
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create ticket: {str(e)}"
        )


@router.get("/tickets/{ticket_id}", response_model=dict)
async def get_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """Get ticket by ID"""
    try:
        service = HelpdeskService(db)
        ticket = await service.get_ticket_by_id(ticket_id)
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        return {
            "status": "success",
            "data": ticket
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get ticket: {str(e)}"
        )


@router.put("/tickets/{ticket_id}", response_model=dict)
async def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    db: AsyncSession = Depends(get_async_session),
):
    """Update ticket"""
    try:
        service = HelpdeskService(db)
        ticket = await service.update_ticket(ticket_id, ticket_data, 1)  # Default user_id
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        return {
            "status": "success",
            "message": "Ticket updated successfully",
            "data": ticket
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update ticket: {str(e)}"
        )


@router.delete("/tickets/{ticket_id}")
async def delete_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """Delete ticket"""
    try:
        service = HelpdeskService(db)
        success = await service.delete_ticket(ticket_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        return {
            "status": "success",
            "message": "Ticket deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete ticket: {str(e)}"
        )


# Ticket Response Endpoints
@router.get("/tickets/{ticket_id}/responses", response_model=List[dict])
async def get_ticket_responses(
    ticket_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """Get responses for a ticket"""
    try:
        service = HelpdeskService(db)
        responses = await service.get_ticket_responses(ticket_id)
        return responses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get ticket responses: {str(e)}"
        )


@router.post("/tickets/{ticket_id}/responses", response_model=dict)
async def create_ticket_response(
    ticket_id: int,
    response_data: TicketResponseCreate,
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new ticket response"""
    try:
        # Set the ticket_id from the URL parameter
        response_data.ticket_id = ticket_id
        
        service = HelpdeskService(db)
        response = await service.create_ticket_response(response_data, 1)  # Default user_id
        
        return {
            "status": "success",
            "message": "Response created successfully",
            "data": response
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create ticket response: {str(e)}"
        )


# Knowledge Base Endpoints
@router.get("/knowledge-base", response_model=List[dict])
async def get_knowledge_base_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session),
):
    """Get paginated knowledge base articles"""
    try:
        service = HelpdeskService(db)
        articles = await service.get_knowledge_base_articles(
            page=page,
            limit=limit,
            category=category,
            is_public=is_public,
            search=search
        )
        return articles
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get knowledge base articles: {str(e)}"
        )


@router.post("/knowledge-base", response_model=dict)
async def create_knowledge_base_article(
    article_data: KnowledgeBaseCreate,
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new knowledge base article"""
    try:
        service = HelpdeskService(db)
        article = await service.create_knowledge_base_article(article_data, 1)  # Default user_id
        
        return {
            "status": "success",
            "message": "Knowledge base article created successfully",
            "data": article
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create knowledge base article: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "helpdesk",
        "timestamp": datetime.utcnow().isoformat()
    }
