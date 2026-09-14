import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModeSwitcher } from './modeSwitch.js';

/** Minimal fake clock. */
function clock() {
  let now = 0; let id = 0; const q = new Map();
  return {
    setTimeout: (fn, ms) => { id += 1; q.set(id, { at: now + ms, fn }); return id; },
    clearTimeout: (h) => q.delete(h),
    advance(ms) { const until = now + ms; for (;;) { const next = [...q.entries()].filter(([, t]) => t.at <= until).sort((a, b) => a[1].at - b[1].at)[0]; if (!next) break; now = next[1].at; q.delete(next[0]); next[1].fn(); } now = until; },
    pending: () => q.size,
  };
}

test('enter Mind-view then leave within 100 ms → final mode is WORLD, transition settles once, no stale timer fires', () => {
  const c = clock(); const modes = []; const trans = [];
  const sw = createModeSwitcher({ initial: 'WORLD', onMode: (m) => modes.push(m), onTransitioning: (t) => trans.push(t), setTimeout: c.setTimeout, clearTimeout: c.clearTimeout });
  sw.go('MIND');
  c.advance(60);
  sw.go('WORLD'); // leave before the 120 ms pulse landed
  c.advance(2000);
  assert.deepEqual(modes, ['WORLD']); // MIND never applied
  assert.equal(sw.mode, 'WORLD');
  assert.equal(trans[trans.length - 1], false);
  assert.equal(c.pending(), 0);
});

test('a normal enter applies MIND after the pulse and settles after 280 ms; dispose cancels everything', () => {
  const c = clock(); const modes = []; const trans = [];
  const sw = createModeSwitcher({ initial: 'WORLD', onMode: (m) => modes.push(m), onTransitioning: (t) => trans.push(t), setTimeout: c.setTimeout, clearTimeout: c.clearTimeout });
  sw.go('MIND');
  c.advance(120);
  assert.deepEqual(modes, ['MIND']);
  assert.deepEqual(trans, [true]);
  c.advance(280);
  assert.deepEqual(trans, [true, false]);
  sw.go('WORLD');
  sw.dispose();
  c.advance(1000);
  assert.deepEqual(modes, ['MIND']); // nothing after dispose
  assert.equal(c.pending(), 0);
});
