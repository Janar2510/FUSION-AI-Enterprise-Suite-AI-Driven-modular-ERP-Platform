"""
Dashboard Module API Endpoints
Handles dashboard widgets, AI insights, and analytics
"""

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import asyncio
from contextlib import asynccontextmanager

from ...core.database import get_db
from ...core.auth import get_current_user
from ...core.websocket import ConnectionManager
from ...core.global_metrics import GlobalMetricsService
from .models import (
    DashboardWidget, AIInsight, DashboardLayout, DashboardAnalytics,
    WidgetCreate, WidgetUpdate, InsightCreate, InsightResponse, 
    WidgetResponse, DashboardData
)
from .agents_simple import DashboardAgent

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# WebSocket connection manager
manager = ConnectionManager()

# Initialize Dashboard AI Agent
dashboard_agent = DashboardAgent()


@router.get("/", response_model=DashboardData)
async def get_dashboard(
    user_id: Optional[int] = None,
    layout_id: Optional[int] = None,
    include_insights: bool = True,
    include_analytics: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get complete dashboard data for a user
    """
    try:
        # Get user's widgets
        query = db.query(DashboardWidget).filter(DashboardWidget.is_active == True)
        
        if user_id:
            query = query.filter(DashboardWidget.created_by == user_id)
        elif not current_user.is_admin:
            # Non-admin users only see their own widgets or public widgets
            query = query.filter(
                (DashboardWidget.created_by == current_user.id) | 
                (DashboardWidget.is_public == True)
            )
        
        widgets = query.all()
        
        # Get AI insights if requested
        insights = []
        if include_insights:
            widget_ids = [w.id for w in widgets]
            insights_query = db.query(AIInsight).filter(
                AIInsight.is_active == True,
                AIInsight.widget_id.in_(widget_ids) if widget_ids else True
            )
            insights = insights_query.all()
        
        # Get analytics data if requested
        analytics = {}
        if include_analytics:
            # Get recent analytics for all widgets
            for widget in widgets:
                recent_analytics = db.query(DashboardAnalytics).filter(
                    DashboardAnalytics.widget_id == widget.id,
                    DashboardAnalytics.timestamp >= datetime.utcnow() - timedelta(hours=24)
                ).order_by(DashboardAnalytics.timestamp.desc()).limit(100).all()
                
                analytics[str(widget.id)] = {
                    "metrics": [a.metric_name for a in recent_analytics],
                    "data": [a.to_dict() for a in recent_analytics]
                }
        
        # Get layout if specified
        layout = None
        if layout_id:
            layout_obj = db.query(DashboardLayout).filter(
                DashboardLayout.id == layout_id,
                DashboardLayout.user_id == current_user.id
            ).first()
            if layout_obj:
                layout = layout_obj.layout_config
        
        return DashboardData(
            widgets=[WidgetResponse(**widget.to_dict()) for widget in widgets],
            insights=[InsightResponse(**insight.to_dict()) for insight in insights],
            layout=layout,
            analytics=analytics
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard: {str(e)}")


@router.post("/widgets", response_model=WidgetResponse)
async def add_widget(
    widget_data: WidgetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new dashboard widget
    """
    try:
        # Create widget
        widget = DashboardWidget(
            title=widget_data.title,
            description=widget_data.description,
            widget_type=widget_data.widget_type,
            position_x=widget_data.position_x,
            position_y=widget_data.position_y,
            width=widget_data.width,
            height=widget_data.height,
            config=widget_data.config or {},
            data_source=widget_data.data_source,
            refresh_interval=widget_data.refresh_interval,
            theme=widget_data.theme,
            color_scheme=widget_data.color_scheme,
            is_public=widget_data.is_public,
            created_by=current_user.id
        )
        
        db.add(widget)
        db.commit()
        db.refresh(widget)
        
        # Generate AI insights for the new widget
        await dashboard_agent.generate_insights_for_widget(widget, db)
        
        return WidgetResponse(**widget.to_dict())
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create widget: {str(e)}")


@router.put("/widgets/{widget_id}", response_model=WidgetResponse)
async def update_widget(
    widget_id: int,
    widget_data: WidgetUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update a dashboard widget
    """
    try:
        widget = db.query(DashboardWidget).filter(
            DashboardWidget.id == widget_id,
            DashboardWidget.created_by == current_user.id
        ).first()
        
        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")
        
        # Update fields
        update_data = widget_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(widget, field, value)
        
        widget.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(widget)
        
        return WidgetResponse(**widget.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update widget: {str(e)}")


@router.delete("/widgets/{widget_id}")
async def delete_widget(
    widget_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete a dashboard widget
    """
    try:
        widget = db.query(DashboardWidget).filter(
            DashboardWidget.id == widget_id,
            DashboardWidget.created_by == current_user.id
        ).first()
        
        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")
        
        # Soft delete
        widget.is_active = False
        db.commit()
        
        return {"message": "Widget deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete widget: {str(e)}")


@router.get("/insights", response_model=List[InsightResponse])
async def get_ai_insights(
    widget_id: Optional[int] = None,
    insight_type: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get AI insights with optional filtering
    """
    try:
        query = db.query(AIInsight).filter(AIInsight.is_active == True)
        
        if widget_id:
            query = query.filter(AIInsight.widget_id == widget_id)
        
        if insight_type:
            query = query.filter(AIInsight.insight_type == insight_type)
        
        if priority:
            query = query.filter(AIInsight.priority == priority)
        
        # Filter by user's widgets
        user_widgets = db.query(DashboardWidget.id).filter(
            (DashboardWidget.created_by == current_user.id) | 
            (DashboardWidget.is_public == True)
        ).subquery()
        
        query = query.filter(AIInsight.widget_id.in_(user_widgets))
        
        insights = query.order_by(AIInsight.generated_at.desc()).offset(offset).limit(limit).all()
        
        return [InsightResponse(**insight.to_dict()) for insight in insights]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch insights: {str(e)}")


@router.post("/insights", response_model=InsightResponse)
async def create_insight(
    insight_data: InsightCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new AI insight
    """
    try:
        insight = AIInsight(
            widget_id=insight_data.widget_id,
            title=insight_data.title,
            content=insight_data.content,
            insight_type=insight_data.insight_type,
            confidence_score=insight_data.confidence_score,
            data_period=insight_data.data_period,
            metrics=insight_data.metrics,
            recommendations=insight_data.recommendations,
            model_used=insight_data.model_used,
            priority=insight_data.priority
        )
        
        db.add(insight)
        db.commit()
        db.refresh(insight)
        
        return InsightResponse(**insight.to_dict())
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create insight: {str(e)}")


@router.put("/insights/{insight_id}/acknowledge")
async def acknowledge_insight(
    insight_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Acknowledge an AI insight
    """
    try:
        insight = db.query(AIInsight).filter(AIInsight.id == insight_id).first()
        
        if not insight:
            raise HTTPException(status_code=404, detail="Insight not found")
        
        insight.is_acknowledged = True
        insight.acknowledged_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Insight acknowledged successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to acknowledge insight: {str(e)}")


@router.get("/analytics/{widget_id}")
async def get_widget_analytics(
    widget_id: int,
    hours: int = Query(24, ge=1, le=168),  # 1 hour to 1 week
    metric_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get analytics data for a specific widget
    """
    try:
        # Verify widget access
        widget = db.query(DashboardWidget).filter(
            DashboardWidget.id == widget_id,
            (DashboardWidget.created_by == current_user.id) | 
            (DashboardWidget.is_public == True)
        ).first()
        
        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")
        
        # Get analytics data
        query = db.query(DashboardAnalytics).filter(
            DashboardAnalytics.widget_id == widget_id,
            DashboardAnalytics.timestamp >= datetime.utcnow() - timedelta(hours=hours)
        )
        
        if metric_name:
            query = query.filter(DashboardAnalytics.metric_name == metric_name)
        
        analytics = query.order_by(DashboardAnalytics.timestamp.desc()).all()
        
        return {
            "widget_id": widget_id,
            "period_hours": hours,
            "data_points": len(analytics),
            "metrics": [a.to_dict() for a in analytics]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.post("/analytics/{widget_id}")
async def add_analytics_data(
    widget_id: int,
    metric_name: str,
    metric_value: float,
    metric_unit: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    tags: Optional[List[str]] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Add analytics data for a widget
    """
    try:
        # Verify widget access
        widget = db.query(DashboardWidget).filter(
            DashboardWidget.id == widget_id,
            (DashboardWidget.created_by == current_user.id) | 
            (DashboardWidget.is_public == True)
        ).first()
        
        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")
        
        # Create analytics entry
        analytics = DashboardAnalytics(
            widget_id=widget_id,
            metric_name=metric_name,
            metric_value=metric_value,
            metric_unit=metric_unit,
            context=context,
            tags=tags
        )
        
        db.add(analytics)
        db.commit()
        
        return {"message": "Analytics data added successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add analytics: {str(e)}")


@router.websocket("/ws")
async def dashboard_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time dashboard updates
    """
    await manager.connect(websocket)
    try:
        while True:
            # Send periodic updates
            await asyncio.sleep(30)  # Update every 30 seconds
            
            # Get latest insights and send to client
            # This would typically fetch from database
            update_data = {
                "type": "dashboard_update",
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Dashboard data updated"
            }
            
            await manager.send_personal_message(json.dumps(update_data), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.get("/health")
async def dashboard_health():
    """
    Dashboard module health check
    """
    return {
        "status": "healthy",
        "module": "dashboard",
        "timestamp": datetime.utcnow().isoformat(),
        "ai_agent_status": "active" if dashboard_agent else "inactive"
    }


@router.post("/generate-insights")
async def generate_insights(
    widget_ids: Optional[List[int]] = None,
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate AI insights for widgets
    """
    try:
        if widget_ids:
            widgets = db.query(DashboardWidget).filter(
                DashboardWidget.id.in_(widget_ids),
                (DashboardWidget.created_by == current_user.id) | 
                (DashboardWidget.is_public == True)
            ).all()
        else:
            # Generate for all user's widgets
            widgets = db.query(DashboardWidget).filter(
                (DashboardWidget.created_by == current_user.id) | 
                (DashboardWidget.is_public == True),
                DashboardWidget.is_active == True
            ).all()
        
        insights_generated = 0
        for widget in widgets:
            new_insights = await dashboard_agent.generate_insights_for_widget(widget, db)
            insights_generated += len(new_insights)
        
        return {
            "message": f"Generated {insights_generated} insights for {len(widgets)} widgets",
            "widgets_processed": len(widgets),
            "insights_generated": insights_generated
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@router.get("/templates")
async def get_widget_templates():
    """
    Get available widget templates
    """
    templates = [
        {
            "id": "kpi_card",
            "name": "KPI Card",
            "type": "kpi",
            "description": "Display key performance indicators",
            "default_config": {
                "show_trend": True,
                "show_percentage": True,
                "color_scheme": "purple"
            },
            "default_size": {"width": 3, "height": 2}
        },
        {
            "id": "line_chart",
            "name": "Line Chart",
            "type": "chart",
            "description": "Time series line chart",
            "default_config": {
                "chart_type": "line",
                "show_legend": True,
                "show_grid": True
            },
            "default_size": {"width": 6, "height": 4}
        },
        {
            "id": "ai_insights",
            "name": "AI Insights Panel",
            "type": "ai_insight",
            "description": "AI-generated insights and recommendations",
            "default_config": {
                "auto_refresh": True,
                "show_confidence": True,
                "max_insights": 5
            },
            "default_size": {"width": 4, "height": 6}
        },
        {
            "id": "data_table",
            "name": "Data Table",
            "type": "table",
            "description": "Tabular data display",
            "default_config": {
                "sortable": True,
                "filterable": True,
                "page_size": 10
            },
            "default_size": {"width": 8, "height": 5}
        }
    ]
    
    return {"templates": templates}


@router.get("/global-metrics")
async def get_global_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get global metrics across all modules
    """
    try:
        metrics_service = GlobalMetricsService(db)
        global_metrics = metrics_service.get_global_dashboard_metrics()
        
        return {
            "status": "success",
            "data": global_metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch global metrics: {str(e)}")

