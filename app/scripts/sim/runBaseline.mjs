/**
 * Baseline progression report. `node scripts/sim/runBaseline.mjs [outDir] [seeds] [maxDays]`
 * Plays the whole mountain under each policy for several seeds and writes baseline.json + BASELINE.md.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { playCampaign, POLICIES, ASSUMPTIONS } from './progressionSim.mjs';
import { AREAS } from '../../src/data.js';

const OUT = process.argv[2] || '../docs/balance/baseline';
const SEEDS = (process.argv[3] || '1,2,3').split(',').map(Number);
const MAX_HOURS = Number(process.argv[4] || 600);
const MAX_DAYS = `${MAX_HOURS} h`;
const TARGET = { hoursLow: 180, hoursHigh: 360, hoursEfficient: 210, daysLow: 60, daysHigh: 90 };
mkdirSync(OUT, { recursive: true });

const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const f1 = (n) => (n == null ? '—' : Number(n).toFixed(1));
const f0 = (n) => (n == null ? '—' : Math.round(n).toLocaleString('en-US'));

const results = {};
for (const policy of Object.keys(POLICIES)) {
  results[policy] = [];
  for (const seed of SEEDS) {
    const t0 = Date.now();
    const r = playCampaign({ seed, policy, maxHours: MAX_HOURS });
    results[policy].push(r);
    console.log(`${policy} seed ${seed}: ${r.done ? 'mountain cleared' : `stopped at area ${r.unlocked}`} · day ${r.days} · ${r.playHours} h · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
writeFileSync(join(OUT, 'baseline.json'), JSON.stringify({ generated: new Date().toISOString(), seeds: SEEDS, maxDays: MAX_DAYS, target: TARGET, results }, null, 1));

// ------------------------------------------------------------------ the report
const L = [];
L.push('# Progression baseline — the mountain as the numbers stand today', '');
L.push(`*Generated ${new Date().toISOString().slice(0, 10)} by \`app/scripts/sim/runBaseline.mjs\` — ${SEEDS.length} seeds per play style, up to ${MAX_DAYS} of play each. No game number was changed to produce this.*`, '');
L.push('**Target (Anthony, 2026-09-19):** a player at 3–4 h a day takes the whole mountain in 2–3 months — about **180–360 hours of play**, and about **210 hours (2 months)** on the most efficient route. Past that: gear grinding, levelling more Adventurers, events.', '');

L.push('## 1. Headline', '');
L.push('| Play style | Hours / day | Mountain cleared | Days (median) | Play hours (median) | vs the 210 h efficient target |', '|---|---|---|---|---|---|');
for (const [k, runs] of Object.entries(results)) {
  const done = runs.filter((r) => r.done);
  const hours = med(done.map((r) => r.playHours)); const days = med(done.map((r) => r.days));
  L.push(`| ${POLICIES[k].label} | ${POLICIES[k].hoursPerDay} | ${done.length}/${runs.length} | ${days ?? `not in ${MAX_DAYS}`} | ${f1(hours)} | ${hours ? `${(TARGET.hoursEfficient / hours).toFixed(1)}× too fast` : 'stalled'} |`);
}
L.push('');

const eff = results.efficient;
L.push('## 2. Area by area — the efficient route (median of the seeds)', '');
L.push('| Area | Tier | Item tier | Arrives day | Cleared day | Hours in area | Runs | Fights | Wipes | Boss tries | Party level in → out | Avg fight (s) |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
const ITEM_TIER = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 6 };
for (const a of AREAS) {
  const rows = eff.map((r) => r.stats.areas[a.id]).filter(Boolean);
  if (!rows.length) { L.push(`| ${a.id} ${a.name} | ${a.tier} | ${ITEM_TIER[a.id]} | — | — | — | — | — | — | — | — | — |`); continue; }
  const m = (fn) => med(rows.map(fn));
  L.push(`| ${a.id} ${a.name} | ${a.tier} | ${ITEM_TIER[a.id]} | ${m((x) => x.firstDay) ?? '—'} | ${m((x) => x.clearedDay) ?? '—'} | ${f1(m((x) => x.playHours))} | ${f0(m((x) => x.runs))} | ${f0(m((x) => x.fights))} | ${f0(m((x) => x.wipes))} | ${f0(m((x) => x.bossAttempts))} | ${f1(m((x) => x.levelOnArrival))} → ${f1(m((x) => x.levelOnClear))} | ${f1(m((x) => (x.packFights ? x.packSec / x.packFights : null)))} |`);
}
L.push('');
const one = eff[0];
L.push(`**What the party wore at each boss kill (seed ${one.seed}):**`, '');
L.push('| Area | Weapons | Armor pieces / member | Avg max HP | Party DPS |', '|---|---|---|---|---|');
for (const a of AREAS) { const x = one.stats.areas[a.id]; if (x?.clearedDay != null) L.push(`| ${a.id} ${a.name} | ${x.weaponOnClear} | ${f1(x.armorOnClear)} | ${f0(x.powerOnClear?.hp)} | ${f0(x.powerOnClear?.dps)} |`); }
L.push('');

L.push('## 3. The other play styles — day each area falls (median)', '');
L.push(`| Area | ${Object.keys(results).map((k) => POLICIES[k].label).join(' | ')} |`, `|---|${Object.keys(results).map(() => '---').join('|')}|`);
for (const a of AREAS) L.push(`| ${a.id} ${a.name} | ${Object.values(results).map((runs) => { const d = med(runs.map((r) => r.stats.areas[a.id]?.clearedDay ?? null)); return d == null ? '—' : `day ${d}`; }).join(' | ')} |`);
L.push('');

L.push('## 4. Economy and growth at the end of the efficient route (median)', '');
const mm = (fn) => med(eff.map(fn));
L.push('| Measure | Value |', '|---|---|');
L.push(`| Worldvein earned | ${f0(mm((r) => r.stats.veinEarned))} ❖ |`);
const spentKeys = [...new Set(eff.flatMap((r) => Object.keys(r.stats.veinSpent)))];
for (const k of spentKeys) L.push(`| Worldvein spent on ${k} | ${f0(mm((r) => r.stats.veinSpent[k] || 0))} ❖ |`);
L.push(`| Worldvein left in the bank | ${f0(mm((r) => r.worldvein))} ❖ |`);
L.push(`| Party level at the end | ${f1(mm((r) => r.party.reduce((n, p) => n + p.level, 0) / r.party.length))} (cap 50) |`);
L.push(`| Roster size · Resonance rank | ${f0(mm((r) => r.rosterSize))} · rank ${f0(mm((r) => r.rank))} of 10 |`);
L.push(`| Veinbinder upgrade levels bought | ${f0(mm((r) => Object.values(r.upgrades).reduce((a, b) => a + b, 0)))} |`);
L.push(`| Class gems found | ${f0(mm((r) => r.stats.gemsFound))} |`);
L.push(`| Runs · fights · wipes | ${f0(mm((r) => r.stats.runs))} · ${f0(mm((r) => r.stats.fights))} · ${f0(mm((r) => r.stats.wipes))} |`);
L.push('');

L.push('## 5. How the bot plays, and what it leaves out', '');
for (const a of ASSUMPTIONS) L.push(`- ${a}`);
L.push('');
L.push('| Play style | Fight speed | Decision time / node | Town time / run | Clears before the boss | Boss attempted at |', '|---|---|---|---|---|---|');
for (const p of Object.values(POLICIES)) L.push(`| ${p.label} | ${p.fightSpeed}× | ${p.decisionSec} s | ${p.townSec} s | ${Math.round(p.clearShare * 100)} % of the map | ≥ ${Math.round(p.bossAt * 100)} % dry-run wins |`);
L.push('');
writeFileSync(join(OUT, 'BASELINE.md'), L.join('\n'));
console.log('wrote', join(OUT, 'BASELINE.md'));
