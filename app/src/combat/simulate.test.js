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

test('Results per-member dealt / taken / healed are whole numbers, even when heals clamp at a fractional max HP', () => {
  let healedSomewhere = false;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    for (const nodeType of ['normal', 'rare', 'boss']) {
      const enemies = spawnEnemies(1, nodeType, false, { rng: mulberry32(seed * 13), bossName: 'Boss' });
      // carried-in HP a hair under full: the first Renewal / Mend clamps at max HP and heals a fraction
      const { stats } = simulateFight({ party: LEVEL1_PARTY, enemies, seed, startHpFrac: [0.987, 0.993, 0.971] });
      for (const p of stats.party) {
        for (const k of ['dealt', 'taken', 'healed']) {
          assert.ok(Number.isInteger(p[k]), `seed ${seed} ${nodeType}: ${p.name} ${k} = ${p[k]} must be an integer`);
        }
        if (p.healed > 0) healedSomewhere = true;
      }
    }
  }
  assert.ok(healedSomewhere, 'the sweep must include real healing, or the test proves nothing');
});

test('brief §4: every enemy hit is an event with raw + mit, and each Adventurer\'s "damage taken" equals the sum of the enemy hits on them', () => {
  const enemies = spawnEnemies(1, 'boss', false, { rng: mulberry32(11), bossName: 'Boss' });
  const { events, stats } = simulateFight({ party: LEVEL1_PARTY, enemies, seed: 5 });
  const hits = events.filter((e) => e.enemy && (e.type === 'hit' || e.type === 'crit'));
  assert.ok(hits.length > 3);
  for (const h of hits) {
    assert.ok(typeof h.raw === 'number' && h.raw >= h.amount, 'raw is the pre-mitigation number');
    assert.ok(h.mit >= 0 && h.mit < 1, 'mit is the effective fraction removed');
    assert.ok(Math.abs(Math.round(h.raw * (1 - h.mit)) - h.amount) <= 1, `${h.amount} ≈ ${h.raw} − ${Math.round(h.mit * 100)}%`);
  }
  for (const p of stats.party) {
    const sum = hits.filter((h) => h.target === p.id).reduce((n, h) => n + h.amount, 0);
    assert.equal(p.taken, sum, `${p.name} taken ${p.taken} = feed sum ${sum}`);
  }
  const dealt = events.filter((e) => !e.enemy && (e.type === 'hit' || e.type === 'crit'));
  assert.ok(dealt.every((h) => typeof h.raw === 'number' && typeof h.mit === 'number'), 'party hits carry raw + mit too');
});
