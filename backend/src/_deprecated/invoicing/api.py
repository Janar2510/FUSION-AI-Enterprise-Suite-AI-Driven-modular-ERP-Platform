"""
Invoicing API for FusionAI Enterprise Suite
REST API endpoints for invoice management and billing operations
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
import logging

from .models import (
    Customer, Product, Invoice, InvoiceLine, Payment, 
    CreditNote, CreditNoteLine, RecurringInvoiceTemplate, RecurringTemplateLine
)
from .schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    InvoiceCreate, InvoiceUpdate, InvoiceResponse,
    PaymentCreate, PaymentUpdate, PaymentResponse,
    CreditNoteCreate, CreditNoteUpdate, CreditNoteResponse,
    RecurringInvoiceTemplateCreate, RecurringInvoiceTemplateUpdate, RecurringInvoiceTemplateResponse,
    InvoiceAnalyticsResponse, CustomerStatementRequest, CustomerStatementResponse
)
from .service import InvoicingService
from ...core.database import get_async_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/invoicing", tags=["invoicing"])

# Helper function to get user ID from request (simplified)
async def get_current_user_id(request: Request) -> int:
    # In a real implementation, this would extract user ID from auth token
    return 1

# Customer endpoints
@router.post("/customers", response_model=CustomerResponse)
async def create_customer(
    customer_data: CustomerCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new customer"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        customer = await service.create_customer(customer_data)
        return customer
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a customer by ID"""
    try:
        service = InvoicingService(db)
        customer = await service.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing customer"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        customer = await service.update_customer(customer_id, customer_data)
        return customer
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a customer"""
    try:
        service = InvoicingService(db)
        success = await service.delete_customer(customer_id)
        if not success:
            raise HTTPException(status_code=404, detail="Customer not found")
        return {"message": "Customer deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """List customers with pagination and optional status filter"""
    try:
        service = InvoicingService(db)
        customers = await service.list_customers(skip, limit, status)
        return customers
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Product endpoints
@router.post("/products", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new product"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        product = await service.create_product(product_data)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a product by ID"""
    try:
        service = InvoicingService(db)
        product = await service.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing product"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        product = await service.update_product(product_id, product_data)
        return product
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a product"""
    try:
        service = InvoicingService(db)
        success = await service.delete_product(product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    active: Optional[bool] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """List products with pagination and optional active filter"""
    try:
        service = InvoicingService(db)
        products = await service.list_products(skip, limit, active)
        return products
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Invoice endpoints
@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(
    invoice_data: InvoiceCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new invoice with validation"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        invoice = await service.create_invoice(invoice_data)
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get an invoice by ID"""
    try:
        service = InvoicingService(db)
        invoice = await service.get_invoice(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing invoice"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        invoice = await service.update_invoice(invoice_id, invoice_data)
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete an invoice"""
    try:
        service = InvoicingService(db)
        success = await service.delete_invoice(invoice_id)
        if not success:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return {"message": "Invoice deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/invoices/{invoice_id}/send", response_model=InvoiceResponse)
async def send_invoice(
    invoice_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Send an invoice to customer"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        invoice = await service.send_invoice(invoice_id)
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/invoices/{invoice_id}/cancel", response_model=InvoiceResponse)
async def cancel_invoice(
    invoice_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Cancel an invoice"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        invoice = await service.cancel_invoice(invoice_id)
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """List invoices with pagination and optional status filter"""
    try:
        service = InvoicingService(db)
        invoices = await service.list_invoices(skip, limit, status)
        return invoices
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Payment endpoints
@router.post("/payments", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new payment"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        payment = await service.create_payment(payment_data)
        return payment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a payment by ID"""
    try:
        service = InvoicingService(db)
        payment = await service.get_payment(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/payments/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    payment_data: PaymentUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing payment"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        payment = await service.update_payment(payment_id, payment_data)
        return payment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/payments/{payment_id}")
async def delete_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a payment"""
    try:
        service = InvoicingService(db)
        success = await service.delete_payment(payment_id)
        if not success:
            raise HTTPException(status_code=404, detail="Payment not found")
        return {"message": "Payment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Credit Note endpoints
@router.post("/credit-notes", response_model=CreditNoteResponse)
async def create_credit_note(
    credit_note_data: CreditNoteCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new credit note"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        credit_note = await service.create_credit_note(credit_note_data)
        return credit_note
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/credit-notes/{credit_note_id}", response_model=CreditNoteResponse)
async def get_credit_note(
    credit_note_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a credit note by ID"""
    try:
        service = InvoicingService(db)
        credit_note = await service.get_credit_note(credit_note_id)
        if not credit_note:
            raise HTTPException(status_code=404, detail="Credit note not found")
        return credit_note
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/credit-notes/{credit_note_id}", response_model=CreditNoteResponse)
async def update_credit_note(
    credit_note_id: int,
    credit_note_data: CreditNoteUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing credit note"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        credit_note = await service.update_credit_note(credit_note_id, credit_note_data)
        return credit_note
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/credit-notes/{credit_note_id}")
async def delete_credit_note(
    credit_note_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a credit note"""
    try:
        service = InvoicingService(db)
        success = await service.delete_credit_note(credit_note_id)
        if not success:
            raise HTTPException(status_code=404, detail="Credit note not found")
        return {"message": "Credit note deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/credit-notes/{credit_note_id}/issue", response_model=CreditNoteResponse)
async def issue_credit_note(
    credit_note_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Issue a credit note"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        credit_note = await service.issue_credit_note(credit_note_id)
        return credit_note
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Recurring Invoice endpoints
@router.post("/recurring-templates", response_model=RecurringInvoiceTemplateResponse)
async def create_recurring_template(
    template_data: RecurringInvoiceTemplateCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new recurring invoice template"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        template = await service.create_recurring_template(template_data)
        return template
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/recurring-templates/{template_id}", response_model=RecurringInvoiceTemplateResponse)
async def get_recurring_template(
    template_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a recurring template by ID"""
    try:
        service = InvoicingService(db)
        template = await service.get_recurring_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Recurring template not found")
        return template
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/recurring-templates/{template_id}", response_model=RecurringInvoiceTemplateResponse)
async def update_recurring_template(
    template_id: int,
    template_data: RecurringInvoiceTemplateUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing recurring template"""
    try:
        user_id = await get_current_user_id(request)
        service = InvoicingService(db)
        template = await service.update_recurring_template(template_id, template_data)
        return template
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/recurring-templates/{template_id}")
async def delete_recurring_template(
    template_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a recurring template"""
    try:
        service = InvoicingService(db)
        success = await service.delete_recurring_template(template_id)
        if not success:
            raise HTTPException(status_code=404, detail="Recurring template not found")
        return {"message": "Recurring template deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/recurring-templates", response_model=List[RecurringInvoiceTemplateResponse])
async def list_recurring_templates(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """List recurring templates with pagination and optional status filter"""
    try:
        service = InvoicingService(db)
        templates = await service.list_recurring_templates(skip, limit, status)
        return templates
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Analytics endpoints
@router.get("/analytics/invoice", response_model=InvoiceAnalyticsResponse)
async def get_invoice_analytics(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: AsyncSession = Depends(get_async_session)
):
    """Get invoice analytics for a date range"""
    try:
        service = InvoicingService(db)
        analytics = await service.get_invoice_analytics(start_date, end_date)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/customer-statement", response_model=CustomerStatementResponse)
async def get_customer_statement(
    statement_request: CustomerStatementRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """Get customer statement for a date range"""
    try:
        service = InvoicingService(db)
        statement = await service.get_customer_statement(
            statement_request.customer_id,
            statement_request.start_date,
            statement_request.end_date
        )
        return statement
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))