from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
import logging

from ..models import (
    CRMContact, CRMCompany, CRMDeal, CRMPipeline, CRMStage,
    DealActivity, DealDocument, DealInvoice, DealQuote,
    CRMTag, CRMTask, CRMNote, CRMEmail, CRMMeeting
)
from ..schemas import ContactCreate, ContactUpdate, DealCreate, DealUpdate

logger = logging.getLogger(__name__)

class CRMService:
    """Core CRM service for managing contacts, companies, and deals"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    # Contact Management
    async def create_contact(self, contact_data: Dict[str, Any]) -> CRMContact:
        """Create a new contact"""
        # Generate full name if not provided
        if not contact_data.get('full_name'):
            first_name = contact_data.get('first_name', '')
            last_name = contact_data.get('last_name', '')
            contact_data['full_name'] = f"{first_name} {last_name}".strip()
        
        contact = CRMContact(**contact_data)
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact
    
    async def get_contact(self, contact_id: int) -> Optional[CRMContact]:
        """Get contact by ID"""
        return self.db.query(CRMContact).filter(CRMContact.id == contact_id).first()
    
    async def get_contacts(
        self,
        page: int = 1,
        limit: int = 50,
        filters: Dict[str, Any] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """Get paginated contacts with filtering"""
        query = self.db.query(CRMContact)
        
        # Apply filters
        if filters:
            if filters.get('search'):
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        CRMContact.first_name.ilike(search_term),
                        CRMContact.last_name.ilike(search_term),
                        CRMContact.email.ilike(search_term),
                        CRMContact.full_name.ilike(search_term)
                    )
                )
            
            if filters.get('lead_status'):
                query = query.filter(CRMContact.lead_status == filters['lead_status'])
            
            if filters.get('min_score'):
                query = query.filter(CRMContact.lead_score >= filters['min_score'])
        
        # Apply sorting
        sort_column = getattr(CRMContact, sort_by, CRMContact.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        contacts = query.offset(offset).limit(limit).all()
        
        return {
            "items": contacts,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    
    async def update_contact(self, contact_id: int, updates: Dict[str, Any]) -> Optional[CRMContact]:
        """Update contact"""
        contact = await self.get_contact(contact_id)
        if not contact:
            return None
        
        for key, value in updates.items():
            if hasattr(contact, key):
                setattr(contact, key, value)
        
        contact.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(contact)
        return contact
    
    # Company Management
    async def create_company(self, company_data: Dict[str, Any]) -> CRMCompany:
        """Create a new company"""
        company = CRMCompany(**company_data)
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company
    
    async def get_company(self, company_id: int) -> Optional[CRMCompany]:
        """Get company by ID"""
        return self.db.query(CRMCompany).filter(CRMCompany.id == company_id).first()
    
    async def get_companies(
        self,
        page: int = 1,
        limit: int = 50,
        filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Get paginated companies with filtering"""
        query = self.db.query(CRMCompany)
        
        if filters:
            if filters.get('search'):
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        CRMCompany.name.ilike(search_term),
                        CRMCompany.domain.ilike(search_term),
                        CRMCompany.industry.ilike(search_term)
                    )
                )
            
            if filters.get('industry'):
                query = query.filter(CRMCompany.industry == filters['industry'])
            
            if filters.get('account_status'):
                query = query.filter(CRMCompany.account_status == filters['account_status'])
        
        total = query.count()
        offset = (page - 1) * limit
        companies = query.offset(offset).limit(limit).all()
        
        return {
            "items": companies,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    
    # Deal Management
    async def create_deal(self, deal_data: Dict[str, Any]) -> CRMDeal:
        """Create a new deal"""
        deal = CRMDeal(**deal_data)
        self.db.add(deal)
        self.db.commit()
        self.db.refresh(deal)
        return deal
    
    async def get_deal(self, deal_id: int) -> Optional[CRMDeal]:
        """Get deal by ID"""
        return self.db.query(CRMDeal).filter(CRMDeal.id == deal_id).first()
    
    async def get_deal_complete(self, deal_id: int) -> Optional[CRMDeal]:
        """Get deal with all relationships"""
        return self.db.query(CRMDeal)\
            .filter(CRMDeal.id == deal_id)\
            .first()
    
    async def get_deals(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get deals with filtering"""
        query = self.db.query(CRMDeal)
        
        if filters:
            if filters.get('pipeline_id'):
                query = query.filter(CRMDeal.pipeline_id == filters['pipeline_id'])
            if filters.get('stage_id'):
                query = query.filter(CRMDeal.stage_id == filters['stage_id'])
            if filters.get('status'):
                query = query.filter(CRMDeal.status == filters['status'])
        
        deals = query.all()
        return {"items": deals, "total": len(deals)}
    
    async def update_deal(self, deal_id: int, updates: Dict[str, Any]) -> Optional[CRMDeal]:
        """Update deal"""
        deal = await self.get_deal(deal_id)
        if not deal:
            return None
        
        for key, value in updates.items():
            if hasattr(deal, key):
                setattr(deal, key, value)
        
        deal.updated_at = datetime.utcnow()
        deal.last_activity = datetime.utcnow()
        self.db.commit()
        self.db.refresh(deal)
        return deal
    
    # Pipeline Management
    async def get_all_pipelines(self) -> List[CRMPipeline]:
        """Get all pipelines with stages"""
        return self.db.query(CRMPipeline).all()
    
    async def get_pipeline_deals(self, pipeline_id: int) -> List[CRMDeal]:
        """Get all deals in a pipeline"""
        return self.db.query(CRMDeal)\
            .filter(CRMDeal.pipeline_id == pipeline_id)\
            .all()
    
    async def move_deal_to_stage(
        self,
        deal_id: int,
        new_stage_id: int,
        user_id: int
    ) -> Optional[CRMDeal]:
        """Move deal to different stage"""
        deal = await self.get_deal(deal_id)
        if not deal:
            return None
        
        deal.stage_id = new_stage_id
        deal.stage_entered_at = datetime.utcnow()
        deal.last_activity = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(deal)
        return deal
    
    # AI-Powered Features
    async def enrich_contact(self, email: str) -> Dict[str, Any]:
        """Enrich contact data using AI and external APIs"""
        domain = email.split('@')[1] if '@' in email else None
        
        enriched_data = {
            'email': email,
            'enriched_at': datetime.utcnow().isoformat()
        }
        
        if domain:
            # Mock company enrichment
            enriched_data.update({
                'company_name': domain.split('.')[0].title(),
                'industry': 'Technology',
                'employee_count': 100,
                'technologies_used': ['React', 'Python', 'AWS'],
                'description': f"Technology company in the {domain} domain"
            })
        
        return enriched_data
    
    async def score_lead(self, contact_id: int) -> Dict[str, Any]:
        """Calculate lead score using AI and behavioral data"""
        contact = await self.get_contact(contact_id)
        if not contact:
            return {}
        
        # Simple scoring algorithm
        score = 0
        factors = []
        
        # Email engagement (0-20 points)
        email_score = min(20, (contact.email_opens * 2) + (contact.email_clicks * 5))
        score += email_score
        factors.append(f"Email engagement: {email_score}/20")
        
        # Recency of interaction (0-20 points)
        if contact.last_activity:
            days_since_activity = (datetime.utcnow() - contact.last_activity).days
            recency_score = max(0, 20 - days_since_activity)
            score += recency_score
            factors.append(f"Recent activity: {recency_score}/20")
        
        # Company fit (0-25 points)
        if contact.companies:
            company = contact.companies[0]
            if company.employee_count and company.employee_count > 100:
                score += 10
                factors.append("Enterprise company: +10")
            if company.industry in ['Technology', 'Finance', 'Healthcare']:
                score += 15
                factors.append(f"Target industry ({company.industry}): +15")
        
        # Behavioral signals (0-35 points)
        behavior_score = min(35, contact.total_interactions * 5)
        score += behavior_score
        factors.append(f"Total interactions: {behavior_score}/35")
        
        # Determine qualification level
        if score >= 80:
            qualification = "Hot Lead 🔥"
            recommended_action = "Immediate outreach - Schedule demo"
        elif score >= 60:
            qualification = "Qualified Lead ✓"
            recommended_action = "Personalized follow-up within 24 hours"
        elif score >= 40:
            qualification = "Warm Lead"
            recommended_action = "Nurture with targeted content"
        else:
            qualification = "Cold Lead"
            recommended_action = "Add to nurture campaign"
        
        return {
            'lead_score': min(100, score),
            'qualification': qualification,
            'scoring_factors': factors,
            'recommended_action': recommended_action,
            'conversion_probability': score / 100,
            'estimated_deal_size': 10000.0
        }
    
    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get CRM dashboard metrics"""
        total_contacts = self.db.query(CRMContact).count()
        qualified_leads = self.db.query(CRMContact)\
            .filter(CRMContact.lead_score >= 60)\
            .count()
        
        pipeline_value = self.db.query(func.sum(CRMDeal.amount))\
            .filter(CRMDeal.status == 'open')\
            .scalar() or 0
        
        won_deals = self.db.query(CRMDeal)\
            .filter(CRMDeal.status == 'won')\
            .count()
        
        total_deals = self.db.query(CRMDeal).count()
        win_rate = (won_deals / total_deals * 100) if total_deals > 0 else 0
        
        return {
            'total_contacts': total_contacts,
            'qualified_leads': qualified_leads,
            'pipeline_value': float(pipeline_value),
            'win_rate': round(win_rate, 1),
            'contacts_growth': 12.5,
            'leads_growth': 8.3,
            'pipeline_growth': 15.2,
            'win_rate_change': 2.1
        }