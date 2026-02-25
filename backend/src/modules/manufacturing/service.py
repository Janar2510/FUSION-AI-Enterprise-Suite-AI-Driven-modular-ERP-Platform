"""
Manufacturing Module Service
Business logic for production management, quality control, and inventory operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

from .models import (
    ProductionOrder, Product, WorkCenter, Routing, RoutingOperation,
    ProductionOperation, BillOfMaterial, BOMItem, InventoryItem,
    MaterialRequirement, QualityCheck, ProductionStatus, QualityStatus,
    OrderPriority, InventoryType
)
from .schemas import (
    ProductionOrderCreate, ProductionOrderUpdate, ProductionOrderResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    WorkCenterCreate, WorkCenterUpdate, WorkCenterResponse,
    QualityCheckCreate, QualityCheckResponse,
    ManufacturingDashboardMetrics, ManufacturingAnalytics
)


class ManufacturingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(self) -> Dict:
        """Get manufacturing dashboard metrics"""
        try:
            # Get basic production order counts
            total_orders_result = await self.db.execute(select(func.count(ProductionOrder.id)))
            total_orders = total_orders_result.scalar() or 0
            
            active_orders_result = await self.db.execute(
                select(func.count(ProductionOrder.id))
                .where(ProductionOrder.status == ProductionStatus.IN_PROGRESS.value)
            )
            active_orders = active_orders_result.scalar() or 0
            
            completed_orders_result = await self.db.execute(
                select(func.count(ProductionOrder.id))
                .where(ProductionOrder.status == ProductionStatus.COMPLETED.value)
            )
            completed_orders = completed_orders_result.scalar() or 0
            
            on_hold_orders_result = await self.db.execute(
                select(func.count(ProductionOrder.id))
                .where(ProductionOrder.status == ProductionStatus.ON_HOLD.value)
            )
            on_hold_orders = on_hold_orders_result.scalar() or 0
            
            cancelled_orders_result = await self.db.execute(
                select(func.count(ProductionOrder.id))
                .where(ProductionOrder.status == ProductionStatus.CANCELLED.value)
            )
            cancelled_orders = cancelled_orders_result.scalar() or 0
            
            # Calculate average completion time
            avg_completion_result = await self.db.execute(
                select(func.avg(
                    func.extract('epoch', ProductionOrder.actual_end_date - ProductionOrder.actual_start_date) / 3600
                ))
                .where(
                    and_(
                        ProductionOrder.actual_end_date.isnot(None),
                        ProductionOrder.actual_start_date.isnot(None)
                    )
                )
            )
            avg_completion_time = avg_completion_result.scalar() or 0.0
            
            # Calculate total production value
            total_value_result = await self.db.execute(
                select(func.sum(ProductionOrder.actual_cost))
                .where(ProductionOrder.actual_cost.isnot(None))
            )
            total_production_value = total_value_result.scalar() or 0.0
            
            # Get orders by status
            status_counts = {}
            for status in ProductionStatus:
                count_result = await self.db.execute(
                    select(func.count(ProductionOrder.id))
                    .where(ProductionOrder.status == status.value)
                )
                count = count_result.scalar() or 0
                if count > 0:
                    status_counts[status.value] = count
            
            # Get orders by priority
            priority_counts = {}
            for priority in OrderPriority:
                count_result = await self.db.execute(
                    select(func.count(ProductionOrder.id))
                    .where(ProductionOrder.priority == priority.value)
                )
                count = count_result.scalar() or 0
                if count > 0:
                    priority_counts[priority.value] = count
            
            # Get quality statistics
            total_checks_result = await self.db.execute(select(func.count(QualityCheck.id)))
            total_checks = total_checks_result.scalar() or 0
            
            passed_checks_result = await self.db.execute(
                select(func.count(QualityCheck.id))
                .where(QualityCheck.status == QualityStatus.PASSED.value)
            )
            passed_checks = passed_checks_result.scalar() or 0
            
            failed_checks_result = await self.db.execute(
                select(func.count(QualityCheck.id))
                .where(QualityCheck.status == QualityStatus.FAILED.value)
            )
            failed_checks = failed_checks_result.scalar() or 0
            
            pass_rate = (passed_checks / total_checks * 100) if total_checks > 0 else 0.0
            
            # Get inventory statistics
            total_items_result = await self.db.execute(select(func.count(InventoryItem.id)))
            total_items = total_items_result.scalar() or 0
            
            total_inventory_value_result = await self.db.execute(
                select(func.sum(InventoryItem.total_cost))
                .where(InventoryItem.total_cost.isnot(None))
            )
            total_inventory_value = total_inventory_value_result.scalar() or 0.0
            
            # Recent orders
            recent_orders_result = await self.db.execute(
                select(ProductionOrder)
                .order_by(desc(ProductionOrder.created_at))
                .limit(5)
            )
            recent_orders = recent_orders_result.scalars().all()
            
            return {
                "status": "success",
                "data": {
                    "production_statistics": {
                        "total_orders": total_orders,
                        "active_orders": active_orders,
                        "completed_orders": completed_orders,
                        "on_hold_orders": on_hold_orders,
                        "cancelled_orders": cancelled_orders,
                        "average_completion_time": round(avg_completion_time, 2),
                        "total_production_value": float(total_production_value)
                    },
                    "quality_statistics": {
                        "total_checks": total_checks,
                        "passed_checks": passed_checks,
                        "failed_checks": failed_checks,
                        "pass_rate": round(pass_rate, 2)
                    },
                    "inventory_statistics": {
                        "total_items": total_items,
                        "total_value": float(total_inventory_value)
                    },
                    "orders_by_status": status_counts,
                    "orders_by_priority": priority_counts,
                    "recent_orders": [self._serialize_production_order(order) for order in recent_orders],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            print(f"Error getting manufacturing dashboard metrics: {e}")
            return {
                "status": "error",
                "message": str(e),
                "data": {
                    "production_statistics": {
                        "total_orders": 0,
                        "active_orders": 0,
                        "completed_orders": 0,
                        "on_hold_orders": 0,
                        "cancelled_orders": 0,
                        "average_completion_time": 0.0,
                        "total_production_value": 0.0
                    },
                    "quality_statistics": {
                        "total_checks": 0,
                        "passed_checks": 0,
                        "failed_checks": 0,
                        "pass_rate": 0.0
                    },
                    "inventory_statistics": {
                        "total_items": 0,
                        "total_value": 0.0
                    },
                    "orders_by_status": {},
                    "orders_by_priority": {},
                    "recent_orders": [],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

    async def get_manufacturing_analytics(self, period_days: int = 30) -> Dict:
        """Get manufacturing analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Production volume trends
            volume_trends = []
            for i in range(period_days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                day_orders_result = await self.db.execute(
                    select(func.count(ProductionOrder.id))
                    .where(
                        and_(
                            ProductionOrder.created_at >= day_start,
                            ProductionOrder.created_at < day_end
                        )
                    )
                )
                day_orders = day_orders_result.scalar() or 0
                
                volume_trends.append({
                    "date": day_start.date().isoformat(),
                    "orders": day_orders
                })
            
            # Efficiency trends
            efficiency_trends = []
            for i in range(0, period_days, 7):  # Weekly intervals
                week_start = start_date + timedelta(days=i)
                week_end = week_start + timedelta(days=7)
                
                week_efficiency_result = await self.db.execute(
                    select(func.avg(ProductionOrder.completion_percentage))
                    .where(
                        and_(
                            ProductionOrder.created_at >= week_start,
                            ProductionOrder.created_at < week_end
                        )
                    )
                )
                week_efficiency = week_efficiency_result.scalar() or 0.0
                
                efficiency_trends.append({
                    "date": week_start.date().isoformat(),
                    "efficiency_percentage": round(week_efficiency, 2)
                })
            
            # Quality trends
            quality_trends = []
            for i in range(0, period_days, 7):  # Weekly intervals
                week_start = start_date + timedelta(days=i)
                week_end = week_start + timedelta(days=7)
                
                week_quality_result = await self.db.execute(
                    select(
                        func.count(QualityCheck.id).label('total'),
                        func.sum(
                            func.case(
                                (QualityCheck.status == QualityStatus.PASSED.value, 1),
                                else_=0
                            )
                        ).label('passed')
                    )
                    .where(
                        and_(
                            QualityCheck.created_at >= week_start,
                            QualityCheck.created_at < week_end
                        )
                    )
                )
                week_quality = week_quality_result.first()
                total_checks = week_quality.total or 0
                passed_checks = week_quality.passed or 0
                pass_rate = (passed_checks / total_checks * 100) if total_checks > 0 else 0.0
                
                quality_trends.append({
                    "date": week_start.date().isoformat(),
                    "pass_rate": round(pass_rate, 2)
                })
            
            # Order status distribution
            status_distribution = {}
            for status in ProductionStatus:
                count_result = await self.db.execute(
                    select(func.count(ProductionOrder.id))
                    .where(
                        and_(
                            ProductionOrder.status == status.value,
                            ProductionOrder.created_at >= start_date
                        )
                    )
                )
                count = count_result.scalar() or 0
                if count > 0:
                    status_distribution[status.value] = count
            
            # Priority distribution
            priority_distribution = {}
            for priority in OrderPriority:
                count_result = await self.db.execute(
                    select(func.count(ProductionOrder.id))
                    .where(
                        and_(
                            ProductionOrder.priority == priority.value,
                            ProductionOrder.created_at >= start_date
                        )
                    )
                )
                count = count_result.scalar() or 0
                if count > 0:
                    priority_distribution[priority.value] = count
            
            return {
                "period_days": period_days,
                "production_volume_trends": volume_trends,
                "efficiency_trends": efficiency_trends,
                "quality_trends": quality_trends,
                "order_status_distribution": status_distribution,
                "priority_distribution": priority_distribution,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting manufacturing analytics: {e}")
            return {
                "period_days": period_days,
                "production_volume_trends": [],
                "efficiency_trends": [],
                "quality_trends": [],
                "order_status_distribution": {},
                "priority_distribution": {},
                "timestamp": datetime.utcnow().isoformat()
            }

    # Production Order Management
    async def get_production_orders(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        product_id: Optional[int] = None,
        work_center_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated production orders with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(ProductionOrder)
            
            # Apply filters
            filters = []
            if status:
                filters.append(ProductionOrder.status == status)
            if priority:
                filters.append(ProductionOrder.priority == priority)
            if product_id:
                filters.append(ProductionOrder.product_id == product_id)
            if work_center_id:
                filters.append(ProductionOrder.work_center_id == work_center_id)
            if search:
                filters.append(
                    or_(
                        ProductionOrder.order_number.ilike(f"%{search}%"),
                        ProductionOrder.product_name.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(ProductionOrder.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            orders = result.scalars().all()
            
            return [self._serialize_production_order(order) for order in orders]
        except Exception as e:
            print(f"Error getting production orders: {e}")
            return []

    async def create_production_order(self, order_data: ProductionOrderCreate, user_id: int) -> Dict:
        """Create a new production order"""
        try:
            # Generate order number
            order_number = f"PO-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            
            order = ProductionOrder(
                order_number=order_number,
                product_id=order_data.product_id,
                product_name=order_data.product_name,
                quantity=order_data.quantity,
                priority=order_data.priority.value,
                planned_start_date=order_data.planned_start_date,
                planned_end_date=order_data.planned_end_date,
                work_center_id=order_data.work_center_id,
                routing_id=order_data.routing_id,
                quality_standards=order_data.quality_standards,
                notes=order_data.notes,
                specifications=order_data.specifications,
                customer_order_id=order_data.customer_order_id,
                created_by=user_id
            )
            
            self.db.add(order)
            await self.db.commit()
            await self.db.refresh(order)
            
            return self._serialize_production_order(order)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating production order: {e}")
            raise

    async def get_production_order_by_id(self, order_id: int) -> Optional[Dict]:
        """Get production order by ID"""
        try:
            result = await self.db.execute(
                select(ProductionOrder)
                .where(ProductionOrder.id == order_id)
            )
            order = result.scalar_one_or_none()
            
            if order:
                return self._serialize_production_order(order)
            return None
        except Exception as e:
            print(f"Error getting production order: {e}")
            return None

    async def update_production_order(self, order_id: int, order_data: ProductionOrderUpdate, user_id: int) -> Optional[Dict]:
        """Update production order"""
        try:
            result = await self.db.execute(
                select(ProductionOrder)
                .where(ProductionOrder.id == order_id)
            )
            order = result.scalar_one_or_none()
            
            if not order:
                return None
            
            # Update fields
            update_data = order_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                if hasattr(order, field):
                    setattr(order, field, value.value if hasattr(value, 'value') else value)
            
            order.updated_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(order)
            
            return self._serialize_production_order(order)
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating production order: {e}")
            raise

    async def delete_production_order(self, order_id: int) -> bool:
        """Delete production order"""
        try:
            result = await self.db.execute(
                select(ProductionOrder)
                .where(ProductionOrder.id == order_id)
            )
            order = result.scalar_one_or_none()
            
            if not order:
                return False
            
            await self.db.delete(order)
            await self.db.commit()
            
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error deleting production order: {e}")
            raise

    # Product Management
    async def get_products(
        self, 
        page: int = 1, 
        limit: int = 50,
        product_type: Optional[str] = None,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated products with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Product)
            
            # Apply filters
            filters = []
            if product_type:
                filters.append(Product.product_type == product_type)
            if category:
                filters.append(Product.category == category)
            if is_active is not None:
                filters.append(Product.is_active == is_active)
            if search:
                filters.append(
                    or_(
                        Product.product_code.ilike(f"%{search}%"),
                        Product.name.ilike(f"%{search}%"),
                        Product.description.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Product.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            products = result.scalars().all()
            
            return [self._serialize_product(product) for product in products]
        except Exception as e:
            print(f"Error getting products: {e}")
            return []

    async def create_product(self, product_data: ProductCreate, user_id: int) -> Dict:
        """Create a new product"""
        try:
            product = Product(
                product_code=product_data.product_code,
                name=product_data.name,
                description=product_data.description,
                product_type=product_data.product_type,
                category=product_data.category,
                unit_of_measure=product_data.unit_of_measure,
                dimensions=product_data.dimensions,
                weight=product_data.weight,
                specifications=product_data.specifications,
                standard_cycle_time=product_data.standard_cycle_time,
                is_make_to_order=product_data.is_make_to_order,
                is_make_to_stock=product_data.is_make_to_stock,
                minimum_stock_level=product_data.minimum_stock_level,
                maximum_stock_level=product_data.maximum_stock_level,
                reorder_point=product_data.reorder_point
            )
            
            self.db.add(product)
            await self.db.commit()
            await self.db.refresh(product)
            
            return self._serialize_product(product)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating product: {e}")
            raise

    # Quality Check Management
    async def get_quality_checks(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[str] = None,
        check_type: Optional[str] = None,
        production_order_id: Optional[int] = None
    ) -> List[Dict]:
        """Get paginated quality checks with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(QualityCheck)
            
            # Apply filters
            filters = []
            if status:
                filters.append(QualityCheck.status == status)
            if check_type:
                filters.append(QualityCheck.check_type == check_type)
            if production_order_id:
                filters.append(QualityCheck.production_order_id == production_order_id)
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(QualityCheck.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            checks = result.scalars().all()
            
            return [self._serialize_quality_check(check) for check in checks]
        except Exception as e:
            print(f"Error getting quality checks: {e}")
            return []

    async def create_quality_check(self, check_data: QualityCheckCreate, user_id: int) -> Dict:
        """Create a new quality check"""
        try:
            # Generate check number
            check_number = f"QC-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            
            check = QualityCheck(
                check_number=check_number,
                production_order_id=check_data.production_order_id,
                operation_id=check_data.operation_id,
                check_type=check_data.check_type.value,
                inspector_id=user_id,
                quantity_checked=check_data.quantity_checked,
                specifications=check_data.specifications,
                notes=check_data.notes
            )
            
            self.db.add(check)
            await self.db.commit()
            await self.db.refresh(check)
            
            return self._serialize_quality_check(check)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating quality check: {e}")
            raise

    # Serialization methods
    def _serialize_production_order(self, order: ProductionOrder) -> Dict:
        """Serialize production order to dict"""
        return {
            "id": order.id,
            "order_number": order.order_number,
            "product_id": order.product_id,
            "product_name": order.product_name,
            "quantity": order.quantity,
            "priority": order.priority,
            "status": order.status,
            "planned_start_date": order.planned_start_date.isoformat() if order.planned_start_date else None,
            "planned_end_date": order.planned_end_date.isoformat() if order.planned_end_date else None,
            "actual_start_date": order.actual_start_date.isoformat() if order.actual_start_date else None,
            "actual_end_date": order.actual_end_date.isoformat() if order.actual_end_date else None,
            "work_center_id": order.work_center_id,
            "routing_id": order.routing_id,
            "completion_percentage": float(order.completion_percentage) if order.completion_percentage else 0.0,
            "units_completed": order.units_completed,
            "units_scrapped": order.units_scrapped,
            "estimated_cost": float(order.estimated_cost) if order.estimated_cost else None,
            "actual_cost": float(order.actual_cost) if order.actual_cost else None,
            "material_cost": float(order.material_cost) if order.material_cost else None,
            "labor_cost": float(order.labor_cost) if order.labor_cost else None,
            "overhead_cost": float(order.overhead_cost) if order.overhead_cost else None,
            "quality_standards": order.quality_standards,
            "notes": order.notes,
            "specifications": order.specifications,
            "customer_order_id": order.customer_order_id,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None
        }

    def _serialize_product(self, product: Product) -> Dict:
        """Serialize product to dict"""
        return {
            "id": product.id,
            "product_code": product.product_code,
            "name": product.name,
            "description": product.description,
            "product_type": product.product_type,
            "category": product.category,
            "unit_of_measure": product.unit_of_measure,
            "dimensions": product.dimensions,
            "weight": float(product.weight) if product.weight else None,
            "specifications": product.specifications,
            "standard_cycle_time": float(product.standard_cycle_time) if product.standard_cycle_time else None,
            "is_make_to_order": product.is_make_to_order,
            "is_make_to_stock": product.is_make_to_stock,
            "minimum_stock_level": product.minimum_stock_level,
            "maximum_stock_level": product.maximum_stock_level,
            "reorder_point": product.reorder_point,
            "standard_cost": float(product.standard_cost) if product.standard_cost else None,
            "material_cost": float(product.material_cost) if product.material_cost else None,
            "labor_cost": float(product.labor_cost) if product.labor_cost else None,
            "overhead_cost": float(product.overhead_cost) if product.overhead_cost else None,
            "is_active": product.is_active,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None
        }

    def _serialize_quality_check(self, check: QualityCheck) -> Dict:
        """Serialize quality check to dict"""
        return {
            "id": check.id,
            "check_number": check.check_number,
            "production_order_id": check.production_order_id,
            "operation_id": check.operation_id,
            "check_type": check.check_type,
            "inspector_id": check.inspector_id,
            "status": check.status,
            "quantity_checked": check.quantity_checked,
            "quantity_passed": check.quantity_passed,
            "quantity_failed": check.quantity_failed,
            "specifications": check.specifications,
            "test_results": check.test_results,
            "notes": check.notes,
            "corrective_actions": check.corrective_actions,
            "created_at": check.created_at.isoformat() if check.created_at else None,
            "updated_at": check.updated_at.isoformat() if check.updated_at else None,
            "completed_at": check.completed_at.isoformat() if check.completed_at else None
        }
