/**
 * The lattice engine — docs/Eldrathor_Growth_Model_Lock.md §1 + §5. Generic: nothing here knows what a
 * gem is. A lattice is a set of FACETS around a CORE; a facet can be imbued only when it TOUCHES an
 * imbued facet (or the Core, which is always lit). Adjacency is the only gate — no rows, no thresholds.
 *
 *   LatticeDef   { id, name, core: { id, name, ... }, facets: [ FacetDef ] }
 *   FacetDef     { id, name, ring, pos: { q, r }, neighbors: [ids | core.id], kind, maxLevel, effect, exclusiveGroup? }
 *                kind: 'stat' | 'proc' | 'finisher' | 'dormant' (a hex with nothing written on it yet — never imbuable)
 *                effect: { stat, perLevel } | { proc } | { finisher }
 *   LatticeState { levels: { [facetId]: n }, finisher: facetId | null, imbues: n, worldveinSpent: n }
 *
 * Pure functions only; every rule is asserted by engine.test.js.
 */

export const emptyLatticeState = () => ({ levels: {}, finisher: null, imbues: 0, worldveinSpent: 0 });

/** A state read from a save may be partial — normalise without inventing progress. */
export function normalizeLatticeState(s) {
  const levels = {};
  for (const [k, v] of Object.entries(s?.levels || {})) if (Number(v) > 0) levels[k] = Math.floor(Number(v));
  return { levels, finisher: s?.finisher || null, imbues: Math.max(0, Math.floor(s?.imbues || 0)), worldveinSpent: Math.max(0, s?.worldveinSpent || 0) };
}

/** Worldvein for the NEXT imbue when `n` imbues are already on this lattice: `base × growth^n`, rounded. */
export const imbueCost = (n, { base = 20, growth = 1.12 } = {}) => Math.round(base * Math.pow(growth, Math.max(0, n)));

export const facetById = (def, id) => def.facets.find((f) => f.id === id) || null;
export const levelOf = (state, id) => state?.levels?.[id] || 0;
/** Lit = the Core, or a facet with at least one level. */
export const isLit = (def, state, id) => id === def.core.id || levelOf(state, id) > 0;
/** Reachable = touches a lit facet (adjacency is the only gate). */
export const isReachable = (def, state, id) => {
  const f = facetById(def, id);
  return !!f && f.neighbors.some((n) => isLit(def, state, n));
};

export const REASON = {
  unknown: 'No such facet',
  dormant: 'Nothing is written on this facet yet',
  maxed: 'Fully imbued',
  unreachable: 'Must touch an imbued facet',
  exclusive: 'Another finisher is already set — swap instead',
  fragments: 'No Vein Fragments on this gem',
  worldvein: 'Not enough Worldvein',
};

/**
 * Can `facetId` take one more level? `have` carries what the caller can spend: fragments on this
 * lattice's owner and the Worldvein balance; `blocked` is an outside reason (e.g. "Equip to grow").
 * @returns {{ ok: boolean, reason: string | null, cost: number }}
 */
export function canImbue(def, state, facetId, { fragments = 0, worldvein = 0, tuning, blocked = null } = {}) {
  const cost = imbueCost(state.imbues, tuning);
  const no = (reason) => ({ ok: false, reason, cost });
  const f = facetById(def, facetId);
  if (!f) return no(REASON.unknown);
  if (f.kind === 'dormant') return no(REASON.dormant);
  if (levelOf(state, facetId) >= f.maxLevel) return no(REASON.maxed);
  if (f.exclusiveGroup && state.finisher && state.finisher !== facetId) return no(REASON.exclusive);
  if (!isReachable(def, state, facetId)) return no(REASON.unreachable);
  if (blocked) return no(blocked);
  if (fragments < 1) return no(REASON.fragments);
  if (worldvein < cost) return no(REASON.worldvein);
  return { ok: true, reason: null, cost };
}

/** Imbue one level. The caller has already checked `canImbue` and pays 1 fragment + `cost` Worldvein. */
export function imbue(def, state, facetId, { tuning } = {}) {
  const f = facetById(def, facetId);
  if (!f) return state;
  const cost = imbueCost(state.imbues, tuning);
  return {
    levels: { ...state.levels, [facetId]: levelOf(state, facetId) + 1 },
    finisher: f.exclusiveGroup ? facetId : state.finisher,
    imbues: state.imbues + 1,
    worldveinSpent: state.worldveinSpent + cost,
  };
}

/**
 * Swap the exclusive finisher: the set finisher darkens and its levels move to `toId`. The fee is the
 * caller's to charge (class gems: 200 ❖ + 2 fragments). The target must itself be reachable.
 * @returns {{ ok: boolean, reason: string | null }}
 */
export function canSwapFinisher(def, state, toId) {
  const to = facetById(def, toId);
  if (!to || !to.exclusiveGroup) return { ok: false, reason: REASON.unknown };
  if (!state.finisher) return { ok: false, reason: 'No finisher is set yet' };
  if (state.finisher === toId) return { ok: false, reason: 'Already the finisher' };
  if (facetById(def, state.finisher)?.exclusiveGroup !== to.exclusiveGroup) return { ok: false, reason: REASON.unknown };
  if (!isReachable(def, state, toId)) return { ok: false, reason: REASON.unreachable };
  return { ok: true, reason: null };
}
export function swapFinisher(def, state, toId, { fee = 0 } = {}) {
  const from = state.finisher;
  const to = facetById(def, toId);
  const levels = { ...state.levels };
  const moved = Math.min(levels[from] || 0, to.maxLevel);
  delete levels[from];
  levels[toId] = moved;
  return { ...state, levels, finisher: toId, worldveinSpent: state.worldveinSpent + fee };
}

/**
 * Everything the lattice currently grants.
 * @returns {{ statMods: Record<string, number>, procs: string[], finisher: { id: string, level: number } | null, imbues: number, imbuedFacets: number }}
 */
export function derive(def, state) {
  const statMods = {};
  const procs = [];
  let finisher = null;
  let imbuedFacets = 0;
  for (const f of def.facets) {
    const lv = Math.min(f.maxLevel || 0, levelOf(state, f.id));
    if (lv <= 0) continue;
    imbuedFacets += 1;
    if (f.kind === 'stat') statMods[f.effect.stat] = +((statMods[f.effect.stat] || 0) + f.effect.perLevel * lv).toFixed(6);
    else if (f.kind === 'proc') procs.push(f.effect.proc);
    else if (f.kind === 'finisher' && state.finisher === f.id) finisher = { id: f.effect.finisher, level: lv };
  }
  return { statMods, procs, finisher, imbues: state.imbues, imbuedFacets };
}

/** Total levels the lattice can hold (exclusive groups count once, at their largest member). */
export function capacity(def) {
  let n = 0; const groups = {};
  for (const f of def.facets) {
    if (f.kind === 'dormant') continue;
    if (f.exclusiveGroup) groups[f.exclusiveGroup] = Math.max(groups[f.exclusiveGroup] || 0, f.maxLevel);
    else n += f.maxLevel;
  }
  return n + Object.values(groups).reduce((a, b) => a + b, 0);
}

/** The live header readout: one line per stat, then procs, then the finisher. */
export function summary(def, state, { statLabel = (k) => k, procLabel = (k) => k, finisherLabel = (k) => k } = {}) {
  const d = derive(def, state);
  const lines = Object.entries(d.statMods).map(([k, v]) => `+${Math.round(v * 100)}% ${statLabel(k)}`);
  for (const p of d.procs) lines.push(procLabel(p));
  if (d.finisher) lines.push(`${finisherLabel(d.finisher.id)} ${'I'.repeat(d.finisher.level)}`);
  return lines;
}
