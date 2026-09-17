/**
 * Armor crafting, craft gating and the Smith's upgrade-grade flow —
 * docs/Eldrathor_Item_Model_Lock.md §1–§2 (M2 lock 1; supersedes the Progression lock §9 recipe list).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  armorRecipe, availableRecipes, canCraft, consume, craftArmor, rollArmorRating, upgradeOnly,
  upgradeRecipe, canUpgrade, coresOfType, addMaterial, countFor, BODY_INPUTS, FABRIC_FAMILY, METAL_FAMILY,
} from './recipes.js';
import { RARITIES, makeItem, makeCore, CORE_TYPES, upgradeGrade, ARMOR_TYPES } from '../progression/items.js';

const mat = (family, rarity, tier, qty) => makeItem({ kind: 'material', type: family, rarity, tier, rating: 1, qty });

test('§2 four armor types span every rarity; head / hands / feet cost half the body inputs and pieces are named by TIER', () => {
  assert.deepEqual(Object.keys(ARMOR_TYPES), ['Cuirass', 'Helm', 'Gauntlets', 'Greaves']);
  for (const r of RARITIES) {
    const body = armorRecipe('Cuirass', r, 3);
    assert.equal(body.name, 'Quay Cuirass', 'a T3 recipe makes tier-named armor (RULED 2026-09-17)');
    const [metal, fabric] = BODY_INPUTS[r];
    assert.deepEqual(body.inputs.map((i) => i.qty), [metal, fabric]);
    for (const type of ['Helm', 'Gauntlets', 'Greaves']) {
      const half = armorRecipe(type, r, 3);
      assert.deepEqual(half.inputs.map((i) => i.qty), [Math.ceil(metal / 2), Math.ceil(fabric / 2)], `${type} ${r}`);
    }
  }
  // the two locked rows carry forward verbatim (Progression lock §9's Wardplate / Veinweave inputs)
  assert.deepEqual(BODY_INPUTS.Epic, [8, 4]);
  assert.deepEqual(BODY_INPUTS.Legendary, [10, 6]);
});

test('§1 a recipe consumes the piece’s TIER BAND materials at the TARGET rarity, and refuses when short', () => {
  const r = armorRecipe('Cuirass', 'Epic', 5); // 8 metal + 4 fabric, both T5 Epic
  assert.deepEqual(r.inputs, [
    { family: METAL_FAMILY, rarity: 'Epic', tier: 5, qty: 8 },
    { family: FABRIC_FAMILY, rarity: 'Epic', tier: 5, qty: 4 },
  ]);
  const bag = [mat(METAL_FAMILY, 'Epic', 5, 9), mat(FABRIC_FAMILY, 'Epic', 5, 4), mat('wood', 'Epic', 5, 20), mat(METAL_FAMILY, 'Epic', 4, 50)];
  assert.equal(canCraft(bag, r, 5), true);
  const after = consume(bag, r, 5);
  assert.equal(countFor(after, r.inputs[0]), 1, 'one T5 Epic metal left');
  assert.equal(countFor(after, r.inputs[1]), 0, 'the fabric lot is spent');
  assert.equal(countFor(after, { family: METAL_FAMILY, rarity: 'Epic', tier: 4 }), 50, 'the wrong tier band is untouched');
  assert.equal(consume(after, r, 5), null, 'short now');
});

test('§1 craft gating by area: ≤ Epic anywhere, Legendary 6–7, and Artifact / Mythic are never crafted from scratch', () => {
  const full = (area) => [...new Set(availableRecipes(area, 1).map((r) => r.rarity))];
  assert.deepEqual(full(1), ['Common', 'Uncommon', 'Rare', 'Epic']);
  assert.deepEqual(full(5), ['Common', 'Uncommon', 'Rare', 'Epic']);
  assert.deepEqual(full(6), ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
  assert.deepEqual(full(9), ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'], 'Artifact is an upgrade, never a craft');
  assert.deepEqual(full(10), ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
  assert.equal(upgradeOnly('Artifact'), true);
  assert.equal(upgradeOnly('Mythic'), true);
  // a Legendary recipe is refused with only area 5 unlocked, even with the materials in hand
  const leg = armorRecipe('Cuirass', 'Legendary', 5);
  const rich = leg.inputs.reduce((b, i) => addMaterial(b, { family: i.family, rarity: i.rarity, tier: i.tier, qty: 99 }), []);
  assert.equal(canCraft(rich, leg, 5), false, 'Legendary needs areas 6–7');
  assert.equal(canCraft(rich, leg, 6), true);
});

test('the rating rolls 1–100 at the bench and the craft produces a real item of the recipe’s type / tier / rarity', () => {
  assert.equal(rollArmorRating(() => 0), 1);
  assert.equal(rollArmorRating(() => 0.999999), 100);
  assert.equal(rollArmorRating(() => 0.5), 51);
  const piece = craftArmor(armorRecipe('Greaves', 'Rare', 4), () => 0.5);
  assert.equal(piece.kind, 'armor');
  assert.equal(piece.type, 'Greaves');
  assert.equal(piece.tier, 4);
  assert.equal(piece.rarity, 'Rare');
  assert.equal(piece.rating, 51);
  assert.equal(piece.name, 'Serpent Greaves', 'T4 → Serpent');
});

test('§1 upgrade grade: Legendary + Artifact Core → Artifact and Artifact + Mythic Core → Mythic, carrying rating AND empower', () => {
  const weapon = makeItem({ kind: 'weapon', type: 'Greatsword', tier: 6, rarity: 'Legendary', rating: 88, empower: 37, name: 'Tidebreaker' });
  const r = upgradeRecipe(weapon);
  assert.equal(r.to, 'Artifact');
  assert.equal(r.core, CORE_TYPES.Artifact);
  const core = makeCore({ tier: 6, rarity: 'Artifact', type: CORE_TYPES.Artifact });
  let bag = [weapon, core];
  assert.equal(canUpgrade(bag, weapon, 9), false, 'materials still missing');
  bag = r.inputs.reduce((b, i) => addMaterial(b, { family: i.family, rarity: i.rarity, tier: i.tier, qty: i.qty }), bag);
  assert.equal(canUpgrade(bag, weapon, 9), true);
  assert.equal(canUpgrade(bag, weapon, 7), false, 'Artifact needs areas 8–9');
  assert.equal(coresOfType(bag, CORE_TYPES.Artifact).length, 1);

  const up = upgradeGrade(weapon, core);
  assert.equal(up.rarity, 'Artifact');
  assert.equal(up.tier, 6, 'grade is quality — the tier never changes');
  assert.equal(up.rating, 88);
  assert.equal(up.empower, 37);
  assert.equal(up.name, 'Tidebreaker', 'a weapon keeps its special name through the upgrade');

  const mythic = upgradeGrade(up, makeCore({ tier: 6, rarity: 'Mythic', type: CORE_TYPES.Mythic }));
  assert.equal(mythic.rarity, 'Mythic');
  assert.equal(upgradeRecipe(mythic), null, 'Mythic is the top — nothing upgrades past it');
  assert.equal(upgradeGrade(weapon, makeCore({ tier: 6, rarity: 'Mythic', type: CORE_TYPES.Mythic })), null, 'the wrong core does nothing');
  assert.equal(upgradeGrade(makeItem({ kind: 'armor', type: 'Helm', tier: 1, rarity: 'Epic', rating: 10 }), core), null, 'Epic does not jump to Artifact');
});
