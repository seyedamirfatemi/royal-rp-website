/**
 * ROYAL RP - Qbox adapter
 * ---------------------------------------------------------------
 * Qbox (qbx_core) is a fork of QBCore, so the player schema is
 * largely identical. The differences that matter here:
 *
 *   - inventory lives in ox_inventory, not the player row
 *   - some builds split charinfo into its own columns
 *   - vehicles may carry extra ox columns
 *
 * This adapter reuses the QBCore reader and overrides the pieces
 * that genuinely differ, so there is one implementation to maintain.
 * Verify against the real source before going live.
 * ---------------------------------------------------------------
 */
import qbcore from './qbcore.js';
import { gameQuery, gameColumns, bridgeAction } from './index.js';

export const getCharacters = qbcore.getCharacters;
export const getVehicles   = qbcore.getVehicles;

/**
 * Qbox commonly uses `properties` (qbx_properties) rather than
 * QBCore's `player_houses`. Try the Qbox table first, then fall back.
 */
export async function getProperties(citizenid) {
  if (!citizenid) return null;

  const cols = (await gameColumns('properties')).map(c => c.toLowerCase());
  if (cols.length && cols.includes('owner')) {
    const rows = await gameQuery('SELECT * FROM properties WHERE owner = ?', [citizenid]);
    if (rows) {
      return rows.map(r => ({
        id: String(r.id ?? r.property_id ?? citizenid),
        name: r.label || r.name || 'Property',
        type: r.type || 'Property',
        district: r.district || null,
        value: r.price !== undefined ? Number(r.price) : null,
        storage: r.stash_slots !== undefined ? Number(r.stash_slots) : null,
        garage: r.garage_slots !== undefined ? Number(r.garage_slots) : null
      }));
    }
  }
  return qbcore.getProperties(citizenid);
}

/** Qbox routes inventory through ox_inventory. */
export async function giveItem(target, item, count) {
  return bridgeAction('inventory/give', { citizenid: target, item, count, inventory: 'ox' });
}

export const addMoney          = qbcore.addMoney;
export const giveVehicle       = qbcore.giveVehicle;
export const setVip            = qbcore.setVip;
export const addCharacterSlots = qbcore.addCharacterSlots;
export const kickPlayer        = qbcore.kickPlayer;

export default {
  framework: 'qbox',
  getCharacters, getVehicles, getProperties,
  addMoney, giveVehicle, giveItem, setVip, addCharacterSlots, kickPlayer,
  MAP: qbcore.MAP
};
