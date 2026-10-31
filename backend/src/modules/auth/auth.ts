import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router, type Request, type RequestHandler, type CookieOptions } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { db } from '../../lib/db.js';
import { ApiError, success } from '../../lib/http.js';
import { env } from '../../config/env.js';
import { verifyPassword } from './password.js';

export type Principal = { id: string; name: string; email: string; role: Role };
declare global {
  namespace Express {
    interface Request { auth?: Principal; sessionHash?: string; csrfToken?: string }
  }
}

export const publicUser = { id: true, name: true, email: true, role: true } as const;
const cookieName = env.NODE_ENV === 'production' ? '__Host-solar_session' : 'solar_session';
const cookieOptions: CookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: env.COOKIE_SAME_SITE, path: '/' };
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const csrf = (token: string) => createHmac('sha256', token).update('solar-crm-csrf-v1').digest('hex');

export function actor(req: Request): Principal {
  if (!req.auth) throw new ApiError(401, 'UNAUTHENTICATED', 'Login required');
  return req.auth;
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[cookieName];
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, 'UNAUTHENTICATED', 'Login required');
  const session = await db.session.findUnique({ where: { tokenHash: digest(token) }, include: { user: true } });
  if (!session || session.expiresAt <= new Date() || !session.user.isActive) throw new ApiError(401, 'UNAUTHENTICATED', 'Session expired or invalid');
  const { id, name, email, role } = session.user;
  req.auth = { id, name, email, role };
  req.sessionHash = session.tokenHash;
  req.csrfToken = csrf(token);
  next();
};

export function allowRoles(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!roles.includes(actor(req).role)) throw new ApiError(403, 'FORBIDDEN', 'Your role cannot access CRM');
    next();
  };
}

export const requireCsrf: RequestHandler = (req, _res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const token = req.get('X-CSRF-Token');
    if (!token || !req.csrfToken || !/^[a-f0-9]{64}$/.test(token) || !timingSafeEqual(Buffer.from(token), Buffer.from(req.csrfToken))) {
      throw new ApiError(403, 'CSRF_FAILED', 'Supply the session CSRF token in X-CSRF-Token');
    }
  }
  next();
};

export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('Origin') !== env.APP_ORIGIN) {
    throw new ApiError(403, 'ORIGIN_FORBIDDEN', 'A trusted Origin header is required');
  }
  next();
};

const loginInput = z.strictObject({ email: z.email().max(254).transform(value => value.toLowerCase()), password: z.string().min(1).max(256) });
export const authRouter = Router();
authRouter.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  handler: (_req, _res, next) => next(new ApiError(429, 'RATE_LIMITED', 'Too many login attempts; try again later')),
}), async (req, res) => {
  const input = loginInput.parse(req.body);
  const user = await db.user.findUnique({ where: { email: input.email } });
  const valid = await verifyPassword(input.password, user?.passwordHash);
  if (!user || !valid || !user.isActive) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.SESSION_HOURS * 3600_000);
  await db.$transaction(async tx => {
    // Rotate the presented session rather than preserving an attacker-chosen token.
    const oldToken: unknown = req.cookies?.[cookieName];
    if (typeof oldToken === 'string' && /^[a-f0-9]{64}$/.test(oldToken)) await tx.session.deleteMany({ where: { tokenHash: digest(oldToken) } });
    await tx.session.create({ data: { tokenHash: digest(token), userId: user.id, expiresAt } });
  });
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: env.SESSION_HOURS * 3600_000 });
  return success(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, csrfToken: csrf(token), expiresAt });
});
authRouter.get('/me', authenticate, (req, res) => success(res, { user: actor(req), csrfToken: req.csrfToken }));
authRouter.post('/logout', authenticate, requireCsrf, async (req, res) => {
  z.strictObject({}).parse(req.body);
  await db.session.deleteMany({ where: { tokenHash: req.sessionHash! } });
  res.clearCookie(cookieName, cookieOptions);
  return success(res, { loggedOut: true });
});
