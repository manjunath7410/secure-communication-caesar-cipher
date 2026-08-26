"""
Diagnostics and Health Response Schemas.
Supports standard FastAPI Pydantic execution as well as standalone test environments.
"""
from typing import Dict, Any

try:
    from pydantic import BaseModel
    class HealthResponse(BaseModel):
        status: str
        version: str
        environment: str
        disclaimer: str
        timestamp: float
        database: Dict[str, Any]
        security: Dict[str, Any]
        subsystems: Dict[str, str]
except ImportError:
    class HealthResponse:
        def __init__(
            self,
            status: str,
            version: str,
            environment: str,
            disclaimer: str,
            timestamp: float,
            database: Dict[str, Any],
            security: Dict[str, Any],
            subsystems: Dict[str, str]
        ):
            self.status = status
            self.version = version
            self.environment = environment
            self.disclaimer = disclaimer
            self.timestamp = timestamp
            self.database = database
            self.security = security
            self.subsystems = subsystems
