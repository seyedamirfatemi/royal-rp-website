/**
 * ROYAL RP - middleware
 * Authentication, authorisation, CSRF, rate limiting, validation
 * and the error handler. This is where the security guarantees live.
 */
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config/index.js';
import { can, atLeast } from '../config/roles.js';
import { readSession, touchSession } from '../services/sessions.js';
import { log, logWarn } from '../services/logger.js';
import { clientIp, safeEqual } from '../utils/index.js';

/* ===============================================================
   ERRORS
   =============================================================== */
export class HttpError extends Error {
  constructor(status, message, code = 'error', details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest   = (m = 'Bad request', c = 'bad_request', d) => new HttpError(400, m, c, d);
export const unauthorized = (m = 'You need to sign in', c = 'unauthorized') => new HttpError(401, m, c);
export const forbidden    = (m = 'You do not have permission to do that', c = 'forbidden') => new HttpError(403, m, c);
export const notFound     = (m = 'Not found', c = 'not_found') => new HttpError(404, m, c);
export const conflict     = (m = 'Conflict', c = 'conflict') => new HttpError(409, m, c);
export const tooMany      = (m = 'Too many requests', c = 'rate_limited') => new HttpError(429, m, c);

/** Wrap an async route so a rejection reaches the error handler. */
export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* ===============================================================
   SESSION -> req.user
   Always runs; never rejects. Routes decide whether a user is needed.
   =============================================================== */
export async function attachUser(req, res, next) {
  try {
    const session = await readSession(req);
    if (session) {
      req.session = session;
      req.user = session.user;
      // Slide the expiry at most once a minute to avoid a write per request.
      if (!req._touched) { req._touched = true; touchSession(session.sessionId).catch(() => {}); }
    }
  } catch (err) {
    console.error('  [auth] session read failed:', err.message);
  }
  next();
}

/* ===============================================================
   AUTHENTICATION / AUTHORISATION
   =============================================================== */

/** Require any signed-in, non-suspended user. */
export function requireAuth(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (req.user.status === 'suspended') {
    return next(forbidden('This account is suspended. Open a ticket to appeal.', 'account_suspended'));
  }
  next();
}

/**
 * Require a minimum role by hierarchy.
 * Prefer requirePermission for anything granular.
 */
export function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!atLeast(req.user.role, minRole)) {
      logWarn('security', `Role check failed: ${req.user.username} (${req.user.role}) needed ${minRole} for ${req.method} ${req.originalUrl}`,
        { actorId: req.user.id, actorName: req.user.username, req });
      return next(forbidden());
    }
    next();
  };
}

/**
 * Require an explicit permission from config/roles.js.
 * This is the authoritative check - the front-end's copy of the role
 * table is cosmetic and is never trusted.
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (req.user.status === 'suspended') return next(forbidden('Account suspended', 'account_suspended'));
    if (!can(req.user.role, permission)) {
      logWarn('security', `Permission denied: ${req.user.username} (${req.user.role}) lacks "${permission}" for ${req.method} ${req.originalUrl}`,
        { actorId: req.user.id, actorName: req.user.username, target: permission, req });
      return next(forbidden());
    }
    next();
  };
}

/** Allow the owner of a resource, or anyone holding `permission`. */
export function requireSelfOr(permission, getOwnerId) {
  return async (req, res, next) => {
    if (!req.user) return next(unauthorized());
    try {
      const ownerId = await getOwnerId(req);
      if (ownerId !== null && Number(ownerId) === Number(req.user.id)) return next();
      if (can(req.user.role, permission)) return next();
      return next(forbidden());
    } catch (err) { next(err); }
  };
}

/* ===============================================================
   CSRF - double submit
   The session holds a secret; the browser echoes the readable cookie
   back in a header. A cross-site form post cannot read the cookie,
   so it cannot produce the header.
   =============================================================== */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  // Provider webhooks are authenticated by HMAC signature instead.
  if (req.path.startsWith('/payments/webhook')) return next();

  const header = req.get('X-CSRF-Token') || req.body?._csrf;

  // Signed in: compare against the secret stored with the session.
  // Signed out (login, register, forgot): the double-submit cookie is
  // the only secret available, so compare the header against it.
  // A cross-site page can send the cookie but cannot read it to build
  // the header, which is what the check actually relies on.
  const expected = req.session
    ? req.session.csrfSecret
    : req.cookies?.[config.session.csrfCookie];

  if (!expected || !header || !safeEqual(header, expected)) {
    logWarn('security', `CSRF token rejected for ${req.method} ${req.originalUrl}`, { req });
    return next(new HttpError(403, 'Your session expired. Reload the page and try again.', 'csrf_invalid'));
  }
  next();
}

/* ===============================================================
   RATE LIMITING
   =============================================================== */
function limiter({ windowMs, max, message, keyPrefix = '' }) {
  return rateLimit({
    windowMs, max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => keyPrefix + (req.user ? `u${req.user.id}` : clientIp(req)),
    handler: (req, res, next) => {
      logWarn('security', `Rate limit hit on ${req.originalUrl}`, { req });
      next(tooMany(message));
    }
  });
}

export const limitGlobal = limiter({
  windowMs: config.limits.globalWindowMs, max: config.limits.globalMax,
  message: 'کمی آرام‌تر؛ لحظه‌ای بعد دوباره تلاش کنید.'
});

export const limitAuth = limiter({
  windowMs: config.limits.authWindowMs, max: config.limits.authMax, keyPrefix: 'auth:',
  message: 'تلاش بیش از حد. چند دقیقه صبر کنید و دوباره امتحان کنید.'
});

export const limitOrders = limiter({
  windowMs: config.limits.orderWindowMs, max: config.limits.orderMax, keyPrefix: 'order:',
  message: 'سفارش‌های بیش از حد ثبت شده. چند دقیقه صبر کنید.'
});

export const limitTickets = limiter({
  windowMs: config.limits.ticketWindowMs, max: config.limits.ticketMax, keyPrefix: 'ticket:',
  message: 'چند تیکت باز دارید. پیش از باز کردن تیکت تازه کمی صبر کنید.'
});

export const limitWrites = limiter({
  windowMs: config.limits.writeWindowMs, max: config.limits.writeMax, keyPrefix: 'write:',
  message: 'تغییرات بیش از حد در یک بازه کوتاه.'
});

/* ===============================================================
   VALIDATION (zod)
   =============================================================== */

/**
 * Validate and REPLACE req.body / req.query / req.params with the
 * parsed result, so routes can only ever see validated data.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map(i => ({
        field: i.path.join('.') || source,
        message: i.message
      }));
      return next(new HttpError(400, details[0]?.message || 'Invalid input', 'validation_failed', details));
    }
    if (source === 'query') {
      // Express 5 exposes req.query as a getter; assign onto it instead.
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };
}

/** Common field schemas. */
export const schemas = {
  email:    z.string().trim().toLowerCase().email('Enter a valid email address').max(190),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,20}$/, 'Use 3-20 letters, numbers or underscore'),
  password: z.string().min(8, 'At least 8 characters')
              .max(200)
              .regex(/[A-Za-z]/, 'Include at least one letter')
              .regex(/\d/, 'Include at least one number'),
  id:       z.coerce.number().int().positive(),
  slug:     z.string().trim().regex(/^[a-z0-9-]{1,80}$/, 'Invalid slug'),
  orderId:  z.string().trim().regex(/^RR-\d{3,8}$/, 'Invalid order reference'),
  page:     z.coerce.number().int().min(1).max(10000).default(1),
  perPage:  z.coerce.number().int().min(1).max(200).default(20),
  text:     (max = 2000) => z.string().trim().min(1).max(max)
};

export { z };

/* ===============================================================
   SECURITY HEADERS not covered by helmet
   =============================================================== */
export function extraSecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.setHeader('X-Frame-Options', 'DENY');
  // API responses must never be cached by a shared proxy.
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
}

/* ===============================================================
   404 + ERROR HANDLER
   =============================================================== */
export function notFoundHandler(req, res, next) {
  next(new HttpError(404, `No route for ${req.method} ${req.path}`, 'not_found'));
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 500 ? 'internal_error' : 'error');

  if (status >= 500) {
    console.error(`\n  [500] ${req.method} ${req.originalUrl}`);
    console.error(err.stack || err.message);
    log({
      category: 'error', severity: 'error',
      message: `${req.method} ${req.originalUrl} -> ${err.message}`,
      actorId: req.user?.id ?? null, actorName: req.user?.username ?? null,
      req, meta: { stack: String(err.stack || '').split('\n').slice(0, 6).join('\n') }
    }).catch(() => {});
  }

  res.status(status).json({
    error: true,
    code,
    // A 500 never leaks internals to the client.
    message: status >= 500 && config.isProd ? 'Something went wrong on our side.' : err.message,
    details: err.details || undefined
  });
}

export default {
  HttpError, asyncRoute, attachUser, requireAuth, requireRole, requirePermission,
  requireSelfOr, csrfProtection, validate, schemas,
  limitGlobal, limitAuth, limitOrders, limitTickets, limitWrites,
  extraSecurityHeaders, notFoundHandler, errorHandler,
  badRequest, unauthorized, forbidden, notFound, conflict, tooMany
};
