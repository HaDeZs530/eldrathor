/**
 * Results-screen rewards — docs/Eldrathor_Combat_v2_Lock.md §7, drop model from
 * docs/Eldrathor_Item_Model_Lock.md §1 (M2 lock 1; supersedes Progression Loop Lock §2's band roll).
 *
 * TIER comes from the area, always. RARITY depends on what died:
 *   · normal / crystal nodes → Common → Epic, weighted by area;
 *   · rares and area bosses  → the §1 weight table, up to **Artifact from ANY area** (an area-1 rare
 *     can drop an Artifact Greatsword at T1 — exciting, but T1 power);
 *   · bosses shift one rung up and floor the rating at 40;
 *   · Attune Vein doubles the top-two chances.
 * Mythic never drops: it exists only by upgrading an Artifact with a Mythic Core at the Smith.
 */
import {
  RARITIES, rarityIndex, tierForArea, makeWeapon, makeCore, CORE_TYPES, WEAPON_TYPES,
} from '../progression/items.js';
import { bossWeaponName } from '../data/bossWeaponNames.js';

export const LOOT_TIERS = RARITIES;
export const BOSS_RATING_FLOOR = 40;
/** The highest rarity that can DROP. Mythic is upgrade-only (§1). */
export const DROP_CAP = 'Artifact';

/** §1 weight table for rares and area bosses. */
export const RARE_DROP_WEIGHTS = { Common: 30, Uncommon: 28, Rare: 20, Epic: 12, Legendary: 7, Artifact: 3 };
/**
 * Normal / crystal nodes cap at Epic. DESIGN-OPEN: the lock says "Common → Epic weighted by area" but
 * gives no numbers — these are placeholders. `areaBias` tilts each rung by its index as the area
 * climbs, so deeper areas drop better commons without ever passing Epic.
 */
export const NORMAL_DROP_WEIGHTS = { Common: 52, Uncommon: 28, Rare: 14, Epic: 6 };
export const NORMAL_AREA_BIAS = 0.15; // DESIGN-OPEN

/** Weights for a node type at an area, before Attune Vein. */
export function dropWeights(nodeType, area) {
  if (nodeType === 'rare' || nodeType === 'boss') return { ...RARE_DROP_WEIGHTS };
  const bias = 1 + NORMAL_AREA_BIAS * (Math.max(1, area | 0) - 1);
  return Object.fromEntries(Object.entries(NORMAL_DROP_WEIGHTS).map(([r, w], i) => [r, w * Math.pow(bias, i)]));
}
/** §1: Attune Vein doubles the top-two chances of whatever table is in play. */
export function applyAttune(weights) {
  const rungs = Object.keys(weights).sort((a, b) => rarityIndex(a) - rarityIndex(b));
  const out = { ...weights };
  for (const r of rungs.slice(-2)) out[r] *= 2;
  return out;
}
function weightedPick(rng, weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((n, [, w]) => n + w, 0);
  let r = rng() * total;
  for (const [v, w] of entries) { r -= w; if (r <= 0) return v; }
  return entries[entries.length - 1][0];
}
/** Move a rarity up `n` rungs, never past the drop cap. */
export const stepUp = (rarity, n = 1) => RARITIES[Math.min(RARITIES.indexOf(DROP_CAP), Math.max(0, rarityIndex(rarity) - 1 + n))];

/**
 * Roll a drop rarity for a node type at an area.
 * @param {{rng:Function, area:number, nodeType:string, attune?:boolean, steps?:number}} args
 */
export function rollRarity(rng, { area = 1, nodeType = 'normal', attune = false, steps = 0 } = {}) {
  let w = dropWeights(nodeType, area);
  if (attune) w = applyAttune(w);
  const rolled = weightedPick(rng, w);
  return steps > 0 ? stepUp(rolled, steps) : rolled;
}

// DESIGN-OPEN: Worldvein amounts and drop chances are not in the v2 spec — carried over from the
// prototype's rollLoot so the economy does not change in this PR.
const VEIN_BASE = { normal: 1, crystal: 2, rare: 3, boss: 5 };
const GEAR_CHANCE = { normal: 0.12, crystal: 0.25, rare: 0.6, boss: 1 };
// RULED 2026-09-19 (open-numbers brief, tune): Artifact Core — 8 % from rares, 20 % from bosses, areas 8–9 only
// (and gathered 1 per 2 h there — see afkRuntime). Mythic Core — 25 % per Vaelyx kill.
export const CORE_AREA_MIN = 8;
export const CORE_AREA_MAX = 9;
export const CORE_DROP_CHANCE = { rare: 0.08, boss: 0.2 };
export const MYTHIC_CORE_CHANCE = 0.25;

/**
 * @param {{tier:number,area?:number,nodeType:string,attuneVein?:boolean,rng?:Function,named?:boolean,mapClear?:boolean}} args
 *   tier/area — the AREA number 1–10 (item tier is derived from it); `worldTier` kept as an alias.
 *   named     — named variant: +1 extra loot roll one rung up (RouteMap §5)
 *   mapClear  — boss killed with every node cleared: +50 % Worldvein + one guaranteed Rare-or-better roll (§6)
 *   bossName  — the area boss (boss nodes): its weapon drops take a boss-named special name (Item Model §2)
 *   vaelyx    — the kill was Vaelyx: 25 % Mythic Core (no Vaelyx encounter exists yet — the rule is wired and tested)
 * @returns {{worldvein:number, attuneBonus:number, mapClearBonus:number, gears:object[], gear:object|null}}
 */
export function rollRewards({ tier, area, worldTier, nodeType, attuneVein = false, rng = Math.random, named = false, mapClear = false, bossName = null, vaelyx = false }) {
  const A = Math.max(1, area || tier || worldTier || 1);
  const T = tierForArea(A);
  const base = VEIN_BASE[nodeType] || 1;
  let worldvein = Math.round((4 + rng() * 5) * base * A);
  let attuneBonus = 0;
  if (attuneVein) { attuneBonus = Math.round(worldvein * 0.2); worldvein += attuneBonus; }
  let mapClearBonus = 0;
  if (mapClear) { mapClearBonus = Math.round(worldvein * 0.5); worldvein += mapClearBonus; }

  // §1: bosses step one rung up and floor the rating at 40
  const bossStep = nodeType === 'boss' ? 1 : 0;
  const ratingFloor = nodeType === 'boss' ? BOSS_RATING_FLOOR : 1;
  const rollGear = (extraSteps = 0, minRarity = null) => {
    let rarity = rollRarity(rng, { area: A, nodeType, attune: attuneVein, steps: bossStep + extraSteps });
    if (minRarity && rarityIndex(rarity) < rarityIndex(minRarity)) rarity = minRarity;
    const type = WEAPON_TYPES[Math.floor(rng() * WEAPON_TYPES.length)];
    const rating = ratingFloor + Math.floor(rng() * (101 - ratingFloor));
    const w = makeWeapon({ tier: T, rarity, type, rating, rng });
    // §2 (RULED 2026-09-17): a boss's weapon drops draw from the boss-named pool instead of the tier pool
    if (nodeType === 'boss' && bossName) { const n = bossWeaponName(bossName, type, rng); if (n) w.name = n; }
    return w;
  };
  const gears = [];
  if (rng() < (GEAR_CHANCE[nodeType] ?? 0.12)) gears.push(rollGear());
  if (named) gears.push(rollGear(1)); // named variant: one extra roll one rung up (RouteMap §5)
  if (mapClear) gears.push(rollGear(0, 'Rare')); // map clear: one guaranteed Rare-or-better roll (§6)
  // §1: Artifact Cores are hunted in areas 8–9 — rares and bosses there can drop one.
  if (A >= CORE_AREA_MIN && A <= CORE_AREA_MAX && (nodeType === 'rare' || nodeType === 'boss') && rng() < (CORE_DROP_CHANCE[nodeType] || 0)) {
    gears.push(makeCore({ tier: T, rarity: 'Artifact', type: CORE_TYPES.Artifact }));
  }
  if (vaelyx && rng() < MYTHIC_CORE_CHANCE) gears.push(makeCore({ tier: T, rarity: 'Mythic', type: CORE_TYPES.Mythic }));
  return { worldvein, attuneBonus, mapClearBonus, gears, gear: gears[0] || null };
}
