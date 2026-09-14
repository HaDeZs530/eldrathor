/**
 * Camera + travel tween tests — docs/Eldrathor_RouteMap_v3_Travel_Lock.md §13–§17.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cameraReducer, resolveFocus, keepInFrame, centerOn, clampPan, easeInOut, polylinePointAt, travelDuration, HOP_MS, SKIP_MS, SAFE_FRAME } from './camera.js';

const vp = { w: 372, h: 670 };
const sheet = { w: 744, h: 1160 };
const margin = { top: 56, bottom: 96, side: 48 };
const nodes = { entrance: { x: 300, y: 500 }, next: { x: 380, y: 560 }, far: { x: 600, y: 620 } };
const ptOf = (id) => nodes[id];
const resolve = (cam) => (cam.focus ? resolveFocus(cam.focus, ptOf, vp, sheet, margin, cam.pan) : cam.pan);

test('§13: the fight never moves the camera; on Continue the camera pans (eased) to centre on the party', () => {
  // the party explored onto `next` and tapped Fight; the camera is wherever the tween left it
  const before = cameraReducer(null, { type: 'travelEnd', pan: { x: -120, y: -300 } });
  const duringFight = cameraReducer(before, { type: 'fightStart' });
  assert.equal(duringFight, before);
  // Results → Continue: a slow pan (motion 'ease') that ends centred on the party's node
  const closing = cameraReducer(duringFight, { type: 'overlayClose', partyId: 'next' });
  assert.equal(closing.motion, 'ease');
  assert.deepEqual(resolve(closing), centerOn(nodes.next, vp, sheet, margin));
});

test('keepInFrame helper: a point inside the safe frame → same pan; outside → the minimal pan that brings it in; run start centres', () => {
  const base = centerOn(nodes.entrance, vp, sheet, margin);
  // `next` is 80 px right / 60 px below the centred entrance → inside the safe frame → identical pan object
  assert.equal(keepInFrame(nodes.next, base, vp, sheet), base);
  // a point below the safe frame comes up by exactly the overflow, and no further
  const lowPt = { x: nodes.entrance.x, y: nodes.entrance.y + 300 };
  const moved = keepInFrame(lowPt, base, vp, sheet);
  assert.equal(Math.round(lowPt.y + moved.y), Math.round(vp.h * SAFE_FRAME.bottom));
  assert.equal(moved.x, base.x);
  // run start is the only centring of a run
  const start = cameraReducer(null, { type: 'runStart', partyId: 'entrance' });
  assert.deepEqual(resolve(start), centerOn(nodes.entrance, vp, sheet, margin));
  // a drag replaces any pending framing with a concrete pan
  const dragged = cameraReducer(start, { type: 'drag', basePan: base, dx: 10, dy: -20 });
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

test('§16 (amended 2026-09-13): one continuous tween — 900 ms per hop, 300 ms skip, eased only at the ends, lands exactly on the destination', () => {
  assert.equal(HOP_MS, 900);
  assert.equal(SKIP_MS, 300);
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
