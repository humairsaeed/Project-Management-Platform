# Troubleshooting: Login Not Working

## Issue
After rebuilding containers, login shows "Invalid email or password"

## Diagnostic Steps

### 1. Check Auth Service Logs
```bash
docker logs pm-auth-service --tail 50
```
Look for any errors during startup or login attempts.

### 2. Check Database Initialization
```bash
docker logs pm-postgres --tail 100 | grep -i error
```
Check if there were any errors during database initialization.

### 3. Verify Users Table
Connect to Adminer (http://localhost:8080) with:
- Server: postgres
- Username: dev
- Password: devpass
- Database: project_mgmt

Run this SQL:
```sql
-- Check if users exist
SELECT id, email, first_name, last_name, is_active
FROM auth.users
ORDER BY created_at;

-- Check if roles exist
SELECT id, name, display_name
FROM auth.roles;

-- Check if user_roles exist
SELECT ur.id, u.email, r.name as role_name
FROM auth.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN auth.roles r ON ur.role_id = r.id;
```

### 4. Check Project Service Status
```bash
docker logs pm-project-service --tail 30
```
Verify it's running without errors now.

### 5. Test Direct API Call
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "demo123"
  }'
```

## Possible Causes

1. **Database not initialized properly**
   - Solution: Check if init-db.sql has errors
   - Check: `docker logs pm-postgres | grep ERROR`

2. **Auth service can't connect to database**
   - Check: Auth service logs for connection errors
   - Verify: DATABASE_URL environment variable

3. **Password hash mismatch**
   - The seed data uses password: `demo123`
   - Hash: `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYk/Fqm.vKHa`

4. **Database volume has stale data**
   - If you want fresh start:
   ```bash
   cd docker
   docker compose down -v  # WARNING: Deletes all data!
   docker compose up -d
   ```

## Quick Fix

If the database seems corrupted, try:

```bash
cd docker

# Stop all services
docker compose down

# Remove only the database volume (keeps other data)
docker volume rm docker_postgres_data

# Restart - this will recreate database from init-db.sql
docker compose up -d

# Wait 30 seconds for initialization
sleep 30

# Check if services are healthy
docker compose ps
```

## Expected Seed Users

After initialization, these users should exist:

| Email | Password | Role | User ID |
|-------|----------|------|---------|
| admin@company.com | demo123 | admin | 00000000-0000-0000-0000-000000000001 |
| john.smith@company.com | demo123 | project_manager | 00000000-0000-0000-0000-000000000002 |
| sarah.jones@company.com | demo123 | project_manager | 00000000-0000-0000-0000-000000000003 |

## Contact Support

If none of these steps work, provide:
1. Output of `docker compose ps`
2. Output of `docker logs pm-auth-service --tail 50`
3. Output of `docker logs pm-postgres --tail 50`
4. Screenshot of Adminer showing auth.users table
