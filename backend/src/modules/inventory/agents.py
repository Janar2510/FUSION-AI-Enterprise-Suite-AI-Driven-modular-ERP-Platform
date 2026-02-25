"""
Inventory AI Agent
Provides intelligent forecasting, restock optimization, and warehouse analysis.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from ...core.llm import LLMService

# Local imports
from .models import Product, StockMovement, DemandForecast, WarehouseLocation, StockMovementType
from .service import InventoryService


class InventoryAgent:
    """
    AI Agent for Inventory Management.
    Capabilities:
    1. Demand Forecasting
    2. Restock Optimization
    3. Warehouse Putaway Strategies
    """

    def __init__(self, db: AsyncSession, llm_service: LLMService):
        self.db = db
        self.llm = llm_service
        self.inventory_service = InventoryService(db)

    async def generate_demand_forecast(self, product_id: int, period_days: int = 30) -> Dict[str, Any]:
        """
        Uses LLM to analyze historical stock movements and generate a demand forecast.
        In a full production scenario, this might augment a traditional timeseries ML model.
        """
        try:
            product = await self.db.get(Product, product_id)
            if not product:
                return {"error": f"Product {product_id} not found."}

            # Gather historical outbound movements representing sales/demand
            query = select(StockMovement).where(
                and_(
                    StockMovement.product_id == product_id,
                    StockMovement.movement_type == StockMovementType.OUTBOUND
                )
            ).order_by(StockMovement.created_at.desc()).limit(100)
            
            result = await self.db.execute(query)
            movements = result.scalars().all()

            historical_data = [
                {"date": m.created_at.isoformat() if m.created_at else "Unknown", "quantity": m.quantity, "reason": m.reason}
                for m in movements
            ]

            prompt = f"""
            You are an expert supply chain analyst. 
            Analyze the following historical outbound movements for product '{product.name}' (SKU: {product.sku}) 
            and generate a demand forecast for the next {period_days} days.

            Historical Data (last 100 outbound movements):
            {historical_data}

            Current stock: {product.current_stock}
            Reorder point: {product.reorder_point}

            Provide a JSON response with:
            - "forecasted_quantity": (int) Expected demand over the next {period_days} days.
            - "confidence_level": (float 0.0-1.0) Your confidence in this forecast.
            - "seasonal_factors": (dict) Any identified seasonal or trend factors.
            - "reasoning": (str) Brief explanation for your forecast.
            """

            # Call LLM (assuming LLMService has a method that parses json)
            ai_response = await self.llm.generate_json(prompt)

            return {
                "product_id": product_id,
                "product_name": product.name,
                "forecast_period": f"{period_days}_days",
                "forecast": ai_response,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Error in generate_demand_forecast: {e}")
            return {"error": str(e)}

    async def optimize_reorder_points(self) -> List[Dict[str, Any]]:
        """
        Analyzes all products and suggests optimized min/max and reorder points based on throughput.
        """
        try:
            # Get top 20 low stock or high throughput items for analysis
            # In a real app we would paginate this or run a batch job
            query = select(Product).limit(20)
            result = await self.db.execute(query)
            products = result.scalars().all()

            product_data = []
            for p in products:
                # Naive throughput calculation
                outbound_query = select(func.sum(StockMovement.quantity)).where(
                     and_(
                         StockMovement.product_id == p.id,
                         StockMovement.movement_type == StockMovementType.OUTBOUND
                     )
                )
                ts_res = await self.db.execute(outbound_query)
                total_outbound = ts_res.scalar_one_or_none() or 0

                product_data.append({
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "current_stock": p.current_stock,
                    "current_min_stock": p.min_stock_level,
                    "current_max_stock": p.max_stock_level,
                    "current_reorder_point": p.reorder_point,
                    "historical_outbound": total_outbound
                })

            prompt = f"""
            You are an AI Inventory Optimization Agent.
            Review the following list of products and their historical outbound throughput.
            Suggest optimized reorder points and min/max stock levels to prevent stockouts while minimizing holding costs.

            Product Data:
            {product_data}

            Return a JSON object containing a list called "optimizations". Each item must have:
            - "product_id"
            - "suggested_min_stock"
            - "suggested_max_stock"
            - "suggested_reorder_point"
            - "reasoning"
            """

            ai_response = await self.llm.generate_json(prompt)
            return ai_response.get("optimizations", [])

        except Exception as e:
            print(f"Error in optimize_reorder_points: {e}")
            return [{"error": str(e)}]
