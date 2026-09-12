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
 * @param {{tier:number,nodeType:string,attuneVein?:boolean,rng?:()=>number,named?:boolean,mapClear?:boolean}} args
 *   named    — named variant: +1 extra loot roll at +1 tier (RouteMap §5)
 *   mapClear — boss killed with every node cleared: +50% Worldvein + one guaranteed Rare-tier roll (§6)
 * @returns {{worldvein:number, attuneBonus:number, mapClearBonus:number, gears:object[], gear:object|null}}
 */
export function rollRewards({ tier, worldTier, nodeType, attuneVein = false, rng = Math.random, named = false, mapClear = false }) {
  const T = Math.max(1, tier || worldTier || 1);
  const base = VEIN_BASE[nodeType] || 1;
  let worldvein = Math.round((4 + rng() * 5) * base * T);
  let attuneBonus = 0;
  if (attuneVein) {
    attuneBonus = Math.round(worldvein * 0.2);
    worldvein += attuneBonus;
  }
  let mapClearBonus = 0;
  if (mapClear) {
    mapClearBonus = Math.round(worldvein * 0.5);
    worldvein += mapClearBonus;
  }

  const rollGear = (tierBias, forceTierIdx = null) => {
    // tier = area tier ± 1 (−1 / 0 / +1 evenly), + bias (Attune Vein +1, named +1), clamped to the 5 tiers
    const wobble = Math.floor(rng() * 3) - 1;
    const idx = forceTierIdx ?? Math.max(0, Math.min(LOOT_TIERS.length - 1, T - 1 + wobble + tierBias));
    const lootTier = LOOT_TIERS[idx];
    const weaponType = WEAPON_TYPES[Math.floor(rng() * WEAPON_TYPES.length)];
    return { name: `${lootTier} ${weaponType}`, tier: lootTier, weaponType, rating: 1 + Math.floor(rng() * 100) };
  };
  const gears = [];
  const bias = attuneVein ? 1 : 0;
  if (rng() < (GEAR_CHANCE[nodeType] ?? 0.12)) gears.push(rollGear(bias));
  if (named) gears.push(rollGear(bias + 1));
  if (mapClear) gears.push(rollGear(bias, Math.max(LOOT_TIERS.indexOf('Rare'), Math.min(LOOT_TIERS.length - 1, T - 1 + bias))));
  return { worldvein, attuneBonus, mapClearBonus, gears, gear: gears[0] || null };
}
