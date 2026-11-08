/**
 * ROYAL RP - QBCore adapter
 * ---------------------------------------------------------------
 * QBCore keeps almost everything in JSON columns on `players`:
 *
 *   charinfo  {firstname, lastname, birthdate, gender, phone, ...}
 *   money     {cash, bank, crypto}
 *   job       {name, label, grade:{name,level}, onduty}
 *   gang      {name, label, grade:{name,level}}
 *   metadata  {hunger, thirst, armor, jailtime, ...}
 *
 * As with the ESX adapter, every column is resolved against the live
 * schema before use. Nothing is assumed.
 * ---------------------------------------------------------------
 */
import { gameQuery, gameColumns, bridgeAction } from './index.js';

const MAP = {
  players: {
    table: 'players',
    license:   ['license'],
    citizenid: ['citizenid'],
    name:      ['name'],
    charinfo:  ['charinfo'],
    money:     ['money'],
    job:       ['job'],
    gang:      ['gang'],
    metadata:  ['metadata'],
    position:  ['position'],
    lastUpdated: ['last_updated', 'last_logged_out']
  },
  vehicles: {
    table: 'player_vehicles',
    license:   ['license'],
    citizenid: ['citizenid'],
    plate:     ['plate'],
    vehicle:   ['vehicle'],       // spawn name
    mods:      ['mods'],
    garage:    ['garage'],
    state:     ['state'],
    fuel:      ['fuel'],
    drivingdistance: ['drivingdistance']
  },
  houses: {
    table: 'player_houses',
    citizenid: ['citizenid'],
    house:     ['house'],
    label:     ['label'],
    tier:      ['tier']
  }
};

const columnCache = new Map();

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
  const found = (spec[field] || []).find(c => cols.includes(c.toLowerCase())) || null;
  columnCache.set(key, found);
  return found;
}

async function tableExists(group) {
  return (await gameColumns(MAP[group].table)).length > 0;
}

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

/* ===============================================================
   READ
   =============================================================== */
export async function getCharacters(license) {
  if (!license || !(await tableExists('players'))) return null;

  const licCol = await resolve('players', 'license');
  const cidCol = await resolve('players', 'citizenid');
  if (!licCol || !cidCol) return null;

  const rows = await gameQuery(`SELECT * FROM ${MAP.players.table} WHERE ${licCol} = ?`, [license]);
  if (!rows) return null;
  if (!rows.length) return [];

  const [charinfoCol, moneyCol, jobCol, gangCol, metaCol, lastCol] = await Promise.all([
    resolve('players', 'charinfo'), resolve('players', 'money'), resolve('players', 'job'),
    resolve('players', 'gang'), resolve('players', 'metadata'), resolve('players', 'lastUpdated')
  ]);

  return rows.map(r => {
    const info = parseJson(charinfoCol && r[charinfoCol]);
    const money = parseJson(moneyCol && r[moneyCol]);
    const job = parseJson(jobCol && r[jobCol]);
    const gang = parseJson(gangCol && r[gangCol]);
    const meta = parseJson(metaCol && r[metaCol]);

    return {
      id: r[cidCol],
      citizenid: r[cidCol],
      firstName: info.firstname ?? null,
      lastName: info.lastname ?? null,
      dob: info.birthdate ?? null,
      gender: info.gender === 1 || info.gender === '1' ? 'f' : 'm',
      nationality: info.nationality ?? null,
      phone: info.phone ?? null,

      cash: Number(money.cash ?? 0),
      bank: Number(money.bank ?? 0),
      crypto: Number(money.crypto ?? 0),

      job: job.label ?? job.name ?? null,
      jobGrade: job.grade?.name ?? null,
      jobGradeLevel: job.grade?.level ?? null,
      onDuty: !!job.onduty,

      gang: gang.label ?? gang.name ?? null,
      gangGrade: gang.grade?.name ?? null,

      armor: meta.armor ?? null,
      hunger: meta.hunger ?? null,
      thirst: meta.thirst ?? null,
      playtimeMinutes: meta.playtime ?? null,

      lastSeen: lastCol ? r[lastCol] : null
    };
  });
}

export async function getVehicles(license) {
  if (!license || !(await tableExists('vehicles'))) return null;

  const licCol = await resolve('vehicles', 'license');
  const plateCol = await resolve('vehicles', 'plate');
  if (!licCol || !plateCol) return null;

  const [vehCol, garageCol, stateCol, distCol] = await Promise.all([
    resolve('vehicles', 'vehicle'), resolve('vehicles', 'garage'),
    resolve('vehicles', 'state'), resolve('vehicles', 'drivingdistance')
  ]);

  const rows = await gameQuery(`SELECT * FROM ${MAP.vehicles.table} WHERE ${licCol} = ?`, [license]);
  if (!rows) return [];

  const STATE = { 0: 'out', 1: 'stored', 2: 'impound' };

  return rows.map(r => ({
    id: r[plateCol],
    plate: r[plateCol],
    model: vehCol ? String(r[vehCol]) : 'Unknown model',
    garage: garageCol ? r[garageCol] : null,
    state: stateCol ? (STATE[Number(r[stateCol])] ?? 'unknown') : 'unknown',
    mileage: distCol ? Math.round(Number(r[distCol]) || 0) : null
  }));
}

export async function getProperties(citizenid) {
  if (!citizenid || !(await tableExists('houses'))) return null;

  const cidCol = await resolve('houses', 'citizenid');
  if (!cidCol) return null;

  const [houseCol, labelCol, tierCol] = await Promise.all([
    resolve('houses', 'house'), resolve('houses', 'label'), resolve('houses', 'tier')
  ]);

  const rows = await gameQuery(`SELECT * FROM ${MAP.houses.table} WHERE ${cidCol} = ?`, [citizenid]);
  if (!rows) return [];

  return rows.map(r => ({
    id: houseCol ? r[houseCol] : String(r[cidCol]),
    name: labelCol ? r[labelCol] : (houseCol ? r[houseCol] : 'Property'),
    type: 'House',
    district: null,
    tier: tierCol ? r[tierCol] : null,
    value: null, storage: null, garage: null
  }));
}

/* ===============================================================
   WRITE - through the bridge resource
   =============================================================== */
export async function addMoney(target, account, amount) {
  return bridgeAction('money/add', { citizenid: target, account, amount });
}

export async function giveVehicle(target, model, options = {}) {
  const res = await bridgeAction('vehicle/give', { citizenid: target, model, options });
  return res?.plate || 'PENDING';
}

export async function giveItem(target, item, count) {
  return bridgeAction('inventory/give', { citizenid: target, item, count });
}

export async function setVip(license, tier, expiresAt) {
  return bridgeAction('vip/set', {
    license, tier,
    expires: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt
  });
}

export async function addCharacterSlots(license, count) {
  return bridgeAction('slots/add', { license, count });
}

export async function kickPlayer(serverId, reason) {
  return bridgeAction('player/kick', { serverId, reason });
}

export default {
  framework: 'qbcore',
  getCharacters, getVehicles, getProperties,
  addMoney, giveVehicle, giveItem, setVip, addCharacterSlots, kickPlayer,
  MAP
};
