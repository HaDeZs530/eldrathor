/** The temporary test kit (Settings → Grant test gems): every party member ends up wearing a gem, the bag holds all four classes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grantTestGems, testGemClassFor, TEST_KIT } from './testKit.js';
import { GEM_CLASSES } from '../lattice/classGems.js';
import { isMatching } from '../progression/gems.js';

const party = [
  { id: 'c1', name: 'Kessa', archetype: 'Bulwark', equipped: { weapon: 'w1' } },
  { id: 'c2', name: 'Orin', archetype: 'Warden', equipped: {} },
  { id: 'c3', name: 'Vayle', archetype: 'Striker' },
];

test('grant test gems: a gem on every party member (two matching, one crossing), one spare of every class in the bag, fragments + Worldvein to spend', () => {
  const r = grantTestGems({ party, bag: [{ id: 'w1', kind: 'weapon' }], worldvein: 80 });
  const gems = r.bag.filter((i) => i.kind === 'gem');
  assert.equal(gems.length, 3 + 4);
  for (const m of r.party) { const g = r.bag.find((i) => i.id === m.equipped.gem); assert.ok(g && g.kind === 'gem', `${m.name} wears a gem`); }
  assert.equal(r.party[0].equipped.weapon, 'w1', 'other slots are untouched');
  assert.deepEqual(r.party.map((m) => isMatching(m.archetype, r.bag.find((i) => i.id === m.equipped.gem).gemClass)), [true, true, false]);
  assert.deepEqual(r.equipped, [{ name: 'Kessa', gem: 'Tank Gem' }, { name: 'Orin', gem: 'Healer Gem' }, { name: 'Vayle', gem: 'Controller Gem' }]);
  const worn = new Set(r.party.map((m) => m.equipped.gem));
  assert.deepEqual(gems.filter((g) => !worn.has(g.id)).map((g) => g.gemClass), GEM_CLASSES, 'one spare of every class');
  assert.ok(gems.every((g) => g.fragments.unspent === TEST_KIT.fragments && g.lattice.imbues === 0));
  assert.equal(r.worldvein, 80 + TEST_KIT.worldvein);
  assert.equal(new Set(gems.map((g) => g.id)).size, gems.length, 'unique ids');
});

test('grant test gems: a member who already wears a gem keeps it; pressing twice only adds spares', () => {
  const once = grantTestGems({ party, bag: [], worldvein: 0 });
  const twice = grantTestGems({ party: once.party, bag: once.bag, worldvein: once.worldvein });
  assert.deepEqual(twice.party.map((m) => m.equipped.gem), once.party.map((m) => m.equipped.gem));
  assert.equal(twice.equipped.length, 0);
  assert.equal(twice.bag.filter((i) => i.kind === 'gem').length, 7 + 4);
  assert.equal(testGemClassFor({ archetype: 'Resonator' }, 0), 'Controller', 'a Resonator has no matching class — it crosses');
});
