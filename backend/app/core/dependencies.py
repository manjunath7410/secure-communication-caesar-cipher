"""
FastAPI dependencies for authentication, token extraction, and authorization verification.
Enforces strict security checks and standard WWW-Authenticate challenge headers.
"""
from typing import Optional

try:
    from fastapi import Header, HTTPException, status, Depends
except ImportError:
    class status:
        HTTP_401_UNAUTHORIZED = 401
        HTTP_403_FORBIDDEN = 403
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str, headers: Optional[dict] = None):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail
            self.headers = headers
    def Header(default=None, **kwargs): return default
    def Depends(f): return f

from app.core.security import decode_access_token
from app.db.user_repository import user_repository, UserEntity
from app.core.logging_config import logger

async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer <JWT_TOKEN>")
) -> UserEntity:
    """
    Extracts Bearer token from Authorization header and resolves authenticated active operator entity.
    Raises HTTP 401 Unauthorized if missing, malformed, expired, revoked, or account is disabled.
    """
    unauthorized_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate operational credentials or clearance token expired.",
        headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
    )
    
    if not authorization or not isinstance(authorization, str):
        raise unauthorized_exception
    
    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.warning("Rejected authentication attempt with malformed Authorization header scheme")
        raise unauthorized_exception
    
    token = parts[1]
    payload = decode_access_token(token)
    if not payload:
        raise unauthorized_exception
    
    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise unauthorized_exception
    
    user = user_repository.get_by_id(user_id)
    if not user:
        logger.warning(f"Authenticated token referenced non-existent user_id: {user_id}")
        raise unauthorized_exception
        
    if not user.is_active:
        logger.warning(f"Authenticated token referenced deactivated user account: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Operator account has been deactivated or suspended.",
            headers={"WWW-Authenticate": "Bearer error=\"account_deactivated\""}
        )
    
    return user
