"""
Project Service - FastAPI Application Entry Point
"""
from __future__ import annotations

import os
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .db import get_db
from .models import Milestone, Project, ProjectAssignment, Task


# Simple inline schemas matching actual database structure
class SimpleProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "planning"
    priority: str = "medium"
    risk_level: str = "low"
    completion_percentage: int = 0
    owner_team_id: Optional[UUID] = None
    manager_user_id: Optional[UUID] = None
    target_start_date: Optional[date] = None
    target_end_date: Optional[date] = None


class SimpleProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    risk_level: Optional[str] = None
    completion_percentage: Optional[int] = None
    owner_team_id: Optional[UUID] = None
    manager_user_id: Optional[UUID] = None
    target_start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None


class SimpleTaskCreate(BaseModel):
    project_id: UUID
    parent_task_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    assigned_to_user_id: Optional[UUID] = None
    estimated_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None
    completion_percentage: int = 0
    position: int = 0
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class SimpleTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_user_id: Optional[UUID] = None
    estimated_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None
    completion_percentage: Optional[int] = None
    position: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None


class SimpleMilestoneCreate(BaseModel):
    project_id: UUID
    name: str
    description: Optional[str] = None
    target_date: date
    status: str = "pending"


class SimpleMilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: Optional[str] = None


class SimpleAssignmentCreate(BaseModel):
    user_id: UUID
    role: str = "member"
    project_id: UUID
    assigned_by: Optional[UUID] = None

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

app = FastAPI(
    title="Project Service",
    description="Project and Task Engine for Project Management Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# PROJECT ENDPOINTS
# ============================================================================


@app.get("/api/v1/projects", response_model=dict)
async def list_projects(
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    team_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    List projects. If user_id provided, returns only projects the user is assigned to.
    """
    query = select(Project)

    # Filter by user assignments if user_id provided
    if user_id:
        query = (
            query.join(ProjectAssignment, Project.id == ProjectAssignment.project_id, isouter=False)
            .where(ProjectAssignment.user_id == UUID(user_id))
        )

    # Additional filters
    if status:
        query = query.where(Project.status == status)
    if team_id:
        query = query.where(Project.owner_team_id == UUID(team_id))

    # Load related data
    query = query.options(selectinload(Project.tasks), selectinload(Project.milestones))

    result = await db.execute(query)
    projects = result.scalars().unique().all()

    # Convert to list response format
    project_list = []
    for project in projects:
        project_dict = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "priority": project.priority,
            "risk_level": project.risk_level,
            "completion_percentage": project.completion_percentage,
            "owner_team_id": project.owner_team_id,
            "manager_user_id": project.manager_user_id,
            "target_start_date": project.target_start_date,
            "target_end_date": project.target_end_date,
            "actual_start_date": project.actual_start_date,
            "actual_end_date": project.actual_end_date,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "task_count": len(project.tasks),
            "milestone_count": len(project.milestones),
        }
        project_list.append(project_dict)

    return {"data": project_list, "total": len(project_list)}


@app.get("/api/v1/projects/{project_id}")
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get project details by ID with tasks, milestones, and assignments."""
    query = (
        select(Project)
        .where(Project.id == project_id)
        .options(
            selectinload(Project.tasks),
            selectinload(Project.milestones),
            selectinload(Project.assignments),
        )
    )
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "priority": project.priority,
        "risk_level": project.risk_level,
        "completion_percentage": project.completion_percentage,
        "owner_team_id": str(project.owner_team_id) if project.owner_team_id else None,
        "manager_user_id": str(project.manager_user_id) if project.manager_user_id else None,
        "target_start_date": str(project.target_start_date) if project.target_start_date else None,
        "target_end_date": str(project.target_end_date) if project.target_end_date else None,
        "actual_start_date": str(project.actual_start_date) if project.actual_start_date else None,
        "actual_end_date": str(project.actual_end_date) if project.actual_end_date else None,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "status": t.status,
                "assigned_to_user_id": str(t.assigned_to_user_id) if t.assigned_to_user_id else None,
                "completion_percentage": t.completion_percentage,
                "start_date": str(t.start_date) if t.start_date else None,
                "due_date": str(t.due_date) if t.due_date else None,
            }
            for t in project.tasks
        ],
        "milestones": [{"id": str(m.id), "name": m.name, "target_date": str(m.target_date)} for m in project.milestones],
        "assignments": [{"id": str(a.id), "user_id": str(a.user_id), "role": a.role} for a in project.assignments],
    }


@app.post("/api/v1/projects", status_code=status.HTTP_201_CREATED)
async def create_project(project_data: SimpleProjectCreate, db: AsyncSession = Depends(get_db)):
    """Create a new project."""
    project = Project(**project_data.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Automatically create project assignment for the project manager
    if project.manager_user_id:
        assignment = ProjectAssignment(
            project_id=project.id,
            user_id=project.manager_user_id,
            role="manager",
            assigned_by=project.manager_user_id,
        )
        db.add(assignment)
        await db.commit()

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "priority": project.priority,
        "risk_level": project.risk_level,
        "completion_percentage": project.completion_percentage,
        "owner_team_id": str(project.owner_team_id) if project.owner_team_id else None,
        "manager_user_id": str(project.manager_user_id) if project.manager_user_id else None,
        "target_start_date": str(project.target_start_date) if project.target_start_date else None,
        "target_end_date": str(project.target_end_date) if project.target_end_date else None,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }


@app.patch("/api/v1/projects/{project_id}")
async def update_project(
    project_id: UUID, project_data: SimpleProjectUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a project."""
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Update fields
    for field, value in project_data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "priority": project.priority,
        "risk_level": project.risk_level,
        "completion_percentage": project.completion_percentage,
        "owner_team_id": str(project.owner_team_id) if project.owner_team_id else None,
        "manager_user_id": str(project.manager_user_id) if project.manager_user_id else None,
        "target_start_date": str(project.target_start_date) if project.target_start_date else None,
        "target_end_date": str(project.target_end_date) if project.target_end_date else None,
        "actual_start_date": str(project.actual_start_date) if project.actual_start_date else None,
        "actual_end_date": str(project.actual_end_date) if project.actual_end_date else None,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }


@app.delete("/api/v1/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a project."""
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await db.delete(project)
    await db.commit()

    return None


# ============================================================================
# PROJECT ASSIGNMENT ENDPOINTS
# ============================================================================


@app.post(
    "/api/v1/projects/{project_id}/assignments",
    status_code=status.HTTP_201_CREATED,
)
async def assign_user_to_project(
    project_id: UUID,
    assignment_data: SimpleAssignmentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Assign a user to a project."""
    # Check if project exists
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Create assignment
    assignment = ProjectAssignment(**assignment_data.model_dump(), project_id=project_id)
    db.add(assignment)
    try:
        await db.commit()
        await db.refresh(assignment)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already assigned to project"
        )

    return {
        "id": str(assignment.id),
        "project_id": str(assignment.project_id),
        "user_id": str(assignment.user_id),
        "role": assignment.role,
        "assigned_at": assignment.assigned_at.isoformat(),
        "assigned_by": str(assignment.assigned_by) if assignment.assigned_by else None,
    }


@app.get("/api/v1/projects/{project_id}/assignments")
async def get_project_assignments(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get all user assignments for a project."""
    query = select(ProjectAssignment).where(ProjectAssignment.project_id == project_id)
    result = await db.execute(query)
    assignments = result.scalars().all()

    return [
        {
            "id": str(a.id),
            "project_id": str(a.project_id),
            "user_id": str(a.user_id),
            "role": a.role,
            "assigned_at": a.assigned_at.isoformat(),
            "assigned_by": str(a.assigned_by) if a.assigned_by else None,
        }
        for a in assignments
    ]


@app.delete(
    "/api/v1/projects/{project_id}/assignments/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_user_from_project(
    project_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)
):
    """Remove a user assignment from a project."""
    query = select(ProjectAssignment).where(
        ProjectAssignment.project_id == project_id, ProjectAssignment.user_id == user_id
    )
    result = await db.execute(query)
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    await db.delete(assignment)
    await db.commit()

    return None


# ============================================================================
# TASK ENDPOINTS
# ============================================================================


@app.get("/api/v1/projects/{project_id}/tasks", response_model=dict)
async def get_project_tasks(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get all tasks for a project."""
    query = select(Task).where(Task.project_id == project_id).order_by(Task.position)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return {"data": tasks, "total": len(tasks)}


@app.get("/api/v1/tasks/{task_id}")
async def get_task(task_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get task details by ID."""
    query = select(Task).where(Task.id == task_id)
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return {
        "id": str(task.id),
        "project_id": str(task.project_id),
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "assigned_to_user_id": str(task.assigned_to_user_id) if task.assigned_to_user_id else None,
        "completion_percentage": task.completion_percentage,
        "start_date": str(task.start_date) if task.start_date else None,
        "due_date": str(task.due_date) if task.due_date else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


@app.post(
    "/api/v1/projects/{project_id}/tasks",
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    project_id: UUID, task_data: SimpleTaskCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new task in a project."""
    # Check if project exists
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    task = Task(**task_data.model_dump(), project_id=project_id)
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return {
        "id": str(task.id),
        "project_id": str(task.project_id),
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "assigned_to_user_id": str(task.assigned_to_user_id) if task.assigned_to_user_id else None,
        "completion_percentage": task.completion_percentage,
        "start_date": str(task.start_date) if task.start_date else None,
        "due_date": str(task.due_date) if task.due_date else None,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


@app.patch("/api/v1/tasks/{task_id}")
async def update_task(task_id: UUID, task_data: SimpleTaskUpdate, db: AsyncSession = Depends(get_db)):
    """Update a task."""
    query = select(Task).where(Task.id == task_id)
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Update fields
    for field, value in task_data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    return {
        "id": str(task.id),
        "project_id": str(task.project_id),
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "assigned_to_user_id": str(task.assigned_to_user_id) if task.assigned_to_user_id else None,
        "completion_percentage": task.completion_percentage,
        "start_date": str(task.start_date) if task.start_date else None,
        "due_date": str(task.due_date) if task.due_date else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


@app.delete("/api/v1/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a task."""
    query = select(Task).where(Task.id == task_id)
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await db.delete(task)
    await db.commit()

    return None


# ============================================================================
# MILESTONE ENDPOINTS
# ============================================================================


@app.get("/api/v1/projects/{project_id}/milestones")
async def get_project_milestones(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get all milestones for a project."""
    query = select(Milestone).where(Milestone.project_id == project_id).order_by(Milestone.target_date)
    result = await db.execute(query)
    milestones = result.scalars().all()

    return [
        {
            "id": str(m.id),
            "project_id": str(m.project_id),
            "name": m.name,
            "description": m.description,
            "target_date": str(m.target_date),
            "actual_date": str(m.actual_date) if m.actual_date else None,
            "status": m.status,
            "created_at": m.created_at.isoformat(),
            "updated_at": m.updated_at.isoformat(),
        }
        for m in milestones
    ]


@app.post(
    "/api/v1/projects/{project_id}/milestones",
    status_code=status.HTTP_201_CREATED,
)
async def create_milestone(
    project_id: UUID, milestone_data: SimpleMilestoneCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new milestone for a project."""
    # Check if project exists
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    milestone = Milestone(**milestone_data.model_dump(), project_id=project_id)
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)

    return {
        "id": str(milestone.id),
        "project_id": str(milestone.project_id),
        "name": milestone.name,
        "description": milestone.description,
        "target_date": str(milestone.target_date),
        "actual_date": str(milestone.actual_date) if milestone.actual_date else None,
        "status": milestone.status,
        "created_at": milestone.created_at.isoformat(),
        "updated_at": milestone.updated_at.isoformat(),
    }


@app.patch("/api/v1/milestones/{milestone_id}")
async def update_milestone(
    milestone_id: UUID, milestone_data: SimpleMilestoneUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a milestone."""
    query = select(Milestone).where(Milestone.id == milestone_id)
    result = await db.execute(query)
    milestone = result.scalar_one_or_none()

    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    # Update fields
    for field, value in milestone_data.model_dump(exclude_unset=True).items():
        setattr(milestone, field, value)

    await db.commit()
    await db.refresh(milestone)

    return {
        "id": str(milestone.id),
        "project_id": str(milestone.project_id),
        "name": milestone.name,
        "description": milestone.description,
        "target_date": str(milestone.target_date),
        "actual_date": str(milestone.actual_date) if milestone.actual_date else None,
        "status": milestone.status,
        "created_at": milestone.created_at.isoformat(),
        "updated_at": milestone.updated_at.isoformat(),
    }


@app.delete("/api/v1/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(milestone_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a milestone."""
    query = select(Milestone).where(Milestone.id == milestone_id)
    result = await db.execute(query)
    milestone = result.scalar_one_or_none()

    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    await db.delete(milestone)
    await db.commit()

    return None


# ============================================================================
# LEGACY ENDPOINTS (for backward compatibility with mock data structure)
# ============================================================================


@app.get("/api/v1/projects/{project_id}/kanban")
async def get_kanban_board(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get Kanban board data for a project."""
    query = select(Task).where(Task.project_id == project_id).order_by(Task.position)
    result = await db.execute(query)
    tasks = result.scalars().all()

    columns = {
        "todo": {"id": "todo", "title": "To Do", "tasks": []},
        "in_progress": {"id": "in_progress", "title": "In Progress", "tasks": []},
        "review": {"id": "review", "title": "Review", "tasks": []},
        "done": {"id": "done", "title": "Done", "tasks": []},
    }

    for task in tasks:
        task_dict = {
            "id": str(task.id),
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "assignedToUserId": str(task.assigned_to_user_id) if task.assigned_to_user_id else None,
            "completionPercentage": task.completion_percentage,
            "startDate": str(task.start_date) if task.start_date else None,
            "dueDate": str(task.due_date) if task.due_date else None,
        }
        if task.status in columns:
            columns[task.status]["tasks"].append(task_dict)

    return {"columns": list(columns.values())}


@app.get("/api/v1/projects/{project_id}/timeline")
async def get_timeline(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get Gantt timeline data for a project."""
    # Get tasks
    task_query = select(Task).where(Task.project_id == project_id).order_by(Task.position)
    task_result = await db.execute(task_query)
    tasks = task_result.scalars().all()

    # Get milestones
    milestone_query = select(Milestone).where(Milestone.project_id == project_id).order_by(Milestone.target_date)
    milestone_result = await db.execute(milestone_query)
    milestones = milestone_result.scalars().all()

    tasks_list = [
        {
            "id": str(task.id),
            "title": task.title,
            "status": task.status,
            "startDate": str(task.start_date) if task.start_date else None,
            "dueDate": str(task.due_date) if task.due_date else None,
            "assignedToUserId": str(task.assigned_to_user_id) if task.assigned_to_user_id else None,
        }
        for task in tasks
    ]

    milestones_list = [
        {"id": str(m.id), "name": m.name, "date": str(m.target_date)} for m in milestones
    ]

    return {"tasks": tasks_list, "milestones": milestones_list}


@app.get("/api/v1/portfolio/overview")
async def get_portfolio_overview(db: AsyncSession = Depends(get_db)):
    """Get executive dashboard portfolio overview."""
    # Get all projects
    query = select(Project)
    result = await db.execute(query)
    projects = result.scalars().all()

    total = len(projects)
    active = len([p for p in projects if p.status == "active"])
    at_risk = len([p for p in projects if p.risk_level in ["medium", "high", "critical"]])
    avg_completion = (
        sum(p.completion_percentage for p in projects) / total if total > 0 else 0
    )

    projects_list = [
        {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "priority": p.priority,
            "riskLevel": p.risk_level,
            "completionPercentage": p.completion_percentage,
            "managerUserId": str(p.manager_user_id) if p.manager_user_id else None,
            "ownerTeamId": str(p.owner_team_id) if p.owner_team_id else None,
            "targetStartDate": str(p.target_start_date) if p.target_start_date else None,
            "targetEndDate": str(p.target_end_date) if p.target_end_date else None,
        }
        for p in projects
    ]

    return {
        "totalProjects": total,
        "activeProjects": active,
        "atRiskProjects": at_risk,
        "averageCompletion": round(avg_completion, 1),
        "projects": projects_list,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "healthy",
        "service": "project-service",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)
