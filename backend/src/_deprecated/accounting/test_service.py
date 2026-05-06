"""
Tests for Accounting Service
"""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from .models import ChartOfAccount, FiscalYear, JournalEntry, JournalEntryLine
from .schemas import ChartOfAccountCreate, ChartOfAccountUpdate, JournalEntryCreate, JournalEntryLineCreate
from .service import AccountingService

@pytest.fixture
def mock_db_session():
    """Create a mock database session"""
    return AsyncMock(spec=AsyncSession)

@pytest.fixture
def sample_chart_of_account_data():
    """Sample chart of account data for testing"""
    return ChartOfAccountCreate(
        code="1000",
        name="Cash",
        type="asset",
        company_id=1,
        currency_id=1
    )

@pytest.fixture
def sample_journal_entry_data():
    """Sample journal entry data for testing"""
    return JournalEntryCreate(
        date=date.today(),
        reference="Test entry",
        company_id=1,
        lines=[
            JournalEntryLineCreate(
                account_id=1,
                debit=Decimal("100.00"),
                credit=Decimal("0.00"),
                description="Test debit"
            ),
            JournalEntryLineCreate(
                account_id=2,
                debit=Decimal("0.00"),
                credit=Decimal("100.00"),
                description="Test credit"
            )
        ]
    )

@pytest.mark.asyncio
async def test_create_chart_of_account(mock_db_session, sample_chart_of_account_data):
    """Test creating a new chart of account"""
    service = AccountingService(mock_db_session)
    
    # Mock the database operations
    mock_account = ChartOfAccount(
        id=1,
        code="1000",
        name="Cash",
        type="asset",
        company_id=1,
        currency_id=1
    )
    
    mock_db_session.add = AsyncMock()
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock()
    
    # Execute the method
    result = await service.create_chart_of_account(sample_chart_of_account_data)
    
    # Verify the result
    assert result.code == sample_chart_of_account_data.code
    assert result.name == sample_chart_of_account_data.name
    assert result.type == sample_chart_of_account_data.type
    assert result.company_id == sample_chart_of_account_data.company_id
    assert result.currency_id == sample_chart_of_account_data.currency_id
    
    # Verify database operations were called
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_get_chart_of_account(mock_db_session):
    """Test getting a chart of account by ID"""
    service = AccountingService(mock_db_session)
    account_id = 1
    
    # Mock the database operations
    mock_account = ChartOfAccount(
        id=1,
        code="1000",
        name="Cash",
        type="asset",
        company_id=1,
        currency_id=1
    )
    
    mock_result = AsyncMock()
    mock_result.scalar_one_or_none.return_value = mock_account
    mock_db_session.execute = AsyncMock(return_value=mock_result)
    
    # Execute the method
    result = await service.get_chart_of_account(account_id)
    
    # Verify the result
    assert result.id == account_id
    assert result.code == "1000"
    assert result.name == "Cash"

@pytest.mark.asyncio
async def test_update_chart_of_account(mock_db_session):
    """Test updating an existing chart of account"""
    service = AccountingService(mock_db_session)
    account_id = 1
    
    # Mock the existing account
    existing_account = ChartOfAccount(
        id=1,
        code="1000",
        name="Cash",
        type="asset",
        company_id=1,
        currency_id=1
    )
    
    # Mock the updated data
    update_data = ChartOfAccountUpdate(
        name="Updated Cash Account",
        active=False
    )
    
    # Mock database operations
    mock_result = AsyncMock()
    mock_result.scalar_one_or_none.return_value = existing_account
    mock_db_session.execute = AsyncMock(return_value=mock_result)
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock()
    
    # Execute the method
    result = await service.update_chart_of_account(account_id, update_data)
    
    # Verify the result
    assert result.name == "Updated Cash Account"
    assert result.active == False

@pytest.mark.asyncio
async def test_create_journal_entry(mock_db_session, sample_journal_entry_data):
    """Test creating a new journal entry"""
    service = AccountingService(mock_db_session)
    user_id = 1
    
    # Mock the database operations
    mock_entry = JournalEntry(
        id=1,
        entry_number="JE-1-000001",
        date=date.today(),
        reference="Test entry",
        company_id=1,
        created_by=user_id
    )
    
    mock_db_session.add = AsyncMock()
    mock_db_session.flush = AsyncMock()
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock()
    
    # Mock fiscal year validation
    with patch.object(service, 'validate_fiscal_year', return_value=AsyncMock()) as mock_validate:
        mock_validate.return_value = None
        
        # Mock entry number generation
        with patch.object(service, 'generate_entry_number', return_value="JE-1-000001"):
            # Execute the method
            result = await service.create_journal_entry(sample_journal_entry_data, user_id)
            
            # Verify the result
            assert result.entry_number == "JE-1-000001"
            assert result.date == sample_journal_entry_data.date
            assert result.reference == sample_journal_entry_data.reference
            assert result.company_id == sample_journal_entry_data.company_id
            assert result.created_by == user_id
            
            # Verify database operations were called
            assert mock_db_session.add.call_count >= 1  # At least the entry itself
            mock_db_session.flush.assert_called_once()
            mock_db_session.commit.assert_called_once()
            mock_db_session.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_validate_fiscal_year(mock_db_session):
    """Test validating fiscal year"""
    service = AccountingService(mock_db_session)
    entry_date = date.today()
    company_id = 1
    
    # Mock the database operations
    mock_fiscal_year = FiscalYear(
        id=1,
        name="2024",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31),
        company_id=1,
        state="open"
    )
    
    mock_result = AsyncMock()
    mock_result.scalar_one_or_none.return_value = mock_fiscal_year
    mock_db_session.execute = AsyncMock(return_value=mock_result)
    
    # Execute the method
    result = await service.validate_fiscal_year(entry_date, company_id)
    
    # Verify the result
    assert result.id == 1
    assert result.company_id == company_id
    assert result.state == "open"

@pytest.mark.asyncio
async def test_get_balance_sheet(mock_db_session):
    """Test generating balance sheet"""
    service = AccountingService(mock_db_session)
    as_of_date = date.today()
    company_id = 1
    
    # Mock the database operations
    mock_accounts = [
        ChartOfAccount(id=1, code="1000", name="Cash", type="asset", company_id=1, active=True),
        ChartOfAccount(id=2, code="2000", name="Accounts Payable", type="liability", company_id=1, active=True),
        ChartOfAccount(id=3, code="3000", name="Retained Earnings", type="equity", company_id=1, active=True)
    ]
    
    mock_result = AsyncMock()
    mock_result.scalars().all.return_value = mock_accounts
    mock_db_session.execute = AsyncMock(return_value=mock_result)
    
    # Execute the method
    result = await service.get_balance_sheet(as_of_date, company_id)
    
    # Verify the result
    assert result["as_of_date"] == as_of_date
    assert result["company_id"] == company_id
    assert "assets" in result
    assert "liabilities" in result
    assert "equity" in result
    assert "total_assets" in result
    assert "total_liabilities" in result
    assert "total_equity" in result

if __name__ == "__main__":
    pytest.main([__file__])