"""
Main API router for FusionAI Enterprise Suite
"""

from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware

from .endpoints import auth, modules, dashboard
# from .endpoints import ai  # Temporarily disabled due to LangChain conflicts
# from src.modules.crm.api import router as crm_router  # Temporarily disabled due to import issues
from src.modules.sales.api import router as sales_router
from src.modules.documents.api import router as documents_router
from src.modules.helpdesk.api import router as helpdesk_router
from src.modules.manufacturing.api import router as manufacturing_router
from src.modules.purchase.api import router as purchase_router
from src.modules.subscriptions.api import router as subscriptions_router
from src.modules.accounting.api import router as accounting_router
from src.modules.crm.api import router as crm_router
from src.modules.inventory.api import router as inventory_router
from src.modules.hr.api import router as hr_router

# Create main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(modules.router, prefix="/modules", tags=["Modules"])
# api_router.include_router(ai.router, prefix="/ai", tags=["AI"])  # Temporarily disabled
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
# api_router.include_router(crm_router, tags=["CRM"])  # Temporarily disabled due to import issues
api_router.include_router(sales_router, tags=["Sales"])
api_router.include_router(documents_router, tags=["Documents"])
api_router.include_router(helpdesk_router, tags=["Helpdesk"])
api_router.include_router(manufacturing_router, tags=["Manufacturing"])
api_router.include_router(purchase_router, tags=["Purchase"])
api_router.include_router(subscriptions_router, tags=["Subscriptions"])
api_router.include_router(accounting_router, tags=["Accounting"])
api_router.include_router(crm_router, tags=["CRM"])
api_router.include_router(inventory_router, tags=["Inventory"])
api_router.include_router(hr_router, tags=["HR"])
