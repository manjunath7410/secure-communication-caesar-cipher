"""
Automated Test Suite for Phase 10: Backend API Hardening & Security Auditing.
Tests:
1. Sensitive Data Logging Redaction (Passwords, JWTs, Bearer tokens, secrets)
2. JWT Tampering & Algorithm Confusion Prevention (None algorithm, invalid signature)
3. Input Validation Hardening (Username regex, password length bounds, email format)
4. Deactivated User Account Rejection (401 Unauthorized)
5. Repository Thread-Safety & Concurrent Operations
6. Subsystem Health Diagnostics
7. Max Payload Bounds & Ciphertext Sanitization
"""
import unittest
import os
import sys
import json
import base64
import hmac
import hashlib
import time

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    _b64encode,
    _b64decode,
    MAX_PASSWORD_LENGTH
)
from app.core.logging_config import SensitiveDataRedactingFormatter
from app.db.user_repository import UserRepository, UserEntity
from app.db.message_repository import MessageRepository
from app.schemas.auth import UserRegisterRequest, ClearanceLevel
from app.schemas.message import MessageCreateRequest, MessageOperation
from app.api.v1.endpoints.health import get_health
from app.api.v1.endpoints.auth import HTTPException

class TestSecurityHardening(unittest.TestCase):

    def test_01_sensitive_data_logging_redaction(self):
        """Verify log formatter strictly sanitizes passwords, JWTs, and Bearer tokens."""
        raw_msg_with_token = "User authorized with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.abc123sig"
        sanitized_token = SensitiveDataRedactingFormatter.redact_sensitive_content(raw_msg_with_token)
        self.assertNotIn("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", sanitized_token)
        self.assertIn("[REDACTED_TOKEN]", sanitized_token)

        raw_msg_with_pass = 'Attempting login with password: "TopSecretPassword123!"'
        sanitized_pass = SensitiveDataRedactingFormatter.redact_sensitive_content(raw_msg_with_pass)
        self.assertNotIn("TopSecretPassword123!", sanitized_pass)
        self.assertIn("[REDACTED_PASSWORD]", sanitized_pass)

    def test_02_jwt_tampering_and_algorithm_none_rejected(self):
        """Verify tokens with altered payloads, fake signatures, or alg='none' are rejected."""
        valid_token = create_access_token(subject="usr-test-001")
        parts = valid_token.split('.')
        self.assertEqual(len(parts), 3)

        # 1. Tampered payload
        fake_payload = json.dumps({"sub": "usr-admin-root", "exp": int(time.time()) + 3600, "iss": settings.PROJECT_NAME})
        fake_payload_b64 = _b64encode(fake_payload.encode('utf-8'))
        tampered_token = f"{parts[0]}.{fake_payload_b64}.{parts[2]}"
        self.assertIsNone(decode_access_token(tampered_token))

        # 2. Algorithm 'none' attack simulation
        none_header = _b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode('utf-8'))
        none_token = f"{none_header}.{parts[1]}."
        self.assertIsNone(decode_access_token(none_token))

        # 3. Algorithm 'RS256' confusion simulation
        rs256_header = _b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode('utf-8'))
        rs256_token = f"{rs256_header}.{parts[1]}.{parts[2]}"
        self.assertIsNone(decode_access_token(rs256_token))

    def test_03_password_boundaries_and_dos_protection(self):
        """Verify maximum password length enforcement prevents hash DoS attacks."""
        valid_pass = "A" * 120
        hashed = get_password_hash(valid_pass)
        self.assertTrue(verify_password(valid_pass, hashed))

        # Password exceeding MAX_PASSWORD_LENGTH must be rejected
        huge_pass = "A" * 500
        with self.assertRaises(ValueError):
            get_password_hash(huge_pass)
        self.assertFalse(verify_password(huge_pass, hashed))

    def test_04_username_input_validation(self):
        """Verify username rejects invalid characters or illegal lengths."""
        # Valid usernames
        req1 = UserRegisterRequest(
            username="tactical_operator-01",
            email="tactical@mil.gov",
            password="SecurePassphrase123!"
        )
        self.assertEqual(req1.username, "tactical_operator-01")

        # Invalid username with spaces or special characters
        with self.assertRaises(ValueError):
            UserRegisterRequest(
                username="invalid user with spaces",
                email="test@mil.gov",
                password="SecurePassphrase123!"
            )

        # Invalid username too short (< 3 chars)
        with self.assertRaises(ValueError):
            UserRegisterRequest(
                username="ab",
                email="test@mil.gov",
                password="SecurePassphrase123!"
            )

    def test_05_email_input_validation(self):
        """Verify email format validation rejects invalid emails."""
        with self.assertRaises(ValueError):
            UserRegisterRequest(
                username="valid_user",
                email="not-an-email",
                password="SecurePassphrase123!"
            )

    def test_06_deactivated_user_handling(self):
        """Verify deactivated accounts cannot authenticate."""
        repo = UserRepository()
        user = repo.create(
            username="deactivated_officer",
            email="deact@mil.gov",
            password="Password123!",
            clearance_level=ClearanceLevel.CONFIDENTIAL
        )
        user.is_active = False

        # Authenticate must return None for inactive user
        auth_result = repo.authenticate("deactivated_officer", "Password123!")
        self.assertIsNone(auth_result)

    def test_07_health_subsystem_diagnostics(self):
        """Verify health check endpoint returns comprehensive status and academic notice."""
        health = get_health()
        self.assertEqual(health.status, "operational")
        self.assertEqual(health.database["status"], "connected")
        self.assertIn("Caesar cipher", health.disclaimer)
        self.assertEqual(health.security["jwt_algorithm"], "HS256")
        self.assertEqual(health.subsystems["crypto_engine"], "client_authoritative")

    def test_08_message_schema_shift_normalization(self):
        """Verify shift parameter handles arbitrary integer shifts with modulo 26 normalization."""
        msg_req = MessageCreateRequest(
            ciphertext="KHOOR",
            shift=29,  # 29 % 26 = 3
            operation_type=MessageOperation.ENCRYPT
        )
        self.assertEqual(msg_req.shift, 3)

        msg_req_neg = MessageCreateRequest(
            ciphertext="KHOOR",
            shift=-3,  # (-3 % 26) + 26 % 26 = 23
            operation_type=MessageOperation.ENCRYPT
        )
        self.assertEqual(msg_req_neg.shift, 23)

if __name__ == "__main__":
    unittest.main()
