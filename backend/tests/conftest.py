"""
Pytest configuration and fixtures for FusionAI Enterprise Suite
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.core.database import get_async_session, Base
from src.core.redis import get_redis
from src.core.qdrant import get_qdrant_client
from src.agents.orchestrator import AgentOrchestrator


# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session) -> TestClient:
    """Create a test client."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_async_session] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def mock_redis():
    """Mock Redis client for testing."""
    # TODO: Implement Redis mock
    pass


@pytest.fixture
async def mock_qdrant():
    """Mock Qdrant client for testing."""
    # TODO: Implement Qdrant mock
    pass


@pytest.fixture
async def mock_orchestrator():
    """Mock AI agent orchestrator for testing."""
    # TODO: Implement orchestrator mock
    pass


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": "test-user-1",
        "email": "test@fusionai.com",
        "name": "Test User",
        "role": "user",
        "permissions": ["read", "write"]
    }


@pytest.fixture
def sample_module_data():
    """Sample module data for testing."""
    return {
        "name": "test-module",
        "display_name": "Test Module",
        "description": "A test module",
        "version": "1.0.0",
        "status": "active",
        "icon": "TestIcon",
        "color": "from-blue-500 to-cyan-500",
        "capabilities": ["test", "demo"]
    }


@pytest.fixture
def sample_ai_request():
    """Sample AI request for testing."""
    return {
        "message": "Test AI request",
        "context": {"user_id": "test-user-1"},
        "user_id": "test-user-1"
    }


@pytest.fixture
def sample_ai_response():
    """Sample AI response for testing."""
    return {
        "response": "Test AI response",
        "agent": "TestAgent",
        "status": "success",
        "timestamp": "2024-01-15T12:00:00Z",
        "actions_executed": 0
    }




