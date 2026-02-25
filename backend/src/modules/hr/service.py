from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, case
from sqlalchemy.orm import selectinload
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta, date
from decimal import Decimal
import uuid

from .models import (
    Employee, Department, Position, PayrollRecord, PerformanceReview,
    LeaveRequest, TimeEntry, RecruitmentJob, JobApplication,
    TrainingProgram, TrainingEnrollment,
    EmployeeStatus, EmploymentType, PayrollStatus, PerformanceRating,
    LeaveStatus, LeaveType
)
from .schemas import (
    EmployeeCreate, EmployeeUpdate, DepartmentCreate,
    PayrollRecordCreate, PerformanceReviewCreate,
    LeaveRequestCreate, TimeEntryCreate,
    RecruitmentJobCreate, JobApplicationCreate,
    TrainingProgramCreate, TrainingEnrollmentCreate
)

class HRService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # Employee Management
    async def create_employee(self, employee_data: EmployeeCreate, user_id: int) -> Dict:
        """Create a new employee"""
        try:
            # Generate employee ID if not provided
            if not employee_data.employee_id:
                employee_data.employee_id = f"EMP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            employee = Employee(
                employee_id=employee_data.employee_id,
                first_name=employee_data.first_name,
                last_name=employee_data.last_name,
                email=employee_data.email,
                phone=employee_data.phone,
                date_of_birth=employee_data.date_of_birth,
                gender=employee_data.gender,
                marital_status=employee_data.marital_status,
                address_line1=employee_data.address_line1,
                address_line2=employee_data.address_line2,
                city=employee_data.city,
                state=employee_data.state,
                country=employee_data.country,
                postal_code=employee_data.postal_code,
                position=employee_data.position,
                department=employee_data.department,
                manager_id=employee_data.manager_id,
                employment_type=employee_data.employment_type,
                status=employee_data.status,
                hire_date=employee_data.hire_date,
                termination_date=employee_data.termination_date,
                probation_end_date=employee_data.probation_end_date,
                salary=employee_data.salary,
                hourly_rate=employee_data.hourly_rate,
                currency=employee_data.currency,
                emergency_contact_name=employee_data.emergency_contact_name,
                emergency_contact_phone=employee_data.emergency_contact_phone,
                emergency_contact_relationship=employee_data.emergency_contact_relationship,
                notes=employee_data.notes,
                employee_metadata=employee_data.employee_metadata,
                created_by=user_id
            )
            
            self.db.add(employee)
            await self.db.commit()
            await self.db.refresh(employee)
            
            return self._serialize_employee(employee)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating employee: {e}")
            raise
    
    async def get_employees(
        self, 
        page: int = 1, 
        limit: int = 50,
        department: Optional[str] = None,
        position: Optional[str] = None,
        status: Optional[EmployeeStatus] = None,
        employment_type: Optional[EmploymentType] = None,
        manager_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated employees with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Employee)
            
            # Apply filters
            filters = []
            if department:
                filters.append(Employee.department == department)
            if position:
                filters.append(Employee.position == position)
            if status:
                filters.append(Employee.status == status)
            if employment_type:
                filters.append(Employee.employment_type == employment_type)
            if manager_id:
                filters.append(Employee.manager_id == manager_id)
            if search:
                filters.append(
                    or_(
                        Employee.first_name.ilike(f"%{search}%"),
                        Employee.last_name.ilike(f"%{search}%"),
                        Employee.email.ilike(f"%{search}%"),
                        Employee.employee_id.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Employee.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            employees = result.scalars().all()
            
            return [self._serialize_employee(employee) for employee in employees]
        except Exception as e:
            print(f"Error getting employees: {e}")
            return []
    
    async def get_employee(self, employee_id: int) -> Optional[Dict]:
        """Get a specific employee by ID"""
        try:
            query = select(Employee).where(Employee.id == employee_id)
            result = await self.db.execute(query)
            employee = result.scalar_one_or_none()
            
            if employee:
                return self._serialize_employee(employee)
            return None
        except Exception as e:
            print(f"Error getting employee: {e}")
            return None
    
    async def update_employee(self, employee_id: int, employee_data: EmployeeUpdate) -> Optional[Dict]:
        """Update an employee"""
        try:
            employee = await self.db.get(Employee, employee_id)
            if not employee:
                return None
            
            # Update fields
            update_data = employee_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(employee, field, value)
            
            await self.db.commit()
            await self.db.refresh(employee)
            
            return self._serialize_employee(employee)
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating employee: {e}")
            return None
    
    # Department Management
    async def create_department(self, department_data: DepartmentCreate, user_id: int) -> Dict:
        """Create a new department"""
        try:
            department = Department(
                name=department_data.name,
                description=department_data.description,
                manager_id=department_data.manager_id,
                budget=department_data.budget,
                cost_center=department_data.cost_center,
                location=department_data.location,
                is_active=department_data.is_active,
                created_by=user_id
            )
            
            self.db.add(department)
            await self.db.commit()
            await self.db.refresh(department)
            
            return self._serialize_department(department)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating department: {e}")
            raise
    
    async def get_departments(self) -> List[Dict]:
        """Get all departments"""
        try:
            query = select(Department).where(Department.is_active == True).order_by(Department.name)
            result = await self.db.execute(query)
            departments = result.scalars().all()
            
            return [self._serialize_department(dept) for dept in departments]
        except Exception as e:
            print(f"Error getting departments: {e}")
            return []
    
    # Payroll Management
    async def create_payroll_record(self, payroll_data: PayrollRecordCreate, user_id: int) -> Dict:
        """Create a payroll record"""
        try:
            # Calculate totals
            gross_pay = (
                payroll_data.base_salary +
                payroll_data.overtime_amount +
                payroll_data.bonus +
                payroll_data.commission +
                payroll_data.other_earnings
            )
            
            total_deductions = (
                payroll_data.federal_tax +
                payroll_data.state_tax +
                payroll_data.social_security +
                payroll_data.medicare +
                payroll_data.health_insurance +
                payroll_data.retirement_401k +
                payroll_data.other_deductions
            )
            
            net_pay = gross_pay - total_deductions
            
            payroll_record = PayrollRecord(
                employee_id=payroll_data.employee_id,
                pay_period_start=payroll_data.pay_period_start,
                pay_period_end=payroll_data.pay_period_end,
                pay_date=payroll_data.pay_date,
                base_salary=payroll_data.base_salary,
                overtime_hours=payroll_data.overtime_hours,
                overtime_rate=payroll_data.overtime_rate,
                overtime_amount=payroll_data.overtime_amount,
                bonus=payroll_data.bonus,
                commission=payroll_data.commission,
                other_earnings=payroll_data.other_earnings,
                gross_pay=gross_pay,
                federal_tax=payroll_data.federal_tax,
                state_tax=payroll_data.state_tax,
                social_security=payroll_data.social_security,
                medicare=payroll_data.medicare,
                health_insurance=payroll_data.health_insurance,
                retirement_401k=payroll_data.retirement_401k,
                other_deductions=payroll_data.other_deductions,
                total_deductions=total_deductions,
                net_pay=net_pay,
                status=PayrollStatus.PENDING,
                notes=payroll_data.notes,
                metadata=payroll_data.metadata
            )
            
            self.db.add(payroll_record)
            await self.db.commit()
            await self.db.refresh(payroll_record)
            
            return self._serialize_payroll_record(payroll_record)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating payroll record: {e}")
            raise
    
    async def get_payroll_records(
        self, 
        page: int = 1, 
        limit: int = 50,
        employee_id: Optional[int] = None,
        department: Optional[str] = None,
        pay_period_start: Optional[date] = None,
        pay_period_end: Optional[date] = None,
        status: Optional[PayrollStatus] = None
    ) -> List[Dict]:
        """Get paginated payroll records with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(PayrollRecord)
            
            # Apply filters
            filters = []
            if employee_id:
                filters.append(PayrollRecord.employee_id == employee_id)
            if pay_period_start:
                filters.append(PayrollRecord.pay_period_start >= pay_period_start)
            if pay_period_end:
                filters.append(PayrollRecord.pay_period_end <= pay_period_end)
            if status:
                filters.append(PayrollRecord.status == status)
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(PayrollRecord.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            payroll_records = result.scalars().all()
            
            return [self._serialize_payroll_record(record) for record in payroll_records]
        except Exception as e:
            print(f"Error getting payroll records: {e}")
            return []
    
    # Leave Management
    async def create_leave_request(self, leave_data: LeaveRequestCreate) -> Dict:
        """Create a leave request"""
        try:
            leave_request = LeaveRequest(
                employee_id=leave_data.employee_id,
                leave_type=leave_data.leave_type,
                start_date=leave_data.start_date,
                end_date=leave_data.end_date,
                total_days=leave_data.total_days,
                reason=leave_data.reason,
                status=LeaveStatus.PENDING,
                notes=leave_data.notes,
                metadata=leave_data.metadata
            )
            
            self.db.add(leave_request)
            await self.db.commit()
            await self.db.refresh(leave_request)
            
            return self._serialize_leave_request(leave_request)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating leave request: {e}")
            raise
    
    async def get_leave_requests(
        self, 
        page: int = 1, 
        limit: int = 50,
        employee_id: Optional[int] = None,
        leave_type: Optional[LeaveType] = None,
        status: Optional[LeaveStatus] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """Get paginated leave requests with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(LeaveRequest)
            
            # Apply filters
            filters = []
            if employee_id:
                filters.append(LeaveRequest.employee_id == employee_id)
            if leave_type:
                filters.append(LeaveRequest.leave_type == leave_type)
            if status:
                filters.append(LeaveRequest.status == status)
            if start_date:
                filters.append(LeaveRequest.start_date >= start_date)
            if end_date:
                filters.append(LeaveRequest.end_date <= end_date)
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(LeaveRequest.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            leave_requests = result.scalars().all()
            
            return [self._serialize_leave_request(request) for request in leave_requests]
        except Exception as e:
            print(f"Error getting leave requests: {e}")
            return []
    
    async def approve_leave_request(self, leave_request_id: int, approver_id: int, approved: bool = True, rejection_reason: Optional[str] = None) -> bool:
        """Approve or reject a leave request"""
        try:
            leave_request = await self.db.get(LeaveRequest, leave_request_id)
            if not leave_request:
                return False
            
            if approved:
                leave_request.status = LeaveStatus.APPROVED
                leave_request.approved_by = approver_id
                leave_request.approved_at = datetime.utcnow()
            else:
                leave_request.status = LeaveStatus.REJECTED
                leave_request.approved_by = approver_id
                leave_request.approved_at = datetime.utcnow()
                leave_request.rejection_reason = rejection_reason
            
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating leave request: {e}")
            return False
    
    # Analytics
    async def get_hr_analytics(self, period_days: int = 30) -> Dict:
        """Get HR analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get employee counts
            total_employees_result = await self.db.execute(select(func.count(Employee.id)))
            total_employees = total_employees_result.scalar() or 0
            
            active_employees_result = await self.db.execute(
                select(func.count(Employee.id))
                .where(Employee.status == EmployeeStatus.ACTIVE)
            )
            active_employees = active_employees_result.scalar() or 0
            
            new_hires_result = await self.db.execute(
                select(func.count(Employee.id))
                .where(Employee.hire_date >= start_date.date())
            )
            new_hires = new_hires_result.scalar() or 0
            
            terminations_result = await self.db.execute(
                select(func.count(Employee.id))
                .where(
                    and_(
                        Employee.termination_date >= start_date.date(),
                        Employee.status == EmployeeStatus.TERMINATED
                    )
                )
            )
            terminations = terminations_result.scalar() or 0
            
            # Calculate turnover rate
            turnover_rate = (terminations / active_employees * 100) if active_employees > 0 else 0
            
            # Get average salary
            avg_salary_result = await self.db.execute(
                select(func.avg(Employee.salary))
                .where(
                    and_(
                        Employee.status == EmployeeStatus.ACTIVE,
                        Employee.salary.isnot(None)
                    )
                )
            )
            average_salary = float(avg_salary_result.scalar() or 0)
            
            # Get total payroll cost
            total_payroll_result = await self.db.execute(
                select(func.sum(PayrollRecord.gross_pay))
                .where(PayrollRecord.created_at >= start_date)
            )
            total_payroll_cost = float(total_payroll_result.scalar() or 0)
            
            # Get pending leave requests
            pending_leave_result = await self.db.execute(
                select(func.count(LeaveRequest.id))
                .where(LeaveRequest.status == LeaveStatus.PENDING)
            )
            pending_leave_requests = pending_leave_result.scalar() or 0
            
            # Get open job positions
            open_jobs_result = await self.db.execute(
                select(func.count(RecruitmentJob.id))
                .where(RecruitmentJob.status == "open")
            )
            open_job_positions = open_jobs_result.scalar() or 0
            
            # Get training completion rate
            total_enrollments_result = await self.db.execute(select(func.count(TrainingEnrollment.id)))
            total_enrollments = total_enrollments_result.scalar() or 0
            
            completed_trainings_result = await self.db.execute(
                select(func.count(TrainingEnrollment.id))
                .where(TrainingEnrollment.status == "completed")
            )
            completed_trainings = completed_trainings_result.scalar() or 0
            
            training_completion_rate = (completed_trainings / total_enrollments * 100) if total_enrollments > 0 else 0
            
            # Get performance review completion rate
            total_reviews_result = await self.db.execute(select(func.count(PerformanceReview.id)))
            total_reviews = total_reviews_result.scalar() or 0
            
            performance_review_completion_rate = (total_reviews / active_employees * 100) if active_employees > 0 else 0
            
            return {
                "period_days": period_days,
                "total_employees": total_employees,
                "active_employees": active_employees,
                "new_hires": new_hires,
                "terminations": terminations,
                "turnover_rate": round(turnover_rate, 2),
                "average_salary": average_salary,
                "total_payroll_cost": total_payroll_cost,
                "pending_leave_requests": pending_leave_requests,
                "open_job_positions": open_job_positions,
                "training_completion_rate": round(training_completion_rate, 2),
                "performance_review_completion_rate": round(performance_review_completion_rate, 2)
            }
        except Exception as e:
            print(f"Error getting HR analytics: {e}")
            return {
                "period_days": period_days,
                "total_employees": 0,
                "active_employees": 0,
                "new_hires": 0,
                "terminations": 0,
                "turnover_rate": 0.0,
                "average_salary": 0.0,
                "total_payroll_cost": 0.0,
                "pending_leave_requests": 0,
                "open_job_positions": 0,
                "training_completion_rate": 0.0,
                "performance_review_completion_rate": 0.0
            }
    
    # Serialization methods
    def _serialize_employee(self, employee: Employee) -> Dict:
        """Serialize employee to dict"""
        return {
            "id": employee.id,
            "employee_id": employee.employee_id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "phone": employee.phone,
            "date_of_birth": employee.date_of_birth.isoformat() if employee.date_of_birth else None,
            "gender": employee.gender,
            "marital_status": employee.marital_status,
            "address_line1": employee.address_line1,
            "address_line2": employee.address_line2,
            "city": employee.city,
            "state": employee.state,
            "country": employee.country,
            "postal_code": employee.postal_code,
            "position": employee.position,
            "department": employee.department,
            "manager_id": employee.manager_id,
            "employment_type": employee.employment_type.value if employee.employment_type else None,
            "status": employee.status.value if employee.status else None,
            "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
            "termination_date": employee.termination_date.isoformat() if employee.termination_date else None,
            "probation_end_date": employee.probation_end_date.isoformat() if employee.probation_end_date else None,
            "salary": float(employee.salary) if employee.salary else None,
            "hourly_rate": float(employee.hourly_rate) if employee.hourly_rate else None,
            "currency": employee.currency,
            "emergency_contact_name": employee.emergency_contact_name,
            "emergency_contact_phone": employee.emergency_contact_phone,
            "emergency_contact_relationship": employee.emergency_contact_relationship,
            "notes": employee.notes,
            "employee_metadata": employee.employee_metadata,
            "created_by": employee.created_by,
            "created_at": employee.created_at.isoformat() if employee.created_at else None,
            "updated_at": employee.updated_at.isoformat() if employee.updated_at else None
        }
    
    def _serialize_department(self, department: Department) -> Dict:
        """Serialize department to dict"""
        return {
            "id": department.id,
            "name": department.name,
            "description": department.description,
            "manager_id": department.manager_id,
            "budget": float(department.budget) if department.budget else None,
            "cost_center": department.cost_center,
            "location": department.location,
            "is_active": department.is_active,
            "created_by": department.created_by,
            "created_at": department.created_at.isoformat() if department.created_at else None,
            "updated_at": department.updated_at.isoformat() if department.updated_at else None
        }
    
    def _serialize_payroll_record(self, payroll_record: PayrollRecord) -> Dict:
        """Serialize payroll record to dict"""
        return {
            "id": payroll_record.id,
            "employee_id": payroll_record.employee_id,
            "pay_period_start": payroll_record.pay_period_start.isoformat() if payroll_record.pay_period_start else None,
            "pay_period_end": payroll_record.pay_period_end.isoformat() if payroll_record.pay_period_end else None,
            "pay_date": payroll_record.pay_date.isoformat() if payroll_record.pay_date else None,
            "base_salary": float(payroll_record.base_salary) if payroll_record.base_salary else None,
            "overtime_hours": float(payroll_record.overtime_hours) if payroll_record.overtime_hours else None,
            "overtime_rate": float(payroll_record.overtime_rate) if payroll_record.overtime_rate else None,
            "overtime_amount": float(payroll_record.overtime_amount) if payroll_record.overtime_amount else None,
            "bonus": float(payroll_record.bonus) if payroll_record.bonus else None,
            "commission": float(payroll_record.commission) if payroll_record.commission else None,
            "other_earnings": float(payroll_record.other_earnings) if payroll_record.other_earnings else None,
            "gross_pay": float(payroll_record.gross_pay) if payroll_record.gross_pay else None,
            "federal_tax": float(payroll_record.federal_tax) if payroll_record.federal_tax else None,
            "state_tax": float(payroll_record.state_tax) if payroll_record.state_tax else None,
            "social_security": float(payroll_record.social_security) if payroll_record.social_security else None,
            "medicare": float(payroll_record.medicare) if payroll_record.medicare else None,
            "health_insurance": float(payroll_record.health_insurance) if payroll_record.health_insurance else None,
            "retirement_401k": float(payroll_record.retirement_401k) if payroll_record.retirement_401k else None,
            "other_deductions": float(payroll_record.other_deductions) if payroll_record.other_deductions else None,
            "total_deductions": float(payroll_record.total_deductions) if payroll_record.total_deductions else None,
            "net_pay": float(payroll_record.net_pay) if payroll_record.net_pay else None,
            "status": payroll_record.status.value if payroll_record.status else None,
            "processed_at": payroll_record.processed_at.isoformat() if payroll_record.processed_at else None,
            "processed_by": payroll_record.processed_by,
            "notes": payroll_record.notes,
            "metadata": payroll_record.metadata,
            "created_at": payroll_record.created_at.isoformat() if payroll_record.created_at else None,
            "updated_at": payroll_record.updated_at.isoformat() if payroll_record.updated_at else None
        }
    
    def _serialize_leave_request(self, leave_request: LeaveRequest) -> Dict:
        """Serialize leave request to dict"""
        return {
            "id": leave_request.id,
            "employee_id": leave_request.employee_id,
            "leave_type": leave_request.leave_type.value if leave_request.leave_type else None,
            "start_date": leave_request.start_date.isoformat() if leave_request.start_date else None,
            "end_date": leave_request.end_date.isoformat() if leave_request.end_date else None,
            "total_days": float(leave_request.total_days) if leave_request.total_days else None,
            "reason": leave_request.reason,
            "status": leave_request.status.value if leave_request.status else None,
            "approved_by": leave_request.approved_by,
            "approved_at": leave_request.approved_at.isoformat() if leave_request.approved_at else None,
            "rejection_reason": leave_request.rejection_reason,
            "notes": leave_request.notes,
            "metadata": leave_request.metadata,
            "created_at": leave_request.created_at.isoformat() if leave_request.created_at else None,
            "updated_at": leave_request.updated_at.isoformat() if leave_request.updated_at else None
        }
