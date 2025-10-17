"""
FusionAI Enterprise Suite - Main FastAPI Application
Complete backend solution with all modules and mock endpoints
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime

# Import CRM module
try:
    from src.modules.crm.api import router as crm_router
except ImportError:
    crm_router = None

# Import Contact Hub module
try:
    from src.modules.contact_hub.api import router as contact_hub_router
except ImportError:
    contact_hub_router = None

# Import Contact Hub integration module
try:
    from src.modules.contact_hub.integration_api import router as contact_hub_integration_router
except ImportError:
    contact_hub_integration_router = None

# Import Contact Hub AI module
try:
    from src.modules.contact_hub.ai_api import router as contact_hub_ai_router
except ImportError:
    contact_hub_ai_router = None

# Import Accounting module
try:
    from src.modules.accounting.api import router as accounting_router
except ImportError:
    accounting_router = None

# Import Accounting AI module
try:
    from src.modules.accounting.ai_api import router as accounting_ai_router
except ImportError:
    accounting_ai_router = None

# Import Invoicing module
try:
    from src.modules.invoicing.api import router as invoicing_router
except ImportError:
    invoicing_router = None

# Import Dashboard module (simplified version)
try:
    from src.modules.dashboard.api_simple import router as dashboard_router
except ImportError:
    dashboard_router = None

# Import Cross-Module Integration
try:
    from src.core.cross_module_integration import cross_module, ModuleType
except ImportError:
    cross_module = None

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting FusionAI Enterprise Suite...")
    try:
        # Initialize database if needed
        logger.info("Application initialized successfully")
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="FusionAI Enterprise Suite",
    version="1.0.0",
    description="AI-Driven Modular ERP Platform",
    lifespan=lifespan
)

# CORS - Allow all frontend ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
if crm_router:
    app.include_router(crm_router)
    
if dashboard_router:
    app.include_router(dashboard_router)
    
if contact_hub_router:
    app.include_router(contact_hub_router)
    
if contact_hub_integration_router:
    app.include_router(contact_hub_integration_router)
    
if contact_hub_ai_router:
    app.include_router(contact_hub_ai_router)
    
if accounting_router:
    app.include_router(accounting_router)
    
if accounting_ai_router:
    app.include_router(accounting_ai_router)
    
if invoicing_router:
    app.include_router(invoicing_router)
    
# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "FusionAI Enterprise Suite API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": "/api/v1",
            "modules": [
                "/api/v1/accounting",
                "/api/v1/crm", 
                "/api/v1/inventory",
                "/api/v1/sales",
                "/api/v1/project",
                "/api/v1/hr",
                "/api/v1/documents",
                "/api/v1/manufacturing",
                "/api/v1/purchase",
                "/api/v1/subscriptions",
                "/api/v1/helpdesk",
                "/api/v1/pos",
                "/api/v1/rental",
                "/api/v1/timesheets",
                "/api/v1/planning",
                "/api/v1/field-service",
                "/api/v1/knowledge",
                "/api/v1/website",
                "/api/v1/marketing",
                "/api/v1/email-marketing",
                "/api/v1/social-marketing",
                "/api/v1/studio",
                "/api/v1/contact-hub",
                "/api/v1/contact-hub/ai",
                "/api/v1/invoicing"
            ]
        }
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "api": "running", "timestamp": datetime.utcnow().isoformat()}

# Auth endpoints (mock for now)
@app.get("/auth/me")
async def get_current_user():
    return {
        "id": 1,
        "email": "user@example.com",
        "name": "Test User",
        "role": "admin"
    }

# CRM Module Mock Endpoints
@app.get("/api/v1/crm/dashboard")
async def get_crm_dashboard():
    return {
        "status": "success",
        "data": {
            "crm_statistics": {
                "total_contacts": 250,
                "total_leads": 45,
                "total_opportunities": 12,
                "conversion_rate": 15.5,
                "revenue_pipeline": 125000
            },
            "recent_activities": [
                {"type": "contact_created", "message": "New contact added", "time": "2 hours ago"},
                {"type": "lead_converted", "message": "Lead converted to opportunity", "time": "4 hours ago"}
            ],
            "top_contacts": [
                {"name": "John Doe", "company": "Acme Corp", "revenue": 25000},
                {"name": "Jane Smith", "company": "Tech Inc", "revenue": 18000}
            ],
            "pipeline_summary": {
                "prospecting": 15,
                "qualification": 8,
                "proposal": 5,
                "negotiation": 3,
                "closed_won": 2
            }
        }
    }

@app.get("/api/v1/crm/analytics")
async def get_crm_analytics(period: str = "30d"):
    return {
        "period": period,
        "lead_conversion_trends": [
            {"date": "2024-01-01", "conversions": 5},
            {"date": "2024-01-02", "conversions": 3},
            {"date": "2024-01-03", "conversions": 7}
        ],
        "sales_pipeline_analysis": {
            "total_value": 125000,
            "average_deal_size": 2500,
            "win_rate": 35.5
        },
        "contact_engagement_metrics": {
            "email_open_rate": 25.5,
            "call_conversion_rate": 12.3,
            "meeting_show_rate": 85.0
        }
    }

# Accounting Module Mock Endpoints
@app.get("/api/v1/accounting/dashboard")
async def get_accounting_dashboard():
    return {
        "status": "success",
        "data": {
            "invoice_statistics": {
                "total_invoices": 150,
                "paid_invoices": 120,
                "overdue_invoices": 8,
                "draft_invoices": 22,
                "total_revenue": 150000,
                "paid_revenue": 120000,
                "outstanding_amount": 30000
            },
            "recent_invoices": [
                {
                    "id": 1,
                    "invoice_number": "INV-001",
                    "customer_name": "Acme Corp",
                    "amount": 2500.00,
                    "status": "paid",
                    "due_date": "2024-01-15"
                },
                {
                    "id": 2,
                    "invoice_number": "INV-002", 
                    "customer_name": "Tech Inc",
                    "amount": 1800.00,
                    "status": "pending",
                    "due_date": "2024-01-20"
                }
            ],
            "overdue_invoices": [
                {
                    "id": 3,
                    "invoice_number": "INV-003",
                    "customer_name": "Old Corp",
                    "amount": 500.00,
                    "days_overdue": 15
                }
            ]
        }
    }

@app.get("/api/v1/accounting/invoices")
async def get_invoices(limit: int = 10):
    return [
        {
            "id": i,
            "invoice_number": f"INV-{1000+i:03d}",
            "customer_name": f"Customer {i}",
            "amount": 1000 * (i + 1),
            "status": "pending" if i % 2 == 0 else "paid",
            "due_date": "2024-12-31",
            "created_at": "2024-01-15"
        }
        for i in range(1, min(limit + 1, 11))
    ]

@app.get("/api/v1/accounting/payments")
async def get_payments(page: int = 1, limit: int = 10):
    return [
        {
            "id": i,
            "payment_number": f"PAY-{2000+i:03d}",
            "amount": 500 * i,
            "date": "2024-01-15",
            "method": "credit_card",
            "status": "completed"
        }
        for i in range(1, min(limit + 1, 11))
    ]

# Inventory Module Mock Endpoints
@app.get("/api/v1/inventory/dashboard")
async def get_inventory_dashboard():
    return {
        "status": "success",
        "data": {
            "inventory_statistics": {
                "total_products": 250,
                "total_stock_value": 125000,
                "low_stock_items": 15,
                "out_of_stock_items": 3,
                "total_warehouses": 3,
                "inventory_turnover": 4.2
            },
            "stock_alerts": [
                {"product": "Product A", "current": 5, "minimum": 10},
                {"product": "Product B", "current": 2, "minimum": 8}
            ],
            "top_products": [
                {"name": "Product A", "stock": 150, "value": 15000},
                {"name": "Product B", "stock": 100, "value": 12000}
            ],
            "warehouse_summary": {
                "warehouse_1": {"items": 100, "value": 50000},
                "warehouse_2": {"items": 80, "value": 40000},
                "warehouse_3": {"items": 70, "value": 35000}
            }
        }
    }

@app.get("/api/v1/inventory/products")
async def get_products(limit: int = 10):
    return [
        {
            "id": i,
            "name": f"Product {i}",
            "sku": f"SKU-{1000+i:03d}",
            "stock": 50 + i * 10,
            "price": 99.99 + i * 10,
            "category": "Electronics" if i % 2 == 0 else "Accessories",
            "warehouse": "Warehouse 1" if i % 3 == 0 else "Warehouse 2"
        }
        for i in range(1, min(limit + 1, 11))
    ]

@app.get("/api/v1/inventory/stock-level-report")
async def get_stock_report():
    return {
        "status": "success",
        "data": {
            "report_summary": {
                "total_items": 250,
                "low_stock_count": 15,
                "out_of_stock_count": 3,
                "total_value": 125000
            },
            "stock_items": [
                {
                    "product_name": f"Product {i}",
                    "current_stock": 50 + i * 5,
                    "minimum_stock": 20,
                    "maximum_stock": 200,
                    "status": "normal" if i % 3 != 0 else "low_stock"
                }
                for i in range(1, 11)
            ]
        }
    }

# Sales Module Mock Endpoints
@app.get("/api/v1/sales/dashboard")
async def get_sales_dashboard():
    return {
        "status": "success",
        "data": {
            "sales_statistics": {
                "total_sales": 500000,
                "orders_today": 25,
                "conversion_rate": 3.5,
                "average_order_value": 1250,
                "monthly_target": 600000,
                "target_achievement": 83.3
            },
            "top_products": [
                {"name": "Product A", "sales": 50000, "quantity": 100},
                {"name": "Product B", "sales": 35000, "quantity": 70}
            ],
            "recent_orders": [
                {
                    "id": i,
                    "order_number": f"ORD-{3000+i:03d}",
                    "customer": f"Customer {i}",
                    "amount": 1000 + i * 100,
                    "status": "completed" if i % 2 == 0 else "pending",
                    "date": "2024-01-15"
                }
                for i in range(1, 6)
            ]
        }
    }

@app.get("/api/v1/sales/analytics")
async def get_sales_analytics(period_days: int = 30):
    return {
        "period_days": period_days,
        "total_revenue": 150000,
        "total_orders": 120,
        "growth_rate": 15.5,
        "top_customers": [
            {"name": "Customer A", "revenue": 25000, "orders": 10},
            {"name": "Customer B", "revenue": 18000, "orders": 7}
        ],
        "revenue_trends": [
            {"date": "2024-01-01", "revenue": 5000},
            {"date": "2024-01-02", "revenue": 7500},
            {"date": "2024-01-03", "revenue": 6200}
        ]
    }

# Project Module Mock Endpoints
@app.get("/api/v1/project/dashboard")
async def get_project_dashboard():
    return {
        "status": "success",
        "data": {
            "project_statistics": {
                "total_projects": 15,
                "active_projects": 8,
                "completed_projects": 5,
                "overdue_tasks": 12,
                "team_members": 25,
                "completion_rate": 65
            },
            "recent_projects": [
                {
                    "id": i,
                    "name": f"Project {i}",
                    "status": "active" if i % 2 == 0 else "planning",
                    "progress": 20 * i,
                    "deadline": "2024-12-31",
                    "team_size": 3 + i
                }
                for i in range(1, 6)
            ],
            "upcoming_deadlines": [
                {
                    "project": f"Project {i}",
                    "task": f"Task {i}",
                    "deadline": "2024-01-25",
                    "assignee": f"User {i}"
                }
                for i in range(1, 4)
            ]
        }
    }

@app.get("/api/v1/project/analytics")
async def get_project_analytics(period_days: int = 30):
    return {
        "period_days": period_days,
        "tasks_completed": 45,
        "average_completion_time": 3.5,
        "productivity_score": 78,
        "project_completion_trends": [
            {"date": "2024-01-01", "completed": 5},
            {"date": "2024-01-02", "completed": 8},
            {"date": "2024-01-03", "completed": 6}
        ]
    }

@app.get("/api/v1/project/projects")
async def get_projects(limit: int = 10):
    return [
        {
            "id": i,
            "name": f"Project {i}",
            "status": "active" if i % 2 == 0 else "planning",
            "progress": 20 * i,
            "deadline": "2024-12-31",
            "team_size": 3 + i,
            "created_at": "2024-01-01"
        }
        for i in range(1, min(limit + 1, 11))
    ]

@app.get("/api/v1/project/tasks")
async def get_tasks(limit: int = 10):
    return [
        {
            "id": i,
            "title": f"Task {i}",
            "status": "in_progress" if i % 2 == 0 else "todo",
            "priority": "high" if i % 3 == 0 else "medium",
            "assignee": f"User {i % 5}",
            "due_date": "2024-01-25",
            "project_id": i % 3 + 1
        }
        for i in range(1, min(limit + 1, 11))
    ]

# HR Module Mock Endpoints
@app.get("/api/v1/hr/dashboard")
async def get_hr_dashboard(period_days: int = 30):
    return {
        "status": "success",
        "data": {
            "hr_statistics": {
                "total_employees": 150,
                "active_employees": 145,
                "departments": 8,
                "new_hires_this_month": 5,
                "turnover_rate": 2.5,
                "average_salary": 75000,
                "vacation_days_used": 45,
                "pending_requests": 8
            },
            "recent_hires": [
                {
                    "name": f"Employee {i}",
                    "department": f"Department {i % 3 + 1}",
                    "start_date": "2024-01-15",
                    "position": f"Position {i}"
                }
                for i in range(1, 4)
            ],
            "upcoming_birthdays": [
                {
                    "name": f"Employee {i}",
                    "birthday": "2024-01-25",
                    "department": f"Department {i % 2 + 1}"
                }
                for i in range(1, 4)
            ]
        }
    }

# Documents Module Mock Endpoints
@app.get("/api/v1/documents")
async def get_documents():
    return [
        {
            "id": i,
            "name": f"Document {i}.pdf",
            "type": "pdf",
            "size": 1024 * (i + 1),
            "uploaded_at": "2024-01-15",
            "tags": ["important", "contract"] if i % 2 == 0 else ["draft"],
            "status": "processed"
        }
        for i in range(1, 11)
    ]

# Helpdesk Module Mock Endpoints
@app.get("/api/v1/helpdesk/health")
async def helpdesk_health_check():
    return {
        "status": "healthy",
        "module": "helpdesk",
        "message": "Helpdesk module is running"
    }

@app.get("/api/v1/helpdesk/dashboard")
async def get_helpdesk_dashboard():
    return {
        "status": "success",
        "data": {
            "ticket_statistics": {
                "total_tickets": 125,
                "open_tickets": 15,
                "closed_tickets": 110,
                "avg_response_time": 45,
                "satisfaction_score": 4.2
            },
            "recent_tickets": [
                {
                    "id": 1,
                    "subject": "Login Issue",
                    "status": "open",
                    "priority": "high",
                    "category": "Technical",
                    "customer_name": "John Doe",
                    "created_at": "2024-01-25T10:00:00Z"
                },
                {
                    "id": 2,
                    "subject": "Billing Question",
                    "status": "resolved",
                    "priority": "medium",
                    "category": "Billing",
                    "customer_name": "Jane Smith",
                    "created_at": "2024-01-25T09:30:00Z"
                }
            ],
            "top_agents": [
                {"name": "Agent 1", "tickets_resolved": 45},
                {"name": "Agent 2", "tickets_resolved": 38}
            ]
        }
    }

@app.get("/api/v1/helpdesk/analytics")
async def get_helpdesk_analytics(period_days: int = 30):
    return {
        "status": "success",
        "data": {
            "period": f"{period_days} days",
            "tickets_resolved": 95,
            "avg_resolution_time": 2.5,
            "customer_satisfaction": 4.2,
            "tickets_by_category": [
                {"category": "Technical", "count": 40},
                {"category": "Billing", "count": 25},
                {"category": "General", "count": 20},
                {"category": "Feature Request", "count": 10}
            ]
        }
    }

@app.get("/api/v1/helpdesk/tickets")
async def get_helpdesk_tickets(limit: int = 10):
    return {
        "data": [
            {
                "id": i,
                "subject": f"Support Ticket {i}",
                "description": f"Description for ticket {i}",
                "status": "open" if i % 3 == 0 else "resolved",
                "priority": "high" if i % 4 == 0 else "medium",
                "category": "Technical" if i % 2 == 0 else "General",
                "customer_name": f"Customer {i}",
                "assigned_agent": f"Agent {i % 3 + 1}",
                "created_at": "2024-01-25T10:00:00Z",
                "updated_at": "2024-01-25T11:00:00Z"
            }
            for i in range(1, min(limit + 1, 11))
        ],
        "total": 125
    }

# Subscriptions Module Mock Endpoints
@app.get("/api/v1/subscriptions/health")
async def subscriptions_health_check():
    return {
        "status": "healthy",
        "module": "subscriptions",
        "message": "Subscriptions module is running"
    }

@app.get("/api/v1/subscriptions/dashboard")
async def get_subscriptions_dashboard():
    return {
        "status": "success",
        "data": {
            "subscription_statistics": {
                "total_subscriptions": 250,
                "active_subscriptions": 200,
                "monthly_revenue": 25000,
                "churn_rate": 5.2,
                "new_subscriptions": 15
            },
            "recent_subscriptions": [
                {
                    "id": 1,
                    "customer_name": "Customer 1",
                    "plan_name": "Premium",
                    "status": "active",
                    "amount": 99.99,
                    "created_at": "2024-01-25T10:00:00Z"
                },
                {
                    "id": 2,
                    "customer_name": "Customer 2",
                    "plan_name": "Basic",
                    "status": "active",
                    "amount": 29.99,
                    "created_at": "2024-01-25T09:30:00Z"
                }
            ],
            "top_plans": [
                {"name": "Premium", "subscribers": 80, "revenue": 8000},
                {"name": "Basic", "subscribers": 120, "revenue": 3600}
            ]
        }
    }

@app.get("/api/v1/subscriptions/analytics")
async def get_subscriptions_analytics(period_days: int = 30):
    return {
        "status": "success",
        "data": {
            "period": f"{period_days} days",
            "mrr": 25000,
            "arr": 300000,
            "churn_rate": 5.2,
            "growth_rate": 12.5,
            "revenue_by_plan": [
                {"plan": "Premium", "revenue": 16000},
                {"plan": "Basic", "revenue": 7200},
                {"plan": "Enterprise", "revenue": 1800}
            ]
        }
    }

# Additional Module Endpoints (for frontend routing)
# Manufacturing Module Mock Endpoints
@app.get("/api/v1/manufacturing/dashboard")
async def get_manufacturing_dashboard():
    return {
        "status": "success",
        "data": {
            "active_production_lines": 4,
            "units_produced_today": 1250,
            "efficiency_rate": 87.5,
            "quality_score": 94.2,
            "downtime_hours": 2.3,
            "recent_orders": [
                {
                    "order_id": "MO-001",
                    "product_name": "Widget A",
                    "quantity": 500,
                    "status": "completed",
                    "created_at": "2024-01-15T10:30:00Z"
                },
                {
                    "order_id": "MO-002", 
                    "product_name": "Widget B",
                    "quantity": 300,
                    "status": "in_progress",
                    "created_at": "2024-01-15T14:20:00Z"
                },
                {
                    "order_id": "MO-003",
                    "product_name": "Widget C", 
                    "quantity": 750,
                    "status": "scheduled",
                    "created_at": "2024-01-15T16:45:00Z"
                }
            ],
            "production_by_line": [
                {"line_name": "Line 1", "units_produced": 320},
                {"line_name": "Line 2", "units_produced": 280},
                {"line_name": "Line 3", "units_produced": 310},
                {"line_name": "Line 4", "units_produced": 340}
            ]
        }
    }

# Marketing Module Mock Endpoints
@app.get("/api/v1/marketing/dashboard")
async def get_marketing_dashboard():
    return {
        "status": "success",
        "data": {
            "total_campaigns": 12,
            "total_subscribers": 15420,
            "open_rate": 24.8,
            "click_rate": 3.2,
            "revenue_generated": 12500,
            "recent_campaigns": [
                {
                    "name": "Q1 Product Launch",
                    "subscribers": 8500,
                    "open_rate": 28.5,
                    "status": "sent",
                    "sent_at": "2024-01-15T09:00:00Z"
                },
                {
                    "name": "Weekly Newsletter",
                    "subscribers": 12000,
                    "open_rate": 22.1,
                    "status": "sent", 
                    "sent_at": "2024-01-14T08:30:00Z"
                },
                {
                    "name": "Promotional Offer",
                    "subscribers": 6800,
                    "open_rate": 31.2,
                    "status": "scheduled",
                    "sent_at": "2024-01-16T10:00:00Z"
                }
            ],
            "campaign_performance": [
                {"name": "Q1 Launch", "open_rate": 28.5},
                {"name": "Newsletter", "open_rate": 22.1},
                {"name": "Promo", "open_rate": 31.2},
                {"name": "Welcome", "open_rate": 45.8}
            ]
        }
    }

@app.get("/module/manufacturing")
async def manufacturing_module():
    return {
        "message": "Manufacturing module", 
        "status": "available",
        "endpoints": "/api/v1/manufacturing"
    }

@app.get("/module/purchase")
async def purchase_module():
    return {
        "message": "Purchase module", 
        "status": "available",
        "endpoints": "/api/v1/purchase"
    }

@app.get("/module/subscriptions")
async def subscriptions_module():
    return {
        "message": "Subscriptions module",
        "status": "available", 
        "endpoints": "/api/v1/subscriptions"
    }

@app.get("/module/helpdesk")
async def helpdesk_module():
    return {
        "message": "Helpdesk module",
        "status": "available",
        "endpoints": "/api/v1/helpdesk"
    }

# POS Module Mock Endpoints
@app.get("/api/v1/pos/health")
async def pos_health_check():
    return {
        "status": "healthy",
        "module": "pos",
        "message": "Point of Sale module is running"
    }

@app.get("/api/v1/pos/dashboard")
async def get_pos_dashboard():
    return {
        "status": "success",
        "data": {
            "total_sales_today": 2500.0,
            "total_transactions_today": 45,
            "average_transaction_value": 55.56,
            "top_selling_products": [
                {"product_name": "Product A", "quantity_sold": 25, "revenue": 1250.0},
                {"product_name": "Product B", "quantity_sold": 18, "revenue": 900.0},
                {"product_name": "Product C", "quantity_sold": 12, "revenue": 600.0}
            ],
            "payment_methods_breakdown": [
                {"method": "Cash", "count": 20, "amount": 1000.0},
                {"method": "Credit Card", "count": 15, "amount": 750.0},
                {"method": "Debit Card", "count": 10, "amount": 500.0}
            ],
            "terminal_performance": [
                {"terminal_id": "T001", "sales_count": 25, "revenue": 1250.0},
                {"terminal_id": "T002", "sales_count": 15, "revenue": 750.0},
                {"terminal_id": "T003", "sales_count": 5, "revenue": 250.0}
            ]
        }
    }

@app.get("/api/v1/pos/analytics")
async def get_pos_analytics(period_days: int = 30):
    return {
        "status": "success",
        "data": {
            "period": f"{period_days} days",
            "total_revenue": 75000.0,
            "total_transactions": 1350,
            "average_transaction_value": 55.56,
            "sales_by_hour": [
                {"hour": f"{i:02d}:00", "sales": 50 + i * 5} for i in range(24)
            ],
            "sales_by_day": [
                {"day": "Monday", "revenue": 10000.0},
                {"day": "Tuesday", "revenue": 12000.0},
                {"day": "Wednesday", "revenue": 11000.0},
                {"day": "Thursday", "revenue": 13000.0},
                {"day": "Friday", "revenue": 15000.0},
                {"day": "Saturday", "revenue": 8000.0},
                {"day": "Sunday", "revenue": 6000.0}
            ],
            "top_products": [
                {"product_name": "Product A", "quantity": 450, "revenue": 22500.0},
                {"product_name": "Product B", "quantity": 320, "revenue": 16000.0},
                {"product_name": "Product C", "quantity": 280, "revenue": 14000.0}
            ],
            "payment_methods": [
                {"method": "Cash", "percentage": 45, "amount": 33750.0},
                {"method": "Credit Card", "percentage": 35, "amount": 26250.0},
                {"method": "Debit Card", "percentage": 20, "amount": 15000.0}
            ]
        }
    }

@app.get("/api/v1/pos/terminals")
async def get_pos_terminals():
    return {
        "status": "success",
        "data": [
            {
                "id": 1,
                "terminal_id": "T001",
                "name": "Main Register",
                "location": "Front Store",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": 2,
                "terminal_id": "T002",
                "name": "Secondary Register",
                "location": "Back Store",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": 3,
                "terminal_id": "T003",
                "name": "Mobile POS",
                "location": "Warehouse",
                "is_active": False,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }

@app.get("/api/v1/pos/sales")
async def get_pos_sales():
    return {
        "status": "success",
        "data": [
            {
                "id": 1,
                "sale_number": "POS20240101120001",
                "terminal_id": 1,
                "cashier_id": "cashier_1",
                "customer_id": "customer_1",
                "subtotal": 50.0,
                "tax_amount": 5.0,
                "discount_amount": 0.0,
                "total_amount": 55.0,
                "status": "completed",
                "sale_date": "2024-01-01T12:00:00Z",
                "items": [
                    {"product_name": "Product A", "quantity": 2, "unit_price": 25.0}
                ]
            },
            {
                "id": 2,
                "sale_number": "POS20240101120002",
                "terminal_id": 1,
                "cashier_id": "cashier_1",
                "customer_id": None,
                "subtotal": 25.0,
                "tax_amount": 2.5,
                "discount_amount": 2.5,
                "total_amount": 25.0,
                "status": "completed",
                "sale_date": "2024-01-01T12:15:00Z",
                "items": [
                    {"product_name": "Product B", "quantity": 1, "unit_price": 25.0}
                ]
            }
        ]
    }

@app.get("/api/v1/pos/payments")
async def get_pos_payments():
    return {
        "status": "success",
        "data": [
            {
                "id": 1,
                "sale_id": 1,
                "payment_method": "credit_card",
                "amount": 55.0,
                "status": "completed",
                "transaction_id": "TXN001",
                "reference_number": "REF001",
                "payment_date": "2024-01-01T12:00:00Z"
            },
            {
                "id": 2,
                "sale_id": 2,
                "payment_method": "cash",
                "amount": 25.0,
                "status": "completed",
                "transaction_id": None,
                "reference_number": "CASH001",
                "payment_date": "2024-01-01T12:15:00Z"
            }
        ]
    }

@app.get("/module/pos")
async def pos_module():
    return {
        "message": "POS module",
        "status": "available",
        "endpoints": "/api/v1/pos"
    }

# Rental Module Mock Endpoints
@app.get("/api/v1/rental/health")
async def rental_health_check():
    return {
        "status": "healthy",
        "module": "rental",
        "message": "Rental module is running"
    }

@app.get("/api/v1/rental/dashboard")
async def get_rental_dashboard():
    return {
        "status": "success",
        "data": {
            "total_active_rentals": 45,
            "total_revenue_this_month": 12500.0,
            "overdue_rentals": 3,
            "available_equipment": 28,
            "rental_categories": [
                {"category": "Construction Equipment", "count": 15, "revenue": 7500.0},
                {"category": "Office Equipment", "count": 12, "revenue": 2400.0},
                {"category": "Event Equipment", "count": 18, "revenue": 2600.0}
            ],
            "top_rented_items": [
                {"item_name": "Excavator CAT-320", "rental_count": 8, "revenue": 4000.0},
                {"item_name": "Office Chair Premium", "rental_count": 15, "revenue": 750.0},
                {"item_name": "Sound System Pro", "rental_count": 12, "revenue": 1800.0}
            ],
            "recent_rentals": [
                {
                    "rental_id": "RENT-001",
                    "customer_name": "ABC Construction",
                    "item_name": "Excavator CAT-320",
                    "start_date": "2024-01-15",
                    "end_date": "2024-02-15",
                    "status": "active"
                },
                {
                    "rental_id": "RENT-002",
                    "customer_name": "Tech Corp",
                    "item_name": "Office Chair Premium",
                    "start_date": "2024-01-20",
                    "end_date": "2024-04-20",
                    "status": "active"
                }
            ]
        }
    }

@app.get("/api/v1/rental/analytics")
async def get_rental_analytics(period_days: int = 30):
    return {
        "status": "success",
        "data": {
            "period": f"{period_days} days",
            "total_revenue": 37500.0,
            "total_rentals": 135,
            "average_rental_duration": 15.5,
            "utilization_rate": 78.5,
            "revenue_by_category": [
                {"category": "Construction Equipment", "revenue": 22500.0, "percentage": 60.0},
                {"category": "Office Equipment", "revenue": 7500.0, "percentage": 20.0},
                {"category": "Event Equipment", "revenue": 7500.0, "percentage": 20.0}
            ],
            "rental_trends": [
                {"week": "Week 1", "rentals": 25, "revenue": 6250.0},
                {"week": "Week 2", "rentals": 32, "revenue": 8000.0},
                {"week": "Week 3", "rentals": 28, "revenue": 7000.0},
                {"week": "Week 4", "rentals": 35, "revenue": 8750.0}
            ],
            "top_customers": [
                {"customer_name": "ABC Construction", "rental_count": 12, "revenue": 6000.0},
                {"customer_name": "Tech Corp", "rental_count": 8, "revenue": 2400.0},
                {"customer_name": "Event Masters", "rental_count": 10, "revenue": 3000.0}
            ]
        }
    }

@app.get("/api/v1/rental/equipment")
async def get_rental_equipment():
    return {
        "status": "success",
        "data": [
            {
                "id": 1,
                "name": "Excavator CAT-320",
                "category": "Construction Equipment",
                "status": "available",
                "daily_rate": 500.0,
                "condition": "excellent",
                "location": "Warehouse A"
            },
            {
                "id": 2,
                "name": "Office Chair Premium",
                "category": "Office Equipment",
                "status": "rented",
                "daily_rate": 5.0,
                "condition": "good",
                "location": "Office Building"
            },
            {
                "id": 3,
                "name": "Sound System Pro",
                "category": "Event Equipment",
                "status": "available",
                "daily_rate": 150.0,
                "condition": "excellent",
                "location": "Event Center"
            }
        ]
    }

@app.get("/api/v1/rental/rentals")
async def get_rental_rentals():
    return {
        "status": "success",
        "data": [
            {
                "id": 1,
                "rental_id": "RENT-001",
                "customer_name": "ABC Construction",
                "equipment_name": "Excavator CAT-320",
                "start_date": "2024-01-15",
                "end_date": "2024-02-15",
                "status": "active",
                "total_amount": 15000.0,
                "daily_rate": 500.0
            },
            {
                "id": 2,
                "rental_id": "RENT-002",
                "customer_name": "Tech Corp",
                "equipment_name": "Office Chair Premium",
                "start_date": "2024-01-20",
                "end_date": "2024-04-20",
                "status": "active",
                "total_amount": 450.0,
                "daily_rate": 5.0
            }
        ]
    }

@app.get("/module/rental")
async def rental_module():
    return {
        "message": "Rental module",
        "status": "available",
        "endpoints": "/api/v1/rental"
    }

# Timesheets Module Mock Endpoints
@app.get("/api/v1/timesheets/health")
async def timesheets_health_check():
        return {
            "status": "healthy",
        "module": "timesheets",
        "message": "Timesheets module is running"
    }

@app.get("/api/v1/timesheets/dashboard")
async def get_timesheets_dashboard():
    return {
        "status": "success",
        "data": {
            "total_hours_this_week": 240.5,
            "employees_clocked_in": 12,
            "overtime_hours": 15.5,
            "pending_approvals": 8,
            "department_summary": [
                {"department": "Engineering", "total_hours": 120.0, "employees": 6},
                {"department": "Sales", "total_hours": 80.5, "employees": 4},
                {"department": "Marketing", "total_hours": 40.0, "employees": 2}
            ],
            "recent_entries": [
                {
                    "employee_name": "John Doe",
                    "date": "2024-01-25",
                    "hours_worked": 8.0,
                    "project": "Project Alpha",
                    "status": "approved"
                },
                {
                    "employee_name": "Jane Smith",
                    "date": "2024-01-25",
                    "hours_worked": 7.5,
                    "project": "Project Beta",
                    "status": "pending"
                }
            ]
        }
    }

@app.get("/api/v1/timesheets/analytics")
async def get_timesheets_analytics(period_days: int = 30):
    return {
        "status": "success",
        "data": {
            "period": f"{period_days} days",
            "total_hours_logged": 1200.5,
            "average_hours_per_day": 40.0,
            "overtime_hours": 125.5,
            "utilization_rate": 85.5,
            "hours_by_project": [
                {"project": "Project Alpha", "hours": 450.0, "percentage": 37.5},
                {"project": "Project Beta", "hours": 300.0, "percentage": 25.0},
                {"project": "Project Gamma", "hours": 250.5, "percentage": 20.8},
                {"project": "Administrative", "hours": 200.0, "percentage": 16.7}
            ],
            "employee_performance": [
                {"employee": "John Doe", "total_hours": 160.0, "efficiency": 95.0},
                {"employee": "Jane Smith", "total_hours": 155.5, "efficiency": 92.0},
                {"employee": "Mike Johnson", "total_hours": 150.0, "efficiency": 88.0}
            ]
        }
    }

@app.get("/api/v1/timesheets/entries")
async def get_timesheets_entries():
    return {
        "status": "success",
        "data": [
            {
                "id": 1,
                "employee_name": "John Doe",
                "date": "2024-01-25",
                "start_time": "09:00",
                "end_time": "17:00",
                "hours_worked": 8.0,
                "project": "Project Alpha",
                "task_description": "Development work",
                "status": "approved"
            },
            {
                "id": 2,
                "employee_name": "Jane Smith",
                "date": "2024-01-25",
                "start_time": "08:30",
                "end_time": "16:00",
                "hours_worked": 7.5,
                "project": "Project Beta",
                "task_description": "Testing and QA",
                "status": "pending"
            }
        ]
    }

@app.get("/module/timesheets")
async def timesheets_module():
    return {
        "message": "Timesheets module",
        "status": "available",
        "endpoints": "/api/v1/timesheets"
    }

# Planning Module Mock Endpoints
@app.get("/api/v1/planning/dashboard")
async def get_planning_dashboard():
    return {
        "status": "success",
        "data": {
            "active_projects": 15,
            "resources_allocated": 45,
            "upcoming_milestones": 8,
            "resource_utilization": 78.5,
            "project_status": [
                {"status": "On Track", "count": 10, "percentage": 66.7},
                {"status": "At Risk", "count": 4, "percentage": 26.7},
                {"status": "Behind", "count": 1, "percentage": 6.7}
            ]
        }
    }

@app.get("/module/planning")
async def planning_module():
    return {
        "message": "Planning module",
        "status": "available",
        "endpoints": "/api/v1/planning"
    }

# Field Service Module Mock Endpoints
@app.get("/api/v1/field-service/dashboard")
async def get_field_service_dashboard():
    return {
        "status": "success",
        "data": {
            "active_services": 25,
            "technicians_available": 12,
            "completed_today": 18,
            "pending_services": 7,
            "service_categories": [
                {"category": "Installation", "count": 10, "revenue": 5000.0},
                {"category": "Maintenance", "count": 8, "revenue": 2400.0},
                {"category": "Repair", "count": 7, "revenue": 3500.0}
            ]
        }
    }

@app.get("/module/field-service")
async def field_service_module():
    return {
        "message": "Field Service module",
        "status": "available",
        "endpoints": "/api/v1/field-service"
    }

# Knowledge Module Mock Endpoints
@app.get("/api/v1/knowledge/dashboard")
async def get_knowledge_dashboard():
        return {
        "status": "success",
        "data": {
            "total_articles": 250,
            "articles_this_month": 15,
            "most_viewed": "Getting Started Guide",
            "search_queries": 1250,
            "categories": [
                {"category": "User Guides", "articles": 100},
                {"category": "Technical Docs", "articles": 80},
                {"category": "FAQs", "articles": 70}
            ]
        }
    }

@app.get("/module/knowledge")
async def knowledge_module():
    return {
        "message": "Knowledge module",
        "status": "available",
        "endpoints": "/api/v1/knowledge"
    }

# Website Module Mock Endpoints
@app.get("/api/v1/website/dashboard")
async def get_website_dashboard():
    return {
        "status": "success",
        "data": {
            "total_pages": 45,
            "published_pages": 42,
            "draft_pages": 3,
            "total_visits": 12500,
            "page_views": 45600,
            "top_pages": [
                {"page": "Home", "views": 8500},
                {"page": "About", "views": 3200},
                {"page": "Contact", "views": 2800}
            ]
        }
    }

@app.get("/module/website")
async def website_module():
    return {
        "message": "Website module",
        "status": "available",
        "endpoints": "/api/v1/website"
    }

# Email Marketing Module Mock Endpoints
@app.get("/api/v1/email-marketing/dashboard")
async def get_email_marketing_dashboard():
    return {
        "status": "success",
        "data": {
            "total_campaigns": 25,
            "active_campaigns": 3,
            "subscribers": 15000,
            "open_rate": 24.5,
            "click_rate": 3.2,
            "recent_campaigns": [
                {"name": "Newsletter Jan 2024", "sent": 15000, "opened": 3675, "clicked": 480},
                {"name": "Product Launch", "sent": 8000, "opened": 2400, "clicked": 320}
            ]
        }
    }

@app.get("/module/email-marketing")
async def email_marketing_module():
    return {
        "message": "Email Marketing module",
        "status": "available",
        "endpoints": "/api/v1/email-marketing"
    }

# Social Marketing Module Mock Endpoints
@app.get("/api/v1/social-marketing/dashboard")
async def get_social_marketing_dashboard():
    return {
        "status": "success",
        "data": {
            "total_followers": 25000,
            "posts_this_month": 45,
            "engagement_rate": 4.8,
            "platforms": [
                {"platform": "Facebook", "followers": 10000, "posts": 15},
                {"platform": "Twitter", "followers": 8000, "posts": 20},
                {"platform": "LinkedIn", "followers": 7000, "posts": 10}
            ]
        }
    }

@app.get("/module/social-marketing")
async def social_marketing_module():
    return {
        "message": "Social Marketing module",
        "status": "available",
        "endpoints": "/api/v1/social-marketing"
    }

# Studio Module Mock Endpoints
@app.get("/api/v1/studio/dashboard")
async def get_studio_dashboard():
    return {
        "status": "success",
        "data": {
            "total_projects": 35,
            "active_projects": 12,
            "completed_this_month": 8,
            "storage_used": "2.5 GB",
            "recent_projects": [
                {"name": "Brand Identity 2024", "status": "In Progress", "created": "2024-01-20"},
                {"name": "Website Redesign", "status": "Completed", "created": "2024-01-15"},
                {"name": "Social Media Kit", "status": "Review", "created": "2024-01-18"}
            ]
        }
    }

@app.get("/module/studio")
async def studio_module():
    return {
        "message": "Studio module",
        "status": "available",
        "endpoints": "/api/v1/studio"
    }

# Cross-Module Analytics Endpoint
@app.get("/api/v1/cross-module/analytics")
async def get_cross_module_analytics():
    """Get analytics across all modules"""
    if not cross_module:
        return {
            "status": "error",
            "message": "Cross-module integration not available"
        }
    
    try:
        analytics = cross_module.get_cross_module_analytics()
        return {
            "status": "success",
            "data": analytics
        }
    except Exception as e:
        logger.error(f"Cross-module analytics error: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/api/v1/cross-module/contacts/{contact_id}/360")
async def get_contact_360_view(contact_id: int):
    """Get 360-degree view of a contact across all modules"""
    if not cross_module:
        return {
            "status": "error",
            "message": "Cross-module integration not available"
        }
    
    try:
        contact_view = cross_module.get_contact_360_view(contact_id)
        return {
            "status": "success",
            "data": contact_view
        }
    except Exception as e:
        logger.error(f"Contact 360 view error: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "timestamp": datetime.utcnow().isoformat()}
    )

if __name__ == "__main__":
    import uvicorn
    # Run on port 3000 to match frontend expectations
    uvicorn.run(app, host="0.0.0.0", port=3000, reload=True)