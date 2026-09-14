/**
 * Route map generator — docs/Eldrathor_RouteMap_v2_Lock.md §1, §3, §4 and
 * docs/Eldrathor_RouteMap_v3_Travel_Lock.md §6, §11.
 *
 * PLANAR, OUTWARD web: nodes are laid out in depth bands from the entrance (south edge) to the
 * boss (north edge); candidate edges come from a Gabriel-graph pass over the positions (planar
 * by construction), kept only between equal or adjacent bands, guarded by a segment-intersection
 * test, then pruned to 2–4 edges per node while keeping connectivity and ≥4 loops. Texture
 * (dead-end spurs, quiet side trails, long-edge curiosity nodes) also passes the crossing test.
 * Five node types incl. Sanctuary, 2–3 roaming rares, sealed boss, named variants at generation.
 * Deterministic when `opts.rng` is seeded.
 */

const WIDTH = 900;
const HEIGHT = 1400;
const MIN_SEP = 72;
const X_MIN = 80;
const X_MAX = WIDTH - 80;
const Y_TOP = 110; // boss band centre
const Y_BOTTOM = HEIGHT - 100; // entrance band centre

const irand = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const rand = (rng, a, b) => a + rng() * (b - a);
const shuffle = (rng, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ---------- geometry ---------- */

function orient(p, q, r) {
  const v = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  if (Math.abs(v) < 1e-9) return 0;
  return v > 0 ? 1 : -1;
}
function onSegment(p, q, r) {
  return Math.min(p.x, r.x) - 1e-9 <= q.x && q.x <= Math.max(p.x, r.x) + 1e-9 && Math.min(p.y, r.y) - 1e-9 <= q.y && q.y <= Math.max(p.y, r.y) + 1e-9;
}
/** Proper or touching intersection of segments ab and cd (segments sharing an endpoint object do not count). */
export function segmentsCross(a, b, c, d) {
  if (a === c || a === d || b === c || b === d) return false;
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;
  return false;
}

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

function makeNode(id, x, y, band) {
  return {
    id, x, y, band,
    type: 'normal',
    revealed: false,
    typeKnown: false,
    scouted: false,
    cleared: false,
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

  // ---------- depth bands: band 0 = entrance (south), band B = boss (north) ----------
  const B = tier >= 9 ? 9 : irand(rng, 6, 8);
  const bandY = (i) => Y_BOTTOM - (i * (Y_BOTTOM - Y_TOP)) / B;
  const bandH = (Y_BOTTOM - Y_TOP) / B;

  const nodes = [];
  const add = (x, y, band) => {
    const n = makeNode(`n${nodes.length}`, x, y, band);
    nodes.push(n);
    return n;
  };
  const farEnough = (x, y, sep = MIN_SEP) => nodes.every((n) => Math.hypot(n.x - x, n.y - y) >= sep);

  const entrance = add(WIDTH * 0.5 + rand(rng, -60, 60), Y_BOTTOM, 0);
  const boss = add(rand(rng, X_MIN + 60, X_MAX - 60), Y_TOP + rand(rng, -20, 30), B);

  // texture budget carved out of the total
  const spurCount = irand(rng, 2, 3);
  const trailCount = irand(rng, 1, 2);
  const trailLen = 3;
  const curiosityCount = irand(rng, 1, 2);
  const mainCount = Math.max(16, targetCount - 2 - spurCount - trailCount * trailLen - curiosityCount);

  // distribute main nodes over bands 1..B-1 with a hump mid-map
  const inner = B - 1;
  const weights = Array.from({ length: inner }, (_, k) => 1 + Math.sin((Math.PI * (k + 1)) / (inner + 1)));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.max(2, Math.round((w / wsum) * mainCount)));
  for (let i = 1; i <= inner; i++) {
    const k = counts[i - 1];
    const slot = (X_MAX - X_MIN) / k;
    for (let j = 0; j < k; j++) {
      let placed = false;
      for (let tries = 0; tries < 10 && !placed; tries++) {
        const x = X_MIN + (j + 0.5 + rand(rng, -0.38, 0.38)) * slot;
        const y = bandY(i) + rand(rng, -0.3, 0.3) * bandH;
        if (farEnough(x, y)) { add(x, y, i); placed = true; }
      }
    }
  }

  // ---------- edges ----------
  const adj = {};
  const edges = [];
  const edgeSet = new Set();
  const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const has = (a, b) => edgeSet.has(key(a, b));
  const byId = () => Object.fromEntries(nodes.map((n) => [n.id, n]));
  const crossesAny = (a, b) => {
    const map = byId();
    return edges.some(([c, d]) => segmentsCross(a, b, map[c], map[d]));
  };
  const bandOk = (a, b) => Math.abs(a.band - b.band) <= 1;
  const link = (a, b) => {
    if (a === b || has(a.id, b.id)) return false;
    edgeSet.add(key(a.id, b.id));
    edges.push([a.id, b.id]);
    (adj[a.id] ||= []).push(b.id);
    (adj[b.id] ||= []).push(a.id);
    return true;
  };
  const tryLink = (a, b) => (bandOk(a, b) && !crossesAny(a, b) ? link(a, b) : false);
  const unlink = (a, b) => {
    edgeSet.delete(key(a, b));
    const i = edges.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
    if (i >= 0) edges.splice(i, 1);
    adj[a] = adj[a].filter((m) => m !== b);
    adj[b] = adj[b].filter((m) => m !== a);
  };
  for (const n of nodes) adj[n.id] = [];
  const deg = (id) => (adj[id] || []).length;
  const loops = () => edges.length - nodes.length + 1;
  const connected = (skipA = null, skipB = null) => {
    const seen = new Set([nodes[0].id]);
    const stack = [nodes[0].id];
    while (stack.length) {
      const c = stack.pop();
      for (const m of adj[c]) {
        if ((c === skipA && m === skipB) || (c === skipB && m === skipA)) continue;
        if (!seen.has(m)) { seen.add(m); stack.push(m); }
      }
    }
    return seen.size === nodes.length;
  };

  // Gabriel graph over the main layout (planar by construction), band-filtered
  const main = [...nodes];
  const gabriel = [];
  for (let i = 0; i < main.length; i++) {
    for (let j = i + 1; j < main.length; j++) {
      const a = main[i];
      const b = main[j];
      if (!bandOk(a, b)) continue;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const r2 = ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) / 4;
      let empty = true;
      for (const c of main) {
        if (c === a || c === b) continue;
        if ((c.x - mx) ** 2 + (c.y - my) ** 2 < r2 - 1e-6) { empty = false; break; }
      }
      if (empty) gabriel.push([a, b, Math.sqrt(r2 * 4)]);
    }
  }
  gabriel.sort((p, q) => p[2] - q[2]);
  for (const [a, b] of gabriel) if (!crossesAny(a, b)) link(a, b);

  // connectivity guard: join components with the shortest non-crossing band-adjacent edge
  for (let guard = 0; guard < 60 && !connected(); guard++) {
    const comp = new Map();
    let c = 0;
    for (const n of nodes) {
      if (comp.has(n.id)) continue;
      const stack = [n.id];
      comp.set(n.id, c);
      while (stack.length) { const cur = stack.pop(); for (const m of adj[cur]) if (!comp.has(m)) { comp.set(m, c); stack.push(m); } }
      c++;
    }
    let best = null;
    for (const a of nodes) for (const b of nodes) {
      if (comp.get(a.id) === comp.get(b.id) || !bandOk(a, b)) continue;
      const d = dist(a, b);
      if ((!best || d < best.d) && !crossesAny(a, b)) best = { a, b, d };
    }
    if (!best) {
      for (const a of nodes) for (const b of nodes) {
        if (comp.get(a.id) === comp.get(b.id)) continue;
        const d = dist(a, b);
        if ((!best || d < best.d) && !crossesAny(a, b)) best = { a, b, d };
      }
    }
    if (!best) break;
    link(best.a, best.b);
  }

  // entrance opens onto 2–3 nodes (first reveal = 2–3 frontier nodes)
  {
    const want = irand(rng, 2, 3);
    const near = nodes.filter((o) => o !== entrance && o !== boss && o.band === 1).sort((a, b) => dist(entrance, a) - dist(entrance, b));
    for (const o of near) { if (deg(entrance.id) >= want) break; tryLink(entrance, o); }
  }

  // ---------- prune to 2–4 edges per node, keep connectivity and ≥4 loops ----------
  const pruneOnce = (predicate) => {
    const map = byId();
    const cands = edges
      .map(([a, b]) => [a, b, dist(map[a], map[b])])
      .filter(([a, b]) => predicate(a, b))
      .sort((p, q) => q[2] - p[2]);
    for (const [a, b] of cands) {
      if (loops() - 1 < 4) return false;
      if (!connected(a, b)) continue;
      unlink(a, b);
      return true;
    }
    return false;
  };
  const nonEntrance = () => nodes.filter((n) => n !== entrance);
  const degShare = () => nonEntrance().filter((n) => deg(n.id) >= 3).length / nonEntrance().length;
  // over-connected nodes: cut the longest edge even if loops dip below 4 (restored below);
  // the other end may become a dead-end spur
  const cutOverDegree = () => {
    for (let guard = 0; guard < 300; guard++) {
      const map = byId();
      const cands = edges
        .map(([a, b]) => [a, b, dist(map[a], map[b])])
        .filter(([a, b]) => (deg(a) > 4 || deg(b) > 4) && deg(a) >= 2 && deg(b) >= 2)
        .sort((p, q) => q[2] - p[2]);
      let cut = false;
      for (const [a, b] of cands) { if (connected(a, b)) { unlink(a, b); cut = true; break; } }
      if (!cut) break;
    }
  };
  // loops below 4: add back the shortest planar, band-adjacent Gabriel edge between low-degree nodes
  const restoreLoops = () => {
    for (let guard = 0; guard < 40 && loops() < 4; guard++) {
      const cand = gabriel.find(([a, b]) => !has(a.id, b.id) && deg(a.id) <= 3 && deg(b.id) <= 3 && !crossesAny(a, b));
      if (!cand) break;
      link(cand[0], cand[1]);
    }
  };
  const pruneAll = () => {
    cutOverDegree();
    for (let guard = 0; guard < 300 && degShare() > 0.4; guard++) {
      if (!pruneOnce((a, b) => deg(a) >= 3 && deg(b) >= 3 && a !== entrance.id && b !== entrance.id)) break;
    }
    restoreLoops();
  };
  pruneAll();

  // ---------- texture (all edges pass the crossing + band tests) ----------
  const placeNear = (from, band, dx, dy, sep) => {
    for (let tries = 0; tries < 14; tries++) {
      const x = Math.max(40, Math.min(WIDTH - 40, from.x + dx * rand(rng, 0.8, 1.2) + rand(rng, -30, 30)));
      const y = Math.max(50, Math.min(HEIGHT - 50, from.y + dy * rand(rng, 0.8, 1.2) + rand(rng, -20, 20)));
      if (farEnough(x, y, sep)) { const n = add(x, y, band); adj[n.id] = []; return n; }
    }
    return null;
  };
  const dropLast = (n) => { nodes.pop(); delete adj[n.id]; };
  // dead-end spurs: a single node off a main node, one band outward, single edge
  const spurRoots = shuffle(rng, main.filter((n) => n !== entrance && n !== boss && n.band < B - 1));
  let spurs = 0;
  for (const root of spurRoots) {
    if (spurs >= spurCount) break;
    const side = root.x < WIDTH / 2 ? -1 : 1;
    const s = placeNear(root, root.band + 1, side * 90, -bandH * 0.9, 60);
    if (!s) continue;
    if (tryLink(root, s)) spurs++; else dropLast(s);
  }
  // quiet trails: a chain of 3 along a side margin, advancing one band per step
  const trailRoots = shuffle(rng, main.filter((n) => n !== entrance && n !== boss && n.band >= 1 && n.band <= B - 4 && (n.x < X_MIN + 140 || n.x > X_MAX - 140)));
  let trails = 0;
  for (const root of trailRoots) {
    if (trails >= trailCount) break;
    const side = root.x < WIDTH / 2 ? -1 : 1;
    let prev = root;
    let made = 0;
    for (let i = 0; i < trailLen; i++) {
      const t = placeNear(prev, prev.band + 1, side * 40, -bandH, 58);
      if (!t) break;
      if (!tryLink(prev, t)) { dropLast(t); break; }
      prev = t;
      made++;
    }
    if (made) trails++;
  }
  // long-edge curiosity nodes: a lone node one band outward at the map edge, single long edge
  const curioRoots = shuffle(rng, main.filter((n) => n !== entrance && n !== boss && n.band < B - 1));
  let curios = 0;
  for (const root of curioRoots) {
    if (curios >= curiosityCount) break;
    const side = root.x < WIDTH / 2 ? -1 : 1;
    const c = placeNear(root, root.band + 1, side * 330, -bandH * 0.6, 110);
    if (!c) continue;
    if (dist(root, c) >= 280 && tryLink(root, c)) curios++; else dropLast(c);
  }

  // top-up (texture can fail near edges): keep the size band, planar links only
  const minCount = tier >= 9 ? 45 : 30;
  for (let tries = 0; nodes.length < Math.max(minCount, targetCount - 2) && tries < 300; tries++) {
    const band = irand(rng, 1, B - 1);
    const x = rand(rng, X_MIN, X_MAX);
    const y = bandY(band) + rand(rng, -0.3, 0.3) * bandH;
    if (!farEnough(x, y)) continue;
    const m = add(x, y, band);
    adj[m.id] = [];
    const near = nodes.filter((o) => o !== m && bandOk(o, m)).sort((a, b) => dist(m, a) - dist(m, b));
    let linked = false;
    for (const o of near.slice(0, 6)) { if (tryLink(m, o)) { linked = true; break; } }
    if (!linked) dropLast(m);
  }

  // texture and top-up can push degrees back up — prune once more
  pruneAll();

  // guarantee a path entrance → boss (never crossing)
  if (!shortestPath(adj, entrance.id, boss.id)) {
    const cands = nodes.filter((o) => o !== boss && o.band === B - 1 && !crossesAny(boss, o)).sort((a, b) => dist(boss, a) - dist(boss, b));
    for (const o of cands) { link(boss, o); if (shortestPath(adj, entrance.id, boss.id)) break; }
  }
  // no isolates
  for (const n of nodes) if (deg(n.id) === 0) {
    const nearest = nodes.filter((o) => o !== n && bandOk(o, n) && !crossesAny(n, o)).sort((a, b) => dist(n, a) - dist(n, b))[0];
    if (nearest) link(n, nearest);
  }

  // ---------- the boss is the END of the road (Anthony 2026-09-14) ----------
  // The boss node keeps exactly one edge — the one on the shortest path from the entrance — so nothing
  // lies "past" the boss and no rare / sanctuary / crystal can only be reached through him. Any node
  // that was reachable only via the boss is re-linked to the nearest reachable node (never crossing,
  // same or adjacent band) or, failing that, dropped from the map.
  {
    const sp = shortestPath(adj, entrance.id, boss.id) || [];
    const keep = sp.length >= 2 ? sp[sp.length - 2] : adj[boss.id][0];
    for (const o of [...adj[boss.id]]) if (o !== keep) unlink(boss.id, o);
    const reachableSansBoss = () => {
      const seen = new Set([entrance.id]);
      const stack = [entrance.id];
      while (stack.length) {
        const c = stack.pop();
        for (const m of adj[c]) if (m !== boss.id && !seen.has(m)) { seen.add(m); stack.push(m); }
      }
      return seen;
    };
    for (let guard = 0; guard < nodes.length; guard++) {
      const seen = reachableSansBoss();
      const stranded = nodes.filter((n) => n !== boss && !seen.has(n.id));
      if (!stranded.length) break;
      const map = byId();
      let linked = false;
      for (const n of stranded) {
        const cands = [...seen].map((id) => map[id]).filter((o) => o !== entrance && bandOk(o, n) && !crossesAny(n, o)).sort((a, b) => dist(n, a) - dist(n, b));
        if (cands.length) { link(n, cands[0]); linked = true; break; }
      }
      if (!linked) {
        // drop the most remote stranded node and retry (its edges go with it)
        const drop = stranded.sort((a, b) => b.band - a.band)[0];
        for (const o of [...adj[drop.id]]) unlink(drop.id, o);
        delete adj[drop.id];
        nodes.splice(nodes.indexOf(drop), 1);
      }
    }
    // cutting the boss's extra edges can cost loops — restore them away from the boss (§11: ≥ 4 loops)
    for (let guard = 0; guard < 40 && loops() < 4; guard++) {
      const cand = gabriel.find(([a, b]) => a !== boss && b !== boss && adj[a.id] && adj[b.id] && !has(a.id, b.id) && deg(a.id) <= 3 && deg(b.id) <= 3 && !crossesAny(a, b));
      if (!cand) break;
      link(cand[0], cand[1]);
    }
  }

  // ---------- depth (BFS from entrance, normalised by the boss's depth) ----------
  const depths = bfsDepths(adj, entrance.id);
  const bossDepth = Math.max(1, depths.get(boss.id) || 1);
  for (const n of nodes) {
    n.depth = depths.get(n.id) ?? bossDepth;
    n.depth01 = Math.max(0, Math.min(1, n.depth / bossDepth));
    n.neighbors = [...adj[n.id]];
  }

  // ---------- node types ----------
  boss.type = 'boss';
  const entranceAdj = new Set(adj[entrance.id]);
  const bossAdj = new Set(adj[boss.id]);
  const pool = nodes.filter((n) => n !== entrance && n !== boss);

  const rareCount = irand(rng, 2, 3);
  const rareHosts = shuffle(rng, pool.filter((n) => n.depth >= 2 && !entranceAdj.has(n.id) && !bossAdj.has(n.id))).slice(0, rareCount);
  const rares = rareHosts.map((n, i) => ({ id: `r${i}`, nodeId: n.id, alive: true }));
  const rareHostIds = new Set(rareHosts.map((n) => n.id));

  const sanctCount = irand(rng, 2, 4);
  const sanctuaries = [];
  for (const n of shuffle(rng, pool.filter((n) => !entranceAdj.has(n.id) && !rareHostIds.has(n.id) && !bossAdj.has(n.id)))) {
    if (sanctuaries.length >= sanctCount) break;
    if (sanctuaries.some((s) => adj[s.id].includes(n.id))) continue;
    n.type = 'sanctuary';
    sanctuaries.push(n);
  }

  const path = new Set(shortestPath(adj, entrance.id, boss.id) || []);
  const rest = pool.filter((n) => n.type === 'normal' && !rareHostIds.has(n.id));
  const crystalCount = Math.round(rest.length * rand(rng, 0.12, 0.18));
  const crystalTargets = [...shuffle(rng, rest.filter((n) => !path.has(n.id))), ...shuffle(rng, rest.filter((n) => path.has(n.id)))];
  for (let i = 0; i < crystalCount && i < crystalTargets.length; i++) crystalTargets[i].type = 'crystal';

  // named variants at generation (v3 §6): 10% of Fight nodes, at least one per map
  const fightNodes = shuffle(rng, pool.filter((n) => n.type === 'normal' && !rareHostIds.has(n.id)));
  const namedCount = Math.max(1, Math.round(fightNodes.length * 0.1));
  for (let i = 0; i < namedCount && i < fightNodes.length; i++) fightNodes[i].namedRare = true;

  // ---------- fog: entrance cleared + 2–3 neighbours revealed (positions only) ----------
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
    bands: B,
    bossDepth,
    rares,
    clock: 0,
    sealBroken: rares.length === 0,
    stats: { loops: loops(), deg3Share: degShare(), count: nodes.length, sanctuaries: sanctuaries.length, crystals: crystalCount, named: namedCount },
  };
}

export default genTerritory;
