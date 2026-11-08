#!/usr/bin/env node
/**
 * ROYAL RP - point the site at a domain (or back at an IP)
 * ---------------------------------------------------------------
 * The public address appears in more than one place, and a half-changed
 * address breaks things quietly: Discord refuses an OAuth callback that
 * does not match, ZarinPal returns the customer to the wrong host, and
 * a cookie marked Secure never arrives over plain http. This script
 * changes all of them together.
 *
 *   node tools/set-domain.js royalrp.ir                 (https, www alias)
 *   node tools/set-domain.js shop.royalrp.ir --no-www
 *   node tools/set-domain.js 5.57.34.36:4000 --http     (back to an IP)
 *   node tools/set-domain.js royalrp.ir --dry-run       (show the diff only)
 *
 * What it writes:
 *   backend/.env   PUBLIC_URL, CORS_ORIGINS, COOKIE_SECURE, TRUST_PROXY,
 *                  DISCORD_REDIRECT_URI, PAYMENT_SUCCESS_URL, PAYMENT_CANCEL_URL
 *   js/config.js   server.ip / connect, only with --game-address
 *
 * It does NOT touch the FiveM connect address (FIVEM_PUBLIC_ADDRESS and
 * CONFIG.server.ip): players connect to the game port by IP, which is a
 * separate thing from the website's hostname. Use --game-address to set
 * that too.
 *
 * After running it: restart the backend, and update the redirect URL in
 * the Discord developer portal to match what this prints.
 * ---------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name) => {
  const hit = argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const host = argv.find(a => !a.startsWith('--'));
const DRY = flag('dry-run');
const HTTPS = !flag('http');
const WWW = !flag('no-www');
const GAME_ADDRESS = value('game-address');

if (!host) {
  console.error(`
  Usage: node tools/set-domain.js <domain-or-ip[:port]> [options]

    --http            serve over plain http (COOKIE_SECURE stays off)
    --no-www          do not add the www. alias to CORS_ORIGINS
    --game-address=   also set the FiveM connect address, e.g. 5.57.34.36:30120
    --dry-run         print what would change and write nothing
`);
  process.exit(1);
}

/* A bare hostname is fine; a scheme is not, because the flag decides it. */
if (/^https?:\/\//i.test(host)) {
  console.error('\n  Give the host without http:// or https:// - use --http if you need plain http.\n');
  process.exit(1);
}

const scheme = HTTPS ? 'https' : 'http';
const base = `${scheme}://${host}`;
const bareHost = host.split(':')[0];
const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(bareHost);

const origins = [base];
if (WWW && !isIp && !bareHost.startsWith('www.')) origins.push(`${scheme}://www.${bareHost}`);

const ENV_CHANGES = {
  PUBLIC_URL: base,
  CORS_ORIGINS: origins.join(','),
  // A Secure cookie is only sent over https, so switching it on under
  // plain http would silently sign everyone out.
  COOKIE_SECURE: String(HTTPS),
  // Behind nginx/Cloudflare, Express must trust X-Forwarded-* to see the
  // real protocol and client IP (rate limiting and audit logs depend on it).
  TRUST_PROXY: String(HTTPS),
  DISCORD_REDIRECT_URI: `${base}/api/auth/discord/callback`,
  PAYMENT_SUCCESS_URL: `${base}/pages/checkout.html?status=success`,
  PAYMENT_CANCEL_URL: `${base}/pages/checkout.html?status=cancelled`
};
if (GAME_ADDRESS) ENV_CHANGES.FIVEM_PUBLIC_ADDRESS = GAME_ADDRESS;

/* ---------------------------------------------------------------
   backend/.env
   --------------------------------------------------------------- */
function patchEnv(file) {
  if (!fs.existsSync(file)) return { file, missing: true, changes: [] };
  let text = fs.readFileSync(file, 'utf8');
  const changes = [];

  for (const [key, next] of Object.entries(ENV_CHANGES)) {
    const re = new RegExp(`^(${key})=(.*)$`, 'm');
    const found = text.match(re);
    if (found) {
      if (found[2].trim() === next) continue;
      changes.push([key, found[2].trim(), next]);
      text = text.replace(re, `${key}=${next}`);
    } else {
      changes.push([key, '(not set)', next]);
      text += `${text.endsWith('\n') ? '' : '\n'}${key}=${next}\n`;
    }
  }

  if (changes.length && !DRY) fs.writeFileSync(file, text, 'utf8');
  return { file, changes };
}

/* ---------------------------------------------------------------
   js/config.js
   Only present in the source tree. In a built copy the front end is
   bundled into js/*.js chunks, and nothing in the browser needs the
   website's own address anyway — the pages are served from it — so
   there a domain change is purely a backend/.env change.

   The FiveM *connect* address is different: it is baked into the
   bundle, so changing it on a built copy needs a rebuild. The tool
   says so rather than pretending it changed something.
   --------------------------------------------------------------- */
function patchPublicConfig() {
  const file = path.join(ROOT, 'js', 'config.js');

  if (!fs.existsSync(file)) {
    return {
      file: 'js/config.js',
      changes: [],
      note: GAME_ADDRESS
        ? 'built copy — the FiveM connect address lives inside the bundle. ' +
          'Change it in the source tree and run "npm run build".'
        : 'built copy — nothing to change, the browser does not use the site URL.'
    };
  }

  let text = fs.readFileSync(file, 'utf8');
  const changes = [];

  if (GAME_ADDRESS) {
    const ipRe = /(ip:\s*)'[^']*'/;
    const connectRe = /(connect:\s*)'connect [^']*'/;
    const currentIp = text.match(ipRe)?.[0].match(/'([^']*)'/)[1];
    if (currentIp && currentIp !== GAME_ADDRESS) {
      changes.push(['server.ip', currentIp, GAME_ADDRESS]);
      text = text.replace(ipRe, `$1'${GAME_ADDRESS}'`);
      text = text.replace(connectRe, `$1'connect ${GAME_ADDRESS}'`);
    }
  }

  if (changes.length && !DRY) fs.writeFileSync(file, text, 'utf8');
  return { file: 'js/config.js', changes };
}

/* ---------------------------------------------------------------
   run
   --------------------------------------------------------------- */
// Only the live .env is touched. .env.example stays a generic template
// with localhost defaults, so a fresh clone still works out of the box.
const results = [
  patchEnv(path.join(ROOT, 'backend', '.env')),
  patchPublicConfig()
];

console.log(`\n  Royal RP - public address -> ${base}${DRY ? '   (dry run)' : ''}\n`);

let total = 0;
for (const r of results) {
  const name = r.file.replace(ROOT + path.sep, '').replace(/\\/g, '/');
  if (r.missing) { console.log(`  ${name}  (not found, skipped)`); continue; }
  if (!r.changes.length) {
    console.log(`  ${name}  ${r.note || 'already correct'}`);
    continue;
  }
  console.log(`  ${name}`);
  for (const [key, from, to] of r.changes) {
    console.log(`     ${key}`);
    console.log(`       - ${from}`);
    console.log(`       + ${to}`);
    total++;
  }
}

if (DRY) {
  console.log(`\n  ${total} value(s) would change. Re-run without --dry-run to apply.\n`);
} else {
  console.log(`\n  ${total} value(s) updated.`);
  const steps = [
    `Discord developer portal -> OAuth2 -> Redirects: ${base}/api/auth/discord/callback`,
    'ZarinPal panel: the callback domain must resolve to this server'
  ];
  if (HTTPS) {
    steps.push('Terminate TLS in front of the app (nginx or Cloudflare) and pass ' +
               'X-Forwarded-Proto, or COOKIE_SECURE will lock everyone out');
  }
  steps.push('Restart the backend: npm run server');

  console.log('\n  Still to do by hand:');
  steps.forEach((step, i) => console.log(`   ${i + 1}. ${step}`));
  console.log('');
}
