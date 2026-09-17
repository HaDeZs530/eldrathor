/**
 * Progression Loop Lock §2–§5 — the formulas are the spec.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withStarterWeapons, equippedIds, validName, STARTER_WEAPON_RATING, RARITY, rarityIndex, xpToNext, enemyXp, fightXp, splitXp, applyXp, applyTrainXp, rosterCap, canTrain, TRAIN_CAP_MESSAGE, trainXpPerMinute, LEVEL_CAP, weaponDamageMult, empowerGain, empowerCost, previewEmpower, armorBonus, critMult, EMPOWER_MAX } from './progression.js';
import { makeItem } from './items.js';

const weapon = (o) => makeItem({ kind: 'weapon', type: 'Greatsword', tier: 1, rarity: 'Common', rating: 1, empower: 0, ...o });

test('the seven-rung ladder is re-exported under the old `RARITY` name (Item Model §1 supersedes the five rungs)', () => {
  assert.deepEqual(RARITY, ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Artifact', 'Mythic']);
  assert.equal(rarityIndex('Legendary'), 5);
  assert.equal(rarityIndex('Artifact'), 6);
  assert.equal(rarityIndex('Mythic'), 7);
  assert.equal(rarityIndex('Fine'), 1, 'the retired rung falls back to Common');
});

test('§3 XP: enemy 12×1.5^(T−1), rare ×3, boss ×8; even split with the dead at half; xpToNext 100×1.35^(L−1); cap 50; train 6×1.5^(Tmax−1)/min', () => {
  assert.equal(enemyXp(1), 12); assert.equal(enemyXp(2), 18); assert.equal(enemyXp(1, { isRare: true }), 36); assert.equal(enemyXp(1, { isBoss: true }), 96);
  assert.equal(fightXp([{}, {}, { isRare: true }], 1), 60);
  assert.deepEqual(splitXp(60, [{}, {}, {}], [1, 0, 0.4]), [20, 10, 20]);
  assert.equal(xpToNext(1), 100); assert.equal(xpToNext(2), 135); assert.equal(xpToNext(5), Math.round(100 * 1.35 ** 4));
  const a = applyXp({ level: 1, xp: 90 }, 20); assert.equal(a.member.level, 2); assert.equal(a.member.xp, 10); assert.equal(a.levelsGained, 1);
  const b = applyXp({ level: 1, xp: 0 }, 100 + 135 + 5); assert.equal(b.member.level, 3); assert.equal(b.member.xp, 5); assert.equal(b.levelsGained, 2);
  const c = applyXp({ level: LEVEL_CAP - 1, xp: 0 }, 1e9); assert.equal(c.member.level, LEVEL_CAP); assert.equal(c.member.xp, 0);
  assert.equal(trainXpPerMinute(1), 6); assert.equal(trainXpPerMinute(3), 13.5);
});

test('§7 (Item Model): Train raises an Adventurer only to the highest roster level, clamping a long offline span', () => {
  const party = [{ level: 3 }, { level: 7 }, { level: 2 }];
  assert.equal(rosterCap(party), 7);
  assert.equal(rosterCap([]), 1);
  assert.equal(canTrain({ level: 6 }, party), true);
  assert.equal(canTrain({ level: 7 }, party), false);
  // one reconcile of a huge span stops exactly at the ceiling, leftover XP dropped
  const big = applyTrainXp({ level: 1, xp: 0 }, 1e9, 7);
  assert.equal(big.member.level, 7);
  assert.equal(big.member.xp, 0);
  assert.equal(big.capped, true);
  // below the ceiling it behaves like ordinary XP
  const small = applyTrainXp({ level: 1, xp: 90 }, 20, 7);
  assert.deepEqual([small.member.level, small.member.xp, small.capped], [2, 10, false]);
  // already at the ceiling: untouched
  const at = applyTrainXp({ level: 7, xp: 5 }, 1e9, 7);
  assert.equal(at.member.level, 7);
  assert.equal(at.member.xp, 5);
  assert.equal(at.capped, true);
  assert.equal(TRAIN_CAP_MESSAGE, 'At roster cap — climb the mountain');
});

test('§4 weapon: hit × (0.8 + 0.4·rating/100) × (1 + empower/100); empower gain / cost / preview; armor +HP and +mit', () => {
  // at T1 Common both new axes are ×1, so the rating / empower halves read exactly as they always did
  assert.equal(weaponDamageMult(weapon({ rating: 1 })), 0.804);
  assert.ok(Math.abs(weaponDamageMult(weapon({ rating: 100 })) - 1.2) < 1e-9);
  assert.ok(Math.abs(weaponDamageMult(weapon({ rating: 50, empower: 50 })) - 1.5) < 1e-9);
  const sword = weapon({ id: 'w1', rarity: 'Uncommon', rating: 60 });
  assert.equal(empowerGain(sword, weapon({ id: 'w2', rarity: 'Uncommon', rating: 100 })), 6); // 2×2×1×1.5
  assert.equal(empowerGain(sword, weapon({ id: 'w3', type: 'Bow', rarity: 'Common', rating: 1 })), 1); // 2×1×0.5×1 = 1
  assert.equal(empowerGain(sword, weapon({ id: 'w4', type: 'Bow', rarity: 'Legendary', rating: 50 })), 6); // 2×5×0.5×1.25 → 6
  assert.equal(empowerGain(sword, weapon({ id: 'w5', type: 'Bow', rarity: 'Mythic', rating: 50 })), 9); // the new top rung: 2×7×0.5×1.25 → 9
  assert.equal(empowerCost(0), 15); assert.equal(empowerCost(40), 55);
  const p = previewEmpower({ ...sword, empower: 97 }, weapon({ id: 'w2', rarity: 'Uncommon', rating: 100 }), 200);
  assert.equal(p.gain, 3); assert.equal(p.next, EMPOWER_MAX); assert.equal(p.cost, 112); assert.equal(p.useful, true);
  assert.equal(previewEmpower({ ...sword, empower: 100 }, weapon({ id: 'w2', rarity: 'Uncommon', rating: 100 }), 999).useful, false);
  assert.equal(previewEmpower(sword, sword, 999), null); // a weapon cannot feed itself
  // armor: a T1 Uncommon Cuirass at rating 50 is 25 × 1.08 × 1.0 HP and 0.02 × 1.08 mitigation
  const cuirass = makeItem({ kind: 'armor', type: 'Cuirass', tier: 1, rarity: 'Uncommon', rating: 50 });
  assert.equal(Math.round(armorBonus(cuirass).hp), 27);
  assert.ok(Math.abs(armorBonus(cuirass).mit - 0.0216) < 1e-9);
  assert.deepEqual(armorBonus(null), { hp: 0, mit: 0 });
});

test('§5 crit: the gem term is additive — a +0.5 gem on a seed-10 archetype gives 2.0×', () => {
  assert.equal(critMult(10, 0), 1.5);
  assert.equal(critMult(10, 0.5), 2.0);
  assert.ok(Math.abs(critMult(15, 0) - 1.75) < 1e-9);
});

test('starter weapons: every member without one gets an equipped Common of their default type (idempotent); names 1–16 chars', () => {
  const existing = weapon({ id: 'w-x', type: 'Bow', rarity: 'Uncommon', rating: 50 });
  const { members, bag } = withStarterWeapons([{ id: 'c1', weapon: 'Staff' }, { id: 'c2', weapon: 'Bow', equipped: { weapon: 'w-x' } }], [existing]);
  assert.equal(bag.length, 2); assert.equal(members[1].equipped.weapon, 'w-x');
  const w = bag.find((x) => x.id === members[0].equipped.weapon);
  assert.equal(w.rarity, 'Common'); assert.equal(w.tier, 1); assert.equal(w.type, 'Staff'); assert.equal(w.rating, STARTER_WEAPON_RATING); assert.equal(w.empower, 0);
  const again = withStarterWeapons(members, bag); assert.equal(again.bag.length, 2);
  // §6: equippedIds spans all six slots, not just weapon + body
  const sixSlot = [{ equipped: { weapon: 'w1', body: 'a1', head: 'a2', hands: 'a3', feet: 'a4', gem: 'g1' } }];
  assert.deepEqual([...equippedIds(sixSlot)].sort(), ['a1', 'a2', 'a3', 'a4', 'g1', 'w1']);
  assert.deepEqual([...equippedIds(members)].sort(), [members[0].equipped.weapon, 'w-x'].sort());
  assert.equal(validName(''), false); assert.equal(validName('   '), false); assert.equal(validName('Kessa'), true); assert.equal(validName('x'.repeat(16)), true); assert.equal(validName('x'.repeat(17)), false);
});
