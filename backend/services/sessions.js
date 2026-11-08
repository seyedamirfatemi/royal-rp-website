/**
 * ROYAL RP - session service
 * ---------------------------------------------------------------
 * Opaque server-side sessions, not JWTs.
 *
 *  - the raw session id exists only in an httpOnly cookie
 *  - the database stores sha256(raw), so a DB leak is not replayable
 *  - every session carries its own CSRF secret
 *  - revoking is a DELETE, which a stateless JWT cannot offer
 * ---------------------------------------------------------------
 */
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { randomToken, sha256, clientIp, userAgent } from '../utils/index.js';

function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: config.session.secure,
    sameSite: config.session.sameSite,
    domain: config.session.domain,
    path: '/',
    maxAge: maxAgeMs
  };
}

/** Create a session and set both cookies. */
export async function createSession(req, res, userId, { remember = false } = {}) {
  const raw = randomToken(32);
  const id = sha256(raw);
  const csrfSecret = randomToken(24);
  const ttl = remember ? config.session.rememberTtlMs : config.session.ttlMs;

  await db.run(
    `INSERT INTO sessions (id, user_id, csrf_secret, user_agent, ip, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, csrfSecret, userAgent(req), clientIp(req), db.future(ttl), db.now()]
  );

  res.cookie(config.session.cookieName, raw, cookieOptions(ttl));

  // The CSRF cookie is deliberately readable by JavaScript: the client
  // echoes it back in the X-CSRF-Token header (double-submit pattern).
  res.cookie(config.session.csrfCookie, csrfSecret, {
    ...cookieOptions(ttl),
    httpOnly: false
  });

  return { raw, id, csrfSecret };
}

/** Look up the session behind a request, or null. */
export async function readSession(req) {
  const raw = req.cookies?.[config.session.cookieName];
  if (!raw) return null;

  const id = sha256(raw);
  const row = await db.get(
    `SELECT s.*, u.id AS uid, u.username, u.email, u.role, u.status,
            u.display_name, u.avatar_url, u.discord_id, u.game_license,
            u.locale, u.wallet_balance, u.created_at AS user_created
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?`,
    [id, db.now()]
  );
  if (!row) return null;

  return {
    sessionId: id,
    csrfSecret: row.csrf_secret,
    expiresAt: row.expires_at,
    user: {
      id: row.uid,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      displayName: row.display_name,
      avatar: row.avatar_url,
      discordId: row.discord_id,
      gameLicense: row.game_license,
      locale: row.locale,
      walletBalance: Number(row.wallet_balance) || 0,
      createdAt: row.user_created
    }
  };
}

/** Destroy the current session and clear the cookies. */
export async function destroySession(req, res) {
  const raw = req.cookies?.[config.session.cookieName];
  if (raw) {
    try { await db.run('DELETE FROM sessions WHERE id = ?', [sha256(raw)]); } catch {}
  }
  res.clearCookie(config.session.cookieName, { path: '/', domain: config.session.domain });
  res.clearCookie(config.session.csrfCookie, { path: '/', domain: config.session.domain });
}

/** Revoke every session for a user - used on password change and on suspend. */
export async function destroyAllForUser(userId) {
  await db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
}

/** Slide the expiry forward when a session is used. */
export async function touchSession(sessionId) {
  await db.run('UPDATE sessions SET expires_at = ? WHERE id = ?', [db.future(config.session.ttlMs), sessionId]);
}

export async function listSessions(userId) {
  return db.all(
    'SELECT id, user_agent, ip, created_at, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

export default { createSession, readSession, destroySession, destroyAllForUser, touchSession, listSessions };
