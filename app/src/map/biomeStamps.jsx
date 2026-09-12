/**
 * Parchment biome stamps for the location / node travel map.
 * Lock: docs/Eldrathor_NodeMap_Art_Lock.md — hand-drawn route map, fog of war,
 * simple biome stamps (Canvas-of-Kings-ish but sparser). Forge / castle render as
 * INTERIOR rooms + hallways that appear as the party advances.
 *
 * All marks are deterministic per node (seeded from node coords) so nothing
 * shuffles between renders or when new nodes are revealed.
 *
 * DESIGN-OPEN: final stamp asset pack; peninsula town stamp language (ruined
 * coastal outpost used as the candidate); exact fog reveal VFX.
 */

export const INK = '#4a3620';
export const INK_FILL = 'rgba(74,54,32,0.12)';
const CRYSTAL_INK = '#2f6a86';
const CRYSTAL_FILL = 'rgba(95,160,200,0.28)';
const WALL = '#3b2a18';
const FLOOR = '#eedcb0';
const FLOOR_CLEARED = '#f7ecd2';

export const BIOMES = {
  forest: { id: 'forest', label: 'Shoreline woods', interior: false },
  // DESIGN-OPEN: peninsula town stamp language — ruined coastal outpost is the candidate.
  outpost: { id: 'outpost', label: 'Ruined outpost', interior: false, designOpen: true },
  cliffs: { id: 'cliffs', label: 'Ravine cliffs', interior: false },
  forge: { id: 'forge', label: 'Forge interior', interior: true },
  castle: { id: 'castle', label: 'Castle halls', interior: true, castle: true },
  summit: { id: 'summit', label: 'Crystal summit', interior: false },
};

/**
 * Biome per area (docs/Eldrathor_Island_Areas_Lock.md). Stamp language is locked for forest /
 * cliffs / forge interior / castle interior / summit; the rest reuse the closest set.
 * // DESIGN-OPEN: dedicated stamps for Serpent's Stair (bridges), Ashfall Strand (cinder beach),
 * Hollow Ward (warded streets) and Drowned Quay (the peninsula ruined-outpost candidate).
 */
export function biomeForArea(area) {
  switch (area?.id) {
    case 1: return BIOMES.forest;
    case 2: return BIOMES.cliffs;
    case 3: return BIOMES.outpost;
    case 4: return BIOMES.cliffs;
    case 5: return BIOMES.cliffs;
    case 6: return BIOMES.castle;
    case 7: return BIOMES.forge;
    case 8: return BIOMES.castle;
    case 9: return BIOMES.summit;
    default: return BIOMES.forest;
  }
}
export const biomeForWorld = biomeForArea;

/* ---------- seeded helpers ---------- */

function mulberry32(a) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (n, salt = 0) =>
  (Math.floor(n.x * 7919) ^ Math.floor(n.y * 104729) ^ Math.imul(salt + 1, 2654435761)) >>> 0;

/** Scatter 3–5 stamp spots around a node, avoiding node markers and each other. */
function stampSpots(node, allNodes, rng, count) {
  const spots = [];
  let tries = 0;
  while (spots.length < count && tries < count * 8) {
    tries++;
    const a = rng() * Math.PI * 2;
    const r = 46 + rng() * 52;
    const x = node.x + Math.cos(a) * r;
    const y = node.y + Math.sin(a) * r;
    if (allNodes.some((o) => Math.hypot(o.x - x, o.y - y) < 42)) continue;
    if (spots.some((s) => Math.hypot(s.x - x, s.y - y) < 24)) continue;
    spots.push({ x, y, v: rng() });
  }
  return spots;
}

/* ---------- individual stamps (ink line art) ---------- */

const strokeProps = { fill: INK_FILL, stroke: INK, strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' };

function drawPine(x, y, key) {
  return (
    <path
      key={key}
      {...strokeProps}
      d={`M${x} ${y - 13} L${x + 7} ${y - 2} L${x + 3} ${y - 2} L${x + 9} ${y + 8} L${x - 9} ${y + 8} L${x - 3} ${y - 2} L${x - 7} ${y - 2} Z M${x} ${y + 8} v5`}
    />
  );
}

function drawOak(x, y, key) {
  return (
    <g key={key} {...strokeProps}>
      <circle cx={x} cy={y - 3} r={7.5} />
      <path d={`M${x} ${y + 4} v8 M${x - 3} ${y - 3} q3 -4 6 0`} fill="none" />
    </g>
  );
}

function drawPier(x, y, key) {
  return (
    <path
      key={key}
      {...strokeProps}
      fill="none"
      d={`M${x - 14} ${y} h9 M${x - 1} ${y} h4 M${x + 8} ${y} h7 M${x - 10} ${y - 5} v10 M${x + 1} ${y - 5} v10 M${x + 12} ${y - 5} v10 M${x + 3} ${y + 8} q4 -2 8 0`}
    />
  );
}

function drawRuin(x, y, key) {
  return (
    <path
      key={key}
      {...strokeProps}
      d={`M${x - 10} ${y + 8} v-12 h7 l3 -6 l4 6 M${x + 10} ${y + 8} v-8 M${x - 10} ${y + 8} h20 M${x - 3} ${y - 2} l7 10 M${x + 4} ${y - 4} l6 4`}
    />
  );
}

function drawRidge(x, y, key) {
  return (
    <path
      key={key}
      {...strokeProps}
      d={`M${x - 18} ${y + 5} l6 -11 l5 6 l6 -13 l5 8 l6 -6 l5 11 Z M${x - 11} ${y + 9} l-3 4 M${x - 1} ${y + 9} l-3 4 M${x + 9} ${y + 9} l-3 4`}
    />
  );
}

function drawShard(x, y, key) {
  return (
    <path
      key={key}
      fill={CRYSTAL_FILL}
      stroke={CRYSTAL_INK}
      strokeWidth={1.5}
      strokeLinejoin="round"
      d={`M${x} ${y - 13} L${x + 6} ${y - 3} L${x + 3} ${y + 8} L${x - 3} ${y + 8} L${x - 6} ${y - 3} Z M${x} ${y - 13} L${x} ${y + 8}`}
    />
  );
}

function pickStamp(biomeId, v) {
  switch (biomeId) {
    case 'forest': return v < 0.7 ? drawPine : drawOak;
    case 'outpost': return v < 0.45 ? drawPier : v < 0.85 ? drawRuin : drawOak;
    case 'cliffs': return v < 0.8 ? drawRidge : drawPine;
    case 'summit': return v < 0.7 ? drawShard : drawRidge;
    default: return drawPine;
  }
}

/** Outdoor biomes: scatter stamps around every revealed node. */
export function renderStamps({ territory, biome }) {
  const revealed = territory.nodes.filter((n) => n.revealed);
  return revealed.map((n) => {
    const rng = mulberry32(seedOf(n, 1));
    const count = 3 + Math.floor(rng() * 3);
    const spots = stampSpots(n, territory.nodes, rng, count);
    return (
      <g key={`st-${n.id}`}>
        {spots.map((s, i) => {
          const draw = pickStamp(biome.id, s.v);
          return draw(s.x, s.y, i);
        })}
      </g>
    );
  });
}

/** Outdoor biomes: hand-drawn dashed routes between revealed nodes. */
export function renderPaths({ territory, byId }) {
  return territory.edges.map(([a, b]) => {
    const na = byId[a];
    const nb = byId[b];
    if (!na || !nb) return null;
    if (!na.revealed && !nb.revealed) return null;
    const both = na.revealed && nb.revealed;
    const rng = mulberry32(seedOf(na, 3) ^ seedOf(nb, 5));
    const mx = (na.x + nb.x) / 2 + (rng() - 0.5) * 44;
    const my = (na.y + nb.y) / 2 + (rng() - 0.5) * 44;
    return (
      <path
        key={`${a}-${b}`}
        d={`M${na.x} ${na.y} Q${mx} ${my} ${nb.x} ${nb.y}`}
        fill="none"
        stroke={INK}
        strokeWidth={both ? 2 : 1.5}
        strokeDasharray={both ? '7 5' : '2 7'}
        strokeLinecap="round"
        opacity={both ? 0.85 : 0.5}
      />
    );
  });
}

/**
 * Interior biomes (forge / castle): each revealed node is a walled ROOM and each
 * edge is a HALLWAY with walls. Halls to unrevealed rooms run off into the fog.
 */
export function renderInterior({ territory, byId, biome }) {
  const rooms = territory.nodes
    .filter((n) => n.revealed)
    .map((n) => {
      const rng = mulberry32(seedOf(n, 11));
      const w = 86 + rng() * 42;
      const h = 68 + rng() * 34;
      return { n, w, h, x: n.x - w / 2, y: n.y - h / 2 };
    });
  const halls = territory.edges.filter(([a, b]) => byId[a]?.revealed || byId[b]?.revealed);
  const line = ([a, b], i, props) => (
    <line key={`${a}-${b}-${i}`} x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y} {...props} />
  );

  return (
    <g>
      {halls.map((e) => line(e, 'w', { stroke: WALL, strokeWidth: 26, strokeLinecap: 'round' }))}
      {rooms.map((r) => (
        <rect key={`rw-${r.n.id}`} x={r.x} y={r.y} width={r.w} height={r.h} rx={2} fill={FLOOR} stroke={WALL} strokeWidth={5} />
      ))}
      {halls.map((e) => line(e, 'f', { stroke: FLOOR, strokeWidth: 16, strokeLinecap: 'butt' }))}
      {rooms.map((r) => (
        <rect key={`rf-${r.n.id}`} x={r.x + 2.5} y={r.y + 2.5} width={r.w - 5} height={r.h - 5} fill={r.n.cleared ? FLOOR_CLEARED : FLOOR} />
      ))}
      {biome.castle &&
        rooms.map((r) => {
          const teeth = [];
          for (let tx = r.x + 6; tx < r.x + r.w - 8; tx += 14) {
            teeth.push(<rect key={tx} x={tx} y={r.y - 8} width={7} height={7} fill={WALL} />);
          }
          return <g key={`cr-${r.n.id}`}>{teeth}</g>;
        })}
      {biome.id === 'forge' &&
        rooms.map((r) => (
          // ember brazier mark in one corner — reads "forge", not outdoor
          <g key={`em-${r.n.id}`} stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round">
            <path d={`M${r.x + 12} ${r.y + r.h - 10} h10 M${r.x + 14} ${r.y + r.h - 10} v-5 h6 v5 M${r.x + 17} ${r.y + r.h - 16} q-3 -4 0 -7 q3 3 0 7`} />
          </g>
        ))}
    </g>
  );
}

/** Convenience: full biome layer for a territory. */
export function renderBiomeLayer({ territory, byId, biome }) {
  if (biome.interior) return renderInterior({ territory, byId, biome });
  return (
    <>
      {renderStamps({ territory, biome })}
      {renderPaths({ territory, byId })}
    </>
  );
}
