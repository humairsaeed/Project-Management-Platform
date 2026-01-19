"""
Kanban Board Schemas - API Contracts for Kanban View

These schemas support the drag-and-drop Kanban board UI
with columns: To Do, In Progress, Review, Done.
"""

from typing import List, Dict
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from .task import TaskCard, TaskStatus


class KanbanColumn(BaseModel):
    """
    Single Kanban column with tasks.

    Each column represents a status with ordered task cards.
    """
    status: TaskStatus
    title: str = Field(..., description="Display title for the column")
    task_count: int = Field(default=0, description="Number of tasks in column")
    tasks: List[TaskCard] = Field(default_factory=list, description="Ordered tasks")
    wip_limit: int | None = Field(
        None,
        description="Work-in-progress limit (optional)"
    )
    is_over_wip: bool = Field(
        default=False,
        description="True if task_count exceeds wip_limit"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "in_progress",
                "title": "In Progress",
                "task_count": 4,
                "tasks": [],
                "wip_limit": 5,
                "is_over_wip": False
            }
        }
    )


class KanbanStatistics(BaseModel):
    """
    Statistics for the Kanban board.

    Provides overview metrics for the board header.
    """
    total_tasks: int = Field(..., description="Total tasks on board")
    by_status: Dict[str, int] = Field(
        ...,
        description="Task count per status: {todo: 5, in_progress: 3, ...}"
    )
    by_priority: Dict[str, int] = Field(
        ...,
        description="Task count per priority: {low: 2, medium: 5, high: 3, critical: 1}"
    )
    overdue_count: int = Field(default=0, description="Tasks past due date")
    blocked_count: int = Field(default=0, description="Blocked tasks")
    completed_today: int = Field(default=0, description="Tasks completed today")
    completed_this_week: int = Field(default=0, description="Tasks completed this week")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_tasks": 20,
                "by_status": {
                    "todo": 8,
                    "in_progress": 5,
                    "review": 3,
                    "done": 4
                },
                "by_priority": {
                    "low": 3,
                    "medium": 10,
                    "high": 5,
                    "critical": 2
                },
                "overdue_count": 2,
                "blocked_count": 1,
                "completed_today": 2,
                "completed_this_week": 6
            }
        }
    )


class KanbanBoard(BaseModel):
    """
    Complete Kanban board state.

    GET /api/v1/projects/{project_id}/kanban

    Returns all columns with tasks for rendering the board.
    Frontend uses this to display drag-and-drop interface.
    """
    project_id: UUID
    project_name: str
    columns: Dict[str, KanbanColumn] = Field(
        ...,
        description="Columns keyed by status: {todo: KanbanColumn, ...}"
    )
    statistics: KanbanStatistics

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "project_name": "WAF/API Security",
                "columns": {
                    "todo": {
                        "status": "todo",
                        "title": "To Do",
                        "task_count": 5,
                        "tasks": []
                    },
                    "in_progress": {
                        "status": "in_progress",
                        "title": "In Progress",
                        "task_count": 3,
                        "tasks": []
                    },
                    "review": {
                        "status": "review",
                        "title": "Review",
                        "task_count": 2,
                        "tasks": []
                    },
                    "done": {
                        "status": "done",
                        "title": "Done",
                        "task_count": 10,
                        "tasks": []
                    }
                },
                "statistics": {
                    "total_tasks": 20,
                    "by_status": {"todo": 5, "in_progress": 3, "review": 2, "done": 10},
                    "by_priority": {"medium": 15, "high": 5},
                    "overdue_count": 1,
                    "blocked_count": 0,
                    "completed_today": 2,
                    "completed_this_week": 5
                }
            }
        }
    )


class KanbanMoveResult(BaseModel):
    """
    Result of moving a task in Kanban.

    PATCH /api/v1/tasks/{task_id}/move response
    """
    task_id: UUID
    previous_status: str
    new_status: str
    new_position: int
    triggered_events: List[str] = Field(
        default_factory=list,
        description="Events triggered: ['task.status_changed']"
    )
    updated_statistics: KanbanStatistics | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174100",
                "previous_status": "in_progress",
                "new_status": "review",
                "new_position": 0,
                "triggered_events": ["task.status_changed"]
            }
        }
    )
