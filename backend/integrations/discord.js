/**
 * ROYAL RP - Discord integration (server side)
 * OAuth2 code exchange, profile fetch and bot role management.
 * The client secret and bot token never leave this process.
 */
import { config } from '../config/index.js';
import { db } from '../database/db.js';
import { randomToken } from '../utils/index.js';
import { log } from '../services/logger.js';

const API = 'https://discord.com/api/v10';

/* ===============================================================
   OAUTH2
   =============================================================== */

/**
 * Build an authorise URL and persist a single-use `state`.
 * The state is stored server-side and deleted on use, so a replayed
 * or forged callback is rejected.
 */
export async function buildAuthUrl(redirectAfter = '/pages/dashboard.html') {
  if (!config.discord.enabled) throw new Error('Discord sign-in is not configured');

  const state = randomToken(24);
  await db.run(
    'INSERT INTO oauth_states (state, redirect, expires_at, created_at) VALUES (?, ?, ?, ?)',
    [state, String(redirectAfter).slice(0, 255), db.future(10 * 60 * 1000), db.now()]
  );

  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.discord.redirectUri,
    response_type: 'code',
    scope: config.discord.scopes.join(' '),
    state,
    prompt: 'none'
  });
  return { url: `${API}/oauth2/authorize?${params}`, state };
}

/** Consume a state value. Returns the stored redirect, or null. */
export async function consumeState(state) {
  if (!state) return null;
  const row = await db.get('SELECT * FROM oauth_states WHERE state = ? AND expires_at > ?', [state, db.now()]);
  await db.run('DELETE FROM oauth_states WHERE state = ?', [state]);
  return row ? (row.redirect || '/pages/dashboard.html') : null;
}

/** Exchange an authorisation code for an access token. */
export async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: config.discord.clientId,
    client_secret: config.discord.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.discord.redirectUri
  });

  const res = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord token exchange failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Fetch the signed-in Discord user's profile. */
export async function fetchProfile(accessToken) {
  const res = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`Could not read the Discord profile (${res.status})`);
  const u = await res.json();

  const avatar = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${String(u.avatar).startsWith('a_') ? 'gif' : 'png'}?size=128`
    : null;

  return {
    id: u.id,
    username: u.username,
    globalName: u.global_name || u.username,
    discriminator: u.discriminator,
    email: u.email || null,
    verified: !!u.verified,
    avatar
  };
}

/* ===============================================================
   BOT - role management
   =============================================================== */
const ROLE_IDS = {
  bronze:   process.env.DISCORD_ROLE_VIP_BRONZE   || '',
  silver:   process.env.DISCORD_ROLE_VIP_SILVER   || '',
  gold:     process.env.DISCORD_ROLE_VIP_GOLD     || '',
  platinum: process.env.DISCORD_ROLE_VIP_PLATINUM || '',
  supporter:process.env.DISCORD_ROLE_SUPPORTER    || ''
};

function botHeaders() {
  return {
    Authorization: `Bot ${config.discord.botToken}`,
    'Content-Type': 'application/json'
  };
}

export async function grantDiscordRole(discordId, tierOrRoleId) {
  if (!config.discord.botToken || !config.discord.guildId) {
    throw new Error('Discord bot is not configured (DISCORD_BOT_TOKEN / DISCORD_GUILD_ID)');
  }
  const roleId = ROLE_IDS[tierOrRoleId] || tierOrRoleId;
  if (!roleId) throw new Error(`No Discord role id mapped for "${tierOrRoleId}"`);

  const res = await fetch(
    `${API}/guilds/${config.discord.guildId}/members/${discordId}/roles/${roleId}`,
    { method: 'PUT', headers: botHeaders() }
  );
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`Could not grant the Discord role (${res.status}): ${text.slice(0, 160)}`);
  }

  await log({
    category: 'admin.action', severity: 'success', source: 'system',
    message: `رول دیسکورد ${tierOrRoleId} به ${discordId} داده شد`
  });
  return true;
}

export async function revokeDiscordRole(discordId, tierOrRoleId) {
  if (!config.discord.botToken || !config.discord.guildId) return false;
  const roleId = ROLE_IDS[tierOrRoleId] || tierOrRoleId;
  if (!roleId) return false;

  const res = await fetch(
    `${API}/guilds/${config.discord.guildId}/members/${discordId}/roles/${roleId}`,
    { method: 'DELETE', headers: botHeaders() }
  );
  return res.ok || res.status === 204;
}

/** Guild member count, for the homepage counter. */
export async function guildStats() {
  if (!config.discord.botToken || !config.discord.guildId) return null;
  try {
    const res = await fetch(
      `${API}/guilds/${config.discord.guildId}?with_counts=true`,
      { headers: botHeaders() }
    );
    if (!res.ok) return null;
    const g = await res.json();
    return {
      name: g.name,
      members: g.approximate_member_count ?? null,
      online: g.approximate_presence_count ?? null
    };
  } catch {
    return null;
  }
}

export default {
  buildAuthUrl, consumeState, exchangeCode, fetchProfile,
  grantDiscordRole, revokeDiscordRole, guildStats, ROLE_IDS
};
