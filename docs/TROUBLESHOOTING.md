# Troubleshooting & Common Issues Guide
# Secure Military Communication Platform

---

## 1. Local Development & Build Issues

### 1.1 Port 3000 Already in Use
- **Symptom:** `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000`
- **Cause:** Another node process or server instance is currently occupying port 3000.
- **Solution:**
  - On Linux/macOS:
    ```bash
    lsof -i :3000
    kill -9 <PID>
    ```
  - On Windows:
    ```powershell
    netstat -ano | findstr :3000
    taskkill /PID <PID> /F
    ```

### 1.2 TypeScript Compilation Errors (`npm run lint`)
- **Symptom:** `error TS...: Cannot find module or type declarations`
- **Solution:** Ensure all dependencies are properly installed:
  ```bash
  npm install
  npm run lint
  ```

---

## 2. Authentication & API Issues

### 2.1 "We couldn't connect to the server" (HTTP Status 0 / Network Error)
- **Symptom:** Login, registration, or history operations fail with status 0.
- **Cause:** The Node.js Express server (`server.ts`) or FastAPI server is not actively running.
- **Solution:**
  - Launch the server before executing API actions:
    ```bash
    npm run dev
    ```
  - Note: The core Caesar cipher, brute force analysis, and offline message vault functions operate 100% in-memory even when disconnected from the backend.

### 2.2 Account Lockout ("Too many attempts" - HTTP 429)
- **Symptom:** Login returns HTTP 429 with a countdown message.
- **Cause:** 5 consecutive failed login attempts triggered the rate-limiting guard.
- **Solution:** Wait 60 seconds for the lockout bucket to expire, or restart the server process to clear in-memory rate limit maps.

---

## 3. App Lock & Local Security Issues

### 3.1 Forgot App Lock PIN
- **Symptom:** The operator is locked out by the 6-digit App Lock screen and cannot remember the PIN.
- **Solution:**
  - Open Browser Developer Tools (`F12` $\rightarrow$ Application / Storage $\rightarrow$ Local Storage).
  - Clear the key: `secure_comm_app_lock_config_v1`.
  - Refresh the page (`Ctrl + R` / `Cmd + R`) to reset the App Lock state to unconfigured.

### 3.2 Biometric Prompt Not Appearing on Desktop
- **Symptom:** Clicking the Biometric button displays "Biometrics unavailable".
- **Cause:** The desktop browser does not have a configured WebAuthn platform authenticator (e.g., Windows Hello, Touch ID).
- **Solution:** Use the 6-digit numeric PIN on desktop, or test biometrics on an Android device running the Capacitor APK.

---

## 4. Capacitor Android & Native Build Issues

### 4.1 `cap sync` Fails with Gradle Error
- **Symptom:** Android build fails with `Execution failed for task ':app:processDebugResources'`.
- **Solution:**
  1. Verify Android SDK 34/36 and Build-Tools are installed in Android Studio.
  2. Clean and re-sync:
     ```bash
     npm run build
     npx cap sync android
     cd android && ./gradlew clean
     ```

### 4.2 Blank Screen in Android WebView
- **Symptom:** App launches on Android emulator but displays a white screen.
- **Cause:** Web assets were not compiled before synchronization.
- **Solution:**
  ```bash
  npm run cap:build
  ```
