/**
 * The Veinbinder — docs/Eldrathor_Growth_Model_Lock.md §2 and the M2-3 brief §5. The tests are the spec:
 * the three worked Resonance examples, the rank cap, the cost curve, and ONE test per upgrade line
 * proving its effect lands where the lock says.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resonance, rankFor, rankNumeral, resonanceStatus, RESONANCE_RANKS, MAX_RANK } from './resonance.js';
import { PLAYER_TUNING, BOND_IDS, CRAFT_IDS, upgradeCost, levelCap, canBuy, buy, bondMods, craftMods, extraHearthSlots, effectText, normalizeUpgrades, NO_CRAFT, BUY_REASON } from './upgrades.js';
import { deriveStats, equip } from '../combat/derive.js';
import { rollRewards } from '../combat/rewards.js';
import { mulberry32 } from '../combat/simulate.js';
import { rarityIndex } from '../progression/items.js';
import { reconcileAfk, emptyAfkState, assignJob, startJob, gatherYield, gatherSlotCount, withGatherSlots, BASE_GATHER_SLOTS, PROCESS_CYCLE_MS, GATHER_CYCLE_MS } from '../afkRuntime.js';
import { makeMaterial } from '../progression/items.js';

const at = (n, level) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, level }));
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≈ ${b}`);

// ---------------------------------------------------------------- Resonance
test('Resonance = Σ √level over the WHOLE roster — the lock’s three examples: ten at L5 = 22.4 · three at L17 = 12.4 · one at L50 = 7.1', () => {
  near(resonance(at(10, 5)), 22.4, 0.05);
  near(resonance(at(3, 17)), 12.4, 0.05);
  near(resonance(at(1, 50)), 7.1, 0.05);
  assert.ok(resonance(at(10, 5)) > resonance(at(3, 17)) && resonance(at(3, 17)) > resonance(at(1, 50)), 'breadth beats depth');
  near(resonance([...at(3, 4), ...at(2, 9)]), 3 * 2 + 2 * 3); // party + bench both count
  assert.equal(resonance([]), 0); near(resonance([{}, { level: 0 }]), 2, 1e-9);
});

test('ranks I–X at 0 · 8 · 14 · 22 · 32 · 44 · 58 · 74 · 92 · 112; the header status carries the threshold and the bar', () => {
  assert.deepEqual(RESONANCE_RANKS, [0, 8, 14, 22, 32, 44, 58, 74, 92, 112]);
  assert.equal(MAX_RANK, 10);
  assert.deepEqual([0, 7.99, 8, 13.9, 14, 22, 31.9, 44, 58, 74, 92, 111.9, 112, 500].map(rankFor), [1, 1, 2, 2, 3, 4, 4, 6, 7, 8, 9, 9, 10, 10]);
  assert.deepEqual([1, 4, 9, 10].map(rankNumeral), ['I', 'IV', 'IX', 'X']);
  assert.equal(rankFor(resonance(at(10, 5))), 4, 'ten level-5 Adventurers → rank IV');
  assert.equal(rankFor(resonance(at(5, 1))), 1, 'the starting five → rank I');
  const s = resonanceStatus(at(10, 5));
  assert.deepEqual([s.rank, s.numeral, s.at, s.next], [4, 'IV', 22, 32]);
  near(s.toNext, 32 - 22.360679, 1e-4); near(s.progress, (22.360679 - 22) / 10, 1e-4);
  const top = resonanceStatus(at(40, 50));
  assert.deepEqual([top.rank, top.next, top.toNext, top.progress], [10, null, 0, 1]);
});

// ---------------------------------------------------------------- buying
test('cost per level on an upgrade: 50 × 1.25^n — `Might lvl 3/4 … Buy 98 ❖`', () => {
  assert.deepEqual(PLAYER_TUNING.cost, { base: 50, growth: 1.25 });
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(upgradeCost), [50, 63, 78, 98, 122, Math.round(50 * 1.25 ** 9)]);
});

test('the rank is a CAP: every upgrade can be bought up to the current rank and no further; raising the rank opens the next level; reasons are stated', () => {
  let u = {};
  for (const id of [...BOND_IDS, ...CRAFT_IDS]) assert.equal(levelCap(id, 4), 4);
  for (let i = 0; i < 4; i++) { const c = canBuy(u, 'might', { rank: 4, worldvein: 1e6 }); assert.ok(c.ok); assert.equal(c.cost, upgradeCost(i)); u = buy(u, 'might'); }
  assert.equal(u.might, 4);
  assert.deepEqual([canBuy(u, 'might', { rank: 4, worldvein: 1e6 }).ok, canBuy(u, 'might', { rank: 4, worldvein: 1e6 }).reason], [false, BUY_REASON.cap]);
  assert.ok(canBuy(u, 'might', { rank: 5, worldvein: 1e6 }).ok, 'rank V lights level 5');
  assert.equal(canBuy(u, 'ward', { rank: 4, worldvein: 49 }).reason, BUY_REASON.worldvein);
  assert.ok(canBuy(u, 'ward', { rank: 4, worldvein: 50 }).ok);
  assert.equal(canBuy({}, 'nope', { rank: 9, worldvein: 1e6 }).reason, BUY_REASON.unknown);
  assert.equal(canBuy({}, 'might', { rank: 1, worldvein: 1e6 }).ok, true, 'rank I still allows level 1');
  assert.deepEqual(normalizeUpgrades({ might: 3.7, junk: 5, ward: -1, keen: '2' }), { might: 3, keen: 2 });
});

// ---------------------------------------------------------------- Bond — one test per line
const base = () => deriveStats({ archetype: 'Warden', level: 7 });
const withBond = (u) => deriveStats(equip({ archetype: 'Warden', level: 7 }, [], bondMods(u)));

test('Bond · Vitality: +2 % HP per level, on every Adventurer', () => {
  near(withBond({ vitality: 5 }).maxHp, base().maxHp * 1.1);
  for (const archetype of ['Bulwark', 'Striker', 'Adept', 'Resonator']) near(deriveStats(equip({ archetype, level: 3 }, [], bondMods({ vitality: 2 }))).maxHp, deriveStats({ archetype, level: 3 }).maxHp * 1.04);
  assert.equal(effectText('vitality', 3), '+6% HP');
});
test('Bond · Might: +2 % Power per level', () => { near(withBond({ might: 3 }).hitDamage, base().hitDamage * 1.06); assert.equal(effectText('might', 3), '+6% Power'); });
test('Bond · Ward: +1 % mitigation per level (percentage points, still under the cap)', () => {
  near(withBond({ ward: 4 }).mitigation, base().mitigation + 0.04);
  assert.ok(deriveStats(equip({ archetype: 'Bulwark', level: 1 }, [], bondMods({ ward: 10 }))).mitigation <= 0.6 + 1e-9);
  assert.equal(effectText('ward', 4), '+4% mitigation');
});
test('Bond · Tempo: +1.5 % attack speed per level', () => { near(withBond({ tempo: 4 }).swingInterval, base().swingInterval / 1.06); assert.equal(effectText('tempo', 4), '+6% attack speed'); });
test('Bond · Grace: +2 % healing per level', () => { near(withBond({ grace: 5 }).healScale, base().healScale * 1.1); assert.equal(effectText('grace', 5), '+10% healing'); });
test('Bond · Keen: +1 % crit chance per level (percentage points)', () => { near(withBond({ keen: 3 }).critChance, base().critChance + 0.03); assert.equal(effectText('keen', 3), '+3% crit chance'); });
test('Bond · Flow: +2 % mana regen per level', () => { near(withBond({ flow: 2 }).manaRegen, base().manaRegen * 1.04); assert.equal(effectText('flow', 2), '+4% mana regen'); });
test('Bond stacks with the class gem and changes nothing when nothing is bought', () => {
  assert.deepEqual(withBond({}), base());
  assert.deepEqual(bondMods({}), { mult: {}, add: {} });
  assert.deepEqual(bondMods({ might: 2, ward: 3, keen: 1 }), { mult: { power: 0.04 }, add: { mitigation: 0.03, critChance: 0.01 } });
});

// ---------------------------------------------------------------- Craft — one test per line
const gatherFor = (craft, ms, areaId = 1) => {
  let s = assignJob({ ...emptyAfkState() }, { kind: 'gather', index: 0 }, 'c1');
  s = { ...s, gatherSlots: s.gatherSlots.map((g, i) => (i === 0 ? startJob({ ...g, areaId }, 0) : g)) };
  return reconcileAfk({ state: s, inventory: { raw: { wood: 0, metal: 0, hunt: 0 } }, bag: [], worldvein: 0, party: [{ id: 'c1', name: 'Kessa', level: 1 }], roster: [], unlocked: 10, now: ms, rng: () => 0.99, craft });
};
test('Craft · Yield: +5 % gather output per level — whole mats, the fraction carried on the slot', () => {
  const cycles = 100; const ms = cycles * GATHER_CYCLE_MS; const per = gatherYield(1).gain;
  assert.equal(gatherFor(null, ms).inv.raw.wood, per * cycles);
  assert.equal(gatherFor(craftMods({ yield: 4 }), ms).inv.raw.wood, Math.floor(per * cycles * 1.2 + 1e-9));
  const one = gatherFor(craftMods({ yield: 1 }), GATHER_CYCLE_MS); // 1.05 mats → 1 now, 0.05 carried
  assert.equal(one.inv.raw.wood, per); near(one.next.gatherSlots[0].yieldCarry, per * 0.05, 1e-9);
  assert.equal(effectText('yield', 4), '+20% gather output');
});
test('Craft · Vein: +5 % Worldvein from nodes per level', () => {
  const a = rollRewards({ area: 3, nodeType: 'rare', rng: mulberry32(5) }).worldvein;
  const b = rollRewards({ area: 3, nodeType: 'rare', rng: mulberry32(5), veinMult: craftMods({ vein: 6 }).veinMult }).worldvein;
  near(craftMods({ vein: 6 }).veinMult, 1.3); assert.ok(Math.abs(b - a * 1.3) <= 1, `${b} ≈ ${a} × 1.3`);
  assert.equal(effectText('vein', 6), '+30% Worldvein from nodes');
});
test('Craft · Fortune: +3 % loot one-up chance per level — and no extra rng call when it is 0', () => {
  near(craftMods({ fortune: 5 }).oneUpChance, 0.15);
  const avg = (oneUpChance) => { const rng = mulberry32(99); let sum = 0, n = 0; for (let i = 0; i < 4000; i++) for (const g of rollRewards({ area: 2, nodeType: 'boss', rng, oneUpChance }).gears) if (g.kind === 'weapon') { sum += rarityIndex(g.rarity); n += 1; } return sum / n; };
  assert.ok(avg(1) > avg(0) + 0.8, 'at 100 % every roll lands one rung up');
  assert.ok(avg(0.3) > avg(0) + 0.15 && avg(0.3) < avg(1));
  let calls = 0; const counting = (seed) => { const r = mulberry32(seed); return () => { calls += 1; return r(); }; };
  rollRewards({ area: 2, nodeType: 'boss', rng: counting(7) }); const plain = calls; calls = 0;
  rollRewards({ area: 2, nodeType: 'boss', rng: counting(7), oneUpChance: 0 }); assert.equal(calls, plain);
  assert.equal(effectText('fortune', 5), '+15% loot one-up chance');
});
test('Craft · Haste: −5 % Process time per level', () => {
  near(craftMods({ haste: 4 }).processTimeMult, 0.8);
  const run = (craft) => { let s = assignJob({ ...emptyAfkState() }, { kind: 'process' }, 'c1'); s = { ...s, process: startJob({ ...s.process, family: 'wood' }, 0) };
    return reconcileAfk({ state: s, inventory: { raw: { wood: 1000, metal: 0, hunt: 0 } }, bag: [makeMaterial({ tier: 1, rarity: 'Common', type: 'x', qty: 1 })], worldvein: 1e6, party: [{ id: 'c1', name: 'Kessa', level: 1 }], roster: [], unlocked: 1, now: 100 * PROCESS_CYCLE_MS, rng: () => 0.5, craft }); };
  const n = (r) => Object.values(r.summary.infused).reduce((a, b) => a + b, 0);
  assert.equal(n(run(null)), 100);
  assert.equal(n(run(craftMods({ haste: 4 }))), 125, '100 cycles of time at ×0.8 = 125 cycles');
  assert.equal(effectText('haste', 4), '−20% Process time');
});
test('Craft · Hearth: +1 job slot at levels 4 and 8 (cap 8, whatever the rank)', () => {
  assert.deepEqual([0, 3, 4, 7, 8].map((lv) => extraHearthSlots({ hearth: lv })), [0, 0, 1, 1, 2]);
  assert.equal(BASE_GATHER_SLOTS, 3);
  assert.deepEqual([0, 1, 2].map(gatherSlotCount), [3, 4, 5]);
  assert.equal(levelCap('hearth', 10), 8); assert.equal(levelCap('hearth', 3), 3);
  assert.equal(canBuy({ hearth: 8 }, 'hearth', { rank: 10, worldvein: 1e9 }).reason, BUY_REASON.max);
  const grown = withGatherSlots(emptyAfkState(), gatherSlotCount(craftMods({ hearth: 8 }).extraSlots));
  assert.equal(grown.gatherSlots.length, 5);
  assert.equal(withGatherSlots(grown, 3).gatherSlots.length, 5, 'an earned slot is never taken away');
  assert.equal(effectText('hearth', 4), '+1 job slot (at levels 4 and 8)');
  assert.deepEqual(craftMods({}), { ...NO_CRAFT });
});
