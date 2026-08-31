# Comprehensive Feature Inventory & Specifications
# Secure Military Communication Platform

---

## 1. Caesar Cipher & Cryptography Engine

### 1.1 Core Mathematical Engine
- **Classical Caesar Transformation:** Pure client-side implementation of the monoalphabetic substitution cipher:
  $$E_k(p) = (p + k) \pmod{26}, \quad D_k(c) = (c - k) \pmod{26}$$
- **Arbitrary Key Normalization:** Accepts any integer shift value (including negative numbers and integers $> 25$) and automatically normalizes it to the valid range $[0, 25]$ using modular arithmetic:
  $$\text{normalizedShift} = ((\text{shift} \bmod 26) + 26) \bmod 26$$
- **Dual Alphabet Casing Preservation:** Preserves original upper and lower letter casing while shifting within their respective ASCII character boundaries:
  - Uppercase: ASCII `65` (`A`) to `90` (`Z`)
  - Lowercase: ASCII `97` (`a`) to `122` (`z`)
- **Symbol & Formatting Invariance:** Numbers (`0-9`), punctuation (`.,!?-`), spaces, tabs, and multi-line breaks (`\n`, `\r\n`) are preserved in their exact character positions.
- **ROT13 Symmetric Mode:** Dedicated one-click preset for ROT13 ($k=13$), an involution transformation where $E_{13}(x) \equiv D_{13}(x)$.
- **Live Interactive Previews:** Real-time ciphertext generation as the operator types, updated synchronously without network round-trips.
- **Interactive Shift Controls:**
  - Visual 360-degree Rotary Dial widget with tactile feedback.
  - Linear Stepper and Range Slider controls.
  - Quick-preset chips for $k=3$ (Classical Caesar) and $k=13$ (ROT13).

---

## 2. Automated Brute-Force Cryptanalysis

### 2.1 Cryptanalysis Features
- **25-Shift Permutation Matrix:** Computes and displays all 25 non-trivial shift permutations ($k=1$ to $k=25$) alongside the identity shift ($k=0$) in a unified analytical table.
- **English Letter Frequency Analysis:** Calculates the statistical correlation score between the candidate plaintext's letter distribution and the standard 26-letter English frequency vector ($E \approx 12.7\%, T \approx 9.1\%, A \approx 8.2\%$).
- **Dictionary Word Tokenizer:** Tokenizes candidate strings and matches words against a dictionary of common military and conversational English vocabulary.
- **Confidence Scoring & Candidate Ranking:** Automatically highlights the candidate with the highest combined statistical score as the primary recovered plaintext.
- **Keyspace Entropy Metrics:** Displays the theoretical information entropy of the cipher ($\approx 4.70$ bits) to educate users on keyspace exhaustion vulnerabilities.
- **Export & Action Tools:**
  - One-click copy for any candidate plaintext.
  - Direct "Send to Decryption Studio" button to inspect individual candidates.

---

## 3. Operator Authentication & Clearance Subsystem

### 3.1 Account & Identity Management
- **Stateless JWT Tokens:** Issues HMAC-SHA256 access tokens containing `sub` (User ID), `email`, `username`, and `clearance` claims with a 2-hour Time-To-Live (TTL).
- **Cryptographic Password Hashing:** Uses PBKDF2 with SHA-256, 100,000 iterations, and a cryptographically random 16-byte salt generated per user.
- **Role-Based Clearance Levels:** Supports three distinct security tiers:
  - `CONFIDENTIAL`: Base level access to encryption/decryption utilities.
  - `SECRET`: Standard tactical operational clearance with vault history access.
  - `TOP_SECRET`: Full administrative clearance with advanced cryptanalysis access.
- **Brute-Force Login Protection:** Tracks consecutive failed authentication attempts per IP/username and enforces a temporary lockout after 5 failed attempts.
- **Google OAuth 2.0 Integration:** Supports Google Sign-In with server-side `tokeninfo` verification.
- **WebAuthn / Passkeys Support:** Provides challenge endpoints for FIDO2/WebAuthn platform authenticators.
- **Password Reset & Verification:** Implements tokenized email verification and password reset workflows with account-enumeration protection.

---

## 4. Client-Side App Lock & Local Defense

### 4.1 Local Shielding Features
- **6-Digit Numeric PIN Lock:** Protects local application state with a dedicated PIN screen featuring an on-screen tactical keypad.
- **Web Crypto PBKDF2 Derivation:** Derives PIN verification digests entirely client-side using `window.crypto.subtle` (PBKDF2-SHA256, 100,000 rounds, 16-byte random salt).
- **Constant-Time Hash Comparison:** Verifies PIN entries using constant-time byte comparisons to eliminate side-channel timing leaks.
- **Progressive Failed-Attempt Penalties:**
  - 3 failed attempts $\rightarrow$ 10-second lockout countdown
  - 5 failed attempts $\rightarrow$ 30-second lockout countdown
  - 8 failed attempts $\rightarrow$ 60-second lockout countdown
- **Hardware Biometric Unlock:** Integrates with native Android `BiometricPrompt` and browser WebAuthn for fingerprint and face unlock.
- **Configurable Inactivity Auto-Lock:** Automatically locks the screen after a user-selected period of inactivity (`immediately`, `1 minute`, `5 minutes`, `15 minutes`, `never`).
- **App Minimize & Tab Switch Detection:** Immediately triggers the lock screen when the user minimizes the app, switches tabs, or locks the device.
- **Screen Privacy (`FLAG_SECURE`):** Prevents OS-level screenshots and conceals app content in the Android recent apps task switcher.
- **Auto-Clearing Clipboard:** Automatically wipes copied ciphertexts from the system clipboard after 30 seconds.

---

## 5. Encrypted Message Vault & History

### 5.1 Vault Management Features
- **Strict User Isolation:** Operators can only access, search, and delete messages belonging to their authenticated user account.
- **Zero-Plaintext Storage Policy:** Plaintext is never stored in the database or transmitted over the network; only `ciphertext`, `shift`, `charCount`, and `notes` are persisted.
- **Search & Filter Capabilities:**
  - Full-text search across ciphertext, notes, and shift values (`k=3`, `shift 3`).
  - Operation type filtering (`ALL`, `ENCRYPT`, `DECRYPT`).
  - Multi-criteria sorting (`Newest First`, `Oldest First`, `Shift Ascending`, `Shift Descending`, `Length Descending`, `Length Ascending`).
- **Single & Batch Deletion:** Operators can delete individual message records or purge their entire personal vault.
- **Offline Resiliency & Cache Synchronization:** Seamlessly falls back to local storage when the backend server is unreachable and synchronizes upon reconnection.

---

## 6. Tactical User Interface & Theming

### 6.1 UI & Design System
- **Tactical Military Aesthetic:** Clean, high-contrast visual design utilizing Plus Jakarta Sans for UI elements and JetBrains Mono for cryptographic payloads.
- **Triple Theme Mode:** Supports `Dark`, `Light`, and `System Preference` themes with zero-latency switching.
- **FOUC Prevention:** Inline theme initialization script in `index.html` prevents Flash of Unstyled Content upon page load.
- **Responsive Layout:**
  - Desktop: Persistent collapsible tactical sidebar navigation.
  - Mobile: Bottom navigation bar and slide-out tactical drawer.
- **Toast Notification System:** Non-blocking status notifications for copy events, encryption success, network state changes, and error alerts.
- **Operations Dashboard:** Live telemetry cards displaying encryption counters, active shift status, and system security posture.

---

## 7. Mobile & Android Native Capabilities

### 7.1 Capacitor 8 Bridge Features
- **Native Android APK Packaging:** Configured with `minSdkVersion: 24` (Android 7.0+) and `targetSdkVersion: 36` (Android 14+).
- **Hardware Back Button Navigation:** Intercepts hardware back button presses to navigate backward through the app's internal view history.
- **Native Clipboard Integration:** Direct access to `@capacitor/clipboard` with automatic sanitization timers.
- **Status Bar & Splash Screen:** Dynamic status bar theming matching the active dark/light mode and smooth splash screen transitions.
