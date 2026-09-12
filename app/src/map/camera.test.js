/**
 * Camera + travel tween tests — docs/Eldrathor_RouteMap_v3_Travel_Lock.md §12–§14.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cameraReducer, centerOn, clampPan, easeInOut, polylinePointAt, travelDuration, HOP_MS } from './camera.js';

const vp = { w: 372, h: 670 };
const sheet = { w: 744, h: 1160 };
const margin = { top: 56, bottom: 96, side: 48 };

test('§13: camera before a fight === camera after Continue (overlays never move the camera)', () => {
  const before = cameraReducer({ pan: null }, { type: 'center', pt: { x: 400, y: 900 }, vp, sheet, margin });
  const afterFight = cameraReducer(before, { type: 'fightStart' });
  const afterEnd = cameraReducer(afterFight, { type: 'fightEnd' });
  const afterContinue = cameraReducer(afterEnd, { type: 'resultsContinue' });
  const afterSanct = cameraReducer(afterContinue, { type: 'sanctuary' });
  assert.equal(afterFight, before);
  assert.equal(afterEnd, before);
  assert.equal(afterContinue, before);
  assert.equal(afterSanct, before);
  assert.deepEqual(afterContinue.pan, before.pan);
});

test('centre / clamp: the party lands in the band between the HUD strip and the bottom cards, inside the sheet', () => {
  const pan = centerOn({ x: 400, y: 600 }, vp, sheet, margin);
  const midY = (margin.top + (vp.h - margin.bottom)) / 2;
  assert.equal(Math.round(pan.y + 600), Math.round(midY));
  const c = clampPan({ x: 500, y: -5000 }, vp, sheet);
  assert.deepEqual(c, { x: 0, y: vp.h - sheet.h });
});

test('§14: one continuous tween — 450 ms per hop, eased only at the ends, lands exactly on the destination', () => {
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
