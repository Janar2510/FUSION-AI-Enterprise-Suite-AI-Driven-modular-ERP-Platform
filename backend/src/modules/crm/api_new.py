from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from .schemas import ContactCreate, ContactResponse, DealCreate, DealResponse
from .service import CRMService

router = APIRouter(prefix="/crm")

@router.get("/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Get CRM dashboard data"""
    try:
        service = CRMService(db)
        
        # Get metrics
        metrics = await service.get_dashboard_metrics()
        
        return {
            "status": "success",
            "data": {
                "metrics": metrics,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contacts")
async def get_contacts(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get paginated contacts list"""
    try:
        service = CRMService(db)
        contacts = await service.get_contacts(
            page=page,
            limit=limit,
            search=search
        )
        
        return {
            "status": "success",
            "data": contacts,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contacts")
async def create_contact(
    contact: ContactCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new contact"""
    try:
        service = CRMService(db)
        new_contact = await service.create_contact(contact.dict())
        
        return {
            "status": "success",
            "data": new_contact,
            "message": "Contact created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_analytics(
    period: str = Query("30d"),
    db: AsyncSession = Depends(get_db)
):
    """Get CRM analytics"""
    try:
        service = CRMService(db)
        analytics = await service.get_analytics(period)
        
        return {
            "status": "success",
            "data": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




