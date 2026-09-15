/**
 * Balance gates — docs/Eldrathor_Progression_Loop_Lock.md §8 (M1b). These are ENFORCED: enemy base
 * hp/dmg and the boss multipliers in enemies.js are tuned until both gates pass, and any retune must
 * keep them passing.
 *
 *  Gate A — a fresh party (level 1, Common starter weapons, no armor) LOSES the area-1 boss in
 *           ≥ 8/10 seeds and WINS an area-1 normal fight in ≥ 9/10 seeds.
 *  Gate B — a level-5 party with three Fine weapons (rating ≥ 50, empower ≥ 20) and Fine armor
 *           BEATS the area-1 boss in ≥ 8/10 seeds, with boss fights lasting 40–90 s (§9).
 *  §9 (2026-09-14) — sustain retuned (Renewal 1 %/3 s, Mend 30 / CD 7 s, Guardian 8 %), boss dmg ×7
 *           (cap ×8: no boss hit outside enrage exceeds 40 % of a level-appropriate Bulwark's max HP);
 *           boss HP raised (never dmg) until gate A passes: ×62.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateFight, mulberry32, SUSTAIN, INNATES } from './simulate.js';
import { spawnEnemies, ENEMY_TUNING } from './enemies.js';
import { equip, deriveStats } from './derive.js';
import { STARTER_WEAPON_RATING } from '../progression/progression.js';

const BASE = [
  { id: 'c1', name: 'Kessa', archetype: 'Bulwark', weapon: 'Sword + Shield' },
  { id: 'c2', name: 'Orin', archetype: 'Warden', weapon: 'Staff' },
  { id: 'c3', name: 'Vayle', archetype: 'Striker', weapon: 'Dual Daggers' },
];
const weapons = (tier, baseRating, empower) => BASE.map((m, i) => ({ id: `w${i}`, tier, weaponType: m.weapon, baseRating, empower }));
const armorFor = (tier, rating) => BASE.map((_, i) => ({ id: `a${i}`, tier, quality: tier, rating }));

export const FRESH_PARTY = BASE.map((m, i) => equip({ ...m, level: 1, xp: 0, weaponId: `w${i}` }, weapons('Common', STARTER_WEAPON_RATING, 0), []));
export const L5_FINE_PARTY = BASE.map((m, i) => equip({ ...m, level: 5, xp: 0, weaponId: `w${i}`, armorId: `a${i}` }, weapons('Fine', 50, 20), armorFor('Fine', 50)));

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export function winRate(party, nodeType, T = 1) {
  let wins = 0;
  for (const seed of SEEDS) {
    const enemies = spawnEnemies(T, nodeType, false, { rng: mulberry32(seed * 7), bossName: 'Boss' });
    const { result } = simulateFight({ party, enemies, seed });
    if (result.win) wins += 1;
  }
  return wins;
}

test('§8 gate A: fresh L1 party (Common starters, no armor) loses the area-1 boss ≥ 8/10 and wins area-1 normal fights ≥ 9/10', () => {
  const bossWins = winRate(FRESH_PARTY, 'boss');
  const normalWins = winRate(FRESH_PARTY, 'normal');
  assert.ok(10 - bossWins >= 8, `fresh party must lose the area-1 boss in ≥ 8/10 seeds; lost ${10 - bossWins}/10`);
  assert.ok(normalWins >= 9, `fresh party must win area-1 normal fights in ≥ 9/10 seeds; won ${normalWins}/10`);
});

test('§8 gate B: L5 party with three Fine weapons (rating 50, empower 20) and Fine armor beats the area-1 boss ≥ 8/10, in 40–90 s (§9)', () => {
  let wins = 0;
  const durations = [];
  for (const seed of SEEDS) {
    const enemies = spawnEnemies(1, 'boss', false, { rng: mulberry32(seed * 7), bossName: 'Boss' });
    const { result } = simulateFight({ party: L5_FINE_PARTY, enemies, seed });
    if (result.win) wins += 1;
    durations.push(result.durationSec);
  }
  assert.ok(wins >= 8, `geared L5 party must beat the area-1 boss in ≥ 8/10 seeds; won ${wins}/10`);
  assert.ok(durations.every((d) => d >= 40 && d <= 90), `boss fights must last 40–90 s; got ${durations.map((d) => d.toFixed(0)).join(', ')}`);
});

test('§9 sustain + boss rows are the retuned numbers: Renewal 1 %/3 s, Mend 30 / CD 7 s, Guardian 8 %; boss hp ×62, dmg ×7, 1.6 s, mit +0.1', () => {
  assert.deepEqual(SUSTAIN, { renewalPct: 0.01, renewalEveryMs: 3000, mendBase: 30, mendCdMs: 7000, guardianPct: 0.08 });
  assert.equal(INNATES.Warden.cd, SUSTAIN.mendCdMs);
  assert.deepEqual(ENEMY_TUNING.boss, { hp: 62, dmg: 7, interval: 1.6, mitAdd: 0.1 });
  assert.ok(ENEMY_TUNING.boss.dmg <= 8, 'boss dmg cap ×8');
  // the retune is live in the resolver: Renewal ticks 1 % on the 3 s grid, Mend heals 30 × scale
  const enemies = spawnEnemies(1, 'boss', false, { rng: mulberry32(7), bossName: 'Boss' });
  const { events } = simulateFight({ party: L5_FINE_PARTY, enemies, seed: 3 });
  const renewal = events.filter((e) => e.type === 'heal' && e.source === 'Renewal');
  assert.ok(renewal.length > 0 && renewal.every((e) => e.t % 3000 === 0), 'Renewal on the 3 s grid');
  const mends = events.filter((e) => e.type === 'innate' && e.name === 'Mend');
  const orin = deriveStats(L5_FINE_PARTY[1]);
  assert.ok(mends.length > 0 && mends.every((e) => e.amount === Math.round(30 * orin.healScale)), `Mend = 30 × heal scale (${mends[0]?.amount})`);
  for (let i = 1; i < mends.length; i++) assert.ok(mends[i].t - mends[i - 1].t >= 7000, 'Mend cooldown 7 s');
});

test('§9 cap: no area-1 boss hit outside enrage exceeds 40 % of a level-appropriate Bulwark max HP (L1 fresh and L5 geared), even unmitigated', () => {
  const enemies = spawnEnemies(1, 'boss', false, { rng: mulberry32(7), bossName: 'Boss' });
  const raw = enemies[0].dmg; // before mitigation — the strictest reading
  for (const party of [FRESH_PARTY, L5_FINE_PARTY]) {
    const bulwark = deriveStats(party[0]);
    assert.ok(raw <= 0.4 * bulwark.maxHp, `boss raw hit ${raw.toFixed(1)} vs 40 % of Bulwark L${bulwark.level} max HP ${bulwark.maxHp} = ${(0.4 * bulwark.maxHp).toFixed(1)}`);
    for (const seed of SEEDS) {
      const { events } = simulateFight({ party, enemies: spawnEnemies(1, 'boss', false, { rng: mulberry32(seed * 7), bossName: 'Boss' }), seed });
      for (const e of events) if (e.enemy && e.type === 'hit' && e.target === 'p0') assert.ok(e.amount <= 0.4 * bulwark.maxHp, `seed ${seed}: boss hit ${e.amount} on the Bulwark`);
    }
  }
});
