"""
Invoicing Schemas for FusionAI Enterprise Suite
Pydantic models for API validation and serialization
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

class CustomerBase(BaseModel):
    """Base customer model"""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms_id: Optional[int] = None
    currency_id: Optional[int] = None
    credit_limit: Optional[Decimal] = None
    status: str = "active"  # active, inactive, suspended

class CustomerCreate(CustomerBase):
    """Model for creating a new customer"""
    pass

class CustomerUpdate(BaseModel):
    """Model for updating an existing customer"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms_id: Optional[int] = None
    currency_id: Optional[int] = None
    credit_limit: Optional[Decimal] = None
    status: Optional[str] = None

class CustomerResponse(CustomerBase):
    """Model for returning customer data"""
    id: int
    outstanding_balance: Decimal = Decimal('0.00')
    created_at: datetime
    updated_at: datetime

class ProductBase(BaseModel):
    """Base product model"""
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    unit_price: Optional[Decimal] = None
    cost: Optional[Decimal] = None
    tax_id: Optional[int] = None
    category: Optional[str] = None
    inventory_item: bool = True
    active: bool = True

class ProductCreate(ProductBase):
    """Model for creating a new product"""
    pass

class ProductUpdate(BaseModel):
    """Model for updating an existing product"""
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    unit_price: Optional[Decimal] = None
    cost: Optional[Decimal] = None
    tax_id: Optional[int] = None
    category: Optional[str] = None
    inventory_item: Optional[bool] = None
    active: Optional[bool] = None

class ProductResponse(ProductBase):
    """Model for returning product data"""
    id: int
    created_at: datetime
    updated_at: datetime

class InvoiceLineBase(BaseModel):
    """Base invoice line model"""
    product_id: Optional[int] = None
    description: Optional[str] = None
    quantity: Decimal = Field(default=Decimal('1.00'), gt=0)
    unit_price: Decimal = Field(default=Decimal('0.00'), ge=0)
    tax_id: Optional[int] = None

class InvoiceLineCreate(InvoiceLineBase):
    """Model for creating a new invoice line"""
    pass

class InvoiceLineUpdate(InvoiceLineBase):
    """Model for updating an existing invoice line"""
    pass

class InvoiceLineResponse(InvoiceLineBase):
    """Model for returning invoice line data"""
    id: int
    invoice_id: int
    tax_amount: Decimal = Decimal('0.00')
    line_total: Decimal = Decimal('0.00')
    created_at: datetime

class InvoiceBase(BaseModel):
    """Base invoice model"""
    customer_id: int
    invoice_date: date
    due_date: date
    payment_terms_id: Optional[int] = None
    notes: Optional[str] = None
    terms: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    """Model for creating a new invoice"""
    lines: List[InvoiceLineCreate]

class InvoiceUpdate(BaseModel):
    """Model for updating an existing invoice"""
    customer_id: Optional[int] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_terms_id: Optional[int] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = None
    lines: Optional[List[InvoiceLineUpdate]] = None

class InvoiceResponse(InvoiceBase):
    """Model for returning invoice data"""
    id: int
    invoice_number: str
    status: str
    subtotal: Decimal = Decimal('0.00')
    tax_amount: Decimal = Decimal('0.00')
    total_amount: Decimal = Decimal('0.00')
    currency_id: Optional[int] = None
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    lines: List[InvoiceLineResponse]

class PaymentBase(BaseModel):
    """Base payment model"""
    invoice_id: int
    payment_date: date
    amount: Decimal = Field(gt=0)
    payment_method: str  # cash, check, credit_card, bank_transfer
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: str = "completed"  # pending, completed, failed, refunded

class PaymentCreate(PaymentBase):
    """Model for creating a new payment"""
    pass

class PaymentUpdate(BaseModel):
    """Model for updating an existing payment"""
    invoice_id: Optional[int] = None
    payment_date: Optional[date] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class PaymentResponse(PaymentBase):
    """Model for returning payment data"""
    id: int
    created_at: datetime
    updated_at: datetime

class CreditNoteLineBase(BaseModel):
    """Base credit note line model"""
    invoice_line_id: int
    description: Optional[str] = None
    quantity: Decimal = Field(default=Decimal('1.00'), gt=0)
    unit_price: Decimal = Field(default=Decimal('0.00'), ge=0)
    tax_id: Optional[int] = None

class CreditNoteLineCreate(CreditNoteLineBase):
    """Model for creating a new credit note line"""
    pass

class CreditNoteLineUpdate(CreditNoteLineBase):
    """Model for updating an existing credit note line"""
    pass

class CreditNoteLineResponse(CreditNoteLineBase):
    """Model for returning credit note line data"""
    id: int
    credit_note_id: int
    tax_amount: Decimal = Decimal('0.00')
    line_total: Decimal = Decimal('0.00')
    created_at: datetime

class CreditNoteBase(BaseModel):
    """Base credit note model"""
    invoice_id: int
    customer_id: int
    credit_date: date
    notes: Optional[str] = None

class CreditNoteCreate(CreditNoteBase):
    """Model for creating a new credit note"""
    lines: List[CreditNoteLineCreate]

class CreditNoteUpdate(BaseModel):
    """Model for updating an existing credit note"""
    invoice_id: Optional[int] = None
    customer_id: Optional[int] = None
    credit_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    lines: Optional[List[CreditNoteLineUpdate]] = None

class CreditNoteResponse(CreditNoteBase):
    """Model for returning credit note data"""
    id: int
    credit_note_number: str
    status: str
    subtotal: Decimal = Decimal('0.00')
    tax_amount: Decimal = Decimal('0.00')
    total_amount: Decimal = Decimal('0.00')
    issued_at: Optional[datetime] = None
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    lines: List[CreditNoteLineResponse]

class RecurringTemplateLineBase(BaseModel):
    """Base recurring template line model"""
    product_id: Optional[int] = None
    description: Optional[str] = None
    quantity: Decimal = Field(default=Decimal('1.00'), gt=0)
    unit_price: Decimal = Field(default=Decimal('0.00'), ge=0)
    tax_id: Optional[int] = None

class RecurringTemplateLineCreate(RecurringTemplateLineBase):
    """Model for creating a new recurring template line"""
    pass

class RecurringTemplateLineUpdate(RecurringTemplateLineBase):
    """Model for updating an existing recurring template line"""
    pass

class RecurringTemplateLineResponse(RecurringTemplateLineBase):
    """Model for returning recurring template line data"""
    id: int
    template_id: int
    tax_amount: Decimal = Decimal('0.00')
    line_total: Decimal = Decimal('0.00')
    created_at: datetime

class RecurringInvoiceTemplateBase(BaseModel):
    """Base recurring invoice template model"""
    name: str
    customer_id: int
    frequency: str  # daily, weekly, monthly, yearly
    start_date: date
    end_date: Optional[date] = None
    next_invoice_date: Optional[date] = None
    status: str = "active"  # active, paused, completed
    payment_terms_id: Optional[int] = None
    notes: Optional[str] = None

class RecurringInvoiceTemplateCreate(RecurringInvoiceTemplateBase):
    """Model for creating a new recurring invoice template"""
    lines: List[RecurringTemplateLineCreate]

class RecurringInvoiceTemplateUpdate(BaseModel):
    """Model for updating an existing recurring invoice template"""
    name: Optional[str] = None
    customer_id: Optional[int] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    next_invoice_date: Optional[date] = None
    status: Optional[str] = None
    payment_terms_id: Optional[int] = None
    notes: Optional[str] = None
    lines: Optional[List[RecurringTemplateLineUpdate]] = None

class RecurringInvoiceTemplateResponse(RecurringInvoiceTemplateBase):
    """Model for returning recurring invoice template data"""
    id: int
    subtotal: Decimal = Decimal('0.00')
    tax_amount: Decimal = Decimal('0.00')
    total_amount: Decimal = Decimal('0.00')
    currency_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    lines: List[RecurringTemplateLineResponse]

class InvoiceAnalyticsResponse(BaseModel):
    """Model for invoice analytics response"""
    total_invoices: int
    total_amount: Decimal
    paid_amount: Decimal
    outstanding_amount: Decimal
    overdue_amount: Decimal
    paid_invoices: int
    overdue_invoices: int
    average_payment_time: int  # in days
    customer_metrics: List[dict]

class CustomerStatementRequest(BaseModel):
    """Model for customer statement request"""
    customer_id: int
    start_date: date
    end_date: date

class CustomerStatementResponse(BaseModel):
    """Model for customer statement response"""
    customer: CustomerResponse
    opening_balance: Decimal
    closing_balance: Decimal
    transactions: List[dict]
    period: dict