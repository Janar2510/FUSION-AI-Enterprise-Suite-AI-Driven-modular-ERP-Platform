"""
Accounting Schemas for FusionAI Enterprise Suite
Pydantic models for API validation and serialization
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import date as date_type, datetime
from decimal import Decimal

class ChartOfAccountBase(BaseModel):
    """Base chart of account model"""
    code: str
    name: str
    type: str  # asset, liability, equity, revenue, expense
    parent_id: Optional[int] = None
    company_id: int
    currency_id: int
    active: bool = True

class ChartOfAccountCreate(ChartOfAccountBase):
    """Model for creating a new chart of account"""
    pass

class ChartOfAccountUpdate(BaseModel):
    """Model for updating an existing chart of account"""
    code: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[int] = None
    company_id: Optional[int] = None
    currency_id: Optional[int] = None
    active: Optional[bool] = None

class ChartOfAccountResponse(ChartOfAccountBase):
    """Model for returning chart of account data"""
    id: int
    created_at: datetime

class FiscalYearBase(BaseModel):
    """Base fiscal year model"""
    name: Optional[str] = None
    start_date: date_type
    end_date: date_type
    company_id: int
    state: str = "open"  # open, closed

class FiscalYearCreate(FiscalYearBase):
    """Model for creating a new fiscal year"""
    pass

class FiscalYearUpdate(BaseModel):
    """Model for updating an existing fiscal year"""
    name: Optional[str] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    company_id: Optional[int] = None
    state: Optional[str] = None

class FiscalYearResponse(FiscalYearBase):
    """Model for returning fiscal year data"""
    id: int
    created_at: datetime

class JournalEntryLineBase(BaseModel):
    """Base journal entry line model"""
    account_id: int
    debit: Decimal = Field(default=Decimal('0.00'), ge=0)
    credit: Decimal = Field(default=Decimal('0.00'), ge=0)
    description: Optional[str] = None
    partner_id: Optional[int] = None
    tax_id: Optional[int] = None
    analytic_account_id: Optional[int] = None

class JournalEntryLineCreate(JournalEntryLineBase):
    """Model for creating a new journal entry line"""
    pass

class JournalEntryLineUpdate(BaseModel):
    """Model for updating an existing journal entry line"""
    account_id: Optional[int] = None
    debit: Optional[Decimal] = None
    credit: Optional[Decimal] = None
    description: Optional[str] = None
    partner_id: Optional[int] = None
    tax_id: Optional[int] = None
    analytic_account_id: Optional[int] = None

class JournalEntryLineResponse(JournalEntryLineBase):
    """Model for returning journal entry line data"""
    id: int
    journal_entry_id: int

class JournalEntryBase(BaseModel):
    """Base journal entry model"""
    date: date_type
    reference: Optional[str] = None
    company_id: int
    fiscal_year_id: Optional[int] = None

class JournalEntryCreate(JournalEntryBase):
    """Model for creating a new journal entry"""
    lines: List[JournalEntryLineCreate]

class JournalEntryUpdate(BaseModel):
    """Model for updating an existing journal entry"""
    date: Optional[date_type] = None
    reference: Optional[str] = None
    company_id: Optional[int] = None
    fiscal_year_id: Optional[int] = None
    lines: Optional[List[JournalEntryLineUpdate]] = None

class JournalEntryResponse(JournalEntryBase):
    """Model for returning journal entry data"""
    id: int
    entry_number: str
    state: str
    created_by: int
    posted_by: Optional[int] = None
    posted_at: Optional[datetime] = None
    created_at: datetime
    lines: List[JournalEntryLineResponse]

class TaxBase(BaseModel):
    """Base tax model"""
    name: str
    type: Optional[str] = None  # percent, fixed, group
    amount: Optional[Decimal] = None
    account_id: Optional[int] = None
    company_id: int
    active: bool = True

class TaxCreate(TaxBase):
    """Model for creating a new tax"""
    pass

class TaxUpdate(BaseModel):
    """Model for updating an existing tax"""
    name: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[Decimal] = None
    account_id: Optional[int] = None
    company_id: Optional[int] = None
    active: Optional[bool] = None

class TaxResponse(TaxBase):
    """Model for returning tax data"""
    id: int

class BankStatementBase(BaseModel):
    """Base bank statement model"""
    bank_account_id: int
    statement_number: Optional[str] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    balance_start: Optional[Decimal] = None
    balance_end: Optional[Decimal] = None
    state: str = "draft"  # draft, confirmed, reconciled

class BankStatementCreate(BankStatementBase):
    """Model for creating a new bank statement"""
    pass

class BankStatementUpdate(BaseModel):
    """Model for updating an existing bank statement"""
    bank_account_id: Optional[int] = None
    statement_number: Optional[str] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    balance_start: Optional[Decimal] = None
    balance_end: Optional[Decimal] = None
    state: Optional[str] = None

class BankStatementResponse(BankStatementBase):
    """Model for returning bank statement data"""
    id: int

class PaymentTermBase(BaseModel):
    """Base payment term model"""
    name: Optional[str] = None
    days: Optional[int] = None
    type: Optional[str] = None  # net, percent, fixed
    value: Optional[Decimal] = None

class PaymentTermCreate(PaymentTermBase):
    """Model for creating a new payment term"""
    pass

class PaymentTermUpdate(PaymentTermBase):
    """Model for updating an existing payment term"""
    pass

class PaymentTermResponse(PaymentTermBase):
    """Model for returning payment term data"""
    id: int

class BalanceSheetResponse(BaseModel):
    """Model for balance sheet response"""
    as_of_date: date_type
    company_id: int
    assets: List[dict]
    liabilities: List[dict]
    equity: List[dict]
    total_assets: Decimal
    total_liabilities: Decimal
    total_equity: Decimal

class BankReconciliationCreate(BaseModel):
    """Model for bank reconciliation request"""
    bank_account_id: int
    start_date: date_type
    end_date: date_type

class BankReconciliationResponse(BaseModel):
    """Model for bank reconciliation response"""
    total_bank_transactions: int
    total_journal_entries: int
    auto_matched: int
    manual_review_required: int
    unmatched_bank: int
    unmatched_journal: int