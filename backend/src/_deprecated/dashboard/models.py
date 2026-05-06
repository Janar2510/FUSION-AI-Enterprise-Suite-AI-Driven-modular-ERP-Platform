"""
Dashboard Module Models
Handles dashboard widgets, AI insights, and analytics data
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

Base = declarative_base()


class WidgetType(str, Enum):
    """Dashboard widget types"""
    CHART = "chart"
    KPI = "kpi"
    TABLE = "table"
    AI_INSIGHT = "ai_insight"
    CUSTOM = "custom"


class InsightType(str, Enum):
    """AI insight types"""
    PREDICTION = "prediction"
    ANOMALY = "anomaly"
    RECOMMENDATION = "recommendation"
    TREND = "trend"
    ALERT = "alert"


class DashboardWidget(Base):
    """Dashboard widget model"""
    __tablename__ = "dashboard_widgets"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    widget_type = Column(String(50), nullable=False)  # WidgetType enum
    position_x = Column(Integer, default=0)
    position_y = Column(Integer, default=0)
    width = Column(Integer, default=4)
    height = Column(Integer, default=3)
    
    # Configuration
    config = Column(JSON, nullable=True)  # Widget-specific configuration
    data_source = Column(String(255), nullable=True)  # API endpoint or query
    refresh_interval = Column(Integer, default=300)  # seconds
    
    # Styling
    theme = Column(String(50), default="default")
    color_scheme = Column(String(50), default="purple")
    
    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User", back_populates="created_widgets")
    insights = relationship("AIInsight", back_populates="widget", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DashboardWidget(id={self.id}, title='{self.title}', type='{self.widget_type}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "widget_type": self.widget_type,
            "position": {
                "x": self.position_x,
                "y": self.position_y,
                "width": self.width,
                "height": self.height
            },
            "config": self.config or {},
            "data_source": self.data_source,
            "refresh_interval": self.refresh_interval,
            "theme": self.theme,
            "color_scheme": self.color_scheme,
            "is_active": self.is_active,
            "is_public": self.is_public,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by": self.created_by
        }


class AIInsight(Base):
    """AI-generated insights for dashboard"""
    __tablename__ = "ai_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    widget_id = Column(Integer, ForeignKey("dashboard_widgets.id"), nullable=True)
    
    # Insight content
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    insight_type = Column(String(50), nullable=False)  # InsightType enum
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0
    
    # Data context
    data_period = Column(String(100), nullable=True)  # e.g., "last_30_days"
    metrics = Column(JSON, nullable=True)  # Related metrics
    recommendations = Column(JSON, nullable=True)  # Action items
    
    # AI metadata
    model_used = Column(String(100), nullable=True)
    processing_time = Column(Float, nullable=True)  # seconds
    prompt_version = Column(String(50), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_acknowledged = Column(Boolean, default=False)
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    
    # Timestamps
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    widget = relationship("DashboardWidget", back_populates="insights")
    
    def __repr__(self):
        return f"<AIInsight(id={self.id}, type='{self.insight_type}', confidence={self.confidence_score})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "widget_id": self.widget_id,
            "title": self.title,
            "content": self.content,
            "insight_type": self.insight_type,
            "confidence_score": self.confidence_score,
            "data_period": self.data_period,
            "metrics": self.metrics or {},
            "recommendations": self.recommendations or [],
            "model_used": self.model_used,
            "processing_time": self.processing_time,
            "is_active": self.is_active,
            "is_acknowledged": self.is_acknowledged,
            "priority": self.priority,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None
        }


class DashboardLayout(Base):
    """User-specific dashboard layouts"""
    __tablename__ = "dashboard_layouts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Layout configuration
    layout_config = Column(JSON, nullable=False)  # Grid layout data
    theme_settings = Column(JSON, nullable=True)  # User theme preferences
    
    # Status
    is_default = Column(Boolean, default=False)
    is_shared = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="dashboard_layouts")
    
    def __repr__(self):
        return f"<DashboardLayout(id={self.id}, name='{self.name}', user_id={self.user_id})>"


class DashboardAnalytics(Base):
    """Analytics data for dashboard widgets"""
    __tablename__ = "dashboard_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    widget_id = Column(Integer, ForeignKey("dashboard_widgets.id"), nullable=False)
    
    # Analytics data
    metric_name = Column(String(255), nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String(50), nullable=True)
    
    # Time series data
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)
    
    # Additional context
    context = Column(JSON, nullable=True)  # Additional context data
    tags = Column(JSON, nullable=True)  # Tags for filtering
    
    # Relationships
    widget = relationship("DashboardWidget")
    
    def __repr__(self):
        return f"<DashboardAnalytics(id={self.id}, metric='{self.metric_name}', value={self.metric_value})>"


class User(Base):
    """User model (referenced by dashboard models)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # Dashboard relationships
    created_widgets = relationship("DashboardWidget", back_populates="creator")
    dashboard_layouts = relationship("DashboardLayout", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


# Pydantic models for API validation
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class WidgetCreate(BaseModel):
    """Schema for creating a new widget"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    widget_type: str = Field(..., pattern="^(chart|kpi|table|ai_insight|custom)$")
    position_x: int = Field(default=0, ge=0)
    position_y: int = Field(default=0, ge=0)
    width: int = Field(default=4, ge=1, le=12)
    height: int = Field(default=3, ge=1, le=12)
    config: Optional[Dict[str, Any]] = None
    data_source: Optional[str] = None
    refresh_interval: int = Field(default=300, ge=30)
    theme: str = Field(default="default")
    color_scheme: str = Field(default="purple")
    is_public: bool = Field(default=False)


class WidgetUpdate(BaseModel):
    """Schema for updating a widget"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    position_x: Optional[int] = Field(None, ge=0)
    position_y: Optional[int] = Field(None, ge=0)
    width: Optional[int] = Field(None, ge=1, le=12)
    height: Optional[int] = Field(None, ge=1, le=12)
    config: Optional[Dict[str, Any]] = None
    data_source: Optional[str] = None
    refresh_interval: Optional[int] = Field(None, ge=30)
    theme: Optional[str] = None
    color_scheme: Optional[str] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None


class InsightCreate(BaseModel):
    """Schema for creating an AI insight"""
    widget_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    insight_type: str = Field(..., pattern="^(prediction|anomaly|recommendation|trend|alert)$")
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    data_period: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    model_used: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")


class InsightResponse(BaseModel):
    """Schema for AI insight responses"""
    id: int
    widget_id: Optional[int]
    title: str
    content: str
    insight_type: str
    confidence_score: float
    data_period: Optional[str]
    metrics: Optional[Dict[str, Any]]
    recommendations: Optional[List[str]]
    model_used: Optional[str]
    is_active: bool
    is_acknowledged: bool
    priority: str
    generated_at: datetime
    expires_at: Optional[datetime]
    acknowledged_at: Optional[datetime]


class WidgetResponse(BaseModel):
    """Schema for widget responses"""
    id: int
    title: str
    description: Optional[str]
    widget_type: str
    position: Dict[str, int]
    config: Dict[str, Any]
    data_source: Optional[str]
    refresh_interval: int
    theme: str
    color_scheme: str
    is_active: bool
    is_public: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    created_by: Optional[int]


class DashboardData(BaseModel):
    """Schema for complete dashboard data"""
    widgets: List[WidgetResponse]
    insights: List[InsightResponse]
    layout: Optional[Dict[str, Any]] = None
    analytics: Optional[Dict[str, Any]] = None



