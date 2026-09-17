/**
 * Roster recruitment — docs/Eldrathor_Item_Model_Lock.md §8. Pure, so the daily candidate list and the
 * "first three free" rule are asserted directly.
 */
import { ARCHETYPES, WEAPONS } from '../data.js';

export const FREE_RECRUITS = 3;
// DESIGN-OPEN: the lock says "first three free then a Worldvein cost — number DESIGN-OPEN".
export const RECRUIT_COST = 250;
export const CANDIDATES_PER_DAY = 3;
/** Worldvein a recruit costs once `hired` Adventurers have been taken on. */
export const recruitCost = (hired) => (hired < FREE_RECRUITS ? 0 : RECRUIT_COST);

const ARCHETYPE_LIST = Object.keys(ARCHETYPES);
export const WEAPON_FOR = { Bulwark: 'Sword + Shield', Warden: 'Staff', Striker: 'Dual Daggers', Adept: 'Orb + Tome', Resonator: 'Orb + Tome' };
// DESIGN-OPEN: candidate name pool — placeholders until the Design Chat writes one.
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
