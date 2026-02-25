"""
Dashboard endpoints for FusionAI Enterprise Suite
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter()


class StatItem(BaseModel):
    title: str
    value: str
    change: str
    trend: str
    icon: str
    color: str


class ActivityItem(BaseModel):
    id: str
    type: str
    message: str
    time: str
    user: str


class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: str


@router.get("/stats", response_model=List[StatItem])
async def get_dashboard_stats():
    """Get dashboard statistics."""
    try:
        stats = [
            {
                "title": "Total Revenue",
                "value": "$125,430",
                "change": "+12.5%",
                "trend": "up",
                "icon": "DollarSign",
                "color": "text-green-400"
            },
            {
                "title": "Active Users",
                "value": "2,847",
                "change": "+8.2%",
                "trend": "up",
                "icon": "Users",
                "color": "text-blue-400"
            },
            {
                "title": "Orders",
                "value": "1,234",
                "change": "+15.3%",
                "trend": "up",
                "icon": "BarChart3",
                "color": "text-purple-400"
            },
            {
                "title": "Growth Rate",
                "value": "23.1%",
                "change": "+2.1%",
                "trend": "up",
                "icon": "TrendingUp",
                "color": "text-pink-400"
            }
        ]
        
        return [StatItem(**stat) for stat in stats]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activity", response_model=List[ActivityItem])
async def get_recent_activity():
    """Get recent activity feed."""
    try:
        activities = [
            {
                "id": "1",
                "type": "invoice",
                "message": "New invoice #INV-001 created",
                "time": "2 minutes ago",
                "user": "John Doe"
            },
            {
                "id": "2",
                "type": "customer",
                "message": "Customer ABC Corp updated",
                "time": "15 minutes ago",
                "user": "Jane Smith"
            },
            {
                "id": "3",
                "type": "order",
                "message": "Order #ORD-456 completed",
                "time": "1 hour ago",
                "user": "Mike Johnson"
            },
            {
                "id": "4",
                "type": "payment",
                "message": "Payment received for invoice #INV-002",
                "time": "2 hours ago",
                "user": "Sarah Wilson"
            },
            {
                "id": "5",
                "type": "project",
                "message": "Project 'Website Redesign' milestone completed",
                "time": "3 hours ago",
                "user": "Alex Brown"
            }
        ]
        
        return [ActivityItem(**activity) for activity in activities]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications", response_model=List[NotificationItem])
async def get_notifications():
    """Get user notifications."""
    try:
        notifications = [
            {
                "id": "1",
                "title": "New Invoice",
                "message": "Invoice #INV-001 has been created and is ready for review",
                "type": "info",
                "read": False,
                "created_at": "2024-01-15T10:00:00Z"
            },
            {
                "id": "2",
                "title": "Payment Received",
                "message": "Payment of $1,250.00 received from ABC Corp",
                "type": "success",
                "read": False,
                "created_at": "2024-01-15T09:30:00Z"
            },
            {
                "id": "3",
                "title": "Low Stock Alert",
                "message": "Product 'Widget A' is running low on stock (5 remaining)",
                "type": "warning",
                "read": True,
                "created_at": "2024-01-15T08:15:00Z"
            },
            {
                "id": "4",
                "title": "System Update",
                "message": "System will be updated tonight at 2:00 AM EST",
                "type": "info",
                "read": True,
                "created_at": "2024-01-14T16:00:00Z"
            }
        ]
        
        return [NotificationItem(**notification) for notification in notifications]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




