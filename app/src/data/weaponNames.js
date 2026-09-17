/**
 * Weapon special names — docs/Eldrathor_Item_Model_Lock.md §2 (RULED 2026-09-16).
 * A weapon's special name is drawn at drop time from a pool **per type per tier**, so the name signals
 * the tier: a T1 Greatsword reads "Gullwatch Cleaver", a T7 reads "Kingsfall". Four names per type per
 * tier = 8 × 7 × 4 = 224. The special name shows ONLY in the bag list and the item-sheet header;
 * everywhere else the item is "Rare Greatsword" (see `plainName` in progression/items.js).
 *
 * DESIGN-OPEN: the Claude Design Chat writes the 224 names. Until they land, every pool holds the one
 * placeholder `<Type> of T<n>` — the shape is real and tested, only the words are pending.
 */
import { WEAPONS } from '../data.js';

export const TYPES = Object.keys(WEAPONS);
export const TIERS = [1, 2, 3, 4, 5, 6, 7];
export const NAMES_PER_POOL = 4; // the locked pool size; the placeholder pools hold 1 until the names land

/** DESIGN-OPEN placeholder pool — one name per type per tier until the Design Chat supplies four. */
const placeholder = (type, tier) => [`${type} of T${tier}`];

/** `{ [type]: { [tier]: string[] } }` — the shape the lock specifies. */
export const WEAPON_NAMES = Object.fromEntries(
  TYPES.map((type) => [type, Object.fromEntries(TIERS.map((tier) => [tier, placeholder(type, tier)]))]),
);

/** True once a pool carries the locked four names rather than the placeholder. */
export const poolIsNamed = (type, tier) => (WEAPON_NAMES[type]?.[tier]?.length || 0) >= NAMES_PER_POOL;

/** Draw a special name for a dropped weapon. Falls back to the plain name when the type is unknown. */
export function weaponSpecialName(type, tier, rng = Math.random) {
  const pool = WEAPON_NAMES[type]?.[Math.max(1, Math.min(7, tier | 0))];
  if (!pool || pool.length === 0) return type;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}
