"""
Dashboard Module AI Agent
Specialized AI agent for dashboard analytics, insights, and recommendations
"""

import asyncio
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session
from ...agents.base import BaseAgent
from .models import DashboardWidget, AIInsight, DashboardAnalytics, InsightType


class AnalysisType(str, Enum):
    """Types of analysis the agent can perform"""
    TREND_ANALYSIS = "trend_analysis"
    ANOMALY_DETECTION = "anomaly_detection"
    PREDICTION = "prediction"
    OPTIMIZATION = "optimization"
    COMPARISON = "comparison"


@dataclass
class InsightData:
    """Data structure for AI insights"""
    title: str
    content: str
    insight_type: str
    confidence: float
    metrics: Dict[str, Any]
    recommendations: List[str]
    priority: str
    period: str


class DashboardAgent(BaseAgent):
    """AI Agent specialized for dashboard analytics and insights"""
    
    def __init__(self):
        # Initialize with mock values since we don't have the AI dependencies
        self.agent_name = "DashboardAgent"
        self.capabilities = [
            "analytics_analysis",
            "trend_detection",
            "anomaly_detection",
            "predictive_insights",
            "widget_optimization",
            "executive_summaries",
            "pattern_recognition",
            "recommendation_engine"
        ]
        
        # Agent configuration
        self.confidence_threshold = 0.7
        self.max_insights_per_widget = 5
        self.analysis_lookback_days = 30
    
    async def generate_insights_for_widget(self, widget: DashboardWidget, db: Session) -> List[AIInsight]:
        """Generate mock insights for a widget"""
        # This is a simplified version that returns mock insights
        # In a real implementation, this would use AI to analyze the data
        
        insights = []
        
        # Create a mock insight
        insight = AIInsight(
            widget_id=widget.id,
            title=f"Performance Insight for {widget.title}",
            content=f"This is a mock insight for the {widget.title} widget. In a real implementation, this would contain AI-generated analysis.",
            insight_type="trend",
            confidence_score=0.8,
            data_period="last_30_days",
            metrics={"value": 123.45},
            recommendations=["Review widget configuration", "Check data sources"],
            model_used="mock_model",
            priority="medium"
        )
        
        insights.append(insight)
        return insights
    
    async def analyze_widget_data(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> List[Dict[str, Any]]:
        """Analyze widget data and generate insights"""
        
        if not analytics:
            return await self._generate_no_data_insight(widget)
        
        insights = []
        
        # Perform different types of analysis
        trend_insights = await self._analyze_trends(widget, analytics)
        anomaly_insights = await self._detect_anomalies(widget, analytics)
        prediction_insights = await self._generate_predictions(widget, analytics)
        optimization_insights = await self._suggest_optimizations(widget, analytics)
        
        # Combine and filter insights
        all_insights = trend_insights + anomaly_insights + prediction_insights + optimization_insights
        
        # Sort by confidence and priority
        all_insights.sort(key=lambda x: (x.confidence, x.priority), reverse=True)
        
        # Return top insights
        return all_insights[:self.max_insights_per_widget]
    
    async def generate_executive_summary(
        self, 
        widgets: List[DashboardWidget],
        analytics_data: Dict[int, List[DashboardAnalytics]]
    ) -> Dict[str, Any]:
        """Generate executive summary for all dashboard widgets"""
        
        summary_data = {
            "total_widgets": len(widgets),
            "widget_types": {},
            "key_metrics": {},
            "insights": [],
            "recommendations": [],
            "alerts": []
        }
        
        # Analyze each widget type
        for widget in widgets:
            widget_type = widget.widget_type
            if widget_type not in summary_data["widget_types"]:
                summary_data["widget_types"][widget_type] = 0
            summary_data["widget_types"][widget_type] += 1
            
            # Get analytics for this widget
            widget_analytics = analytics_data.get(widget.id, [])
            if widget_analytics:
                # Generate insights for this widget
                widget_insights = await self.analyze_widget_data(widget, widget_analytics)
                summary_data["insights"].extend(widget_insights)
        
        # Generate high-level recommendations
        summary_data["recommendations"] = await self._generate_high_level_recommendations(summary_data)
        
        # Generate alerts for critical issues
        summary_data["alerts"] = await self._generate_alerts(summary_data)
        
        return summary_data
    
    async def optimize_widget_layout(
        self, 
        widgets: List[DashboardWidget],
        user_preferences: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Suggest optimal widget layout based on usage patterns and user preferences"""
        
        # Analyze widget usage patterns
        usage_analysis = await self._analyze_widget_usage(widgets)
        
        # Generate layout suggestions
        suggestions = []
        
        for widget in widgets:
            suggestion = {
                "widget_id": widget.id,
                "current_position": {
                    "x": widget.position_x,
                    "y": widget.position_y,
                    "width": widget.width,
                    "height": widget.height
                },
                "suggested_position": await self._calculate_optimal_position(
                    widget, usage_analysis, user_preferences
                ),
                "reasoning": await self._explain_position_reasoning(widget, usage_analysis)
            }
            suggestions.append(suggestion)
        
        return suggestions
    
    async def predict_widget_performance(
        self, 
        widget: DashboardWidget,
        historical_data: List[DashboardAnalytics]
    ) -> Dict[str, Any]:
        """Predict future performance of a widget"""
        
        if len(historical_data) < 10:
            return {"error": "Insufficient historical data for prediction"}
        
        # Prepare data for prediction
        time_series_data = self._prepare_time_series_data(historical_data)
        
        # Generate prediction using AI
        prediction_prompt = f"""
        Analyze the following time series data and predict the next 7 days of performance:
        
        Data: {json.dumps(time_series_data)}
        
        Widget Type: {widget.widget_type}
        Widget Config: {json.dumps(widget.config)}
        
        Provide predictions for:
        1. Expected values for next 7 days
        2. Confidence intervals
        3. Potential anomalies or risks
        4. Recommendations for optimization
        """
        
        prediction_response = await self.openai_client.generate_completion(
            prompt=prediction_prompt,
            model="gpt-4",
            max_tokens=1000
        )
        
        return {
            "predictions": json.loads(prediction_response),
            "confidence": 0.85,  # This would be calculated based on data quality
            "method": "time_series_analysis",
            "next_update": datetime.utcnow() + timedelta(hours=6)
        }
    
    async def _analyze_trends(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> List[Dict[str, Any]]:
        """Analyze trends in widget data"""
        
        if len(analytics) < 5:
            return []
        
        # Group by metric name
        metrics = {}
        for data_point in analytics:
            metric_name = data_point.metric_name
            if metric_name not in metrics:
                metrics[metric_name] = []
            metrics[metric_name].append({
                "value": data_point.metric_value,
                "timestamp": data_point.timestamp
            })
        
        insights = []
        
        for metric_name, data_points in metrics.items():
            # Calculate trend
            values = [dp["value"] for dp in data_points]
            trend_direction = self._calculate_trend_direction(values)
            trend_strength = self._calculate_trend_strength(values)
            
            if trend_strength > 0.3:  # Only report significant trends
                insight = {
                    "title": f"Trend Detected in {metric_name}",
                    "content": f"Strong {trend_direction} trend detected in {metric_name} over the last {len(data_points)} data points",
                    "type": "trend",
                    "confidence": min(trend_strength, 0.95),
                    "metrics": {
                        "metric_name": metric_name,
                        "trend_direction": trend_direction,
                        "trend_strength": trend_strength,
                        "data_points": len(data_points)
                    },
                    "recommendations": self._get_trend_recommendations(trend_direction, metric_name),
                    "priority": "high" if trend_strength > 0.7 else "medium",
                    "period": "last_30_days"
                }
                insights.append(insight)
        
        return insights
    
    async def _detect_anomalies(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> List[Dict[str, Any]]:
        """Detect anomalies in widget data"""
        
        if len(analytics) < 10:
            return []
        
        # Group by metric name
        metrics = {}
        for data_point in analytics:
            metric_name = data_point.metric_name
            if metric_name not in metrics:
                metrics[metric_name] = []
            metrics[metric_name].append(data_point.metric_value)
        
        insights = []
        
        for metric_name, values in metrics.items():
            # Detect outliers using statistical methods
            outliers = self._detect_outliers(values)
            
            if outliers:
                insight = {
                    "title": f"Anomaly Detected in {metric_name}",
                    "content": f"Detected {len(outliers)} anomalous values in {metric_name} that deviate significantly from normal patterns",
                    "type": "anomaly",
                    "confidence": 0.8,
                    "metrics": {
                        "metric_name": metric_name,
                        "outlier_count": len(outliers),
                        "outlier_values": outliers,
                        "total_values": len(values)
                    },
                    "recommendations": [
                        "Investigate the cause of these anomalies",
                        "Consider implementing alerting for similar patterns",
                        "Review data quality and collection processes"
                    ],
                    "priority": "high",
                    "period": "last_30_days"
                }
                insights.append(insight)
        
        return insights
    
    async def _generate_predictions(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> List[Dict[str, Any]]:
        """Generate predictions based on historical data"""
        
        if len(analytics) < 20:
            return []
        
        # Use AI to generate predictions
        prediction_prompt = f"""
        Based on the following historical data for widget '{widget.title}' (type: {widget.widget_type}):
        
        Data: {json.dumps([{"value": a.metric_value, "timestamp": a.timestamp.isoformat()} for a in analytics[-20:]])}
        
        Generate predictions for the next 7 days and provide insights about:
        1. Expected trends
        2. Potential risks or opportunities
        3. Confidence level
        4. Actionable recommendations
        """
        
        try:
            prediction_response = await self.openai_client.generate_completion(
                prompt=prediction_prompt,
                model="gpt-4",
                max_tokens=500
            )
            
            # Parse AI response and create insight
            insight = {
                "title": f"Predictive Analysis for {widget.title}",
                "content": prediction_response,
                "type": "prediction",
                "confidence": 0.75,
                "metrics": {
                    "prediction_horizon": "7_days",
                    "data_points_analyzed": len(analytics),
                    "model_used": "gpt-4"
                },
                "recommendations": [
                    "Monitor actual performance against predictions",
                    "Adjust strategies based on predicted trends",
                    "Set up alerts for predicted threshold breaches"
                ],
                "priority": "medium",
                "period": "next_7_days"
            }
            
            return [insight]
            
        except Exception as e:
            # Fallback to simple statistical prediction
            return await self._generate_statistical_prediction(widget, analytics)
    
    async def _suggest_optimizations(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> List[Dict[str, Any]]:
        """Suggest optimizations for widget performance"""
        
        insights = []
        
        # Analyze refresh frequency
        refresh_interval = widget.refresh_interval
        data_frequency = self._calculate_data_frequency(analytics)
        
        if refresh_interval > data_frequency * 2:
            insight = {
                "title": f"Optimize Refresh Frequency for {widget.title}",
                "content": f"Widget refresh interval ({refresh_interval}s) is much higher than data update frequency ({data_frequency}s). Consider reducing refresh interval for better real-time experience.",
                "type": "optimization",
                "confidence": 0.8,
                "metrics": {
                    "current_refresh_interval": refresh_interval,
                    "data_frequency": data_frequency,
                    "optimization_potential": "high"
                },
                "recommendations": [
                    f"Reduce refresh interval to {data_frequency}s",
                    "Monitor performance impact of increased refresh rate",
                    "Consider implementing smart refresh based on data changes"
                ],
                "priority": "medium",
                "period": "ongoing"
            }
            insights.append(insight)
        
        # Analyze widget size and layout
        if widget.width * widget.height > 20:  # Large widget
            insight = {
                "title": f"Consider Widget Size Optimization",
                "content": f"Widget '{widget.title}' is quite large ({widget.width}x{widget.height}). Consider if all information is necessary or if it could be split into smaller, focused widgets.",
                "type": "optimization",
                "confidence": 0.6,
                "metrics": {
                    "current_size": f"{widget.width}x{widget.height}",
                    "size_score": widget.width * widget.height,
                    "optimization_potential": "medium"
                },
                "recommendations": [
                    "Review widget content for essential information only",
                    "Consider splitting into multiple smaller widgets",
                    "Test different sizes to find optimal balance"
                ],
                "priority": "low",
                "period": "ongoing"
            }
            insights.append(insight)
        
        return insights
    
    async def _generate_no_data_insight(self, widget: DashboardWidget) -> List[Dict[str, Any]]:
        """Generate insight when no data is available"""
        
        return [{
            "title": f"No Data Available for {widget.title}",
            "content": f"Widget '{widget.title}' has no analytics data yet. Consider checking data sources and ensuring proper data collection is configured.",
            "type": "alert",
            "confidence": 1.0,
            "metrics": {
                "data_points": 0,
                "status": "no_data"
            },
            "recommendations": [
                "Verify data source configuration",
                "Check if data collection is properly set up",
                "Review widget configuration and filters"
            ],
            "priority": "high",
            "period": "immediate"
        }]
    
    def _calculate_trend_direction(self, values: List[float]) -> str:
        """Calculate trend direction from a list of values"""
        if len(values) < 2:
            return "stable"
        
        # Simple linear regression slope
        n = len(values)
        x = list(range(n))
        y = values
        
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
        
        if slope > 0.1:
            return "upward"
        elif slope < -0.1:
            return "downward"
        else:
            return "stable"
    
    def _calculate_trend_strength(self, values: List[float]) -> float:
        """Calculate trend strength (0-1) from a list of values"""
        if len(values) < 2:
            return 0.0
        
        # Calculate R-squared for trend strength
        n = len(values)
        x = list(range(n))
        y = values
        
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))
        sum_y2 = sum(y[i] ** 2 for i in range(n))
        
        numerator = n * sum_xy - sum_x * sum_y
        denominator = ((n * sum_x2 - sum_x ** 2) * (n * sum_y2 - sum_y ** 2)) ** 0.5
        
        if denominator == 0:
            return 0.0
        
        correlation = numerator / denominator
        return abs(correlation)
    
    def _detect_outliers(self, values: List[float]) -> List[float]:
        """Detect outliers using IQR method"""
        if len(values) < 4:
            return []
        
        sorted_values = sorted(values)
        q1_index = len(sorted_values) // 4
        q3_index = 3 * len(sorted_values) // 4
        
        q1 = sorted_values[q1_index]
        q3 = sorted_values[q3_index]
        iqr = q3 - q1
        
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = [v for v in values if v < lower_bound or v > upper_bound]
        return outliers
    
    def _get_trend_recommendations(self, trend_direction: str, metric_name: str) -> List[str]:
        """Get recommendations based on trend direction"""
        if trend_direction == "upward":
            return [
                f"Monitor {metric_name} closely as it's trending upward",
                "Consider capitalizing on positive momentum",
                "Set up alerts for potential over-optimization"
            ]
        elif trend_direction == "downward":
            return [
                f"Investigate causes of declining {metric_name}",
                "Implement corrective measures immediately",
                "Consider additional monitoring and alerts"
            ]
        else:
            return [
                f"{metric_name} is stable - maintain current strategies",
                "Consider if stability indicates optimization opportunities",
                "Monitor for any sudden changes"
            ]
    
    def _calculate_data_frequency(self, analytics: List[DashboardAnalytics]) -> float:
        """Calculate average data frequency in seconds"""
        if len(analytics) < 2:
            return 300  # Default 5 minutes
        
        timestamps = [a.timestamp for a in analytics]
        timestamps.sort()
        
        intervals = []
        for i in range(1, len(timestamps)):
            interval = (timestamps[i] - timestamps[i-1]).total_seconds()
            intervals.append(interval)
        
        return sum(intervals) / len(intervals) if intervals else 300
    
    def _prepare_time_series_data(self, analytics: List[DashboardAnalytics]) -> List[Dict[str, Any]]:
        """Prepare time series data for prediction"""
        data = []
        for a in analytics:
            data.append({
                "timestamp": a.timestamp.isoformat(),
                "value": a.metric_value,
                "metric": a.metric_name
            })
        
        # Sort by timestamp
        data.sort(key=lambda x: x["timestamp"])
        return data
    
    async def _generate_statistical_prediction(
        self, 
        widget: DashboardWidget, 
        analytics: List[DashboardAnalytics]
    ) -> List[Dict[str, Any]]:
        """Generate simple statistical prediction as fallback"""
        
        values = [a.metric_value for a in analytics[-10:]]  # Last 10 values
        if not values:
            return []
        
        # Simple moving average prediction
        avg_value = sum(values) / len(values)
        trend = self._calculate_trend_direction(values)
        
        prediction = {
            "title": f"Statistical Prediction for {widget.title}",
            "content": f"Based on recent data, {widget.title} is expected to maintain around {avg_value:.2f} with a {trend} trend.",
            "type": "prediction",
            "confidence": 0.6,
            "metrics": {
                "predicted_value": avg_value,
                "trend": trend,
                "method": "moving_average"
            },
            "recommendations": [
                "Monitor actual performance against prediction",
                "Update prediction as new data becomes available"
            ],
            "priority": "low",
            "period": "next_7_days"
        }
        
        return [prediction]
    
    async def _generate_high_level_recommendations(self, summary_data: Dict[str, Any]) -> List[str]:
        """Generate high-level recommendations for the entire dashboard"""
        
        recommendations = []
        
        # Widget type distribution recommendations
        widget_types = summary_data.get("widget_types", {})
        if len(widget_types) > 10:
            recommendations.append("Consider consolidating similar widget types to reduce dashboard complexity")
        
        if "kpi" not in widget_types:
            recommendations.append("Add KPI widgets to track key performance indicators")
        
        # Insights recommendations
        insights = summary_data.get("insights", [])
        high_priority_insights = [i for i in insights if i.get("priority") == "high"]
        
        if len(high_priority_insights) > 5:
            recommendations.append("Address high-priority insights to improve dashboard performance")
        
        return recommendations
    
    async def _generate_alerts(self, summary_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate alerts for critical issues"""
        
        alerts = []
        insights = summary_data.get("insights", [])
        
        # Check for critical anomalies
        anomaly_insights = [i for i in insights if i.get("type") == "anomaly" and i.get("priority") == "high"]
        if anomaly_insights:
            alerts.append({
                "type": "critical_anomalies",
                "message": f"Detected {len(anomaly_insights)} critical anomalies requiring immediate attention",
                "priority": "critical",
                "count": len(anomaly_insights)
            })
        
        # Check for data quality issues
        no_data_insights = [i for i in insights if i.get("type") == "alert" and "no data" in i.get("title", "").lower()]
        if no_data_insights:
            alerts.append({
                "type": "data_quality",
                "message": f"{len(no_data_insights)} widgets have no data available",
                "priority": "high",
                "count": len(no_data_insights)
            })
        
        return alerts
    
    async def _analyze_widget_usage(self, widgets: List[DashboardWidget]) -> Dict[str, Any]:
        """Analyze widget usage patterns (placeholder for future implementation)"""
        
        # This would typically analyze user interaction data
        # For now, return mock data
        return {
            "most_viewed": [w.id for w in widgets[:3]],
            "least_viewed": [w.id for w in widgets[-3:]],
            "interaction_rates": {w.id: 0.8 for w in widgets}
        }
    
    async def _calculate_optimal_position(
        self, 
        widget: DashboardWidget, 
        usage_analysis: Dict[str, Any],
        user_preferences: Dict[str, Any]
    ) -> Dict[str, int]:
        """Calculate optimal position for a widget"""
        
        # Simple positioning logic based on widget type and usage
        if widget.widget_type == "kpi":
            return {"x": 0, "y": 0, "width": 3, "height": 2}
        elif widget.widget_type == "chart":
            return {"x": 0, "y": 2, "width": 6, "height": 4}
        elif widget.widget_type == "ai_insight":
            return {"x": 6, "y": 0, "width": 4, "height": 6}
        else:
            return {"x": widget.position_x, "y": widget.position_y, "width": widget.width, "height": widget.height}
    
    async def _explain_position_reasoning(
        self, 
        widget: DashboardWidget, 
        usage_analysis: Dict[str, Any]
    ) -> str:
        """Explain the reasoning behind position suggestions"""
        
        if widget.widget_type == "kpi":
            return "KPI widgets are positioned at the top for immediate visibility of key metrics"
        elif widget.widget_type == "chart":
            return "Chart widgets are given more space in the middle for detailed data visualization"
        elif widget.widget_type == "ai_insight":
            return "AI insights are positioned on the right side for easy reference without cluttering main content"
        else:
            return "Position optimized based on widget type and usage patterns"



