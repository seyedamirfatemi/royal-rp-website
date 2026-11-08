/**
 * ROYAL RP - small shared helpers
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

/* ===============================================================
   IDS & TOKENS
   =============================================================== */

/** Cryptographically random URL-safe token. */
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** SHA-256 hex. Used to store session ids and reset tokens. */
export function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/** Constant-time string compare, safe against timing attacks. */
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    // Still compare to keep the timing flat.
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Human-friendly order id: RR-104926
 * Short enough to read over voice, wide enough that collisions are
 * rare - and the caller still re-rolls on a unique-constraint clash,
 * so a collision can never fail a checkout.
 */
export function orderId() {
  return `RR-${crypto.randomInt(100000, 999999)}`;
}

/** Human-friendly ticket id: RR-1184 */
export function ticketId() {
  return `RR-${crypto.randomInt(1000, 9999)}`;
}

/** Idempotency key for a delivery: stable per (order, provider ref). */
export function deliveryKey(orderIdValue, providerRef) {
  return sha256(`${orderIdValue}::${providerRef || 'none'}`).slice(0, 48);
}

/* ===============================================================
   PASSWORDS
   =============================================================== */
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!hash) {
    // No password set (Discord-only account). Burn the same time anyway
    // so an attacker cannot distinguish it from a wrong password.
    await bcrypt.compare(String(plain), '$2a$12$0000000000000000000000000000000000000000000000000000');
    return false;
  }
  try { return await bcrypt.compare(String(plain), hash); }
  catch { return false; }
}

/* ===============================================================
   STRINGS
   =============================================================== */
export function slugify(text) {
  return String(text)
    .toLowerCase().trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

/** Strip every HTML tag. For plain-text fields. */
export function stripTags(html) {
  return String(html || '').replace(/<[^>]*>/g, '');
}

/**
 * Allow-list HTML sanitiser for news bodies written in the admin RTE.
 * Anything not on the list is removed, including every event handler
 * attribute and every javascript: URL.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre', 'hr', 'span'
]);
const ALLOWED_ATTRS = { a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading'] };

export function sanitizeHtml(input) {
  let html = String(input || '');

  // Remove dangerous elements outright, including their content.
  html = html.replace(/<(script|style|iframe|object|embed|form|input|svg|math)[\s\S]*?<\/\1>/gi, '');
  html = html.replace(/<(script|style|iframe|object|embed|form|input|svg|math)[^>]*\/?>/gi, '');

  // Walk every remaining tag and rebuild it from the allow-list.
  html = html.replace(/<\/?([a-zA-Z0-9]+)((?:\s+[^<>]*)?)\/?>/g, (match, rawTag, rawAttrs) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (match.startsWith('</')) return `</${tag}>`;

    const allowed = ALLOWED_ATTRS[tag] || [];
    const keep = [];
    for (const m of String(rawAttrs).matchAll(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g)) {
      const name = m[1].toLowerCase();
      let value = m[2];
      if (!allowed.includes(name)) continue;
      if ((name === 'href' || name === 'src') && !/^(https?:\/\/|\/|\.\.?\/|#|mailto:)/i.test(value)) continue;
      value = value.replace(/"/g, '&quot;');
      keep.push(`${name}="${value}"`);
    }
    if (tag === 'a' && keep.some(a => a.startsWith('target='))) keep.push('rel="noopener noreferrer"');
    return `<${tag}${keep.length ? ' ' + keep.join(' ') : ''}>`;
  });

  return html;
}

/* ===============================================================
   MONEY
   =============================================================== */

/** Round to 2dp without float drift. */
export function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function toCents(n) {
  return Math.round((Number(n) || 0) * 100);
}

/* ===============================================================
   REQUEST
   =============================================================== */
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim().slice(0, 64);
  return (req.ip || req.socket?.remoteAddress || '').replace('::ffff:', '').slice(0, 64);
}

export function userAgent(req) {
  return String(req.headers['user-agent'] || '').slice(0, 255);
}

/** Only ever redirect to a path on our own site. */
export function safeRedirect(target, fallback) {
  const t = String(target || '');
  if (!t || !t.startsWith('/') || t.startsWith('//')) return fallback;
  return t;
}

export default {
  randomToken, sha256, safeEqual, orderId, ticketId, deliveryKey,
  hashPassword, verifyPassword, slugify, stripTags, sanitizeHtml,
  money, toCents, clientIp, userAgent, safeRedirect
};
