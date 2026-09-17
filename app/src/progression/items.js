/**
 * The item model — docs/Eldrathor_Item_Model_Lock.md §1–§4 (LOCKED 2026-09-16, M2 lock 1).
 * Supersedes the five-rung ladder of Progression Loop Lock §2.
 *
 * TWO AXES on every item. **Tier** (1–7) is power and comes from the area the item dropped in;
 * **rarity** (7 rungs) is quality and refines it. Tier dominates: a T5 Common beats a T1 Artifact.
 *
 *   item stat = base(type) × tierMult(T) × rarityMult(R) × (0.8 + 0.4·rating/100) × (1 + empower/100)
 *
 * Pure; every number here is asserted by items.test.js ("tests are the spec").
 */
import { WEAPONS, newId, RARITIES, RARITY_COLOR } from '../data.js';
import { weaponSpecialName } from '../data/weaponNames.js';

// ---------- §1 the seven-rung ladder (the table itself lives in data.js) ----------
export { RARITIES, RARITY_COLOR };
/** 1-based rung (unknown → 1). */
export const rarityIndex = (r) => Math.max(1, RARITIES.indexOf(r) + 1);

// ---------- §1 tiers ----------
export const TIER_MIN = 1;
export const TIER_MAX = 7;
/**
 * Area (1–9, plus 10 = Vaelyx) → item tier. Anthony's fixed points are 6–7 → T5, 8–9 → T6, 10 → T7;
 * the lower bands are the lock's first pass.
 */
export const TIER_FOR_AREA = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 6, 10: 7 };
export const tierForArea = (area) => TIER_FOR_AREA[Math.max(1, Math.min(10, area | 0))] || 1;
/** Areas that map to a tier — the inverse of TIER_FOR_AREA, used by the craft gate and the bag. */
export const areasForTier = (T) => Object.keys(TIER_FOR_AREA).map(Number).filter((a) => TIER_FOR_AREA[a] === T);

/** tierMult T1..T7 — tracks enemy scaling 1.45^(T−1) (lock §1, "tune"). */
export const TIER_MULT = [1.0, 1.45, 2.1, 3.0, 4.4, 6.4, 9.2];
export const tierMult = (T) => TIER_MULT[Math.max(TIER_MIN, Math.min(TIER_MAX, T | 0)) - 1];
/** rarityMult by rung (lock §1, "tune"). */
export const RARITY_MULT = { Common: 1.0, Uncommon: 1.08, Rare: 1.18, Epic: 1.3, Legendary: 1.45, Artifact: 1.62, Mythic: 1.82 };
export const rarityMult = (r) => RARITY_MULT[r] ?? RARITY_MULT.Common;

export const clampRating = (n) => Math.max(1, Math.min(100, Math.round(Number(n) || 1)));
export const clampEmpower = (n) => Math.max(0, Math.min(EMPOWER_MAX, Math.round(Number(n) || 0)));
export const EMPOWER_MAX = 100;
/** The rating half of the formula: 0.8 at rating 1 → 1.2 at rating 100. */
export const ratingScale = (rating) => 0.8 + 0.4 * clampRating(rating) / 100;
/** Weapons only: +1 % hit per empower point. */
export const empowerScale = (empower) => 1 + clampEmpower(empower) / 100;

/**
 * The two-axis multiplier applied to an item's `base(type)` value.
 * Weapons include the empower term; armor and materials do not.
 */
export function itemMult(item) {
  if (!item) return 0;
  const emp = item.kind === 'weapon' ? empowerScale(item.empower) : 1;
  return tierMult(item.tier) * rarityMult(item.rarity) * ratingScale(item.rating) * emp;
}

// ---------- §2 types ----------
export const WEAPON_TYPES = Object.keys(WEAPONS);
/**
 * Armor types are fixed and span every rarity. Head / Hands / Feet give HALF the body values (§2).
 * `base` is the T1 Common contribution at rating 100 → ×1.2; DESIGN-OPEN: the lock does not give
 * base(Cuirass), so the prototype's body-armor numbers (25 HP, 0.02 mitigation) are kept as the base
 * so a T1 Common Cuirass is exactly today's Common armor and nothing jumps on migration.
 */
export const ARMOR_TYPES = {
  Cuirass: { slot: 'body', share: 1, hp: 25, mit: 0.02 },
  Helm: { slot: 'head', share: 0.5, hp: 25, mit: 0.02 },
  Gauntlets: { slot: 'hands', share: 0.5, hp: 25, mit: 0.02 },
  Greaves: { slot: 'feet', share: 0.5, hp: 25, mit: 0.02 },
};
export const ARMOR_SLOTS = ['body', 'head', 'hands', 'feet'];
/** Every equip slot on the character sheet (§6), in slot-icon order. */
export const EQUIP_SLOTS = ['weapon', 'body', 'head', 'hands', 'feet', 'gem'];
export const SLOT_LABEL = { weapon: 'Weapon', body: 'Body', head: 'Head', hands: 'Hands', feet: 'Feet', gem: 'Gem' };
export const armorTypeForSlot = (slot) => Object.keys(ARMOR_TYPES).find((t) => ARMOR_TYPES[t].slot === slot) || null;

// ---------- §2 the item shape ----------
/** `{ id, kind, type, tier, rarity, rating, empower, name }` — the one shape every item uses. */
export function makeItem({ kind, type, tier, rarity, rating = 1, empower = 0, name, qty, id, ...rest }) {
  const T = Math.max(TIER_MIN, Math.min(TIER_MAX, tier | 0));
  const R = RARITIES.includes(rarity) ? rarity : 'Common';
  const item = {
    id: id || newId(ID_PREFIX[kind] || 'i'),
    kind, type, tier: T, rarity: R,
    rating: clampRating(rating),
    empower: kind === 'weapon' ? clampEmpower(empower) : 0,
    name: name || `${R} ${type}`,
    ...rest,
  };
  if (qty != null) item.qty = Math.max(1, qty | 0);
  return item;
}
const ID_PREFIX = { weapon: 'w', armor: 'a', core: 'k', material: 'm' };

/** Plain name — what the item is called everywhere except the bag list and the item-sheet header (§2). */
export const plainName = (item) => (item ? `${item.rarity} ${item.type}` : '');
/** Display name: weapons show their special name in the bag and the sheet header; everything else is plain. */
export const displayName = (item) => (item?.kind === 'weapon' ? item.name || plainName(item) : plainName(item));

/** A weapon drop: the special name is drawn from the per-type per-tier table at roll time (§2). */
export const makeWeapon = ({ tier, rarity, type, weaponType, rating, empower = 0, rng = Math.random, starter = false }) => {
  const t = type || weaponType || 'Sword + Shield';
  return makeItem({ kind: 'weapon', type: t, tier, rarity, rating, empower, name: weaponSpecialName(t, tier, rng), ...(starter ? { starter: true } : {}) });
};
export const makeArmor = ({ tier, rarity, type = 'Cuirass', rating }) => makeItem({ kind: 'armor', type, tier, rarity, rating });
export const makeCore = ({ tier, rarity, type }) => makeItem({ kind: 'core', type, tier, rarity, rating: 100 });
export const makeMaterial = ({ tier, rarity, type, qty = 1 }) => makeItem({ kind: 'material', type, tier, rarity, rating: 1, qty });

// ---------- §1 power ----------
/** Being unarmed hurts: the archetype's default type applies at the bottom of the rating scale. */
export const UNARMED_MULT = 0.8;
/** A weapon's hit-damage multiplier on WEAPONS[type].dmg (both axes + rating + empower). */
export const weaponDamageMult = (w) => (w ? itemMult({ ...w, kind: 'weapon' }) : UNARMED_MULT);
/** A weapon's Attack Power — the number the item sheet shows (§3). */
export const weaponAttackPower = (w) => (w ? (WEAPONS[w.type]?.dmg ?? 0) * weaponDamageMult(w) : 0);
/** A weapon's Attack Speed, in seconds per swing (tempo is a property of the type, not the roll). */
export const weaponTempo = (w) => WEAPONS[w?.type]?.tempo ?? 0;
/** A weapon's own mitigation contribution (from the type). */
export const weaponMit = (w) => WEAPONS[w?.type]?.mit ?? 0;

/** An armor piece's HP and mitigation, both axes applied; head/hands/feet at half the body values (§2). */
export function armorBonus(armor) {
  if (!armor) return { hp: 0, mit: 0 };
  const a = ARMOR_TYPES[armor.type] || ARMOR_TYPES.Cuirass;
  const m = itemMult({ ...armor, kind: 'armor' });
  return { hp: a.hp * a.share * m, mit: a.mit * a.share * rarityMult(armor.rarity) };
}
/** Total bonus from every equipped armor piece. */
export function armorTotals(pieces = []) {
  return pieces.filter(Boolean).reduce((acc, p) => {
    const b = armorBonus(p);
    return { hp: acc.hp + b.hp, mit: acc.mit + b.mit };
  }, { hp: 0, mit: 0 });
}

// ---------- §1 craft gating ----------
/** The highest rarity craftable / gatherable in an area: ≤ Epic anywhere, Legendary 6–7, Artifact 8–9, Mythic 10. */
export function craftCapForArea(area) {
  const a = Math.max(1, Math.min(10, area | 0));
  if (a >= 10) return 'Mythic';
  if (a >= 8) return 'Artifact';
  if (a >= 6) return 'Legendary';
  return 'Epic';
}
/** True when `rarity` may be crafted or gathered with `highestArea` unlocked. */
export const canCraftRarity = (rarity, highestArea) => rarityIndex(rarity) <= rarityIndex(craftCapForArea(highestArea));
/** Rarities craftable with `highestArea` unlocked, lowest first. */
export const craftableRarities = (highestArea) => RARITIES.slice(0, rarityIndex(craftCapForArea(highestArea)));

// ---------- §1 cores + the Smith's upgrade-grade flow ----------
export const CORE_TYPES = { Artifact: 'Artifact Core', Mythic: 'Mythic Core' };
/** Legendary + Artifact Core → Artifact; Artifact + Mythic Core → Mythic. Nothing else upgrades grade. */
export const UPGRADE_STEP = { Legendary: { to: 'Artifact', core: CORE_TYPES.Artifact }, Artifact: { to: 'Mythic', core: CORE_TYPES.Mythic } };
export const upgradeStepFor = (item) => (item ? UPGRADE_STEP[item.rarity] || null : null);
/**
 * Upgrade an item's grade with a core. Rating and empower CARRY OVER (§1); tier is unchanged —
 * grade is quality, not power. Returns null when the item is not upgradeable.
 * DESIGN-OPEN: the Worldvein cost and the zone-material inputs are placeholders (see UPGRADE_COST).
 */
export function upgradeGrade(item, core) {
  const step = upgradeStepFor(item);
  if (!step || !core || core.kind !== 'core' || core.type !== step.core) return null;
  return { ...item, rarity: step.to, name: item.kind === 'weapon' ? item.name : `${step.to} ${item.type}` };
}
// DESIGN-OPEN: upgrade cost and the zone-material inputs are not in the lock — placeholder numbers.
export const UPGRADE_COST = { Artifact: 250, Mythic: 1000 };
export const upgradeCost = (item) => UPGRADE_COST[upgradeStepFor(item)?.to] ?? 0;

// ---------- §4 sell value ----------
// DESIGN-OPEN: the lock sets the shape `base(rarity) × (1 + rating/200)` but leaves base open.
export const SELL_BASE = { Common: 4, Uncommon: 8, Rare: 16, Epic: 32, Legendary: 64, Artifact: 128, Mythic: 256 };
/** Worldvein a sale gives (§4). Materials sell per unit. */
export const sellValue = (item) => (item ? Math.max(1, Math.round((SELL_BASE[item.rarity] ?? 1) * (1 + clampRating(item.rating) / 200))) : 0);

/** The 1–100 gear score shown in a row's `[72]` chip — the item's own rating, never a composite (§2). */
export const gearScore = (item) => (item ? clampRating(item.rating) : 0);
