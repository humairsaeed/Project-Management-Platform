"""
Auth Service - FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
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

# Mock user database (replace with actual DB in production)
MOCK_USERS = {
    "admin@company.com": {
        "id": "00000000-0000-0000-0000-000000000001",
        "email": "admin@company.com",
        "password_hash": pwd_context.hash("demo123"),
        "firstName": "System",
        "lastName": "Admin",
        "roles": ["admin"],
        "teams": [{"id": "team-1", "name": "IT Infrastructure"}]
    },
    "john.smith@company.com": {
        "id": "00000000-0000-0000-0000-000000000002",
        "email": "john.smith@company.com",
        "password_hash": pwd_context.hash("demo123"),
        "firstName": "John",
        "lastName": "Smith",
        "roles": ["project_manager"],
        "teams": [{"id": "team-1", "name": "IT Infrastructure"}]
    },
    "sarah.jones@company.com": {
        "id": "00000000-0000-0000-0000-000000000003",
        "email": "sarah.jones@company.com",
        "password_hash": pwd_context.hash("demo123"),
        "firstName": "Sarah",
        "lastName": "Jones",
        "roles": ["project_manager"],
        "teams": [{"id": "team-2", "name": "Security"}]
    }
}

# Request/Response models
class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str
    roles: list[str]
    teams: list[dict]

class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    sub: str
    email: str
    roles: list[str]
    exp: datetime

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

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
            detail="Invalid token"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    email = payload.get("email")
    if email not in MOCK_USERS:
        raise HTTPException(status_code=401, detail="User not found")
    return MOCK_USERS[email]

# Auth endpoints
@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT tokens."""
    user = MOCK_USERS.get(request.email)

    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "roles": user["roles"]
    })

    refresh_token = create_access_token(
        {"sub": user["id"], "email": user["email"], "roles": user["roles"]},
        expires_delta=timedelta(days=7)
    )

    return LoginResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            firstName=user["firstName"],
            lastName=user["lastName"],
            roles=user["roles"],
            teams=user["teams"]
        )
    )

@app.post("/api/v1/auth/refresh")
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh access token."""
    payload = decode_token(credentials.credentials)
    new_token = create_access_token({
        "sub": payload["sub"],
        "email": payload["email"],
        "roles": payload.get("roles", [])
    })
    return {"accessToken": new_token}

@app.post("/api/v1/auth/logout")
async def logout():
    """Logout (client should discard tokens)."""
    return {"message": "Logged out successfully"}

@app.get("/api/v1/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        firstName=current_user["firstName"],
        lastName=current_user["lastName"],
        roles=current_user["roles"],
        teams=current_user["teams"]
    )

@app.get("/api/v1/users")
async def list_users(current_user: dict = Depends(get_current_user)):
    """List all users (admin only)."""
    return [
        {
            "id": u["id"],
            "email": u["email"],
            "firstName": u["firstName"],
            "lastName": u["lastName"],
            "roles": u["roles"]
        }
        for u in MOCK_USERS.values()
    ]

@app.get("/api/v1/roles")
async def list_roles():
    """List available roles."""
    return [
        {"id": "1", "name": "admin", "displayName": "Administrator"},
        {"id": "2", "name": "project_manager", "displayName": "Project Manager"},
        {"id": "3", "name": "contributor", "displayName": "Contributor"}
    ]

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
