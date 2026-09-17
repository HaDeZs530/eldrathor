/**
 * M1a — save & identity (Progression Loop Lock §1). Tests are the spec.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serialize, deserialize, createStore, createSaver, countedRng, ensureIds, SAVE_VERSION, SAVE_KEY, QUARANTINE_PREFIX, RESET_NOTICE } from './save.js';
import { mulberry32 } from '../combat/simulate.js';

const memStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), keys: () => [...m.keys()] }; };

const midRun = () => ({
  party: [{ id: 'c-1', name: 'Kessa', archetype: 'Bulwark', level: 3, xp: 0, weaponId: 'w-1' }, { id: 'c-2', name: 'Orin', archetype: 'Warden', level: 3, xp: 0, weaponId: 'w-2' }],
  roster: [{ id: 'c-3', name: 'Nyra', archetype: 'Adept', level: 1, xp: 0, weaponId: 'w-3' }],
  worldvein: 120, unlocked: 2,
  stash: [{ id: 'w-1', name: 'Fine Sword', tier: 'Fine', weaponType: 'Greatsword', baseRating: 61, empower: 0 }, { id: 'w-2', name: 'Common Staff', tier: 'Common', weaponType: 'Staff', baseRating: 30, empower: 0 }, { id: 'w-3', name: 'Common Staff', tier: 'Common', weaponType: 'Staff', baseRating: 30, empower: 0 }],
  inventory: { raw: { wood: 4 }, infused: [{ quality: 'Common', qty: 2 }], scrap: 1, armor: [{ id: 'a-1', name: 'Veinwoven Vest', quality: 'Common', rating: 28 }] },
  afk: { gatherSlots: [{ charKey: 'c-3', areaId: 1, family: 'wood', running: true, progress: 0.4 }], process: { charKey: null }, idle: { charKey: null } },
  run: {
    areaId: 1, runStage: 'route', currentId: 'n4', prevId: 'n2',
    territory: { nodes: [{ id: 'n0', cleared: true, revealed: true }, { id: 'n4', revealed: true, scouted: true }], edges: [['n0', 'n4']], rares: [{ id: 'r0', nodeId: 'n9', alive: true }], clock: 3 },
    runParty: [{ id: 'c-1', name: 'Kessa' }, { id: 'c-2', name: 'Orin' }], runHp: { 'c-1': 0.6, 'c-2': 1 },
    runMods: { dmgMult: 1.1, mitAdd: 0 }, runVein: 15, partyHP: 0.8, log: [{ id: 1, t: 'x', k: 'sys', clock: 0 }], logSeen: 1, logSeq: 1,
    fight: null, fightNode: null, cameraPan: { x: -120, y: -300 }, seed: 123456, rngCount: 42, fightIndex: 3,
  },
});

test('round-trips a mid-run state exactly (versioned, with savedAt)', () => {
  const s = midRun();
  const json = serialize(s, () => 1000);
  const parsed = JSON.parse(json);
  assert.equal(parsed.v, SAVE_VERSION); assert.equal(parsed.savedAt, 1000);
  const d = deserialize(json);
  assert.ok(d.ok);
  assert.deepEqual(d.state, s);
});

test('corrupt save → quarantined under a timestamped key, main key removed, fresh start with the error', () => {
  const st = memStorage(); st.setItem(SAVE_KEY, '{"v":1,"party":[');
  const store = createStore(st, () => 777);
  const r = store.load();
  assert.equal(r.fresh, true); assert.equal(r.quarantined, true); assert.match(r.error, /bad JSON/);
  assert.equal(st.getItem(SAVE_KEY), null);
  assert.equal(st.getItem(QUARANTINE_PREFIX + '777'), '{"v":1,"party":[');
  // a valid-JSON but foreign object is also refused
  st.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, hello: 'world' }));
  const r2 = store.load(); assert.equal(r2.quarantined, true); assert.match(r2.error, /party/);
  // a save from a NEWER build is refused (quarantined), never read
  st.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION + 5, party: [], roster: [], worldvein: 1 }));
  const r3 = store.load(); assert.equal(r3.quarantined, true); assert.match(r3.error, /newer/);
});

test('countedRng resumes the exact sequence after fast-forwarding the saved draw count', () => {
  const live = countedRng(99);
  const first = Array.from({ length: 10 }, () => live());
  assert.equal(live.count, 10);
  const resumed = countedRng(live.seed, live.count);
  const a = Array.from({ length: 5 }, () => live());
  const b = Array.from({ length: 5 }, () => resumed());
  assert.deepEqual(a, b);
  assert.equal(resumed.count, 15);
  // and it is the plain mulberry32 stream
  const ref = mulberry32(99); const refFirst = Array.from({ length: 10 }, () => ref());
  assert.deepEqual(first, refFirst);
});

test('saver: debounced to one write per second, flushed immediately when the page goes hidden', () => {
  let now = 0; let tid = 0; const timers = new Map();
  const st = { setTimeout: (fn, ms) => { tid += 1; timers.set(tid, { at: now + ms, fn }); return tid; }, clearTimeout: (h) => timers.delete(h) };
  const advance = (ms) => { now += ms; for (const [h, t] of [...timers]) if (t.at <= now) { timers.delete(h); t.fn(); } };
  const writes = []; const store = { save: (s) => { writes.push(s.worldvein); return true; } };
  const listeners = {}; const doc = { hidden: false, addEventListener: (e, f) => { listeners[e] = f; }, removeEventListener: () => {} }; const win = { addEventListener: () => {}, removeEventListener: () => {} };
  const saver = createSaver({ store, delayMs: 1000, setTimeout: st.setTimeout, clearTimeout: st.clearTimeout, doc, win });
  saver.schedule({ worldvein: 1 }); saver.schedule({ worldvein: 2 }); saver.schedule({ worldvein: 3 });
  advance(999); assert.deepEqual(writes, []);
  advance(1); assert.deepEqual(writes, [3]); // trailing write with the latest state
  saver.schedule({ worldvein: 4 });
  doc.hidden = true; listeners.visibilitychange();
  assert.deepEqual(writes, [3, 4]); // flushed at once, no wait
  advance(2000); assert.deepEqual(writes, [3, 4]); // nothing pending, no duplicate
  saver.dispose();
});

test('export / import: importText validates and installs the save; reset clears it', () => {
  const st = memStorage(); const store = createStore(st, () => 5);
  store.save(midRun());
  const text = store.exportText();
  assert.ok(text.includes(`"v":${SAVE_VERSION}`));
  store.reset(); assert.equal(store.load().fresh, true);
  assert.equal(store.importText('not json').ok, false);
  const imp = store.importText(text); assert.ok(imp.ok);
  const back = store.load(); assert.equal(back.fresh, false); assert.equal(back.state.run.currentId, 'n4');
});

test('§9 save policy (Item Model lock): an OLDER save is discarded on load — fresh game, "Save reset for a game update", copy kept; import refuses it too', () => {
  const st = memStorage(); const store = createStore(st, () => 4242);
  const old = JSON.stringify({ v: SAVE_VERSION - 1, party: [{ id: 'c-1', name: 'Kessa' }], roster: [], worldvein: 500, bag: [], run: null });
  st.setItem(SAVE_KEY, old);
  const r = store.load();
  assert.equal(r.fresh, true); assert.equal(r.reset, true); assert.equal(r.quarantined, false); assert.equal(r.state, null);
  assert.match(r.error, new RegExp(RESET_NOTICE));
  assert.equal(st.getItem(SAVE_KEY), null, 'the old save is gone');
  assert.equal(st.getItem(QUARANTINE_PREFIX + '4242'), old, 'a copy is kept for deliberate carry-over');
  assert.equal(store.importText(old).ok, false, 'no migration path — import refuses an older version');
  // the current version still round-trips, and the unversioned prototype format is simply refused
  assert.ok(deserialize(serialize(midRun(), () => 1)).ok);
  assert.equal(deserialize(JSON.stringify({ party: [], roster: [], worldvein: 1 })).outdated, true);
  // ensureIds is still a plain helper (used at boot for default data), never overwriting an existing id
  assert.equal(ensureIds({ party: [{ id: 'c-keep' }], roster: [], stash: [] }).party[0].id, 'c-keep');
});
