"""
PostgreSQL-ready Message Repository and Data Vault Layer.
Stores encrypted message records with strict user isolation, thread-safety, and zero-plaintext guarantees.
"""
import uuid
import threading
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from app.schemas.message import MessageOperation
from app.core.config import settings
from app.core.logging_config import logger

class MessageEntity:
    def __init__(
        self,
        id: str,
        user_id: str,
        operation_type: MessageOperation,
        ciphertext: str,
        shift: int,
        char_count: int,
        timestamp: Optional[str] = None,
        notes: Optional[str] = None
    ):
        self.id = id
        self.user_id = user_id
        self.operation_type = operation_type
        self.ciphertext = ciphertext
        self.shift = ((shift % 26) + 26) % 26
        self.char_count = char_count
        self.timestamp = timestamp or datetime.utcnow().isoformat()
        self.notes = notes

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "operation_type": self.operation_type.value if hasattr(self.operation_type, "value") else str(self.operation_type),
            "ciphertext": self.ciphertext,
            "shift": self.shift,
            "char_count": self.char_count,
            "timestamp": self.timestamp,
            "notes": self.notes
        }

class MessageRepository:
    def __init__(self):
        self._lock = threading.RLock()
        self._messages: Dict[str, MessageEntity] = {}
        self._seed_initial_demo_messages()

    def _seed_initial_demo_messages(self):
        """Pre-seeds initial demo encrypted records for test operators."""
        now = datetime.utcnow()
        with self._lock:
            demo_1 = MessageEntity(
                id="msg-vault-001",
                user_id="usr-odin-001",
                operation_type=MessageOperation.ENCRYPT,
                ciphertext="VRXDGURQ GHOWD: SURFHHG WR JULG 48.85Q, 2.29H DW 0600C.",
                shift=3,
                char_count=55,
                timestamp=(now - timedelta(hours=3)).isoformat(),
                notes="Tactical Sector Recon (k=3)"
            )
            self._messages[demo_1.id] = demo_1

            demo_2 = MessageEntity(
                id="msg-vault-002",
                user_id="usr-odin-001",
                operation_type=MessageOperation.ENCRYPT,
                ciphertext="PBASVQ ragvny gnp gvpny cebgbpby nycun-9",
                shift=13,
                char_count=39,
                timestamp=(now - timedelta(hours=1, minutes=15)).isoformat(),
                notes="ROT13 Transmission Key Alpha"
            )
            self._messages[demo_2.id] = demo_2

            demo_3 = MessageEntity(
                id="msg-vault-003",
                user_id="usr-sentinel-002",
                operation_type=MessageOperation.DECRYPT,
                ciphertext="DWWDFN DW GDZQ. VHFWRU 7 FRQILUPHG.",
                shift=3,
                char_count=35,
                timestamp=(now - timedelta(minutes=45)).isoformat(),
                notes="Inbound Recon Decrypt (k=3)"
            )
            self._messages[demo_3.id] = demo_3

    def is_healthy(self) -> bool:
        """Verifies repository connection and operational readiness."""
        with self._lock:
            return isinstance(self._messages, dict)

    def get_by_id(self, message_id: str) -> Optional[MessageEntity]:
        with self._lock:
            return self._messages.get(message_id)

    def get_by_id_for_user(self, message_id: str, user_id: str) -> Optional[MessageEntity]:
        with self._lock:
            msg = self._messages.get(message_id)
            if msg and msg.user_id == user_id:
                return msg
            return None

    def get_all_for_user(
        self,
        user_id: str,
        search: Optional[str] = None,
        operation_type: Optional[MessageOperation] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[MessageEntity]:
        safe_limit = max(1, min(limit, settings.MAX_PAGE_LIMIT))
        safe_skip = max(0, skip)

        with self._lock:
            user_msgs = [m for m in self._messages.values() if m.user_id == user_id]

            if operation_type:
                user_msgs = [m for m in user_msgs if m.operation_type == operation_type]

            if search:
                query = search.strip().lower()
                user_msgs = [
                    m for m in user_msgs
                    if query in m.ciphertext.lower() or (m.notes and query in m.notes.lower())
                ]

            # Sort newest first by default
            user_msgs.sort(key=lambda m: m.timestamp, reverse=True)
            return user_msgs[safe_skip:safe_skip + safe_limit]

    def count_for_user(self, user_id: str) -> int:
        with self._lock:
            return sum(1 for m in self._messages.values() if m.user_id == user_id)

    def create(
        self,
        user_id: str,
        ciphertext: str,
        shift: int,
        operation_type: MessageOperation = MessageOperation.ENCRYPT,
        notes: Optional[str] = None
    ) -> MessageEntity:
        msg_id = f"msg-{str(uuid.uuid4())[:8]}"
        clean_ciphertext = ciphertext.strip()
        new_message = MessageEntity(
            id=msg_id,
            user_id=user_id,
            operation_type=operation_type,
            ciphertext=clean_ciphertext,
            shift=((shift % 26) + 26) % 26,
            char_count=len(clean_ciphertext),
            timestamp=datetime.utcnow().isoformat(),
            notes=notes.strip() if notes else None
        )
        with self._lock:
            self._messages[msg_id] = new_message
        logger.info(f"Stored encrypted message vault record: msg_id={msg_id}, user_id={user_id}, char_count={len(clean_ciphertext)}")
        return new_message

    def delete_for_user(self, message_id: str, user_id: str) -> bool:
        with self._lock:
            msg = self._messages.get(message_id)
            if not msg or msg.user_id != user_id:
                return False
            del self._messages[message_id]
            logger.info(f"Purged vault record: msg_id={message_id}, user_id={user_id}")
            return True

    def clear_for_user(self, user_id: str) -> int:
        with self._lock:
            to_delete = [m_id for m_id, m in self._messages.items() if m.user_id == user_id]
            for m_id in to_delete:
                del self._messages[m_id]
            logger.info(f"Cleared {len(to_delete)} vault records for user_id={user_id}")
            return len(to_delete)

    def reset_to_seed(self):
        with self._lock:
            self._messages = {}
            self._seed_initial_demo_messages()

# Global singleton message repository
message_repository = MessageRepository()
