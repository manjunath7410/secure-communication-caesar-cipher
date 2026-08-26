"""
Hardened Authentication API Endpoints:
- POST /auth/register -> 201 Created (Registers new operator with PBKDF2 hash)
- POST /auth/login    -> 200 OK (Authenticates and issues signed JWT)
- GET  /auth/me       -> 200 OK (Returns active operator profile)
"""
from typing import Optional

try:
    from fastapi import APIRouter, HTTPException, status, Depends
except ImportError:
    class APIRouter:
        def __init__(self): pass
        def post(self, *args, **kwargs): return lambda f: f
        def get(self, *args, **kwargs): return lambda f: f
        def include_router(self, *args, **kwargs): pass
    class status:
        HTTP_200_OK = 200
        HTTP_201_CREATED = 201
        HTTP_400_BAD_REQUEST = 400
        HTTP_401_UNAUTHORIZED = 401
        HTTP_409_CONFLICT = 409
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str, headers: Optional[dict] = None):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail
            self.headers = headers
    def Depends(f): return f

from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    ClearanceLevel,
)
from app.db.user_repository import user_repository, UserEntity
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.core.logging_config import logger

router = APIRouter()

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new military operator",
    description="Registers a new tactical operator account with PBKDF2 password hashing. Passwords are never stored or logged."
)
def register_operator(payload: UserRegisterRequest) -> TokenResponse:
    # 1. Duplicate check - username
    if user_repository.get_by_username(payload.username):
        logger.warning(f"Registration rejected: duplicate username '{payload.username}'")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Operator username '{payload.username}' is already registered."
        )

    # 2. Duplicate check - email
    if user_repository.get_by_email(payload.email):
        logger.warning(f"Registration rejected: duplicate email '{payload.email}'")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Operator email '{payload.email}' is already registered."
        )

    # 3. Create user entity with secure salted hash
    new_user = user_repository.create(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        clearance_level=payload.clearance_level or ClearanceLevel.SECRET,
        callsign=payload.callsign
    )

    # 4. Generate JWT access token
    access_token = create_access_token(
        subject=new_user.id,
        claims={
            "username": new_user.username,
            "clearance": new_user.clearance_level.value if hasattr(new_user.clearance_level, 'value') else str(new_user.clearance_level),
            "callsign": new_user.callsign
        }
    )

    user_response = UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        callsign=new_user.callsign,
        clearance_level=new_user.clearance_level,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate tactical operator credentials",
    description="Authenticates operator credentials and issues an HMAC-SHA256 JWT access token."
)
def login_operator(payload: UserLoginRequest) -> TokenResponse:
    user = user_repository.authenticate(payload.username, payload.password)
    if not user:
        logger.warning(f"Authentication failed for operator identity: {payload.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid operator credentials or account inactive.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_credentials\""},
        )

    access_token = create_access_token(
        subject=user.id,
        claims={
            "username": user.username,
            "clearance": user.clearance_level.value if hasattr(user.clearance_level, 'value') else str(user.clearance_level),
            "callsign": user.callsign
        }
    )

    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        callsign=user.callsign,
        clearance_level=user.clearance_level,
        is_active=user.is_active,
        created_at=user.created_at
    )

    logger.info(f"Operator logged in successfully: username={user.username} (id={user.id})")

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated operator clearance & profile",
    description="Returns the profile and security clearance rating of the currently authenticated operator."
)
def get_current_operator_profile(
    current_user: UserEntity = Depends(get_current_user)
) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        callsign=current_user.callsign,
        clearance_level=current_user.clearance_level,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
