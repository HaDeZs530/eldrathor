/**
 * Crafter recipes + market floor — docs/Eldrathor_Progression_Loop_Lock.md §2 / §9 (2026-09-14).
 * One body-armor recipe per rarity rung. Ratings ROLL 1–100 at craft time ("as always"). Epic and
 * Legendary are the lock's Wardplate / Veinweave with explicit material inputs; the first three rungs
 * keep the prototype's "N infused of that quality, any family" (DESIGN-OPEN: their inputs).
 * DESIGN-OPEN: the lock says "metal + fabric"; the gather families are wood / metal / hunt — fabric is
 * mapped to the hunt family until the material-family lock lands.
 */
import { rarityIndex } from '../progression/progression.js';

export const FABRIC_FAMILY = 'hunt'; // DESIGN-OPEN: fabric → hunt

export const ARMOR_RECIPES = [
  { id: 'vest_common', name: 'Veinwoven Vest', quality: 'Common', inputs: [{ quality: 'Common', qty: 3 }] },
  { id: 'vest_fine', name: 'Boundweave Mail', quality: 'Fine', inputs: [{ quality: 'Fine', qty: 3 }] },
  { id: 'vest_rare', name: 'Mythros Plate', quality: 'Rare', inputs: [{ quality: 'Rare', qty: 2 }] },
  { id: 'wardplate', name: 'Wardplate', quality: 'Epic', inputs: [{ quality: 'Epic', family: 'metal', qty: 8 }, { quality: 'Epic', family: FABRIC_FAMILY, qty: 4 }] },
  { id: 'veinweave', name: 'Veinweave', quality: 'Legendary', inputs: [{ quality: 'Legendary', family: 'metal', qty: 10 }, { quality: 'Legendary', family: FABRIC_FAMILY, qty: 6 }] },
];

/** Infused mats matching an input (quality, and family when the input names one). */
export const matches = (m, input) => m.quality === input.quality && (!input.family || m.family === input.family);
export const countFor = (infused, input) => (infused || []).filter((m) => matches(m, input)).reduce((n, m) => n + m.qty, 0);
export const canCraft = (infused, recipe) => recipe.inputs.every((inp) => countFor(infused, inp) >= inp.qty);

/** Consume a recipe's inputs from an infused list (immutable). Returns null when short. */
export function consume(infused, recipe) {
  if (!canCraft(infused, recipe)) return null;
  let list = (infused || []).map((m) => ({ ...m }));
  for (const inp of recipe.inputs) {
    let remaining = inp.qty;
    list = list.filter((m) => {
      if (!matches(m, inp) || remaining <= 0) return true;
      if (m.qty <= remaining) { remaining -= m.qty; return false; }
      m.qty -= remaining; remaining = 0; return true;
    });
  }
  return list;
}

/** Armor rating rolls 1–100 at craft time. */
export const rollArmorRating = (rng = Math.random) => 1 + Math.floor(rng() * 100);

/** Material market floor: 1 ❖ × rarity index (Common 1 … Legendary 5). */
export const MAT_FLOOR_PRICE = 1;
export const matPrice = (quality) => MAT_FLOOR_PRICE * rarityIndex(quality);
export const describeInputs = (recipe) => recipe.inputs.map((i) => `${i.qty}× ${i.quality}${i.family ? ` ${i.family}` : ''}`).join(' + ');
