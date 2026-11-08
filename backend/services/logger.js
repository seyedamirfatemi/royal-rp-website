/**
 * ROYAL RP - logging service
 * ---------------------------------------------------------------
 * Two tables, deliberately separate:
 *
 *   logs       operational events, 90-day retention, readable by
 *              Moderator and above
 *   audit_log  who changed what, 365-day retention, readable only
 *              by Head Admin / Developer / Owner
 *
 * Nothing in the application ever UPDATEs or DELETEs a log row.
 * Only the retention sweep removes anything, and only by age.
 * ---------------------------------------------------------------
 */
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { clientIp, userAgent } from '../utils/index.js';

/** Subscribers for the live log WebSocket channel. */
const liveSubscribers = new Set();

export function onLive(fn) {
  liveSubscribers.add(fn);
  return () => liveSubscribers.delete(fn);
}

function broadcast(entry) {
  for (const fn of liveSubscribers) {
    try { fn(entry); } catch { /* a dead socket must not break logging */ }
  }
}

const SEVERITIES = new Set(['info', 'success', 'warning', 'error', 'critical']);

/**
 * Write an operational log line.
 * Never throws: a logging failure must not take down a request.
 */
export async function log({
  category, severity = 'info', message,
  actorId = null, actorName = null, target = null,
  source = 'website', ip = null, meta = null, req = null
}) {
  const entry = {
    ts: db.now(),
    category: String(category || 'website').slice(0, 32),
    severity: SEVERITIES.has(severity) ? severity : 'info',
    message: String(message || '').slice(0, 2000),
    actor_id: actorId,
    actor_name: actorName ? String(actorName).slice(0, 64) : null,
    target: target ? String(target).slice(0, 120) : null,
    source,
    ip: ip || (req ? clientIp(req) : null),
    meta: meta ? JSON.stringify(meta).slice(0, 4000) : null
  };

  if (config.logs.console) {
    const tag = entry.severity.toUpperCase().padEnd(8);
    console.log(`  [${tag}] ${entry.category.padEnd(14)} ${entry.message}`);
  }

  try {
    const res = await db.run(
      `INSERT INTO logs (ts, category, severity, message, actor_id, actor_name, target, source, ip, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry.ts, entry.category, entry.severity, entry.message, entry.actor_id,
       entry.actor_name, entry.target, entry.source, entry.ip, entry.meta]
    );
    broadcast({ id: 'log_' + res.lastId, ...entry, meta: entry.meta ? JSON.parse(entry.meta) : null });
  } catch (err) {
    console.error('  [logger] could not write log:', err.message);
  }
}

/* Shorthands */
export const logInfo    = (category, message, extra = {}) => log({ category, message, severity: 'info', ...extra });
export const logSuccess = (category, message, extra = {}) => log({ category, message, severity: 'success', ...extra });
export const logWarn    = (category, message, extra = {}) => log({ category, message, severity: 'warning', ...extra });
export const logError   = (category, message, extra = {}) => log({ category, message, severity: 'error', ...extra });
export const logCrit    = (category, message, extra = {}) => log({ category, message, severity: 'critical', ...extra });

/**
 * Record a privileged change: who did it, to what, before and after.
 * Call this for every admin mutation.
 */
export async function audit(req, { action, target = null, before = null, after = null }) {
  const actor = req?.user || null;
  try {
    await db.run(
      `INSERT INTO audit_log (ts, actor_id, actor_name, action, target, before_val, after_val, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        db.now(),
        actor?.id ?? null,
        actor?.username ?? null,
        String(action).slice(0, 64),
        target ? String(target).slice(0, 120) : null,
        before ? JSON.stringify(before).slice(0, 4000) : null,
        after ? JSON.stringify(after).slice(0, 4000) : null,
        req ? clientIp(req) : null,
        req ? userAgent(req) : null
      ]
    );
  } catch (err) {
    console.error('  [audit] could not write audit entry:', err.message);
  }

  // Privileged changes also appear in the normal log so moderators see them.
  await log({
    category: 'admin.action',
    severity: 'warning',
    message: `${actor?.username || 'system'} عملیات ${action} را انجام داد${target ? ` روی ${target}` : ''}`,
    actorId: actor?.id ?? null,
    actorName: actor?.username ?? null,
    target, req
  });
}

/* ===============================================================
   READING
   =============================================================== */
export async function queryLogs({
  page = 1, perPage = 50, category, severity, q, from, to, source
} = {}) {
  const { limit, offset, page: p } = db.paginate(page, perPage, 500);

  const clauses = [];
  const params = [];
  if (category && category !== 'all') { clauses.push('category = ?'); params.push(category); }
  if (severity && severity !== 'all') { clauses.push('severity = ?'); params.push(severity); }
  if (source && source !== 'all')     { clauses.push('source = ?');   params.push(source); }
  if (from) { clauses.push('ts >= ?'); params.push(String(from).slice(0, 10) + ' 00:00:00'); }
  if (to)   { clauses.push('ts <= ?'); params.push(String(to).slice(0, 10) + ' 23:59:59'); }
  if (q) {
    clauses.push('(message LIKE ? OR actor_name LIKE ? OR target LIKE ?)');
    const like = `%${String(q).slice(0, 80)}%`;
    params.push(like, like, like);
  }
  const whereSql = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';

  const total = Number(await db.scalar(`SELECT COUNT(*) AS n FROM logs${whereSql}`, params)) || 0;
  const rows = await db.all(
    `SELECT * FROM logs${whereSql} ORDER BY ts DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    items: rows.map(r => ({
      id: 'log_' + r.id,
      ts: r.ts,
      category: r.category,
      severity: r.severity,
      message: r.message,
      actor: r.actor_name,
      actorId: r.actor_id,
      target: r.target,
      source: r.source,
      ip: r.ip,
      meta: db.json(r.meta, {})
    })),
    total, page: p, perPage: limit, pages: Math.max(1, Math.ceil(total / limit))
  };
}

export async function queryAudit({ page = 1, perPage = 50 } = {}) {
  const { limit, offset, page: p } = db.paginate(page, perPage, 500);
  const total = Number(await db.scalar('SELECT COUNT(*) AS n FROM audit_log')) || 0;
  const rows = await db.all('SELECT * FROM audit_log ORDER BY ts DESC, id DESC LIMIT ? OFFSET ?', [limit, offset]);
  return {
    items: rows.map(r => ({
      id: r.id, ts: r.ts, actor: r.actor_name, actorId: r.actor_id,
      action: r.action, target: r.target,
      before: db.json(r.before_val), after: db.json(r.after_val),
      ip: r.ip, userAgent: r.user_agent
    })),
    total, page: p, perPage: limit, pages: Math.max(1, Math.ceil(total / limit))
  };
}

/* ===============================================================
   RETENTION
   The only thing allowed to remove log rows, and only by age.
   =============================================================== */
export async function sweepRetention() {
  const cut = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');
  try {
    const a = await db.run('DELETE FROM logs WHERE ts < ?', [cut(config.logs.retentionDays)]);
    const b = await db.run('DELETE FROM audit_log WHERE ts < ?', [cut(config.logs.securityRetentionDays)]);
    const c = await db.run('DELETE FROM login_attempts WHERE created_at < ?', [cut(30)]);
    const d = await db.run('DELETE FROM sessions WHERE expires_at < ?', [db.now()]);
    const e = await db.run('DELETE FROM oauth_states WHERE expires_at < ?', [db.now()]);
    if (a.changes || b.changes || c.changes || d.changes || e.changes) {
      console.log(`  [retention] logs:${a.changes} audit:${b.changes} attempts:${c.changes} sessions:${d.changes} oauth:${e.changes}`);
    }
  } catch (err) {
    console.error('  [retention] sweep failed:', err.message);
  }
}

export default { log, logInfo, logSuccess, logWarn, logError, logCrit, audit, queryLogs, queryAudit, onLive, sweepRetention };
