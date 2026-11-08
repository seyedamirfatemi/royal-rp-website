/**
 * ROYAL RP - VoltaBase adapter
 * ---------------------------------------------------------------
 * VoltaBase is the custom framework this server runs. It is an ESX
 * derivative, but it differs from stock ESX in ways that matter:
 *
 *   - money lives in THREE separate INT columns on `users`
 *     (money / bank / black_money), NOT in an `accounts` JSON blob
 *   - the primary identifier is `steam:...`, not `license:...`
 *     (there is a separate `license` column alongside it)
 *   - `gang` / `gang_grade` exist on `users` (stock ESX has no gangs)
 *   - `discord` holds the raw Discord snowflake, which is what makes
 *     website <-> game account linking possible without a code
 *   - playtime is in its own `playtime` table, in seconds
 *   - `coin` on `users` is the existing in-game webshop currency
 *
 * Every column below was read from the live schema
 * (resources/127_0_0_1.sql + information_schema), not assumed.
 * `resolve()` still verifies each one exists before it is used, so a
 * future schema change degrades to "not available" rather than a
 * wrong number or a 500.
 * ---------------------------------------------------------------
 */
import { gameQuery, gameColumns, bridgeAction } from './index.js';

/* Verified against the live `volta` database. */
const MAP = {
  users: {
    table: 'users',
    identifier: ['identifier'],
    license:    ['license'],
    name:       ['playerName'],
    money:      ['money'],
    bank:       ['bank'],
    blackMoney: ['black_money'],
    coin:       ['coin'],
    job:        ['job'],
    jobGrade:   ['job_grade'],
    gang:       ['gang'],
    gangGrade:  ['gang_grade'],
    group:      ['group'],
    discord:    ['discord'],
    phone:      ['phone_number'],
    dob:        ['dateofbirth'],
    sex:        ['sex'],
    xp:         ['xp'],
    rank:       ['rank'],
    score:      ['score'],
    photo:      ['foto'],
    timePlay:   ['timePlay'],
    isDead:     ['is_dead'],
    position:   ['position'],
    skin:       ['skin']
  },
  vehicles: {
    table: 'owned_vehicles',
    owner:     ['owner'],
    plate:     ['plate'],
    data:      ['vehicle'],
    model:     ['modelname'],
    type:      ['type'],
    stored:    ['stored'],
    state:     ['state'],
    job:       ['job'],
    fuel:      ['fuel'],
    engine:    ['engine'],
    body:      ['body'],
    garageId:  ['storedhouse']
  },
  properties: {
    table: 'owned_properties',
    id:    ['id'],
    name:  ['name'],
    price: ['price'],
    rented:['rented'],
    owner: ['owner']
  },
  playtime: {
    table: 'playtime',
    identifier: ['identifier'],
    time:       ['time'],
    login:      ['login']
  },
  jobGrades: {
    table: 'job_grades',
    job:   ['job_name'],
    grade: ['grade'],
    label: ['label'],
    name:  ['name']
  }
};

const cache = new Map();

/** First candidate column that actually exists, else null. */
async function resolve(group, field) {
  const spec = MAP[group];
  if (!spec) return null;
  const key = `${spec.table}.${field}`;
  if (cache.has(key)) return cache.get(key);

  let cols = cache.get('__cols__' + spec.table);
  if (!cols) {
    cols = (await gameColumns(spec.table)).map(c => c.toLowerCase());
    cache.set('__cols__' + spec.table, cols);
  }
  const found = (spec[field] || []).find(c => cols.includes(c.toLowerCase())) || null;
  cache.set(key, found);
  return found;
}

async function tableExists(group) {
  return (await gameColumns(MAP[group].table)).length > 0;
}

/** `group` is reserved in MySQL, so every column gets backticked. */
const q = (col) => '`' + String(col).replace(/`/g, '') + '`';

function parseJson(v, fallback = null) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

/* ===============================================================
   IDENTIFIER HELPERS
   The website stores whatever identifier the player linked with.
   VoltaBase keys `users` on steam:, so accept either and look the
   row up by the column that matches.
   =============================================================== */
function identifierKind(id) {
  const s = String(id || '');
  const i = s.indexOf(':');
  return i === -1 ? 'unknown' : s.slice(0, i).toLowerCase();
}

/** Build a WHERE clause that matches a player by any known identifier. */
async function whereIdentifier(id) {
  const idCol = await resolve('users', 'identifier');
  const licCol = await resolve('users', 'license');
  const discCol = await resolve('users', 'discord');
  const kind = identifierKind(id);

  if (kind === 'license' && licCol) return { sql: `${q(licCol)} = ?`, params: [id] };
  if (kind === 'discord' && discCol) {
    return { sql: `${q(discCol)} = ?`, params: [String(id).replace(/^discord:/, '')] };
  }
  // steam: and anything else -> the primary identifier column
  return { sql: `${q(idCol)} = ?`, params: [id] };
}

/* ===============================================================
   READ
   =============================================================== */
export async function getCharacters(identifier) {
  if (!identifier || !(await tableExists('users'))) return null;

  const idCol = await resolve('users', 'identifier');
  if (!idCol) return null;

  const w = await whereIdentifier(identifier);
  const rows = await gameQuery(`SELECT * FROM ${q(MAP.users.table)} WHERE ${w.sql} LIMIT 5`, w.params);
  if (!rows) return null;
  if (!rows.length) return [];

  const C = {};
  for (const f of ['name', 'money', 'bank', 'blackMoney', 'coin', 'job', 'jobGrade',
                   'gang', 'gangGrade', 'discord', 'phone', 'dob', 'sex', 'xp',
                   'rank', 'score', 'photo', 'timePlay', 'isDead', 'license']) {
    C[f] = await resolve('users', f);
  }

  // Playtime lives in its own table, in seconds.
  const ptIdCol = await resolve('playtime', 'identifier');
  const ptCol = await resolve('playtime', 'time');
  let playtimeByIdent = new Map();
  if (ptIdCol && ptCol) {
    const idents = rows.map(r => r[idCol]);
    const marks = idents.map(() => '?').join(',');
    const pt = await gameQuery(
      `SELECT ${q(ptIdCol)} AS ident, ${q(ptCol)} AS secs FROM ${q(MAP.playtime.table)} WHERE ${q(ptIdCol)} IN (${marks})`,
      idents
    );
    (pt || []).forEach(r => playtimeByIdent.set(r.ident, Number(r.secs) || 0));
  }

  // Readable job label, if job_grades is present.
  const jobLabels = await loadJobLabels();

  return rows.map(r => {
    const ident = r[idCol];
    const jobName = C.job ? r[C.job] : null;
    const gradeNum = C.jobGrade ? Number(r[C.jobGrade]) : null;

    // timePlay on users is a fallback when the playtime table has no row.
    const secs = playtimeByIdent.get(ident) ?? (C.timePlay ? Number(r[C.timePlay]) || 0 : 0);

    const fullName = C.name ? String(r[C.name] || '').trim() : '';
    const [first, ...rest] = fullName.split(/\s+/);

    return {
      id: ident,
      citizenid: ident,
      identifier: ident,
      license: C.license ? r[C.license] : null,

      firstName: first || fullName || null,
      lastName: rest.join(' ') || null,
      dob: C.dob ? r[C.dob] : null,
      gender: C.sex ? r[C.sex] : null,
      phone: C.phone ? r[C.phone] : null,
      avatar: C.photo ? r[C.photo] : null,

      cash: C.money ? Number(r[C.money]) || 0 : 0,
      bank: C.bank ? Number(r[C.bank]) || 0 : 0,
      blackMoney: C.blackMoney ? Number(r[C.blackMoney]) || 0 : 0,
      coin: C.coin ? Number(r[C.coin]) || 0 : 0,

      job: jobLabels.get(`${jobName}:${gradeNum}`)?.jobLabel || jobName || null,
      jobRaw: jobName,
      jobGrade: jobLabels.get(`${jobName}:${gradeNum}`)?.gradeLabel || (gradeNum !== null ? String(gradeNum) : null),
      jobGradeLevel: gradeNum,

      gang: C.gang ? (r[C.gang] === 'nogang' ? null : r[C.gang]) : null,
      gangGrade: C.gangGrade ? String(r[C.gangGrade]) : null,

      xp: C.xp ? Number(r[C.xp]) || 0 : null,
      rank: C.rank ? Number(r[C.rank]) || 0 : null,
      score: C.score ? Number(r[C.score]) || 0 : null,

      playtimeMinutes: Math.floor(secs / 60),
      isDead: C.isDead ? !!Number(r[C.isDead]) : false,
      discordId: C.discord ? r[C.discord] : null,

      /* VoltaBase does not track these, so the dashboard hides them
         rather than printing a made-up value. */
      unavailable: ['health', 'armor', 'hunger', 'thirst', 'crypto']
    };
  });
}

let jobLabelCache = null;
async function loadJobLabels() {
  if (jobLabelCache) return jobLabelCache;
  jobLabelCache = new Map();
  try {
    const cols = (await gameColumns('job_grades')).map(c => c.toLowerCase());
    if (!cols.length) return jobLabelCache;
    const jobCol = cols.includes('job_name') ? 'job_name' : null;
    if (!jobCol) return jobLabelCache;

    const rows = await gameQuery(
      'SELECT `job_name`, `grade`, `label` FROM `job_grades`'
    );
    const jobs = await gameQuery('SELECT `name`, `label` FROM `jobs`').catch(() => []);
    const jobLabelByName = new Map((jobs || []).map(j => [j.name, j.label]));

    (rows || []).forEach(r => {
      jobLabelCache.set(`${r.job_name}:${Number(r.grade)}`, {
        jobLabel: jobLabelByName.get(r.job_name) || r.job_name,
        gradeLabel: r.label
      });
    });
  } catch { /* labels are a nicety, not a requirement */ }
  return jobLabelCache;
}

export async function getVehicles(identifier) {
  if (!identifier || !(await tableExists('vehicles'))) return null;

  const ownerCol = await resolve('vehicles', 'owner');
  const plateCol = await resolve('vehicles', 'plate');
  if (!ownerCol || !plateCol) return null;

  const [dataCol, modelCol, storedCol, stateCol, typeCol, fuelCol] = await Promise.all([
    resolve('vehicles', 'data'), resolve('vehicles', 'model'),
    resolve('vehicles', 'stored'), resolve('vehicles', 'state'),
    resolve('vehicles', 'type'), resolve('vehicles', 'fuel')
  ]);

  // owned_vehicles.owner holds the users.identifier value.
  const rows = await gameQuery(
    `SELECT * FROM ${q(MAP.vehicles.table)} WHERE ${q(ownerCol)} = ?`,
    [identifier]
  );
  if (!rows) return [];

  const STATE = { 0: 'out', 1: 'stored', 2: 'impound' };

  return rows.map(r => {
    let model = modelCol ? r[modelCol] : null;
    if (!model && dataCol) {
      const v = parseJson(r[dataCol], {});
      model = v.model ?? v.modelName ?? v.hash ?? null;
    }
    const stored = storedCol ? Number(r[storedCol]) : null;
    return {
      id: r[plateCol],
      plate: String(r[plateCol] || '').trim(),
      model: model ? String(model) : 'نامشخص',
      type: typeCol ? r[typeCol] : 'car',
      garage: null,
      state: stored === 1 ? 'stored' : (stateCol ? (STATE[Number(r[stateCol])] ?? 'out') : 'out'),
      fuel: fuelCol ? Number(r[fuelCol]) || 0 : null,
      mileage: null
    };
  });
}

export async function getProperties(identifier) {
  if (!identifier || !(await tableExists('properties'))) return null;

  const ownerCol = await resolve('properties', 'owner');
  const nameCol = await resolve('properties', 'name');
  if (!ownerCol || !nameCol) return null;

  const [idCol, priceCol, rentedCol] = await Promise.all([
    resolve('properties', 'id'), resolve('properties', 'price'), resolve('properties', 'rented')
  ]);

  const rows = await gameQuery(
    `SELECT * FROM ${q(MAP.properties.table)} WHERE ${q(ownerCol)} = ?`,
    [identifier]
  );
  if (!rows) return [];

  return rows.map(r => ({
    id: idCol ? r[idCol] : r[nameCol],
    name: r[nameCol],
    type: rentedCol && Number(r[rentedCol]) ? 'اجاره‌ای' : 'ملکی',
    district: null,
    value: priceCol ? Number(r[priceCol]) || 0 : null,
    storage: null,
    garage: null
  }));
}

/* ===============================================================
   ACCOUNT LINKING
   The server runs with sv_exposePlayerIdentifiersInHttpEndpoint,
   and `users.discord` already holds the Discord snowflake. So when
   a player signs in to the site with Discord we can match them to
   their character without asking for an in-game code.
   =============================================================== */
export async function findByDiscord(discordId) {
  if (!discordId) return null;
  const discCol = await resolve('users', 'discord');
  const idCol = await resolve('users', 'identifier');
  if (!discCol || !idCol) return null;

  const clean = String(discordId).replace(/^discord:/, '');
  const rows = await gameQuery(
    `SELECT ${q(idCol)} AS ident FROM ${q(MAP.users.table)} WHERE ${q(discCol)} = ? LIMIT 1`,
    [clean]
  );
  return rows && rows.length ? rows[0].ident : null;
}

/** Does this identifier exist in the game database? */
export async function identifierExists(identifier) {
  const w = await whereIdentifier(identifier);
  const rows = await gameQuery(
    `SELECT 1 AS ok FROM ${q(MAP.users.table)} WHERE ${w.sql} LIMIT 1`, w.params);
  return !!(rows && rows.length);
}

/* ===============================================================
   WRITE
   ---------------------------------------------------------------
   Every write goes through the royal_web_bridge resource rather
   than straight into MySQL. That matters on a live server: if a
   player is online, VoltaBase holds their money and inventory in
   memory and writes it back on save, so a direct UPDATE would be
   silently overwritten a few minutes later.
   The bridge applies the change to the live player when they are
   online, and to the database when they are not.
   =============================================================== */
export async function addMoney(identifier, account, amount) {
  return bridgeAction('money/add', {
    identifier,
    account: account === 'cash' ? 'money' : account,   // VoltaBase column name
    amount: Math.round(Number(amount) || 0)
  });
}

export async function giveVehicle(identifier, model, options = {}) {
  const res = await bridgeAction('vehicle/give', { identifier, model, options });
  return res?.plate || 'PENDING';
}

export async function giveItem(identifier, item, count) {
  return bridgeAction('inventory/give', { identifier, item, count: Math.round(Number(count) || 1) });
}

export async function setVip(identifier, tier, expiresAt) {
  return bridgeAction('vip/set', {
    identifier, tier,
    expires: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt
  });
}

export async function addCharacterSlots(identifier, count) {
  // VoltaBase is single-character per account; extra slots are not a
  // concept here. Report it honestly rather than pretending.
  return { ok: false, unsupported: true,
           reason: 'VoltaBase uses one character per account, so character slots do not apply.' };
}

/** Add in-game webshop coin, the currency VoltaBase already has. */
export async function addCoin(identifier, amount) {
  return bridgeAction('coin/add', { identifier, amount: Math.round(Number(amount) || 0) });
}

export async function kickPlayer(serverId, reason) {
  return bridgeAction('player/kick', { serverId, reason });
}

export default {
  framework: 'volta',
  getCharacters, getVehicles, getProperties,
  findByDiscord, identifierExists,
  addMoney, giveVehicle, giveItem, setVip, addCharacterSlots, addCoin, kickPlayer,
  MAP
};
