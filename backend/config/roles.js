/**
 * ROYAL RP - roles and permissions (authoritative)
 * ---------------------------------------------------------------
 * This file is the single source of truth for authorisation.
 * js/config.js mirrors the labels for the UI, but ONLY this table
 * decides what an API call is allowed to do.
 * ---------------------------------------------------------------
 */

export const ROLES = {
  owner:        { level: 100, label: 'Owner' },
  developer:    { level: 90,  label: 'Developer' },
  head_admin:   { level: 80,  label: 'Head Admin' },
  admin:        { level: 70,  label: 'Admin' },
  moderator:    { level: 60,  label: 'Moderator' },
  support:      { level: 50,  label: 'Support' },
  shop_manager: { level: 40,  label: 'Shop Manager' },
  user:         { level: 10,  label: 'Player' }
};

export const ROLE_NAMES = Object.keys(ROLES);

export function levelOf(role) {
  return ROLES[role]?.level ?? 0;
}

/** Simple hierarchy check. */
export function atLeast(role, minRole) {
  return levelOf(role) >= levelOf(minRole);
}

/**
 * Explicit permission grants.
 * A permission is allowed when the user's role is in the list.
 * Hierarchy is NOT implied here - each permission names its roles,
 * so "Shop Manager can refund but cannot ban" stays expressible.
 */
export const PERMISSIONS = {
  'panel.view':        ['shop_manager', 'support', 'moderator', 'admin', 'head_admin', 'developer', 'owner'],

  'users.read':        ['admin', 'head_admin', 'developer', 'owner'],
  'users.update':      ['head_admin', 'owner'],
  'users.suspend':     ['admin', 'head_admin', 'owner'],
  'users.setRole':     ['head_admin', 'owner'],

  'logs.read':         ['moderator', 'admin', 'head_admin', 'developer', 'owner'],
  'logs.readSecurity': ['head_admin', 'developer', 'owner'],
  'logs.export':       ['admin', 'head_admin', 'developer', 'owner'],

  'tickets.read':      ['support', 'moderator', 'admin', 'head_admin', 'owner'],
  'tickets.reply':     ['support', 'moderator', 'admin', 'head_admin', 'owner'],
  'tickets.assign':    ['moderator', 'admin', 'head_admin', 'owner'],

  'players.kick':      ['moderator', 'admin', 'head_admin', 'owner'],
  'players.ban':       ['admin', 'head_admin', 'owner'],
  'players.unban':     ['head_admin', 'owner'],

  'shop.read':         ['shop_manager', 'admin', 'head_admin', 'developer', 'owner'],
  'shop.write':        ['shop_manager', 'head_admin', 'owner'],
  'orders.read':       ['shop_manager', 'admin', 'head_admin', 'owner'],
  'orders.refund':     ['shop_manager', 'head_admin', 'owner'],
  'orders.redeliver':  ['shop_manager', 'head_admin', 'owner'],

  'news.write':        ['moderator', 'admin', 'head_admin', 'owner'],
  'content.write':     ['admin', 'head_admin', 'owner'],

  'server.read':       ['moderator', 'admin', 'head_admin', 'developer', 'owner'],
  'server.manage':     ['developer', 'owner'],

  'settings.write':    ['head_admin', 'owner'],
  'integrations.write':['developer', 'owner']
};

export function can(role, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;        // unknown permission = deny
  return allowed.includes(role);
}

/** Every permission a role holds - handy for GET /auth/me. */
export function permissionsFor(role) {
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([perm]) => perm);
}

/**
 * Can `actor` assign `targetRole` to someone?
 * You may never grant a role at or above your own level - this stops
 * a Head Admin minting another Owner.
 */
export function canAssignRole(actorRole, targetRole) {
  if (!can(actorRole, 'users.setRole')) return false;
  if (!ROLES[targetRole]) return false;
  if (actorRole === 'owner') return true;
  return levelOf(targetRole) < levelOf(actorRole);
}

export default { ROLES, ROLE_NAMES, levelOf, atLeast, can, permissionsFor, canAssignRole, PERMISSIONS };
