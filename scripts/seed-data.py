#!/usr/bin/env python3
"""
Seed Data Script for Project Management Platform

Seeds the database with initial IT infrastructure projects based on the requirements:
- Active Projects: Vulnerabilities Remediation (65%), Cloud Migration Planning (70%),
  WAF/API Security (65%), Tape Library & Backup Server Replacements (20%)
- Recent Milestones: NLB Replacement, Exchange Node Addition, Oracle 19c Migration
- Upcoming: PAM Re-implementation, APM across DLD, Data Center Firewall
"""

import asyncio
import os
from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

# This script will use SQLAlchemy async session when implemented
# For now, it serves as documentation of the seed data structure

SEED_DATA = {
    # ==========================================================================
    # SKILLS (Auth Schema)
    # ==========================================================================
    "skills": [
        {"id": uuid4(), "name": "WAF Configuration", "category": "security"},
        {"id": uuid4(), "name": "API Security", "category": "security"},
        {"id": uuid4(), "name": "Vulnerability Assessment", "category": "security"},
        {"id": uuid4(), "name": "Cloud Architecture", "category": "cloud"},
        {"id": uuid4(), "name": "AWS", "category": "cloud"},
        {"id": uuid4(), "name": "Azure", "category": "cloud"},
        {"id": uuid4(), "name": "Database Administration", "category": "database"},
        {"id": uuid4(), "name": "Oracle", "category": "database"},
        {"id": uuid4(), "name": "PostgreSQL", "category": "database"},
        {"id": uuid4(), "name": "Backup Systems", "category": "infrastructure"},
        {"id": uuid4(), "name": "Networking", "category": "infrastructure"},
        {"id": uuid4(), "name": "Load Balancing", "category": "infrastructure"},
        {"id": uuid4(), "name": "PAM/IAM", "category": "security"},
        {"id": uuid4(), "name": "Monitoring/APM", "category": "operations"},
        {"id": uuid4(), "name": "Firewall Management", "category": "security"},
    ],

    # ==========================================================================
    # ROLES (Auth Schema)
    # ==========================================================================
    "roles": [
        {
            "id": uuid4(),
            "name": "admin",
            "description": "Full system access",
            "permissions": ["*"],
        },
        {
            "id": uuid4(),
            "name": "project_manager",
            "description": "Manage projects and teams",
            "permissions": [
                "projects:read", "projects:write", "projects:delete",
                "tasks:read", "tasks:write", "tasks:delete",
                "timesheets:read", "timesheets:approve",
                "insights:read",
            ],
        },
        {
            "id": uuid4(),
            "name": "contributor",
            "description": "Update assigned tasks",
            "permissions": [
                "projects:read",
                "tasks:read", "tasks:update_own",
                "timesheets:read", "timesheets:write_own",
                "insights:read",
            ],
        },
    ],

    # ==========================================================================
    # CATEGORIES (Projects Schema)
    # ==========================================================================
    "categories": [
        {"id": uuid4(), "name": "Security", "color_hex": "#EF4444", "icon": "shield"},
        {"id": uuid4(), "name": "Cloud", "color_hex": "#3B82F6", "icon": "cloud"},
        {"id": uuid4(), "name": "Infrastructure", "color_hex": "#10B981", "icon": "server"},
        {"id": uuid4(), "name": "Database", "color_hex": "#8B5CF6", "icon": "database"},
        {"id": uuid4(), "name": "Operations", "color_hex": "#F59E0B", "icon": "cog"},
    ],

    # ==========================================================================
    # ACTIVE PROJECTS (Projects Schema)
    # ==========================================================================
    "projects": [
        # Vulnerabilities Remediation - 65%
        {
            "id": uuid4(),
            "name": "Vulnerabilities Remediation",
            "description": "Systematic remediation of identified security vulnerabilities across enterprise systems including patching, configuration hardening, and security controls implementation.",
            "status": "active",
            "priority": "high",
            "completion_percentage": Decimal("65.00"),
            "start_date": date.today() - timedelta(days=60),
            "target_end_date": date.today() + timedelta(days=30),
            "budget_allocated": Decimal("75000.00"),
            "budget_spent": Decimal("48750.00"),
        },
        # Cloud Migration Planning - 70%
        {
            "id": uuid4(),
            "name": "Cloud Migration Planning",
            "description": "Strategic planning and initial execution of enterprise cloud migration. Includes workload assessment, architecture design, and pilot migrations.",
            "status": "active",
            "priority": "high",
            "completion_percentage": Decimal("70.00"),
            "start_date": date.today() - timedelta(days=90),
            "target_end_date": date.today() + timedelta(days=60),
            "budget_allocated": Decimal("150000.00"),
            "budget_spent": Decimal("105000.00"),
        },
        # WAF/API Security - 65%
        {
            "id": uuid4(),
            "name": "WAF/API Security Implementation",
            "description": "Deploy Web Application Firewall and implement comprehensive API security controls. Includes rule configuration, API gateway setup, and security testing.",
            "status": "active",
            "priority": "critical",
            "completion_percentage": Decimal("65.00"),
            "start_date": date.today() - timedelta(days=45),
            "target_end_date": date.today() + timedelta(days=45),
            "budget_allocated": Decimal("50000.00"),
            "budget_spent": Decimal("32500.00"),
        },
        # Tape Library & Backup Server Replacements - 20%
        {
            "id": uuid4(),
            "name": "Tape Library & Backup Server Replacements",
            "description": "Replace aging tape library infrastructure and backup servers. Includes hardware procurement, migration planning, and data verification.",
            "status": "active",
            "priority": "medium",
            "completion_percentage": Decimal("20.00"),
            "start_date": date.today() - timedelta(days=30),
            "target_end_date": date.today() + timedelta(days=120),
            "budget_allocated": Decimal("200000.00"),
            "budget_spent": Decimal("40000.00"),
        },
    ],

    # ==========================================================================
    # UPCOMING PROJECTS (Planning Status)
    # ==========================================================================
    "upcoming_projects": [
        {
            "id": uuid4(),
            "name": "PAM Re-implementation",
            "description": "Re-implement Privileged Access Management solution with enhanced controls and modern architecture.",
            "status": "planning",
            "priority": "high",
            "completion_percentage": Decimal("0.00"),
            "start_date": date.today() + timedelta(days=30),
            "target_end_date": date.today() + timedelta(days=150),
        },
        {
            "id": uuid4(),
            "name": "APM across DLD",
            "description": "Deploy Application Performance Monitoring across all Data Lake and Data services.",
            "status": "planning",
            "priority": "medium",
            "completion_percentage": Decimal("0.00"),
            "start_date": date.today() + timedelta(days=45),
            "target_end_date": date.today() + timedelta(days=135),
        },
        {
            "id": uuid4(),
            "name": "Data Center Firewall Upgrade",
            "description": "Upgrade data center firewall infrastructure to next-generation hardware with advanced threat protection.",
            "status": "planning",
            "priority": "critical",
            "completion_percentage": Decimal("0.00"),
            "start_date": date.today() + timedelta(days=60),
            "target_end_date": date.today() + timedelta(days=180),
        },
    ],

    # ==========================================================================
    # RECENT MILESTONES (Achieved)
    # ==========================================================================
    "milestones_achieved": [
        {
            "id": uuid4(),
            "name": "NLB Replacement",
            "description": "Network Load Balancer infrastructure replacement completed",
            "target_date": date.today() - timedelta(days=14),
            "achieved_date": date.today() - timedelta(days=15),
            "status": "achieved",
        },
        {
            "id": uuid4(),
            "name": "Exchange Node Addition",
            "description": "Additional Exchange server nodes deployed for capacity",
            "target_date": date.today() - timedelta(days=21),
            "achieved_date": date.today() - timedelta(days=20),
            "status": "achieved",
        },
        {
            "id": uuid4(),
            "name": "Oracle 19c Migration",
            "description": "Core databases migrated to Oracle 19c",
            "target_date": date.today() - timedelta(days=30),
            "achieved_date": date.today() - timedelta(days=28),
            "status": "achieved",
        },
    ],

    # ==========================================================================
    # SAMPLE TASKS FOR WAF PROJECT
    # ==========================================================================
    "waf_tasks": [
        # Completed Tasks
        {
            "title": "WAF Rule Design",
            "description": "Design custom WAF rules based on application requirements",
            "status": "done",
            "completion_percentage": Decimal("100"),
            "estimated_hours": Decimal("24"),
            "actual_hours": Decimal("28"),
        },
        {
            "title": "API Inventory",
            "description": "Complete inventory of all API endpoints to protect",
            "status": "done",
            "completion_percentage": Decimal("100"),
            "estimated_hours": Decimal("16"),
            "actual_hours": Decimal("14"),
        },
        {
            "title": "Test Environment Setup",
            "description": "Configure WAF in test environment",
            "status": "done",
            "completion_percentage": Decimal("100"),
            "estimated_hours": Decimal("8"),
            "actual_hours": Decimal("10"),
        },
        # In Progress Tasks
        {
            "title": "Production WAF Deployment",
            "description": "Deploy and configure WAF in production",
            "status": "in_progress",
            "completion_percentage": Decimal("60"),
            "estimated_hours": Decimal("40"),
            "actual_hours": Decimal("24"),
        },
        {
            "title": "API Gateway Integration",
            "description": "Integrate API gateway with WAF",
            "status": "in_progress",
            "completion_percentage": Decimal("30"),
            "estimated_hours": Decimal("32"),
            "actual_hours": Decimal("10"),
        },
        # Blocked Task
        {
            "title": "Vendor Certificate Renewal",
            "description": "Renew SSL certificates with vendor",
            "status": "blocked",
            "completion_percentage": Decimal("50"),
            "estimated_hours": Decimal("4"),
            "actual_hours": Decimal("2"),
        },
        # Upcoming Tasks
        {
            "title": "Security Testing",
            "description": "Comprehensive security testing of WAF configuration",
            "status": "todo",
            "completion_percentage": Decimal("0"),
            "estimated_hours": Decimal("24"),
        },
        {
            "title": "Documentation",
            "description": "Create operational documentation and runbooks",
            "status": "todo",
            "completion_percentage": Decimal("0"),
            "estimated_hours": Decimal("16"),
        },
        {
            "title": "Team Training",
            "description": "Train operations team on WAF management",
            "status": "todo",
            "completion_percentage": Decimal("0"),
            "estimated_hours": Decimal("8"),
        },
    ],
}


async def seed_database():
    """
    Seed the database with initial data.

    This function should be called after the database schema is created.
    """
    print("=" * 60)
    print("Project Management Platform - Database Seeder")
    print("=" * 60)

    # TODO: Implement actual database seeding when models are ready
    # async with get_async_session() as session:
    #     # Seed skills
    #     for skill in SEED_DATA["skills"]:
    #         session.add(Skill(**skill))
    #
    #     # Seed roles
    #     for role in SEED_DATA["roles"]:
    #         session.add(Role(**role))
    #
    #     # ... etc
    #
    #     await session.commit()

    print("\nSeed Data Summary:")
    print(f"  - Skills: {len(SEED_DATA['skills'])}")
    print(f"  - Roles: {len(SEED_DATA['roles'])}")
    print(f"  - Categories: {len(SEED_DATA['categories'])}")
    print(f"  - Active Projects: {len(SEED_DATA['projects'])}")
    print(f"  - Upcoming Projects: {len(SEED_DATA['upcoming_projects'])}")
    print(f"  - Achieved Milestones: {len(SEED_DATA['milestones_achieved'])}")
    print(f"  - Sample WAF Tasks: {len(SEED_DATA['waf_tasks'])}")

    print("\nActive Projects:")
    for project in SEED_DATA["projects"]:
        print(f"  - {project['name']}: {project['completion_percentage']}%")

    print("\n[NOTE] This is a preview. Actual database seeding requires")
    print("       implemented models and database connection.")


if __name__ == "__main__":
    asyncio.run(seed_database())
