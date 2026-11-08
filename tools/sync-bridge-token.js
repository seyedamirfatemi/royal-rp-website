#!/usr/bin/env node
/**
 * ROYAL RP - bridge setup
 * ---------------------------------------------------------------
 * Keeps the website and the FiveM resource in agreement, and makes
 * sure the one table the bridge writes to exists.
 *
 *   1. copies FIVEM_API_TOKEN from backend/.env into
 *      resources/royal-web-bridge/config.lua
 *   2. creates `royal_vip` in the GAME database if missing
 *   3. prints the lines to add to server.cfg
 *
 * Safe to re-run.
 *
 *   npm run bridge:sync
 * ---------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../backend/config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RESOURCES = path.resolve(ROOT, '..');
const BRIDGE = path.join(RESOURCES, 'royal-web-bridge');

function fail(msg) {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
}

console.log('\n  Royal RP bridge setup');
console.log('  ---------------------------------------------');

/* ---------------- 1. token ---------------- */
const token = config.fivem.apiToken;
if (!token) fail('FIVEM_API_TOKEN is empty in backend/.env. Generate one with:\n  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');

const cfgPath = path.join(BRIDGE, 'config.lua');
if (!fs.existsSync(cfgPath)) {
  fail(`Bridge resource not found at:\n  ${cfgPath}\n\n  Expected RoyalSite to sit beside royal-web-bridge inside resources/.`);
}

let lua = fs.readFileSync(cfgPath, 'utf8');
const before = lua;
lua = lua.replace(/Config\.Token\s*=\s*'[^']*'/, `Config.Token = '${token}'`);

if (lua === before && !lua.includes(`Config.Token = '${token}'`)) {
  fail('Could not find the Config.Token line in config.lua.');
}
fs.writeFileSync(cfgPath, lua, 'utf8');
console.log(`  [ok]   token synced  ${token.slice(0, 8)}... -> royal-web-bridge/config.lua`);

/* ---------------- 2. royal_vip table ---------------- */
if (!config.fivem.gameDb.enabled) {
  console.log('  [skip] game database disabled (GAME_DB_ENABLED=false) - royal_vip not created');
} else {
  let mysql;
  try {
    mysql = (await import('mysql2/promise')).default;
  } catch {
    fail('mysql2 is not installed. Run: npm install');
  }

  const g = config.fivem.gameDb;
  let conn;
  try {
    conn = await mysql.createConnection({
      host: g.host, port: g.port, user: g.user, password: g.password, database: g.database
    });
  } catch (err) {
    fail(`Could not connect to the game database "${g.database}": ${err.message}`);
  }

  /* The website's game-database account is deliberately read-only: the
     site never writes to the game. So creating royal_vip here is a
     best effort. When the account cannot create tables we only check
     that the table is already there, which is what the root-run
     tools/create-db-users.sql takes care of. */
  let created = true;
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS royal_vip (
        identifier  VARCHAR(60)  NOT NULL,
        tier        VARCHAR(24)  NOT NULL,
        expires_at  DATETIME     NULL,
        granted_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (identifier),
        KEY idx_royal_vip_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (err) {
    if (err.code !== 'ER_TABLEACCESS_DENIED_ERROR' && err.code !== 'ER_DBACCESS_DENIED_ERROR') throw err;
    created = false;
  }

  const [[{ n }]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'royal_vip'`, [g.database]);

  if (n) {
    console.log(`  [ok]   royal_vip present in \`${g.database}\`` +
                (created ? '' : ' (read-only account, created by the root setup script)'));
  } else {
    console.log(`  [warn] royal_vip is missing from \`${g.database}\` and "${g.user}" may not create it.`);
    console.log('         Run tools/create-db-users.sql as root, which creates it.');
  }

  // Confirm the columns the adapter needs are really there.
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME c FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`, [g.database]);
  const have = new Set(cols.map(r => String(r.c).toLowerCase()));
  const needed = ['identifier', 'money', 'bank', 'black_money', 'job', 'job_grade', 'gang', 'discord', 'coin'];
  const missing = needed.filter(c => !have.has(c));
  if (missing.length) {
    console.log(`  [warn] users is missing: ${missing.join(', ')} - those fields will show as unavailable`);
  } else {
    console.log(`  [ok]   users has every column the adapter needs`);
  }

  await conn.end();
}

/* ---------------- 3. server.cfg guidance ---------------- */
const cfgFile = path.join(RESOURCES, '..', 'server.cfg');
let alreadyEnsured = false;
if (fs.existsSync(cfgFile)) {
  alreadyEnsured = /^\s*ensure\s+royal-web-bridge\s*$/m.test(fs.readFileSync(cfgFile, 'utf8'));
}

console.log('  ---------------------------------------------');
if (alreadyEnsured) {
  console.log('  [ok]   server.cfg already ensures royal-web-bridge');
} else {
  console.log('  [todo] add this line to server.cfg, after "ensure [System]":\n');
  console.log('           ensure royal-web-bridge\n');
}
console.log(`  Website expects the bridge at: ${config.fivem.host || '(FIVEM_HOST not set)'}`);
console.log('  Then restart the server, or run in the console:  refresh; ensure royal-web-bridge\n');
