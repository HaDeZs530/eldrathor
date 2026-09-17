/**
 * Boss weapon names — docs/Eldrathor_Item_Model_Lock.md §2 (RULED 2026-09-17). A weapon dropped by an
 * AREA BOSS draws its special name from a boss-named pool (three per boss, e.g. "Brinewarden's Maul",
 * "Skarra's Talon") instead of the tier pool. The Design Chat writes the pools; until they land every
 * pool holds the placeholder `"<Boss>'s <Type>"` — the shape is real and tested, only the words are pending.
 */
import { AREAS } from '../data.js';

export const NAMES_PER_BOSS = 3; // the locked pool size

/** "The Brinewarden" → "Brinewarden" (possessive reads better without the article). */
export const bossShortName = (boss) => String(boss || '').replace(/^The\s+/i, '');

/** DESIGN-OPEN placeholder pool: one entry per boss, filled per drop with the weapon type. */
const placeholder = (boss) => [`${bossShortName(boss)}'s <Type>`];

/** `{ [bossName]: string[] }` — the shape the lock specifies (a "<Type>" token is replaced at draw time). */
export const BOSS_WEAPON_NAMES = Object.fromEntries(AREAS.map((a) => [a.boss, placeholder(a.boss)]));

/** True once a boss carries the locked three names rather than the placeholder. */
export const bossPoolIsNamed = (boss) => (BOSS_WEAPON_NAMES[boss]?.length || 0) >= NAMES_PER_BOSS;

/** Draw a boss-named special name for a dropped weapon; null when the boss is unknown (fall back to the tier pool). */
export function bossWeaponName(boss, type, rng = Math.random) {
  const pool = BOSS_WEAPON_NAMES[boss];
  if (!pool || pool.length === 0) return null;
  const pick = pool[Math.floor(rng() * pool.length) % pool.length];
  return pick.replace('<Type>', type);
}
