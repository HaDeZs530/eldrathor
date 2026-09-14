import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveStats, equip } from './derive.js';

const kessa = { id: 'c1', archetype: 'Bulwark', weapon: 'Sword + Shield', level: 1 };

test('§5 crit fix in deriveStats: +0.5 gem crit damage on a seed-10 archetype → 2.0× (was 1.5× under the multiplicative bug)', () => {
  assert.equal(deriveStats(kessa).critMult, 1.5);
  assert.equal(deriveStats({ ...kessa, gems: { critDamage: 0.5 } }).critMult, 2.0);
});

test('§4 equipment applies: weapon item scales hit damage by rating/empower and sets the type; armor adds HP and mitigation (cap 0.6); unarmed = ×0.8', () => {
  const bare = deriveStats(kessa);
  const armed = deriveStats(equip({ ...kessa, weaponId: 'w1' }, [{ id: 'w1', weaponType: 'Greatsword', tier: 'Fine', baseRating: 50, empower: 50 }]));
  assert.equal(armed.weaponType, 'Greatsword');
  assert.ok(Math.abs(armed.weaponMult - 1.5) < 1e-9);
  // Greatsword dmg 22 vs Sword+Shield 12; Bulwark power 10 → 22 × 1.5 vs 12 × 0.8
  assert.ok(Math.abs(armed.hitDamage - 22 * 1.5) < 1e-9);
  assert.ok(Math.abs(bare.hitDamage - 12 * 0.8) < 1e-9);
  const armored = deriveStats(equip({ ...kessa, armorId: 'a1' }, [], [{ id: 'a1', tier: 'Fine', rating: 50 }]));
  assert.equal(armored.maxHp, bare.maxHp + 50);
  assert.ok(Math.abs(armored.mitigation - (bare.mitigation + 0.04)) < 1e-9);
  const capped = deriveStats(equip({ ...kessa, armorId: 'a2' }, [], [{ id: 'a2', tier: 'Legendary', rating: 100 }]));
  assert.ok(capped.mitigation <= 0.6);
  // a missing item id degrades gracefully to unarmed / unarmored
  const gone = deriveStats(equip({ ...kessa, weaponId: 'nope', armorId: 'nope' }, [], []));
  assert.equal(gone.hitDamage, bare.hitDamage); assert.equal(gone.maxHp, bare.maxHp);
});
