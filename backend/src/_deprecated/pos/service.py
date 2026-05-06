from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timedelta
from .models import (
    Terminal, CashDrawer, Sale, SaleItem, Payment, TaxRate, Discount,
    SaleStatus, PaymentStatus, PaymentMethod, TaxType
)
from .schemas import (
    TerminalCreate, TerminalUpdate, CashDrawerCreate, CashDrawerUpdate,
    SaleCreate, SaleUpdate, PaymentCreate, PaymentUpdate,
    TaxRateCreate, TaxRateUpdate, DiscountCreate, DiscountUpdate,
    POSDashboardStats, POSAnalytics, TerminalStatus, SaleSummary
)

class POSService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Dashboard and Analytics
    async def get_dashboard_stats(self) -> POSDashboardStats:
        """Get POS dashboard statistics"""
        today = datetime.now().date()
        
        # Total sales today
        sales_today_result = await self.db.execute(
            select(func.sum(Sale.total_amount)).where(
                func.date(Sale.sale_date) == today,
                Sale.status == SaleStatus.COMPLETED
            )
        )
        total_sales_today = sales_today_result.scalar() or 0.0
        
        # Total transactions today
        transactions_today_result = await self.db.execute(
            select(func.count(Sale.id)).where(
                func.date(Sale.sale_date) == today,
                Sale.status == SaleStatus.COMPLETED
            )
        )
        total_transactions_today = transactions_today_result.scalar() or 0
        
        # Average transaction value
        average_transaction_value = (
            total_sales_today / total_transactions_today 
            if total_transactions_today > 0 else 0.0
        )
        
        # Top selling products (mock data for now)
        top_selling_products = [
            {"product_name": "Product A", "quantity_sold": 45, "revenue": 2250.0},
            {"product_name": "Product B", "quantity_sold": 32, "revenue": 1600.0},
            {"product_name": "Product C", "quantity_sold": 28, "revenue": 1400.0}
        ]
        
        # Payment methods breakdown (mock data for now)
        payment_methods_breakdown = [
            {"method": "Cash", "count": 25, "amount": 1250.0},
            {"method": "Credit Card", "count": 18, "amount": 900.0},
            {"method": "Debit Card", "count": 12, "amount": 600.0}
        ]
        
        # Terminal performance (mock data for now)
        terminal_performance = [
            {"terminal_id": "T001", "sales_count": 35, "revenue": 1750.0},
            {"terminal_id": "T002", "sales_count": 28, "revenue": 1400.0},
            {"terminal_id": "T003", "sales_count": 22, "revenue": 1100.0}
        ]
        
        return POSDashboardStats(
            total_sales_today=total_sales_today,
            total_transactions_today=total_transactions_today,
            average_transaction_value=average_transaction_value,
            top_selling_products=top_selling_products,
            payment_methods_breakdown=payment_methods_breakdown,
            terminal_performance=terminal_performance
        )

    async def get_analytics(self, period_days: int = 30) -> POSAnalytics:
        """Get POS analytics for specified period"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=period_days)
        
        # Total revenue for period
        revenue_result = await self.db.execute(
            select(func.sum(Sale.total_amount)).where(
                Sale.sale_date >= start_date,
                Sale.sale_date <= end_date,
                Sale.status == SaleStatus.COMPLETED
            )
        )
        total_revenue = revenue_result.scalar() or 0.0
        
        # Total transactions for period
        transactions_result = await self.db.execute(
            select(func.count(Sale.id)).where(
                Sale.sale_date >= start_date,
                Sale.sale_date <= end_date,
                Sale.status == SaleStatus.COMPLETED
            )
        )
        total_transactions = transactions_result.scalar() or 0
        
        # Average transaction value
        average_transaction_value = (
            total_revenue / total_transactions 
            if total_transactions > 0 else 0.0
        )
        
        # Mock analytics data
        sales_by_hour = [
            {"hour": f"{i:02d}:00", "sales": 100 + i * 10} for i in range(24)
        ]
        
        sales_by_day = [
            {"day": f"Day {i+1}", "revenue": 500 + i * 100} for i in range(7)
        ]
        
        top_products = [
            {"product_name": "Product A", "quantity": 150, "revenue": 7500.0},
            {"product_name": "Product B", "quantity": 120, "revenue": 6000.0},
            {"product_name": "Product C", "quantity": 95, "revenue": 4750.0}
        ]
        
        payment_methods = [
            {"method": "Cash", "percentage": 45, "amount": total_revenue * 0.45},
            {"method": "Credit Card", "percentage": 35, "amount": total_revenue * 0.35},
            {"method": "Debit Card", "percentage": 20, "amount": total_revenue * 0.20}
        ]
        
        return POSAnalytics(
            period=f"{period_days} days",
            total_revenue=total_revenue,
            total_transactions=total_transactions,
            average_transaction_value=average_transaction_value,
            sales_by_hour=sales_by_hour,
            sales_by_day=sales_by_day,
            top_products=top_products,
            payment_methods=payment_methods
        )

    # Terminal Management
    async def create_terminal(self, terminal_data: TerminalCreate) -> Terminal:
        """Create a new POS terminal"""
        terminal = Terminal(**terminal_data.model_dump())
        self.db.add(terminal)
        await self.db.commit()
        await self.db.refresh(terminal)
        return terminal

    async def get_terminals(self, skip: int = 0, limit: int = 100) -> List[Terminal]:
        """Get list of terminals"""
        result = await self.db.execute(
            select(Terminal).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_terminal(self, terminal_id: int) -> Optional[Terminal]:
        """Get terminal by ID"""
        result = await self.db.execute(
            select(Terminal).where(Terminal.id == terminal_id)
        )
        return result.scalar_one_or_none()

    async def update_terminal(self, terminal_id: int, terminal_data: TerminalUpdate) -> Optional[Terminal]:
        """Update terminal"""
        terminal = await self.get_terminal(terminal_id)
        if not terminal:
            return None
        
        update_data = terminal_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(terminal, field, value)
        
        await self.db.commit()
        await self.db.refresh(terminal)
        return terminal

    async def delete_terminal(self, terminal_id: int) -> bool:
        """Delete terminal"""
        terminal = await self.get_terminal(terminal_id)
        if not terminal:
            return False
        
        await self.db.delete(terminal)
        await self.db.commit()
        return True

    # Cash Drawer Management
    async def open_cash_drawer(self, drawer_data: CashDrawerCreate) -> CashDrawer:
        """Open cash drawer"""
        drawer = CashDrawer(**drawer_data.model_dump())
        self.db.add(drawer)
        await self.db.commit()
        await self.db.refresh(drawer)
        return drawer

    async def close_cash_drawer(self, drawer_id: int, drawer_data: CashDrawerUpdate) -> Optional[CashDrawer]:
        """Close cash drawer"""
        drawer = await self.db.get(CashDrawer, drawer_id)
        if not drawer:
            return None
        
        update_data = drawer_data.model_dump(exclude_unset=True)
        update_data['closed_at'] = datetime.now()
        update_data['is_open'] = False
        
        if update_data.get('closing_amount') and update_data.get('expected_amount'):
            update_data['difference'] = update_data['closing_amount'] - update_data['expected_amount']
        
        for field, value in update_data.items():
            setattr(drawer, field, value)
        
        await self.db.commit()
        await self.db.refresh(drawer)
        return drawer

    async def get_cash_drawers(self, skip: int = 0, limit: int = 100) -> List[CashDrawer]:
        """Get list of cash drawers"""
        result = await self.db.execute(
            select(CashDrawer).offset(skip).limit(limit)
        )
        return result.scalars().all()

    # Sale Management
    async def create_sale(self, sale_data: SaleCreate) -> Sale:
        """Create a new sale"""
        # Generate sale number
        sale_number = f"POS{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Calculate totals
        subtotal = sum(item.quantity * item.unit_price for item in sale_data.items)
        tax_amount = sum(item.quantity * item.unit_price * item.tax_rate for item in sale_data.items)
        discount_amount = sum(item.quantity * item.unit_price * item.discount_rate for item in sale_data.items)
        total_amount = subtotal + tax_amount - discount_amount
        
        # Create sale
        sale = Sale(
            sale_number=sale_number,
            terminal_id=sale_data.terminal_id,
            cashier_id=sale_data.cashier_id,
            customer_id=sale_data.customer_id,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            notes=sale_data.notes
        )
        
        self.db.add(sale)
        await self.db.flush()  # Get the sale ID
        
        # Create sale items
        for item_data in sale_data.items:
            item = SaleItem(
                sale_id=sale.id,
                product_id=item_data.product_id,
                product_name=item_data.product_name,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.quantity * item_data.unit_price,
                tax_rate=item_data.tax_rate,
                tax_amount=item_data.quantity * item_data.unit_price * item_data.tax_rate,
                discount_rate=item_data.discount_rate,
                discount_amount=item_data.quantity * item_data.unit_price * item_data.discount_rate
            )
            self.db.add(item)
        
        await self.db.commit()
        await self.db.refresh(sale)
        return sale

    async def get_sales(self, skip: int = 0, limit: int = 100) -> List[Sale]:
        """Get list of sales"""
        result = await self.db.execute(
            select(Sale).offset(skip).limit(limit).order_by(Sale.sale_date.desc())
        )
        return result.scalars().all()

    async def get_sale(self, sale_id: int) -> Optional[Sale]:
        """Get sale by ID"""
        result = await self.db.execute(
            select(Sale).where(Sale.id == sale_id)
        )
        return result.scalar_one_or_none()

    async def update_sale(self, sale_id: int, sale_data: SaleUpdate) -> Optional[Sale]:
        """Update sale"""
        sale = await self.get_sale(sale_id)
        if not sale:
            return None
        
        update_data = sale_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(sale, field, value)
        
        await self.db.commit()
        await self.db.refresh(sale)
        return sale

    # Payment Management
    async def create_payment(self, payment_data: PaymentCreate) -> Payment:
        """Create a new payment"""
        payment = Payment(**payment_data.model_dump())
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def get_payments(self, skip: int = 0, limit: int = 100) -> List[Payment]:
        """Get list of payments"""
        result = await self.db.execute(
            select(Payment).offset(skip).limit(limit).order_by(Payment.payment_date.desc())
        )
        return result.scalars().all()

    async def get_payment(self, payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        result = await self.db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        return result.scalar_one_or_none()

    async def update_payment(self, payment_id: int, payment_data: PaymentUpdate) -> Optional[Payment]:
        """Update payment"""
        payment = await self.get_payment(payment_id)
        if not payment:
            return None
        
        update_data = payment_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(payment, field, value)
        
        await self.db.commit()
        await self.db.refresh(payment)
        return payment



