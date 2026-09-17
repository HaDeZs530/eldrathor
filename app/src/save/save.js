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
import { withStarterWeapons } from '../progression/progression.js';
import { makeItem, RARITIES } from '../progression/items.js';

export const SAVE_VERSION = 3;
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

const legendary = (q) => (q === 'Mythic' ? 'Legendary' : q);
const weaponV2 = (w) => (isObj(w) && w.baseRating == null ? { ...w, baseRating: Math.max(1, Math.min(100, Math.round(w.rating ?? 1))), empower: 0, rating: undefined } : w);
const memberV2 = (m) => (isObj(m) ? { ...m, xp: typeof m.xp === 'number' ? m.xp : 0 } : m);
/**
 * v1 → v2 (M1b, Progression Loop Lock §2–§4): weapons carry an immutable `baseRating` plus `empower`
 * (0–100) instead of a mutable `rating`; the Mythic tier becomes Legendary; Adventurers carry `xp`;
 * anyone without an equipped weapon gets a Common starter of their default type in the stash.
 */
export function migrateV1toV2(state) {
  if (!isObj(state) || !Array.isArray(state.party) || !Array.isArray(state.roster)) return state; // validate() will refuse it
  const s = { ...state };
  s.stash = Array.isArray(s.stash) ? s.stash.map(weaponV2) : [];
  const armorList = (l) => (Array.isArray(l) ? l.map((a) => (isObj(a) ? { ...a, quality: legendary(a.quality) } : a)) : l);
  if (isObj(s.inventory)) {
    s.inventory = { ...s.inventory, armor: armorList(s.inventory.armor) };
    if (Array.isArray(s.inventory.infused)) s.inventory.infused = s.inventory.infused.map((m) => (isObj(m) ? { ...m, quality: legendary(m.quality) } : m));
  }
  const party = (s.party || []).map(memberV2); const roster = (s.roster || []).map(memberV2);
  // `withStarterWeapons` speaks the v3 shape (one bag, a six-slot `equipped` map); v2→v3 merges the
  // stash into the bag and folds `weaponId` in, so writing the starters back to `stash` is correct here.
  const geared = withStarterWeapons([...party, ...roster], s.stash);
  s.party = geared.members.slice(0, party.length); s.roster = geared.members.slice(party.length); s.stash = geared.bag;
  if (isObj(s.run)) {
    const rp = Array.isArray(s.run.runParty) ? s.run.runParty.map((m) => { const live = geared.members.find((x) => x.id === m?.id); return live ? { ...memberV2(m), equipped: { ...(m?.equipped || {}), ...(live.equipped || {}) } } : memberV2(m); }) : s.run.runParty;
    s.run = { ...s.run, runParty: rp };
    if (isObj(s.run.fight) && Array.isArray(s.run.fight.rewards?.gears)) s.run.fight = { ...s.run.fight, rewards: { ...s.run.fight.rewards, gears: s.run.fight.rewards.gears.map(weaponV2) } };
  }
  return JSON.parse(JSON.stringify(s)); // drop the `rating: undefined` keys
}

/**
 * v2 → v3 (M2 lock 1, docs/Eldrathor_Item_Model_Lock.md). The five-rung ladder becomes seven
 * (`Fine` → `Uncommon`), every item takes the one shape `{id, kind, type, tier, rarity, rating,
 * empower, name}`, and the separate stash / armor / infused lists collapse into ONE `bag` (§5).
 * Adventurers carry the six-slot `equipped` map (§6) instead of `weaponId` / `armorId`.
 *
 * TIER on migrated items: every legacy item lands at **T1**. Old items carried no tier, and T1's
 * multiplier is 1.0, so a migrated item keeps exactly the power it had — the tier axis starts earning
 * from the next drop rather than retroactively inflating a save. (Rarity now multiplies, so a legacy
 * Legendary gains its ×1.45 rarity step; that is the ladder itself, not a tier grant.)
 *
 * `scrap` has no source now that the item sheet has no Scrap action (§3), so any left over is paid
 * out at the market's old 2 ❖ per unit and the field is dropped.
 */
export const LEGACY_RARITY = { Fine: 'Uncommon' };
export const rarityV3 = (q) => { const r = LEGACY_RARITY[q] || q; return RARITIES.includes(r) ? r : 'Common'; };
export const LEGACY_TIER = 1;
export const SCRAP_PAYOUT = 2;

const weaponV3 = (w) => (isObj(w) ? makeItem({
  id: w.id, kind: 'weapon', type: w.type || w.weaponType || 'Sword + Shield', tier: w.tier && Number.isInteger(w.tier) ? w.tier : LEGACY_TIER,
  rarity: rarityV3(typeof w.tier === 'string' ? w.tier : w.rarity), rating: w.rating ?? w.baseRating ?? 1, empower: w.empower || 0,
  name: typeof w.name === 'string' && !/^(Common|Fine|Uncommon|Rare|Epic|Legendary) /.test(w.name) ? w.name : undefined,
  ...(w.starter ? { starter: true } : {}),
}) : w);
const armorV3 = (a) => (isObj(a) ? makeItem({
  id: a.id, kind: 'armor', type: a.type || 'Cuirass', tier: Number.isInteger(a.tier) ? a.tier : LEGACY_TIER,
  rarity: rarityV3(a.rarity || a.quality || a.tier), rating: a.rating ?? 1,
}) : a);
const materialV3 = (m) => (isObj(m) ? makeItem({
  kind: 'material', type: m.type || m.family || 'metal', tier: Number.isInteger(m.tier) ? m.tier : LEGACY_TIER,
  rarity: rarityV3(m.rarity || m.quality), rating: 1, qty: Math.max(1, m.qty || 1),
}) : m);

/** `weaponId` / `armorId` → the six-slot `equipped` map; an existing map is kept. */
const memberV3 = (m) => {
  if (!isObj(m)) return m;
  const { weaponId, armorId, ...rest } = m;
  const equipped = { ...(m.equipped || {}) };
  if (weaponId && !equipped.weapon) equipped.weapon = weaponId;
  if (armorId && !equipped.body) equipped.body = armorId;
  return { ...rest, equipped };
};

export function migrateV2toV3(state) {
  if (!isObj(state) || !Array.isArray(state.party) || !Array.isArray(state.roster)) return state;
  const s = { ...state };
  const inv = isObj(s.inventory) ? s.inventory : {};
  const bag = [
    ...(Array.isArray(s.stash) ? s.stash : []).map(weaponV3),
    ...(Array.isArray(inv.armor) ? inv.armor : []).map(armorV3),
    ...(Array.isArray(inv.infused) ? inv.infused : []).map(materialV3),
    ...(Array.isArray(s.bag) ? s.bag : []),
  ];
  s.bag = bag;
  delete s.stash;
  const scrap = Math.max(0, inv.scrap || 0);
  if (scrap) s.worldvein = (s.worldvein || 0) + scrap * SCRAP_PAYOUT;
  s.inventory = { raw: isObj(inv.raw) ? { ...inv.raw } : { wood: 0, metal: 0, hunt: 0 } };

  const party = (s.party || []).map(memberV3); const roster = (s.roster || []).map(memberV3);
  const geared = withStarterWeapons([...party, ...roster], s.bag);
  s.party = geared.members.slice(0, party.length); s.roster = geared.members.slice(party.length); s.bag = geared.bag;
  if (isObj(s.run)) {
    const rp = Array.isArray(s.run.runParty) ? s.run.runParty.map((m) => {
      const mm = memberV3(m); const live = geared.members.find((x) => x.id === mm?.id);
      return live ? { ...mm, equipped: { ...live.equipped } } : mm;
    }) : s.run.runParty;
    s.run = { ...s.run, runParty: rp };
    if (isObj(s.run.fight) && Array.isArray(s.run.fight.rewards?.gears)) {
      s.run.fight = { ...s.run.fight, rewards: { ...s.run.fight.rewards, gears: s.run.fight.rewards.gears.map(weaponV3) } };
    }
  }
  return JSON.parse(JSON.stringify(s));
}

/** Migrations, keyed by the version they upgrade FROM. 0 = unversioned (pre-M1a positional data). */
export const MIGRATIONS = {
  0: (s) => ensureIds(s),
  1: (s) => migrateV1toV2(s),
  2: (s) => migrateV2toV3(s),
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
