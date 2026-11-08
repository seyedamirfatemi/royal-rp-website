/**
 * ROYAL RP - public content endpoints
 *   /api/server/*   live status
 *   /api/news       articles
 *   /api/content/*  staff, gallery, settings
 *   /api/tickets    support
 *   /api/contact    enquiry form
 */
import { Router } from 'express';
import { db } from '../database/db.js';
import { config, integrationStatus } from '../config/index.js';
import {
  asyncRoute, requireAuth, validate, schemas, z,
  limitTickets, limitWrites, notFound, forbidden, badRequest
} from '../middleware/index.js';
import { can } from '../config/roles.js';
import fivem from '../integrations/fivem/index.js';
import discord from '../integrations/discord.js';
import { log, audit } from '../services/logger.js';
import { ticketId, stripTags } from '../utils/index.js';

/* ===============================================================
   SERVER STATUS
   =============================================================== */
export const serverRouter = Router();

serverRouter.get('/status', asyncRoute(async (req, res) => {
  const status = await fivem.status();

  // Discord member count, when the bot is configured.
  let discordMembers = null;
  if (config.discord.botToken && config.discord.guildId) {
    const g = await discord.guildStats();
    discordMembers = g?.members ?? null;
  }

  res.json({ ...status, discordMembers });
}));

serverRouter.get('/info', asyncRoute(async (req, res) => {
  const [info, framework] = await Promise.all([fivem.serverInfo(), fivem.detectFramework()]);
  res.json({
    connected: !!info,
    framework,
    address: config.fivem.publicAddress,
    maxPlayers: config.fivem.maxPlayers,
    vars: info?.vars ? { sv_projectName: info.vars.sv_projectName, sv_projectDesc: info.vars.sv_projectDesc } : null
  });
}));

serverRouter.get('/players', asyncRoute(async (req, res) => {
  const items = await fivem.playerList();
  res.json({ connected: items.length > 0 || !!config.fivem.host, items });
}));

serverRouter.get('/resources', asyncRoute(async (req, res) => {
  const items = await fivem.resourceList();
  res.json({ connected: !!config.fivem.host, items });
}));

/* ===============================================================
   NEWS
   =============================================================== */
export const newsRouter = Router();

function shapeNews(r) {
  return {
    id: r.id, slug: r.slug,
    title: r.title, titleFa: r.title_fa,
    excerpt: r.excerpt, excerptFa: r.excerpt_fa,
    body: r.body, bodyFa: r.body_fa,
    category: r.category, image: r.image,
    author: r.author_name, tags: db.json(r.tags, []),
    readMinutes: r.read_minutes, featured: !!r.featured,
    date: r.published_at || r.created_at
  };
}

newsRouter.get('/', validate(z.object({
  category: z.string().trim().max(32).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: schemas.page
}), 'query'), asyncRoute(async (req, res) => {
  const q = req.validatedQuery;
  const clauses = ['published = 1'];
  const params = [];
  if (q.category && q.category !== 'all') { clauses.push('category = ?'); params.push(q.category); }
  const whereSql = ' WHERE ' + clauses.join(' AND ');

  const total = Number(await db.scalar(`SELECT COUNT(*) AS n FROM news${whereSql}`, params)) || 0;
  const { limit, offset, page } = db.paginate(q.page, q.limit, 50);
  const rows = await db.all(
    `SELECT * FROM news${whereSql} ORDER BY featured DESC, published_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({ items: rows.map(shapeNews), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

newsRouter.get('/:slug', asyncRoute(async (req, res) => {
  const row = await db.get('SELECT * FROM news WHERE slug = ? AND published = 1', [String(req.params.slug).slice(0, 120)]);
  if (!row) throw notFound('That article does not exist');
  res.json(shapeNews(row));
}));

/* ===============================================================
   CONTENT (staff, gallery, settings)
   =============================================================== */
export const contentRouter = Router();

contentRouter.get('/staff', asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT * FROM staff_members WHERE visible = 1 ORDER BY sort_order, name');
  res.json({
    items: rows.map(r => ({
      id: r.id, name: r.name, tag: r.tag, role: r.role,
      bio: r.bio, bioFa: r.bio_fa, avatar: r.avatar, since: r.since
    }))
  });
}));

contentRouter.get('/gallery', asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT * FROM gallery WHERE visible = 1 ORDER BY sort_order, id DESC');
  res.json({
    items: rows.map(r => ({
      id: r.id, src: r.src, title: r.title, titleFa: r.title_fa, tag: r.tag, size: r.size
    }))
  });
}));

/**
 * Real data imported from the running server (jobs, items, properties,
 * gangs, server.cfg). Populated by `npm run import:server`.
 *
 * The item list is the big one: it is what lets the admin product
 * editor offer the 433 real inventory names instead of a free-text
 * field where a typo would silently break delivery.
 */
contentRouter.get('/game-data', asyncRoute(async (req, res) => {
  const rows = await db.all(
    "SELECT key_name, value FROM settings WHERE key_name LIKE 'game.%'"
  );
  const out = {};
  for (const r of rows) out[r.key_name.replace(/^game\./, '')] = db.json(r.value, null);

  res.json({
    imported: rows.length > 0,
    importedAt: out.server?.importedAt || null,
    server: out.server || null,
    jobs: out.jobs || [],
    jobGrades: out.jobGrades || {},
    items: out.items || [],
    properties: out.properties || [],
    gangs: out.gangs || [],
    vehicles: out.vehicles || []
  });
}));

/**
 * FAQ and rules as edited in the admin panel.
 *
 * `source: 'database'` means an operator has saved a version and the
 * public page should use it. `source: 'bundled'` means nothing has
 * been saved yet, so the page falls back to the copy shipped in
 * js/content.js rather than rendering an empty section.
 */
contentRouter.get('/faq', asyncRoute(async (req, res) => {
  const row = await db.get('SELECT value FROM settings WHERE key_name = ?', ['content.faq']);
  const items = db.json(row?.value, []) || [];
  res.json({ source: items.length ? 'database' : 'bundled', items });
}));

contentRouter.get('/rules', asyncRoute(async (req, res) => {
  const row = await db.get('SELECT value FROM settings WHERE key_name = ?', ['content.rules']);
  const sections = db.json(row?.value, []) || [];
  res.json({ source: sections.length ? 'database' : 'bundled', sections });
}));

contentRouter.get('/settings', asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT key_name, value FROM settings WHERE key_name NOT LIKE ?', ['linkcode:%']);
  const out = {};
  for (const r of rows) out[r.key_name] = db.json(r.value, r.value);
  res.json({ settings: out, integrations: integrationStatus() });
}));

/* ===============================================================
   TICKETS
   =============================================================== */
export const ticketRouter = Router();
ticketRouter.use(requireAuth);

async function shapeTicket(row, { withMessages = true } = {}) {
  const out = {
    id: row.id, subject: row.subject, category: row.category,
    priority: row.priority, status: row.status,
    assignee: row.assignee_name || null,
    author: row.author_name || null,
    created: row.created_at, updated: row.updated_at,
    messages: []
  };
  if (withMessages) {
    const msgs = await db.all(
      `SELECT m.*, u.username, u.role FROM ticket_messages m
         JOIN users u ON u.id = m.user_id
        WHERE m.ticket_id = ? ORDER BY m.created_at`,
      [row.id]
    );
    out.messages = msgs.map(m => ({
      id: m.id, author: m.username, role: m.role,
      staff: !!m.is_staff, date: m.created_at,
      text: m.body, files: db.json(m.files, [])
    }));
  }
  return out;
}

ticketRouter.get('/', asyncRoute(async (req, res) => {
  const staffView = can(req.user.role, 'tickets.read') && req.query.scope === 'all';

  const rows = await db.all(
    staffView
      ? `SELECT t.*, u.username AS author_name, a.username AS assignee_name
           FROM tickets t JOIN users u ON u.id = t.user_id
           LEFT JOIN users a ON a.id = t.assignee_id
          ORDER BY (t.status = 'closed'), t.updated_at DESC LIMIT 200`
      : `SELECT t.*, u.username AS author_name, a.username AS assignee_name
           FROM tickets t JOIN users u ON u.id = t.user_id
           LEFT JOIN users a ON a.id = t.assignee_id
          WHERE t.user_id = ? ORDER BY t.updated_at DESC LIMIT 100`,
    staffView ? [] : [req.user.id]
  );

  const items = [];
  for (const r of rows) items.push(await shapeTicket(r));
  res.json({ items });
}));

ticketRouter.get('/:id', asyncRoute(async (req, res) => {
  const row = await db.get(
    `SELECT t.*, u.username AS author_name, a.username AS assignee_name
       FROM tickets t JOIN users u ON u.id = t.user_id
       LEFT JOIN users a ON a.id = t.assignee_id
      WHERE t.id = ?`,
    [String(req.params.id).slice(0, 24)]
  );
  if (!row) throw notFound('Ticket not found');
  if (row.user_id !== req.user.id && !can(req.user.role, 'tickets.read')) throw forbidden();
  res.json(await shapeTicket(row));
}));

const ticketSchema = z.object({
  subject: z.string().trim().min(6, 'Give your ticket a clear subject').max(160),
  category: z.enum(['general', 'billing', 'bug', 'report', 'appeal', 'whitelist', 'other']).default('general'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  message: z.string().trim().min(20, 'Please describe the issue in a little more detail').max(8000)
});

ticketRouter.post('/', limitTickets, validate(ticketSchema), asyncRoute(async (req, res) => {
  const { subject, category, priority, message } = req.body;

  let id = ticketId();
  while (await db.get('SELECT id FROM tickets WHERE id = ?', [id])) id = ticketId();

  await db.transaction(async (tx) => {
    await tx.run(
      `INSERT INTO tickets (id, user_id, subject, category, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
      [id, req.user.id, stripTags(subject), category, priority, db.now(), db.now()]
    );
    await tx.run(
      `INSERT INTO ticket_messages (ticket_id, user_id, is_staff, body, files, created_at)
       VALUES (?, ?, 0, ?, ?, ?)`,
      [id, req.user.id, stripTags(message), '[]', db.now()]
    );
  });

  await log({
    category: 'website', severity: 'info',
    message: `${req.user.username} تیکت ${id} را باز کرد (${category})`,
    actorId: req.user.id, actorName: req.user.username, target: id, req
  });

  const row = await db.get(
    `SELECT t.*, u.username AS author_name FROM tickets t JOIN users u ON u.id = t.user_id WHERE t.id = ?`, [id]);
  res.status(201).json(await shapeTicket(row));
}));

ticketRouter.post('/:id/reply', limitWrites,
  validate(z.object({ text: z.string().trim().min(1).max(8000) })),
  asyncRoute(async (req, res) => {
    const id = String(req.params.id).slice(0, 24);
    const ticket = await db.get('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!ticket) throw notFound('Ticket not found');

    const isStaff = can(req.user.role, 'tickets.reply');
    if (ticket.user_id !== req.user.id && !isStaff) throw forbidden();
    if (ticket.status === 'closed') throw badRequest('That ticket is closed. Reopen it first.', 'ticket_closed');

    await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO ticket_messages (ticket_id, user_id, is_staff, body, files, created_at)
         VALUES (?, ?, ?, ?, '[]', ?)`,
        [id, req.user.id, isStaff && ticket.user_id !== req.user.id ? 1 : 0, stripTags(req.body.text), db.now()]
      );
      await tx.run(
        'UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?',
        [isStaff && ticket.user_id !== req.user.id ? 'answered' : 'pending', db.now(), id]
      );
    });

    // Tell the other side.
    if (isStaff && ticket.user_id !== req.user.id) {
      await db.run(
        `INSERT INTO notifications (user_id, type, title, body, icon, link, created_at)
         VALUES (?, 'ticket', ?, ?, 'ticket', ?, ?)`,
        [ticket.user_id, 'Support replied',
         `${req.user.username} answered your ticket ${id}.`,
         `/pages/support.html?ticket=${id}`, db.now()]
      );
    }

    const row = await db.get(
      `SELECT t.*, u.username AS author_name, a.username AS assignee_name
         FROM tickets t JOIN users u ON u.id = t.user_id
         LEFT JOIN users a ON a.id = t.assignee_id WHERE t.id = ?`, [id]);
    res.json(await shapeTicket(row));
  })
);

ticketRouter.post('/:id/close', asyncRoute(async (req, res) => {
  const id = String(req.params.id).slice(0, 24);
  const ticket = await db.get('SELECT * FROM tickets WHERE id = ?', [id]);
  if (!ticket) throw notFound('Ticket not found');
  if (ticket.user_id !== req.user.id && !can(req.user.role, 'tickets.reply')) throw forbidden();

  await db.run('UPDATE tickets SET status = ?, closed_at = ?, updated_at = ? WHERE id = ?',
    ['closed', db.now(), db.now(), id]);
  res.json({ ok: true });
}));

ticketRouter.post('/:id/reopen', asyncRoute(async (req, res) => {
  const id = String(req.params.id).slice(0, 24);
  const ticket = await db.get('SELECT * FROM tickets WHERE id = ?', [id]);
  if (!ticket) throw notFound('Ticket not found');
  if (ticket.user_id !== req.user.id && !can(req.user.role, 'tickets.reply')) throw forbidden();

  await db.run('UPDATE tickets SET status = ?, closed_at = NULL, updated_at = ? WHERE id = ?',
    ['open', db.now(), id]);
  res.json({ ok: true });
}));

/* ===============================================================
   CONTACT FORM
   =============================================================== */
export const contactRouter = Router();

contactRouter.post('/', limitTickets,
  validate(z.object({
    name: z.string().trim().min(2).max(80),
    email: schemas.email,
    subject: z.string().trim().min(4).max(160),
    message: z.string().trim().min(20).max(5000),
    privacy: z.coerce.boolean().refine(v => v === true, 'Please accept the privacy notice')
  })),
  asyncRoute(async (req, res) => {
    const { name, email, subject, message } = req.body;

    await log({
      category: 'website', severity: 'info',
      message: `فرم تماس: «${stripTags(subject)}» از ${name} <${email}>`,
      req, meta: { name, email, subject: stripTags(subject), message: stripTags(message).slice(0, 2000) }
    });

    // Hook an email or Discord webhook in here when you have one.
    res.json({ ok: true, message: 'سپاسگزاریم - به‌زودی پاسخ می‌دهیم.' });
  })
);

export default { serverRouter, newsRouter, contentRouter, ticketRouter, contactRouter };
