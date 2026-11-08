#!/usr/bin/env node
/**
 * ROYAL RP - create backend/.env
 * ---------------------------------------------------------------
 * Writing the config by hand is where installs go wrong: a forgotten
 * SESSION_SECRET stops the server booting, and Notepad likes to save
 * ".env" as ".env.txt". This asks for the two passwords, works the
 * rest out, and writes the file itself.
 *
 *   node tools/setup-env.js
 *
 * Re-running it never overwrites an existing .env. It reports which
 * required values are still blank and stops.
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

/** Values the server refuses to start without. */
const REQUIRED = ['SESSION_SECRET', 'DB_PASSWORD', 'GAME_DB_PASSWORD'];

const read = (f) => fs.readFileSync(f, 'utf8');
const get = (text, key) => (text.match(new RegExp(`^${key}=(.*)$`, 'm')) || [])[1] ?? null;

function set(text, key, value) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(text)
    ? text.replace(re, `${key}=${value}`)
    : `${text.replace(/\n*$/, '\n')}${key}=${value}\n`;
}

console.log('\n  Royal RP - configuration\n  ---------------------------------------------');

/* ---------------------------------------------------------------
   Already configured? Report and stop, never clobber.
   --------------------------------------------------------------- */
if (fs.existsSync(ENV)) {
  const text = read(ENV);
  const blank = REQUIRED.filter(k => !(get(text, k) || '').trim());
  console.log('  backend/.env already exists, leaving it alone.');
  if (blank.length) {
    console.log(`\n  Still blank: ${blank.join(', ')}`);
    console.log('  Fill those in, or delete backend/.env and run this again.\n');
    process.exit(1);
  }
  console.log('  Every required value is set.\n');
  process.exit(0);
}

if (!fs.existsSync(EXAMPLE)) {
  console.error(`\n  Cannot find ${EXAMPLE}\n  Run this from the website folder.\n`);
  process.exit(1);
}

let env = read(EXAMPLE);

/* ---------------------------------------------------------------
   Things we can work out without asking
   --------------------------------------------------------------- */
env = set(env, 'SESSION_SECRET', crypto.randomBytes(32).toString('hex'));
console.log('  [ok]   SESSION_SECRET generated');

// The bridge resource sits next to this folder and already holds a
// token, so there is no reason to make anyone copy it across by hand.
let token = null;
if (fs.existsSync(BRIDGE_CFG)) {
  token = (read(BRIDGE_CFG).match(/Config\.Token\s*=\s*'([^']+)'/) || [])[1] || null;
}
if (token) {
  env = set(env, 'FIVEM_API_TOKEN', token);
  console.log(`  [ok]   FIVEM_API_TOKEN read from royal-web-bridge (${token.slice(0, 8)}...)`);
} else {
  console.log('  [warn] royal-web-bridge/config.lua not found next to this folder.');
  console.log('         Set FIVEM_API_TOKEN by hand, or run: npm run bridge:sync');
}

/* ---------------------------------------------------------------
   The two we have to ask for
   --------------------------------------------------------------- */
const arg = (name) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

let dbPass = arg('db-pass');
let gamePass = arg('game-pass');

if (!dbPass || !gamePass) {
  // Prompting needs a real console. Piped or redirected input cannot
  // answer two questions reliably, so say what to pass instead of
  // hanging on a prompt nobody can see.
  if (!stdin.isTTY) {
    console.error(
      '\n  No console to ask on. Pass them as arguments instead:\n' +
      '\n    node tools/setup-env.js --db-pass=... --game-pass=...\n'
    );
    process.exit(1);
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  console.log('\n  The two passwords you chose in tools/create-db-users.sql:\n');
  if (!dbPass) dbPass = (await rl.question('  royalrp_web  (website database) : ')).trim();
  if (!gamePass) gamePass = (await rl.question('  royalrp_read (game database)   : ')).trim();
  rl.close();
}

if (!dbPass || !gamePass) {
  console.error('\n  Both passwords are needed. Nothing was written.\n');
  process.exit(1);
}

env = set(env, 'DB_PASSWORD', dbPass);
env = set(env, 'GAME_DB_PASSWORD', gamePass);

fs.writeFileSync(ENV, env, 'utf8');

/* ---------------------------------------------------------------
   Report what the file now says
   --------------------------------------------------------------- */
console.log(`\n  [ok]   wrote ${path.relative(ROOT, ENV).replace(/\\/g, '/')}\n`);
for (const k of ['NODE_ENV', 'PORT', 'PUBLIC_URL', 'DB_HOST', 'DB_USER', 'DB_NAME',
                 'GAME_DB_ENABLED', 'GAME_DB_USER', 'GAME_DB_NAME', 'FIVEM_HOST']) {
  console.log(`         ${k.padEnd(16)} ${get(env, k)}`);
}

const stillBlank = REQUIRED.filter(k => !(get(env, k) || '').trim());
if (stillBlank.length) {
  console.log(`\n  [warn] still blank: ${stillBlank.join(', ')}\n`);
  process.exit(1);
}

console.log('\n  ---------------------------------------------');
console.log('  Next:  node backend/database/init.js');
console.log('         node backend/database/seed.js');
console.log('         start-website.bat\n');
