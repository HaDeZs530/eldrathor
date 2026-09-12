/**
 * Combat v2 resolver tests — run with `npm test` (Node's built-in test runner, no deps).
 * Cases from docs/CLAUDE_BRIEFS/2026-09-11_combat-v2.md.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateFight, mulberry32 } from './simulate.js';
import { spawnEnemies } from './enemies.js';

const LEVEL1_PARTY = [
  { name: 'Kessa', archetype: 'Bulwark', weapon: 'Sword + Shield', level: 1 },
  { name: 'Orin', archetype: 'Warden', weapon: 'Staff', level: 1 },
  { name: 'Vayle', archetype: 'Striker', weapon: 'Dual Daggers', level: 1 },
];

// TODO (design): under the spec's exact §4 numbers W1 trash lasts ~2 s and the W1 boss dies
// in ~24 s at full HP — see PR notes. These two encode the spec's TARGETS and stay `todo`
// until the Design Chat re-tunes the 1.6^(T−1) hp base / dmg base.
test('W1 trash: a level-1 party wins in the 10–20 s target band (across seeds)', { todo: 'spec §4 numbers: fights end in ~2 s' }, () => {
  let wins = 0;
  const durations = [];
  for (let seed = 1; seed <= 25; seed++) {
    const enemies = spawnEnemies(1, 'normal', false, { rng: mulberry32(seed * 7) });
    const { result } = simulateFight({ party: LEVEL1_PARTY, enemies, seed });
    if (result.win) wins += 1;
    durations.push(result.durationMs / 1000);
  }
  assert.equal(wins, 25, 'level-1 party must clear W1 trash reliably');
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  assert.ok(avg >= 5 && avg <= 30, `average trash fight ${avg.toFixed(1)}s should sit near the 10–20 s target`);
});

test('W1 boss: a fresh level-1 party wipes (the gear wall exists)', { todo: 'spec §4 numbers: party wins at full HP' }, () => {
  let wipes = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const enemies = spawnEnemies(1, 'boss', false, { bossName: 'The Gorewood Stag' });
    const { result, events } = simulateFight({ party: LEVEL1_PARTY, enemies, seed });
    if (!result.win) wipes += 1;
    assert.equal(events[events.length - 1].type, result.win ? 'victory' : 'wipe');
  }
  assert.ok(wipes >= 8, `expected the W1 boss to wipe a level-1 party in most seeds, got ${wipes}/10 wipes`);
});

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
