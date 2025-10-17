"""
Cross-Module Integration Guide
Demonstrates how to integrate contact tracking and CRM features across all modules
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum

class ModuleType(Enum):
    """Available modules in the system"""
    CRM = "crm"
    SALES = "sales"
    PROJECT = "project"
    ACCOUNTING = "accounting"
    INVENTORY = "inventory"
    HR = "hr"
    DOCUMENTS = "documents"
    MANUFACTURING = "manufacturing"
    PURCHASE = "purchase"
    SUBSCRIPTIONS = "subscriptions"
    HELPDESK = "helpdesk"
    POS = "pos"
    RENTAL = "rental"
    TIMESHEETS = "timesheets"
    PLANNING = "planning"
    FIELD_SERVICE = "field_service"
    KNOWLEDGE = "knowledge"
    WEBSITE = "website"
    MARKETING = "marketing"
    EMAIL_MARKETING = "email_marketing"
    SOCIAL_MARKETING = "social_marketing"
    STUDIO = "studio"

class ActivityType(Enum):
    """Types of activities that can be tracked across modules"""
    # Sales Activities
    QUOTE_CREATED = "quote_created"
    QUOTE_SENT = "quote_sent"
    QUOTE_ACCEPTED = "quote_accepted"
    QUOTE_REJECTED = "quote_rejected"
    ORDER_CREATED = "order_created"
    ORDER_COMPLETED = "order_completed"
    PAYMENT_RECEIVED = "payment_received"
    
    # Project Activities
    PROJECT_CREATED = "project_created"
    PROJECT_STARTED = "project_started"
    PROJECT_MILESTONE_REACHED = "project_milestone_reached"
    PROJECT_COMPLETED = "project_completed"
    TASK_ASSIGNED = "task_assigned"
    TASK_COMPLETED = "task_completed"
    
    # Communication Activities
    EMAIL_SENT = "email_sent"
    EMAIL_OPENED = "email_opened"
    EMAIL_CLICKED = "email_clicked"
    CALL_MADE = "call_made"
    MEETING_SCHEDULED = "meeting_scheduled"
    MEETING_COMPLETED = "meeting_completed"
    
    # Document Activities
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_DOWNLOADED = "document_downloaded"
    DOCUMENT_SHARED = "document_shared"
    CONTRACT_SIGNED = "contract_signed"
    
    # Support Activities
    TICKET_CREATED = "ticket_created"
    TICKET_RESOLVED = "ticket_resolved"
    SUPPORT_CALL = "support_call"
    
    # Marketing Activities
    CAMPAIGN_LAUNCHED = "campaign_launched"
    EMAIL_SUBSCRIBED = "email_subscribed"
    EMAIL_UNSUBSCRIBED = "email_unsubscribed"
    SOCIAL_ENGAGEMENT = "social_engagement"
    
    # CRM Activities
    CONTACT_CREATED = "contact_created"
    CONTACT_UPDATED = "contact_updated"
    DEAL_CREATED = "deal_created"
    DEAL_WON = "deal_won"
    DEAL_LOST = "deal_lost"

class CrossModuleIntegration:
    """
    Main integration class that handles cross-module communication and data sharing
    
    This class provides:
    1. Universal contact tracking across all modules
    2. Cross-module data enrichment
    3. AI-powered insights across modules
    4. Automated workflow triggers
    5. Unified reporting and analytics
    """
    
    def __init__(self):
        self.module_registry = {}
        self.activity_handlers = {}
        
    def register_module(self, module_type: ModuleType, module_instance):
        """Register a module for cross-module integration"""
        self.module_registry[module_type] = module_instance
        print(f"✅ Module {module_type.value} registered for cross-module integration")
    
    def track_activity(self, 
                      contact_id: int,
                      activity_type: ActivityType,
                      module: ModuleType,
                      details: Dict[str, Any] = None,
                      metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Track an activity across modules
        
        This is the central method that all modules use to track contact activities
        """
        activity_data = {
            "contact_id": contact_id,
            "activity_type": activity_type.value,
            "module": module.value,
            "details": details or {},
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
            "processed": False
        }
        
        # In a real implementation, this would:
        # 1. Store the activity in the database
        # 2. Trigger any relevant workflows
        # 3. Update contact engagement metrics
        # 4. Send real-time notifications
        
        print(f"📊 Activity tracked: {activity_type.value} in {module.value} for contact {contact_id}")
        
        # Mock processing
        self._process_activity(activity_data)
        
        return activity_data
    
    def _process_activity(self, activity_data: Dict[str, Any]):
        """Process a tracked activity and trigger relevant workflows"""
        contact_id = activity_data["contact_id"]
        activity_type = activity_data["activity_type"]
        module = activity_data["module"]
        
        # Update contact engagement metrics
        self._update_engagement_metrics(contact_id, activity_type)
        
        # Trigger automated workflows
        self._trigger_workflows(contact_id, activity_type, module)
        
        # Update cross-module insights
        self._update_cross_module_insights(contact_id)
        
    def _update_engagement_metrics(self, contact_id: int, activity_type: str):
        """Update contact engagement metrics based on activity"""
        # Mock implementation - would update CRM database
        print(f"📈 Updated engagement metrics for contact {contact_id} based on {activity_type}")
    
    def _trigger_workflows(self, contact_id: int, activity_type: str, module: str):
        """Trigger automated workflows based on activity"""
        workflows = self._get_workflows_for_activity(activity_type, module)
        
        for workflow in workflows:
            print(f"🔄 Triggering workflow: {workflow['name']} for contact {contact_id}")
            # Execute workflow logic
    
    def _get_workflows_for_activity(self, activity_type: str, module: str) -> List[Dict[str, Any]]:
        """Get workflows that should be triggered for a specific activity"""
        # Mock workflow definitions
        workflows = {
            "quote_created": [
                {"name": "Send Quote Confirmation", "module": "email_marketing"},
                {"name": "Schedule Follow-up Reminder", "module": "crm"}
            ],
            "project_completed": [
                {"name": "Request Client Feedback", "module": "crm"},
                {"name": "Send Invoice", "module": "accounting"},
                {"name": "Create Case Study", "module": "marketing"}
            ],
            "payment_received": [
                {"name": "Send Payment Confirmation", "module": "email_marketing"},
                {"name": "Update Deal Status", "module": "crm"},
                {"name": "Generate Receipt", "module": "accounting"}
            ]
        }
        
        return workflows.get(activity_type, [])
    
    def _update_cross_module_insights(self, contact_id: int):
        """Update cross-module insights for a contact"""
        print(f"🧠 Updated cross-module insights for contact {contact_id}")
    
    def get_contact_360_view(self, contact_id: int) -> Dict[str, Any]:
        """
        Get a 360-degree view of a contact across all modules
        
        This would typically aggregate data from:
        - CRM (contact info, lead score, activities)
        - Sales (quotes, orders, revenue)
        - Projects (active projects, history, performance)
        - Support (tickets, satisfaction)
        - Marketing (campaigns, engagement)
        - Accounting (payments, outstanding balances)
        """
        # Mock implementation
        return {
            "contact_id": contact_id,
            "basic_info": {
                "name": "John Doe",
                "email": "john@example.com",
                "company": "Acme Corp",
                "lead_score": 85,
                "status": "qualified"
            },
            "sales_data": {
                "total_quotes": 15,
                "quotes_accepted": 8,
                "total_orders": 12,
                "total_revenue": 45000.00,
                "average_deal_size": 3750.00,
                "last_quote": "2024-01-15"
            },
            "project_data": {
                "active_projects": 2,
                "completed_projects": 8,
                "total_project_value": 125000.00,
                "satisfaction_score": 4.6,
                "on_time_delivery": 92
            },
            "support_data": {
                "total_tickets": 5,
                "resolved_tickets": 4,
                "average_resolution_time": "2.5 hours",
                "satisfaction_rating": 4.8
            },
            "marketing_data": {
                "email_engagement": 85,
                "campaign_interactions": 23,
                "social_mentions": 8,
                "website_visits": 45
            },
            "accounting_data": {
                "outstanding_balance": 0,
                "payment_history": "excellent",
                "credit_limit": 50000.00,
                "last_payment": "2024-01-10"
            },
            "ai_insights": {
                "churn_risk": "low",
                "upsell_opportunity": "high",
                "recommended_actions": [
                    "Follow up on recent quote",
                    "Offer premium support package",
                    "Schedule quarterly review"
                ],
                "next_best_action": {
                    "action": "Schedule demo call",
                    "channel": "phone",
                    "timing": "within 48 hours",
                    "confidence": 0.85
                }
            }
        }
    
    def get_cross_module_analytics(self, 
                                  date_range: Dict[str, str] = None,
                                  modules: List[ModuleType] = None) -> Dict[str, Any]:
        """
        Get analytics across multiple modules
        
        This would typically provide:
        - Cross-module performance metrics
        - Contact journey analysis
        - Revenue attribution by module
        - Customer lifetime value analysis
        """
        return {
            "date_range": date_range or {"start": "2024-01-01", "end": "2024-01-31"},
            "modules_analyzed": [m.value for m in (modules or list(ModuleType))],
            "metrics": {
                "total_contacts": 1250,
                "cross_module_engagement": 78,
                "revenue_by_module": {
                    "sales": 45000,
                    "projects": 125000,
                    "subscriptions": 15000
                },
                "conversion_funnel": {
                    "leads": 500,
                    "qualified": 300,
                    "proposals": 150,
                    "won": 75,
                    "conversion_rate": 15
                }
            },
            "insights": [
                "Sales module shows highest engagement",
                "Project completion correlates with repeat business",
                "Email marketing drives 40% of new leads"
            ]
        }

# Global instance for cross-module integration
cross_module = CrossModuleIntegration()

# Example usage in any module:
"""
from src.core.cross_module_integration import cross_module, ActivityType, ModuleType

# Track an activity
cross_module.track_activity(
    contact_id=123,
    activity_type=ActivityType.QUOTE_CREATED,
    module=ModuleType.SALES,
    details={"quote_id": 456, "amount": 5000.00}
)

# Get 360-degree view
contact_view = cross_module.get_contact_360_view(123)

# Get cross-module analytics
analytics = cross_module.get_cross_module_analytics()
"""


