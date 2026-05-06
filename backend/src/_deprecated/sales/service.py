from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

from .models import (
    SalesQuote, SalesQuoteItem, SalesOrder, SalesOrderItem, 
    SalesRevenue, QuoteStatus, OrderStatus, PaymentStatus
)
from .schemas import QuoteCreate, OrderCreate, RevenueCreate

class SalesService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # Quote Management
    async def create_quote(self, quote_data: QuoteCreate, user_id: int) -> Dict:
        """Create a new sales quote"""
        try:
            # Generate quote number
            quote_number = f"Q-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            # Create quote
            quote = SalesQuote(
                quote_number=quote_number,
                customer_id=quote_data.customer_id,
                customer_name=quote_data.customer_name,
                customer_email=quote_data.customer_email,
                title=quote_data.title,
                description=quote_data.description,
                valid_until=quote_data.valid_until,
                notes=quote_data.notes,
                terms_conditions=quote_data.terms_conditions,
                created_by=user_id
            )
            
            self.db.add(quote)
            await self.db.flush()  # Get the ID
            
            # Create quote items
            subtotal = 0.0
            for item_data in quote_data.items:
                discount_amount = (item_data.quantity * item_data.unit_price * item_data.discount_rate) / 100
                line_total = (item_data.quantity * item_data.unit_price) - discount_amount
                subtotal += line_total
                
                item = SalesQuoteItem(
                    quote_id=quote.id,
                    product_name=item_data.product_name,
                    product_description=item_data.product_description,
                    product_sku=item_data.product_sku,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    discount_rate=item_data.discount_rate,
                    discount_amount=discount_amount,
                    line_total=line_total,
                    sort_order=item_data.sort_order
                )
                self.db.add(item)
            
            # Calculate totals
            quote.subtotal = subtotal
            quote.tax_amount = (subtotal * quote.tax_rate) / 100
            quote.discount_amount = (subtotal * quote.discount_rate) / 100
            quote.total_amount = subtotal + quote.tax_amount - quote.discount_amount
            
            await self.db.commit()
            await self.db.refresh(quote)
            
            return self._serialize_quote(quote)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating quote: {e}")
            raise
    
    async def get_quotes(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[QuoteStatus] = None,
        customer_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated quotes with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(SalesQuote).options(selectinload(SalesQuote.items))
            
            # Apply filters
            filters = []
            if status:
                filters.append(SalesQuote.status == status)
            if customer_id:
                filters.append(SalesQuote.customer_id == customer_id)
            if search:
                filters.append(
                    or_(
                        SalesQuote.title.ilike(f"%{search}%"),
                        SalesQuote.quote_number.ilike(f"%{search}%"),
                        SalesQuote.customer_name.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(SalesQuote.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            quotes = result.scalars().all()
            
            return [self._serialize_quote(quote) for quote in quotes]
        except Exception as e:
            print(f"Error getting quotes: {e}")
            return []
    
    async def get_quote(self, quote_id: int) -> Optional[Dict]:
        """Get a specific quote by ID"""
        try:
            query = select(SalesQuote).options(selectinload(SalesQuote.items)).where(SalesQuote.id == quote_id)
            result = await self.db.execute(query)
            quote = result.scalar_one_or_none()
            
            if quote:
                return self._serialize_quote(quote)
            return None
        except Exception as e:
            print(f"Error getting quote: {e}")
            return None
    
    async def update_quote_status(self, quote_id: int, status: QuoteStatus) -> bool:
        """Update quote status"""
        try:
            quote = await self.db.get(SalesQuote, quote_id)
            if not quote:
                return False
            
            quote.status = status
            
            # Update timestamps based on status
            if status == QuoteStatus.SENT:
                quote.sent_at = datetime.utcnow()
            elif status == QuoteStatus.VIEWED:
                quote.viewed_at = datetime.utcnow()
            elif status == QuoteStatus.ACCEPTED:
                quote.accepted_at = datetime.utcnow()
            
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating quote status: {e}")
            return False
    
    # Order Management
    async def create_order_from_quote(self, quote_id: int, user_id: int) -> Dict:
        """Create an order from an accepted quote"""
        try:
            # Get the quote
            quote = await self.db.get(SalesQuote, quote_id)
            if not quote or quote.status != QuoteStatus.ACCEPTED:
                raise ValueError("Quote not found or not accepted")
            
            # Generate order number
            order_number = f"O-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            # Create order
            order = SalesOrder(
                order_number=order_number,
                quote_id=quote_id,
                customer_id=quote.customer_id,
                customer_name=quote.customer_name,
                customer_email=quote.customer_email,
                title=quote.title,
                description=quote.description,
                subtotal=quote.subtotal,
                tax_rate=quote.tax_rate,
                tax_amount=quote.tax_amount,
                discount_rate=quote.discount_rate,
                discount_amount=quote.discount_amount,
                total_amount=quote.total_amount,
                created_by=user_id
            )
            
            self.db.add(order)
            await self.db.flush()
            
            # Create order items from quote items
            for quote_item in quote.items:
                order_item = SalesOrderItem(
                    order_id=order.id,
                    product_name=quote_item.product_name,
                    product_description=quote_item.product_description,
                    product_sku=quote_item.product_sku,
                    quantity=quote_item.quantity,
                    unit_price=quote_item.unit_price,
                    discount_rate=quote_item.discount_rate,
                    discount_amount=quote_item.discount_amount,
                    line_total=quote_item.line_total,
                    sort_order=quote_item.sort_order
                )
                self.db.add(order_item)
            
            await self.db.commit()
            await self.db.refresh(order)
            
            return self._serialize_order(order)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating order from quote: {e}")
            raise
    
    async def get_orders(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[OrderStatus] = None,
        customer_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated orders with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(SalesOrder).options(selectinload(SalesOrder.items))
            
            # Apply filters
            filters = []
            if status:
                filters.append(SalesOrder.status == status)
            if customer_id:
                filters.append(SalesOrder.customer_id == customer_id)
            if search:
                filters.append(
                    or_(
                        SalesOrder.title.ilike(f"%{search}%"),
                        SalesOrder.order_number.ilike(f"%{search}%"),
                        SalesOrder.customer_name.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(SalesOrder.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            orders = result.scalars().all()
            
            return [self._serialize_order(order) for order in orders]
        except Exception as e:
            print(f"Error getting orders: {e}")
            return []
    
    async def get_order(self, order_id: int) -> Optional[Dict]:
        """Get a specific order by ID"""
        try:
            query = select(SalesOrder).options(selectinload(SalesOrder.items)).where(SalesOrder.id == order_id)
            result = await self.db.execute(query)
            order = result.scalar_one_or_none()
            
            if order:
                return self._serialize_order(order)
            return None
        except Exception as e:
            print(f"Error getting order: {e}")
            return None
    
    async def update_order_status(self, order_id: int, status: OrderStatus) -> bool:
        """Update order status"""
        try:
            order = await self.db.get(SalesOrder, order_id)
            if not order:
                return False
            
            order.status = status
            
            # Update timestamps based on status
            if status == OrderStatus.SHIPPED:
                order.shipped_at = datetime.utcnow()
            elif status == OrderStatus.DELIVERED:
                order.delivered_at = datetime.utcnow()
            
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating order status: {e}")
            return False
    
    # Revenue Management
    async def record_revenue(self, revenue_data: RevenueCreate) -> Dict:
        """Record revenue for an order"""
        try:
            now = datetime.utcnow()
            
            revenue = SalesRevenue(
                order_id=revenue_data.order_id,
                revenue_type=revenue_data.revenue_type,
                amount=revenue_data.amount,
                currency=revenue_data.currency,
                description=revenue_data.description,
                revenue_date=now,
                period_year=now.year,
                period_month=now.month,
                period_quarter=(now.month - 1) // 3 + 1
            )
            
            self.db.add(revenue)
            await self.db.commit()
            await self.db.refresh(revenue)
            
            return self._serialize_revenue(revenue)
        except Exception as e:
            await self.db.rollback()
            print(f"Error recording revenue: {e}")
            raise
    
    # Analytics
    async def get_sales_analytics(self, period_days: int = 30) -> Dict:
        """Get sales analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get basic metrics - using scalar_one_or_none() for single values
            revenue_result = await self.db.execute(
                select(func.sum(SalesRevenue.amount))
                .where(
                    and_(
                        SalesRevenue.revenue_date >= start_date,
                        SalesRevenue.revenue_type == "sale"
                    )
                )
            )
            total_revenue = revenue_result.scalar_one_or_none() or 0.0
            
            orders_result = await self.db.execute(
                select(func.count(SalesOrder.id))
                .where(SalesOrder.created_at >= start_date)
            )
            total_orders = orders_result.scalar_one_or_none() or 0
            
            quotes_result = await self.db.execute(
                select(func.count(SalesQuote.id))
                .where(SalesQuote.created_at >= start_date)
            )
            total_quotes = quotes_result.scalar_one_or_none() or 0
            
            # Calculate conversion rate
            conversion_rate = (total_orders / total_quotes * 100) if total_quotes > 0 else 0
            
            # Calculate average order value
            avg_order_value = (total_revenue / total_orders) if total_orders > 0 else 0
            
            return {
                "period_days": period_days,
                "total_revenue": float(total_revenue),
                "total_orders": total_orders,
                "total_quotes": total_quotes,
                "conversion_rate": round(conversion_rate, 2),
                "average_order_value": round(avg_order_value, 2),
                "top_products": [],  # TODO: Implement
                "revenue_by_month": [],  # TODO: Implement
                "order_status_distribution": {},  # TODO: Implement
                "payment_status_distribution": {}  # TODO: Implement
            }
        except Exception as e:
            print(f"Error getting sales analytics: {e}")
            return {
                "period_days": period_days,
                "total_revenue": 0.0,
                "total_orders": 0,
                "total_quotes": 0,
                "conversion_rate": 0.0,
                "average_order_value": 0.0,
                "top_products": [],
                "revenue_by_month": [],
                "order_status_distribution": {},
                "payment_status_distribution": {}
            }
    
    # Serialization methods
    def _serialize_quote(self, quote: SalesQuote) -> Dict:
        """Serialize quote to dict"""
        return {
            "id": quote.id,
            "quote_number": quote.quote_number,
            "customer_id": quote.customer_id,
            "customer_name": quote.customer_name,
            "customer_email": quote.customer_email,
            "title": quote.title,
            "description": quote.description,
            "status": quote.status.value if quote.status else None,
            "subtotal": quote.subtotal,
            "tax_rate": quote.tax_rate,
            "tax_amount": quote.tax_amount,
            "discount_rate": quote.discount_rate,
            "discount_amount": quote.discount_amount,
            "total_amount": quote.total_amount,
            "quote_date": quote.quote_date.isoformat() if quote.quote_date else None,
            "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
            "sent_at": quote.sent_at.isoformat() if quote.sent_at else None,
            "viewed_at": quote.viewed_at.isoformat() if quote.viewed_at else None,
            "accepted_at": quote.accepted_at.isoformat() if quote.accepted_at else None,
            "notes": quote.notes,
            "terms_conditions": quote.terms_conditions,
            "created_by": quote.created_by,
            "created_at": quote.created_at.isoformat() if quote.created_at else None,
            "updated_at": quote.updated_at.isoformat() if quote.updated_at else None,
            "items": [self._serialize_quote_item(item) for item in quote.items]
        }
    
    def _serialize_quote_item(self, item: SalesQuoteItem) -> Dict:
        """Serialize quote item to dict"""
        return {
            "id": item.id,
            "quote_id": item.quote_id,
            "product_name": item.product_name,
            "product_description": item.product_description,
            "product_sku": item.product_sku,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "discount_rate": item.discount_rate,
            "discount_amount": item.discount_amount,
            "line_total": item.line_total,
            "sort_order": item.sort_order,
            "created_at": item.created_at.isoformat() if item.created_at else None
        }
    
    def _serialize_order(self, order: SalesOrder) -> Dict:
        """Serialize order to dict"""
        return {
            "id": order.id,
            "order_number": order.order_number,
            "quote_id": order.quote_id,
            "customer_id": order.customer_id,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "title": order.title,
            "description": order.description,
            "status": order.status.value if order.status else None,
            "payment_status": order.payment_status.value if order.payment_status else None,
            "subtotal": order.subtotal,
            "tax_rate": order.tax_rate,
            "tax_amount": order.tax_amount,
            "discount_rate": order.discount_rate,
            "discount_amount": order.discount_amount,
            "shipping_cost": order.shipping_cost,
            "total_amount": order.total_amount,
            "payment_method": order.payment_method,
            "payment_due_date": order.payment_due_date.isoformat() if order.payment_due_date else None,
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            "shipping_address": order.shipping_address,
            "shipping_method": order.shipping_method,
            "tracking_number": order.tracking_number,
            "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
            "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
            "order_date": order.order_date.isoformat() if order.order_date else None,
            "expected_delivery": order.expected_delivery.isoformat() if order.expected_delivery else None,
            "notes": order.notes,
            "internal_notes": order.internal_notes,
            "created_by": order.created_by,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None,
            "items": [self._serialize_order_item(item) for item in order.items]
        }
    
    def _serialize_order_item(self, item: SalesOrderItem) -> Dict:
        """Serialize order item to dict"""
        return {
            "id": item.id,
            "order_id": item.order_id,
            "product_name": item.product_name,
            "product_description": item.product_description,
            "product_sku": item.product_sku,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "discount_rate": item.discount_rate,
            "discount_amount": item.discount_amount,
            "line_total": item.line_total,
            "quantity_shipped": item.quantity_shipped,
            "quantity_delivered": item.quantity_delivered,
            "sort_order": item.sort_order,
            "created_at": item.created_at.isoformat() if item.created_at else None
        }
    
    def _serialize_revenue(self, revenue: SalesRevenue) -> Dict:
        """Serialize revenue to dict"""
        return {
            "id": revenue.id,
            "order_id": revenue.order_id,
            "revenue_type": revenue.revenue_type,
            "amount": revenue.amount,
            "currency": revenue.currency,
            "description": revenue.description,
            "revenue_date": revenue.revenue_date.isoformat() if revenue.revenue_date else None,
            "period_year": revenue.period_year,
            "period_month": revenue.period_month,
            "period_quarter": revenue.period_quarter,
            "created_at": revenue.created_at.isoformat() if revenue.created_at else None
        }




