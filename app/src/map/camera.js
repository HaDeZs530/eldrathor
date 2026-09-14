/**
 * Route map camera + travel tween — docs/Eldrathor_RouteMap_v3_Travel_Lock.md §12–§17.
 * Pure math so it can be tested: pan clamping, centring on a map point, the continuous
 * polyline tween (§16: 600 ms per hop, ease-in-out at the ends only), camera *framing*
 * requests (§17: far node in the upper 60 %, adjacent = party + node, recentre on the party
 * under the overlay before it fades) and the camera reducer.
 *
 * The camera is `{ pan, motion, focus }`. `focus` is a framing request that the map resolves
 * to a pan at render time with `resolveFocus` (it needs the viewport + sheet size); a drag or
 * the end of a travel tween replaces it with a concrete pan.
 */

// Anthony 2026-09-13: "slow down the movement of the party and the panning speed of the map" — amends §16's 600 ms/hop.
export const HOP_MS = 900;
export const SKIP_MS = 300;
/**
 * Camera rule (Anthony 2026-09-14: "pan to centre, slowly"). Every move ENDS centred on the point
 * of interest — the tapped node, or the party during and after travel — and always GETS there by a
 * slow, smooth pan from wherever the camera is. Never a snap, never a cut.
 */
/** Follow smoothing during travel: time constant of the exponential lag (ms) — slow and fluid. */
export const FOLLOW_TAU_MS = 450;
/** Safe frame kept for `keepInFrame` (drag-release helpers / tests); no longer the tap rule. */
export const SAFE_FRAME = { left: 0.18, right: 0.82, top: 0.2, bottom: 0.58 };
/** Every camera ease is ≥ 250 ms; pans to centre take 900 ms (CSS `.is-anim`) — never a cut. */
export const FRAME_EASE_MS = 900;
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
 * The smallest pan change that brings a sheet-space point inside the safe frame. Returns `basePan`
 * itself (same object) when the point is already inside — so callers can skip a no-op move.
 */
export function keepInFrame(pt, basePan, vp, sheet, safe = SAFE_FRAME) {
  if (!vp.w || !vp.h || !basePan) return basePan;
  const sx = pt.x + basePan.x; // screen position under the current pan
  const sy = pt.y + basePan.y;
  const L = vp.w * safe.left; const R = vp.w * safe.right;
  const T = vp.h * safe.top; const B = vp.h * safe.bottom;
  let dx = 0; let dy = 0;
  if (sx < L) dx = L - sx; else if (sx > R) dx = R - sx;
  if (sy < T) dy = T - sy; else if (sy > B) dy = B - sy;
  if (!dx && !dy) return basePan;
  return clampPan({ x: basePan.x + dx, y: basePan.y + dy }, vp, sheet);
}

/**
 * Resolve a framing request to a pan. `focus = { ids, mode }`:
*  - mode 'centre': centre the node in the HUD/card band — run start, and the slow pan onto the
 *    party as a Results / Sanctuary overlay closes;
 *  - mode 'keep': the minimal pan (from `basePan`) that keeps the node inside the safe frame.
 * `ptOf(id)` maps a node id to its sheet-space point (unknown ids are skipped).
 */
export function resolveFocus(focus, ptOf, vp, sheet, margin, basePan = null) {
  const pts = (focus?.ids || []).map(ptOf).filter(Boolean);
  if (!pts.length) return null;
  const c = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
  if (focus.mode === 'keep') return basePan ? keepInFrame(c, basePan, vp, sheet) : centerOn(c, vp, sheet, margin);
  return centerOn(c, vp, sheet, margin);
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
 * Camera reducer — the camera is explicit run state (§13: it lives outside the map component and
 * never resets). Drag moves it, release clamps it (eased by the view), a travel tween ends by
 * setting it, a tap sets a concrete minimal pan ('set' with motion 'ease', computed by the map
 * with keepInFrame), and 'overlayClose' asks for the minimal pan that keeps the party in frame.
 * Fight start never touches the camera.
 */
export function cameraReducer(cam, action) {
  const base = cam || { pan: null, motion: 'none', focus: null };
  switch (action.type) {
    case 'set': return { pan: action.pan, motion: action.motion || 'none', focus: null };
    case 'drag': return { pan: { x: action.basePan.x + action.dx, y: action.basePan.y + action.dy }, motion: 'none', focus: null };
    case 'release': return { pan: clampPan(base.pan || { x: 0, y: 0 }, action.vp, action.sheet), motion: 'ease', focus: null };
    case 'runStart': return { pan: null, motion: 'none', focus: { ids: [action.partyId], mode: 'centre' } };
    case 'overlayClose': return { ...base, motion: 'ease', focus: { ids: [action.partyId], mode: 'centre' } };
    case 'travelEnd': return { pan: action.pan, motion: 'none', focus: null };
    case 'fightStart': return base; // the overlay opens over the map exactly as it was
    default: return base;
  }
}
