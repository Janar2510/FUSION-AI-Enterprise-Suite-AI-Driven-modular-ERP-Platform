from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from .service import POSService
from .schemas import (
    Terminal, TerminalCreate, TerminalUpdate,
    CashDrawer, CashDrawerCreate, CashDrawerUpdate,
    Sale, SaleCreate, SaleUpdate,
    Payment, PaymentCreate, PaymentUpdate,
    TaxRate, TaxRateCreate, TaxRateUpdate,
    Discount, DiscountCreate, DiscountUpdate,
    POSDashboardStats, POSAnalytics
)

router = APIRouter(prefix="/pos")

@router.get("/health")
async def health_check():
    """POS module health check"""
    return {
        "status": "healthy",
        "module": "pos",
        "message": "Point of Sale module is running"
    }

@router.get("/dashboard", response_model=POSDashboardStats)
async def get_dashboard():
    """Get POS dashboard statistics"""
    # Mock data for now - in real implementation, this would use the service
    return POSDashboardStats(
        total_sales_today=2500.0,
        total_transactions_today=45,
        average_transaction_value=55.56,
        top_selling_products=[
            {"product_name": "Product A", "quantity_sold": 25, "revenue": 1250.0},
            {"product_name": "Product B", "quantity_sold": 18, "revenue": 900.0},
            {"product_name": "Product C", "quantity_sold": 12, "revenue": 600.0}
        ],
        payment_methods_breakdown=[
            {"method": "Cash", "count": 20, "amount": 1000.0},
            {"method": "Credit Card", "count": 15, "amount": 750.0},
            {"method": "Debit Card", "count": 10, "amount": 500.0}
        ],
        terminal_performance=[
            {"terminal_id": "T001", "sales_count": 25, "revenue": 1250.0},
            {"terminal_id": "T002", "sales_count": 15, "revenue": 750.0},
            {"terminal_id": "T003", "sales_count": 5, "revenue": 250.0}
        ]
    )

@router.get("/analytics", response_model=POSAnalytics)
async def get_analytics(period_days: int = Query(30, ge=1, le=365)):
    """Get POS analytics for specified period"""
    # Mock data for now
    return POSAnalytics(
        period=f"{period_days} days",
        total_revenue=75000.0,
        total_transactions=1350,
        average_transaction_value=55.56,
        sales_by_hour=[
            {"hour": f"{i:02d}:00", "sales": 50 + i * 5} for i in range(24)
        ],
        sales_by_day=[
            {"day": "Monday", "revenue": 10000.0},
            {"day": "Tuesday", "revenue": 12000.0},
            {"day": "Wednesday", "revenue": 11000.0},
            {"day": "Thursday", "revenue": 13000.0},
            {"day": "Friday", "revenue": 15000.0},
            {"day": "Saturday", "revenue": 8000.0},
            {"day": "Sunday", "revenue": 6000.0}
        ],
        top_products=[
            {"product_name": "Product A", "quantity": 450, "revenue": 22500.0},
            {"product_name": "Product B", "quantity": 320, "revenue": 16000.0},
            {"product_name": "Product C", "quantity": 280, "revenue": 14000.0}
        ],
        payment_methods=[
            {"method": "Cash", "percentage": 45, "amount": 33750.0},
            {"method": "Credit Card", "percentage": 35, "amount": 26250.0},
            {"method": "Debit Card", "percentage": 20, "amount": 15000.0}
        ]
    )

# Terminal Management
@router.get("/terminals", response_model=List[Terminal])
async def get_terminals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get list of POS terminals"""
    # Mock data for now
    return [
        Terminal(
            id=1,
            terminal_id="T001",
            name="Main Register",
            location="Front Store",
            is_active=True,
            created_at="2024-01-01T00:00:00Z",
            updated_at=None
        ),
        Terminal(
            id=2,
            terminal_id="T002",
            name="Secondary Register",
            location="Back Store",
            is_active=True,
            created_at="2024-01-01T00:00:00Z",
            updated_at=None
        ),
        Terminal(
            id=3,
            terminal_id="T003",
            name="Mobile POS",
            location="Warehouse",
            is_active=False,
            created_at="2024-01-01T00:00:00Z",
            updated_at=None
        )
    ]

@router.post("/terminals", response_model=Terminal)
async def create_terminal(terminal_data: TerminalCreate):
    """Create a new POS terminal"""
    # Mock implementation
    return Terminal(
        id=4,
        terminal_id=terminal_data.terminal_id,
        name=terminal_data.name,
        location=terminal_data.location,
        is_active=terminal_data.is_active,
        created_at="2024-01-01T00:00:00Z",
        updated_at=None
    )

@router.get("/terminals/{terminal_id}", response_model=Terminal)
async def get_terminal(terminal_id: int):
    """Get terminal by ID"""
    # Mock implementation
    return Terminal(
        id=terminal_id,
        terminal_id=f"T{terminal_id:03d}",
        name=f"Terminal {terminal_id}",
        location="Store Location",
        is_active=True,
        created_at="2024-01-01T00:00:00Z",
        updated_at=None
    )

@router.put("/terminals/{terminal_id}", response_model=Terminal)
async def update_terminal(terminal_id: int, terminal_data: TerminalUpdate):
    """Update terminal"""
    # Mock implementation
    return Terminal(
        id=terminal_id,
        terminal_id=f"T{terminal_id:03d}",
        name=terminal_data.name or f"Terminal {terminal_id}",
        location=terminal_data.location or "Store Location",
        is_active=terminal_data.is_active if terminal_data.is_active is not None else True,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z"
    )

@router.delete("/terminals/{terminal_id}")
async def delete_terminal(terminal_id: int):
    """Delete terminal"""
    return {"message": f"Terminal {terminal_id} deleted successfully"}

# Cash Drawer Management
@router.get("/cash-drawers", response_model=List[CashDrawer])
async def get_cash_drawers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get list of cash drawers"""
    # Mock data for now
    return [
        CashDrawer(
            id=1,
            terminal_id=1,
            opened_at="2024-01-01T08:00:00Z",
            closed_at=None,
            opened_by="Cashier 1",
            closed_by=None,
            opening_amount=100.0,
            closing_amount=None,
            expected_amount=None,
            difference=None,
            is_open=True
        ),
        CashDrawer(
            id=2,
            terminal_id=2,
            opened_at="2024-01-01T08:30:00Z",
            closed_at="2024-01-01T17:00:00Z",
            opened_by="Cashier 2",
            closed_by="Cashier 2",
            opening_amount=100.0,
            closing_amount=850.0,
            expected_amount=850.0,
            difference=0.0,
            is_open=False
        )
    ]

@router.post("/cash-drawers", response_model=CashDrawer)
async def open_cash_drawer(drawer_data: CashDrawerCreate):
    """Open cash drawer"""
    # Mock implementation
    return CashDrawer(
        id=3,
        terminal_id=drawer_data.terminal_id,
        opened_at="2024-01-01T00:00:00Z",
        closed_at=None,
        opened_by=drawer_data.opened_by,
        closed_by=None,
        opening_amount=drawer_data.opening_amount,
        closing_amount=None,
        expected_amount=None,
        difference=None,
        is_open=True
    )

@router.put("/cash-drawers/{drawer_id}", response_model=CashDrawer)
async def close_cash_drawer(drawer_id: int, drawer_data: CashDrawerUpdate):
    """Close cash drawer"""
    # Mock implementation
    return CashDrawer(
        id=drawer_id,
        terminal_id=1,
        opened_at="2024-01-01T08:00:00Z",
        closed_at="2024-01-01T17:00:00Z",
        opened_by="Cashier 1",
        closed_by=drawer_data.closed_by or "Cashier 1",
        opening_amount=100.0,
        closing_amount=drawer_data.closing_amount or 750.0,
        expected_amount=drawer_data.expected_amount or 750.0,
        difference=0.0,
        is_open=False
    )

# Sale Management
@router.get("/sales", response_model=List[Sale])
async def get_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get list of sales"""
    # Mock data for now
    return [
        Sale(
            id=1,
            sale_number="POS20240101120001",
            terminal_id=1,
            cashier_id="cashier_1",
            customer_id="customer_1",
            subtotal=50.0,
            tax_amount=5.0,
            discount_amount=0.0,
            total_amount=55.0,
            status="completed",
            sale_date="2024-01-01T12:00:00Z",
            notes="Regular sale",
            items=[]
        ),
        Sale(
            id=2,
            sale_number="POS20240101120002",
            terminal_id=1,
            cashier_id="cashier_1",
            customer_id=None,
            subtotal=25.0,
            tax_amount=2.5,
            discount_amount=2.5,
            total_amount=25.0,
            status="completed",
            sale_date="2024-01-01T12:15:00Z",
            notes="Sale with discount",
            items=[]
        )
    ]

@router.post("/sales", response_model=Sale)
async def create_sale(sale_data: SaleCreate):
    """Create a new sale"""
    # Mock implementation
    return Sale(
        id=3,
        sale_number="POS20240101120003",
        terminal_id=sale_data.terminal_id,
        cashier_id=sale_data.cashier_id,
        customer_id=sale_data.customer_id,
        subtotal=100.0,
        tax_amount=10.0,
        discount_amount=0.0,
        total_amount=110.0,
        status="pending",
        sale_date="2024-01-01T12:30:00Z",
        notes=sale_data.notes,
        items=[]
    )

@router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale(sale_id: int):
    """Get sale by ID"""
    # Mock implementation
    return Sale(
        id=sale_id,
        sale_number=f"POS2024010112000{sale_id}",
        terminal_id=1,
        cashier_id="cashier_1",
        customer_id="customer_1",
        subtotal=75.0,
        tax_amount=7.5,
        discount_amount=0.0,
        total_amount=82.5,
        status="completed",
        sale_date="2024-01-01T12:45:00Z",
        notes="Sample sale",
        items=[]
    )

@router.put("/sales/{sale_id}", response_model=Sale)
async def update_sale(sale_id: int, sale_data: SaleUpdate):
    """Update sale"""
    # Mock implementation
    return Sale(
        id=sale_id,
        sale_number=f"POS2024010112000{sale_id}",
        terminal_id=1,
        cashier_id="cashier_1",
        customer_id="customer_1",
        subtotal=75.0,
        tax_amount=7.5,
        discount_amount=0.0,
        total_amount=82.5,
        status=sale_data.status or "completed",
        sale_date="2024-01-01T12:45:00Z",
        notes=sale_data.notes or "Updated sale",
        items=[]
    )

# Payment Management
@router.get("/payments", response_model=List[Payment])
async def get_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get list of payments"""
    # Mock data for now
    return [
        Payment(
            id=1,
            sale_id=1,
            payment_method="credit_card",
            amount=55.0,
            status="completed",
            transaction_id="TXN001",
            reference_number="REF001",
            payment_date="2024-01-01T12:00:00Z",
            notes="Credit card payment"
        ),
        Payment(
            id=2,
            sale_id=2,
            payment_method="cash",
            amount=25.0,
            status="completed",
            transaction_id=None,
            reference_number="CASH001",
            payment_date="2024-01-01T12:15:00Z",
            notes="Cash payment"
        )
    ]

@router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate):
    """Create a new payment"""
    # Mock implementation
    return Payment(
        id=3,
        sale_id=payment_data.sale_id,
        payment_method=payment_data.payment_method,
        amount=payment_data.amount,
        status="pending",
        transaction_id=payment_data.transaction_id,
        reference_number=payment_data.reference_number,
        payment_date="2024-01-01T00:00:00Z",
        notes=payment_data.notes
    )



