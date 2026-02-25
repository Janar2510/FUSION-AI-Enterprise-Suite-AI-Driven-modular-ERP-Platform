"""
Manufacturing Module API Endpoints
FastAPI routes for production management, quality control, and inventory operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from ...core.database import get_async_session
from .service import ManufacturingService
from .schemas import (
    ProductionOrderCreate, ProductionOrderUpdate, ProductionOrderResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    WorkCenterCreate, WorkCenterUpdate, WorkCenterResponse,
    QualityCheckCreate, QualityCheckResponse,
    ManufacturingDashboardMetrics, ManufacturingAnalytics
)

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing"])


@router.get("/dashboard", response_model=dict)
async def get_manufacturing_dashboard(
    db: AsyncSession = Depends(get_async_session)
):
    """Get manufacturing dashboard metrics and statistics"""
    try:
        service = ManufacturingService(db)
        return await service.get_dashboard_metrics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get manufacturing dashboard: {str(e)}"
        )


@router.get("/analytics", response_model=dict)
async def get_manufacturing_analytics(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_async_session)
):
    """Get manufacturing analytics for the specified period"""
    try:
        service = ManufacturingService(db)
        return await service.get_manufacturing_analytics(period_days)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get manufacturing analytics: {str(e)}"
        )


# Production Order Management Endpoints
@router.get("/production-orders", response_model=List[dict])
async def get_production_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    work_center_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated production orders with filters"""
    try:
        service = ManufacturingService(db)
        orders = await service.get_production_orders(
            page=page,
            limit=limit,
            status=status,
            priority=priority,
            product_id=product_id,
            work_center_id=work_center_id,
            search=search
        )
        return orders
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get production orders: {str(e)}"
        )


@router.post("/production-orders", response_model=dict)
async def create_production_order(
    order_data: ProductionOrderCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new production order"""
    try:
        service = ManufacturingService(db)
        order = await service.create_production_order(order_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Production order created successfully",
            "data": order
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create production order: {str(e)}"
        )


@router.get("/production-orders/{order_id}", response_model=dict)
async def get_production_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get production order by ID"""
    try:
        service = ManufacturingService(db)
        order = await service.get_production_order_by_id(order_id)
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Production order not found"
            )
        
        return {
            "status": "success",
            "data": order
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get production order: {str(e)}"
        )


@router.put("/production-orders/{order_id}", response_model=dict)
async def update_production_order(
    order_id: int,
    order_data: ProductionOrderUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update production order"""
    try:
        service = ManufacturingService(db)
        order = await service.update_production_order(order_id, order_data, 1)  # Default user_id
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Production order not found"
            )
        
        return {
            "status": "success",
            "message": "Production order updated successfully",
            "data": order
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update production order: {str(e)}"
        )


@router.delete("/production-orders/{order_id}")
async def delete_production_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete production order"""
    try:
        service = ManufacturingService(db)
        success = await service.delete_production_order(order_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Production order not found"
            )
        
        return {
            "status": "success",
            "message": "Production order deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete production order: {str(e)}"
        )


# Product Management Endpoints
@router.get("/products", response_model=List[dict])
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    product_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated products with filters"""
    try:
        service = ManufacturingService(db)
        products = await service.get_products(
            page=page,
            limit=limit,
            product_type=product_type,
            category=category,
            is_active=is_active,
            search=search
        )
        return products
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get products: {str(e)}"
        )


@router.post("/products", response_model=dict)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new product"""
    try:
        service = ManufacturingService(db)
        product = await service.create_product(product_data, 1)  # Default user_id
        
        return {
            "status": "success",
            "message": "Product created successfully",
            "data": product
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )


# Quality Check Management Endpoints
@router.get("/quality-checks", response_model=List[dict])
async def get_quality_checks(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    check_type: Optional[str] = Query(None),
    production_order_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated quality checks with filters"""
    try:
        service = ManufacturingService(db)
        checks = await service.get_quality_checks(
            page=page,
            limit=limit,
            status=status,
            check_type=check_type,
            production_order_id=production_order_id
        )
        return checks
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get quality checks: {str(e)}"
        )


@router.post("/quality-checks", response_model=dict)
async def create_quality_check(
    check_data: QualityCheckCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new quality check"""
    try:
        service = ManufacturingService(db)
        check = await service.create_quality_check(check_data, 1)  # Default user_id
        
        return {
            "status": "success",
            "message": "Quality check created successfully",
            "data": check
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create quality check: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "manufacturing",
        "timestamp": datetime.utcnow().isoformat()
    }



