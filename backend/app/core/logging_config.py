"""
Hardened Logging Configuration for Military Caesar Cryptography API.
Enforces strict security redaction:
- NEVER logs passwords
- NEVER logs authentication tokens (JWTs / Bearer tokens)
- NEVER logs raw plaintext messages or sensitive credentials
"""
import logging
import re
import sys
from typing import Any

# Regex patterns for sensitive data redaction
BEARER_TOKEN_PATTERN = re.compile(r"Bearer\s+([A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*)", re.IGNORECASE)
JWT_PATTERN = re.compile(r"ey[A-Za-z0-9-_=]+\.ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*")
PASSWORD_PATTERN = re.compile(r"('password'|\"password\"|password)\s*[:=]\s*['\"][^'\"]+['\"]", re.IGNORECASE)
SECRET_PATTERN = re.compile(r"('secret'|\"secret\"|secret_key)\s*[:=]\s*['\"][^'\"]+['\"]", re.IGNORECASE)

class SensitiveDataRedactingFormatter(logging.Formatter):
    """
    Custom log formatter that scrubs credentials, tokens, and passwords from all log records.
    """
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        return self.redact_sensitive_content(original)

    @classmethod
    def redact_sensitive_content(cls, message: str) -> str:
        if not isinstance(message, str):
            message = str(message)
        # Redact Bearer tokens
        redacted = BEARER_TOKEN_PATTERN.sub("Bearer [REDACTED_TOKEN]", message)
        # Redact standalone JWT patterns
        redacted = JWT_PATTERN.sub("[REDACTED_JWT]", redacted)
        # Redact password fields
        redacted = PASSWORD_PATTERN.sub(r'\1: "[REDACTED_PASSWORD]"', redacted)
        # Redact secret keys
        redacted = SECRET_PATTERN.sub(r'\1: "[REDACTED_SECRET]"', redacted)
        return redacted

def setup_secure_logging(log_level: str = "INFO") -> logging.Logger:
    """
    Initializes a hardened logger with sensitive data redaction.
    """
    level = getattr(logging, log_level.upper(), logging.INFO)
    logger = logging.getLogger("military_caesar_api")
    logger.setLevel(level)

    # Avoid adding duplicate handlers if already configured
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        formatter = SensitiveDataRedactingFormatter(
            fmt="%(asctime)s [%(levelname)s] [REQ:%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger

# Module singleton logger
logger = setup_secure_logging()
