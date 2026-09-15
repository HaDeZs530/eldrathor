import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retapAction } from './tabRetap.js';

test('re-tapping Town / Party / Player / Hearth pops to that tab\'s root', () => {
  for (const t of ['town', 'party', 'player', 'afk']) assert.equal(retapAction(t, { runStage: 'route', inRun: true }), 'root', t);
});

test('re-tapping Mountain: Rally → island map; island → root; mid-run (route / fight / results / sanctuary) → stays — Extract is the only way back', () => {
  assert.equal(retapAction('mountain', { runStage: 'rally', inRun: false }), 'island');
  assert.equal(retapAction('mountain', { runStage: 'island', inRun: false }), 'root');
  for (const st of ['route', 'fight', 'loot', 'sanctuary']) assert.equal(retapAction('mountain', { runStage: st, inRun: true }), 'stay', st);
});
