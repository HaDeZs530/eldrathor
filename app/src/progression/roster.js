/**
 * Roster recruitment — docs/Eldrathor_Item_Model_Lock.md §8. Pure, so the daily candidate list and the
 * "first three free" rule are asserted directly.
 */
import { ARCHETYPES, WEAPONS } from '../data.js';

export const FREE_RECRUITS = 3;
// RULED 2026-09-19 (open-numbers brief): first three free, then `50 × (rosterSize − 2)` ❖ — rosterSize is the
// number of recruits already taken on (the same count the free rule uses), so the 4th costs 50, the 5th 100, …
export const RECRUIT_COST_STEP = 50;
export const CANDIDATES_PER_DAY = 3;
/** Worldvein the NEXT recruit costs once `hired` Adventurers have been taken on. */
export const recruitCost = (hired) => (hired < FREE_RECRUITS ? 0 : RECRUIT_COST_STEP * (hired - (FREE_RECRUITS - 1)));

const ARCHETYPE_LIST = Object.keys(ARCHETYPES);
export const WEAPON_FOR = { Bulwark: 'Sword + Shield', Warden: 'Staff', Striker: 'Dual Daggers', Adept: 'Orb + Tome', Resonator: 'Orb + Tome' };
// DESIGN-OPEN: candidate name pool. Ruled 2026-09-19: draw from the weapon-name adjective pool — that pool arrives
// with the Design Chat's `data/weaponNames.js`; until it lands these placeholders stay.
export const NAME_POOL = ['Sera', 'Halvard', 'Nym', 'Tove', 'Bren', 'Isolde', 'Corin', 'Maren', 'Fell', 'Anwe', 'Dain', 'Sova'];

/** Deterministic per-day candidates, so the list is stable until the day rolls over ("refreshed daily"). */
export function candidatesForDay(day, count = CANDIDATES_PER_DAY) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const n = Math.abs(Math.imul(day + 1, 2654435761) + i * 40503) >>> 0;
    const archetype = ARCHETYPE_LIST[n % ARCHETYPE_LIST.length];
    out.push({
      key: `${day}-${i}`,
      name: NAME_POOL[(n >>> 5) % NAME_POOL.length],
      archetype,
      weapon: WEAPON_FOR[archetype] || Object.keys(WEAPONS)[0],
    });
  }
  return out;
}
export const dayNumber = (now = Date.now()) => Math.floor(now / 86400000);
