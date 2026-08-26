try:
    from fastapi import APIRouter
except ImportError:
    class APIRouter:
        def __init__(self): pass
        def include_router(self, *args, **kwargs): pass

from app.api.v1.endpoints import health, auth, messages

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["Diagnostics"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(messages.router, prefix="/messages", tags=["Message History Vault"])
