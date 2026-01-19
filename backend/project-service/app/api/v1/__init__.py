"""
API v1 - Project Service Endpoints

This module aggregates all v1 API routes.
"""

from fastapi import APIRouter

from .projects import router as projects_router
from .tasks import router as tasks_router
from .milestones import router as milestones_router
from .kanban import router as kanban_router
from .timeline import router as timeline_router
from .portfolio import router as portfolio_router

# Main v1 router
router = APIRouter(prefix="/api/v1")

# Include all sub-routers
router.include_router(projects_router, prefix="/projects", tags=["Projects"])
router.include_router(tasks_router, tags=["Tasks"])
router.include_router(milestones_router, tags=["Milestones"])
router.include_router(kanban_router, tags=["Kanban"])
router.include_router(timeline_router, tags=["Timeline"])
router.include_router(portfolio_router, prefix="/portfolio", tags=["Portfolio"])

__all__ = ["router"]
