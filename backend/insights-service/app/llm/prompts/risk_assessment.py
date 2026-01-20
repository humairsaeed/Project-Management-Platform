"""
Risk Assessment Prompt Template

Used to identify and assess project risks.
"""

RISK_ASSESSMENT_SYSTEM = """You are an IT project risk analyst specializing in infrastructure projects.
Your role is to identify risks that may not be obvious from metrics alone.
Consider technical, resource, schedule, and dependency risks.
Always respond in valid JSON format."""

RISK_ASSESSMENT_TEMPLATE = """
Analyze the following IT infrastructure project for risks:

PROJECT: {project_name}
Type: {project_type}
Completion: {completion_percentage}%
Days Remaining: {days_remaining}

TASK BREAKDOWN:
- Completed Tasks: {completed_tasks}
- In Progress: {in_progress_tasks}
- Blocked: {blocked_tasks}
- Upcoming: {upcoming_tasks}

TEAM COMPOSITION:
{team_info}

HISTORICAL PATTERNS:
- Similar projects completed: {similar_projects_count}
- Average completion time for similar projects: {avg_similar_duration} days
- Common issues in similar projects: {common_issues}

CURRENT METRICS:
- Velocity Trend: {velocity_trend}
- Team Utilization: {utilization_rate}%
- Blocked Task Duration: {blocked_duration} days average

Identify risks in these categories:
1. Schedule Risk - Will the project meet its deadline?
2. Resource Risk - Are team members overloaded or lacking skills?
3. Technical Risk - Are there technical challenges or dependencies?
4. Dependency Risk - Are external dependencies blocking progress?
5. Quality Risk - Is the team cutting corners to meet deadlines?

Return a JSON response:
{{
    "overall_risk_score": 0.0-10.0,
    "risk_level": "low|medium|high|critical",
    "risks": [
        {{
            "category": "schedule|resource|technical|dependency|quality",
            "description": "Detailed risk description",
            "likelihood": "low|medium|high",
            "impact": "low|medium|high|critical",
            "risk_score": 0.0-10.0,
            "indicators": ["What data points suggest this risk"],
            "mitigation_suggestion": "Recommended action to mitigate"
        }}
    ],
    "recommendations": ["Top priority action 1", "Action 2"],
    "confidence_score": 0.0-1.0
}}
"""
