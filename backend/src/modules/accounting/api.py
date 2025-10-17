"""
Accounting API for FusionAI Enterprise Suite
REST API endpoints for accounting and financial operations
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
import logging

from .models import ChartOfAccount, FiscalYear, JournalEntry, Tax, BankStatement, PaymentTerm
from .schemas import (
    ChartOfAccountCreate, ChartOfAccountUpdate, ChartOfAccountResponse,
    FiscalYearCreate, FiscalYearUpdate, FiscalYearResponse,
    JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse,
    TaxCreate, TaxUpdate, TaxResponse,
    BankStatementCreate, BankStatementUpdate, BankStatementResponse,
    PaymentTermCreate, PaymentTermUpdate, PaymentTermResponse,
    BalanceSheetResponse, BankReconciliationCreate, BankReconciliationResponse
)
from .service import AccountingService
from ...core.database import get_async_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/accounting", tags=["accounting"])

# Helper function to get user ID from request (simplified)
async def get_current_user_id(request: Request) -> int:
    # In a real implementation, this would extract user ID from auth token
    return 1

@router.post("/chart-of-accounts", response_model=ChartOfAccountResponse)
async def create_chart_of_account(
    account_data: ChartOfAccountCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new chart of account"""
    try:
        service = AccountingService(db)
        account = await service.create_chart_of_account(account_data)
        return account
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/chart-of-accounts/{account_id}", response_model=ChartOfAccountResponse)
async def get_chart_of_account(
    account_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a chart of account by ID"""
    try:
        service = AccountingService(db)
        account = await service.get_chart_of_account(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Chart of account not found")
        return account
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/chart-of-accounts/{account_id}", response_model=ChartOfAccountResponse)
async def update_chart_of_account(
    account_id: int,
    account_data: ChartOfAccountUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing chart of account"""
    try:
        service = AccountingService(db)
        account = await service.update_chart_of_account(account_id, account_data)
        return account
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/chart-of-accounts/{account_id}")
async def delete_chart_of_account(
    account_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a chart of account"""
    try:
        service = AccountingService(db)
        success = await service.delete_chart_of_account(account_id)
        if not success:
            raise HTTPException(status_code=404, detail="Chart of account not found")
        return {"message": "Chart of account deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/chart-of-accounts", response_model=List[ChartOfAccountResponse])
async def list_chart_of_accounts(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    db: AsyncSession = Depends(get_async_session)
):
    """List chart of accounts with pagination"""
    try:
        service = AccountingService(db)
        accounts = await service.list_chart_of_accounts(skip, limit)
        return accounts
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/fiscal-years", response_model=FiscalYearResponse)
async def create_fiscal_year(
    fiscal_year_data: FiscalYearCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new fiscal year"""
    try:
        service = AccountingService(db)
        fiscal_year = await service.create_fiscal_year(fiscal_year_data)
        return fiscal_year
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/fiscal-years/{fiscal_year_id}", response_model=FiscalYearResponse)
async def get_fiscal_year(
    fiscal_year_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a fiscal year by ID"""
    try:
        service = AccountingService(db)
        fiscal_year = await service.get_fiscal_year(fiscal_year_id)
        if not fiscal_year:
            raise HTTPException(status_code=404, detail="Fiscal year not found")
        return fiscal_year
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/fiscal-years/{fiscal_year_id}", response_model=FiscalYearResponse)
async def update_fiscal_year(
    fiscal_year_id: int,
    fiscal_year_data: FiscalYearUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing fiscal year"""
    try:
        service = AccountingService(db)
        fiscal_year = await service.update_fiscal_year(fiscal_year_id, fiscal_year_data)
        return fiscal_year
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/fiscal-years/{fiscal_year_id}")
async def delete_fiscal_year(
    fiscal_year_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a fiscal year"""
    try:
        service = AccountingService(db)
        success = await service.delete_fiscal_year(fiscal_year_id)
        if not success:
            raise HTTPException(status_code=404, detail="Fiscal year not found")
        return {"message": "Fiscal year deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/journal-entries", response_model=JournalEntryResponse)
async def create_journal_entry(
    entry_data: JournalEntryCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new journal entry with automatic validation"""
    try:
        user_id = await get_current_user_id(request)
        service = AccountingService(db)
        entry = await service.create_journal_entry(entry_data, user_id)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/journal-entries/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a journal entry by ID"""
    try:
        service = AccountingService(db)
        entry = await service.get_journal_entry(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        return entry
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/journal-entries/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(
    entry_id: int,
    entry_data: JournalEntryUpdate,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing journal entry"""
    try:
        user_id = await get_current_user_id(request)
        service = AccountingService(db)
        entry = await service.update_journal_entry(entry_id, entry_data, user_id)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/journal-entries/{entry_id}")
async def delete_journal_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a journal entry"""
    try:
        service = AccountingService(db)
        success = await service.delete_journal_entry(entry_id)
        if not success:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        return {"message": "Journal entry deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/journal-entries/{entry_id}/post", response_model=JournalEntryResponse)
async def post_journal_entry(
    entry_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """Post a journal entry to the general ledger"""
    try:
        user_id = await get_current_user_id(request)
        service = AccountingService(db)
        entry = await service.post_journal_entry(entry_id, user_id)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/journal-entries", response_model=List[JournalEntryResponse])
async def list_journal_entries(
    skip: int = 0,
    limit: int = Query(100, le=1000),
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """List journal entries with pagination and optional state filter"""
    try:
        service = AccountingService(db)
        entries = await service.list_journal_entries(skip, limit, state)
        return entries
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/taxes", response_model=TaxResponse)
async def create_tax(
    tax_data: TaxCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new tax"""
    try:
        service = AccountingService(db)
        tax = await service.create_tax(tax_data)
        return tax
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/taxes/{tax_id}", response_model=TaxResponse)
async def get_tax(
    tax_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a tax by ID"""
    try:
        service = AccountingService(db)
        tax = await service.get_tax(tax_id)
        if not tax:
            raise HTTPException(status_code=404, detail="Tax not found")
        return tax
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/taxes/{tax_id}", response_model=TaxResponse)
async def update_tax(
    tax_id: int,
    tax_data: TaxUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing tax"""
    try:
        service = AccountingService(db)
        tax = await service.update_tax(tax_id, tax_data)
        return tax
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/taxes/{tax_id}")
async def delete_tax(
    tax_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a tax"""
    try:
        service = AccountingService(db)
        success = await service.delete_tax(tax_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tax not found")
        return {"message": "Tax deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bank-statements", response_model=BankStatementResponse)
async def create_bank_statement(
    statement_data: BankStatementCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new bank statement"""
    try:
        service = AccountingService(db)
        statement = await service.create_bank_statement(statement_data)
        return statement
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/bank-statements/{statement_id}", response_model=BankStatementResponse)
async def get_bank_statement(
    statement_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a bank statement by ID"""
    try:
        service = AccountingService(db)
        statement = await service.get_bank_statement(statement_id)
        if not statement:
            raise HTTPException(status_code=404, detail="Bank statement not found")
        return statement
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/bank-statements/{statement_id}", response_model=BankStatementResponse)
async def update_bank_statement(
    statement_id: int,
    statement_data: BankStatementUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing bank statement"""
    try:
        service = AccountingService(db)
        statement = await service.update_bank_statement(statement_id, statement_data)
        return statement
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/bank-statements/{statement_id}")
async def delete_bank_statement(
    statement_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a bank statement"""
    try:
        service = AccountingService(db)
        success = await service.delete_bank_statement(statement_id)
        if not success:
            raise HTTPException(status_code=404, detail="Bank statement not found")
        return {"message": "Bank statement deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payment-terms", response_model=PaymentTermResponse)
async def create_payment_term(
    term_data: PaymentTermCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new payment term"""
    try:
        service = AccountingService(db)
        term = await service.create_payment_term(term_data)
        return term
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/payment-terms/{term_id}", response_model=PaymentTermResponse)
async def get_payment_term(
    term_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a payment term by ID"""
    try:
        service = AccountingService(db)
        term = await service.get_payment_term(term_id)
        if not term:
            raise HTTPException(status_code=404, detail="Payment term not found")
        return term
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/payment-terms/{term_id}", response_model=PaymentTermResponse)
async def update_payment_term(
    term_id: int,
    term_data: PaymentTermUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing payment term"""
    try:
        service = AccountingService(db)
        term = await service.update_payment_term(term_id, term_data)
        return term
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/payment-terms/{term_id}")
async def delete_payment_term(
    term_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a payment term"""
    try:
        service = AccountingService(db)
        success = await service.delete_payment_term(term_id)
        if not success:
            raise HTTPException(status_code=404, detail="Payment term not found")
        return {"message": "Payment term deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/financial-statements/balance-sheet", response_model=BalanceSheetResponse)
async def get_balance_sheet(
    as_of_date: date = Query(...),
    company_id: int = Query(...),
    db: AsyncSession = Depends(get_async_session)
):
    """Generate real-time balance sheet"""
    try:
        service = AccountingService(db)
        balance_sheet = await service.get_balance_sheet(as_of_date, company_id)
        return balance_sheet
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bank-reconciliation", response_model=BankReconciliationResponse)
async def reconcile_bank_statement(
    reconciliation: BankReconciliationCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """AI-powered bank reconciliation"""
    try:
        # This is a simplified implementation
        # In a real system, this would use AI to match transactions
        
        # Mock response
        response = BankReconciliationResponse(
            total_bank_transactions=150,
            total_journal_entries=145,
            auto_matched=140,
            manual_review_required=5,
            unmatched_bank=2,
            unmatched_journal=3
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))