# Deployment & Production Operations Guide
## Secure Military Communication Platform (Caesar Cipher Academic Research Console)

This guide provides instructions for deploying and configuring the frontend and backend services for production environments.

> **Academic & Cryptographic Notice**  
> Caesar cipher is an ancient substitution cipher ($k \in [0, 25]$, keyspace $= 26 \approx 4.70\text{ bits of entropy}$). This platform is designed for academic, historical, and educational demonstration of classical cryptanalysis, brute-force vulnerabilities, and defensive software architecture. It must not be used for securing sensitive production or defense secrets.

---

## 1. GitHub Setup

### Repository Preparation
1. **Initialize Git Repository**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete military caesar cipher platform with phase 1-13 hardening"
   ```

2. **Branch Protection & CI/CD**:
   - Create and push to `main` branch.
   - Configure branch protection rules on `main` requiring pull requests and successful status checks.
   - Configure a GitHub Actions workflow (`.github/workflows/ci.yml`) to automatically execute both test suites:
     - Frontend TypeScript: `npm run lint && npm test && npm run build`
     - Backend Python: `python3 -m unittest discover -s backend/tests -p "test_*.py"`

3. **Repository Secrets & Variables**:
   In GitHub Settings $\rightarrow$ Secrets and Variables $\rightarrow$ Actions, define:
   - `JWT_SECRET_KEY`: High-entropy 256-bit random hex/base64 string (generate with `openssl rand -hex 32`).
   - `DATABASE_URL`: Production PostgreSQL connection string (`postgresql://user:password@host:5432/dbname`).
   - `VITE_API_BASE_URL`: Public-facing backend gateway URL (e.g. `https://api.yourdomain.com/api/v1`).

---

## 2. Frontend Deployment

The frontend is built with **React 19, TypeScript, and Vite** as a Progressive Web Application (PWA) with full offline airgap capabilities.

### Build Process
```bash
# 1. Install dependencies
npm ci

# 2. Type-check codebase
npm run lint

# 3. Compile production bundle into /dist
npm run build
```

### Static Hosting Providers
- **Vercel / Cloudflare Pages / AWS S3 + CloudFront / Netlify**:
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
  - **Single Page Application (SPA) Routing**: Configure redirect rule `/* -> /index.html` (Status 200).
- **Environment Variables**:
  Set `VITE_API_BASE_URL` to point to your live backend (e.g., `https://api.yourdomain.mil/api/v1`).

### PWA & Service Worker Header Requirements
For progressive web app installation and service worker lifecycle:
- Ensure HTTPS is enforced.
- Serve `sw.js` with `Cache-Control: no-cache, no-store, must-revalidate`.
- Serve `manifest.json` with `Content-Type: application/manifest+json`.

---

## 3. Backend Deployment

The backend is built with **FastAPI / Python 3.10+** utilizing Uvicorn and Gunicorn for multi-worker production concurrency.

### Gunicorn + Uvicorn Production Launch
```bash
# Inside the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run with Gunicorn (4 worker processes, bound to port 8000)
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile - \
  --timeout 60
```

### Docker Containerization
`backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production

RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

---

## 4. PostgreSQL Configuration

The backend contains a database repository abstraction ready to connect to PostgreSQL.

### Database Setup & Roles
1. **Create Database and Dedicated Operator User**:
   ```sql
   CREATE DATABASE military_crypto_db;
   CREATE USER crypto_operator WITH ENCRYPTED PASSWORD '<STRONG_SECURE_PASSWORD>';
   GRANT ALL PRIVILEGES ON DATABASE military_crypto_db TO crypto_operator;
   ```

2. **Schema & Indexes**:
   ```sql
   -- Users Table
   CREATE TABLE IF NOT EXISTS users (
       id VARCHAR(64) PRIMARY KEY,
       username VARCHAR(64) UNIQUE NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       hashed_password VARCHAR(255) NOT NULL,
       callsign VARCHAR(64) NOT NULL,
       clearance_level VARCHAR(32) NOT NULL DEFAULT 'UNCLASSIFIED',
       is_active BOOLEAN NOT NULL DEFAULT TRUE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
       last_login TIMESTAMP WITH TIME ZONE
   );

   -- Messages Vault (Zero Plaintext Invariant: ONLY Ciphertext & Shift Stored)
   CREATE TABLE IF NOT EXISTS messages (
       id VARCHAR(64) PRIMARY KEY,
       user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       ciphertext TEXT NOT NULL,
       shift_used INTEGER NOT NULL,
       operation_type VARCHAR(32) NOT NULL,
       mission_notes VARCHAR(500),
       classification VARCHAR(32) NOT NULL DEFAULT 'CONFIDENTIAL',
       character_count INTEGER NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_messages_user_id ON messages(user_id);
   CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
   ```

3. **Connection Pooling**:
   Configure `DB_POOL_SIZE=10`, `DB_MAX_OVERFLOW=20`, and `DB_POOL_TIMEOUT=30` in environment settings to match PostgreSQL connection limits.

---

## 5. Environment Variables Specification

Ensure all variables are declared before launching the application:

| Variable | Target | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Backend | `production` | Enables production security warnings and strict checks. |
| `JWT_SECRET_KEY` | Backend | `64_char_hex_random_key` | Critical 256-bit secret used to sign HS256 JWT tokens. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | `120` | Session lifetime for JWT clearance tokens. |
| `DATABASE_URL` | Backend | `postgresql://user:pass@host:5432/db` | Connection URI for persistent message vault storage. |
| `CORS_ORIGINS` | Backend | `https://console.yourdomain.mil` | Comma-separated list of allowed frontend domains. |
| `CORS_ALLOW_CREDENTIALS` | Backend | `true` | Permits Authorization headers in cross-origin requests. |
| `LOG_LEVEL` | Backend | `INFO` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `VITE_API_BASE_URL` | Frontend | `https://api.yourdomain.mil/api/v1` | Base URL for frontend REST API calls. |
| `VITE_ENABLE_DIAGNOSTICS` | Frontend | `true` | Toggles display of system telemetry and health status. |

---

## 6. CORS Configuration & Security Headers

### Allowed Origins Enforcement
In `backend/app/core/config.py`, specify the exact domains of your frontend client:
```env
CORS_ORIGINS="https://console.military-crypto.mil,https://app.military-crypto.mil"
```

### Security Headers Injected by Backend Middleware
Every HTTP response automatically attaches the following defense-in-depth headers:
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `X-Frame-Options: SAMEORIGIN` (mitigates clickjacking)
- `X-XSS-Protection: 1; mode=block` (legacy browser XSS filter)
- `Referrer-Policy: strict-origin-when-cross-origin` (prevents token leakage in referrers)
- `Cache-Control: no-store, no-cache, must-revalidate` (for authenticated and API routes)
- `X-Request-ID` and `X-Response-Time` (for distributed tracing and telemetry)

---

## 7. Production Testing & Verification

Before opening the platform to end users, execute the full verification checklist:

### A. Run Automated Test Suites
```bash
# 1. Run all 313 Frontend & Integration Tests
npm test

# 2. Run all 22 Backend Security & Auth Tests
python3 backend/tests/run_all_backend_tests.py
```

### B. Verify Health Endpoints
1. **Lightweight Orchestrator Probe**:
   ```bash
   curl -i https://api.yourdomain.mil/health
   # Expected: HTTP 200 OK -> {"status":"healthy","service":"...","version":"...","timestamp":...}
   ```

2. **Comprehensive Subsystem Diagnostics**:
   ```bash
   curl -i https://api.yourdomain.mil/api/v1/health
   # Expected: HTTP 200 OK -> {"status":"operational","database":{"status":"connected"},...}
   ```

### C. Verify Zero-Plaintext Storage Invariant
1. Inspect the PostgreSQL database after saving an encrypted message:
   ```sql
   SELECT id, user_id, ciphertext, shift_used, mission_notes FROM messages;
   ```
2. Confirm that **no plaintext transmission or unencrypted message content** exists in database columns or server logs.
