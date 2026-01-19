"""
Task Schemas - API Contracts for Task Management

These schemas support the hierarchical task structure (Project > Task > Subtask)
and Kanban board functionality.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Any
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict

from .project import UserSummary, SkillRequirement


class TaskStatus(str, Enum):
    """Task status for Kanban columns."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"


class TaskPriority(str, Enum):
    """Task priority level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskType(str, Enum):
    """Type of task item."""
    TASK = "task"
    SUBTASK = "subtask"
    MILESTONE = "milestone"
    BUG = "bug"
    FEATURE = "feature"


class DependencyType(str, Enum):
    """Task dependency relationship type."""
    FINISH_TO_START = "finish_to_start"
    START_TO_START = "start_to_start"
    FINISH_TO_FINISH = "finish_to_finish"
    START_TO_FINISH = "start_to_finish"


# =============================================================================
# Task Create/Update Schemas (Request Bodies)
# =============================================================================

class TaskCreate(BaseModel):
    """
    Request body for creating a new task or subtask.

    POST /api/v1/projects/{project_id}/tasks
    """
    title: str = Field(..., min_length=1, max_length=300, description="Task title")
    description: Optional[str] = Field(None, max_length=10000, description="Task description")
    parent_task_id: Optional[UUID] = Field(
        None,
        description="Parent task UUID for creating subtasks"
    )
    task_type: TaskType = Field(default=TaskType.TASK, description="Type of task")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Initial status")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Priority level")
    assigned_to_user_id: Optional[UUID] = Field(None, description="Assigned user UUID")
    assigned_to_team_id: Optional[UUID] = Field(None, description="Assigned team UUID")
    estimated_hours: Optional[Decimal] = Field(
        None,
        ge=0,
        le=9999,
        description="Estimated hours to complete"
    )
    start_date: Optional[date] = Field(None, description="Task start date")
    due_date: Optional[date] = Field(None, description="Task due date")
    labels: List[str] = Field(default_factory=list, description="Task labels/tags")
    required_skills: Optional[List[SkillRequirement]] = Field(
        None,
        description="Skills required for this task"
    )
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional metadata")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Configure WAF rules for API endpoints",
                "description": "Set up WAF rules to protect /api/* routes",
                "task_type": "task",
                "priority": "high",
                "assigned_to_user_id": "123e4567-e89b-12d3-a456-426614174001",
                "estimated_hours": 16,
                "due_date": "2025-02-01",
                "labels": ["security", "waf", "api"],
                "required_skills": [
                    {"skill_id": "123e4567-e89b-12d3-a456-426614174002", "min_proficiency": 4}
                ]
            }
        }
    )


class TaskUpdate(BaseModel):
    """
    Request body for updating a task.

    PATCH /api/v1/tasks/{task_id}

    Used by team members to update their assigned tasks.
    Status changes trigger workflow events.
    """
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = Field(None, max_length=10000)
    status: Optional[TaskStatus] = Field(
        None,
        description="New status - triggers task.status_changed event"
    )
    priority: Optional[TaskPriority] = None
    assigned_to_user_id: Optional[UUID] = None
    assigned_to_team_id: Optional[UUID] = None
    completion_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    estimated_hours: Optional[Decimal] = Field(None, ge=0, le=9999)
    actual_hours: Optional[Decimal] = Field(None, ge=0)
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    position: Optional[int] = Field(
        None,
        ge=0,
        description="Position in Kanban column for reordering"
    )
    labels: Optional[List[str]] = None
    metadata: Optional[dict] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "in_progress",
                "completion_percentage": 50.0,
                "actual_hours": 8.5
            }
        }
    )


class TaskMove(BaseModel):
    """
    Request body for moving a task in Kanban board.

    PATCH /api/v1/tasks/{task_id}/move

    Allows drag-and-drop status change with position update.
    """
    new_status: TaskStatus = Field(..., description="Target column/status")
    new_position: int = Field(..., ge=0, description="Position within the column")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "new_status": "review",
                "new_position": 0
            }
        }
    )


# =============================================================================
# Task Dependency Schemas
# =============================================================================

class TaskDependencyCreate(BaseModel):
    """Request body for creating task dependency."""
    predecessor_task_id: UUID = Field(..., description="Task that must complete first")
    dependency_type: DependencyType = Field(
        default=DependencyType.FINISH_TO_START,
        description="Type of dependency relationship"
    )
    lag_days: int = Field(default=0, ge=0, description="Days of lag after predecessor")


class TaskDependencyResponse(BaseModel):
    """Task dependency response."""
    id: UUID
    predecessor_task_id: UUID
    successor_task_id: UUID
    dependency_type: DependencyType
    lag_days: int
    predecessor_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Task Response Schemas
# =============================================================================

class TaskResponse(BaseModel):
    """
    Standard task response.

    Returned from POST /api/v1/projects/{project_id}/tasks
    """
    id: UUID
    project_id: UUID
    parent_task_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    task_type: TaskType
    completion_percentage: Decimal
    estimated_hours: Optional[Decimal] = None
    actual_hours: Decimal
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    position: int
    labels: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    triggered_events: List[str] = Field(
        default_factory=list,
        description="Events triggered by this operation"
    )

    model_config = ConfigDict(from_attributes=True)


class TaskCard(BaseModel):
    """
    Minimal task info for Kanban cards.

    Used in KanbanBoard columns.
    """
    id: UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    task_type: TaskType
    position: int
    due_date: Optional[date] = None
    completion_percentage: Decimal = Decimal("0")
    labels: List[str] = Field(default_factory=list)
    assignee: Optional[UserSummary] = None
    subtask_count: int = 0
    completed_subtask_count: int = 0
    has_blockers: bool = False
    comment_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class TaskDetail(BaseModel):
    """
    Full task details with relationships.

    GET /api/v1/tasks/{task_id}
    """
    id: UUID
    project_id: UUID
    parent_task_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    task_type: TaskType
    completion_percentage: Decimal
    estimated_hours: Optional[Decimal] = None
    actual_hours: Decimal
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    position: int
    labels: List[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)

    # Relationships
    assignee: Optional[UserSummary] = None
    assigned_team_id: Optional[UUID] = None
    required_skills: List[SkillRequirement] = Field(default_factory=list)
    dependencies: List[TaskDependencyResponse] = Field(default_factory=list)

    # Computed
    days_until_due: Optional[int] = None
    is_overdue: bool = False
    path: Optional[str] = None  # LTREE path for hierarchy

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskTree(BaseModel):
    """
    Recursive task tree structure for hierarchical display.

    Used when include_tasks=true in project detail.
    """
    id: UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    completion_percentage: Decimal
    due_date: Optional[date] = None
    assignee: Optional[UserSummary] = None
    subtasks: List["TaskTree"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# Enable forward references for recursive type
TaskTree.model_rebuild()


# =============================================================================
# Task List Response Schemas
# =============================================================================

class TaskListResponse(BaseModel):
    """
    Paginated list of tasks.

    GET /api/v1/projects/{project_id}/tasks
    """
    tasks: List[TaskResponse]
    total: int
    page: int = 1
    pages: int = 1


# =============================================================================
# Task Activity Log Schemas
# =============================================================================

class ActivityAction(str, Enum):
    """Types of task activity."""
    CREATED = "created"
    STATUS_CHANGED = "status_changed"
    ASSIGNED = "assigned"
    UNASSIGNED = "unassigned"
    COMMENT_ADDED = "comment_added"
    PRIORITY_CHANGED = "priority_changed"
    DUE_DATE_CHANGED = "due_date_changed"
    COMPLETED = "completed"
    REOPENED = "reopened"


class ActivityEntry(BaseModel):
    """
    Task activity log entry.

    Returned with TaskDetail to show task history.
    """
    id: UUID
    action: ActivityAction
    user: Optional[UserSummary] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Task Comment Schemas
# =============================================================================

class CommentCreate(BaseModel):
    """Request body for adding a comment."""
    content: str = Field(..., min_length=1, max_length=10000)
    parent_comment_id: Optional[UUID] = None


class CommentResponse(BaseModel):
    """Task comment response."""
    id: UUID
    task_id: UUID
    user: UserSummary
    content: str
    parent_comment_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Assignment Suggestion Schemas
# =============================================================================

class AssignmentSuggestion(BaseModel):
    """
    Suggested assignee based on skills matching.

    GET /api/v1/tasks/{task_id}/assignment-suggestions
    """
    user: UserSummary
    skill_match_score: Decimal = Field(
        ...,
        ge=0,
        le=1,
        description="0-1 score based on skill match"
    )
    current_workload: Decimal = Field(
        ...,
        ge=0,
        description="Current hours assigned"
    )
    availability: Decimal = Field(
        ...,
        ge=0,
        le=1,
        description="0-1 availability score"
    )
    recommendation_reason: str = Field(
        ...,
        description="Why this user is suggested"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174001",
                    "email": "security.expert@company.com",
                    "first_name": "Alice",
                    "last_name": "Security"
                },
                "skill_match_score": 0.95,
                "current_workload": 32.5,
                "availability": 0.75,
                "recommendation_reason": "Expert in WAF (level 5) with 75% availability"
            }
        }
    )


class AssignmentSuggestionsResponse(BaseModel):
    """List of assignment suggestions."""
    suggestions: List[AssignmentSuggestion]
