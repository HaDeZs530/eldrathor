/**
 * Procedural territory generator — design doc §8c.
 * Organic ~30–45 node web (NOT rows/pyramid), entrance + guaranteed path to boss,
 * fog of war (entry + neighbors revealed), node types hidden until entered.
 *
 * DESIGN-OPEN / TODO stubs:
 * - Respawn cadence behind cleared nodes (~every 3–4 node-actions)
 * - Named rare variants (~10% on respawn)
 * - Roaming rares that ward/seal the boss
 * - Per-world entrance/exit compass bias (W1 S→NE etc.)
 * - Cluster / quiet-trail / dead-end texture weighting
 */

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** BFS path existence check on adjacency map */
function hasPath(adj, from, to) {
  const q = [from];
  const seen = new Set([from]);
  while (q.length) {
    const cur = q.shift();
    if (cur === to) return true;
    for (const n of adj[cur] || []) {
      if (!seen.has(n)) {
        seen.add(n);
        q.push(n);
      }
    }
  }
  return false;
}

function shortestPath(adj, from, to) {
  const q = [from];
  const prev = new Map([[from, null]]);
  while (q.length) {
    const cur = q.shift();
    if (cur === to) break;
    for (const n of adj[cur] || []) {
      if (!prev.has(n)) {
        prev.set(n, cur);
        q.push(n);
      }
    }
  }
  if (!prev.has(to)) return null;
  const path = [];
  let c = to;
  while (c != null) {
    path.push(c);
    c = prev.get(c);
  }
  path.reverse();
  return path;
}

/**
 * @param {object} world — { id, name, tier, boss, ... }
 * @param {{ nodeCount?: number }} [opts]
 * @returns {{ nodes: object[], edges: [string,string][], entranceId: string, bossId: string }}
 */
export function genTerritory(world, opts = {}) {
  const targetCount = opts.nodeCount ?? Math.round(rand(32, 44));
  const width = 900;
  const height = 1200;

  // --- Place nodes with organic scatter (rejection sampling) ---
  const nodes = [];
  const minSep = 72;
  // Entrance near south (bottom of portrait map)
  nodes.push({
    id: 'n0',
    x: width * 0.5 + rand(-40, 40),
    y: height - 80,
    type: 'normal',
    revealed: true,
    typeKnown: false,
    cleared: false,
    // DESIGN-OPEN: respawn / named rare state
    respawned: false,
    namedRare: false,
  });

  // Boss near north-east-ish (W1-ish bias; DESIGN-OPEN: per-world compass)
  const bossX = width * (0.55 + rand(0, 0.25));
  const bossY = 90 + rand(0, 60);
  nodes.push({
    id: 'n1',
    x: bossX,
    y: bossY,
    type: 'boss',
    revealed: false,
    typeKnown: false,
    cleared: false,
    respawned: false,
    namedRare: false,
  });

  let attempts = 0;
  while (nodes.length < targetCount && attempts < targetCount * 80) {
    attempts++;
    const x = rand(50, width - 50);
    const y = rand(100, height - 120);
    if (nodes.every((n) => dist(n, { x, y }) >= minSep)) {
      nodes.push({
        id: `n${nodes.length}`,
        x,
        y,
        type: 'normal', // assigned below
        revealed: false,
        typeKnown: false,
        cleared: false,
        respawned: false,
        namedRare: false,
      });
    }
  }

  const entranceId = 'n0';
  const bossId = 'n1';

  // --- Build adjacency via k-nearest + some long edges ---
  const adj = Object.fromEntries(nodes.map((n) => [n.id, []]));
  const edges = [];
  const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const edgeSet = new Set();

  function addEdge(a, b) {
    const k = edgeKey(a, b);
    if (a === b || edgeSet.has(k)) return false;
    edgeSet.add(k);
    edges.push([a, b]);
    adj[a].push(b);
    adj[b].push(a);
    return true;
  }

  for (const n of nodes) {
    const others = nodes
      .filter((o) => o.id !== n.id)
      .map((o) => ({ id: o.id, d: dist(n, o) }))
      .sort((a, b) => a.d - b.d);
    const k = 2 + Math.floor(Math.random() * 2); // 2–3 nearest
    for (let i = 0; i < k && i < others.length; i++) {
      if (others[i].d < 220) addEdge(n.id, others[i].id);
    }
    // Occasional long curiosity edge
    if (Math.random() < 0.12 && others.length > 6) {
      const far = others[4 + Math.floor(Math.random() * Math.min(6, others.length - 4))];
      if (far && far.d < 380) addEdge(n.id, far.id);
    }
  }

  // Guarantee path entrance → boss: connect along a geometric chain if needed
  if (!hasPath(adj, entranceId, bossId)) {
    const ordered = [...nodes].sort((a, b) => b.y - a.y); // south → north
    for (let i = 0; i < ordered.length - 1; i++) {
      addEdge(ordered[i].id, ordered[i + 1].id);
      if (hasPath(adj, entranceId, bossId)) break;
    }
    // Final fallback: direct edge
    if (!hasPath(adj, entranceId, bossId)) addEdge(entranceId, bossId);
  }

  // Ensure degree ≥ 1 for isolates
  for (const n of nodes) {
    if (adj[n.id].length === 0) {
      const nearest = nodes
        .filter((o) => o.id !== n.id)
        .sort((a, b) => dist(n, a) - dist(n, b))[0];
      if (nearest) addEdge(n.id, nearest.id);
    }
  }

  // --- Assign types (hidden until entered) ---
  // Keep entrance normal; boss already boss.
  // Path spine: mostly normal; sprinkle rares/crystals off-path.
  const path = shortestPath(adj, entranceId, bossId) || [entranceId, bossId];
  const pathSet = new Set(path);

  const pool = nodes.filter((n) => n.id !== entranceId && n.id !== bossId);
  // Target: ~2–3 rares, ~12–18% crystals, rest normal
  const rareCount = Math.min(3, Math.max(2, Math.round(pool.length * 0.07)));
  const crystalCount = Math.round(pool.length * rand(0.12, 0.18));

  const offPath = shuffle(pool.filter((n) => !pathSet.has(n.id)));
  const onPath = shuffle(pool.filter((n) => pathSet.has(n.id)));
  // Bias crystals away from entry→boss drift
  const crystalTargets = [...offPath, ...onPath];
  let ci = 0;
  for (; ci < crystalCount && ci < crystalTargets.length; ci++) {
    crystalTargets[ci].type = 'crystal';
  }
  const remaining = shuffle(pool.filter((n) => n.type === 'normal'));
  for (let i = 0; i < rareCount && i < remaining.length; i++) {
    remaining[i].type = 'rare';
  }

  // Fog of war: reveal entrance + neighbors
  const entrance = nodes.find((n) => n.id === entranceId);
  entrance.cleared = true;
  entrance.revealed = true;
  entrance.typeKnown = true; // already entered/cleared start
  for (const nid of adj[entranceId]) {
    const nb = nodes.find((n) => n.id === nid);
    if (nb) nb.revealed = true; // position only — type stays hidden
  }

  // Attach neighbors list on each node for UI convenience
  for (const n of nodes) {
    n.neighbors = [...adj[n.id]];
  }

  return {
    nodes,
    edges,
    entranceId,
    bossId,
    width,
    height,
    worldId: world.id,
    worldTier: world.tier,
    // TODO DESIGN: roaming rare positions / boss seal state
    bossSealed: true,
    raresRemaining: rareCount,
  };
}

/**
 * After clearing a node, reveal its neighbors (positions only).
 */
export function revealNeighbors(territory, nodeId) {
  const node = territory.nodes.find((n) => n.id === nodeId);
  if (!node) return territory;
  const next = {
    ...territory,
    nodes: territory.nodes.map((n) => {
      if (n.id === nodeId) {
        return { ...n, cleared: true, revealed: true, typeKnown: true, respawned: false };
      }
      if (node.neighbors.includes(n.id) && !n.revealed) {
        return { ...n, revealed: true };
      }
      return n;
    }),
  };
  return next;
}

/**
 * Nodes the player can travel to: revealed, not current, adjacent to any cleared
 * (or adjacent to current position).
 * DESIGN-OPEN: respawned nodes should require a fight to traverse.
 */
export function getReachableIds(territory, currentId) {
  const byId = Object.fromEntries(territory.nodes.map((n) => [n.id, n]));
  const current = byId[currentId];
  if (!current) return new Set();
  const reachable = new Set();
  for (const nid of current.neighbors) {
    const n = byId[nid];
    if (n && n.revealed && !n.cleared) reachable.add(nid);
    // Allow re-entry to cleared neighbors for repositioning (respawns TBD)
    if (n && n.revealed && n.cleared && n.id !== currentId) reachable.add(nid);
  }
  return reachable;
}

export default genTerritory;
