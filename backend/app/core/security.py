"""
Hardened Security, Password Hashing, and Cryptographic Token Utilities.
Military Caesar Cryptography API (Phase 10 Hardened).
"""
import os
import time
import json
import base64
import hmac
import hashlib
import secrets
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.logging_config import logger

# Hardened PBKDF2-HMAC-SHA256 parameters (NIST SP 800-132 compliant)
HASH_ALGORITHM = "sha256"
HASH_ITERATIONS = 100_000
SALT_SIZE = 16
MAX_PASSWORD_LENGTH = 128

def get_password_hash(password: str) -> str:
    """
    Computes a secure salted PBKDF2-HMAC-SHA256 password hash.
    Format: pbkdf2_sha256$iterations$salt_hex$hash_hex
    Plaintext passwords are never logged or stored.
    """
    if not password or not isinstance(password, str):
        raise ValueError("Password must be a non-empty string")
    
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(f"Password exceeds maximum permitted length of {MAX_PASSWORD_LENGTH} characters")

    salt = secrets.token_bytes(SALT_SIZE)
    key = hashlib.pbkdf2_hmac(
        HASH_ALGORITHM,
        password.encode('utf-8'),
        salt,
        HASH_ITERATIONS
    )
    salt_hex = salt.hex()
    key_hex = key.hex()
    return f"pbkdf2_sha256${HASH_ITERATIONS}${salt_hex}${key_hex}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored salted hash using constant-time comparison.
    Resistant to timing side-channel attacks and malformed input crashes.
    """
    if not plain_password or not hashed_password or not isinstance(plain_password, str) or not isinstance(hashed_password, str):
        return False
    
    if len(plain_password) > MAX_PASSWORD_LENGTH:
        return False
    
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        
        iterations = int(parts[1])
        if iterations < 10_000 or iterations > 1_000_000:
            return False
            
        salt = bytes.fromhex(parts[2])
        expected_key = bytes.fromhex(parts[3])
        
        computed_key = hashlib.pbkdf2_hmac(
            HASH_ALGORITHM,
            plain_password.encode('utf-8'),
            salt,
            iterations
        )
        return hmac.compare_digest(computed_key, expected_key)
    except Exception as exc:
        logger.debug(f"Password verification encountered format error: {type(exc).__name__}")
        return False

def _b64encode(data: bytes) -> str:
    """Standard URL-safe Base64 encoding without trailing padding."""
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64decode(data: str) -> bytes:
    """Standard URL-safe Base64 decoding with restored padding."""
    padding = '=' * (4 - (len(data) % 4)) if len(data) % 4 != 0 else ''
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(
    subject: str,
    claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Creates a cryptographically signed HMAC-SHA256 JWT access token.
    Enforces subject validation, issue time, unique token ID (jti), and expiration.
    """
    if not subject or not isinstance(subject, str):
        raise ValueError("JWT subject ('sub') must be a non-empty string identifier")

    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    header = {
        "alg": settings.JWT_ALGORITHM,
        "typ": "JWT"
    }
    
    payload = {
        "sub": subject.strip(),
        "jti": str(uuid.uuid4()),
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "iss": settings.PROJECT_NAME
    }
    
    if claims:
        # Sanitize claims to prevent overwriting core security fields
        safe_claims = {k: v for k, v in claims.items() if k not in ("sub", "exp", "iat", "nbf", "iss", "jti")}
        payload.update(safe_claims)
        
    encoded_header = _b64encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    encoded_payload = _b64encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    
    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode('utf-8'),
        signing_input,
        hashlib.sha256
    ).digest()
    
    encoded_signature = _b64encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and cryptographically validates a JWT access token:
    1. Validates structural format (3 segments)
    2. Validates header algorithm (prevents 'none' and algorithm confusion attacks)
    3. Verifies HMAC-SHA256 signature with constant-time comparison
    4. Validates token expiration (exp) and not-before (nbf)
    5. Validates non-empty subject identifier
    """
    if not token or not isinstance(token, str):
        return None
    
    try:
        parts = token.strip().split('.')
        if len(parts) != 3:
            return None
        
        encoded_header, encoded_payload, encoded_signature = parts
        
        # 1. Decode and verify header
        header_bytes = _b64decode(encoded_header)
        header = json.loads(header_bytes.decode('utf-8'))
        
        # Anti-algorithm substitution check
        if header.get("alg") != settings.JWT_ALGORITHM or header.get("typ") != "JWT":
            logger.warning("Rejected JWT with invalid or unapproved algorithm header")
            return None
        
        # 2. Verify signature
        signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
        expected_signature = hmac.new(
            settings.JWT_SECRET_KEY.encode('utf-8'),
            signing_input,
            hashlib.sha256
        ).digest()
        
        received_signature = _b64decode(encoded_signature)
        if not hmac.compare_digest(expected_signature, received_signature):
            logger.debug("Rejected JWT with signature mismatch")
            return None
        
        # 3. Decode and verify payload
        payload_bytes = _b64decode(encoded_payload)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        current_ts = time.time()
        
        # Expiration check
        exp = payload.get("exp")
        if not exp or not isinstance(exp, (int, float)) or exp < current_ts:
            logger.debug("Rejected expired JWT token")
            return None
            
        # Not-before check
        nbf = payload.get("nbf")
        if nbf and isinstance(nbf, (int, float)) and nbf > current_ts + 60:  # 60s clock skew tolerance
            logger.debug("Rejected JWT token used before nbf timestamp")
            return None
            
        # Subject validation
        sub = payload.get("sub")
        if not sub or not isinstance(sub, str) or not sub.strip():
            logger.debug("Rejected JWT token with empty subject claim")
            return None

        return payload
    except Exception as exc:
        logger.debug(f"JWT decode failed with parsing error: {type(exc).__name__}")
        return None
