# Project Management Platform

A microservices-based project management application designed to replace manual PowerPoint reporting for IT infrastructure projects.

## Features

- **Executive Dashboard**: High-end infographical UI showing portfolio overview, project progress, and milestones
- **Interactive Gantt/Timeline**: Draggable timeline for milestones and task scheduling
- **Kanban Board**: Drag-and-drop task management with status columns
- **AI-Powered Insights**: Automatic executive summary generation and risk identification
- **Time & Productivity Tracking**: Timesheets with productivity scores

## Architecture

The platform consists of four microservices:

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 8001 | Authentication, RBAC, team/skill management |
| Project Service | 8002 | Projects, tasks, Kanban, Gantt timeline |
| Insights Service | 8003 | AI analysis, executive summaries, risk assessment |
| Timesheet Service | 8004 | Time entries, productivity metrics |

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (async), Alembic
- **Database**: PostgreSQL 16 with schema separation
- **Cache/Messaging**: Redis 7 (sessions, cache, event streams)
- **AI/LLM**: OpenAI GPT-4 for executive summaries
- **Frontend**: React 18, TypeScript, Tailwind CSS

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- OpenAI API key

### Development Setup

1. **Clone and configure**
   ```bash
   cd project-management-platform
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Start infrastructure**
   ```bash
   cd docker
   docker compose up -d
   ```

3. **Verify databases**
   ```bash
   docker exec -it pm-postgres psql -U dev -d project_mgmt -c "\dn"
   # Should show: auth, projects, insights, timesheets
   ```

4. **Run services** (when implemented)
   ```bash
   # Each service in separate terminal
   cd backend/auth-service && uvicorn app.main:app --port 8001 --reload
   cd backend/project-service && uvicorn app.main:app --port 8002 --reload
   cd backend/insights-service && uvicorn app.main:app --port 8003 --reload
   cd backend/timesheet-service && uvicorn app.main:app --port 8004 --reload
   ```

5. **Run frontend** (when implemented)
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

## Project Structure

```
project-management-platform/
├── backend/
│   ├── shared/              # Shared libraries
│   ├── auth-service/        # Service A: Auth & RBAC
│   ├── project-service/     # Service B: Project/Task Engine
│   ├── insights-service/    # Service C: AI Insights
│   └── timesheet-service/   # Service D: Time & Productivity
├── frontend/
│   └── src/
│       ├── components/      # React components
│       ├── pages/           # Page components
│       └── services/        # API clients
├── docker/
│   └── docker-compose.yml   # Development environment
├── docs/
│   └── architecture/        # Technical documentation
└── scripts/
    └── seed-data.py         # Database seeding
```

## Initial Projects

The platform is pre-configured with IT infrastructure projects:

| Project | Completion |
|---------|------------|
| Vulnerabilities Remediation | 65% |
| Cloud Migration Planning | 70% |
| WAF/API Security | 65% |
| Tape Library & Backup Server Replacements | 20% |

**Recent Milestones**: NLB Replacement, Exchange Node Addition, Oracle 19c Migration

**Upcoming**: PAM Re-implementation, APM across DLD, Data Center Firewall

## API Documentation

Once services are running, access OpenAPI docs at:
- Auth Service: http://localhost:8001/docs
- Project Service: http://localhost:8002/docs
- Insights Service: http://localhost:8003/docs
- Timesheet Service: http://localhost:8004/docs

## Documentation

- [System Architecture](docs/architecture/system_architecture.md) - Complete technical architecture

## License

Proprietary - Internal use only
