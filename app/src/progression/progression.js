/**
 * Progression formulas — docs/Eldrathor_Progression_Loop_Lock.md §3–§5 (M1b), with the item model of
 * docs/Eldrathor_Item_Model_Lock.md layered on top (M2 lock 1). Pure; every number here is asserted by
 * progression.test.js ("tests are the spec").
 *
 * The ladder, the two-axis power formula, craft gating, cores and sell value moved to
 * `progression/items.js` when the seven-rung model landed; they are re-exported here so existing
 * imports keep working.
 */
import { RARITIES, rarityIndex as itemRarityIndex, EMPOWER_MAX, clampRating, makeWeapon, weaponDamageMult as itemWeaponDamageMult, armorBonus as itemArmorBonus } from './items.js';

export {
  RARITIES, RARITY_COLOR, TIER_MULT, RARITY_MULT, TIER_FOR_AREA, tierForArea, tierMult, rarityMult,
  ratingScale, empowerScale, itemMult, makeItem, makeWeapon, makeArmor, makeCore, makeMaterial,
  plainName, displayName, weaponAttackPower, weaponTempo, weaponMit, armorTotals, ARMOR_TYPES,
  ARMOR_SLOTS, EQUIP_SLOTS, SLOT_LABEL, armorTypeForSlot, WEAPON_TYPES, craftCapForArea,
  canCraftRarity, craftableRarities, CORE_TYPES, UPGRADE_STEP, upgradeStepFor, upgradeGrade,
  upgradeCost, UPGRADE_COST, sellValue, SELL_BASE, gearScore, EMPOWER_MAX, clampRating, clampEmpower,
  UNARMED_MULT,
} from './items.js';

/** The seven-rung ladder (Item Model §1). `RARITY` is kept as the old name for existing call sites. */
export const RARITY = RARITIES;
export const rarityIndex = itemRarityIndex;
/** Hit-damage multiplier from the equipped weapon: tier × rarity × rating × empower (Item Model §1). */
export const weaponDamageMult = itemWeaponDamageMult;
/** Armor HP / mitigation for one piece; head, hands and feet give half the body values (Item Model §2). */
export const armorBonus = itemArmorBonus;

// ---------- §3 character XP ----------
export const LEVEL_CAP = 50;
export const xpToNext = (L) => Math.round(100 * Math.pow(1.35, Math.max(1, L) - 1));
/** XP one enemy is worth at area tier T (rare ×3, boss ×8). */
export const enemyXp = (T, { isRare = false, isBoss = false } = {}) => 12 * Math.pow(1.5, Math.max(1, T) - 1) * (isBoss ? 8 : isRare ? 3 : 1);
/** Total fight XP for a list of enemies at area tier T. */
export const fightXp = (enemies, T) => enemies.reduce((n, e) => n + enemyXp(T, e), 0);
/**
 * Split fight XP evenly across the fielded party; the dead (hpFrac ≤ 0 at the end) get half.
 * @returns number[] per member, same order as `members`
 */
export function splitXp(total, members, hpFracs = []) {
  const n = Math.max(1, members.length);
  return members.map((_, i) => Math.round((total / n) * ((hpFracs[i] ?? 1) <= 0 ? 0.5 : 1)));
}
/** Apply XP to a member: carries `xp` within the level, levels up while xp ≥ xpToNext, capped at LEVEL_CAP. */
export function applyXp(member, gain) {
  let level = Math.max(1, member.level || 1);
  let xp = Math.max(0, member.xp || 0) + Math.max(0, gain);
  const from = level;
  while (level < LEVEL_CAP && xp >= xpToNext(level)) { xp -= xpToNext(level); level += 1; }
  if (level >= LEVEL_CAP) xp = 0;
  return { member: { ...member, level, xp }, levelsGained: level - from };
}
/** Train (AFK): XP per minute at the highest unlocked area tier — slower than fighting. */
export const trainXpPerMinute = (Tmax) => 6 * Math.pow(1.5, Math.max(1, Tmax) - 1);
/**
 * §7 (Item Model lock, restores the AFK/Town lock intent and supersedes Progression lock §3's
 * "no catch-up cap"): Train can raise an Adventurer only up to the HIGHEST level in the roster.
 * The Mountain is the only way to raise the ceiling.
 */
export const rosterCap = (members = []) => Math.max(1, ...members.map((m) => Math.max(1, m?.level || 1)));
export const TRAIN_CAP_MESSAGE = 'At roster cap — climb the mountain';
/** True when Train can still give this member XP. At the cap the slot shows TRAIN_CAP_MESSAGE. */
export const canTrain = (member, members = []) => Math.max(1, member?.level || 1) < rosterCap(members);
/**
 * Apply Train XP under the §7 ceiling. A long offline span is reconciled in one go, so the cap has to
 * clamp the RESULT, not just gate the start: levelling stops exactly at `cap` with the leftover XP
 * dropped, and `capped` tells the caller to stop the slot.
 */
export function applyTrainXp(member, gain, cap) {
  const ceiling = Math.max(1, cap || 1);
  if (Math.max(1, member?.level || 1) >= ceiling) return { member, levelsGained: 0, capped: true };
  const r = applyXp(member, gain);
  if (r.member.level < ceiling) return { ...r, capped: false };
  return { member: { ...r.member, level: ceiling, xp: 0 }, levelsGained: ceiling - Math.max(1, member.level || 1), capped: true };
}

// ---------- §4 empowerment (the Smith bench) ----------
/** Empowerment gain from feeding `fodder` into `target`: 2 × rarityIndex(fodder) × (same type ? 1 : 0.5) × (1 + fodderRating/200), rounded, min 1. */
export function empowerGain(target, fodder) {
  if (!target || !fodder) return 0;
  const same = target.type === fodder.type;
  const fr = clampRating(fodder.rating);
  return Math.max(1, Math.round(2 * itemRarityIndex(fodder.rarity) * (same ? 1 : 0.5) * (1 + fr / 200)));
}
export const empowerCost = (empower) => 15 + Math.max(0, Math.min(EMPOWER_MAX, empower | 0));
/** Preview an empowerment: gain is clipped at the cap; null when it would do nothing. */
export function previewEmpower(target, fodder, worldvein) {
  if (!target || !fodder || target.id === fodder.id) return null;
  const cur = Math.max(0, Math.min(EMPOWER_MAX, target.empower || 0));
  const gain = Math.min(EMPOWER_MAX - cur, empowerGain(target, fodder));
  const cost = empowerCost(cur);
  return { gain, cost, next: cur + gain, affordable: worldvein >= cost, useful: gain > 0 && cur < EMPOWER_MAX };
}
export const MITIGATION_CAP = 0.6;

// ---------- §5 crit ----------
/** critMult = 1.5 + (seed − 10) × 0.05 + gemCritDamage — the gem term is ADDITIVE (a +0.5 gem on a seed-10 archetype = 2.0×). */
export const critMult = (critDamageSeed, gemCritDamage = 0) => 1.5 + (critDamageSeed - 10) * 0.05 + (gemCritDamage || 0);

// ---------- starter gear + the six-slot equip map ----------
// DESIGN-OPEN: the starter rating; the lock only says "Common weapons".
export const STARTER_WEAPON_RATING = 30;
/** The T1 Common weapon every Adventurer starts with (the lock's "fresh party, Common weapons"). */
export const starterWeapon = (type) => makeWeapon({ tier: 1, rarity: 'Common', type, rating: STARTER_WEAPON_RATING, starter: true });
/**
 * Give every member without an equipped weapon a starter of their archetype's default type.
 * Idempotent. @returns {{members:object[], bag:object[]}}
 */
export function withStarterWeapons(members, bag = []) {
  const out = [...bag];
  const next = members.map((m) => {
    const eq = m.equipped || {};
    if (eq.weapon && out.some((w) => w.id === eq.weapon)) return m;
    const w = starterWeapon(m.weapon || 'Sword + Shield');
    out.push(w);
    return { ...m, equipped: { ...eq, weapon: w.id }, xp: m.xp || 0 };
  });
  return { members: next, bag: out };
}
/** Ids of every item currently equipped by anyone, across all six slots (§6). */
export const equippedIds = (...lists) => new Set(lists.flat().flatMap((m) => Object.values(m?.equipped || {})).filter(Boolean));
/** §7 name rule: 1–16 characters after trimming. */
export const validName = (s) => { const t = String(s ?? '').trim(); return t.length >= 1 && t.length <= 16; };
export const NAME_MAX = 16;
