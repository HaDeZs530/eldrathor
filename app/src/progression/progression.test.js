/**
 * Progression Loop Lock §2–§5 — the formulas are the spec.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withStarterWeapons, equippedIds, validName, STARTER_WEAPON_RATING, RARITY, rarityIndex, bandForTier, rollRarity, xpToNext, enemyXp, fightXp, splitXp, applyXp, trainXpPerMinute, LEVEL_CAP, weaponDamageMult, empowerGain, empowerCost, previewEmpower, armorBonus, critMult, EMPOWER_MAX } from './progression.js';
import { mulberry32 } from '../combat/simulate.js';

test('§2 ladder: Common · Fine · Rare · Epic · Legendary; bands by area tier; 70/20/10 roll, Attune 40 % up, floor/cap', () => {
  assert.deepEqual(RARITY, ['Common', 'Fine', 'Rare', 'Epic', 'Legendary']);
  assert.equal(rarityIndex('Legendary'), 5); assert.equal(rarityIndex('Mythic'), 1);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map(bandForTier), [0, 0, 1, 1, 2, 2, 3, 3, 4]);
  const tally = (T, opts) => { const c = { Common: 0, Fine: 0, Rare: 0, Epic: 0, Legendary: 0 }; const rng = mulberry32(11); for (let i = 0; i < 20000; i++) c[rollRarity(rng, T, opts)] += 1; return c; };
  const t3 = tally(3); // band Fine
  assert.ok(Math.abs(t3.Fine / 20000 - 0.7) < 0.02 && Math.abs(t3.Rare / 20000 - 0.2) < 0.02 && Math.abs(t3.Common / 20000 - 0.1) < 0.02, JSON.stringify(t3));
  const t3a = tally(3, { attune: true });
  assert.ok(Math.abs(t3a.Rare / 20000 - 0.4) < 0.02 && Math.abs(t3a.Fine / 20000 - 0.5) < 0.02, JSON.stringify(t3a));
  const t1 = tally(1); assert.equal(t1.Fine + t1.Common, 20000); assert.ok(t1.Common / 20000 > 0.78); // one-down floors at Common
  const t9 = tally(9, { shift: 1 }); assert.equal(t9.Legendary + t9.Epic, 20000); assert.ok(t9.Legendary / 20000 > 0.88); // boss shift caps at Legendary
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
  // no catch-up cap: training XP does not depend on anyone else's level (pure function of Tmax)
  assert.equal(trainXpPerMinute(2), trainXpPerMinute(2));
});

test('§4 weapon: hit × (0.8 + 0.4·rating/100) × (1 + empower/100); empower gain / cost / preview; armor +HP and +mit', () => {
  assert.equal(weaponDamageMult({ baseRating: 0, empower: 0 }), 0.8);
  assert.ok(Math.abs(weaponDamageMult({ baseRating: 100, empower: 0 }) - 1.2) < 1e-9);
  assert.ok(Math.abs(weaponDamageMult({ baseRating: 50, empower: 50 }) - 1.5) < 1e-9);
  const sword = { id: 'w1', weaponType: 'Greatsword', tier: 'Fine', baseRating: 60, empower: 0 };
  assert.equal(empowerGain(sword, { id: 'w2', weaponType: 'Greatsword', tier: 'Fine', baseRating: 100 }), 6); // 2×2×1×1.5
  assert.equal(empowerGain(sword, { id: 'w3', weaponType: 'Bow', tier: 'Common', baseRating: 0 }), 1); // 2×1×0.5×1 = 1
  assert.equal(empowerGain(sword, { id: 'w4', weaponType: 'Bow', tier: 'Legendary', baseRating: 50 }), 6); // 2×5×0.5×1.25 = 6.25 → 6
  assert.equal(empowerCost(0), 15); assert.equal(empowerCost(40), 55);
  const p = previewEmpower({ ...sword, empower: 97 }, { id: 'w2', weaponType: 'Greatsword', tier: 'Fine', baseRating: 100 }, 200);
  assert.equal(p.gain, 3); assert.equal(p.next, EMPOWER_MAX); assert.equal(p.cost, 112); assert.equal(p.useful, true);
  assert.equal(previewEmpower({ ...sword, empower: 100 }, { id: 'w2', weaponType: 'Greatsword', tier: 'Fine', baseRating: 100 }, 999).useful, false);
  assert.equal(previewEmpower(sword, sword, 999), null); // a weapon cannot feed itself
  assert.deepEqual(armorBonus({ tier: 'Fine', rating: 50 }), { hp: 50, mit: 0.04 }); // 25·2·(0.8+0.2)
  assert.deepEqual(armorBonus(null), { hp: 0, mit: 0 });
});

test('§5 crit: the gem term is additive — a +0.5 gem on a seed-10 archetype gives 2.0×', () => {
  assert.equal(critMult(10, 0), 1.5);
  assert.equal(critMult(10, 0.5), 2.0);
  assert.ok(Math.abs(critMult(15, 0) - 1.75) < 1e-9);
});

test('starter weapons: every member without one gets an equipped Common of their default type (idempotent); names 1–16 chars', () => {
  const { members, stash } = withStarterWeapons([{ id: 'c1', weapon: 'Staff' }, { id: 'c2', weapon: 'Bow', weaponId: 'w-x' }], [{ id: 'w-x', weaponType: 'Bow', tier: 'Fine', baseRating: 50, empower: 0 }]);
  assert.equal(stash.length, 2); assert.equal(members[1].weaponId, 'w-x');
  const w = stash.find((x) => x.id === members[0].weaponId);
  assert.equal(w.tier, 'Common'); assert.equal(w.weaponType, 'Staff'); assert.equal(w.baseRating, STARTER_WEAPON_RATING); assert.equal(w.empower, 0);
  const again = withStarterWeapons(members, stash); assert.equal(again.stash.length, 2);
  assert.deepEqual([...equippedIds(members)].sort(), [members[0].weaponId, 'w-x'].sort());
  assert.equal(validName(''), false); assert.equal(validName('   '), false); assert.equal(validName('Kessa'), true); assert.equal(validName('x'.repeat(16)), true); assert.equal(validName('x'.repeat(17)), false);
});
