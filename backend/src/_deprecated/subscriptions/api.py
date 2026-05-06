"""
Subscriptions Module API Endpoints
FastAPI routes for subscription management, billing cycles, and customer lifecycle tracking
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from ...core.database import get_async_session
from .service import SubscriptionService
from .schemas import (
    SubscriptionPlanCreate, SubscriptionPlanUpdate, SubscriptionPlanResponse,
    CustomerCreate, CustomerUpdate, CustomerResponse,
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse,
    PaymentCreate, PaymentResponse,
    UsageRecordCreate, UsageRecordResponse,
    SubscriptionDashboardMetrics, SubscriptionAnalytics
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get("/dashboard", response_model=dict)
async def get_subscription_dashboard(
    db: AsyncSession = Depends(get_async_session)
):
    """Get subscription dashboard metrics and statistics"""
    try:
        service = SubscriptionService(db)
        return await service.get_dashboard_metrics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription dashboard: {str(e)}"
        )


@router.get("/analytics", response_model=dict)
async def get_subscription_analytics(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_async_session)
):
    """Get subscription analytics for the specified period"""
    try:
        service = SubscriptionService(db)
        return await service.get_subscription_analytics(period_days)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription analytics: {str(e)}"
        )


# Subscription Plan Management Endpoints
@router.get("/plans", response_model=List[dict])
async def get_subscription_plans(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    plan_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated subscription plans with filters"""
    try:
        service = SubscriptionService(db)
        plans = await service.get_subscription_plans(
            page=page,
            limit=limit,
            plan_type=plan_type,
            is_active=is_active,
            search=search
        )
        return plans
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription plans: {str(e)}"
        )


@router.post("/plans", response_model=dict)
async def create_subscription_plan(
    plan_data: SubscriptionPlanCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new subscription plan"""
    try:
        service = SubscriptionService(db)
        plan = await service.create_subscription_plan(plan_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Subscription plan created successfully",
            "data": plan
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create subscription plan: {str(e)}"
        )


# Customer Management Endpoints
@router.get("/customers", response_model=List[dict])
async def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    customer_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated customers with filters"""
    try:
        service = SubscriptionService(db)
        customers = await service.get_customers(
            page=page,
            limit=limit,
            customer_type=customer_type,
            status=status,
            search=search
        )
        return customers
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get customers: {str(e)}"
        )


@router.post("/customers", response_model=dict)
async def create_customer(
    customer_data: CustomerCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new customer"""
    try:
        service = SubscriptionService(db)
        customer = await service.create_customer(customer_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Customer created successfully",
            "data": customer
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create customer: {str(e)}"
        )


# Subscription Management Endpoints
@router.get("/subscriptions", response_model=List[dict])
async def get_subscriptions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated subscriptions with filters"""
    try:
        service = SubscriptionService(db)
        subscriptions = await service.get_subscriptions(
            page=page,
            limit=limit,
            status=status,
            customer_id=customer_id,
            search=search
        )
        return subscriptions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscriptions: {str(e)}"
        )


@router.post("/subscriptions", response_model=dict)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new subscription"""
    try:
        service = SubscriptionService(db)
        subscription = await service.create_subscription(subscription_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Subscription created successfully",
            "data": subscription
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create subscription: {str(e)}"
        )


# Payment Management Endpoints
@router.get("/payments", response_model=List[dict])
async def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated payments with filters"""
    try:
        service = SubscriptionService(db)
        payments = await service.get_payments(
            page=page,
            limit=limit,
            status=status,
            customer_id=customer_id,
            search=search
        )
        return payments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get payments: {str(e)}"
        )


@router.post("/payments", response_model=dict)
async def create_payment(
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new payment"""
    try:
        service = SubscriptionService(db)
        payment = await service.create_payment(payment_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Payment created successfully",
            "data": payment
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment: {str(e)}"
        )


# Usage Record Management Endpoints
@router.get("/usage-records", response_model=List[dict])
async def get_usage_records(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    customer_id: Optional[int] = Query(None),
    subscription_id: Optional[int] = Query(None),
    feature_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated usage records with filters"""
    try:
        service = SubscriptionService(db)
        usage_records = await service.get_usage_records(
            page=page,
            limit=limit,
            customer_id=customer_id,
            subscription_id=subscription_id,
            feature_name=feature_name
        )
        return usage_records
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get usage records: {str(e)}"
        )


@router.post("/usage-records", response_model=dict)
async def create_usage_record(
    usage_data: UsageRecordCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new usage record"""
    try:
        service = SubscriptionService(db)
        usage_record = await service.create_usage_record(usage_data, 1)  # Default user_id
        return {
            "status": "success",
            "message": "Usage record created successfully",
            "data": usage_record
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create usage record: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "subscriptions",
        "timestamp": datetime.utcnow().isoformat()
    }



