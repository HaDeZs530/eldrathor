/**
 * Route map run state — docs/Eldrathor_RouteMap_v2_Lock.md §2, §4, §6 and
 * docs/Eldrathor_RouteMap_v3_Travel_Lock.md §1, §3, §6 (NO respawns; free travel).
 * Pure helpers over the territory object: reveal-on-clear, the scout/clear action clock
 * that moves rares, the boss seal, path highlighting, travel planning and the flee roll.
 */

export const RARE_ROAM_EVERY_ACTIONS = 2;

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

/** What the node fights as right now: a living rare on it overrides the underlying type. */
export function effectiveType(t, node) {
  return rareAt(t, node.id) ? 'rare' : node.type;
}

export function isSealed(t) {
  return t.rares.some((r) => r.alive);
}

export function allCleared(t) {
  return t.nodes.every((n) => n.cleared);
}

/** Nodes next to the party (revealed). */
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
 * neighbours revealed (positions only). Cleared stays cleared — forever (v3 §6).
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
      if (n.id === nodeId) return { ...n, cleared: true, revealed: true, typeKnown: true, scouted: true };
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
 * Scout/clear action clock (v3 §6): travel hops never tick it. Every 2 actions each living
 * rare moves one edge to a random revealed, uncleared, non-boss neighbour — or onto the
 * party's node (the hunt), or stays. Nothing respawns.
 * @returns {{territory:object, events:Array<{type:'rareMoved', rareId:string, from:string, nodeId:string, ontoParty:boolean}>}}
 */
export function tickClock(t, { currentId, rng = Math.random } = {}) {
  const clock = t.clock + 1;
  const map = byId(t);
  const events = [];
  let rares = t.rares;

  if (clock % RARE_ROAM_EVERY_ACTIONS === 0) {
    const occupied = new Set(rares.filter((r) => r.alive).map((r) => r.nodeId));
    rares = rares.map((r) => {
      if (!r.alive) return r;
      const here = map[r.nodeId];
      const options = here.neighbors.filter((id) => {
        const n = map[id];
        if (!n || occupied.has(id) || n.type === 'boss') return false;
        return id === currentId || (n.revealed && !n.cleared);
      });
      // "or stays" — one extra slot for staying put
      const roll = Math.floor(rng() * (options.length + 1));
      if (roll >= options.length) return r;
      occupied.delete(r.nodeId);
      occupied.add(options[roll]);
      events.push({ type: 'rareMoved', rareId: r.id, from: r.nodeId, nodeId: options[roll], ontoParty: options[roll] === currentId });
      return { ...r, nodeId: options[roll] };
    });
  }

  return { territory: { ...t, clock, rares }, events };
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

/** Ground the party can walk over: cleared nodes. */
export const isWalkable = (n) => n.cleared;

/** v3 §1/§6 — free travel path through cleared ground. Returns [current, …, dest] or null. */
export function travelPath(t, fromId, toId) {
  const map = byId(t);
  if (!map[toId] || !isWalkable(map[toId])) return null;
  return bfsPath(t, fromId, toId, isWalkable);
}

/**
 * v3 §1 — tapping a frontier / boss node: travel to its NEAREST cleared neighbour
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
