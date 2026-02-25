"""
Accounting Service for FusionAI Enterprise Suite
Business logic for accounting and financial operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal
import logging

from .models import (
    ChartOfAccount, FiscalYear, JournalEntry, JournalEntryLine, 
    Tax, BankStatement, PaymentTerm
)
from .schemas import (
    ChartOfAccountCreate, ChartOfAccountUpdate,
    FiscalYearCreate, FiscalYearUpdate,
    JournalEntryCreate, JournalEntryUpdate,
    TaxCreate, TaxUpdate,
    BankStatementCreate, BankStatementUpdate,
    PaymentTermCreate, PaymentTermUpdate
)

logger = logging.getLogger(__name__)

class AccountingService:
    """Service layer for accounting operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # Chart of Accounts methods
    async def create_chart_of_account(self, account_data: ChartOfAccountCreate) -> ChartOfAccount:
        """Create a new chart of account"""
        try:
            account = ChartOfAccount(**account_data.dict())
            self.db.add(account)
            await self.db.commit()
            await self.db.refresh(account)
            
            logger.info(f"Created new chart of account: {account.code}")
            return account
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating chart of account: {e}")
            raise
    
    async def get_chart_of_account(self, account_id: int) -> Optional[ChartOfAccount]:
        """Get a chart of account by ID"""
        try:
            stmt = select(ChartOfAccount).where(ChartOfAccount.id == account_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting chart of account {account_id}: {e}")
            raise
    
    async def update_chart_of_account(self, account_id: int, account_data: ChartOfAccountUpdate) -> ChartOfAccount:
        """Update an existing chart of account"""
        try:
            account = await self.get_chart_of_account(account_id)
            if not account:
                raise ValueError(f"Chart of account {account_id} not found")
            
            # Update fields
            update_data = account_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(account, field, value)
            
            await self.db.commit()
            await self.db.refresh(account)
            
            logger.info(f"Updated chart of account: {account_id}")
            return account
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating chart of account {account_id}: {e}")
            raise
    
    async def delete_chart_of_account(self, account_id: int) -> bool:
        """Delete a chart of account"""
        try:
            account = await self.get_chart_of_account(account_id)
            if not account:
                return False
            
            await self.db.delete(account)
            await self.db.commit()
            
            logger.info(f"Deleted chart of account: {account_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting chart of account {account_id}: {e}")
            raise
    
    async def list_chart_of_accounts(self, skip: int = 0, limit: int = 100) -> List[ChartOfAccount]:
        """List chart of accounts with pagination"""
        try:
            stmt = select(ChartOfAccount).offset(skip).limit(limit)
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error listing chart of accounts: {e}")
            raise
    
    # Fiscal Year methods
    async def create_fiscal_year(self, fiscal_year_data: FiscalYearCreate) -> FiscalYear:
        """Create a new fiscal year"""
        try:
            fiscal_year = FiscalYear(**fiscal_year_data.dict())
            self.db.add(fiscal_year)
            await self.db.commit()
            await self.db.refresh(fiscal_year)
            
            logger.info(f"Created new fiscal year: {fiscal_year.id}")
            return fiscal_year
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating fiscal year: {e}")
            raise
    
    async def get_fiscal_year(self, fiscal_year_id: int) -> Optional[FiscalYear]:
        """Get a fiscal year by ID"""
        try:
            stmt = select(FiscalYear).where(FiscalYear.id == fiscal_year_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting fiscal year {fiscal_year_id}: {e}")
            raise
    
    async def update_fiscal_year(self, fiscal_year_id: int, fiscal_year_data: FiscalYearUpdate) -> FiscalYear:
        """Update an existing fiscal year"""
        try:
            fiscal_year = await self.get_fiscal_year(fiscal_year_id)
            if not fiscal_year:
                raise ValueError(f"Fiscal year {fiscal_year_id} not found")
            
            # Update fields
            update_data = fiscal_year_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(fiscal_year, field, value)
            
            await self.db.commit()
            await self.db.refresh(fiscal_year)
            
            logger.info(f"Updated fiscal year: {fiscal_year_id}")
            return fiscal_year
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating fiscal year {fiscal_year_id}: {e}")
            raise
    
    async def delete_fiscal_year(self, fiscal_year_id: int) -> bool:
        """Delete a fiscal year"""
        try:
            fiscal_year = await self.get_fiscal_year(fiscal_year_id)
            if not fiscal_year:
                return False
            
            await self.db.delete(fiscal_year)
            await self.db.commit()
            
            logger.info(f"Deleted fiscal year: {fiscal_year_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting fiscal year {fiscal_year_id}: {e}")
            raise
    
    # Journal Entry methods
    async def create_journal_entry(self, entry_data: JournalEntryCreate, user_id: int) -> JournalEntry:
        """Create a new journal entry with validation"""
        try:
            # Validate double-entry bookkeeping
            total_debit = sum(line.debit for line in entry_data.lines)
            total_credit = sum(line.credit for line in entry_data.lines)
            
            if total_debit != total_credit:
                raise ValueError("Journal entry must balance (debits = credits)")
            
            # Validate fiscal year
            fiscal_year = await self.validate_fiscal_year(entry_data.date, entry_data.company_id)
            if not fiscal_year or fiscal_year.state == 'closed':
                raise ValueError("Cannot post to closed fiscal year")
            
            # Generate entry number
            entry_number = await self.generate_entry_number(entry_data.company_id, fiscal_year.id if fiscal_year else None)
            
            # Create journal entry
            entry_dict = entry_data.dict(exclude={'lines'})
            entry_dict['entry_number'] = entry_number
            entry_dict['created_by'] = user_id
            entry_dict['fiscal_year_id'] = fiscal_year.id if fiscal_year else None
            
            entry = JournalEntry(**entry_dict)
            self.db.add(entry)
            await self.db.flush()
            
            # Create journal lines
            for line_data in entry_data.lines:
                line_dict = line_data.dict()
                line_dict['journal_entry_id'] = entry.id
                line = JournalEntryLine(**line_dict)
                self.db.add(line)
            
            await self.db.commit()
            await self.db.refresh(entry)
            
            # Load lines
            await self.db.refresh(entry, ["lines"])
            
            logger.info(f"Created new journal entry: {entry.entry_number}")
            return entry
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating journal entry: {e}")
            raise
    
    async def validate_fiscal_year(self, entry_date: date, company_id: int) -> Optional[FiscalYear]:
        """Validate and get fiscal year for an entry date"""
        try:
            stmt = select(FiscalYear).where(
                and_(
                    FiscalYear.company_id == company_id,
                    FiscalYear.start_date <= entry_date,
                    FiscalYear.end_date >= entry_date,
                    FiscalYear.state == 'open'
                )
            )
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error validating fiscal year: {e}")
            return None
    
    async def generate_entry_number(self, company_id: int, fiscal_year_id: Optional[int]) -> str:
        """Generate unique entry number"""
        try:
            # Simple implementation - in production this would be more sophisticated
            stmt = select(func.count(JournalEntry.id)).where(JournalEntry.company_id == company_id)
            result = await self.db.execute(stmt)
            count = result.scalar_one() + 1
            
            year_suffix = f"-{fiscal_year_id}" if fiscal_year_id else ""
            return f"JE-{company_id}-{count:06d}{year_suffix}"
        except Exception as e:
            logger.error(f"Error generating entry number: {e}")
            # Fallback
            return f"JE-{company_id}-{int(datetime.now().timestamp())}"
    
    async def get_journal_entry(self, entry_id: int) -> Optional[JournalEntry]:
        """Get a journal entry by ID with lines"""
        try:
            stmt = select(JournalEntry).where(JournalEntry.id == entry_id)
            result = await self.db.execute(stmt)
            entry = result.scalar_one_or_none()
            
            if entry:
                # Load lines
                await self.db.refresh(entry, ["lines"])
            
            return entry
        except Exception as e:
            logger.error(f"Error getting journal entry {entry_id}: {e}")
            raise
    
    async def update_journal_entry(self, entry_id: int, entry_data: JournalEntryUpdate, user_id: int) -> JournalEntry:
        """Update an existing journal entry"""
        try:
            entry = await self.get_journal_entry(entry_id)
            if not entry:
                raise ValueError(f"Journal entry {entry_id} not found")
            
            if entry.state != 'draft':
                raise ValueError("Only draft entries can be updated")
            
            # Update fields
            update_data = entry_data.dict(exclude_unset=True, exclude={'lines'})
            for field, value in update_data.items():
                setattr(entry, field, value)
            
            # Update lines if provided
            if entry_data.lines is not None:
                # Validate double-entry bookkeeping
                total_debit = sum(line.debit or Decimal('0.00') for line in entry_data.lines)
                total_credit = sum(line.credit or Decimal('0.00') for line in entry_data.lines)
                
                if total_debit != total_credit:
                    raise ValueError("Journal entry must balance (debits = credits)")
                
                # Delete existing lines
                for line in entry.lines:
                    await self.db.delete(line)
                
                # Create new lines
                for line_data in entry_data.lines:
                    line_dict = line_data.dict(exclude_unset=True)
                    line_dict['journal_entry_id'] = entry.id
                    line = JournalEntryLine(**line_dict)
                    self.db.add(line)
                
                # Refresh lines
                await self.db.flush()
                await self.db.refresh(entry, ["lines"])
            
            await self.db.commit()
            await self.db.refresh(entry)
            
            logger.info(f"Updated journal entry: {entry_id}")
            return entry
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating journal entry {entry_id}: {e}")
            raise
    
    async def delete_journal_entry(self, entry_id: int) -> bool:
        """Delete a journal entry"""
        try:
            entry = await self.get_journal_entry(entry_id)
            if not entry:
                return False
            
            if entry.state != 'draft':
                raise ValueError("Only draft entries can be deleted")
            
            await self.db.delete(entry)
            await self.db.commit()
            
            logger.info(f"Deleted journal entry: {entry_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting journal entry {entry_id}: {e}")
            raise
    
    async def post_journal_entry(self, entry_id: int, user_id: int) -> JournalEntry:
        """Post a journal entry to the general ledger"""
        try:
            entry = await self.get_journal_entry(entry_id)
            if not entry:
                raise ValueError(f"Journal entry {entry_id} not found")
            
            if entry.state != 'draft':
                raise ValueError("Only draft entries can be posted")
            
            # Validate permissions (simplified)
            # In a real implementation, this would check actual permissions
            
            # Update account balances (simplified)
            await self.update_account_balances(entry)
            
            # Mark as posted
            entry.state = 'posted'
            entry.posted_by = user_id
            entry.posted_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(entry)
            
            logger.info(f"Posted journal entry: {entry_id}")
            return entry
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error posting journal entry {entry_id}: {e}")
            raise
    
    async def update_account_balances(self, entry: JournalEntry) -> None:
        """Update account balances based on journal entry (simplified)"""
        # In a real implementation, this would update actual account balances
        # For now, we'll just log the operation
        logger.info(f"Updating account balances for entry {entry.id}")
        for line in entry.lines:
            logger.info(f"  Account {line.account_id}: Debit {line.debit}, Credit {line.credit}")
    
    async def list_journal_entries(self, skip: int = 0, limit: int = 100, state: Optional[str] = None) -> List[JournalEntry]:
        """List journal entries with pagination and optional state filter"""
        try:
            stmt = select(JournalEntry)
            if state:
                stmt = stmt.where(JournalEntry.state == state)
            stmt = stmt.offset(skip).limit(limit).order_by(JournalEntry.entry_date.desc())
            
            result = await self.db.execute(stmt)
            entries = result.scalars().all()
            
            # Load lines for each entry
            for entry in entries:
                await self.db.refresh(entry, ["lines"])
            
            return entries
        except Exception as e:
            logger.error(f"Error listing journal entries: {e}")
            raise
    
    # Tax methods
    async def create_tax(self, tax_data: TaxCreate) -> Tax:
        """Create a new tax"""
        try:
            tax = Tax(**tax_data.dict())
            self.db.add(tax)
            await self.db.commit()
            await self.db.refresh(tax)
            
            logger.info(f"Created new tax: {tax.id}")
            return tax
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating tax: {e}")
            raise
    
    async def get_tax(self, tax_id: int) -> Optional[Tax]:
        """Get a tax by ID"""
        try:
            stmt = select(Tax).where(Tax.id == tax_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting tax {tax_id}: {e}")
            raise
    
    async def update_tax(self, tax_id: int, tax_data: TaxUpdate) -> Tax:
        """Update an existing tax"""
        try:
            tax = await self.get_tax(tax_id)
            if not tax:
                raise ValueError(f"Tax {tax_id} not found")
            
            # Update fields
            update_data = tax_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(tax, field, value)
            
            await self.db.commit()
            await self.db.refresh(tax)
            
            logger.info(f"Updated tax: {tax_id}")
            return tax
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating tax {tax_id}: {e}")
            raise
    
    async def delete_tax(self, tax_id: int) -> bool:
        """Delete a tax"""
        try:
            tax = await self.get_tax(tax_id)
            if not tax:
                return False
            
            await self.db.delete(tax)
            await self.db.commit()
            
            logger.info(f"Deleted tax: {tax_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting tax {tax_id}: {e}")
            raise
    
    # Bank Statement methods
    async def create_bank_statement(self, statement_data: BankStatementCreate) -> BankStatement:
        """Create a new bank statement"""
        try:
            statement = BankStatement(**statement_data.dict())
            self.db.add(statement)
            await self.db.commit()
            await self.db.refresh(statement)
            
            logger.info(f"Created new bank statement: {statement.id}")
            return statement
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating bank statement: {e}")
            raise
    
    async def get_bank_statement(self, statement_id: int) -> Optional[BankStatement]:
        """Get a bank statement by ID"""
        try:
            stmt = select(BankStatement).where(BankStatement.id == statement_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting bank statement {statement_id}: {e}")
            raise
    
    async def update_bank_statement(self, statement_id: int, statement_data: BankStatementUpdate) -> BankStatement:
        """Update an existing bank statement"""
        try:
            statement = await self.get_bank_statement(statement_id)
            if not statement:
                raise ValueError(f"Bank statement {statement_id} not found")
            
            # Update fields
            update_data = statement_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(statement, field, value)
            
            await self.db.commit()
            await self.db.refresh(statement)
            
            logger.info(f"Updated bank statement: {statement_id}")
            return statement
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating bank statement {statement_id}: {e}")
            raise
    
    async def delete_bank_statement(self, statement_id: int) -> bool:
        """Delete a bank statement"""
        try:
            statement = await self.get_bank_statement(statement_id)
            if not statement:
                return False
            
            await self.db.delete(statement)
            await self.db.commit()
            
            logger.info(f"Deleted bank statement: {statement_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting bank statement {statement_id}: {e}")
            raise
    
    # Payment Term methods
    async def create_payment_term(self, term_data: PaymentTermCreate) -> PaymentTerm:
        """Create a new payment term"""
        try:
            term = PaymentTerm(**term_data.dict())
            self.db.add(term)
            await self.db.commit()
            await self.db.refresh(term)
            
            logger.info(f"Created new payment term: {term.id}")
            return term
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating payment term: {e}")
            raise
    
    async def get_payment_term(self, term_id: int) -> Optional[PaymentTerm]:
        """Get a payment term by ID"""
        try:
            stmt = select(PaymentTerm).where(PaymentTerm.id == term_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting payment term {term_id}: {e}")
            raise
    
    async def update_payment_term(self, term_id: int, term_data: PaymentTermUpdate) -> PaymentTerm:
        """Update an existing payment term"""
        try:
            term = await self.get_payment_term(term_id)
            if not term:
                raise ValueError(f"Payment term {term_id} not found")
            
            # Update fields
            update_data = term_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(term, field, value)
            
            await self.db.commit()
            await self.db.refresh(term)
            
            logger.info(f"Updated payment term: {term_id}")
            return term
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating payment term {term_id}: {e}")
            raise
    
    async def delete_payment_term(self, term_id: int) -> bool:
        """Delete a payment term"""
        try:
            term = await self.get_payment_term(term_id)
            if not term:
                return False
            
            await self.db.delete(term)
            await self.db.commit()
            
            logger.info(f"Deleted payment term: {term_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting payment term {term_id}: {e}")
            raise
    
    # Financial reporting methods
    async def get_balance_sheet(self, as_of_date: date, company_id: int) -> Dict[str, Any]:
        """Generate real-time balance sheet"""
        try:
            # Get all accounts with balances (simplified)
            assets = await self.get_account_balances('asset', company_id, as_of_date)
            liabilities = await self.get_account_balances('liability', company_id, as_of_date)
            equity = await self.get_account_balances('equity', company_id, as_of_date)
            
            # Calculate totals
            total_assets = sum(a.get('balance', Decimal('0.00')) for a in assets)
            total_liabilities = sum(l.get('balance', Decimal('0.00')) for l in liabilities)
            total_equity = sum(e.get('balance', Decimal('0.00')) for e in equity)
            
            # Validate accounting equation
            if abs(total_assets - (total_liabilities + total_equity)) > Decimal('0.01'):
                logger.warning("Balance sheet doesn't balance!")
            
            return {
                "as_of_date": as_of_date,
                "company_id": company_id,
                "assets": assets,
                "liabilities": liabilities,
                "equity": equity,
                "total_assets": total_assets,
                "total_liabilities": total_liabilities,
                "total_equity": total_equity
            }
            
        except Exception as e:
            logger.error(f"Error generating balance sheet: {e}")
            raise
    
    async def get_account_balances(self, account_type: str, company_id: int, as_of_date: date) -> List[Dict[str, Any]]:
        """Get account balances for a specific type (simplified)"""
        try:
            # This is a simplified implementation
            # In a real system, this would calculate actual balances from journal entries
            stmt = select(ChartOfAccount).where(
                and_(
                    ChartOfAccount.type == account_type,
                    ChartOfAccount.company_id == company_id,
                    ChartOfAccount.active == True
                )
            )
            result = await self.db.execute(stmt)
            accounts = result.scalars().all()
            
            # Return mock balances for now
            balances = []
            for account in accounts:
                balances.append({
                    "id": account.id,
                    "code": account.code,
                    "name": account.name,
                    "balance": Decimal('0.00')  # In a real implementation, this would be calculated
                })
            
            return balances
            
        except Exception as e:
            logger.error(f"Error getting account balances: {e}")
            return []