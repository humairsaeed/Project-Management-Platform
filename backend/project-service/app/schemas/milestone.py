"""
Milestone Schemas - API Contracts for Project Milestones

Milestones represent key project deliverables and dates,
displayed on the Gantt timeline.
"""

from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class MilestoneStatus(str, Enum):
    """Milestone achievement status."""
    UPCOMING = "upcoming"
    ACHIEVED = "achieved"
    MISSED = "missed"


# =============================================================================
# Milestone Create/Update Schemas
# =============================================================================

class MilestoneCreate(BaseModel):
    """
    Request body for creating a milestone.

    POST /api/v1/projects/{project_id}/milestones
    """
    name: str = Field(..., min_length=1, max_length=200, description="Milestone name")
    description: Optional[str] = Field(None, max_length=2000)
    target_date: date = Field(..., description="Target achievement date")
    linked_task_ids: List[UUID] = Field(
        default_factory=list,
        description="Task UUIDs that must complete for this milestone"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Production Deployment",
                "description": "WAF deployed to production environment",
                "target_date": "2025-02-15",
                "linked_task_ids": [
                    "123e4567-e89b-12d3-a456-426614174010",
                    "123e4567-e89b-12d3-a456-426614174011"
                ]
            }
        }
    )


class MilestoneUpdate(BaseModel):
    """
    Request body for updating a milestone.

    PATCH /api/v1/milestones/{milestone_id}
    """
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    target_date: Optional[date] = None
    achieved_date: Optional[date] = Field(
        None,
        description="Actual achievement date (sets status to 'achieved')"
    )
    status: Optional[MilestoneStatus] = Field(
        None,
        description="Manually set status (achieved/missed)"
    )
    linked_task_ids: Optional[List[UUID]] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "achieved",
                "achieved_date": "2025-02-14"
            }
        }
    )


# =============================================================================
# Milestone Response Schemas
# =============================================================================

class MilestoneResponse(BaseModel):
    """
    Full milestone response.

    Returned from POST /api/v1/projects/{project_id}/milestones
    """
    id: UUID
    project_id: UUID
    name: str
    description: Optional[str] = None
    target_date: date
    achieved_date: Optional[date] = None
    status: MilestoneStatus
    linked_task_ids: List[UUID] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    # Computed
    days_until_target: Optional[int] = None
    is_at_risk: bool = False
    completion_percentage: Optional[float] = Field(
        None,
        description="Percentage of linked tasks completed"
    )

    model_config = ConfigDict(from_attributes=True)


class MilestoneSummary(BaseModel):
    """
    Minimal milestone info for timeline display.

    Used in Gantt chart and portfolio overview.
    """
    id: UUID
    project_id: UUID
    name: str
    target_date: date
    achieved_date: Optional[date] = None
    status: MilestoneStatus
    is_at_risk: bool = False

    model_config = ConfigDict(from_attributes=True)


class MilestoneListResponse(BaseModel):
    """
    List of project milestones.

    GET /api/v1/projects/{project_id}/milestones
    """
    milestones: List[MilestoneResponse]
    total: int
    upcoming_count: int
    achieved_count: int
    missed_count: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "milestones": [],
                "total": 5,
                "upcoming_count": 2,
                "achieved_count": 3,
                "missed_count": 0
            }
        }
    )
