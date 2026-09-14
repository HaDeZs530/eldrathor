/**
 * Combat v2 resolver tests — run with `npm test` (Node's built-in test runner, no deps).
 * Cases from docs/CLAUDE_BRIEFS/2026-09-11_combat-v2.md.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateFight, mulberry32 } from './simulate.js';
import { spawnEnemies } from './enemies.js';

import { FRESH_PARTY as LEVEL1_PARTY } from './balance.test.js';

// The §4 trash-band and boss-wall targets are ENFORCED in balance.test.js (Progression Loop Lock §8, M1b).

test('Aegis taunt redirects enemy targeting onto the Bulwark', () => {
  const enemies = spawnEnemies(1, 'rare', false, { rng: mulberry32(3) });
  const { events } = simulateFight({ party: LEVEL1_PARTY, enemies, seed: 42 });
  const aegis = events.find((e) => e.type === 'innate' && e.name === 'Aegis');
  assert.ok(aegis, 'Aegis should fire');
  const during = events.filter((e) => e.enemy && (e.type === 'hit' || e.type === 'crit') && e.t > aegis.t && e.t <= aegis.t + 4000);
  assert.ok(during.length > 0, 'enemy should swing during the taunt window');
  assert.ok(during.every((e) => e.target === 'p0'), 'every enemy hit during Aegis lands on the Bulwark');
});

test('deterministic by seed', () => {
  const enemies = spawnEnemies(2, 'normal', false, { rng: mulberry32(5) });
  const a = simulateFight({ party: LEVEL1_PARTY, enemies, seed: 99 });
  const b = simulateFight({ party: LEVEL1_PARTY, enemies, seed: 99 });
  assert.deepEqual(a.events.map((e) => [e.t, e.type, e.amount]), b.events.map((e) => [e.t, e.type, e.amount]));
});

test('enemyFirst: a failed flee gives enemies a 1.5 s free window before any party swing', () => {
  const enemies = spawnEnemies(1, 'rare', false, { rng: mulberry32(9) });
  const { events } = simulateFight({ party: LEVEL1_PARTY, enemies, seed: 21, enemyFirst: true });
  const firstPartySwing = events.find((e) => e.type === 'swing');
  const firstEnemyHit = events.find((e) => e.enemy && (e.type === 'hit' || e.type === 'crit'));
  assert.ok(firstPartySwing && firstPartySwing.t >= 1500, `party first swing at ${firstPartySwing?.t}ms should be >= 1500`);
  assert.ok(firstEnemyHit && firstEnemyHit.t < firstPartySwing.t, 'enemies land a hit before the party swings');
  const normal = simulateFight({ party: LEVEL1_PARTY, enemies, seed: 21 });
  assert.ok(normal.events.find((e) => e.type === 'swing').t < 1500, 'without the flag the party swings before 1.5 s');
});
