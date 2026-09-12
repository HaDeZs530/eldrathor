/**
 * Island route — LOCKED pins + bend points (docs/Eldrathor_Island_Path_Lock.md).
 * Coordinates are % of the island art (origin top-left). Pin 1 = Veinharbor; pins 2–10 =
 * the nine areas in docs/Eldrathor_Island_Areas_Lock.md (`AREAS[i].pin`).
 * The route is drawn in CODE as a Catmull-Rom spline (no PNG overlays); 4→5 runs behind
 * the castle so only two short stubs exist and the middle is never drawn.
 */

export const ISLAND_PINS = [
  { n: 1, x: 47, y: 73, label: 'Veinharbor' },
  { n: 2, x: 28, y: 62, label: 'Shore trail' },
  { n: 3, x: 17, y: 38, label: 'West cliffs' },
  { n: 4, x: 32, y: 15, label: 'NW shore' },
  { n: 5, x: 68, y: 24, label: 'NE lookout' },
  { n: 6, x: 78, y: 54, label: 'East coast' },
  { n: 7, x: 58, y: 55, label: 'East ruins' },
  { n: 8, x: 38, y: 48, label: 'Forge gate' },
  { n: 9, x: 42, y: 28, label: 'High walls' },
  { n: 10, x: 51, y: 22, label: 'Crystal' },
];

/** Suggested bend points per segment (lock table). 4→5 handled by the stubs below. */
export const BENDS = {
  '1-2': [[40, 70], [33, 66]],
  '2-3': [[22, 55], [18, 46]],
  '3-4': [[16, 28], [22, 20]],
  '5-6': [[74, 34], [78, 44]],
  '6-7': [[70, 56]],
  '7-8': [[52, 60], [45, 58]],
  '8-9': [[39, 38]],
  '9-10': [[46, 24]],
};
export const STUB_A_END = [38, 12];
export const STUB_B_START = [62, 16];

const pinXY = (n) => {
  const p = ISLAND_PINS[n - 1];
  return [p.x, p.y];
};

/** Two open polylines in % space: [harbor → pin 4 → stub A] and [stub B → pin 5 → pin 10]. */
export function islandRoutePolylines() {
  const a = [pinXY(1)];
  for (let n = 1; n < 4; n++) a.push(...(BENDS[`${n}-${n + 1}`] || []), pinXY(n + 1));
  a.push(STUB_A_END);
  const b = [STUB_B_START, pinXY(5)];
  for (let n = 5; n < 10; n++) b.push(...(BENDS[`${n}-${n + 1}`] || []), pinXY(n + 1));
  return [a, b];
}

const fmt = (v) => Math.round(v * 10) / 10;

/** Catmull-Rom spline through pts → SVG path `d` (cubic beziers); endpoints duplicated. */
export function catmullRomPath(pts, tension = 0.85) {
  if (pts.length < 2) return '';
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const k = tension / 6;
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[i + 2];
    const c1x = p1[0] + (p2[0] - p0[0]) * k;
    const c1y = p1[1] + (p2[1] - p0[1]) * k;
    const c2x = p2[0] - (p3[0] - p1[0]) * k;
    const c2y = p2[1] - (p3[1] - p1[1]) * k;
    d += ` C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d;
}

/** Route path strings in image-pixel space. */
export function islandRoutePaths(imgW, imgH) {
  return islandRoutePolylines().map((poly) => catmullRomPath(poly.map(([x, y]) => [(x / 100) * imgW, (y / 100) * imgH])));
}
