"""
Kanban Board API Endpoints

Provides data for the drag-and-drop Kanban board UI.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.kanban import KanbanBoard

router = APIRouter()


@router.get(
    "/projects/{project_id}/kanban",
    response_model=KanbanBoard,
    summary="Get Kanban board",
    description="""
    Retrieve complete Kanban board state for a project.

    **Returns:**
    - Four columns: To Do, In Progress, Review, Done
    - Tasks ordered by position within each column
    - Board statistics (counts, overdue, completed today)

    **Column Data:**
    Each column includes:
    - Task cards with minimal info for display
    - WIP limit (if configured)
    - Task count

    **Real-time Updates:**
    Subscribe to WebSocket for live updates when tasks move.
    """,
)
async def get_kanban_board(
    project_id: UUID,
    # current_user = Depends(get_current_user),
):
    """
    Get Kanban board data for a project.
    """
    # TODO: Implement with KanbanService
    # board = await kanban_service.get_board(project_id, current_user)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not yet implemented"
    )


@router.patch(
    "/projects/{project_id}/kanban/wip-limits",
    summary="Update WIP limits",
    description="""
    Set Work-In-Progress limits for Kanban columns.

    **Request:**
    ```json
    {
        "in_progress": 5,
        "review": 3
    }
    ```

    WIP limits help teams maintain focus and prevent bottlenecks.
    """,
)
async def update_wip_limits(
    project_id: UUID,
    # wip_data: WIPLimitsUpdate,
    # current_user = Depends(get_current_user),
):
    """
    Set WIP limits for Kanban columns.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not yet implemented"
    )
