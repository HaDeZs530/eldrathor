/**
 * Calibration, five-rung item model (Anthony, 2026-09-20). Simulator only — nothing in the game changes.
 *   weapons: Common · Rare · Epic · Legendary · Mythic (×1.0–1.8), one flat tier per wall (Greatsword 20 → 110), upgrades to +10 (+25 %)
 *   drops: a fight drops an item half the time, a miss pays Worldvein; Epic rare, Legendary / Mythic a long chase, more generous low on the mountain
 *   THE WALL: three maxed Epics of the area's tier at the area's level beat the boss "with a struggle" (~60 %); Rare gear cannot
 *   target: the 2-hour player reaches the dragon in ~5 months → ~150 h on the efficient route; areas equal, the first three ~20 % shorter
 * The number of clears per area is an OUTPUT. `node scripts/sim/calibrateFive.mjs [outDir] [efficientHours]`
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { newGame, advance, snapshot, cleared, enemiesFor, estimate, playCampaign, summarize, referenceParty, POLICIES, areasFor, FIVE } from './progressionSim.mjs';
import { simulateFight, mulberry32 } from '../../src/combat/simulate.js';

const OUT = process.argv[2] || '../docs/balance/proposal-five';
const TOTAL = Number(process.argv[3] || 150);
const WALLS = 10;
const T = { packSec: Number(process.env.PACK_SEC || 18), packLoss: Number(process.env.PACK_LOSS || 0.12), levelPerArea: 4.5, levelPower: 0.04, heal: 0.5, wallWin: Number(process.env.WALL_WIN || 0.6), imbuesPerArea: 4 };
const gemPace = (area) => Math.min(40, T.imbuesPerArea * area); // ASSUMPTION (Anthony OK'd as a placeholder 2026-09-20): ~4 imbues per area, 40 by the dragon
const K = Number(process.env.RATE_SCALE || 1); // scales Epic / Legendary / Mythic odds for a variant run
const RATES0 = (area) => (area <= 3 ? { rare: 0.25, epic: 0.06, legendary: 0.01, mythic: 0.003 } : area <= 6 ? { rare: 0.25, epic: 0.035, legendary: 0.003, mythic: 0.0005 } : { rare: 0.25, epic: 0.02, legendary: 0.0005, mythic: 0.0001 });
const RATES = (area) => { const r = RATES0(area); return { rare: r.rare, epic: r.epic * K, legendary: r.legendary * K, mythic: r.mythic * K }; };
mkdirSync(OUT, { recursive: true });
const unit = TOTAL / (3 * 0.8 + (WALLS - 3)); const hoursFor = (id) => +(id <= 3 ? unit * 0.8 : unit).toFixed(1);
const AREAS = areasFor(WALLS); const P = POLICIES.efficient;
const avg = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const tuning = { walls: WALLS, pack: {}, boss: {}, heal: T.heal, xp: {}, gems: false, levelPower: T.levelPower, items: 'five', dropRates: RATES, gemPace };
// SURVIVAL=1: armor on; from area 4 monsters gain mitigation and regeneration on an upward curve, and boss damage scales WITH boss health
// (not its square root), so an under-geared party is out-healed and dies instead of just fighting longer. ASSUMED numbers, for the test only.
const SURVIVAL = process.env.SURVIVAL === '1';
if (SURVIVAL) { tuning.armor = true; tuning.enemyDef = (area, type) => { const k = Math.max(0, area - 3) / 7; return { mit: 0.35 * k ** 1.5, regen: (type === 'boss' ? 0.012 : 0.02) * k ** 1.5 }; }; }

function measurePacks(party, area, n = 24) {
  const d = [], l = []; let wins = 0;
  for (let i = 0; i < n; i++) { const r = simulateFight({ party, enemies: enemiesFor(area, i % 4 === 0 ? 'crystal' : 'normal', { rng: mulberry32(1000 + i), depth01: 0.5 }, tuning), seed: 5000 + i, startHpFrac: party.map(() => 1) }); d.push(r.result.durationMs / 1000); l.push(1 - avg(r.result.partyHpFrac)); wins += r.result.win ? 1 : 0; }
  return { sec: avg(d), loss: avg(l), win: wins / n };
}
function tunePacks(party, area) {
  let m = { hp: 1, dmg: 1 };
  for (let k = 0; k < 12; k++) { tuning.pack[area.id] = m; const r = measurePacks(party, area); const hp = Math.min(3, Math.max(0.33, (T.packSec / Math.max(0.3, r.sec)) ** 0.9)); const dmg = r.win < 0.9 ? 0.6 : Math.min(2.5, Math.max(0.4, (T.packLoss / Math.max(0.01, r.loss)) ** 0.8)); m = { hp: m.hp * hp, dmg: m.dmg * dmg }; if (Math.abs(hp - 1) < 0.04 && Math.abs(dmg - 1) < 0.06) break; }
  tuning.pack[area.id] = { hp: +m.hp.toFixed(3), dmg: +m.dmg.toFixed(3) };
  return measurePacks(party, area);
}
// "with a struggle and some boosting": the wall is met the way a run meets it — a couple of sanctuary bonuses already taken
const BOOSTS = { dmgMult: 1.2, mitAdd: 0.2 };
const bossWin = (party, area, n = 30) => estimate(party, enemiesFor(area, 'boss', { rng: mulberry32(3) }, tuning), party.map(() => 1), BOOSTS, 99, n);
function tuneBoss(wallParty, area) {
  let lo = Math.log(0.01), hi = Math.log(500);
  for (let s = 0; s < 12; s++) { const k = Math.exp((lo + hi) / 2); tuning.boss[area.id] = { hp: +k.toFixed(4), dmg: +(SURVIVAL ? k ** 0.8 : Math.sqrt(k)).toFixed(4) }; if (bossWin(wallParty, area) > T.wallWin) lo = Math.log(k); else hi = Math.log(k); }
  return tuning.boss[area.id];
}
function xpPerHour(S, area) {
  const Tx = { ...tuning, boss: { ...tuning.boss, [area.id]: { hp: 1e9, dmg: 1 } }, xp: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [i, 1e15])) };
  const C = snapshot(S); const x0 = C.stats.xpEarned; const t0 = C.playSec; advance(C, P, Tx, { until: () => false, maxHours: 1.5 });
  return (C.stats.xpEarned - x0) / ((C.playSec - t0) / 3600) / C.party.length;
}

const S = newGame(7); advance(S, P, tuning, { until: () => true }); const rows = [];
for (const area of AREAS) {
  const hoursTarget = hoursFor(area.id); const t0 = S.playSec; const lvIn = avg(S.party.map((m) => m.level)); const levelTarget = Math.round(T.levelPerArea * area.id);
  // packs: against a MID-GEARED party for this area — Rare +5 at the area's tier, halfway to the level target
  const mid = referenceParty(S, tuning, { tier: area.id, rarity: 'Rare', upg: 5, level: Math.round((lvIn + levelTarget) / 2), imbues: Math.max(0, gemPace(area.id) - 2), bondAtCap: true });
  const packs = tunePacks(mid, area);
  const arrive = measurePacks(referenceParty(S, tuning, { tier: Math.max(1, area.id - 1), rarity: 'Epic', upg: 10, level: Math.round(lvIn), imbues: gemPace(area.id - 1), bondAtCap: true }), area);
  // XP: the level target is reached in the area's hours
  const xph = xpPerHour(S, area); const steps = Math.max(1, levelTarget - Math.floor(lvIn)); const per = Math.round((xph * hoursTarget) / steps);
  for (let L = Math.floor(lvIn); L < levelTarget; L++) tuning.xp[L] = per;
  for (let L = Math.max(levelTarget, Math.floor(lvIn)); L < 60; L++) tuning.xp[L] = Math.round(per * 1.25 ** (L - levelTarget + 1));
  // the wall: three maxed Epics at the level target win ~60 %
  const gear = (rarity, upg, level = levelTarget, o = {}) => referenceParty(S, tuning, { tier: area.id, rarity, upg, level, imbues: gemPace(area.id), bondAtCap: true, ...o });
  const boss = tuneBoss(gear('Epic', 10), area);
  const wall = { rare10: bossWin(gear('Rare', 10), area), epic0: bossWin(gear('Epic', 0), area), epic10: bossWin(gear('Epic', 10), area), legendary10: bossWin(gear('Legendary', 10), area), mythic10: bossWin(gear('Mythic', 10), area), epic10Under: bossWin(gear('Epic', 10, Math.max(1, levelTarget - 3)), area), epic10NoGems: bossWin(gear('Epic', 10, levelTarget, { imbues: 0 }), area), epic10NoBond: bossWin(gear('Epic', 10, levelTarget, { bondAtCap: false }), area), epic10PrevTier: bossWin(referenceParty(S, tuning, { tier: Math.max(1, area.id - 1), rarity: 'Legendary', upg: 10, level: levelTarget, imbues: gemPace(area.id), bondAtCap: true }), area) };
  advance(S, P, tuning, { until: (s) => cleared(s, area.id), maxHours: hoursTarget * 3 });
  const forced = !cleared(S, area.id); if (forced) S.unlocked = Math.max(S.unlocked, area.id + 1);
  const A = S.stats.areas[area.id];
  rows.push({ area: area.id, name: area.name, hoursTarget, hours: +((S.playSec - t0) / 3600).toFixed(1), cleared: !forced, day: S.day, runs: A.runs, fights: A.fights, fightsPerRun: +(A.fights / Math.max(1, A.runs)).toFixed(1), wipes: A.wipes, bossAttempts: A.bossAttempts, items: A.items, epics: A.epics, legendaries: A.legendaries, mythics: A.mythics, epicSetHour: A.epicSetHour, maxedEpicHour: A.maxedEpicHour, levelIn: +lvIn.toFixed(1), levelOut: +(A.levelOnClear ?? avg(S.party.map((m) => m.level))).toFixed(1), levelTarget, weapons: A.weaponOnClear, pack: tuning.pack[area.id], boss, packMid: { sec: +packs.sec.toFixed(1), loss: +packs.loss.toFixed(3) }, packArrive: { sec: +arrive.sec.toFixed(1), loss: +arrive.loss.toFixed(3), win: arrive.win }, packPlayed: { sec: +(A.packSec / Math.max(1, A.packFights)).toFixed(1), loss: +(A.packLoss / Math.max(1, A.packFights)).toFixed(3) }, bossSec: +(A.bossSec / Math.max(1, A.bossFights)).toFixed(0), wall, xpPerLevel: per, power: A.powerOnClear });
  const r = rows.at(-1);
  log(`WALL ${area.id}: ${r.hours} h (target ${hoursTarget})${forced ? ' NOT CLEARED' : ''} · ${r.runs} runs · packs ${r.packPlayed.sec}s −${(r.packPlayed.loss * 100).toFixed(0)}% · epics ${r.epics} leg ${r.legendaries} myth ${r.mythics} · set@${r.epicSetHour}h max@${r.maxedEpicHour}h · wall R ${Math.round(wall.rare10 * 100)}% E ${Math.round(wall.epic10 * 100)}% L ${Math.round(wall.legendary10 * 100)}% noGem ${Math.round(wall.epic10NoGems * 100)}% noBond ${Math.round(wall.epic10NoBond * 100)}% prevLeg ${Math.round(wall.epic10PrevTier * 100)}% · L${r.levelIn}→${r.levelOut} · ${r.weapons}`);
}
const main = summarize(S, P, tuning);
const validation = {};
for (const [policy, seeds] of Object.entries({ efficient: [1, 2], casual: [1] })) validation[policy] = seeds.map((seed) => { const r = playCampaign({ seed, policy, tuning, maxHours: TOTAL * 5 }); log(`validate ${policy} ${seed}: ${r.done ? 'cleared' : `stopped at wall ${r.unlocked}`} · ${r.playHours} h · day ${r.days}`); const a = Object.values(r.stats.areas); return { seed, done: r.done, playHours: r.playHours, days: r.days, unlocked: r.unlocked, runs: r.stats.runs, wipes: r.stats.wipes, legendaries: a.reduce((n, x) => n + x.legendaries, 0), mythics: a.reduce((n, x) => n + x.mythics, 0), perArea: a.map((x) => +x.playHours.toFixed(1)) }; });
writeFileSync(join(OUT, 'proposal-five.json'), JSON.stringify({ generated: new Date().toISOString(), target: { efficientHours: TOTAL, ...T }, five: FIVE, rates: [1, 4, 7].map((a) => ({ fromArea: a, ...RATES(a) })), tuning: { ...tuning, dropRates: undefined }, rows, main: { playHours: main.playHours, days: main.days, veinEarned: main.stats.veinEarned, veinSpent: main.stats.veinSpent, worldvein: main.worldvein }, validation }, null, 1));

const pct = (n) => `${Math.round(n * 100)} %`; const f1 = (n) => (n == null ? '—' : Number(n).toFixed(1));
const L = [];
L.push('# Five-rung proposal — measured by the simulator', '', `*Generated ${new Date().toISOString().slice(0, 10)} by \`app/scripts/sim/calibrateFive.mjs\`. Nothing in the game has changed.*`, '');
L.push('## What was tested', '', '- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.', '- **Drops:** a fight drops an item half the time; a miss pays the node\'s Worldvein again. Rares and bosses always drop at three times the odds.', `- **Rates:** areas 1–3 Epic ${pct(RATES(1).epic)} · Legendary ${(RATES(1).legendary * 100).toFixed(1)} % · Mythic ${(RATES(1).mythic * 100).toFixed(1)} %; areas 4–6 ${(RATES(4).epic * 100).toFixed(1)} % · ${(RATES(4).legendary * 100).toFixed(1)} % · ${(RATES(4).mythic * 100).toFixed(2)} %; areas 7–10 ${pct(RATES(7).epic)} · ${(RATES(7).legendary * 100).toFixed(2)} % · ${(RATES(7).mythic * 100).toFixed(2)} %.`, `- **The wall:** three maxed Epics of the area\'s tier at the area\'s level (${T.levelPerArea} levels per area) beat the boss about ${pct(T.wallWin)} of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).`, `- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~${T.packSec} s and loses ~${pct(T.packLoss)} of its health. Healing × ${T.heal}.`, `- **Target:** ~${TOTAL} h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 ${hoursFor(1)} h, areas 4–10 ${hoursFor(4)} h. **The number of clears is an output.**`, '- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor is left out of this pass; every party member holds a matching gem with about 4 imbues per area (40 by the dragon), and the wall party has every Bond upgrade its Resonance rank allows.', '');
L.push('## 1. Result', '', '| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |', '|---|---|---|---|---|---|---|---|---|');
for (const r of rows) L.push(`| ${r.area} | ${r.hoursTarget} | ${r.hours}${r.cleared ? '' : ' ✗'} | ${r.day} | ${r.runs} | ${r.wipes} | ${r.bossAttempts} | ${r.levelIn} → ${r.levelOut} (${r.levelTarget}) | ${r.weapons || '—'} |`);
L.push(`| **Total** | **${TOTAL}** | **${f1(rows.reduce((n, r) => n + r.hours, 0))}** | ${rows.at(-1).day} | ${rows.reduce((n, r) => n + r.runs, 0)} | ${rows.reduce((n, r) => n + r.wipes, 0)} | | | |`, '');
L.push('## 2. Loot per area', '', '| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |', '|---|---|---|---|---|---|---|');
for (const r of rows) L.push(`| ${r.area} | ${r.items} | ${r.epics} | ${r.legendaries} | ${r.mythics} | ${r.epicSetHour == null ? 'never' : `${r.epicSetHour} h`} | ${r.maxedEpicHour == null ? 'never' : `${r.maxedEpicHour} h`} |`);
L.push(`| **Total** | ${rows.reduce((n, r) => n + r.items, 0)} | ${rows.reduce((n, r) => n + r.epics, 0)} | ${rows.reduce((n, r) => n + r.legendaries, 0)} | ${rows.reduce((n, r) => n + r.mythics, 0)} | | |`, '');
L.push('## 3. The wall — boss win rate by gear, at the area\'s level', '', '| Wall | Rare +10 | Epic +0 | **Epic +10** | … 3 levels under | … no gem imbues | … upgrades as bought on arrival | Last tier Legendary +10 | Legendary +10 | Mythic +10 | Boss fight |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) L.push(`| ${r.area} | ${pct(r.wall.rare10)} | ${pct(r.wall.epic0)} | **${pct(r.wall.epic10)}** | ${pct(r.wall.epic10Under)} | ${pct(r.wall.epic10NoGems)} | ${pct(r.wall.epic10NoBond)} | ${pct(r.wall.epic10PrevTier)} | ${pct(r.wall.legendary10)} | ${pct(r.wall.mythic10)} | ${r.bossSec} s |`);
L.push('', '## 4. Fights', '', '| Wall | Arriving in last area\'s maxed Epics | Mid-geared (tuned) | Area average as played |', '|---|---|---|---|');
for (const r of rows) L.push(`| ${r.area} | ${r.packArrive.sec} s, −${pct(r.packArrive.loss)}${r.packArrive.win < 1 ? ` (wins ${pct(r.packArrive.win)})` : ''} | ${r.packMid.sec} s, −${pct(r.packMid.loss)} | ${r.packPlayed.sec} s, −${pct(r.packPlayed.loss)} |`);
L.push('', '## 5. Enemy numbers this needs (multipliers on today\'s formula)', '', '| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |', '|---|---|---|---|---|---|');
for (const r of rows) L.push(`| ${r.area} | ${r.pack.hp} | ${r.pack.dmg} | ${r.boss.hp} | ${r.boss.dmg} | ${r.xpPerLevel.toLocaleString('en-US')} |`);
L.push('', '## 6. Other seeds and players', '', '| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |', '|---|---|---|---|---|---|---|---|---|');
for (const [k, runs] of Object.entries(validation)) for (const r of runs) L.push(`| ${POLICIES[k].label} | ${r.seed} | ${r.done ? 'yes' : `no — wall ${r.unlocked}`} | ${r.playHours} | ${r.days} | ${r.runs} | ${r.wipes} | ${r.legendaries} | ${r.mythics} |`);
writeFileSync(join(OUT, 'PROPOSAL-FIVE.md'), L.join('\n'));
log('wrote', join(OUT, 'PROPOSAL-FIVE.md'));
