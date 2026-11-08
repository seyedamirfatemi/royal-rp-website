/**
 * ROYAL RP - ZarinPal payment adapter
 * ---------------------------------------------------------------
 * Two things about ZarinPal shape this file, and both are easy to get
 * wrong:
 *
 * 1. AMOUNTS ARE IN RIAL, NOT TOMAN.
 *    The store prices everything in Toman. ZarinPal expects Rial.
 *    1 Toman = 10 Rial, so every amount sent out is multiplied by 10
 *    and every amount read back is divided by 10. Getting this wrong
 *    charges the customer ten times too much or too little, so the
 *    conversion lives in exactly two functions below and nowhere else.
 *
 * 2. THERE IS NO WEBHOOK.
 *    Unlike Stripe, ZarinPal redirects the customer back to a callback
 *    URL carrying an `Authority` and `Status`. That redirect is a claim
 *    made by the browser and is NOT proof of payment. Proof comes from
 *    us calling `payment/verify.json` server-to-server afterwards.
 *    Only a verify response of 100 (or 101, already verified) releases
 *    the goods. A forged callback therefore buys nothing.
 * ---------------------------------------------------------------
 */
import { config } from '../../config/index.js';
import { db } from '../../database/db.js';
import { log } from '../../services/logger.js';

const LIVE = {
  request: 'https://payment.zarinpal.com/pg/v4/payment/request.json',
  verify:  'https://payment.zarinpal.com/pg/v4/payment/verify.json',
  startPay:'https://payment.zarinpal.com/pg/StartPay/'
};

const SANDBOX = {
  request: 'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
  verify:  'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
  startPay:'https://sandbox.zarinpal.com/pg/StartPay/'
};

function endpoints() {
  return config.payments.sandbox ? SANDBOX : LIVE;
}

/* ===============================================================
   CURRENCY
   The ONLY place Toman <-> Rial conversion happens.
   =============================================================== */
export const tomanToRial = (toman) => Math.round(Number(toman) || 0) * 10;
export const rialToToman = (rial) => Math.round((Number(rial) || 0) / 10);

/* ===============================================================
   ERROR CODES
   Persian messages, because the customer reads these.
   =============================================================== */
const ERRORS = {
  '-9':   'اطلاعات ارسالی به درگاه نامعتبر است',
  '-10':  'آی‌پی یا کلید پذیرنده صحیح نیست',
  '-11':  'درخواست مورد نظر یافت نشد',
  '-12':  'امکان ویرایش درخواست وجود ندارد',
  '-15':  'درگاه پرداخت تعلیق شده است',
  '-16':  'سطح تأیید پذیرنده پایین‌تر از حد مجاز است',
  '-30':  'سرویس تسویه اشتراکی برای این پذیرنده فعال نیست',
  '-31':  'حساب بانکی تسویه را به پنل اضافه کنید',
  '-33':  'مبلغ تراکنش با مبلغ پرداخت‌شده مطابقت ندارد',
  '-34':  'سقف تقسیم تراکنش از نظر تعداد یا مبلغ عبور کرده',
  '-40':  'دسترسی غیرمجاز',
  '-50':  'مبلغ پرداخت‌شده با مبلغ ارسالی یکسان نیست',
  '-51':  'پرداخت ناموفق بود',
  '-52':  'خطای غیرمنتظره از سمت درگاه',
  '-53':  'این پرداخت متعلق به این پذیرنده نیست',
  '-54':  'شناسه مرجع نامعتبر است',
  '101':  'تراکنش قبلاً تأیید شده است'
};

const errorMessage = (code) => ERRORS[String(code)] || `خطای درگاه پرداخت (کد ${code})`;

/* ===============================================================
   HTTP
   =============================================================== */
async function post(url, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); }
    catch { throw new Error(`پاسخ نامعتبر از زرین‌پال (${res.status})`); }
    return json;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('درگاه پرداخت پاسخ نداد (timeout)');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ZarinPal v4 returns either `data` populated or `errors` populated.
 * An empty array in `errors` is normal and means "no error".
 */
function unwrap(json) {
  const data = json?.data;
  const errors = json?.errors;

  if (data && typeof data === 'object' && !Array.isArray(data) && data.code !== undefined) {
    return { ok: Number(data.code) === 100 || Number(data.code) === 101, code: Number(data.code), data };
  }
  if (errors && !Array.isArray(errors) && errors.code !== undefined) {
    return { ok: false, code: Number(errors.code), message: errors.message };
  }
  if (Array.isArray(errors) && errors.length) {
    return { ok: false, code: Number(errors[0]?.code ?? -1), message: errors[0]?.message };
  }
  return { ok: false, code: -1, message: 'پاسخ غیرمنتظره از درگاه' };
}

/* ===============================================================
   CREATE CHECKOUT
   =============================================================== */
export async function createCheckout(order, { successUrl }) {
  if (!config.payments.merchantId) {
    throw new Error('ZARINPAL_MERCHANT_ID تنظیم نشده است');
  }

  const ep = endpoints();
  const amountRial = tomanToRial(order.total);

  // ZarinPal rejects anything under 1,000 Rial (100 Toman).
  if (amountRial < 1000) {
    throw new Error('حداقل مبلغ قابل پرداخت ۱۰۰ تومان است');
  }

  const callback = `${config.server.publicUrl.replace(/\/$/, '')}/api/payments/zarinpal/callback`;

  const metadata = {};
  if (order.email)  metadata.email  = order.email;
  if (order.mobile) metadata.mobile = order.mobile;

  const json = await post(ep.request, {
    merchant_id: config.payments.merchantId,
    amount: amountRial,
    callback_url: callback,
    description: `سفارش ${order.id} - ROYAL RP`,
    ...(Object.keys(metadata).length ? { metadata } : {})
  });

  const r = unwrap(json);
  if (!r.ok || !r.data?.authority) {
    await log({
      category: 'payment', severity: 'error', source: 'system',
      message: `درخواست پرداخت زرین‌پال برای ${order.id} ناموفق بود: ${r.code} ${r.message || ''}`,
      target: order.id
    });
    throw new Error(errorMessage(r.code));
  }

  const authority = r.data.authority;

  // The authority is how the callback finds this order again.
  await db.run(
    'UPDATE orders SET payment_ref = ?, updated_at = ? WHERE id = ?',
    [authority, db.now(), order.id]
  );

  return { redirectUrl: ep.startPay + authority, reference: authority };
}

/* ===============================================================
   VERIFY
   The authoritative step. Called from the callback route, never by
   the browser, and its result is what decides whether goods ship.
   =============================================================== */
export async function verifyPayment(authority, expectedTotalToman) {
  const ep = endpoints();

  const json = await post(ep.verify, {
    merchant_id: config.payments.merchantId,
    amount: tomanToRial(expectedTotalToman),
    authority
  });

  const r = unwrap(json);

  if (!r.ok) {
    return { ok: false, code: r.code, message: errorMessage(r.code) };
  }

  return {
    ok: true,
    code: r.code,                       // 100 = verified now, 101 = already verified
    alreadyVerified: r.code === 101,
    refId: String(r.data.ref_id || ''),
    cardPan: r.data.card_pan || null,
    feeType: r.data.fee_type || null,
    fee: r.data.fee !== undefined ? rialToToman(r.data.fee) : null
  };
}

/**
 * ZarinPal has no webhook, so this adapter never has a signature to
 * check. The payments layer calls verifyPayment() from the callback
 * route instead; this exists so the provider interface stays uniform.
 */
export function verifyWebhook() {
  return { ok: false, reason: 'zarinpal_uses_callback_verification' };
}

export default {
  id: 'zarinpal',
  usesCallback: true,
  createCheckout,
  verifyPayment,
  verifyWebhook,
  tomanToRial,
  rialToToman,
  errorMessage
};
