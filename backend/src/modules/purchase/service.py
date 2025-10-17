"""
Purchase Module Service
Business logic for procurement management, vendor relations, and purchase order tracking
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

from .models import (
    Vendor, PurchaseOrder, PurchaseOrderItem, PurchaseReceipt, PurchaseReceiptItem,
    Invoice, Payment, PurchaseOrderStatus, VendorStatus, PaymentStatus, InvoiceStatus
)
from .schemas import (
    VendorCreate, VendorUpdate, VendorResponse,
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse,
    PurchaseOrderItemCreate, PurchaseOrderItemResponse,
    InvoiceCreate, InvoiceResponse,
    PurchaseDashboardMetrics, PurchaseAnalytics
)


class PurchaseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(self) -> Dict:
        """Get purchase dashboard metrics"""
        try:
            # Get basic purchase order counts
            total_orders_result = await self.db.execute(select(func.count(PurchaseOrder.id)))
            total_orders = total_orders_result.scalar() or 0
            
            pending_orders_result = await self.db.execute(
                select(func.count(PurchaseOrder.id))
                .where(PurchaseOrder.status == PurchaseOrderStatus.PENDING_APPROVAL.value)
            )
            pending_orders = pending_orders_result.scalar() or 0
            
            approved_orders_result = await self.db.execute(
                select(func.count(PurchaseOrder.id))
                .where(PurchaseOrder.status == PurchaseOrderStatus.APPROVED.value)
            )
            approved_orders = approved_orders_result.scalar() or 0
            
            received_orders_result = await self.db.execute(
                select(func.count(PurchaseOrder.id))
                .where(PurchaseOrder.status == PurchaseOrderStatus.RECEIVED.value)
            )
            received_orders = received_orders_result.scalar() or 0
            
            cancelled_orders_result = await self.db.execute(
                select(func.count(PurchaseOrder.id))
                .where(PurchaseOrder.status == PurchaseOrderStatus.CANCELLED.value)
            )
            cancelled_orders = cancelled_orders_result.scalar() or 0
            
            # Calculate total value
            total_value_result = await self.db.execute(
                select(func.sum(PurchaseOrder.total_amount))
                .where(PurchaseOrder.total_amount.isnot(None))
            )
            total_value = total_value_result.scalar() or 0.0
            
            # Calculate average order value
            avg_order_value_result = await self.db.execute(
                select(func.avg(PurchaseOrder.total_amount))
                .where(PurchaseOrder.total_amount.isnot(None))
            )
            avg_order_value = avg_order_value_result.scalar() or 0.0
            
            # Get vendor statistics
            total_vendors_result = await self.db.execute(select(func.count(Vendor.id)))
            total_vendors = total_vendors_result.scalar() or 0
            
            active_vendors_result = await self.db.execute(
                select(func.count(Vendor.id))
                .where(Vendor.status == VendorStatus.ACTIVE.value)
            )
            active_vendors = active_vendors_result.scalar() or 0
            
            # Get orders by status
            status_counts = {}
            for status in PurchaseOrderStatus:
                count_result = await self.db.execute(
                    select(func.count(PurchaseOrder.id))
                    .where(PurchaseOrder.status == status.value)
                )
                count = count_result.scalar() or 0
                if count > 0:
                    status_counts[status.value] = count
            
            # Get top vendors by order count
            top_vendors_result = await self.db.execute(
                select(Vendor.name, func.count(PurchaseOrder.id).label('order_count'))
                .join(PurchaseOrder, Vendor.id == PurchaseOrder.vendor_id)
                .group_by(Vendor.id, Vendor.name)
                .order_by(desc('order_count'))
                .limit(5)
            )
            top_vendors = [{"name": row.name, "order_count": row.order_count} for row in top_vendors_result]
            
            # Recent orders
            recent_orders_result = await self.db.execute(
                select(PurchaseOrder)
                .order_by(desc(PurchaseOrder.created_at))
                .limit(5)
            )
            recent_orders = recent_orders_result.scalars().all()
            
            # Pending approvals
            pending_approvals_result = await self.db.execute(
                select(PurchaseOrder)
                .where(PurchaseOrder.status == PurchaseOrderStatus.PENDING_APPROVAL.value)
                .order_by(desc(PurchaseOrder.created_at))
                .limit(5)
            )
            pending_approvals = pending_approvals_result.scalars().all()
            
            return {
                "status": "success",
                "data": {
                    "purchase_statistics": {
                        "total_orders": total_orders,
                        "total_value": float(total_value),
                        "pending_orders": pending_orders,
                        "approved_orders": approved_orders,
                        "received_orders": received_orders,
                        "cancelled_orders": cancelled_orders,
                        "average_order_value": float(avg_order_value)
                    },
                    "vendor_statistics": {
                        "total_vendors": total_vendors,
                        "active_vendors": active_vendors
                    },
                    "orders_by_status": status_counts,
                    "top_vendors": top_vendors,
                    "recent_orders": [self._serialize_purchase_order(order) for order in recent_orders],
                    "pending_approvals": [self._serialize_purchase_order(order) for order in pending_approvals],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            print(f"Error getting purchase dashboard metrics: {e}")
            return {
                "status": "error",
                "message": str(e),
                "data": {
                    "purchase_statistics": {
                        "total_orders": 0,
                        "total_value": 0.0,
                        "pending_orders": 0,
                        "approved_orders": 0,
                        "received_orders": 0,
                        "cancelled_orders": 0,
                        "average_order_value": 0.0
                    },
                    "vendor_statistics": {
                        "total_vendors": 0,
                        "active_vendors": 0
                    },
                    "orders_by_status": {},
                    "top_vendors": [],
                    "recent_orders": [],
                    "pending_approvals": [],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

    async def get_purchase_analytics(self, period_days: int = 30) -> Dict:
        """Get purchase analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Spending trends
            spending_trends = []
            for i in range(period_days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                day_spending_result = await self.db.execute(
                    select(func.sum(PurchaseOrder.total_amount))
                    .where(
                        and_(
                            PurchaseOrder.order_date >= day_start,
                            PurchaseOrder.order_date < day_end,
                            PurchaseOrder.total_amount.isnot(None)
                        )
                    )
                )
                day_spending = day_spending_result.scalar() or 0.0
                
                spending_trends.append({
                    "date": day_start.date().isoformat(),
                    "amount": float(day_spending)
                })
            
            # Vendor performance
            vendor_performance_result = await self.db.execute(
                select(
                    Vendor.name,
                    func.count(PurchaseOrder.id).label('order_count'),
                    func.sum(PurchaseOrder.total_amount).label('total_spent'),
                    func.avg(Vendor.rating).label('average_rating')
                )
                .join(PurchaseOrder, Vendor.id == PurchaseOrder.vendor_id)
                .where(PurchaseOrder.created_at >= start_date)
                .group_by(Vendor.id, Vendor.name)
                .order_by(desc('total_spent'))
                .limit(10)
            )
            vendor_performance = [
                {
                    "name": row.name,
                    "order_count": row.order_count,
                    "total_spent": float(row.total_spent or 0),
                    "average_rating": float(row.average_rating or 0)
                }
                for row in vendor_performance_result
            ]
            
            # Order status distribution
            status_distribution = {}
            for status in PurchaseOrderStatus:
                count_result = await self.db.execute(
                    select(func.count(PurchaseOrder.id))
                    .where(
                        and_(
                            PurchaseOrder.status == status.value,
                            PurchaseOrder.created_at >= start_date
                        )
                    )
                )
                count = count_result.scalar() or 0
                if count > 0:
                    status_distribution[status.value] = count
            
            return {
                "period_days": period_days,
                "spending_trends": spending_trends,
                "vendor_performance": vendor_performance,
                "order_status_distribution": status_distribution,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting purchase analytics: {e}")
            return {
                "period_days": period_days,
                "spending_trends": [],
                "vendor_performance": [],
                "order_status_distribution": {},
                "timestamp": datetime.utcnow().isoformat()
            }

    # Vendor Management
    async def get_vendors(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[str] = None,
        industry: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated vendors with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Vendor)
            
            # Apply filters
            filters = []
            if status:
                filters.append(Vendor.status == status)
            if industry:
                filters.append(Vendor.industry == industry)
            if search:
                filters.append(
                    or_(
                        Vendor.name.ilike(f"%{search}%"),
                        Vendor.vendor_code.ilike(f"%{search}%"),
                        Vendor.email.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Vendor.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            vendors = result.scalars().all()
            
            return [self._serialize_vendor(vendor) for vendor in vendors]
        except Exception as e:
            print(f"Error getting vendors: {e}")
            return []

    async def create_vendor(self, vendor_data: VendorCreate, user_id: int) -> Dict:
        """Create a new vendor"""
        try:
            vendor = Vendor(
                vendor_code=vendor_data.vendor_code,
                name=vendor_data.name,
                email=vendor_data.email,
                phone=vendor_data.phone,
                fax=vendor_data.fax,
                website=vendor_data.website,
                billing_address=vendor_data.billing_address,
                shipping_address=vendor_data.shipping_address,
                tax_id=vendor_data.tax_id,
                business_type=vendor_data.business_type,
                industry=vendor_data.industry,
                company_size=vendor_data.company_size,
                currency=vendor_data.currency,
                payment_terms=vendor_data.payment_terms,
                credit_limit=vendor_data.credit_limit,
                notes=vendor_data.notes,
                tags=vendor_data.tags or [],
                created_by=user_id
            )
            
            self.db.add(vendor)
            await self.db.commit()
            await self.db.refresh(vendor)
            
            return self._serialize_vendor(vendor)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating vendor: {e}")
            raise

    async def get_vendor_by_id(self, vendor_id: int) -> Optional[Dict]:
        """Get vendor by ID"""
        try:
            result = await self.db.execute(
                select(Vendor)
                .where(Vendor.id == vendor_id)
            )
            vendor = result.scalar_one_or_none()
            
            if vendor:
                return self._serialize_vendor(vendor)
            return None
        except Exception as e:
            print(f"Error getting vendor: {e}")
            return None

    # Purchase Order Management
    async def get_purchase_orders(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[str] = None,
        vendor_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated purchase orders with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(PurchaseOrder)
            
            # Apply filters
            filters = []
            if status:
                filters.append(PurchaseOrder.status == status)
            if vendor_id:
                filters.append(PurchaseOrder.vendor_id == vendor_id)
            if search:
                filters.append(
                    or_(
                        PurchaseOrder.po_number.ilike(f"%{search}%"),
                        PurchaseOrder.vendor_name.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(PurchaseOrder.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            orders = result.scalars().all()
            
            return [self._serialize_purchase_order(order) for order in orders]
        except Exception as e:
            print(f"Error getting purchase orders: {e}")
            return []

    async def create_purchase_order(self, order_data: PurchaseOrderCreate, user_id: int) -> Dict:
        """Create a new purchase order"""
        try:
            # Generate PO number
            po_number = f"PO-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            
            order = PurchaseOrder(
                po_number=po_number,
                vendor_id=order_data.vendor_id,
                vendor_name=order_data.vendor_name,
                expected_delivery_date=order_data.expected_delivery_date,
                subtotal=order_data.subtotal,
                tax_amount=order_data.tax_amount,
                shipping_amount=order_data.shipping_amount,
                discount_amount=order_data.discount_amount,
                total_amount=order_data.total_amount,
                currency=order_data.currency,
                shipping_address=order_data.shipping_address,
                shipping_method=order_data.shipping_method,
                notes=order_data.notes,
                internal_notes=order_data.internal_notes,
                terms_and_conditions=order_data.terms_and_conditions,
                created_by=user_id
            )
            
            self.db.add(order)
            await self.db.commit()
            await self.db.refresh(order)
            
            return self._serialize_purchase_order(order)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating purchase order: {e}")
            raise

    async def get_purchase_order_by_id(self, order_id: int) -> Optional[Dict]:
        """Get purchase order by ID"""
        try:
            result = await self.db.execute(
                select(PurchaseOrder)
                .where(PurchaseOrder.id == order_id)
            )
            order = result.scalar_one_or_none()
            
            if order:
                return self._serialize_purchase_order(order)
            return None
        except Exception as e:
            print(f"Error getting purchase order: {e}")
            return None

    async def update_purchase_order(self, order_id: int, order_data: PurchaseOrderUpdate, user_id: int) -> Optional[Dict]:
        """Update purchase order"""
        try:
            result = await self.db.execute(
                select(PurchaseOrder)
                .where(PurchaseOrder.id == order_id)
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
            
            return self._serialize_purchase_order(order)
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating purchase order: {e}")
            raise

    async def delete_purchase_order(self, order_id: int) -> bool:
        """Delete purchase order"""
        try:
            result = await self.db.execute(
                select(PurchaseOrder)
                .where(PurchaseOrder.id == order_id)
            )
            order = result.scalar_one_or_none()
            
            if not order:
                return False
            
            await self.db.delete(order)
            await self.db.commit()
            
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error deleting purchase order: {e}")
            raise

    # Purchase Order Items Management
    async def get_purchase_order_items(self, order_id: int) -> List[Dict]:
        """Get items for a purchase order"""
        try:
            result = await self.db.execute(
                select(PurchaseOrderItem)
                .where(PurchaseOrderItem.purchase_order_id == order_id)
                .order_by(PurchaseOrderItem.created_at)
            )
            items = result.scalars().all()
            
            return [self._serialize_purchase_order_item(item) for item in items]
        except Exception as e:
            print(f"Error getting purchase order items: {e}")
            return []

    async def create_purchase_order_item(self, item_data: PurchaseOrderItemCreate, user_id: int) -> Dict:
        """Create a new purchase order item"""
        try:
            item = PurchaseOrderItem(
                purchase_order_id=item_data.purchase_order_id,
                product_id=item_data.product_id,
                product_code=item_data.product_code,
                product_name=item_data.product_name,
                product_description=item_data.product_description,
                quantity_ordered=item_data.quantity_ordered,
                quantity_pending=item_data.quantity_ordered,
                unit_price=item_data.unit_price,
                total_price=item_data.total_price,
                unit_of_measure=item_data.unit_of_measure,
                specifications=item_data.specifications,
                notes=item_data.notes
            )
            
            self.db.add(item)
            await self.db.commit()
            await self.db.refresh(item)
            
            return self._serialize_purchase_order_item(item)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating purchase order item: {e}")
            raise

    # Invoice Management
    async def get_invoices(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[str] = None,
        vendor_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated invoices with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Invoice)
            
            # Apply filters
            filters = []
            if status:
                filters.append(Invoice.status == status)
            if vendor_id:
                filters.append(Invoice.vendor_id == vendor_id)
            if search:
                filters.append(
                    or_(
                        Invoice.invoice_number.ilike(f"%{search}%"),
                        Invoice.vendor_invoice_number.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Invoice.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            invoices = result.scalars().all()
            
            return [self._serialize_invoice(invoice) for invoice in invoices]
        except Exception as e:
            print(f"Error getting invoices: {e}")
            return []

    async def create_invoice(self, invoice_data: InvoiceCreate, user_id: int) -> Dict:
        """Create a new invoice"""
        try:
            invoice = Invoice(
                invoice_number=invoice_data.invoice_number,
                vendor_invoice_number=invoice_data.vendor_invoice_number,
                vendor_id=invoice_data.vendor_id,
                purchase_order_id=invoice_data.purchase_order_id,
                invoice_date=invoice_data.invoice_date or datetime.utcnow(),
                due_date=invoice_data.due_date,
                subtotal=invoice_data.subtotal,
                tax_amount=invoice_data.tax_amount,
                total_amount=invoice_data.total_amount,
                currency=invoice_data.currency,
                notes=invoice_data.notes,
                terms_and_conditions=invoice_data.terms_and_conditions,
                created_by=user_id
            )
            
            self.db.add(invoice)
            await self.db.commit()
            await self.db.refresh(invoice)
            
            return self._serialize_invoice(invoice)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating invoice: {e}")
            raise

    # Serialization methods
    def _serialize_vendor(self, vendor: Vendor) -> Dict:
        """Serialize vendor to dict"""
        return {
            "id": vendor.id,
            "vendor_code": vendor.vendor_code,
            "name": vendor.name,
            "email": vendor.email,
            "phone": vendor.phone,
            "fax": vendor.fax,
            "website": vendor.website,
            "billing_address": vendor.billing_address,
            "shipping_address": vendor.shipping_address,
            "tax_id": vendor.tax_id,
            "business_type": vendor.business_type,
            "industry": vendor.industry,
            "company_size": vendor.company_size,
            "currency": vendor.currency,
            "payment_terms": vendor.payment_terms,
            "credit_limit": float(vendor.credit_limit) if vendor.credit_limit else None,
            "current_balance": float(vendor.current_balance) if vendor.current_balance else 0.0,
            "status": vendor.status,
            "rating": vendor.rating,
            "notes": vendor.notes,
            "tags": vendor.tags or [],
            "total_orders": vendor.total_orders,
            "total_value": float(vendor.total_value) if vendor.total_value else 0.0,
            "average_delivery_time": float(vendor.average_delivery_time) if vendor.average_delivery_time else None,
            "quality_rating": float(vendor.quality_rating) if vendor.quality_rating else None,
            "created_at": vendor.created_at.isoformat() if vendor.created_at else None,
            "updated_at": vendor.updated_at.isoformat() if vendor.updated_at else None
        }

    def _serialize_purchase_order(self, order: PurchaseOrder) -> Dict:
        """Serialize purchase order to dict"""
        return {
            "id": order.id,
            "po_number": order.po_number,
            "vendor_id": order.vendor_id,
            "vendor_name": order.vendor_name,
            "status": order.status,
            "order_date": order.order_date.isoformat() if order.order_date else None,
            "expected_delivery_date": order.expected_delivery_date.isoformat() if order.expected_delivery_date else None,
            "actual_delivery_date": order.actual_delivery_date.isoformat() if order.actual_delivery_date else None,
            "subtotal": float(order.subtotal) if order.subtotal else 0.0,
            "tax_amount": float(order.tax_amount) if order.tax_amount else 0.0,
            "shipping_amount": float(order.shipping_amount) if order.shipping_amount else 0.0,
            "discount_amount": float(order.discount_amount) if order.discount_amount else 0.0,
            "total_amount": float(order.total_amount) if order.total_amount else 0.0,
            "currency": order.currency,
            "shipping_address": order.shipping_address,
            "shipping_method": order.shipping_method,
            "tracking_number": order.tracking_number,
            "notes": order.notes,
            "internal_notes": order.internal_notes,
            "terms_and_conditions": order.terms_and_conditions,
            "approved_by": order.approved_by,
            "approved_at": order.approved_at.isoformat() if order.approved_at else None,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None
        }

    def _serialize_purchase_order_item(self, item: PurchaseOrderItem) -> Dict:
        """Serialize purchase order item to dict"""
        return {
            "id": item.id,
            "purchase_order_id": item.purchase_order_id,
            "product_id": item.product_id,
            "product_code": item.product_code,
            "product_name": item.product_name,
            "product_description": item.product_description,
            "quantity_ordered": float(item.quantity_ordered) if item.quantity_ordered else 0.0,
            "quantity_received": float(item.quantity_received) if item.quantity_received else 0.0,
            "quantity_pending": float(item.quantity_pending) if item.quantity_pending else 0.0,
            "unit_price": float(item.unit_price) if item.unit_price else 0.0,
            "total_price": float(item.total_price) if item.total_price else 0.0,
            "unit_of_measure": item.unit_of_measure,
            "specifications": item.specifications,
            "notes": item.notes,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None
        }

    def _serialize_invoice(self, invoice: Invoice) -> Dict:
        """Serialize invoice to dict"""
        return {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "vendor_invoice_number": invoice.vendor_invoice_number,
            "vendor_id": invoice.vendor_id,
            "purchase_order_id": invoice.purchase_order_id,
            "status": invoice.status,
            "invoice_date": invoice.invoice_date.isoformat() if invoice.invoice_date else None,
            "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
            "payment_date": invoice.payment_date.isoformat() if invoice.payment_date else None,
            "subtotal": float(invoice.subtotal) if invoice.subtotal else 0.0,
            "tax_amount": float(invoice.tax_amount) if invoice.tax_amount else 0.0,
            "total_amount": float(invoice.total_amount) if invoice.total_amount else 0.0,
            "paid_amount": float(invoice.paid_amount) if invoice.paid_amount else 0.0,
            "currency": invoice.currency,
            "notes": invoice.notes,
            "terms_and_conditions": invoice.terms_and_conditions,
            "created_at": invoice.created_at.isoformat() if invoice.created_at else None,
            "updated_at": invoice.updated_at.isoformat() if invoice.updated_at else None
        }



