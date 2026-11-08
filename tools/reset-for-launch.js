#!/usr/bin/env node
/**
 * ROYAL RP - reset the website database for launch
 * ---------------------------------------------------------------
 * Clears everything that belongs to *testing* and keeps everything
 * that belongs to the *shop*:
 *
 *   wiped : accounts, sessions, orders, payments, entitlements,
 *           wallet history, tickets, notifications, logs, audit trail,
 *           login attempts, password resets, OAuth states
 *   kept  : categories, products, coupons, gallery, news, settings
 *
 * It never touches the game database (`volta`). Only the website's own
 * schema is affected.
 *
 * After running it the site has no accounts at all, which is the point:
 * the first account registered through the sign-up form is granted
 * Owner automatically, so there is no shipped password anywhere.
 *
 *   node tools/reset-for-launch.js            show what would be deleted
 *   node tools/reset-for-launch.js --yes      actually delete it
 *   node tools/reset-for-launch.js --yes --keep-catalogue=false
 *                                             also clear products/news
 * ---------------------------------------------------------------
 */
import { config } from '../backend/config/index.js';
import { db } from '../backend/database/db.js';

const CONFIRMED = process.argv.includes('--yes');
const WIPE_CATALOGUE = process.argv.includes('--keep-catalogue=false');

/* Child rows first, so a foreign key never blocks a delete. */
const TRANSACTIONAL = [
  'ticket_messages', 'tickets', 'notifications', 'wallet_transactions',
  'entitlements', 'payment_events', 'order_items', 'orders',
  'password_resets', 'oauth_states', 'sessions', 'login_attempts',
  'audit_log', 'logs', 'users'
];

/* Sample content that ships with the seed and must not reach a live
   site: the staff list is filled in from the admin panel instead. */
const SAMPLE_CONTENT = ['staff_members'];

const CATALOGUE = ['news', 'gallery', 'coupons', 'products', 'categories'];

async function count(table) {
  try { return Number(await db.scalar(`SELECT COUNT(*) AS n FROM ${table}`)) || 0; }
  catch { return null; }   // table not present in this install
}

async function main() {
  const driver = await db.connect();
  const tables = WIPE_CATALOGUE
    ? [...TRANSACTIONAL, ...SAMPLE_CONTENT, ...CATALOGUE]
    : [...TRANSACTIONAL, ...SAMPLE_CONTENT];

  const where = driver === 'mysql' ? config.db.mysql.database : config.db.sqliteFile;
  console.log(`\n  Royal RP - reset for launch (${driver}: ${where})`);
  console.log(`  ${CONFIRMED ? 'DELETING' : 'DRY RUN - nothing will be deleted'}\n`);

  let total = 0;
  for (const t of tables) {
    const n = await count(t);
    if (n === null) continue;
    total += n;
    console.log(`    ${t.padEnd(22)} ${String(n).padStart(6)}${n ? '' : '   (already empty)'}`);
  }

  if (!WIPE_CATALOGUE) {
    console.log('\n  kept as-is:');
    for (const t of CATALOGUE) {
      const n = await count(t);
      if (n !== null) console.log(`    ${t.padEnd(22)} ${String(n).padStart(6)}`);
    }
  }

  if (!CONFIRMED) {
    console.log(`\n  ${total} rows would be deleted.`);
    console.log('  Re-run with --yes to go ahead.\n');
    await db.close();
    return;
  }

  if (driver === 'mysql') await db.run('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of tables) {
    if (await count(t) === null) continue;
    await db.run(`DELETE FROM ${t}`);
    // Restart ids so the first real account is user #1.
    try {
      if (driver === 'mysql') await db.run(`ALTER TABLE ${t} AUTO_INCREMENT = 1`);
      else await db.run('DELETE FROM sqlite_sequence WHERE name = ?', [t]);
    } catch { /* no auto-increment on this table */ }
  }
  if (driver === 'mysql') await db.run('SET FOREIGN_KEY_CHECKS = 1');

  console.log(`\n  ${total} rows deleted.`);
  console.log('  ----------------------------------------------------');
  console.log('   NEXT STEP: open the site and register an account.');
  console.log('   The first one becomes Owner and can reach /pages/admin.html');
  console.log('  ----------------------------------------------------\n');

  await db.close();
}

main().catch(err => {
  console.error('\n  Reset failed:', err.message, '\n');
  process.exit(1);
});
