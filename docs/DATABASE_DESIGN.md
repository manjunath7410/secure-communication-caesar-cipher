# Database & Storage Design Specification
# Secure Military Communication Platform

---

## 1. Overview & Storage Strategy

The **Secure Military Communication** platform employs a hybrid, multi-tier data storage strategy designed to balance high-speed client-side execution, offline resilience, and secure multi-user server synchronization.

```mermaid
erDiagram
    USERS ||--o{ MESSAGES : owns
    USERS ||--o{ RATE_LIMITS : tracks

    USERS {
        string id PK "Unique Operator Identifier"
        string email UK "Unique Email Address"
        string username UK "Unique Operator Handle"
        string full_name "Full Display Name"
        string password_hash "PBKDF2-SHA256 Hash"
        string salt "16-byte Hex Salt"
        string clearance_level "CONFIDENTIAL | SECRET | TOP_SECRET"
        string callsign "Tactical Callsign"
        boolean is_active "Account Status"
        boolean is_email_verified "Email Verification Flag"
        string verification_code "6-Digit Verification PIN"
        bigint verification_code_expires "Expiration Timestamp"
        string reset_token "Password Reset Token"
        bigint reset_token_expires "Reset Token Expiration"
        timestamp created_at "Creation Timestamp"
        timestamp last_login_at "Last Login Timestamp"
    }

    MESSAGES {
        string id PK "Unique Vault Message ID"
        string user_id FK "Owner User ID Reference"
        string operation_type "ENCRYPT | DECRYPT"
        text ciphertext "Encrypted Payload (Zero Plaintext)"
        integer shift "Shift Value (0 to 25)"
        integer char_count "Payload Character Count"
        timestamp timestamp "Record Timestamp"
        text notes "Optional Operator Notes"
    }

    RATE_LIMITS {
        string key PK "IP + Username Composite Key"
        integer failed_attempts "Consecutive Failed Logins"
        bigint locked_until "Lockout Expiration Timestamp"
        bigint last_attempt_at "Last Attempt Timestamp"
    }
```

---

## 2. Server-Side Relational Schema (PostgreSQL DDL)

For production deployment with PostgreSQL, the following DDL statements define the normalized database tables:

```sql
-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    clearance_level VARCHAR(32) DEFAULT 'SECRET' NOT NULL,
    callsign VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verification_code VARCHAR(32),
    verification_code_expires BIGINT,
    reset_token VARCHAR(64),
    reset_token_expires BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 2. Vault Messages Table (Zero Plaintext Invariant)
CREATE TABLE messages (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(16) DEFAULT 'ENCRYPT' NOT NULL,
    ciphertext TEXT NOT NULL,
    shift INTEGER NOT NULL CHECK (shift >= 0 AND shift <= 25),
    char_count INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes TEXT
);

CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
```

---

## 3. Node.js In-Memory Server Data Structures

The default Node.js full-stack server (`server.ts`) utilizes thread-safe in-memory maps for zero-dependency execution:

```typescript
// Map keyed by both lowercase email and lowercase username for O(1) lookup
const usersDb: Map<string, UserRecord> = new Map();

// Map keyed by unique message ID
const messagesDb: Map<string, VaultMessageRecord> = new Map();

// Rate limiting map keyed by `${clientIp}_${identifier}`
const rateLimitMap: Map<string, RateLimitBucket> = new Map();
```

---

## 4. Client-Side Local Storage Schema

The client application utilizes `localStorage` and `sessionStorage` for settings persistence, offline caching, and App Lock security.

| Storage Key | Storage Type | Structure / Type | Purpose |
| :--- | :--- | :--- | :--- |
| `caesar_cipher_auth_token_v1` | `localStorage` / `sessionStorage` | String (JWT Token) | Active session authorization token |
| `caesar_cipher_auth_user_v1` | `localStorage` / `sessionStorage` | JSON (`User` Object) | Cached profile metadata |
| `caesar_cipher_remember_device_v1` | `localStorage` | Boolean (`"true"` / `"false"`) | Session persistence preference |
| `secure_comm_app_lock_config_v1` | `localStorage` | JSON (`AppLockSettings`) | App Lock status, timeout, and privacy preferences |
| `caesar_cipher_vault_messages_v1` | `localStorage` | JSON (`VaultMessage[]`) | Offline message vault cache |
| `secure_comm_theme_preference` | `localStorage` | String (`"dark"`, `"light"`, `"system"`) | UI theme mode selection |

---

## 5. Security & Isolation Policies

1. **Zero-Plaintext Invariant:** The database schema explicitly omits any column or field for plaintext data. Plaintext exists strictly in volatile client memory during active encryption/decryption operations.
2. **User Data Isolation:** Every query against the `messages` table or map is strictly filtered by the authenticated `user_id` derived from the verified JWT token claims.
3. **Cascade Deletion:** In relational deployments, deleting a user account automatically purges all associated vault messages via `ON DELETE CASCADE`.
