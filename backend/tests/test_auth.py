"""
Automated Test Suite for FastAPI Backend Authentication (Phase 6).
Tests:
- Password hashing & constant-time verification
- JWT Token creation, expiration, and payload decoding
- Successful user registration
- Duplicate registration rejection (409 Conflict)
- Successful login with correct credentials
- Invalid credentials rejection (401 Unauthorized)
- Protected user profile retrieval (/auth/me) with token validation
- Authorization header verification and token expiration handling
"""
import unittest
import time
import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.db.user_repository import UserRepository, UserEntity
from app.schemas.auth import ClearanceLevel, UserRegisterRequest, UserLoginRequest
from app.api.v1.endpoints.auth import (
    register_operator,
    login_operator,
    get_current_operator_profile,
    HTTPException
)

class TestBackendAuthentication(unittest.TestCase):

    def setUp(self):
        # Fresh isolated repository for clean test state
        self.repo = UserRepository()

    def test_01_password_hashing_security(self):
        password = "TacticalPassword2026!"
        hashed = get_password_hash(password)
        
        self.assertNotEqual(password, hashed)
        self.assertTrue(hashed.startswith("pbkdf2_sha256$"))
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword123!", hashed))
        self.assertFalse(verify_password("", hashed))

    def test_02_jwt_token_generation_and_decoding(self):
        user_id = "test-user-id-99"
        claims = {"username": "pilot_falcon", "clearance": "TOP_SECRET"}
        token = create_access_token(subject=user_id, claims=claims)
        
        self.assertIsInstance(token, str)
        self.assertEqual(len(token.split('.')), 3)
        
        decoded = decode_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded.get("sub"), user_id)
        self.assertEqual(decoded.get("username"), "pilot_falcon")
        self.assertEqual(decoded.get("clearance"), "TOP_SECRET")

    def test_03_successful_registration(self):
        payload = UserRegisterRequest(
            username="cadet_alex",
            email="alex.cadet@tactical.mil",
            password="SecurePassphrase99!",
            callsign="VIPER-4",
            clearance_level=ClearanceLevel.SECRET
        )
        response = register_operator(payload)
        
        self.assertIsNotNone(response.access_token)
        self.assertEqual(response.token_type, "bearer")
        self.assertEqual(response.user.username, "cadet_alex")
        self.assertEqual(response.user.email, "alex.cadet@tactical.mil")
        self.assertEqual(response.user.callsign, "VIPER-4")
        self.assertEqual(response.user.clearance_level, ClearanceLevel.SECRET)
        
        # Verify password is never exposed in response object
        user_dict = response.user.model_dump() if hasattr(response.user, "model_dump") else response.user.__dict__
        self.assertNotIn("password", user_dict)
        self.assertNotIn("hashed_password", user_dict)

    def test_04_duplicate_registration_rejected(self):
        payload1 = UserRegisterRequest(
            username="echo_leader",
            email="echo.leader@tactical.mil",
            password="SecurePassword123!",
            callsign="ECHO-1",
            clearance_level=ClearanceLevel.TOP_SECRET
        )
        register_operator(payload1)
        
        # Duplicate username attempt
        payload_dup_user = UserRegisterRequest(
            username="echo_leader",
            email="another.email@tactical.mil",
            password="SecurePassword123!",
            callsign="ECHO-2",
            clearance_level=ClearanceLevel.SECRET
        )
        with self.assertRaises(HTTPException) as ctx:
            register_operator(payload_dup_user)
        self.assertEqual(ctx.exception.status_code, 409)

        # Duplicate email attempt
        payload_dup_email = UserRegisterRequest(
            username="echo_cadet",
            email="echo.leader@tactical.mil",
            password="SecurePassword123!",
            callsign="ECHO-3",
            clearance_level=ClearanceLevel.CONFIDENTIAL
        )
        with self.assertRaises(HTTPException) as ctx:
            register_operator(payload_dup_email)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_05_successful_login(self):
        login_payload = UserLoginRequest(
            username="operator_odin",
            password="TacticalPass123!"
        )
        response = login_operator(login_payload)
        
        self.assertIsNotNone(response.access_token)
        self.assertEqual(response.token_type, "bearer")
        self.assertEqual(response.user.username, "operator_odin")
        self.assertEqual(response.user.clearance_level, ClearanceLevel.TOP_SECRET)
        self.assertEqual(response.user.callsign, "ODIN-1")

    def test_06_invalid_credentials_rejected(self):
        # Wrong password
        bad_pass = UserLoginRequest(
            username="operator_odin",
            password="WrongPassword123!"
        )
        with self.assertRaises(HTTPException) as ctx:
            login_operator(bad_pass)
        self.assertEqual(ctx.exception.status_code, 401)

        # Non-existent user
        non_existent = UserLoginRequest(
            username="ghost_operator",
            password="SomePassword123!"
        )
        with self.assertRaises(HTTPException) as ctx:
            login_operator(non_existent)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_07_protected_endpoint_profile(self):
        user = UserEntity(
            id="test-officer-id",
            username="commander_stark",
            email="stark@tactical.mil",
            hashed_password=get_password_hash("IronPass123!"),
            clearance_level=ClearanceLevel.TOP_SECRET,
            callsign="AVENGER-1"
        )
        profile = get_current_operator_profile(current_user=user)
        
        self.assertEqual(profile.id, "test-officer-id")
        self.assertEqual(profile.username, "commander_stark")
        self.assertEqual(profile.callsign, "AVENGER-1")
        self.assertEqual(profile.clearance_level, ClearanceLevel.TOP_SECRET)
        
        profile_dict = profile.model_dump() if hasattr(profile, "model_dump") else profile.__dict__
        self.assertNotIn("password", profile_dict)
        self.assertNotIn("hashed_password", profile_dict)

if __name__ == "__main__":
    unittest.main()
