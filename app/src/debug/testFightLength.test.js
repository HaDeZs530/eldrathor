import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tuneFightLength, TEST_FIGHT } from './testFightLength.js';
import { simulateFight, mulberry32 } from '../combat/simulate.js';
import { spawnEnemies } from '../combat.js';
import { newGame, partyOf } from '../../scripts/sim/progressionSim.mjs';

test('test fight length: a pack fight is rescaled into the 14–18 s band and stays a win', () => {
  const party = partyOf(newGame(1));
  for (const tier of [1, 3, 6]) {
    const enemies = spawnEnemies(tier, 'normal', false, { rng: mulberry32(tier), depthMult: 1 });
    const args = { party, enemies, seed: 42 + tier, startHpFrac: party.map(() => 1), runMods: { dmgMult: 1, mitAdd: 0 } };
    const t = tuneFightLength(args);
    const r = simulateFight({ ...args, enemies: t.enemies.map((e) => ({ ...e })) }).result;
    assert.equal(r.win, true);
    assert.ok(r.durationMs / 1000 >= TEST_FIGHT.minSec && r.durationMs / 1000 <= TEST_FIGHT.maxSec, `tier ${tier}: ${r.durationMs / 1000} s`);
  }
});
