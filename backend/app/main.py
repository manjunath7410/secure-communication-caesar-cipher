"""
Main entry point for Military Caesar Cryptography API (FastAPI Backend - Phase 10 Hardened).
Senior-engineered FastAPI application with:
- Strict CORS configuration
- Security Headers middleware
- Request ID tracing middleware
- Sanitized structured logging
- Global exception handling and status codes
- Comprehensive OpenAPI Swagger documentation with BearerAuth
"""
import time
import uuid
from typing import Callable
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi

from app.core.config import settings
from app.core.logging_config import logger
from app.api.v1.router import api_router
from app.api.v1.endpoints import auth, health

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Hardened Backend API for Secure Military Communication Using Caesar Cipher. "
        "Educational Cryptography Platform featuring PBKDF2 authentication, JWT clearance tokens, "
        "and zero-plaintext message vault storage."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ------------------------------------------------------------------------------
# 1. CORS Configuration
# ------------------------------------------------------------------------------
# Ensure wildcard origin is never combined with allow_credentials=True
allow_creds = settings.CORS_ALLOW_CREDENTIALS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
if "*" in origins and allow_creds:
    # If wildcard is set, specify standard local origins or disable credentials
    origins = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_creds,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
    expose_headers=["X-Request-ID", "X-Response-Time"]
)

# ------------------------------------------------------------------------------
# 2. Security Headers & Request Tracing Middleware
# ------------------------------------------------------------------------------
@app.middleware("http")
async def security_and_tracing_middleware(request: Request, call_next: Callable) -> Response:
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    
    # Process request
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(f"[REQ:{request_id}] Unhandled error during request processing: {type(exc).__name__}")
        raise exc

    duration_ms = round((time.time() - start_time) * 1000, 2)
    
    # Attach Security Headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{duration_ms}ms"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Prevent caching on authenticated API routes
    if request.url.path.startswith(settings.API_V1_STR) or "/auth" in request.url.path:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"

    logger.info(
        f"[REQ:{request_id}] {request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)"
    )
    return response

# ------------------------------------------------------------------------------
# 3. Global Exception Handlers
# ------------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    headers = getattr(exc, "headers", None) or {}
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status_code": exc.status_code,
            "detail": exc.detail,
            "academic_notice": settings.DISCLAIMER
        },
        headers=headers
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    for err in exc.errors():
        field_loc = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        error_details.append({
            "field": field_loc or "body",
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error")
        })
    logger.warning(f"Request payload validation error on {request.method} {request.url.path}: {error_details}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "detail": "Request payload failed operational validation standards.",
            "errors": error_details
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.critical(f"Unhandled system exception on {request.method} {request.url.path}: {type(exc).__name__}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "detail": "An unexpected internal operational error occurred. Details have been logged safely."
        }
    )

# ------------------------------------------------------------------------------
# 4. OpenAPI Custom Security Scheme (BearerAuth)
# ------------------------------------------------------------------------------
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DISCLAIMER,
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Provide valid HMAC-SHA256 JWT access token obtained via /auth/login or /auth/register."
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# ------------------------------------------------------------------------------
# 5. Route Mounting
# ------------------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix="/auth", tags=["Root Authentication"])

@app.get("/health", tags=["Root Health Check"])
def simple_health():
    """
    Production-level lightweight health probe.
    Returns standard simple service status for load balancers and orchestrators.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time()
    }

@app.get("/", tags=["Root Discovery"])
def root():
    """Root metadata discovery endpoint."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "academic_notice": settings.DISCLAIMER,
        "environment": settings.ENVIRONMENT,
        "health_endpoint": f"{settings.API_V1_STR}/health",
        "auth_endpoints": {
            "register": f"{settings.API_V1_STR}/auth/register",
            "login": f"{settings.API_V1_STR}/auth/login",
            "me": f"{settings.API_V1_STR}/auth/me"
        },
        "vault_endpoints": {
            "list_messages": f"{settings.API_V1_STR}/messages",
            "create_message": f"{settings.API_V1_STR}/messages"
        },
        "docs": "/docs",
        "openapi_spec": f"{settings.API_V1_STR}/openapi.json"
    }
