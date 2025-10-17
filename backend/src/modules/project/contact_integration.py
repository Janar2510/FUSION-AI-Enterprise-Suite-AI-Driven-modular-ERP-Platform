"""
Project Module - Contact Integration
Demonstrates how to integrate contact tracking across modules
"""

from functools import wraps
from typing import Optional, Dict, Any, List
from datetime import datetime

class ContactIntegration:
    """Handles contact tracking integration for Project module"""
    
    @staticmethod
    def track_project_activity(activity_type: str, client_id: Optional[int] = None, project_id: Optional[int] = None):
        """
        Decorator to track project activities for contact management
        
        Usage:
        @ContactIntegration.track_project_activity("PROJECT_STARTED", client_id=project.client_id)
        async def start_project(project_id: int, ...):
            # project start logic
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Execute the original function
                result = await func(*args, **kwargs)
                
                # Track the activity (mock implementation)
                try:
                    print(f"📊 Contact Activity Tracked: {activity_type} for client {client_id}, project {project_id}")
                except Exception as e:
                    print(f"Warning: Contact tracking failed: {e}")
                
                return result
            return wrapper
        return decorator

    @staticmethod
    def get_client_project_insights(client_id: int) -> Dict[str, Any]:
        """
        Get cross-module insights for a client across all their projects
        
        This would typically query multiple systems for:
        - Project history and performance
        - Budget and billing information
        - Communication patterns
        - Satisfaction scores
        - Upcoming deadlines
        """
        return {
            "client_id": client_id,
            "active_projects": 3,
            "completed_projects": 12,
            "total_project_value": 125000.00,
            "average_project_duration": 45,  # days
            "on_time_delivery_rate": 92,
            "client_satisfaction_score": 4.6,
            "communication_frequency": "high",
            "preferred_communication_channel": "email",
            "last_communication": "2024-01-20",
            "upcoming_deadlines": [
                {"project": "Website Redesign", "deadline": "2024-02-15", "status": "on_track"},
                {"project": "Mobile App", "deadline": "2024-03-01", "status": "at_risk"}
            ],
            "recommended_actions": [
                "Schedule weekly check-in call",
                "Prepare project status report",
                "Discuss upcoming project opportunities"
            ]
        }

    @staticmethod
    def enrich_project_data(project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich project data with client insights from CRM
        
        This would typically:
        1. Look up client in CRM system
        2. Add project history
        3. Add communication preferences
        4. Add risk indicators
        """
        client_id = project_data.get('client_id')
        if not client_id:
            return project_data
            
        # Get client insights
        insights = ContactIntegration.get_client_project_insights(client_id)
        
        # Enrich the project data
        enriched_data = {
            **project_data,
            "client_insights": {
                "client_tier": "premium" if insights.get("total_project_value", 0) > 100000 else "standard",
                "communication_preferences": {
                    "channel": insights.get("preferred_communication_channel"),
                    "frequency": insights.get("communication_frequency")
                },
                "performance_metrics": {
                    "satisfaction_score": insights.get("client_satisfaction_score"),
                    "on_time_rate": insights.get("on_time_delivery_rate"),
                    "average_duration": insights.get("average_project_duration")
                },
                "recommended_actions": insights.get("recommended_actions", [])
            }
        }
        
        return enriched_data

    @staticmethod
    def get_project_team_insights(project_id: int) -> Dict[str, Any]:
        """
        Get insights about project team members and their contact engagement
        
        This would help project managers understand:
        - Team member availability
        - Communication patterns
        - Skill utilization
        - Performance metrics
        """
        return {
            "project_id": project_id,
            "team_size": 5,
            "team_members": [
                {
                    "id": 1,
                    "name": "John Doe",
                    "role": "Lead Developer",
                    "engagement_score": 95,
                    "availability": "high",
                    "last_activity": "2024-01-20"
                },
                {
                    "id": 2,
                    "name": "Jane Smith", 
                    "role": "UI/UX Designer",
                    "engagement_score": 88,
                    "availability": "medium",
                    "last_activity": "2024-01-19"
                }
            ],
            "team_performance": {
                "overall_engagement": 91,
                "communication_frequency": "daily",
                "collaboration_score": 87
            },
            "recommendations": [
                "Schedule team retrospective",
                "Recognize high-performing team members",
                "Address any communication gaps"
            ]
        }

# Example usage in project endpoints:
"""
# In project/api.py:

from .contact_integration import ContactIntegration

@router.post("/projects", response_model=ProjectResponse)
@ContactIntegration.track_project_activity("PROJECT_CREATED", client_id=project.client_id)
async def create_project(project: ProjectCreate, ...):
    # Project creation logic
    pass

@router.put("/projects/{project_id}/start")
@ContactIntegration.track_project_activity("PROJECT_STARTED", project_id=project_id)
async def start_project(project_id: int, ...):
    # Project start logic
    pass

@router.get("/projects/{project_id}/team-insights")
async def get_project_team_insights(project_id: int):
    insights = ContactIntegration.get_project_team_insights(project_id)
    return {"project_id": project_id, "team_insights": insights}
"""


