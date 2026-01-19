# Project Management Platform - System Architecture

## 1. Executive Summary

This document describes the technical architecture for a microservices-based project management platform designed to replace manual PowerPoint reporting for IT infrastructure projects. The system provides real-time project tracking, AI-powered insights, and executive dashboards.

### Technology Stack
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (async), Alembic
- **Database**: PostgreSQL 16 with schema separation
- **Cache/Messaging**: Redis 7 (caching + Streams for events)
- **AI/LLM**: OpenAI GPT-4 for executive summaries and risk analysis
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Infrastructure**: Docker, Kubernetes-ready

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Executive       │  │ Project Manager │  │ Team Member     │              │
│  │ Dashboard       │  │ View            │  │ Kanban/Tasks    │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │ HTTPS/WSS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  • JWT Validation          • Rate Limiting (100 req/min)            │    │
│  │  • Request Routing         • CORS Handling                          │    │
│  │  • Load Balancing          • Circuit Breaker                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
            │              │              │              │
            ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MICROSERVICES LAYER                                   │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Auth Service │  │   Project    │  │  Insights    │  │  Timesheet   │    │
│  │   (Svc A)    │  │   Service    │  │   Service    │  │   Service    │    │
│  │   :8001      │  │   (Svc B)    │  │   (Svc C)    │  │   (Svc D)    │    │
│  │              │  │   :8002      │  │   :8003      │  │   :8004      │    │
│  │ • Auth/Login │  │              │  │              │  │              │    │
│  │ • RBAC       │  │ • Projects   │  │ • AI Summ.   │  │ • Time Entry │    │
│  │ • Teams      │  │ • Tasks      │  │ • Risks      │  │ • Prod Score │    │
│  │ • Skills     │  │ • Kanban     │  │ • Analysis   │  │ • Reports    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          └─────────────────┴────────┬────────┴─────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MESSAGE BROKER (Redis Streams)                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Event Channels:                                                     │    │
│  │  • task.created        • task.status_changed    • task.completed    │    │
│  │  • project.milestone   • ai.analysis.requested  • insight.generated │    │
│  │  • timesheet.submitted • user.assigned                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   PostgreSQL     │  │      Redis       │  │     MinIO/S3     │          │
│  │   (Primary DB)   │  │  (Cache/Session) │  │  (File Storage)  │          │
│  │                  │  │                  │  │                  │          │
│  │ Schemas:         │  │ • Session Store  │  │ • Attachments    │          │
│  │ • auth           │  │ • API Cache      │  │ • Reports        │          │
│  │ • projects       │  │ • Rate Limits    │  │ • Exports        │          │
│  │ • insights       │  │                  │  │                  │          │
│  │ • timesheets     │  │                  │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Descriptions

### 3.1 Auth Service (Service A) - Port 8001

**Responsibilities:**
- User authentication (JWT-based)
- Role-Based Access Control (RBAC)
- Team management
- Skill tracking for assignment suggestions

**Database Schema:** `auth`

**Key Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Authenticate user, return JWT |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/users` | GET | List users (Admin) |
| `/api/v1/auth/teams` | GET/POST | Manage teams |
| `/api/v1/auth/skills` | GET | List available skills |

**Roles:**
- `admin`: Full system access
- `project_manager`: Manage projects, approve timesheets
- `contributor`: Update assigned tasks, log time

### 3.2 Project Service (Service B) - Port 8002

**Responsibilities:**
- Project CRUD operations
- Task hierarchy management (Project > Task > Subtask)
- Kanban board state
- Gantt timeline data
- Milestone tracking

**Database Schema:** `projects`

**Key Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/projects` | GET/POST | List/create projects |
| `/api/v1/projects/{id}` | GET/PATCH/DELETE | Project operations |
| `/api/v1/projects/{id}/tasks` | GET/POST | Task management |
| `/api/v1/tasks/{id}` | GET/PATCH/DELETE | Task operations |
| `/api/v1/projects/{id}/kanban` | GET | Kanban board data |
| `/api/v1/tasks/{id}/move` | PATCH | Kanban drag-drop |
| `/api/v1/projects/{id}/timeline` | GET | Gantt chart data |
| `/api/v1/projects/{id}/milestones` | GET/POST | Milestone management |
| `/api/v1/portfolio/overview` | GET | Executive dashboard |

**Event Publishing:**
- `task.created` - New task created
- `task.status_changed` - Task moved in Kanban
- `task.completed` - Task marked done
- `project.milestone` - Milestone achieved/missed

### 3.3 Insights Service (Service C) - Port 8003

**Responsibilities:**
- AI-powered executive summary generation
- Risk assessment and identification
- Progress analysis and projections
- Recommendation generation

**Database Schema:** `insights`

**LLM Integration:**
- Provider: OpenAI GPT-4
- Async processing via worker pool
- Structured output with JSON schema

**Key Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/insights/analyze` | POST | Request AI analysis |
| `/api/v1/insights/analyze/{id}` | GET | Get analysis result |
| `/api/v1/insights/projects/{id}/summary` | GET | Executive summary |
| `/api/v1/insights/projects/{id}/risks` | GET/POST | Risk assessment |
| `/api/v1/insights/projects/{id}/progress-insights` | GET | Progress analysis |
| `/api/v1/insights/portfolio/analyze` | POST | Portfolio-wide analysis |

**AI Analysis Pipeline:**
1. Context gathering (from all services)
2. Prompt construction with templates
3. LLM inference (GPT-4-turbo)
4. Response parsing and validation
5. Storage and event publishing

### 3.4 Timesheet Service (Service D) - Port 8004

**Responsibilities:**
- Time entry logging
- Weekly timesheet management
- Productivity score calculation
- Utilization reporting

**Database Schema:** `timesheets`

**Key Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/timesheets/entries` | GET/POST | Time entries |
| `/api/v1/timesheets/weekly` | GET | Weekly timesheet |
| `/api/v1/timesheets/weekly/submit` | POST | Submit for approval |
| `/api/v1/timesheets/productivity/me` | GET | Personal productivity |
| `/api/v1/timesheets/productivity/team/{id}` | GET | Team productivity |
| `/api/v1/timesheets/reports/utilization` | GET | Utilization report |

**Productivity Score Formula:**
```
Score = (TasksCompleted * 0.4) + (OnTimeRate * 0.3) + (UtilizationRate * 0.3)
```

---

## 4. Database Architecture

### 4.1 Schema Separation

Each service owns its schema, ensuring data isolation:

```
PostgreSQL Database: project_mgmt
├── auth (Service A)
│   ├── users
│   ├── teams
│   ├── roles
│   ├── team_memberships
│   ├── skills
│   ├── user_skills
│   └── refresh_tokens
│
├── projects (Service B)
│   ├── categories
│   ├── projects
│   ├── tasks (hierarchical via parent_task_id + LTREE path)
│   ├── milestones
│   ├── task_dependencies
│   ├── task_comments
│   └── task_activity_log
│
├── insights (Service C)
│   ├── analysis_requests
│   ├── generated_insights
│   └── risk_assessments
│
└── timesheets (Service D)
    ├── time_entries
    ├── weekly_summaries
    └── productivity_metrics
```

### 4.2 Cross-Service Data Access

Services access other schemas **read-only** via foreign keys to `auth.users` and `projects.projects`. Write operations go through service APIs.

---

## 5. Inter-Service Communication

### 5.1 Synchronous (HTTP/REST)

Used for immediate data retrieval:
- Auth validation during request processing
- Fetching user details for task assignment
- Getting project data for AI analysis

### 5.2 Asynchronous (Redis Streams)

Used for event-driven updates:

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `task.created` | Project Service | Insights Service |
| `task.status_changed` | Project Service | Insights, Timesheet |
| `task.completed` | Project Service | Timesheet Service |
| `project.milestone` | Project Service | Insights Service |
| `ai.analysis.requested` | Insights Service | Insights Workers |
| `insight.generated` | Insights Service | WebSocket Gateway |
| `timesheet.submitted` | Timesheet Service | Project Service |

### 5.3 Event Schema Example

```python
class TaskStatusChangedEvent:
    event_type: str = "task.status_changed"
    event_id: UUID
    timestamp: datetime
    project_id: UUID
    task_id: UUID
    previous_status: str
    new_status: str
    changed_by_user_id: UUID
    completion_percentage: float
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
┌────────┐      ┌───────────┐      ┌─────────────┐
│ Client │─────▶│ API GW    │─────▶│ Auth Service│
└────────┘      └───────────┘      └─────────────┘
    │                │                    │
    │ 1. Login       │                    │
    │───────────────▶│                    │
    │                │ 2. Validate        │
    │                │───────────────────▶│
    │                │                    │
    │                │ 3. JWT + Refresh   │
    │                │◀───────────────────│
    │ 4. Tokens      │                    │
    │◀───────────────│                    │
    │                │                    │
    │ 5. API Request │                    │
    │ (with JWT)     │                    │
    │───────────────▶│                    │
    │                │ 6. Verify JWT      │
    │                │ (local/JWKS)       │
    │                │                    │
    │                │ 7. Route to Service│
    │                │─────────────────────────────▶
```

### 6.2 JWT Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["project_manager"],
  "teams": ["team-uuid-1", "team-uuid-2"],
  "exp": 1699999999,
  "iat": 1699998099
}
```

### 6.3 RBAC Permissions

| Resource | Admin | Project Manager | Contributor |
|----------|-------|-----------------|-------------|
| Projects | CRUD | CRUD (own teams) | Read |
| Tasks | CRUD | CRUD | Update (assigned) |
| Timesheets | Approve all | Approve team | Own only |
| Users | CRUD | Read team | Read self |
| AI Insights | Full | Full | Read |

---

## 7. AI Insights Architecture

### 7.1 Analysis Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Analysis    │────▶│   Context   │────▶│   Prompt    │
│ Request     │     │  Gatherer   │     │ Constructor │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Store &   │◀────│  Response   │◀────│    LLM      │
│   Publish   │     │   Parser    │     │  Inference  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 7.2 Context Assembly

For a project at 65% completion, the context includes:
- Project metadata (name, dates, team)
- Task breakdown (completed, in-progress, blocked, remaining)
- Team metrics (velocity, utilization, skills coverage)
- Historical patterns from similar projects

### 7.3 Prompt Templates

Templates are stored in `insights-service/app/llm/prompts/`:
- `executive_summary.py` - High-level project status
- `risk_assessment.py` - Risk identification and mitigation
- `progress_analysis.py` - Velocity and projections
- `recommendation.py` - Action items

### 7.4 Risk Identification

**Rule-Based (Deterministic):**
- Schedule slippage > 10%
- Team utilization > 90%
- Blocked tasks > 2
- Declining velocity in final weeks

**LLM-Based (Pattern Recognition):**
- Technical debt accumulation
- Knowledge concentration (bus factor)
- Integration complexity
- Compliance gaps

---

## 8. Frontend Architecture

### 8.1 Component Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── ExecutiveDashboard.tsx    # Main dashboard view
│   │   ├── PortfolioOverview.tsx     # Active/Completed counts
│   │   ├── ProjectCard.tsx           # Project progress card
│   │   └── RiskAlertPanel.tsx        # AI-identified risks
│   │
│   ├── kanban/
│   │   ├── KanbanBoard.tsx           # Main board with DnD
│   │   ├── KanbanColumn.tsx          # Status column
│   │   └── KanbanCard.tsx            # Task card
│   │
│   ├── gantt/
│   │   ├── GanttChart.tsx            # Timeline visualization
│   │   ├── GanttRow.tsx              # Task bar
│   │   └── MilestoneMarker.tsx       # Diamond milestone
│   │
│   └── insights/
│       ├── AIInsightsPanel.tsx       # Insight display
│       ├── ExecutiveSummary.tsx      # Generated summary
│       └── RiskAssessment.tsx        # Risk details
```

### 8.2 State Management

Using Zustand for lightweight state:
- `authSlice` - User session, permissions
- `projectSlice` - Active project data
- `taskSlice` - Tasks, Kanban state
- `uiSlice` - Theme, sidebar, modals

### 8.3 Real-time Updates

WebSocket connection for live updates:
- Task status changes → Kanban board refresh
- New insights → Dashboard notification
- Milestone achieved → Timeline update

---

## 9. Deployment Architecture

### 9.1 Docker Compose (Development)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: project_mgmt
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  auth-service:
    build: ./backend/auth-service
    ports: ["8001:8001"]
    depends_on: [postgres, redis]

  project-service:
    build: ./backend/project-service
    ports: ["8002:8002"]
    depends_on: [postgres, redis]

  insights-service:
    build: ./backend/insights-service
    ports: ["8003:8003"]
    depends_on: [postgres, redis]

  timesheet-service:
    build: ./backend/timesheet-service
    ports: ["8004:8004"]
    depends_on: [postgres, redis]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
```

### 9.2 Kubernetes (Production)

Each service deployed as:
- Deployment with 2+ replicas
- Service for internal communication
- HorizontalPodAutoscaler for scaling
- Ingress for external access

---

## 10. Monitoring & Observability

### 10.1 Health Checks

Each service exposes `/health` endpoint:
```json
{
  "status": "healthy",
  "service": "project-service",
  "version": "1.0.0",
  "checks": {
    "database": {"status": "healthy"},
    "redis": {"status": "healthy"}
  }
}
```

### 10.2 Metrics (Prometheus)

Key metrics:
- Request latency (p50, p95, p99)
- Request rate by endpoint
- Error rate
- Database connection pool usage
- Redis cache hit rate
- LLM inference duration

### 10.3 Logging

Structured JSON logging with correlation IDs:
```json
{
  "timestamp": "2025-01-19T10:30:00Z",
  "level": "INFO",
  "service": "project-service",
  "correlation_id": "abc-123",
  "message": "Task status updated",
  "task_id": "uuid",
  "new_status": "done"
}
```

---

## 11. Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | All | PostgreSQL connection string |
| `REDIS_URL` | All | Redis connection string |
| `JWT_SECRET_KEY` | Auth | JWT signing key |
| `JWT_ALGORITHM` | Auth | HS256 (default) |
| `OPENAI_API_KEY` | Insights | OpenAI API key |
| `OPENAI_MODEL` | Insights | gpt-4-turbo (default) |
| `CORS_ORIGINS` | All | Allowed origins |
| `LOG_LEVEL` | All | DEBUG/INFO/WARNING/ERROR |

---

## 12. Appendices

### A. API Specifications

OpenAPI specs located in `docs/api/openapi/`:
- `auth-service.yaml`
- `project-service.yaml`
- `insights-service.yaml`
- `timesheet-service.yaml`

### B. Database Migrations

Alembic migrations in each service's `alembic/versions/` directory.

### C. Seed Data

Initial projects from IT infrastructure portfolio:
- Vulnerabilities Remediation (65%)
- Cloud Migration Planning (70%)
- WAF/API Security (65%)
- Tape Library & Backup Server Replacements (20%)

Recent milestones: NLB Replacement, Exchange Node Addition, Oracle 19c Migration

Upcoming: PAM Re-implementation, APM across DLD, Data Center Firewall
