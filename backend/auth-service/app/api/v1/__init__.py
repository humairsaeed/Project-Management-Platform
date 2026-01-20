"""
Auth Service API v1
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/auth")

# TODO: Include sub-routers when implemented
# from .auth import router as auth_router
# from .users import router as users_router
# from .teams import router as teams_router
# from .skills import router as skills_router
#
# router.include_router(auth_router, tags=["Authentication"])
# router.include_router(users_router, prefix="/users", tags=["Users"])
# router.include_router(teams_router, prefix="/teams", tags=["Teams"])
# router.include_router(skills_router, prefix="/skills", tags=["Skills"])


@router.get("/")
async def auth_root():
    """Auth service root endpoint."""
    return {"service": "auth", "version": "v1"}
