"""
Timeline/Gantt Schemas - API Contracts for Gantt Chart View

These schemas support the interactive, draggable timeline
for milestones and task scheduling.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from .project import UserSummary
from .milestone import MilestoneSummary


class TimelineTask(BaseModel):
    """
    Task representation for Gantt chart.

    Contains all data needed to render a task bar on the timeline.
    """
    id: UUID
    title: str
    start_date: Optional[date] = Field(None, description="Task start date")
    end_date: Optional[date] = Field(None, description="Task end/due date")
    completion_percentage: Decimal = Field(default=Decimal("0"))
    status: str
    priority: str
    is_milestone: bool = Field(default=False)
    is_on_critical_path: bool = Field(
        default=False,
        description="Part of the critical path"
    )
    dependencies: List[UUID] = Field(
        default_factory=list,
        description="IDs of predecessor tasks"
    )
    assignee: Optional[UserSummary] = None
    parent_task_id: Optional[UUID] = None
    depth: int = Field(default=0, description="Nesting level in hierarchy")
    color: Optional[str] = Field(None, description="Bar color hex code")

    # For draggable timeline
    can_edit_dates: bool = Field(default=True, description="User can drag dates")
    estimated_duration_days: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class CriticalPath(BaseModel):
    """
    Critical path analysis result.

    The critical path is the longest sequence of dependent tasks.
    """
    task_ids: List[UUID] = Field(..., description="Tasks on critical path")
    total_duration_days: int = Field(..., description="Total path duration")
    slack_days: int = Field(default=0, description="Available slack")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "task_ids": [
                    "123e4567-e89b-12d3-a456-426614174010",
                    "123e4567-e89b-12d3-a456-426614174011",
                    "123e4567-e89b-12d3-a456-426614174012"
                ],
                "total_duration_days": 45,
                "slack_days": 5
            }
        }
    )


class TimelineResponse(BaseModel):
    """
    Complete timeline/Gantt data.

    GET /api/v1/projects/{project_id}/timeline
    """
    project_id: UUID
    project_name: str
    project_start_date: Optional[date] = None
    project_end_date: Optional[date] = None
    tasks: List[TimelineTask] = Field(
        ...,
        description="All tasks for timeline display"
    )
    milestones: List[MilestoneSummary] = Field(
        default_factory=list,
        description="Project milestones (diamond markers)"
    )
    critical_path: Optional[CriticalPath] = Field(
        None,
        description="Critical path analysis"
    )
    today: date = Field(..., description="Current date for 'today' marker")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "project_name": "WAF/API Security",
                "project_start_date": "2025-01-01",
                "project_end_date": "2025-03-15",
                "tasks": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174010",
                        "title": "WAF Rule Design",
                        "start_date": "2025-01-01",
                        "end_date": "2025-01-15",
                        "completion_percentage": 100,
                        "status": "done",
                        "priority": "high",
                        "is_milestone": False,
                        "is_on_critical_path": True,
                        "dependencies": [],
                        "depth": 0
                    }
                ],
                "milestones": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174020",
                        "project_id": "123e4567-e89b-12d3-a456-426614174000",
                        "name": "Production Deployment",
                        "target_date": "2025-02-15",
                        "status": "upcoming",
                        "is_at_risk": False
                    }
                ],
                "critical_path": {
                    "task_ids": ["123e4567-e89b-12d3-a456-426614174010"],
                    "total_duration_days": 45,
                    "slack_days": 5
                },
                "today": "2025-01-19"
            }
        }
    )


class GanttData(BaseModel):
    """
    Extended Gantt chart data with grouping.

    Alternative view with tasks grouped by assignee or status.
    """
    project_id: UUID
    view_mode: str = Field(
        default="timeline",
        description="View mode: timeline, grouped_by_assignee, grouped_by_status"
    )
    date_range: dict = Field(
        ...,
        description="{'start': date, 'end': date}"
    )
    groups: List[dict] = Field(
        default_factory=list,
        description="Task groups based on view_mode"
    )
    zoom_level: str = Field(
        default="week",
        description="Zoom: day, week, month, quarter"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "view_mode": "grouped_by_assignee",
                "date_range": {
                    "start": "2025-01-01",
                    "end": "2025-03-31"
                },
                "groups": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174001",
                        "name": "Alice Security",
                        "tasks": []
                    }
                ],
                "zoom_level": "week"
            }
        }
    )


class TimelineDateUpdate(BaseModel):
    """
    Request to update task dates from timeline drag.

    Used when user drags a task bar to new dates.
    """
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    update_dependents: bool = Field(
        default=False,
        description="Cascade date changes to dependent tasks"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "start_date": "2025-01-20",
                "end_date": "2025-02-05",
                "update_dependents": True
            }
        }
    )
