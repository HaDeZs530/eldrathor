/**
 * Progression Loop Lock §9 — armor recipes, rolled ratings, and the material market floor are the spec.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARMOR_RECIPES, canCraft, consume, rollArmorRating, matPrice, MAT_FLOOR_PRICE, FABRIC_FAMILY } from './recipes.js';
import { RARITY } from '../progression/progression.js';

test('§9 recipes: one per rung; Wardplate = 8 Epic metal + 4 Epic fabric; Veinweave = 10 Legendary metal + 6 Legendary fabric', () => {
  assert.deepEqual(ARMOR_RECIPES.map((r) => r.quality), RARITY);
  const ward = ARMOR_RECIPES.find((r) => r.name === 'Wardplate'); const vein = ARMOR_RECIPES.find((r) => r.name === 'Veinweave');
  assert.equal(ward.quality, 'Epic'); assert.deepEqual(ward.inputs, [{ quality: 'Epic', family: 'metal', qty: 8 }, { quality: 'Epic', family: FABRIC_FAMILY, qty: 4 }]);
  assert.equal(vein.quality, 'Legendary'); assert.deepEqual(vein.inputs, [{ quality: 'Legendary', family: 'metal', qty: 10 }, { quality: 'Legendary', family: FABRIC_FAMILY, qty: 6 }]);
  for (const r of ARMOR_RECIPES) assert.equal('rating' in r, false, `${r.name}: rating rolls at craft time`);
});

test('crafting consumes exactly the inputs (by quality, and family when named) and refuses when short', () => {
  const inv = [{ family: 'metal', quality: 'Epic', qty: 9 }, { family: 'hunt', quality: 'Epic', qty: 4 }, { family: 'wood', quality: 'Epic', qty: 20 }];
  const ward = ARMOR_RECIPES.find((r) => r.name === 'Wardplate');
  assert.equal(canCraft(inv, ward), true);
  const after = consume(inv, ward);
  assert.deepEqual(after, [{ family: 'metal', quality: 'Epic', qty: 1 }, { family: 'wood', quality: 'Epic', qty: 20 }]); // hunt lot fully used, wood untouched
  assert.equal(consume(after, ward), null, 'short on metal and fabric now');
  // the first rungs accept any family
  const common = ARMOR_RECIPES[0];
  assert.equal(canCraft([{ family: 'wood', quality: 'Common', qty: 2 }, { family: 'hunt', quality: 'Common', qty: 1 }], common), true);
  assert.equal(canCraft([{ family: 'wood', quality: 'Common', qty: 2 }], common), false);
});

test('rating rolls 1–100; market floor = 1 ❖ × rarity index (Common 1 … Legendary 5)', () => {
  assert.equal(rollArmorRating(() => 0), 1); assert.equal(rollArmorRating(() => 0.999999), 100); assert.equal(rollArmorRating(() => 0.5), 51);
  assert.equal(MAT_FLOOR_PRICE, 1);
  assert.deepEqual(RARITY.map(matPrice), [1, 2, 3, 4, 5]);
});
