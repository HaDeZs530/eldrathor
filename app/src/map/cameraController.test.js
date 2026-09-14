import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCameraController } from './cameraController.js';

/** Fake frame scheduler: frames run only when `tick(t)` is called. */
function frames() {
  let id = 0; const q = new Map();
  return {
    schedule: (fn) => { id += 1; q.set(id, fn); return id; },
    cancel: (h) => q.delete(h),
    tick(t) { const fns = [...q.values()]; q.clear(); for (const fn of fns) fn(t); },
    pending: () => q.size,
  };
}

test('one camera owner: a new pan cancels the running one; dispose cancels everything and no frame writes after unmount', () => {
  const f = frames(); let t = 0; const writes = []; const commits = [];
  const cam = createCameraController({ pan: { x: 0, y: 0 }, write: (p) => writes.push({ ...p }), commit: (p) => commits.push({ ...p }), schedule: f.schedule, cancel: f.cancel, now: () => t });
  cam.panTo({ x: 100, y: 0 }, 100);
  assert.equal(f.pending(), 1);
  t = 50; f.tick(t);
  assert.equal(Math.round(cam.pan.x), 50);
  // a second request replaces the first: exactly one pending frame, from the CURRENT pan
  cam.panTo({ x: 0, y: 100 }, 100);
  assert.equal(f.pending(), 1);
  t = 150; f.tick(t);
  assert.deepEqual(cam.pan, { x: 0, y: 100 });
  assert.equal(commits.length, 1);
  // unmount mid-pan: nothing pending, and a late frame (if one had leaked) writes nothing
  cam.panTo({ x: 300, y: 300 }, 100);
  const writesBefore = writes.length;
  cam.dispose();
  assert.equal(f.pending(), 0);
  t = 400; f.tick(t);
  cam.set({ x: 1, y: 1 }); cam.panTo({ x: 2, y: 2 }, 10);
  assert.equal(writes.length, writesBefore);
  assert.equal(commits.length, 1);
});

test('immediate pans (ms 0) and tiny moves commit at once; set() cancels an eased pan', () => {
  const f = frames(); const writes = []; const commits = [];
  const cam = createCameraController({ pan: { x: 5, y: 5 }, write: (p) => writes.push({ ...p }), commit: (p) => commits.push({ ...p }), schedule: f.schedule, cancel: f.cancel, now: () => 0 });
  cam.panTo({ x: 50, y: 50 }, 0);
  assert.deepEqual(cam.pan, { x: 50, y: 50 });
  assert.equal(commits.length, 1);
  cam.panTo({ x: 50.2, y: 50.1 }, 900); // < 0.5 px → immediate
  assert.equal(f.pending(), 0);
  cam.panTo({ x: 500, y: 500 }, 900);
  assert.ok(cam.animating);
  cam.set({ x: 7, y: 7 });
  assert.ok(!cam.animating);
  assert.equal(f.pending(), 0);
  assert.deepEqual(cam.pan, { x: 7, y: 7 });
});
