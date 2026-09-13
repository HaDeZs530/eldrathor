/**
 * Camera + travel tween tests — docs/Eldrathor_RouteMap_v3_Travel_Lock.md §13–§17.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cameraReducer, resolveFocus, centerOn, frameTop, clampPan, easeInOut, polylinePointAt, travelDuration, HOP_MS, SKIP_MS, FRAME_TOP_FRAC } from './camera.js';

const vp = { w: 372, h: 670 };
const sheet = { w: 744, h: 1160 };
const margin = { top: 56, bottom: 96, side: 48 };
const nodes = { entrance: { x: 300, y: 500 }, next: { x: 380, y: 560 }, far: { x: 600, y: 620 } };
const ptOf = (id) => nodes[id];
const resolve = (cam) => (cam.focus ? resolveFocus(cam.focus, ptOf, vp, sheet, margin) : cam.pan);

test('§13/§17: the fight never moves the camera; after Continue it is centred on the party (its NEW node)', () => {
  // the party explored onto `next` and tapped Fight; the camera is wherever the tween left it
  const before = cameraReducer(null, { type: 'travelEnd', pan: centerOn(nodes.next, vp, sheet, margin) });
  const duringFight = cameraReducer(before, { type: 'fightStart' });
  assert.equal(duringFight, before);
  // Results → Continue: recentre on the party's current node (= the fought node) under the overlay
  const partyId = 'next';
  const closing = cameraReducer(duringFight, { type: 'overlayClose', partyId });
  assert.equal(closing.motion, 'ease');
  assert.deepEqual(resolve(closing), centerOn(nodes[partyId], vp, sheet, margin));
});

test('§17: a far node frames at 30 % height; an adjacent node frames party + node together; run start centres the party', () => {
  const far = cameraReducer(null, { type: 'tapFar', nodeId: 'far' });
  const pan = resolve(far);
  assert.deepEqual(pan, frameTop(nodes.far, vp, sheet));
  assert.equal(Math.round(pan.y + nodes.far.y), Math.round(vp.h * FRAME_TOP_FRAC));
  const adj = cameraReducer(far, { type: 'tapAdjacent', partyId: 'entrance', nodeId: 'next' });
  const mid = { x: (nodes.entrance.x + nodes.next.x) / 2, y: (nodes.entrance.y + nodes.next.y) / 2 };
  assert.deepEqual(resolve(adj), frameTop(mid, vp, sheet));
  const start = cameraReducer(null, { type: 'runStart', partyId: 'entrance' });
  assert.deepEqual(resolve(start), centerOn(nodes.entrance, vp, sheet, margin));
  // a drag replaces any pending framing with a concrete pan
  const base = resolve(adj);
  const dragged = cameraReducer(adj, { type: 'drag', basePan: base, dx: 10, dy: -20 });
  assert.equal(dragged.focus, null);
  assert.deepEqual(dragged.pan, { x: base.x + 10, y: base.y - 20 });
});

test('centre / clamp: the party lands in the band between the HUD strip and the bottom cards, inside the sheet', () => {
  const pan = centerOn({ x: 400, y: 600 }, vp, sheet, margin);
  const midY = (margin.top + (vp.h - margin.bottom)) / 2;
  assert.equal(Math.round(pan.y + 600), Math.round(midY));
  const c = clampPan({ x: 500, y: -5000 }, vp, sheet);
  assert.deepEqual(c, { x: 0, y: vp.h - sheet.h });
});

test('§16: one continuous tween — 600 ms per hop, 250 ms skip, eased only at the ends, lands exactly on the destination', () => {
  assert.equal(HOP_MS, 600);
  assert.equal(SKIP_MS, 250);
  const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 300, y: 100 }];
  assert.equal(travelDuration(pts.length - 1), 3 * HOP_MS);
  assert.deepEqual(polylinePointAt(pts, 0), pts[0]);
  assert.deepEqual(polylinePointAt(pts, 1), pts[3]);
  assert.deepEqual(polylinePointAt(pts, 1.2), pts[3]);
  // equal share of progress per hop, whatever the edge length
  assert.deepEqual(polylinePointAt(pts, 1 / 3), { x: 100, y: 0 });
  assert.deepEqual(polylinePointAt(pts, 0.5), { x: 100, y: 50 });
  // easing ramps only at the ends: symmetric, monotonic, constant speed through the middle (no per-hop hitch)
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.equal(easeInOut(0.5), 0.5);
  let prev = 0;
  for (let i = 1; i <= 100; i++) { const v = easeInOut(i / 100); assert.ok(v >= prev); prev = v; }
  const midSlope = (easeInOut(0.55) - easeInOut(0.45)) / 0.1;
  const midSlope2 = (easeInOut(0.35) - easeInOut(0.25)) / 0.1;
  assert.ok(Math.abs(midSlope - midSlope2) < 1e-9, 'constant speed through the middle');
  assert.ok(easeInOut(0.05) < 0.05 && easeInOut(0.95) > 0.95, 'slow at the ends');
});
