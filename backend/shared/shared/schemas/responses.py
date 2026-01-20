"""
Standard Response Schemas

Common response formats for API consistency.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class SuccessResponse(BaseModel):
    """Generic success response."""

    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Standard error response."""

    success: bool = False
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """
    Health check response for service monitoring.

    Used by: GET /health on all services
    """

    status: str = Field(..., description="healthy, degraded, or unhealthy")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    checks: dict[str, dict[str, Any]] = Field(
        default_factory=dict,
        description="Individual component health checks",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "service": "project-service",
                "version": "1.0.0",
                "timestamp": "2025-01-19T10:30:00Z",
                "checks": {
                    "database": {"status": "healthy"},
                    "redis": {"status": "healthy"},
                },
            }
        }
