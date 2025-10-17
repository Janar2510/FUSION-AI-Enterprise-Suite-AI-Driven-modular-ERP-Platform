from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import date, datetime

from ...core.database import get_async_session
from .service import ProjectService
from .schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskResponse,
    ProjectMilestoneCreate, ProjectMilestoneUpdate, ProjectMilestoneResponse,
    ProjectResourceCreate, ProjectResourceUpdate, ProjectResourceResponse,
    ProjectTimeEntryCreate, ProjectTimeEntryUpdate, ProjectTimeEntryResponse,
    ProjectCommentCreate, ProjectCommentResponse,
    ProjectDocumentCreate, ProjectDocumentResponse,
    ProjectStatus, TaskStatus, TaskPriority, ProjectType
)

router = APIRouter()

# Dashboard and Analytics
@router.get("/dashboard")
async def get_project_dashboard(
    db: AsyncSession = Depends(get_async_session)
):
    """Get project dashboard metrics"""
    try:
        service = ProjectService(db)
        return await service.get_dashboard_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_project_analytics(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_async_session)
):
    """Get project analytics"""
    try:
        service = ProjectService(db)
        analytics = await service.get_project_analytics(period_days)
        return {
            "status": "success",
            "data": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Project Management
@router.get("/projects")
async def get_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[ProjectStatus] = None,
    project_type: Optional[ProjectType] = None,
    project_manager_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated projects with filters"""
    try:
        service = ProjectService(db)
        projects = await service.get_projects(
            page=page,
            limit=limit,
            status=status,
            project_type=project_type,
            project_manager_id=project_manager_id,
            search=search
        )
        return {
            "status": "success",
            "data": projects,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(projects)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects")
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new project"""
    try:
        service = ProjectService(db)
        project = await service.create_project(project_data, user_id=1)  # TODO: Get from auth
        return {
            "status": "success",
            "data": project
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{project_id}")
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get project by ID"""
    try:
        service = ProjectService(db)
        project = await service.get_project_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return {
            "status": "success",
            "data": project
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/projects/{project_id}")
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update project"""
    try:
        service = ProjectService(db)
        project = await service.update_project(project_id, project_data, user_id=1)  # TODO: Get from auth
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return {
            "status": "success",
            "data": project
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete project"""
    try:
        service = ProjectService(db)
        success = await service.delete_project(project_id)
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")
        return {
            "status": "success",
            "message": "Project deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Task Management
@router.get("/tasks")
async def get_tasks(
    project_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[TaskStatus] = None,
    assigned_to_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated tasks with filters"""
    try:
        service = ProjectService(db)
        tasks = await service.get_tasks(
            project_id=project_id,
            page=page,
            limit=limit,
            status=status,
            assigned_to_id=assigned_to_id,
            search=search
        )
        return {
            "status": "success",
            "data": tasks,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(tasks)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks")
async def create_task(
    task_data: ProjectTaskCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new task"""
    try:
        service = ProjectService(db)
        task = await service.create_task(task_data, user_id=1)  # TODO: Get from auth
        return {
            "status": "success",
            "data": task
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/{task_id}")
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get task by ID"""
    try:
        service = ProjectService(db)
        # This would need to be implemented in the service
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tasks/{task_id}")
async def update_task(
    task_id: int,
    task_data: ProjectTaskUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update task"""
    try:
        service = ProjectService(db)
        task = await service.update_task(task_id, task_data, user_id=1)  # TODO: Get from auth
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return {
            "status": "success",
            "data": task
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete task"""
    try:
        # This would need to be implemented in the service
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Time Entry Management
@router.get("/time-entries")
async def get_time_entries(
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated time entries with filters"""
    try:
        service = ProjectService(db)
        time_entries = await service.get_time_entries(
            project_id=project_id,
            task_id=task_id,
            employee_id=employee_id,
            page=page,
            limit=limit
        )
        return {
            "status": "success",
            "data": time_entries,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(time_entries)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/time-entries")
async def create_time_entry(
    time_entry_data: ProjectTimeEntryCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new time entry"""
    try:
        service = ProjectService(db)
        time_entry = await service.create_time_entry(time_entry_data, user_id=1)  # TODO: Get from auth
        return {
            "status": "success",
            "data": time_entry
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/time-entries/{time_entry_id}")
async def get_time_entry(
    time_entry_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get time entry by ID"""
    try:
        # This would need to be implemented in the service
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/time-entries/{time_entry_id}")
async def update_time_entry(
    time_entry_id: int,
    time_entry_data: ProjectTimeEntryUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update time entry"""
    try:
        # This would need to be implemented in the service
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/time-entries/{time_entry_id}")
async def delete_time_entry(
    time_entry_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete time entry"""
    try:
        # This would need to be implemented in the service
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Milestone Management (Placeholder endpoints)
@router.get("/milestones")
async def get_milestones(
    project_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated milestones"""
    try:
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/milestones")
async def create_milestone(
    milestone_data: ProjectMilestoneCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new milestone"""
    try:
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Resource Management (Placeholder endpoints)
@router.get("/resources")
async def get_resources(
    project_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated resources"""
    try:
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resources")
async def create_resource(
    resource_data: ProjectResourceCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new resource"""
    try:
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Comment Management (Placeholder endpoints)
@router.get("/comments")
async def get_comments(
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated comments"""
    try:
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/comments")
async def create_comment(
    comment_data: ProjectCommentCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new comment"""
    try:
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Document Management (Placeholder endpoints)
@router.get("/documents")
async def get_documents(
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated documents"""
    try:
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents")
async def create_document(
    document_data: ProjectDocumentCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new document"""
    try:
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
