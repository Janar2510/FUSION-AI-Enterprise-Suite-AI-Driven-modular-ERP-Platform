from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from .models import CRMContact, CRMCompany, CRMDeal

class CRMService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_dashboard_metrics(self) -> Dict:
        """Get dashboard metrics"""
        try:
            # Get counts
            contacts_result = await self.db.execute(select(func.count(CRMContact.id)))
            total_contacts = contacts_result.scalar() or 0
            
            companies_result = await self.db.execute(select(func.count(CRMCompany.id)))
            total_companies = companies_result.scalar() or 0
            
            deals_result = await self.db.execute(select(func.count(CRMDeal.id)))
            total_deals = deals_result.scalar() or 0
            
            # Calculate pipeline value
            pipeline_result = await self.db.execute(
                select(func.sum(CRMDeal.amount))
                .where(CRMDeal.status == 'open')
            )
            pipeline_value = pipeline_result.scalar() or 0
            
            return {
                "total_contacts": total_contacts,
                "total_companies": total_companies,
                "total_deals": total_deals,
                "pipeline_value": float(pipeline_value),
                "qualified_leads": 0,  # Placeholder
                "win_rate": 0,  # Placeholder
                "avg_deal_size": 0,  # Placeholder
            }
        except Exception as e:
            print(f"Error getting dashboard metrics: {e}")
            # Return default values if error
            return {
                "total_contacts": 0,
                "total_companies": 0,
                "total_deals": 0,
                "pipeline_value": 0,
                "qualified_leads": 0,
                "win_rate": 0,
                "avg_deal_size": 0,
            }
    
    async def get_contacts(
        self, 
        page: int = 1, 
        limit: int = 50,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated contacts"""
        try:
            offset = (page - 1) * limit
            
            query = select(CRMContact)
            
            if search:
                query = query.where(
                    CRMContact.email.ilike(f"%{search}%") |
                    CRMContact.first_name.ilike(f"%{search}%") |
                    CRMContact.last_name.ilike(f"%{search}%")
                )
            
            query = query.offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            contacts = result.scalars().all()
            
            return [self._serialize_contact(c) for c in contacts]
        except Exception as e:
            print(f"Error getting contacts: {e}")
            return []
    
    async def create_contact(self, data: Dict) -> Dict:
        """Create new contact"""
        contact = CRMContact(**data)
        self.db.add(contact)
        await self.db.commit()
        await self.db.refresh(contact)
        
        return self._serialize_contact(contact)
    
    async def get_analytics(self, period: str) -> Dict:
        """Get analytics data"""
        try:
            # Parse period
            days = int(period.rstrip('d'))
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get new contacts in period
            result = await self.db.execute(
                select(func.count(CRMContact.id))
                .where(CRMContact.created_at >= start_date)
            )
            new_contacts = result.scalar() or 0
            
            return {
                "period": period,
                "new_contacts": new_contacts,
                "conversion_rate": 0,  # Placeholder
                "avg_lead_score": 0,  # Placeholder
            }
        except Exception as e:
            print(f"Error getting analytics: {e}")
            return {
                "period": period,
                "new_contacts": 0,
                "conversion_rate": 0,
                "avg_lead_score": 0,
            }
    
    def _serialize_contact(self, contact: CRMContact) -> Dict:
        """Serialize contact to dict"""
        return {
            "id": contact.id,
            "email": contact.email,
            "first_name": contact.first_name,
            "last_name": contact.last_name,
            "full_name": contact.full_name,
            "phone": contact.phone,
            "job_title": contact.job_title,
            "lead_status": contact.lead_status.value if contact.lead_status else None,
            "lead_score": contact.lead_score,
            "created_at": contact.created_at.isoformat() if contact.created_at else None
        }