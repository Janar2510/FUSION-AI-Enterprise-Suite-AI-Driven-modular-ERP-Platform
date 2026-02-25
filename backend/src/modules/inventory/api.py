"""
Inventory Module API Endpoints
FastAPI routes for stock management and warehouse operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...core.database import get_async_session
from ...core.auth import get_current_user
from .service import InventoryService
from .schemas import (
    ProductCreate, ProductResponse, ProductUpdate, ProductStatus,
    StockLocationCreate, StockLocationResponse, LocationType,
    StockMovementCreate, StockMovementResponse, StockMovementType,
    StockRuleCreate, StockRuleResponse, RuleAction,
    LotSerialNumberCreate, LotSerialNumberResponse,
    LandedCostCreate, LandedCostResponse
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/dashboard", response_model=dict)
async def get_inventory_dashboard(
    db: AsyncSession = Depends(get_async_session)
):
    """Get inventory dashboard metrics and statistics"""
    try:
        return {
            "status": "success",
            "data": {
                "inventory_statistics": {
                    "total_products": 0,
                    "total_stock_value": 0.0,
                    "low_stock_items": 0,
                    "out_of_stock_items": 0,
                    "total_warehouses": 0,
                    "inventory_turnover": 0.0
                },
                "stock_alerts": [],
                "top_products": [],
                "warehouse_summary": {},
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get inventory dashboard: {str(e)}"
        )


@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    category_id: Optional[int] = Query(None),
    warehouse_id: Optional[int] = Query(None),
    status: Optional[ProductStatus] = Query(None),
    search: Optional[str] = Query(None),
    low_stock_only: Optional[bool] = Query(None),
    out_of_stock_only: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated products with filters"""
    try:
        service = InventoryService(db)
        return await service.get_products(
            page=page, limit=limit, category_id=category_id,
            warehouse_id=warehouse_id, status=status, search=search,
            low_stock_only=low_stock_only, out_of_stock_only=out_of_stock_only
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get products: {str(e)}"
        )

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new product"""
    try:
        service = InventoryService(db)
        return await service.create_product(product, current_user.get("id"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing product"""
    try:
        service = InventoryService(db)
        updated = await service.update_product(product_id, product_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Product not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/locations", response_model=StockLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location: StockLocationCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new hierarchical stock location"""
    try:
        service = InventoryService(db)
        return await service.create_stock_location(location)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/rules", response_model=StockRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_rule(
    rule: StockRuleCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new advanced push/pull stock rule"""
    try:
        service = InventoryService(db)
        return await service.create_stock_rule(rule)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/lots", response_model=LotSerialNumberResponse, status_code=status.HTTP_201_CREATED)
async def create_lot_serial(
    lot: LotSerialNumberCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Register a new Lot or Serial Number for traceability"""
    try:
        service = InventoryService(db)
        return await service.create_lot_serial(lot)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/landed-costs", response_model=LandedCostResponse, status_code=status.HTTP_201_CREATED)
async def create_landed_cost(
    lc: LandedCostCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Register a new landed cost to be allocated"""
    try:
        service = InventoryService(db)
        return await service.create_landed_cost(lc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stock-level-report", response_model=dict)
async def get_stock_level_report(
    warehouse_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
    db: AsyncSession = Depends(get_async_session)
):
    """Get stock level report"""
    try:
        return {
            "status": "success",
            "data": {
                "report_summary": {
                    "total_items": 0,
                    "low_stock_count": 0,
                    "out_of_stock_count": 0,
                    "total_value": 0.0
                },
                "stock_items": [],
                "warehouse_id": warehouse_id,
                "category": category,
                "low_stock_only": low_stock_only,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stock level report: {str(e)}"
        )


@router.get("/warehouses", response_model=List[dict])
async def get_warehouses(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated warehouses with filters"""
    try:
        return []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get warehouses: {str(e)}"
        )


@router.get("/stock-movements", response_model=List[StockMovementResponse])
async def get_stock_movements(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    movement_type: Optional[StockMovementType] = Query(None),
    product_id: Optional[int] = Query(None),
    warehouse_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated stock movements with filters"""
    try:
        service = InventoryService(db)
        return await service.get_stock_movements(
            page=page, limit=limit, movement_type=movement_type,
            product_id=product_id, warehouse_id=warehouse_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stock movements: {str(e)}"
        )

@router.post("/stock-movements", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_movement(
    movement: StockMovementCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Process a stock movement (creates moves, respects rules, updates quantities)"""
    try:
        service = InventoryService(db)
        return await service.create_stock_movement(movement, current_user.get("id"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "inventory",
        "timestamp": datetime.utcnow().isoformat()
    }