"""
Hardened Message Vault & History API Endpoints:
- GET    /messages          -> 200 OK (Lists authenticated operator's messages only)
- POST   /messages          -> 201 Created (Stores encrypted record; zero plaintext)
- GET    /messages/{id}     -> 200 OK / 403 Forbidden / 404 Not Found
- DELETE /messages/{id}     -> 200 OK / 403 Forbidden / 404 Not Found
- DELETE /messages          -> 200 OK (Purges authenticated operator's records only)
"""
from typing import Optional, List
import re

try:
    from fastapi import APIRouter, HTTPException, status, Depends, Query, Path
except ImportError:
    class APIRouter:
        def __init__(self): pass
        def post(self, *args, **kwargs): return lambda f: f
        def get(self, *args, **kwargs): return lambda f: f
        def delete(self, *args, **kwargs): return lambda f: f
        def include_router(self, *args, **kwargs): pass
    class status:
        HTTP_200_OK = 200
        HTTP_201_CREATED = 201
        HTTP_400_BAD_REQUEST = 400
        HTTP_401_UNAUTHORIZED = 401
        HTTP_403_FORBIDDEN = 403
        HTTP_404_NOT_FOUND = 404
        HTTP_500_INTERNAL_SERVER_ERROR = 500
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str, headers: Optional[dict] = None):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail
            self.headers = headers
    def Depends(f): return f
    def Query(default=None, **kwargs): return default
    def Path(default=None, **kwargs): return default

from app.schemas.message import (
    MessageCreateRequest,
    MessageResponse,
    MessageListResponse,
    MessageDeleteResponse,
    MessageOperation,
)
from app.db.message_repository import message_repository, MessageEntity
from app.db.user_repository import UserEntity
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.core.logging_config import logger

router = APIRouter()

ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]+$")

def _validate_id(resource_id: str) -> str:
    cleaned = resource_id.strip()
    if not ID_PATTERN.match(cleaned) or len(cleaned) > 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid message ID format."
        )
    return cleaned

@router.get(
    "",
    response_model=MessageListResponse,
    status_code=status.HTTP_200_OK,
    summary="List authenticated operator's message vault records",
    description="Returns message vault records strictly owned by the authenticated operator with pagination and search."
)
def list_messages(
    search: Optional[str] = Query(None, max_length=100, description="Filter ciphertext or notes"),
    operation_type: Optional[MessageOperation] = Query(None, description="Filter by operation type"),
    limit: int = Query(100, ge=1, le=100, description="Max records to retrieve (1-100)"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: UserEntity = Depends(get_current_user)
) -> MessageListResponse:
    user_records = message_repository.get_all_for_user(
        user_id=current_user.id,
        search=search,
        operation_type=operation_type,
        limit=limit,
        skip=skip
    )

    items = [
        MessageResponse(
            id=m.id,
            user_id=m.user_id,
            operation_type=m.operation_type,
            ciphertext=m.ciphertext,
            shift=m.shift,
            char_count=m.char_count,
            timestamp=m.timestamp,
            notes=m.notes
        )
        for m in user_records
    ]

    total_count = message_repository.count_for_user(current_user.id)
    return MessageListResponse(total=total_count, items=items)

@router.post(
    "",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Store a new encrypted message record in the vault",
    description="Persists ciphertext and shift metadata to the authenticated operator's vault. Plaintext is NEVER accepted or stored."
)
def create_message_record(
    payload: MessageCreateRequest,
    current_user: UserEntity = Depends(get_current_user)
) -> MessageResponse:
    if not payload.ciphertext or len(payload.ciphertext.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ciphertext payload must not be empty."
        )

    if len(payload.ciphertext) > settings.MAX_CIPHERTEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ciphertext exceeds maximum allowed length of {settings.MAX_CIPHERTEXT_LENGTH} characters."
        )

    new_msg = message_repository.create(
        user_id=current_user.id,
        ciphertext=payload.ciphertext,
        shift=payload.shift,
        operation_type=payload.operation_type,
        notes=payload.notes
    )

    return MessageResponse(
        id=new_msg.id,
        user_id=new_msg.user_id,
        operation_type=new_msg.operation_type,
        ciphertext=new_msg.ciphertext,
        shift=new_msg.shift,
        char_count=new_msg.char_count,
        timestamp=new_msg.timestamp,
        notes=new_msg.notes
    )

@router.get(
    "/{message_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a specific message record by ID",
    description="Fetches a specific message record by ID. Strictly verifies operator ownership; returns 403 Forbidden for unauthorized access."
)
def get_message_by_id(
    message_id: str = Path(..., description="Unique message vault ID"),
    current_user: UserEntity = Depends(get_current_user)
) -> MessageResponse:
    clean_id = _validate_id(message_id)
    msg = message_repository.get_by_id(clean_id)
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message vault record '{clean_id}' not found."
        )

    # Strict Authorization Check: User must only access their own records
    if msg.user_id != current_user.id:
        logger.warning(f"Unauthorized cross-user vault access attempt: user={current_user.username} tried accessing msg_id={clean_id} owned by {msg.user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not possess clearance or ownership of this vault record."
        )

    return MessageResponse(
        id=msg.id,
        user_id=msg.user_id,
        operation_type=msg.operation_type,
        ciphertext=msg.ciphertext,
        shift=msg.shift,
        char_count=msg.char_count,
        timestamp=msg.timestamp,
        notes=msg.notes
    )

@router.delete(
    "/{message_id}",
    response_model=MessageDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a message record from the vault",
    description="Deletes a specific message record by ID. Strictly verifies user ownership before purging."
)
def delete_message_by_id(
    message_id: str = Path(..., description="Unique message vault ID"),
    current_user: UserEntity = Depends(get_current_user)
) -> MessageDeleteResponse:
    clean_id = _validate_id(message_id)
    msg = message_repository.get_by_id(clean_id)
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message vault record '{clean_id}' not found."
        )

    # Strict Authorization Check
    if msg.user_id != current_user.id:
        logger.warning(f"Unauthorized cross-user vault deletion attempt: user={current_user.username} tried deleting msg_id={clean_id} owned by {msg.user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You cannot delete a record belonging to another operator."
        )

    success = message_repository.delete_for_user(clean_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete vault record."
        )

    return MessageDeleteResponse(
        success=True,
        message_id=clean_id,
        detail=f"Vault record '{clean_id}' purged successfully."
    )

@router.delete(
    "",
    response_model=MessageDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Clear all vault records for the authenticated operator",
    description="Purges all message records belonging strictly to the requesting operator."
)
def clear_user_messages(
    current_user: UserEntity = Depends(get_current_user)
) -> MessageDeleteResponse:
    purged_count = message_repository.clear_for_user(current_user.id)
    return MessageDeleteResponse(
        success=True,
        message_id="ALL_USER_RECORDS",
        detail=f"Purged {purged_count} vault records for operator {current_user.username}."
    )
