/**
 * Results-screen rewards — docs/Eldrathor_Combat_v2_Lock.md §7.
 * Worldvein gained (+20% with Attune Vein), loot = weapon name + tier + rating 1–100.
 * Loot rarity — docs/Eldrathor_Progression_Loop_Lock.md §2 (M1b): band by area tier, 70/20/10 roll
 * (Attune Vein: 40 % one-up), rares +1 band, bosses +1 band with a rating floor of 40, rating 1–100.
 */
import { WEAPONS } from '../data.js';
import { RARITY, rollRarity, makeWeapon } from '../progression/progression.js';

export const LOOT_TIERS = RARITY;
export const BOSS_RATING_FLOOR = 40;
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

  // §2: rares +1 band, bosses +1 band (and a rating floor); Attune Vein raises the one-up chance to 40 %
  const shift = nodeType === 'boss' || nodeType === 'rare' ? 1 : 0;
  const ratingFloor = nodeType === 'boss' ? BOSS_RATING_FLOOR : 1;
  const rollGear = (extraShift = 0, minTier = null) => {
    let tier = rollRarity(rng, T, { attune: attuneVein, shift: shift + extraShift });
    if (minTier && RARITY.indexOf(tier) < RARITY.indexOf(minTier)) tier = minTier;
    const weaponType = WEAPON_TYPES[Math.floor(rng() * WEAPON_TYPES.length)];
    const baseRating = ratingFloor + Math.floor(rng() * (101 - ratingFloor));
    return makeWeapon({ tier, weaponType, baseRating });
  };
  const gears = [];
  if (rng() < (GEAR_CHANCE[nodeType] ?? 0.12)) gears.push(rollGear());
  if (named) gears.push(rollGear(1)); // named variant: one extra roll at +1 band (RouteMap §5)
  if (mapClear) gears.push(rollGear(0, 'Rare')); // map clear: one guaranteed Rare-or-better roll (§6)
  return { worldvein, attuneBonus, mapClearBonus, gears, gear: gears[0] || null };
}
