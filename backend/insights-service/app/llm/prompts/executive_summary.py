"""
Executive Summary Prompt Template

Used to generate AI-powered executive summaries for projects.
"""

EXECUTIVE_SUMMARY_SYSTEM = """You are an IT project management analyst generating executive summaries for stakeholders.
Your summaries should be:
- Concise and actionable
- Focused on business impact
- Clear about risks and blockers
- Specific with recommendations

Always respond in valid JSON format."""

EXECUTIVE_SUMMARY_TEMPLATE = """
Generate an executive summary for the following IT infrastructure project:

PROJECT CONTEXT:
- Name: {project_name}
- Category: {category}
- Current Completion: {completion_percentage}%
- Target Date: {target_date}
- Days Remaining: {days_remaining}

TASK STATUS:
- Completed: {tasks_completed} tasks
- In Progress: {tasks_in_progress} tasks
- Blocked: {tasks_blocked} tasks
- Remaining: {tasks_remaining} tasks

RECENT ACTIVITY (Last 7 Days):
{recent_activity}

MILESTONES:
- Recently Achieved: {recent_milestones}
- Upcoming: {upcoming_milestones}

TEAM METRICS:
- Utilization Rate: {utilization_rate}%
- Average Task Completion Time: {avg_completion_time} days
- Velocity Trend: {velocity_trend}

BLOCKERS & RISKS:
{blockers}

Generate an executive summary in the following JSON structure:
{{
    "headline": "One sentence status (e.g., 'On Track', 'At Risk', 'Ahead of Schedule')",
    "overview": "2-3 sentence project status overview",
    "key_achievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
    "current_focus": "What the team is currently working on",
    "blockers": ["Blocker 1 with brief description"],
    "risks": [
        {{"risk": "Risk description", "severity": "low|medium|high", "mitigation": "Suggested action"}}
    ],
    "next_steps": ["Next step 1", "Next step 2"],
    "recommendation": "Overall recommendation for leadership",
    "confidence_score": 0.0-1.0
}}

Focus on actionable insights relevant to IT infrastructure projects.
"""
