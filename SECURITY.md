# Security Policy

## ⚠️ Academic Cryptography Notice & Scope

**Project Name:** Secure Military Communication Using Caesar Cipher  
**Scope:** Educational Cryptography & Defensive Software Architecture Demonstration

### Critical Cryptographic Limitation
This project demonstrates the mechanics of classical monoalphabetic substitution (Caesar Cipher and ROT13) and modern defense-in-depth application architecture.

> **CRITICAL DISCLAIMER:**  
> The **Caesar Cipher** has an effective keyspace of only 25 non-trivial shifts ($k \in [1, 25]$), providing approximately $\log_2(26) \approx 4.70$ bits of entropy. It is vulnerable to instantaneous brute-force exhaustion and single-letter frequency analysis. **It provides zero confidentiality against modern adversaries and must NOT be used for real-world military, governmental, medical, financial, or personal communications.**

---

## 1. Supported Versions

| Version | Supported | Maintenance Status |
| :--- | :--- | :--- |
| `1.0.x` | ✅ Yes | Active Academic Release |
| `< 1.0.0` | ❌ No | Deprecated Prototypes |

---

## 2. Implemented Application Security Controls

While the Caesar Cipher algorithm itself is intentionally simple for educational exploration, the surrounding **software architecture** enforces industry-standard application security controls:

1. **Authentication & Authorization**:
   - HMAC-SHA256 JWT clearance tokens with 2-hour session expirations.
   - Server-side PBKDF2 password hashing (100,000 iterations + 16-byte random salt).
   - Role-based clearance levels (`CONFIDENTIAL`, `SECRET`, `TOP_SECRET`).
   - Rate limiting and temporary lockout after 5 consecutive failed login attempts.

2. **App Lock & Local Defense**:
   - 6-digit numeric PIN protection using client-side Web Crypto PBKDF2-SHA256 derivation.
   - Constant-time hash comparison to mitigate side-channel timing attacks.
   - Hardware biometric unlock (Android `BiometricPrompt` & WebAuthn).
   - Inactivity auto-lock and background minimize detection.
   - Screenshot prevention via Android `FLAG_SECURE`.
   - Auto-clearing clipboard timers.

3. **Zero-Plaintext Server Policy**:
   - Plaintext messages are strictly transformed client-side in browser memory.
   - Only `ciphertext`, `shift`, and operational metadata are transmitted or stored in the vault.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability within the **application wrapper, authentication subsystem, App Lock, or API implementation** (distinct from the inherent mathematical weaknesses of the Caesar Cipher):

1. **Do NOT open a public GitHub issue.**
2. Prepare a detailed vulnerability advisory including:
   - Component affected (e.g., Auth API, JWT validator, App Lock service)
   - Step-by-step reproduction instructions or Proof of Concept (PoC)
   - Impact assessment
3. Submit the advisory via GitHub Security Advisories or contact the academic project maintainer privately.
4. The maintainers will acknowledge receipt within 48 hours and provide a remediation timeline.
