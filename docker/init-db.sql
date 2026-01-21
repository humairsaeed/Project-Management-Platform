-- Project Management Platform - Database Initialization
-- This script runs automatically when the PostgreSQL container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- CREATE SCHEMAS
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS projects;
CREATE SCHEMA IF NOT EXISTS insights;

-- =============================================================================
-- AUTH SCHEMA TABLES
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS auth.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    lead_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS auth.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Role assignments
CREATE TABLE IF NOT EXISTS auth.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
    scope_type VARCHAR(20) CHECK (scope_type IN ('global', 'project', 'team')),
    scope_id UUID,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id, scope_type, scope_id)
);

-- Team memberships
CREATE TABLE IF NOT EXISTS auth.team_memberships (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES auth.teams(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, team_id)
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Audit logs
CREATE TABLE IF NOT EXISTS auth.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
    old_value JSONB,
    new_value JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PROJECTS SCHEMA TABLES
-- =============================================================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    owner_team_id UUID REFERENCES auth.teams(id),
    manager_user_id UUID REFERENCES auth.users(id),
    target_start_date DATE,
    target_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (hierarchical)
CREATE TABLE IF NOT EXISTS projects.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES projects.tasks(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to_user_id UUID REFERENCES auth.users(id),
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    position INTEGER DEFAULT 0,
    path LTREE,
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS projects.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'missed', 'moved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task dependencies
CREATE TABLE IF NOT EXISTS projects.task_dependencies (
    predecessor_task_id UUID NOT NULL REFERENCES projects.tasks(id) ON DELETE CASCADE,
    successor_task_id UUID NOT NULL REFERENCES projects.tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
    PRIMARY KEY (predecessor_task_id, successor_task_id)
);

-- =============================================================================
-- INSIGHTS SCHEMA TABLES
-- =============================================================================

-- Analysis requests
CREATE TABLE IF NOT EXISTS insights.analysis_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects.projects(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    input_context JSONB,
    requested_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Generated insights
CREATE TABLE IF NOT EXISTS insights.generated_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects.projects(id) ON DELETE CASCADE,
    analysis_request_id UUID REFERENCES insights.analysis_requests(id),
    insight_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    confidence_score DECIMAL(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE IF NOT EXISTS insights.risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    risk_category VARCHAR(50) NOT NULL,
    risk_description TEXT NOT NULL,
    likelihood VARCHAR(20) CHECK (likelihood IN ('low', 'medium', 'high')),
    impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high', 'critical')),
    mitigation_suggestion TEXT,
    status VARCHAR(20) DEFAULT 'identified' CHECK (status IN ('identified', 'mitigating', 'resolved', 'accepted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON auth.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON auth.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON auth.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON auth.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner_team ON projects.projects(owner_team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON projects.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON projects.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON projects.tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON projects.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_path ON projects.tasks USING GIST (path);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON projects.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_requests_project ON insights.analysis_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_insights_project ON insights.generated_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_project ON insights.risk_assessments(project_id);

-- =============================================================================
-- SEED DATA - ROLES
-- =============================================================================

INSERT INTO auth.roles (name, display_name, description, permissions, is_system_role) VALUES
('admin', 'Administrator', 'Full system access', '{"projects": {"create": true, "read": true, "update": true, "delete": true}, "tasks": {"create": true, "read": true, "update": true, "delete": true, "assign": true}, "users": {"create": true, "read": true, "update": true, "delete": true, "manage_roles": true}, "settings": {"access": true, "manage_roles": true, "view_audit": true}}'::jsonb, TRUE),
('project_manager', 'Project Manager', 'Can manage projects and tasks', '{"projects": {"create": true, "read": true, "update": true, "delete": false}, "tasks": {"create": true, "read": true, "update": true, "delete": true, "assign": true}, "users": {"read": true}, "settings": {"view_audit": true}}'::jsonb, TRUE),
('contributor', 'Contributor', 'Can view and update assigned tasks', '{"projects": {"read": true}, "tasks": {"create": true, "read": true, "update": true}, "users": {"read": true}}'::jsonb, TRUE)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SEED DATA - USERS (password: demo123)
-- =============================================================================

INSERT INTO auth.users (id, email, password_hash, first_name, last_name, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYk/Fqm.vKHa', 'System', 'Admin', TRUE),
('00000000-0000-0000-0000-000000000002', 'john.smith@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYk/Fqm.vKHa', 'John', 'Smith', TRUE),
('00000000-0000-0000-0000-000000000003', 'sarah.jones@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYk/Fqm.vKHa', 'Sarah', 'Jones', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Assign roles
INSERT INTO auth.user_roles (user_id, role_id, scope_type)
SELECT '00000000-0000-0000-0000-000000000001', id, 'global' FROM auth.roles WHERE name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id, scope_type)
SELECT '00000000-0000-0000-0000-000000000002', id, 'global' FROM auth.roles WHERE name = 'project_manager'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id, scope_type)
SELECT '00000000-0000-0000-0000-000000000003', id, 'global' FROM auth.roles WHERE name = 'project_manager'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA - TEAMS
-- =============================================================================

INSERT INTO auth.teams (id, name, description, lead_user_id) VALUES
('00000000-0000-0000-0000-000000000011', 'IT Infrastructure', 'Core infrastructure team', '00000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000012', 'Security', 'Information security team', '00000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000013', 'Cloud Services', 'Cloud migration team', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SEED DATA - PROJECTS
-- =============================================================================

INSERT INTO projects.projects (id, name, description, status, priority, risk_level, completion_percentage, owner_team_id, manager_user_id, target_start_date, target_end_date) VALUES
('00000000-0000-0000-0000-000000000101', 'Vulnerabilities Remediation', 'Address critical security vulnerabilities across production systems', 'active', 'high', 'medium', 65, '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', '2025-01-01', '2025-03-31'),
('00000000-0000-0000-0000-000000000102', 'Cloud Migration Planning', 'Plan and execute migration to Azure cloud', 'active', 'high', 'low', 70, '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', '2025-01-01', '2025-06-30'),
('00000000-0000-0000-0000-000000000103', 'WAF/API Security', 'Implement WAF and API Gateway security controls', 'active', 'critical', 'medium', 65, '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', '2025-01-01', '2025-03-15'),
('00000000-0000-0000-0000-000000000104', 'Tape Library & Backup Replacements', 'Replace aging backup infrastructure', 'active', 'medium', 'low', 20, '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', '2025-01-01', '2025-08-31')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED DATA - TASKS
-- =============================================================================

INSERT INTO projects.tasks (id, project_id, title, status, priority, assigned_to_user_id, completion_percentage, start_date, due_date) VALUES
('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000103', 'WAF Rule Design', 'done', 'high', '00000000-0000-0000-0000-000000000002', 100, '2025-01-01', '2025-01-15'),
('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000103', 'API Inventory', 'done', 'high', '00000000-0000-0000-0000-000000000003', 100, '2025-01-05', '2025-01-12'),
('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000103', 'Test Environment Setup', 'done', 'medium', '00000000-0000-0000-0000-000000000002', 100, '2025-01-10', '2025-01-17'),
('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-000000000103', 'Production WAF Deployment', 'in_progress', 'critical', '00000000-0000-0000-0000-000000000002', 60, '2025-01-15', '2025-02-05'),
('00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-000000000103', 'API Gateway Integration', 'in_progress', 'high', '00000000-0000-0000-0000-000000000003', 30, '2025-01-20', '2025-02-10'),
('00000000-0000-0000-0000-000000001006', '00000000-0000-0000-0000-000000000103', 'Security Testing', 'todo', 'high', '00000000-0000-0000-0000-000000000003', 0, '2025-02-01', '2025-02-15'),
('00000000-0000-0000-0000-000000001007', '00000000-0000-0000-0000-000000000103', 'Documentation', 'todo', 'medium', '00000000-0000-0000-0000-000000000002', 0, '2025-02-10', '2025-02-20')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED DATA - MILESTONES
-- =============================================================================

INSERT INTO projects.milestones (id, project_id, name, target_date, status) VALUES
('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000103', 'Production Deployment', '2025-02-15', 'pending'),
('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000000103', 'Project Complete', '2025-03-05', 'pending'),
('00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000000102', 'Phase 1 Complete', '2025-03-01', 'pending')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO dev;
GRANT USAGE ON SCHEMA projects TO dev;
GRANT USAGE ON SCHEMA insights TO dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA projects TO dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA insights TO dev;
