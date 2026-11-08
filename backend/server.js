#!/usr/bin/env node
/**
 * ROYAL RP - API server
 * ---------------------------------------------------------------
 *   npm run server       start
 *   npm run server:dev   start with --watch
 *
 * Serves the REST API on /api, a WebSocket on /ws for live data,
 * and (optionally) the front-end itself so one process runs the
 * whole site in production.
 * ---------------------------------------------------------------
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { WebSocketServer } from 'ws';

import { config, ROOT, integrationStatus } from './config/index.js';
import { db } from './database/db.js';
import {
  attachUser, csrfProtection, limitGlobal, extraSecurityHeaders,
  notFoundHandler, errorHandler
} from './middleware/index.js';

import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shop.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin.js';
import { orderRouter, paymentRouter } from './routes/orders.js';
import { serverRouter, newsRouter, contentRouter, ticketRouter, contactRouter } from './routes/content.js';

import { log, onLive, sweepRetention } from './services/logger.js';
import { readSession } from './services/sessions.js';
import { can } from './config/roles.js';
import { retryPendingDeliveries, expireEntitlements } from './services/delivery.js';
import fivem from './integrations/fivem/index.js';

const app = express();
app.disable('x-powered-by');
if (config.server.trustProxy) app.set('trust proxy', 1);

/* ===============================================================
   SECURITY HEADERS
   ---------------------------------------------------------------
   Three of these headers only make sense on a secure origin, and one
   of them breaks the site outright without TLS:

   upgrade-insecure-requests tells the browser to fetch every
   subresource over https. Behind TLS that is exactly right. On a
   plain-http origin every stylesheet, script and image fails with
   ERR_SSL_PROTOCOL_ERROR and the page renders as unstyled text.

   So they are keyed on whether the site is actually served over
   https, which PUBLIC_URL states, rather than on NODE_ENV. A
   production server reached by IP before its certificate exists is
   still production; it just is not secure yet.
   =============================================================== */
const servesHttps = /^https:/i.test(config.server.publicUrl || '');

app.use(helmet({
  // Both are ignored by the browser on an insecure origin, and warn
  // about it in the console. Nothing is lost by not sending them.
  crossOriginOpenerPolicy: servesHttps,
  originAgentCluster: servesHttps,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      // The UI sets a handful of computed styles inline (chart bars,
      // progress widths), so inline styles are allowed; inline SCRIPT
      // is not, which is the directive that actually stops XSS.
      'style-src': ["'self'", "'unsafe-inline'"],
      // All four font families are self-hosted in assets/fonts, so no
      // third-party font origin is needed.
      'font-src': ["'self'", 'data:'],
      'img-src': ["'self'", 'data:', 'blob:', 'https://cdn.discordapp.com'],
      'connect-src': ["'self'", 'ws:', 'wss:', 'https://discord.com'],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'upgrade-insecure-requests': servesHttps ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(extraSecurityHeaders);

/* ===============================================================
   CORS
   Credentialed requests, so the origin allow-list must be explicit.
   =============================================================== */
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);              // curl, same-origin
    if (config.server.corsOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Royal-Signature', 'Stripe-Signature'],
  maxAge: 600
}));

/* ===============================================================
   BODY PARSING
   The webhook route needs the RAW bytes for signature verification,
   so it is mounted before the JSON parser.
   =============================================================== */
app.use('/api/payments/webhook', express.raw({ type: '*/*', limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

app.use(limitGlobal);
app.use(attachUser);

/* ===============================================================
   HEALTH (no auth, no CSRF - used by the front-end to decide
   between live mode and demo mode)
   =============================================================== */
app.get('/api/health', async (req, res) => {
  // The detected framework is operational information the admin panel
  // shows, and detectFramework() caches, so asking for it here is cheap.
  let framework = null;
  try {
    const fivem = await import('./integrations/fivem/index.js');
    framework = await fivem.detectFramework();
  } catch { /* game database unreachable: report null, never a guess */ }

  res.json({
    ok: true,
    name: 'royal-rp-api',
    version: '1.0.0',
    env: config.env,
    time: new Date().toISOString(),
    database: db.getDriver(),
    framework,
    integrations: integrationStatus()
  });
});

/* ===============================================================
   API ROUTES
   =============================================================== */
const api = express.Router();

// CSRF applies to every mutating API call except the signed webhook.
api.use(csrfProtection);

api.use('/auth', authRoutes);
api.use('/shop', shopRoutes);
api.use('/orders', orderRouter);
api.use('/payments', paymentRouter);
api.use('/me', meRoutes);
api.use('/server', serverRouter);
api.use('/news', newsRouter);
api.use('/content', contentRouter);
api.use('/tickets', ticketRouter);
api.use('/contact', contactRouter);
api.use('/admin', adminRoutes);

app.use('/api', api);

/* ===============================================================
   STATIC FRONT-END (optional)
   =============================================================== */
if (config.server.serveStatic) {
  /* Caching depends on whether a file's name changes when its content
     does. The build gives the code chunks a content hash, so those can
     be cached forever. The two entry points cannot: royal.min.css and
     app.js keep the same name across deploys, so a long max-age pins
     every visitor to the version they first loaded - a CSS fix would
     not reach anyone for a week. They revalidate instead, which costs
     one conditional request and answers 304 when nothing changed. */
  const IMMUTABLE = /chunk-[A-Za-z0-9_-]+\.(js|css)$/;
  const REVALIDATE = /(royal\.min\.css|app\.js|\.json)$/;

  const staticOpts = {
    maxAge: config.isProd ? '1d' : 0,
    setHeaders(res, filePath) {
      if (/\.html$/.test(filePath) || REVALIDATE.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (IMMUTABLE.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  };
  for (const dir of ['css', 'js', 'assets', 'locales', 'pages']) {
    app.use(`/${dir}`, express.static(path.join(ROOT, dir), staticOpts));
  }
  // Operator-uploaded media. Served read-only; nothing here is executed.
  app.use('/uploads', express.static(config.uploads.dir, {
    maxAge: config.isProd ? '30d' : 0,
    setHeaders(res) { res.setHeader('Content-Disposition', 'inline'); }
  }));
  app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
  app.get('/index.html', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

  // Anything else that is not /api falls back to the 404 page.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    const notFoundPage = path.join(ROOT, 'pages', '404.html');
    if (fs.existsSync(notFoundPage)) return res.status(404).sendFile(notFoundPage);
    next();
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

/* ===============================================================
   WEBSOCKET
   Channels:
     server:status   public, broadcast every 10s
     admin:logs      requires logs.read, streams new log lines
   =============================================================== */
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (req, socket, head) => {
  if (!req.url.startsWith('/ws')) { socket.destroy(); return; }

  // Reuse the HTTP session: parse cookies off the upgrade request.
  const cookies = Object.fromEntries(
    String(req.headers.cookie || '').split(';').map(c => {
      const i = c.indexOf('=');
      return i === -1 ? [c.trim(), ''] : [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
    }).filter(([k]) => k)
  );

  let session = null;
  try { session = await readSession({ cookies }); } catch { /* anonymous */ }

  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.user = session?.user || null;
    ws.channels = new Set();
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw).slice(0, 2000)); } catch { return; }
    if (msg.type !== 'subscribe' || typeof msg.channel !== 'string') return;

    const channel = msg.channel.slice(0, 40);

    // Authorise each channel on subscribe.
    if (channel.startsWith('admin:')) {
      if (!ws.user || !can(ws.user.role, 'logs.read')) {
        ws.send(JSON.stringify({ type: 'error', data: { channel, reason: 'forbidden' } }));
        return;
      }
    }
    ws.channels.add(channel);
    ws.send(JSON.stringify({ type: 'subscribed', data: { channel } }));
  });
});

function broadcast(channel, type, data) {
  const payload = JSON.stringify({ type, channel, data });
  for (const ws of wss.clients) {
    if (ws.readyState === 1 && ws.channels?.has(channel)) {
      try { ws.send(payload); } catch { /* ignore a dead socket */ }
    }
  }
}

// New log lines -> admin:logs
onLive((entry) => broadcast('admin:logs', 'admin:log', entry));

// Keep-alive ping so dead sockets are reaped.
const pingTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  }
}, 30000);

/* ===============================================================
   BACKGROUND JOBS
   =============================================================== */
let statusTimer, sweepTimer, deliveryTimer;

function startJobs() {
  // Live server status broadcast
  statusTimer = setInterval(async () => {
    if (![...wss.clients].some(ws => ws.channels?.has('server:status'))) return;
    try { broadcast('server:status', 'server:status', await fivem.status()); } catch {}
  }, 10000);

  // Log retention + expired entitlements, hourly
  sweepTimer = setInterval(async () => {
    await sweepRetention();
    await expireEntitlements();
  }, 60 * 60 * 1000);

  // Retry stuck deliveries every 5 minutes
  deliveryTimer = setInterval(() => {
    retryPendingDeliveries().catch(() => {});
  }, 5 * 60 * 1000);
}

/* ===============================================================
   BOOT
   =============================================================== */
async function start() {
  const driver = await db.connect();

  // Make sure the schema exists before accepting traffic.
  const hasUsers = await db.get(
    driver === 'sqlite'
      ? `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
      : `SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    driver === 'sqlite' ? [] : [config.db.mysql.database]
  );
  if (!hasUsers) {
    console.error('\n  The database has no tables yet.\n  Run:  npm run db:init && npm run db:seed\n');
    process.exit(1);
  }

  await sweepRetention();
  await expireEntitlements();
  await retryPendingDeliveries();
  startJobs();

  server.listen(config.server.port, config.server.host, () => {
    const st = integrationStatus();
    console.log('\n  ============================================');
    console.log('   ROYAL RP API');
    console.log('  ============================================');
    console.log(`   http://localhost:${config.server.port}`);
    console.log(`   env       ${config.env}`);
    console.log(`   database  ${driver}`);
    console.log(`   websocket ws://localhost:${config.server.port}/ws`);
    if (config.server.serveStatic) console.log(`   front-end served from this process`);
    console.log('  --------------------------------------------');
    for (const [name, s] of Object.entries(st)) {
      console.log(`   ${s.ok ? '[ok]  ' : '[----]'} ${name.padEnd(11)} ${s.detail}`);
    }
    console.log('  ============================================\n');

    log({
      category: 'server.event', severity: 'success', source: 'system',
      message: `سرویس API روی پورت ${config.server.port} اجرا شد (${config.env})`
    }).catch(() => {});
  });
}

/* ---- graceful shutdown ---- */
async function shutdown(signal) {
  console.log(`\n  ${signal} received, shutting down...`);
  clearInterval(pingTimer);
  clearInterval(statusTimer);
  clearInterval(sweepTimer);
  clearInterval(deliveryTimer);

  for (const ws of wss.clients) { try { ws.close(1001, 'server shutting down'); } catch {} }

  server.close(async () => {
    try { await db.close(); } catch {}
    console.log('  Closed cleanly.\n');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('  Unhandled rejection:', reason);
  log({ category: 'error', severity: 'error', source: 'system',
        message: `Unhandled rejection: ${reason}` }).catch(() => {});
});

start().catch(err => {
  console.error('\n  Could not start the API:', err.message, '\n');
  process.exit(1);
});

export { app, server };
