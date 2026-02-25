"""
Accounting Models for FusionAI Enterprise Suite
Financial accounting and bookkeeping models
"""

from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional
from enum import Enum
from sqlalchemy.dialects.postgresql import JSON
from ...core.database import Base

class ChartOfAccount(Base):
    """Chart of accounts model"""
    __tablename__ = "chart_of_accounts"
    
    id = Column(Integer, primary_key=True)
    account_code = Column(String(20), unique=True, nullable=False)
    account_name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # asset, liability, equity, revenue, expense
    parent_account_id = Column(Integer, ForeignKey("chart_of_accounts.id"))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    parent = relationship("src.modules.accounting.models.ChartOfAccount", remote_side=[id], back_populates="children")
    children = relationship("src.modules.accounting.models.ChartOfAccount", back_populates="parent")
    journal_entry_lines = relationship("src.modules.accounting.models.JournalEntryLine", back_populates="account")

class FiscalYear(Base):
    """Fiscal year model"""
    __tablename__ = "fiscal_years"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    company_id = Column(Integer, nullable=False)
    state = Column(String(20), default="open")  # open, closed
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    journal_entries = relationship("src.modules.accounting.models.JournalEntry", back_populates="fiscal_year")

class JournalEntry(Base):
    """Journal entry model"""
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True)
    entry_number = Column(String(50), unique=True, nullable=False)
    entry_date = Column(Date, nullable=False)
    description = Column(Text)
    reference_number = Column(String(255))
    reference_type = Column(String(50))
    posted_date = Column(DateTime)
    notes = Column(Text)
    tags = Column(JSON)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.id"))
    
    # Relationships
    fiscal_year = relationship("src.modules.accounting.models.FiscalYear", back_populates="journal_entries")
    lines = relationship("src.modules.accounting.models.JournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")

class JournalEntryLine(Base):
    """Journal entry line model"""
    __tablename__ = "journal_entry_lines"
    
    id = Column(Integer, primary_key=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id", ondelete="CASCADE"))
    account_id = Column(Integer, ForeignKey("chart_of_accounts.id"))
    debit = Column(Numeric(15, 2), default=0)
    credit = Column(Numeric(15, 2), default=0)
    description = Column(String)
    partner_id = Column(Integer)
    tax_id = Column(Integer)
    analytic_account_id = Column(Integer)
    reconciled = Column(Boolean, default=False)
    reconciliation_id = Column(Integer)
    
    # Relationships
    journal_entry = relationship("src.modules.accounting.models.JournalEntry", back_populates="lines")
    account = relationship("src.modules.accounting.models.ChartOfAccount", back_populates="journal_entry_lines")

class Tax(Base):
    """Tax model"""
    __tablename__ = "taxes"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50))  # percent, fixed, group
    amount = Column(Numeric(5, 2))
    account_id = Column(Integer, ForeignKey("chart_of_accounts.id"))
    company_id = Column(Integer, nullable=False)
    active = Column(Boolean, default=True)
    
    # Relationships
    account = relationship("src.modules.accounting.models.ChartOfAccount")

class BankStatement(Base):
    """Bank statement model"""
    __tablename__ = "bank_statements"
    
    id = Column(Integer, primary_key=True)
    bank_account_id = Column(Integer, nullable=False)
    statement_number = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    balance_start = Column(Numeric(15, 2))
    balance_end = Column(Numeric(15, 2))
    state = Column(String(20), default="draft")  # draft, confirmed, reconciled

class PaymentTerm(Base):
    """Payment term model"""
    __tablename__ = "payment_terms"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    days = Column(Integer)
    type = Column(String(50))  # net, percent, fixed
    value = Column(Numeric(5, 2))


class InvoiceStatus(str, Enum):
    """Invoice status enumeration"""
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentMethod(str, Enum):
    """Payment method enumeration"""
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CREDIT_CARD = "credit_card"
    CHECK = "check"
    PAYPAL = "paypal"
    OTHER = "other"


class Invoice(Base):
    """Invoice model"""
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    
    # Customer information
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=True)
    
    # Invoice details
    status = Column(String(20), default=InvoiceStatus.DRAFT)
    issue_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    paid_date = Column(DateTime(timezone=True), nullable=True)
    
    # Financial information
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    discount_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    paid_amount = Column(Numeric(15, 2), default=0)
    currency = Column(String(3), default="USD")
    
    # Additional information
    notes = Column(Text, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships will be defined after all classes

class InvoiceItem(Base):
    """Invoice item model"""
    __tablename__ = "invoice_items"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    # Item details
    description = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 4), nullable=False)
    unit_price = Column(Numeric(10, 4), nullable=False)
    total_price = Column(Numeric(15, 2), nullable=False)
    
    # Additional information
    item_type = Column(String(50), nullable=True)  # product, service, etc.
    unit_of_measure = Column(String(20), default="pcs")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships will be defined after all classes

class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(50), unique=True, nullable=False)
    
    # Related entities
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Payment details
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(20), default=PaymentStatus.PENDING)
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(100), nullable=True)
    
    # Dates
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional information
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships will be defined after all classes

class Customer(Base):
    """Customer model"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, nullable=False)
    
    # Customer details
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Address information
    billing_address = Column(JSON, nullable=True)
    
    # Customer metadata
    customer_type = Column(String(50), default="individual")  # individual, business
    status = Column(String(20), default="active")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships will be defined after all classes

class User(Base):
    """User model (referenced by accounting models)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # User relationships for accounting will be defined after all classes
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"

# Define relationships after all classes to avoid circular dependencies
Invoice.creator = relationship("src.modules.accounting.models.User", foreign_keys=[Invoice.created_by])
Invoice.customer = relationship("src.modules.accounting.models.Customer", back_populates="invoices")
Invoice.items = relationship("src.modules.accounting.models.InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
Invoice.payments = relationship("src.modules.accounting.models.Payment", back_populates="invoice", cascade="all, delete-orphan")

InvoiceItem.invoice = relationship("src.modules.accounting.models.Invoice", back_populates="items")

Payment.invoice = relationship("src.modules.accounting.models.Invoice", back_populates="payments")
Payment.customer = relationship("src.modules.accounting.models.Customer", back_populates="payments")
Payment.creator = relationship("src.modules.accounting.models.User", foreign_keys=[Payment.created_by])

Customer.invoices = relationship("src.modules.accounting.models.Invoice", back_populates="customer")
Customer.payments = relationship("src.modules.accounting.models.Payment", back_populates="customer")

User.created_invoices = relationship("src.modules.accounting.models.Invoice", foreign_keys="Invoice.created_by")
User.created_payments = relationship("src.modules.accounting.models.Payment", foreign_keys="Payment.created_by")

# Pydantic models for API validation
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class InvoiceCreate(BaseModel):
    """Schema for creating an invoice"""
    customer_id: int
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: Optional[str] = Field(None, max_length=255)
    due_date: Optional[datetime] = None
    subtotal: float = Field(default=0, ge=0)
    tax_amount: float = Field(default=0, ge=0)
    discount_amount: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    currency: str = Field(default="USD", max_length=3)
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class InvoiceUpdate(BaseModel):
    """Schema for updating an invoice"""
    customer_name: Optional[str] = Field(None, max_length=255)
    customer_email: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    subtotal: Optional[float] = Field(None, ge=0)
    tax_amount: Optional[float] = Field(None, ge=0)
    discount_amount: Optional[float] = Field(None, ge=0)
    total_amount: Optional[float] = Field(None, ge=0)
    paid_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class InvoiceResponse(BaseModel):
    """Schema for invoice responses"""
    id: int
    invoice_number: str
    customer_id: int
    customer_name: str
    customer_email: Optional[str]
    status: str
    issue_date: datetime
    due_date: Optional[datetime]
    paid_date: Optional[datetime]
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    paid_amount: float
    currency: str
    notes: Optional[str]
    terms_and_conditions: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    """Schema for creating a payment"""
    invoice_id: Optional[int] = None
    customer_id: int
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_reference: Optional[str] = Field(None, max_length=100)
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    """Schema for payment responses"""
    id: int
    payment_number: str
    invoice_id: Optional[int]
    customer_id: int
    amount: float
    currency: str
    status: str
    payment_method: Optional[str]
    payment_reference: Optional[str]
    payment_date: datetime
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True