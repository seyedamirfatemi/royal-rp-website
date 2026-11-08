/**
 * ROYAL RP - backend configuration
 * ---------------------------------------------------------------
 * Every secret is read from the environment. Nothing in this file
 * is ever sent to the browser.
 * ---------------------------------------------------------------
 */
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..', '..');
export const BACKEND = path.resolve(__dirname, '..');

/**
 * Load the environment from backend/.env regardless of where the
 * process was started from, then fall back to a root .env.
 * (Plain `dotenv/config` resolves against process.cwd(), which is
 * the project root when started via npm scripts, so backend/.env
 * would be silently ignored.)
 */
for (const candidate of [path.join(BACKEND, '.env'), path.join(ROOT, '.env')]) {
  if (fs.existsSync(candidate)) { dotenv.config({ path: candidate }); break; }
}

const env = process.env;
const bool = (v, d = false) => (v === undefined ? d : /^(1|true|yes|on)$/i.test(String(v)));
const int = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
const list = (v, d = []) => (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : d);

export const isProd = env.NODE_ENV === 'production';

/* ---------------------------------------------------------------
   SESSION SECRET
   In production a missing secret is fatal: a random one would log
   everybody out on every restart and silently break sessions.
   --------------------------------------------------------------- */
let sessionSecret = env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProd) {
    console.error('\n  FATAL: SESSION_SECRET is not set.\n  Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n');
    process.exit(1);
  }
  sessionSecret = crypto.randomBytes(48).toString('hex');
  console.warn('  ! SESSION_SECRET not set - using a random development secret.');
  console.warn('    Sessions will be invalidated on restart. Set it in backend/.env.\n');
}

/* ---------------------------------------------------------------
   The mock payment provider hands out goods for a click: it posts a
   correctly-signed webhook to ourselves without any money moving.
   That is exactly what makes it useful in development and exactly
   what makes it a hole in production, so refuse to start.
   --------------------------------------------------------------- */
if (isProd && (env.PAYMENT_PROVIDER || '').toLowerCase() === 'mock') {
  console.error(
    '\n  FATAL: PAYMENT_PROVIDER=mock with NODE_ENV=production.' +
    '\n  The mock gateway delivers purchases without taking payment.' +
    '\n  Set PAYMENT_PROVIDER=zarinpal (with ZARINPAL_MERCHANT_ID), or "none".\n'
  );
  process.exit(1);
}

export const config = {
  env: env.NODE_ENV || 'development',
  isProd,

  server: {
    port: int(env.PORT, 4000),
    host: env.HOST || '0.0.0.0',
    /** Origins allowed to send credentialed requests. */
    corsOrigins: list(env.CORS_ORIGINS, [
      'http://localhost:5173', 'http://127.0.0.1:5173',
      'http://localhost:4000', 'http://127.0.0.1:4000'
    ]),
    trustProxy: bool(env.TRUST_PROXY, isProd),
    /** Serve the front-end from the same Node process. */
    serveStatic: bool(env.SERVE_STATIC, true),
    publicUrl: env.PUBLIC_URL || 'http://localhost:5173'
  },

  session: {
    secret: sessionSecret,
    cookieName: env.SESSION_COOKIE || 'royal_sid',
    csrfCookie: 'royal_csrf',
    ttlMs: int(env.SESSION_TTL_HOURS, 72) * 3600 * 1000,
    rememberTtlMs: int(env.SESSION_REMEMBER_DAYS, 30) * 86400 * 1000,
    secure: bool(env.COOKIE_SECURE, isProd),
    sameSite: env.COOKIE_SAMESITE || 'lax',
    domain: env.COOKIE_DOMAIN || undefined
  },

  db: {
    /** 'sqlite' (default, zero-config) or 'mysql' */
    driver: (env.DB_DRIVER || 'sqlite').toLowerCase(),
    sqliteFile: env.DB_FILE || path.join(BACKEND, 'database', 'royalrp.sqlite'),
    mysql: {
      host: env.DB_HOST || '127.0.0.1',
      port: int(env.DB_PORT, 3306),
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      database: env.DB_NAME || 'royalrp',
      connectionLimit: int(env.DB_POOL, 10)
    }
  },

  /* ---- FiveM game server ---- */
  fivem: {
    /** Public address shown to players. */
    publicAddress: env.FIVEM_PUBLIC_ADDRESS || 'play.royalrp.example',
    /** host:port of the FiveM server's HTTP endpoint (info.json, players.json). */
    host: env.FIVEM_HOST || '',
    /** Shared secret for our own royal-web-bridge resource. */
    apiToken: env.FIVEM_API_TOKEN || '',
    /** 'auto' lets the backend detect ESX / QBCore / Qbox from the live schema. */
    framework: (env.FIVEM_FRAMEWORK || 'auto').toLowerCase(),
    maxPlayers: int(env.FIVEM_MAX_PLAYERS, 256),
    /**
     * Game database. Often the SAME MySQL instance the server uses
     * through oxmysql. Left blank, character data is unavailable and
     * the dashboard says so instead of inventing numbers.
     */
    gameDb: {
      enabled: bool(env.GAME_DB_ENABLED, false),
      host: env.GAME_DB_HOST || env.DB_HOST || '127.0.0.1',
      port: int(env.GAME_DB_PORT, 3306),
      user: env.GAME_DB_USER || '',
      password: env.GAME_DB_PASSWORD || '',
      database: env.GAME_DB_NAME || ''
    },
    timeoutMs: int(env.FIVEM_TIMEOUT_MS, 5000),
    cacheMs: int(env.FIVEM_CACHE_MS, 10000)
  },

  /* ---- Discord ---- */
  discord: {
    clientId: env.DISCORD_CLIENT_ID || '',
    clientSecret: env.DISCORD_CLIENT_SECRET || '',
    redirectUri: env.DISCORD_REDIRECT_URI || 'http://localhost:4000/api/auth/discord/callback',
    botToken: env.DISCORD_BOT_TOKEN || '',
    guildId: env.DISCORD_GUILD_ID || '',
    scopes: ['identify', 'email'],
    get enabled() { return !!(this.clientId && this.clientSecret); }
  },

  /* ---- Payments ---- */
  payments: {
    /** 'none' | 'stripe' | 'paypal' | 'mock' */
    provider: (env.PAYMENT_PROVIDER || 'none').toLowerCase(),
    publicKey: env.PAYMENT_PUBLIC_KEY || '',
    secretKey: env.PAYMENT_SECRET_KEY || '',
    webhookSecret: env.PAYMENT_WEBHOOK_SECRET || '',

    /* ---- ZarinPal ---- */
    merchantId: env.ZARINPAL_MERCHANT_ID || '',
    sandbox: bool(env.ZARINPAL_SANDBOX, false),
    currency: env.CURRENCY || 'IRT',
    successUrl: env.PAYMENT_SUCCESS_URL || 'http://localhost:5173/pages/checkout.html?status=success',
    cancelUrl: env.PAYMENT_CANCEL_URL || 'http://localhost:5173/pages/checkout.html?status=cancelled',
    get enabled() {
      if (this.provider === 'none') return false;
      if (this.provider === 'zarinpal') return !!this.merchantId;
      return !!this.secretKey;
    }
  },

  /* ---- Uploads ---- */
  uploads: {
    dir: env.UPLOAD_DIR || path.join(BACKEND, 'uploads'),
    maxBytes: int(env.UPLOAD_MAX_MB, 10) * 1024 * 1024,
    maxFiles: int(env.UPLOAD_MAX_FILES, 5),
    allowedMime: [
      'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm', 'application/pdf'
    ]
  },

  /* ---- Rate limits (requests per window) ---- */
  limits: {
    globalWindowMs: 60_000,   globalMax: int(env.RATE_GLOBAL, 300),
    authWindowMs:   900_000,  authMax:   int(env.RATE_AUTH, 10),
    orderWindowMs:  600_000,  orderMax:  int(env.RATE_ORDER, 15),
    ticketWindowMs: 3_600_000, ticketMax: int(env.RATE_TICKET, 10),
    writeWindowMs:  60_000,   writeMax:  int(env.RATE_WRITE, 60)
  },

  /* ---- Logging ---- */
  logs: {
    retentionDays: int(env.LOG_RETENTION_DAYS, 90),
    securityRetentionDays: int(env.SECURITY_LOG_RETENTION_DAYS, 365),
    console: bool(env.LOG_CONSOLE, !isProd)
  },

  /** First account to register gets this role when the table is empty. */
  bootstrapOwnerEmail: env.BOOTSTRAP_OWNER_EMAIL || ''
};

/** A single place to see what is and is not wired up. */
export function integrationStatus() {
  return {
    database:  { ok: true, detail: config.db.driver },
    fivem:     { ok: !!config.fivem.host, detail: config.fivem.host || 'FIVEM_HOST not set' },
    gameDb:    { ok: config.fivem.gameDb.enabled, detail: config.fivem.gameDb.database || 'GAME_DB_ENABLED is false' },
    discord:   { ok: config.discord.enabled, detail: config.discord.enabled ? 'OAuth2 configured' : 'DISCORD_CLIENT_ID/SECRET not set' },
    discordBot:{ ok: !!config.discord.botToken, detail: config.discord.botToken ? 'bot token present' : 'DISCORD_BOT_TOKEN not set' },
    payments:  {
      ok: config.payments.enabled,
      detail: config.payments.enabled
        ? `${config.payments.provider}${config.payments.sandbox ? ' (sandbox)' : ''}`
        : (config.payments.provider === 'zarinpal' ? 'ZARINPAL_MERCHANT_ID not set' : 'PAYMENT_PROVIDER is none')
    },
    webhook:   { ok: !!config.payments.webhookSecret, detail: config.payments.webhookSecret ? 'signature verification on' : 'PAYMENT_WEBHOOK_SECRET not set' }
  };
}

export default config;
