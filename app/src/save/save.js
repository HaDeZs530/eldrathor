/**
 * Save & identity — docs/Eldrathor_Progression_Loop_Lock.md §1 (M1a).
 * Versioned save `eldrathor.save.v1` in localStorage (Capacitor Preferences later): roster, fielded
 * party, stash, materials, Worldvein, unlocked areas, AFK assignments, and the ACTIVE RUN (area,
 * territory + node states, run party, per-id HP, run mods, banked run Worldvein, run log, camera pan,
 * RNG seed + draw counter) so closing the app mid-run reopens in place. Written on every state
 * transition (debounced ≤ 1 s) and flushed on visibility change / page hide. Corrupt or newer saves
 * are quarantined under `eldrathor.save.quarantine.<ts>` and the game starts fresh with a notice;
 * older saves migrate through the MIGRATIONS table. Everything here is pure and injectable for tests.
 */
import { mulberry32 } from '../combat/simulate.js';
import { newId } from '../data.js';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'eldrathor.save.v1';
export const QUARANTINE_PREFIX = 'eldrathor.save.quarantine.';
export const SAVE_DEBOUNCE_MS = 1000;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const idList = (list, prefix) => (Array.isArray(list) ? list.map((m) => (isObj(m) && !m.id ? { ...m, id: newId(prefix) } : m)) : list);

/** Give every Adventurer (c-), weapon (w-) and armor piece (a-) a permanent id if it lacks one. Nothing is keyed by position. */
export function ensureIds(state) {
  if (!isObj(state)) return state;
  const s = { ...state };
  s.party = idList(s.party, 'c');
  s.roster = idList(s.roster, 'c');
  s.stash = idList(s.stash, 'w');
  if (isObj(s.inventory)) s.inventory = { ...s.inventory, armor: idList(s.inventory.armor, 'a') };
  if (isObj(s.run)) {
    s.run = { ...s.run, runParty: idList(s.run.runParty, 'c') };
    if (isObj(s.run.fight) && Array.isArray(s.run.fight.rewards?.gears)) s.run.fight = { ...s.run.fight, rewards: { ...s.run.fight.rewards, gears: idList(s.run.fight.rewards.gears, 'w') } };
  }
  return s;
}

/** Migrations, keyed by the version they upgrade FROM. 0 = unversioned (pre-M1a positional data). */
export const MIGRATIONS = {
  0: (s) => ensureIds(s),
};

/** Minimal shape check so a truncated or foreign JSON object can't be loaded as a game. */
export function validate(state) {
  if (!isObj(state)) return 'not an object';
  if (!Array.isArray(state.party) || !Array.isArray(state.roster)) return 'party/roster missing';
  if (typeof state.worldvein !== 'number') return 'worldvein missing';
  if (state.run != null) {
    const r = state.run;
    if (!isObj(r) || !isObj(r.territory) || !Array.isArray(r.territory.nodes) || typeof r.currentId !== 'string') return 'run incomplete';
    if (!Array.isArray(r.runParty) || typeof r.seed !== 'number') return 'run party/seed missing';
  }
  return null;
}

export function serialize(state, now = Date.now) {
  return JSON.stringify({ v: SAVE_VERSION, savedAt: now(), ...state });
}

/** @returns {{ok:true, state:object, migratedFrom:number|null} | {ok:false, error:string}} */
export function deserialize(json) {
  let data;
  try { data = JSON.parse(json); } catch (e) { return { ok: false, error: `bad JSON: ${e.message}` }; }
  if (!isObj(data)) return { ok: false, error: 'save is not an object' };
  let v = Number.isInteger(data.v) ? data.v : 0;
  const from = v === SAVE_VERSION ? null : v;
  if (v > SAVE_VERSION) return { ok: false, error: `save version ${v} is newer than this build (${SAVE_VERSION})` };
  let state = { ...data };
  delete state.v; delete state.savedAt;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) return { ok: false, error: `no migration from v${v}` };
    state = m(state);
    v += 1;
  }
  const err = validate(state);
  if (err) return { ok: false, error: err };
  return { ok: true, state, migratedFrom: from };
}

/** Storage-backed store. `storage` needs getItem/setItem/removeItem (localStorage or a Map shim). */
export function createStore(storage = globalThis.localStorage, now = Date.now) {
  const get = (k) => { try { return storage?.getItem(k) ?? null; } catch { return null; } };
  const set = (k, v) => { try { storage?.setItem(k, v); return true; } catch { return false; } };
  const del = (k) => { try { storage?.removeItem(k); } catch { /* ignore */ } };
  return {
    /** Read the save. Corrupt / newer → quarantined and { fresh: true, quarantined: true, error }. */
    load() {
      const raw = get(SAVE_KEY);
      if (raw == null) return { fresh: true, quarantined: false, state: null, migratedFrom: null, error: null };
      const d = deserialize(raw);
      if (!d.ok) { set(QUARANTINE_PREFIX + now(), raw); del(SAVE_KEY); return { fresh: true, quarantined: true, state: null, migratedFrom: null, error: d.error }; }
      return { fresh: false, quarantined: false, state: d.state, migratedFrom: d.migratedFrom, error: null };
    },
    save(state) { return set(SAVE_KEY, serialize(state, now)); },
    reset() { del(SAVE_KEY); },
    exportText() { return get(SAVE_KEY) || ''; },
    /** Validate pasted text; on success it becomes the save (the app reloads to hydrate). */
    importText(text) { const d = deserialize(String(text || '').trim()); if (!d.ok) return { ok: false, error: d.error }; set(SAVE_KEY, serialize(d.state, now)); return { ok: true, migratedFrom: d.migratedFrom }; },
  };
}

/**
 * Debounced writer: `schedule(state)` writes at most once per `delayMs` (trailing); `flush()` writes
 * now; the page going hidden / unloading flushes so a mid-run close is never lost.
 */
export function createSaver({ store, delayMs = SAVE_DEBOUNCE_MS, setTimeout: st = globalThis.setTimeout, clearTimeout: ct = globalThis.clearTimeout, doc = globalThis.document, win = globalThis.window } = {}) {
  let pending = null; let timer = null; let disposed = false;
  const flush = () => { if (timer) { ct(timer); timer = null; } if (pending && !disposed) { store.save(pending); pending = null; return true; } return false; };
  const onVis = () => { if (doc?.hidden) flush(); };
  doc?.addEventListener?.('visibilitychange', onVis);
  win?.addEventListener?.('pagehide', flush);
  return {
    schedule(state) { if (disposed) return; pending = state; if (!timer) timer = st(() => { timer = null; flush(); }, delayMs); },
    flush,
    dispose() { flush(); disposed = true; doc?.removeEventListener?.('visibilitychange', onVis); win?.removeEventListener?.('pagehide', flush); },
    get pending() { return pending != null; },
  };
}

/**
 * Seeded RNG that counts its draws so a run can resume exactly: `countedRng(seed, count)` fast-forwards
 * `count` draws and continues the same sequence. Call it like a function; read `.seed` / `.count`.
 */
export function countedRng(seed, count = 0) {
  const base = mulberry32(seed >>> 0);
  for (let i = 0; i < count; i++) base();
  const f = () => { f.count += 1; return base(); };
  f.seed = seed >>> 0;
  f.count = count;
  return f;
}
