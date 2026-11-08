/**
 * ROYAL RP - order service
 * ---------------------------------------------------------------
 * THE PRICING AUTHORITY.
 *
 * The browser sends only {productId, qty}. Every price, every
 * discount and the final total are computed here from the database.
 * Nothing the client sends about money is read.
 * ---------------------------------------------------------------
 */
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { orderId, money, clientIp } from '../utils/index.js';
import { HttpError, badRequest, conflict, notFound } from '../middleware/index.js';
import { log } from './logger.js';

const MAX_LINES = 20;

/* ===============================================================
   COUPONS
   =============================================================== */
export async function validateCoupon(code, { subtotal = 0, userId = null } = {}) {
  if (!code) return null;
  const clean = String(code).toUpperCase().trim().slice(0, 32);

  const row = await db.get('SELECT * FROM coupons WHERE code = ? AND active = 1', [clean]);
  if (!row) throw badRequest('That code is not valid', 'coupon_invalid');

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    throw badRequest('That code has expired', 'coupon_expired');
  }
  if (row.max_uses !== null && row.used_count >= row.max_uses) {
    throw badRequest('That code has been fully redeemed', 'coupon_exhausted');
  }
  if (subtotal < Number(row.min_spend)) {
    throw badRequest(
      `This code needs a minimum spend of ${Number(row.min_spend).toFixed(2)}`,
      'coupon_min_spend'
    );
  }
  if (userId && row.per_user) {
    const used = Number(await db.scalar(
      `SELECT COUNT(*) AS n FROM orders
        WHERE user_id = ? AND coupon_code = ? AND status IN ('paid','delivered')`,
      [userId, clean]
    )) || 0;
    if (used >= row.per_user) throw badRequest('You have already used that code', 'coupon_used');
  }

  return {
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minSpend: Number(row.min_spend),
    maxDiscount: row.max_discount === null ? null : Number(row.max_discount),
    label: row.label
  };
}

function discountFor(coupon, subtotal) {
  if (!coupon) return 0;
  let amount = coupon.type === 'percent'
    ? subtotal * (coupon.value / 100)
    : coupon.value;
  if (coupon.maxDiscount !== null) amount = Math.min(amount, coupon.maxDiscount);
  return money(Math.min(amount, subtotal));
}

/* ===============================================================
   PRICING
   =============================================================== */

/**
 * Turn client line items into a priced, validated basket.
 * Throws if anything is out of stock, hidden or over its per-order cap.
 */
export async function priceBasket(items, { couponCode = null, userId = null } = {}) {
  if (!Array.isArray(items) || !items.length) throw badRequest('Your cart is empty', 'empty_cart');
  if (items.length > MAX_LINES) throw badRequest('Too many different items in one order', 'too_many_lines');

  // Merge duplicate product ids so qty caps cannot be bypassed by
  // sending the same product on several lines.
  const merged = new Map();
  for (const raw of items) {
    const id = String(raw.productId || '').slice(0, 48);
    const qty = Math.max(1, parseInt(raw.qty, 10) || 1);
    if (!id) continue;
    merged.set(id, (merged.get(id) || 0) + qty);
  }
  if (!merged.size) throw badRequest('Your cart is empty', 'empty_cart');

  const lines = [];
  let subtotal = 0;

  for (const [productId, qty] of merged) {
    const p = await db.get('SELECT * FROM products WHERE id = ? AND visible = 1', [productId]);
    if (!p) throw badRequest(`A product in your cart is no longer available`, 'product_unavailable', { productId });

    const cap = p.max_per_order || 5;
    if (qty > cap) throw badRequest(`حداکثر ${cap} عدد از «${p.name_fa || p.name}» در هر سفارش`, 'qty_cap', { productId, cap });

    if (p.stock !== null && p.stock !== undefined && p.stock < qty) {
      throw conflict(
        p.stock <= 0
          ? `«${p.name_fa || p.name}» ناموجود است`
          : `تنها ${p.stock} عدد از «${p.name_fa || p.name}» باقی مانده`,
        'out_of_stock'
      );
    }

    const unit = money(p.price);
    const lineTotal = money(unit * qty);
    subtotal = money(subtotal + lineTotal);

    lines.push({
      productId: p.id,
      // Snapshot the name the customer actually saw. The row keeps it
      // even if the product is renamed or removed later.
      name: p.name_fa || p.name,
      unitPrice: unit,
      qty,
      lineTotal,
      deliveryType: p.delivery_type,
      deliveryPayload: p.delivery_payload,
      stock: p.stock
    });
  }

  const coupon = couponCode ? await validateCoupon(couponCode, { subtotal, userId }) : null;
  const discount = discountFor(coupon, subtotal);
  const taxable = money(subtotal - discount);
  const tax = money(taxable * (Number(config.payments.taxRatePercent || 0) / 100));
  const total = money(taxable + tax);

  return { lines, subtotal, discount, tax, total, coupon, currency: config.payments.currency };
}

/* ===============================================================
   CREATE
   =============================================================== */
export async function createOrder(req, { items, couponCode, characterId }) {
  const user = req.user;
  const priced = await priceBasket(items, { couponCode, userId: user.id });

  // Re-roll on the (rare) chance of an id collision rather than
  // letting a unique-constraint error surface as a failed checkout.
  let id = orderId();
  for (let i = 0; i < 6 && await db.get('SELECT id FROM orders WHERE id = ?', [id]); i++) {
    id = orderId();
  }
  const ip = clientIp(req);

  await db.transaction(async (tx) => {
    await tx.run(
      `INSERT INTO orders
        (id, user_id, status, subtotal, discount, tax, total, currency, coupon_code,
         character_id, game_license, ip, created_at, updated_at)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, priced.subtotal, priced.discount, priced.tax, priced.total,
       priced.currency, priced.coupon?.code ?? null,
       characterId || null, user.gameLicense || null, ip, db.now(), db.now()]
    );

    for (const line of priced.lines) {
      await tx.run(
        `INSERT INTO order_items
          (order_id, product_id, name, unit_price, qty, line_total, delivery_type, delivery_payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, line.productId, line.name, line.unitPrice, line.qty, line.lineTotal,
         line.deliveryType, line.deliveryPayload]
      );

      // Reserve stock immediately so two buyers cannot take the last one.
      if (line.stock !== null && line.stock !== undefined) {
        const res = await tx.run(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [line.qty, line.productId, line.qty]
        );
        if (!res.changes) throw conflict(`"${line.name}" sold out while you were checking out`, 'out_of_stock');
      }
    }
  });

  await log({
    category: 'purchase', severity: 'info',
    message: `سفارش ${id} توسط ${user.username} به مبلغ ${priced.total} ${priced.currency} ثبت شد`,
    actorId: user.id, actorName: user.username, target: id, req,
    meta: { total: priced.total, lines: priced.lines.length, coupon: priced.coupon?.code || null }
  });

  return getOrder(id);
}

/* ===============================================================
   READ
   =============================================================== */
function shapeOrder(row, items) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    tax: Number(row.tax),
    total: Number(row.total),
    currency: row.currency,
    couponCode: row.coupon_code,
    method: row.payment_provider,
    paymentRef: row.payment_ref,
    receipt: row.payment_receipt || null,
    paidAt: row.paid_at,
    deliveredAt: row.delivered_at,
    deliveryError: row.delivery_error,
    refundedAt: row.refunded_at,
    refundReason: row.refund_reason,
    characterId: row.character_id,
    date: row.created_at,
    items: (items || []).map(i => ({
      productId: i.product_id,
      name: i.name,
      price: Number(i.unit_price),
      qty: i.qty,
      total: Number(i.line_total),
      delivered: !!i.delivered
    }))
  };
}

export async function getOrder(id) {
  const row = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!row) return null;
  const items = await db.all('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [id]);
  return shapeOrder(row, items);
}

export async function listUserOrders(userId, { page = 1, perPage = 20 } = {}) {
  const { limit, offset, page: p } = db.paginate(page, perPage, 100);
  const total = Number(await db.scalar('SELECT COUNT(*) AS n FROM orders WHERE user_id = ?', [userId])) || 0;
  const rows = await db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, limit, offset]
  );
  const out = [];
  for (const row of rows) {
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [row.id]);
    out.push(shapeOrder(row, items));
  }
  return { items: out, total, page: p, perPage: limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function listAllOrders({ page = 1, perPage = 25, status, q } = {}) {
  const { limit, offset, page: p } = db.paginate(page, perPage, 200);

  const clauses = [];
  const params = [];
  if (status && status !== 'all') { clauses.push('o.status = ?'); params.push(status); }
  if (q) {
    clauses.push('(o.id LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
    const like = `%${String(q).slice(0, 60)}%`;
    params.push(like, like, like);
  }
  const whereSql = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';

  const total = Number(await db.scalar(
    `SELECT COUNT(*) AS n FROM orders o JOIN users u ON u.id = o.user_id${whereSql}`, params)) || 0;

  const rows = await db.all(
    `SELECT o.*, u.username, u.email
       FROM orders o JOIN users u ON u.id = o.user_id
       ${whereSql}
      ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const out = [];
  for (const row of rows) {
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [row.id]);
    out.push({ ...shapeOrder(row, items), user: row.username, email: row.email });
  }
  return { items: out, total, page: p, perPage: limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

/* ===============================================================
   REFUND
   =============================================================== */
export async function refundOrder(req, id, reason = '') {
  const order = await getOrder(id);
  if (!order) throw notFound('Order not found');
  if (order.status === 'refunded') throw conflict('That order is already refunded', 'already_refunded');
  if (!['paid', 'delivered'].includes(order.status)) {
    throw conflict('Only a paid order can be refunded', 'not_refundable');
  }

  await db.transaction(async (tx) => {
    await tx.run(
      `UPDATE orders SET status = 'refunded', refunded_at = ?, refund_reason = ?, refunded_by = ?, updated_at = ?
        WHERE id = ?`,
      [db.now(), String(reason).slice(0, 255), req.user.id, db.now(), id]
    );
    // Revoke anything the order granted.
    await tx.run('UPDATE entitlements SET revoked_at = ? WHERE order_id = ? AND revoked_at IS NULL',
      [db.now(), id]);
  });

  await log({
    category: 'payment', severity: 'warning',
    message: `سفارش ${id} توسط ${req.user.username} بازپرداخت شد (${order.total} ${order.currency})`,
    actorId: req.user.id, actorName: req.user.username, target: id, req,
    meta: { reason, total: order.total }
  });

  return getOrder(id);
}

/* ===============================================================
   STATS
   =============================================================== */
export async function orderStats() {
  const num = async (sql, p = []) => Number(await db.scalar(sql, p)) || 0;
  const paid = `status IN ('paid','delivered')`;
  const since = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');

  const totalRevenue = await num(`SELECT COALESCE(SUM(total),0) AS n FROM orders WHERE ${paid}`);
  const completed = await num(`SELECT COUNT(*) AS n FROM orders WHERE ${paid}`);

  return {
    totalUsers:      await num('SELECT COUNT(*) AS n FROM users'),
    activeToday:     await num('SELECT COUNT(*) AS n FROM users WHERE last_login_at >= ?', [since(1)]),
    totalRevenue:    money(totalRevenue),
    revenueToday:    money(await num(`SELECT COALESCE(SUM(total),0) AS n FROM orders WHERE ${paid} AND created_at >= ?`, [since(1)])),
    revenueMonth:    money(await num(`SELECT COALESCE(SUM(total),0) AS n FROM orders WHERE ${paid} AND created_at >= ?`, [since(30)])),
    completedOrders: completed,
    refunds:         await num(`SELECT COUNT(*) AS n FROM orders WHERE status = 'refunded'`),
    vipPurchases:    await num(`SELECT COUNT(*) AS n FROM order_items oi
                                JOIN orders o ON o.id = oi.order_id
                                JOIN products p ON p.id = oi.product_id
                               WHERE p.category_id = 'vip' AND o.status IN ('paid','delivered')`),
    openTickets:     await num(`SELECT COUNT(*) AS n FROM tickets WHERE status != 'closed'`),
    avgOrderValue:   completed ? money(totalRevenue / completed) : 0,
    conversionRate:  0
  };
}

/** Daily revenue for the admin chart. */
export async function revenueSeries(days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const rows = await db.all(
    `SELECT substr(created_at, 1, 10) AS day, COALESCE(SUM(total), 0) AS amount
       FROM orders
      WHERE status IN ('paid','delivered') AND created_at >= ?
      GROUP BY day ORDER BY day`,
    [since + ' 00:00:00']
  );
  const byDay = new Map(rows.map(r => [r.day, Number(r.amount)]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push({ date: d, label: d.slice(5), value: money(byDay.get(d) || 0) });
  }
  return out;
}

export default {
  priceBasket, validateCoupon, createOrder, getOrder,
  listUserOrders, listAllOrders, refundOrder, orderStats, revenueSeries
};
