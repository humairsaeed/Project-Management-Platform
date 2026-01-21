# Project Management Platform

A microservices-based project management application designed to replace manual PowerPoint reporting for IT infrastructure projects.

## Features

- **Executive Dashboard**: High-end infographical UI showing portfolio overview, project progress, and milestones
- **Interactive Gantt/Timeline**: Timeline view for milestones and task scheduling
- **Kanban Board**: Drag-and-drop task management with status columns
- **AI-Powered Insights**: Automatic executive summary generation and risk identification
- **RBAC Settings**: Role-based access control with Admin, Project Manager, and Contributor roles
- **Audit Trail**: Complete change history tracking for compliance

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX (Port 8000)                        │
│                      API Gateway / Reverse Proxy                 │
└───────────────┬──────────────┬──────────────┬───────────────────┘
                │              │              │
        ┌───────▼───────┐ ┌────▼────┐ ┌──────▼──────┐
        │ Auth Service  │ │ Project │ │  Insights   │
        │   (8001)      │ │ Service │ │  Service    │
        │               │ │ (8002)  │ │  (8003)     │
        └───────┬───────┘ └────┬────┘ └──────┬──────┘
                │              │              │
        ┌───────▼──────────────▼──────────────▼──────┐
        │              PostgreSQL + Redis             │
        └─────────────────────────────────────────────┘
```

| Service | Port | Description |
|---------|------|-------------|
| Nginx Gateway | 8000 | API Gateway, reverse proxy, static frontend |
| Auth Service | 8001 | Authentication, JWT, RBAC, user management |
| Project Service | 8002 | Projects, tasks, Kanban, Gantt timeline |
| Insights Service | 8003 | AI analysis, executive summaries, risk assessment |
| Frontend | 3000 | React SPA (also served via Nginx on 8000) |

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (async)
- **Database**: PostgreSQL 16 with schema separation
- **Cache/Messaging**: Redis 7
- **AI/LLM**: OpenAI GPT-4 for executive summaries
- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **Infrastructure**: Docker, Docker Compose, Nginx

## Quick Start - Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- Git

### 1. Clone and Configure

```bash
cd project-management-platform

# Copy and edit environment file
cp .env.example .env
# Edit .env with your settings (optional - defaults work for demo)
```

### 2. Start All Services

```bash
cd docker
docker compose up -d --build
```

This will start:
- PostgreSQL database with seed data
- Redis cache
- Auth, Project, and Insights microservices
- Frontend application
- Nginx API gateway

### 3. Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:8000 | Main application (via Nginx) |
| http://localhost:3000 | Frontend direct access |
| http://localhost:8080 | Adminer (Database UI) |
| http://localhost:8001/docs | Auth Service API docs |
| http://localhost:8002/docs | Project Service API docs |
| http://localhost:8003/docs | Insights Service API docs |

### 4. Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | demo123 | Administrator |
| john.smith@company.com | demo123 | Project Manager |
| sarah.jones@company.com | demo123 | Project Manager |

### 5. Stop Services

```bash
cd docker
docker compose down

# To also remove data volumes:
docker compose down -v
```

## Development Setup (Without Docker)

### Backend Services

```bash
# Install Python dependencies for each service
cd backend/auth-service
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload

# In separate terminals:
cd backend/project-service
pip install -r requirements.txt
uvicorn app.main:app --port 8002 --reload

cd backend/insights-service
pip install -r requirements.txt
uvicorn app.main:app --port 8003 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
project-management-platform/
├── backend/
│   ├── auth-service/           # Authentication & RBAC
│   │   ├── app/
│   │   │   └── main.py         # FastAPI application
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── project-service/        # Projects & Tasks
│   │   ├── app/
│   │   │   └── main.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── insights-service/       # AI Insights
│   │   ├── app/
│   │   │   └── main.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── migrations/             # SQL migrations
│       └── 002_audit_trail_rbac.sql
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API clients
│   │   └── store/              # Zustand state
│   ├── Dockerfile
│   └── nginx.conf
├── docker/
│   ├── docker-compose.yml      # Full stack deployment
│   ├── nginx.conf              # API gateway config
│   └── init-db.sql             # Database initialization
├── docs/
│   └── architecture/
│       └── system_architecture.md
├── .env.example
└── README.md
```

## Initial Projects (Demo Data)

| Project | Completion | Risk |
|---------|------------|------|
| Vulnerabilities Remediation | 65% | Medium |
| Cloud Migration Planning | 70% | Low |
| WAF/API Security | 65% | Medium |
| Tape Library & Backup Replacements | 20% | Low |

## API Endpoints

### Auth Service (Port 8001)
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Current user profile
- `GET /api/v1/users` - List users
- `GET /api/v1/roles` - List roles

### Project Service (Port 8002)
- `GET /api/v1/projects` - List projects
- `GET /api/v1/projects/{id}` - Project details
- `GET /api/v1/projects/{id}/tasks` - Project tasks
- `GET /api/v1/projects/{id}/kanban` - Kanban board
- `GET /api/v1/projects/{id}/timeline` - Gantt timeline
- `GET /api/v1/portfolio/overview` - Executive dashboard data

### Insights Service (Port 8003)
- `GET /api/v1/insights/projects/{id}/summary` - AI summary
- `GET /api/v1/insights/projects/{id}/risks` - Risk assessment
- `POST /api/v1/insights/analyze` - Request new analysis

## Health Checks

All services expose `/health` endpoints:
- http://localhost:8001/health (Auth)
- http://localhost:8002/health (Project)
- http://localhost:8003/health (Insights)

## Troubleshooting

### Services not starting
```bash
# Check logs
docker compose logs -f

# Check specific service
docker compose logs auth-service
```

### Database connection issues
```bash
# Verify PostgreSQL is running
docker compose ps
docker exec pm-postgres pg_isready -U dev

# Check database schemas
docker exec pm-postgres psql -U dev -d project_mgmt -c "\dn"
```

### Frontend not loading
```bash
# Check if frontend container is running
docker compose logs frontend

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

### Clear everything and start fresh
```bash
cd docker
docker compose down -v
docker compose up -d --build
```

## Documentation

- [System Architecture](docs/architecture/system_architecture.md) - Complete technical architecture

## License

Proprietary - Internal use only
