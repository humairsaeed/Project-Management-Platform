"""
Insights Service - FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

app = FastAPI(
    title="Insights Service",
    description="AI-powered Insights service for Project Management Platform",
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

# Mock insights data
MOCK_INSIGHTS = {
    "00000000-0000-0000-0000-000000000103": {
        "summary": {
            "headline": "WAF/API Security Project at 65% - On Track",
            "overview": "The project is progressing well with WAF rule design and API inventory completed. Production deployment is 60% complete.",
            "achievements": ["WAF rules designed for OWASP Top 10", "Complete API inventory documented", "Test environment operational"],
            "concerns": ["Vendor certificate renewal pending", "Integration complexity with legacy APIs"]
        },
        "risks": [
            {"id": "r1", "category": "Technical", "description": "Legacy API integration complexity", "likelihood": "medium", "impact": "high", "mitigation": "Allocate additional testing time"},
            {"id": "r2", "category": "Schedule", "description": "Vendor dependency for certificates", "likelihood": "low", "impact": "medium", "mitigation": "Expedite vendor communication"}
        ],
        "projection": {
            "optimistic": "2025-02-28",
            "realistic": "2025-03-10",
            "pessimistic": "2025-03-20"
        }
    }
}

@app.get("/api/v1/insights/projects/{project_id}/summary")
async def get_project_summary(project_id: str):
    """Get AI-generated executive summary for a project."""
    insight = MOCK_INSIGHTS.get(project_id, {})
    return insight.get("summary", {"message": "No insights available"})

@app.get("/api/v1/insights/projects/{project_id}/risks")
async def get_project_risks(project_id: str):
    """Get risk assessment for a project."""
    insight = MOCK_INSIGHTS.get(project_id, {})
    return {"risks": insight.get("risks", [])}

@app.get("/api/v1/insights/projects/{project_id}/projection")
async def get_project_projection(project_id: str):
    """Get completion projection for a project."""
    insight = MOCK_INSIGHTS.get(project_id, {})
    return insight.get("projection", {})

@app.post("/api/v1/insights/analyze")
async def request_analysis(project_id: str):
    """Request new AI analysis for a project."""
    return {"status": "queued", "message": "Analysis request queued", "projectId": project_id}

@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "healthy",
        "service": "insights-service",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
