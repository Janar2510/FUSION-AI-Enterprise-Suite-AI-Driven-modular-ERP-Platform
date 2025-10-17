"""
API endpoint tests for FusionAI Enterprise Suite
"""

import pytest
from fastapi.testclient import TestClient


class TestAuthEndpoints:
    """Test authentication endpoints."""
    
    def test_login_success(self, client: TestClient):
        """Test successful login."""
        response = client.post("/api/v1/auth/login", json={
            "email": "admin@fusionai.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == "admin@fusionai.com"
    
    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials."""
        response = client.post("/api/v1/auth/login", json={
            "email": "invalid@fusionai.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_register_success(self, client: TestClient):
        """Test successful registration."""
        response = client.post("/api/v1/auth/register", json={
            "name": "Test User",
            "email": "test@fusionai.com",
            "password": "testpassword",
            "confirm_password": "testpassword"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == "test@fusionai.com"
    
    def test_register_password_mismatch(self, client: TestClient):
        """Test registration with password mismatch."""
        response = client.post("/api/v1/auth/register", json={
            "name": "Test User",
            "email": "test@fusionai.com",
            "password": "testpassword",
            "confirm_password": "differentpassword"
        })
        assert response.status_code == 400
        assert "Passwords do not match" in response.json()["detail"]
    
    def test_get_current_user(self, client: TestClient):
        """Test getting current user."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data
        assert "role" in data


class TestModuleEndpoints:
    """Test module endpoints."""
    
    def test_get_modules(self, client: TestClient):
        """Test getting all modules."""
        response = client.get("/api/v1/modules/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "name" in data[0]
        assert "display_name" in data[0]
    
    def test_get_specific_module(self, client: TestClient):
        """Test getting a specific module."""
        response = client.get("/api/v1/modules/crm")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "crm"
        assert data["display_name"] == "CRM"
    
    def test_get_nonexistent_module(self, client: TestClient):
        """Test getting a non-existent module."""
        response = client.get("/api/v1/modules/nonexistent")
        assert response.status_code == 404
        assert "Module not found" in response.json()["detail"]
    
    def test_get_module_data(self, client: TestClient):
        """Test getting module data."""
        response = client.get("/api/v1/modules/crm/data")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_module_data(self, client: TestClient):
        """Test creating module data."""
        response = client.post("/api/v1/modules/crm/data", json={
            "name": "Test Customer",
            "email": "test@example.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "data" in data


class TestAIEndpoints:
    """Test AI endpoints."""
    
    def test_ai_chat(self, client: TestClient):
        """Test AI chat endpoint."""
        response = client.post("/api/v1/ai/chat", json={
            "message": "Hello, AI!",
            "context": {"user_id": "test-user"}
        })
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "agent" in data
        assert "status" in data
    
    def test_get_agents(self, client: TestClient):
        """Test getting AI agents."""
        response = client.get("/api/v1/ai/agents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_agent_status(self, client: TestClient):
        """Test getting agent status."""
        response = client.get("/api/v1/ai/agents/status")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
    
    def test_get_agent_capabilities(self, client: TestClient):
        """Test getting agent capabilities."""
        response = client.get("/api/v1/ai/agents/capabilities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)


class TestDashboardEndpoints:
    """Test dashboard endpoints."""
    
    def test_get_dashboard_stats(self, client: TestClient):
        """Test getting dashboard statistics."""
        response = client.get("/api/v1/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "title" in data[0]
        assert "value" in data[0]
    
    def test_get_recent_activity(self, client: TestClient):
        """Test getting recent activity."""
        response = client.get("/api/v1/dashboard/activity")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_notifications(self, client: TestClient):
        """Test getting notifications."""
        response = client.get("/api/v1/dashboard/notifications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestHealthEndpoints:
    """Test health and system endpoints."""
    
    def test_health_check(self, client: TestClient):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
    
    def test_root_endpoint(self, client: TestClient):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data




