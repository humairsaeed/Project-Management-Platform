"""
Pydantic schemas for Project Service.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Task Schemas
class TaskBase(BaseModel):
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


class TaskCreate(TaskBase):
    project_id: UUID
    parent_task_id: Optional[UUID] = None


class TaskUpdate(BaseModel):
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


class TaskResponse(TaskBase):
    id: UUID
    project_id: UUID
    parent_task_id: Optional[UUID] = None
    path: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Milestone Schemas
class MilestoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_date: date
    status: str = "pending"


class MilestoneCreate(MilestoneBase):
    project_id: UUID


class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: Optional[str] = None


class MilestoneResponse(MilestoneBase):
    id: UUID
    project_id: UUID
    actual_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Project Assignment Schemas
class ProjectAssignmentBase(BaseModel):
    user_id: UUID
    role: str = "member"


class ProjectAssignmentCreate(ProjectAssignmentBase):
    project_id: UUID
    assigned_by: Optional[UUID] = None


class ProjectAssignmentResponse(ProjectAssignmentBase):
    id: UUID
    project_id: UUID
    assigned_at: datetime
    assigned_by: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


# Project Schemas
class ProjectBase(BaseModel):
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


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
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


class ProjectResponse(ProjectBase):
    id: UUID
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    tasks: list[TaskResponse] = Field(default_factory=list)
    milestones: list[MilestoneResponse] = Field(default_factory=list)
    assignments: list[ProjectAssignmentResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(ProjectBase):
    id: UUID
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    milestone_count: int = 0

    model_config = ConfigDict(from_attributes=True)
