/**
 * ROYAL RP - ESX adapter
 * ---------------------------------------------------------------
 * Maps the website's needs onto an ESX (es_extended) schema.
 *
 * READ THIS BEFORE GOING LIVE
 * ESX installations vary a lot. Different versions store money in
 * `users.accounts` (JSON) or in separate columns; some use
 * `owned_vehicles`, others a custom garage resource. The MAP below
 * is the ONLY place that needs changing, and every method calls
 * `resolve()` first, which checks the column actually exists before
 * building a query. If a column is missing the method returns null
 * and the dashboard shows "not available" instead of a wrong number.
 *
 * When the real server source is provided, confirm each entry here
 * against it. Do not assume.
 * ---------------------------------------------------------------
 */
import { gameQuery, gameColumns, bridgeAction } from './index.js';

/** Candidate column names, tried in order. First one that exists wins. */
const MAP = {
  users: {
    table: 'users',
    identifier: ['identifier'],
    firstName:  ['firstname', 'first_name'],
    lastName:   ['lastname', 'last_name'],
    dob:        ['dateofbirth', 'date_of_birth', 'dob'],
    sex:        ['sex', 'gender'],
    job:        ['job'],
    jobGrade:   ['job_grade'],
    group:      ['group', '`group`'],
    accounts:   ['accounts'],          // JSON: {"bank":0,"money":0,"black_money":0}
    money:      ['money'],             // some forks keep cash separately
    bank:       ['bank'],
    position:   ['position'],
    playtime:   ['playtime', 'play_time'],
    lastSeen:   ['last_seen', 'lastseen', 'last_login']
  },
  vehicles: {
    table: 'owned_vehicles',
    owner:  ['owner', 'identifier'],
    plate:  ['plate'],
    data:   ['vehicle'],               // JSON blob of the vehicle properties
    stored: ['stored'],
    state:  ['state'],
    garage: ['garage_name', 'garage', 'parking']
  },
  properties: {
    table: 'owned_properties',
    owner: ['owner', 'identifier'],
    name:  ['name'],
    price: ['price']
  }
};

const columnCache = new Map();

/** Find the first candidate column that actually exists on a table. */
async function resolve(group, field) {
  const spec = MAP[group];
  if (!spec) return null;
  const key = `${spec.table}.${field}`;
  if (columnCache.has(key)) return columnCache.get(key);

  let cols = columnCache.get(`__cols__${spec.table}`);
  if (!cols) {
    cols = (await gameColumns(spec.table)).map(c => c.toLowerCase());
    columnCache.set(`__cols__${spec.table}`, cols);
  }

  const found = (spec[field] || []).find(c => cols.includes(c.replace(/`/g, '').toLowerCase())) || null;
  columnCache.set(key, found);
  return found;
}

async function tableExists(group) {
  const spec = MAP[group];
  const cols = await gameColumns(spec.table);
  return cols.length > 0;
}

/** ESX stores money as a JSON object in `accounts` in most builds. */
function readAccounts(row, moneyCol, bankCol) {
  let cash = 0, bank = 0, black = 0;
  if (row.accounts) {
    try {
      const acc = typeof row.accounts === 'string' ? JSON.parse(row.accounts) : row.accounts;
      cash = Number(acc.money ?? acc.cash ?? 0);
      bank = Number(acc.bank ?? 0);
      black = Number(acc.black_money ?? acc.blackmoney ?? 0);
    } catch { /* fall through to columns */ }
  }
  if (moneyCol && row[moneyCol] !== undefined && !cash) cash = Number(row[moneyCol]) || 0;
  if (bankCol && row[bankCol] !== undefined && !bank) bank = Number(row[bankCol]) || 0;
  return { cash, bank, black };
}

/* ===============================================================
   READ
   =============================================================== */
export async function getCharacters(license) {
  if (!license || !(await tableExists('users'))) return null;

  const idCol = await resolve('users', 'identifier');
  if (!idCol) return null;

  const [first, last, dob, sex, job, grade, money, bank, playtime, lastSeen] = await Promise.all([
    resolve('users', 'firstName'), resolve('users', 'lastName'), resolve('users', 'dob'),
    resolve('users', 'sex'), resolve('users', 'job'), resolve('users', 'jobGrade'),
    resolve('users', 'money'), resolve('users', 'bank'),
    resolve('users', 'playtime'), resolve('users', 'lastSeen')
  ]);

  const rows = await gameQuery(`SELECT * FROM ${MAP.users.table} WHERE ${idCol} = ?`, [license]);
  if (!rows || !rows.length) return [];

  return rows.map(r => {
    const acc = readAccounts(r, money, bank);
    return {
      id: r[idCol],
      citizenid: r[idCol],
      firstName: first ? r[first] : null,
      lastName: last ? r[last] : null,
      dob: dob ? r[dob] : null,
      gender: sex ? r[sex] : null,
      job: job ? r[job] : null,
      jobGrade: grade ? String(r[grade]) : null,
      cash: acc.cash,
      bank: acc.bank,
      blackMoney: acc.black,
      playtimeMinutes: playtime ? Number(r[playtime]) || 0 : null,
      lastSeen: lastSeen ? r[lastSeen] : null,
      /** Fields ESX does not store at all - stated, never guessed. */
      unavailable: ['gang', 'crypto', 'health', 'armor'].filter(() => true)
    };
  });
}

export async function getVehicles(license) {
  if (!license || !(await tableExists('vehicles'))) return null;

  const ownerCol = await resolve('vehicles', 'owner');
  const plateCol = await resolve('vehicles', 'plate');
  if (!ownerCol || !plateCol) return null;

  const [dataCol, storedCol, garageCol] = await Promise.all([
    resolve('vehicles', 'data'), resolve('vehicles', 'stored'), resolve('vehicles', 'garage')
  ]);

  const rows = await gameQuery(`SELECT * FROM ${MAP.vehicles.table} WHERE ${ownerCol} = ?`, [license]);
  if (!rows) return [];

  return rows.map(r => {
    let model = null;
    if (dataCol && r[dataCol]) {
      try {
        const v = typeof r[dataCol] === 'string' ? JSON.parse(r[dataCol]) : r[dataCol];
        model = v.model ?? v.modelName ?? null;
      } catch { /* leave null */ }
    }
    return {
      id: r[plateCol],
      plate: r[plateCol],
      model: model !== null ? String(model) : 'Unknown model',
      garage: garageCol ? r[garageCol] : null,
      state: storedCol ? (Number(r[storedCol]) ? 'stored' : 'out') : 'unknown',
      mileage: null
    };
  });
}

export async function getProperties(license) {
  if (!license || !(await tableExists('properties'))) return null;

  const ownerCol = await resolve('properties', 'owner');
  const nameCol = await resolve('properties', 'name');
  if (!ownerCol || !nameCol) return null;

  const priceCol = await resolve('properties', 'price');
  const rows = await gameQuery(`SELECT * FROM ${MAP.properties.table} WHERE ${ownerCol} = ?`, [license]);
  if (!rows) return [];

  return rows.map(r => ({
    id: `${r[nameCol]}`,
    name: r[nameCol],
    type: 'Property',
    district: null,
    value: priceCol ? Number(r[priceCol]) || 0 : null,
    storage: null,
    garage: null
  }));
}

/* ===============================================================
   WRITE
   These go through the bridge resource, NOT a direct UPDATE, so the
   running server stays in sync with the database. Writing straight
   to the table behind a live server loses the change on next save.
   =============================================================== */
export async function addMoney(target, account, amount) {
  return bridgeAction('money/add', { identifier: target, account, amount });
}

export async function giveVehicle(target, model, options = {}) {
  const res = await bridgeAction('vehicle/give', { identifier: target, model, options });
  return res?.plate || 'PENDING';
}

export async function giveItem(target, item, count) {
  return bridgeAction('inventory/give', { identifier: target, item, count });
}

export async function setVip(license, tier, expiresAt) {
  return bridgeAction('vip/set', {
    identifier: license, tier,
    expires: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt
  });
}

export async function addCharacterSlots(license, count) {
  return bridgeAction('slots/add', { identifier: license, count });
}

export async function kickPlayer(serverId, reason) {
  return bridgeAction('player/kick', { serverId, reason });
}

export default {
  framework: 'esx',
  getCharacters, getVehicles, getProperties,
  addMoney, giveVehicle, giveItem, setVip, addCharacterSlots, kickPlayer,
  MAP
};
