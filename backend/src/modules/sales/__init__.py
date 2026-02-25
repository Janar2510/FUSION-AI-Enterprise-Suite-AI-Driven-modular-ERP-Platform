"""
Sales Module for FusionAI Enterprise Suite
Comprehensive sales management with AI-powered insights
"""

from .models import (
    SalesQuote, SalesQuoteItem, SalesOrder, SalesOrderItem, SalesRevenue,
    QuoteStatus, OrderStatus, PaymentStatus
)
from .schemas import (
    QuoteCreate, QuoteResponse, QuoteUpdate,
    OrderCreate, OrderResponse, OrderUpdate,
    RevenueCreate, RevenueResponse,
    SalesAnalytics, SalesForecast
)
from .service import SalesService
from .agents import SalesAgent
from .api import router

__all__ = [
    # Models
    "SalesQuote", "SalesQuoteItem", "SalesOrder", "SalesOrderItem", "SalesRevenue",
    "QuoteStatus", "OrderStatus", "PaymentStatus",
    
    # Schemas
    "QuoteCreate", "QuoteResponse", "QuoteUpdate",
    "OrderCreate", "OrderResponse", "OrderUpdate", 
    "RevenueCreate", "RevenueResponse",
    "SalesAnalytics", "SalesForecast",
    
    # Services
    "SalesService",
    
    # Agents
    "SalesAgent",
    
    # API
    "router"
]




