"""
Dashboard Module Services
Business logic for dashboard operations, analytics, and AI insights
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import json
import asyncio
from dataclasses import dataclass
from enum import Enum

from .models import (
    DashboardWidget, AIInsight, DashboardLayout, DashboardAnalytics,
    WidgetType, InsightType
)
from .agents import DashboardAgent


class AnalyticsPeriod(str, Enum):
    """Analytics data periods"""
    HOUR = "1h"
    DAY = "1d"
    WEEK = "1w"
    MONTH = "1M"
    QUARTER = "1Q"
    YEAR = "1Y"


@dataclass
class WidgetMetrics:
    """Widget performance metrics"""
    widget_id: int
    total_views: int
    avg_load_time: float
    error_rate: float
    last_updated: datetime
    data_points: int


@dataclass
class InsightSummary:
    """AI insight summary"""
    total_insights: int
    high_priority: int
    unacknowledged: int
    avg_confidence: float
    recent_insights: List[Dict[str, Any]]


class DashboardService:
    """Main dashboard service class"""
    
    def __init__(self, db: Session):
        self.db = db
        self.agent = DashboardAgent()
    
    async def create_widget(
        self, 
        title: str, 
        widget_type: str, 
        user_id: int,
        config: Optional[Dict[str, Any]] = None,
        position: Optional[Dict[str, int]] = None
    ) -> DashboardWidget:
        """Create a new dashboard widget with validation"""
        
        # Validate widget type
        if widget_type not in [t.value for t in WidgetType]:
            raise ValueError(f"Invalid widget type: {widget_type}")
        
        # Set default position
        if not position:
            position = {"x": 0, "y": 0, "width": 4, "height": 3}
        
        # Create widget
        widget = DashboardWidget(
            title=title,
            widget_type=widget_type,
            position_x=position.get("x", 0),
            position_y=position.get("y", 0),
            width=position.get("width", 4),
            height=position.get("height", 3),
            config=config or {},
            created_by=user_id
        )
        
        self.db.add(widget)
        self.db.commit()
        self.db.refresh(widget)
        
        # Generate initial AI insights
        await self._generate_initial_insights(widget)
        
        return widget
    
    async def update_widget_layout(
        self, 
        widget_id: int, 
        user_id: int,
        position: Dict[str, int]
    ) -> bool:
        """Update widget position and size"""
        
        widget = self.db.query(DashboardWidget).filter(
            DashboardWidget.id == widget_id,
            DashboardWidget.created_by == user_id
        ).first()
        
        if not widget:
            return False
        
        widget.position_x = position.get("x", widget.position_x)
        widget.position_y = position.get("y", widget.position_y)
        widget.width = position.get("width", widget.width)
        widget.height = position.get("height", widget.height)
        widget.updated_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    async def get_widget_data(
        self, 
        widget_id: int, 
        user_id: int,
        period: AnalyticsPeriod = AnalyticsPeriod.DAY
    ) -> Dict[str, Any]:
        """Get data for a specific widget"""
        
        widget = self.db.query(DashboardWidget).filter(
            DashboardWidget.id == widget_id,
            (DashboardWidget.created_by == user_id) | 
            (DashboardWidget.is_public == True)
        ).first()
        
        if not widget:
            raise ValueError("Widget not found or access denied")
        
        # Get analytics data based on period
        start_time = self._get_period_start(period)
        analytics = self.db.query(DashboardAnalytics).filter(
            DashboardAnalytics.widget_id == widget_id,
            DashboardAnalytics.timestamp >= start_time
        ).order_by(DashboardAnalytics.timestamp.desc()).all()
        
        # Process data based on widget type
        if widget.widget_type == "kpi":
            return await self._process_kpi_data(widget, analytics)
        elif widget.widget_type == "chart":
            return await self._process_chart_data(widget, analytics)
        elif widget.widget_type == "table":
            return await self._process_table_data(widget, analytics)
        elif widget.widget_type == "ai_insight":
            return await self._process_ai_insight_data(widget)
        else:
            return {"error": "Unknown widget type"}
    
    async def generate_insights_for_widget(
        self, 
        widget: DashboardWidget,
        force_refresh: bool = False
    ) -> List[AIInsight]:
        """Generate AI insights for a specific widget"""
        
        # Check if insights already exist and are recent
        if not force_refresh:
            recent_insights = self.db.query(AIInsight).filter(
                AIInsight.widget_id == widget.id,
                AIInsight.generated_at >= datetime.utcnow() - timedelta(hours=1)
            ).count()
            
            if recent_insights > 0:
                return []
        
        # Get widget data for analysis
        analytics = self.db.query(DashboardAnalytics).filter(
            DashboardAnalytics.widget_id == widget.id,
            DashboardAnalytics.timestamp >= datetime.utcnow() - timedelta(days=30)
        ).all()
        
        # Generate insights using AI agent
        insights = await self.agent.analyze_widget_data(widget, analytics)
        
        # Save insights to database
        saved_insights = []
        for insight_data in insights:
            insight = AIInsight(
                widget_id=widget.id,
                title=insight_data.get("title", "AI Insight"),
                content=insight_data.get("content", ""),
                insight_type=insight_data.get("type", "recommendation"),
                confidence_score=insight_data.get("confidence", 0.5),
                data_period=insight_data.get("period", "last_30_days"),
                metrics=insight_data.get("metrics", {}),
                recommendations=insight_data.get("recommendations", []),
                model_used=insight_data.get("model", "gpt-4"),
                priority=insight_data.get("priority", "medium")
            )
            
            self.db.add(insight)
            saved_insights.append(insight)
        
        self.db.commit()
        return saved_insights
    
    async def get_dashboard_summary(
        self, 
        user_id: int
    ) -> Dict[str, Any]:
        """Get comprehensive dashboard summary"""
        
        # Get user's widgets
        widgets = self.db.query(DashboardWidget).filter(
            (DashboardWidget.created_by == user_id) | 
            (DashboardWidget.is_public == True),
            DashboardWidget.is_active == True
        ).all()
        
        # Get insights summary
        insights = self.db.query(AIInsight).filter(
            AIInsight.widget_id.in_([w.id for w in widgets]),
            AIInsight.is_active == True
        ).all()
        
        # Calculate metrics
        total_widgets = len(widgets)
        total_insights = len(insights)
        high_priority_insights = len([i for i in insights if i.priority == "high"])
        unacknowledged_insights = len([i for i in insights if not i.is_acknowledged])
        
        avg_confidence = sum(i.confidence_score for i in insights) / len(insights) if insights else 0
        
        # Get recent activity
        recent_insights = [
            {
                "id": i.id,
                "title": i.title,
                "type": i.insight_type,
                "confidence": i.confidence_score,
                "generated_at": i.generated_at.isoformat()
            }
            for i in sorted(insights, key=lambda x: x.generated_at, reverse=True)[:5]
        ]
        
        return {
            "total_widgets": total_widgets,
            "insights": {
                "total": total_insights,
                "high_priority": high_priority_insights,
                "unacknowledged": unacknowledged_insights,
                "avg_confidence": round(avg_confidence, 2)
            },
            "recent_insights": recent_insights,
            "widget_types": {
                wt: len([w for w in widgets if w.widget_type == wt])
                for wt in [t.value for t in WidgetType]
            }
        }
    
    async def add_analytics_data(
        self,
        widget_id: int,
        metric_name: str,
        metric_value: float,
        context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add analytics data point for a widget"""
        
        analytics = DashboardAnalytics(
            widget_id=widget_id,
            metric_name=metric_name,
            metric_value=metric_value,
            context=context or {}
        )
        
        self.db.add(analytics)
        self.db.commit()
        
        # Trigger insight generation if conditions are met
        await self._check_insight_triggers(widget_id)
        
        return True
    
    async def get_widget_metrics(
        self, 
        widget_id: int, 
        user_id: int
    ) -> Optional[WidgetMetrics]:
        """Get performance metrics for a widget"""
        
        widget = self.db.query(DashboardWidget).filter(
            DashboardWidget.id == widget_id,
            (DashboardWidget.created_by == user_id) | 
            (DashboardWidget.is_public == True)
        ).first()
        
        if not widget:
            return None
        
        # Get analytics data
        analytics = self.db.query(DashboardAnalytics).filter(
            DashboardAnalytics.widget_id == widget_id,
            DashboardAnalytics.timestamp >= datetime.utcnow() - timedelta(days=7)
        ).all()
        
        # Calculate metrics
        total_views = len([a for a in analytics if a.metric_name == "view"])
        load_times = [a.metric_value for a in analytics if a.metric_name == "load_time"]
        avg_load_time = sum(load_times) / len(load_times) if load_times else 0
        
        errors = [a for a in analytics if a.metric_name == "error"]
        error_rate = len(errors) / total_views if total_views > 0 else 0
        
        last_updated = max([a.timestamp for a in analytics]) if analytics else widget.updated_at
        
        return WidgetMetrics(
            widget_id=widget_id,
            total_views=total_views,
            avg_load_time=avg_load_time,
            error_rate=error_rate,
            last_updated=last_updated,
            data_points=len(analytics)
        )
    
    def _get_period_start(self, period: AnalyticsPeriod) -> datetime:
        """Get start time for analytics period"""
        now = datetime.utcnow()
        
        if period == AnalyticsPeriod.HOUR:
            return now - timedelta(hours=1)
        elif period == AnalyticsPeriod.DAY:
            return now - timedelta(days=1)
        elif period == AnalyticsPeriod.WEEK:
            return now - timedelta(weeks=1)
        elif period == AnalyticsPeriod.MONTH:
            return now - timedelta(days=30)
        elif period == AnalyticsPeriod.QUARTER:
            return now - timedelta(days=90)
        elif period == AnalyticsPeriod.YEAR:
            return now - timedelta(days=365)
        else:
            return now - timedelta(days=1)
    
    async def _process_kpi_data(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> Dict[str, Any]:
        """Process data for KPI widgets"""
        
        if not analytics:
            return {
                "current_value": 0,
                "previous_value": 0,
                "change_percentage": 0,
                "trend": "stable"
            }
        
        # Get current and previous values
        current_value = analytics[0].metric_value if analytics else 0
        previous_value = analytics[1].metric_value if len(analytics) > 1 else current_value
        
        # Calculate change percentage
        if previous_value != 0:
            change_percentage = ((current_value - previous_value) / previous_value) * 100
        else:
            change_percentage = 0
        
        # Determine trend
        if change_percentage > 5:
            trend = "up"
        elif change_percentage < -5:
            trend = "down"
        else:
            trend = "stable"
        
        return {
            "current_value": current_value,
            "previous_value": previous_value,
            "change_percentage": round(change_percentage, 2),
            "trend": trend,
            "unit": analytics[0].metric_unit if analytics else None
        }
    
    async def _process_chart_data(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> Dict[str, Any]:
        """Process data for chart widgets"""
        
        # Group by metric name
        metrics = {}
        for data_point in analytics:
            metric_name = data_point.metric_name
            if metric_name not in metrics:
                metrics[metric_name] = []
            
            metrics[metric_name].append({
                "timestamp": data_point.timestamp.isoformat(),
                "value": data_point.metric_value,
                "unit": data_point.metric_unit
            })
        
        return {
            "metrics": metrics,
            "chart_type": widget.config.get("chart_type", "line"),
            "time_range": {
                "start": min([a.timestamp for a in analytics]).isoformat() if analytics else None,
                "end": max([a.timestamp for a in analytics]).isoformat() if analytics else None
            }
        }
    
    async def _process_table_data(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> Dict[str, Any]:
        """Process data for table widgets"""
        
        # Convert analytics to table rows
        rows = []
        for data_point in analytics:
            row = {
                "timestamp": data_point.timestamp.isoformat(),
                "metric": data_point.metric_name,
                "value": data_point.metric_value,
                "unit": data_point.metric_unit
            }
            
            # Add context data as additional columns
            if data_point.context:
                row.update(data_point.context)
            
            rows.append(row)
        
        return {
            "rows": rows,
            "columns": widget.config.get("columns", ["timestamp", "metric", "value"]),
            "total_rows": len(rows)
        }
    
    async def _process_ai_insight_data(
        self, 
        widget: DashboardWidget
    ) -> Dict[str, Any]:
        """Process data for AI insight widgets"""
        
        # Get recent insights for this widget
        insights = self.db.query(AIInsight).filter(
            AIInsight.widget_id == widget.id,
            AIInsight.is_active == True
        ).order_by(AIInsight.generated_at.desc()).limit(10).all()
        
        return {
            "insights": [insight.to_dict() for insight in insights],
            "total_insights": len(insights),
            "high_priority": len([i for i in insights if i.priority == "high"]),
            "unacknowledged": len([i for i in insights if not i.is_acknowledged])
        }
    
    async def _generate_initial_insights(self, widget: DashboardWidget):
        """Generate initial AI insights for a new widget"""
        
        # Wait a bit for any initial data to be added
        await asyncio.sleep(1)
        
        # Generate insights
        await self.generate_insights_for_widget(widget, force_refresh=True)
    
    async def _check_insight_triggers(self, widget_id: int):
        """Check if conditions are met to generate new insights"""
        
        # Get recent analytics count
        recent_count = self.db.query(DashboardAnalytics).filter(
            DashboardAnalytics.widget_id == widget_id,
            DashboardAnalytics.timestamp >= datetime.utcnow() - timedelta(hours=1)
        ).count()
        
        # Generate insights if we have enough new data
        if recent_count >= 10:  # Threshold for insight generation
            widget = self.db.query(DashboardWidget).filter(
                DashboardWidget.id == widget_id
            ).first()
            
            if widget:
                await self.generate_insights_for_widget(widget, force_refresh=True)


class AnalyticsService:
    """Service for analytics data processing"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def aggregate_metrics(
        self,
        widget_id: int,
        period: AnalyticsPeriod,
        aggregation: str = "avg"  # avg, sum, min, max, count
    ) -> Dict[str, Any]:
        """Aggregate metrics for a widget over a period"""
        
        start_time = self._get_period_start(period)
        
        analytics = self.db.query(DashboardAnalytics).filter(
            DashboardAnalytics.widget_id == widget_id,
            DashboardAnalytics.timestamp >= start_time
        ).all()
        
        if not analytics:
            return {"error": "No data available"}
        
        # Group by metric name
        metrics = {}
        for data_point in analytics:
            metric_name = data_point.metric_name
            if metric_name not in metrics:
                metrics[metric_name] = []
            metrics[metric_name].append(data_point.metric_value)
        
        # Apply aggregation
        aggregated = {}
        for metric_name, values in metrics.items():
            if aggregation == "avg":
                aggregated[metric_name] = sum(values) / len(values)
            elif aggregation == "sum":
                aggregated[metric_name] = sum(values)
            elif aggregation == "min":
                aggregated[metric_name] = min(values)
            elif aggregation == "max":
                aggregated[metric_name] = max(values)
            elif aggregation == "count":
                aggregated[metric_name] = len(values)
        
        return {
            "period": period.value,
            "aggregation": aggregation,
            "metrics": aggregated,
            "data_points": len(analytics)
        }
    
    def _get_period_start(self, period: AnalyticsPeriod) -> datetime:
        """Get start time for analytics period"""
        now = datetime.utcnow()
        
        if period == AnalyticsPeriod.HOUR:
            return now - timedelta(hours=1)
        elif period == AnalyticsPeriod.DAY:
            return now - timedelta(days=1)
        elif period == AnalyticsPeriod.WEEK:
            return now - timedelta(weeks=1)
        elif period == AnalyticsPeriod.MONTH:
            return now - timedelta(days=30)
        elif period == AnalyticsPeriod.QUARTER:
            return now - timedelta(days=90)
        elif period == AnalyticsPeriod.YEAR:
            return now - timedelta(days=365)
        else:
            return now - timedelta(days=1)




