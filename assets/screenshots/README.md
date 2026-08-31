# Project Screenshots & Visual Artifacts

This directory contains visual captures and UI workflow diagrams for the **Secure Military Communication Using Caesar Cipher** application.

---

## Screenshot Inventory & Workflow Guide

| File Name | Screen Description | Key Features Visible |
| :--- | :--- | :--- |
| `01_dashboard_dark.png` | **Tactical Operations Dashboard** | Encryption counter telemetry, quick actions, shift selector, security posture indicator |
| `02_encrypt_studio.png` | **Encryption Studio** | Plaintext editor, rotary shift dial ($k=3$), live ciphertext preview, casing controls |
| `03_decrypt_studio.png` | **Decryption Studio** | Ciphertext input, reverse shift calculation, recovered message output, ROT13 quick preset |
| `04_brute_force_solver.png` | **Brute-Force Cryptanalysis** | 25-permutation candidate matrix, frequency matching scores, highlighted candidate recovery |
| `05_message_vault.png` | **Encrypted History Vault** | User-isolated encrypted dispatches, search query filtering, shift tags, deletion modal |
| `06_app_lock_pin.png` | **App Lock Screen** | 6-digit numeric keypad, biometric prompt button, lockout cooldown timer |
| `07_security_settings.png` | **Security & App Lock Settings** | PIN configuration, auto-lock timeout selector, screen privacy toggle, clipboard auto-clear |
| `08_account_clearance.png` | **Operator Profile** | Callsign badge, clearance level (`SECRET`), session expiration timer, security health status |
| `09_learn_academy.png` | **Cryptography Academy** | Historical context (Julius Caesar), mathematical formulations, frequency analysis tutorial |
| `10_android_native.png` | **Android Mobile View** | Capacitor native status bar, mobile navigation drawer, haptic feedback integration |

---

## Capturing New Screenshots

To capture standardized screenshots for academic reports or repository presentation:

1. Launch the application in production or development mode:
   ```bash
   npm run dev
   ```
2. Set browser viewport to **1920x1080** for desktop views or **390x844** (iPhone 14/15 or Pixel 7) for mobile captures.
3. Toggle the desired theme (Dark or Light mode) from the top header navigation.
4. Save images in PNG format with compression into this directory (`/assets/screenshots/`).
