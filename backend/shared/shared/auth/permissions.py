"""
Permission System

Defines permissions and permission checking utilities.
"""

from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .dependencies import CurrentUser


class Permission(str, Enum):
    """Available permissions in the system."""

    # Project permissions
    PROJECTS_READ = "projects:read"
    PROJECTS_WRITE = "projects:write"
    PROJECTS_DELETE = "projects:delete"

    # Task permissions
    TASKS_READ = "tasks:read"
    TASKS_WRITE = "tasks:write"
    TASKS_DELETE = "tasks:delete"
    TASKS_UPDATE_OWN = "tasks:update_own"

    # Timesheet permissions
    TIMESHEETS_READ = "timesheets:read"
    TIMESHEETS_WRITE_OWN = "timesheets:write_own"
    TIMESHEETS_APPROVE = "timesheets:approve"

    # Insights permissions
    INSIGHTS_READ = "insights:read"
    INSIGHTS_GENERATE = "insights:generate"

    # Admin permissions
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"
    TEAMS_MANAGE = "teams:manage"


# Role to permission mapping
ROLE_PERMISSIONS: dict[str, list[Permission]] = {
    "admin": list(Permission),  # Admin has all permissions
    "project_manager": [
        Permission.PROJECTS_READ,
        Permission.PROJECTS_WRITE,
        Permission.PROJECTS_DELETE,
        Permission.TASKS_READ,
        Permission.TASKS_WRITE,
        Permission.TASKS_DELETE,
        Permission.TIMESHEETS_READ,
        Permission.TIMESHEETS_APPROVE,
        Permission.INSIGHTS_READ,
        Permission.INSIGHTS_GENERATE,
        Permission.USERS_READ,
    ],
    "contributor": [
        Permission.PROJECTS_READ,
        Permission.TASKS_READ,
        Permission.TASKS_UPDATE_OWN,
        Permission.TIMESHEETS_READ,
        Permission.TIMESHEETS_WRITE_OWN,
        Permission.INSIGHTS_READ,
    ],
}


def check_permission(user: "CurrentUser", permission: Permission) -> bool:
    """
    Check if a user has a specific permission.

    Args:
        user: Current user object
        permission: Permission to check

    Returns:
        True if user has permission, False otherwise
    """
    for role in user.roles:
        role_perms = ROLE_PERMISSIONS.get(role, [])
        if permission in role_perms:
            return True
    return False


def get_user_permissions(user: "CurrentUser") -> set[Permission]:
    """
    Get all permissions for a user based on their roles.

    Args:
        user: Current user object

    Returns:
        Set of all permissions the user has
    """
    permissions: set[Permission] = set()
    for role in user.roles:
        role_perms = ROLE_PERMISSIONS.get(role, [])
        permissions.update(role_perms)
    return permissions
