/**
 * Save & identity — docs/Eldrathor_Progression_Loop_Lock.md §1 (M1a).
 * Versioned save `eldrathor.save.v1` in localStorage (Capacitor Preferences later): roster, fielded
 * party, stash, materials, Worldvein, unlocked areas, AFK assignments, and the ACTIVE RUN (area,
 * territory + node states, run party, per-id HP, run mods, banked run Worldvein, run log, camera pan,
 * RNG seed + draw counter) so closing the app mid-run reopens in place. Written on every state
 * transition (debounced ≤ 1 s) and flushed on visibility change / page hide. Corrupt or newer saves
 * are quarantined under `eldrathor.save.quarantine.<ts>` and the game starts fresh with a notice;
 * OLDER saves are discarded per Item Model lock §9 (copy kept under the same prefix) — no migrations
 * while Milestones 2–3 build. Everything here is pure and injectable for tests.
 */
import { mulberry32 } from '../combat/simulate.js';
import { newId } from '../data.js';

export const SAVE_VERSION = 5; // bumped by M2 lock 2 — class gems + the lattice (2026-09-19); older saves reset (§9)
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
  s.bag = idList(s.bag, 'i');
  if (isObj(s.inventory)) s.inventory = { ...s.inventory, armor: idList(s.inventory.armor, 'a') };
  if (isObj(s.run)) {
    s.run = { ...s.run, runParty: idList(s.run.runParty, 'c') };
    if (isObj(s.run.fight) && Array.isArray(s.run.fight.rewards?.gears)) s.run.fight = { ...s.run.fight, rewards: { ...s.run.fight.rewards, gears: idList(s.run.fight.rewards.gears, 'w') } };
  }
  return s;
}

/**
 * Save policy while building (Item Model lock §9, RULED 2026-09-17): every brief that adds or changes a
 * system bumps SAVE_VERSION; on load an OLDER save is discarded (not migrated) and a fresh game starts
 * with the notice "Save reset for a game update". No migrations are written during Milestones 2–3;
 * export / import stays for deliberate carry-over. Migrations return when we approach TestFlight.
 * (The M1a→M1b→M2-lock-1 migration chain was removed here.)
 */
export const RESET_NOTICE = 'Save reset for a game update';

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

/** @returns {{ok:true, state:object} | {ok:false, error:string, outdated?:boolean}} */
export function deserialize(json) {
  let data;
  try { data = JSON.parse(json); } catch (e) { return { ok: false, error: `bad JSON: ${e.message}` }; }
  if (!isObj(data)) return { ok: false, error: 'save is not an object' };
  let v = Number.isInteger(data.v) ? data.v : 0;
  if (v > SAVE_VERSION) return { ok: false, error: `save version ${v} is newer than this build (${SAVE_VERSION})` };
  if (v < SAVE_VERSION) return { ok: false, outdated: true, error: `save version ${v} is older than this build (${SAVE_VERSION}) — ${RESET_NOTICE}` };
  const state = { ...data };
  delete state.v; delete state.savedAt;
  const bad = validate(state);
  if (bad) return { ok: false, error: bad };
  return { ok: true, state };
}

/** Storage-backed store. `storage` needs getItem/setItem/removeItem (localStorage or a Map shim). */
export function createStore(storage = globalThis.localStorage, now = Date.now) {
  const get = (k) => { try { return storage?.getItem(k) ?? null; } catch { return null; } };
  const set = (k, v) => { try { storage?.setItem(k, v); return true; } catch { return false; } };
  const del = (k) => { try { storage?.removeItem(k); } catch { /* ignore */ } };
  return {
    /** Read the save. Corrupt / newer → quarantined; OLDER → reset (§9); both start fresh with a notice. */
    load() {
      const raw = get(SAVE_KEY);
      if (raw == null) return { fresh: true, quarantined: false, reset: false, state: null, error: null };
      const d = deserialize(raw);
      // §9: an older save is discarded (a copy is kept under the quarantine prefix, export/import can carry it over)
      if (!d.ok && d.outdated) { set(QUARANTINE_PREFIX + now(), raw); del(SAVE_KEY); return { fresh: true, quarantined: false, reset: true, state: null, error: d.error }; }
      if (!d.ok) { set(QUARANTINE_PREFIX + now(), raw); del(SAVE_KEY); return { fresh: true, quarantined: true, reset: false, state: null, error: d.error }; }
      return { fresh: false, quarantined: false, reset: false, state: d.state, error: null };
    },
    save(state) { return set(SAVE_KEY, serialize(state, now)); },
    reset() { del(SAVE_KEY); },
    exportText() { return get(SAVE_KEY) || ''; },
    /** Validate pasted text; on success it becomes the save (the app reloads to hydrate). */
    importText(text) { const d = deserialize(String(text || '').trim()); if (!d.ok) return { ok: false, error: d.error }; set(SAVE_KEY, serialize(d.state, now)); return { ok: true }; },
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
