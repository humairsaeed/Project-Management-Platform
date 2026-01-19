"""
Project Schemas - API Contracts for Project Management

These schemas define the request/response contracts for all project-related endpoints.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class ProjectStatus(str, Enum):
    """Project lifecycle status."""
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProjectPriority(str, Enum):
    """Project priority level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskLevel(str, Enum):
    """Risk assessment level for executive dashboard."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# =============================================================================
# Nested Schemas (for relationships)
# =============================================================================

class SkillRequirement(BaseModel):
    """Skill requirement for project/task assignment."""
    skill_id: UUID
    min_proficiency: int = Field(default=3, ge=1, le=5)


class UserSummary(BaseModel):
    """Minimal user info for display in lists."""
    id: UUID
    email: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TeamSummary(BaseModel):
    """Minimal team info for display."""
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class CategorySummary(BaseModel):
    """Project category info."""
    id: UUID
    name: str
    color_hex: str = "#6366F1"
    icon: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Project Create/Update Schemas (Request Bodies)
# =============================================================================

class ProjectCreate(BaseModel):
    """
    Request body for creating a new project.

    POST /api/v1/projects
    """
    name: str = Field(..., min_length=1, max_length=200, description="Project name")
    description: Optional[str] = Field(None, max_length=5000, description="Project description")
    category_id: Optional[UUID] = Field(None, description="Category UUID")
    owner_team_id: UUID = Field(..., description="Owning team UUID")
    manager_user_id: UUID = Field(..., description="Project manager UUID")
    start_date: Optional[date] = Field(None, description="Project start date")
    target_end_date: Optional[date] = Field(None, description="Target completion date")
    budget_allocated: Optional[Decimal] = Field(None, ge=0, description="Budget in currency units")
    required_skills: Optional[List[SkillRequirement]] = Field(
        default=None,
        description="Skills required for project"
    )
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional metadata")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "WAF/API Security Implementation",
                "description": "Deploy Web Application Firewall and secure API endpoints",
                "owner_team_id": "123e4567-e89b-12d3-a456-426614174000",
                "manager_user_id": "123e4567-e89b-12d3-a456-426614174001",
                "start_date": "2025-01-01",
                "target_end_date": "2025-03-15",
                "budget_allocated": 50000.00,
                "required_skills": [
                    {"skill_id": "123e4567-e89b-12d3-a456-426614174002", "min_proficiency": 4}
                ]
            }
        }
    )


class ProjectUpdate(BaseModel):
    """
    Request body for updating a project.

    PATCH /api/v1/projects/{project_id}
    """
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    category_id: Optional[UUID] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    completion_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    budget_allocated: Optional[Decimal] = Field(None, ge=0)
    budget_spent: Optional[Decimal] = Field(None, ge=0)
    metadata: Optional[dict] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "active",
                "completion_percentage": 65.0,
                "budget_spent": 32500.00
            }
        }
    )


# =============================================================================
# Project Response Schemas
# =============================================================================

class ProjectResponse(BaseModel):
    """
    Standard project response with core fields.

    Returned from POST /api/v1/projects
    """
    id: UUID
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    priority: ProjectPriority
    completion_percentage: Decimal
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    budget_allocated: Optional[Decimal] = None
    budget_spent: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectSummary(BaseModel):
    """
    Summarized project info for list views.

    Used in GET /api/v1/projects response array.
    """
    id: UUID
    name: str
    status: ProjectStatus
    priority: ProjectPriority
    completion_percentage: Decimal
    target_end_date: Optional[date] = None
    days_until_deadline: Optional[int] = None
    risk_level: Optional[RiskLevel] = None
    category: Optional[CategorySummary] = None
    manager: Optional[UserSummary] = None
    task_count: int = 0
    completed_task_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ProjectDetail(BaseModel):
    """
    Full project details with relationships.

    Returned from GET /api/v1/projects/{project_id}
    """
    id: UUID
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    priority: ProjectPriority
    completion_percentage: Decimal
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    budget_allocated: Optional[Decimal] = None
    budget_spent: Decimal
    metadata: dict = Field(default_factory=dict)

    # Relationships
    category: Optional[CategorySummary] = None
    owner_team: Optional[TeamSummary] = None
    manager: Optional[UserSummary] = None
    required_skills: List[SkillRequirement] = Field(default_factory=list)

    # Computed fields
    days_until_deadline: Optional[int] = None
    task_statistics: Optional[dict] = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Portfolio Overview Schemas (Executive Dashboard)
# =============================================================================

class ProjectStatistics(BaseModel):
    """Statistics for project list response."""
    total_active: int
    total_completed: int
    avg_completion: Decimal
    at_risk_count: int


class ProjectSnapshotSummary(BaseModel):
    """
    Project snapshot for executive portfolio view.

    Used in PortfolioOverview.projects_summary array.
    """
    id: UUID
    name: str
    completion_percentage: Decimal
    status: ProjectStatus
    risk_level: RiskLevel = RiskLevel.LOW
    days_until_deadline: Optional[int] = None
    priority: ProjectPriority = ProjectPriority.MEDIUM

    model_config = ConfigDict(from_attributes=True)


class MilestoneSummaryForPortfolio(BaseModel):
    """Milestone summary for portfolio overview."""
    id: UUID
    project_id: UUID
    project_name: str
    name: str
    target_date: date
    achieved_date: Optional[date] = None
    status: str  # upcoming, achieved, missed

    model_config = ConfigDict(from_attributes=True)


class PortfolioOverview(BaseModel):
    """
    Executive dashboard portfolio overview.

    GET /api/v1/portfolio/overview

    This schema provides the "High-Level Snapshot" showing:
    - Active vs Completed counts
    - Portfolio health score
    - Project summaries with progress bars
    - Recent and upcoming milestones
    """
    total_projects: int = Field(..., description="Total number of projects")
    projects_by_status: dict = Field(
        ...,
        description="Count by status: {active: int, planning: int, completed: int, on_hold: int}"
    )
    portfolio_health_score: Decimal = Field(
        ...,
        ge=0,
        le=100,
        description="Overall portfolio health (0-100)"
    )
    projects_summary: List[ProjectSnapshotSummary] = Field(
        ...,
        description="Summary of all active projects for progress bars"
    )
    recent_milestones: List[MilestoneSummaryForPortfolio] = Field(
        default_factory=list,
        description="Recently achieved milestones"
    )
    upcoming_milestones: List[MilestoneSummaryForPortfolio] = Field(
        default_factory=list,
        description="Upcoming milestones in next 30 days"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_projects": 7,
                "projects_by_status": {
                    "active": 4,
                    "planning": 1,
                    "completed": 2,
                    "on_hold": 0
                },
                "portfolio_health_score": 72.5,
                "projects_summary": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "name": "Vulnerabilities Remediation",
                        "completion_percentage": 65.0,
                        "status": "active",
                        "risk_level": "medium",
                        "days_until_deadline": 45
                    },
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174001",
                        "name": "Cloud Migration Planning",
                        "completion_percentage": 70.0,
                        "status": "active",
                        "risk_level": "low",
                        "days_until_deadline": 60
                    }
                ],
                "recent_milestones": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174010",
                        "project_id": "123e4567-e89b-12d3-a456-426614174000",
                        "project_name": "Infrastructure Upgrade",
                        "name": "NLB Replacement",
                        "target_date": "2025-01-10",
                        "achieved_date": "2025-01-09",
                        "status": "achieved"
                    }
                ],
                "upcoming_milestones": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174011",
                        "project_id": "123e4567-e89b-12d3-a456-426614174001",
                        "project_name": "WAF/API Security",
                        "name": "Production Deployment",
                        "target_date": "2025-02-15",
                        "status": "upcoming"
                    }
                ]
            }
        }
    )


# =============================================================================
# List Response Schemas (with pagination)
# =============================================================================

class ProjectListResponse(BaseModel):
    """
    Paginated list of projects.

    GET /api/v1/projects
    """
    projects: List[ProjectSummary]
    total: int
    page: int
    pages: int
    statistics: ProjectStatistics

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "projects": [],
                "total": 10,
                "page": 1,
                "pages": 2,
                "statistics": {
                    "total_active": 4,
                    "total_completed": 3,
                    "avg_completion": 55.5,
                    "at_risk_count": 1
                }
            }
        }
    )
