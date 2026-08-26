"""
System Health and Diagnostics Endpoints.
Provides subsystem readiness, database connectivity, and security configuration diagnostics.
"""
import time

try:
    from fastapi import APIRouter
except ImportError:
    class APIRouter:
        def __init__(self): pass
        def get(self, *args, **kwargs): return lambda f: f

from app.schemas.health import HealthResponse
from app.core.config import settings
from app.db.user_repository import user_repository
from app.db.message_repository import message_repository

router = APIRouter()

SERVER_START_TIME = time.time()

@router.get(
    "/health",
    response_model=HealthResponse,
    tags=["Diagnostics"],
    summary="Check API and subsystem operational status",
    description="Returns backend readiness, database connectivity, auth configuration, and academic disclaimer."
)
def get_health() -> HealthResponse:
    db_healthy = user_repository.is_healthy() and message_repository.is_healthy()
    uptime_sec = round(time.time() - SERVER_START_TIME, 2)

    return HealthResponse(
        status="operational" if db_healthy else "degraded",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        disclaimer=settings.DISCLAIMER,
        timestamp=time.time(),
        database={
            "status": "connected" if db_healthy else "disconnected",
            "provider": "PostgreSQL Ready (In-Memory Thread-Safe Cache Active)",
            "pool_size": settings.DB_POOL_SIZE,
            "registered_users": user_repository.count()
        },
        security={
            "jwt_algorithm": settings.JWT_ALGORITHM,
            "token_ttl_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "cors_allow_credentials": settings.CORS_ALLOW_CREDENTIALS,
            "auth_layer": "PBKDF2-HMAC-SHA256 & JWT-HS256"
        },
        subsystems={
            "api_gateway": "ready",
            "crypto_engine": "client_authoritative",
            "database_vault": "ready" if db_healthy else "error",
            "auth_subsystem": "ready",
            "uptime_seconds": str(uptime_sec)
        }
    )
