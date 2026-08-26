"""
Production-Ready Application Configuration for Military Caesar Cryptography API.
Loads configuration from environment variables with strong type validation,
CORS security constraints, and operational safety checks.
"""
import os
import json
from typing import List, Union

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field, field_validator

    class Settings(BaseSettings):
        PROJECT_NAME: str = "Secure Military Communication Using Caesar Cipher"
        VERSION: str = "1.0.0-phase10"
        API_V1_STR: str = "/api/v1"
        ENVIRONMENT: str = Field(default="development", description="Runtime environment: development, testing, staging, production")
        IS_EDUCATIONAL: bool = True
        DISCLAIMER: str = (
            "ACADEMIC NOTICE: Caesar cipher is an ancient substitution cipher (keyspace = 26) "
            "and is strictly NOT suitable for modern military or production security."
        )

        # JWT Authentication Configuration
        JWT_SECRET_KEY: str = Field(
            default="dev_tactical_jwt_secret_key_change_in_production_military_demo_2026",
            description="HMAC secret key for JWT token signing. Must be overridden in production."
        )
        JWT_ALGORITHM: str = Field(default="HS256", description="JWT cryptographic signing algorithm")
        ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=120, ge=1, le=43200, description="Access token expiration in minutes")

        # Database Configuration (PostgreSQL Ready)
        DATABASE_URL: str = Field(
            default="postgresql://postgres:password@localhost:5432/military_crypto_db",
            description="PostgreSQL Database Connection URI"
        )
        DB_POOL_SIZE: int = Field(default=10, ge=1, le=100, description="Database connection pool size")
        DB_MAX_OVERFLOW: int = Field(default=20, ge=0, le=50, description="Database connection pool overflow")
        DB_POOL_TIMEOUT: int = Field(default=30, ge=1, le=120, description="Database pool checkout timeout in seconds")

        # Logging & Observability
        LOG_LEVEL: str = Field(default="INFO", description="Application log level: DEBUG, INFO, WARNING, ERROR")

        # CORS Allowed Origins
        CORS_ORIGINS: Union[List[str], str] = Field(
            default=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
            description="Allowed CORS origins"
        )
        CORS_ALLOW_CREDENTIALS: bool = Field(default=True, description="Whether to allow credentials in CORS")

        # Security Constraints
        MAX_CIPHERTEXT_LENGTH: int = Field(default=10000, description="Maximum permitted ciphertext payload size in chars")
        MAX_PAGE_LIMIT: int = Field(default=100, description="Maximum items per page in vault queries")

        @field_validator("CORS_ORIGINS", mode="before")
        @classmethod
        def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
            if isinstance(v, str):
                v_clean = v.strip()
                if v_clean.startswith("[") and v_clean.endswith("]"):
                    try:
                        return json.loads(v_clean)
                    except json.JSONDecodeError:
                        pass
                return [origin.strip() for origin in v_clean.split(",") if origin.strip()]
            return v

        class Config:
            case_sensitive = True
            env_file = ".env"
            extra = "ignore"

except ImportError:
    # Standalone fallback if pydantic_settings is not available
    class Settings:
        def __init__(self):
            self.PROJECT_NAME = os.getenv("PROJECT_NAME", "Secure Military Communication Using Caesar Cipher")
            self.VERSION = os.getenv("VERSION", "1.0.0-phase10")
            self.API_V1_STR = os.getenv("API_V1_STR", "/api/v1")
            self.ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
            self.IS_EDUCATIONAL = True
            self.DISCLAIMER = (
                "ACADEMIC NOTICE: Caesar cipher is an ancient substitution cipher (keyspace = 26) "
                "and is strictly NOT suitable for modern military or production security."
            )
            self.JWT_SECRET_KEY = os.getenv(
                "JWT_SECRET_KEY",
                "dev_tactical_jwt_secret_key_change_in_production_military_demo_2026"
            )
            self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
            self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
            self.DATABASE_URL = os.getenv(
                "DATABASE_URL",
                "postgresql://postgres:password@localhost:5432/military_crypto_db"
            )
            self.DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
            self.DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
            self.DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
            self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
            
            cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
            if cors_raw.startswith("["):
                try:
                    self.CORS_ORIGINS = json.loads(cors_raw)
                except Exception:
                    self.CORS_ORIGINS = [cors_raw]
            else:
                self.CORS_ORIGINS = [o.strip() for o in cors_raw.split(",") if o.strip()]
            self.CORS_ALLOW_CREDENTIALS = True
            self.MAX_CIPHERTEXT_LENGTH = 10000
            self.MAX_PAGE_LIMIT = 100

settings = Settings()

# Security Sanity Check for Production
if settings.ENVIRONMENT == "production":
    if "dev_tactical_jwt_secret_key" in settings.JWT_SECRET_KEY or len(settings.JWT_SECRET_KEY) < 32:
        import warnings
        warnings.warn(
            "SECURITY WARNING: Running in production with default or weak JWT_SECRET_KEY! "
            "Set a strong random 256-bit key via JWT_SECRET_KEY environment variable.",
            RuntimeWarning
        )
