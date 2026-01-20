"""
Timesheet Service API v1
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/timesheets")


@router.get("/")
async def timesheets_root():
    """Timesheet service root endpoint."""
    return {"service": "timesheets", "version": "v1"}
