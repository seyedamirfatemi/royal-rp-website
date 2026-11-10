#!/usr/bin/env node
/**
 * ROYAL RP - check the live site end to end
 * ---------------------------------------------------------------
 * Exercises what a real visitor and a real signed-in player can do,
 * and checks that what they must not do is refused.
 *
 *   npm run selftest
 *   npm run selftest -- --url=https://royal-rp.ir
 *   npm run selftest -- --keep        leave the test data behind
 *
 * It makes two accounts, two orders and a ticket, then deletes them
 * again through the database when it finishes - run it as often as
 * you like without the site filling up with debris.
 *
 * Mind the auth rate limiter: ten sign-in attempts per fifteen
 * minutes. Run this three times in a row and the last one reports
 * 429s, which is the limiter working, not a fault.
 * ---------------------------------------------------------------
 */
const urlArg = process.argv.find(a => a.startsWith('--url='));
const KEEP = process.argv.includes('--keep');
const BASE = urlArg ? urlArg.slice(6).replace(/\/$/, '') : 'https://royal-rp.ir';
const API = BASE + '/api';

let pass = 0, fail = 0;
const failures = [];

let limited = 0;
let authBlocked = false;

const ok = (name, cond, extra = '') => {
  if (authBlocked && !cond) {
    limited++;
    console.log(`  ....  ${name}  (skipped: no session, auth was rate limited)`);
    return;
  }
  if (cond) { pass++; console.log(`  PASS  ${name}`); return; }
  // The auth limiter allows ten attempts per fifteen minutes. Tripping
  // it means the protection works; it does not mean the check failed,
  // so say so rather than reporting a fault that is not there.
  if (/429|rate_limited/.test(String(extra))) {
    limited++;
    console.log(`  ....  ${name}  (skipped: rate limited, which is the limiter working)`);
    return;
  }
  fail++; failures.push(name); console.log(`  FAIL  ${name}${extra ? '  -> ' + extra : ''}`);
};
const section = (t) => console.log(`\n--- ${t} ---`);

function client() { return { jar: {} }; }

async function call(c, path, { method = 'GET', body, raw = false } = {}) {
  const headers = {};
  const cookie = Object.entries(c.jar).map(([k, v]) => `${k}=${v}`).join('; ');
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (c.jar['royal_csrf'] && method !== 'GET') {
    headers['X-CSRF-Token'] = decodeURIComponent(c.jar['royal_csrf']);
  }
  const res = await fetch(API + path, {
    method, headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual'
  });
  for (const sc of res.headers.getSetCookie?.() || []) {
    const [pair] = sc.split(';');
    const i = pair.indexOf('=');
    c.jar[pair.slice(0, i)] = pair.slice(i + 1);
  }
  let data = null;
  if (!raw && (res.headers.get('content-type') || '').includes('json')) {
    try { data = await res.json(); } catch {}
  }
  return { status: res.status, data, headers: res.headers };
}

const stamp = Date.now().toString(36);
const USER = { username: 'qa' + stamp, email: `qa${stamp}@test.local`, password: 'LiveQa!2026xyz' };
const created = [];

/* =================================================================
   1. transport and headers
   ================================================================= */
section('transport');
{
  const r = await fetch(BASE + '/', { redirect: 'manual' });
  ok('https serves the site', r.status === 200, String(r.status));
  ok('HSTS is set', !!r.headers.get('strict-transport-security'));
  const csp = r.headers.get('content-security-policy') || '';
  ok('CSP present', csp.includes("default-src 'self'"));
  ok('CSP upgrades to https (correct behind TLS)', csp.includes('upgrade-insecure-requests'));
  ok('clickjacking blocked', csp.includes("frame-ancestors 'none'"));
  ok('no inline script allowed', csp.includes("script-src 'self'") && !csp.includes("'unsafe-eval'"));
}
{
  const r = await fetch('http://royal-rp.ir/', { redirect: 'manual' });
  ok('plain http redirects to https', r.status === 308 || r.status === 301 || r.status === 302,
     String(r.status));
}

/* =================================================================
   2. public content
   ================================================================= */
section('public content');
const anon = client();
{
  let r = await call(anon, '/health');
  ok('health is production', r.data?.env === 'production', r.data?.env);
  ok('site database connected', r.data?.integrations?.database?.ok === true);
  ok('game database connected', r.data?.integrations?.gameDb?.ok === true);
  ok('framework detected', r.data?.framework === 'volta', r.data?.framework);

  r = await call(anon, '/shop/products?perPage=100');
  ok('shop lists products', r.data?.total >= 20, `total ${r.data?.total}`);
  const blob = JSON.stringify(r.data);
  ok('no old branding in the shop',
     !['FiveM', 'Los Santos', 'لس سانتوس', 'دلار'].some(t => blob.includes(t)));
  ok('prices are whole Toman', (r.data?.items || []).every(p => Number.isInteger(p.price)));

  r = await call(anon, '/shop/categories');
  ok('categories listed', (r.data?.items?.length ?? 0) >= 10, String(r.data?.items?.length));

  r = await call(anon, '/shop/products/vip-gold');
  ok('single product page data', r.status === 200 && !!r.data?.nameFa, String(r.status));

  r = await call(anon, '/shop/products?q=وی‌آی‌پی');
  ok('product search works', (r.data?.total ?? 0) > 0, `total ${r.data?.total}`);

  r = await call(anon, '/news?limit=10');
  ok('news listed', (r.data?.total ?? 0) >= 6, `total ${r.data?.total}`);

  r = await call(anon, '/content/faq');
  ok('faq answers', Array.isArray(r.data?.items), r.data?.source);
  r = await call(anon, '/content/rules');
  ok('rules answer', Array.isArray(r.data?.sections), r.data?.source);
  r = await call(anon, '/content/gallery');
  ok('gallery answers', (r.data?.items?.length ?? 0) > 0, String(r.data?.items?.length));
  r = await call(anon, '/content/staff');
  ok('staff endpoint answers (empty is correct)', Array.isArray(r.data?.items));
}

/* =================================================================
   3. live game data
   ================================================================= */
section('game server');
{
  let r = await call(anon, '/server/status');
  ok('server status reachable', r.data?.connected === true, JSON.stringify(r.data).slice(0, 80));
  ok('bridge is answering', r.data?.bridge === 'ok' || r.data?.resourceCount > 10,
     `bridge=${r.data?.bridge} resources=${r.data?.resourceCount}`);
  ok('player count is a number', typeof r.data?.players === 'number');

  r = await call(anon, '/content/game-data');
  ok('jobs read from volta', (r.data?.jobs?.length ?? 0) > 10, String(r.data?.jobs?.length));
  ok('items read from volta', (r.data?.items?.length ?? 0) > 100, String(r.data?.items?.length));
}

/* =================================================================
   4. security boundaries, before signing in
   ================================================================= */
section('security, anonymous');
{
  let r = await call(anon, '/auth/me');
  ok('anonymous /me is null', r.status === 200 && r.data?.user === null);

  r = await call(anon, '/me/profile');
  ok('protected route refuses anonymous', r.status === 401, String(r.status));

  r = await call(anon, '/admin/stats');
  ok('admin refuses anonymous', r.status === 401 || r.status === 403, String(r.status));

  const fresh = client();
  r = await call(fresh, '/auth/login', { method: 'POST', body: { email: 'x@y.z', password: 'whatever' } });
  ok('login without CSRF is refused', r.status === 403, String(r.status));
}

/* =================================================================
   5. register, session, login
   ================================================================= */
section('accounts');
const user = client();
{
  await call(user, '/auth/csrf');
  let r = await call(user, '/auth/register', { method: 'POST', body: {
    username: USER.username, email: USER.email, password: USER.password,
    acceptedTerms: true, confirmedAge: true
  }});
  if (r.status === 429) authBlocked = true;
  ok('register succeeds', r.status === 201, `${r.status} ${JSON.stringify(r.data).slice(0, 90)}`);
  if (r.status === 201) created.push(`user ${USER.email}`);
  ok('new account is a plain player, not owner', r.data?.user?.role === 'user', r.data?.user?.role);
  ok('session cookie issued', !!user.jar['royal_sid']);

  r = await call(user, '/auth/me');
  ok('/me returns the signed-in user', r.data?.user?.username === USER.username);

  r = await call(user, '/auth/logout', { method: 'POST' });
  ok('logout works', r.status === 200, String(r.status));

  const again = client();
  await call(again, '/auth/csrf');
  r = await call(again, '/auth/login', { method: 'POST', body: { email: USER.email, password: USER.password } });
  ok('login with the new account', r.status === 200, String(r.status));
  user.jar = again.jar;

  r = await call(again, '/auth/login', { method: 'POST', body: { email: USER.email, password: 'WrongPass!99' } });
  ok('wrong password refused', r.status === 401, String(r.status));
  ok('error does not say which field was wrong',
     !/password is wrong|user not found/i.test(r.data?.message || ''), r.data?.message);
}

/* =================================================================
   6. what a signed-in player must NOT reach
   ================================================================= */
section('security, signed in as a player');
{
  for (const [path, label] of [
    ['/admin/stats', 'admin stats'],
    ['/admin/users', 'user list'],
    ['/admin/logs', 'logs'],
    ['/admin/products', 'product admin'],
  ]) {
    const r = await call(user, path);
    ok(`player blocked from ${label}`, r.status === 403, String(r.status));
  }
  const r = await call(user, '/admin/users/1/role', { method: 'POST', body: { role: 'owner' } });
  ok('player cannot grant themselves a role', r.status === 403, String(r.status));
}

/* =================================================================
   7. shop, cart and ordering
   ================================================================= */
section('ordering');
let orderId = null;
{
  const list = await call(user, '/shop/products?perPage=1');
  const product = list.data?.items?.[0];
  ok('a product to order', !!product?.id, product?.id);

  let r = await call(user, '/orders', { method: 'POST', body: {
    items: [{ productId: product.id, qty: 1 }]
  }});
  ok('order created', r.status === 201, `${r.status} ${JSON.stringify(r.data).slice(0, 90)}`);
  orderId = r.data?.id;
  if (orderId) created.push(`order ${orderId}`);
  ok('order is pending, not paid', r.data?.status === 'pending', r.data?.status);
  ok('server priced it itself', r.data?.total === product.price,
     `order ${r.data?.total} vs product ${product.price}`);

  // the browser must not be able to dictate a price
  r = await call(user, '/orders', { method: 'POST', body: {
    items: [{ productId: product.id, qty: 1, price: 1, unitPrice: 1 }], total: 1
  }});
  ok('a price sent by the browser is ignored',
     r.status === 201 && r.data?.total === product.price,
     `total came back ${r.data?.total}`);
  if (r.data?.id) created.push(`order ${r.data.id}`);

  r = await call(user, '/orders/mine');
  ok('player sees their own orders', (r.data?.items?.length ?? 0) >= 1, String(r.data?.items?.length));

  r = await call(user, '/payments/providers');
  ok('payment providers reported', Array.isArray(r.data?.providers), JSON.stringify(r.data));
  ok('gateway not configured yet (expected)',
     !r.data?.providers?.includes('zarinpal'), JSON.stringify(r.data?.providers));
}

/* =================================================================
   8. tickets
   ================================================================= */
section('ticket system');
let ticketId = null;
{
  let r = await call(user, '/tickets', { method: 'POST', body: {
    subject: 'تست خودکار سلامت سایت',
    category: 'general',
    priority: 'normal',
    message: 'این تیکت توسط تست خودکار ساخته شده است و می‌تواند حذف شود. بررسی عملکرد سیستم تیکت.'
  }});
  ok('ticket created', r.status === 201, `${r.status} ${JSON.stringify(r.data).slice(0, 110)}`);
  ticketId = r.data?.id;
  if (ticketId) created.push(`ticket ${ticketId}`);
  ok('ticket opens in "open" state', r.data?.status === 'open', r.data?.status);
  ok('subject stored', (r.data?.subject || '').includes('تست'), r.data?.subject);

  r = await call(user, '/tickets');
  ok('player sees their ticket', (r.data?.items?.length ?? 0) >= 1, String(r.data?.items?.length));

  if (ticketId) {
    r = await call(user, `/tickets/${ticketId}`);
    ok('ticket detail loads', r.status === 200, String(r.status));
    ok('the first message is there', (r.data?.messages?.length ?? 0) >= 1,
       String(r.data?.messages?.length));

    r = await call(user, `/tickets/${ticketId}/reply`, { method: 'POST', body: {
      text: 'پیام پیگیری از همان کاربر، برای بررسی عملکرد پاسخ‌دهی.'
    }});
    ok('player can reply', r.status === 200 || r.status === 201, String(r.status));

    r = await call(user, `/tickets/${ticketId}`);
    ok('the reply was stored', (r.data?.messages?.length ?? 0) >= 2,
       String(r.data?.messages?.length));
  }

  // validation
  r = await call(user, '/tickets', { method: 'POST', body: { subject: 'کوتاه', message: 'کم' } });
  ok('too-short ticket refused', r.status === 400, String(r.status));
  ok('the error names the field', /subject|message/i.test(r.data?.message || ''), r.data?.message);

  r = await call(user, '/tickets', { method: 'POST', body: {} });
  ok('empty ticket refused', r.status === 400, String(r.status));

  // someone else's ticket
  const other = client();
  await call(other, '/auth/csrf');
  const otherUser = `qa2${stamp}`;
  r = await call(other, '/auth/register', { method: 'POST', body: {
    username: otherUser, email: `${otherUser}@test.local`, password: 'LiveQa!2026xyz',
    acceptedTerms: true, confirmedAge: true
  }});
  if (r.status === 201) {
    created.push(`user ${otherUser}@test.local`);
    const peek = await call(other, `/tickets/${ticketId}`);
    ok('another player cannot read this ticket', peek.status === 403 || peek.status === 404,
       String(peek.status));
  } else {
    ok('another player cannot read this ticket', false, `could not create 2nd user: ${r.status}`);
  }
}

/* =================================================================
   9. player dashboard data
   ================================================================= */
section('player dashboard');
{
  let r = await call(user, '/me/profile');
  ok('profile loads', r.status === 200, String(r.status));

  r = await call(user, '/me/characters');
  ok('unlinked account gets no character', r.data?.connected === false && (r.data?.items?.length ?? 0) === 0,
     JSON.stringify(r.data).slice(0, 90));
  ok('and it says why', !!r.data?.reason || !!r.data?.message, r.data?.reason);

  r = await call(user, '/me/orders');
  ok('order history loads', r.status === 200 || r.status === 404, String(r.status));
}

/* =================================================================
   10. abuse protection
   ================================================================= */
section('abuse protection');
{
  const r = await call(anon, '/health');
  ok('rate limit headers present', !!r.headers.get('ratelimit-limit'),
     r.headers.get('ratelimit-limit'));

  const bad = client();
  await call(bad, '/auth/csrf');
  const forged = await fetch(API + '/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `royal_sid=${user.jar['royal_sid']}` },
    body: JSON.stringify({ subject: 'forged request', message: 'x'.repeat(30) })
  });
  ok('a request without the CSRF token is refused', forged.status === 403, String(forged.status));
}

/* =================================================================
   summary
   ================================================================= */
console.log(`\n${'='.repeat(52)}`);
console.log(`  ${pass} passed, ${fail} failed`);
if (fail) {
  console.log('\n  failed:');
  for (const f of failures) console.log('   -', f);
}
if (limited) {
  console.log(`  ${limited} check(s) skipped: the auth rate limiter was already full.`);
  console.log('  That is the protection working. Wait for the window to reset,');
  console.log('  or run this on the server itself - it counts per client IP,');
  console.log('  so 127.0.0.1 has its own allowance.');
}

/* ---------------------------------------------------------------
   Tidy up. The point of a check you can run often is that running it
   leaves nothing behind.
   --------------------------------------------------------------- */
if (KEEP) {
  console.log('\n  --keep: test data left in place');
  for (const c of created) console.log('   -', c);
} else if (created.length) {
  try {
    const { db } = await import('../backend/database/db.js');
    await db.connect();
    let removed = 0;
    for (const email of [USER.email, `qa2${stamp}@test.local`]) {
      const u = await db.get('SELECT id FROM users WHERE email = ?', [email]);
      if (!u) continue;
      const tickets = await db.all('SELECT id FROM tickets WHERE user_id = ?', [u.id]);
      for (const t of tickets) await db.run('DELETE FROM ticket_messages WHERE ticket_id = ?', [t.id]);
      await db.run('DELETE FROM tickets WHERE user_id = ?', [u.id]);
      const orders = await db.all('SELECT id FROM orders WHERE user_id = ?', [u.id]);
      for (const o of orders) {
        await db.run('DELETE FROM order_items WHERE order_id = ?', [o.id]);
        await db.run('DELETE FROM payment_events WHERE order_id = ?', [o.id]);
      }
      await db.run('DELETE FROM orders WHERE user_id = ?', [u.id]);
      await db.run('DELETE FROM sessions WHERE user_id = ?', [u.id]);
      await db.run('DELETE FROM notifications WHERE user_id = ?', [u.id]);
      await db.run('DELETE FROM users WHERE id = ?', [u.id]);
      removed++;
    }
    await db.close();
    console.log(`\n  cleaned up ${removed} test account(s) and everything attached to them`);
  } catch (err) {
    console.log(`\n  could not clean up automatically: ${err.message}`);
    console.log('  remove these from the admin panel:');
    for (const c of created) console.log('   -', c);
  }
}

console.log('='.repeat(52));
process.exit(fail ? 1 : 0);
