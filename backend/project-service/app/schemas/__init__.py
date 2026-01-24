"""
Project Service - Pydantic Schemas

API contracts for the Project/Task Engine microservice.
"""

from .project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectSummary,
    ProjectDetail,
    PortfolioOverview,
    ProjectStatistics,
)
from .task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetail,
    TaskCard,
    TaskMove,
    TaskTree,
)
from .milestone import (
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneResponse,
    MilestoneSummary,
)
from .kanban import (
    KanbanBoard,
    KanbanColumn,
    KanbanStatistics,
)
from .timeline import (
    TimelineTask,
    TimelineResponse,
    GanttData,
)
from .assignment import (
    ProjectAssignmentCreate,
    ProjectAssignmentResponse,
)

__all__ = [
    # Project schemas
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "ProjectSummary",
    "ProjectDetail",
    "PortfolioOverview",
    "ProjectStatistics",
    # Task schemas
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "TaskDetail",
    "TaskCard",
    "TaskMove",
    "TaskTree",
    # Milestone schemas
    "MilestoneCreate",
    "MilestoneUpdate",
    "MilestoneResponse",
    "MilestoneSummary",
    # Kanban schemas
    "KanbanBoard",
    "KanbanColumn",
    "KanbanStatistics",
    # Timeline schemas
    "TimelineTask",
    "TimelineResponse",
    "GanttData",
    # Assignment schemas
    "ProjectAssignmentCreate",
    "ProjectAssignmentResponse",
]
