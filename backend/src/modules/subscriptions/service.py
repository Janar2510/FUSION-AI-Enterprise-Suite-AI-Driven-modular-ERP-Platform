"""
Subscriptions Module Service
Business logic for subscription management, billing cycles, and customer lifecycle tracking
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

from .models import (
    SubscriptionPlan, Customer, Subscription, Payment, UsageRecord,
    SubscriptionStatus, BillingCycle, PaymentStatus, PlanType, UsageType
)
from .schemas import (
    SubscriptionPlanCreate, SubscriptionPlanUpdate, SubscriptionPlanResponse,
    CustomerCreate, CustomerUpdate, CustomerResponse,
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse,
    PaymentCreate, PaymentResponse,
    UsageRecordCreate, UsageRecordResponse,
    SubscriptionDashboardMetrics, SubscriptionAnalytics
)


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(self) -> Dict:
        """Get subscription dashboard metrics"""
        try:
            # Get basic subscription counts
            total_subscriptions_result = await self.db.execute(select(func.count(Subscription.id)))
            total_subscriptions = total_subscriptions_result.scalar() or 0
            
            active_subscriptions_result = await self.db.execute(
                select(func.count(Subscription.id))
                .where(Subscription.status == SubscriptionStatus.ACTIVE.value)
            )
            active_subscriptions = active_subscriptions_result.scalar() or 0
            
            trial_subscriptions_result = await self.db.execute(
                select(func.count(Subscription.id))
                .where(Subscription.status == SubscriptionStatus.TRIAL.value)
            )
            trial_subscriptions = trial_subscriptions_result.scalar() or 0
            
            cancelled_subscriptions_result = await self.db.execute(
                select(func.count(Subscription.id))
                .where(Subscription.status == SubscriptionStatus.CANCELLED.value)
            )
            cancelled_subscriptions = cancelled_subscriptions_result.scalar() or 0
            
            expired_subscriptions_result = await self.db.execute(
                select(func.count(Subscription.id))
                .where(Subscription.status == SubscriptionStatus.EXPIRED.value)
            )
            expired_subscriptions = expired_subscriptions_result.scalar() or 0
            
            # Calculate MRR (Monthly Recurring Revenue)
            mrr_result = await self.db.execute(
                select(func.sum(
                    func.case(
                        (Subscription.billing_cycle == BillingCycle.MONTHLY.value, Subscription.total_price),
                        (Subscription.billing_cycle == BillingCycle.QUARTERLY.value, Subscription.total_price / 3),
                        (Subscription.billing_cycle == BillingCycle.YEARLY.value, Subscription.total_price / 12),
                        else_=0
                    )
                ))
                .where(Subscription.status == SubscriptionStatus.ACTIVE.value)
            )
            monthly_recurring_revenue = mrr_result.scalar() or 0.0
            
            # Calculate ARR (Annual Recurring Revenue)
            arr_result = await self.db.execute(
                select(func.sum(
                    func.case(
                        (Subscription.billing_cycle == BillingCycle.MONTHLY.value, Subscription.total_price * 12),
                        (Subscription.billing_cycle == BillingCycle.QUARTERLY.value, Subscription.total_price * 4),
                        (Subscription.billing_cycle == BillingCycle.YEARLY.value, Subscription.total_price),
                        else_=0
                    )
                ))
                .where(Subscription.status == SubscriptionStatus.ACTIVE.value)
            )
            annual_recurring_revenue = arr_result.scalar() or 0.0
            
            # Calculate average revenue per user
            arpu_result = await self.db.execute(
                select(func.avg(Subscription.total_price))
                .where(Subscription.status == SubscriptionStatus.ACTIVE.value)
            )
            average_revenue_per_user = arpu_result.scalar() or 0.0
            
            # Get customer statistics
            total_customers_result = await self.db.execute(select(func.count(Customer.id)))
            total_customers = total_customers_result.scalar() or 0
            
            active_customers_result = await self.db.execute(
                select(func.count(Customer.id))
                .where(Customer.status == "active")
            )
            active_customers = active_customers_result.scalar() or 0
            
            # Get subscriptions by status
            status_counts = {}
            for status in SubscriptionStatus:
                count_result = await self.db.execute(
                    select(func.count(Subscription.id))
                    .where(Subscription.status == status.value)
                )
                count = count_result.scalar() or 0
                if count > 0:
                    status_counts[status.value] = count
            
            # Get subscriptions by billing cycle
            billing_cycle_counts = {}
            for cycle in BillingCycle:
                count_result = await self.db.execute(
                    select(func.count(Subscription.id))
                    .where(Subscription.billing_cycle == cycle.value)
                )
                count = count_result.scalar() or 0
                if count > 0:
                    billing_cycle_counts[cycle.value] = count
            
            # Recent subscriptions
            recent_subscriptions_result = await self.db.execute(
                select(Subscription)
                .order_by(desc(Subscription.created_at))
                .limit(5)
            )
            recent_subscriptions = recent_subscriptions_result.scalars().all()
            
            # Upcoming renewals (next 7 days)
            upcoming_renewals_result = await self.db.execute(
                select(Subscription)
                .where(
                    and_(
                        Subscription.next_billing_date <= datetime.utcnow() + timedelta(days=7),
                        Subscription.status == SubscriptionStatus.ACTIVE.value
                    )
                )
                .order_by(Subscription.next_billing_date)
                .limit(5)
            )
            upcoming_renewals = upcoming_renewals_result.scalars().all()
            
            # Failed payments (last 30 days)
            failed_payments_result = await self.db.execute(
                select(Payment)
                .where(
                    and_(
                        Payment.status == PaymentStatus.FAILED.value,
                        Payment.created_at >= datetime.utcnow() - timedelta(days=30)
                    )
                )
                .order_by(desc(Payment.created_at))
                .limit(5)
            )
            failed_payments = failed_payments_result.scalars().all()
            
            return {
                "status": "success",
                "data": {
                    "subscription_statistics": {
                        "total_subscriptions": total_subscriptions,
                        "active_subscriptions": active_subscriptions,
                        "trial_subscriptions": trial_subscriptions,
                        "cancelled_subscriptions": cancelled_subscriptions,
                        "expired_subscriptions": expired_subscriptions,
                        "monthly_recurring_revenue": float(monthly_recurring_revenue),
                        "annual_recurring_revenue": float(annual_recurring_revenue),
                        "average_revenue_per_user": float(average_revenue_per_user),
                        "churn_rate": 0.0  # TODO: Calculate actual churn rate
                    },
                    "customer_statistics": {
                        "total_customers": total_customers,
                        "active_customers": active_customers
                    },
                    "subscriptions_by_status": status_counts,
                    "subscriptions_by_billing_cycle": billing_cycle_counts,
                    "recent_subscriptions": [self._serialize_subscription(sub) for sub in recent_subscriptions],
                    "upcoming_renewals": [self._serialize_subscription(sub) for sub in upcoming_renewals],
                    "failed_payments": [self._serialize_payment(payment) for payment in failed_payments],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            print(f"Error getting subscription dashboard metrics: {e}")
            return {
                "status": "error",
                "message": str(e),
                "data": {
                    "subscription_statistics": {
                        "total_subscriptions": 0,
                        "active_subscriptions": 0,
                        "trial_subscriptions": 0,
                        "cancelled_subscriptions": 0,
                        "expired_subscriptions": 0,
                        "monthly_recurring_revenue": 0.0,
                        "annual_recurring_revenue": 0.0,
                        "average_revenue_per_user": 0.0,
                        "churn_rate": 0.0
                    },
                    "customer_statistics": {
                        "total_customers": 0,
                        "active_customers": 0
                    },
                    "subscriptions_by_status": {},
                    "subscriptions_by_billing_cycle": {},
                    "recent_subscriptions": [],
                    "upcoming_renewals": [],
                    "failed_payments": [],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

    async def get_subscription_analytics(self, period_days: int = 30) -> Dict:
        """Get subscription analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Subscription growth trends
            growth_trends = []
            for i in range(period_days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                day_subscriptions_result = await self.db.execute(
                    select(func.count(Subscription.id))
                    .where(
                        and_(
                            Subscription.created_at >= day_start,
                            Subscription.created_at < day_end
                        )
                    )
                )
                day_subscriptions = day_subscriptions_result.scalar() or 0
                
                growth_trends.append({
                    "date": day_start.date().isoformat(),
                    "new_subscriptions": day_subscriptions
                })
            
            # Revenue trends
            revenue_trends = []
            for i in range(0, period_days, 7):  # Weekly intervals
                week_start = start_date + timedelta(days=i)
                week_end = week_start + timedelta(days=7)
                
                week_revenue_result = await self.db.execute(
                    select(func.sum(Payment.amount))
                    .where(
                        and_(
                            Payment.created_at >= week_start,
                            Payment.created_at < week_end,
                            Payment.status == PaymentStatus.PAID.value
                        )
                    )
                )
                week_revenue = week_revenue_result.scalar() or 0.0
                
                revenue_trends.append({
                    "date": week_start.date().isoformat(),
                    "revenue": float(week_revenue)
                })
            
            # Churn analysis
            churn_analysis = []
            for i in range(0, period_days, 7):  # Weekly intervals
                week_start = start_date + timedelta(days=i)
                week_end = week_start + timedelta(days=7)
                
                week_churn_result = await self.db.execute(
                    select(func.count(Subscription.id))
                    .where(
                        and_(
                            Subscription.cancelled_at >= week_start,
                            Subscription.cancelled_at < week_end
                        )
                    )
                )
                week_churn = week_churn_result.scalar() or 0
                
                churn_analysis.append({
                    "date": week_start.date().isoformat(),
                    "churned_subscriptions": week_churn
                })
            
            # Plan performance
            plan_performance_result = await self.db.execute(
                select(
                    SubscriptionPlan.name,
                    func.count(Subscription.id).label('subscription_count'),
                    func.sum(Subscription.total_price).label('total_revenue')
                )
                .join(Subscription, SubscriptionPlan.id == Subscription.plan_id)
                .where(Subscription.created_at >= start_date)
                .group_by(SubscriptionPlan.id, SubscriptionPlan.name)
                .order_by(desc('subscription_count'))
            )
            plan_performance = [
                {
                    "plan_name": row.name,
                    "subscription_count": row.subscription_count,
                    "total_revenue": float(row.total_revenue or 0)
                }
                for row in plan_performance_result
            ]
            
            return {
                "period_days": period_days,
                "subscription_growth": growth_trends,
                "revenue_trends": revenue_trends,
                "churn_analysis": churn_analysis,
                "plan_performance": plan_performance,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting subscription analytics: {e}")
            return {
                "period_days": period_days,
                "subscription_growth": [],
                "revenue_trends": [],
                "churn_analysis": [],
                "plan_performance": [],
                "timestamp": datetime.utcnow().isoformat()
            }

    # Subscription Plan Management
    async def get_subscription_plans(
        self, 
        page: int = 1, 
        limit: int = 50,
        plan_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated subscription plans with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(SubscriptionPlan)
            
            # Apply filters
            filters = []
            if plan_type:
                filters.append(SubscriptionPlan.plan_type == plan_type)
            if is_active is not None:
                filters.append(SubscriptionPlan.is_active == is_active)
            if search:
                filters.append(
                    or_(
                        SubscriptionPlan.name.ilike(f"%{search}%"),
                        SubscriptionPlan.description.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(SubscriptionPlan.sort_order, desc(SubscriptionPlan.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            plans = result.scalars().all()
            
            return [self._serialize_subscription_plan(plan) for plan in plans]
        except Exception as e:
            print(f"Error getting subscription plans: {e}")
            return []

    async def create_subscription_plan(self, plan_data: SubscriptionPlanCreate, user_id: int) -> Dict:
        """Create a new subscription plan"""
        try:
            plan = SubscriptionPlan(
                plan_code=plan_data.plan_code,
                name=plan_data.name,
                description=plan_data.description,
                plan_type=plan_data.plan_type.value,
                billing_cycle=plan_data.billing_cycle.value,
                price=plan_data.price,
                currency=plan_data.currency,
                usage_type=plan_data.usage_type.value,
                usage_limit=plan_data.usage_limit,
                features=plan_data.features or [],
                trial_days=plan_data.trial_days,
                setup_fee=plan_data.setup_fee,
                is_popular=plan_data.is_popular,
                sort_order=plan_data.sort_order,
                plan_metadata=plan_data.plan_metadata,
                created_by=user_id
            )
            
            self.db.add(plan)
            await self.db.commit()
            await self.db.refresh(plan)
            
            return self._serialize_subscription_plan(plan)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating subscription plan: {e}")
            raise

    # Customer Management
    async def get_customers(
        self, 
        page: int = 1, 
        limit: int = 50,
        customer_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated customers with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Customer)
            
            # Apply filters
            filters = []
            if customer_type:
                filters.append(Customer.customer_type == customer_type)
            if status:
                filters.append(Customer.status == status)
            if search:
                filters.append(
                    or_(
                        Customer.first_name.ilike(f"%{search}%"),
                        Customer.last_name.ilike(f"%{search}%"),
                        Customer.email.ilike(f"%{search}%"),
                        Customer.company_name.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Customer.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            customers = result.scalars().all()
            
            return [self._serialize_customer(customer) for customer in customers]
        except Exception as e:
            print(f"Error getting customers: {e}")
            return []

    async def create_customer(self, customer_data: CustomerCreate, user_id: int) -> Dict:
        """Create a new customer"""
        try:
            customer = Customer(
                customer_code=customer_data.customer_code,
                first_name=customer_data.first_name,
                last_name=customer_data.last_name,
                email=customer_data.email,
                phone=customer_data.phone,
                company_name=customer_data.company_name,
                company_size=customer_data.company_size,
                industry=customer_data.industry,
                billing_address=customer_data.billing_address,
                shipping_address=customer_data.shipping_address,
                customer_type=customer_data.customer_type.value,
                tags=customer_data.tags or [],
                notes=customer_data.notes,
                created_by=user_id
            )
            
            self.db.add(customer)
            await self.db.commit()
            await self.db.refresh(customer)
            
            return self._serialize_customer(customer)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating customer: {e}")
            raise

    # Subscription Management
    async def get_subscriptions(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[str] = None,
        customer_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated subscriptions with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Subscription)
            
            # Apply filters
            filters = []
            if status:
                filters.append(Subscription.status == status)
            if customer_id:
                filters.append(Subscription.customer_id == customer_id)
            if search:
                filters.append(
                    or_(
                        Subscription.subscription_code.ilike(f"%{search}%"),
                        Customer.first_name.ilike(f"%{search}%"),
                        Customer.last_name.ilike(f"%{search}%"),
                        Customer.email.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Subscription.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            subscriptions = result.scalars().all()
            
            return [self._serialize_subscription(subscription) for subscription in subscriptions]
        except Exception as e:
            print(f"Error getting subscriptions: {e}")
            return []

    async def create_subscription(self, subscription_data: SubscriptionCreate, user_id: int) -> Dict:
        """Create a new subscription"""
        try:
            # Generate subscription code
            subscription_code = f"SUB-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            
            subscription = Subscription(
                subscription_code=subscription_code,
                customer_id=subscription_data.customer_id,
                plan_id=subscription_data.plan_id,
                billing_cycle=subscription_data.billing_cycle.value,
                base_price=subscription_data.base_price,
                total_price=subscription_data.base_price,
                currency=subscription_data.currency,
                trial_days=subscription_data.trial_days,
                start_date=subscription_data.start_date or datetime.utcnow(),
                notes=subscription_data.notes,
                subscription_metadata=subscription_data.subscription_metadata,
                created_by=user_id
            )
            
            self.db.add(subscription)
            await self.db.commit()
            await self.db.refresh(subscription)
            
            return self._serialize_subscription(subscription)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating subscription: {e}")
            raise

    # Payment Management
    async def get_payments(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[str] = None,
        customer_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated payments with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Payment)
            
            # Apply filters
            filters = []
            if status:
                filters.append(Payment.status == status)
            if customer_id:
                filters.append(Payment.customer_id == customer_id)
            if search:
                filters.append(
                    or_(
                        Payment.payment_code.ilike(f"%{search}%"),
                        Payment.payment_reference.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Payment.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            payments = result.scalars().all()
            
            return [self._serialize_payment(payment) for payment in payments]
        except Exception as e:
            print(f"Error getting payments: {e}")
            return []

    async def create_payment(self, payment_data: PaymentCreate, user_id: int) -> Dict:
        """Create a new payment"""
        try:
            # Generate payment code
            payment_code = f"PAY-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            
            payment = Payment(
                payment_code=payment_code,
                customer_id=payment_data.customer_id,
                subscription_id=payment_data.subscription_id,
                amount=payment_data.amount,
                currency=payment_data.currency,
                payment_method=payment_data.payment_method,
                payment_reference=payment_data.payment_reference,
                payment_date=payment_data.payment_date,
                due_date=payment_data.due_date,
                billing_period_start=payment_data.billing_period_start,
                billing_period_end=payment_data.billing_period_end,
                description=payment_data.description,
                notes=payment_data.notes,
                payment_metadata=payment_data.payment_metadata,
                created_by=user_id
            )
            
            self.db.add(payment)
            await self.db.commit()
            await self.db.refresh(payment)
            
            return self._serialize_payment(payment)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating payment: {e}")
            raise

    # Usage Record Management
    async def get_usage_records(
        self, 
        page: int = 1, 
        limit: int = 50,
        customer_id: Optional[int] = None,
        subscription_id: Optional[int] = None,
        feature_name: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated usage records with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(UsageRecord)
            
            # Apply filters
            filters = []
            if customer_id:
                filters.append(UsageRecord.customer_id == customer_id)
            if subscription_id:
                filters.append(UsageRecord.subscription_id == subscription_id)
            if feature_name:
                filters.append(UsageRecord.feature_name.ilike(f"%{feature_name}%"))
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(UsageRecord.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            usage_records = result.scalars().all()
            
            return [self._serialize_usage_record(usage_record) for usage_record in usage_records]
        except Exception as e:
            print(f"Error getting usage records: {e}")
            return []

    async def create_usage_record(self, usage_data: UsageRecordCreate, user_id: int) -> Dict:
        """Create a new usage record"""
        try:
            usage_record = UsageRecord(
                customer_id=usage_data.customer_id,
                subscription_id=usage_data.subscription_id,
                feature_name=usage_data.feature_name,
                usage_amount=usage_data.usage_amount,
                usage_unit=usage_data.usage_unit,
                usage_date=usage_data.usage_date or datetime.utcnow(),
                billing_period_start=usage_data.billing_period_start,
                billing_period_end=usage_data.billing_period_end,
                description=usage_data.description,
                usage_metadata=usage_data.usage_metadata
            )
            
            self.db.add(usage_record)
            await self.db.commit()
            await self.db.refresh(usage_record)
            
            return self._serialize_usage_record(usage_record)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating usage record: {e}")
            raise

    # Serialization methods
    def _serialize_subscription_plan(self, plan: SubscriptionPlan) -> Dict:
        """Serialize subscription plan to dict"""
        return {
            "id": plan.id,
            "plan_code": plan.plan_code,
            "name": plan.name,
            "description": plan.description,
            "plan_type": plan.plan_type,
            "billing_cycle": plan.billing_cycle,
            "price": float(plan.price) if plan.price else 0.0,
            "currency": plan.currency,
            "usage_type": plan.usage_type,
            "usage_limit": plan.usage_limit,
            "features": plan.features or [],
            "trial_days": plan.trial_days,
            "setup_fee": float(plan.setup_fee) if plan.setup_fee else 0.0,
            "is_active": plan.is_active,
            "is_popular": plan.is_popular,
            "sort_order": plan.sort_order,
            "plan_metadata": plan.plan_metadata,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
            "updated_at": plan.updated_at.isoformat() if plan.updated_at else None
        }

    def _serialize_customer(self, customer: Customer) -> Dict:
        """Serialize customer to dict"""
        return {
            "id": customer.id,
            "customer_code": customer.customer_code,
            "first_name": customer.first_name,
            "last_name": customer.last_name,
            "email": customer.email,
            "phone": customer.phone,
            "company_name": customer.company_name,
            "company_size": customer.company_size,
            "industry": customer.industry,
            "billing_address": customer.billing_address,
            "shipping_address": customer.shipping_address,
            "customer_type": customer.customer_type,
            "status": customer.status,
            "tags": customer.tags or [],
            "notes": customer.notes,
            "created_at": customer.created_at.isoformat() if customer.created_at else None,
            "updated_at": customer.updated_at.isoformat() if customer.updated_at else None
        }

    def _serialize_subscription(self, subscription: Subscription) -> Dict:
        """Serialize subscription to dict"""
        return {
            "id": subscription.id,
            "subscription_code": subscription.subscription_code,
            "customer_id": subscription.customer_id,
            "plan_id": subscription.plan_id,
            "status": subscription.status,
            "billing_cycle": subscription.billing_cycle,
            "base_price": float(subscription.base_price) if subscription.base_price else 0.0,
            "addon_price": float(subscription.addon_price) if subscription.addon_price else 0.0,
            "total_price": float(subscription.total_price) if subscription.total_price else 0.0,
            "currency": subscription.currency,
            "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
            "end_date": subscription.end_date.isoformat() if subscription.end_date else None,
            "trial_end_date": subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
            "next_billing_date": subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
            "cancelled_at": subscription.cancelled_at.isoformat() if subscription.cancelled_at else None,
            "trial_days": subscription.trial_days,
            "setup_fee_paid": subscription.setup_fee_paid,
            "current_usage": subscription.current_usage,
            "usage_limit": subscription.usage_limit,
            "notes": subscription.notes,
            "subscription_metadata": subscription.subscription_metadata,
            "created_at": subscription.created_at.isoformat() if subscription.created_at else None,
            "updated_at": subscription.updated_at.isoformat() if subscription.updated_at else None
        }

    def _serialize_payment(self, payment: Payment) -> Dict:
        """Serialize payment to dict"""
        return {
            "id": payment.id,
            "payment_code": payment.payment_code,
            "customer_id": payment.customer_id,
            "subscription_id": payment.subscription_id,
            "amount": float(payment.amount) if payment.amount else 0.0,
            "currency": payment.currency,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "payment_reference": payment.payment_reference,
            "payment_date": payment.payment_date.isoformat() if payment.payment_date else None,
            "due_date": payment.due_date.isoformat() if payment.due_date else None,
            "billing_period_start": payment.billing_period_start.isoformat() if payment.billing_period_start else None,
            "billing_period_end": payment.billing_period_end.isoformat() if payment.billing_period_end else None,
            "description": payment.description,
            "notes": payment.notes,
            "payment_metadata": payment.payment_metadata,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
            "updated_at": payment.updated_at.isoformat() if payment.updated_at else None
        }

    def _serialize_usage_record(self, usage_record: UsageRecord) -> Dict:
        """Serialize usage record to dict"""
        return {
            "id": usage_record.id,
            "customer_id": usage_record.customer_id,
            "subscription_id": usage_record.subscription_id,
            "feature_name": usage_record.feature_name,
            "usage_amount": usage_record.usage_amount,
            "usage_unit": usage_record.usage_unit,
            "usage_date": usage_record.usage_date.isoformat() if usage_record.usage_date else None,
            "billing_period_start": usage_record.billing_period_start.isoformat() if usage_record.billing_period_start else None,
            "billing_period_end": usage_record.billing_period_end.isoformat() if usage_record.billing_period_end else None,
            "description": usage_record.description,
            "usage_metadata": usage_record.usage_metadata,
            "created_at": usage_record.created_at.isoformat() if usage_record.created_at else None,
            "updated_at": usage_record.updated_at.isoformat() if usage_record.updated_at else None
        }
