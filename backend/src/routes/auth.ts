import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { adminSessionService } from '../services/sessionService';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; firstAttemptAt: number }>();

function getClientKey(req: express.Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function isRateLimited(req: express.Request): boolean {
  const key = getClientKey(req);
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now });
    return false;
  }

  if (now - current.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now });
    return false;
  }

  current.count += 1;
  loginAttempts.set(key, current);
  return current.count > MAX_LOGIN_ATTEMPTS;
}

function clearRateLimit(req: express.Request) {
  loginAttempts.delete(getClientKey(req));
}

router.post('/login', (req, res) => {
  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  const { password, overrideLock } = req.body;

  // Check for an active session lock before checking the password
  if (adminSessionService.getActiveSession() && !overrideLock) {
      if (adminSessionService.isLockedFor('new-login')) {
          return res.status(403).json({ error: 'Another staff member is currently logged in. Please wait until they are finished before making changes.' });
      }
  }

  if (password === ADMIN_PASSWORD) {

    const sessionId = uuidv4();
    const token = jwt.sign({ isAdmin: true, sessionId }, JWT_SECRET, { expiresIn: '7d' });
    
    adminSessionService.setActiveSession(sessionId);
    clearRateLimit(req);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({ success: true, sessionId });
  }

  return res.status(401).json({ error: 'Invalid password' });
});

router.post('/logout', (req, res) => {
  const token = req.cookies.auth_token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      adminSessionService.clearSession(payload.sessionId);
    } catch(e) {}
  }
  res.clearCookie('auth_token');
  res.json({ success: true });
});

router.post('/heartbeat', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (adminSessionService.isLockedFor(payload.sessionId)) {
        return res.status(403).json({ error: 'Session overwritten by another admin' });
    }
    adminSessionService.heartbeat(payload.sessionId);
    return res.json({ success: true });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ isAdmin: false });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if session has been locked by someone else
    if (adminSessionService.isLockedFor(payload.sessionId)) {
        res.clearCookie('auth_token');
        return res.json({ isAdmin: false });
    }
    
    // Refresh local session state
    adminSessionService.heartbeat(payload.sessionId);

    return res.json({ isAdmin: true });
  } catch (e) {
    return res.json({ isAdmin: false });
  }
});

export default router;
