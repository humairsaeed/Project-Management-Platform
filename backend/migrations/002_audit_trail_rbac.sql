-- =====================================================
-- AUDIT TRAIL & RBAC SCHEMA UPDATE
-- Migration: 002_audit_trail_rbac.sql
-- Description: Add audit logging and enhanced RBAC
-- =====================================================

-- =====================================================
-- 1. AUDIT TRAIL TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS auth.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who made the change
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email VARCHAR(255) NOT NULL,  -- Denormalized for history

    -- What was changed
    table_name VARCHAR(100) NOT NULL,  -- e.g., 'projects.tasks'
    record_id UUID NOT NULL,           -- ID of the modified record

    -- Action type
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),

    -- Change details (JSONB for flexibility)
    old_value JSONB,                   -- Previous state (NULL for CREATE)
    new_value JSONB,                   -- New state (NULL for DELETE)
    changed_fields TEXT[],             -- List of fields that changed

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON auth.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON auth.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON auth.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON auth.audit_logs(action);

-- =====================================================
-- 2. ENHANCED RBAC TABLES
-- =====================================================

-- Roles table (if not exists, update)
CREATE TABLE IF NOT EXISTS auth.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Granular permissions as JSONB
    permissions JSONB NOT NULL DEFAULT '{}',

    -- System role flag (cannot be deleted)
    is_system_role BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions structure example:
-- {
--   "projects": {"create": true, "read": true, "update": true, "delete": false},
--   "tasks": {"create": true, "read": true, "update": true, "delete": true, "assign": true},
--   "users": {"create": false, "read": true, "update": false, "delete": false},
--   "settings": {"access": true, "manage_roles": false}
-- }

-- User-Role assignments (many-to-many with scope)
CREATE TABLE IF NOT EXISTS auth.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,

    -- Optional scope (NULL = global, or specific project/team)
    scope_type VARCHAR(20) CHECK (scope_type IN ('global', 'project', 'team')),
    scope_id UUID,  -- project_id or team_id if scoped

    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, role_id, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON auth.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_scope ON auth.user_roles(scope_type, scope_id);

-- =====================================================
-- 3. SEED DEFAULT ROLES
-- =====================================================

INSERT INTO auth.roles (name, display_name, description, permissions, is_system_role) VALUES
(
    'admin',
    'Administrator',
    'Full system access including user management and settings',
    '{
        "projects": {"create": true, "read": true, "update": true, "delete": true, "archive": true},
        "tasks": {"create": true, "read": true, "update": true, "delete": true, "assign": true, "move": true},
        "users": {"create": true, "read": true, "update": true, "delete": true, "manage_roles": true},
        "teams": {"create": true, "read": true, "update": true, "delete": true},
        "settings": {"access": true, "manage_roles": true, "view_audit": true},
        "insights": {"generate": true, "read": true}
    }'::jsonb,
    TRUE
),
(
    'project_manager',
    'Project Manager',
    'Can manage projects and tasks, assign team members',
    '{
        "projects": {"create": true, "read": true, "update": true, "delete": false, "archive": false},
        "tasks": {"create": true, "read": true, "update": true, "delete": true, "assign": true, "move": true},
        "users": {"create": false, "read": true, "update": false, "delete": false, "manage_roles": false},
        "teams": {"create": false, "read": true, "update": false, "delete": false},
        "settings": {"access": false, "manage_roles": false, "view_audit": true},
        "insights": {"generate": true, "read": true}
    }'::jsonb,
    TRUE
),
(
    'contributor',
    'Contributor',
    'Can view and update assigned tasks',
    '{
        "projects": {"create": false, "read": true, "update": false, "delete": false, "archive": false},
        "tasks": {"create": true, "read": true, "update": true, "delete": false, "assign": false, "move": true},
        "users": {"create": false, "read": true, "update": false, "delete": false, "manage_roles": false},
        "teams": {"create": false, "read": true, "update": false, "delete": false},
        "settings": {"access": false, "manage_roles": false, "view_audit": false},
        "insights": {"generate": false, "read": true}
    }'::jsonb,
    TRUE
)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
    audit_user_email VARCHAR(255);
    changed_cols TEXT[];
BEGIN
    -- Get current user from session variable (set by application)
    audit_user_id := COALESCE(
        current_setting('app.current_user_id', TRUE)::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
    audit_user_email := COALESCE(
        current_setting('app.current_user_email', TRUE),
        'system'
    );

    IF TG_OP = 'INSERT' THEN
        INSERT INTO auth.audit_logs (user_id, user_email, table_name, record_id, action, new_value)
        VALUES (audit_user_id, audit_user_email, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, NEW.id, 'CREATE', to_jsonb(NEW));
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Detect changed columns
        SELECT array_agg(key) INTO changed_cols
        FROM jsonb_each(to_jsonb(NEW)) AS n(key, value)
        JOIN jsonb_each(to_jsonb(OLD)) AS o(key, value) ON n.key = o.key
        WHERE n.value IS DISTINCT FROM o.value;

        INSERT INTO auth.audit_logs (user_id, user_email, table_name, record_id, action, old_value, new_value, changed_fields)
        VALUES (audit_user_id, audit_user_email, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, NEW.id,
                CASE WHEN 'status' = ANY(changed_cols) THEN 'STATUS_CHANGE' ELSE 'UPDATE' END,
                to_jsonb(OLD), to_jsonb(NEW), changed_cols);
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO auth.audit_logs (user_id, user_email, table_name, record_id, action, old_value)
        VALUES (audit_user_id, audit_user_email, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ATTACH AUDIT TRIGGERS TO KEY TABLES
-- =====================================================

-- Tasks audit trigger
DROP TRIGGER IF EXISTS audit_tasks_trigger ON projects.tasks;
CREATE TRIGGER audit_tasks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON projects.tasks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Projects audit trigger
DROP TRIGGER IF EXISTS audit_projects_trigger ON projects.projects;
CREATE TRIGGER audit_projects_trigger
    AFTER INSERT OR UPDATE OR DELETE ON projects.projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Milestones audit trigger
DROP TRIGGER IF EXISTS audit_milestones_trigger ON projects.milestones;
CREATE TRIGGER audit_milestones_trigger
    AFTER INSERT OR UPDATE OR DELETE ON projects.milestones
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- =====================================================
-- 6. DROP TIMESHEETS SCHEMA (Task 4)
-- =====================================================

DROP SCHEMA IF EXISTS timesheets CASCADE;

-- =====================================================
-- 7. HELPER VIEWS
-- =====================================================

-- View for recent audit activity
CREATE OR REPLACE VIEW auth.recent_audit_activity AS
SELECT
    al.id,
    al.user_email,
    al.table_name,
    al.record_id,
    al.action,
    al.changed_fields,
    al.created_at,
    CASE
        WHEN al.table_name = 'projects.tasks' THEN al.new_value->>'title'
        WHEN al.table_name = 'projects.projects' THEN al.new_value->>'name'
        WHEN al.table_name = 'projects.milestones' THEN al.new_value->>'name'
        ELSE 'Unknown'
    END as record_name
FROM auth.audit_logs al
ORDER BY al.created_at DESC
LIMIT 100;

-- View for user permissions
CREATE OR REPLACE VIEW auth.user_permissions AS
SELECT
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    r.display_name as role_display_name,
    r.permissions,
    ur.scope_type,
    ur.scope_id
FROM auth.users u
LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
LEFT JOIN auth.roles r ON ur.role_id = r.id;
