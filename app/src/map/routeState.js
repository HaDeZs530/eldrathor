/**
 * Route map run state — docs/Eldrathor_RouteMap_v2_Lock.md §2, §4, §6 and
 * docs/Eldrathor_RouteMap_v3_Travel_Lock.md §3, §6, §15 (NO respawns; free travel; the
 * explore commitment model with exactly three node states).
 * Pure helpers over the territory object: node state, reveal-on-clear, the scout/clear action
 * clock that moves rares, explore-path planning and the ambush flee roll.
 */

/**
 * §15 — exactly three node states. A node the fog hasn't shown yet is not on the map at all.
 *  - 'unexplored': never been there (identical rune for every type — nothing is auto-marked)
 *  - 'revealed':   explored, not completed (fled, or a sanctuary left unused)
 *  - 'completed':  cleared / used
 */
export function nodeState(n) {
  if (n.cleared) return 'completed';
  if (n.scouted) return 'revealed';
  return 'unexplored';
}

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

/** Living rares left on the map (optional hunts). */
export function raresAlive(t) {
  return t.rares.filter((r) => r.alive).length;
}

export function allCleared(t) {
  return t.nodes.every((n) => n.cleared);
}

/** Is `id` one edge from the party? */
export function isAdjacent(t, currentId, id) {
  const cur = byId(t)[currentId];
  return !!cur && cur.neighbors.includes(id);
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
  const next = {
    ...t,
    nodes: t.nodes.map((n) => {
      if (n.id === nodeId) return { ...n, cleared: true, typeKnown: true, scouted: true, revealed: true };
      if (reveal.has(n.id)) return { ...n, revealed: true };
      return n;
    }),
  };
  return thinFogIfStranded(next);
}

/**
 * Frontier safety valve. The 2–3 reveal rule can leave a hidden node whose every neighbour was
 * already cleared (its reveal rolls are spent) — with nothing unexplored on the map the run would
 * be unwinnable. When no unexplored node is visible and hidden nodes remain, the fog thins: every
 * hidden neighbour of a revealed node is shown.
 * // DESIGN-OPEN: safety valve only (never fires while an unexplored node is visible) — Design Chat to rule on the wording/feel.
 */
export function thinFogIfStranded(t) {
  const anyUnexplored = t.nodes.some((n) => n.revealed && !n.scouted && !n.cleared);
  const anyHidden = t.nodes.some((n) => !n.revealed);
  if (anyUnexplored || !anyHidden) return t;
  const map = byId(t);
  const show = new Set();
  for (const n of t.nodes) if (n.revealed) for (const id of n.neighbors) if (map[id] && !map[id].revealed) show.add(id);
  if (!show.size) return t;
  return { ...t, nodes: t.nodes.map((n) => (show.has(n.id) ? { ...n, revealed: true } : n)) };
}

export function killRare(t, nodeId) {
  const rares = t.rares.map((r) => (r.alive && r.nodeId === nodeId ? { ...r, alive: false } : r));
  return { ...t, rares };
}

/**
 * Scout/clear action clock (v3 §6/§15): travel hops never tick it. Every 2 actions each living
 * rare moves one edge to a random unexplored-or-revealed (never completed, never boss)
 * neighbour — or onto the party's node (the hunt = ambush), or stays. Nothing respawns.
 * Rares are hidden on unexplored nodes; only a move onto a revealed node is visible.
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
        return id === currentId || !n.cleared;
      });
      // "or stays" — one extra slot for staying put
      const roll = Math.floor(rng() * (options.length + 1));
      if (roll >= options.length) return r;
      occupied.delete(r.nodeId);
      occupied.add(options[roll]);
      events.push({ type: 'rareMoved', rareId: r.id, from: r.nodeId, nodeId: options[roll], ontoParty: options[roll] === currentId, visible: !!map[options[roll]].scouted });
      return { ...r, nodeId: options[roll] };
    });
  }

  return { territory: { ...t, clock, rares }, events };
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

/** Ground the party can walk over: completed nodes. */
export const isWalkable = (n) => n.cleared;

/**
 * §15 Explore — the party travels through completed nodes and ARRIVES ON the target (any
 * unexplored / revealed node the fog has shown). Returns [current, …, target] or null.
 * (Also exported as `travelPath` for the generator test: the boss is always reachable this way.)
 */
export function explorePath(t, fromId, toId) {
  const map = byId(t);
  if (!map[toId] || !map[toId].revealed) return null;
  return bfsPath(t, fromId, toId, isWalkable);
}
export const travelPath = explorePath;

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
