from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from sqlalchemy.orm import selectinload
from typing import Dict, List, Optional
from datetime import date, datetime, timedelta
import uuid

from .models import (
    Project, ProjectTask, ProjectMilestone, ProjectResource,
    ProjectTimeEntry, ProjectComment, ProjectDocument,
    ProjectStatus, TaskStatus, TaskPriority, ProjectType
)
from .schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskResponse,
    ProjectMilestoneCreate, ProjectMilestoneUpdate, ProjectMilestoneResponse,
    ProjectResourceCreate, ProjectResourceUpdate, ProjectResourceResponse,
    ProjectTimeEntryCreate, ProjectTimeEntryUpdate, ProjectTimeEntryResponse,
    ProjectCommentCreate, ProjectCommentResponse,
    ProjectDocumentCreate, ProjectDocumentResponse,
    ProjectDashboardMetrics, ProjectAnalytics
)

class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(self) -> Dict:
        """Get key project metrics for the dashboard."""
        metrics_30d = await self.get_project_analytics(period_days=30)
        metrics_7d = await self.get_project_analytics(period_days=7)

        # Fetch recent projects
        recent_projects_result = await self.db.execute(
            select(Project)
            .order_by(desc(Project.created_at))
            .limit(5)
        )
        recent_projects = recent_projects_result.scalars().all()

        # Fetch recent tasks
        recent_tasks_result = await self.db.execute(
            select(ProjectTask)
            .order_by(desc(ProjectTask.created_at))
            .limit(5)
        )
        recent_tasks = recent_tasks_result.scalars().all()

        return {
            "status": "success",
            "data": {
                "metrics_30d": metrics_30d,
                "metrics_7d": metrics_7d,
                "recent_projects": [self._serialize_project(p) for p in recent_projects],
                "recent_tasks": [self._serialize_task(t) for t in recent_tasks],
                "timestamp": datetime.utcnow().isoformat()
            }
        }

    async def get_project_analytics(self, period_days: int = 30) -> Dict:
        """Get project analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get project counts
            total_projects_result = await self.db.execute(select(func.count(Project.id)))
            total_projects = total_projects_result.scalar() or 0
            
            active_projects_result = await self.db.execute(
                select(func.count(Project.id))
                .where(Project.status == ProjectStatus.ACTIVE)
            )
            active_projects = active_projects_result.scalar() or 0
            
            completed_projects_result = await self.db.execute(
                select(func.count(Project.id))
                .where(
                    and_(
                        Project.status == ProjectStatus.COMPLETED,
                        Project.actual_end_date >= start_date.date()
                    )
                )
            )
            completed_projects = completed_projects_result.scalar() or 0
            
            # Get task counts
            total_tasks_result = await self.db.execute(select(func.count(ProjectTask.id)))
            total_tasks = total_tasks_result.scalar() or 0
            
            completed_tasks_result = await self.db.execute(
                select(func.count(ProjectTask.id))
                .where(
                    and_(
                        ProjectTask.status == TaskStatus.COMPLETED,
                        ProjectTask.completed_date >= start_date.date()
                    )
                )
            )
            completed_tasks = completed_tasks_result.scalar() or 0
            
            # Get budget information
            total_budget_result = await self.db.execute(
                select(func.sum(Project.budget))
                .where(Project.status.in_([ProjectStatus.ACTIVE, ProjectStatus.PLANNING]))
            )
            total_budget = total_budget_result.scalar() or 0.0
            
            actual_cost_result = await self.db.execute(
                select(func.sum(Project.actual_cost))
                .where(Project.status.in_([ProjectStatus.ACTIVE, ProjectStatus.COMPLETED]))
            )
            actual_cost = actual_cost_result.scalar() or 0.0
            
            # Get time tracking
            hours_logged_result = await self.db.execute(
                select(func.sum(ProjectTimeEntry.duration_hours))
                .where(ProjectTimeEntry.date >= start_date.date())
            )
            hours_logged = hours_logged_result.scalar() or 0.0
            
            # Calculate budget utilization
            budget_utilization = (actual_cost / total_budget * 100) if total_budget > 0 else 0
            
            return {
                "period_days": period_days,
                "total_projects": total_projects,
                "active_projects": active_projects,
                "completed_projects": completed_projects,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "total_budget": float(total_budget),
                "actual_cost": float(actual_cost),
                "hours_logged": float(hours_logged),
                "budget_utilization": float(budget_utilization),
                "projects_completed": completed_projects,
                "tasks_completed": completed_tasks,
                "budget_variance": float(actual_cost - total_budget),
                "timeline_variance": 0.0,  # Placeholder
                "resource_utilization": 0.0,  # Placeholder
                "team_performance": 0.0,  # Placeholder
                "client_satisfaction": None,  # Placeholder
            }
        except Exception as e:
            print(f"Error getting project analytics: {e}")
            return {
                "period_days": period_days,
                "total_projects": 0,
                "active_projects": 0,
                "completed_projects": 0,
                "total_tasks": 0,
                "completed_tasks": 0,
                "total_budget": 0.0,
                "actual_cost": 0.0,
                "hours_logged": 0.0,
                "budget_utilization": 0.0,
                "projects_completed": 0,
                "tasks_completed": 0,
                "budget_variance": 0.0,
                "timeline_variance": 0.0,
                "resource_utilization": 0.0,
                "team_performance": 0.0,
                "client_satisfaction": None,
            }

    # Project Management
    async def get_projects(
        self, 
        page: int = 1, 
        limit: int = 50,
        status: Optional[ProjectStatus] = None,
        project_type: Optional[ProjectType] = None,
        project_manager_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated projects with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Project)
            
            # Apply filters
            filters = []
            if status:
                filters.append(Project.status == status)
            if project_type:
                filters.append(Project.project_type == project_type)
            if project_manager_id:
                filters.append(Project.project_manager_id == project_manager_id)
            if search:
                filters.append(
                    or_(
                        Project.name.ilike(f"%{search}%"),
                        Project.project_code.ilike(f"%{search}%"),
                        Project.description.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Project.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            projects = result.scalars().all()
            
            return [self._serialize_project(project) for project in projects]
        except Exception as e:
            print(f"Error getting projects: {e}")
            return []

    async def create_project(self, project_data: ProjectCreate, user_id: int) -> Dict:
        """Create a new project"""
        try:
            project = Project(
                project_code=project_data.project_code,
                name=project_data.name,
                description=project_data.description,
                project_type=project_data.project_type,
                status=project_data.status,
                project_manager_id=project_data.project_manager_id,
                client_id=project_data.client_id,
                start_date=project_data.start_date,
                end_date=project_data.end_date,
                budget=project_data.budget,
                currency=project_data.currency,
                tags=project_data.tags,
                project_metadata=project_data.project_metadata,
                notes=project_data.notes,
                created_by=user_id
            )
            
            self.db.add(project)
            await self.db.commit()
            await self.db.refresh(project)
            
            return self._serialize_project(project)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating project: {e}")
            raise

    async def get_project_by_id(self, project_id: int) -> Optional[Dict]:
        """Get project by ID"""
        try:
            result = await self.db.execute(
                select(Project)
                .where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()
            
            if project:
                return self._serialize_project(project)
            return None
        except Exception as e:
            print(f"Error getting project: {e}")
            return None

    async def update_project(self, project_id: int, project_data: ProjectUpdate, user_id: int) -> Optional[Dict]:
        """Update project"""
        try:
            result = await self.db.execute(
                select(Project)
                .where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()
            
            if not project:
                return None
            
            # Update fields
            update_data = project_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(project, field, value)
            
            project.updated_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(project)
            
            return self._serialize_project(project)
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating project: {e}")
            raise

    async def delete_project(self, project_id: int) -> bool:
        """Delete project"""
        try:
            result = await self.db.execute(
                select(Project)
                .where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()
            
            if not project:
                return False
            
            await self.db.delete(project)
            await self.db.commit()
            
            return True
        except Exception as e:
            await self.db.rollback()
            print(f"Error deleting project: {e}")
            raise

    # Task Management
    async def get_tasks(
        self, 
        project_id: Optional[int] = None,
        page: int = 1, 
        limit: int = 50,
        status: Optional[TaskStatus] = None,
        assigned_to_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """Get paginated tasks with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(ProjectTask)
            
            # Apply filters
            filters = []
            if project_id:
                filters.append(ProjectTask.project_id == project_id)
            if status:
                filters.append(ProjectTask.status == status)
            if assigned_to_id:
                filters.append(ProjectTask.assigned_to_id == assigned_to_id)
            if search:
                filters.append(
                    or_(
                        ProjectTask.title.ilike(f"%{search}%"),
                        ProjectTask.task_code.ilike(f"%{search}%"),
                        ProjectTask.description.ilike(f"%{search}%")
                    )
                )
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(ProjectTask.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            tasks = result.scalars().all()
            
            return [self._serialize_task(task) for task in tasks]
        except Exception as e:
            print(f"Error getting tasks: {e}")
            return []

    async def create_task(self, task_data: ProjectTaskCreate, user_id: int) -> Dict:
        """Create a new task"""
        try:
            task = ProjectTask(
                project_id=task_data.project_id,
                task_code=task_data.task_code,
                title=task_data.title,
                description=task_data.description,
                status=task_data.status,
                priority=task_data.priority,
                assigned_to_id=task_data.assigned_to_id,
                assigned_by_id=task_data.assigned_by_id,
                due_date=task_data.due_date,
                start_date=task_data.start_date,
                estimated_hours=task_data.estimated_hours,
                depends_on_task_id=task_data.depends_on_task_id,
                tags=task_data.tags,
                task_metadata=task_data.task_metadata,
                notes=task_data.notes,
                created_by=user_id
            )
            
            self.db.add(task)
            await self.db.commit()
            await self.db.refresh(task)
            
            return self._serialize_task(task)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating task: {e}")
            raise

    async def update_task(self, task_id: int, task_data: ProjectTaskUpdate, user_id: int) -> Optional[Dict]:
        """Update task"""
        try:
            result = await self.db.execute(
                select(ProjectTask)
                .where(ProjectTask.id == task_id)
            )
            task = result.scalar_one_or_none()
            
            if not task:
                return None
            
            # Update fields
            update_data = task_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(task, field, value)
            
            task.updated_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(task)
            
            return self._serialize_task(task)
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating task: {e}")
            raise

    # Time Entry Management
    async def get_time_entries(
        self, 
        project_id: Optional[int] = None,
        task_id: Optional[int] = None,
        employee_id: Optional[int] = None,
        page: int = 1, 
        limit: int = 50
    ) -> List[Dict]:
        """Get paginated time entries with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(ProjectTimeEntry)
            
            # Apply filters
            filters = []
            if project_id:
                filters.append(ProjectTimeEntry.project_id == project_id)
            if task_id:
                filters.append(ProjectTimeEntry.task_id == task_id)
            if employee_id:
                filters.append(ProjectTimeEntry.employee_id == employee_id)
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(ProjectTimeEntry.date)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            time_entries = result.scalars().all()
            
            return [self._serialize_time_entry(entry) for entry in time_entries]
        except Exception as e:
            print(f"Error getting time entries: {e}")
            return []

    async def create_time_entry(self, time_entry_data: ProjectTimeEntryCreate, user_id: int) -> Dict:
        """Create a new time entry"""
        try:
            # Calculate total amount if hourly rate is provided
            total_amount = None
            if time_entry_data.hourly_rate and time_entry_data.duration_hours:
                total_amount = time_entry_data.hourly_rate * time_entry_data.duration_hours
            
            time_entry = ProjectTimeEntry(
                project_id=time_entry_data.project_id,
                task_id=time_entry_data.task_id,
                employee_id=time_entry_data.employee_id,
                date=time_entry_data.date,
                start_time=time_entry_data.start_time,
                end_time=time_entry_data.end_time,
                duration_hours=time_entry_data.duration_hours,
                description=time_entry_data.description,
                billable=time_entry_data.billable,
                hourly_rate=time_entry_data.hourly_rate,
                total_amount=total_amount,
                tags=time_entry_data.tags,
                time_entry_metadata=time_entry_data.time_entry_metadata,
                notes=time_entry_data.notes,
                created_by=user_id
            )
            
            self.db.add(time_entry)
            await self.db.commit()
            await self.db.refresh(time_entry)
            
            return self._serialize_time_entry(time_entry)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating time entry: {e}")
            raise

    # Serialization methods
    def _serialize_project(self, project: Project) -> Dict:
        """Serialize project to dict"""
        return {
            "id": project.id,
            "project_code": project.project_code,
            "name": project.name,
            "description": project.description,
            "project_type": project.project_type.value if project.project_type else None,
            "status": project.status.value if project.status else None,
            "project_manager_id": project.project_manager_id,
            "client_id": project.client_id,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "actual_start_date": project.actual_start_date.isoformat() if project.actual_start_date else None,
            "actual_end_date": project.actual_end_date.isoformat() if project.actual_end_date else None,
            "budget": float(project.budget) if project.budget else None,
            "actual_cost": float(project.actual_cost) if project.actual_cost else None,
            "currency": project.currency,
            "progress_percentage": float(project.progress_percentage) if project.progress_percentage else None,
            "tags": project.tags,
            "project_metadata": project.project_metadata,
            "notes": project.notes,
            "created_by": project.created_by,
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "updated_at": project.updated_at.isoformat() if project.updated_at else None
        }

    def _serialize_task(self, task: ProjectTask) -> Dict:
        """Serialize task to dict"""
        return {
            "id": task.id,
            "project_id": task.project_id,
            "task_code": task.task_code,
            "title": task.title,
            "description": task.description,
            "status": task.status.value if task.status else None,
            "priority": task.priority.value if task.priority else None,
            "assigned_to_id": task.assigned_to_id,
            "assigned_by_id": task.assigned_by_id,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "start_date": task.start_date.isoformat() if task.start_date else None,
            "completed_date": task.completed_date.isoformat() if task.completed_date else None,
            "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
            "actual_hours": float(task.actual_hours) if task.actual_hours else None,
            "depends_on_task_id": task.depends_on_task_id,
            "tags": task.tags,
            "task_metadata": task.task_metadata,
            "notes": task.notes,
            "created_by": task.created_by,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None
        }

    def _serialize_time_entry(self, time_entry: ProjectTimeEntry) -> Dict:
        """Serialize time entry to dict"""
        return {
            "id": time_entry.id,
            "project_id": time_entry.project_id,
            "task_id": time_entry.task_id,
            "employee_id": time_entry.employee_id,
            "date": time_entry.date.isoformat() if time_entry.date else None,
            "start_time": time_entry.start_time.isoformat() if time_entry.start_time else None,
            "end_time": time_entry.end_time.isoformat() if time_entry.end_time else None,
            "duration_hours": float(time_entry.duration_hours) if time_entry.duration_hours else None,
            "description": time_entry.description,
            "billable": time_entry.billable,
            "hourly_rate": float(time_entry.hourly_rate) if time_entry.hourly_rate else None,
            "total_amount": float(time_entry.total_amount) if time_entry.total_amount else None,
            "approved_by_id": time_entry.approved_by_id,
            "approved_at": time_entry.approved_at.isoformat() if time_entry.approved_at else None,
            "is_approved": time_entry.is_approved,
            "tags": time_entry.tags,
            "time_entry_metadata": time_entry.time_entry_metadata,
            "notes": time_entry.notes,
            "created_by": time_entry.created_by,
            "created_at": time_entry.created_at.isoformat() if time_entry.created_at else None,
            "updated_at": time_entry.updated_at.isoformat() if time_entry.updated_at else None
        }



