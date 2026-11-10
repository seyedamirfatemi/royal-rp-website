#!/usr/bin/env node
/**
 * ROYAL RP - create the Owner account directly
 * ---------------------------------------------------------------
 * The site grants Owner to the first account that registers. That is
 * right for a fresh install, but it is a race on a site that is
 * already public: after wiping the users, whoever reaches the sign-up
 * form first becomes the owner.
 *
 * This closes the window. It writes the account straight into the
 * database with the same password hasher the site uses, so there is
 * nothing to win by being quick.
 *
 *   node tools/create-owner.js
 *   node tools/create-owner.js --username amir --email me@example.com
 *
 * It refuses to run if an Owner already exists, unless you pass
 * --force, so it cannot quietly hand out a second one.
 * ---------------------------------------------------------------
 */
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { db } from '../backend/database/db.js';
import { hashPassword } from '../backend/utils/index.js';

const arg = (n) => {
  const h = process.argv.find(a => a.startsWith(`--${n}=`));
  return h ? h.slice(n.length + 3) : null;
};
const FORCE = process.argv.includes('--force');

console.log('\n  Royal RP - create the Owner account');
console.log('  ---------------------------------------------');

await db.connect();

const existing = await db.get("SELECT username, email FROM users WHERE role = 'owner' LIMIT 1");
if (existing && !FORCE) {
  console.error(`\n  An Owner already exists: ${existing.username} <${existing.email}>`);
  console.error('  Nothing was changed. Use --force only if you mean to add a second one.\n');
  await db.close();
  process.exit(1);
}

let username = arg('username');
let email = arg('email');
let password = arg('password');

if (!username || !email || !password) {
  if (!stdin.isTTY) {
    console.error('\n  No console to ask on. Pass them instead:');
    console.error('    node tools/create-owner.js --username=... --email=... --password=...\n');
    await db.close();
    process.exit(1);
  }
  const rl = readline.createInterface({ input: stdin, output: stdout });
  if (!username) username = (await rl.question('  username : ')).trim();
  if (!email)    email    = (await rl.question('  email    : ')).trim();
  if (!password) password = (await rl.question('  password : ')).trim();
  rl.close();
}

/* The same rules the sign-up form enforces, so this cannot create an
   account the site would later refuse to accept. */
const problems = [];
if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) problems.push('username: 3-24 letters, digits, dot, dash or underscore');
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problems.push('email: does not look like an address');
if (!password || password.length < 10) problems.push('password: at least 10 characters');

if (problems.length) {
  console.error('\n  Nothing was created:');
  for (const p of problems) console.error('   - ' + p);
  console.error('');
  await db.close();
  process.exit(1);
}

const clash = await db.get('SELECT id, email, username FROM users WHERE email = ? OR username = ?',
                           [email, username]);
if (clash) {
  console.error(`\n  That ${clash.email === email ? 'email' : 'username'} is already taken.\n`);
  await db.close();
  process.exit(1);
}

const hash = await hashPassword(password);
const res = await db.run(
  `INSERT INTO users (username, email, password_hash, role, status, display_name, locale, created_at, updated_at)
   VALUES (?, ?, ?, 'owner', 'active', ?, 'fa', ?, ?)`,
  [username, email, hash, username, db.now(), db.now()]
);

console.log(`\n  [ok]   Owner created: ${username} <${email}>  (id ${res.lastId})`);

const total = Number(await db.scalar('SELECT COUNT(*) AS n FROM users')) || 0;
console.log(`  [ok]   accounts in the database: ${total}`);
if (total === 1) {
  console.log('\n  This is the only account, so the "first registration becomes');
  console.log('  Owner" rule can no longer hand the site to anyone else.');
}

await db.close();
console.log('\n  Sign in at /pages/login.html and the admin panel is at /pages/admin.html\n');
