/**
 * Route map camera + travel tween — docs/Eldrathor_RouteMap_v3_Travel_Lock.md §12–§14.
 * Pure math so it can be tested: pan clamping, centring on a map point, the continuous
 * polyline tween (450 ms per hop, ease-in-out at the ends only) and the camera reducer,
 * which is deliberately a no-op for fight/results/sanctuary events (§13: no recentring on return).
 */

export const HOP_MS = 450;
export const SKIP_MS = 200;
export const CARD_PAUSE_MS = 200;
export const OVERLAY_FADE_MS = 350;

/** Keep the sheet covering the viewport. */
export function clampPan(pan, vp, sheet) {
  if (!vp.w || !vp.h) return pan;
  const minX = Math.min(0, vp.w - sheet.w);
  const minY = Math.min(0, vp.h - sheet.h);
  return { x: Math.max(minX, Math.min(0, pan.x)), y: Math.max(minY, Math.min(0, pan.y)) };
}

/** Pan that centres a sheet-space point in the band between the HUD strip and the bottom cards. */
export function centerOn(pt, vp, sheet, margin) {
  const midY = (margin.top + (vp.h - margin.bottom)) / 2;
  return clampPan({ x: vp.w / 2 - pt.x, y: midY - pt.y }, vp, sheet);
}

/**
 * Ease at the START and END only (§14): the marker accelerates over the first `e` of the trip,
 * moves at constant speed through the middle, and decelerates over the last `e`. Applied once over
 * the whole trip — never per hop — so there is no hitch between hops.
 */
export const EASE_ENDS = 0.18;
export function easeInOut(u, e = EASE_ENDS) {
  const t = Math.max(0, Math.min(1, u));
  const norm = 1 - e; // area under the trapezoid velocity profile
  if (t < e) return (t * t) / (2 * e) / norm;
  if (t > 1 - e) return 1 - ((1 - t) * (1 - t)) / (2 * e) / norm;
  return (e / 2 + (t - e)) / norm;
}

/** Ease-out for the 200 ms skip. */
export function easeOut(u) {
  const t = Math.max(0, Math.min(1, u));
  return 1 - Math.pow(1 - t, 3);
}

export const travelDuration = (hops) => Math.max(0, hops) * HOP_MS;

/**
 * Point along a polyline at progress u ∈ [0,1], parametrised by hop (each segment takes an equal
 * share of u) so that 450 ms per hop holds regardless of edge length. u = 1 returns the exact
 * final point (no snap needed on arrival).
 */
export function polylinePointAt(points, u) {
  if (!points.length) return { x: 0, y: 0 };
  if (points.length === 1 || u <= 0) return { ...points[0] };
  if (u >= 1) return { ...points[points.length - 1] };
  const segs = points.length - 1;
  const f = u * segs;
  const i = Math.min(segs - 1, Math.floor(f));
  const k = f - i;
  const a = points[i];
  const b = points[i + 1];
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

/**
 * Camera reducer — the camera is explicit run state. Drag moves it, release clamps it (eased by
 * the view), travel frames set it directly, and fight / results / sanctuary events leave it
 * untouched (§13).
 */
export function cameraReducer(cam, action) {
  switch (action.type) {
    case 'set': return { pan: action.pan, motion: action.motion || 'none' };
    case 'drag': return { pan: { x: (cam.pan?.x ?? 0) + action.dx, y: (cam.pan?.y ?? 0) + action.dy }, motion: 'none' };
    case 'release': return { pan: clampPan(cam.pan || { x: 0, y: 0 }, action.vp, action.sheet), motion: 'ease' };
    case 'center': return { pan: centerOn(action.pt, action.vp, action.sheet, action.margin), motion: action.motion || 'ease' };
    case 'frame': return { pan: action.pan, motion: 'none' };
    case 'fightStart':
    case 'fightEnd':
    case 'resultsContinue':
    case 'sanctuary':
      return cam; // §13: overlays never touch the camera
    default: return cam;
  }
}
