/**
 * The shared lattice geometry — docs/Eldrathor_Growth_Model_Lock.md §1. Axial hex coordinates (q, r),
 * flat-top hexes: the Core at the centre, ring 1 (6 hexes, foundation), ring 2 (12, refinement),
 * ring 3 (18, mastery) and four finisher hexes at the compass points of the outer edge (ring 4).
 * The two proc hexes sit in ring 2, opposite each other. One geometry for every class — a class only
 * changes what is written on the facets.
 */
export const CORE_ID = 'core';
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]; // flat-top axial neighbours

export const hexDistance = (a, b = { q: 0, r: 0 }) => {
  const dq = a.q - b.q, dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
};

/** Every hex at distance `n` from the centre, walking the ring from the north corner clockwise. */
export function ring(n) {
  if (n === 0) return [{ q: 0, r: 0 }];
  const out = [];
  let q = 0, r = -n; // the north corner
  const walk = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
  for (const [dq, dr] of walk) for (let k = 0; k < n; k++) { out.push({ q, r }); q += dq; r += dr; }
  return out;
}

export const hexId = ({ q, r }) => (q === 0 && r === 0 ? CORE_ID : `h${q}_${r}`);

/** The four compass points of the outer edge (ring 4): N and S are corners, E and W are edge hexes. */
export const COMPASS = { N: { q: 0, r: -4 }, E: { q: 4, r: -2 }, S: { q: 0, r: 4 }, W: { q: -4, r: 2 } };
/** The two proc hexes: ring 2, opposite each other (east and west edge hexes). */
export const PROC_HEXES = [{ q: 2, r: -1 }, { q: -2, r: 1 }];

/** Flat-top pixel centre for a hex of circumradius `size`. */
export const hexToPixel = ({ q, r }, size = 1) => ({ x: size * 1.5 * q, y: size * Math.sqrt(3) * (r + q / 2) });
/** The six corner points of a flat-top hex, as an SVG `points` string. */
export const hexPoints = (cx, cy, size) => Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i);
  return `${(cx + size * Math.cos(a)).toFixed(2)},${(cy + size * Math.sin(a)).toFixed(2)}`;
}).join(' ');

/**
 * The geometry: `{ id, ring, pos, neighbors, slot }` for the Core's 40 surrounding hexes.
 * `ring` is 1–3 for the rings and 4 for the compass finishers; `slot` names a special hex
 * ('proc-0' | 'proc-1' | 'finisher-N' | …). Neighbours are hexes of THIS geometry at distance 1
 * (the Core included), so adjacency gating needs nothing else.
 */
export function buildGeometry() {
  const cells = [];
  for (const n of [1, 2, 3]) for (const pos of ring(n)) cells.push({ id: hexId(pos), ring: n, pos, slot: null });
  PROC_HEXES.forEach((p, i) => { const c = cells.find((x) => x.id === hexId(p)); c.slot = `proc-${i}`; });
  for (const [k, pos] of Object.entries(COMPASS)) cells.push({ id: hexId(pos), ring: 4, pos, slot: `finisher-${k}` });
  const ids = new Set([CORE_ID, ...cells.map((c) => c.id)]);
  for (const c of cells) {
    c.neighbors = DIRS.map(([dq, dr]) => hexId({ q: c.pos.q + dq, r: c.pos.r + dr })).filter((id) => ids.has(id));
  }
  return cells;
}

export const GEOMETRY = Object.freeze(buildGeometry());
export const RING_SIZES = { 1: 6, 2: 12, 3: 18, 4: 4 };
