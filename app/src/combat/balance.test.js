/**
 * Balance gates — docs/Eldrathor_Progression_Loop_Lock.md §8 (M1b). These are ENFORCED: enemy base
 * hp/dmg and the boss multipliers in enemies.js are tuned until both gates pass, and any retune must
 * keep them passing.
 *
 *  Gate A — a fresh party (level 1, Common starter weapons, no armor) LOSES the area-1 boss in
 *           ≥ 8/10 seeds and WINS an area-1 normal fight in ≥ 9/10 seeds.
 *  Gate B — a level-5 party with three Fine weapons (rating ≥ 50, empower ≥ 20) and Fine armor
 *           BEATS the area-1 boss in ≥ 8/10 seeds.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateFight, mulberry32 } from './simulate.js';
import { spawnEnemies } from './enemies.js';
import { equip } from './derive.js';
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

test('§8 gate B: L5 party with three Fine weapons (rating 50, empower 20) and Fine armor beats the area-1 boss ≥ 8/10', () => {
  const bossWins = winRate(L5_FINE_PARTY, 'boss');
  assert.ok(bossWins >= 8, `geared L5 party must beat the area-1 boss in ≥ 8/10 seeds; won ${bossWins}/10`);
});
