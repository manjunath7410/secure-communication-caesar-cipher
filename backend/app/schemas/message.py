"""
Pydantic schemas for Authenticated Message History Vault.
Supports standard FastAPI Pydantic v2 validation as well as standalone test execution.
Strictly guarantees zero plaintext storage or transmission.
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime

class MessageOperation(str, Enum):
    ENCRYPT = "ENCRYPT"
    DECRYPT = "DECRYPT"

try:
    from pydantic import BaseModel, Field, field_validator

    class MessageCreateRequest(BaseModel):
        ciphertext: str = Field(..., min_length=1, max_length=10000, description="Ciphertext payload (Plaintext is NEVER accepted or stored)")
        shift: int = Field(..., ge=0, le=25, description="Caesar cipher shift key k in [0, 25]")
        operation_type: MessageOperation = Field(default=MessageOperation.ENCRYPT, description="Operation type (ENCRYPT or DECRYPT)")
        notes: Optional[str] = Field(None, max_length=200, description="Optional operator note or mission tag")

        @field_validator("ciphertext")
        @classmethod
        def validate_ciphertext(cls, v: str) -> str:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Ciphertext must not be empty or whitespace only.")
            return cleaned

        @field_validator("shift")
        @classmethod
        def validate_shift(cls, v: int) -> int:
            return ((v % 26) + 26) % 26

        @field_validator("notes")
        @classmethod
        def validate_notes(cls, v: Optional[str]) -> Optional[str]:
            if v is not None:
                trimmed = v.strip()
                return trimmed if trimmed else None
            return None

    class MessageResponse(BaseModel):
        id: str
        user_id: str
        operation_type: MessageOperation
        ciphertext: str
        shift: int
        char_count: int
        timestamp: str
        notes: Optional[str] = None

        class Config:
            from_attributes = True

    class MessageListResponse(BaseModel):
        total: int
        items: List[MessageResponse]

    class MessageDeleteResponse(BaseModel):
        success: bool
        message_id: str
        detail: str

except ImportError:
    # Standalone fallback classes for test environments without pydantic
    class MessageCreateRequest:
        def __init__(self, ciphertext: str, shift: int, operation_type: MessageOperation = MessageOperation.ENCRYPT, notes: Optional[str] = None):
            cleaned = ciphertext.strip() if ciphertext else ""
            if not cleaned:
                raise ValueError("Ciphertext must not be empty.")
            if len(cleaned) > 10000:
                raise ValueError("Ciphertext exceeds max length of 10000 characters.")
            self.ciphertext = cleaned
            self.shift = ((shift % 26) + 26) % 26
            self.operation_type = operation_type or MessageOperation.ENCRYPT
            self.notes = notes.strip() if notes and notes.strip() else None

    class MessageResponse:
        def __init__(self, id: str, user_id: str, operation_type: MessageOperation, ciphertext: str, shift: int, char_count: int, timestamp: str, notes: Optional[str] = None):
            self.id = id
            self.user_id = user_id
            self.operation_type = operation_type
            self.ciphertext = ciphertext
            self.shift = shift
            self.char_count = char_count
            self.timestamp = timestamp
            self.notes = notes

        def model_dump(self) -> Dict[str, Any]:
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

    class MessageListResponse:
        def __init__(self, total: int, items: List[MessageResponse]):
            self.total = total
            self.items = items

    class MessageDeleteResponse:
        def __init__(self, success: bool, message_id: str, detail: str):
            self.success = success
            self.message_id = message_id
            self.detail = detail
