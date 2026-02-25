"""
CRM AI Agent for FusionAI Enterprise Suite
Handles customer relationship management, lead scoring, and sales operations
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json

from langchain.tools import Tool
from langchain.schema import HumanMessage, AIMessage

from src.agents.base import BaseAgent
from src.core.redis import Redis, CacheManager

logger = logging.getLogger(__name__)


class CRMAgent(BaseAgent):
    """AI Agent specialized in CRM and sales operations."""
    
    def __init__(self, llm, memory, redis: Redis, cache: CacheManager):
        super().__init__(llm, memory, redis, cache, name="CRMAgent")
        self.capabilities = [
            "lead_scoring",
            "customer_insights",
            "interaction_summary",
            "next_best_action",
            "opportunity_analysis",
            "contact_management",
            "sales_forecasting",
            "customer_segmentation"
        ]
        self.max_decision_amount = 25000  # Medium limit for sales operations
    
    async def initialize(self) -> None:
        """Initialize the CRM agent with tools."""
        try:
            self.tools = [
                Tool(
                    name="score_lead",
                    description="Score leads based on various criteria",
                    func=self._score_lead
                ),
                Tool(
                    name="analyze_customer",
                    description="Analyze customer data and behavior",
                    func=self._analyze_customer
                ),
                Tool(
                    name="summarize_interaction",
                    description="Summarize customer interactions",
                    func=self._summarize_interaction
                ),
                Tool(
                    name="suggest_next_action",
                    description="Suggest next best action for customer",
                    func=self._suggest_next_action
                ),
                Tool(
                    name="analyze_opportunity",
                    description="Analyze sales opportunities",
                    func=self._analyze_opportunity
                ),
                Tool(
                    name="update_contact",
                    description="Update contact information",
                    func=self._update_contact
                ),
                Tool(
                    name="forecast_sales",
                    description="Generate sales forecasts",
                    func=self._forecast_sales
                ),
                Tool(
                    name="segment_customers",
                    description="Segment customers based on behavior",
                    func=self._segment_customers
                )
            ]
            
            self.is_initialized = True
            logger.info("CRM Agent initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize CRM Agent: {e}")
            raise
    
    async def process_request(
        self, 
        request: str, 
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process CRM-related requests."""
        try:
            if not await self.validate_request(request):
                return {
                    "error": "Invalid request",
                    "status": "error",
                    "agent": self.name
                }
            
            request_type = await self._analyze_request_type(request)
            memory_context = await self.get_memory_context(request)
            prompt = self._build_prompt(request, request_type, memory_context, context)
            
            messages = [HumanMessage(content=prompt)]
            response = await self.llm.ainvoke(messages)
            
            await self.store_interaction(request, response.content, user_id)
            
            actions = await self._extract_actions(response.content)
            if actions:
                await self._execute_actions(actions, context)
            
            return {
                "response": response.content,
                "agent": self.name,
                "status": "success",
                "request_type": request_type,
                "actions_executed": len(actions) if actions else 0,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing request in CRM Agent: {e}")
            return {
                "error": str(e),
                "agent": self.name,
                "status": "error"
            }
    
    def get_capabilities(self) -> List[str]:
        """Get CRM agent capabilities."""
        return self.capabilities
    
    async def _analyze_request_type(self, request: str) -> str:
        """Analyze the type of CRM request."""
        request_lower = request.lower()
        
        if any(word in request_lower for word in ["lead", "prospect", "new customer"]):
            return "lead_management"
        elif any(word in request_lower for word in ["customer", "client", "account"]):
            return "customer_analysis"
        elif any(word in request_lower for word in ["interaction", "call", "meeting", "email"]):
            return "interaction_summary"
        elif any(word in request_lower for word in ["opportunity", "deal", "sale"]):
            return "opportunity_analysis"
        elif any(word in request_lower for word in ["forecast", "prediction", "trend"]):
            return "sales_forecasting"
        elif any(word in request_lower for word in ["segment", "group", "category"]):
            return "customer_segmentation"
        else:
            return "general_crm"
    
    def _build_prompt(
        self, 
        request: str, 
        request_type: str, 
        memory_context: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build a comprehensive prompt for the CRM agent."""
        prompt = f"""
You are an expert CRM AI assistant for FusionAI Enterprise Suite.
You specialize in customer relationship management, lead scoring, and sales operations.

Request Type: {request_type}
User Request: {request}

Previous Context:
{memory_context}

Available Tools:
{', '.join([tool.name for tool in self.tools])}

Instructions:
1. Analyze the request and provide CRM insights
2. Use appropriate tools for data analysis
3. Focus on customer value and relationship building
4. Provide actionable recommendations
5. Consider sales pipeline and conversion rates
6. Maintain customer-centric approach

Please provide a comprehensive response addressing the user's request.
"""
        
        if context:
            prompt += f"\nAdditional Context: {json.dumps(context, indent=2)}"
        
        return prompt
    
    async def _extract_actions(self, response: str) -> List[Dict[str, Any]]:
        """Extract actions from the AI response."""
        actions = []
        
        if "score lead" in response.lower():
            actions.append({"action": "score_lead", "data": {}})
        elif "analyze customer" in response.lower():
            actions.append({"action": "analyze_customer", "data": {}})
        elif "summarize interaction" in response.lower():
            actions.append({"action": "summarize_interaction", "data": {}})
        
        return actions
    
    async def _execute_actions(self, actions: List[Dict[str, Any]], context: Optional[Dict[str, Any]] = None) -> None:
        """Execute the extracted actions."""
        for action in actions:
            try:
                action_name = action["action"]
                action_data = action.get("data", {})
                
                for tool in self.tools:
                    if tool.name == action_name:
                        result = await tool.func(action_data)
                        logger.info(f"Executed action {action_name}: {result}")
                        break
                        
            except Exception as e:
                logger.error(f"Error executing action {action}: {e}")
    
    # Tool implementations
    async def _score_lead(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Score a lead based on various criteria."""
        try:
            lead_data = data.get("lead_data", {})
            
            # Simple scoring algorithm
            score = 0
            factors = []
            
            # Company size factor
            company_size = lead_data.get("company_size", 0)
            if company_size > 1000:
                score += 30
                factors.append("Large company (+30)")
            elif company_size > 100:
                score += 20
                factors.append("Medium company (+20)")
            else:
                score += 10
                factors.append("Small company (+10)")
            
            # Industry factor
            industry = lead_data.get("industry", "").lower()
            high_value_industries = ["technology", "finance", "healthcare", "manufacturing"]
            if any(ind in industry for ind in high_value_industries):
                score += 25
                factors.append("High-value industry (+25)")
            
            # Engagement factor
            engagement_score = lead_data.get("engagement_score", 0)
            score += min(engagement_score * 2, 20)
            factors.append(f"Engagement level (+{min(engagement_score * 2, 20)})")
            
            # Budget factor
            budget = lead_data.get("budget", 0)
            if budget > 100000:
                score += 25
                factors.append("High budget (+25)")
            elif budget > 50000:
                score += 15
                factors.append("Medium budget (+15)")
            
            # Determine lead quality
            if score >= 80:
                quality = "Hot Lead"
            elif score >= 60:
                quality = "Warm Lead"
            elif score >= 40:
                quality = "Cold Lead"
            else:
                quality = "Poor Lead"
            
            return {
                "success": True,
                "score": score,
                "quality": quality,
                "factors": factors,
                "recommendations": self._get_lead_recommendations(score)
            }
            
        except Exception as e:
            logger.error(f"Error scoring lead: {e}")
            return {"success": False, "error": str(e)}
    
    def _get_lead_recommendations(self, score: int) -> List[str]:
        """Get recommendations based on lead score."""
        if score >= 80:
            return [
                "Prioritize this lead for immediate follow-up",
                "Assign to senior sales representative",
                "Prepare personalized proposal"
            ]
        elif score >= 60:
            return [
                "Schedule follow-up call within 24 hours",
                "Send relevant case studies",
                "Add to nurturing campaign"
            ]
        elif score >= 40:
            return [
                "Add to general nurturing campaign",
                "Send educational content",
                "Follow up in 1 week"
            ]
        else:
            return [
                "Add to long-term nurturing campaign",
                "Focus on education and value",
                "Re-evaluate in 30 days"
            ]
    
    async def _analyze_customer(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze customer data and behavior."""
        try:
            customer_id = data.get("customer_id", "unknown")
            
            # Simulate customer analysis
            analysis = {
                "customer_id": customer_id,
                "lifetime_value": 15000,
                "churn_risk": "low",
                "engagement_level": "high",
                "preferred_communication": "email",
                "last_interaction": "2024-01-15",
                "total_orders": 25,
                "average_order_value": 600,
                "satisfaction_score": 4.5,
                "recommendations": [
                    "Offer premium support package",
                    "Introduce new product line",
                    "Schedule quarterly review"
                ]
            }
            
            return {
                "success": True,
                "analysis": analysis
            }
            
        except Exception as e:
            logger.error(f"Error analyzing customer: {e}")
            return {"success": False, "error": str(e)}
    
    async def _summarize_interaction(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize customer interactions."""
        try:
            interaction_data = data.get("interaction_data", {})
            
            summary = {
                "interaction_type": interaction_data.get("type", "call"),
                "duration": interaction_data.get("duration", 30),
                "key_points": [
                    "Customer interested in premium features",
                    "Concerned about implementation timeline",
                    "Requested technical documentation"
                ],
                "sentiment": "positive",
                "next_steps": [
                    "Send technical documentation",
                    "Schedule demo for premium features",
                    "Follow up in 3 days"
                ],
                "summary": "Productive call with interested prospect. Customer shows strong interest in premium features but has concerns about implementation timeline."
            }
            
            return {
                "success": True,
                "summary": summary
            }
            
        except Exception as e:
            logger.error(f"Error summarizing interaction: {e}")
            return {"success": False, "error": str(e)}
    
    async def _suggest_next_action(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest next best action for customer."""
        try:
            customer_context = data.get("customer_context", {})
            
            suggestions = [
                {
                    "action": "Send personalized email",
                    "priority": "high",
                    "timeline": "within 24 hours",
                    "reason": "Customer showed interest in demo"
                },
                {
                    "action": "Schedule product demo",
                    "priority": "medium",
                    "timeline": "within 3 days",
                    "reason": "Customer requested technical details"
                },
                {
                    "action": "Add to premium prospect list",
                    "priority": "low",
                    "timeline": "immediate",
                    "reason": "High engagement score"
                }
            ]
            
            return {
                "success": True,
                "suggestions": suggestions
            }
            
        except Exception as e:
            logger.error(f"Error suggesting next action: {e}")
            return {"success": False, "error": str(e)}
    
    async def _analyze_opportunity(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze sales opportunities."""
        try:
            opportunity_data = data.get("opportunity_data", {})
            
            analysis = {
                "opportunity_id": opportunity_data.get("id", "OPP-001"),
                "value": opportunity_data.get("value", 50000),
                "probability": 0.75,
                "stage": "proposal",
                "close_date": "2024-02-15",
                "competitors": ["Competitor A", "Competitor B"],
                "win_probability": 0.75,
                "risk_factors": [
                    "Budget approval pending",
                    "Technical requirements unclear"
                ],
                "recommendations": [
                    "Schedule technical review meeting",
                    "Prepare detailed proposal",
                    "Engage with decision makers"
                ]
            }
            
            return {
                "success": True,
                "analysis": analysis
            }
            
        except Exception as e:
            logger.error(f"Error analyzing opportunity: {e}")
            return {"success": False, "error": str(e)}
    
    async def _update_contact(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update contact information."""
        try:
            contact_id = data.get("contact_id", "unknown")
            updates = data.get("updates", {})
            
            # Simulate contact update
            updated_contact = {
                "contact_id": contact_id,
                "updated_fields": list(updates.keys()),
                "updated_at": datetime.utcnow().isoformat(),
                "status": "updated"
            }
            
            return {
                "success": True,
                "contact": updated_contact
            }
            
        except Exception as e:
            logger.error(f"Error updating contact: {e}")
            return {"success": False, "error": str(e)}
    
    async def _forecast_sales(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate sales forecasts."""
        try:
            period = data.get("period", "next_quarter")
            
            forecast = {
                "period": period,
                "forecasted_revenue": 250000,
                "confidence_level": 0.85,
                "growth_rate": 0.15,
                "key_assumptions": [
                    "Current pipeline conversion rate",
                    "Seasonal trends",
                    "Market conditions"
                ],
                "risks": [
                    "Economic uncertainty",
                    "Competition intensity",
                    "Resource constraints"
                ]
            }
            
            return {
                "success": True,
                "forecast": forecast
            }
            
        except Exception as e:
            logger.error(f"Error forecasting sales: {e}")
            return {"success": False, "error": str(e)}
    
    async def _segment_customers(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Segment customers based on behavior."""
        try:
            segmentation_criteria = data.get("criteria", "value_and_engagement")
            
            segments = {
                "high_value_high_engagement": {
                    "count": 25,
                    "description": "VIP customers with high engagement",
                    "strategy": "Premium support and exclusive offers"
                },
                "high_value_low_engagement": {
                    "count": 15,
                    "description": "High value but low engagement",
                    "strategy": "Re-engagement campaigns"
                },
                "low_value_high_engagement": {
                    "count": 40,
                    "description": "Low value but high engagement",
                    "strategy": "Upselling and cross-selling"
                },
                "low_value_low_engagement": {
                    "count": 20,
                    "description": "Low value and low engagement",
                    "strategy": "Basic nurturing or churn prevention"
                }
            }
            
            return {
                "success": True,
                "segments": segments,
                "total_customers": sum(seg["count"] for seg in segments.values())
            }
            
        except Exception as e:
            logger.error(f"Error segmenting customers: {e}")
            return {"success": False, "error": str(e)}




