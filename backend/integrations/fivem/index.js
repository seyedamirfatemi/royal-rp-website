/**
 * ROYAL RP - FiveM integration (server side)
 * ---------------------------------------------------------------
 * Two independent channels to the game server:
 *
 *   1. HTTP  - the built-in /info.json and /players.json endpoints,
 *              plus our own `royal-web-bridge` resource for actions
 *              that need to happen live (give vehicle, add money).
 *
 *   2. MySQL - a direct, mostly-read connection to the SAME database
 *              the server uses through oxmysql, for character data.
 *
 * Both are optional. With neither configured the API answers
 * `{ connected: false }` and the UI says so instead of inventing data.
 *
 * IMPORTANT: the adapters below do NOT guess table or column names.
 * `detectFramework()` inspects the live schema, and each adapter
 * verifies the columns it needs exist before it runs a query. When
 * the real server source arrives, adjust the maps at the top of
 * esx.js / qbcore.js / qbox.js to match it exactly.
 * ---------------------------------------------------------------
 */
import { config } from '../../config/index.js';
import { log } from '../../services/logger.js';

let gamePool = null;
let adapter = null;
let detectedFramework = null;
let lastDetectAttempt = 0;

/* ===============================================================
   GAME DATABASE CONNECTION
   =============================================================== */
export async function gameDb() {
  if (!config.fivem.gameDb.enabled) return null;
  if (gamePool) return gamePool;

  let mysql;
  try {
    mysql = (await import('mysql2/promise')).default;
  } catch {
    await log({
      category: 'error', severity: 'error', source: 'system',
      message: 'GAME_DB_ENABLED is true but mysql2 is not installed. Run: npm install mysql2'
    });
    return null;
  }

  try {
    gamePool = mysql.createPool({
      host: config.fivem.gameDb.host,
      port: config.fivem.gameDb.port,
      user: config.fivem.gameDb.user,
      password: config.fivem.gameDb.password,
      database: config.fivem.gameDb.database,
      connectionLimit: 5,
      waitForConnections: true,
      dateStrings: true
    });
    await gamePool.query('SELECT 1');
    await log({
      category: 'server.event', severity: 'success', source: 'system',
      message: `اتصال به دیتابیس بازی «${config.fivem.gameDb.database}» برقرار شد`
    });
    return gamePool;
  } catch (err) {
    gamePool = null;
    await log({
      category: 'error', severity: 'error', source: 'system',
      message: `اتصال به دیتابیس بازی ممکن نشد: ${err.message}`
    });
    return null;
  }
}

/** Parameterised query against the game database. */
export async function gameQuery(sql, params = []) {
  const pool = await gameDb();
  if (!pool) return null;
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Which tables actually exist in the game database. */
export async function gameTables() {
  const rows = await gameQuery(
    `SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
    [config.fivem.gameDb.database]
  );
  return rows ? rows.map(r => String(r.t || r.TABLE_NAME).toLowerCase()) : [];
}

/** Which columns a given table has. Adapters use this before querying. */
export async function gameColumns(table) {
  const rows = await gameQuery(
    `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [config.fivem.gameDb.database, table]
  );
  return rows ? rows.map(r => String(r.c || r.COLUMN_NAME)) : [];
}

/* ===============================================================
   FRAMEWORK DETECTION
   Looks at the real schema instead of trusting configuration.
   =============================================================== */
export async function detectFramework() {
  if (config.fivem.framework !== 'auto') return config.fivem.framework;
  if (detectedFramework) return detectedFramework;
  if (Date.now() - lastDetectAttempt < 60000) return detectedFramework;
  lastDetectAttempt = Date.now();

  const tables = await gameTables();
  if (!tables.length) return null;

  const has = (t) => tables.includes(t);

  // QBCore and Qbox both use `players` with a `citizenid` column.
  if (has('players')) {
    const cols = await gameColumns('players');
    const lower = cols.map(c => c.toLowerCase());
    if (lower.includes('citizenid')) {
      // Qbox keeps QBCore's shape but adds `player_vehicles.vehicle` metadata
      // and an `ox_inventory`-style stash. Treat as qbox when ox tables exist.
      detectedFramework = has('ox_inventory') || has('ox_doorlock') ? 'qbox' : 'qbcore';
    }
  }

  // ESX family: `users` keyed by `identifier`.
  if (!detectedFramework && has('users')) {
    const cols = (await gameColumns('users')).map(c => c.toLowerCase());
    if (cols.includes('identifier')) {
      /**
       * VoltaBase is an ESX derivative, but it stores money in three
       * flat INT columns instead of the `accounts` JSON blob, and adds
       * `gang` / `gang_grade` / `coin` to `users`. Stock ESX has none
       * of that, so this combination identifies it unambiguously and
       * the dedicated adapter gets loaded instead of the ESX one.
       */
      const isVolta = cols.includes('bank')
                   && cols.includes('black_money')
                   && cols.includes('gang_grade')
                   && !cols.includes('accounts');
      detectedFramework = isVolta ? 'volta' : 'esx';
    }
  }

  if (detectedFramework) {
    await log({
      category: 'server.event', severity: 'success', source: 'system',
      message: `فریم‌ورک FiveM تشخیص داده شد: ${detectedFramework}`
    });
  } else {
    await log({
      category: 'server.event', severity: 'warning', source: 'system',
      message: 'Could not detect the framework from the game database schema. Set FIVEM_FRAMEWORK explicitly.'
    });
  }
  return detectedFramework;
}

/* ===============================================================
   ADAPTER LOADING
   =============================================================== */
export async function getAdapter() {
  if (adapter) return adapter;

  const fw = await detectFramework();
  if (!fw) return null;

  try {
    const mod = await import(`./${fw}.js`);
    adapter = mod.default || mod;
    adapter.framework = fw;
    return adapter;
  } catch (err) {
    await log({
      category: 'error', severity: 'error', source: 'system',
      message: `آداپتوری برای فریم‌ورک «${fw}» وجود ندارد: ${err.message}`
    });
    return null;
  }
}

export function resetAdapter() { adapter = null; detectedFramework = null; }

/* ===============================================================
   SERVER HTTP ENDPOINTS
   info.json and players.json are served by FiveM itself.
   =============================================================== */
const cache = new Map();

async function cachedFetch(path, ms = config.fivem.cacheMs) {
  if (!config.fivem.host) return null;

  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ms) return hit.data;

  const base = /^https?:\/\//.test(config.fivem.host)
    ? config.fivem.host.replace(/\/$/, '')
    : `http://${config.fivem.host}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.fivem.timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      signal: ctrl.signal,
      headers: config.fivem.apiToken ? { 'X-Royal-Token': config.fivem.apiToken } : {}
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    cache.set(path, { at: Date.now(), data });
    return data;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function serverInfo()    { return cachedFetch('/info.json', 60000); }
export async function serverPlayers() { return cachedFetch('/players.json', 5000); }
export async function serverDynamic() { return cachedFetch('/dynamic.json', 5000); }

/**
 * Extra data from our own resource (resource list, tick times).
 * Returns null until royal-web-bridge is installed - the status page
 * then simply omits those figures rather than inventing them.
 */
export async function bridgeStatus() {
  if (!config.fivem.apiToken) return null;
  return cachedFetch('/royal-web-bridge/status', 5000);
}

/** Ask the bridge resource to perform a live action. */
export async function bridgeAction(action, payload = {}) {
  if (!config.fivem.host || !config.fivem.apiToken) {
    throw new Error('FiveM bridge is not configured (FIVEM_HOST / FIVEM_API_TOKEN)');
  }
  const base = /^https?:\/\//.test(config.fivem.host)
    ? config.fivem.host.replace(/\/$/, '')
    : `http://${config.fivem.host}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.fivem.timeoutMs);
  try {
    const res = await fetch(`${base}/royal-web-bridge/${action}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'X-Royal-Token': config.fivem.apiToken },
      body: JSON.stringify(payload)
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`bridge responded ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ===============================================================
   PUBLIC STATUS
   =============================================================== */
export async function status() {
  const [info, players, dynamic, bridge] = await Promise.all([
    serverInfo(), serverPlayers(), serverDynamic(), bridgeStatus()
  ]);

  const connected = !!(info || players || dynamic);

  if (!connected) {
    return {
      connected: false,
      online: false,
      demo: false,
      players: 0,
      maxPlayers: config.fivem.maxPlayers,
      queue: 0,
      hostname: null,
      message: 'سایت هنوز به سرور FiveM متصل نیست. مقدار FIVEM_HOST را در backend/.env تنظیم کنید.'
    };
  }

  const vars = info?.vars || {};
  return {
    connected: true,
    online: true,
    demo: false,
    players: Array.isArray(players) ? players.length : (dynamic?.clients ?? 0),
    maxPlayers: Number(dynamic?.sv_maxclients || vars.sv_maxClients || config.fivem.maxPlayers),
    queue: bridge?.queue ?? 0,
    hostname: dynamic?.hostname || vars.sv_projectName || null,
    gametype: dynamic?.gametype || null,
    mapname: dynamic?.mapname || null,
    framework: await detectFramework(),
    resourceCount: Array.isArray(info?.resources) ? info.resources.length : (bridge?.resourceCount ?? 0),
    tickMs: bridge?.tickMs ?? null,
    cpuPercent: bridge?.cpuPercent ?? null,
    memoryPercent: bridge?.memoryPercent ?? null,
    uptimeSeconds: bridge?.uptimeSeconds ?? null,
    lastRestart: bridge?.lastRestart ?? null
  };
}

export async function playerList() {
  const players = await serverPlayers();
  if (!Array.isArray(players)) return [];
  return players.map(p => ({
    serverId: p.id,
    name: p.name,
    ping: p.ping,
    identifiers: p.identifiers || []
  }));
}

export async function resourceList() {
  const bridge = await bridgeStatus();
  if (bridge?.resources) return bridge.resources;

  const info = await serverInfo();
  if (Array.isArray(info?.resources)) {
    // info.json gives names only; timings need the bridge resource.
    return info.resources.map(name => ({ name, state: 'started', ms: 0, memoryMb: 0 }));
  }
  return [];
}

export default {
  gameDb, gameQuery, gameTables, gameColumns,
  detectFramework, getAdapter, resetAdapter,
  serverInfo, serverPlayers, serverDynamic, bridgeStatus, bridgeAction,
  status, playerList, resourceList
};
