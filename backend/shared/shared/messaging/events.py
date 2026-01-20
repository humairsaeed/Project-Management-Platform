"""
Event Schemas

Defines event types for inter-service communication via Redis Streams.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Event(BaseModel):
    """Base class for all events."""

    event_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    def to_stream_data(self) -> dict[str, str]:
        """Convert event to Redis Stream compatible format."""
        return {k: str(v) for k, v in self.model_dump().items()}


class TaskCreatedEvent(Event):
    """Event published when a new task is created."""

    event_type: str = "task.created"
    project_id: UUID
    task_id: UUID
    title: str
    assigned_to_user_id: Optional[UUID] = None
    priority: str = "medium"
    estimated_hours: Optional[float] = None
    required_skills: list[UUID] = Field(default_factory=list)


class TaskStatusChangedEvent(Event):
    """Event published when a task status changes."""

    event_type: str = "task.status_changed"
    project_id: UUID
    task_id: UUID
    previous_status: str
    new_status: str
    changed_by_user_id: UUID
    completion_percentage: float = 0.0


class TaskCompletedEvent(Event):
    """Event published when a task is marked as done."""

    event_type: str = "task.completed"
    project_id: UUID
    task_id: UUID
    completed_by_user_id: UUID
    actual_hours: float


class ProjectMilestoneEvent(Event):
    """Event published when a milestone is achieved or missed."""

    event_type: str = "project.milestone"
    project_id: UUID
    milestone_id: UUID
    milestone_name: str
    status: str  # "achieved" or "missed"
    achievement_date: Optional[datetime] = None


class AIAnalysisRequestedEvent(Event):
    """Event published when AI analysis is requested."""

    event_type: str = "ai.analysis_requested"
    request_id: UUID
    analysis_type: str  # "summary", "risk_assessment", etc.
    project_id: UUID
    requested_by_user_id: UUID
    priority: str = "normal"


class InsightGeneratedEvent(Event):
    """Event published when AI generates an insight."""

    event_type: str = "insight.generated"
    insight_id: UUID
    project_id: UUID
    insight_type: str
    severity: Optional[str] = None
    requires_attention: bool = False


class TimesheetSubmittedEvent(Event):
    """Event published when a timesheet is submitted."""

    event_type: str = "timesheet.submitted"
    user_id: UUID
    week_start_date: str
    total_hours: float
    billable_hours: float
