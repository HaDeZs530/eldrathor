/**
 * Route map run state — docs/Eldrathor_RouteMap_v2_Lock.md §2, §4, §5, §6 and
 * docs/Eldrathor_RouteMap_v3_Travel_Lock.md §1, §3.
 * Pure helpers over the territory object: reveal-on-clear, node-action clock, roaming
 * rares, respawns + named variants, the boss seal, path highlighting, travel planning
 * and the ambush flee roll.
 */

export const RESPAWN_EVERY_TICKS = 4;
export const RESPAWN_CHANCE = 0.25; // per cleared node per 4 ticks (tune)
export const NAMED_CHANCE = 0.1; // share of respawns that come back named
export const RARE_ROAM_EVERY_TICKS = 2;

const shuffle = (rng, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const byId = (t) => Object.fromEntries(t.nodes.map((n) => [n.id, n]));

/** Living rare standing on a node, if any. */
export function rareAt(t, nodeId) {
  return t.rares.find((r) => r.alive && r.nodeId === nodeId) || null;
}

/** A living rare on the node itself or on one of its neighbours (v3 §3 ambush trigger). */
export function rareNear(t, nodeId) {
  const map = byId(t);
  const here = map[nodeId];
  if (!here) return null;
  return rareAt(t, nodeId) || here.neighbors.map((id) => rareAt(t, id)).find(Boolean) || null;
}

/** What the node fights as right now: a living rare on it overrides the underlying type. */
export function effectiveType(t, node) {
  return rareAt(t, node.id) ? 'rare' : node.type;
}

export function isSealed(t) {
  return t.rares.some((r) => r.alive);
}

export function allCleared(t) {
  return t.nodes.every((n) => n.cleared && !n.respawned);
}

/** Nodes the party can tap: neighbours of the current node (revealed). */
export function reachableIds(t, currentId) {
  const map = byId(t);
  const cur = map[currentId];
  if (!cur) return new Set();
  return new Set(cur.neighbors.filter((id) => map[id]?.revealed));
}

/** Mark a node scouted (type resolves). Returns a new territory. */
export function scoutNode(t, nodeId) {
  return { ...t, nodes: t.nodes.map((n) => (n.id === nodeId ? { ...n, scouted: true, typeKnown: true } : n)) };
}

/**
 * A clear (fight won / sanctuary used): node cleared, its type known, 2–3 unrevealed
 * neighbours revealed (positions only), respawn flags dropped.
 */
export function clearNode(t, nodeId, rng = Math.random) {
  const map = byId(t);
  const node = map[nodeId];
  if (!node) return t;
  const hidden = node.neighbors.filter((id) => map[id] && !map[id].revealed);
  const revealCount = Math.min(hidden.length, 2 + Math.floor(rng() * 2)); // 2–3
  const reveal = new Set(shuffle(rng, hidden).slice(0, revealCount));
  return {
    ...t,
    nodes: t.nodes.map((n) => {
      if (n.id === nodeId) return { ...n, cleared: true, revealed: true, typeKnown: true, scouted: true, respawned: false, namedRare: false };
      if (reveal.has(n.id)) return { ...n, revealed: true };
      return n;
    }),
  };
}

export function killRare(t, nodeId) {
  const rares = t.rares.map((r) => (r.alive && r.nodeId === nodeId ? { ...r, alive: false } : r));
  return { ...t, rares, sealBroken: !rares.some((r) => r.alive) };
}

/**
 * Node-action clock (scout, clear, travel hop, flee). Every 2 ticks living rares roam one
 * edge to a random revealed, uncleared, non-boss neighbour (or stay). Every 4 ticks each
 * cleared node (not the entrance, not where the party stands) rolls 25% to respawn; 10% of
 * those come back as a named variant.
 * @returns {{territory:object, events:Array<{type:string, nodeId:string, rareId?:string, named?:boolean}>}}
 */
export function tickClock(t, { currentId, rng = Math.random } = {}) {
  const clock = t.clock + 1;
  const map = byId(t);
  const events = [];
  let rares = t.rares;
  let nodes = t.nodes;

  if (clock % RARE_ROAM_EVERY_TICKS === 0) {
    const occupied = new Set(rares.filter((r) => r.alive).map((r) => r.nodeId));
    rares = rares.map((r) => {
      if (!r.alive) return r;
      const here = map[r.nodeId];
      const options = here.neighbors.filter((id) => {
        const n = map[id];
        return n && n.revealed && !n.cleared && n.type !== 'boss' && id !== currentId && !occupied.has(id);
      });
      // "or stays" — one extra slot for staying put
      const roll = Math.floor(rng() * (options.length + 1));
      if (roll >= options.length) return r;
      occupied.delete(r.nodeId);
      occupied.add(options[roll]);
      events.push({ type: 'rareMoved', rareId: r.id, from: r.nodeId, nodeId: options[roll] });
      return { ...r, nodeId: options[roll] };
    });
  }

  if (clock % RESPAWN_EVERY_TICKS === 0) {
    nodes = nodes.map((n) => {
      if (!n.cleared || n.respawned || n.id === t.entranceId || n.id === currentId || n.type === 'boss' || n.type === 'sanctuary') return n;
      if (rng() < RESPAWN_CHANCE) {
        const named = rng() < NAMED_CHANCE;
        events.push({ type: 'respawn', nodeId: n.id, named });
        return { ...n, cleared: false, respawned: true, namedRare: named, typeKnown: true, scouted: true };
      }
      return n;
    });
  }

  return { territory: { ...t, clock, rares, nodes }, events };
}

/** Shortest path over REVEALED nodes (BFS). Returns node ids or null. */
export function revealedPath(t, fromId, toId) {
  return bfsPath(t, fromId, toId, (n) => n.revealed);
}

function bfsPath(t, fromId, toId, walkable) {
  const map = byId(t);
  if (!map[fromId] || !map[toId]) return null;
  const prev = new Map([[fromId, null]]);
  const q = [fromId];
  while (q.length) {
    const c = q.shift();
    if (c === toId) break;
    for (const n of map[c].neighbors) {
      const node = map[n];
      if (!prev.has(n) && node && (n === toId || walkable(node))) {
        prev.set(n, c);
        q.push(n);
      }
    }
  }
  if (!prev.has(toId)) return null;
  const path = [];
  for (let c = toId; c != null; c = prev.get(c)) path.push(c);
  return path.reverse();
}

/** Ground the party can walk over: cleared nodes, and respawned ones (which halt the trip on arrival). */
export const isWalkable = (n) => n.cleared || n.respawned;

/**
 * v3 §1 — planned travel path through cleared ground from the current node to a cleared
 * (or respawned) destination. Returns [current, …, dest] or null.
 */
export function travelPath(t, fromId, toId) {
  const map = byId(t);
  if (!map[toId] || !isWalkable(map[toId])) return null;
  return bfsPath(t, fromId, toId, isWalkable);
}

/**
 * v3 §1 — tapping a frontier / boss node: travel to its NEAREST walkable neighbour
 * (shortest cleared path), then act there. Returns the path to that neighbour or null.
 */
export function approachPath(t, fromId, frontierId) {
  const map = byId(t);
  const target = map[frontierId];
  if (!target) return null;
  let best = null;
  for (const id of target.neighbors) {
    const n = map[id];
    if (!n || !isWalkable(n)) continue;
    const p = id === fromId ? [fromId] : bfsPath(t, fromId, id, isWalkable);
    if (p && (!best || p.length < best.length)) best = p;
  }
  return best;
}

/**
 * v3 §3 — flee chance: 65% base, 45% if the ambusher is a rare, +5% per Striker or Adept
 * in the party. Bosses never ambush.
 */
export function fleeChance(party, ambusherIsRare) {
  const quick = party.filter((m) => m.archetype === 'Striker' || m.archetype === 'Adept').length;
  return Math.min(0.95, (ambusherIsRare ? 0.45 : 0.65) + 0.05 * quick);
}

/** Threat band from a dry-run win rate. DESIGN-OPEN: Even/Hard boundaries (Easy ≥80%, Deadly ≤20% are locked). */
export function threatBand(winRate) {
  if (winRate >= 0.8) return { id: 'easy', label: 'Easy', color: '#7fd6a0' };
  if (winRate >= 0.5) return { id: 'even', label: 'Even', color: '#e0c090' };
  if (winRate > 0.2) return { id: 'hard', label: 'Hard', color: '#e0a04d' };
  return { id: 'deadly', label: 'Deadly', color: '#e05d6f' };
}
