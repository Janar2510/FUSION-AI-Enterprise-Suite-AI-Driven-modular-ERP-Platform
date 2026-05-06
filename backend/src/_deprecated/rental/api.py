from fastapi import APIRouter, Query
from typing import List

router = APIRouter(prefix="/rental")

@router.get("/health")
async def health_check():
    """Rental module health check"""
    return {
        "status": "healthy",
        "module": "rental",
        "message": "Rental module is running"
    }

@router.get("/dashboard")
async def get_rental_dashboard():
    """Get rental dashboard statistics"""
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

@router.get("/analytics")
async def get_rental_analytics(period_days: int = 30):
    """Get rental analytics for specified period"""
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

@router.get("/equipment")
async def get_equipment():
    """Get list of rental equipment"""
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

@router.get("/rentals")
async def get_rentals():
    """Get list of rentals"""
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
            },
            {
                "id": 3,
                "rental_id": "RENT-003",
                "customer_name": "Event Masters",
                "equipment_name": "Sound System Pro",
                "start_date": "2024-01-10",
                "end_date": "2024-01-12",
                "status": "completed",
                "total_amount": 450.0,
                "daily_rate": 150.0
            }
        ]
    }

@router.get("/customers")
async def get_customers():
    """Get list of rental customers"""
    return {
        "status": "success",
        "data": [
            {
                "id": 1,
                "customer_name": "ABC Construction",
                "contact_person": "John Smith",
                "email": "john@abcconstruction.com",
                "phone": "+1-555-0123",
                "total_rentals": 25,
                "total_spent": 75000.0,
                "status": "active"
            },
            {
                "id": 2,
                "customer_name": "Tech Corp",
                "contact_person": "Jane Doe",
                "email": "jane@techcorp.com",
                "phone": "+1-555-0124",
                "total_rentals": 15,
                "total_spent": 4500.0,
                "status": "active"
            },
            {
                "id": 3,
                "customer_name": "Event Masters",
                "contact_person": "Mike Johnson",
                "email": "mike@eventmasters.com",
                "phone": "+1-555-0125",
                "total_rentals": 20,
                "total_spent": 9000.0,
                "status": "active"
            }
        ]
    }



