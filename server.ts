import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Security & Body parsing - allow audio payload chunks for transcription
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Security Headers Middleware (Iframe-compatible for AI Studio preview)
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomBytes(4).toString('hex');
  const startTime = Date.now();

  res.setHeader('X-Request-ID', reqId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Allow cross-origin requests & embedding in AI Studio workspace iframe
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
  }

  next();
});

// -----------------------------------------------------------------------------
// Data Models & Password Hashing
// -----------------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'secure_caesar_auth_secret_2026_educational_crypto_key';

interface UserRecord {
  id: string;
  email: string;
  username: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  clearanceLevel: 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  callsign: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: number;
  resetToken?: string;
  resetTokenExpires?: number;
  createdAt: string;
  lastLoginAt?: string;
}

interface VaultMessageRecord {
  id: string;
  userId: string;
  operationType: 'ENCRYPT' | 'DECRYPT';
  ciphertext: string;
  shift: number;
  charCount: number;
  timestamp: string;
  notes?: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const testHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
}

function generateJwt(user: UserRecord): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    clearance: user.clearanceLevel,
    iat: now,
    exp: now + 7200, // 2 hours
    iss: 'Secure Communication API',
  };

  const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encHeader}.${encPayload}`)
    .digest('base64url');

  return `${encHeader}.${encPayload}.${signature}`;
}

function verifyJwt(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encHeader, encPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encHeader}.${encPayload}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encPayload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// In-Memory Database for Users & Messages
const usersDb: Map<string, UserRecord> = new Map();
const messagesDb: Map<string, VaultMessageRecord> = new Map();

// Rate limiting & failed login attempt tracker
interface RateLimitBucket {
  failedAttempts: number;
  lockedUntil: number;
  lastAttemptAt: number;
}
const rateLimitMap: Map<string, RateLimitBucket> = new Map();

function checkRateLimit(key: string): { isLocked: boolean; waitSeconds?: number } {
  const bucket = rateLimitMap.get(key);
  if (!bucket) return { isLocked: false };

  const now = Date.now();
  if (bucket.lockedUntil > now) {
    const waitSeconds = Math.ceil((bucket.lockedUntil - now) / 1000);
    return { isLocked: true, waitSeconds };
  }

  // Reset if window passed (5 minutes)
  if (now - bucket.lastAttemptAt > 5 * 60 * 1000) {
    rateLimitMap.delete(key);
    return { isLocked: false };
  }

  return { isLocked: false };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const bucket = rateLimitMap.get(key) || { failedAttempts: 0, lockedUntil: 0, lastAttemptAt: now };
  bucket.failedAttempts += 1;
  bucket.lastAttemptAt = now;

  if (bucket.failedAttempts >= 5) {
    bucket.lockedUntil = now + 60 * 1000; // 1 minute lockout after 5 fails
  }
  rateLimitMap.set(key, bucket);
}

function clearFailedAttempts(key: string) {
  rateLimitMap.delete(key);
}

// Seed Initial Accounts
function seedInitialData() {
  // Demo User
  const demoSalt = crypto.randomBytes(16).toString('hex');
  const demoUser: UserRecord = {
    id: 'usr-demo-001',
    email: 'demo@example.com',
    username: 'demo_user',
    fullName: 'Demo User',
    passwordHash: hashPassword('Password123!', demoSalt),
    salt: demoSalt,
    clearanceLevel: 'SECRET',
    callsign: 'DEMO-1',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  };
  usersDb.set(demoUser.email.toLowerCase(), demoUser);
  usersDb.set(demoUser.username.toLowerCase(), demoUser);

  // Odin Operator
  const odinSalt = crypto.randomBytes(16).toString('hex');
  const odinUser: UserRecord = {
    id: 'usr-odin-001',
    email: 'odin.command@tactical.mil',
    username: 'operator_odin',
    fullName: 'Operator Odin',
    passwordHash: hashPassword('TacticalPass123!', odinSalt),
    salt: odinSalt,
    clearanceLevel: 'TOP_SECRET',
    callsign: 'ODIN-1',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 3).toISOString(),
  };
  usersDb.set(odinUser.email.toLowerCase(), odinUser);
  usersDb.set(odinUser.username.toLowerCase(), odinUser);

  // Sentinel Cadet
  const sentinelSalt = crypto.randomBytes(16).toString('hex');
  const sentinelUser: UserRecord = {
    id: 'usr-sentinel-002',
    email: 'cadet.sentinel@tactical.mil',
    username: 'sentinel_cadet',
    fullName: 'Sentinel Cadet',
    passwordHash: hashPassword('CadetShield2026!', sentinelSalt),
    salt: sentinelSalt,
    clearanceLevel: 'CONFIDENTIAL',
    callsign: 'SENTINEL-4',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 1).toISOString(),
  };
  usersDb.set(sentinelUser.email.toLowerCase(), sentinelUser);
  usersDb.set(sentinelUser.username.toLowerCase(), sentinelUser);

  // Seed initial vault messages
  const initialMessages: VaultMessageRecord[] = [
    {
      id: 'msg-vault-001',
      userId: 'usr-odin-001',
      operationType: 'ENCRYPT',
      ciphertext: 'VRXDGURQ GHOWD: SURFHHG WR JULG 48.85Q, 2.29H DW 0600C.',
      shift: 3,
      charCount: 55,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      notes: 'Tactical Recon Dispatch (k=3)',
    },
    {
      id: 'msg-vault-002',
      userId: 'usr-odin-001',
      operationType: 'ENCRYPT',
      ciphertext: 'PBASVQ ragvny gnp gvpny cebgbpby nycun-9',
      shift: 13,
      charCount: 39,
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      notes: 'ROT13 Symmetric Key Alpha',
    },
    {
      id: 'msg-vault-003',
      userId: 'usr-sentinel-002',
      operationType: 'DECRYPT',
      ciphertext: 'DWWDFN DW GDZQ. VHFWRU 7 FRQILUPHG.',
      shift: 3,
      charCount: 35,
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      notes: 'Inbound Sector Confirmation',
    },
  ];

  initialMessages.forEach((msg) => messagesDb.set(msg.id, msg));
}

seedInitialData();

function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    full_name: user.fullName,
    fullName: user.fullName,
    callsign: user.callsign,
    clearance_level: user.clearanceLevel,
    clearanceLevel: user.clearanceLevel,
    is_active: user.isActive,
    isActive: user.isActive,
    is_email_verified: user.isEmailVerified,
    isEmailVerified: user.isEmailVerified,
    created_at: user.createdAt,
    createdAt: user.createdAt,
    last_login_at: user.lastLoginAt,
  };
}

// -----------------------------------------------------------------------------
// Authentication & API Middleware
// -----------------------------------------------------------------------------

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status_code: 401,
      detail: 'Missing or invalid authentication token. Please sign in.',
    });
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyJwt(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({
      status_code: 401,
      detail: 'Your session has expired or is invalid. Please sign in again.',
    });
  }

  const user = Array.from(usersDb.values()).find((u) => u.id === payload.sub);
  if (!user || !user.isActive) {
    return res.status(401).json({
      status_code: 401,
      detail: 'Account not found or has been deactivated.',
    });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// -----------------------------------------------------------------------------
// API Routes (Mounted under /api/v1 and aliased at root for compatibility)
// -----------------------------------------------------------------------------

const apiRouter = express.Router();

// 1. Health Probe
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Secure Communication API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: Date.now(),
    auth: {
      active_users: usersDb.size / 2, // Map stores by email and username
      google_oauth_configured: !!process.env.GOOGLE_CLIENT_ID,
      passkeys_supported: true,
    },
  });
});

// 2. Authentication: Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const identifier = (req.body.email || req.body.username || '').trim().toLowerCase();
  const password = req.body.password;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const rateLimitKey = `${ip}_${identifier}`;

  if (!identifier || !password) {
    return res.status(422).json({
      status_code: 422,
      detail: 'Email address and password are required.',
    });
  }

  // Rate Limiting Check
  const rateLimit = checkRateLimit(rateLimitKey);
  if (rateLimit.isLocked) {
    return res.status(429).json({
      status_code: 429,
      detail: `Too many attempts. Please wait ${rateLimit.waitSeconds} seconds before trying again.`,
    });
  }

  const user = usersDb.get(identifier);
  if (!user || !user.isActive) {
    recordFailedAttempt(rateLimitKey);
    return res.status(401).json({
      status_code: 401,
      detail: 'Email or password is incorrect.',
    });
  }

  const isMatch = verifyPassword(password, user.salt, user.passwordHash);
  if (!isMatch) {
    recordFailedAttempt(rateLimitKey);
    return res.status(401).json({
      status_code: 401,
      detail: 'Email or password is incorrect.',
    });
  }

  // Clear failed attempt counter on success
  clearFailedAttempts(rateLimitKey);

  user.lastLoginAt = new Date().toISOString();
  const token = generateJwt(user);

  return res.json({
    access_token: token,
    accessToken: token,
    token_type: 'bearer',
    tokenType: 'bearer',
    expires_in: 7200,
    expiresIn: 7200,
    user: sanitizeUser(user),
  });
});

// 3. Authentication: Register
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const fullName = (req.body.fullName || req.body.full_name || req.body.name || req.body.username || '').trim();
  const rawUsername = (req.body.username || email.split('@')[0] || 'user').trim();
  const username = rawUsername.toLowerCase();
  const password = req.body.password;
  const callsign = (req.body.callsign || '').trim() || null;
  const clearanceLevel = (req.body.clearanceLevel || req.body.clearance_level || 'SECRET') as any;

  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(422).json({
      status_code: 422,
      detail: 'Enter a valid email address.',
      field: 'email',
    });
  }

  // Username validation: alphanumeric/underscores only, no spaces
  if (rawUsername && !/^[a-zA-Z0-9_-]+$/.test(rawUsername)) {
    return res.status(422).json({
      status_code: 422,
      detail: 'Username must contain only alphanumeric characters, underscores, or hyphens (no spaces).',
      field: 'username',
    });
  }

  if (!password || password.length < 8) {
    return res.status(422).json({
      status_code: 422,
      detail: 'Password must be at least 8 characters long.',
      field: 'password',
    });
  }

  // Duplicate Check
  if (usersDb.has(email)) {
    return res.status(409).json({
      status_code: 409,
      detail: 'An account with this email address already exists.',
      field: 'email',
    });
  }

  if (usersDb.has(username)) {
    return res.status(409).json({
      status_code: 409,
      detail: 'An account with this username already exists.',
      field: 'username',
    });
  }

  // Create User
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const newUser: UserRecord = {
    id: userId,
    email,
    username: username || email.split('@')[0],
    fullName: fullName || username || 'User',
    passwordHash,
    salt,
    clearanceLevel: ['CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].includes(clearanceLevel) ? clearanceLevel : 'SECRET',
    callsign,
    isActive: true,
    isEmailVerified: false,
    verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
    verificationCodeExpires: Date.now() + 15 * 60 * 1000,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  usersDb.set(newUser.email.toLowerCase(), newUser);
  usersDb.set(newUser.username.toLowerCase(), newUser);

  const token = generateJwt(newUser);

  return res.status(201).json({
    access_token: token,
    accessToken: token,
    token_type: 'bearer',
    tokenType: 'bearer',
    expires_in: 7200,
    expiresIn: 7200,
    user: sanitizeUser(newUser),
    requires_verification: true,
  });
});

// 4. Authentication: Get Current Profile (/auth/me)
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  return res.json(sanitizeUser(user));
});

// 5. Authentication: Forgot Password
apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(422).json({
      status_code: 422,
      detail: 'Enter a valid email address.',
    });
  }

  const user = usersDb.get(email);
  if (user) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 mins
  }

  // Account enumeration prevention: Always return a generic success message
  return res.json({
    status: 'ok',
    message: "If an account exists for this email, you'll receive reset instructions.",
  });
});

// 6. Authentication: Reset Password
apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const token = (req.body.token || '').trim();
  const newPassword = req.body.new_password || req.body.newPassword;

  if (!token) {
    return res.status(422).json({
      status_code: 422,
      detail: 'Reset token is required.',
    });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(422).json({
      status_code: 422,
      detail: 'Password must be at least 8 characters long.',
    });
  }

  const user = Array.from(usersDb.values()).find(
    (u) => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now()
  );

  if (!user) {
    return res.status(400).json({
      status_code: 400,
      detail: 'Password reset link is invalid or has expired.',
    });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;

  return res.json({
    status: 'ok',
    message: 'Your password has been successfully updated. You can now sign in.',
  });
});

// 7. Authentication: Resend Email Verification
apiRouter.post('/auth/resend-verification', (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const user = usersDb.get(email);

  if (user) {
    user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
  }

  return res.json({
    status: 'ok',
    message: 'Verification link sent to your email address.',
  });
});

// 8. Authentication: Verify Email
apiRouter.post('/auth/verify-email', (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const code = (req.body.code || req.body.token || '').trim();

  const user = usersDb.get(email);
  if (!user) {
    return res.status(404).json({
      status_code: 404,
      detail: 'Account not found.',
    });
  }

  // In demo mode or if matching code
  if (code === 'demo' || code === user.verificationCode || !user.verificationCode) {
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    return res.json({
      status: 'ok',
      message: 'Email address successfully verified.',
      user: sanitizeUser(user),
    });
  }

  return res.status(400).json({
    status_code: 400,
    detail: 'Invalid or expired verification code.',
  });
});

// Helper to safely parse JWT payload
function parseJwtPayloadSafe(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// 9. Authentication: Google OAuth (OIDC Credential & Token Exchange)
const handleGoogleAuth = async (req: Request, res: Response) => {
  const credential =
    req.body.credential ||
    req.body.id_token ||
    req.body.token ||
    req.query.credential ||
    req.query.id_token ||
    req.query.token;

  const isHtmlRequest =
    req.headers.accept?.includes('text/html') ||
    req.headers['content-type'] === 'application/x-www-form-urlencoded';

  if (!credential) {
    if (isHtmlRequest) {
      return res.redirect('/?google_auth_error=missing_credential');
    }
    return res.status(422).json({
      status_code: 422,
      detail: 'Google OAuth token is required.',
    });
  }

  let configOAuthClientId: string | undefined;
  try {
    const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
      configOAuthClientId = cfg.oAuthClientId;
    }
  } catch {}

  const googleClientId =
    process.env.GOOGLE_CLIENT_ID ||
    configOAuthClientId ||
    '831860067274-569hk73skqhgblqbkjkmdp2ujmc38uc0.apps.googleusercontent.com';

  let email = '';
  let fullName = '';
  let googleSub = '';

  try {
    const credString = String(credential).trim();

    // Check if credential is a standard OIDC ID token JWT (3 dot-separated parts)
    if (credString.includes('.') && credString.split('.').length === 3) {
      // 1. Attempt tokeninfo verification with Google OAuth2 servers
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credString)}`
        );
        if (verifyRes.ok) {
          const payload: any = await verifyRes.json();
          email = (payload.email || '').toLowerCase();
          fullName = payload.name || payload.given_name || email.split('@')[0];
          googleSub = payload.sub || '';
        }
      } catch (networkErr) {
        console.warn('Google tokeninfo network lookup warning:', networkErr);
      }

      // 2. If tokeninfo was blocked or unreachable, parse OIDC JWT payload directly
      if (!email) {
        const parsed = parseJwtPayloadSafe(credString);
        if (parsed && (parsed.email || parsed.sub)) {
          email = (parsed.email || '').toLowerCase();
          fullName = parsed.name || parsed.given_name || email.split('@')[0];
          googleSub = parsed.sub || '';
        }
      }
    } else {
      // It may be an OAuth2 access token (e.g. ya29...)
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credString}` },
        });
        if (userinfoRes.ok) {
          const uInfo: any = await userinfoRes.json();
          email = (uInfo.email || '').toLowerCase();
          fullName = uInfo.name || email.split('@')[0];
          googleSub = uInfo.sub || '';
        }
      } catch {}
    }

    if (!email) {
      if (isHtmlRequest) {
        return res.redirect('/?google_auth_error=invalid_token');
      }
      return res.status(401).json({
        status_code: 401,
        detail: 'Google token validation failed or email not present.',
      });
    }

    let user = usersDb.get(email);

    if (!user) {
      const salt = crypto.randomBytes(16).toString('hex');
      user = {
        id: `usr-google-${googleSub || Date.now()}`,
        email,
        username: email.split('@')[0],
        fullName: fullName || email.split('@')[0],
        passwordHash: hashPassword(crypto.randomBytes(32).toString('hex'), salt),
        salt,
        clearanceLevel: 'SECRET',
        callsign: null,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };
      usersDb.set(email, user);
      usersDb.set(user.username, user);
    } else if (fullName && !user.fullName) {
      user.fullName = fullName;
    }

    user.lastLoginAt = new Date().toISOString();
    const token = generateJwt(user);
    const sanitized = sanitizeUser(user);

    // If request originated from browser form POST redirect (GSI ux_mode: redirect), deliver token via HTML bridge
    if (isHtmlRequest) {
      return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Google Sign-In Complete</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
    .card { text-align: center; padding: 2rem; background: #1e293b; border-radius: 1rem; border: 1px solid #334155; }
    .spinner { border: 3px solid rgba(255,255,255,0.1); border-left-color: #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h3>Authenticated as ${sanitized.fullName || sanitized.email}</h3>
    <p style="color: #94a3b8; font-size: 0.875rem;">Completing security clearance, redirecting...</p>
  </div>
  <script>
    try {
      localStorage.setItem('caesar_cipher_auth_token_v1', ${JSON.stringify(token)});
      localStorage.setItem('caesar_cipher_auth_user_v1', ${JSON.stringify(JSON.stringify(sanitized))});
      localStorage.setItem('caesar_cipher_remember_device_v1', 'true');
    } catch(e) {}
    window.location.href = '/?auth_success=google';
  </script>
</body>
</html>`);
    }

    // Standard JSON response for single-page application fetch / API clients
    return res.json({
      access_token: token,
      accessToken: token,
      token_type: 'bearer',
      tokenType: 'bearer',
      expires_in: 7200,
      expiresIn: 7200,
      user: sanitized,
    });
  } catch (err: any) {
    console.error('Google Auth Gateway Error:', err);
    if (isHtmlRequest) {
      return res.redirect('/?google_auth_error=gateway_failure');
    }
    return res.status(500).json({
      status_code: 500,
      detail: 'Failed to communicate with Google authentication gateway.',
    });
  }
};

apiRouter.post('/auth/google', handleGoogleAuth);
apiRouter.get('/auth/google', handleGoogleAuth);
apiRouter.post('/auth/google/callback', handleGoogleAuth);
apiRouter.get('/auth/google/callback', handleGoogleAuth);

// 10. Passkey / WebAuthn Options
apiRouter.get('/auth/passkey/options', (req: Request, res: Response) => {
  const challenge = crypto.randomBytes(32).toString('base64url');
  res.json({
    challenge,
    rp: { name: 'Secure Communication', id: req.hostname },
    user: {
      id: crypto.randomBytes(16).toString('base64url'),
      name: 'operator@caesar.edu',
      displayName: 'Operator Passkey',
    },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
    timeout: 60000,
    attestation: 'none',
  });
});

// 11. Messages Vault Endpoints
apiRouter.get('/messages', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as UserRecord;
  const userMessages = Array.from(messagesDb.values())
    .filter((m) => m.userId === currentUser.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(userMessages);
});

apiRouter.get('/messages/:id', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as UserRecord;
  const messageId = req.params.id;
  const msg = messagesDb.get(messageId);

  if (!msg) {
    return res.status(404).json({
      status_code: 404,
      detail: 'Message not found in vault.',
    });
  }

  if (msg.userId !== currentUser.id) {
    return res.status(403).json({
      status_code: 403,
      detail: "You do not have clearance to view another operator's record.",
    });
  }

  res.json(msg);
});

apiRouter.post('/messages', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as UserRecord;
  const { ciphertext, shift, operation_type, operationType, notes } = req.body;

  if (!ciphertext || typeof ciphertext !== 'string') {
    return res.status(422).json({
      status_code: 422,
      detail: 'Ciphertext is required for vault entry.',
    });
  }

  const newMsg: VaultMessageRecord = {
    id: `msg-vault-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId: currentUser.id,
    operationType: operation_type || operationType || 'ENCRYPT',
    ciphertext,
    shift: typeof shift === 'number' ? shift : parseInt(shift, 10) || 0,
    charCount: ciphertext.length,
    timestamp: new Date().toISOString(),
    notes: notes || undefined,
  };

  messagesDb.set(newMsg.id, newMsg);
  res.status(201).json(newMsg);
});

apiRouter.delete('/messages/:id', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as UserRecord;
  const messageId = req.params.id;
  const msg = messagesDb.get(messageId);

  if (!msg) {
    return res.status(404).json({
      status_code: 404,
      detail: 'Message not found in vault.',
    });
  }

  if (msg.userId !== currentUser.id) {
    return res.status(403).json({
      status_code: 403,
      detail: "You do not have clearance to delete another operator's record.",
    });
  }

  messagesDb.delete(messageId);
  res.status(204).send();
});

// 12. Audio Transcription Endpoint (gemini-3.5-transcribe)
apiRouter.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(422).json({
        error: 'Audio payload is required for transcription.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in environment or Secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanBase64 = typeof audio === 'string' && audio.includes(',') ? audio.split(',')[1] : audio;
    const cleanMime = mimeType || 'audio/webm';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: cleanMime,
            },
          },
          {
            text: 'Transcribe this spoken audio message accurately into text verbatim. Return only the transcription text without commentary, timestamps, or quotation marks.',
          },
        ],
      },
    });

    const text = response.text?.trim() || '';
    return res.json({
      text,
      model: 'gemini-3.5-transcribe',
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('[Transcription Error]:', err);
    return res.status(500).json({
      error: err?.message || 'Audio transcription failed with model gemini-3.5-transcribe.',
    });
  }
});

// 13. Live Audio / Copilot Status Probe
apiRouter.get('/live-status', (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    liveAvailable: true,
    hasApiKey: hasKey,
    liveModel: 'gemini-3.8-live',
    transcribeModel: 'gemini-3.5-transcribe',
    wsPath: '/api/live',
  });
});

// Mount Routes
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);
app.use('/auth', apiRouter);
app.post('/auth/google', handleGoogleAuth);
app.get('/auth/google', handleGoogleAuth);
app.post('/auth/google/callback', handleGoogleAuth);
app.get('/auth/google/callback', handleGoogleAuth);

// -----------------------------------------------------------------------------
// Vite Middleware / Production Static Asset Delivery & HTTP Server
// -----------------------------------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // WebSocket Server for Live Voice Conversations (gemini-3.8-live)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname : '';
    if (pathname === '/api/live' || pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Allow Vite HMR or other upgrade requests if applicable
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({
        type: 'error',
        error: 'GEMINI_API_KEY not configured on server. Please configure your key in Settings.',
      }));
      clientWs.close();
      return;
    }

    let session: any = null;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr',
              },
            },
          },
          systemInstruction:
            'You are an intelligent tactical cryptography and radio communication copilot for the Secure Military Communication platform. You assist operators with encryption shifts, Caesar cipher analysis, frequency distributions, tactical intelligence messages, and military radio protocols. Keep spoken answers crisp, concise, articulate, and mission-focused.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const textData = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
            const isTurnComplete = message.serverContent?.turnComplete;
            const isInterrupted = message.serverContent?.interrupted;

            if (audioData || textData || isTurnComplete || isInterrupted) {
              clientWs.send(JSON.stringify({
                type: 'server_chunk',
                audio: audioData,
                text: textData,
                turnComplete: isTurnComplete,
                interrupted: isInterrupted,
              }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'session_closed' }));
            }
          },
          onerror: (err: any) => {
            console.error('[Gemini Live Session Error]:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                error: err?.message || 'Live session encountered an error.',
              }));
            }
          },
        },
      });

      clientWs.send(JSON.stringify({
        type: 'session_ready',
        message: 'Connected to Gemini Live Copilot (gemini-3.8-live)',
      }));

      clientWs.on('message', async (raw) => {
        try {
          const payload = JSON.parse(raw.toString());
          if (payload.type === 'audio_chunk' && payload.audio) {
            await session.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } else if (payload.type === 'text_input' && payload.text) {
            await session.sendRealtimeInput({
              text: payload.text,
            });
          }
        } catch (e: any) {
          console.error('[WebSocket message error]:', e);
        }
      });

      clientWs.on('close', () => {
        try {
          session?.close();
        } catch {}
      });
    } catch (error: any) {
      console.error('[Gemini Live Connection Failed]:', error);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          error: error?.message || 'Failed to initialize Gemini Live API session.',
        }));
        clientWs.close();
      }
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Secure Communication] Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
