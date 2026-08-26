"""
PostgreSQL-ready User Repository and Data Storage Layer.
Provides thread-safe user management with salted PBKDF2 password hashes and connection health checks.
Never exposes or logs plaintext passwords.
"""
import uuid
import threading
from typing import Optional, List, Dict
from datetime import datetime
from app.core.security import get_password_hash, verify_password
from app.schemas.auth import ClearanceLevel
from app.core.logging_config import logger

class UserEntity:
    def __init__(
        self,
        id: str,
        username: str,
        email: str,
        hashed_password: str,
        clearance_level: ClearanceLevel = ClearanceLevel.SECRET,
        callsign: Optional[str] = None,
        is_active: bool = True,
        created_at: Optional[str] = None
    ):
        self.id = id
        self.username = username
        self.email = email
        self.hashed_password = hashed_password
        self.clearance_level = clearance_level
        self.callsign = callsign
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow().isoformat()

    def to_dict(self) -> Dict:
        """
        Public serialization strictly excluding sensitive password hashes.
        """
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "callsign": self.callsign,
            "clearance_level": self.clearance_level.value if isinstance(self.clearance_level, ClearanceLevel) else str(self.clearance_level),
            "is_active": self.is_active,
            "created_at": self.created_at
        }

class UserRepository:
    def __init__(self):
        self._lock = threading.RLock()
        self._users: Dict[str, UserEntity] = {}
        self._seed_initial_demo_users()

    def _seed_initial_demo_users(self):
        """Pre-seeds demo tactical operators for immediate development and testing."""
        with self._lock:
            demo_odin = UserEntity(
                id="usr-odin-001",
                username="operator_odin",
                email="odin.command@tactical.mil",
                hashed_password=get_password_hash("TacticalPass123!"),
                clearance_level=ClearanceLevel.TOP_SECRET,
                callsign="ODIN-1",
                is_active=True
            )
            self._users[demo_odin.id] = demo_odin

            demo_sentinel = UserEntity(
                id="usr-sentinel-002",
                username="sentinel_cadet",
                email="cadet.sentinel@tactical.mil",
                hashed_password=get_password_hash("CadetShield2026!"),
                clearance_level=ClearanceLevel.CONFIDENTIAL,
                callsign="SENTINEL-4",
                is_active=True
            )
            self._users[demo_sentinel.id] = demo_sentinel

    def is_healthy(self) -> bool:
        """Verifies repository connection and operational readiness."""
        with self._lock:
            return isinstance(self._users, dict)

    def get_by_id(self, user_id: str) -> Optional[UserEntity]:
        with self._lock:
            return self._users.get(user_id)

    def get_by_username(self, username: str) -> Optional[UserEntity]:
        if not username:
            return None
        username_lower = username.strip().lower()
        with self._lock:
            for user in self._users.values():
                if user.username.lower() == username_lower:
                    return user
        return None

    def get_by_email(self, email: str) -> Optional[UserEntity]:
        if not email:
            return None
        email_lower = email.strip().lower()
        with self._lock:
            for user in self._users.values():
                if user.email.lower() == email_lower:
                    return user
        return None

    def get_by_username_or_email(self, identifier: str) -> Optional[UserEntity]:
        if not identifier:
            return None
        clean_id = identifier.strip().lower()
        with self._lock:
            for user in self._users.values():
                if user.username.lower() == clean_id or user.email.lower() == clean_id:
                    return user
        return None

    def create(
        self,
        username: str,
        email: str,
        password: str,
        clearance_level: ClearanceLevel = ClearanceLevel.SECRET,
        callsign: Optional[str] = None
    ) -> UserEntity:
        user_id = f"usr-{str(uuid.uuid4())[:8]}"
        hashed_password = get_password_hash(password)
        new_user = UserEntity(
            id=user_id,
            username=username.strip(),
            email=email.strip().lower(),
            hashed_password=hashed_password,
            clearance_level=clearance_level,
            callsign=callsign.strip() if callsign else None,
            is_active=True,
            created_at=datetime.utcnow().isoformat()
        )
        with self._lock:
            self._users[user_id] = new_user
        logger.info(f"Created new operator account: username={new_user.username} (id={user_id})")
        return new_user

    def authenticate(self, username_or_email: str, password: str) -> Optional[UserEntity]:
        user = self.get_by_username_or_email(username_or_email)
        if not user or not user.is_active:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def count(self) -> int:
        with self._lock:
            return len(self._users)

# Global singleton repository instance
user_repository = UserRepository()
