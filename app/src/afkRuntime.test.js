/**
 * Bug-fix pass 1 §8 — AFK one-job rule keyed by stable character id.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignJob, resolveCharKey, emptyGatherSlot, tickAfk, trainXpGain, maxUnlockedTier, IDLE_CYCLE_MS } from './afkRuntime.js';
import { trainXpPerMinute, xpToNext } from './progression/progression.js';

const party = [{ id: 'c1', name: 'Kessa', level: 3 }, { id: 'c2', name: 'Orin', level: 3 }];
const roster = [{ id: 'c3', name: 'Vayle', level: 1 }];
const state = () => ({ gatherSlots: [emptyGatherSlot(), emptyGatherSlot()], process: { charKey: null, running: false, progress: 0 }, idle: { charKey: null, running: false, progress: 0 }, gatherSkillXp: {} });

test('one character cannot hold two jobs: assigning clears them from any other job (and stops it)', () => {
  let s = assignJob(state(), { kind: 'gather', index: 0 }, 'c1');
  s = { ...s, gatherSlots: s.gatherSlots.map((g, i) => (i === 0 ? { ...g, running: true, progress: 0.5 } : g)) };
  s = assignJob(s, { kind: 'process' }, 'c1');
  assert.equal(s.process.charKey, 'c1');
  assert.equal(s.gatherSlots[0].charKey, null);
  assert.equal(s.gatherSlots[0].running, false);
  s = assignJob(s, { kind: 'gather', index: 1 }, 'c1');
  assert.equal(s.process.charKey, null);
  assert.equal(s.gatherSlots[1].charKey, 'c1');
  // a different character does not disturb c1's job
  s = assignJob(s, { kind: 'idle' }, 'c2');
  assert.equal(s.gatherSlots[1].charKey, 'c1');
  assert.equal(s.idle.charKey, 'c2');
  // clearing a slot
  s = assignJob(s, { kind: 'gather', index: 1 }, null);
  assert.equal(s.gatherSlots[1].charKey, null);
});

test('keys resolve by id wherever the character is; swapping roster members does not move an assignment', () => {
  assert.equal(resolveCharKey('c3', party, roster).member.name, 'Vayle');
  assert.equal(resolveCharKey('c3', party, roster).source, 'roster');
  // Vayle promoted into the party, Orin benched — the same key still finds Vayle
  const party2 = [party[0], roster[0]]; const roster2 = [party[1]];
  const r = resolveCharKey('c3', party2, roster2);
  assert.equal(r.member.name, 'Vayle'); assert.equal(r.source, 'party'); assert.equal(r.index, 1);
  // legacy positional keys still resolve (old saves)
  assert.equal(resolveCharKey('party:1', party, roster).member.name, 'Orin');
  assert.equal(resolveCharKey('nope', party, roster), null);
});

test('Train (§3): one idle cycle grants trainXpPerMinute(Tmax) × cycle/60 s XP to the trainee — flat rate, no catch-up cap, levels via xpToNext', () => {
  assert.equal(maxUnlockedTier(1), 1);
  assert.ok(Math.abs(trainXpGain(1, 60000) - trainXpPerMinute(1)) < 1e-9);
  assert.ok(Math.abs(trainXpGain(1, IDLE_CYCLE_MS) - 6 * (IDLE_CYCLE_MS / 60000)) < 1e-9);
  const s = { ...state(), idle: { charKey: 'c3', running: true, progress: 0.999 } };
  const inv = { raw: {}, infused: [], scrap: 0, armor: [] };
  const low = [{ id: 'c3', name: 'Vayle', level: 1, xp: 0 }];
  const patch = tickAfk({ state: s, inventory: inv, worldvein: 0, party, roster: low, unlocked: 1, dt: 100 });
  assert.ok(patch.rosterNext, 'the trainee is updated');
  assert.ok(Math.abs(patch.rosterNext[0].xp - trainXpGain(1)) < 1e-9);
  assert.equal(patch.rosterNext[0].level, 1);
  // the same gain regardless of anyone else's level (no catch-up): a trainee already at the roster top gets it too
  const top = [{ id: 'c3', name: 'Vayle', level: 9, xp: xpToNext(9) - 0.1 }];
  const patch2 = tickAfk({ state: s, inventory: inv, worldvein: 0, party, roster: top, unlocked: 1, dt: 100 });
  assert.equal(patch2.rosterNext[0].level, 10);
});
