#!/usr/bin/env node
/**
 * ROYAL RP - one-command setup
 * ---------------------------------------------------------------
 * Creates the databases, the two least-privilege accounts, and
 * backend/.env, in one go:
 *
 *   node tools/setup.js
 *
 * It talks to MariaDB through mysql2, which npm already installed, so
 * there is no need to find mysql.exe on a Windows box where it is
 * usually not on the PATH.
 *
 * What it makes:
 *   royalrp_web   database + account with rights on that database only
 *   royalrp_read  account with SELECT on the game database only
 *   royal_vip     the one table the VIP feature needs, in the game DB
 *   backend/.env  passwords generated, SESSION_SECRET generated, and
 *                 FIVEM_API_TOKEN read from royal-web-bridge
 *
 * The site never writes to the game database - purchases go through
 * the bridge resource - so read-only there costs nothing.
 *
 * Options:
 *   --root-pass=...   MariaDB root password (asked for if omitted)
 *   --skip-db         only write backend/.env
 *   --game-db=volta   name of the game database
 * ---------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV = path.join(ROOT, 'backend', '.env');
const EXAMPLE = path.join(ROOT, 'backend', '.env.example');
const BRIDGE_CFG = path.join(ROOT, '..', 'royal-web-bridge', 'config.lua');

const arg = (n) => {
  const h = process.argv.find(a => a.startsWith(`--${n}=`));
  return h ? h.slice(n.length + 3) : null;
};
const has = (n) => process.argv.includes(`--${n}`);

const GAME_DB = arg('game-db') || 'volta';
const SKIP_DB = has('skip-db');

const read = (f) => fs.readFileSync(f, 'utf8');
const get = (t, k) => (t.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1] ?? null;
const set = (t, k, v) => {
  const re = new RegExp(`^${k}=.*$`, 'm');
  return re.test(t) ? t.replace(re, `${k}=${v}`) : `${t.replace(/\n*$/, '\n')}${k}=${v}\n`;
};

/** Readable, shell-safe, and long enough that nobody needs to think about it. */
const password = () => crypto.randomBytes(18).toString('base64url');

const fail = (msg) => { console.error(`\n  ${msg}\n`); process.exit(1); };

console.log('\n  Royal RP - setup');
console.log('  ---------------------------------------------');

if (fs.existsSync(ENV)) {
  const t = read(ENV);
  const blank = ['SESSION_SECRET', 'DB_PASSWORD', 'GAME_DB_PASSWORD']
    .filter(k => !(get(t, k) || '').trim());
  console.log('  backend/.env already exists, leaving it alone.');
  if (blank.length) {
    console.log(`\n  Still blank: ${blank.join(', ')}`);
    console.log('  Fill them in, or delete backend/.env and run this again.\n');
    process.exit(1);
  }
  console.log('  Every required value is set.');
  console.log('\n  Next:  node backend/database/init.js');
  console.log('         node backend/database/seed.js');
  console.log('         start-website.bat\n');
  process.exit(0);
}

if (!fs.existsSync(EXAMPLE)) fail(`Cannot find ${EXAMPLE}. Run this from the website folder.`);

let env = read(EXAMPLE);
let dbPass = password();
let gamePass = password();

/* ===============================================================
   1. databases and accounts
   =============================================================== */
if (SKIP_DB) {
  console.log('  [skip] --skip-db: not touching MariaDB.');
  dbPass = arg('db-pass') || fail('--skip-db needs --db-pass=... and --game-pass=...');
  gamePass = arg('game-pass') || fail('--skip-db needs --db-pass=... and --game-pass=...');
} else {
  let mysql;
  try { mysql = (await import('mysql2/promise')).default; }
  catch { fail('mysql2 is not installed. Run: npm ci --omit=dev'); }

  let rootPass = arg('root-pass');
  if (rootPass === null) {
    if (!stdin.isTTY) fail('No console to ask on. Use --root-pass=... (empty is --root-pass=)');
    const rl = readline.createInterface({ input: stdin, output: stdout });
    console.log('\n  MariaDB is already on this machine - it is what the game server uses.');
    rootPass = await rl.question('  MySQL root password (blank if none) : ');
    rl.close();
  }

  const host = get(env, 'DB_HOST') || '127.0.0.1';
  const port = Number(get(env, 'DB_PORT') || 3306);

  let c;
  try {
    c = await mysql.createConnection({ host, port, user: 'root', password: rootPass, multipleStatements: true });
  } catch (err) {
    fail(`Could not connect to MariaDB at ${host}:${port} as root.\n  ${err.message}\n\n` +
         '  Is MariaDB running? It is the same server the game uses.');
  }
  console.log(`\n  [ok]   connected to MariaDB at ${host}:${port}`);

  const [gdb] = await c.query('SHOW DATABASES LIKE ?', [GAME_DB]);
  if (!gdb.length) {
    console.log(`  [warn] game database "${GAME_DB}" not found on this server.`);
    console.log('         Character data will be unavailable until GAME_DB_NAME is right.');
  }

  await c.query(
    `CREATE DATABASE IF NOT EXISTS \`royalrp_web\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log('  [ok]   database royalrp_web');

  // CREATE USER IF NOT EXISTS leaves an existing password alone, which
  // would leave .env disagreeing with MariaDB. ALTER after it so the
  // two always match, and re-running stays safe.
  for (const [user, pass] of [['royalrp_web', dbPass], ['royalrp_read', gamePass]]) {
    await c.query(`CREATE USER IF NOT EXISTS ?@'localhost' IDENTIFIED BY ?`, [user, pass]);
    await c.query(`ALTER USER ?@'localhost' IDENTIFIED BY ?`, [user, pass]);
  }
  await c.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
       ON \`royalrp_web\`.* TO 'royalrp_web'@'localhost'`);
  console.log('  [ok]   user royalrp_web   (its own database only)');

  if (gdb.length) {
    await c.query(
      `CREATE TABLE IF NOT EXISTS \`${GAME_DB}\`.royal_vip (
         identifier  VARCHAR(60)  NOT NULL,
         tier        VARCHAR(24)  NOT NULL,
         expires_at  DATETIME     NULL,
         granted_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
         PRIMARY KEY (identifier),
         KEY idx_royal_vip_expires (expires_at)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log(`  [ok]   table royal_vip in \`${GAME_DB}\``);

    await c.query(`GRANT SELECT ON \`${GAME_DB}\`.* TO 'royalrp_read'@'localhost'`);
    console.log(`  [ok]   user royalrp_read  (SELECT on ${GAME_DB} only)`);
  }

  await c.query('FLUSH PRIVILEGES');
  await c.end();
}

/* ===============================================================
   2. backend/.env
   =============================================================== */
env = set(env, 'SESSION_SECRET', crypto.randomBytes(32).toString('hex'));
env = set(env, 'DB_PASSWORD', dbPass);
env = set(env, 'GAME_DB_PASSWORD', gamePass);
env = set(env, 'GAME_DB_NAME', GAME_DB);
console.log('\n  [ok]   SESSION_SECRET generated');

let token = null;
if (fs.existsSync(BRIDGE_CFG)) {
  token = (read(BRIDGE_CFG).match(/Config\.Token\s*=\s*'([^']+)'/) || [])[1] || null;
}
if (token) {
  env = set(env, 'FIVEM_API_TOKEN', token);
  console.log(`  [ok]   FIVEM_API_TOKEN read from royal-web-bridge (${token.slice(0, 8)}...)`);
} else {
  console.log('  [warn] royal-web-bridge/config.lua not found next to this folder.');
  console.log('         Set FIVEM_API_TOKEN by hand, then run: npm run bridge:sync');
}

fs.writeFileSync(ENV, env, 'utf8');
console.log('  [ok]   wrote backend/.env\n');

for (const k of ['NODE_ENV', 'PORT', 'PUBLIC_URL', 'DB_HOST', 'DB_USER', 'DB_NAME',
                 'GAME_DB_ENABLED', 'GAME_DB_USER', 'GAME_DB_NAME', 'FIVEM_HOST']) {
  console.log(`         ${k.padEnd(16)} ${get(env, k)}`);
}

console.log('\n  ---------------------------------------------');
console.log('  The generated passwords are in backend/.env.');
console.log('  Nothing else needs them, so there is nothing to write down.');
console.log('\n  Next:  node backend/database/init.js');
console.log('         node backend/database/seed.js');
console.log('         start-website.bat\n');
