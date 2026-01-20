"""
Insights Service API v1
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/insights")


@router.get("/")
async def insights_root():
    """Insights service root endpoint."""
    return {"service": "insights", "version": "v1"}
