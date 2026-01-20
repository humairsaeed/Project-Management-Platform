"""
FastAPI Authentication Dependencies

Provides dependency injection for authentication and authorization.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .jwt import decode_token

# Bearer token security scheme
security = HTTPBearer()


class CurrentUser:
    """Represents the currently authenticated user."""

    def __init__(
        self,
        id: UUID,
        email: str,
        roles: list[str],
        teams: list[UUID],
    ):
        self.id = id
        self.email = email
        self.roles = roles
        self.teams = teams

    def has_role(self, role: str) -> bool:
        """Check if user has a specific role."""
        return role in self.roles or "admin" in self.roles

    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return "admin" in self.roles

    def in_team(self, team_id: UUID) -> bool:
        """Check if user is in a specific team."""
        return team_id in self.teams


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> CurrentUser:
    """
    Dependency that extracts and validates the current user from JWT.

    Usage:
        @router.get("/protected")
        async def protected_route(user: CurrentUser = Depends(get_current_user)):
            ...
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise credentials_exception

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    return CurrentUser(
        id=UUID(user_id),
        email=payload.get("email", ""),
        roles=payload.get("roles", []),
        teams=[UUID(t) for t in payload.get("teams", [])],
    )


def require_roles(*roles: str):
    """
    Dependency factory that requires specific roles.

    Usage:
        @router.get("/admin-only")
        async def admin_route(
            user: CurrentUser = Depends(require_roles("admin"))
        ):
            ...
    """
    async def role_checker(
        user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if user.is_admin():
            return user

        for role in roles:
            if user.has_role(role):
                return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires one of roles: {', '.join(roles)}",
        )

    return role_checker
