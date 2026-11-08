#!/usr/bin/env node
/**
 * ROYAL RP - database initialiser
 *
 *   npm run db:init           create tables if missing
 *   npm run db:init -- --force  drop and recreate (destructive)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORCE = process.argv.includes('--force');

/** SQLite dialect -> MySQL dialect. */
function forMysql(sql) {
  return sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'INT AUTO_INCREMENT PRIMARY KEY')
    .replace(/DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP')
    // MySQL needs an index length on long TEXT columns; none are indexed here.
    .replace(/CREATE INDEX IF NOT EXISTS/g, 'CREATE INDEX');
}

/** Split a .sql file into individual statements. */
function statements(sql) {
  return sql
    .split(/;\s*$/m)
    .map(s => s.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean);
}

const TABLES = [
  'login_attempts', 'audit_log', 'logs', 'notifications', 'settings', 'gallery',
  'staff_members', 'news', 'ticket_messages', 'tickets', 'entitlements',
  'wallet_transactions', 'payment_events', 'order_items', 'orders', 'coupons',
  'products', 'categories', 'password_resets', 'oauth_states', 'sessions', 'users'
];

/**
 * Columns added after the first release. CREATE TABLE IF NOT EXISTS
 * will not add a column to a table that already exists, so an older
 * database needs them filled in explicitly. Each entry is applied
 * only when the column is genuinely missing, so this is safe to
 * re-run and never touches data.
 */
const ADDED_COLUMNS = [
  { table: 'orders', column: 'payment_receipt', type: 'VARCHAR(64)' }
];

async function hasColumn(driver, table, column) {
  if (driver === 'mysql') {
    const n = await db.scalar(
      `SELECT COUNT(*) AS n FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [table, column]
    );
    return Number(n) > 0;
  }
  const rows = await db.all(`PRAGMA table_info(${table})`);
  return rows.some(r => r.name === column);
}

async function applyAddedColumns(driver) {
  let added = 0;
  for (const c of ADDED_COLUMNS) {
    try {
      if (await hasColumn(driver, c.table, c.column)) continue;
      await db.run(`ALTER TABLE ${c.table} ADD COLUMN ${c.column} ${c.type}`);
      console.log(`  added column ${c.table}.${c.column}`);
      added++;
    } catch (err) {
      if (/duplicate column|already exists/i.test(err.message)) continue;
      console.warn(`  could not add ${c.table}.${c.column}: ${err.message}`);
    }
  }
  if (!added) console.log('  added columns: none needed');
}

async function main() {
  const driver = await db.connect();
  console.log(`\n  Royal RP database (${driver})`);
  if (driver === 'sqlite') console.log(`  file: ${config.db.sqliteFile}`);

  if (FORCE) {
    console.log('  --force: dropping existing tables');
    if (driver === 'mysql') await db.run('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of TABLES) {
      try { await db.run(`DROP TABLE IF EXISTS ${t}`); } catch (e) { console.warn(`    could not drop ${t}: ${e.message}`); }
    }
    if (driver === 'mysql') await db.run('SET FOREIGN_KEY_CHECKS = 1');
  }

  let sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  if (driver === 'mysql') sql = forMysql(sql);

  let made = 0, skipped = 0;
  for (const stmt of statements(sql)) {
    try {
      await db.run(stmt);
      made++;
    } catch (err) {
      // "already exists" is fine on a non-forced run
      if (/already exists|duplicate key name/i.test(err.message)) { skipped++; continue; }
      console.error(`\n  Failed statement:\n${stmt.slice(0, 200)}...\n  ${err.message}\n`);
      throw err;
    }
  }

  console.log(`  statements applied: ${made}   skipped (already present): ${skipped}`);

  await applyAddedColumns(driver);

  const users = await db.scalar('SELECT COUNT(*) AS n FROM users');
  console.log(`  users in database: ${users}`);
  if (!users) console.log('  -> run "npm run db:seed" to load starter content\n');
  else console.log('');

  await db.close();
}

main().catch(err => {
  console.error('\n  Database init failed:', err.message, '\n');
  process.exit(1);
});
