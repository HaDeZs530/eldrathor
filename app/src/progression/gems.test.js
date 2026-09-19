/**
 * Class gems live — docs/Eldrathor_Growth_Model_Lock.md §1 + docs/Eldrathor_ClassGems_Live_Lock.md §4–§5
 * and the M2-2 brief §8: drops, crossing / matching, gem-bound fragments, save round-trip, gems in combat.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeGem, isGem, gemProgress, gemDropChance, rollGemDrop, isMatching, isCrossing, matchAmp, gemEffects, gemStatMods,
  addFragments, awardLevelFragments, fragmentLine, canImbueGem, imbueGem, canSwapGemFinisher, swapGemFinisher,
} from './gems.js';
import { GEM_TUNING, GEM_CLASSES, latticeFor } from '../lattice/classGems.js';
import { hexId, COMPASS, PROC_HEXES } from '../lattice/hexLayout.js';
import { imbue, emptyLatticeState } from '../lattice/engine.js';
import { rollRewards } from '../combat/rewards.js';
import { simulateFight, mulberry32 } from '../combat/simulate.js';
import { spawnEnemies } from '../combat/enemies.js';
import { deriveStats } from '../combat/derive.js';
import { FRESH_PARTY } from '../combat/balance.test.js';
import { serialize, deserialize, SAVE_VERSION } from '../save/save.js';
import { sellValue } from './items.js';
import { bulkSell, bagView } from './bag.js';
import { reconcileAfk, emptyAfkState, assignJob, startJob, summaryLines } from '../afkRuntime.js';

const at = (pos) => hexId(pos);
/** A gem with the given facets imbued (adjacency is the engine's job — these fixtures set levels directly). */
const gemWith = (gemClass, levels, finisher = null) => {
  const imbues = Object.values(levels).reduce((a, b) => a + b, 0);
  return makeGem({ gemClass, lattice: { levels, finisher, imbues, worldveinSpent: 0 } });
};
const SPINE_N = [{ q: 0, r: -1 }, { q: 0, r: -2 }, { q: 0, r: -3 }];
const SPINE_S = [{ q: 0, r: 1 }, { q: 0, r: 2 }, { q: 0, r: 3 }];

// ---------------------------------------------------------------- item + drops
test('gem item: { id, kind: gem, gemClass, lattice, fragments: { unspent, imbued }, name } — no tier, no rarity, never sold', () => {
  const g = makeGem({ gemClass: 'Tank' });
  assert.deepEqual(Object.keys(g).sort(), ['fragments', 'gemClass', 'id', 'kind', 'lattice', 'name']);
  assert.deepEqual([g.kind, g.name, g.fragments, g.lattice.imbues], ['gem', 'Tank Gem', { unspent: 0, imbued: 0 }, 0]);
  assert.ok(g.id.startsWith('g-') && isGem(g));
  assert.equal(gemProgress(gemWith('Tank', { [at(SPINE_N[0])]: 3 })), '3/40');
  assert.equal(sellValue(g), 0);
  const r = bulkSell([g], [g.id], new Set());
  assert.deepEqual([r.sold, r.vein, r.bag.length], [0, 0, 1], 'bulk sell never takes a gem');
  assert.deepEqual(bagView([g], { slot: 'gem' }).map((i) => i.id), [g.id]);
  assert.deepEqual(bagView([g], { filter: 'gem' }).length, 1);
});

test('drops: rares 20 %, bosses 35 %, a named variant +10 %, class uniform over the four, nothing from normal / crystal nodes, no pity', () => {
  assert.deepEqual(GEM_TUNING.drops, { rare: 0.2, boss: 0.35, named: 0.1 });
  assert.deepEqual([gemDropChance('rare'), gemDropChance('boss'), gemDropChance('normal'), gemDropChance('crystal'), gemDropChance('sanctuary')], [0.2, 0.35, 0, 0, 0]);
  assert.ok(Math.abs(gemDropChance('rare', true) - 0.3) < 1e-9 && Math.abs(gemDropChance('boss', true) - 0.45) < 1e-9 && Math.abs(gemDropChance('normal', true) - 0.1) < 1e-9);
  const rng = mulberry32(777);
  const rate = (args, n = 8000) => { let hits = 0; const cls = {}; for (let i = 0; i < n; i++) { const g = rollRewards({ area: 3, rng, ...args }).gems[0]; if (g) { hits += 1; cls[g.gemClass] = (cls[g.gemClass] || 0) + 1; } } return { rate: hits / n, cls, hits }; };
  const rare = rate({ nodeType: 'rare' }); const boss = rate({ nodeType: 'boss' }); const named = rate({ nodeType: 'rare', named: true });
  assert.ok(Math.abs(rare.rate - 0.2) < 0.02, `rare ${rare.rate}`);
  assert.ok(Math.abs(boss.rate - 0.35) < 0.02, `boss ${boss.rate}`);
  assert.ok(Math.abs(named.rate - 0.3) < 0.02, `named rare ${named.rate}`);
  assert.equal(rate({ nodeType: 'normal' }, 1500).hits, 0);
  assert.equal(rate({ nodeType: 'crystal' }, 1500).hits, 0);
  for (const k of GEM_CLASSES) assert.ok(Math.abs(boss.cls[k] / boss.hits - 0.25) < 0.04, `${k} share ${(boss.cls[k] / boss.hits).toFixed(3)}`);
  // consuming no rng when no drop is possible keeps every other roll where it was
  let calls = 0; rollGemDrop(() => { calls += 1; return 0; }, { nodeType: 'normal' }); assert.equal(calls, 0);
});

// ---------------------------------------------------------------- crossing / matching
test('crossing grants exactly one Core ability; matching grants none and amplifies the personal innate by 1 + 0.5 × imbues/40; a Resonator always crosses', () => {
  for (const [arch, cls] of [['Bulwark', 'Tank'], ['Warden', 'Healer'], ['Striker', 'DPS'], ['Adept', 'Controller']]) {
    assert.ok(isMatching(arch, cls) && !isCrossing(arch, cls));
    const fx = gemEffects(arch, makeGem({ gemClass: cls }));
    assert.equal(fx.coreAbility, null, `${arch} + ${cls}: no second ability`);
    for (const other of GEM_CLASSES.filter((c) => c !== cls)) {
      const x = gemEffects(arch, makeGem({ gemClass: other }));
      assert.ok(x.crossing && x.coreAbility && x.coreAbility.id === GEM_TUNING.core[other].id && x.innateAmp === 1, `${arch} + ${other} crosses`);
    }
  }
  for (const cls of GEM_CLASSES) assert.ok(isCrossing('Resonator', cls) && gemEffects('Resonator', makeGem({ gemClass: cls })).coreAbility);
  assert.equal(matchAmp(makeGem({ gemClass: 'Tank' })), 1);
  assert.equal(matchAmp(gemWith('Tank', { [at(SPINE_N[0])]: 3, [at(SPINE_S[0])]: 3, [at({ q: 1, r: -1 })]: 3, [at({ q: 1, r: 0 })]: 1 })), 1 + 0.5 * 10 / 40);
  assert.equal(matchAmp({ kind: 'gem', lattice: { imbues: 40 } }), 1.5);
  assert.equal(matchAmp({ kind: 'gem', lattice: { imbues: 400 } }), 1.5, 'capped at ×1.5');
  assert.equal(gemEffects('Bulwark', null), null);
});

test('stat facets flow into deriveStats through the worn gem: +4 % of that stat per level; crit damage adds to the multiplier (Progression §5)', () => {
  const base = deriveStats({ archetype: 'Striker', level: 1 });
  const gem = gemWith('DPS', { [at({ q: 0, r: -1 })]: 3, [at({ q: 1, r: -1 })]: 2, [at({ q: 1, r: 0 })]: 1, [at({ q: -1, r: 0 })]: 3, [at({ q: 2, r: -2 })]: 3 });
  assert.deepEqual(gemStatMods(gem), { power: 0.12, critChance: 0.08, attackSpeed: 0.04, critDamage: 0.12, hp: 0.12 });
  const d = deriveStats({ archetype: 'Striker', level: 1, gemItem: gem });
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);
  near(d.hitDamage, base.hitDamage * 1.12); near(d.critChance, base.critChance * 1.08); near(d.swingInterval, base.swingInterval / 1.04);
  near(d.maxHp, base.maxHp * 1.12); near(d.critMult, base.critMult + 0.12);
  assert.deepEqual(deriveStats({ archetype: 'Striker', level: 1, gemItem: makeGem({ gemClass: 'DPS' }) }), base, 'an empty gem changes nothing');
});

// ---------------------------------------------------------------- fragments
test('fragments are gem-bound: a level-up feeds ONLY the worn gem; unworn gems gain nothing; fragments survive unequip, transfer and a save round-trip', () => {
  assert.equal(GEM_TUNING.fragmentsPerLevel, 1);
  const worn = makeGem({ gemClass: 'Tank' }); const spare = makeGem({ gemClass: 'Healer' });
  const kessa = { id: 'c1', name: 'Kessa', archetype: 'Bulwark', level: 3, equipped: { gem: worn.id } };
  const orin = { id: 'c2', name: 'Orin', archetype: 'Warden', level: 3, equipped: {} };
  let bag = [worn, spare];
  const r = awardLevelFragments(bag, [{ member: kessa, levelsGained: 2 }, { member: orin, levelsGained: 1 }]);
  bag = r.bag;
  assert.deepEqual(bag.map((g) => g.fragments.unspent), [2, 0]);
  assert.deepEqual(r.awards.map(fragmentLine), ["Kessa's Tank Gem +2 fragments"]);
  assert.equal(fragmentLine({ memberName: 'Kessa', gemName: 'Tank Gem', n: 1 }), "Kessa's Tank Gem +1 fragment");
  assert.equal(awardLevelFragments(bag, [{ member: kessa, levelsGained: 0 }]).awards.length, 0);
  assert.equal(awardLevelFragments(bag, [{ member: { ...kessa, equipped: { gem: 'gone' } }, levelsGained: 1 }]).bag, bag, 'a missing gem is a no-op');
  // transfer: Kessa unequips, Orin wears the same gem — the fragments travelled with it, and it grows for Orin now
  const orin2 = { ...orin, equipped: { gem: worn.id } };
  const t = awardLevelFragments(bag, [{ member: { ...kessa, equipped: {} }, levelsGained: 1 }, { member: orin2, levelsGained: 1 }]);
  assert.deepEqual(t.bag.map((g) => g.fragments.unspent), [3, 0]);
  assert.deepEqual(t.awards.map((a) => a.memberName), ['Orin']);
  // imbue spends the gem's own fragments and sinks Worldvein into the gem
  let g = t.bag[0];
  assert.equal(canImbueGem(g, at(SPINE_N[0]), { worldvein: 1000, worn: false }).reason, 'Equip to grow');
  assert.equal(canImbueGem(g, at(SPINE_N[0]), { worldvein: 5 }).reason, 'Not enough Worldvein');
  const step = imbueGem(g, at(SPINE_N[0])); g = step.gem;
  assert.deepEqual([step.cost, g.fragments, g.lattice.imbues, g.lattice.worldveinSpent], [20, { unspent: 2, imbued: 1 }, 1, 20]);
  assert.equal(canImbueGem({ ...g, fragments: { unspent: 0, imbued: 1 } }, at(SPINE_N[0]), { worldvein: 1000 }).reason, 'No Vein Fragments on this gem');
  // save round-trip keeps the lattice and both fragment counts
  const state = { party: [kessa], roster: [orin2], worldvein: 80, bag: [g, spare] };
  const back = deserialize(serialize(state));
  assert.ok(back.ok); assert.equal(SAVE_VERSION, 5);
  assert.deepEqual(back.state.bag[0], g);
  assert.equal(addFragments([g], 'nope', 3)[0], g);
});

test('Train levels count: the gem the trainee wears gains a fragment per level, and the Offline summary says so', () => {
  const gem = makeGem({ gemClass: 'DPS' });
  const party = [{ id: 'c1', name: 'Kessa', level: 9 }];
  const roster = [{ id: 'c3', name: 'Vayle', level: 1, xp: 0, equipped: { gem: gem.id } }];
  let s = assignJob({ ...emptyAfkState() }, { kind: 'idle' }, 'c3');
  s = { ...s, idle: startJob(s.idle, 0) };
  const r = reconcileAfk({ state: s, inventory: { raw: {} }, bag: [gem], worldvein: 0, party, roster, unlocked: 3, now: 6 * 60 * 60 * 1000, rng: () => 0.99 });
  const levels = r.rosterNext[0].level - 1;
  assert.ok(levels >= 1, 'Vayle levelled on the bench');
  assert.equal(r.bag[0].fragments.unspent, levels);
  assert.ok(summaryLines(r.summary).some((l) => l === `Vayle's DPS Gem +${levels} fragment${levels === 1 ? '' : 's'}`));
});

test('finisher swap on a gem: 200 ❖ + 2 fragments, levels move across, reasons are stated', () => {
  let g = gemWith('Healer', Object.fromEntries([...SPINE_N, ...SPINE_S].map((p) => [at(p), 1]).concat([[at(COMPASS.N), 2]])), at(COMPASS.N));
  g = { ...g, fragments: { unspent: 1, imbued: 8 } };
  assert.equal(canSwapGemFinisher(g, at(COMPASS.S), { worldvein: 999 }).reason, 'Needs 2 Vein Fragments');
  g = { ...g, fragments: { unspent: 2, imbued: 8 } };
  assert.equal(canSwapGemFinisher(g, at(COMPASS.S), { worldvein: 199 }).reason, 'Not enough Worldvein');
  assert.equal(canSwapGemFinisher(g, at(COMPASS.S), { worldvein: 999, worn: false }).reason, 'Equip to grow');
  assert.ok(canSwapGemFinisher(g, at(COMPASS.S), { worldvein: 200 }).ok);
  const r = swapGemFinisher(g, at(COMPASS.S));
  assert.deepEqual([r.cost, r.gem.fragments.unspent, r.gem.lattice.finisher, r.gem.lattice.levels[at(COMPASS.S)]], [200, 0, at(COMPASS.S), 2]);
  assert.deepEqual(gemEffects('Warden', r.gem).finisher, { id: 'lifevein', level: 2 });
});

// ---------------------------------------------------------------- gems in combat
const withGem = (party, i, gem) => party.map((m, k) => (k === i ? { ...m, gemItem: gem } : m));
const fight = (party, seed = 11, type = 'rare') => simulateFight({ party, enemies: spawnEnemies(2, type, false, { rng: mulberry32(9) }), seed });

test('no gems → the fight is bit-identical to before (the balance gates still hold with no gems equipped)', () => {
  const a = fight(FRESH_PARTY); const b = fight(FRESH_PARTY.map((m) => ({ ...m, gemItem: null })));
  assert.deepEqual(a.events, b.events);
  assert.ok(!a.events.some((e) => ['gem', 'proc', 'finisher'].includes(e.type)));
});

test('crossing in a fight: exactly one Core ability fires as `gem` events; a matching gem fires none and amplifies the innate instead', () => {
  // Striker (index 2 of the fresh party is the Striker) wearing a Healer gem → Gem Heal
  const striker = FRESH_PARTY.findIndex((m) => m.archetype === 'Striker'); const bulwark = FRESH_PARTY.findIndex((m) => m.archetype === 'Bulwark'); const warden = FRESH_PARTY.findIndex((m) => m.archetype === 'Warden');
  const cross = fight(withGem(FRESH_PARTY, striker, makeGem({ gemClass: 'Healer' })), 5, 'boss');
  const gemEvents = cross.events.filter((e) => e.type === 'gem');
  assert.ok(gemEvents.length > 0 && gemEvents.every((e) => e.name === 'Heal' && e.source === `p${striker}`));
  for (let k = 1; k < gemEvents.length; k++) assert.ok(gemEvents[k].t - gemEvents[k - 1].t >= GEM_TUNING.core.Healer.cd, 'respects its cooldown');
  const burst = fight(withGem(FRESH_PARTY, bulwark, makeGem({ gemClass: 'DPS' })), 5, 'boss');
  const b0 = burst.events.find((e) => e.type === 'gem'); const hit = burst.events[burst.events.indexOf(b0) + 1];
  assert.ok(b0.name === 'Burst' && hit.gem && hit.raw > 0);
  const stun = fight(withGem(FRESH_PARTY, warden, makeGem({ gemClass: 'Controller' })), 5, 'boss');
  const s0 = stun.events.find((e) => e.type === 'gem' && e.name === 'Stun');
  assert.equal(s0.amount, GEM_TUNING.core.Controller.bossStunMs, 'bosses are stunned 0.75 s');
  const taunt = fight(withGem(FRESH_PARTY, striker, makeGem({ gemClass: 'Tank' })), 5, 'boss');
  assert.ok(taunt.events.some((e) => e.type === 'gem' && e.name === 'Taunt'));
  // matching: a full Healer gem on the Warden → Mend ×1.5, and no `gem` ability at all
  const plain = fight(FRESH_PARTY, 5, 'boss'); const mend = (r) => r.events.find((e) => e.type === 'innate' && e.name === 'Mend').amount;
  const full = { kind: 'gem', gemClass: 'Healer', name: 'Healer Gem', lattice: { levels: {}, finisher: null, imbues: 40, worldveinSpent: 0 }, fragments: { unspent: 0, imbued: 40 } };
  const match = fight(withGem(FRESH_PARTY, warden, full), 5, 'boss');
  assert.equal(match.events.filter((e) => e.type === 'gem').length, 0);
  assert.equal(mend(match), Math.round(mend(plain) * 1.5));
});

test('procs and finishers fire as `proc` / `finisher` feed events and change the fight', () => {
  const idx = (a) => FRESH_PARTY.findIndex((m) => m.archetype === a);
  const count = (r, type, name) => r.events.filter((e) => e.type === type && e.name === name).length;
  // DPS gem on the Striker: Ember Brand + Execution + Culling Strike II
  const dps = gemWith('DPS', { [at(PROC_HEXES[0])]: 1, [at(PROC_HEXES[1])]: 1, [at(COMPASS.S)]: 2 }, at(COMPASS.S));
  const a = fight(withGem(FRESH_PARTY, idx('Striker'), dps), 21, 'boss'); const base = fight(FRESH_PARTY, 21, 'boss');
  assert.ok(count(a, 'proc', 'Ember Brand') > 0 && count(a, 'finisher', 'Culling Strike') > 0);
  // Execution needs an enemy under 25 % — a rare the party can actually bring down
  const ex = fight(withGem(FRESH_PARTY, idx('Striker'), dps), 21, 'rare');
  assert.ok(count(ex, 'proc', 'Execution') > 0);
  const exHit = ex.events[ex.events.findIndex((e) => e.type === 'proc' && e.name === 'Execution') + 1];
  assert.equal(exHit.proc, 'Execution');
  const culls = a.events.filter((e) => e.type === 'finisher' && e.name === 'Culling Strike');
  assert.ok(culls.every((e, k) => k === 0 || e.t - culls[k - 1].t >= 6000), 'Culling Strike II: every 6 s');
  assert.ok(a.stats.party[idx('Striker')].dealt > base.stats.party[idx('Striker')].dealt || a.result.durationMs < base.result.durationMs);
  // Tank gem on the Bulwark: Thornward reflects while taunting; Immovable II caps a hit at 20 % max HP while taunting
  const tank = gemWith('Tank', { [at(PROC_HEXES[0])]: 1, [at(PROC_HEXES[1])]: 1, [at(COMPASS.N)]: 2 }, at(COMPASS.N));
  const t = fight(withGem(FRESH_PARTY, idx('Bulwark'), tank), 21, 'boss');
  assert.ok(count(t, 'proc', 'Thornward') > 0);
  const maxHp = deriveStats(FRESH_PARTY[idx('Bulwark')]).maxHp;
  const aegis = t.events.filter((e) => e.type === 'innate' && e.name === 'Aegis');
  for (const e of t.events.filter((x) => x.enemy && x.target === `p${idx('Bulwark')}` && aegis.some((g) => x.t > g.t && x.t <= g.t + 4000))) assert.ok(e.amount <= Math.round(maxHp * 0.2), `hit ${e.amount} ≤ 20 % of ${maxHp}`);
  // Healer gem on the Warden: Sanctuary ticks every 2 s; Controller gem on the Adept-less party via the Resonator: Wither slows
  const heal = gemWith('Healer', { [at(COMPASS.N)]: 1, [at(PROC_HEXES[1])]: 1 }, at(COMPASS.N));
  const h = fight(withGem(FRESH_PARTY, idx('Warden'), heal), 21, 'boss');
  const ticks = h.events.filter((e) => e.type === 'finisher' && e.name === 'Sanctuary');
  assert.ok(ticks.length > 3 && ticks.every((e, k) => k === 0 || e.t - ticks[k - 1].t === 2000));
  const ctl = gemWith('Controller', { [at(PROC_HEXES[0])]: 1, [at(PROC_HEXES[1])]: 1, [at(COMPASS.S)]: 1 }, at(COMPASS.S));
  const c = fight(withGem(FRESH_PARTY, idx('Striker'), ctl), 21, 'boss');
  assert.ok(count(c, 'proc', 'Enfeeble') > 0 && count(c, 'proc', 'Wither') > 0);
  // vulnerability is real: with Ruinous Mark I (+20 %) every party hit lands above its plain raw × (1 − mit)
  const marked = c.events.filter((e) => !e.enemy && (e.type === 'hit' || e.type === 'crit') && e.raw > 20);
  assert.ok(marked.length > 0 && marked.every((e) => e.amount >= Math.round(e.raw * (1 - e.mit) * 1.2) - 1), 'Ruinous Mark amplifies every hit');
  // an Aegis Wall shield soaks damage before HP
  const wall = gemWith('Tank', { [at(COMPASS.S)]: 2 }, at(COMPASS.S));
  const w = fight(withGem(FRESH_PARTY, idx('Bulwark'), wall), 21, 'boss');
  assert.ok(count(w, 'finisher', 'Aegis Wall') > 0);
  assert.ok(w.events.some((e) => e.type === 'snap' && e.party.some((p) => p.shield > 0)), 'the shield stands on the party between hits');
});

test('engine state a gem carries is the lattice state: imbue through the engine matches imbueGem', () => {
  const def = latticeFor('Tank'); const id = at(SPINE_N[0]);
  const viaEngine = imbue(def, emptyLatticeState(), id, { tuning: GEM_TUNING.imbue });
  const viaGem = imbueGem({ ...makeGem({ gemClass: 'Tank' }), fragments: { unspent: 1, imbued: 0 } }, id).gem.lattice;
  assert.deepEqual(viaGem, viaEngine);
});
