"""
Contact Hub API for FusionAI Enterprise Suite
REST API endpoints for contact management and tracking
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from .models import Contact, Company, AppProfile, Activity, Relationship

from .models import Contact
from .schemas import (
    ContactCreate, ContactUpdate, ContactResponse,
    CompanyCreate, CompanyUpdate, CompanyResponse,
    AppProfileCreate, AppProfileUpdate, AppProfileResponse,
    ActivityCreate, ActivityUpdate, ActivityResponse,
    RelationshipCreate, RelationshipUpdate, RelationshipResponse,
    ContactTimelineResponse, CrossModuleInsights, SearchResponse
)
from .service import ContactHubService
from ...core.database import get_async_session

router = APIRouter(prefix="/api/v1/contact-hub", tags=["contact-hub"])

@router.post("/contacts", response_model=ContactResponse)
async def create_contact(
    contact_data: ContactCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new contact"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        contact = await service.create_contact(contact_data, user_id)
        return contact
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a contact by ID"""
    try:
        service = ContactHubService(db)
        contact = await service.get_contact(contact_id)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        return contact
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: UUID,
    contact_data: ContactUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing contact"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        contact = await service.update_contact(contact_id, contact_data, user_id)
        return contact
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a contact"""
    try:
        service = ContactHubService(db)
        success = await service.delete_contact(contact_id)
        if not success:
            raise HTTPException(status_code=404, detail="Contact not found")
        return {"message": "Contact deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/companies/{company_id}")
async def delete_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a company"""
    try:
        service = ContactHubService(db)
        success = await service.delete_company(company_id)
        if not success:
            raise HTTPException(status_code=404, detail="Company not found")
        return {"message": "Company deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/contacts", response_model=List[ContactResponse])
async def list_contacts(
    skip: int = 0,
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_async_session)
):
    """List contacts with pagination"""
    try:
        stmt = select(Contact).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/search", response_model=SearchResponse)
async def search_contacts(
    q: str,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_async_session)
):
    """Search contacts by query"""
    try:
        service = ContactHubService(db)
        results = await service.search_contacts(q, limit)
        # Convert SQLAlchemy models to Pydantic models
        contact_responses = []
        for contact in results:
            # Access the actual values from the SQLAlchemy model
            contact_dict = {
                "id": getattr(contact, 'id'),
                "type": getattr(contact, 'type'),
                "email": getattr(contact, 'email'),
                "phone": getattr(contact, 'phone'),
                "mobile": getattr(contact, 'mobile'),
                "first_name": getattr(contact, 'first_name'),
                "last_name": getattr(contact, 'last_name'),
                "full_name": getattr(contact, 'full_name'),
                "title": getattr(contact, 'title'),
                "company_name": getattr(contact, 'company_name'),
                "tax_id": getattr(contact, 'tax_id'),
                "address_line1": getattr(contact, 'address_line1'),
                "address_line2": getattr(contact, 'address_line2'),
                "city": getattr(contact, 'city'),
                "state": getattr(contact, 'state'),
                "postal_code": getattr(contact, 'postal_code'),
                "country": getattr(contact, 'country'),
                "tags": getattr(contact, 'tags') or [],
                "custom_fields": getattr(contact, 'custom_fields') or {},
                "lifecycle_stage": getattr(contact, 'lifecycle_stage'),
                "engagement_score": getattr(contact, 'engagement_score') or 0.0,
                "created_at": getattr(contact, 'created_at'),
                "updated_at": getattr(contact, 'updated_at'),
                "last_activity_at": getattr(contact, 'last_activity_at'),
                "created_by": getattr(contact, 'created_by'),
                "updated_by": getattr(contact, 'updated_by')
            }
            contact_responses.append(ContactResponse(**contact_dict))
        return SearchResponse(results=contact_responses, count=len(results), query=q)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/companies", response_model=CompanyResponse)
async def create_company(
    company_data: CompanyCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new company"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        company = await service.create_company(company_data, user_id)
        return company
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a company by ID"""
    try:
        service = ContactHubService(db)
        company = await service.get_company(company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        return company
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: UUID,
    company_data: CompanyUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing company"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        company = await service.update_company(company_id, company_data, user_id)
        return company
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/profiles", response_model=AppProfileResponse)
async def create_app_profile(
    profile_data: AppProfileCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new app profile for a contact"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        profile = await service.create_app_profile(profile_data, user_id)
        return profile
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profiles/{profile_id}", response_model=AppProfileResponse)
async def get_app_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Get an app profile by ID"""
    try:
        service = ContactHubService(db)
        profile = await service.get_app_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="App profile not found")
        # Convert SQLAlchemy model to Pydantic model
        profile_dict = {
            "id": getattr(profile, 'id'),
            "contact_id": getattr(profile, 'contact_id'),
            "app_name": getattr(profile, 'app_name'),
            "profile_data": getattr(profile, 'profile_data'),
            "created_at": getattr(profile, 'created_at'),
            "updated_at": getattr(profile, 'updated_at'),
            "created_by": getattr(profile, 'created_by'),
            "updated_by": getattr(profile, 'updated_by')
        }
        return AppProfileResponse(**profile_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/profiles/{profile_id}", response_model=AppProfileResponse)
async def update_app_profile(
    profile_id: UUID,
    profile_data: AppProfileUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing app profile"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        profile = await service.update_app_profile(profile_id, profile_data, user_id)
        # Convert SQLAlchemy model to Pydantic model
        profile_dict = {
            "id": getattr(profile, 'id'),
            "contact_id": getattr(profile, 'contact_id'),
            "app_name": getattr(profile, 'app_name'),
            "profile_data": getattr(profile, 'profile_data'),
            "created_at": getattr(profile, 'created_at'),
            "updated_at": getattr(profile, 'updated_at'),
            "created_by": getattr(profile, 'created_by'),
            "updated_by": getattr(profile, 'updated_by')
        }
        return AppProfileResponse(**profile_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/profiles/{profile_id}")
async def delete_app_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete an app profile"""
    try:
        service = ContactHubService(db)
        success = await service.delete_app_profile(profile_id)
        if not success:
            raise HTTPException(status_code=404, detail="App profile not found")
        return {"message": "App profile deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/activities", response_model=ActivityResponse)
async def add_activity(
    activity_data: ActivityCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Add a new activity for a contact or company"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        activity = await service.add_activity(activity_data, user_id)
        # Convert SQLAlchemy model to Pydantic model
        activity_dict = {
            "id": getattr(activity, 'id'),
            "contact_id": getattr(activity, 'contact_id'),
            "company_id": getattr(activity, 'company_id'),
            "app_name": getattr(activity, 'app_name'),
            "activity_type": getattr(activity, 'activity_type'),
            "title": getattr(activity, 'title'),
            "description": getattr(activity, 'description'),
            "metadata": getattr(activity, 'metadata'),
            "importance": getattr(activity, 'importance'),
            "sentiment_score": getattr(activity, 'sentiment_score'),
            "engagement_score": getattr(activity, 'engagement_score'),
            "intent_signals": getattr(activity, 'intent_signals'),
            "created_at": getattr(activity, 'created_at'),
            "created_by": getattr(activity, 'created_by'),
            "updated_at": getattr(activity, 'updated_at'),
            "updated_by": getattr(activity, 'updated_by')
        }
        return ActivityResponse(**activity_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/activities/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Get an activity by ID"""
    try:
        service = ContactHubService(db)
        activity = await service.get_activity(activity_id)
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        # Convert SQLAlchemy model to Pydantic model
        activity_dict = {
            "id": getattr(activity, 'id'),
            "contact_id": getattr(activity, 'contact_id'),
            "company_id": getattr(activity, 'company_id'),
            "app_name": getattr(activity, 'app_name'),
            "activity_type": getattr(activity, 'activity_type'),
            "title": getattr(activity, 'title'),
            "description": getattr(activity, 'description'),
            "metadata": getattr(activity, 'metadata'),
            "importance": getattr(activity, 'importance'),
            "sentiment_score": getattr(activity, 'sentiment_score'),
            "engagement_score": getattr(activity, 'engagement_score'),
            "intent_signals": getattr(activity, 'intent_signals'),
            "created_at": getattr(activity, 'created_at'),
            "created_by": getattr(activity, 'created_by'),
            "updated_at": getattr(activity, 'updated_at'),
            "updated_by": getattr(activity, 'updated_by')
        }
        return ActivityResponse(**activity_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: UUID,
    activity_data: ActivityUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing activity"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        activity = await service.update_activity(activity_id, activity_data, user_id)
        # Convert SQLAlchemy model to Pydantic model
        activity_dict = {
            "id": getattr(activity, 'id'),
            "contact_id": getattr(activity, 'contact_id'),
            "company_id": getattr(activity, 'company_id'),
            "app_name": getattr(activity, 'app_name'),
            "activity_type": getattr(activity, 'activity_type'),
            "title": getattr(activity, 'title'),
            "description": getattr(activity, 'description'),
            "metadata": getattr(activity, 'metadata'),
            "importance": getattr(activity, 'importance'),
            "sentiment_score": getattr(activity, 'sentiment_score'),
            "engagement_score": getattr(activity, 'engagement_score'),
            "intent_signals": getattr(activity, 'intent_signals'),
            "created_at": getattr(activity, 'created_at'),
            "created_by": getattr(activity, 'created_by'),
            "updated_at": getattr(activity, 'updated_at'),
            "updated_by": getattr(activity, 'updated_by')
        }
        return ActivityResponse(**activity_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/activities/{activity_id}")
async def delete_activity(
    activity_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete an activity"""
    try:
        service = ContactHubService(db)
        success = await service.delete_activity(activity_id)
        if not success:
            raise HTTPException(status_code=404, detail="Activity not found")
        return {"message": "Activity deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/contacts/{contact_id}/timeline", response_model=ContactTimelineResponse)
async def get_contact_timeline(
    contact_id: UUID,
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_async_session)
):
    """Get timeline of activities for a contact"""
    try:
        service = ContactHubService(db)
        activities = await service.get_contact_timeline(contact_id, limit)
        # Convert SQLAlchemy models to TimelineEvent objects
        timeline_events = []
        for activity in activities:
            # Access the actual values from the SQLAlchemy model
            timeline_event_dict = {
                "id": getattr(activity, 'id'),
                "activity_type": getattr(activity, 'activity_type'),
                "app_name": getattr(activity, 'app_name'),
                "title": getattr(activity, 'title'),
                "description": getattr(activity, 'description'),
                "created_at": getattr(activity, 'created_at'),
                "sentiment_score": getattr(activity, 'sentiment_score'),
                "engagement_score": getattr(activity, 'engagement_score'),
                "metadata": getattr(activity, 'metadata')
            }
            timeline_events.append(timeline_event_dict)
        return ContactTimelineResponse(
            contact_id=contact_id,
            events=timeline_events,
            count=len(timeline_events)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/relationships", response_model=RelationshipResponse)
async def create_relationship(
    relationship_data: RelationshipCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new relationship between contacts"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        relationship = await service.create_relationship(relationship_data, user_id)
        # Convert SQLAlchemy model to Pydantic model
        relationship_dict = {
            "id": getattr(relationship, 'id'),
            "source_contact_id": getattr(relationship, 'source_contact_id'),
            "target_contact_id": getattr(relationship, 'target_contact_id'),
            "relationship_type": getattr(relationship, 'relationship_type'),
            "metadata": getattr(relationship, 'metadata'),
            "created_at": getattr(relationship, 'created_at'),
            "created_by": getattr(relationship, 'created_by'),
            "updated_by": getattr(relationship, 'updated_by')
        }
        return RelationshipResponse(**relationship_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/relationships/{relationship_id}", response_model=RelationshipResponse)
async def get_relationship(
    relationship_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a relationship by ID"""
    try:
        service = ContactHubService(db)
        relationship = await service.get_relationship(relationship_id)
        if not relationship:
            raise HTTPException(status_code=404, detail="Relationship not found")
        # Convert SQLAlchemy model to Pydantic model
        relationship_dict = {
            "id": getattr(relationship, 'id'),
            "source_contact_id": getattr(relationship, 'source_contact_id'),
            "target_contact_id": getattr(relationship, 'target_contact_id'),
            "relationship_type": getattr(relationship, 'relationship_type'),
            "metadata": getattr(relationship, 'metadata'),
            "created_at": getattr(relationship, 'created_at'),
            "created_by": getattr(relationship, 'created_by'),
            "updated_by": getattr(relationship, 'updated_by')
        }
        return RelationshipResponse(**relationship_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/relationships/{relationship_id}", response_model=RelationshipResponse)
async def update_relationship(
    relationship_id: UUID,
    relationship_data: RelationshipUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing relationship"""
    try:
        # Get user ID from request (this would come from auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        
        service = ContactHubService(db)
        relationship = await service.update_relationship(relationship_id, relationship_data, user_id)
        # Convert SQLAlchemy model to Pydantic model
        relationship_dict = {
            "id": getattr(relationship, 'id'),
            "source_contact_id": getattr(relationship, 'source_contact_id'),
            "target_contact_id": getattr(relationship, 'target_contact_id'),
            "relationship_type": getattr(relationship, 'relationship_type'),
            "metadata": getattr(relationship, 'metadata'),
            "created_at": getattr(relationship, 'created_at'),
            "created_by": getattr(relationship, 'created_by'),
            "updated_by": getattr(relationship, 'updated_by')
        }
        return RelationshipResponse(**relationship_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/relationships/{relationship_id}")
async def delete_relationship(
    relationship_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a relationship"""
    try:
        service = ContactHubService(db)
        success = await service.delete_relationship(relationship_id)
        if not success:
            raise HTTPException(status_code=404, detail="Relationship not found")
        return {"message": "Relationship deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/contacts/{contact_id}/insights", response_model=CrossModuleInsights)
async def get_cross_module_insights(
    contact_id: UUID,
    db: AsyncSession = Depends(get_async_session)
):
    """Get cross-module insights for a contact"""
    try:
        service = ContactHubService(db)
        insights = await service.get_cross_module_insights(contact_id)
        return CrossModuleInsights(**insights)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))