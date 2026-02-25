#!/usr/bin/env python3
"""
Simplified main server for FusionAI Enterprise Suite
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting up FusionAI Enterprise Suite...")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="FusionAI Enterprise Suite",
    version="1.0.0",
    description="AI-Driven Modular ERP Platform",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include CRM router
try:
    from src.modules.crm.api_new import router as crm_router
    app.include_router(crm_router, prefix="/api/v1", tags=["CRM"])
    logger.info("CRM router included successfully")
except Exception as e:
    logger.error(f"Failed to include CRM router: {e}")

# Include Sales router
# try:
#     from src.modules.sales.api import router as sales_router
#     app.include_router(sales_router, prefix="/api/v1", tags=["Sales"])
#     logger.info("Sales router included successfully")
# except Exception as e:
#     logger.error(f"Failed to include Sales router: {e}")

# Include Inventory router
try:
    from src.modules.inventory.api import router as inventory_router
    app.include_router(inventory_router, prefix="/api/v1", tags=["Inventory"])
    logger.info("Inventory router included successfully")
except Exception as e:
    logger.error(f"Failed to include Inventory router: {e}")

# Include Accounting router
try:
    from src.modules.accounting.api import router as accounting_router
    app.include_router(accounting_router, tags=["Accounting"])
    logger.info("Accounting router included successfully")
except Exception as e:
    logger.error(f"Failed to include Accounting router: {e}")

# Include HR router
try:
    from src.modules.hr.api import router as hr_router
    app.include_router(hr_router, prefix="/api/v1/hr", tags=["HR"])
    logger.info("HR router included successfully")
except Exception as e:
    logger.error(f"Failed to include HR router: {e}")

# Include Invoicing router
try:
    from src.modules.invoicing.api import router as invoicing_router
    app.include_router(invoicing_router, tags=["Invoicing"])
    logger.info("Invoicing router included successfully")
except Exception as e:
    logger.error(f"Failed to include Invoicing router: {e}")

# Include Project router
try:
    from src.modules.project.api import router as project_router
    app.include_router(project_router, prefix="/api/v1/project", tags=["Project"])
    logger.info("Project router included successfully")
except Exception as e:
    logger.error(f"Failed to include Project router: {e}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "development",
        "services": {
            "api": "running",
            "websocket": "running on port 8080"
        }
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "FusionAI Enterprise Suite API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "api_endpoints": {
            "crm": "/api/v1/crm"
        }
    }

# Test CRM endpoint
@app.get("/api/v1/crm/contacts")
async def test_crm_contacts():
    """Test CRM contacts endpoint"""
    return {
        "contacts": [],
        "message": "CRM contacts endpoint working",
        "total": 0
    }

if __name__ == "__main__":
    logger.info("🚀 Starting FusionAI Enterprise Suite API Server...")
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=3001,
        reload=True,
        log_level="info"
    )