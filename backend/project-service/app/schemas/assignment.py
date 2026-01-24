"""
Project Assignment Schemas - User-to-Project Assignment Management
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectAssignmentCreate(BaseModel):
    """
    Request body for assigning a user to a project.

    POST /api/v1/projects/{project_id}/assignments
    """
    user_id: UUID = Field(..., description="User UUID to assign")
    role: str = Field(default="member", description="Role: manager, member, or viewer")
    project_id: UUID = Field(..., description="Project UUID")
    assigned_by: Optional[UUID] = Field(None, description="User who created the assignment")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "role": "member",
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "assigned_by": "123e4567-e89b-12d3-a456-426614174002"
            }
        }
    )


class ProjectAssignmentResponse(BaseModel):
    """
    Response schema for project assignment.

    Returned from POST /api/v1/projects/{project_id}/assignments
    """
    id: UUID
    project_id: UUID
    user_id: UUID
    role: str
    assigned_at: datetime
    assigned_by: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)
