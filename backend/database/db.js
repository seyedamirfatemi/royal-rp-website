/**
 * ROYAL RP - database layer
 * ---------------------------------------------------------------
 * One tiny async interface over two drivers:
 *
 *   sqlite (default)  zero-config, perfect for development
 *   mysql             production, and the same instance the FiveM
 *                     server uses through oxmysql
 *
 * EVERY query in this project goes through here with `?` placeholders
 * and a parameter array. There is no string interpolation of user
 * input anywhere in the codebase - that is what keeps SQL injection
 * off the table structurally rather than by review.
 * ---------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/index.js';

let driver = null;      // 'sqlite' | 'mysql'
let sqlite = null;      // better-sqlite3 Database
let pool = null;        // mysql2 pool

/* ===============================================================
   CONNECT
   =============================================================== */
export async function connect() {
  if (driver) return driver;

  if (config.db.driver === 'mysql') {
    let mysql;
    try {
      mysql = (await import('mysql2/promise')).default;
    } catch {
      throw new Error('DB_DRIVER=mysql but mysql2 is not installed. Run: npm install mysql2');
    }
    pool = mysql.createPool({
      ...config.db.mysql,
      waitForConnections: true,
      queueLimit: 0,
      namedPlaceholders: false,
      dateStrings: true
    });
    await pool.query('SELECT 1');
    driver = 'mysql';
  } else {
    let Database;
    try {
      Database = (await import('better-sqlite3')).default;
    } catch {
      throw new Error('better-sqlite3 is not installed. Run: npm install');
    }
    fs.mkdirSync(path.dirname(config.db.sqliteFile), { recursive: true });
    sqlite = new Database(config.db.sqliteFile);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('busy_timeout = 5000');
    driver = 'sqlite';
  }
  return driver;
}

export function getDriver() { return driver; }

export async function close() {
  if (pool) { await pool.end(); pool = null; }
  if (sqlite) { sqlite.close(); sqlite = null; }
  driver = null;
}

/* ===============================================================
   QUERY
   =============================================================== */
function ensure() {
  if (!driver) throw new Error('Database not connected. Call connect() first.');
}

/** All matching rows. */
export async function all(sql, params = []) {
  ensure();
  if (driver === 'mysql') {
    const [rows] = await pool.query(sql, params);
    return rows;
  }
  return sqlite.prepare(sql).all(params);
}

/** First matching row, or undefined. */
export async function get(sql, params = []) {
  ensure();
  if (driver === 'mysql') {
    const [rows] = await pool.query(sql, params);
    return rows[0];
  }
  return sqlite.prepare(sql).get(params);
}

/** INSERT / UPDATE / DELETE -> { changes, lastId } */
export async function run(sql, params = []) {
  ensure();
  if (driver === 'mysql') {
    const [res] = await pool.query(sql, params);
    return { changes: res.affectedRows ?? 0, lastId: res.insertId ?? null };
  }
  const res = sqlite.prepare(sql).run(params);
  return { changes: res.changes, lastId: res.lastInsertRowid ?? null };
}

/** A single scalar value. */
export async function scalar(sql, params = []) {
  const row = await get(sql, params);
  if (!row) return null;
  return Object.values(row)[0];
}

/* ===============================================================
   TRANSACTIONS
   Used for anything that must not half-apply: creating an order with
   its items, delivering an order, refunding, adjusting a wallet.
   =============================================================== */
export async function transaction(fn) {
  ensure();

  if (driver === 'mysql') {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const tx = {
        all:  async (s, p = []) => (await conn.query(s, p))[0],
        get:  async (s, p = []) => (await conn.query(s, p))[0][0],
        run:  async (s, p = []) => {
          const [r] = await conn.query(s, p);
          return { changes: r.affectedRows ?? 0, lastId: r.insertId ?? null };
        }
      };
      const out = await fn(tx);
      await conn.commit();
      return out;
    } catch (err) {
      try { await conn.rollback(); } catch {}
      throw err;
    } finally {
      conn.release();
    }
  }

  // better-sqlite3 is synchronous, so we drive the transaction manually
  // to allow `await` inside the callback (awaiting already-resolved values).
  sqlite.prepare('BEGIN').run();
  try {
    const tx = {
      all: async (s, p = []) => sqlite.prepare(s).all(p),
      get: async (s, p = []) => sqlite.prepare(s).get(p),
      run: async (s, p = []) => {
        const r = sqlite.prepare(s).run(p);
        return { changes: r.changes, lastId: r.lastInsertRowid ?? null };
      }
    };
    const out = await fn(tx);
    sqlite.prepare('COMMIT').run();
    return out;
  } catch (err) {
    try { sqlite.prepare('ROLLBACK').run(); } catch {}
    throw err;
  }
}

/* ===============================================================
   HELPERS
   =============================================================== */

/** Current timestamp in the format both drivers store. */
export function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/** A DATETIME `ms` milliseconds from now. */
export function future(ms) {
  return new Date(Date.now() + ms).toISOString().slice(0, 19).replace('T', ' ');
}

/** Safely parse a JSON column. */
export function json(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

/** Serialise for a JSON column. */
export function toJson(value) {
  return value === null || value === undefined ? null : JSON.stringify(value);
}

/**
 * Build `WHERE a = ? AND b = ?` from an object, skipping undefined.
 * Keys are developer-supplied column names, never user input.
 */
export function where(filters = {}, prefix = 'WHERE') {
  const keys = Object.keys(filters).filter(k => filters[k] !== undefined && filters[k] !== null);
  if (!keys.length) return { sql: '', params: [] };
  return {
    sql: ` ${prefix} ` + keys.map(k => `${k} = ?`).join(' AND '),
    params: keys.map(k => filters[k])
  };
}

/**
 * Driver-portable "insert or update".
 *
 * SQLite uses `ON CONFLICT (...) DO UPDATE SET x = excluded.x`, MySQL and
 * MariaDB use `ON DUPLICATE KEY UPDATE x = VALUES(x)`. Writing either one
 * directly would break the other driver, so every upsert goes through here.
 *
 * @param {string}   table
 * @param {object}   row        column -> value
 * @param {string[]} conflictOn unique/primary key columns
 * @param {string[]} updateCols columns to overwrite on conflict (default: all non-key)
 */
export async function upsert(table, row, conflictOn, updateCols = null) {
  ensure();
  const cols = Object.keys(row);
  const values = cols.map(c => row[c]);
  const placeholders = cols.map(() => '?').join(', ');
  const update = (updateCols || cols.filter(c => !conflictOn.includes(c)));

  if (driver === 'mysql') {
    const setSql = update.map(c => `${c} = VALUES(${c})`).join(', ');
    return run(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${setSql}`,
      values
    );
  }

  const setSql = update.map(c => `${c} = excluded.${c}`).join(', ');
  return run(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
     ON CONFLICT(${conflictOn.join(', ')}) DO UPDATE SET ${setSql}`,
    values
  );
}

/** LIMIT/OFFSET from a page number, with hard bounds. */
export function paginate(page = 1, perPage = 20, maxPerPage = 200) {
  const per = Math.min(Math.max(1, parseInt(perPage, 10) || 20), maxPerPage);
  const p = Math.max(1, parseInt(page, 10) || 1);
  return { limit: per, offset: (p - 1) * per, page: p, perPage: per };
}

export const db = {
  connect, close, getDriver, all, get, run, scalar, transaction, upsert,
  now, future, json, toJson, where, paginate
};

export default db;
