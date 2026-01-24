"""
Auth Service - FastAPI Application Entry Point
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import MissingBackendError
from passlib.hash import pbkdf2_sha256
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import delete, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .db import AsyncSessionLocal, engine, get_db
from .models import Base, Role, Team, TeamMembership, User, UserRole

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(
    title="Auth Service",
    description="Authentication and RBAC service for Project Management Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TeamResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    leadUserId: Optional[UUID] = None
    members: list[UUID] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class RoleResponse(BaseModel):
    id: UUID
    name: str
    displayName: str = Field(alias="display_name")
    description: Optional[str] = None
    permissions: dict = Field(default_factory=dict)
    isSystemRole: bool = Field(alias="is_system_role")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserResponse(BaseModel):
    id: UUID
    email: str
    firstName: str = Field(alias="first_name")
    lastName: str = Field(alias="last_name")
    avatarUrl: Optional[str] = Field(default=None, alias="avatar_url")
    isActive: bool = Field(alias="is_active")
    roles: list[str]
    teams: list[TeamResponse]

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"
    user: UserResponse


class UserCreate(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    roles: list[str] = Field(default_factory=list)
    teams: list[UUID] = Field(default_factory=list)
    avatarUrl: Optional[str] = None
    isActive: bool = True


class UserUpdate(BaseModel):
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    roles: Optional[list[str]] = None
    teams: Optional[list[UUID]] = None
    avatarUrl: Optional[str] = None
    isActive: Optional[bool] = None


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    leadUserId: Optional[UUID] = None
    members: list[UUID] = Field(default_factory=list)


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    leadUserId: Optional[UUID] = None
    members: Optional[list[UUID]] = None


class PasswordChangeRequest(BaseModel):
    currentPassword: Optional[str] = None
    newPassword: str


class CurrentUser(BaseModel):
    id: UUID
    email: str
    roles: list[str]
    teams: list[UUID]


DEFAULT_ROLES = [
    {
        "name": "admin",
        "display_name": "Administrator",
        "description": "Full system access",
        "permissions": {
            "projects": {"create": True, "read": True, "update": True, "delete": True},
            "tasks": {"create": True, "read": True, "update": True, "delete": True, "assign": True},
            "users": {
                "create": True,
                "read": True,
                "update": True,
                "delete": True,
                "manage_roles": True,
            },
            "settings": {"access": True, "manage_roles": True, "view_audit": True},
        },
        "is_system_role": True,
    },
    {
        "name": "project_manager",
        "display_name": "Project Manager",
        "description": "Can manage projects and tasks",
        "permissions": {
            "projects": {"create": True, "read": True, "update": True, "delete": False},
            "tasks": {"create": True, "read": True, "update": True, "delete": True, "assign": True},
            "users": {"read": True},
            "settings": {"view_audit": True},
        },
        "is_system_role": True,
    },
    {
        "name": "contributor",
        "display_name": "Contributor",
        "description": "Can view and update assigned tasks",
        "permissions": {"projects": {"read": True}, "tasks": {"create": True, "read": True, "update": True}},
        "is_system_role": True,
    },
]

BOOTSTRAP_ADMIN_EMAIL = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "admin@company.com")
BOOTSTRAP_ADMIN_PASSWORD = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "demo123")
BOOTSTRAP_ADMIN_FIRST_NAME = os.getenv("BOOTSTRAP_ADMIN_FIRST_NAME", "System")
BOOTSTRAP_ADMIN_LAST_NAME = os.getenv("BOOTSTRAP_ADMIN_LAST_NAME", "Admin")


def _normalize_hash(value: Optional[str]) -> str:
    return (value or "").strip()


def _is_hashed_value(hash_value: str) -> bool:
    return hash_value.startswith("$")


def _is_probably_bcrypt(hash_value: str) -> bool:
    return hash_value.startswith("$2a$") or hash_value.startswith("$2b$") or hash_value.startswith("$2y$")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def verify_password_bcrypt_direct(plain_password: str, hashed_password: str) -> bool:
    if not _is_probably_bcrypt(hashed_password):
        return False
    try:
        import bcrypt  # type: ignore
    except Exception:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


async def verify_password_db(db: AsyncSession, plain_password: str, hashed_password: str) -> bool:
    try:
        result = await db.execute(
            text("SELECT crypt(:plain, :hash) = :hash AS ok"),
            {"plain": plain_password, "hash": hashed_password},
        )
        return bool(result.scalar())
    except Exception:
        return False


async def ensure_seed_data(db: AsyncSession) -> None:
    await migrate_legacy_users(db)
    # Seed roles if missing
    existing_roles = await db.execute(select(Role.name))
    existing_role_names = set(existing_roles.scalars().all())
    for role in DEFAULT_ROLES:
        if role["name"] not in existing_role_names:
            db.add(
                Role(
                    name=role["name"],
                    display_name=role["display_name"],
                    description=role["description"],
                    permissions=role["permissions"],
                    is_system_role=role["is_system_role"],
                )
            )

    await db.flush()

    admin_email = BOOTSTRAP_ADMIN_EMAIL.lower().strip()
    admin_result = await db.execute(
        select(User).where(func.lower(func.trim(User.email)) == admin_email)
    )
    admin_user = admin_result.scalar_one_or_none()

    if not admin_user:
        admin_user = User(
            email=admin_email,
            password_hash=get_password_hash(BOOTSTRAP_ADMIN_PASSWORD),
            first_name=BOOTSTRAP_ADMIN_FIRST_NAME.strip(),
            last_name=BOOTSTRAP_ADMIN_LAST_NAME.strip(),
            is_active=True,
        )
        db.add(admin_user)
        await db.flush()

    role_result = await db.execute(select(Role).where(Role.name == "admin"))
    admin_role = role_result.scalar_one_or_none()

    if admin_user and admin_role:
        existing_link = await db.execute(
            select(UserRole).where(
                UserRole.user_id == admin_user.id,
                UserRole.role_id == admin_role.id,
                UserRole.scope_type == "global",
            )
        )
        if existing_link.scalar_one_or_none() is None:
            db.add(
                UserRole(
                    user_id=admin_user.id,
                    role_id=admin_role.id,
                    scope_type="global",
                )
            )

    await db.commit()


async def migrate_legacy_users(db: AsyncSession) -> None:
    # Migrate from legacy public.users table if present.
    result = await db.execute(text("SELECT to_regclass('public.users')"))
    if not result.scalar():
        return

    columns_result = await db.execute(
        text(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
            """
        )
    )
    columns = {row for row in columns_result.scalars().all()}

    if "email" not in columns:
        return

    if "password_hash" in columns:
        password_expr = "password_hash"
    elif "password" in columns:
        password_expr = "password"
    else:
        return

    first_expr = "first_name" if "first_name" in columns else "'User'"
    last_expr = "last_name" if "last_name" in columns else "''"
    is_active_expr = "is_active" if "is_active" in columns else "TRUE"
    avatar_expr = "avatar_url" if "avatar_url" in columns else "NULL"

    insert_columns = ["email", "password_hash", "first_name", "last_name", "is_active", "avatar_url"]
    select_columns = [
        "LOWER(TRIM(email))",
        password_expr,
        first_expr,
        last_expr,
        is_active_expr,
        avatar_expr,
    ]

    if "id" in columns:
        insert_columns.insert(0, "id")
        select_columns.insert(0, "id")

    await db.execute(
        text(
            f"""
            INSERT INTO auth.users ({", ".join(insert_columns)})
            SELECT {", ".join(select_columns)}
            FROM public.users
            WHERE email IS NOT NULL AND TRIM(email) <> ''
            ON CONFLICT (email) DO NOTHING
            """
        )
    )
    await db.commit()


def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except MissingBackendError:
        return pbkdf2_sha256.hash(password)
    except Exception:
        # Last-resort fallback to a portable hash if bcrypt is unavailable.
        return pbkdf2_sha256.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


async def get_user_roles(db: AsyncSession, user_id: UUID) -> list[str]:
    result = await db.execute(
        select(Role.name).join(UserRole, Role.id == UserRole.role_id).where(UserRole.user_id == user_id)
    )
    return list(result.scalars().all())


async def get_user_teams(db: AsyncSession, user_id: UUID) -> list[Team]:
    result = await db.execute(
        select(Team).join(TeamMembership, Team.id == TeamMembership.team_id).where(TeamMembership.user_id == user_id)
    )
    return list(result.scalars().all())


async def build_team_response(db: AsyncSession, team: Team) -> TeamResponse:
    members_result = await db.execute(
        select(TeamMembership.user_id).where(TeamMembership.team_id == team.id)
    )
    members = list(members_result.scalars().all())
    return TeamResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        leadUserId=team.lead_user_id,
        members=members,
    )


async def build_user_response(db: AsyncSession, user: User) -> UserResponse:
    roles = await get_user_roles(db, user.id)
    teams = await get_user_teams(db, user.id)
    team_payloads = [await build_team_response(db, team) for team in teams]
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        roles=roles,
        teams=team_payloads,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    token = credentials.credentials
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await db.get(User, UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    roles = await get_user_roles(db, user.id)
    teams = [team.id for team in await get_user_teams(db, user.id)]

    return CurrentUser(id=user.id, email=user.email, roles=roles, teams=teams)


async def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


@app.on_event("startup")
async def startup() -> None:
    async with engine.begin() as conn:
        try:
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
        except Exception:
            # Extension creation can fail if the DB user lacks privileges.
            pass
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS auth"))
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text("ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)")
        )
    async with AsyncSessionLocal() as db:
        try:
            await ensure_seed_data(db)
        except Exception:
            # Avoid failing service startup due to seed data issues.
            pass


# Auth endpoints
@app.post("/api/v1/auth/login", response_model=LoginResponse, response_model_by_alias=False)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    email = request.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    stored_hash = _normalize_hash(user.password_hash)
    is_valid = False

    if stored_hash:
        if _is_hashed_value(stored_hash):
            try:
                is_valid = verify_password(request.password, stored_hash)
            except Exception:
                is_valid = False

            if not is_valid and _is_probably_bcrypt(stored_hash):
                is_valid = verify_password_bcrypt_direct(request.password, stored_hash)
            if not is_valid and _is_probably_bcrypt(stored_hash):
                is_valid = await verify_password_db(db, request.password, stored_hash)
        else:
            # Legacy/plaintext fallback for manually inserted users.
            if stored_hash == request.password:
                user.password_hash = get_password_hash(request.password)
                await db.commit()
                is_valid = True

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    roles = await get_user_roles(db, user.id)
    teams = await get_user_teams(db, user.id)
    team_ids = [str(t.id) for t in teams]

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "roles": roles,
            "teams": team_ids,
            "type": "access",
        }
    )

    refresh_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "roles": roles,
            "teams": team_ids,
            "type": "refresh",
        },
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )

    return LoginResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=await build_user_response(db, user),
    )


@app.post("/api/v1/auth/refresh")
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh access token."""
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    new_token = create_access_token(
        {
            "sub": payload["sub"],
            "email": payload["email"],
            "roles": payload.get("roles", []),
            "teams": payload.get("teams", []),
            "type": "access",
        }
    )
    return {"accessToken": new_token}


@app.post("/api/v1/auth/logout")
async def logout():
    """Logout (client should discard tokens)."""
    return {"message": "Logged out successfully"}


@app.get("/api/v1/auth/me", response_model=UserResponse, response_model_by_alias=False)
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile."""
    user = await db.get(User, current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return await build_user_response(db, user)


@app.get("/api/v1/auth/users", response_model=list[UserResponse], response_model_by_alias=False)
async def list_users(
    _: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users."""
    result = await db.execute(select(User).order_by(User.created_at))
    users = result.scalars().all()
    return [await build_user_response(db, user) for user in users]


@app.post("/api/v1/auth/users", response_model=UserResponse, response_model_by_alias=False)
async def create_user(
    payload: UserCreate,
    _: CurrentUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    roles = payload.roles or ["contributor"]
    role_rows = await db.execute(select(Role).where(Role.name.in_(roles)))
    role_entities = list(role_rows.scalars().all())
    if len(role_entities) != len(set(roles)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown role provided")

    new_user = User(
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        first_name=payload.firstName.strip(),
        last_name=payload.lastName.strip(),
        avatar_url=payload.avatarUrl,
        is_active=payload.isActive,
    )
    db.add(new_user)

    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    for role in role_entities:
        db.add(UserRole(user_id=new_user.id, role_id=role.id, scope_type="global"))

    if payload.teams:
        team_ids = list({team_id for team_id in payload.teams})
        for team_id in team_ids:
            db.add(TeamMembership(user_id=new_user.id, team_id=team_id))

    await db.commit()
    await db.refresh(new_user)
    return await build_user_response(db, new_user)


@app.patch("/api/v1/auth/users/{user_id}", response_model=UserResponse, response_model_by_alias=False)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    _: CurrentUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.email is not None:
        user.email = payload.email.lower().strip()
    if payload.firstName is not None:
        user.first_name = payload.firstName.strip()
    if payload.lastName is not None:
        user.last_name = payload.lastName.strip()
    if payload.avatarUrl is not None:
        user.avatar_url = payload.avatarUrl
    if payload.isActive is not None:
        user.is_active = payload.isActive

    if payload.roles is not None:
        roles = payload.roles or ["contributor"]
        role_rows = await db.execute(select(Role).where(Role.name.in_(roles)))
        role_entities = list(role_rows.scalars().all())
        if len(role_entities) != len(set(roles)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown role provided")
        await db.execute(delete(UserRole).where(UserRole.user_id == user_id))
        for role in role_entities:
            db.add(UserRole(user_id=user_id, role_id=role.id, scope_type="global"))

    if payload.teams is not None:
        await db.execute(delete(TeamMembership).where(TeamMembership.user_id == user_id))
        team_ids = list({team_id for team_id in payload.teams})
        for team_id in team_ids:
            db.add(TeamMembership(user_id=user_id, team_id=team_id))

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    await db.refresh(user)
    return await build_user_response(db, user)


@app.delete("/api/v1/auth/users/{user_id}")
async def delete_user(
    user_id: UUID,
    _: CurrentUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"message": "User deleted"}


@app.post("/api/v1/auth/users/{user_id}/password")
async def change_password(
    user_id: UUID,
    payload: PasswordChangeRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.id == user_id:
        if not payload.currentPassword:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password required")
        stored_hash = _normalize_hash(user.password_hash)
        is_valid = False
        if stored_hash:
            if _is_hashed_value(stored_hash):
                try:
                    is_valid = verify_password(payload.currentPassword, stored_hash)
                except Exception:
                    is_valid = False

                if not is_valid and _is_probably_bcrypt(stored_hash):
                    is_valid = verify_password_bcrypt_direct(payload.currentPassword, stored_hash)
                if not is_valid and _is_probably_bcrypt(stored_hash):
                    is_valid = await verify_password_db(db, payload.currentPassword, stored_hash)
            else:
                is_valid = stored_hash == payload.currentPassword

        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.password_hash = get_password_hash(payload.newPassword)
    await db.commit()
    return {"message": "Password updated"}


@app.get("/api/v1/auth/roles", response_model=list[RoleResponse], response_model_by_alias=False)
async def list_roles(
    _: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Role).order_by(Role.name))
    return list(result.scalars().all())


@app.get("/api/v1/auth/teams", response_model=list[TeamResponse], response_model_by_alias=False)
async def list_teams(
    _: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Team).order_by(Team.name))
    teams = result.scalars().all()
    return [await build_team_response(db, team) for team in teams]


@app.post("/api/v1/auth/teams", response_model=TeamResponse, response_model_by_alias=False)
async def create_team(
    payload: TeamCreate,
    _: CurrentUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    team = Team(
        name=payload.name.strip(),
        description=payload.description,
        lead_user_id=payload.leadUserId,
    )
    db.add(team)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team already exists")

    member_ids = set(payload.members or [])
    if payload.leadUserId:
        member_ids.add(payload.leadUserId)
    for member_id in member_ids:
        db.add(TeamMembership(user_id=member_id, team_id=team.id))

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team already exists")

    await db.refresh(team)
    return await build_team_response(db, team)


@app.patch("/api/v1/auth/teams/{team_id}", response_model=TeamResponse, response_model_by_alias=False)
async def update_team(
    team_id: UUID,
    payload: TeamUpdate,
    _: CurrentUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    if payload.name is not None:
        team.name = payload.name.strip()
    if payload.description is not None:
        team.description = payload.description
    if payload.leadUserId is not None:
        team.lead_user_id = payload.leadUserId

    if payload.members is not None:
        await db.execute(delete(TeamMembership).where(TeamMembership.team_id == team_id))
        member_ids = set(payload.members)
        if payload.leadUserId:
            member_ids.add(payload.leadUserId)
        for member_id in member_ids:
            db.add(TeamMembership(user_id=member_id, team_id=team_id))

    await db.commit()
    await db.refresh(team)
    return await build_team_response(db, team)


@app.delete("/api/v1/auth/teams/{team_id}")
async def delete_team(
    team_id: UUID,
    _: CurrentUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(delete(Team).where(Team.id == team_id))
    await db.commit()
    return {"message": "Team deleted"}


@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "healthy",
        "service": "auth-service",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
