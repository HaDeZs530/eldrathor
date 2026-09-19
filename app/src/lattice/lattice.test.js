/**
 * The lattice — docs/Eldrathor_Growth_Model_Lock.md §1 / §5 and the M2-2 brief §8. The tests are the spec.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyLatticeState, imbueCost, canImbue, imbue, derive, summary, capacity, isReachable, canSwapFinisher, swapFinisher, REASON } from './engine.js';
import { GEOMETRY, RING_SIZES, COMPASS, PROC_HEXES, CORE_ID, hexId, hexDistance, ring, hexToPixel } from './hexLayout.js';
import { GEM_TUNING, GEM_CLASSES, CLASS_LATTICES, CONTENTS, ROLE_MATCH, latticeFor, facetEffectText, coreText, gemCapacity } from './classGems.js';

const rich = { fragments: 999, worldvein: 1e9, tuning: GEM_TUNING.imbue };
const at = (pos) => hexId(pos);
/** Imbue a facet to `levels`, asserting each step is allowed. */
const grow = (def, state, id, levels = 1) => { let s = state; for (let i = 0; i < levels; i++) { const c = canImbue(def, s, id, rich); assert.ok(c.ok, `${id}: ${c.reason}`); s = imbue(def, s, id, rich); } return s; };

// ---------------------------------------------------------------- geometry
test('hexLayout: Core + ring 1 (6) + ring 2 (12) + ring 3 (18) + 4 compass finisher hexes; procs are two ring-2 hexes opposite each other', () => {
  assert.deepEqual(RING_SIZES, { 1: 6, 2: 12, 3: 18, 4: 4 });
  for (const n of [1, 2, 3]) {
    assert.equal(GEOMETRY.filter((c) => c.ring === n).length, RING_SIZES[n]);
    assert.ok(ring(n).every((p) => hexDistance(p) === n));
  }
  assert.equal(GEOMETRY.length, 40);
  assert.equal(new Set(GEOMETRY.map((c) => c.id)).size, 40);
  const fin = GEOMETRY.filter((c) => c.ring === 4);
  assert.deepEqual(fin.map((c) => c.slot).sort(), ['finisher-E', 'finisher-N', 'finisher-S', 'finisher-W']);
  assert.ok(Object.values(COMPASS).every((p) => hexDistance(p) === 4), 'finishers sit on the outer edge');
  // compass points: N / S straight above / below the Core, E / W level with it
  assert.ok(Math.abs(hexToPixel(COMPASS.N).x) < 1e-9 && hexToPixel(COMPASS.N).y < 0 && hexToPixel(COMPASS.S).y > 0);
  assert.ok(Math.abs(hexToPixel(COMPASS.E).y) < 1e-9 && hexToPixel(COMPASS.E).x > 0 && hexToPixel(COMPASS.W).x < 0);
  assert.ok(PROC_HEXES.every((p) => hexDistance(p) === 2));
  assert.deepEqual([PROC_HEXES[0].q + PROC_HEXES[1].q, PROC_HEXES[0].r + PROC_HEXES[1].r], [0, 0], 'opposite each other');
  // neighbours are distance-1 hexes of the geometry; every ring-1 hex touches the Core; a finisher touches ring 3 only
  for (const c of GEOMETRY) for (const n of c.neighbors) assert.equal(hexDistance(c.pos, n === CORE_ID ? { q: 0, r: 0 } : GEOMETRY.find((x) => x.id === n).pos), 1);
  assert.ok(GEOMETRY.filter((c) => c.ring === 1).every((c) => c.neighbors.includes(CORE_ID)));
  for (const f of fin) assert.ok(f.neighbors.length >= 1 && f.neighbors.every((n) => GEOMETRY.find((x) => x.id === n).ring === 3));
});

// ---------------------------------------------------------------- engine
test('engine is generic: adjacency is the only gate, on any lattice', () => {
  const def = { id: 't', core: { id: 'c' }, facets: [
    { id: 'a', neighbors: ['c', 'b'], kind: 'stat', maxLevel: 2, effect: { stat: 'x', perLevel: 0.5 } },
    { id: 'b', neighbors: ['a'], kind: 'stat', maxLevel: 1, effect: { stat: 'x', perLevel: 1 } },
    { id: 'd', neighbors: ['c'], kind: 'dormant', maxLevel: 0, effect: {} },
  ] };
  let s = emptyLatticeState();
  assert.equal(canImbue(def, s, 'b', rich).reason, REASON.unreachable);
  assert.equal(canImbue(def, s, 'd', rich).reason, REASON.dormant);
  assert.equal(canImbue(def, s, 'nope', rich).reason, REASON.unknown);
  assert.equal(canImbue(def, s, 'a', { ...rich, fragments: 0 }).reason, REASON.fragments);
  assert.equal(canImbue(def, s, 'a', { ...rich, worldvein: 19 }).reason, REASON.worldvein);
  assert.equal(canImbue(def, s, 'a', { ...rich, blocked: 'Equip to grow' }).reason, 'Equip to grow');
  s = grow(def, s, 'a');
  assert.ok(isReachable(def, s, 'b'));
  s = grow(def, s, 'b'); s = grow(def, s, 'a');
  assert.equal(canImbue(def, s, 'a', rich).reason, REASON.maxed);
  assert.deepEqual(derive(def, s).statMods, { x: 2 });
  assert.equal(capacity(def), 3);
});

test('cost curve: the n-th imbue on a gem costs 20 × 1.12^n ❖ (1st = 20, 40th ≈ 1,660, a full gem ≈ 15,300) + 1 Vein Fragment', () => {
  assert.deepEqual(GEM_TUNING.imbue, { base: 20, growth: 1.12 });
  assert.equal(imbueCost(0, GEM_TUNING.imbue), 20);
  assert.equal(imbueCost(1, GEM_TUNING.imbue), 22);
  assert.equal(imbueCost(39, GEM_TUNING.imbue), Math.round(20 * 1.12 ** 39));
  assert.ok(Math.abs(imbueCost(39, GEM_TUNING.imbue) - 1660) < 10);
  let total = 0; for (let n = 0; n < 40; n++) total += imbueCost(n, GEM_TUNING.imbue);
  assert.ok(Math.abs(total - 15300) < 100, `full gem ${total}`);
  const def = latticeFor('Tank'); let s = emptyLatticeState();
  s = imbue(def, s, at({ q: 0, r: -1 }), rich); s = imbue(def, s, at({ q: 0, r: -1 }), rich);
  assert.equal(s.worldveinSpent, 20 + 22); assert.equal(s.imbues, 2);
});

// ---------------------------------------------------------------- class lattices
test('class lattices: the July contents ring by ring — 5 + 3 stat facets, 2 procs, 4 stat facets, 2 finishers = exactly 40 imbues; the other 24 hexes are dormant', () => {
  assert.deepEqual(GEM_CLASSES, ['Tank', 'Healer', 'DPS', 'Controller']);
  assert.equal(GEM_TUNING.points, 40);
  for (const k of GEM_CLASSES) {
    const def = CLASS_LATTICES[k]; const c = CONTENTS[k];
    assert.equal(def.facets.length, 40, `${k}: the full geometry`);
    const byRing = (n, kind) => def.facets.filter((f) => f.ring === n && f.kind === kind);
    assert.deepEqual(byRing(1, 'stat').map((f) => f.name), c.ring1.map(([n]) => n), `${k} Row 1 → ring 1`);
    assert.deepEqual(byRing(2, 'stat').map((f) => f.name).sort(), c.ring2.map(([n]) => n).sort(), `${k} Row 2 → ring 2`);
    assert.deepEqual(byRing(2, 'proc').map((f) => f.effect.proc).sort(), [...c.procs].sort(), `${k} procs → the ring-2 specials`);
    assert.ok(byRing(2, 'proc').every((f) => f.slot?.startsWith('proc-')));
    assert.deepEqual(byRing(3, 'stat').map((f) => f.name).sort(), c.ring3.map(([n]) => n).sort(), `${k} Row 4 → ring 3`);
    assert.deepEqual(byRing(4, 'finisher').map((f) => f.effect.finisher).sort(), [...c.finishers].sort(), `${k} finishers → compass points`);
    assert.equal(def.facets.filter((f) => f.kind === 'dormant').length, 24);
    assert.equal(gemCapacity(k), 40, `${k}: 15 + 9 + 2 + 12 + 2`);
    assert.ok(def.facets.filter((f) => f.kind === 'stat').every((f) => f.maxLevel === 3));
    assert.ok(def.facets.filter((f) => f.kind === 'proc').every((f) => f.maxLevel === 1));
    assert.ok(def.facets.filter((f) => f.kind === 'finisher').every((f) => f.maxLevel === 2 && f.exclusiveGroup === 'finisher'));
  }
});

test('adjacency gating: a ring-3 facet is unreachable until a touching ring-2 facet is imbued; a finisher until its ring-3 neighbour is', () => {
  for (const k of GEM_CLASSES) {
    const def = latticeFor(k); let s = emptyLatticeState();
    const r1 = at({ q: 0, r: -1 }), r2 = at({ q: 0, r: -2 }), r3 = at({ q: 0, r: -3 }), fin = at(COMPASS.N);
    assert.equal(canImbue(def, s, r2, rich).reason, REASON.unreachable);
    assert.equal(canImbue(def, s, r3, rich).reason, REASON.unreachable);
    s = grow(def, s, r1);
    assert.equal(canImbue(def, s, r3, rich).reason, REASON.unreachable, 'ring 1 alone does not open ring 3');
    s = grow(def, s, r2);
    assert.equal(canImbue(def, s, fin, rich).reason, REASON.unreachable);
    s = grow(def, s, r3);
    assert.ok(canImbue(def, s, fin, rich).ok);
    // every written facet can be reached from the Core under adjacency alone, and the gem fills to exactly 40
    let full = emptyLatticeState(); let moved = true;
    while (moved) { moved = false; for (const f of def.facets) { if (f.kind === 'dormant') continue; while (canImbue(def, full, f.id, rich).ok) { full = imbue(def, full, f.id, rich); moved = true; } } }
    assert.equal(full.imbues, 40, `${k} fills to 40`);
    assert.equal(def.facets.filter((f) => f.kind !== 'dormant' && !(full.levels[f.id] > 0)).length, 1, 'only the other finisher stays dark');
  }
});

test('exclusive finisher: imbuing one darkens the other; swapping moves its levels (the fee is 200 ❖ + 2 fragments)', () => {
  assert.deepEqual(GEM_TUNING.finisherSwap, { worldvein: 200, fragments: 2 });
  const def = latticeFor('DPS'); let s = emptyLatticeState();
  for (const pos of [{ q: 0, r: -1 }, { q: 0, r: -2 }, { q: 0, r: -3 }, { q: 0, r: 1 }, { q: 0, r: 2 }, { q: 0, r: 3 }]) s = grow(def, s, at(pos));
  const N = at(COMPASS.N), S = at(COMPASS.S);
  assert.equal(canSwapFinisher(def, s, S).ok, false, 'nothing to swap yet');
  s = grow(def, s, N, 2);
  assert.equal(s.finisher, N);
  assert.equal(canImbue(def, s, S, rich).reason, REASON.exclusive);
  assert.deepEqual(derive(def, s).finisher, { id: 'onslaught', level: 2 });
  assert.ok(canSwapFinisher(def, s, S).ok);
  const imbuesBefore = s.imbues;
  s = swapFinisher(def, s, S, { fee: 200 });
  assert.deepEqual([s.finisher, s.levels[S], s.levels[N], s.imbues], [S, 2, undefined, imbuesBefore]);
  assert.deepEqual(derive(def, s).finisher, { id: 'cullingStrike', level: 2 });
});

test('every facet’s effect at each level: stat +4 % per level (max +12 %), flavor stats +10 % per level; procs at 1; finishers at 1 and 2', () => {
  assert.equal(GEM_TUNING.statPerLevel, 0.04); assert.equal(GEM_TUNING.flavorPerLevel, 0.1);
  for (const k of GEM_CLASSES) {
    const def = latticeFor(k);
    for (const f of def.facets) {
      if (f.kind === 'dormant') { assert.equal(f.maxLevel, 0); continue; }
      for (let lv = 1; lv <= f.maxLevel; lv++) {
        const s = { ...emptyLatticeState(), levels: { [f.id]: lv }, finisher: f.kind === 'finisher' ? f.id : null };
        const d = derive(def, s);
        if (f.kind === 'stat') {
          const per = ['tauntStrength', 'controlStrength'].includes(f.effect.stat) ? 0.1 : 0.04;
          assert.ok(Math.abs(d.statMods[f.effect.stat] - per * lv) < 1e-9, `${k} ${f.name} L${lv}`);
          assert.equal(facetEffectText(f, lv), `+${Math.round(per * lv * 100)}% ${f.effect.stat === 'hp' ? 'HP' : facetEffectText(f, lv).split('% ')[1]}`);
        } else if (f.kind === 'proc') { assert.deepEqual(d.procs, [f.effect.proc]); assert.ok(GEM_TUNING.procs[f.effect.proc]); assert.ok(facetEffectText(f, lv).length > 10); }
        else { assert.deepEqual(d.finisher, { id: f.effect.finisher, level: lv }); assert.ok(GEM_TUNING.finishers[f.effect.finisher]); assert.notEqual(facetEffectText(f, 1), lv === 2 ? facetEffectText(f, 2) : null); }
      }
    }
  }
  // the numbers table (ClassGems_Live §3), spot-checked where a level changes a value
  const F = GEM_TUNING.finishers; const P = GEM_TUNING.procs;
  assert.deepEqual([F.immovable.cap, F.aegisWall.shield, F.onslaught.cap, F.cullingStrike.every, F.ruinousMark.vuln, F.sanctuary.tick, F.lifevein.cd], [[0.3, 0.2], [0.1, 0.15], [0.6, 0.8], [8000, 6000], [0.2, 0.3], [0.02, 0.03], [15000, 10000]]);
  assert.deepEqual([F.cullingStrike.mult, F.wardensChains.slow, F.wardensChains.weaken, F.lifevein.heal, F.aegisWall.every, F.sanctuary.every], [2, 0.35, 0.35, 0.9, 10000, 2000]);
  assert.deepEqual([P.thornward.reflect, P.secondSkin.below, P.secondSkin.mitAdd, P.secondSkin.ms, P.secondSkin.cd], [0.15, 0.35, 0.3, 3000, 20000]);
  assert.deepEqual([P.emberBrand.chance, P.emberBrand.burnPerSec, P.emberBrand.maxStacks, P.emberBrand.ms], [0.25, 0.04, 5, 4000]);
  assert.deepEqual([P.execution.below, P.execution.mult, P.execution.cd], [0.25, 1.5, 6000]);
  assert.deepEqual([P.enfeeble.chance, P.enfeeble.vuln, P.enfeeble.maxStacks, P.enfeeble.ms], [0.25, 0.05, 5, 6000]);
  assert.deepEqual([P.wither.slow, P.wither.ms, P.wither.every], [0.2, 3000, 8000]);
  assert.deepEqual([P.lifebloom.chance, P.lifebloom.hot, P.lifebloom.ms], [0.3, 0.2, 4000]);
  assert.deepEqual([P.guardianSpirit.below, P.guardianSpirit.heal, P.guardianSpirit.cd], [0.3, 0.25, 15000]);
  const C = GEM_TUNING.core;
  assert.deepEqual([C.Tank.tauntMs, C.Tank.mitAdd, C.Tank.cd, C.Tank.mana], [4000, 0.15, 10000, 20]);
  assert.deepEqual([C.Healer.base, C.Healer.cd, C.Healer.mana], [25, 7000, 25]);
  assert.deepEqual([C.DPS.mult, C.DPS.cd, C.DPS.mana], [2.5, 8000, 20]);
  assert.deepEqual([C.Controller.stunMs, C.Controller.bossStunMs, C.Controller.bossImmuneMs, C.Controller.cd, C.Controller.mana], [1500, 750, 10000, 12000, 30]);
  for (const k of GEM_CLASSES) assert.ok(coreText(k).includes('mana'));
  assert.deepEqual(ROLE_MATCH, { Bulwark: 'Tank', Warden: 'Healer', Striker: 'DPS', Adept: 'Controller' });
});

test('summary: the live cumulative readout totals every stat, then lists procs and the finisher', () => {
  const def = latticeFor('Tank'); let s = emptyLatticeState();
  s = grow(def, s, at({ q: 0, r: -1 }), 3); // Fortified +HP
  s = grow(def, s, at({ q: 0, r: 1 }), 2); // Tempered +HP
  s = grow(def, s, at({ q: 1, r: -1 }), 1); // Ironscale
  s = grow(def, s, at(PROC_HEXES[0]));
  const lines = summary(def, s, { statLabel: (k) => k, procLabel: (k) => GEM_TUNING.procs[k].name });
  assert.deepEqual(lines, ['+20% hp', '+4% mitigation', 'Thornward']);
  assert.deepEqual([derive(def, s).imbues, derive(def, s).imbuedFacets], [7, 4]);
});
