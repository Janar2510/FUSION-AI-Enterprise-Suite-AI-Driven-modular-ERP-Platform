"""
Dashboard Module Tests
Tests for dashboard models, API endpoints, services, and AI agents
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from src.main import app
from src.core.database import get_db
from src.modules.dashboard.models import DashboardWidget, AIInsight, DashboardAnalytics
from src.modules.dashboard.services import DashboardService, AnalyticsService
from src.modules.dashboard.agents import DashboardAgent


class TestDashboardModels:
    """Test dashboard data models"""
    
    def test_dashboard_widget_creation(self, db_session: Session):
        """Test creating a dashboard widget"""
        widget = DashboardWidget(
            title="Test Widget",
            description="Test Description",
            widget_type="kpi",
            position_x=0,
            position_y=0,
            width=4,
            height=3,
            config={"test": "value"},
            data_source="/api/test",
            refresh_interval=300,
            theme="default",
            color_scheme="purple",
            is_active=True,
            is_public=False,
            created_by=1
        )
        
        db_session.add(widget)
        db_session.commit()
        db_session.refresh(widget)
        
        assert widget.id is not None
        assert widget.title == "Test Widget"
        assert widget.widget_type == "kpi"
        assert widget.is_active is True
        assert widget.created_at is not None
    
    def test_ai_insight_creation(self, db_session: Session):
        """Test creating an AI insight"""
        insight = AIInsight(
            widget_id=1,
            title="Test Insight",
            content="This is a test insight",
            insight_type="recommendation",
            confidence_score=0.85,
            data_period="last_30_days",
            metrics={"accuracy": 0.9},
            recommendations=["Test recommendation"],
            model_used="gpt-4",
            priority="high"
        )
        
        db_session.add(insight)
        db_session.commit()
        db_session.refresh(insight)
        
        assert insight.id is not None
        assert insight.title == "Test Insight"
        assert insight.confidence_score == 0.85
        assert insight.priority == "high"
        assert insight.generated_at is not None
    
    def test_dashboard_analytics_creation(self, db_session: Session):
        """Test creating dashboard analytics"""
        analytics = DashboardAnalytics(
            widget_id=1,
            metric_name="test_metric",
            metric_value=100.5,
            metric_unit="count",
            context={"source": "test"},
            tags=["test", "analytics"]
        )
        
        db_session.add(analytics)
        db_session.commit()
        db_session.refresh(analytics)
        
        assert analytics.id is not None
        assert analytics.metric_name == "test_metric"
        assert analytics.metric_value == 100.5
        assert analytics.timestamp is not None


class TestDashboardAPI:
    """Test dashboard API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def sample_widget(self, db_session: Session):
        """Create sample widget for testing"""
        widget = DashboardWidget(
            title="Test Widget",
            widget_type="kpi",
            position_x=0,
            position_y=0,
            width=4,
            height=3,
            created_by=1
        )
        db_session.add(widget)
        db_session.commit()
        db_session.refresh(widget)
        return widget
    
    def test_get_dashboard(self, client: TestClient, sample_widget):
        """Test getting dashboard data"""
        response = client.get("/dashboard/")
        assert response.status_code == 200
        
        data = response.json()
        assert "widgets" in data
        assert "insights" in data
        assert isinstance(data["widgets"], list)
        assert isinstance(data["insights"], list)
    
    def test_create_widget(self, client: TestClient):
        """Test creating a new widget"""
        widget_data = {
            "title": "New Test Widget",
            "description": "Test Description",
            "widget_type": "kpi",
            "position_x": 0,
            "position_y": 0,
            "width": 4,
            "height": 3,
            "config": {"test": "value"},
            "data_source": "/api/test",
            "refresh_interval": 300,
            "theme": "default",
            "color_scheme": "purple",
            "is_public": False
        }
        
        response = client.post("/dashboard/widgets", json=widget_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == widget_data["title"]
        assert data["widget_type"] == widget_data["widget_type"]
        assert "id" in data
    
    def test_update_widget(self, client: TestClient, sample_widget):
        """Test updating a widget"""
        update_data = {
            "title": "Updated Widget",
            "width": 6,
            "height": 4
        }
        
        response = client.put(f"/dashboard/widgets/{sample_widget.id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["width"] == update_data["width"]
        assert data["height"] == update_data["height"]
    
    def test_delete_widget(self, client: TestClient, sample_widget):
        """Test deleting a widget"""
        response = client.delete(f"/dashboard/widgets/{sample_widget.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_get_insights(self, client: TestClient):
        """Test getting AI insights"""
        response = client.get("/dashboard/insights")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_insight(self, client: TestClient, sample_widget):
        """Test creating an AI insight"""
        insight_data = {
            "widget_id": sample_widget.id,
            "title": "Test Insight",
            "content": "This is a test insight",
            "insight_type": "recommendation",
            "confidence_score": 0.85,
            "data_period": "last_30_days",
            "metrics": {"accuracy": 0.9},
            "recommendations": ["Test recommendation"],
            "priority": "high"
        }
        
        response = client.post("/dashboard/insights", json=insight_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == insight_data["title"]
        assert data["confidence_score"] == insight_data["confidence_score"]
        assert "id" in data
    
    def test_acknowledge_insight(self, client: TestClient, db_session: Session):
        """Test acknowledging an insight"""
        # Create a test insight
        insight = AIInsight(
            widget_id=1,
            title="Test Insight",
            content="Test content",
            insight_type="recommendation",
            confidence_score=0.8,
            priority="medium"
        )
        db_session.add(insight)
        db_session.commit()
        db_session.refresh(insight)
        
        response = client.put(f"/dashboard/insights/{insight.id}/acknowledge")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_get_widget_analytics(self, client: TestClient, sample_widget):
        """Test getting widget analytics"""
        response = client.get(f"/dashboard/analytics/{sample_widget.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "widget_id" in data
        assert "data_points" in data
    
    def test_add_analytics_data(self, client: TestClient, sample_widget):
        """Test adding analytics data"""
        analytics_data = {
            "metric_name": "test_metric",
            "metric_value": 100.5,
            "metric_unit": "count",
            "context": {"source": "test"},
            "tags": ["test", "analytics"]
        }
        
        response = client.post(f"/dashboard/analytics/{sample_widget.id}", json=analytics_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_generate_insights(self, client: TestClient, sample_widget):
        """Test generating insights"""
        response = client.post("/dashboard/generate-insights")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "widgets_processed" in data
        assert "insights_generated" in data
    
    def test_get_widget_templates(self, client: TestClient):
        """Test getting widget templates"""
        response = client.get("/dashboard/templates")
        assert response.status_code == 200
        
        data = response.json()
        assert "templates" in data
        assert isinstance(data["templates"], list)
        assert len(data["templates"]) > 0
    
    def test_dashboard_health(self, client: TestClient):
        """Test dashboard health check"""
        response = client.get("/dashboard/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["module"] == "dashboard"


class TestDashboardServices:
    """Test dashboard services"""
    
    @pytest.fixture
    def dashboard_service(self, db_session: Session):
        """Create dashboard service instance"""
        return DashboardService(db_session)
    
    @pytest.fixture
    def analytics_service(self, db_session: Session):
        """Create analytics service instance"""
        return AnalyticsService(db_session)
    
    @pytest.mark.asyncio
    async def test_create_widget(self, dashboard_service: DashboardService):
        """Test creating a widget through service"""
        widget = await dashboard_service.create_widget(
            title="Service Test Widget",
            widget_type="kpi",
            user_id=1,
            config={"test": "value"},
            position={"x": 0, "y": 0, "width": 4, "height": 3}
        )
        
        assert widget.title == "Service Test Widget"
        assert widget.widget_type == "kpi"
        assert widget.created_by == 1
        assert widget.id is not None
    
    @pytest.mark.asyncio
    async def test_update_widget_layout(self, dashboard_service: DashboardService, db_session: Session):
        """Test updating widget layout"""
        # Create a test widget
        widget = DashboardWidget(
            title="Layout Test Widget",
            widget_type="kpi",
            position_x=0,
            position_y=0,
            width=4,
            height=3,
            created_by=1
        )
        db_session.add(widget)
        db_session.commit()
        db_session.refresh(widget)
        
        # Update layout
        success = await dashboard_service.update_widget_layout(
            widget.id, 1, {"x": 2, "y": 3, "width": 6, "height": 4}
        )
        
        assert success is True
        
        # Verify update
        db_session.refresh(widget)
        assert widget.position_x == 2
        assert widget.position_y == 3
        assert widget.width == 6
        assert widget.height == 4
    
    @pytest.mark.asyncio
    async def test_get_dashboard_summary(self, dashboard_service: DashboardService, db_session: Session):
        """Test getting dashboard summary"""
        # Create test widgets
        widget1 = DashboardWidget(
            title="Widget 1",
            widget_type="kpi",
            position_x=0,
            position_y=0,
            width=4,
            height=3,
            created_by=1
        )
        widget2 = DashboardWidget(
            title="Widget 2",
            widget_type="chart",
            position_x=4,
            position_y=0,
            width=4,
            height=3,
            created_by=1
        )
        
        db_session.add_all([widget1, widget2])
        db_session.commit()
        
        # Get summary
        summary = await dashboard_service.get_dashboard_summary(1)
        
        assert summary["total_widgets"] == 2
        assert "widget_types" in summary
        assert "insights" in summary
        assert "recommendations" in summary
        assert "alerts" in summary
    
    @pytest.mark.asyncio
    async def test_add_analytics_data(self, dashboard_service: DashboardService, db_session: Session):
        """Test adding analytics data"""
        # Create a test widget
        widget = DashboardWidget(
            title="Analytics Test Widget",
            widget_type="kpi",
            position_x=0,
            position_y=0,
            width=4,
            height=3,
            created_by=1
        )
        db_session.add(widget)
        db_session.commit()
        db_session.refresh(widget)
        
        # Add analytics data
        success = await dashboard_service.add_analytics_data(
            widget.id, "test_metric", 100.5, {"source": "test"}
        )
        
        assert success is True
        
        # Verify data was added
        analytics = db_session.query(DashboardAnalytics).filter(
            DashboardAnalytics.widget_id == widget.id
        ).first()
        
        assert analytics is not None
        assert analytics.metric_name == "test_metric"
        assert analytics.metric_value == 100.5
    
    @pytest.mark.asyncio
    async def test_aggregate_metrics(self, analytics_service: AnalyticsService, db_session: Session):
        """Test aggregating metrics"""
        # Create test analytics data
        widget_id = 1
        for i in range(10):
            analytics = DashboardAnalytics(
                widget_id=widget_id,
                metric_name="test_metric",
                metric_value=100 + i,
                timestamp=datetime.utcnow() - timedelta(hours=i)
            )
            db_session.add(analytics)
        
        db_session.commit()
        
        # Test aggregation
        result = await analytics_service.aggregate_metrics(
            widget_id, "1d", "avg"
        )
        
        assert "metrics" in result
        assert "test_metric" in result["metrics"]
        assert result["data_points"] == 10


class TestDashboardAgent:
    """Test dashboard AI agent"""
    
    @pytest.fixture
    def dashboard_agent(self):
        """Create dashboard agent instance"""
        return DashboardAgent()
    
    @pytest.mark.asyncio
    async def test_analyze_widget_data(self, dashboard_agent: DashboardAgent, db_session: Session):
        """Test analyzing widget data"""
        # Create test widget
        widget = DashboardWidget(
            title="Agent Test Widget",
            widget_type="kpi",
            position_x=0,
            position_y=0,
            width=4,
            height=3,
            created_by=1
        )
        db_session.add(widget)
        db_session.commit()
        db_session.refresh(widget)
        
        # Create test analytics data
        analytics = []
        for i in range(20):
            analytics.append(DashboardAnalytics(
                widget_id=widget.id,
                metric_name="test_metric",
                metric_value=100 + i * 2,  # Upward trend
                timestamp=datetime.utcnow() - timedelta(hours=i)
            ))
        
        # Analyze data
        insights = await dashboard_agent.analyze_widget_data(widget, analytics)
        
        assert isinstance(insights, list)
        # Should generate insights for the upward trend
        assert len(insights) > 0
    
    @pytest.mark.asyncio
    async def test_generate_executive_summary(self, dashboard_agent: DashboardAgent, db_session: Session):
        """Test generating executive summary"""
        # Create test widgets
        widgets = []
        for i in range(3):
            widget = DashboardWidget(
                title=f"Summary Widget {i}",
                widget_type="kpi",
                position_x=i * 4,
                position_y=0,
                width=4,
                height=3,
                created_by=1
            )
            widgets.append(widget)
            db_session.add(widget)
        
        db_session.commit()
        
        # Create analytics data
        analytics_data = {}
        for widget in widgets:
            analytics_data[widget.id] = [
                DashboardAnalytics(
                    widget_id=widget.id,
                    metric_name="test_metric",
                    metric_value=100,
                    timestamp=datetime.utcnow()
                )
            ]
        
        # Generate summary
        summary = await dashboard_agent.generate_executive_summary(widgets, analytics_data)
        
        assert "total_widgets" in summary
        assert "widget_types" in summary
        assert "insights" in summary
        assert "recommendations" in summary
        assert "alerts" in summary
        assert summary["total_widgets"] == 3
    
    @pytest.mark.asyncio
    async def test_optimize_widget_layout(self, dashboard_agent: DashboardAgent, db_session: Session):
        """Test optimizing widget layout"""
        # Create test widgets
        widgets = []
        for i in range(3):
            widget = DashboardWidget(
                title=f"Layout Widget {i}",
                widget_type="kpi",
                position_x=i * 4,
                position_y=0,
                width=4,
                height=3,
                created_by=1
            )
            widgets.append(widget)
        
        # Optimize layout
        suggestions = await dashboard_agent.optimize_widget_layout(widgets, {})
        
        assert isinstance(suggestions, list)
        assert len(suggestions) == len(widgets)
        
        for suggestion in suggestions:
            assert "widget_id" in suggestion
            assert "current_position" in suggestion
            assert "suggested_position" in suggestion
            assert "reasoning" in suggestion
    
    @pytest.mark.asyncio
    async def test_predict_widget_performance(self, dashboard_agent: DashboardAgent, db_session: Session):
        """Test predicting widget performance"""
        # Create test widget
        widget = DashboardWidget(
            title="Prediction Test Widget",
            widget_type="kpi",
            position_x=0,
            position_y=0,
            width=4,
            height=3,
            created_by=1
        )
        db_session.add(widget)
        db_session.commit()
        db_session.refresh(widget)
        
        # Create historical data
        historical_data = []
        for i in range(15):
            historical_data.append(DashboardAnalytics(
                widget_id=widget.id,
                metric_name="test_metric",
                metric_value=100 + i * 2,
                timestamp=datetime.utcnow() - timedelta(days=i)
            ))
        
        # Predict performance
        prediction = await dashboard_agent.predict_widget_performance(widget, historical_data)
        
        assert "predictions" in prediction
        assert "confidence" in prediction
        assert "method" in prediction
        assert "next_update" in prediction


class TestDashboardIntegration:
    """Integration tests for dashboard module"""
    
    @pytest.mark.asyncio
    async def test_full_widget_lifecycle(self, db_session: Session):
        """Test complete widget lifecycle"""
        # Create dashboard service
        dashboard_service = DashboardService(db_session)
        
        # 1. Create widget
        widget = await dashboard_service.create_widget(
            title="Lifecycle Test Widget",
            widget_type="kpi",
            user_id=1,
            config={"test": "value"}
        )
        
        assert widget.id is not None
        
        # 2. Add analytics data
        await dashboard_service.add_analytics_data(
            widget.id, "test_metric", 100.5, {"source": "test"}
        )
        
        # 3. Get widget data
        data = await dashboard_service.get_widget_data(widget.id, 1)
        assert "current_value" in data
        
        # 4. Update layout
        success = await dashboard_service.update_widget_layout(
            widget.id, 1, {"x": 2, "y": 3, "width": 6, "height": 4}
        )
        assert success is True
        
        # 5. Get metrics
        metrics = await dashboard_service.get_widget_metrics(widget.id, 1)
        assert metrics is not None
        assert metrics.widget_id == widget.id
    
    @pytest.mark.asyncio
    async def test_ai_insight_generation(self, db_session: Session):
        """Test AI insight generation workflow"""
        # Create dashboard service and agent
        dashboard_service = DashboardService(db_session)
        dashboard_agent = DashboardAgent()
        
        # Create widget with analytics data
        widget = await dashboard_service.create_widget(
            title="Insight Test Widget",
            widget_type="kpi",
            user_id=1
        )
        
        # Add some analytics data
        for i in range(10):
            await dashboard_service.add_analytics_data(
                widget.id, "test_metric", 100 + i * 2
            )
        
        # Generate insights
        insights = await dashboard_service.generate_insights_for_widget(widget)
        
        assert isinstance(insights, list)
        # Should generate some insights based on the data


if __name__ == "__main__":
    pytest.main([__file__])




