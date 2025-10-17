from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship, Session
from sqlalchemy.ext.declarative import declarative_base
import asyncio
from enum import Enum
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

class ActivityType(Enum):
    # Document Module Activities
    DOCUMENT_UPLOAD = "document_upload"
    DOCUMENT_VIEW = "document_view"
    DOCUMENT_SIGN = "document_sign"
    DOCUMENT_SHARE = "document_share"
    
    # Communication Activities
    EMAIL_SENT = "email_sent"
    EMAIL_RECEIVED = "email_received"
    CHAT_MESSAGE = "chat_message"
    MEETING_SCHEDULED = "meeting_scheduled"
    CALL_MADE = "call_made"
    
    # Sales Activities
    QUOTE_SENT = "quote_sent"
    PROPOSAL_VIEWED = "proposal_viewed"
    CONTRACT_SIGNED = "contract_signed"
    DEAL_CREATED = "deal_created"
    DEAL_WON = "deal_won"
    DEAL_LOST = "deal_lost"
    LEAD_SCORED = "lead_scored"
    
    # Support Activities
    TICKET_CREATED = "ticket_created"
    TICKET_RESOLVED = "ticket_resolved"
    FEEDBACK_PROVIDED = "feedback_provided"
    
    # Financial Activities
    INVOICE_SENT = "invoice_sent"
    PAYMENT_RECEIVED = "payment_received"
    SUBSCRIPTION_STARTED = "subscription_started"
    
    # Marketing Activities
    CAMPAIGN_OPENED = "campaign_opened"
    CAMPAIGN_CLICKED = "campaign_clicked"
    FORM_SUBMITTED = "form_submitted"
    WEBINAR_ATTENDED = "webinar_attended"
    
    # System Activities
    LOGIN = "login"
    PROFILE_UPDATED = "profile_updated"
    PREFERENCE_CHANGED = "preference_changed"
    
    # CRM Specific
    CONTACT_CREATED = "contact_created"
    CONTACT_UPDATED = "contact_updated"
    CRM_VIEW = "crm_view"
    OPPORTUNITY_IDENTIFIED = "opportunity_identified"

class ContactActivity(Base):
    """Universal activity tracking for all modules"""
    __tablename__ = "contact_activities"
    
    id = Column(Integer, primary_key=True)
    contact_id = Column(Integer, ForeignKey("crm_contacts.id"))
    company_id = Column(Integer, ForeignKey("crm_companies.id"))
    user_id = Column(Integer)  # Internal user who triggered
    
    # Activity Details
    activity_type = Column(String(50))
    module = Column(String(50))  # Which module generated this
    entity_type = Column(String(50))  # document, invoice, ticket, etc.
    entity_id = Column(Integer)  # ID in the respective module
    
    # Activity Data
    title = Column(String(255))
    description = Column(Text)
    metadata_json = Column(JSON)  # Module-specific data
    
    # AI Analysis
    sentiment_score = Column(Float)  # -1 to 1
    engagement_score = Column(Float)  # 0 to 100
    intent_signals = Column(JSON)  # Detected buying signals, churn risk, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    contact = relationship("CRMContact", back_populates="activities")
    company = relationship("CRMCompany", back_populates="activities")

class ContactTracker:
    """Service to track all contact interactions across modules"""
    
    def __init__(self, db_session: Session):
        self.session = db_session
        self.activity_queue = asyncio.Queue()
    
    async def track_activity(
        self,
        contact_id: Optional[int],
        activity_type: ActivityType,
        module: str,
        entity_type: str,
        entity_id: int,
        metadata: Optional[Dict] = None,
        user_id: Optional[int] = None
    ):
        """Track any activity from any module"""
        
        # Find or create contact if email provided
        if not contact_id and metadata and metadata.get('email'):
            contact = await self._find_or_create_contact(metadata['email'])
            contact_id = contact.id
        
        # Create activity record
        activity = ContactActivity(
            contact_id=contact_id,
            activity_type=activity_type.value,
            module=module,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata,
            user_id=user_id,
            created_at=datetime.utcnow()
        )
        
        # Basic AI Analysis (simplified for now)
        if metadata and metadata.get('content'):
            activity.sentiment_score = self._analyze_sentiment(metadata['content'])
            activity.engagement_score = float(self._calculate_engagement(activity_type, metadata))
        
        # Save to database
        self.session.add(activity)
        self.session.commit()
        
        # Queue for real-time processing
        await self.activity_queue.put(activity)
        
        # Trigger workflows
        await self._trigger_workflows(activity)
        
        return activity
    
    async def _find_or_create_contact(self, email: str):
        """Find existing contact or create new one"""
        from ..modules.crm.models import CRMContact
        
        contact = self.session.query(CRMContact).filter_by(email=email).first()
        if not contact:
            contact = CRMContact(
                email=email,
                created_at=datetime.utcnow(),
                source='auto_tracked'
            )
            self.session.add(contact)
            self.session.commit()
        
        return contact
    
    async def _trigger_workflows(self, activity: ContactActivity):
        """Trigger automated workflows based on activity"""
        
        # High-value activity detection
        high_value_activities = [
            ActivityType.PROPOSAL_VIEWED.value,
            ActivityType.CONTRACT_SIGNED.value,
            ActivityType.QUOTE_SENT.value
        ]
        
        if activity.activity_type in high_value_activities:
            await self._notify_sales_team(activity)
        
        # Support escalation
        if activity.sentiment_score and activity.sentiment_score < -0.5:
            await self._escalate_to_support(activity)
        
        # Engagement tracking
        if activity.engagement_score and activity.engagement_score > 80:
            await self._mark_as_hot_lead(activity)
    
    def _analyze_sentiment(self, content: str) -> float:
        """Simple sentiment analysis (placeholder for AI service)"""
        # This would integrate with actual AI sentiment analysis
        positive_words = ['great', 'excellent', 'love', 'amazing', 'perfect']
        negative_words = ['terrible', 'awful', 'hate', 'disappointed', 'bad']
        
        content_lower = content.lower()
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        
        if positive_count > negative_count:
            return 0.5
        elif negative_count > positive_count:
            return -0.5
        return 0.0
    
    def _calculate_engagement(self, activity_type: ActivityType, metadata: Dict) -> float:
        """Calculate engagement score based on activity type"""
        engagement_scores = {
            ActivityType.DOCUMENT_VIEW: 20,
            ActivityType.EMAIL_RECEIVED: 30,
            ActivityType.EMAIL_SENT: 50,
            ActivityType.PROPOSAL_VIEWED: 70,
            ActivityType.CONTRACT_SIGNED: 90,
            ActivityType.CALL_MADE: 60,
            ActivityType.MEETING_SCHEDULED: 80
        }
        
        return engagement_scores.get(activity_type, 10)
    
    async def _notify_sales_team(self, activity: ContactActivity):
        """Notify sales team of high-value activity"""
        logger.info(f"High-value activity detected: {activity.activity_type} for contact {activity.contact_id}")
    
    async def _escalate_to_support(self, activity: ContactActivity):
        """Escalate to support team"""
        logger.info(f"Negative sentiment detected, escalating contact {activity.contact_id}")
    
    async def _mark_as_hot_lead(self, activity: ContactActivity):
        """Mark contact as hot lead"""
        logger.info(f"High engagement detected, marking contact {activity.contact_id} as hot lead")
    
    def get_contact_timeline(self, contact_id: int) -> List[ContactActivity]:
        """Get complete activity timeline for a contact"""
        return self.session.query(ContactActivity)\
            .filter_by(contact_id=contact_id)\
            .order_by(ContactActivity.created_at.desc())\
            .all()
    
    def get_cross_module_insights(self, contact_id: int) -> Dict:
        """Get insights from all module interactions"""
        activities = self.get_contact_timeline(contact_id)
        
        insights = {
            'total_interactions': len(activities),
            'modules_used': list(set(a.module for a in activities)),
            'last_activity': activities[0].created_at if activities else None,
            'engagement_trend': self._calculate_engagement_trend(activities),
            'lifetime_value': self._calculate_ltv(contact_id),
            'churn_risk': self._calculate_churn_risk(activities),
            'next_best_action': self._suggest_next_action(activities)
        }
        
        return insights
    
    def _calculate_engagement_trend(self, activities: List[ContactActivity]) -> float:
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
    
    def _calculate_ltv(self, contact_id: int) -> float:
        """Calculate lifetime value (placeholder)"""
        # This would query financial data from other modules
        return 0.0
    
    def _calculate_churn_risk(self, activities: List[ContactActivity]) -> float:
        """Calculate churn risk based on activity patterns"""
        if not activities:
            return 50.0  # Default risk
        
        # Simple churn risk calculation
        days_since_last_activity = (datetime.utcnow() - activities[0].created_at).days
        negative_sentiment_count = sum(1 for a in activities if a.sentiment_score and a.sentiment_score < -0.3)
        
        risk_score = min(100, days_since_last_activity * 5 + negative_sentiment_count * 20)
        return risk_score
    
    def _suggest_next_action(self, activities: List[ContactActivity]) -> Dict:
        """Suggest next best action based on activity history"""
        if not activities:
            return {"action": "Initial outreach", "reasoning": "New contact"}
        
        last_activity = activities[0]
        
        # Simple rule-based suggestions
        if last_activity.activity_type == ActivityType.PROPOSAL_VIEWED.value:
            return {
                "action": "Follow up on proposal",
                "reasoning": "Contact viewed proposal recently"
            }
        elif last_activity.sentiment_score and last_activity.sentiment_score < -0.3:
            return {
                "action": "Address concerns",
                "reasoning": "Negative sentiment detected"
            }
        elif last_activity.activity_type == ActivityType.CONTRACT_SIGNED.value:
            return {
                "action": "Onboarding call",
                "reasoning": "Contract signed, time for onboarding"
            }
        
        return {
            "action": "Regular check-in",
            "reasoning": "Maintain relationship"
        }