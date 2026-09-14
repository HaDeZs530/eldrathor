/**
 * Bug-fix pass 1 §8 — AFK one-job rule keyed by stable character id.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignJob, resolveCharKey, emptyGatherSlot } from './afkRuntime.js';

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
