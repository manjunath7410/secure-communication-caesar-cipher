# Deployment & Operations Guide
# Secure Military Communication Platform

---

## 1. Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# Server Port (Default: 3000)
PORT=3000
NODE_ENV=production

# JWT Authentication Secret Key
JWT_SECRET_KEY=your_strong_cryptographic_jwt_secret_key_here

# Google OAuth Client ID (Optional)
GOOGLE_CLIENT_ID=

# FastAPI Database URL (Optional for PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/caesar_db
```

---

## 2. Option A: Full-Stack Node.js Deployment (Default)

The application includes a production-ready Node.js Express server that bundles the backend into a standalone CommonJS binary (`dist/server.cjs`) while serving the compiled Vite React frontend.

### Step-by-Step Production Build:
1. **Install Dependencies:**
   ```bash
   npm install --production=false
   ```
2. **Execute Build:**
   ```bash
   npm run build
   ```
   *This command compiles the React SPA via Vite into `dist/` and bundles `server.ts` into `dist/server.cjs` via esbuild.*
3. **Launch Production Server:**
   ```bash
   npm start
   ```
   The application will bind to `0.0.0.0:3000`.

---

## 3. Option B: Python FastAPI + PostgreSQL Deployment

For environments utilizing the Python FastAPI backend:

1. **Navigate to Backend Directory:**
   ```bash
   cd backend
   ```
2. **Install Python Requirements:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. **Launch with Uvicorn (Development):**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. **Launch with Gunicorn (Production):**
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

---

## 4. Option C: Android Native APK Build (Capacitor 8)

### Prerequisites:
- **Android Studio** (Hedgehog / Iguana / Jellyfish or newer)
- **Android SDK & Build Tools** (API Level 34 / 36)
- **JDK 17 or 21**

### Build Commands:
1. **Compile Web Assets & Synchronize Capacitor:**
   ```bash
   npm run cap:build
   ```
2. **Open in Android Studio:**
   ```bash
   npm run cap:open
   ```
3. **Command-Line Debug APK Build:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The generated APK will be located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Command-Line Release APK Build:**
   ```bash
   ./gradlew assembleRelease
   ```

---

## 5. Option D: Docker & Container Deployment

### 5.1 Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

### 5.2 Build & Run Container:
```bash
docker build -t secure-military-comm:1.0.0 .
docker run -p 3000:3000 -e JWT_SECRET_KEY="production_secret_key" secure-military-comm:1.0.0
```
