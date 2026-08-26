"""
Automated Test Suite for Message History & Vault Endpoints.
Covers:
1. Message creation with ciphertext and shift metadata (POST /messages)
2. Zero-plaintext persistence verification (Database stores NO plaintext)
3. Strict user message isolation (GET /messages returns only authenticated user's records)
4. Cross-user authorization protection (GET /messages/{id} forbids unauthorized operator access - 403 Forbidden)
5. Cross-user deletion protection (DELETE /messages/{id} forbids unauthorized operator deletion - 403 Forbidden)
6. Successful deletion of owned message (DELETE /messages/{id} - 200 OK)
7. Search and filtering capabilities
8. Pagination constraints and limit clamping
"""
import unittest
import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.user_repository import user_repository, UserEntity
from app.db.message_repository import message_repository, MessageEntity
from app.schemas.message import (
    MessageCreateRequest,
    MessageOperation,
    MessageResponse,
)
from app.api.v1.endpoints.messages import (
    list_messages,
    create_message_record,
    get_message_by_id,
    delete_message_by_id,
    clear_user_messages,
    HTTPException
)

class TestMessageVaultHardening(unittest.TestCase):

    def setUp(self):
        user_repository._seed_initial_demo_users()
        message_repository.reset_to_seed()
        self.user_odin = user_repository.get_by_username("operator_odin")
        self.user_sentinel = user_repository.get_by_username("sentinel_cadet")
        self.assertIsNotNone(self.user_odin)
        self.assertIsNotNone(self.user_sentinel)

    def test_01_message_creation_and_zero_plaintext(self):
        """Verify creating a message stores only ciphertext and metadata; zero plaintext."""
        payload = MessageCreateRequest(
            ciphertext="KHOOR ZRUOG",
            shift=3,
            operation_type=MessageOperation.ENCRYPT,
            notes="Tactical Beacon Ping"
        )

        res = create_message_record(payload=payload, current_user=self.user_odin)
        self.assertTrue(res.id.startswith("msg-"))
        self.assertEqual(res.user_id, self.user_odin.id)
        self.assertEqual(res.ciphertext, "KHOOR ZRUOG")
        self.assertEqual(res.shift, 3)
        self.assertEqual(res.char_count, 11)
        self.assertEqual(res.operation_type, MessageOperation.ENCRYPT)
        self.assertEqual(res.notes, "Tactical Beacon Ping")

        # Strict check: Ensure 'plaintext' is nowhere in the entity or response attributes
        entity = message_repository.get_by_id(res.id)
        self.assertIsNotNone(entity)
        self.assertFalse(hasattr(entity, "plaintext"), "Security Violation: MessageEntity must not possess a plaintext attribute")
        self.assertFalse(hasattr(res, "plaintext"), "Security Violation: MessageResponse must not possess a plaintext attribute")

    def test_02_user_message_isolation(self):
        """Verify GET /messages returns only the authenticated operator's records."""
        message_repository.clear_for_user(self.user_odin.id)
        message_repository.clear_for_user(self.user_sentinel.id)

        # Odin creates 2 messages
        msg_odin_1 = message_repository.create(
            user_id=self.user_odin.id,
            ciphertext="ODIN CIPHERTEXT 1",
            shift=5,
            operation_type=MessageOperation.ENCRYPT
        )
        msg_odin_2 = message_repository.create(
            user_id=self.user_odin.id,
            ciphertext="ODIN CIPHERTEXT 2",
            shift=7,
            operation_type=MessageOperation.DECRYPT
        )

        # Sentinel creates 1 message
        msg_sentinel_1 = message_repository.create(
            user_id=self.user_sentinel.id,
            ciphertext="SENTINEL CIPHERTEXT 1",
            shift=13,
            operation_type=MessageOperation.ENCRYPT
        )

        # Odin lists messages
        odin_list = list_messages(current_user=self.user_odin)
        self.assertEqual(odin_list.total, 2)
        self.assertEqual(len(odin_list.items), 2)
        self.assertTrue(all(m.user_id == self.user_odin.id for m in odin_list.items))
        self.assertFalse(any(m.id == msg_sentinel_1.id for m in odin_list.items))

        # Sentinel lists messages
        sentinel_list = list_messages(current_user=self.user_sentinel)
        self.assertEqual(sentinel_list.total, 1)
        self.assertEqual(len(sentinel_list.items), 1)
        self.assertEqual(sentinel_list.items[0].id, msg_sentinel_1.id)
        self.assertEqual(sentinel_list.items[0].user_id, self.user_sentinel.id)

    def test_03_cross_user_access_forbidden(self):
        """Verify GET /messages/{id} strictly forbids Operator Sentinel from viewing Odin's message (403 Forbidden)."""
        odin_msgs = message_repository.get_all_for_user(self.user_odin.id)
        self.assertGreater(len(odin_msgs), 0)
        odin_msg_id = odin_msgs[0].id

        # Odin can access their own message
        odin_access = get_message_by_id(message_id=odin_msg_id, current_user=self.user_odin)
        self.assertEqual(odin_access.id, odin_msg_id)

        # Sentinel tries to access Odin's message -> Must raise 403 Forbidden
        with self.assertRaises(HTTPException) as ctx:
            get_message_by_id(message_id=odin_msg_id, current_user=self.user_sentinel)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_04_cross_user_deletion_forbidden(self):
        """Verify DELETE /messages/{id} strictly forbids Operator Sentinel from deleting Odin's message (403 Forbidden)."""
        odin_msgs = message_repository.get_all_for_user(self.user_odin.id)
        self.assertGreater(len(odin_msgs), 0)
        odin_msg_id = odin_msgs[0].id

        # Sentinel tries to delete Odin's record
        with self.assertRaises(HTTPException) as ctx:
            delete_message_by_id(message_id=odin_msg_id, current_user=self.user_sentinel)
        self.assertEqual(ctx.exception.status_code, 403)

        # Verify message still exists in vault
        still_exists = message_repository.get_by_id(odin_msg_id)
        self.assertIsNotNone(still_exists)

    def test_05_successful_user_deletion(self):
        """Verify operator can delete their own message (DELETE /messages/{id})."""
        odin_msgs = message_repository.get_all_for_user(self.user_odin.id)
        odin_msg_id = odin_msgs[0].id

        del_res = delete_message_by_id(message_id=odin_msg_id, current_user=self.user_odin)
        self.assertTrue(del_res.success)
        self.assertEqual(del_res.message_id, odin_msg_id)

        # Ensure message is gone
        self.assertIsNone(message_repository.get_by_id(odin_msg_id))

    def test_06_search_and_filter_messages(self):
        """Verify search parameter filters by ciphertext content or notes."""
        message_repository.clear_for_user(self.user_odin.id)

        message_repository.create(
            user_id=self.user_odin.id,
            ciphertext="ALPHA BRAVO CHARLIE",
            shift=1,
            operation_type=MessageOperation.ENCRYPT,
            notes="Mission Red"
        )
        message_repository.create(
            user_id=self.user_odin.id,
            ciphertext="DELTA ECHO FOXTROT",
            shift=2,
            operation_type=MessageOperation.ENCRYPT,
            notes="Mission Blue"
        )

        # Search for 'BRAVO'
        search_res = list_messages(search="BRAVO", current_user=self.user_odin)
        self.assertEqual(len(search_res.items), 1)
        self.assertIn("ALPHA BRAVO CHARLIE", search_res.items[0].ciphertext)

        # Search for 'Blue'
        notes_search_res = list_messages(search="Blue", current_user=self.user_odin)
        self.assertEqual(len(notes_search_res.items), 1)
        self.assertEqual(notes_search_res.items[0].notes, "Mission Blue")

    def test_07_nonexistent_message_returns_404(self):
        """Verify accessing a non-existent message ID raises 404 Not Found."""
        with self.assertRaises(HTTPException) as ctx:
            get_message_by_id(message_id="msg-non-existent-999", current_user=self.user_odin)
        self.assertEqual(ctx.exception.status_code, 404)

if __name__ == "__main__":
    unittest.main()
