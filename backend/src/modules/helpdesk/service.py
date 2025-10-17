"""
Helpdesk Module Service
Business logic for ticket management, support operations, and analytics
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

from .models import (
    SupportAgent, Ticket, TicketResponse, TicketActivity, SupportTeam, TeamMember,
    KnowledgeBase, TicketStatus, TicketPriority, TicketCategory, TicketSource
)
from .schemas import (
    SupportAgentCreate, SupportAgentUpdate, SupportAgentResponse,
    TicketCreate, TicketUpdate, TicketResponse,
    TicketResponseCreate, TicketResponseResponse,
    TicketActivityResponse, KnowledgeBaseCreate, KnowledgeBaseResponse,
    TicketStatistics, HelpdeskDashboardMetrics, HelpdeskAnalytics
)


class HelpdeskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(self) -> Dict:
        """Get helpdesk dashboard metrics"""
        try:
            # Get basic ticket counts
            total_tickets_result = await self.db.execute(select(func.count(Ticket.id)))
            total_tickets = total_tickets_result.scalar() or 0
            
            open_tickets_result = await self.db.execute(
                select(func.count(Ticket.id))
                .where(Ticket.status == TicketStatus.OPEN.value)
            )
            open_tickets = open_tickets_result.scalar() or 0
            
            in_progress_result = await self.db.execute(
                select(func.count(Ticket.id))
                .where(Ticket.status == TicketStatus.IN_PROGRESS.value)
            )
            in_progress_tickets = in_progress_result.scalar() or 0
            
            resolved_result = await self.db.execute(
                select(func.count(Ticket.id))
                .where(Ticket.status == TicketStatus.RESOLVED.value)
            )
            resolved_tickets = resolved_result.scalar() or 0
            
            closed_result = await self.db.execute(
                select(func.count(Ticket.id))
                .where(Ticket.status == TicketStatus.CLOSED.value)
            )
            closed_tickets = closed_result.scalar() or 0
            
            # Get agent statistics
            total_agents_result = await self.db.execute(select(func.count(SupportAgent.id)))
            total_agents = total_agents_result.scalar() or 0
            
            active_agents_result = await self.db.execute(
                select(func.count(SupportAgent.id))
                .where(SupportAgent.is_active == True)
            )
            active_agents = active_agents_result.scalar() or 0
            
            # Calculate average resolution time
            avg_resolution_result = await self.db.execute(
                select(func.avg(
                    func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600
                ))
                .where(Ticket.resolved_at.isnot(None))
            )
            avg_resolution_time = avg_resolution_result.scalar() or 0.0
            
            # Calculate customer satisfaction
            satisfaction_result = await self.db.execute(
                select(func.avg(Ticket.satisfaction_score))
                .where(Ticket.satisfaction_score.isnot(None))
            )
            avg_satisfaction = satisfaction_result.scalar() or 0.0
            
            # Get tickets by priority
            priority_counts = {}
            for priority in TicketPriority:
                count_result = await self.db.execute(
                    select(func.count(Ticket.id))
                    .where(Ticket.priority == priority.value)
                )
                count = count_result.scalar() or 0
                if count > 0:
                    priority_counts[priority.value] = count
            
            # Get tickets by category
            category_counts = {}
            for category in TicketCategory:
                count_result = await self.db.execute(
                    select(func.count(Ticket.id))
                    .where(Ticket.category == category.value)
                )
                count = count_result.scalar() or 0
                if count > 0:
                    category_counts[category.value] = count
            
            # Recent tickets
            recent_tickets_result = await self.db.execute(
                select(Ticket)
                .order_by(desc(Ticket.created_at))
                .limit(5)
            )
            recent_tickets = recent_tickets_result.scalars().all()
            
            return {
                "status": "success",
                "data": {
                    "ticket_statistics": {
                        "total_tickets": total_tickets,
                        "open_tickets": open_tickets,
                        "in_progress_tickets": in_progress_tickets,
                        "resolved_tickets": resolved_tickets,
                        "closed_tickets": closed_tickets,
                        "average_resolution_time": round(avg_resolution_time, 2),
                        "customer_satisfaction_score": round(avg_satisfaction, 2)
                    },
                    "agent_statistics": {
                        "total_agents": total_agents,
                        "active_agents": active_agents
                    },
                    "tickets_by_priority": priority_counts,
                    "tickets_by_category": category_counts,
                    "recent_tickets": [self._serialize_ticket(ticket) for ticket in recent_tickets],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            print(f"Error getting helpdesk dashboard metrics: {e}")
            return {
                "status": "error",
                "message": str(e),
                "data": {
                    "ticket_statistics": {
                        "total_tickets": 0,
                        "open_tickets": 0,
                        "in_progress_tickets": 0,
                        "resolved_tickets": 0,
                        "closed_tickets": 0,
                        "average_resolution_time": 0.0,
                        "customer_satisfaction_score": 0.0
                    },
                    "agent_statistics": {
                        "total_agents": 0,
                        "active_agents": 0
                    },
                    "tickets_by_priority": {},
                    "tickets_by_category": {},
                    "recent_tickets": [],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

    async def get_helpdesk_analytics(self, period_days: int = 30) -> Dict:
        """Get helpdesk analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Ticket volume trends
            volume_trends = []
            for i in range(period_days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                day_tickets_result = await self.db.execute(
                    select(func.count(Ticket.id))
                    .where(
                        and_(
                            Ticket.created_at >= day_start,
                            Ticket.created_at < day_end
                        )
                    )
                )
                day_tickets = day_tickets_result.scalar() or 0
                
                volume_trends.append({
                    "date": day_start.date().isoformat(),
                    "tickets": day_tickets
                })
            
            # Resolution time trends
            resolution_trends = []
            for i in range(0, period_days, 7):  # Weekly intervals
                week_start = start_date + timedelta(days=i)
                week_end = week_start + timedelta(days=7)
                
                week_resolution_result = await self.db.execute(
                    select(func.avg(
                        func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600
                    ))
                    .where(
                        and_(
                            Ticket.resolved_at >= week_start,
                            Ticket.resolved_at < week_end,
                            Ticket.resolved_at.isnot(None)
                        )
                    )
                )
                week_resolution = week_resolution_result.scalar() or 0.0
                
                resolution_trends.append({
                    "date": week_start.date().isoformat(),
                    "resolution_time_hours": round(week_resolution, 2)
                })
            
            # Category distribution
            category_distribution = {}
            for category in TicketCategory:
                count_result = await self.db.execute(
                    select(func.count(Ticket.id))
                    .where(
                        and_(
                            Ticket.category == category.value,
                            Ticket.created_at >= start_date
                        )
                    )
                )
                count = count_result.scalar() or 0
                if count > 0:
                    category_distribution[category.value] = count
            
            # Priority distribution
            priority_distribution = {}
            for priority in TicketPriority:
                count_result = await self.db.execute(
                    select(func.count(Ticket.id))
                    .where(
                        and_(
                            Ticket.priority == priority.value,
                            Ticket.created_at >= start_date
                        )
                    )
                )
                count = count_result.scalar() or 0
                if count > 0:
                    priority_distribution[priority.value] = count
            
            return {
                "period_days": period_days,
                "ticket_volume_trends": volume_trends,
                "resolution_time_trends": resolution_trends,
                "category_distribution": category_distribution,
                "priority_distribution": priority_distribution,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting helpdesk analytics: {e}")
            return {
                "period_days": period_days,
                "ticket_volume_trends": [],
                "resolution_time_trends": [],
                "category_distribution": {},
                "priority_distribution": {},
                "timestamp": datetime.utcnow().isoformat()
            }

    # Ticket Management
    async def get_tickets(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        assigned_agent_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated tickets with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Ticket)
            
            # Apply filters
            filters = []
            if status:
                filters.append(Ticket.status == status)
            if priority:
                filters.append(Ticket.priority == priority)
            if category:
                filters.append(Ticket.category == category)
            if assigned_agent_id:
                filters.append(Ticket.assigned_agent_id == assigned_agent_id)
            if search:
                filters.append(
                    or_(
                        Ticket.title.ilike(f"%{search}%"),
                        Ticket.description.ilike(f"%{search}%"),
                        Ticket.customer_name.ilike(f"%{search}%"),
                        Ticket.customer_email.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Ticket.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            tickets = result.scalars().all()
            
            return [self._serialize_ticket(ticket) for ticket in tickets]
        except Exception as e:
            print(f"Error getting tickets: {e}")
            return []

    async def create_ticket(self, ticket_data: TicketCreate, user_id: int) -> Dict:
        """Create a new ticket"""
        try:
            # Generate ticket number
            ticket_number = f"TKT-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            
            ticket = Ticket(
                ticket_number=ticket_number,
                customer_name=ticket_data.customer_name,
                customer_email=ticket_data.customer_email,
                customer_phone=ticket_data.customer_phone,
                customer_company=ticket_data.customer_company,
                title=ticket_data.title,
                description=ticket_data.description,
                category=ticket_data.category.value,
                priority=ticket_data.priority.value,
                source=ticket_data.source.value,
                tags=ticket_data.tags or [],
                attachments=ticket_data.attachments or [],
                created_by=user_id
            )
            
            self.db.add(ticket)
            await self.db.commit()
            await self.db.refresh(ticket)
            
            # Create activity log
            activity = TicketActivity(
                ticket_id=ticket.id,
                activity_type="created",
                description=f"Ticket created by {ticket_data.customer_name}",
                actor_name=ticket_data.customer_name,
                user_id=user_id
            )
            self.db.add(activity)
            await self.db.commit()
            
            return self._serialize_ticket(ticket)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating ticket: {e}")
            raise

    async def get_ticket_by_id(self, ticket_id: int) -> Optional[Dict]:
        """Get ticket by ID"""
        try:
            result = await self.db.execute(
                select(Ticket)
                .where(Ticket.id == ticket_id)
            )
            ticket = result.scalar_one_or_none()
            
            if ticket:
                return self._serialize_ticket(ticket)
            return None
        except Exception as e:
            print(f"Error getting ticket: {e}")
            return None

    async def update_ticket(self, ticket_id: int, ticket_data: TicketUpdate, user_id: int) -> Optional[Dict]:
        """Update ticket"""
        try:
            result = await self.db.execute(
                select(Ticket)
                .where(Ticket.id == ticket_id)
            )
            ticket = result.scalar_one_or_none()
            
            if not ticket:
                return None
            
            # Store old values for activity log
            old_status = ticket.status
            old_priority = ticket.priority
            old_agent_id = ticket.assigned_agent_id
            
            # Update fields
            update_data = ticket_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                if hasattr(ticket, field):
                    setattr(ticket, field, value.value if hasattr(value, 'value') else value)
            
            ticket.updated_at = datetime.utcnow()
            
            # Create activity logs for changes
            if ticket_data.status and ticket_data.status.value != old_status:
                activity = TicketActivity(
                    ticket_id=ticket_id,
                    activity_type="status_changed",
                    description=f"Status changed from {old_status} to {ticket_data.status.value}",
                    old_value=old_status,
                    new_value=ticket_data.status.value,
                    actor_name="System",
                    user_id=user_id
                )
                self.db.add(activity)
            
            if ticket_data.priority and ticket_data.priority.value != old_priority:
                activity = TicketActivity(
                    ticket_id=ticket_id,
                    activity_type="priority_changed",
                    description=f"Priority changed from {old_priority} to {ticket_data.priority.value}",
                    old_value=old_priority,
                    new_value=ticket_data.priority.value,
                    actor_name="System",
                    user_id=user_id
                )
                self.db.add(activity)
            
            if ticket_data.assigned_agent_id and ticket_data.assigned_agent_id != old_agent_id:
                activity = TicketActivity(
                    ticket_id=ticket_id,
                    activity_type="assigned",
                    description=f"Ticket assigned to agent {ticket_data.assigned_agent_id}",
                    old_value=str(old_agent_id) if old_agent_id else None,
                    new_value=str(ticket_data.assigned_agent_id),
                    actor_name="System",
                    user_id=user_id
                )
                self.db.add(activity)
            
            await self.db.commit()
            await self.db.refresh(ticket)
            
            return self._serialize_ticket(ticket)
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating ticket: {e}")
            raise

    async def delete_ticket(self, ticket_id: int) -> bool:
        """Delete ticket"""
        try:
            result = await self.db.execute(
                select(Ticket)
                .where(Ticket.id == ticket_id)
            )
            ticket = result.scalar_one_or_none()
            
            if not ticket:
                return False
            
            await self.db.delete(ticket)
            await self.db.commit()
            
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error deleting ticket: {e}")
            raise

    # Ticket Response Management
    async def get_ticket_responses(self, ticket_id: int) -> List[Dict]:
        """Get responses for a ticket"""
        try:
            result = await self.db.execute(
                select(TicketResponse)
                .where(TicketResponse.ticket_id == ticket_id)
                .order_by(desc(TicketResponse.created_at))
            )
            responses = result.scalars().all()
            
            return [self._serialize_ticket_response(response) for response in responses]
        except Exception as e:
            print(f"Error getting ticket responses: {e}")
            return []

    async def create_ticket_response(self, response_data: TicketResponseCreate, user_id: int, agent_id: Optional[int] = None) -> Dict:
        """Create a new ticket response"""
        try:
            # Get ticket and agent info
            ticket_result = await self.db.execute(
                select(Ticket)
                .where(Ticket.id == response_data.ticket_id)
            )
            ticket = ticket_result.scalar_one_or_none()
            
            if not ticket:
                raise ValueError("Ticket not found")
            
            # Determine author info
            if agent_id:
                agent_result = await self.db.execute(
                    select(SupportAgent)
                    .where(SupportAgent.id == agent_id)
                )
                agent = agent_result.scalar_one_or_none()
                author_name = agent.name if agent else "Unknown Agent"
                author_email = agent.email if agent else "unknown@example.com"
            else:
                author_name = ticket.customer_name
                author_email = ticket.customer_email
            
            response = TicketResponse(
                ticket_id=response_data.ticket_id,
                content=response_data.content,
                response_type=response_data.response_type.value,
                is_internal=response_data.is_internal,
                is_public=response_data.is_public,
                agent_id=agent_id,
                user_id=user_id,
                author_name=author_name,
                author_email=author_email,
                attachments=response_data.attachments or []
            )
            
            self.db.add(response)
            await self.db.commit()
            await self.db.refresh(response)
            
            # Update ticket last response time
            ticket.last_response_at = datetime.utcnow()
            if not ticket.first_response_at:
                ticket.first_response_at = datetime.utcnow()
            
            # Create activity log
            activity = TicketActivity(
                ticket_id=response_data.ticket_id,
                activity_type="response_added",
                description=f"Response added by {author_name}",
                actor_name=author_name,
                user_id=user_id,
                agent_id=agent_id
            )
            self.db.add(activity)
            await self.db.commit()
            
            return self._serialize_ticket_response(response)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating ticket response: {e}")
            raise

    # Knowledge Base Management
    async def get_knowledge_base_articles(
        self, 
        page: int = 1, 
        limit: int = 20,
        category: Optional[str] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated knowledge base articles"""
        try:
            offset = (page - 1) * limit
            
            query = select(KnowledgeBase)
            
            # Apply filters
            filters = []
            if category:
                filters.append(KnowledgeBase.category == category)
            if is_public is not None:
                filters.append(KnowledgeBase.is_public == is_public)
            if search:
                filters.append(
                    or_(
                        KnowledgeBase.title.ilike(f"%{search}%"),
                        KnowledgeBase.content.ilike(f"%{search}%"),
                        KnowledgeBase.summary.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.where(KnowledgeBase.status == "published").order_by(desc(KnowledgeBase.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            articles = result.scalars().all()
            
            return [self._serialize_knowledge_base(article) for article in articles]
        except Exception as e:
            print(f"Error getting knowledge base articles: {e}")
            return []

    async def create_knowledge_base_article(self, article_data: KnowledgeBaseCreate, user_id: int) -> Dict:
        """Create a new knowledge base article"""
        try:
            article = KnowledgeBase(
                title=article_data.title,
                content=article_data.content,
                summary=article_data.summary,
                category=article_data.category,
                tags=article_data.tags or [],
                keywords=article_data.keywords or [],
                is_public=article_data.is_public,
                is_featured=article_data.is_featured,
                status="draft",
                created_by=user_id
            )
            
            self.db.add(article)
            await self.db.commit()
            await self.db.refresh(article)
            
            return self._serialize_knowledge_base(article)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating knowledge base article: {e}")
            raise

    # Serialization methods
    def _serialize_ticket(self, ticket: Ticket) -> Dict:
        """Serialize ticket to dict"""
        return {
            "id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "customer_name": ticket.customer_name,
            "customer_email": ticket.customer_email,
            "customer_phone": ticket.customer_phone,
            "customer_company": ticket.customer_company,
            "title": ticket.title,
            "description": ticket.description,
            "category": ticket.category,
            "priority": ticket.priority,
            "status": ticket.status,
            "source": ticket.source,
            "assigned_agent_id": ticket.assigned_agent_id,
            "assigned_team_id": ticket.assigned_team_id,
            "satisfaction_score": ticket.satisfaction_score,
            "satisfaction_comment": ticket.satisfaction_comment,
            "tags": ticket.tags or [],
            "attachments": ticket.attachments or [],
            "ai_classification": ticket.ai_classification,
            "ai_priority_suggestion": ticket.ai_priority_suggestion,
            "ai_category_suggestion": ticket.ai_category_suggestion,
            "ai_summary": ticket.ai_summary,
            "sentiment_score": float(ticket.sentiment_score) if ticket.sentiment_score else None,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
            "first_response_at": ticket.first_response_at.isoformat() if ticket.first_response_at else None,
            "last_response_at": ticket.last_response_at.isoformat() if ticket.last_response_at else None,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None
        }

    def _serialize_ticket_response(self, response: TicketResponse) -> Dict:
        """Serialize ticket response to dict"""
        return {
            "id": response.id,
            "ticket_id": response.ticket_id,
            "content": response.content,
            "response_type": response.response_type,
            "is_internal": response.is_internal,
            "is_public": response.is_public,
            "agent_id": response.agent_id,
            "user_id": response.user_id,
            "author_name": response.author_name,
            "author_email": response.author_email,
            "email_sent": response.email_sent,
            "email_sent_at": response.email_sent_at.isoformat() if response.email_sent_at else None,
            "attachments": response.attachments or [],
            "ai_sentiment": float(response.ai_sentiment) if response.ai_sentiment else None,
            "ai_tone": response.ai_tone,
            "created_at": response.created_at.isoformat() if response.created_at else None,
            "updated_at": response.updated_at.isoformat() if response.updated_at else None
        }

    def _serialize_knowledge_base(self, article: KnowledgeBase) -> Dict:
        """Serialize knowledge base article to dict"""
        return {
            "id": article.id,
            "title": article.title,
            "content": article.content,
            "summary": article.summary,
            "category": article.category,
            "tags": article.tags or [],
            "keywords": article.keywords or [],
            "is_public": article.is_public,
            "is_featured": article.is_featured,
            "view_count": article.view_count,
            "status": article.status,
            "version": article.version,
            "created_at": article.created_at.isoformat() if article.created_at else None,
            "updated_at": article.updated_at.isoformat() if article.updated_at else None,
            "published_at": article.published_at.isoformat() if article.published_at else None,
            "created_by": article.created_by
        }



