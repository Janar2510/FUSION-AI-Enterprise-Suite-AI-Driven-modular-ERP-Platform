"""
Accounting AI Agent for FusionAI Enterprise Suite
Handles financial operations, invoice processing, and accounting tasks
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


class AccountingAgent(BaseAgent):
    """AI Agent specialized in accounting and financial operations."""
    
    def __init__(self, llm, memory, redis: Redis, cache: CacheManager):
        super().__init__(llm, memory, redis, cache, name="AccountingAgent")
        self.capabilities = [
            "invoice_processing",
            "expense_categorization", 
            "tax_calculation",
            "financial_reporting",
            "budget_analysis",
            "payment_processing",
            "reconciliation",
            "audit_trail"
        ]
        self.max_decision_amount = 50000  # Higher limit for accounting operations
    
    async def initialize(self) -> None:
        """Initialize the accounting agent with tools."""
        try:
            # Create accounting-specific tools
            self.tools = [
                Tool(
                    name="process_invoice",
                    description="Process and validate invoice data",
                    func=self._process_invoice
                ),
                Tool(
                    name="categorize_expense",
                    description="Categorize expenses based on type and amount",
                    func=self._categorize_expense
                ),
                Tool(
                    name="calculate_tax",
                    description="Calculate tax amounts for transactions",
                    func=self._calculate_tax
                ),
                Tool(
                    name="generate_financial_report",
                    description="Generate financial reports and summaries",
                    func=self._generate_financial_report
                ),
                Tool(
                    name="analyze_budget",
                    description="Analyze budget performance and variances",
                    func=self._analyze_budget
                ),
                Tool(
                    name="process_payment",
                    description="Process payment transactions",
                    func=self._process_payment
                ),
                Tool(
                    name="reconcile_accounts",
                    description="Reconcile account balances",
                    func=self._reconcile_accounts
                )
            ]
            
            self.is_initialized = True
            logger.info("Accounting Agent initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Accounting Agent: {e}")
            raise
    
    async def process_request(
        self, 
        request: str, 
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process accounting-related requests."""
        try:
            if not await self.validate_request(request):
                return {
                    "error": "Invalid request",
                    "status": "error",
                    "agent": self.name
                }
            
            # Analyze request type
            request_type = await self._analyze_request_type(request)
            
            # Get relevant context
            memory_context = await self.get_memory_context(request)
            
            # Build prompt with context
            prompt = self._build_prompt(request, request_type, memory_context, context)
            
            # Process with LLM
            messages = [HumanMessage(content=prompt)]
            response = await self.llm.ainvoke(messages)
            
            # Store interaction
            await self.store_interaction(request, response.content, user_id)
            
            # Execute any required actions
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
            logger.error(f"Error processing request in Accounting Agent: {e}")
            return {
                "error": str(e),
                "agent": self.name,
                "status": "error"
            }
    
    def get_capabilities(self) -> List[str]:
        """Get accounting agent capabilities."""
        return self.capabilities
    
    async def _analyze_request_type(self, request: str) -> str:
        """Analyze the type of accounting request."""
        request_lower = request.lower()
        
        if any(word in request_lower for word in ["invoice", "bill", "receipt"]):
            return "invoice_processing"
        elif any(word in request_lower for word in ["expense", "cost", "spending"]):
            return "expense_categorization"
        elif any(word in request_lower for word in ["tax", "vat", "gst"]):
            return "tax_calculation"
        elif any(word in request_lower for word in ["report", "summary", "statement"]):
            return "financial_reporting"
        elif any(word in request_lower for word in ["budget", "forecast", "planning"]):
            return "budget_analysis"
        elif any(word in request_lower for word in ["payment", "pay", "transfer"]):
            return "payment_processing"
        elif any(word in request_lower for word in ["reconcile", "balance", "match"]):
            return "reconciliation"
        else:
            return "general_accounting"
    
    def _build_prompt(
        self, 
        request: str, 
        request_type: str, 
        memory_context: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build a comprehensive prompt for the accounting agent."""
        prompt = f"""
You are an expert accounting AI assistant for FusionAI Enterprise Suite. 
You specialize in financial operations, invoice processing, and accounting tasks.

Request Type: {request_type}
User Request: {request}

Previous Context:
{memory_context}

Available Tools:
{', '.join([tool.name for tool in self.tools])}

Instructions:
1. Analyze the request and determine the best approach
2. Use appropriate tools if needed
3. Provide accurate financial advice and calculations
4. Ensure compliance with accounting standards
5. Be precise with numbers and calculations
6. Suggest next steps when appropriate

Please provide a comprehensive response addressing the user's request.
"""
        
        if context:
            prompt += f"\nAdditional Context: {json.dumps(context, indent=2)}"
        
        return prompt
    
    async def _extract_actions(self, response: str) -> List[Dict[str, Any]]:
        """Extract actions from the AI response."""
        # Simple action extraction - in production, use more sophisticated parsing
        actions = []
        
        if "process invoice" in response.lower():
            actions.append({"action": "process_invoice", "data": {}})
        elif "categorize expense" in response.lower():
            actions.append({"action": "categorize_expense", "data": {}})
        elif "calculate tax" in response.lower():
            actions.append({"action": "calculate_tax", "data": {}})
        
        return actions
    
    async def _execute_actions(self, actions: List[Dict[str, Any]], context: Optional[Dict[str, Any]] = None) -> None:
        """Execute the extracted actions."""
        for action in actions:
            try:
                action_name = action["action"]
                action_data = action.get("data", {})
                
                # Find and execute the tool
                for tool in self.tools:
                    if tool.name == action_name:
                        result = await tool.func(action_data)
                        logger.info(f"Executed action {action_name}: {result}")
                        break
                        
            except Exception as e:
                logger.error(f"Error executing action {action}: {e}")
    
    # Tool implementations
    async def _process_invoice(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process invoice data."""
        try:
            # Simulate invoice processing
            invoice_id = data.get("invoice_id", f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}")
            
            # Store in cache
            cache_key = f"invoice:{invoice_id}"
            invoice_data = {
                "id": invoice_id,
                "status": "processed",
                "amount": data.get("amount", 0),
                "vendor": data.get("vendor", "Unknown"),
                "processed_at": datetime.utcnow().isoformat()
            }
            
            await self.cache.set(cache_key, invoice_data, ttl=86400)
            
            return {
                "success": True,
                "invoice_id": invoice_id,
                "message": "Invoice processed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error processing invoice: {e}")
            return {"success": False, "error": str(e)}
    
    async def _categorize_expense(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Categorize expense based on type and amount."""
        try:
            amount = data.get("amount", 0)
            description = data.get("description", "").lower()
            
            # Simple categorization logic
            if "travel" in description or "transport" in description:
                category = "Travel & Transportation"
            elif "office" in description or "supplies" in description:
                category = "Office Supplies"
            elif "software" in description or "subscription" in description:
                category = "Software & Subscriptions"
            elif "meals" in description or "food" in description:
                category = "Meals & Entertainment"
            elif amount > 1000:
                category = "Major Equipment"
            else:
                category = "General Business Expense"
            
            return {
                "success": True,
                "category": category,
                "confidence": 0.85
            }
            
        except Exception as e:
            logger.error(f"Error categorizing expense: {e}")
            return {"success": False, "error": str(e)}
    
    async def _calculate_tax(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate tax amounts."""
        try:
            amount = data.get("amount", 0)
            tax_rate = data.get("tax_rate", 0.1)  # Default 10%
            tax_type = data.get("tax_type", "VAT")
            
            tax_amount = amount * tax_rate
            total_amount = amount + tax_amount
            
            return {
                "success": True,
                "original_amount": amount,
                "tax_rate": tax_rate,
                "tax_amount": tax_amount,
                "total_amount": total_amount,
                "tax_type": tax_type
            }
            
        except Exception as e:
            logger.error(f"Error calculating tax: {e}")
            return {"success": False, "error": str(e)}
    
    async def _generate_financial_report(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate financial report."""
        try:
            report_type = data.get("report_type", "summary")
            period = data.get("period", "current_month")
            
            # Simulate report generation
            report = {
                "report_type": report_type,
                "period": period,
                "generated_at": datetime.utcnow().isoformat(),
                "summary": {
                    "total_revenue": 50000,
                    "total_expenses": 30000,
                    "net_profit": 20000,
                    "profit_margin": 0.4
                }
            }
            
            # Store report
            cache_key = f"financial_report:{report_type}:{period}"
            await self.cache.set(cache_key, report, ttl=3600)
            
            return {
                "success": True,
                "report": report
            }
            
        except Exception as e:
            logger.error(f"Error generating financial report: {e}")
            return {"success": False, "error": str(e)}
    
    async def _analyze_budget(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze budget performance."""
        try:
            budget_id = data.get("budget_id", "default")
            
            # Simulate budget analysis
            analysis = {
                "budget_id": budget_id,
                "total_budget": 100000,
                "actual_spent": 75000,
                "remaining": 25000,
                "variance": 0.25,
                "status": "on_track",
                "recommendations": [
                    "Consider increasing marketing budget",
                    "Monitor travel expenses closely"
                ]
            }
            
            return {
                "success": True,
                "analysis": analysis
            }
            
        except Exception as e:
            logger.error(f"Error analyzing budget: {e}")
            return {"success": False, "error": str(e)}
    
    async def _process_payment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment transaction."""
        try:
            amount = data.get("amount", 0)
            payment_method = data.get("payment_method", "bank_transfer")
            
            # Check decision limits
            if not await self.check_decision_limits(amount):
                return {
                    "success": False,
                    "error": "Amount exceeds decision limit",
                    "requires_approval": True
                }
            
            # Simulate payment processing
            payment_id = f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            payment_data = {
                "id": payment_id,
                "amount": amount,
                "method": payment_method,
                "status": "processed",
                "processed_at": datetime.utcnow().isoformat()
            }
            
            # Store payment
            cache_key = f"payment:{payment_id}"
            await self.cache.set(cache_key, payment_data, ttl=86400)
            
            return {
                "success": True,
                "payment_id": payment_id,
                "message": "Payment processed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error processing payment: {e}")
            return {"success": False, "error": str(e)}
    
    async def _reconcile_accounts(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Reconcile account balances."""
        try:
            account_id = data.get("account_id", "default")
            
            # Simulate reconciliation
            reconciliation = {
                "account_id": account_id,
                "statement_balance": 10000,
                "book_balance": 9950,
                "difference": 50,
                "status": "reconciled",
                "reconciled_at": datetime.utcnow().isoformat()
            }
            
            return {
                "success": True,
                "reconciliation": reconciliation
            }
            
        except Exception as e:
            logger.error(f"Error reconciling accounts: {e}")
            return {"success": False, "error": str(e)}




