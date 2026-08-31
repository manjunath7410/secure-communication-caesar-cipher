# REST API Specification & Endpoints
# Secure Military Communication Platform

---

## 1. Overview & Base URLs

The **Secure Military Communication** REST API provides endpoints for operator authentication, session clearance, account security, health monitoring, and encrypted message vault operations.

### Base URLs
- **Node.js Express Server (Default):** `http://localhost:3000/api/v1` (also aliased at `/api`)
- **Python FastAPI Server (Alternative):** `http://localhost:8000/api/v1`

### Authentication Scheme
All protected endpoints require an HTTP `Authorization` header containing an active HMAC-SHA256 JWT access token:
```http
Authorization: Bearer <access_token>
```

---

## 2. Standard Error & Response Formats

### Standard Success Response (JSON)
```json
{
  "status": "ok",
  "data": { ... }
}
```

### Standard Error Response (HTTP 4xx / 5xx)
```json
{
  "status_code": 401,
  "detail": "Your session has expired or is invalid. Please sign in again.",
  "field": "password"
}
```

---

## 3. Health & Telemetry Endpoints

### 3.1 System Health Check
`GET /api/v1/health`

Returns operational telemetry, server status, and active authentication providers.

#### Request
```http
GET /api/v1/health HTTP/1.1
Host: localhost:3000
```

#### Response (`200 OK`)
```json
{
  "status": "healthy",
  "service": "Secure Communication API",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": 1725091200000,
  "auth": {
    "active_users": 3,
    "google_oauth_configured": false,
    "passkeys_supported": true
  }
}
```

---

## 4. Authentication & Operator Identity Endpoints

### 4.1 Operator Registration
`POST /api/v1/auth/register`

Registers a new operator account with encrypted PBKDF2 password storage and returns an active JWT access token.

#### Request Body
```json
{
  "email": "operator.odin@tactical.mil",
  "username": "operator_odin",
  "fullName": "Operator Odin",
  "password": "TacticalPass123!",
  "callsign": "ODIN-1",
  "clearanceLevel": "TOP_SECRET"
}
```

#### Response (`201 Created`)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 7200,
  "user": {
    "id": "usr-1725091200000-a1b2c3d4",
    "email": "operator.odin@tactical.mil",
    "username": "operator_odin",
    "full_name": "Operator Odin",
    "callsign": "ODIN-1",
    "clearance_level": "TOP_SECRET",
    "is_active": true,
    "is_email_verified": false,
    "created_at": "2026-08-31T12:00:00.000Z",
    "last_login_at": "2026-08-31T12:00:00.000Z"
  },
  "requires_verification": true
}
```

---

### 4.2 Operator Login
`POST /api/v1/auth/login`

Authenticates an operator using email/username and password. Protected by a rate-limiting guard (5 failed attempts trigger a 60-second cooldown).

#### Request Body
```json
{
  "email": "operator.odin@tactical.mil",
  "password": "TacticalPass123!"
}
```

#### Response (`200 OK`)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 7200,
  "user": {
    "id": "usr-odin-001",
    "email": "operator.odin@tactical.mil",
    "username": "operator_odin",
    "full_name": "Operator Odin",
    "callsign": "ODIN-1",
    "clearance_level": "TOP_SECRET",
    "is_active": true,
    "is_email_verified": true,
    "created_at": "2026-08-28T12:00:00.000Z",
    "last_login_at": "2026-08-31T12:05:00.000Z"
  }
}
```

#### Error Response (`429 Too Many Requests`)
```json
{
  "status_code": 429,
  "detail": "Too many attempts. Please wait 45 seconds before trying again."
}
```

---

### 4.3 Get Current Profile
`GET /api/v1/auth/me`

Retrieves the authenticated operator's profile data.

#### Request Headers
```http
Authorization: Bearer <access_token>
```

#### Response (`200 OK`)
```json
{
  "id": "usr-odin-001",
  "email": "operator.odin@tactical.mil",
  "username": "operator_odin",
  "full_name": "Operator Odin",
  "callsign": "ODIN-1",
  "clearance_level": "TOP_SECRET",
  "is_active": true,
  "is_email_verified": true,
  "created_at": "2026-08-28T12:00:00.000Z",
  "last_login_at": "2026-08-31T12:05:00.000Z"
}
```

---

### 4.4 Password Reset Request
`POST /api/v1/auth/forgot-password`

Initiates the password reset workflow. Always returns a generic success message to prevent user enumeration.

#### Request Body
```json
{
  "email": "operator.odin@tactical.mil"
}
```

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "message": "If an account exists for this email, you'll receive reset instructions."
}
```

---

### 4.5 Reset Password
`POST /api/v1/auth/reset-password`

Updates the operator's password using a valid reset token.

#### Request Body
```json
{
  "token": "a1b2c3d4e5f6...",
  "new_password": "NewTacticalPass2026!"
}
```

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "message": "Your password has been successfully updated. You can now sign in."
}
```

---

### 4.6 Google OAuth Sign-In
`POST /api/v1/auth/google`

Authenticates an operator using a Google ID token verified via Google's `tokeninfo` API.

#### Request Body
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIs..."
}
```

#### Response (`200 OK`)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 7200,
  "user": { ... }
}
```

---

## 5. Encrypted Message Vault Endpoints

### 5.1 List Vault Messages
`GET /api/v1/messages`

Retrieves all encrypted messages belonging strictly to the currently authenticated operator.

#### Request Headers
```http
Authorization: Bearer <access_token>
```

#### Response (`200 OK`)
```json
[
  {
    "id": "msg-vault-001",
    "userId": "usr-odin-001",
    "operationType": "ENCRYPT",
    "ciphertext": "VRXDGURQ GHOWD: SURFHHG WR JULG 48.85Q, 2.29H DW 0600C.",
    "shift": 3,
    "charCount": 55,
    "timestamp": "2026-08-31T09:00:00.000Z",
    "notes": "Tactical Recon Dispatch (k=3)"
  }
]
```

---

### 5.2 Save Ciphertext to Vault
`POST /api/v1/messages`

Persists an encrypted message record to the operator's personal vault. **Plaintext is never accepted or stored.**

#### Request Body
```json
{
  "ciphertext": "DWWDFN DW GDZQ. VHFWRU 7 FRQILUPHG.",
  "shift": 3,
  "operation_type": "ENCRYPT",
  "notes": "Inbound Sector Confirmation"
}
```

#### Response (`201 Created`)
```json
{
  "id": "msg-vault-1725091200000-xyz",
  "userId": "usr-odin-001",
  "operationType": "ENCRYPT",
  "ciphertext": "DWWDFN DW GDZQ. VHFWRU 7 FRQILUPHG.",
  "shift": 3,
  "charCount": 35,
  "timestamp": "2026-08-31T12:15:00.000Z",
  "notes": "Inbound Sector Confirmation"
}
```

---

### 5.3 Delete Single Message
`DELETE /api/v1/messages/{id}`

Deletes a message by ID. Enforces strict authorization; operators cannot delete records belonging to other users.

#### Response (`204 No Content`)
```http
HTTP/1.1 204 No Content
```

#### Error Response (`403 Forbidden`)
```json
{
  "status_code": 403,
  "detail": "You do not have clearance to delete another operator's record."
}
```
