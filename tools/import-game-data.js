#!/usr/bin/env node
/**
 * ROYAL RP - cache the game's own data for the admin panel
 * ---------------------------------------------------------------
 * Reads jobs, items, properties and gangs out of the game database
 * and stores them in the website's `settings` table under game.*,
 * which is what /api/content/game-data serves.
 *
 * It is what puts real item names behind the admin product form, so
 * a VIP pack can be set to deliver `WEAPON_PISTOL` by picking it from
 * a list instead of typing it and hoping.
 *
 *   node tools/import-game-data.js
 *   node tools/import-game-data.js --dry-run
 *
 * Read-only on the game database: every statement is a SELECT. The
 * website's own account is the one that writes, and only to settings.
 *
 * Tables differ between frameworks and between versions of the same
 * framework, so nothing here is assumed - each source is looked up in
 * information_schema first and skipped, with a line saying so, when
 * it is not there.
 * ---------------------------------------------------------------
 */
import { config } from '../backend/config/index.js';
import { db } from '../backend/database/db.js';

const DRY = process.argv.includes('--dry-run');

const log = (t) => console.log(`  ${t}`);
const ok = (t) => console.log(`  [ok]   ${t}`);
const skip = (t) => console.log(`  [skip] ${t}`);

console.log('\n  Royal RP - import game data');
console.log('  ---------------------------------------------');

if (!config.fivem.gameDb.enabled) {
  console.error('\n  GAME_DB_ENABLED is false in backend/.env, so there is nothing to read.\n');
  process.exit(1);
}

let mysql;
try { mysql = (await import('mysql2/promise')).default; }
catch { console.error('\n  mysql2 is not installed. Run: npm ci --omit=dev\n'); process.exit(1); }

const g = config.fivem.gameDb;
let game;
try {
  game = await mysql.createConnection({
    host: g.host, port: g.port, user: g.user, password: g.password, database: g.database
  });
} catch (err) {
  console.error(`\n  Could not read the game database "${g.database}": ${err.message}\n`);
  process.exit(1);
}
ok(`reading ${g.database} as ${g.user}`);

/* What exists in this particular install. */
const [tableRows] = await game.query(
  'SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [g.database]);
const tables = new Set(tableRows.map(r => String(r.t).toLowerCase()));

const columnsOf = async (table) => {
  const [rows] = await game.query(
    'SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [g.database, table]);
  return new Set(rows.map(r => String(r.c).toLowerCase()));
};

/** First of `names` that exists as a table. */
const pickTable = (...names) => names.find(n => tables.has(n.toLowerCase())) || null;
/** First of `names` that exists as a column. */
const pickCol = (cols, ...names) => names.find(n => cols.has(n.toLowerCase())) || null;

const q = (s) => '`' + String(s).replace(/`/g, '') + '`';

const result = {};

/* ---------------------------------------------------------------
   jobs, and the grades inside them
   --------------------------------------------------------------- */
const jobsTable = pickTable('jobs');
if (!jobsTable) skip('no jobs table');
else {
  const cols = await columnsOf(jobsTable);
  const name = pickCol(cols, 'name', 'job_name');
  const label = pickCol(cols, 'label', 'title') || name;
  const [rows] = await game.query(`SELECT ${q(name)} AS name, ${q(label)} AS label FROM ${q(jobsTable)}`);
  result.jobs = rows.map(r => ({ name: r.name, label: r.label || r.name }));
  ok(`jobs: ${result.jobs.length}`);

  const gradesTable = pickTable('job_grades');
  if (gradesTable) {
    const gc = await columnsOf(gradesTable);
    const jn = pickCol(gc, 'job_name', 'job');
    const gr = pickCol(gc, 'grade');
    const gl = pickCol(gc, 'label', 'name');
    const sal = pickCol(gc, 'salary', 'payment');
    if (jn && gr) {
      const sel = [`${q(jn)} AS job`, `${q(gr)} AS grade`,
                   gl ? `${q(gl)} AS label` : `NULL AS label`,
                   sal ? `${q(sal)} AS salary` : `NULL AS salary`].join(', ');
      const [rows2] = await game.query(`SELECT ${sel} FROM ${q(gradesTable)} ORDER BY ${q(jn)}, ${q(gr)}`);
      const byJob = {};
      for (const r of rows2) {
        (byJob[r.job] ||= []).push({
          grade: Number(r.grade),
          label: r.label || `grade ${r.grade}`,
          salary: r.salary === null ? null : Number(r.salary)
        });
      }
      result.jobGrades = byJob;
      ok(`job grades: ${rows2.length} across ${Object.keys(byJob).length} jobs`);
    } else skip('job_grades is missing the columns needed');
  } else skip('no job_grades table');
}

/* ---------------------------------------------------------------
   items - the list the admin product form offers
   --------------------------------------------------------------- */
const itemsTable = pickTable('items', 'ox_inventory_items', 'item_list');
if (!itemsTable) skip('no items table');
else {
  const cols = await columnsOf(itemsTable);
  const name = pickCol(cols, 'name', 'item');
  const label = pickCol(cols, 'label', 'title') || name;
  if (!name) skip(`${itemsTable} has no name column`);
  else {
    const [rows] = await game.query(
      `SELECT ${q(name)} AS name, ${q(label)} AS label FROM ${q(itemsTable)} ORDER BY ${q(name)}`);
    result.items = rows.map(r => ({ name: r.name, label: r.label || r.name }));
    ok(`items: ${result.items.length}`);
  }
}

/* ---------------------------------------------------------------
   properties
   --------------------------------------------------------------- */
const propTable = pickTable('owned_properties', 'properties');
if (!propTable) skip('no properties table');
else {
  const cols = await columnsOf(propTable);
  const name = pickCol(cols, 'name', 'property_name', 'label');
  const price = pickCol(cols, 'price', 'value');
  if (!name) skip(`${propTable} has no name column`);
  else {
    const sel = `${q(name)} AS name` + (price ? `, ${q(price)} AS price` : ', NULL AS price');
    const [rows] = await game.query(`SELECT DISTINCT ${sel} FROM ${q(propTable)} ORDER BY ${q(name)}`);
    result.properties = rows.map(r => ({ name: r.name, price: r.price === null ? null : Number(r.price) }));
    ok(`properties: ${result.properties.length}`);
  }
}

/* ---------------------------------------------------------------
   gangs
   --------------------------------------------------------------- */
const gangTable = pickTable('gangs', 'gang');
if (!gangTable) { skip('no gangs table'); result.gangs = []; }
else {
  const cols = await columnsOf(gangTable);
  const name = pickCol(cols, 'name', 'gang_name');
  const label = pickCol(cols, 'label') || name;
  if (!name) { skip(`${gangTable} has no name column`); result.gangs = []; }
  else {
    const [rows] = await game.query(`SELECT ${q(name)} AS name, ${q(label)} AS label FROM ${q(gangTable)}`);
    result.gangs = rows.map(r => ({ name: r.name, label: r.label || r.name }));
    ok(`gangs: ${result.gangs.length}`);
  }
}

/* ---------------------------------------------------------------
   a note about where this came from
   --------------------------------------------------------------- */
result.server = {
  database: g.database,
  host: g.host,
  framework: config.fivem.framework,
  importedAt: new Date().toISOString()
};

await game.end();

/* ---------------------------------------------------------------
   write it into the website's settings
   --------------------------------------------------------------- */
console.log('');
if (DRY) {
  for (const [k, v] of Object.entries(result)) {
    const size = Array.isArray(v) ? `${v.length} entries` : typeof v === 'object' ? `${Object.keys(v).length} keys` : String(v);
    log(`would write game.${k.padEnd(10)} ${size}`);
  }
  console.log('\n  --dry-run: nothing written.\n');
  process.exit(0);
}

await db.connect();
let written = 0;
for (const [key, value] of Object.entries(result)) {
  await db.upsert('settings',
    { key_name: `game.${key}`, value: JSON.stringify(value), updated_at: db.now() },
    ['key_name'], ['value', 'updated_at']);
  written++;
}
await db.close();

ok(`wrote ${written} settings rows`);
console.log(`
  ---------------------------------------------
  The admin product form now offers the real item, job and property
  names when you configure what a product delivers.

  Check it:
      curl http://127.0.0.1:4000/api/content/game-data

  Re-run this whenever the server gains new items or jobs.
`);
