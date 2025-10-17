"""
Purchase Module API Endpoints
FastAPI routes for procurement management, vendor relations, and purchase order tracking
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from ...core.database import get_async_session
from .service import PurchaseService
from .schemas import (
    VendorCreate, VendorUpdate, VendorResponse,
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse,
    PurchaseOrderItemCreate, PurchaseOrderItemResponse,
    InvoiceCreate, InvoiceResponse,
    PurchaseDashboardMetrics, PurchaseAnalytics
)

router = APIRouter(prefix="/purchase", tags=["Purchase"])


@router.get("/dashboard", response_model=dict)
async def get_purchase_dashboard(
    db: AsyncSession = Depends(get_async_session)
):
    """Get purchase dashboard metrics and statistics"""
    try:
        service = PurchaseService(db)
        return await service.get_dashboard_metrics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get purchase dashboard: {str(e)}"
        )


@router.get("/analytics", response_model=dict)
async def get_purchase_analytics(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_async_session)
):
    """Get purchase analytics for the specified period"""
    try:
        service = PurchaseService(db)
        return await service.get_purchase_analytics(period_days)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get purchase analytics: {str(e)}"
        )


# Vendor Management Endpoints
@router.get("/vendors", response_model=List[dict])
async def get_vendors(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated vendors with filters"""
    try:
        service = PurchaseService(db)
        vendors = await service.get_vendors(
            page=page,
            limit=limit,
            status=status,
            industry=industry,
            search=search
        )
        return vendors
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get vendors: {str(e)}"
        )


@router.post("/vendors", response_model=dict)
async def create_vendor(
    vendor_data: VendorCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new vendor"""
    try:
        service = PurchaseService(db)
        vendor = await service.create_vendor(vendor_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Vendor created successfully",
            "data": vendor
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create vendor: {str(e)}"
        )


@router.get("/vendors/{vendor_id}", response_model=dict)
async def get_vendor(
    vendor_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get vendor by ID"""
    try:
        service = PurchaseService(db)
        vendor = await service.get_vendor_by_id(vendor_id)
        
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        return {
            "status": "success",
            "data": vendor
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get vendor: {str(e)}"
        )


# Purchase Order Management Endpoints
@router.get("/purchase-orders", response_model=List[dict])
async def get_purchase_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    vendor_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated purchase orders with filters"""
    try:
        service = PurchaseService(db)
        orders = await service.get_purchase_orders(
            page=page,
            limit=limit,
            status=status,
            vendor_id=vendor_id,
            search=search
        )
        return orders
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get purchase orders: {str(e)}"
        )


@router.post("/purchase-orders", response_model=dict)
async def create_purchase_order(
    order_data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new purchase order"""
    try:
        service = PurchaseService(db)
        order = await service.create_purchase_order(order_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Purchase order created successfully",
            "data": order
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create purchase order: {str(e)}"
        )


@router.get("/purchase-orders/{order_id}", response_model=dict)
async def get_purchase_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get purchase order by ID"""
    try:
        service = PurchaseService(db)
        order = await service.get_purchase_order_by_id(order_id)
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
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
            detail=f"Failed to get purchase order: {str(e)}"
        )


@router.put("/purchase-orders/{order_id}", response_model=dict)
async def update_purchase_order(
    order_id: int,
    order_data: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update purchase order"""
    try:
        service = PurchaseService(db)
        order = await service.update_purchase_order(order_id, order_data, 1)  # Default user_id
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        return {
            "status": "success",
            "message": "Purchase order updated successfully",
            "data": order
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update purchase order: {str(e)}"
        )


@router.delete("/purchase-orders/{order_id}")
async def delete_purchase_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete purchase order"""
    try:
        service = PurchaseService(db)
        success = await service.delete_purchase_order(order_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        return {
            "status": "success",
            "message": "Purchase order deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete purchase order: {str(e)}"
        )


# Purchase Order Items Management Endpoints
@router.get("/purchase-orders/{order_id}/items", response_model=List[dict])
async def get_purchase_order_items(
    order_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get items for a purchase order"""
    try:
        service = PurchaseService(db)
        items = await service.get_purchase_order_items(order_id)
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get purchase order items: {str(e)}"
        )


@router.post("/purchase-orders/{order_id}/items", response_model=dict)
async def create_purchase_order_item(
    order_id: int,
    item_data: PurchaseOrderItemCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new purchase order item"""
    try:
        # Set the purchase order ID from the URL parameter
        item_data.purchase_order_id = order_id
        
        service = PurchaseService(db)
        item = await service.create_purchase_order_item(item_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Purchase order item created successfully",
            "data": item
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create purchase order item: {str(e)}"
        )


# Invoice Management Endpoints
@router.get("/invoices", response_model=List[dict])
async def get_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    vendor_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated invoices with filters"""
    try:
        service = PurchaseService(db)
        invoices = await service.get_invoices(
            page=page,
            limit=limit,
            status=status,
            vendor_id=vendor_id,
            search=search
        )
        return invoices
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get invoices: {str(e)}"
        )


@router.post("/invoices", response_model=dict)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new invoice"""
    try:
        service = PurchaseService(db)
        invoice = await service.create_invoice(invoice_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Invoice created successfully",
            "data": invoice
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create invoice: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "purchase",
        "timestamp": datetime.utcnow().isoformat()
    }



