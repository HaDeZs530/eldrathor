/**
 * Progression formulas — docs/Eldrathor_Progression_Loop_Lock.md §2–§5 (M1b). Pure; every number
 * here is asserted by progression.test.js ("tests are the spec").
 */
import { newId } from '../data.js';

// ---------- §2 rarity ladder ----------
export const RARITY = ['Common', 'Fine', 'Rare', 'Epic', 'Legendary'];
export const rarityIndex = (r) => Math.max(1, RARITY.indexOf(r) + 1); // 1–5 (unknown → 1)

/** Drop band index (0–4) by area tier: 1–2 Common, 3–4 Fine, 5–6 Rare, 7–8 Epic, 9 Legendary. */
export function bandForTier(T) {
  const t = Math.max(1, Math.min(9, T | 0));
  if (t <= 2) return 0;
  if (t <= 4) return 1;
  if (t <= 6) return 2;
  if (t <= 8) return 3;
  return 4;
}

/**
 * Roll a rarity: 70 % band, 20 % one up, 10 % one down (Attune Vein: one-up becomes 40 %),
 * floored at Common and capped at Legendary. `shift` = extra bands (rare +1, boss +1).
 */
export function rollRarity(rng, T, { attune = false, shift = 0 } = {}) {
  const up = attune ? 0.4 : 0.2;
  const r = rng();
  const delta = r < up ? 1 : r < up + 0.1 ? -1 : 0;
  const idx = Math.max(0, Math.min(RARITY.length - 1, bandForTier(T) + shift + delta));
  return RARITY[idx];
}

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
/** Train (AFK): XP per minute at the highest unlocked area tier — no catch-up cap, slower than fighting. */
export const trainXpPerMinute = (Tmax) => 6 * Math.pow(1.5, Math.max(1, Tmax) - 1);

// ---------- §4 equipment ----------
/** Hit-damage multiplier from the equipped weapon item: rating (immutable) and empower (0–100). */
export const weaponDamageMult = (w) => (0.8 + 0.4 * Math.max(0, Math.min(100, w?.baseRating ?? w?.rating ?? 0)) / 100) * (1 + Math.max(0, Math.min(100, w?.empower || 0)) / 100);
/** Empowerment gain from feeding `fodder` into `target`: 2 × rarityIndex(fodder) × (same type ? 1 : 0.5) × (1 + fodderRating/200), rounded, min 1. */
export function empowerGain(target, fodder) {
  if (!target || !fodder) return 0;
  const same = target.weaponType === fodder.weaponType;
  const fr = Math.max(0, Math.min(100, fodder.baseRating ?? fodder.rating ?? 0));
  return Math.max(1, Math.round(2 * rarityIndex(fodder.tier) * (same ? 1 : 0.5) * (1 + fr / 200)));
}
export const EMPOWER_MAX = 100;
export const empowerCost = (empower) => 15 + Math.max(0, Math.min(EMPOWER_MAX, empower | 0));
/** Preview an empowerment: gain is clipped at the cap; null when it would do nothing. */
export function previewEmpower(target, fodder, worldvein) {
  if (!target || !fodder || target.id === fodder.id) return null;
  const cur = Math.max(0, Math.min(EMPOWER_MAX, target.empower || 0));
  const gain = Math.min(EMPOWER_MAX - cur, empowerGain(target, fodder));
  const cost = empowerCost(cur);
  return { gain, cost, next: cur + gain, affordable: worldvein >= cost, useful: gain > 0 && cur < EMPOWER_MAX };
}
/** Body armor bonus: tier q (1–5 by rarity), rating r → +HP 25·q·(0.8+0.4r/100), +mitigation 0.02·q. */
export function armorBonus(armor) {
  if (!armor) return { hp: 0, mit: 0 };
  const q = rarityIndex(armor.tier || armor.quality);
  const r = Math.max(0, Math.min(100, armor.rating || 0));
  return { hp: 25 * q * (0.8 + 0.4 * r / 100), mit: 0.02 * q };
}
export const MITIGATION_CAP = 0.6;

// ---------- §5 crit ----------
/** critMult = 1.5 + (seed − 10) × 0.05 + gemCritDamage — the gem term is ADDITIVE (a +0.5 gem on a seed-10 archetype = 2.0×). */
export const critMult = (critDamageSeed, gemCritDamage = 0) => 1.5 + (critDamageSeed - 10) * 0.05 + (gemCritDamage || 0);

// ---------- starter gear (DESIGN-OPEN: rating; the lock says "Common weapons") ----------
export const STARTER_WEAPON_RATING = 30;

// ---------- weapon items ----------
/** A stash weapon item. `baseRating` never changes after the roll; `empower` grows 0–100 at the Smith. */
export const makeWeapon = ({ tier, weaponType, baseRating, empower = 0, starter = false }) => ({
  id: newId('w'), name: `${tier} ${weaponType}`, tier, weaponType, baseRating: Math.max(1, Math.min(100, Math.round(baseRating))), empower, ...(starter ? { starter: true } : {}),
});
/** The Common weapon every Adventurer starts with (the lock's "fresh party, Common weapons"). */
export const starterWeapon = (weaponType) => makeWeapon({ tier: 'Common', weaponType, baseRating: STARTER_WEAPON_RATING, starter: true });
/**
 * Give every member without an equipped weapon a starter of their archetype's default type.
 * Idempotent. @returns {{members:object[], stash:object[]}}
 */
export function withStarterWeapons(members, stash = []) {
  const out = [...stash];
  const next = members.map((m) => {
    if (m.weaponId && out.some((w) => w.id === m.weaponId)) return m;
    const w = starterWeapon(m.weapon || 'Sword + Shield');
    out.push(w);
    return { ...m, weaponId: w.id, xp: m.xp || 0 };
  });
  return { members: next, stash: out };
}
/** Ids of every item currently equipped by anyone (weapons and armor). */
export const equippedIds = (...lists) => new Set(lists.flat().flatMap((m) => [m?.weaponId, m?.armorId]).filter(Boolean));
/** §7 name rule: 1–16 characters after trimming. */
export const validName = (s) => { const t = String(s ?? '').trim(); return t.length >= 1 && t.length <= 16; };
export const NAME_MAX = 16;
