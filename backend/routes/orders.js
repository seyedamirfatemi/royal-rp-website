/**
 * ROYAL RP - /api/orders and /api/payments
 */
import { Router } from 'express';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import {
  asyncRoute, requireAuth, validate, schemas, z,
  limitOrders, notFound, forbidden, badRequest
} from '../middleware/index.js';
import { can } from '../config/roles.js';
import orders from '../services/orders.js';
import payments from '../integrations/payments/index.js';
import zarinpal from '../integrations/payments/zarinpal.js';
import { log } from '../services/logger.js';

export const orderRouter = Router();
export const paymentRouter = Router();

/* ===============================================================
   ORDERS
   =============================================================== */
const createSchema = z.object({
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(48),
    qty: z.coerce.number().int().min(1).max(50)
  })).min(1, 'Your cart is empty').max(20),
  couponCode: z.string().trim().max(32).nullish(),
  characterId: z.string().trim().max(48).nullish()
});

orderRouter.post('/', requireAuth, limitOrders, validate(createSchema), asyncRoute(async (req, res) => {
  const order = await orders.createOrder(req, req.body);
  res.status(201).json(order);
}));

orderRouter.get('/mine', requireAuth, asyncRoute(async (req, res) => {
  const result = await orders.listUserOrders(req.user.id, {
    page: req.query.page, perPage: req.query.perPage
  });
  res.json(result);
}));

orderRouter.get('/:id', requireAuth, asyncRoute(async (req, res) => {
  const order = await orders.getOrder(String(req.params.id).slice(0, 24));
  if (!order) throw notFound('Order not found');

  // Your own order, or someone with permission to read orders.
  if (order.userId !== req.user.id && !can(req.user.role, 'orders.read')) {
    throw forbidden();
  }
  res.json(order);
}));

/* ===============================================================
   PAYMENTS
   =============================================================== */
paymentRouter.get('/providers', asyncRoute(async (req, res) => {
  res.json({ providers: payments.enabledProviders(), currency: config.payments.currency });
}));

paymentRouter.post('/:orderId/start', requireAuth, limitOrders,
  validate(z.object({ provider: z.enum(['card', 'zarinpal', 'wallet']).default('card') })),
  asyncRoute(async (req, res) => {
    const order = await orders.getOrder(String(req.params.orderId).slice(0, 24));
    if (!order) throw notFound('Order not found');
    if (order.userId !== req.user.id) throw forbidden();
    if (order.status !== 'pending') {
      throw badRequest(`That order is already ${order.status}`, 'order_not_pending');
    }

    const result = await payments.startPayment(order, req.body.provider);
    res.json({
      redirectUrl: result.redirectUrl || null,
      settled: !!result.settled,
      order: result.settled ? await orders.getOrder(order.id) : undefined
    });
  })
);

/* ---------------------------------------------------------------
   WEBHOOK
   Mounted with express.raw() in server.js so the exact bytes reach
   the signature check. No session, no CSRF: the HMAC signature is
   the authentication.
   --------------------------------------------------------------- */
paymentRouter.post('/webhook', asyncRoute(async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const result = await payments.handleWebhook(raw, req.headers);
  // Always 200 on a verified event, so the provider stops retrying.
  res.json(result);
}));

/* ---------------------------------------------------------------
   ZARINPAL CALLBACK
   ---------------------------------------------------------------
   ZarinPal sends the customer back here with ?Authority=&Status=.
   That redirect is a claim made by the browser, so it proves nothing
   on its own - anyone could type this URL. The only thing that
   releases goods is the server-to-server verify call below, which
   also re-checks the amount against what WE stored for the order.

   Flow:
     1. find the order by its stored authority
     2. refuse if it is not pending (stops replaying an old link)
     3. call ZarinPal verify with OUR amount, not theirs
     4. on 100/101 -> mark paid, deliver, redirect to success
        otherwise -> mark failed, restock, redirect to cancelled
   --------------------------------------------------------------- */
paymentRouter.get('/zarinpal/callback', asyncRoute(async (req, res) => {
  const authority = String(req.query.Authority || req.query.authority || '').slice(0, 64);
  const status = String(req.query.Status || req.query.status || '').toUpperCase();

  const fail = (reason, orderId) =>
    res.redirect(`${config.payments.cancelUrl}&reason=${encodeURIComponent(reason)}` +
                 (orderId ? `&order=${encodeURIComponent(orderId)}` : ''));

  if (!authority) return fail('missing_authority');

  // Scoped to this provider, and a live order wins over a stale one
  // with the same handle, so an old record can never shadow the
  // order the customer is actually paying for.
  const row = await db.get(
    `SELECT * FROM orders
      WHERE payment_ref = ? AND payment_provider = 'zarinpal'
      ORDER BY (status = 'pending') DESC, created_at DESC
      LIMIT 1`,
    [authority]
  );
  if (!row) {
    await log({
      category: 'security', severity: 'warning', source: 'system',
      message: `بازگشت زرین‌پال با شناسه ناشناخته: ${authority}`
    });
    return fail('unknown_order');
  }

  // Customer pressed cancel on the gateway.
  if (status !== 'OK') {
    await db.run(
      `UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'pending'`,
      [db.now(), row.id]
    );
    await restockOrder(row.id);
    await log({
      category: 'payment', severity: 'info', source: 'system',
      message: `پرداخت سفارش ${row.id} توسط کاربر لغو شد`, target: row.id
    });
    return fail('cancelled', row.id);
  }

  // Already finished: send them to the success page rather than
  // verifying (and charging) a second time.
  if (['paid', 'delivered'].includes(row.status)) {
    return res.redirect(`${config.payments.successUrl}&order=${encodeURIComponent(row.id)}`);
  }
  if (row.status !== 'pending') {
    return fail('order_not_pending', row.id);
  }

  let result;
  try {
    result = await zarinpal.verifyPayment(authority, Number(row.total));
  } catch (err) {
    await log({
      category: 'payment', severity: 'error', source: 'system',
      message: `خطا هنگام تأیید پرداخت ${row.id} در زرین‌پال: ${err.message}`, target: row.id
    });
    return fail('verify_failed', row.id);
  }

  if (!result.ok) {
    await db.run(
      `UPDATE orders SET status = 'failed', delivery_error = ?, updated_at = ? WHERE id = ?`,
      [String(result.message).slice(0, 255), db.now(), row.id]
    );
    await restockOrder(row.id);
    await log({
      category: 'payment', severity: 'warning', source: 'system',
      message: `تأیید پرداخت سفارش ${row.id} ناموفق بود: ${result.code} ${result.message}`,
      target: row.id
    });
    return fail(`verify_${result.code}`, row.id);
  }

  /* ---- verified ----
     payment_ref stays the authority: it is how this callback finds
     the order, and overwriting it would make a refresh of the return
     page look like an unknown order. The RefID is the customer's
     receipt number, so it gets its own column. */
  await db.run(
    `UPDATE orders SET status = 'paid', paid_at = COALESCE(paid_at, ?), payment_receipt = ?, updated_at = ?
      WHERE id = ?`,
    [db.now(), result.refId || null, db.now(), row.id]
  );

  // Record it so a replayed callback is visibly a duplicate.
  try {
    await db.run(
      `INSERT INTO payment_events (provider, event_id, event_type, order_id, signature_ok, payload, received_at)
       VALUES ('zarinpal', ?, 'payment.verified', ?, 1, ?, ?)`,
      [result.refId || authority, row.id, JSON.stringify(result).slice(0, 4000), db.now()]
    );
  } catch { /* duplicate ref: already recorded, nothing to do */ }

  await log({
    category: 'payment', severity: 'success', source: 'system',
    message: `پرداخت سفارش ${row.id} تأیید شد (مرجع ${result.refId}, ${row.total} تومان)`,
    target: row.id,
    meta: { refId: result.refId, cardPan: result.cardPan, alreadyVerified: result.alreadyVerified }
  });

  const { deliverOrder } = await import('../services/delivery.js');
  await deliverOrder(row.id, result.refId || authority);

  res.redirect(`${config.payments.successUrl}&order=${encodeURIComponent(row.id)}&ref=${encodeURIComponent(result.refId)}`);
}));

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

/* ---------------------------------------------------------------
   MOCK PROVIDER (development only)
   A tiny page that posts a correctly-signed webhook back to us, so
   the whole paid -> webhook -> verify -> deliver path can be tested
   without a real payment account. Disabled unless PAYMENT_PROVIDER
   is literally "mock".
   --------------------------------------------------------------- */
paymentRouter.get('/mock/pay', asyncRoute(async (req, res) => {
  if (config.payments.provider !== 'mock') throw notFound();

  const orderId = String(req.query.order || '').slice(0, 24);
  const amount = Number(req.query.amount) || 0;
  const success = String(req.query.success || '/');

  const payload = JSON.stringify({
    id: `evt_${Date.now()}`,
    type: 'payment.succeeded',
    orderId,
    amount
  });
  const signature = payments.signMock(payload);

  res.type('html').send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Mock payment</title>
<style>
 body{background:#080808;color:#c9c9c9;font-family:system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0}
 .box{max-width:460px;padding:2rem;border:1px solid rgba(212,175,55,.3);border-radius:16px;background:#111;text-align:center}
 h1{color:#d4af37;font-size:1.3rem;margin:0 0 .5rem}
 code{color:#ffd700}
 button{margin-top:1.5rem;padding:.8rem 1.6rem;border:0;border-radius:8px;background:linear-gradient(135deg,#9c7c1b,#ffd700);color:#16120a;font-weight:700;cursor:pointer;font-size:1rem}
 .warn{margin-top:1rem;font-size:.8rem;color:#ffa726}
</style></head>
<body><div class="box">
  <h1>Mock payment provider</h1>
  <p>Order <code>${orderId}</code> &mdash; <code>${amount.toFixed(2)} ${config.payments.currency}</code></p>
  <p class="warn">Development only. No real money moves. Clicking below posts a correctly signed webhook so the delivery path can be tested end to end.</p>
  <button id="pay">Simulate a successful payment</button>
</div>
<script>
document.getElementById('pay').onclick = async () => {
  await fetch('/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Royal-Signature': ${JSON.stringify(signature)} },
    body: ${JSON.stringify(payload)}
  });
  location.href = ${JSON.stringify(success)};
};
</script></body></html>`);
}));

export default { orderRouter, paymentRouter };
