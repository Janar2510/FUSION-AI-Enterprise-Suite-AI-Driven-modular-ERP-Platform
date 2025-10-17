"""
Comprehensive tests for the Contact Hub module
"""

import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .models import Contact, Company, AppProfile, Activity, Relationship
from .schemas import ContactCreate, ContactUpdate, CompanyCreate, CompanyUpdate
from .service import ContactHubService

@pytest.fixture
def mock_db_session():
    """Create a mock database session"""
    return AsyncMock(spec=AsyncSession)

@pytest.fixture
def sample_contact_data():
    """Sample contact data for testing"""
    return ContactCreate(
        type="person",
        email="test@example.com",
        first_name="John",
        last_name="Doe",
        full_name="John Doe",
        company_name="Test Corp"
    )

@pytest.fixture
def sample_company_data():
    """Sample company data for testing"""
    return CompanyCreate(
        name="Test Corp",
        domain="testcorp.com",
        industry="Technology"
    )

@pytest.mark.asyncio
async def test_create_contact(mock_db_session, sample_contact_data):
    """Test creating a new contact"""
    service = ContactHubService(mock_db_session)
    user_id = uuid4()
    
    # Mock the database operations
    mock_contact = Contact(
        id=uuid4(),
        type="person",
        email="test@example.com",
        first_name="John",
        last_name="Doe",
        full_name="John Doe",
        company_name="Test Corp",
        created_by=user_id,
        updated_by=user_id
    )
    
    mock_db_session.add = AsyncMock()
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock()
    
    # Execute the method
    result = await service.create_contact(sample_contact_data, user_id)
    
    # Verify the result
    assert result.email == sample_contact_data.email
    assert result.first_name == sample_contact_data.first_name
    assert result.last_name == sample_contact_data.last_name
    assert result.full_name == sample_contact_data.full_name
    assert result.company_name == sample_contact_data.company_name
    assert result.created_by == user_id
    assert result.updated_by == user_id
    
    # Verify database operations were called
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_update_contact(mock_db_session, sample_contact_data):
    """Test updating an existing contact"""
    service = ContactHubService(mock_db_session)
    contact_id = uuid4()
    user_id = uuid4()
    
    # Mock the existing contact
    existing_contact = Contact(
        id=contact_id,
        type="person",
        email="old@example.com",
        first_name="John",
        last_name="Doe",
        full_name="John Doe",
        company_name="Old Corp"
    )
    
    # Mock the updated data
    update_data = ContactUpdate(
        email="new@example.com",
        first_name="Jane",
        company_name="New Corp"
    )
    
    # Mock database operations
    mock_db_session.get = AsyncMock(return_value=existing_contact)
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock()
    
    # Execute the method
    result = await service.update_contact(contact_id, update_data, user_id)
    
    # Verify the result
    assert result.email == "new@example.com"
    assert result.first_name == "Jane"
    assert result.company_name == "New Corp"
    assert result.updated_by == user_id
    
    # Verify database operations were called
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_create_company(mock_db_session, sample_company_data):
    """Test creating a new company"""
    service = ContactHubService(mock_db_session)
    user_id = uuid4()
    
    # Mock database operations
    mock_db_session.add = AsyncMock()
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock()
    
    # Execute the method
    result = await service.create_company(sample_company_data, user_id)
    
    # Verify the result
    assert result.name == sample_company_data.name
    assert result.domain == sample_company_data.domain
    assert result.industry == sample_company_data.industry
    assert result.created_by == user_id
    assert result.updated_by == user_id
    
    # Verify database operations were called
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_search_contacts(mock_db_session):
    """Test searching contacts"""
    service = ContactHubService(mock_db_session)
    
    # Mock search results
    mock_contacts = [
        Contact(
            id=uuid4(),
            type="person",
            email="test1@example.com",
            first_name="John",
            last_name="Doe",
            full_name="John Doe"
        ),
        Contact(
            id=uuid4(),
            type="person",
            email="test2@example.com",
            first_name="Jane",
            last_name="Smith",
            full_name="Jane Smith"
        )
    ]
    
    # Mock database operations
    mock_result = AsyncMock()
    mock_result.scalars().all.return_value = mock_contacts
    mock_db_session.execute = AsyncMock(return_value=mock_result)
    
    # Execute the method
    results = await service.search_contacts("test", 10)
    
    # Verify the results
    assert len(results) == 2
    assert results[0].email == "test1@example.com"
    assert results[1].email == "test2@example.com"

@pytest.mark.asyncio
async def test_get_cross_module_insights(mock_db_session):
    """Test getting cross-module insights"""
    service = ContactHubService(mock_db_session)
    contact_id = uuid4()
    
    # Mock timeline activities
    mock_activities = [
        Activity(
            id=uuid4(),
            contact_id=contact_id,
            app_name="crm",
            activity_type="email_sent",
            title="Welcome Email",
            created_at=datetime.utcnow()
        ),
        Activity(
            id=uuid4(),
            contact_id=contact_id,
            app_name="sales",
            activity_type="proposal_viewed",
            title="Product Proposal",
            created_at=datetime.utcnow()
        )
    ]
    
    # Mock database operations
    mock_result = AsyncMock()
    mock_result.scalars().all.return_value = mock_activities
    mock_db_session.execute = AsyncMock(return_value=mock_result)
    
    # Execute the method
    insights = await service.get_cross_module_insights(contact_id)
    
    # Verify the results
    assert insights['total_interactions'] == 2
    assert 'crm' in insights['modules_used']
    assert 'sales' in insights['modules_used']
    assert insights['last_activity'] is not None

if __name__ == "__main__":
    pytest.main([__file__])