"""
Simplified Dashboard Module API Endpoints
Handles global metrics functionality
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from ...core.database import get_db
from ...core.auth import get_current_user
from ...core.global_metrics import GlobalMetricsService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


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


@router.get("/health")
async def dashboard_health():
    """
    Dashboard module health check
    """
    return {
        "status": "healthy",
        "module": "dashboard",
        "timestamp": "2025-09-27T00:00:00Z"
    }