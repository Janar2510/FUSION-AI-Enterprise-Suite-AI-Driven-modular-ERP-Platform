"""
API endpoints for Contact Hub integration with existing systems
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from uuid import UUID

from .integration import ContactHubIntegration
from ...core.contact_tracker import ContactTracker
from ...core.database import get_async_session
from ...core.database import SessionLocal

router = APIRouter(prefix="/api/v1/contact-hub/integration", tags=["contact-hub-integration"])

def get_contact_tracker():
    """Get contact tracker instance"""
    session = SessionLocal()
    try:
        yield ContactTracker(session)
    finally:
        session.close()

@router.post("/sync-contact/{contact_id}")
async def sync_contact_to_crm(
    contact_id: UUID,
    contact_tracker: ContactTracker = Depends(get_contact_tracker),
    db: AsyncSession = Depends(get_async_session)
):
    """Sync a Contact Hub contact to the existing CRM system"""
    try:
        integration = ContactHubIntegration(contact_tracker)
        crm_contact_id = await integration.sync_contact_to_crm_by_id(contact_id, db)
        return {
            "message": "Contact synced successfully",
            "contact_hub_id": str(contact_id),
            "crm_contact_id": crm_contact_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sync-activity/{activity_id}")
async def sync_activity_to_crm(
    activity_id: UUID,
    contact_tracker: ContactTracker = Depends(get_contact_tracker)
):
    """Sync a Contact Hub activity to the existing CRM system"""
    try:
        integration = ContactHubIntegration(contact_tracker)
        crm_activity_id = await integration.sync_activity_to_crm_by_id(activity_id)
        return {
            "message": "Activity synced successfully",
            "contact_hub_id": str(activity_id),
            "crm_activity_id": crm_activity_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/import-crm-data")
async def import_crm_data(
    contact_tracker: ContactTracker = Depends(get_contact_tracker),
    db: AsyncSession = Depends(get_async_session)
):
    """Import all CRM data to Contact Hub"""
    try:
        integration = ContactHubIntegration(contact_tracker)
        results = await integration.sync_all_data(db)
        return {
            "message": "CRM data imported successfully",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sync-all")
async def sync_all_data(
    contact_tracker: ContactTracker = Depends(get_contact_tracker),
    db: AsyncSession = Depends(get_async_session)
):
    """Perform a full sync between Contact Hub and CRM"""
    try:
        integration = ContactHubIntegration(contact_tracker)
        results = await integration.sync_all_data(db)
        return {
            "message": "Full sync completed successfully",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))