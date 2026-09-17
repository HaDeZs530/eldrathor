import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveStats, equip } from './derive.js';
import { makeItem } from '../progression/items.js';

const kessa = { id: 'c1', archetype: 'Bulwark', weapon: 'Sword + Shield', level: 1 };

test('§5 crit fix in deriveStats: +0.5 gem crit damage on a seed-10 archetype → 2.0× (was 1.5× under the multiplicative bug)', () => {
  assert.equal(deriveStats(kessa).critMult, 1.5);
  assert.equal(deriveStats({ ...kessa, gems: { critDamage: 0.5 } }).critMult, 2.0);
});

test('§4 equipment applies through the six-slot map: the weapon scales hit damage and sets the type; every armor piece adds HP and mitigation (cap 0.6); unarmed = ×0.8', () => {
  const bare = deriveStats(kessa);
  const gs = makeItem({ id: 'w1', kind: 'weapon', type: 'Greatsword', tier: 1, rarity: 'Common', rating: 50, empower: 50 });
  const armed = deriveStats(equip({ ...kessa, equipped: { weapon: 'w1' } }, [gs]));
  assert.equal(armed.weaponType, 'Greatsword');
  assert.ok(Math.abs(armed.weaponMult - 1.5) < 1e-9); // T1 Common: (0.8 + 0.2) × 1.5
  // Greatsword dmg 22 vs Sword+Shield 12; Bulwark power 10 → 22 × 1.5 vs 12 × 0.8
  assert.ok(Math.abs(armed.hitDamage - 22 * 1.5) < 1e-9);
  assert.ok(Math.abs(bare.hitDamage - 12 * 0.8) < 1e-9);

  const cuirass = makeItem({ id: 'a1', kind: 'armor', type: 'Cuirass', tier: 1, rarity: 'Common', rating: 50 });
  const armored = deriveStats(equip({ ...kessa, equipped: { body: 'a1' } }, [cuirass]));
  assert.equal(armored.maxHp, bare.maxHp + 25); // 25 × 1.0 × 1.0 × (0.8 + 0.2)
  assert.ok(Math.abs(armored.mitigation - (bare.mitigation + 0.02)) < 1e-9);

  // §2: head / hands / feet give HALF the body values, and every worn piece stacks
  const helm = makeItem({ id: 'a2', kind: 'armor', type: 'Helm', tier: 1, rarity: 'Common', rating: 50 });
  const half = deriveStats(equip({ ...kessa, equipped: { head: 'a2' } }, [helm]));
  assert.equal(half.maxHp, bare.maxHp + 12.5);
  const full = deriveStats(equip({ ...kessa, equipped: { body: 'a1', head: 'a2' } }, [cuirass, helm]));
  assert.equal(full.maxHp, bare.maxHp + 37.5);

  // the mitigation cap still holds with a full Mythic set at T7
  const set = ['Cuirass', 'Helm', 'Gauntlets', 'Greaves'].map((type, i) => makeItem({ id: `m${i}`, kind: 'armor', type, tier: 7, rarity: 'Mythic', rating: 100 }));
  const capped = deriveStats(equip({ ...kessa, equipped: { body: 'm0', head: 'm1', hands: 'm2', feet: 'm3' } }, set));
  assert.ok(capped.mitigation <= 0.6);

  // a missing item id degrades gracefully to unarmed / unarmored
  const gone = deriveStats(equip({ ...kessa, equipped: { weapon: 'nope', body: 'nope' } }, []));
  assert.equal(gone.hitDamage, bare.hitDamage); assert.equal(gone.maxHp, bare.maxHp);
});

test('Item Model §1: tier dominates rarity — a T5 Common weapon beats a T1 Artifact of the same type', () => {
  const t5 = makeItem({ id: 'a', kind: 'weapon', type: 'Greatsword', tier: 5, rarity: 'Common', rating: 1 });
  const t1 = makeItem({ id: 'b', kind: 'weapon', type: 'Greatsword', tier: 1, rarity: 'Artifact', rating: 100 });
  const hi = deriveStats(equip({ ...kessa, equipped: { weapon: 'a' } }, [t5]));
  const lo = deriveStats(equip({ ...kessa, equipped: { weapon: 'b' } }, [t1]));
  assert.ok(hi.hitDamage > lo.hitDamage, `T5 Common ${hi.hitDamage} should beat T1 Artifact ${lo.hitDamage}`);
});
