from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ...core.database import get_db
from .service import EcommerceService
from .agents import OmnichannelRetailAgent

router = APIRouter(prefix="/ecommerce", tags=["ecommerce"])

@router.post("/cart/{session_id}")
async def get_or_create_cart(session_id: str, db: Session = Depends(get_db)):
    service = EcommerceService(db)
    cart = service.get_or_create_cart(session_id)
    return cart

@router.post("/cart/{session_id}/items")
async def add_item_to_cart(
    session_id: str,
    product_id: int = Body(..., embed=True),
    quantity: float = Body(1.0, embed=True),
    db: Session = Depends(get_db)
):
    service = EcommerceService(db)
    cart = service.add_to_cart(session_id, product_id, quantity)
    return cart

@router.post("/cart/{session_id}/checkout")
async def checkout_cart(
    session_id: str,
    email: str = Body(..., embed=True),
    name: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    service = EcommerceService(db)
    web_order = service.checkout_cart(session_id, email, name)
    return web_order

@router.get("/products")
async def get_storefront_products(
    category_id: Optional[int] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    service = EcommerceService(db)
    products = service.get_products(category_id, limit)
    return products

# --- AI Agents ---

@router.post("/ai/recommendations")
async def get_recommendations(
    session_id: str = Body(..., embed=True),
    current_product_id: Optional[int] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    agent = OmnichannelRetailAgent(db)
    recommendations = await agent.get_product_recommendations(session_id, current_product_id)
    return recommendations

@router.post("/ai/abandonment")
async def check_cart_abandonment(
    session_id: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    agent = OmnichannelRetailAgent(db)
    abandonment_risk = await agent.predict_cart_abandonment(session_id)
    return abandonment_risk

@router.post("/ai/loyalty-optimize")
async def optimize_loyalty_tier(
    customer_id: int = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    agent = OmnichannelRetailAgent(db)
    optimization = await agent.optimize_loyalty(customer_id)
    return optimization
