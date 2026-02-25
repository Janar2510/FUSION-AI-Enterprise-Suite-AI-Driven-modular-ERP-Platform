"""
Test cases for the Invoicing API
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from decimal import Decimal

from ..main import app
from .schemas import CustomerCreate, ProductCreate, InvoiceCreate, InvoiceLineCreate

client = TestClient(app)

def test_create_customer():
    """Test creating a customer"""
    customer_data = {
        "name": "Test Customer",
        "email": "test@example.com",
        "phone": "123-456-7890",
        "billing_address": "123 Main St",
        "shipping_address": "123 Main St",
        "status": "active"
    }
    
    response = client.post("/api/v1/invoicing/customers", json=customer_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Customer"
    assert data["email"] == "test@example.com"

def test_create_product():
    """Test creating a product"""
    product_data = {
        "name": "Test Product",
        "description": "A test product",
        "sku": "TEST-001",
        "unit_price": 100.00,
        "cost": 50.00,
        "category": "Test Category",
        "inventory_item": True,
        "active": True
    }
    
    response = client.post("/api/v1/invoicing/products", json=product_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Product"
    assert data["sku"] == "TEST-001"

def test_create_invoice():
    """Test creating an invoice"""
    # First create a customer and product
    customer_data = {
        "name": "Test Customer",
        "email": "test@example.com",
        "phone": "123-456-7890",
        "billing_address": "123 Main St",
        "shipping_address": "123 Main St",
        "status": "active"
    }
    
    customer_response = client.post("/api/v1/invoicing/customers", json=customer_data)
    assert customer_response.status_code == 200
    customer_id = customer_response.json()["id"]
    
    product_data = {
        "name": "Test Product",
        "description": "A test product",
        "sku": "TEST-001",
        "unit_price": 100.00,
        "cost": 50.00,
        "category": "Test Category",
        "inventory_item": True,
        "active": True
    }
    
    product_response = client.post("/api/v1/invoicing/products", json=product_data)
    assert product_response.status_code == 200
    product_id = product_response.json()["id"]
    
    # Now create an invoice
    invoice_data = {
        "customer_id": customer_id,
        "invoice_date": "2024-01-01",
        "due_date": "2024-01-31",
        "lines": [
            {
                "product_id": product_id,
                "description": "Test Product",
                "quantity": 2,
                "unit_price": 100.00
            }
        ]
    }
    
    response = client.post("/api/v1/invoicing/invoices", json=invoice_data)
    assert response.status_code == 200
    data = response.json()
    assert data["customer_id"] == customer_id
    assert data["status"] == "draft"
    assert len(data["lines"]) == 1
    assert data["lines"][0]["product_id"] == product_id

def test_list_customers():
    """Test listing customers"""
    response = client.get("/api/v1/invoicing/customers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_list_products():
    """Test listing products"""
    response = client.get("/api/v1/invoicing/products")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_list_invoices():
    """Test listing invoices"""
    response = client.get("/api/v1/invoicing/invoices")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)