from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .models import (
    PaymentStatus, PaymentMethod, SaleStatus, TaxType,
    Terminal, TerminalCreate, TerminalUpdate,
    CashDrawer, CashDrawerCreate, CashDrawerUpdate,
    Sale, SaleCreate, SaleUpdate, SaleItem,
    Payment, PaymentCreate, PaymentUpdate,
    TaxRate, TaxRateCreate, TaxRateUpdate,
    Discount, DiscountCreate, DiscountUpdate
)

# Dashboard and Analytics Schemas
class POSDashboardStats(BaseModel):
    total_sales_today: float
    total_transactions_today: int
    average_transaction_value: float
    top_selling_products: List[dict]
    payment_methods_breakdown: List[dict]
    terminal_performance: List[dict]

class POSAnalytics(BaseModel):
    period: str
    total_revenue: float
    total_transactions: int
    average_transaction_value: float
    sales_by_hour: List[dict]
    sales_by_day: List[dict]
    top_products: List[dict]
    payment_methods: List[dict]

# Request/Response Schemas
class POSHealthCheck(BaseModel):
    status: str
    terminals_online: int
    active_cash_drawers: int
    last_sale_time: Optional[datetime]

class SaleSummary(BaseModel):
    sale_number: str
    total_amount: float
    item_count: int
    payment_methods: List[str]
    sale_date: datetime

class TerminalStatus(BaseModel):
    terminal_id: str
    name: str
    is_active: bool
    cash_drawer_open: bool
    last_sale: Optional[datetime]
    sales_today: int
    revenue_today: float

# Export all schemas
__all__ = [
    "POSDashboardStats", "POSAnalytics", "POSHealthCheck", "SaleSummary", "TerminalStatus",
    "Terminal", "TerminalCreate", "TerminalUpdate",
    "CashDrawer", "CashDrawerCreate", "CashDrawerUpdate", 
    "Sale", "SaleCreate", "SaleUpdate", "SaleItem",
    "Payment", "PaymentCreate", "PaymentUpdate",
    "TaxRate", "TaxRateCreate", "TaxRateUpdate",
    "Discount", "DiscountCreate", "DiscountUpdate"
]



