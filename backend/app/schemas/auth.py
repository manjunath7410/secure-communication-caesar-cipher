"""
Pydantic schemas for Authentication, Operator Registration, and Token Generation.
Supports standard FastAPI Pydantic v2 validation as well as standalone test execution.
"""
from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
import re

class ClearanceLevel(str, Enum):
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"
    TOP_SECRET = "TOP_SECRET"

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_-]{3,30}$")

try:
    from pydantic import BaseModel, Field, field_validator

    class UserRegisterRequest(BaseModel):
        username: str = Field(..., min_length=3, max_length=30, description="Unique operator username (3-30 chars, alphanumeric/underscore/hyphen)")
        email: str = Field(..., max_length=100, description="Valid tactical or military operator email")
        password: str = Field(..., min_length=8, max_length=128, description="Secure clearance passphrase (min 8 chars)")
        callsign: Optional[str] = Field(None, max_length=30, description="Tactical unit callsign (e.g. VIPER-1)")
        clearance_level: Optional[ClearanceLevel] = Field(ClearanceLevel.SECRET, description="Security clearance rating")

        @field_validator("username")
        @classmethod
        def validate_username(cls, v: str) -> str:
            trimmed = v.strip()
            if not USERNAME_REGEX.match(trimmed):
                raise ValueError("Username must be 3-30 characters containing only letters, numbers, underscores, and hyphens.")
            return trimmed

        @field_validator("email")
        @classmethod
        def validate_email(cls, v: str) -> str:
            trimmed = v.strip().lower()
            if not EMAIL_REGEX.match(trimmed):
                raise ValueError("Please provide a valid operator email address.")
            return trimmed

        @field_validator("password")
        @classmethod
        def validate_password(cls, v: str) -> str:
            if len(v.strip()) < 8:
                raise ValueError("Password must be at least 8 characters long.")
            if len(v) > 128:
                raise ValueError("Password must not exceed 128 characters.")
            return v

        @field_validator("callsign")
        @classmethod
        def validate_callsign(cls, v: Optional[str]) -> Optional[str]:
            if v is not None:
                trimmed = v.strip()
                return trimmed if trimmed else None
            return None

    class UserLoginRequest(BaseModel):
        username: str = Field(..., min_length=1, max_length=100, description="Registered operator username or email")
        password: str = Field(..., min_length=1, max_length=128, description="Clearance passphrase")

        @field_validator("username")
        @classmethod
        def clean_username(cls, v: str) -> str:
            return v.strip()

    class UserResponse(BaseModel):
        id: str
        username: str
        email: str
        callsign: Optional[str] = None
        clearance_level: ClearanceLevel
        is_active: bool = True
        created_at: str

        class Config:
            from_attributes = True

    class TokenResponse(BaseModel):
        access_token: str
        token_type: str = "bearer"
        expires_in: int
        user: UserResponse

except ImportError:
    # Standalone fallback classes if pydantic is not globally installed
    class UserRegisterRequest:
        def __init__(self, username: str, email: str, password: str, callsign: Optional[str] = None, clearance_level: Optional[ClearanceLevel] = ClearanceLevel.SECRET):
            username_trimmed = username.strip()
            if not USERNAME_REGEX.match(username_trimmed):
                raise ValueError("Username must be 3-30 characters containing only letters, numbers, underscores, and hyphens.")
            email_trimmed = email.strip().lower()
            if not EMAIL_REGEX.match(email_trimmed):
                raise ValueError("Please provide a valid operator email address.")
            if len(password.strip()) < 8 or len(password) > 128:
                raise ValueError("Password must be between 8 and 128 characters long.")
            
            self.username = username_trimmed
            self.email = email_trimmed
            self.password = password
            self.callsign = callsign.strip() if callsign and callsign.strip() else None
            self.clearance_level = clearance_level or ClearanceLevel.SECRET

    class UserLoginRequest:
        def __init__(self, username: str, password: str):
            self.username = username.strip()
            self.password = password

    class UserResponse:
        def __init__(self, id: str, username: str, email: str, clearance_level: ClearanceLevel, callsign: Optional[str] = None, is_active: bool = True, created_at: Optional[str] = None):
            self.id = id
            self.username = username
            self.email = email
            self.callsign = callsign
            self.clearance_level = clearance_level
            self.is_active = is_active
            self.created_at = created_at or datetime.utcnow().isoformat()

        def model_dump(self) -> Dict[str, Any]:
            return {
                "id": self.id,
                "username": self.username,
                "email": self.email,
                "callsign": self.callsign,
                "clearance_level": self.clearance_level.value if isinstance(self.clearance_level, ClearanceLevel) else str(self.clearance_level),
                "is_active": self.is_active,
                "created_at": self.created_at
            }

    class TokenResponse:
        def __init__(self, access_token: str, expires_in: int, user: UserResponse, token_type: str = "bearer"):
            self.access_token = access_token
            self.token_type = token_type
            self.expires_in = expires_in
            self.user = user
