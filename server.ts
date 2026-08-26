import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Security & Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

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
  const rawUsername = (req.body.username || email.split('@')[0] || 'user').trim().toLowerCase();
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

  // Create User
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const newUser: UserRecord = {
    id: userId,
    email,
    username: rawUsername || email.split('@')[0],
    fullName: fullName || rawUsername || 'User',
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

// 9. Authentication: Google OAuth
apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  const credential = req.body.credential || req.body.id_token || req.body.token;

  if (!credential) {
    return res.status(422).json({
      status_code: 422,
      detail: 'Google OAuth token is required.',
    });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return res.status(501).json({
      status_code: 501,
      detail: 'Google OAuth is not configured on the server. Please define GOOGLE_CLIENT_ID in server environment.',
      configured: false,
    });
  }

  try {
    // Real Google tokeninfo verification
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verifyRes.ok) {
      return res.status(401).json({
        status_code: 401,
        detail: 'Google token verification failed.',
      });
    }

    const payload: any = await verifyRes.json();
    if (payload.aud !== googleClientId) {
      return res.status(401).json({
        status_code: 401,
        detail: 'Google token audience mismatch.',
      });
    }

    const email = payload.email.toLowerCase();
    let user = usersDb.get(email);

    if (!user) {
      const salt = crypto.randomBytes(16).toString('hex');
      user = {
        id: `usr-google-${Date.now()}`,
        email,
        username: email.split('@')[0],
        fullName: payload.name || email.split('@')[0],
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
    }

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
  } catch (err: any) {
    return res.status(500).json({
      status_code: 500,
      detail: 'Failed to communicate with Google authentication gateway.',
    });
  }
});

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

// Mount Routes
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// -----------------------------------------------------------------------------
// Vite Middleware / Production Static Asset Delivery
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Secure Communication] Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
