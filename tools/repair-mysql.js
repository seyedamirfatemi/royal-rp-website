#!/usr/bin/env node
/**
 * ROYAL RP - repair MariaDB's permission tables
 * ---------------------------------------------------------------
 * On XAMPP, closing the control panel window instead of pressing Stop
 * leaves MyISAM tables crashed. When it happens to the tables in the
 * `mysql` database, nothing can create a user or change a grant, and
 * setup fails with:
 *
 *     Table '.\mysql\db' is marked as crashed
 *
 * This checks them and repairs what it can, without needing mysql.exe
 * or HeidiSQL.
 *
 *   node tools/repair-mysql.js              check, then ordinary repair
 *   node tools/repair-mysql.js --use-frm    last resort, see below
 *
 * --use-frm rebuilds a table from its .frm definition file. It is what
 * finally fixes a table an ordinary REPAIR cannot, but it can discard
 * the rows it could not read - on mysql.db that means database-level
 * grants. Back up C:\xampp\mysql\data\mysql\db.MY* first, and if the
 * game server loses access afterwards, re-grant its user.
 * ---------------------------------------------------------------
 */
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

const arg = (n) => {
  const h = process.argv.find(a => a.startsWith(`--${n}=`));
  return h ? h.slice(n.length + 3) : null;
};
const USE_FRM = process.argv.includes('--use-frm');

const TABLES = ['mysql.db', 'mysql.tables_priv', 'mysql.columns_priv',
                'mysql.procs_priv', 'mysql.proxies_priv', 'mysql.global_priv',
                'mysql.user'];

let mysql;
try { mysql = (await import('mysql2/promise')).default; }
catch { console.error('\n  mysql2 is not installed. Run: npm ci --omit=dev\n'); process.exit(1); }

console.log('\n  Royal RP - MariaDB permission table check');
console.log('  ---------------------------------------------');
if (USE_FRM) {
  console.log('  --use-frm: rebuilding from the .frm definition.');
  console.log('  Grants stored in a damaged table can be lost.\n');
}

let rootPass = arg('root-pass');
if (rootPass === null) {
  if (!stdin.isTTY) { console.error('\n  Use --root-pass=  (empty for no password)\n'); process.exit(1); }
  const rl = readline.createInterface({ input: stdin, output: stdout });
  rootPass = await rl.question('  MySQL root password (blank if none) : ');
  rl.close();
}

let c;
try {
  c = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: rootPass });
} catch (err) {
  console.error(`\n  Could not connect to MariaDB: ${err.message}`);
  console.error('  Is MySQL started in the XAMPP Control Panel?\n');
  process.exit(1);
}
console.log('\n  connected\n');

/** The last line REPAIR/CHECK prints for a table is its verdict. */
const verdict = (rows) => String((rows[rows.length - 1] || {}).Msg_text || '');

let broken = [];

for (const t of TABLES) {
  let state;
  try {
    const [rows] = await c.query(`CHECK TABLE ${t}`);
    state = verdict(rows);
  } catch (e) {
    if (/doesn't exist|Unknown table/i.test(e.message)) continue;
    state = e.message;
  }

  // mysql.user is a view over global_priv in MariaDB 10.4+.
  if (/is not of type 'BASE TABLE'|is not BASE TABLE/i.test(state)) continue;

  if (/^OK$/i.test(state)) {
    console.log(`  [ok]    ${t.padEnd(20)} OK`);
    continue;
  }

  console.log(`  [bad]   ${t.padEnd(20)} ${state}`);

  try {
    const [rows] = await c.query(`REPAIR TABLE ${t}${USE_FRM ? ' USE_FRM' : ''}`);
    const after = verdict(rows);
    if (/^OK$/i.test(after)) {
      console.log(`  [fixed] ${t.padEnd(20)} repaired`);
    } else {
      console.log(`  [fail]  ${t.padEnd(20)} ${after}`);
      broken.push(t);
    }
  } catch (e) {
    console.log(`  [fail]  ${t.padEnd(20)} ${e.message}`);
    broken.push(t);
  }
}

// FLUSH PRIVILEGES reads the very tables we are repairing, so it fails
// too while any of them is still crashed. That is a symptom, not a new
// problem, and it must not stop the report below from printing.
try {
  await c.query('FLUSH PRIVILEGES');
} catch (e) {
  if (!broken.length) throw e;   // unexpected if everything looked fine
}
await c.end();

console.log('');
if (!broken.length) {
  console.log('  ---------------------------------------------');
  console.log('  All permission tables are healthy.');
  console.log('\n  Next:  npm run setup\n');
  process.exit(0);
}

if (!USE_FRM) {
  console.log('  ---------------------------------------------');
  console.log(`  Still damaged: ${broken.join(', ')}`);
  console.log('\n  An ordinary repair was not enough. Try rebuilding from the');
  console.log('  table definition - back up the data files first:');
  console.log('\n    copy C:\\xampp\\mysql\\data\\mysql\\db.MY* C:\\xampp\\mysql\\backup-db\\');
  console.log('    node tools/repair-mysql.js --use-frm\n');
  process.exit(1);
}

console.log('  ---------------------------------------------');
console.log(`  Still damaged after --use-frm: ${broken.join(', ')}`);
console.log('\n  This needs MariaDB stopped:');
console.log('\n    1. XAMPP Control Panel -> MySQL -> Stop');
console.log('    2. C:\\xampp\\mysql\\bin\\myisamchk.exe --safe-recover \\');
console.log('         C:\\xampp\\mysql\\data\\mysql\\db.MYI');
console.log('    3. XAMPP Control Panel -> MySQL -> Start');
console.log('    4. node tools/repair-mysql.js\n');
process.exit(1);
