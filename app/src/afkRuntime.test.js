/**
 * AFK runtime — bug-fix pass 1 §8 (one job per id) and Progression Loop Lock §6 (true idle, M1c).
 * Tests are the spec: 20 s into a 4 s cycle → 5 outputs; exhaustion stops cleanly; deploy pauses and resumes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assignJob, resolveCharKey, emptyGatherSlot, emptyAfkState, reconcileAfk, trainXpGain, maxUnlockedTier, IDLE_CYCLE_MS,
  PROCESS_CYCLE_MS, PROCESS_VEIN_COST, startJob, stopJob, toggleJob, suspendJobs, resumeJobs, cyclesElapsed,
  wantsOfflineSummary, summaryLines, normalizeAfk, OFFLINE_SUMMARY_MS, gatherYield, AFK_TUNING,
} from './afkRuntime.js';
import { MAT_QUALITY } from './theme/tokens.js';
import { trainXpPerMinute, xpToNext } from './progression/progression.js';

const party = [{ id: 'c1', name: 'Kessa', level: 3 }, { id: 'c2', name: 'Orin', level: 3 }];
const roster = [{ id: 'c3', name: 'Vayle', level: 1 }];
const state = () => ({ gatherSlots: [emptyGatherSlot(), emptyGatherSlot()], process: { ...emptyAfkState().process }, idle: { ...emptyAfkState().idle }, gatherSkillXp: {}, processSkillXp: 0 });
const inv = (raw = {}) => ({ raw: { wood: 0, metal: 0, hunt: 0, ...raw }, infused: [], scrap: 0, armor: [] });
const never = () => 0.99; // rng: no bonus Worldvein (quality roll lands on the top rung)
const T0 = 1_000_000;

test('one character cannot hold two jobs: assigning clears them from any other job (and stops it)', () => {
  let s = assignJob(state(), { kind: 'gather', index: 0 }, 'c1');
  s = { ...s, gatherSlots: s.gatherSlots.map((g, i) => (i === 0 ? startJob({ ...g, progress: 0.5 }, T0) : g)) };
  s = assignJob(s, { kind: 'process' }, 'c1');
  assert.equal(s.process.charKey, 'c1');
  assert.equal(s.gatherSlots[0].charKey, null);
  assert.equal(s.gatherSlots[0].running, false);
  s = assignJob(s, { kind: 'gather', index: 1 }, 'c1');
  assert.equal(s.process.charKey, null);
  assert.equal(s.gatherSlots[1].charKey, 'c1');
  s = assignJob(s, { kind: 'idle' }, 'c2');
  assert.equal(s.gatherSlots[1].charKey, 'c1');
  assert.equal(s.idle.charKey, 'c2');
  s = assignJob(s, { kind: 'gather', index: 1 }, null);
  assert.equal(s.gatherSlots[1].charKey, null);
});

test('keys resolve by id wherever the character is; swapping roster members does not move an assignment', () => {
  assert.equal(resolveCharKey('c3', party, roster).member.name, 'Vayle');
  assert.equal(resolveCharKey('c3', party, roster).source, 'roster');
  const party2 = [party[0], roster[0]]; const roster2 = [party[1]];
  const r = resolveCharKey('c3', party2, roster2);
  assert.equal(r.member.name, 'Vayle'); assert.equal(r.source, 'party'); assert.equal(r.index, 1);
  assert.equal(resolveCharKey('party:1', party, roster).member.name, 'Orin');
  assert.equal(resolveCharKey('nope', party, roster), null);
});

test('§6 timestamps: starting stamps startedAt + lastReconciledAt; 20 s into a 4 s gather cycle → 5 outputs, remainder carried as progress', () => {
  assert.deepEqual(cyclesElapsed(0, 20000, 4000), { cycles: 5, progress: 0 });
  assert.deepEqual(cyclesElapsed(0.5, 10000, 4000), { cycles: 3, progress: 0 }); // 2 s carried + 10 s = 12 s
  assert.deepEqual(cyclesElapsed(0, 10000, 4000), { cycles: 2, progress: 0.5 });
  let s = assignJob(state(), { kind: 'gather', index: 0 }, 'c3');
  s = { ...s, gatherSlots: s.gatherSlots.map((g, i) => (i === 0 ? startJob({ ...g, areaId: 1, family: 'wood' }, T0) : g)) };
  assert.equal(s.gatherSlots[0].startedAt, T0); assert.equal(s.gatherSlots[0].lastReconciledAt, T0);
  const r = reconcileAfk({ state: s, inventory: inv(), worldvein: 0, party, roster, unlocked: 1, now: T0 + 20000, rng: never });
  assert.equal(r.inv.raw.wood, 5 * gatherYield(1).gain);
  assert.equal(r.summary.raw.wood, 5 * gatherYield(1).gain);
  assert.equal(r.next.gatherSlots[0].progress, 0);
  assert.equal(r.next.gatherSlots[0].lastReconciledAt, T0 + 20000);
  assert.equal(r.summary.elapsedMs, 20000);
  // 10 s more → 2 cycles + half a cycle carried; the next 2 s completes it
  const r2 = reconcileAfk({ state: r.next, inventory: r.inv, worldvein: 0, party, roster, unlocked: 1, now: T0 + 30000, rng: never });
  assert.equal(r2.inv.raw.wood, 7 * gatherYield(1).gain); assert.ok(Math.abs(r2.next.gatherSlots[0].progress - 0.5) < 1e-9);
  const r3 = reconcileAfk({ state: r2.next, inventory: r2.inv, worldvein: 0, party, roster, unlocked: 1, now: T0 + 32000, rng: never });
  assert.equal(r3.inv.raw.wood, 8 * gatherYield(1).gain); assert.ok(Math.abs(r3.next.gatherSlots[0].progress) < 1e-9);
  // a 100 ms tick with no cycle completing changes nothing but the stamp
  const r4 = reconcileAfk({ state: r3.next, inventory: r3.inv, worldvein: 0, party, roster, unlocked: 1, now: T0 + 32100, rng: never });
  assert.equal(r4.inv.raw.wood, r3.inv.raw.wood); assert.ok(Math.abs(r4.next.gatherSlots[0].progress - 0.025) < 1e-9);
  // nothing running → null
  assert.equal(reconcileAfk({ state: state(), inventory: inv(), worldvein: 0, party, roster, unlocked: 1, now: T0 }), null);
});

test('§6 exhaustion: Process consumes raw + Worldvein per cycle, stops cleanly when either runs out (remainder dropped, running false)', () => {
  let s = assignJob(state(), { kind: 'process' }, 'c3');
  s = { ...s, process: startJob({ ...s.process, family: 'wood' }, T0) };
  // 2 raw, plenty of Worldvein, 60 s elapsed (12 possible cycles) → exactly 2 infused, then stopped
  const r = reconcileAfk({ state: s, inventory: inv({ wood: 2 }), worldvein: 100, party, roster, unlocked: 1, now: T0 + 60000, rng: never });
  assert.equal(r.inv.raw.wood, 0);
  assert.equal(r.inv.infused.reduce((n, m) => n + m.qty, 0), 2);
  assert.equal(r.vein, 100 - 2 * PROCESS_VEIN_COST);
  assert.equal(r.next.process.running, false); assert.equal(r.next.process.progress, 0);
  assert.deepEqual(r.summary.stops, ['process: out of raw wood']);
  assert.equal(Object.values(r.summary.infused).reduce((a, b) => a + b, 0), 2);
  // Worldvein exhaustion: 10 raw, 7 ❖ → one cycle
  const r2 = reconcileAfk({ state: s, inventory: inv({ wood: 10 }), worldvein: 7, party, roster, unlocked: 1, now: T0 + PROCESS_CYCLE_MS * 3, rng: never });
  assert.equal(r2.inv.raw.wood, 9); assert.equal(r2.vein, 2); assert.equal(r2.next.process.running, false);
  assert.deepEqual(r2.summary.stops, ['process: out of Worldvein']);
  // enough of both: 3 cycles, still running, stamped
  const r3 = reconcileAfk({ state: s, inventory: inv({ wood: 10 }), worldvein: 100, party, roster, unlocked: 1, now: T0 + PROCESS_CYCLE_MS * 3 + 1000, rng: never });
  assert.equal(r3.inv.raw.wood, 7); assert.equal(r3.next.process.running, true); assert.ok(Math.abs(r3.next.process.progress - 0.2) < 1e-9);
});

test('§6 deploy: suspending a character\'s job pauses accrual (kept, remainder preserved); resuming restarts from the return time, not from the run\'s start', () => {
  let s = assignJob(state(), { kind: 'gather', index: 0 }, 'c1');
  s = assignJob(s, { kind: 'idle' }, 'c3');
  s = { ...s, gatherSlots: s.gatherSlots.map((g, i) => (i === 0 ? startJob({ ...g, progress: 0.25 }, T0) : g)), idle: startJob(s.idle, T0) };
  // Kessa (c1) is fielded → her gather is suspended; Vayle's training continues
  s = suspendJobs(s, ['c1', 'c2'], T0 + 1000);
  assert.equal(s.gatherSlots[0].suspended, true); assert.equal(s.gatherSlots[0].running, true); assert.equal(s.idle.suspended, false);
  const r = reconcileAfk({ state: s, inventory: inv(), worldvein: 0, party, roster, unlocked: 1, now: T0 + 120000, rng: never });
  assert.equal(r.inv.raw.wood, 0, 'no gather accrues while suspended');
  assert.equal(r.next.gatherSlots[0].progress, 0.25, 'remainder preserved');
  assert.ok(r.rosterNext[0].xp > 0 || r.rosterNext[0].level > 1, 'training kept running');
  // back from the run at T0 + 120 s: resume; only time AFTER the return counts
  let s2 = resumeJobs(r.next, T0 + 120000);
  assert.equal(s2.gatherSlots[0].suspended, false); assert.equal(s2.gatherSlots[0].lastReconciledAt, T0 + 120000);
  const r2 = reconcileAfk({ state: s2, inventory: r.inv, worldvein: 0, party, roster, unlocked: 1, now: T0 + 120000 + 3000, rng: never });
  // 1 s carried (0.25 × 4 s) + 3 s = one cycle
  assert.equal(r2.inv.raw.wood, gatherYield(1).gain); assert.ok(Math.abs(r2.next.gatherSlots[0].progress) < 1e-9);
  // stop discards the remainder and the stamps; toggle round-trips
  const st = stopJob(r2.next.gatherSlots[0]); assert.equal(st.running, false); assert.equal(st.startedAt, null); assert.equal(st.charKey, 'c1');
  assert.equal(toggleJob(st, T0).running, true); assert.equal(toggleJob(toggleJob(st, T0), T0).running, false);
});

test('§6 offline summary: shown only when the reconciled span exceeds 60 s and something accrued; lines read "While you were away"', () => {
  let s = assignJob(state(), { kind: 'gather', index: 0 }, 'c1');
  s = { ...s, gatherSlots: s.gatherSlots.map((g, i) => (i === 0 ? startJob(g, T0) : g)) };
  const short = reconcileAfk({ state: s, inventory: inv(), worldvein: 0, party, roster, unlocked: 1, now: T0 + 30000, rng: never });
  assert.equal(wantsOfflineSummary(short.summary), false);
  const long = reconcileAfk({ state: s, inventory: inv(), worldvein: 0, party, roster, unlocked: 1, now: T0 + OFFLINE_SUMMARY_MS + 4000, rng: never });
  assert.equal(wantsOfflineSummary(long.summary), true);
  assert.deepEqual(summaryLines(long.summary), [`+${16 * gatherYield(1).gain} raw wood`]);
  // train line names the level gained
  let t = assignJob(state(), { kind: 'idle' }, 'c3');
  t = { ...t, idle: startJob(t.idle, T0) };
  const minutes = Math.ceil(xpToNext(1) / trainXpPerMinute(1)) + 1;
  const r = reconcileAfk({ state: t, inventory: inv(), worldvein: 0, party, roster, unlocked: 1, now: T0 + minutes * 60000, rng: never });
  assert.equal(r.rosterNext[0].level, 2);
  assert.match(summaryLines(r.summary)[0], /^Vayle \+1 level \(Lv 1 → 2\)$/);
  // a long idle span with a suspended-only job yields nothing → no sheet
  const sus = suspendJobs(s, ['c1'], T0);
  assert.equal(reconcileAfk({ state: sus, inventory: inv(), worldvein: 0, party, roster, unlocked: 1, now: T0 + 999999 }), null);
});

test('Train (§3): a cycle grants trainXpPerMinute(Tmax) × cycle/60 s — flat rate, no catch-up cap; legacy saves normalise with the save time so time away counts', () => {
  assert.equal(maxUnlockedTier(1), 1);
  assert.ok(Math.abs(trainXpGain(1, 60000) - trainXpPerMinute(1)) < 1e-9);
  assert.ok(Math.abs(trainXpGain(1, IDLE_CYCLE_MS) - 6 * (IDLE_CYCLE_MS / 60000)) < 1e-9);
  const top = [{ id: 'c3', name: 'Vayle', level: 9, xp: xpToNext(9) - 0.1 }];
  let t = assignJob(state(), { kind: 'idle' }, 'c3'); t = { ...t, idle: startJob(t.idle, T0) };
  const r = reconcileAfk({ state: t, inventory: inv(), worldvein: 0, party, roster: top, unlocked: 1, now: T0 + IDLE_CYCLE_MS, rng: never });
  assert.equal(r.rosterNext[0].level, 10);
  // legacy (pre-M1c) running job: no stamps → stamped with the save's afkSavedAt
  const legacy = { gatherSlots: [{ charKey: 'c1', areaId: 1, family: 'wood', running: true, progress: 0.5 }], process: { charKey: null, running: false, progress: 0, family: 'wood' }, idle: { charKey: null, running: false, progress: 0 }, gatherSkillXp: {}, processSkillXp: 0 };
  const n = normalizeAfk(legacy, { savedAt: T0, now: T0 + 5000 });
  assert.equal(n.gatherSlots[0].lastReconciledAt, T0); assert.equal(n.gatherSlots[0].startedAt, T0); assert.equal(n.gatherSlots[0].progress, 0.5);
  assert.equal(n.idle.lastReconciledAt, null);
  assert.equal(n.gatherSlots.length, 1);
});

test('§9 AFK_TUNING: the prototype rates are v1 — 4 / 5 / 6 s cycles, 5 ❖ per Process, 15 % ❖ per Gather cycle, yield 1+⌊T/2⌋, XP 3+2T, process XP 4, quality weights = MAT_QUALITY, offline summary at 60 s', () => {
  assert.equal(AFK_TUNING.gatherCycleMs, 4000); assert.equal(AFK_TUNING.processCycleMs, 5000); assert.equal(AFK_TUNING.trainCycleMs, 6000);
  assert.equal(AFK_TUNING.processVeinCost, 5); assert.equal(AFK_TUNING.gatherVeinChance, 0.15); assert.equal(AFK_TUNING.processXp, 4);
  assert.deepEqual([1, 2, 3, 9].map(AFK_TUNING.gatherYield), [1, 2, 2, 5]); assert.deepEqual([1, 2, 9].map(AFK_TUNING.gatherXp), [5, 7, 21]);
  assert.deepEqual(AFK_TUNING.qualityWeights, Object.fromEntries(Object.entries(MAT_QUALITY).map(([k, v]) => [k, v.weight])));
  assert.equal(AFK_TUNING.offlineSummaryMs, OFFLINE_SUMMARY_MS); assert.equal(PROCESS_CYCLE_MS, 5000); assert.equal(IDLE_CYCLE_MS, 6000);
  assert.ok(Object.isFrozen(AFK_TUNING));
});
