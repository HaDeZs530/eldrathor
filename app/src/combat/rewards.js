/**
 * Results-screen rewards — docs/Eldrathor_Combat_v2_Lock.md §7.
 * Worldvein gained (+20% with Attune Vein), loot = weapon name + tier + rating 1–100.
 * Loot tier roll = world tier ± 1, Attune Vein biases +1.
 */
import { WEAPONS } from '../data.js';

export const LOOT_TIERS = ['Common', 'Fine', 'Rare', 'Epic', 'Legendary'];
const WEAPON_TYPES = Object.keys(WEAPONS);

// DESIGN-OPEN: Worldvein amounts and drop chances are not in the v2 spec — carried over from the
// prototype's rollLoot so the economy does not change in this PR.
const VEIN_BASE = { normal: 1, crystal: 2, rare: 3, boss: 5 };
const GEAR_CHANCE = { normal: 0.12, crystal: 0.25, rare: 0.6, boss: 1 };

/**
 * @param {{worldTier:number,nodeType:string,attuneVein?:boolean,rng?:()=>number}} args
 */
export function rollRewards({ worldTier, nodeType, attuneVein = false, rng = Math.random }) {
  const T = Math.max(1, worldTier || 1);
  const base = VEIN_BASE[nodeType] || 1;
  let worldvein = Math.round((4 + rng() * 5) * base * T);
  let attuneBonus = 0;
  if (attuneVein) {
    attuneBonus = Math.round(worldvein * 0.2);
    worldvein += attuneBonus;
  }

  let gear = null;
  if (rng() < (GEAR_CHANCE[nodeType] ?? 0.12)) {
    // tier = world tier ± 1 (−1 / 0 / +1 evenly), +1 bias with Attune Vein, clamped to the 5 tiers
    const wobble = Math.floor(rng() * 3) - 1;
    const idx = Math.max(0, Math.min(LOOT_TIERS.length - 1, T - 1 + wobble + (attuneVein ? 1 : 0)));
    const tier = LOOT_TIERS[idx];
    const weaponType = WEAPON_TYPES[Math.floor(rng() * WEAPON_TYPES.length)];
    gear = { name: `${tier} ${weaponType}`, tier, weaponType, rating: 1 + Math.floor(rng() * 100) };
  }
  return { worldvein, attuneBonus, gear };
}
