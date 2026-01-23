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

The platform implements a comprehensive permission system with six categories:

#### Permission Structure

```typescript
interface Role {
  id: string
  name: string
  displayName: string
  description: string
  isSystemRole: boolean
  permissions: {
    dashboard: { access: boolean; view_analytics: boolean }
    projects: { create: boolean; read: boolean; update: boolean; delete: boolean; archive: boolean }
    tasks: { create: boolean; read: boolean; update: boolean; delete: boolean; assign: boolean; move: boolean }
    team: { access: boolean; view_members: boolean; manage_members: boolean; manage_teams: boolean }
    users: { create: boolean; read: boolean; update: boolean; delete: boolean; manage_roles: boolean }
    settings: { access: boolean; manage_roles: boolean; view_audit: boolean }
  }
}
```

#### Default Role Permissions

| Permission Category | Admin | Project Manager | Contributor |
|---------------------|-------|-----------------|-------------|
| **Dashboard** | | | |
| - Access | ✓ | ✓ | ✓ |
| - View Analytics | ✓ | ✗ | ✗ |
| **Projects** | | | |
| - Create | ✓ | ✓ | ✗ |
| - Read | ✓ | ✓ | ✓ (assigned only) |
| - Update | ✓ | ✓ | ✗ |
| - Delete | ✓ | ✗ | ✗ |
| - Archive | ✓ | ✗ | ✗ |
| **Tasks** | | | |
| - Create | ✓ | ✓ | ✓ |
| - Read | ✓ | ✓ | ✓ |
| - Update | ✓ | ✓ | ✓ (assigned only) |
| - Delete | ✓ | ✓ | ✗ |
| - Assign | ✓ | ✓ | ✗ |
| - Move | ✓ | ✓ | ✓ |
| **Team** | | | |
| - Access | ✓ | ✗ | ✗ |
| - View Members | ✓ | ✓ | ✗ |
| - Manage Members | ✓ | ✗ | ✗ |
| - Manage Teams | ✓ | ✗ | ✗ |
| **Users** | | | |
| - Create | ✓ | ✗ | ✗ |
| - Read | ✓ | ✓ | ✓ |
| - Update | ✓ | ✗ | ✗ |
| - Delete | ✓ | ✗ | ✗ |
| - Manage Roles | ✓ | ✗ | ✗ |
| **Settings** | | | |
| - Access | ✓ | ✗ | ✗ |
| - Manage Roles | ✓ | ✗ | ✗ |
| - View Audit | ✓ | ✓ | ✗ |

#### Permission Features

- **Custom Roles**: Admins can create custom roles with any permission combination
- **Real-Time Updates**: Role changes sync immediately to logged-in users via cross-store synchronization
- **Team-Based Filtering**: Users only see projects where they're assigned to tasks
- **Activity Logging**: User login history tracked with timestamps and user agents

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
│   │   ├── PortfolioMetrics.tsx      # Active/Completed project counts
│   │   ├── ProjectTimeline.tsx       # Timeline with milestones
│   │   ├── ProjectGrid.tsx           # Grid view of projects
│   │   ├── RecentActivity.tsx        # Recent changes/updates
│   │   └── RiskAlerts.tsx            # High-risk items
│   │
│   ├── projects/
│   │   ├── ProjectCard.tsx           # Project card with progress
│   │   ├── ProjectDetailModal.tsx    # Detailed project view & editing
│   │   ├── TaskCard.tsx              # Individual task display
│   │   ├── AddTaskForm.tsx           # Task creation form
│   │   └── ProjectFilters.tsx        # Filter by status/priority
│   │
│   ├── settings/
│   │   ├── UserManager.tsx           # User CRUD operations
│   │   ├── TeamManager.tsx           # Team management
│   │   ├── RoleManager.tsx           # Role & permission management
│   │   └── ActivityLog.tsx           # User activity/login history
│   │
│   └── layout/
│       ├── Navbar.tsx                # Top navigation bar
│       ├── Sidebar.tsx               # Side navigation with permissions
│       └── ProtectedRoute.tsx        # Route-level permission checks
│
├── pages/
│   ├── DashboardPage.tsx             # Executive dashboard (/)
│   ├── ProjectsPage.tsx              # Project list & management
│   ├── MyTasksPage.tsx               # Personal task view with editing
│   ├── TeamPage.tsx                  # Team & user management
│   ├── SettingsPage.tsx              # Role & permission settings
│   └── LoginPage.tsx                 # Authentication
│
└── store/
    ├── authSlice.ts                  # User auth & permissions
    ├── projectSlice.ts               # Projects & tasks state
    └── teamSlice.ts                  # Users, teams, roles & RBAC
```

#### Key Component Features

**ProjectDetailModal.tsx**
- View project details, tasks, and comments
- **Admin Edit Mode**: Inline editing of project manager, team, and priority
- Add/edit/delete tasks with assignee selection
- Multi-comment system with timestamps
- Progress tracking and status updates

**MyTasksPage.tsx**
- Personal task dashboard with filters (Active, Overdue, All)
- Sort by due date, status, or priority
- **Click-to-Edit**: Opens ProjectDetailModal for task editing
- Case-insensitive assignee matching
- Overdue indicators and progress visualization

**RoleManager.tsx**
- Create/edit custom roles
- Granular permission management across 6 categories
- Visual permission matrix
- System role protection (admin, project_manager, contributor)
- Real-time permission sync via cross-store communication

**UserManager.tsx**
- User CRUD operations with role/team assignment
- Activity log display (last login, login history)
- Account activation/deactivation
- Password reset functionality
- Login event tracking (50 most recent events)

### 8.2 State Management

The application uses **Zustand** with persistence middleware for client-side state management:

#### Store Architecture

```typescript
// authSlice.ts - Authentication & User State
interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (user: User, accessToken: string) => void
  logout: () => void
  hasRole: (role: string) => boolean
  updateUserRoles: (roles: string[]) => void    // Real-time role updates
  updateUserTeams: (teams: string[]) => void    // Real-time team updates
}

// teamSlice.ts - Users, Teams & RBAC
interface TeamState {
  users: User[]
  teams: Team[]
  roles: Role[]
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  toggleUserStatus: (id: string) => void
  resetUserPassword: (id: string, newPassword: string) => void
  recordLogin: (userId: string) => void          // Activity tracking
  // ... team and role methods
}

// projectSlice.ts - Projects & Tasks
interface ProjectState {
  projects: Project[]
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void            // Soft delete
  // ... task methods, Kanban state
}
```

#### Cross-Store Synchronization

When a user's role or team is updated in `teamSlice`, it automatically syncs to `authSlice`:

```typescript
// In teamSlice.ts - updateUser action
updateUser: (id, updates) =>
  set((state) => {
    const updatedUsers = state.users.map((user) =>
      user.id === id ? { ...user, ...updates } : user
    )

    // Sync with auth store if the updated user is currently logged in
    const authUser = useAuthStore.getState().user
    if (authUser && authUser.id === id) {
      if (updates.roles) {
        useAuthStore.getState().updateUserRoles(updates.roles)
      }
      if (updates.teams) {
        useAuthStore.getState().updateUserTeams(updates.teams)
      }
    }

    return { users: updatedUsers }
  })
```

**Benefits:**
- Permission changes apply immediately without re-login
- No stale permission checks
- Consistent state across the application

#### Data Persistence

Each store uses Zustand's `persist` middleware with LocalStorage:

```typescript
export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({ /* state and actions */ }),
    {
      name: 'team-storage',
      version: 2,                    // Schema version
      migrate: (persistedState, version) => {
        // Handle migrations from older versions
        if (version === 0) {
          // Add new fields with defaults
        }
        if (version <= 1) {
          // Add dashboard/team permissions
        }
        return state
      }
    }
  )
)
```

**Features:**
- Automatic serialization/deserialization
- Cross-tab synchronization
- Version-based schema migration
- Keeps last 50 login events per user

### 8.3 Real-time Updates

**LocalStorage Events** (cross-tab synchronization):
- User opens app in multiple tabs
- Changes in one tab automatically sync to others
- Powered by browser's `storage` event

**State Update Patterns:**
- Task status changes → Kanban board refresh
- Role/permission updates → Immediate UI re-render
- User login → Activity log updated
- Project updates → Dashboard metrics recalculated

---

## 9. Data Persistence & Migration

### 9.1 Client-Side Persistence Strategy

The frontend uses **Zustand persist middleware** with LocalStorage for data persistence:

#### Storage Keys

| Store | Storage Key | Version | Size Limit |
|-------|-------------|---------|------------|
| authSlice | `auth-storage` | 1 | ~5KB |
| projectSlice | `project-storage` | 3 | ~100KB |
| teamSlice | `team-storage` | 2 | ~50KB |

#### Persisted State

```typescript
// authSlice - Partial persistence (security)
partialize: (state) => ({
  user: state.user,
  accessToken: state.accessToken,
  isAuthenticated: state.isAuthenticated,
})
// Note: Sensitive methods not persisted, only data

// teamSlice - Full persistence
persist(
  (set) => ({ users, teams, roles, ...actions }),
  {
    name: 'team-storage',
    version: 2,  // Current schema version
  }
)
```

### 9.2 Schema Migration System

Each store implements versioned migrations to handle schema changes:

#### Migration Example: Adding Dashboard Permissions

```typescript
// teamSlice.ts - Version 1 to 2 migration
migrate: (persistedState: any, version: number) => {
  let state = persistedState as TeamState

  // Migration from version 1 to 2: add dashboard and team permissions
  if (version <= 1) {
    const updatedRoles = state.roles.map((role) => {
      // Check if role already has new permission structure
      if (!role.permissions.dashboard || !role.permissions.team) {
        const { dashboard: _d, team: _t, ...oldPermissions } = role.permissions as any
        return {
          ...role,
          permissions: {
            dashboard: role.name === 'admin'
              ? { access: true, view_analytics: true }
              : { access: true, view_analytics: false },
            ...oldPermissions,
            team: role.name === 'admin'
              ? { access: true, view_members: true, manage_members: true, manage_teams: true }
              : role.name === 'project_manager'
              ? { access: false, view_members: true, manage_members: false, manage_teams: false }
              : { access: false, view_members: false, manage_members: false, manage_teams: false },
          },
        }
      }
      return role
    })

    state = {
      ...state,
      roles: updatedRoles,
    }
  }

  return state as TeamState
}
```

#### Migration History

| Version | Store | Changes | Date |
|---------|-------|---------|------|
| 0 → 1 | teamSlice | Added `password` and `loginHistory` to User | Dec 2024 |
| 1 → 2 | teamSlice | Added `dashboard` and `team` permissions to Role | Jan 2025 |
| 2 → 3 | projectSlice | Added soft delete (`isDeleted` flag) | Jan 2025 |

### 9.3 Cross-Tab Synchronization

Zustand persist automatically handles cross-tab sync via browser's `storage` event:

```typescript
// Automatic behavior - no custom code needed
// User opens app in Tab A
Tab A: localStorage['team-storage'] = { users: [...] }

// User updates role in Tab B
Tab B: localStorage['team-storage'] = { users: [...updated] }

// Tab A receives 'storage' event and re-hydrates
Tab A: Zustand auto-reloads state from localStorage
```

**Benefits:**
- No manual event listeners
- Consistent state across all tabs
- Handles rapid updates with debouncing
- Works offline

### 9.4 Data Size Management

**Strategies to prevent LocalStorage overflow (5-10MB limit):**

1. **Trim Login History**: Keep only last 50 login events per user
   ```typescript
   loginHistory: [...(user.loginHistory || []), newEvent].slice(-50)
   ```

2. **Soft Delete Projects**: Mark as deleted instead of removing
   ```typescript
   deleteProject: (id) => set((state) => ({
     projects: state.projects.map((p) =>
       p.id === id ? { ...p, isDeleted: true } : p
     ),
   }))
   ```

3. **Exclude Large Fields**: Don't persist computed/derivative data
   ```typescript
   // Don't persist large attachments or file blobs
   partialize: (state) => ({
     ...state,
     attachments: undefined,  // Exclude from persistence
   })
   ```

### 9.5 Backup & Recovery

**Manual Backup** (future enhancement):
```typescript
// Export all stores to JSON
const backup = {
  auth: localStorage['auth-storage'],
  projects: localStorage['project-storage'],
  team: localStorage['team-storage'],
  timestamp: new Date().toISOString(),
}
// Download as JSON file
```

**Recovery from Corruption:**
```typescript
// Clear corrupted storage
localStorage.removeItem('team-storage')

// Page reload will initialize with default data
window.location.reload()
```

---

## 10. Deployment Architecture

### 10.1 Docker Compose (Development)

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

### 10.2 Kubernetes (Production)

Each service deployed as:
- Deployment with 2+ replicas
- Service for internal communication
- HorizontalPodAutoscaler for scaling
- Ingress for external access

---

## 11. Monitoring & Observability

### 11.1 Health Checks

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

### 11.2 Metrics (Prometheus)

Key metrics:
- Request latency (p50, p95, p99)
- Request rate by endpoint
- Error rate
- Database connection pool usage
- Redis cache hit rate
- LLM inference duration

### 11.3 Logging

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

## 12. Environment Variables

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

## 13. Appendices

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

---

## 14. Recent Enhancements & Implementation Notes

### 14.1 RBAC System Expansion (January 2025)

**Problem**: Original RBAC lacked granular control over dashboard analytics and team management features.

**Solution**: Extended permission system to include `dashboard` and `team` categories:
- Dashboard permissions control analytics visibility
- Team permissions separate viewing from management capabilities
- Implemented version 2 migration to add permissions to existing roles

**Files Modified**:
- [teamSlice.ts](../../frontend/src/store/teamSlice.ts:38-46) - Extended Role interface
- [RoleManager.tsx](../../frontend/src/components/settings/RoleManager.tsx) - Added UI controls
- [authSlice.ts](../../frontend/src/store/authSlice.ts:20-21) - Added update methods

### 14.2 Cross-Store State Synchronization

**Problem**: When an admin changed a user's role, the logged-in user's permissions didn't update until re-login.

**Solution**: Implemented cross-store synchronization between `teamSlice` and `authSlice`:

```typescript
// teamSlice.updateUser checks if modified user is currently logged in
const authUser = useAuthStore.getState().user
if (authUser && authUser.id === id) {
  if (updates.roles) {
    useAuthStore.getState().updateUserRoles(updates.roles)
  }
  if (updates.teams) {
    useAuthStore.getState().updateUserTeams(updates.teams)
  }
}
```

**Benefits**:
- Role changes apply immediately
- No re-authentication required
- Consistent permission checks across UI

**Files Modified**:
- [teamSlice.ts](../../frontend/src/store/teamSlice.ts:239-257) - Added sync logic
- [authSlice.ts](../../frontend/src/store/authSlice.ts:53-75) - Added update methods

### 14.3 Admin Project Editing

**Problem**: Admins couldn't modify project metadata (manager, team, priority) after creation.

**Solution**: Added inline editing mode to ProjectDetailModal:
- Edit/Save button for admin users
- Dropdown selects for manager, team, and priority
- Local state management for edit mode
- Immediate save on button click

**Files Modified**:
- [ProjectDetailModal.tsx](../../frontend/src/components/projects/ProjectDetailModal.tsx:36-53) - Added edit mode

### 14.4 Task Editing from My Tasks

**Problem**: Users had to navigate to Projects page to edit their assigned tasks.

**Solution**: Made task cards in MyTasksPage clickable:
- Click opens ProjectDetailModal with full task details
- Users can edit task progress, status, and add comments
- Seamless UX without navigation

**Files Modified**:
- [MyTasksPage.tsx](../../frontend/src/pages/MyTasksPage.tsx:20-337) - Added modal support

### 14.5 User Activity Tracking

**Problem**: No audit trail for user logins and system access.

**Solution**: Implemented login history tracking:
- Records timestamp and user agent on each login
- Stores last 50 login events per user
- Visible in user management interface
- Updates "Last Active" timestamp

**Implementation**:
```typescript
recordLogin: (userId) =>
  set((state) => ({
    users: state.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            lastActive: 'Just now',
            loginHistory: [
              ...(user.loginHistory || []),
              {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
              },
            ].slice(-50), // Keep last 50 events
          }
        : user
    ),
  }))
```

**Files Modified**:
- [teamSlice.ts](../../frontend/src/store/teamSlice.ts:280-299) - Added recordLogin action
- [LoginPage.tsx](../../frontend/src/pages/LoginPage.tsx:39,82) - Call on successful login

### 14.6 Case-Insensitive Task Assignment

**Problem**: Task assignee matching was case-sensitive, causing mismatches.

**Solution**: Implemented case-insensitive comparison:
```typescript
const isAssigned = task.assignees.some(
  (assignee: string) => assignee.toLowerCase() === userName.toLowerCase()
)
```

**Files Modified**:
- [MyTasksPage.tsx](../../frontend/src/pages/MyTasksPage.tsx:41-43) - Updated comparison logic

### 14.7 Soft Delete for Projects

**Problem**: Deleting projects permanently removed historical data.

**Solution**: Implemented soft delete with `isDeleted` flag:
- Projects marked as deleted remain in database
- Filtered out from main views
- Can be recovered if needed
- Maintains referential integrity

**Files Modified**:
- [projectSlice.ts](../../frontend/src/store/projectSlice.ts) - Added isDeleted flag

### 14.8 Data Migration System

**Problem**: Schema changes broke existing user data in LocalStorage.

**Solution**: Implemented versioned migrations in Zustand persist:
- Each store has version number
- Migration function handles older versions
- Backwards compatible with graceful fallbacks
- Automatic on app load

**Example Migrations**:
- Version 0 → 1: Added password and loginHistory fields
- Version 1 → 2: Added dashboard and team permissions

**Implementation Pattern**:
```typescript
{
  name: 'team-storage',
  version: 2,
  migrate: (persistedState, version) => {
    // Apply transformations based on version
    return updatedState
  }
}
```
