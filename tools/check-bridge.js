#!/usr/bin/env node
/**
 * ROYAL RP - test the FiveM bridge
 * ---------------------------------------------------------------
 * /api/server/status reports `connected: true` as soon as FXServer's
 * own info.json answers, which says nothing about whether our bridge
 * resource is running. This asks the bridge directly and explains
 * whatever comes back.
 *
 *   node tools/check-bridge.js
 * ---------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV = path.join(ROOT, 'backend', '.env');
const BRIDGE_CFG = path.join(ROOT, '..', 'royal-web-bridge', 'config.lua');

const read = (f) => fs.readFileSync(f, 'utf8');
const envVal = (t, k) => (t.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim() ?? '';

console.log('\n  Royal RP - bridge check');
console.log('  ---------------------------------------------');

if (!fs.existsSync(ENV)) {
  console.error('\n  backend/.env not found. Run: npm run setup\n');
  process.exit(1);
}

const env = read(ENV);
const host = envVal(env, 'FIVEM_HOST');
const token = envVal(env, 'FIVEM_API_TOKEN');

if (!host) { console.error('\n  FIVEM_HOST is not set in backend/.env\n'); process.exit(1); }
console.log(`  FIVEM_HOST        ${host}`);

if (!token) {
  console.error('\n  FIVEM_API_TOKEN is empty. Run: npm run bridge:sync\n');
  process.exit(1);
}
console.log(`  FIVEM_API_TOKEN   ${token.slice(0, 8)}...`);

/* The two sides must agree, and only config.lua is read by the game. */
if (fs.existsSync(BRIDGE_CFG)) {
  const luaToken = (read(BRIDGE_CFG).match(/Config\.Token\s*=\s*'([^']+)'/) || [])[1] || '';
  if (luaToken === 'REPLACE_ME' || !luaToken) {
    console.log('  config.lua        token not set   -> run: npm run bridge:sync');
  } else if (luaToken !== token) {
    console.log(`  config.lua        ${luaToken.slice(0, 8)}...  MISMATCH`);
    console.log('\n  The website and the resource hold different tokens.');
    console.log('  Fix:  npm run bridge:sync');
    console.log('  then in the FXServer console:  restart royal-web-bridge\n');
    process.exit(1);
  } else {
    console.log('  config.lua        matches');
  }
} else {
  console.log('  config.lua        not found next to this folder');
}

const base = host.startsWith('http') ? host : `http://${host}`;

async function hit(url, headers = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, json, text };
  } catch (err) {
    return { ok: false, status: 0, error: err.name === 'AbortError' ? 'timed out' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

console.log('\n  ---------------------------------------------');

/* 1. is FXServer itself up? */
const info = await hit(`${base}/info.json`);
if (!info.ok) {
  console.error(`\n  [fail] FXServer is not answering on ${host}`);
  console.error(`         ${info.error || 'status ' + info.status}`);
  console.error('\n  Is the game server running? Is FIVEM_HOST the right port?\n');
  process.exit(1);
}
console.log('  [ok]   FXServer answers on ' + host);

/* 2. is the bridge resource answering? */
const st = await hit(`${base}/royal-web-bridge/status`, { 'X-Royal-Token': token });

if (st.status === 404) {
  console.error('\n  [fail] the bridge resource is not running (404)');
  console.error('\n  In the FXServer console:');
  console.error('      refresh');
  console.error('      ensure royal-web-bridge');
  console.error('\n  If it refuses to start, look for an error above it in the');
  console.error('  console: it needs oxmysql and VoltaBase started first.\n');
  process.exit(1);
}

if (st.status === 401) {
  console.error('\n  [fail] the bridge rejected us (401)');
  console.error('\n  Either the token does not match, or our address is not in');
  console.error('  Config.AllowedIPs. The FXServer console says which:');
  console.error('      "bad bridge token"        -> npm run bridge:sync, then');
  console.error('                                   restart royal-web-bridge');
  console.error('      "rejected bridge call"    -> add this machine to');
  console.error('                                   Config.AllowedIPs\n');
  process.exit(1);
}

if (!st.ok) {
  console.error(`\n  [fail] the bridge answered ${st.status}`);
  console.error(`         ${(st.text || st.error || '').slice(0, 200)}\n`);
  process.exit(1);
}

console.log('  [ok]   bridge answers and accepted the token');

const d = st.json || {};
console.log('\n  reported by the bridge:');
for (const [k, v] of Object.entries(d)) {
  if (v === null || v === undefined) continue;
  const shown = Array.isArray(v) ? `${v.length} entries` : String(v);
  console.log(`         ${k.padEnd(16)} ${shown.slice(0, 60)}`);
}

console.log('\n  ---------------------------------------------');
console.log('  The bridge is working. Purchases can be delivered.\n');
