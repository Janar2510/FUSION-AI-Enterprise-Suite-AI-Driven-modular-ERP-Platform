"""
Contact Hub Service for FusionAI Enterprise Suite
Business logic for contact management and tracking
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import logging

from .models import Contact, Company, AppProfile, Activity, Relationship
from .schemas import (
    ContactCreate, ContactUpdate, CompanyCreate, CompanyUpdate,
    AppProfileCreate, AppProfileUpdate, ActivityCreate, ActivityUpdate, RelationshipCreate, RelationshipUpdate
)
from ...core.database import get_async_session

logger = logging.getLogger(__name__)

class ContactHubService:
    """Service layer for contact hub operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_contact(self, contact_data: ContactCreate, created_by: Optional[UUID] = None) -> Contact:
        """Create a new contact"""
        try:
            # Generate full name if not provided
            full_name = contact_data.full_name
            if not full_name and contact_data.first_name and contact_data.last_name:
                full_name = f"{contact_data.first_name} {contact_data.last_name}"
            elif not full_name and contact_data.company_name:
                full_name = contact_data.company_name
            
            # Create contact object
            contact = Contact(
                external_id=contact_data.external_id,
                type=contact_data.type.value,
                email=contact_data.email,
                phone=contact_data.phone,
                mobile=contact_data.mobile,
                first_name=contact_data.first_name,
                last_name=contact_data.last_name,
                full_name=full_name,
                title=contact_data.title,
                company_name=contact_data.company_name,
                tax_id=contact_data.tax_id,
                address_line1=contact_data.address_line1,
                address_line2=contact_data.address_line2,
                city=contact_data.city,
                state=contact_data.state,
                postal_code=contact_data.postal_code,
                country=contact_data.country,
                tags=contact_data.tags,
                custom_fields=contact_data.custom_fields,
                lifecycle_stage=contact_data.lifecycle_stage.value if contact_data.lifecycle_stage else None,
                created_by=created_by,
                updated_by=created_by
            )
            
            self.db.add(contact)
            await self.db.commit()
            await self.db.refresh(contact)
            
            logger.info(f"Created new contact: {contact.id}")
            return contact
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating contact: {e}")
            raise
    
    async def get_contact(self, contact_id: UUID) -> Optional[Contact]:
        """Get a contact by ID"""
        try:
            stmt = select(Contact).where(Contact.id == contact_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting contact {contact_id}: {e}")
            raise
    
    async def update_contact(self, contact_id: UUID, contact_data: ContactUpdate, updated_by: Optional[UUID] = None) -> Contact:
        """Update an existing contact"""
        try:
            contact = await self.get_contact(contact_id)
            if not contact:
                raise ValueError(f"Contact {contact_id} not found")
            
            # Update fields
            update_data = contact_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(contact, field, value)
            
            # Update full name if needed
            if not contact.full_name and (contact.first_name or contact.last_name):
                contact.full_name = f"{contact.first_name or ''} {contact.last_name or ''}".strip()
            elif not contact.full_name and contact.company_name:
                contact.full_name = contact.company_name
            
            # Update audit fields
            contact.updated_by = updated_by
            
            await self.db.commit()
            await self.db.refresh(contact)
            
            logger.info(f"Updated contact: {contact_id}")
            return contact
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating contact {contact_id}: {e}")
            raise
    
    async def delete_contact(self, contact_id: UUID) -> bool:
        """Delete a contact"""
        try:
            contact = await self.get_contact(contact_id)
            if not contact:
                return False
            
            await self.db.delete(contact)
            await self.db.commit()
            
            logger.info(f"Deleted contact: {contact_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting contact {contact_id}: {e}")
            raise
    
    async def search_contacts(self, query: str, limit: int = 20) -> List[Contact]:
        """Search contacts by text query"""
        try:
            # Use full-text search if available, otherwise fallback to ILIKE
            stmt = select(Contact).where(
                or_(
                    Contact.full_name.ilike(f"%{query}%"),
                    Contact.email.ilike(f"%{query}%"),
                    Contact.company_name.ilike(f"%{query}%")
                )
            ).limit(limit)
            
            result = await self.db.execute(stmt)
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error searching contacts: {e}")
            raise
    
    async def create_company(self, company_data: CompanyCreate, created_by: Optional[UUID] = None) -> Company:
        """Create a new company"""
        try:
            company_dict = company_data.dict()
            company_dict['created_by'] = created_by
            company_dict['updated_by'] = created_by
            
            company = Company(**company_dict)
            self.db.add(company)
            await self.db.commit()
            await self.db.refresh(company)
            
            logger.info(f"Created new company: {company.id}")
            return company
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating company: {e}")
            raise
    
    async def delete_company(self, company_id: UUID) -> bool:
        """Delete a company"""
        try:
            company = await self.get_company(company_id)
            if not company:
                return False
            
            await self.db.delete(company)
            await self.db.commit()
            
            logger.info(f"Deleted company: {company_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting company {company_id}: {e}")
            raise
    
    async def get_company(self, company_id: UUID) -> Optional[Company]:
        """Get a company by ID"""
        try:
            stmt = select(Company).where(Company.id == company_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting company {company_id}: {e}")
            raise
    
    async def update_company(self, company_id: UUID, company_data: CompanyUpdate, updated_by: Optional[UUID] = None) -> Company:
        """Update an existing company"""
        try:
            company = await self.get_company(company_id)
            if not company:
                raise ValueError(f"Company {company_id} not found")
            
            # Update fields
            update_data = company_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(company, field, value)
            
            # Update audit fields
            company.updated_by = updated_by
            
            await self.db.commit()
            await self.db.refresh(company)
            
            logger.info(f"Updated company: {company_id}")
            return company
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating company {company_id}: {e}")
            raise
    
    async def create_app_profile(self, profile_data: AppProfileCreate, created_by: Optional[UUID] = None) -> AppProfile:
        """Create a new app profile for a contact"""
        try:
            profile = AppProfile(
                contact_id=profile_data.contact_id,
                app_name=profile_data.app_name,
                profile_data=profile_data.profile_data,
                created_by=created_by,
                updated_by=created_by
            )
            self.db.add(profile)
            await self.db.commit()
            await self.db.refresh(profile)
            
            logger.info(f"Created app profile for contact {profile_data.contact_id}")
            return profile
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating app profile: {e}")
            raise
    
    async def get_app_profile(self, profile_id: UUID) -> Optional[AppProfile]:
        """Get an app profile by ID"""
        try:
            stmt = select(AppProfile).where(AppProfile.id == profile_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting app profile {profile_id}: {e}")
            raise
    
    async def delete_app_profile(self, profile_id: UUID) -> bool:
        """Delete an app profile"""
        try:
            profile = await self.get_app_profile(profile_id)
            if not profile:
                return False
            
            await self.db.delete(profile)
            await self.db.commit()
            
            logger.info(f"Deleted app profile: {profile_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting app profile {profile_id}: {e}")
            raise
    
    async def update_app_profile(self, profile_id: UUID, profile_data: AppProfileUpdate, updated_by: Optional[UUID] = None) -> AppProfile:
        """Update an existing app profile"""
        try:
            stmt = select(AppProfile).where(AppProfile.id == profile_id)
            result = await self.db.execute(stmt)
            profile = result.scalar_one_or_none()
            
            if not profile:
                raise ValueError(f"App profile {profile_id} not found")
            
            profile.profile_data = profile_data.profile_data
            profile.updated_at = datetime.utcnow()
            profile.updated_by = updated_by
            
            await self.db.commit()
            await self.db.refresh(profile)
            
            logger.info(f"Updated app profile: {profile_id}")
            return profile
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating app profile {profile_id}: {e}")
            raise
    
    async def add_activity(self, activity_data: ActivityCreate, created_by: Optional[UUID] = None) -> Activity:
        """Add a new activity for a contact or company"""
        try:
            activity = Activity(
                contact_id=activity_data.contact_id,
                company_id=activity_data.company_id,
                app_name=activity_data.app_name,
                activity_type=activity_data.activity_type,
                title=activity_data.title,
                description=activity_data.description,
                metadata=activity_data.metadata,
                importance=activity_data.importance.value if activity_data.importance else "normal",
                sentiment_score=activity_data.sentiment_score,
                engagement_score=activity_data.engagement_score,
                intent_signals=activity_data.intent_signals,
                created_by=activity_data.created_by,
                updated_by=created_by
            )
            
            self.db.add(activity)
            await self.db.commit()
            await self.db.refresh(activity)
            
            # Update contact's last activity timestamp
            if activity.contact_id:
                contact = await self.get_contact(activity.contact_id)
                if contact:
                    contact.last_activity_at = datetime.utcnow()
                    contact.engagement_score = min(100, (contact.engagement_score or 0) + 1)
                    await self.db.commit()
            
            logger.info(f"Added activity: {activity.id}")
            return activity
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error adding activity: {e}")
            raise
    
    async def get_activity(self, activity_id: UUID) -> Optional[Activity]:
        """Get an activity by ID"""
        try:
            stmt = select(Activity).where(Activity.id == activity_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting activity {activity_id}: {e}")
            raise
    
    async def update_activity(self, activity_id: UUID, activity_data: ActivityUpdate, updated_by: Optional[UUID] = None) -> Activity:
        """Update an existing activity"""
        try:
            activity = await self.get_activity(activity_id)
            if not activity:
                raise ValueError(f"Activity {activity_id} not found")
            
            # Update fields
            update_data = activity_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(activity, field, value)
            
            # Update audit fields
            activity.updated_by = updated_by
            activity.updated_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(activity)
            
            logger.info(f"Updated activity: {activity_id}")
            return activity
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating activity {activity_id}: {e}")
            raise
    
    async def delete_activity(self, activity_id: UUID) -> bool:
        """Delete an activity"""
        try:
            activity = await self.get_activity(activity_id)
            if not activity:
                return False
            
            await self.db.delete(activity)
            await self.db.commit()
            
            logger.info(f"Deleted activity: {activity_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting activity {activity_id}: {e}")
            raise
    
    async def get_contact_timeline(self, contact_id: UUID, limit: int = 50) -> List[Activity]:
        """Get timeline of activities for a contact"""
        try:
            stmt = select(Activity).where(
                Activity.contact_id == contact_id
            ).order_by(Activity.created_at.desc()).limit(limit)
            
            result = await self.db.execute(stmt)
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error getting contact timeline: {e}")
            raise
    
    async def create_relationship(self, relationship_data: RelationshipCreate, created_by: Optional[UUID] = None) -> Relationship:
        """Create a new relationship between contacts"""
        try:
            relationship = Relationship(
                source_contact_id=relationship_data.source_contact_id,
                target_contact_id=relationship_data.target_contact_id,
                relationship_type=relationship_data.relationship_type,
                metadata=relationship_data.metadata,
                created_by=created_by,
                updated_by=created_by
            )
            
            self.db.add(relationship)
            await self.db.commit()
            await self.db.refresh(relationship)
            
            logger.info(f"Created relationship: {relationship.id}")
            return relationship
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating relationship: {e}")
            raise
    
    async def get_relationship(self, relationship_id: UUID) -> Optional[Relationship]:
        """Get a relationship by ID"""
        try:
            stmt = select(Relationship).where(Relationship.id == relationship_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting relationship {relationship_id}: {e}")
            raise
    
    async def update_relationship(self, relationship_id: UUID, relationship_data: RelationshipUpdate, updated_by: Optional[UUID] = None) -> Relationship:
        """Update an existing relationship"""
        try:
            relationship = await self.get_relationship(relationship_id)
            if not relationship:
                raise ValueError(f"Relationship {relationship_id} not found")
            
            # Update fields
            update_data = relationship_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(relationship, field, value)
            
            # Update audit fields
            relationship.updated_by = updated_by
            
            await self.db.commit()
            await self.db.refresh(relationship)
            
            logger.info(f"Updated relationship: {relationship_id}")
            return relationship
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating relationship {relationship_id}: {e}")
            raise
    
    async def delete_relationship(self, relationship_id: UUID) -> bool:
        """Delete a relationship"""
        try:
            relationship = await self.get_relationship(relationship_id)
            if not relationship:
                return False
            
            await self.db.delete(relationship)
            await self.db.commit()
            
            logger.info(f"Deleted relationship: {relationship_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting relationship {relationship_id}: {e}")
            raise
    
    async def get_cross_module_insights(self, contact_id: UUID) -> Dict[str, Any]:
        """Get cross-module insights for a contact"""
        try:
            # Get contact timeline
            timeline = await self.get_contact_timeline(contact_id)
            
            insights = {
                'total_interactions': len(timeline),
                'modules_used': list(set(activity.app_name for activity in timeline)),
                'last_activity': timeline[0].created_at if timeline else None,
                'engagement_trend': self._calculate_engagement_trend(timeline),
                'lifetime_value': 0.0,  # Placeholder
                'churn_risk': self._calculate_churn_risk(timeline),
                'next_best_action': self._suggest_next_action(timeline)
            }
            
            return insights
            
        except Exception as e:
            logger.error(f"Error getting cross-module insights: {e}")
            raise
    
    def _calculate_engagement_trend(self, activities: List[Activity]) -> float:
        """Calculate engagement trend over time"""
        if len(activities) < 2:
            return 0.0
        
        recent_activities = activities[:7]  # Last 7 activities
        older_activities = activities[7:14] if len(activities) > 7 else []
        
        if not older_activities:
            return 0.0
        
        recent_avg = sum(a.engagement_score or 0 for a in recent_activities) / len(recent_activities)
        older_avg = sum(a.engagement_score or 0 for a in older_activities) / len(older_activities)
        
        return ((recent_avg - older_avg) / older_avg) * 100 if older_avg > 0 else 0
    
    def _calculate_churn_risk(self, activities: List[Activity]) -> float:
        """Calculate churn risk based on activity patterns"""
        if not activities:
            return 50.0  # Default risk
        
        # Simple churn risk calculation
        days_since_last_activity = (datetime.utcnow() - activities[0].created_at).days if activities else 0
        negative_sentiment_count = sum(1 for a in activities if a.sentiment_score and a.sentiment_score < -0.3)
        
        risk_score = min(100, days_since_last_activity * 5 + negative_sentiment_count * 20)
        return risk_score
    
    def _suggest_next_action(self, activities: List[Activity]) -> Dict[str, Any]:
        """Suggest next best action based on activity history"""
        if not activities:
            return {"action": "Initial outreach", "reasoning": "New contact"}
        
        last_activity = activities[0]
        
        # Simple rule-based suggestions
        if last_activity.activity_type == "proposal_viewed":
            return {
                "action": "Follow up on proposal",
                "reasoning": "Contact viewed proposal recently"
            }
        elif last_activity.sentiment_score and last_activity.sentiment_score < -0.3:
            return {
                "action": "Address concerns",
                "reasoning": "Negative sentiment detected"
            }
        elif last_activity.activity_type == "contract_signed":
            return {
                "action": "Onboarding call",
                "reasoning": "Contract signed, time for onboarding"
            }
        
        return {
            "action": "Regular check-in",
            "reasoning": "Maintain relationship"
        }