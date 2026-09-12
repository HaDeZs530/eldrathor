/**
 * Route map generator — docs/Eldrathor_RouteMap_v2_Lock.md §1, §3, §4.
 * Single connected WEB (not a tree): 30–45 nodes (tier 9: 45+), entrance at the south
 * edge, boss at the far (north) edge with quadrant variance, cross-links so paths rejoin
 * (≥4 loops, 30–40% of non-entrance nodes with ≥3 edges), texture (quiet trails, dense
 * clusters, dead-ends, long-edge curiosity nodes), depth by BFS, five node types incl.
 * Sanctuary, 2–3 roaming rares, sealed boss. Deterministic when `opts.rng` is seeded.
 */

const WIDTH = 900;
const HEIGHT = 1400;
const MIN_SEP = 70;

const irand = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const rand = (rng, a, b) => a + rng() * (b - a);
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const shuffle = (rng, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function bfsDepths(adj, from) {
  const depth = new Map([[from, 0]]);
  const q = [from];
  while (q.length) {
    const c = q.shift();
    for (const n of adj[c] || []) {
      if (!depth.has(n)) {
        depth.set(n, depth.get(c) + 1);
        q.push(n);
      }
    }
  }
  return depth;
}

function shortestPath(adj, from, to) {
  const prev = new Map([[from, null]]);
  const q = [from];
  while (q.length) {
    const c = q.shift();
    if (c === to) break;
    for (const n of adj[c] || []) {
      if (!prev.has(n)) {
        prev.set(n, c);
        q.push(n);
      }
    }
  }
  if (!prev.has(to)) return null;
  const path = [];
  for (let c = to; c != null; c = prev.get(c)) path.push(c);
  return path.reverse();
}

function makeNode(id, x, y) {
  return {
    id, x, y,
    type: 'normal',
    revealed: false,
    typeKnown: false,
    scouted: false,
    cleared: false,
    respawned: false,
    namedRare: false,
    sanctuaryUsed: false,
    depth: 0,
    depth01: 0,
    neighbors: [],
  };
}

/**
 * @param {{id:number, tier:number}} area
 * @param {{rng?:()=>number, nodeCount?:number}} [opts]
 */
export function genTerritory(area, opts = {}) {
  const rng = opts.rng || Math.random;
  const tier = area?.tier || 1;
  const targetCount = opts.nodeCount ?? (tier >= 9 ? irand(rng, 45, 52) : irand(rng, 30, 45));

  // Texture budget is carved out of the total so the map still lands in range.
  const trailCount = irand(rng, 1, 2);
  const clusterCount = irand(rng, 1, 2);
  const curiosityCount = irand(rng, 1, 2);
  const trailLens = Array.from({ length: trailCount }, () => irand(rng, 3, 4));
  const textureNodes = trailLens.reduce((a, b) => a + b, 0) + clusterCount * 3 + curiosityCount;
  const baseCount = Math.max(18, targetCount - textureNodes);

  const nodes = [];
  const inBounds = (x, y) => x >= 40 && x <= WIDTH - 40 && y >= 40 && y <= HEIGHT - 40;
  const farEnough = (x, y, sep = MIN_SEP) => nodes.every((n) => Math.hypot(n.x - x, n.y - y) >= sep);
  const add = (x, y) => {
    const n = makeNode(`n${nodes.length}`, x, y);
    nodes.push(n);
    return n;
  };

  // --- entrance (south edge) and boss (north edge, quadrant variance) ---
  const entrance = add(WIDTH * 0.5 + rand(rng, -60, 60), HEIGHT - 90);
  const boss = add(WIDTH * rand(rng, 0.2, 0.8), rand(rng, 80, 200));

  // --- base scatter ---
  let attempts = 0;
  while (nodes.length < baseCount && attempts < baseCount * 120) {
    attempts++;
    const x = rand(rng, 60, WIDTH - 60);
    const y = rand(rng, 240, HEIGHT - 170);
    if (farEnough(x, y)) add(x, y);
  }

  // --- adjacency helpers ---
  const adj = {};
  const edges = [];
  const edgeSet = new Set();
  const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const has = (a, b) => edgeSet.has(key(a, b));
  const link = (a, b) => {
    if (a === b || has(a, b)) return false;
    edgeSet.add(key(a, b));
    edges.push([a, b]);
    (adj[a] ||= []).push(b);
    (adj[b] ||= []).push(a);
    return true;
  };
  for (const n of nodes) adj[n.id] = [];
  const deg = (id) => (adj[id] || []).length;

  // sparse base: nearest neighbour only (cross-links add the loops deliberately below)
  const baseNodes = [...nodes];
  for (const n of baseNodes) {
    const near = baseNodes.filter((o) => o !== n).map((o) => ({ o, d: dist(n, o) })).sort((a, b) => a.d - b.d);
    if (near.length && near[0].d < 260) link(n.id, near[0].o.id);
  }
  // the entrance always opens onto 2–3 nodes (first reveal = 2–3 frontier nodes)
  {
    const near = baseNodes.filter((o) => o !== entrance && o !== boss).sort((a, b) => dist(entrance, a) - dist(entrance, b));
    const want = irand(rng, 2, 3);
    for (let i = 0; i < want && i < near.length; i++) link(entrance.id, near[i].id);
  }

  // connectivity: join components by their closest pair
  const componentOf = () => {
    const comp = new Map();
    let c = 0;
    for (const n of nodes) {
      if (comp.has(n.id)) continue;
      const stack = [n.id];
      comp.set(n.id, c);
      while (stack.length) {
        const cur = stack.pop();
        for (const m of adj[cur]) if (!comp.has(m)) { comp.set(m, c); stack.push(m); }
      }
      c++;
    }
    return { comp, count: c };
  };
  for (let guard = 0; guard < 200; guard++) {
    const { comp, count } = componentOf();
    if (count <= 1) break;
    let best = null;
    for (const a of nodes) for (const b of nodes) {
      if (comp.get(a.id) === comp.get(b.id)) continue;
      const d = dist(a, b);
      if (!best || d < best.d) best = { a, b, d };
    }
    if (!best) break;
    link(best.a.id, best.b.id);
  }

  // --- texture: quiet trails (chains of 3–4 single-edge nodes) ---
  const roots = shuffle(rng, baseNodes.filter((n) => n !== entrance && n !== boss && deg(n.id) <= 2));
  for (let t = 0; t < trailCount && roots.length; t++) {
    let prev = roots.pop();
    const ang = rand(rng, 0, Math.PI * 2);
    for (let i = 0; i < trailLens[t]; i++) {
      let placed = null;
      for (let tries = 0; tries < 12 && !placed; tries++) {
        const a = ang + rand(rng, -0.6, 0.6);
        const x = prev.x + Math.cos(a) * rand(rng, 85, 110);
        const y = prev.y + Math.sin(a) * rand(rng, 85, 110);
        if (inBounds(x, y) && farEnough(x, y, 60)) placed = add(x, y);
      }
      if (!placed) break;
      adj[placed.id] = [];
      link(prev.id, placed.id);
      prev = placed;
    }
  }
  // dense clusters (3 extra nodes tightly around an anchor, interlinked)
  const anchors = shuffle(rng, baseNodes.filter((n) => n !== entrance && n !== boss));
  for (let c = 0; c < clusterCount && anchors.length; c++) {
    const anchor = anchors.pop();
    const members = [];
    for (let i = 0; i < 3; i++) {
      for (let tries = 0; tries < 12; tries++) {
        const a = rand(rng, 0, Math.PI * 2);
        const x = anchor.x + Math.cos(a) * rand(rng, 70, 95);
        const y = anchor.y + Math.sin(a) * rand(rng, 70, 95);
        if (inBounds(x, y) && farEnough(x, y, 55)) { const m = add(x, y); adj[m.id] = []; members.push(m); break; }
      }
    }
    for (const m of members) link(anchor.id, m.id);
    for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) if (dist(members[i], members[j]) < 150) link(members[i].id, members[j].id);
  }
  // long-edge curiosity nodes (single long edge to a lone node)
  const curiosityFrom = shuffle(rng, baseNodes.filter((n) => n !== entrance && n !== boss));
  for (let c = 0; c < curiosityCount && curiosityFrom.length; c++) {
    const from = curiosityFrom.pop();
    for (let tries = 0; tries < 20; tries++) {
      const a = rand(rng, 0, Math.PI * 2);
      const x = from.x + Math.cos(a) * rand(rng, 320, 420);
      const y = from.y + Math.sin(a) * rand(rng, 320, 420);
      if (inBounds(x, y) && farEnough(x, y, 120)) { const m = add(x, y); adj[m.id] = []; link(from.id, m.id); break; }
    }
  }

  // top-up: texture placement can fail near the edges — keep the map inside the size band
  const minCount = tier >= 9 ? 45 : 30;
  for (let tries = 0; nodes.length < Math.max(minCount, targetCount - 2) && tries < 400; tries++) {
    const x = rand(rng, 60, WIDTH - 60);
    const y = rand(rng, 240, HEIGHT - 170);
    if (!farEnough(x, y)) continue;
    const m = add(x, y);
    adj[m.id] = [];
    const nearest = baseNodes.filter((o) => o !== m).sort((a, b) => dist(m, a) - dist(m, b))[0];
    if (nearest) link(m.id, nearest.id);
    baseNodes.push(m);
  }

  // --- cross-links: ≥4 loops and 30–40% of non-entrance nodes with ≥3 edges ---
  const textureIds = new Set(nodes.slice(baseNodes.length).map((n) => n.id));
  const nonEntrance = () => nodes.filter((n) => n !== entrance);
  const degShare = () => nonEntrance().filter((n) => deg(n.id) >= 3).length / nonEntrance().length;
  const loops = () => edges.length - nodes.length + 1;
  const shareTarget = rand(rng, 0.31, 0.39);
  for (let guard = 0; guard < 400 && (degShare() < shareTarget || loops() < 4); guard++) {
    const cands = shuffle(rng, baseNodes.filter((n) => n !== entrance && deg(n.id) <= 2));
    let linked = false;
    for (const n of cands) {
      const near = baseNodes
        .filter((o) => o !== n && !textureIds.has(o.id) && !has(n.id, o.id) && deg(o.id) <= 3 && dist(n, o) < 300)
        .sort((a, b) => dist(n, a) - dist(n, b));
      if (near.length) { link(n.id, near[0].id); linked = true; break; }
    }
    if (!linked) {
      // widen the reach once nearby options are exhausted
      const n = pick(rng, baseNodes.filter((o) => o !== entrance));
      const far = baseNodes.filter((o) => o !== n && !has(n.id, o.id) && dist(n, o) < 420).sort((a, b) => dist(n, a) - dist(n, b))[0];
      if (far) link(n.id, far.id); else break;
    }
  }
  // prune: if the web came out denser than 40%, drop edges between two ≥3-degree nodes
  // while the graph stays connected and keeps ≥4 loops
  const connectedWithout = (a, b) => {
    const seen = new Set([a]);
    const stack = [a];
    while (stack.length) {
      const c = stack.pop();
      for (const m of adj[c]) {
        if ((c === a && m === b) || (c === b && m === a)) continue;
        if (!seen.has(m)) { seen.add(m); stack.push(m); }
      }
    }
    return seen.size === nodes.length;
  };
  const unlink = (a, b) => {
    edgeSet.delete(key(a, b));
    const i = edges.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
    if (i >= 0) edges.splice(i, 1);
    adj[a] = adj[a].filter((m) => m !== b);
    adj[b] = adj[b].filter((m) => m !== a);
  };
  for (let guard = 0; guard < 200 && degShare() > 0.4 && loops() > 4; guard++) {
    const cands = shuffle(rng, edges.filter(([a, b]) => a !== entrance.id && b !== entrance.id && deg(a) >= 3 && deg(b) >= 3));
    let cut = false;
    for (const [a, b] of cands) {
      if (connectedWithout(a, b)) { unlink(a, b); cut = true; break; }
    }
    if (!cut) break;
  }
  // guarantee a path entrance → boss
  if (!shortestPath(adj, entrance.id, boss.id)) link(entrance.id, boss.id);
  // no isolates
  for (const n of nodes) if (deg(n.id) === 0) {
    const nearest = nodes.filter((o) => o !== n).sort((a, b) => dist(n, a) - dist(n, b))[0];
    if (nearest) link(n.id, nearest.id);
  }

  // --- depth (BFS from entrance, normalised by the boss's depth) ---
  const depths = bfsDepths(adj, entrance.id);
  const bossDepth = Math.max(1, depths.get(boss.id) || 1);
  for (const n of nodes) {
    n.depth = depths.get(n.id) ?? bossDepth;
    n.depth01 = Math.max(0, Math.min(1, n.depth / bossDepth));
    n.neighbors = [...adj[n.id]];
  }

  // --- node types ---
  boss.type = 'boss';
  const entranceAdj = new Set(adj[entrance.id]);
  const bossAdj = new Set(adj[boss.id]);
  const pool = nodes.filter((n) => n !== entrance && n !== boss);

  // rares: 2–3, away from the entrance and not next to the boss
  const rareCount = irand(rng, 2, 3);
  const rareHosts = shuffle(rng, pool.filter((n) => n.depth >= 2 && !entranceAdj.has(n.id) && !bossAdj.has(n.id))).slice(0, rareCount);
  const rares = rareHosts.map((n, i) => ({ id: `r${i}`, nodeId: n.id, alive: true }));
  const rareHostIds = new Set(rareHosts.map((n) => n.id));

  // sanctuaries: 2–4, never adjacent to each other or to the entrance
  const sanctCount = irand(rng, 2, 4);
  const sanctuaries = [];
  for (const n of shuffle(rng, pool.filter((n) => !entranceAdj.has(n.id) && !rareHostIds.has(n.id) && !bossAdj.has(n.id)))) {
    if (sanctuaries.length >= sanctCount) break;
    if (sanctuaries.some((s) => adj[s.id].includes(n.id))) continue;
    n.type = 'sanctuary';
    sanctuaries.push(n);
  }

  // crystals: 12–18% of the rest, biased off the entrance→boss drift
  const path = new Set(shortestPath(adj, entrance.id, boss.id) || []);
  const rest = pool.filter((n) => n.type === 'normal' && !rareHostIds.has(n.id));
  const crystalCount = Math.round(rest.length * rand(rng, 0.12, 0.18));
  const crystalTargets = [...shuffle(rng, rest.filter((n) => !path.has(n.id))), ...shuffle(rng, rest.filter((n) => path.has(n.id)))];
  for (let i = 0; i < crystalCount && i < crystalTargets.length; i++) crystalTargets[i].type = 'crystal';

  // --- fog: entrance cleared + 2–3 neighbours revealed (positions only) ---
  entrance.cleared = true;
  entrance.revealed = true;
  entrance.typeKnown = true;
  entrance.scouted = true;
  const firstReveal = shuffle(rng, adj[entrance.id]).slice(0, Math.min(adj[entrance.id].length, irand(rng, 2, 3)));
  for (const id of firstReveal) nodes.find((n) => n.id === id).revealed = true;

  return {
    nodes,
    edges,
    entranceId: entrance.id,
    bossId: boss.id,
    width: WIDTH,
    height: HEIGHT,
    areaId: area?.id ?? null,
    tier,
    bossDepth,
    rares,
    clock: 0,
    sealBroken: rares.length === 0,
    stats: { loops: loops(), deg3Share: degShare(), count: nodes.length, sanctuaries: sanctuaries.length, crystals: crystalCount },
  };
}

export default genTerritory;
