-- Project Management Platform - Database Initialization
-- This script runs when PostgreSQL container is first created

-- Create schemas for each microservice
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS projects;
CREATE SCHEMA IF NOT EXISTS insights;
CREATE SCHEMA IF NOT EXISTS timesheets;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable LTREE extension for hierarchical task paths
CREATE EXTENSION IF NOT EXISTS ltree;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA auth TO dev;
GRANT ALL PRIVILEGES ON SCHEMA projects TO dev;
GRANT ALL PRIVILEGES ON SCHEMA insights TO dev;
GRANT ALL PRIVILEGES ON SCHEMA timesheets TO dev;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database schemas initialized: auth, projects, insights, timesheets';
END $$;
