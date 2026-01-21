"""
Project Service - FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

app = FastAPI(
    title="Project Service",
    description="Project and Task Engine for Project Management Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
MOCK_PROJECTS = [
    {
        "id": "00000000-0000-0000-0000-000000000101",
        "name": "Vulnerabilities Remediation",
        "description": "Address critical security vulnerabilities across production systems",
        "status": "active",
        "priority": "high",
        "riskLevel": "medium",
        "completionPercentage": 65,
        "managerUserId": "00000000-0000-0000-0000-000000000003",
        "ownerTeamId": "00000000-0000-0000-0000-000000000012",
        "targetStartDate": "2025-01-01",
        "targetEndDate": "2025-03-31",
        "daysUntilDeadline": 70
    },
    {
        "id": "00000000-0000-0000-0000-000000000102",
        "name": "Cloud Migration Planning",
        "description": "Plan and execute migration to Azure cloud",
        "status": "active",
        "priority": "high",
        "riskLevel": "low",
        "completionPercentage": 70,
        "managerUserId": "00000000-0000-0000-0000-000000000002",
        "ownerTeamId": "00000000-0000-0000-0000-000000000013",
        "targetStartDate": "2025-01-01",
        "targetEndDate": "2025-06-30",
        "daysUntilDeadline": 160
    },
    {
        "id": "00000000-0000-0000-0000-000000000103",
        "name": "WAF/API Security",
        "description": "Implement WAF and API Gateway security controls",
        "status": "active",
        "priority": "critical",
        "riskLevel": "medium",
        "completionPercentage": 65,
        "managerUserId": "00000000-0000-0000-0000-000000000003",
        "ownerTeamId": "00000000-0000-0000-0000-000000000012",
        "targetStartDate": "2025-01-01",
        "targetEndDate": "2025-03-15",
        "daysUntilDeadline": 53
    },
    {
        "id": "00000000-0000-0000-0000-000000000104",
        "name": "Tape Library & Backup Replacements",
        "description": "Replace aging backup infrastructure",
        "status": "active",
        "priority": "medium",
        "riskLevel": "low",
        "completionPercentage": 20,
        "managerUserId": "00000000-0000-0000-0000-000000000002",
        "ownerTeamId": "00000000-0000-0000-0000-000000000011",
        "targetStartDate": "2025-01-01",
        "targetEndDate": "2025-08-31",
        "daysUntilDeadline": 222
    }
]

MOCK_TASKS = {
    "00000000-0000-0000-0000-000000000103": [
        {"id": "t1", "title": "WAF Rule Design", "status": "done", "priority": "high", "assignedToUserId": "00000000-0000-0000-0000-000000000002", "completionPercentage": 100, "startDate": "2025-01-01", "dueDate": "2025-01-15"},
        {"id": "t2", "title": "API Inventory", "status": "done", "priority": "high", "assignedToUserId": "00000000-0000-0000-0000-000000000003", "completionPercentage": 100, "startDate": "2025-01-05", "dueDate": "2025-01-12"},
        {"id": "t3", "title": "Test Environment Setup", "status": "done", "priority": "medium", "assignedToUserId": "00000000-0000-0000-0000-000000000002", "completionPercentage": 100, "startDate": "2025-01-10", "dueDate": "2025-01-17"},
        {"id": "t4", "title": "Production WAF Deployment", "status": "in_progress", "priority": "critical", "assignedToUserId": "00000000-0000-0000-0000-000000000002", "completionPercentage": 60, "startDate": "2025-01-15", "dueDate": "2025-02-05"},
        {"id": "t5", "title": "API Gateway Integration", "status": "in_progress", "priority": "high", "assignedToUserId": "00000000-0000-0000-0000-000000000003", "completionPercentage": 30, "startDate": "2025-01-20", "dueDate": "2025-02-10"},
        {"id": "t6", "title": "Security Testing", "status": "todo", "priority": "high", "assignedToUserId": "00000000-0000-0000-0000-000000000003", "completionPercentage": 0, "startDate": "2025-02-01", "dueDate": "2025-02-15"},
        {"id": "t7", "title": "Documentation", "status": "todo", "priority": "medium", "assignedToUserId": "00000000-0000-0000-0000-000000000002", "completionPercentage": 0, "startDate": "2025-02-10", "dueDate": "2025-02-20"}
    ]
}

# Endpoints
@app.get("/api/v1/projects")
async def list_projects(status: Optional[str] = None, teamId: Optional[str] = None):
    """List all projects with optional filtering."""
    projects = MOCK_PROJECTS
    if status:
        projects = [p for p in projects if p["status"] == status]
    if teamId:
        projects = [p for p in projects if p["ownerTeamId"] == teamId]
    return {"data": projects, "total": len(projects)}

@app.get("/api/v1/projects/{project_id}")
async def get_project(project_id: str):
    """Get project details by ID."""
    for p in MOCK_PROJECTS:
        if p["id"] == project_id:
            return p
    return {"error": "Project not found"}, 404

@app.get("/api/v1/projects/{project_id}/tasks")
async def get_project_tasks(project_id: str):
    """Get tasks for a project."""
    tasks = MOCK_TASKS.get(project_id, [])
    return {"data": tasks, "total": len(tasks)}

@app.get("/api/v1/projects/{project_id}/kanban")
async def get_kanban_board(project_id: str):
    """Get Kanban board data for a project."""
    tasks = MOCK_TASKS.get(project_id, [])
    columns = {
        "todo": {"id": "todo", "title": "To Do", "tasks": []},
        "in_progress": {"id": "in_progress", "title": "In Progress", "tasks": []},
        "review": {"id": "review", "title": "Review", "tasks": []},
        "done": {"id": "done", "title": "Done", "tasks": []}
    }
    for task in tasks:
        status = task["status"]
        if status in columns:
            columns[status]["tasks"].append(task)
    return {"columns": list(columns.values())}

@app.get("/api/v1/projects/{project_id}/timeline")
async def get_timeline(project_id: str):
    """Get Gantt timeline data for a project."""
    tasks = MOCK_TASKS.get(project_id, [])
    return {"tasks": tasks, "milestones": [
        {"id": "m1", "name": "Production Deployment", "date": "2025-02-15"},
        {"id": "m2", "name": "Project Complete", "date": "2025-03-05"}
    ]}

@app.get("/api/v1/portfolio/overview")
async def get_portfolio_overview():
    """Get executive dashboard portfolio overview."""
    total = len(MOCK_PROJECTS)
    active = len([p for p in MOCK_PROJECTS if p["status"] == "active"])
    at_risk = len([p for p in MOCK_PROJECTS if p["riskLevel"] in ["medium", "high", "critical"]])
    avg_completion = sum(p["completionPercentage"] for p in MOCK_PROJECTS) / total if total > 0 else 0

    return {
        "totalProjects": total,
        "activeProjects": active,
        "atRiskProjects": at_risk,
        "averageCompletion": round(avg_completion, 1),
        "projects": MOCK_PROJECTS
    }

@app.get("/api/v1/tasks/{task_id}")
async def get_task(task_id: str):
    """Get task details by ID."""
    for project_tasks in MOCK_TASKS.values():
        for task in project_tasks:
            if task["id"] == task_id:
                return task
    return {"error": "Task not found"}, 404

@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "healthy",
        "service": "project-service",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
