/**
 * ROYAL RP - /api/admin
 * ---------------------------------------------------------------
 * Every route here declares the permission it needs. The check runs
 * on this side of the wire, against config/roles.js. The front-end's
 * copy of the role table only decides what to draw.
 * ---------------------------------------------------------------
 */
import { Router } from 'express';
import { db } from '../database/db.js';
import { config, integrationStatus } from '../config/index.js';
import { ROLES, canAssignRole } from '../config/roles.js';
import {
  asyncRoute, requirePermission, requireAuth, validate, schemas, z,
  limitWrites, notFound, forbidden, badRequest, conflict
} from '../middleware/index.js';
import orders from '../services/orders.js';
import { queryLogs, queryAudit, audit, log } from '../services/logger.js';
import { deliverOrder, retryPendingDeliveries } from '../services/delivery.js';
import { destroyAllForUser } from '../services/sessions.js';
import fivem from '../integrations/fivem/index.js';
import { slugify, sanitizeHtml, stripTags } from '../utils/index.js';
import adminContent from './admin-content.js';

const router = Router();
router.use(requireAuth);
router.use(requirePermission('panel.view'));

/* Content management: staff, gallery, FAQ, rules, media, uploads. */
router.use('/', adminContent);

/* ===============================================================
   DASHBOARD STATS
   =============================================================== */
router.get('/stats', asyncRoute(async (req, res) => {
  const stats = await orders.orderStats();
  const status = await fivem.status();
  res.json({ ...stats, onlineNow: status.players || 0, serverConnected: status.connected });
}));

router.get('/charts/revenue', asyncRoute(async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  res.json({ items: await orders.revenueSeries(days) });
}));

router.get('/charts/growth', asyncRoute(async (req, res) => {
  const rows = await db.all(
    `SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS n
       FROM users GROUP BY month ORDER BY month DESC LIMIT 12`
  );
  let running = Number(await db.scalar('SELECT COUNT(*) AS n FROM users')) || 0;
  const out = [];
  for (const r of rows) { out.unshift({ label: r.month, value: running }); running -= Number(r.n); }
  res.json({ items: out });
}));

router.get('/charts/categories', asyncRoute(async (req, res) => {
  const rows = await db.all(
    `SELECT p.category_id AS label, COALESCE(SUM(oi.line_total), 0) AS value
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE o.status IN ('paid','delivered')
      GROUP BY p.category_id ORDER BY value DESC`
  );
  const COLOURS = ['#d4af37', '#ffd700', '#9c7c1b', '#c98b4b', '#6b6b6b', '#8a6d14'];
  res.json({ items: rows.map((r, i) => ({ label: r.label, value: Number(r.value), color: COLOURS[i % COLOURS.length] })) });
}));

/* ===============================================================
   USERS
   =============================================================== */
router.get('/users', requirePermission('users.read'),
  validate(z.object({
    q: z.string().trim().max(80).optional(),
    role: z.string().trim().max(24).optional(),
    status: z.string().trim().max(16).optional(),
    page: schemas.page,
    perPage: z.coerce.number().int().min(1).max(200).default(25)
  }), 'query'),
  asyncRoute(async (req, res) => {
    const q = req.validatedQuery;
    const clauses = [];
    const params = [];
    if (q.role && q.role !== 'all')     { clauses.push('role = ?');   params.push(q.role); }
    if (q.status && q.status !== 'all') { clauses.push('status = ?'); params.push(q.status); }
    if (q.q) {
      clauses.push('(username LIKE ? OR email LIKE ? OR display_name LIKE ? OR discord_id LIKE ?)');
      const like = `%${q.q}%`;
      params.push(like, like, like, like);
    }
    const whereSql = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';

    const total = Number(await db.scalar(`SELECT COUNT(*) AS n FROM users${whereSql}`, params)) || 0;
    const { limit, offset, page } = db.paginate(q.page, q.perPage, 200);
    const rows = await db.all(
      `SELECT id, username, email, role, status, display_name, avatar_url, discord_id,
              game_license, wallet_balance, total_spent, last_login_at, created_at
         FROM users${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      items: rows.map(u => ({
        id: u.id, username: u.username, displayName: u.display_name || u.username,
        email: u.email, role: u.role, status: u.status, avatar: u.avatar_url,
        discordId: u.discord_id, gameLicense: u.game_license,
        walletBalance: Number(u.wallet_balance) || 0,
        totalSpent: Number(u.total_spent) || 0,
        lastSeen: u.last_login_at, createdAt: u.created_at
      })),
      total, page, perPage: limit, pages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

router.get('/users/:id', requirePermission('users.read'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const u = await db.get('SELECT * FROM users WHERE id = ?', [id]);
  if (!u) throw notFound('User not found');

  const [orderCount, tickets, entitlements] = await Promise.all([
    db.scalar('SELECT COUNT(*) AS n FROM orders WHERE user_id = ?', [id]),
    db.all('SELECT id, subject, status, created_at FROM tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [id]),
    db.all('SELECT kind, value, expires_at FROM entitlements WHERE user_id = ? AND revoked_at IS NULL', [id])
  ]);

  res.json({
    id: u.id, username: u.username, displayName: u.display_name, email: u.email,
    role: u.role, status: u.status, avatar: u.avatar_url,
    discordId: u.discord_id, discordTag: u.discord_tag, gameLicense: u.game_license,
    walletBalance: Number(u.wallet_balance) || 0, totalSpent: Number(u.total_spent) || 0,
    suspendedUntil: u.suspended_until, suspendReason: u.suspend_reason,
    lastSeen: u.last_login_at, lastIp: u.last_login_ip, createdAt: u.created_at,
    orders: Number(orderCount) || 0, tickets, entitlements
  });
}));

router.patch('/users/:id', requirePermission('users.update'), limitWrites,
  validate(z.object({
    displayName: z.string().trim().max(64).optional(),
    email: schemas.email.optional(),
    walletBalance: z.coerce.number().int().min(0).max(500_000_000).optional()
  })),
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id) || 0;
    const before = await db.get('SELECT display_name, email, wallet_balance FROM users WHERE id = ?', [id]);
    if (!before) throw notFound('User not found');

    const sets = [], params = [];
    if (req.body.displayName !== undefined)   { sets.push('display_name = ?');   params.push(req.body.displayName); }
    if (req.body.email !== undefined)         { sets.push('email = ?');          params.push(req.body.email); }
    if (req.body.walletBalance !== undefined) { sets.push('wallet_balance = ?'); params.push(req.body.walletBalance); }
    if (!sets.length) return res.json({ ok: true, unchanged: true });

    sets.push('updated_at = ?'); params.push(db.now(), id);
    await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

    await audit(req, { action: 'user.update', target: `user:${id}`, before, after: req.body });
    res.json({ ok: true });
  })
);

router.post('/users/:id/role', requirePermission('users.setRole'), limitWrites,
  validate(z.object({ role: z.enum(Object.keys(ROLES)) })),
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id) || 0;
    const target = await db.get('SELECT id, username, role FROM users WHERE id = ?', [id]);
    if (!target) throw notFound('User not found');

    if (target.id === req.user.id) throw badRequest('You cannot change your own role', 'self_role_change');

    // You cannot grant a role at or above your own level, and you
    // cannot demote somebody who outranks you.
    if (!canAssignRole(req.user.role, req.body.role)) {
      throw forbidden('You cannot assign a role at or above your own level', 'role_too_high');
    }
    if (ROLES[target.role].level >= ROLES[req.user.role].level && req.user.role !== 'owner') {
      throw forbidden('You cannot change the role of someone at or above your level', 'target_outranks_you');
    }

    await db.run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [req.body.role, db.now(), id]);
    // Force a fresh session so the new role takes effect everywhere.
    await destroyAllForUser(id);

    await audit(req, {
      action: 'user.setRole', target: `user:${id} (${target.username})`,
      before: { role: target.role }, after: { role: req.body.role }
    });
    res.json({ ok: true });
  })
);

router.post('/users/:id/suspend', requirePermission('users.suspend'), limitWrites,
  validate(z.object({
    suspended: z.coerce.boolean(),
    reason: z.string().trim().max(255).optional().default(''),
    days: z.coerce.number().int().min(0).max(3650).optional()
  })),
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id) || 0;
    const target = await db.get('SELECT id, username, role, status FROM users WHERE id = ?', [id]);
    if (!target) throw notFound('User not found');
    if (target.id === req.user.id) throw badRequest('You cannot suspend your own account', 'self_suspend');
    if (ROLES[target.role].level >= ROLES[req.user.role].level && req.user.role !== 'owner') {
      throw forbidden('You cannot suspend someone at or above your level', 'target_outranks_you');
    }

    if (req.body.suspended) {
      const until = req.body.days ? db.future(req.body.days * 86400000) : null;
      await db.run(
        `UPDATE users SET status = 'suspended', suspended_until = ?, suspend_reason = ?, updated_at = ? WHERE id = ?`,
        [until, req.body.reason, db.now(), id]
      );
      await destroyAllForUser(id);
    } else {
      await db.run(
        `UPDATE users SET status = 'active', suspended_until = NULL, suspend_reason = NULL, updated_at = ? WHERE id = ?`,
        [db.now(), id]
      );
    }

    await audit(req, {
      action: req.body.suspended ? 'user.suspend' : 'user.reinstate',
      target: `user:${id} (${target.username})`,
      after: { reason: req.body.reason, days: req.body.days || null }
    });
    res.json({ ok: true });
  })
);

/* ===============================================================
   PRODUCTS
   =============================================================== */
const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  nameFa: z.string().trim().max(120).nullish(),
  slug: z.string().trim().max(80).optional(),
  category: z.string().trim().min(1).max(32),
  short: z.string().trim().max(1000).nullish(),
  shortFa: z.string().trim().max(1000).nullish(),
  features: z.array(z.string().trim().max(160)).max(20).optional().default([]),
  image: z.string().trim().max(255).nullish(),
  price: z.coerce.number().int().min(0).max(500_000_000),
  oldPrice: z.coerce.number().int().min(0).max(500_000_000).nullish(),
  stock: z.coerce.number().int().min(0).max(1000000).nullish(),
  maxPerOrder: z.coerce.number().int().min(1).max(100).default(5),
  duration: z.string().trim().max(32).nullish(),
  badge: z.string().trim().max(24).nullish(),
  featured: z.coerce.boolean().default(false),
  popular: z.coerce.boolean().default(false),
  visible: z.coerce.boolean().default(true),
  deliveryType: z.enum(['manual', 'vip', 'money', 'coin', 'vehicle', 'item', 'role', 'slot']).default('manual'),
  deliveryPayload: z.record(z.string(), z.any()).nullish(),
  deliveryNote: z.string().trim().max(500).nullish()
});

router.get('/products', requirePermission('shop.read'), asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT * FROM products ORDER BY sort_order, name');
  res.json({
    items: rows.map(r => ({
      id: r.id, slug: r.slug, name: r.name, category: r.category_id,
      price: Number(r.price), oldPrice: r.old_price === null ? null : Number(r.old_price),
      stock: r.stock, maxPerOrder: r.max_per_order, image: r.image,
      featured: !!r.featured, popular: !!r.popular, visible: !!r.visible,
      badge: r.badge, deliveryType: r.delivery_type,
      deliveryPayload: db.json(r.delivery_payload, {}),
      features: db.json(r.features, [])
    }))
  });
}));

router.post('/products', requirePermission('shop.write'), limitWrites,
  validate(productSchema), asyncRoute(async (req, res) => {
    const b = req.body;
    const slug = slugify(b.slug || b.name);
    const id = slug;

    if (await db.get('SELECT id FROM products WHERE id = ? OR slug = ?', [id, slug])) {
      throw conflict('A product with that slug already exists', 'slug_taken');
    }
    if (!await db.get('SELECT id FROM categories WHERE id = ?', [b.category])) {
      throw badRequest('Unknown category', 'bad_category');
    }

    await db.run(
      `INSERT INTO products
        (id, slug, category_id, name, name_fa, short, short_fa, features, image,
         price, old_price, currency, stock, max_per_order, duration, badge,
         featured, popular, visible, delivery_type, delivery_payload, delivery_note,
         created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, slug, b.category, b.name, b.nameFa ?? null, b.short ?? null, b.shortFa ?? null,
       db.toJson(b.features), b.image ?? 'assets/images/products/placeholder.svg',
       b.price, b.oldPrice ?? null, config.payments.currency, b.stock ?? null,
       b.maxPerOrder, b.duration ?? null, b.badge ?? null,
       b.featured ? 1 : 0, b.popular ? 1 : 0, b.visible ? 1 : 0,
       b.deliveryType, db.toJson(b.deliveryPayload), b.deliveryNote ?? null,
       db.now(), db.now()]
    );

    await audit(req, { action: 'product.create', target: `product:${id}`, after: b });
    res.status(201).json({ ok: true, id });
  })
);

router.patch('/products/:id', requirePermission('shop.write'), limitWrites,
  validate(productSchema.partial()), asyncRoute(async (req, res) => {
    const id = String(req.params.id).slice(0, 48);
    const before = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!before) throw notFound('Product not found');

    const COLS = {
      name: 'name', nameFa: 'name_fa', category: 'category_id',
      short: 'short', shortFa: 'short_fa', image: 'image',
      price: 'price', oldPrice: 'old_price', stock: 'stock',
      maxPerOrder: 'max_per_order', duration: 'duration', badge: 'badge',
      deliveryType: 'delivery_type', deliveryNote: 'delivery_note'
    };

    const sets = [], params = [];
    for (const [key, col] of Object.entries(COLS)) {
      if (req.body[key] !== undefined) { sets.push(`${col} = ?`); params.push(req.body[key]); }
    }
    for (const flag of ['featured', 'popular', 'visible']) {
      if (req.body[flag] !== undefined) { sets.push(`${flag} = ?`); params.push(req.body[flag] ? 1 : 0); }
    }
    if (req.body.features !== undefined)        { sets.push('features = ?');         params.push(db.toJson(req.body.features)); }
    if (req.body.deliveryPayload !== undefined) { sets.push('delivery_payload = ?'); params.push(db.toJson(req.body.deliveryPayload)); }

    if (!sets.length) return res.json({ ok: true, unchanged: true });
    sets.push('updated_at = ?'); params.push(db.now(), id);

    await db.run(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, params);
    await audit(req, {
      action: 'product.update', target: `product:${id}`,
      before: { price: Number(before.price), stock: before.stock, name: before.name },
      after: req.body
    });
    res.json({ ok: true });
  })
);

router.delete('/products/:id', requirePermission('shop.write'), limitWrites, asyncRoute(async (req, res) => {
  const id = String(req.params.id).slice(0, 48);
  const before = await db.get('SELECT id, name FROM products WHERE id = ?', [id]);
  if (!before) throw notFound('Product not found');

  // Orders reference products, so hide rather than delete to keep history intact.
  await db.run('UPDATE products SET visible = 0, updated_at = ? WHERE id = ?', [db.now(), id]);
  await audit(req, { action: 'product.delete', target: `product:${id}`, before });
  res.json({ ok: true, softDeleted: true });
}));

/* ===============================================================
   COUPONS
   =============================================================== */
router.get('/coupons', requirePermission('shop.read'), asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT * FROM coupons ORDER BY created_at DESC');
  res.json({
    items: rows.map(c => ({
      code: c.code, type: c.type, value: Number(c.value),
      minSpend: Number(c.min_spend), maxDiscount: c.max_discount === null ? null : Number(c.max_discount),
      maxUses: c.max_uses, usedCount: c.used_count, perUser: c.per_user,
      expires: c.expires_at, active: !!c.active, label: c.label
    }))
  });
}));

router.post('/coupons', requirePermission('shop.write'), limitWrites,
  validate(z.object({
    code: z.string().trim().regex(/^[A-Z0-9_-]{3,32}$/i, 'Use 3-32 letters, numbers, - or _'),
    type: z.enum(['percent', 'fixed']),
    value: z.coerce.number().min(0).max(500_000_000),
    minSpend: z.coerce.number().int().min(0).max(500_000_000).default(0),
    maxDiscount: z.coerce.number().int().min(0).max(500_000_000).nullish(),
    maxUses: z.coerce.number().int().min(1).max(1000000).nullish(),
    perUser: z.coerce.number().int().min(1).max(100).default(1),
    expires: z.string().trim().max(32).nullish(),
    label: z.string().trim().max(120).nullish()
  })),
  asyncRoute(async (req, res) => {
    const b = req.body;
    const code = b.code.toUpperCase();
    if (b.type === 'percent' && b.value > 100) throw badRequest('A percentage discount cannot exceed 100', 'bad_percent');
    if (await db.get('SELECT code FROM coupons WHERE code = ?', [code])) throw conflict('That code already exists', 'code_taken');

    await db.run(
      `INSERT INTO coupons (code, type, value, min_spend, max_discount, max_uses, per_user, expires_at, active, label, created_at)
       VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
      [code, b.type, b.value, b.minSpend, b.maxDiscount ?? null, b.maxUses ?? null,
       b.perUser, b.expires ? `${b.expires} 23:59:59` : null, b.label ?? null, db.now()]
    );
    await audit(req, { action: 'coupon.create', target: `coupon:${code}`, after: b });
    res.status(201).json({ ok: true, code });
  })
);

router.delete('/coupons/:code', requirePermission('shop.write'), limitWrites, asyncRoute(async (req, res) => {
  const code = String(req.params.code).toUpperCase().slice(0, 32);
  const r = await db.run('UPDATE coupons SET active = 0 WHERE code = ?', [code]);
  if (!r.changes) throw notFound('Coupon not found');
  await audit(req, { action: 'coupon.disable', target: `coupon:${code}` });
  res.json({ ok: true });
}));

/* ===============================================================
   ORDERS
   =============================================================== */
router.get('/orders', requirePermission('orders.read'), asyncRoute(async (req, res) => {
  res.json(await orders.listAllOrders({
    page: req.query.page, perPage: req.query.perPage,
    status: req.query.status, q: req.query.q
  }));
}));

router.post('/orders/:id/refund', requirePermission('orders.refund'), limitWrites,
  validate(z.object({ reason: z.string().trim().max(255).optional().default('') })),
  asyncRoute(async (req, res) => {
    const order = await orders.refundOrder(req, String(req.params.id).slice(0, 24), req.body.reason);
    await audit(req, { action: 'order.refund', target: `order:${order.id}`, after: { reason: req.body.reason, total: order.total } });
    res.json(order);
  })
);

router.post('/orders/:id/redeliver', requirePermission('orders.redeliver'), limitWrites, asyncRoute(async (req, res) => {
  const id = String(req.params.id).slice(0, 24);
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) throw notFound('Order not found');
  if (!['paid', 'delivered'].includes(order.status)) throw badRequest('Only a paid order can be re-delivered', 'not_paid');

  // Clear the idempotency key so the delivery runs again, deliberately.
  await db.run('UPDATE orders SET delivery_key = NULL, delivery_error = NULL WHERE id = ?', [id]);
  await db.run('UPDATE order_items SET delivered = 0 WHERE order_id = ?', [id]);

  const result = await deliverOrder(id, order.payment_ref);
  await audit(req, { action: 'order.redeliver', target: `order:${id}`, after: result });
  res.json(result);
}));

router.post('/orders/retry-pending', requirePermission('orders.redeliver'), asyncRoute(async (req, res) => {
  res.json(await retryPendingDeliveries());
}));

/* ===============================================================
   LOGS
   =============================================================== */
router.get('/logs', requirePermission('logs.read'), asyncRoute(async (req, res) => {
  const q = req.query;

  // Security-category logs need the higher permission.
  if (q.category === 'security' && !req.user) throw forbidden();
  const result = await queryLogs({
    page: q.page, perPage: q.perPage || q.limit,
    category: q.category, severity: q.severity, q: q.q,
    from: q.from, to: q.to, source: q.source
  });

  // Strip security lines for anyone without logs.readSecurity.
  const { can } = await import('../config/roles.js');
  if (!can(req.user.role, 'logs.readSecurity')) {
    result.items = result.items.filter(l => l.category !== 'security');
  }
  res.json(result);
}));

router.get('/logs/export', requirePermission('logs.export'), asyncRoute(async (req, res) => {
  const result = await queryLogs({ ...req.query, perPage: 5000 });
  const format = req.query.format === 'json' ? 'json' : 'csv';

  await audit(req, { action: 'logs.export', target: `${result.items.length} rows`, after: { format } });

  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename="royalrp-logs.json"');
    return res.json(result.items);
  }

  const cols = ['id', 'ts', 'severity', 'category', 'message', 'actor', 'target', 'source', 'ip'];
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...result.items.map(r => cols.map(c => esc(r[c])).join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="royalrp-logs.csv"');
  res.send('﻿' + csv);
}));

router.get('/audit', requirePermission('logs.readSecurity'), asyncRoute(async (req, res) => {
  res.json(await queryAudit({ page: req.query.page, perPage: req.query.perPage }));
}));

/* ===============================================================
   NEWS
   =============================================================== */
router.get('/news', requirePermission('news.write'), asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT * FROM news ORDER BY created_at DESC LIMIT 200');
  res.json({
    items: rows.map(r => ({
      id: r.id, slug: r.slug, title: r.title, category: r.category,
      author: r.author_name, published: !!r.published,
      date: r.published_at || r.created_at, image: r.image
    }))
  });
}));

const newsSchema = z.object({
  title: z.string().trim().min(4).max(200),
  titleFa: z.string().trim().max(200).nullish(),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().trim().max(1000).nullish(),
  excerptFa: z.string().trim().max(1000).nullish(),
  body: z.string().max(60000).nullish(),
  category: z.enum(['update', 'announcement', 'event', 'security', 'maintenance']).default('update'),
  image: z.string().trim().max(255).nullish(),
  tags: z.array(z.string().trim().max(32)).max(10).optional().default([]),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(false)
});

router.post('/news', requirePermission('news.write'), limitWrites,
  validate(newsSchema), asyncRoute(async (req, res) => {
    const b = req.body;
    let slug = slugify(b.slug || b.title);
    while (await db.get('SELECT id FROM news WHERE slug = ?', [slug])) slug = `${slug}-${Math.floor(Math.random() * 99)}`;

    const clean = sanitizeHtml(b.body || '');
    const words = stripTags(clean).split(/\s+/).filter(Boolean).length;

    const r = await db.run(
      `INSERT INTO news (slug, title, title_fa, excerpt, excerpt_fa, body, category, image,
                         author_id, author_name, tags, read_minutes, featured, published, published_at, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [slug, stripTags(b.title), b.titleFa ? stripTags(b.titleFa) : null,
       b.excerpt ?? null, b.excerptFa ?? null, clean, b.category,
       b.image ?? 'assets/images/backgrounds/gradient-dark.svg',
       req.user.id, req.user.username, db.toJson(b.tags),
       Math.max(1, Math.round(words / 200)), b.featured ? 1 : 0, b.published ? 1 : 0,
       b.published ? db.now() : null, db.now(), db.now()]
    );

    await audit(req, { action: 'news.create', target: `news:${slug}`, after: { title: b.title, published: b.published } });
    res.status(201).json({ ok: true, id: r.lastId, slug });
  })
);

router.patch('/news/:id', requirePermission('news.write'), limitWrites,
  validate(newsSchema.partial()), asyncRoute(async (req, res) => {
    const id = Number(req.params.id) || 0;
    const before = await db.get('SELECT * FROM news WHERE id = ?', [id]);
    if (!before) throw notFound('Article not found');

    const COLS = {
      title: 'title', titleFa: 'title_fa', excerpt: 'excerpt', excerptFa: 'excerpt_fa',
      category: 'category', image: 'image'
    };
    const sets = [], params = [];
    for (const [key, col] of Object.entries(COLS)) {
      if (req.body[key] !== undefined) { sets.push(`${col} = ?`); params.push(stripTags(String(req.body[key]))); }
    }
    if (req.body.body !== undefined)      { sets.push('body = ?');      params.push(sanitizeHtml(req.body.body)); }
    if (req.body.tags !== undefined)      { sets.push('tags = ?');      params.push(db.toJson(req.body.tags)); }
    if (req.body.featured !== undefined)  { sets.push('featured = ?');  params.push(req.body.featured ? 1 : 0); }
    if (req.body.published !== undefined) {
      sets.push('published = ?'); params.push(req.body.published ? 1 : 0);
      if (req.body.published && !before.published_at) { sets.push('published_at = ?'); params.push(db.now()); }
    }
    if (!sets.length) return res.json({ ok: true, unchanged: true });

    sets.push('updated_at = ?'); params.push(db.now(), id);
    await db.run(`UPDATE news SET ${sets.join(', ')} WHERE id = ?`, params);

    await audit(req, { action: 'news.update', target: `news:${before.slug}`, after: { title: req.body.title } });
    res.json({ ok: true });
  })
);

router.delete('/news/:id', requirePermission('news.write'), limitWrites, asyncRoute(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const before = await db.get('SELECT id, slug, title FROM news WHERE id = ?', [id]);
  if (!before) throw notFound('Article not found');
  await db.run('DELETE FROM news WHERE id = ?', [id]);
  await audit(req, { action: 'news.delete', target: `news:${before.slug}`, before });
  res.json({ ok: true });
}));

/* ===============================================================
   TICKETS (staff view)
   =============================================================== */
router.get('/tickets', requirePermission('tickets.read'), asyncRoute(async (req, res) => {
  const rows = await db.all(
    `SELECT t.*, u.username AS author_name, a.username AS assignee_name
       FROM tickets t JOIN users u ON u.id = t.user_id
       LEFT JOIN users a ON a.id = t.assignee_id
      ORDER BY (t.status = 'closed'), t.updated_at DESC LIMIT 200`
  );
  res.json({
    items: rows.map(r => ({
      id: r.id, subject: r.subject, category: r.category, priority: r.priority,
      status: r.status, author: r.author_name, assignee: r.assignee_name,
      created: r.created_at, updated: r.updated_at, messages: []
    }))
  });
}));

router.post('/tickets/:id/assign', requirePermission('tickets.assign'), limitWrites,
  validate(z.object({ assigneeId: z.coerce.number().int().positive().nullable() })),
  asyncRoute(async (req, res) => {
    const id = String(req.params.id).slice(0, 24);
    const r = await db.run('UPDATE tickets SET assignee_id = ?, updated_at = ? WHERE id = ?',
      [req.body.assigneeId, db.now(), id]);
    if (!r.changes) throw notFound('Ticket not found');
    await audit(req, { action: 'ticket.assign', target: `ticket:${id}`, after: { assigneeId: req.body.assigneeId } });
    res.json({ ok: true });
  })
);

/* ===============================================================
   SETTINGS & INTEGRATIONS
   =============================================================== */
router.get('/settings', requirePermission('settings.write'), asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT key_name, value, updated_at FROM settings WHERE key_name NOT LIKE ?', ['linkcode:%']);
  const out = {};
  for (const r of rows) out[r.key_name] = db.json(r.value, r.value);
  res.json({ settings: out });
}));

router.patch('/settings', requirePermission('settings.write'), limitWrites,
  validate(z.record(z.string(), z.any())), asyncRoute(async (req, res) => {
    const entries = Object.entries(req.body).slice(0, 50);
    for (const [key, value] of entries) {
      if (!/^[a-z0-9_.]{1,64}$/i.test(key)) continue;
      if (key.startsWith('linkcode:')) continue;
      await db.upsert('settings', {
        key_name: key,
        value: JSON.stringify(value),
        updated_at: db.now(),
        updated_by: req.user.id
      }, ['key_name']);
    }
    await audit(req, { action: 'settings.update', after: Object.keys(req.body) });
    res.json({ ok: true, updated: entries.length });
  })
);

/**
 * Connection health. Reports whether each integration is configured
 * and reachable - never the values of any key.
 */
router.get('/integrations/status', asyncRoute(async (req, res) => {
  const status = integrationStatus();
  const live = await fivem.status();
  status.fivem.reachable = live.connected;
  status.framework = { ok: !!live.framework, detail: live.framework || 'not detected' };
  res.json({ integrations: status });
}));

export default router;
