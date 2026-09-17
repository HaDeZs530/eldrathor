/**
 * Crafter recipes, craft gating and the Smith's upgrade-grade flow —
 * docs/Eldrathor_Item_Model_Lock.md §1–§2 (M2 lock 1; supersedes the Progression lock §9 recipe list).
 *
 * Armor is CRAFTED, never dropped. Four fixed types span every rarity: **Cuirass** (body), **Helm**,
 * **Gauntlets**, **Greaves** — head / hands / feet give half the body values and cost half the
 * materials. A recipe consumes the piece's **tier band** materials at the **target rarity** (§1), so a
 * recipe is generated per (type, rarity, tier) rather than hand-listed. Names are just the type
 * ("Rare Helm", §2) — the old Wardplate / Veinweave names are gone.
 *
 * GATING (§1): Common → Epic anywhere; Legendary only with areas 6–7 unlocked; Artifact 8–9;
 * Mythic 10 (Vaelyx). Artifact and Mythic pieces are not crafted from scratch at all — they are
 * UPGRADES of an existing Legendary / Artifact piece with a Core at the Smith.
 */
import {
  RARITIES, rarityIndex, craftableRarities, canCraftRarity, ARMOR_TYPES, upgradeStepFor,
  makeArmor, makeMaterial, CORE_TYPES, armorName,
} from '../progression/items.js';

/** DESIGN-OPEN: the lock says "metal + fabric"; the gather families are wood / metal / hunt, so fabric maps to hunt. */
export const FABRIC_FAMILY = 'hunt';
export const METAL_FAMILY = 'metal';
export const MATERIAL_FAMILIES = ['wood', METAL_FAMILY, FABRIC_FAMILY];

/**
 * Body-piece material cost by rarity: `[metal, fabric]`. Epic (8 + 4) and Legendary (10 + 6) are the
 * locked Wardplate / Veinweave inputs kept verbatim; every other row is DESIGN-OPEN placeholder.
 */
export const BODY_INPUTS = {
  Common: [3, 2], Uncommon: [4, 2], Rare: [6, 3], // DESIGN-OPEN
  Epic: [8, 4], Legendary: [10, 6], // LOCKED (Progression lock §9, carried forward)
  Artifact: [12, 8], Mythic: [14, 10], // DESIGN-OPEN — reached by upgrade, not by a from-scratch craft
};
const half = (n) => Math.max(1, Math.ceil(n / 2));

/** The recipe for one armor type at one rarity and tier. Head/hands/feet cost half the body inputs. */
export function armorRecipe(type, rarity, tier) {
  const a = ARMOR_TYPES[type];
  if (!a || !RARITIES.includes(rarity)) return null;
  const [metal, fabric] = BODY_INPUTS[rarity] || BODY_INPUTS.Common;
  const scale = a.share === 1 ? (n) => n : half;
  return {
    id: `${type.toLowerCase()}_${rarity.toLowerCase()}_t${tier}`,
    type, rarity, tier, slot: a.slot, name: armorName(tier, type), // tier-named (Item Model §2, RULED 2026-09-17)
    inputs: [
      { family: METAL_FAMILY, rarity, tier, qty: scale(metal) },
      { family: FABRIC_FAMILY, rarity, tier, qty: scale(fabric) },
    ],
  };
}

/** Every recipe the player may craft from scratch at `highestArea`, at the tier band they choose. */
export function availableRecipes(highestArea, tier) {
  const rarities = craftableRarities(highestArea).filter((r) => !upgradeOnly(r));
  return Object.keys(ARMOR_TYPES).flatMap((type) => rarities.map((r) => armorRecipe(type, r, tier)));
}
/** Artifact and Mythic are never crafted from scratch — they are Smith upgrades of the rung below (§1). */
export const upgradeOnly = (rarity) => rarity === 'Artifact' || rarity === 'Mythic';

// ---------- material matching over the one bag ----------
const isMat = (m) => m && m.kind === 'material';
/** A bag material matches an input when family, rarity and tier band all line up. */
export const matches = (m, input) => isMat(m) && m.type === input.family && m.rarity === input.rarity && m.tier === input.tier;
export const countFor = (bag, input) => (bag || []).filter((m) => matches(m, input)).reduce((n, m) => n + (m.qty || 1), 0);
/** Craftable when every input is covered AND the rarity is unlocked by the highest area reached. */
export const canCraft = (bag, recipe, highestArea = 1) =>
  !!recipe && !upgradeOnly(recipe.rarity) && canCraftRarity(recipe.rarity, highestArea) && recipe.inputs.every((i) => countFor(bag, i) >= i.qty);

/** Consume a recipe's inputs from the bag (immutable). Returns null when short. */
export function consume(bag, recipe, highestArea = 1) {
  if (!canCraft(bag, recipe, highestArea)) return null;
  let list = (bag || []).map((m) => (isMat(m) ? { ...m } : m));
  for (const inp of recipe.inputs) {
    let remaining = inp.qty;
    list = list.filter((m) => {
      if (!matches(m, inp) || remaining <= 0) return true;
      const have = m.qty || 1;
      if (have <= remaining) { remaining -= have; return false; }
      m.qty = have - remaining; remaining = 0; return true;
    });
  }
  return list;
}

/** Armor rating rolls 1–100 at the bench, as it always has. */
export const rollArmorRating = (rng = Math.random) => 1 + Math.floor(rng() * 100);
/** Craft the piece a recipe describes; the rating rolls here. */
export const craftArmor = (recipe, rng = Math.random) => makeArmor({ tier: recipe.tier, rarity: recipe.rarity, type: recipe.type, rating: rollArmorRating(rng) });

// ---------- §1 the Smith's upgrade-grade flow ----------
/**
 * Legendary + Artifact Core + zone materials → Artifact; Artifact + Mythic Core → Mythic.
 * Rating and empower carry over (handled by `upgradeGrade`). DESIGN-OPEN: the material quantities.
 */
export const UPGRADE_MATERIAL_QTY = { Artifact: 6, Mythic: 10 }; // DESIGN-OPEN
export function upgradeRecipe(item) {
  const step = upgradeStepFor(item);
  if (!step) return null;
  const qty = UPGRADE_MATERIAL_QTY[step.to];
  return {
    to: step.to,
    core: step.core,
    inputs: [
      { family: METAL_FAMILY, rarity: item.rarity, tier: item.tier, qty },
      { family: FABRIC_FAMILY, rarity: item.rarity, tier: item.tier, qty: half(qty) },
    ],
  };
}
/** The bag's cores of a given type (the upgrade consumes exactly one). */
export const coresOfType = (bag, type) => (bag || []).filter((i) => i?.kind === 'core' && i.type === type);
/** Everything the upgrade needs is present (core + materials); the Worldvein check is the caller's. */
export function canUpgrade(bag, item, highestArea = 1) {
  const r = upgradeRecipe(item);
  if (!r || !canCraftRarity(r.to, highestArea)) return false;
  return coresOfType(bag, r.core).length > 0 && r.inputs.every((i) => countFor(bag, i) >= i.qty);
}

// ---------- materials ----------
export const makeMat = ({ family, rarity, tier, qty = 1 }) => makeMaterial({ type: family, rarity, tier, qty });
/** Add material units to the bag, stacking on (family, rarity, tier). */
export function addMaterial(bag, { family, rarity, tier, qty = 1 }) {
  const list = [...(bag || [])];
  const at = list.findIndex((m) => isMat(m) && m.type === family && m.rarity === rarity && m.tier === tier);
  if (at >= 0) list[at] = { ...list[at], qty: (list[at].qty || 1) + qty };
  else list.push(makeMat({ family, rarity, tier, qty }));
  return list;
}
export const describeInputs = (recipe) => recipe.inputs.map((i) => `${i.qty}× T${i.tier} ${i.rarity} ${i.family}`).join(' + ');
export { CORE_TYPES, rarityIndex };
