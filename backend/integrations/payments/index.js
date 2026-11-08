/**
 * ROYAL RP - payment provider abstraction
 * ---------------------------------------------------------------
 * The rule this file exists to enforce:
 *
 *   AN ORDER BECOMES PAID ONLY WHEN A WEBHOOK WITH A VALID HMAC
 *   SIGNATURE SAYS SO.
 *
 * Not when the browser comes back from the provider. Not when the
 * player clicks "I paid". Not when a redirect carries ?status=success.
 * The return URL is a UI hint; the webhook is the authority.
 *
 * Adding a real provider means implementing createCheckout() and
 * verifyWebhook() below. The rest of the system does not change.
 * ---------------------------------------------------------------
 */
import crypto from 'node:crypto';
import zarinpal from './zarinpal.js';
import { config } from '../../config/index.js';
import { db } from '../../database/db.js';
import { log } from '../../services/logger.js';
import { safeEqual, money } from '../../utils/index.js';

/* ===============================================================
   PROVIDER REGISTRY
   =============================================================== */

/**
 * `mock` is a development provider. It never moves real money, and
 * it signs its webhooks with the same HMAC scheme as a real one so
 * the verification path is exercised in development too.
 */
const providers = {
  /**
   * ZarinPal verifies by callback, not webhook. The adapter is
   * registered here so the rest of the system keeps one interface;
   * routes/orders.js routes its callback to verifyPayment().
   */
  zarinpal,

  none: {
    id: 'none',
    async createCheckout() {
      throw new Error('No payment provider is configured. Set PAYMENT_PROVIDER in backend/.env.');
    },
    verifyWebhook() { return { ok: false, reason: 'no_provider' }; }
  },

  mock: {
    id: 'mock',
    async createCheckout(order, { successUrl, cancelUrl }) {
      // A local page that posts a correctly-signed webhook back to us.
      const url = new URL('/api/payments/mock/pay', config.server.publicUrl.replace(/\/$/, '') || 'http://localhost:4000');
      url.searchParams.set('order', order.id);
      url.searchParams.set('amount', String(order.total));
      url.searchParams.set('success', successUrl);
      url.searchParams.set('cancel', cancelUrl);
      return { redirectUrl: url.href, reference: `mock_${order.id}` };
    },
    verifyWebhook(rawBody, headers) {
      return verifyHmac(rawBody, headers['x-royal-signature'], config.payments.webhookSecret);
    }
  }
};

/** Generic HMAC-SHA256 verification with a timing-safe compare. */
function verifyHmac(rawBody, signature, secret) {
  if (!secret) return { ok: false, reason: 'no_webhook_secret' };
  if (!signature) return { ok: false, reason: 'missing_signature' };
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, String(signature)) ? { ok: true } : { ok: false, reason: 'bad_signature' };
}

export function activeProvider() {
  return providers[config.payments.provider] || providers.none;
}

export function enabledProviders() {
  if (!config.payments.enabled) return ['wallet'];
  // Store credit always works, because it settles against our own ledger.
  const p = config.payments.provider;
  return [p === 'mock' ? 'card' : p, 'wallet'];
}

/** Does the active provider confirm by redirect-callback instead of webhook? */
export function usesCallback() {
  return !!activeProvider().usesCallback;
}

/* ===============================================================
   START A PAYMENT
   =============================================================== */
export async function startPayment(order, method = 'card') {
  /* ---- store credit settles immediately against our own ledger ---- */
  if (method === 'wallet') {
    return settleWithWallet(order);
  }

  const provider = activeProvider();
  if (provider.id === 'none') {
    throw new Error('No payment provider is configured. Set PAYMENT_PROVIDER in backend/.env.');
  }

  const { redirectUrl, reference } = await provider.createCheckout(order, {
    successUrl: `${config.payments.successUrl}&order=${encodeURIComponent(order.id)}`,
    cancelUrl: `${config.payments.cancelUrl}&order=${encodeURIComponent(order.id)}`
  });

  await db.run(
    'UPDATE orders SET payment_provider = ?, payment_ref = ?, updated_at = ? WHERE id = ?',
    [method, reference || null, db.now(), order.id]
  );

  await log({
    category: 'payment', severity: 'info', source: 'system',
    message: `پرداخت سفارش ${order.id} از طریق ${provider.id} آغاز شد (${order.total} ${order.currency})`,
    target: order.id
  });

  return { redirectUrl, reference };
}

/** Pay from the account wallet. Atomic, with a ledger entry. */
async function settleWithWallet(order) {
  const result = await db.transaction(async (tx) => {
    const user = await tx.get('SELECT id, wallet_balance FROM users WHERE id = ?', [order.userId]);
    const balance = Number(user?.wallet_balance) || 0;
    if (balance < order.total) {
      const err = new Error(`Not enough store credit. Balance is ${balance.toFixed(2)}, order is ${order.total.toFixed(2)}.`);
      err.status = 400; err.code = 'insufficient_credit';
      throw err;
    }

    const after = money(balance - order.total);
    await tx.run('UPDATE users SET wallet_balance = ? WHERE id = ?', [after, order.userId]);
    await tx.run(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, label, reference, created_at)
       VALUES (?, 'purchase', ?, ?, ?, ?, ?)`,
      [order.userId, -order.total, after, `Order ${order.id}`, order.id, db.now()]
    );
    await tx.run(
      `UPDATE orders SET status = 'paid', payment_provider = 'wallet', payment_ref = ?,
              paid_at = ?, updated_at = ? WHERE id = ?`,
      [`wallet_${order.id}`, db.now(), db.now(), order.id]
    );
    return { balanceAfter: after };
  });

  await log({
    category: 'payment', severity: 'success', source: 'system',
    message: `سفارش ${order.id} از اعتبار فروشگاه پرداخت شد (${order.total} ${order.currency})`,
    target: order.id
  });

  // Delivery runs through the same path a webhook would take.
  const { deliverOrder } = await import('../../services/delivery.js');
  await deliverOrder(order.id, `wallet_${order.id}`);

  return { redirectUrl: null, settled: true, ...result };
}

/* ===============================================================
   WEBHOOK
   =============================================================== */

/**
 * Handle an incoming provider webhook.
 * @param {Buffer|string} rawBody the EXACT bytes received - signature
 *        verification fails against a re-serialised body.
 */
export async function handleWebhook(rawBody, headers) {
  const provider = activeProvider();
  const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);

  /* ---- 1. verify the signature ---- */
  const verdict = provider.verifyWebhook(body, headers);
  if (!verdict.ok) {
    await log({
      category: 'security', severity: 'critical', source: 'system',
      message: `یک وب‌هوک پرداخت رد شد: ${verdict.reason}`,
      meta: { provider: provider.id, reason: verdict.reason }
    });
    const err = new Error('Invalid webhook signature');
    err.status = 400; err.code = 'bad_signature';
    throw err;
  }

  let event;
  try { event = JSON.parse(body); }
  catch { const e = new Error('Malformed webhook body'); e.status = 400; throw e; }

  const eventId = String(event.id || event.event_id || `${Date.now()}`);
  const eventType = String(event.type || event.event_type || 'unknown');
  const orderId = String(event.orderId || event.data?.object?.metadata?.order_id || event.order_id || '');

  /* ---- 2. replay protection: the event id is UNIQUE in the table ---- */
  try {
    await db.run(
      `INSERT INTO payment_events (provider, event_id, event_type, order_id, signature_ok, payload, received_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [provider.id, eventId, eventType, orderId || null, body.slice(0, 8000), db.now()]
    );
  } catch (err) {
    if (/unique|duplicate/i.test(err.message)) {
      await log({
        category: 'payment', severity: 'info', source: 'system',
        message: `وب‌هوک تکراری ${eventId} نادیده گرفته شد`, target: orderId
      });
      return { ok: true, duplicate: true };
    }
    throw err;
  }

  /* ---- 3. act on it ---- */
  if (!orderId) return { ok: true, ignored: 'no order reference' };

  const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) {
    await log({
      category: 'security', severity: 'warning', source: 'system',
      message: `وب‌هوک به سفارش ناشناخته ${orderId} اشاره می‌کند`, target: orderId
    });
    return { ok: true, ignored: 'unknown order' };
  }

  const isSuccess = /succeeded|completed|paid|capture/i.test(eventType);
  const isFailure = /failed|denied|expired|canceled|cancelled/i.test(eventType);
  const isRefund  = /refund/i.test(eventType);

  if (isSuccess) {
    /* ---- 4. the amount must match what WE calculated ---- */
    const paid = Number(event.amount ?? event.data?.object?.amount_total / 100 ?? order.total);
    if (Math.abs(paid - Number(order.total)) > 0.01) {
      await log({
        category: 'security', severity: 'critical', source: 'system',
        message: `مبلغ سفارش ${orderId} همخوانی ندارد: درگاه ${paid} می‌گوید، سفارش ${order.total} است. تحویل انجام نشد.`,
        target: orderId, meta: { paid, expected: order.total }
      });
      await db.run(`UPDATE orders SET status = 'failed', delivery_error = ?, updated_at = ? WHERE id = ?`,
        ['amount mismatch', db.now(), orderId]);
      return { ok: false, reason: 'amount_mismatch' };
    }

    await db.run(
      `UPDATE orders SET status = 'paid', paid_at = COALESCE(paid_at, ?), payment_ref = ?, updated_at = ?
        WHERE id = ? AND status IN ('pending','failed')`,
      [db.now(), eventId, db.now(), orderId]
    );

    await log({
      category: 'payment', severity: 'success', source: 'system',
      message: `پرداخت سفارش ${orderId} تأیید شد (${paid} ${order.currency})`, target: orderId
    });

    const { deliverOrder } = await import('../../services/delivery.js');
    const result = await deliverOrder(orderId, eventId);
    return { ok: true, delivered: result.ok };
  }

  if (isFailure) {
    await db.run(`UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending'`,
      [db.now(), orderId]);
    await restockOrder(orderId);
    await log({
      category: 'payment', severity: 'warning', source: 'system',
      message: `پرداخت سفارش ${orderId} ناموفق بود (${eventType})`, target: orderId
    });
    return { ok: true, failed: true };
  }

  if (isRefund) {
    await db.run(
      `UPDATE orders SET status = 'refunded', refunded_at = ?, refund_reason = ?, updated_at = ? WHERE id = ?`,
      [db.now(), 'provider refund', db.now(), orderId]
    );
    await db.run('UPDATE entitlements SET revoked_at = ? WHERE order_id = ? AND revoked_at IS NULL',
      [db.now(), orderId]);
    await log({
      category: 'payment', severity: 'warning', source: 'system',
      message: `بازپرداخت برای ${orderId} دریافت شد`, target: orderId
    });
    return { ok: true, refunded: true };
  }

  return { ok: true, ignored: eventType };
}

/** Put reserved stock back when a payment fails or is cancelled. */
async function restockOrder(orderId) {
  const items = await db.all('SELECT product_id, qty FROM order_items WHERE order_id = ?', [orderId]);
  for (const it of items) {
    await db.run(
      'UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL',
      [it.qty, it.product_id]
    );
  }
}

/** Sign a payload the way the mock provider does - used by its test page. */
export function signMock(payload) {
  return crypto.createHmac('sha256', config.payments.webhookSecret || 'dev')
    .update(payload).digest('hex');
}

export default { activeProvider, enabledProviders, startPayment, handleWebhook, signMock };
