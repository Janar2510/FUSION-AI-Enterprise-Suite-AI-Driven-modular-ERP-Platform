"""
Manufacturing AI Agent
Provides intelligent production optimization, quality control predictions, and scheduling.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from ...core.llm import LLMService

# Local imports
from .models import ProductionOrder, WorkCenter, QualityCheck, ProductionStatus, MasterProductionSchedule
from .service import ManufacturingService


class ManufacturingAgent:
    """
    AI Agent for Manufacturing Optimization.
    Capabilities:
    1. Production Scheduling Optimization
    2. Quality Prediction
    3. Master Production Schedule (MPS) Analysis
    """

    def __init__(self, db: AsyncSession, llm_service: LLMService):
        self.db = db
        self.llm = llm_service
        self.manufacturing_service = ManufacturingService(db)

    async def optimize_production_schedule(self) -> Dict[str, Any]:
        """
        Analyzes current planned and in-progress production orders alongside work center
        capacities to suggest an optimized schedule that minimizes bottlenecks.
        """
        try:
            # 1. Gather Work Center Data
            wc_query = select(WorkCenter)
            wc_result = await self.db.execute(wc_query)
            work_centers = wc_result.scalars().all()
            
            wc_data = [
                {
                    "id": wc.id,
                    "name": wc.name,
                    "capacity": wc.capacity,
                    "efficiency": wc.efficiency,
                    "is_available": wc.is_available
                } for wc in work_centers
            ]

            # 2. Gather Production Order Data (Unscheduled or Planned)
            order_query = select(ProductionOrder).where(
                ProductionOrder.status.in_([ProductionStatus.PLANNED.value, ProductionStatus.DRAFT.value])
            )
            order_result = await self.db.execute(order_query)
            orders = order_result.scalars().all()

            order_data = [
                {
                    "id": o.id,
                    "order_number": o.order_number,
                    "product_name": o.product_name,
                    "quantity": o.quantity,
                    "priority": o.priority,
                    "work_center_id": o.work_center_id,
                    "planned_start": o.planned_start_date.isoformat() if o.planned_start_date else None,
                    "planned_end": o.planned_end_date.isoformat() if o.planned_end_date else None
                } for o in orders
            ]

            prompt = f"""
            You are an expert AI Production Scheduler.
            Analyze the following work center capacities and planned production orders.
            Identify any bottlenecks, overallocation, or inefficiencies, and suggest an optimized 
            schedule.

            Work Centers:
            {wc_data}

            Planned Orders:
            {order_data}

            Provide a JSON response with:
            - "bottlenecks_identified": (list of str) Work centers that are overallocated.
            - "reschedule_recommendations": (list of objects) Suggesting new start/end dates or pushing orders to different work centers. Include 'order_id', 'suggested_work_center_id', 'suggested_start_date', 'reasoning'.
            - "overall_efficiency_score": (float 0.0-1.0) Expected efficiency if this schedule is adopted.
            """

            # Call LLM
            ai_response = await self.llm.generate_json(prompt)

            return {
                "optimization_results": ai_response,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Error in optimize_production_schedule: {e}")
            return {"error": str(e)}

    async def analyze_quality_trends(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Analyzes recent quality checks to predict potential systemic issues 
        or suggest corrective actions.
        """
        try:
            # Fetch recent quality checks
            qc_query = select(QualityCheck).order_by(QualityCheck.created_at.desc()).limit(100)
            qc_result = await self.db.execute(qc_query)
            checks = qc_result.scalars().all()

            check_data = [
                {
                    "id": c.id,
                    "status": c.status,
                    "quantity_checked": c.quantity_checked,
                    "quantity_failed": c.quantity_failed,
                    "notes": c.notes,
                    "corrective_actions": c.corrective_actions
                } for c in checks
            ]

            prompt = f"""
            You are an expert AI Quality Assurance Lead.
            Review the following recent quality check records and identify systemic trends,
            frequent failure modes, or areas requiring immediate attention.

            Quality Check Data:
            {check_data}

            Return a JSON object containing:
            - "systemic_issues_detected": (bool)
            - "primary_failure_modes": (list of str) The most common reasons for failure.
            - "recommended_process_changes": (list of str) Suggestions to improve the yield rate.
            - "risk_level": (str) High, Medium, or Low based on the failure frequencies.
            """

            ai_response = await self.llm.generate_json(prompt)
            return ai_response

        except Exception as e:
            print(f"Error in analyze_quality_trends: {e}")
            return {"error": str(e)}
