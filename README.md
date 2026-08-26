# Secure Military Communication Using Caesar Cipher
> **Academic Cryptography Demonstration Platform**

---

## ⚠️ Academic & Cryptographic Notice

**Caesar Cipher is a classical monoalphabetic substitution cipher and is NOT secure for modern military, government, or production communication.**

With an effective keyspace of only 25 non-trivial shifts ($k \in [1, 25]$), any ciphertext produced by a Caesar cipher can be broken almost instantaneously via:
- **Exhaustive Brute-Force Key Search** (trying all 26 permutations)
- **Letter Frequency Analysis** (comparing single-letter distributions against standard English letter frequencies)

This application is strictly an **educational cryptography research and demonstration tool** designed to teach the fundamentals of substitution ciphers, cryptanalysis, and zero-leakage client-side architecture.

---

## 🏛️ Project Architecture

```
├── /src                              # React 19 Frontend Application
│   ├── /components                   # Modular UI Components
│   │   ├── /common                   # Reusable UI controls (Badge, Button, Card, StatusIndicator)
│   │   └── /layout                   # Application scaffolding (Header, Footer, Sidebar)
│   ├── /pages                        # Views & Diagnostic pages (HealthStatusPage)
│   ├── /services                     # API Client & Health diagnostics abstraction
│   ├── /hooks                        # Custom React hooks (useHealthCheck)
│   ├── /utils                        # Formatting, Zero-leakage Logger, Constants
│   ├── /types                        # TypeScript interfaces & data contracts
│   ├── /core                         # Cryptography logic (Caesar math engine)
│   └── /tests                        # Automated test suites
├── /backend                          # FastAPI Backend Architecture
│   ├── /app
│   │   ├── /api/v1                   # REST Endpoints & routers
│   │   ├── /core                     # Configuration & settings
│   │   ├── /models                   # Database models (Phase 11)
│   │   ├── /schemas                  # Pydantic schemas
│   │   └── /services                 # Business logic services
│   └── requirements.txt              # Backend dependencies
├── .env.example                      # Environment variables documentation
├── package.json                      # Frontend scripts & dependencies
└── tsconfig.json                     # TypeScript strict configuration
```

---

## 🚀 Getting Started

### 1. Frontend Development

```bash
# Install dependencies
npm install

# Start Vite development server (port 3000)
npm run dev

# Run TypeScript compilation & linting
npm run lint

# Build production bundle
npm run build
```

### 2. Backend Development (FastAPI)

```bash
# Setup Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python requirements
pip install -r backend/requirements.txt

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

---

## 📋 20-Phase Roadmap Summary

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 0** | Requirements & Architecture Specification | ✅ Completed |
| **Phase 1** | Project Foundation & Diagnostics Dashboard | ✅ Completed (Current) |
| **Phase 2** | Caesar Cipher Engine & Frequency Analysis | ⏳ Upcoming |
| **Phase 3** | Tactical Web UI Scaffolding | ⏳ Upcoming |
| **Phase 4** | Encrypt/Decrypt Workflow & Shift Dials | ⏳ Upcoming |
| **Phase 5** | Security Operations Dashboard | ⏳ Upcoming |
| **Phase 6** | JWT Authentication & Clearance Levels | ⏳ Upcoming |
| **Phase 7** | Encrypted Message Vault & History | ⏳ Upcoming |
| **Phase 8** | Brute-Force Cryptanalysis Demonstration | ⏳ Upcoming |
| **Phase 9** | PWA & Offline Support | ⏳ Upcoming |
| **Phase 10** | Backend REST API Endpoints | ⏳ Upcoming |
| **Phase 11** | PostgreSQL Database & Migrations | ⏳ Upcoming |
| **Phase 12** | Frontend-Backend Synchronization | ⏳ Upcoming |
| **Phase 13** | Security Hardening & Input Whitelisting | ⏳ Upcoming |
| **Phase 14** | Automated Test Suites | ⏳ Upcoming |
| **Phase 15** | Production Web Deployment | ⏳ Upcoming |
| **Phase 16** | Capacitor Android Shell Conversion | ⏳ Upcoming |
| **Phase 17** | Android Testing & Mobile Ergonomics | ⏳ Upcoming |
| **Phase 18** | Android Package Release | ⏳ Upcoming |
| **Phase 19** | Academic Dissertation & Presentation Deck | ⏳ Upcoming |

---

## 🔒 Security Principles
- **Zero-Leakage Policy**: All plaintext encryption and decryption operations execute strictly client-side. No plaintext is sent to external AI pipelines or unauthenticated loggers.
- **Strict Decoupling**: Business logic and mathematical cipher routines are separated from presentation components.
