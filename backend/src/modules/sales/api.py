from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from ...core.database import get_async_session
from .schemas import (
    QuoteCreate, QuoteResponse, QuoteUpdate, QuoteStatus,
    OrderCreate, OrderResponse, OrderUpdate, OrderStatus,
    RevenueCreate, RevenueResponse, SalesAnalytics
)
from .service import SalesService

router = APIRouter(prefix="/sales")

# Quote Endpoints
@router.post("/quotes", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    quote: QuoteCreate,
    user_id: int = 1,  # TODO: Get from auth
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new sales quote"""
    try:
        service = SalesService(db)
        new_quote = await service.create_quote(quote, user_id)
        return new_quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quotes", response_model=List[QuoteResponse])
async def get_quotes(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[QuoteStatus] = None,
    customer_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated quotes with filters"""
    try:
        service = SalesService(db)
        quotes = await service.get_quotes(
            page=page,
            limit=limit,
            status=status,
            customer_id=customer_id,
            search=search
        )
        return quotes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quotes/{quote_id}", response_model=QuoteResponse)
async def get_quote(
    quote_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_async_session)
):
    """Get a specific quote by ID"""
    try:
        service = SalesService(db)
        quote = await service.get_quote(quote_id)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        return quote
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/quotes/{quote_id}/status")
async def update_quote_status(
    quote_id: int = Path(..., gt=0),
    status: QuoteStatus = Query(...),
    db: AsyncSession = Depends(get_async_session)
):
    """Update quote status"""
    try:
        service = SalesService(db)
        success = await service.update_quote_status(quote_id, status)
        if not success:
            raise HTTPException(status_code=404, detail="Quote not found")
        return {"message": "Quote status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Order Endpoints
@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order_from_quote(
    quote_id: int = Query(..., gt=0),
    user_id: int = 1,  # TODO: Get from auth
    db: AsyncSession = Depends(get_async_session)
):
    """Create an order from an accepted quote"""
    try:
        service = SalesService(db)
        new_order = await service.create_order_from_quote(quote_id, user_id)
        return new_order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders", response_model=List[OrderResponse])
async def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[OrderStatus] = None,
    customer_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated orders with filters"""
    try:
        service = SalesService(db)
        orders = await service.get_orders(
            page=page,
            limit=limit,
            status=status,
            customer_id=customer_id,
            search=search
        )
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_async_session)
):
    """Get a specific order by ID"""
    try:
        service = SalesService(db)
        order = await service.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int = Path(..., gt=0),
    status: OrderStatus = Query(...),
    db: AsyncSession = Depends(get_async_session)
):
    """Update order status"""
    try:
        service = SalesService(db)
        success = await service.update_order_status(order_id, status)
        if not success:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"message": "Order status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Revenue Endpoints
@router.post("/revenue", response_model=RevenueResponse, status_code=status.HTTP_201_CREATED)
async def record_revenue(
    revenue: RevenueCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Record revenue for an order"""
    try:
        service = SalesService(db)
        new_revenue = await service.record_revenue(revenue)
        return new_revenue
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Endpoints
@router.get("/analytics")
async def get_sales_analytics(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_async_session)
):
    """Get sales analytics for the specified period"""
    try:
        service = SalesService(db)
        analytics = await service.get_sales_analytics(period_days)
        return {
            "status": "success",
            "data": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
async def get_sales_dashboard(
    db: AsyncSession = Depends(get_async_session)
):
    """Get sales dashboard metrics"""
    try:
        service = SalesService(db)
        
        # Get metrics for different periods
        analytics_30d = await service.get_sales_analytics(30)
        analytics_7d = await service.get_sales_analytics(7)
        
        # Get recent quotes and orders
        recent_quotes = await service.get_quotes(page=1, limit=5)
        recent_orders = await service.get_orders(page=1, limit=5)
        
        return {
            "status": "success",
            "data": {
                "metrics_30d": analytics_30d,
                "metrics_7d": analytics_7d,
                "recent_quotes": recent_quotes,
                "recent_orders": recent_orders,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
