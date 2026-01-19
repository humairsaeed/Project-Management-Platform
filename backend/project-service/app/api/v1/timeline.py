"""
Timeline/Gantt API Endpoints

Provides data for the interactive Gantt chart with draggable milestones.
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.timeline import TimelineResponse, TimelineDateUpdate

router = APIRouter()


@router.get(
    "/projects/{project_id}/timeline",
    response_model=TimelineResponse,
    summary="Get timeline/Gantt data",
    description="""
    Retrieve timeline data for Gantt chart visualization.

    **Query Parameters:**
    - `start_date`: View start date
    - `end_date`: View end date
    - `include_milestones`: Include milestone markers (default: true)

    **Returns:**
    - Tasks with dates, dependencies, and completion
    - Milestones as diamond markers
    - Critical path analysis
    - Today marker date

    **Task Dependencies:**
    Dependencies are returned as arrays of predecessor task IDs,
    allowing the frontend to draw dependency arrows.

    **Critical Path:**
    The longest path through the task dependency graph is highlighted.
    """,
)
async def get_timeline(
    project_id: UUID,
    start_date: date = Query(..., description="Timeline start date"),
    end_date: date = Query(..., description="Timeline end date"),
    include_milestones: bool = Query(True, description="Include milestones"),
    # current_user = Depends(get_current_user),
):
    """
    Get Gantt timeline data for a project.
    """
    # TODO: Implement with TimelineService
    # timeline = await timeline_service.get_timeline(
    #     project_id,
    #     start_date=start_date,
    #     end_date=end_date,
    #     include_milestones=include_milestones,
    # )
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not yet implemented"
    )


@router.patch(
    "/projects/{project_id}/timeline/tasks/{task_id}",
    summary="Update task dates from timeline",
    description="""
    Update task dates via timeline drag-and-drop.

    **Cascade Option:**
    Set `update_dependents: true` to automatically shift
    dependent tasks when dragging.

    **Validation:**
    - Start date must be before end date
    - Cannot overlap with dependencies (unless lag allows)
    """,
)
async def update_task_dates(
    project_id: UUID,
    task_id: UUID,
    date_update: TimelineDateUpdate,
    # current_user = Depends(get_current_user),
):
    """
    Update task dates from Gantt drag.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not yet implemented"
    )


@router.get(
    "/projects/{project_id}/timeline/critical-path",
    summary="Get critical path analysis",
    description="""
    Calculate and return the critical path for the project.

    The critical path is the longest sequence of dependent tasks
    that determines the minimum project duration.

    **Returns:**
    - Task IDs on the critical path
    - Total path duration
    - Available slack time
    """,
)
async def get_critical_path(
    project_id: UUID,
    # current_user = Depends(get_current_user),
):
    """
    Calculate project critical path.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not yet implemented"
    )
