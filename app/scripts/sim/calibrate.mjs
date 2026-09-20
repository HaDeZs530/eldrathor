/**
 * Calibration — finds, area by area, the numbers that make the mountain play to Anthony's rulings
 * (2026-09-19). Nothing on disk changes: the result is a PROPOSAL for a ruling.
 *
 *   ten walls · ~210 h on the efficient route · areas equal, the first three ~20 % shorter
 *   a pack fight is watchable and costs a mid-geared party some life · healing is minimal
 *   XP paces the levels · every boss is a wall that the area's own grind breaks
 *
 * For each area, in order, from the state the party actually arrives in:
 *   1. PACKS  — scale hp and dmg until an arriving party's pack fight lasts ~TARGET.packSec and costs ~TARGET.packLoss
 *   2. XP     — measure XP/hour there, then price the levels so the party reaches the area's level target in its hours
 *   3. BOSS   — search the boss multiplier until the area takes its target hours (median of a few seeds)
 *   then actually play the area and carry the state forward.
 * `node scripts/sim/calibrate.mjs [outDir] [totalHours]`
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { newGame, advance, snapshot, cleared, partyOf, enemiesFor, estimate, playCampaign, summarize, POLICIES, areasFor, ASSUMPTIONS } from './progressionSim.mjs';
import { simulateFight, mulberry32 } from '../../src/combat/simulate.js';

const OUT = process.argv[2] || '../docs/balance/proposal';
const TOTAL_HOURS = Number(process.argv[3] || 210);
const WALLS = 10;
// packs are tuned against the ARRIVING party; gear inside one item tier roughly triples damage over the area, so arrival is
// set at about twice the mid-area fight that is wanted (~10 s, ~12 % of party health)
const TARGET = { packSec: 22, packLoss: 0.26, midSec: 10, midLoss: 0.12, healShare: 0.33, levelPerArea: 4.5, levelPower: 0.10, firstVisitBossWin: 0.1 };
const SEARCH_SEEDS = [11, 23, 37]; const SEARCH_STEPS = Number(process.env.CAL_STEPS || 7);
const MAX_AREA = Number(process.env.CAL_MAX_AREA || 10);
mkdirSync(OUT, { recursive: true });

const unit = TOTAL_HOURS / (3 * 0.8 + (WALLS - 3));
const hoursFor = (id) => +(id <= 3 ? unit * 0.8 : unit).toFixed(1);
const AREAS = areasFor(WALLS); const P = POLICIES.efficient;
const avg = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) / 2)];
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/** Arriving party vs this area's packs: average fight length, life lost, and the share of damage healed back. */
function measurePacks(S, area, tuning, n = 24) {
  const party = partyOf(S, tuning); const durs = []; const losses = []; const shares = []; let wins = 0;
  for (let i = 0; i < n; i++) {
    const enemies = enemiesFor(area, i % 4 === 0 ? 'crystal' : 'normal', { rng: mulberry32(1000 + i), depth01: 0.5 }, tuning);
    const r = simulateFight({ party, enemies, seed: 5000 + i, startHpFrac: party.map(() => 1) });
    durs.push(r.result.durationMs / 1000); losses.push(1 - avg(r.result.partyHpFrac)); wins += r.result.win ? 1 : 0;
    const taken = r.stats.party.reduce((k, p) => k + p.taken, 0); shares.push(taken > 0 ? r.stats.party.reduce((k, p) => k + p.healed, 0) / taken : 0);
  }
  return { sec: avg(durs), loss: avg(losses), healShare: avg(shares), winRate: wins / n };
}
function tunePacks(S, area, tuning) {
  let m = tuning.pack[area.id] || { hp: 1, dmg: 1 };
  for (let k = 0; k < 10; k++) {
    tuning.pack[area.id] = m; const r = measurePacks(S, area, tuning);
    const hp = Math.min(3, Math.max(0.33, (TARGET.packSec / Math.max(0.3, r.sec)) ** 0.9));
    const dmg = r.winRate < 0.9 ? 0.6 : Math.min(2.5, Math.max(0.4, (TARGET.packLoss / Math.max(0.01, r.loss)) ** 0.8));
    m = { hp: m.hp * hp, dmg: m.dmg * dmg };
    if (Math.abs(hp - 1) < 0.04 && Math.abs(dmg - 1) < 0.06) break;
  }
  tuning.pack[area.id] = { hp: +m.hp.toFixed(3), dmg: +m.dmg.toFixed(3) };
  return measurePacks(S, area, tuning);
}
/** Per-member XP per play hour in this area, with levels frozen and the boss out of reach. */
function measureXpPerHour(S, area, tuning) {
  const T = { ...tuning, boss: { ...tuning.boss, [area.id]: { hp: 1e9, dmg: 1 } }, xp: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [i, 1e15])) };
  const C = snapshot(S); const x0 = C.stats.xpEarned; const t0 = C.playSec;
  advance(C, P, T, { until: () => false, maxHours: 1.5 });
  return (C.stats.xpEarned - x0) / ((C.playSec - t0) / 3600) / C.party.length;
}
function hoursToClear(S, area, tuning, seed, capHours) {
  const C = snapshot(S); C.rs = (C.rs ^ Math.imul(seed, 0x9e3779b1)) | 0; const t0 = C.playSec;
  advance(C, P, tuning, { until: (s) => cleared(s, area.id), maxHours: capHours });
  return { hours: (C.playSec - t0) / 3600, done: cleared(C, area.id) };
}
const bossMult = (k) => ({ hp: +k.toFixed(4), dmg: +Math.sqrt(k).toFixed(4) }); // walls are health and time, never one-shots

// ------------------------------------------------------------------ calibrate
const tuning = { walls: WALLS, pack: {}, boss: {}, heal: 1, xp: {}, gems: false, levelPower: TARGET.levelPower };
const S = newGame(7); const rows = [];
// healing: the largest sustain that still leaves a pack fight healing back ≤ a third of what it takes
for (const h of [1, 0.7, 0.5, 0.35, 0.25]) { tuning.heal = h; const probe = { ...tuning, pack: {} }; const C = snapshot(S); advance(C, P, probe, { until: () => true }); const r = tunePacks(C, AREAS[0], probe); if (r.healShare <= TARGET.healShare || h === 0.25) { log(`healing ×${h}: a pack fight heals back ${(r.healShare * 100).toFixed(0)} % of what it takes`); break; } }
advance(S, P, tuning, { until: () => true }); // the first town visit

for (const area of AREAS.filter((a) => a.id <= MAX_AREA)) {
  const hoursTarget = hoursFor(area.id); const t0 = S.playSec; const lvIn = avg(S.party.map((m) => m.level));
  const packs = tunePacks(S, area, tuning);
  log(`  area ${area.id} packs ×${tuning.pack[area.id].hp} hp ×${tuning.pack[area.id].dmg} dmg → on arrival ${packs.sec.toFixed(1)} s, −${(packs.loss * 100).toFixed(0)} %, heals back ${(packs.healShare * 100).toFixed(0)} %`);
  // XP: reach the area's level target a little before its hours are up
  const levelTarget = Math.round(TARGET.levelPerArea * area.id); const steps = Math.max(1, levelTarget - Math.floor(lvIn));
  const xph = measureXpPerHour(S, area, tuning); const per = Math.round((xph * hoursTarget) / steps);
  for (let L = Math.floor(lvIn); L < levelTarget; L++) tuning.xp[L] = per;
  // past the area's level target each level costs 25 % more than the last — more grinding always helps, a little less each time — until the next area re-prices its own band
  for (let L = Math.max(levelTarget, Math.floor(lvIn)); L < 60; L++) tuning.xp[L] = Math.round(per * 1.25 ** (L - levelTarget + 1));
  // boss: binary search in log space
  let lo = Math.log(0.02), hi = Math.log(3000); let best = null;
  for (let s = 0; s < SEARCH_STEPS; s++) {
    const k = Math.exp((lo + hi) / 2); tuning.boss[area.id] = bossMult(k);
    const runs = SEARCH_SEEDS.map((seed) => hoursToClear(S, area, tuning, seed, hoursTarget * 2));
    const h = med(runs.map((r) => (r.done ? r.hours : hoursTarget * 2)));
    if (!best || Math.abs(h - hoursTarget) < Math.abs(best.h - hoursTarget)) best = { k, h };
    if (h > hoursTarget) hi = Math.log(k); else lo = Math.log(k);
    log(`  area ${area.id} boss ×${k.toFixed(2)} → ${h.toFixed(1)} h (target ${hoursTarget})`);
  }
  tuning.boss[area.id] = bossMult(best.k);
  const firstVisit = estimate(partyOf(S, tuning), enemiesFor(area, 'boss', { rng: mulberry32(3) }, tuning), S.party.map(() => 1), { dmgMult: 1, mitAdd: 0 }, 99, 20);
  advance(S, P, tuning, { until: (s) => cleared(s, area.id), maxHours: hoursTarget * 2 });
  const forced = !cleared(S, area.id); if (forced) S.unlocked = Math.max(S.unlocked, area.id + 1); // keep calibrating the later walls from a plausible state
  const A = S.stats.areas[area.id];
  rows.push({ area: area.id, name: area.name, hoursTarget, hours: +((S.playSec - t0) / 3600).toFixed(1), searchHours: +best.h.toFixed(1), done: cleared(S, area.id), pack: tuning.pack[area.id], boss: tuning.boss[area.id], arrive: { sec: +packs.sec.toFixed(1), loss: +packs.loss.toFixed(3), healShare: +packs.healShare.toFixed(2) }, played: { packSec: +(A.packSec / Math.max(1, A.packFights)).toFixed(1), packLoss: +(A.packLoss / Math.max(1, A.packFights)).toFixed(3), healShare: +(A.packHealShare / Math.max(1, A.packFights)).toFixed(2), bossSec: +(A.bossSec / Math.max(1, A.bossFights)).toFixed(0) }, runs: A.runs, fights: A.fights, wipes: A.wipes, extracts: A.extracts, sanctuaries: A.sanctuaries, bossAttempts: A.bossAttempts, firstVisitBossWin: firstVisit, levelIn: +lvIn.toFixed(1), levelOut: +(A.levelOnClear ?? avg(S.party.map((m) => m.level))).toFixed(1), levelTarget, xpPerLevel: per, xpPerHour: Math.round(xph), weapons: A.weaponOnClear, armor: A.armorOnClear, power: A.powerOnClear, day: S.day });
  log(`AREA ${area.id} ${area.name}: ${rows.at(-1).hours} h (target ${hoursTarget}) · packs ${rows.at(-1).played.packSec}s / −${(rows.at(-1).played.packLoss * 100).toFixed(0)} % · boss ×${best.k.toFixed(2)} · L${rows.at(-1).levelIn}→${rows.at(-1).levelOut} · day ${S.day}`);
  if (forced) log('  not cleared inside 2× its hours on this seed — moved on so the later walls can still be calibrated');
}
const main = summarize(S, P, tuning);

// ------------------------------------------------------------------ validate the whole proposal on fresh seeds and other play styles
const validation = {};
for (const [policy, seeds] of Object.entries(process.env.CAL_SKIP_VALIDATE ? {} : { efficient: [1, 2, 3], typical: [1], casual: [1] })) {
  validation[policy] = seeds.map((seed) => { const r = playCampaign({ seed, policy, tuning, maxHours: TOTAL_HOURS * 4 }); log(`validate ${policy} seed ${seed}: ${r.done ? 'cleared' : `stopped at wall ${r.unlocked}`} · ${r.playHours} h · day ${r.days}`); return { seed, done: r.done, playHours: r.playHours, days: r.days, unlocked: r.unlocked, wipes: r.stats.wipes, runs: r.stats.runs, perArea: Object.fromEntries(Object.values(r.stats.areas).map((a) => [a.area, +a.playHours.toFixed(1)])), level: r.party.map((p) => p.level) }; });
}
writeFileSync(join(OUT, 'proposal.json'), JSON.stringify({ generated: new Date().toISOString(), target: { totalHours: TOTAL_HOURS, walls: WALLS, ...TARGET }, tuning, rows, main: { playHours: main.playHours, days: main.days, worldvein: main.worldvein, veinEarned: main.stats.veinEarned, veinSpent: main.stats.veinSpent, rank: main.rank, party: main.party }, validation }, null, 1));

// ------------------------------------------------------------------ the report
const f1 = (n) => (n == null ? '—' : Number(n).toFixed(1)); const pct = (n) => `${Math.round(n * 100)} %`;
const L = [];
L.push('# Tuning proposal — ten walls, ~210 hours, measured by the simulator', '');
L.push(`*Generated ${new Date().toISOString().slice(0, 10)} by \`app/scripts/sim/calibrate.mjs\`. **Nothing in the game has been changed.** These are the multipliers, on top of today's formulas, that make the mountain play to the rulings below. They are a proposal for Anthony and the Design Chat to rule on.*`, '');
L.push('## The rulings this was tuned to (Anthony, 2026-09-19)', '');
L.push(`- **Ten walls**: the nine area bosses, then the dragon above the King. Every boss is a wall.`, `- **~${TOTAL_HOURS} hours** on the efficient route. Areas take equal time; the first three about 20 % less: **${hoursFor(1)} h** each for areas 1–3, **${hoursFor(4)} h** each for areas 4–10.`, `- A pack fight is **watchable (aim ~${TARGET.midSec} s mid-area; ~${TARGET.packSec} s on arrival)** and **costs life (aim ~${pct(TARGET.midLoss)} mid-area; ~${pct(TARGET.packLoss)} on arrival)**; **healing is minimal** (a fight heals back no more than about a third of what it takes), so sanctuaries pace a run.`, `- **XP paces the levels**: about ${TARGET.levelPerArea} levels per area, so the party meets the dragon near level ${Math.round(TARGET.levelPerArea * WALLS)}. **A level is worth +${Math.round(TARGET.levelPower * 100)} % compounding in this proposal** (today: +5 % of base, which is under 2 % late on — too little for XP to pace a wall).`, '- Zones are **ground repeatedly**; that is the game.', '- Gems are **off** for this test (acquisition is being redesigned around shards).', '');
L.push('## 1. Result, area by area (the calibration playthrough, efficient route)', '');
L.push('| Wall | Target h | Played h | Day cleared | Runs | Wipes | Boss tries | Boss won on first visit | Level in → out (target) |', '|---|---|---|---|---|---|---|---|---|');
for (const r of rows) L.push(`| ${r.area} ${r.name} | ${r.hoursTarget} | ${r.hours}${r.done ? '' : ' (not cleared)'} | ${r.day} | ${r.runs} | ${r.wipes} | ${r.bossAttempts} | ${pct(r.firstVisitBossWin)} | ${r.levelIn} → ${r.levelOut} (${r.levelTarget}) |`);
L.push(`| **Total** | **${TOTAL_HOURS}** | **${f1(rows.reduce((n, r) => n + r.hours, 0))}** | day ${rows.at(-1).day} | ${rows.reduce((n, r) => n + r.runs, 0)} | ${rows.reduce((n, r) => n + r.wipes, 0)} | | | |`, '');
L.push('## 2. What a fight feels like', '');
L.push('| Wall | Pack fight on arrival | Life lost on arrival | Pack fight, area average | Life lost, area average | Healed back | Boss fight | Sanctuaries used / run |', '|---|---|---|---|---|---|---|---|');
for (const r of rows) L.push(`| ${r.area} | ${r.arrive.sec} s | ${pct(r.arrive.loss)} | ${r.played.packSec} s | ${pct(r.played.packLoss)} | ${pct(r.played.healShare)} | ${r.played.bossSec} s | ${f1(r.sanctuaries / Math.max(1, r.runs))} |`);
L.push('');
L.push('## 3. The numbers proposed', '');
L.push(`**Healing:** Mend and Renewal × **${tuning.heal}**.`, '');
L.push('| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level in this band | XP / hour / member |', '|---|---|---|---|---|---|---|');
for (const r of rows) L.push(`| ${r.area} | ${r.pack.hp} | ${r.pack.dmg} | ${r.boss.hp} | ${r.boss.dmg} | ${r.xpPerLevel.toLocaleString('en-US')} | ${r.xpPerHour.toLocaleString('en-US')} |`);
L.push('', '*All multipliers sit on top of today\'s enemy formula (health ×1.6 and damage ×1.45 per tier; boss ×62 health, ×7 damage). Boss damage is scaled by the square root of the health multiplier so a wall is health and time, never a one-shot.*', '');
L.push('## 4. What the party wore at each wall', '', '| Wall | Weapons | Armor pieces / member | Avg max HP | Party DPS |', '|---|---|---|---|---|');
for (const r of rows) if (r.power) L.push(`| ${r.area} | ${r.weapons} | ${f1(r.armor)} | ${r.power.hp.toLocaleString('en-US')} | ${Math.round(r.power.dps).toLocaleString('en-US')} |`);
L.push('');
L.push('## 5. Does it hold on other seeds and other players?', '', '| Play style | Seed | Cleared | Play hours | Days | Wipes | Hours per wall |', '|---|---|---|---|---|---|---|');
for (const [k, runs] of Object.entries(validation)) for (const r of runs) L.push(`| ${POLICIES[k].label} | ${r.seed} | ${r.done ? 'yes' : `no — wall ${r.unlocked}`} | ${r.playHours} | ${r.days} | ${r.wipes} | ${Object.values(r.perArea).join(' · ')} |`);
L.push('');
L.push('## 6. Economy during the calibration playthrough (not tuned in this pass)', '', `Worldvein earned ${main.stats.veinEarned.toLocaleString('en-US')} ❖ · spent ${Object.entries(main.stats.veinSpent).map(([k, v]) => `${k} ${Math.round(v).toLocaleString('en-US')}`).join(', ')} · banked ${main.worldvein.toLocaleString('en-US')} ❖ · Resonance rank ${main.rank} of 10.`, '');
L.push('## 7. How the bot plays', '');
for (const a of ASSUMPTIONS) L.push(`- ${a}`);
writeFileSync(join(OUT, 'PROPOSAL.md'), L.join('\n'));
log('wrote', join(OUT, 'PROPOSAL.md'));
