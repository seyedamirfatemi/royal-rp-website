/**
 * ROYAL RP - /api/auth
 */
import { Router } from 'express';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { permissionsFor } from '../config/roles.js';
import {
  asyncRoute, requireAuth, validate, schemas, z,
  limitAuth, badRequest, unauthorized, conflict, forbidden
} from '../middleware/index.js';
import {
  createSession, destroySession, destroyAllForUser
} from '../services/sessions.js';
import { log, audit } from '../services/logger.js';
import {
  hashPassword, verifyPassword, randomToken, sha256, clientIp, safeRedirect
} from '../utils/index.js';
import discord from '../integrations/discord.js';

const router = Router();

/* ===============================================================
   CSRF TOKEN
   =============================================================== */
router.get('/csrf', asyncRoute(async (req, res) => {
  // A signed-out visitor still needs a token to POST /login.
  if (req.session) return res.json({ csrfToken: req.session.csrfSecret });

  let token = req.cookies?.[config.session.csrfCookie];
  if (!token) {
    token = randomToken(24);
    res.cookie(config.session.csrfCookie, token, {
      httpOnly: false,
      secure: config.session.secure,
      sameSite: config.session.sameSite,
      path: '/',
      maxAge: config.session.ttlMs
    });
  }
  res.json({ csrfToken: token });
}));

/* ===============================================================
   CURRENT USER
   =============================================================== */
router.get('/me', asyncRoute(async (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({
    user: {
      ...req.user,
      permissions: permissionsFor(req.user.role)
    }
  });
}));

/* ===============================================================
   REGISTER
   =============================================================== */
const registerSchema = z.object({
  username: schemas.username,
  email: schemas.email,
  password: schemas.password,
  acceptedTerms: z.coerce.boolean().refine(v => v === true, 'You must accept the terms'),
  confirmedAge: z.coerce.boolean().refine(v => v === true, 'You must confirm you are at least 16')
});

router.post('/register', limitAuth, validate(registerSchema), asyncRoute(async (req, res) => {
  const { username, email, password } = req.body;

  const clash = await db.get(
    'SELECT id, email, username FROM users WHERE email = ? OR username = ?',
    [email, username]
  );
  if (clash) {
    // Say which field clashes - this is already discoverable at the
    // sign-in form, and a vague error just frustrates real users.
    throw conflict(
      clash.email === email ? 'An account with that email already exists' : 'That username is taken',
      clash.email === email ? 'email_taken' : 'username_taken'
    );
  }

  const total = Number(await db.scalar('SELECT COUNT(*) AS n FROM users')) || 0;
  // The very first account becomes the Owner so the panel is reachable.
  const role = total === 0 ? 'owner'
    : (config.bootstrapOwnerEmail && email === config.bootstrapOwnerEmail.toLowerCase() ? 'owner' : 'user');

  const hash = await hashPassword(password);
  const result = await db.run(
    `INSERT INTO users (username, email, password_hash, role, status, display_name, locale, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, 'fa', ?, ?)`,
    [username, email, hash, role, username, db.now(), db.now()]
  );

  const userId = result.lastId;
  await createSession(req, res, userId, { remember: false });

  await log({
    category: 'auth.login', severity: 'success',
    message: `حساب تازه ثبت شد: ${username}${role === 'owner' ? ' (نخستین حساب - دسترسی مالک داده شد)' : ''}`,
    actorId: userId, actorName: username, req
  });

  const user = await db.get('SELECT id, username, email, role, status, display_name, avatar_url, locale FROM users WHERE id = ?', [userId]);
  res.status(201).json({
    user: {
      id: user.id, username: user.username, email: user.email, role: user.role,
      status: user.status, displayName: user.display_name, avatar: user.avatar_url,
      locale: user.locale, permissions: permissionsFor(user.role)
    }
  });
}));

/* ===============================================================
   LOGIN
   =============================================================== */
const loginSchema = z.object({
  email: schemas.email,
  password: z.string().min(1, 'Enter your password').max(200),
  remember: z.coerce.boolean().optional().default(false)
});

const LOCKOUT_ATTEMPTS = 8;
const LOCKOUT_WINDOW_MIN = 15;

router.post('/login', limitAuth, validate(loginSchema), asyncRoute(async (req, res) => {
  const { email, password, remember } = req.body;
  const ip = clientIp(req);
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MIN * 60000).toISOString().slice(0, 19).replace('T', ' ');

  /* ---- progressive lockout on repeated failures ---- */
  const recentFails = Number(await db.scalar(
    'SELECT COUNT(*) AS n FROM login_attempts WHERE success = 0 AND created_at > ? AND (email = ? OR ip = ?)',
    [since, email, ip]
  )) || 0;

  if (recentFails >= LOCKOUT_ATTEMPTS) {
    await log({
      category: 'auth.failed', severity: 'warning',
      message: `ورود برای ${email} از ${ip} پس از ${recentFails} تلاش ناموفق قفل شد`, req
    });
    throw unauthorized(`Too many failed attempts. Try again in ${LOCKOUT_WINDOW_MIN} minutes.`, 'locked_out');
  }

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  const ok = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, null);

  await db.run('INSERT INTO login_attempts (email, ip, success, created_at) VALUES (?, ?, ?, ?)',
    [email, ip, ok ? 1 : 0, db.now()]);

  if (!ok || !user) {
    await log({
      category: 'auth.failed', severity: 'warning',
      message: `ورود ناموفق برای ${email} از ${ip}`, req
    });
    // Deliberately identical for "no such user" and "wrong password".
    throw unauthorized('That email or password is not correct', 'bad_credentials');
  }

  if (user.status === 'suspended') {
    await log({ category: 'auth.failed', severity: 'warning',
      message: `حساب معلق تلاش کرد وارد شود: ${user.username}`, actorId: user.id, req });
    throw forbidden('This account is suspended. Open a ticket to appeal.', 'account_suspended');
  }

  await createSession(req, res, user.id, { remember });
  await db.run('UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?', [db.now(), ip, user.id]);

  await log({
    category: 'auth.login', severity: 'success',
    message: `${user.username} از ${ip} وارد شد`,
    actorId: user.id, actorName: user.username, req
  });

  res.json({
    user: {
      id: user.id, username: user.username, email: user.email, role: user.role,
      status: user.status, displayName: user.display_name, avatar: user.avatar_url,
      discordId: user.discord_id, gameLicense: user.game_license, locale: user.locale,
      permissions: permissionsFor(user.role)
    }
  });
}));

/* ===============================================================
   LOGOUT
   =============================================================== */
router.post('/logout', asyncRoute(async (req, res) => {
  if (req.user) {
    await log({ category: 'auth.login', severity: 'info',
      message: `${req.user.username} خارج شد`, actorId: req.user.id, actorName: req.user.username, req });
  }
  await destroySession(req, res);
  res.json({ ok: true });
}));

/* ===============================================================
   PASSWORD
   =============================================================== */
router.post('/forgot', limitAuth,
  validate(z.object({ email: schemas.email })),
  asyncRoute(async (req, res) => {
    const user = await db.get('SELECT id, username FROM users WHERE email = ?', [req.body.email]);

    if (user) {
      const raw = randomToken(32);
      await db.run(
        'INSERT INTO password_resets (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
        [sha256(raw), user.id, db.future(60 * 60 * 1000), db.now()]
      );
      await log({ category: 'auth.login', severity: 'info',
        message: `درخواست بازیابی رمز برای ${user.username}`, actorId: user.id, req });

      // Wire an email provider here. The link is logged in development
      // so the flow is testable without one.
      if (!config.isProd) {
        console.log(`\n  [dev] password reset link: ${config.server.publicUrl}/pages/login.html?reset=${raw}\n`);
      }
    }

    // Always the same answer, so the endpoint cannot enumerate accounts.
    res.json({ ok: true, message: 'اگر این ایمیل ثبت شده باشد، لینک بازیابی برای آن ارسال می‌شود.' });
  })
);

router.post('/password', requireAuth,
  validate(z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: schemas.password
  })),
  asyncRoute(async (req, res) => {
    const row = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const ok = await verifyPassword(req.body.currentPassword, row?.password_hash);
    if (!ok) throw badRequest('Your current password is not correct', 'bad_password');

    const hash = await hashPassword(req.body.newPassword);
    await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [hash, db.now(), req.user.id]);

    // Every other session is invalidated; this one is reissued.
    await destroyAllForUser(req.user.id);
    await createSession(req, res, req.user.id);

    await audit(req, { action: 'password.change', target: `user:${req.user.id}` });
    res.json({ ok: true });
  })
);

/* ===============================================================
   DISCORD OAUTH2
   =============================================================== */
router.get('/discord/url', asyncRoute(async (req, res) => {
  if (!config.discord.enabled) {
    throw badRequest('Discord sign-in is not configured on this server', 'discord_disabled');
  }
  const redirect = safeRedirect(req.query.next, '/pages/dashboard.html');
  const { url } = await discord.buildAuthUrl(redirect);
  res.json({ url });
}));

router.get('/discord/callback', asyncRoute(async (req, res) => {
  const fail = (reason) =>
    res.redirect(`${config.server.publicUrl}/pages/login.html?error=${encodeURIComponent(reason)}`);

  if (!config.discord.enabled) return fail('discord_disabled');
  if (req.query.error) return fail(String(req.query.error).slice(0, 60));

  const redirect = await discord.consumeState(req.query.state);
  if (!redirect) {
    await log({ category: 'security', severity: 'warning',
      message: 'بازگشت از دیسکورد با state نامعتبر یا تکراری', req });
    return fail('bad_state');
  }

  let profile;
  try {
    const token = await discord.exchangeCode(String(req.query.code || ''));
    profile = await discord.fetchProfile(token.access_token);
  } catch (err) {
    await log({ category: 'auth.failed', severity: 'error',
      message: `ورود با دیسکورد ناموفق بود: ${err.message}`, req });
    return fail('discord_failed');
  }

  /* ---- find or create the account ---- */
  let user = await db.get('SELECT * FROM users WHERE discord_id = ?', [profile.id]);

  if (!user && profile.email) {
    // Link Discord to an existing email account.
    user = await db.get('SELECT * FROM users WHERE email = ?', [profile.email.toLowerCase()]);
    if (user) {
      await db.run('UPDATE users SET discord_id = ?, discord_tag = ?, avatar_url = COALESCE(avatar_url, ?), updated_at = ? WHERE id = ?',
        [profile.id, profile.globalName, profile.avatar, db.now(), user.id]);
    }
  }

  if (!user) {
    let username = String(profile.username).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18) || 'player';
    if (username.length < 3) username = 'player' + Math.floor(Math.random() * 1000);
    while (await db.get('SELECT id FROM users WHERE username = ?', [username])) {
      username = username.slice(0, 15) + Math.floor(Math.random() * 1000);
    }

    const total = Number(await db.scalar('SELECT COUNT(*) AS n FROM users')) || 0;
    const result = await db.run(
      `INSERT INTO users (username, email, role, status, display_name, avatar_url, discord_id, discord_tag, locale, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, ?, 'fa', ?, ?)`,
      [username, profile.email || `${profile.id}@discord.local`, total === 0 ? 'owner' : 'user',
       profile.globalName, profile.avatar, profile.id, profile.globalName, db.now(), db.now()]
    );
    user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastId]);

    await log({ category: 'auth.login', severity: 'success',
      message: `حساب تازه از طریق دیسکورد ساخته شد: ${username}`, actorId: user.id, actorName: username, req });
  }

  if (user.status === 'suspended') return fail('account_suspended');

  await createSession(req, res, user.id, { remember: true });
  await db.run('UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?',
    [db.now(), clientIp(req), user.id]);

  await log({ category: 'auth.login', severity: 'success',
    message: `${user.username} با دیسکورد وارد شد`, actorId: user.id, actorName: user.username, req });

  res.redirect(config.server.publicUrl + redirect);
}));

/* ===============================================================
   LINK A GAME ACCOUNT
   ---------------------------------------------------------------
   The browser cannot simply assert "my licence is X". The player
   runs /link in game, the bridge resource posts the code with the
   real identifier, and this endpoint matches the two.
   =============================================================== */
router.post('/link-game', requireAuth,
  validate(z.object({ code: z.string().trim().regex(/^[A-Z0-9]{6,10}$/, 'Enter the code shown in game') })),
  asyncRoute(async (req, res) => {
    const row = await db.get(
      `SELECT value FROM settings WHERE key_name = ?`,
      [`linkcode:${req.body.code}`]
    );
    if (!row) throw badRequest('That code is not valid or has expired', 'bad_link_code');

    const payload = db.json(row.value, {});
    if (!payload.license) throw badRequest('That code is not valid', 'bad_link_code');
    if (payload.expires && new Date(payload.expires) < new Date()) {
      throw badRequest('That code has expired. Run /link in game again.', 'link_code_expired');
    }

    const taken = await db.get('SELECT id, username FROM users WHERE game_license = ? AND id != ?',
      [payload.license, req.user.id]);
    if (taken) throw conflict('That game account is already linked to another website account', 'license_taken');

    await db.run('UPDATE users SET game_license = ?, game_linked_at = ?, updated_at = ? WHERE id = ?',
      [payload.license, db.now(), db.now(), req.user.id]);
    await db.run('DELETE FROM settings WHERE key_name = ?', [`linkcode:${req.body.code}`]);

    await audit(req, { action: 'account.linkGame', target: `user:${req.user.id}`, after: { license: payload.license } });
    res.json({ ok: true, gameLicense: payload.license });
  })
);

export default router;
