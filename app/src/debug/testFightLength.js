/**
 * TEMPORARY test kit (Anthony, 2026-09-20) — Settings → "Test fight length". Not a game system: while it is on,
 * ordinary pack fights (not rares, not bosses) have their enemy health rescaled against the party that is
 * actually fighting so the fight lasts about 16 s (the 14–18 s band being tried). If the longer fight would be
 * lost, enemy damage is eased until it is won. Remove before TestFlight.
 */
import { simulateFight } from '../combat/simulate.js';

export const TEST_FIGHT = { targetSec: 16, minSec: 14, maxSec: 18 };
const KEY = 'eld.testFightLength';
let mem = false;
export function isTestFightLength() { try { return globalThis.localStorage ? globalThis.localStorage.getItem(KEY) === '1' : mem; } catch { return mem; } }
export function setTestFightLength(on) { mem = !!on; try { globalThis.localStorage?.setItem(KEY, on ? '1' : '0'); } catch { /* private window */ } }

const scaled = (enemies, hp, dmg) => enemies.map((e) => ({ ...e, hp: Math.max(1, Math.round(e.hp * hp)), maxHp: Math.max(1, Math.round(e.maxHp * hp)), dmg: e.dmg * dmg }));

/** @returns {{ enemies, hpMult:number, dmgMult:number, sec:number, win:boolean }} the same fight args, enemies rescaled */
export function tuneFightLength({ party, enemies, seed, startHpFrac, runMods, enemyFirst }, target = TEST_FIGHT.targetSec) {
  const run = (hp, dmg) => simulateFight({ party, enemies: scaled(enemies, hp, dmg), seed, startHpFrac, runMods, enemyFirst }).result;
  let dmg = 1, best = null;
  for (let pass = 0; pass < 6; pass++) {
    let lo = Math.log(0.05), hi = Math.log(400);
    for (let i = 0; i < 14; i++) { const k = Math.exp((lo + hi) / 2); const r = run(k, dmg); if (r.win && r.durationMs / 1000 < target) lo = Math.log(k); else hi = Math.log(k); }
    const hp = Math.exp(lo); const r = run(hp, dmg);
    best = { enemies: scaled(enemies, hp, dmg), hpMult: hp, dmgMult: dmg, sec: r.durationMs / 1000, win: r.win };
    if (r.win && best.sec >= TEST_FIGHT.minSec) break;
    dmg *= 0.7; // the party cannot survive that long — ease the hits and try again
  }
  return best;
}
