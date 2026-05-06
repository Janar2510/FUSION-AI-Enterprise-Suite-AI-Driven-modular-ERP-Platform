from sqlalchemy.orm import Session
import os
import json
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from .models import WebCart, WebCartItem
from ..inventory.models import InventoryProduct
from ..pos.models import LoyaltyProgram, LoyaltyCard

class OmnichannelRetailAgent:
    """
    AI Agent responsible for omnichannel retail flows:
    - Product Recommendations (Cross-sell/Up-sell)
    - Cart Abandonment Prediction & Offer Generation
    - Loyalty Program Optimization
    """
    def __init__(self, db: Session):
        self.db = db
        # Fallback to a default if not set, though ideally it should be set in environment
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.3
        ) if os.getenv("OPENAI_API_KEY") else None

    async def get_product_recommendations(self, session_id: str, current_product_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Analyzes the current cart or currently viewed product to suggest 3 related items.
        """
        cart = self.db.query(WebCart).filter(WebCart.session_id == session_id).first()
        
        # Get active products for context
        all_products = self.db.query(InventoryProduct).filter(InventoryProduct.is_active == True).limit(50).all()
        catalog = [{"id": p.id, "name": p.name, "category": p.category_id, "price": p.cost_price} for p in all_products]

        cart_items = []
        if cart and cart.items:
            cart_items = [{"name": item.product_name, "quantity": item.quantity} for item in cart.items]

        current_view = None
        if current_product_id:
            p = self.db.query(InventoryProduct).filter(InventoryProduct.id == current_product_id).first()
            if p:
                current_view = {"name": p.name, "category": p.category_id}

        if not self.llm:
            # Fallback mock logic if no API key
            return [{"product_id": p["id"], "name": p["name"], "reason": "Trending item"} for p in catalog[:3]]

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI Retail Merchandiser. Given a catalog of shape {catalog}, the user's cart {cart}, and the currently viewed item {current_view}, recommend exactly 3 product IDs from the catalog that would make good cross-sells or up-sells. Return JSON: {{\"recommendations\": [{{\"product_id\": int, \"reason\": \"short compelling reason\"}}]}}"),
            ("user", "Analyze and recommend.")
        ])

        chain = prompt | self.llm
        try:
            res = chain.invoke({
                "catalog": json.dumps(catalog),
                "cart": json.dumps(cart_items),
                "current_view": json.dumps(current_view)
            })
            content = res.content.replace("```json", "").replace("```", "").strip()
            data = json.loads(content)
            
            # Enrich with actual product data
            final_recs = []
            for rec in data.get("recommendations", []):
                p = next((x for x in catalog if x["id"] == rec["product_id"]), None)
                if p:
                    final_recs.append({
                        "product_id": p["id"],
                        "name": p["name"],
                        "price": p["price"],
                        "reason": rec["reason"]
                    })
            return final_recs
        except Exception as e:
            print(f"Recommendation generation failed: {e}")
            return [{"product_id": p["id"], "name": p["name"], "price": p["price"], "reason": "Featured product"} for p in catalog[:3]]

    async def predict_cart_abandonment(self, session_id: str) -> Dict[str, Any]:
        """
        Analyzes a cart's latency and total value to predict if the user will abandon it,
        and optionally generates a targeted discount offer.
        """
        cart = self.db.query(WebCart).filter(WebCart.session_id == session_id).first()
        if not cart or not cart.items:
            return {"risk_level": "low", "abandonment_probability": 0.0, "targeted_offer": None}

        time_since_last_activity = (datetime.now(timezone.utc) - cart.last_activity.replace(tzinfo=timezone.utc)).total_seconds()
        
        # Simple heuristic combined with AI evaluation
        cart_value = cart.total_amount
        item_count = len(cart.items)
        
        if not self.llm:
            risk = "high" if time_since_last_activity > 300 and cart_value > 100 else "low"
            return {"risk_level": risk, "abandonment_probability": 0.75 if risk == "high" else 0.1, "targeted_offer": "COMEBACK10" if risk == "high" else None}

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI Cart Abandonment model. Cart value: ${cart_value}, Items: {item_count}, Idle seconds: {idle}. Evaluate the risk of abandonment (low, medium, high). If high and cart value > $50, generate a compelling, short targeted_offer code (e.g. 'SAVE15'). Return JSON: {{\"risk_level\": \"...\", \"abandonment_probability\": float, \"targeted_offer\": \"string or null\"}}"),
            ("user", "Analyze risk.")
        ])

        try:
            res = (prompt | self.llm).invoke({
                "cart_value": cart_value,
                "item_count": item_count,
                "idle": int(time_since_last_activity)
            })
            content = res.content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception:
            return {"risk_level": "medium", "abandonment_probability": 0.5, "targeted_offer": None}

    async def optimize_loyalty(self, customer_id: int) -> Dict[str, Any]:
        """
        Evaluates a customer's loyalty profile and suggests tier upgrades or points bonuses.
        """
        # Note: Loyalty models will be added to the POS module
        card = self.db.query(LoyaltyCard).filter(LoyaltyCard.customer_id == customer_id).first()
        if not card:
            return {"action": "invite", "message": "Offer 500 bonus points to join loyalty program."}

        if not self.llm:
            if card.points > 1000:
                return {"action": "upgrade", "message": "Upgrade to Gold Tier eligible."}
            return {"action": "maintain", "message": f"{card.points} points active."}

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI Loyalty Optimizer. Customer {customer_id} has {points} points on tier '{tier}'. Decide the best action to retain them (upgrade, grant_bonus, maintain) and provide a short message. Return JSON: {{\"action\": \"...\", \"message\": \"...\", \"suggested_bonus_points\": int}}"),
            ("user", "Optimize loyalty strategy.")
        ])

        try:
            res = (prompt | self.llm).invoke({
                "customer_id": customer_id,
                "points": card.points,
                "tier": "Standard" # simplified for now
            })
            content = res.content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception:
            return {"action": "maintain", "message": "Keep current strategy.", "suggested_bonus_points": 0}
