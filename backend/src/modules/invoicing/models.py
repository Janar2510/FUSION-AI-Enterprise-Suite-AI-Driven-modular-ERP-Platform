"""
Invoicing Models for FusionAI Enterprise Suite
Invoice management and billing models
"""

from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional
from ...core.database import Base

class Customer(Base):
    """Customer model for invoicing"""
    __tablename__ = "invoicing_customers"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    phone = Column(String(50))
    billing_address = Column(Text)
    shipping_address = Column(Text)
    tax_id = Column(String(50))
    payment_terms_id = Column(Integer, ForeignKey("payment_terms.id"))
    currency_id = Column(Integer)
    credit_limit = Column(Numeric(15, 2))
    outstanding_balance = Column(Numeric(15, 2), default=0)
    status = Column(String(20), default="active")  # active, inactive, suspended
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    invoices = relationship("Invoice", back_populates="customer")
    credit_notes = relationship("CreditNote", back_populates="customer")
    recurring_templates = relationship("RecurringInvoiceTemplate", back_populates="customer")

class Product(Base):
    """Product model for invoicing"""
    __tablename__ = "invoicing_products"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sku = Column(String(100), unique=True)
    unit_price = Column(Numeric(15, 2))
    cost = Column(Numeric(15, 2))
    tax_id = Column(Integer, ForeignKey("taxes.id"))
    category = Column(String(100))
    inventory_item = Column(Boolean, default=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    invoice_lines = relationship("InvoiceLine", back_populates="product")
    credit_note_lines = relationship("CreditNoteLine", back_populates="product")
    template_lines = relationship("RecurringTemplateLine", back_populates="product")
    tax = relationship("Tax", back_populates="products")

class Invoice(Base):
    """Invoice header model"""
    __tablename__ = "invoicing_invoices"
    
    id = Column(Integer, primary_key=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String(20), default="draft")  # draft, sent, paid, overdue, cancelled
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    currency_id = Column(Integer)
    payment_terms_id = Column(Integer, ForeignKey("payment_terms.id"))
    notes = Column(Text)
    terms = Column(Text)
    sent_at = Column(DateTime)
    paid_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")
    credit_notes = relationship("CreditNote", back_populates="invoice")

class InvoiceLine(Base):
    """Invoice line model"""
    __tablename__ = "invoicing_invoice_lines"
    
    id = Column(Integer, primary_key=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    description = Column(Text)
    quantity = Column(Numeric(10, 2))
    unit_price = Column(Numeric(15, 2))
    tax_id = Column(Integer, ForeignKey("taxes.id"))
    tax_amount = Column(Numeric(15, 2), default=0)
    line_total = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product", back_populates="invoice_lines")
    credit_note_lines = relationship("CreditNoteLine", back_populates="invoice_line")

class Payment(Base):
    """Payment model"""
    __tablename__ = "invoicing_payments"
    
    id = Column(Integer, primary_key=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric(15, 2))
    payment_method = Column(String(50))  # cash, check, credit_card, bank_transfer
    reference = Column(String(255))
    notes = Column(Text)
    status = Column(String(20), default="completed")  # pending, completed, failed, refunded
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")

class CreditNote(Base):
    """Credit note model"""
    __tablename__ = "invoicing_credit_notes"
    
    id = Column(Integer, primary_key=True)
    credit_note_number = Column(String(50), unique=True, nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    credit_date = Column(Date, nullable=False)
    status = Column(String(20), default="draft")  # draft, issued, applied
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    notes = Column(Text)
    issued_at = Column(DateTime)
    applied_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    invoice = relationship("Invoice", back_populates="credit_notes")
    customer = relationship("Customer", back_populates="credit_notes")
    lines = relationship("CreditNoteLine", back_populates="credit_note", cascade="all, delete-orphan")

class CreditNoteLine(Base):
    """Credit note line model"""
    __tablename__ = "invoicing_credit_note_lines"
    
    id = Column(Integer, primary_key=True)
    credit_note_id = Column(Integer, ForeignKey("credit_notes.id", ondelete="CASCADE"))
    invoice_line_id = Column(Integer, ForeignKey("invoice_lines.id"))
    description = Column(Text)
    quantity = Column(Numeric(10, 2))
    unit_price = Column(Numeric(15, 2))
    tax_id = Column(Integer, ForeignKey("taxes.id"))
    tax_amount = Column(Numeric(15, 2), default=0)
    line_total = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    credit_note = relationship("CreditNote", back_populates="lines")
    invoice_line = relationship("InvoiceLine", back_populates="credit_note_lines")
    product = relationship("Product", back_populates="credit_note_lines")

class RecurringInvoiceTemplate(Base):
    """Recurring invoice template model"""
    __tablename__ = "invoicing_recurring_invoice_templates"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    frequency = Column(String(20))  # daily, weekly, monthly, yearly
    start_date = Column(Date)
    end_date = Column(Date)
    next_invoice_date = Column(Date)
    status = Column(String(20), default="active")  # active, paused, completed
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    currency_id = Column(Integer)
    payment_terms_id = Column(Integer, ForeignKey("payment_terms.id"))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="recurring_templates")
    lines = relationship("RecurringTemplateLine", back_populates="template", cascade="all, delete-orphan")

class RecurringTemplateLine(Base):
    """Recurring template line model"""
    __tablename__ = "invoicing_recurring_template_lines"
    
    id = Column(Integer, primary_key=True)
    template_id = Column(Integer, ForeignKey("recurring_invoice_templates.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    description = Column(Text)
    quantity = Column(Numeric(10, 2))
    unit_price = Column(Numeric(15, 2))
    tax_id = Column(Integer, ForeignKey("taxes.id"))
    tax_amount = Column(Numeric(15, 2), default=0)
    line_total = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    template = relationship("RecurringInvoiceTemplate", back_populates="lines")
    product = relationship("Product", back_populates="template_lines")

# Add back references to Tax model (assuming it exists in the accounting module)
# This would need to be added to the Tax model in accounting/models.py:
# products = relationship("Product", back_populates="tax")