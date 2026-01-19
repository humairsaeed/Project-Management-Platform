"""
Milestones API Endpoints

Handles milestone operations for the Gantt timeline.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.milestone import (
    MilestoneUpdate,
    MilestoneResponse,
)

router = APIRouter()


@router.get(
    "/milestones/{milestone_id}",
    response_model=MilestoneResponse,
    summary="Get milestone details",
    description="""
    Retrieve milestone details including linked task completion.
    """,
)
async def get_milestone(
    milestone_id: UUID,
    # current_user = Depends(get_current_user),
):
    """
    Get milestone details.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not yet implemented"
    )


@router.patch(
    "/milestones/{milestone_id}",
    response_model=MilestoneResponse,
    summary="Update milestone",
    description="""
    Update milestone details or mark as achieved/missed.

    **Status Updates:**
    - Set `status: "achieved"` and `achieved_date` to mark complete
    - Set `status: "missed"` if deadline passed

    **Events Triggered:**
    - `project.milestone` event when status changes to achieved
    """,
)
async def update_milestone(
    milestone_id: UUID,
    milestone_data: MilestoneUpdate,
    # current_user = Depends(get_current_user),
):
    """
    Update a milestone.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not yet implemented"
    )


@router.delete(
    "/milestones/{milestone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete milestone",
    description="""
    Delete a milestone from the project.
    """,
)
async def delete_milestone(
    milestone_id: UUID,
    # current_user = Depends(get_current_user),
):
    """
    Delete a milestone.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not yet implemented"
    )
