#!/usr/bin/env node
/**
 * ROYAL RP - what the shop is actually serving, and why
 * ---------------------------------------------------------------
 * The public endpoints only return rows that are switched on:
 *
 *     /api/shop/products   WHERE visible = 1
 *     /api/news            WHERE published = 1
 *
 * so a table can be full and the site still look empty. This prints
 * both numbers side by side and says which it is.
 *
 *   node tools/check-content.js            report only
 *   node tools/check-content.js --publish  switch the rows back on
 *
 * --publish only ever sets visible / published to 1. It adds nothing,
 * deletes nothing, and changes no text.
 * ---------------------------------------------------------------
 */
import { db } from '../backend/database/db.js';

const PUBLISH = process.argv.includes('--publish');

const CHECKS = [
  { table: 'products',      flag: 'visible',   label: 'shop products' },
  { table: 'news',          flag: 'published', label: 'news articles' },
  { table: 'gallery',       flag: 'visible',   label: 'gallery images' },
  { table: 'categories',    flag: 'visible',   label: 'shop categories' },
  { table: 'staff_members', flag: 'visible',   label: 'staff members' },
  { table: 'coupons',       flag: null,        label: 'coupons' }
];

await db.connect();

console.log('\n  Royal RP - content check');
console.log('  ---------------------------------------------');
console.log('  table            rows   shown on the site');
console.log('  ---------------------------------------------');

const problems = [];

for (const { table, flag, label } of CHECKS) {
  let total, shown = null;
  try {
    total = Number(await db.scalar(`SELECT COUNT(*) AS n FROM ${table}`)) || 0;
    if (flag) {
      shown = Number(await db.scalar(`SELECT COUNT(*) AS n FROM ${table} WHERE ${flag} = 1`)) || 0;
    }
  } catch (err) {
    console.log(`  ${label.padEnd(16)} -      (${err.code || err.message})`);
    continue;
  }

  const shownText = flag === null ? '-' : String(shown);
  let note = '';
  if (total === 0) note = '  <- table is empty';
  else if (flag && shown === 0) { note = `  <- all hidden (${flag} = 0)`; problems.push({ table, flag, total }); }
  else if (flag && shown < total) note = `  <- ${total - shown} hidden`;

  console.log(`  ${label.padEnd(16)} ${String(total).padEnd(6)} ${shownText.padEnd(6)}${note}`);
}

if (!problems.length) {
  console.log('\n  Nothing is hidden. If the site still looks empty the cause is');
  console.log('  elsewhere - check that the site is talking to this database:');
  console.log('      curl http://127.0.0.1:4000/api/health\n');
} else {
  console.log('');
  for (const p of problems) {
    console.log(`  ${p.total} rows in ${p.table} exist but none are switched on.`);
  }

  if (!PUBLISH) {
    console.log('\n  Switch them back on with:');
    console.log('      node tools/check-content.js --publish');
    console.log('  (sets the flag to 1 and touches nothing else)\n');
  } else {
    console.log('');
    for (const p of problems) {
      const res = await db.run(`UPDATE ${p.table} SET ${p.flag} = 1`);
      const n = res.changes ?? res.affectedRows ?? '?';
      console.log(`  [ok]   ${p.table}: ${n} rows set ${p.flag} = 1`);
    }
    console.log('\n  Done. The site picks this up immediately, no restart needed.\n');
  }
}

/* An empty table is a different problem from a hidden one. */
const emptyNews = Number(await db.scalar('SELECT COUNT(*) AS n FROM news')) || 0;
if (emptyNews === 0) {
  console.log('  news has no rows at all. The shipped articles go back in with:');
  console.log('      node backend/database/seed.js');
  console.log('  which only inserts what is missing and leaves everything else alone.\n');
}

await db.close();
