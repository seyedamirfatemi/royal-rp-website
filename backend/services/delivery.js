/**
 * ROYAL RP - delivery service
 * ---------------------------------------------------------------
 * The ONLY place that grants a purchased item.
 *
 * Rules this file enforces:
 *   1. Delivery runs only for an order the database says is paid.
 *      A browser request can never reach this code path.
 *   2. Delivery is idempotent. The order carries a unique
 *      delivery_key derived from (order id + provider reference);
 *      a replayed webhook finds the key already set and stops.
 *   3. Every grant is recorded in `entitlements`, so a refund can
 *      revoke exactly what was given.
 *   4. If the game server is unreachable, the order is marked paid
 *      with a delivery_error and queued - never silently lost, and
 *      never reported to the player as delivered.
 * ---------------------------------------------------------------
 */
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { deliveryKey, money } from '../utils/index.js';
import { log } from './logger.js';
import { getAdapter } from '../integrations/fivem/index.js';
import { grantDiscordRole } from '../integrations/discord.js';

/* ===============================================================
   DELIVERY HANDLERS
   `delivery_type` on the product selects one of these. Each returns
   { ok, detail, entitlement? } and must be safe to run exactly once.
   =============================================================== */
const HANDLERS = {
  /** Nothing automated: staff fulfils it and marks the item delivered. */
  async manual(ctx) {
    await notify(ctx.userId, {
      type: 'order',
      title: 'Order received',
      body: `"${ctx.item.name}" needs a staff member to set it up. We will contact you on Discord within 48 hours.`,
      icon: 'clock'
    });
    return { ok: true, detail: 'queued for manual fulfilment', manual: true };
  },

  /** VIP tier for N days, applied to the ACCOUNT (all characters). */
  async vip(ctx) {
    const days = Number(ctx.payload.days) || 30;
    const tier = String(ctx.payload.tier || 'bronze');

    // Extend an existing VIP rather than overwriting it.
    const existing = await db.get(
      `SELECT * FROM entitlements
        WHERE user_id = ? AND kind = 'vip' AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY expires_at DESC`,
      [ctx.userId, db.now()]
    );
    const base = existing?.expires_at ? new Date(existing.expires_at) : new Date();
    const expires = new Date(Math.max(base.getTime(), Date.now()) + days * 86400000);

    await db.run(
      `INSERT INTO entitlements (user_id, order_id, product_id, kind, value, expires_at, created_at)
       VALUES (?, ?, ?, 'vip', ?, ?, ?)`,
      [ctx.userId, ctx.orderId, ctx.item.product_id, tier,
       expires.toISOString().slice(0, 19).replace('T', ' '), db.now()]
    );

    // Mirror the tier onto Discord, if the bot is configured.
    if (config.discord.botToken && ctx.user.discord_id) {
      await grantDiscordRole(ctx.user.discord_id, tier).catch(() => {});
    }

    // Tell the game server, if it is reachable.
    const adapter = await getAdapter();
    if (adapter) await adapter.setVip(ctx.user.game_license, tier, expires).catch(() => {});

    await notify(ctx.userId, {
      type: 'order', icon: 'crown',
      title: 'VIP activated',
      body: `VIP ${tier} is active until ${expires.toISOString().slice(0, 10)}.`
    });

    return { ok: true, detail: `vip ${tier} until ${expires.toISOString().slice(0, 10)}` };
  },

  /** In-game currency into the character's bank. */
  async money(ctx) {
    const amount = Number(ctx.payload.amount) || 0;
    const account = ctx.payload.account || 'bank';

    const adapter = await getAdapter();
    if (!adapter) {
      return { ok: false, detail: 'game server unreachable - queued' };
    }
    const target = ctx.order.character_id || ctx.user.game_license;
    await adapter.addMoney(target, account, amount * ctx.item.qty);

    await db.run(
      `INSERT INTO entitlements (user_id, order_id, product_id, kind, value, created_at)
       VALUES (?, ?, ?, 'money', ?, ?)`,
      [ctx.userId, ctx.orderId, ctx.item.product_id, String(amount * ctx.item.qty), db.now()]
    );

    await notify(ctx.userId, {
      type: 'economy', icon: 'money',
      title: 'Cash delivered',
      body: `$${(amount * ctx.item.qty).toLocaleString('en-US')} was added to your ${account}.`
    });

    return { ok: true, detail: `$${amount * ctx.item.qty} to ${account}` };
  },

  /** A vehicle added to the player's garage. */
  async vehicle(ctx) {
    const model = String(ctx.payload.model || '');
    const adapter = await getAdapter();
    if (!adapter) return { ok: false, detail: 'game server unreachable - queued' };

    const target = ctx.order.character_id || ctx.user.game_license;
    const plate = await adapter.giveVehicle(target, model, ctx.payload);

    await db.run(
      `INSERT INTO entitlements (user_id, order_id, product_id, kind, value, created_at)
       VALUES (?, ?, ?, 'vehicle', ?, ?)`,
      [ctx.userId, ctx.orderId, ctx.item.product_id, `${model}:${plate}`, db.now()]
    );

    await notify(ctx.userId, {
      type: 'order', icon: 'car',
      title: 'Vehicle delivered',
      body: `${model} is in your garage with plate ${plate}.`
    });

    return { ok: true, detail: `${model} (${plate})` };
  },

  /** An inventory item. */
  async item(ctx) {
    const name = String(ctx.payload.item || '');
    const count = (Number(ctx.payload.count) || 1) * ctx.item.qty;
    const adapter = await getAdapter();
    if (!adapter) return { ok: false, detail: 'game server unreachable - queued' };

    await adapter.giveItem(ctx.order.character_id || ctx.user.game_license, name, count);
    await db.run(
      `INSERT INTO entitlements (user_id, order_id, product_id, kind, value, created_at)
       VALUES (?, ?, ?, 'item', ?, ?)`,
      [ctx.userId, ctx.orderId, ctx.item.product_id, `${name}x${count}`, db.now()]
    );
    return { ok: true, detail: `${name} x${count}` };
  },

  /** An extra character slot on the account. */
  async slot(ctx) {
    const count = (Number(ctx.payload.count) || 1) * ctx.item.qty;
    await db.run(
      `INSERT INTO entitlements (user_id, order_id, product_id, kind, value, created_at)
       VALUES (?, ?, ?, 'slot', ?, ?)`,
      [ctx.userId, ctx.orderId, ctx.item.product_id, String(count), db.now()]
    );
    const adapter = await getAdapter();
    if (adapter) await adapter.addCharacterSlots(ctx.user.game_license, count).catch(() => {});
    return { ok: true, detail: `${count} character slot(s)` };
  },

  /**
   * In-game webshop coin. VoltaBase already has a `coin` column on
   * `users` and a Coin-System event, so this maps onto what the server
   * natively understands rather than inventing a parallel currency.
   */
  async coin(ctx) {
    const amount = (Number(ctx.payload.amount) || 0) * ctx.item.qty;
    const adapter = await getAdapter();
    if (!adapter || !adapter.addCoin) {
      return { ok: false, detail: 'game server unreachable - queued' };
    }
    await adapter.addCoin(ctx.user.game_license, amount);

    await db.run(
      `INSERT INTO entitlements (user_id, order_id, product_id, kind, value, created_at)
       VALUES (?, ?, ?, 'coin', ?, ?)`,
      [ctx.userId, ctx.orderId, ctx.item.product_id, String(amount), db.now()]
    );
    await notify(ctx.userId, {
      type: 'economy', icon: 'money',
      title: 'کوین اضافه شد',
      body: `${amount.toLocaleString('en-US')} کوین به حساب شما اضافه شد.`
    });
    return { ok: true, detail: `${amount} coin` };
  },

  /** A Discord role only. */
  async role(ctx) {
    const role = String(ctx.payload.role || '');
    if (!config.discord.botToken) return { ok: false, detail: 'Discord bot not configured - queued' };
    if (!ctx.user.discord_id) return { ok: false, detail: 'no Discord account linked - queued' };
    await grantDiscordRole(ctx.user.discord_id, role);
    await db.run(
      `INSERT INTO entitlements (user_id, order_id, product_id, kind, value, created_at)
       VALUES (?, ?, ?, 'role', ?, ?)`,
      [ctx.userId, ctx.orderId, ctx.item.product_id, role, db.now()]
    );
    return { ok: true, detail: `Discord role ${role}` };
  }
};

async function notify(userId, { type = 'system', title, body, icon = 'bell', link = null }) {
  try {
    await db.run(
      `INSERT INTO notifications (user_id, type, title, body, icon, link, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, String(title).slice(0, 160), String(body || '').slice(0, 1000), icon, link, db.now()]
    );
  } catch { /* a failed notification must not fail a delivery */ }
}

/* ===============================================================
   MAIN ENTRY
   =============================================================== */

/**
 * Deliver a paid order. Safe to call repeatedly.
 * @param {string} id order id
 * @param {string} providerRef the payment provider's transaction id
 */
export async function deliverOrder(id, providerRef = null) {
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return { ok: false, reason: 'order_not_found' };

  /* --- guard 1: only a paid order --- */
  if (!['paid', 'delivered'].includes(order.status)) {
    await log({
      category: 'security', severity: 'warning',
      message: `تحویل سفارش ${id} رد شد: وضعیت «${order.status}» است، نه پرداخت‌شده`,
      target: id, source: 'system'
    });
    return { ok: false, reason: 'not_paid' };
  }

  /* --- guard 2: idempotency --- */
  const key = deliveryKey(id, providerRef || order.payment_ref);
  if (order.delivery_key === key && order.delivered_at) {
    await log({
      category: 'payment', severity: 'info',
      message: `تحویل تکراری برای ${id} متوقف شد (کلید یکتایی قبلاً استفاده شده)`,
      target: id, source: 'system'
    });
    return { ok: true, reason: 'already_delivered', duplicate: true };
  }

  // Claim the key atomically. If another worker already claimed it, stop.
  const claim = await db.run(
    `UPDATE orders SET delivery_key = ?, updated_at = ?
      WHERE id = ? AND (delivery_key IS NULL OR delivery_key = ?)`,
    [key, db.now(), id, key]
  );
  if (!claim.changes) return { ok: true, reason: 'claimed_elsewhere', duplicate: true };

  const user = await db.get('SELECT * FROM users WHERE id = ?', [order.user_id]);
  if (!user) return { ok: false, reason: 'user_missing' };

  const items = await db.all('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [id]);

  const results = [];
  let allOk = true;

  for (const item of items) {
    if (item.delivered) { results.push({ item: item.name, ok: true, detail: 'already delivered' }); continue; }

    const type = item.delivery_type || 'manual';
    const handler = HANDLERS[type] || HANDLERS.manual;
    const payload = db.json(item.delivery_payload, {}) || {};

    try {
      const res = await handler({
        orderId: id, order, user, userId: user.id, item, payload
      });
      results.push({ item: item.name, ...res });
      if (res.ok) {
        await db.run('UPDATE order_items SET delivered = 1 WHERE id = ?', [item.id]);
      } else {
        allOk = false;
      }
    } catch (err) {
      allOk = false;
      results.push({ item: item.name, ok: false, detail: err.message });
      await log({
        category: 'error', severity: 'error',
        message: `تحویل‌دهنده «${type}» برای ${id} / ${item.name} شکست خورد: ${err.message}`,
        target: id, source: 'system'
      });
    }
  }

  const anyManual = results.some(r => r.manual);

  if (allOk) {
    await db.run(
      `UPDATE orders SET status = 'delivered', delivered_at = ?, delivery_error = NULL, updated_at = ?
        WHERE id = ?`,
      [db.now(), db.now(), id]
    );
    await db.run('UPDATE users SET total_spent = total_spent + ? WHERE id = ?', [money(order.total), user.id]);
    if (order.coupon_code) {
      await db.run('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [order.coupon_code]);
    }
    await log({
      category: 'purchase', severity: 'success',
      message: `سفارش ${id} به ${user.username} تحویل شد${anyManual ? ' (بخشی از آیتم‌ها در صف تحویل دستی است)' : ''}`,
      actorId: user.id, actorName: user.username, target: id, source: 'system',
      meta: { results }
    });
  } else {
    const errors = results.filter(r => !r.ok).map(r => `${r.item}: ${r.detail}`).join('; ');
    await db.run(
      `UPDATE orders SET delivery_error = ?, delivery_key = NULL, updated_at = ? WHERE id = ?`,
      [errors.slice(0, 1000), db.now(), id]
    );
    await log({
      category: 'error', severity: 'error',
      message: `سفارش ${id} پرداخت شده اما به‌طور کامل تحویل نشد: ${errors}`,
      target: id, source: 'system', meta: { results }
    });
    await notify(user.id, {
      type: 'order', icon: 'warning',
      title: 'Delivery delayed',
      body: 'Your payment went through, but we could not deliver everything yet. Our team has been alerted and will finish it shortly.'
    });
  }

  return { ok: allOk, results };
}

/**
 * Retry every paid-but-undelivered order.
 * Run on startup and whenever the game server comes back.
 */
export async function retryPendingDeliveries() {
  const rows = await db.all(
    `SELECT id, payment_ref FROM orders
      WHERE status = 'paid' AND delivered_at IS NULL
      ORDER BY created_at ASC LIMIT 50`
  );
  if (!rows.length) return { attempted: 0, delivered: 0 };

  let delivered = 0;
  for (const row of rows) {
    const res = await deliverOrder(row.id, row.payment_ref);
    if (res.ok) delivered++;
  }
  if (rows.length) {
    await log({
      category: 'server.event', severity: 'info',
      message: `تلاش دوباره برای تحویل: ${delivered} از ${rows.length} تکمیل شد`,
      source: 'system'
    });
  }
  return { attempted: rows.length, delivered };
}

/** Expire VIP entitlements that have run out. */
export async function expireEntitlements() {
  const res = await db.run(
    `UPDATE entitlements SET revoked_at = ?
      WHERE revoked_at IS NULL AND expires_at IS NOT NULL AND expires_at < ?`,
    [db.now(), db.now()]
  );
  if (res.changes) {
    await log({
      category: 'server.event', severity: 'info',
      message: `${res.changes} اشتراک منقضی شد`, source: 'system'
    });
  }
  return res.changes;
}

/** Active entitlements for a user - what the dashboard shows. */
export async function userEntitlements(userId) {
  const rows = await db.all(
    `SELECT * FROM entitlements
      WHERE user_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY created_at DESC`,
    [userId, db.now()]
  );
  return rows.map(r => ({
    id: r.id, kind: r.kind, value: r.value,
    productId: r.product_id, orderId: r.order_id,
    expiresAt: r.expires_at, createdAt: r.created_at
  }));
}

export default { deliverOrder, retryPendingDeliveries, expireEntitlements, userEntitlements, HANDLERS };
