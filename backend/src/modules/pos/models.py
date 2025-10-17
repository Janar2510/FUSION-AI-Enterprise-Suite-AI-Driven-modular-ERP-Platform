from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import enum

Base = declarative_base()

# Enums
class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    MOBILE_PAYMENT = "mobile_payment"
    CHECK = "check"

class SaleStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class TaxType(str, enum.Enum):
    SALES_TAX = "sales_tax"
    VAT = "vat"
    GST = "gst"
    EXEMPT = "exempt"

# Database Models
class Terminal(Base):
    __tablename__ = "pos_terminals"
    
    id = Column(Integer, primary_key=True, index=True)
    terminal_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sales = relationship("Sale", back_populates="terminal")
    cash_drawers = relationship("CashDrawer", back_populates="terminal")

class CashDrawer(Base):
    __tablename__ = "pos_cash_drawers"
    
    id = Column(Integer, primary_key=True, index=True)
    terminal_id = Column(Integer, ForeignKey("pos_terminals.id"), nullable=False)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True))
    opened_by = Column(String(100))
    closed_by = Column(String(100))
    opening_amount = Column(Float, default=0.0)
    closing_amount = Column(Float)
    expected_amount = Column(Float)
    difference = Column(Float)
    is_open = Column(Boolean, default=True)
    
    # Relationships
    terminal = relationship("Terminal", back_populates="cash_drawers")

class Sale(Base):
    __tablename__ = "pos_sales"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_number = Column(String(50), unique=True, index=True, nullable=False)
    terminal_id = Column(Integer, ForeignKey("pos_terminals.id"), nullable=False)
    cashier_id = Column(String(100))
    customer_id = Column(String(100))
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    status = Column(SQLEnum(SaleStatus), default=SaleStatus.PENDING)
    sale_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    
    # Relationships
    terminal = relationship("Terminal", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "pos_sale_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("pos_sales.id"), nullable=False)
    product_id = Column(String(100), nullable=False)
    product_name = Column(String(200), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_rate = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    
    # Relationships
    sale = relationship("Sale", back_populates="items")

class Payment(Base):
    __tablename__ = "pos_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("pos_sales.id"), nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    transaction_id = Column(String(200))
    reference_number = Column(String(100))
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    
    # Relationships
    sale = relationship("Sale", back_populates="payments")

class TaxRate(Base):
    __tablename__ = "pos_tax_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rate = Column(Float, nullable=False)
    tax_type = Column(SQLEnum(TaxType), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Discount(Base):
    __tablename__ = "pos_discounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True)
    discount_type = Column(String(20), nullable=False)  # percentage, fixed
    discount_value = Column(Float, nullable=False)
    minimum_amount = Column(Float)
    maximum_discount = Column(Float)
    is_active = Column(Boolean, default=True)
    valid_from = Column(DateTime(timezone=True))
    valid_to = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Pydantic Models
class TerminalBase(BaseModel):
    terminal_id: str
    name: str
    location: Optional[str] = None
    is_active: bool = True

class TerminalCreate(TerminalBase):
    pass

class TerminalUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class Terminal(TerminalBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CashDrawerBase(BaseModel):
    terminal_id: int
    opened_by: Optional[str] = None
    opening_amount: float = 0.0

class CashDrawerCreate(CashDrawerBase):
    pass

class CashDrawerUpdate(BaseModel):
    closed_by: Optional[str] = None
    closing_amount: Optional[float] = None
    expected_amount: Optional[float] = None
    is_open: Optional[bool] = None

class CashDrawer(CashDrawerBase):
    id: int
    opened_at: datetime
    closed_at: Optional[datetime] = None
    closed_by: Optional[str] = None
    closing_amount: Optional[float] = None
    expected_amount: Optional[float] = None
    difference: Optional[float] = None
    is_open: bool = True
    
    class Config:
        from_attributes = True

class SaleItemBase(BaseModel):
    product_id: str
    product_name: str
    quantity: float
    unit_price: float
    tax_rate: float = 0.0
    discount_rate: float = 0.0

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    sale_id: int
    total_price: float
    tax_amount: float
    discount_amount: float
    
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    terminal_id: int
    cashier_id: Optional[str] = None
    customer_id: Optional[str] = None
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]

class SaleUpdate(BaseModel):
    status: Optional[SaleStatus] = None
    notes: Optional[str] = None

class Sale(SaleBase):
    id: int
    sale_number: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    status: SaleStatus
    sale_date: datetime
    items: List[SaleItem] = []
    
    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    payment_method: PaymentMethod
    amount: float
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    sale_id: int

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class Payment(PaymentBase):
    id: int
    sale_id: int
    status: PaymentStatus
    payment_date: datetime
    
    class Config:
        from_attributes = True

class TaxRateBase(BaseModel):
    name: str
    rate: float
    tax_type: TaxType
    is_active: bool = True

class TaxRateCreate(TaxRateBase):
    pass

class TaxRateUpdate(BaseModel):
    name: Optional[str] = None
    rate: Optional[float] = None
    tax_type: Optional[TaxType] = None
    is_active: Optional[bool] = None

class TaxRate(TaxRateBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class DiscountBase(BaseModel):
    name: str
    code: Optional[str] = None
    discount_type: str
    discount_value: float
    minimum_amount: Optional[float] = None
    maximum_discount: Optional[float] = None
    is_active: bool = True
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None

class DiscountCreate(DiscountBase):
    pass

class DiscountUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    minimum_amount: Optional[float] = None
    maximum_discount: Optional[float] = None
    is_active: Optional[bool] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None

class Discount(DiscountBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True



