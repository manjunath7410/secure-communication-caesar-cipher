# Changelog

All notable changes to the **Secure Military Communication Using Caesar Cipher** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-31

### Added
- **Caesar Cipher Core Engine**: Pure client-side implementation of classical monoalphabetic substitution ($E_k(x) = (x + k) \bmod 26$, $D_k(x) = (x - k) \bmod 26$) with full letter-casing preservation, symbol handling, and ROT13 symmetric preset.
- **Automated Brute-Force Cryptanalysis Solver**: 25-permutation key search with English letter frequency correlation scoring and dictionary word token heuristics.
- **Authentication Subsystem**:
  - Stateless HMAC-SHA256 JWT access tokens with 2-hour TTL.
  - PBKDF2-SHA256 password hashing (100,000 rounds, 16-byte random salt).
  - Role-based clearance levels (`CONFIDENTIAL`, `SECRET`, `TOP_SECRET`).
  - Google OAuth 2.0 gateway endpoint via Google tokeninfo validation.
  - WebAuthn/Passkey registration and authentication challenge generation.
  - Email verification workflow and tokenized password reset endpoints.
- **Local App Lock & Biometrics**:
  - 6-digit PIN lock powered by Web Crypto PBKDF2-SHA256 with constant-time verification.
  - Rate limiting & lockout countdown on repeated failed PIN entries.
  - Hardware biometric unlock using Android `BiometricPrompt` and browser WebAuthn.
  - Inactivity auto-lock timers (`immediately`, `1min`, `5min`, `15min`, `never`).
  - Background minimize detection via Capacitor `App` plugin and `visibilitychange`.
  - Android `FLAG_SECURE` screen privacy protection against screenshots and app switcher previews.
  - Auto-clearing clipboard utility to prevent clipboard data retention.
- **Encrypted Message Vault & History**:
  - User-isolated transmission history with search, multi-criteria sorting, and deletion.
  - Zero-Plaintext storage guarantee (only `ciphertext`, `shift`, and notes are stored).
  - Dual-layer storage: backend REST API synchronization with offline local fallback.
- **Tactical User Interface**:
  - Light, Dark, and System theme switching with FOUC-prevention inline script.
  - Interactive rotary shift dials, slider controls, and live character frequency visualizers.
  - High-contrast monospace typography paired with Plus Jakarta Sans and JetBrains Mono.
  - Fully responsive desktop sidebar and mobile navigation drawer.
- **Mobile & Android Runtime**:
  - Capacitor 8 native bridge configuration with Android SDK 36 support.
  - Native clipboard, status bar, keyboard, splash screen, and app lifecycle integration.
- **PWA & Offline Capability**:
  - Web App Manifest (`manifest.json`) and service worker (`sw.js`) with cache bypass for sensitive authentication routes.
- **Automated Test Suites**:
  - Comprehensive TypeScript test runner covering Foundation, Cipher Math, UI Workflow, Dashboard, Auth, History, Brute-Force, PWA, and Integration suites.

---

## [Unreleased]

### Planned Features
- **Modern Cryptography Integration**: Educational AES-GCM (256-bit) and ChaCha20-Poly1305 side-by-side comparative mode.
- **Asymmetric Key Exchange**: Diffie-Hellman / ECDH key agreement simulation for distributing Caesar shift keys.
- **Steganography Module**: LSB (Least Significant Bit) image encoding for embedding ciphertext into digital media.
- **Hardware-Backed Key Vault**: Android Keystore / iOS Keychain integration for hardware-bound PIN verification.
