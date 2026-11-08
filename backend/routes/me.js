/**
 * ROYAL RP - /api/me   (the signed-in player's own data)
 * ---------------------------------------------------------------
 * Character, vehicle and property data come from the FiveM game
 * database through the framework adapter. When that is not wired up
 * these endpoints return `connected: false` and an empty list, and
 * the dashboard says so. They never invent numbers.
 * ---------------------------------------------------------------
 */
import { Router } from 'express';
import { db } from '../database/db.js';
import { asyncRoute, requireAuth, validate, schemas, z, badRequest } from '../middleware/index.js';
import { getAdapter } from '../integrations/fivem/index.js';
import { userEntitlements } from '../services/delivery.js';
import orders from '../services/orders.js';
import { audit } from '../services/logger.js';

const router = Router();
router.use(requireAuth);

/** Shared reply when the game server is not connected. */
function notConnected(extra = {}) {
  return {
    connected: false,
    items: [],
    message: 'این سایت هنوز به سرور FiveM متصل نیست، بنابراین اطلاعات زنده شخصیت در دسترس نیست.',
    ...extra
  };
}

/* ===============================================================
   PROFILE
   =============================================================== */
router.get('/profile', asyncRoute(async (req, res) => {
  const u = await db.get(
    `SELECT id, username, email, role, status, display_name, avatar_url, locale,
            discord_id, discord_tag, game_license, game_linked_at,
            wallet_balance, total_spent, last_login_at, created_at
       FROM users WHERE id = ?`,
    [req.user.id]
  );

  res.json({
    id: u.id, username: u.username, email: u.email, role: u.role, status: u.status,
    displayName: u.display_name, avatar: u.avatar_url, locale: u.locale,
    discordId: u.discord_id, discordTag: u.discord_tag,
    gameLicense: u.game_license, gameLinkedAt: u.game_linked_at,
    walletBalance: Number(u.wallet_balance) || 0,
    totalSpent: Number(u.total_spent) || 0,
    lastLoginAt: u.last_login_at, createdAt: u.created_at,
    entitlements: await userEntitlements(u.id)
  });
}));

router.patch('/profile',
  validate(z.object({
    username: schemas.username.optional(),
    email: schemas.email.optional(),
    displayName: z.string().trim().max(64).optional(),
    locale: z.enum(['fa', 'en']).optional()
  })),
  asyncRoute(async (req, res) => {
    const { username, email, displayName, locale } = req.body;

    if (username) {
      const clash = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
      if (clash) throw badRequest('That username is taken', 'username_taken');
    }
    if (email) {
      const clash = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
      if (clash) throw badRequest('That email is already in use', 'email_taken');
    }

    const sets = [];
    const params = [];
    if (username)    { sets.push('username = ?');     params.push(username); }
    if (email)       { sets.push('email = ?');        params.push(email); }
    if (displayName) { sets.push('display_name = ?'); params.push(displayName); }
    if (locale)      { sets.push('locale = ?');       params.push(locale); }
    if (!sets.length) return res.json({ ok: true, unchanged: true });

    sets.push('updated_at = ?'); params.push(db.now());
    params.push(req.user.id);

    await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    await audit(req, { action: 'profile.update', target: `user:${req.user.id}`, after: req.body });
    res.json({ ok: true });
  })
);

/* ===============================================================
   GAME DATA
   =============================================================== */
router.get('/characters', asyncRoute(async (req, res) => {
  const adapter = await getAdapter();
  if (!adapter || !req.user.gameLicense) {
    return res.json(notConnected({
      reason: !req.user.gameLicense ? 'no_linked_account' : 'no_game_connection'
    }));
  }
  const items = await adapter.getCharacters(req.user.gameLicense);
  res.json({ connected: true, framework: adapter.framework, items: items || [] });
}));

router.get('/vehicles', asyncRoute(async (req, res) => {
  const adapter = await getAdapter();
  if (!adapter || !req.user.gameLicense) return res.json(notConnected());
  const items = await adapter.getVehicles(req.user.gameLicense);
  res.json({ connected: true, items: items || [] });
}));

router.get('/properties', asyncRoute(async (req, res) => {
  const adapter = await getAdapter();
  if (!adapter || !req.user.gameLicense) return res.json(notConnected());

  // QBCore/Qbox key properties by citizenid, ESX by licence.
  let key = req.user.gameLicense;
  if (adapter.framework !== 'esx') {
    const chars = await adapter.getCharacters(req.user.gameLicense);
    key = chars?.[0]?.citizenid || key;
  }
  const items = await adapter.getProperties(key);
  res.json({ connected: true, items: items || [] });
}));

/* ===============================================================
   WALLET
   =============================================================== */
router.get('/wallet', asyncRoute(async (req, res) => {
  const balance = Number(await db.scalar('SELECT wallet_balance FROM users WHERE id = ?', [req.user.id])) || 0;
  const rows = await db.all(
    'SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    [req.user.id]
  );
  res.json({
    balance,
    items: rows.map(r => ({
      id: r.id, date: r.created_at, type: r.type,
      label: r.label, amount: Number(r.amount),
      balanceAfter: Number(r.balance_after), ref: r.reference
    }))
  });
}));

/* ===============================================================
   NOTIFICATIONS
   =============================================================== */
router.get('/notifications', asyncRoute(async (req, res) => {
  const rows = await db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 60',
    [req.user.id]
  );
  res.json({
    items: rows.map(r => ({
      id: String(r.id), type: r.type, title: r.title, text: r.body,
      icon: r.icon, link: r.link, date: r.created_at, read: !!r.read_at
    })),
    unread: rows.filter(r => !r.read_at).length
  });
}));

router.post('/notifications/:id/read', asyncRoute(async (req, res) => {
  await db.run(
    'UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL',
    [db.now(), Number(req.params.id) || 0, req.user.id]
  );
  res.json({ ok: true });
}));

router.post('/notifications/read-all', asyncRoute(async (req, res) => {
  const r = await db.run(
    'UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL',
    [db.now(), req.user.id]
  );
  res.json({ ok: true, marked: r.changes });
}));

/* ===============================================================
   ACTIVITY
   =============================================================== */
router.get('/activity', asyncRoute(async (req, res) => {
  const rows = await db.all(
    `SELECT ts, category, severity, message FROM logs
      WHERE actor_id = ? AND category IN ('auth.login','purchase','website','payment')
      ORDER BY ts DESC LIMIT 40`,
    [req.user.id]
  );
  res.json({ items: rows });
}));

export default router;
