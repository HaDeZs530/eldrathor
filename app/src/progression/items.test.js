/**
 * The item model — docs/Eldrathor_Item_Model_Lock.md §1–§8 (M2 lock 1). Tests are the spec: every
 * number the lock sets is asserted here, and the DESIGN-OPEN placeholders are asserted as placeholders
 * so replacing them with the real values is a visible change.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RARITIES, RARITY_COLOR, rarityIndex, TIER_FOR_AREA, tierForArea, TIER_MULT, RARITY_MULT, tierMult,
  rarityMult, ratingScale, empowerScale, itemMult, makeItem, makeWeapon, makeArmor, makeCore,
  makeMaterial, plainName, displayName, armorName, weaponAttackPower, armorBonus, armorTotals, ARMOR_TYPES,
  EQUIP_SLOTS, craftCapForArea, canCraftRarity, craftableRarities, CORE_TYPES, upgradeGrade,
  upgradeStepFor, sellValue, SELL_BASE, gearScore, UNARMED_MULT, WEAPON_TYPES,
} from './items.js';
import { bagView, bulkSell, FILTERS, SORTS } from './bag.js';
import { upgradeFor, itemValue } from './upgrade.js';
import { recruitCost, candidatesForDay, FREE_RECRUITS, RECRUIT_COST_STEP, CANDIDATES_PER_DAY } from './roster.js';
import { WEAPON_NAMES, NAMES_PER_POOL, weaponSpecialName, poolIsNamed, TIERS } from '../data/weaponNames.js';
import { rollRarity, rollRewards, RARE_DROP_WEIGHTS, DROP_CAP, BOSS_RATING_FLOOR, dropWeights, applyAttune, stepUp, CORE_DROP_CHANCE, CORE_AREA_MIN, CORE_AREA_MAX, MYTHIC_CORE_CHANCE } from '../combat/rewards.js';
import { BOSS_WEAPON_NAMES, bossWeaponName, bossPoolIsNamed, NAMES_PER_BOSS, bossShortName } from '../data/bossWeaponNames.js';
import { AREAS } from '../data.js';
import { WEAPONS } from '../data.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);
const rngOf = (seed) => { let a = seed; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; };
const tally = (fn, n = 40000) => { const c = {}; for (let i = 0; i < n; i++) { const r = fn(rngOf(i + 1)); c[r] = (c[r] || 0) + 1; } return c; };
const share = (c, k, n = 40000) => (c[k] || 0) / n;

// ---------------------------------------------------------------- §1 the ladder, tiers and power
test('§1 the seven-rung ladder, its colours and its tier table', () => {
  assert.deepEqual(RARITIES, ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Artifact', 'Mythic']);
  assert.deepEqual(RARITIES.map(rarityIndex), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(rarityIndex('Fine'), 1, 'the retired rung is unknown → Common');
  assert.deepEqual(RARITIES.map((r) => RARITY_COLOR[r]), ['#9aa3ad', '#5fbf8a', '#4fa3ff', '#a678f0', '#e8c46a', '#ff8a3d', '#ff5c8a']);
  // areas → tiers: Anthony's fixed points are 6–7 → T5, 8–9 → T6, 10 → T7
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tierForArea), [1, 1, 2, 3, 4, 5, 5, 6, 6, 7]);
  assert.equal(Object.keys(TIER_FOR_AREA).length, 10);
});

test('§1 three avenues (RULED 2026-09-17): tierMult 1.8^(T−1), rarityMult 1.158^rung, rating 1 = base → 100 = +15 %, empower 100 = +25 %', () => {
  const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
  [1.0, 1.8, 3.24, 5.83, 10.5, 18.9, 34.0].forEach((v, i) => near(TIER_MULT[i], v, 0.05, `T${i + 1}`));
  [['Common', 1.0], ['Uncommon', 1.16], ['Rare', 1.34], ['Epic', 1.55], ['Legendary', 1.8], ['Artifact', 2.08], ['Mythic', 2.41]].forEach(([r, v]) => near(RARITY_MULT[r], v, 0.01, r));
  assert.equal(tierMult(99), TIER_MULT[6], 'clamped at T7');
  assert.equal(rarityMult('nonsense'), 1.0);
  assert.equal(ratingScale(1), 1, 'rating 1 = base');
  near(ratingScale(100), 1.15, 1e-9, 'rating 100 = +15 %');
  assert.equal(empowerScale(0), 1);
  near(empowerScale(100), 1.25, 1e-9, 'empower 100 = +25 %');
  assert.equal(UNARMED_MULT, 0.8);
  // the brief's equivalences, at equal rating
  const p = (tier, rarity, rating = 50, empower = 0) => weaponAttackPower(makeWeapon({ tier, rarity, type: 'Greatsword', rating, empower, rng: () => 0 }));
  assert.ok(Math.abs(p(1, 'Artifact') / p(2, 'Uncommon') - 1) < 0.01, 'Artifact T1 == Uncommon T2 (within 1 %)');
  assert.ok(Math.abs(p(1, 'Legendary') / p(2, 'Common') - 1) < 0.01, 'Legendary T1 == Common T2 (within 1 %)');
  // no T1 item that can DROP (≤ Artifact) at any rating / empower beats a T3 Common at rating 1
  const t3floor = p(3, 'Common', 1, 0);
  for (const r of ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Artifact']) assert.ok(p(1, r, 100, 100) < t3floor, `T1 ${r} +100 @100 (${p(1, r, 100, 100).toFixed(2)}) < T3 Common @1 (${t3floor.toFixed(2)})`);
  // RULED 2026-09-19: the Mythic-T1 exception is allowed. A Mythic T1 (only reachable via Cores from Vaelyx) MAY
  // exceed a Common T2 but must NEVER exceed a Common T3 — asserted like for like (same rating, same empower):
  for (const [rating, empower] of [[1, 0], [50, 0], [100, 0], [50, 50], [100, 100]]) {
    assert.ok(p(1, 'Mythic', rating, empower) > p(2, 'Common', rating, empower), `Mythic T1 > Common T2 @${rating}/+${empower}`);
    assert.ok(p(1, 'Mythic', rating, empower) < p(3, 'Common', rating, empower), `Mythic T1 < Common T3 @${rating}/+${empower}`);
  }
  // still true and still flagged: a FULLY polished Mythic T1 (3.46) passes an UNPOLISHED T3 Common (3.24); without
  // empower it does not. The ruling is read like for like; polish-vs-floor is the one crossing left.
  assert.ok(p(1, 'Mythic', 100, 100) > t3floor && p(1, 'Mythic', 100, 0) < t3floor);
});

test('§1 two-axis power: base(type) × tierMult × rarityMult × ratingScale × empowerScale, and TIER DOMINATES', () => {
  const w = makeWeapon({ tier: 3, rarity: 'Rare', type: 'Greatsword', rating: 100, empower: 50, rng: () => 0 });
  const expected = WEAPONS.Greatsword.dmg * Math.pow(1.8, 2) * Math.pow(1.158, 2) * 1.15 * 1.125;
  assert.ok(Math.abs(weaponAttackPower(w) - expected) < 1e-9, `${weaponAttackPower(w)} vs ${expected}`);
  // the lock's headline example — tier dominates rarity at every rating, from both ends of the scale
  const t5common = (rating) => makeWeapon({ tier: 5, rarity: 'Common', type: 'Greatsword', rating, rng: () => 0 });
  const t1artifact = (rating) => makeWeapon({ tier: 1, rarity: 'Artifact', type: 'Greatsword', rating, rng: () => 0 });
  for (const rating of [1, 50, 100]) {
    assert.ok(weaponAttackPower(t5common(rating)) > weaponAttackPower(t1artifact(rating)), `T5 Common beats T1 Artifact at rating ${rating}`);
  }
  assert.ok(weaponAttackPower(t5common(1)) > weaponAttackPower(t1artifact(100)), 'and the worst T5 Common still beats the best unempowered T1 Artifact');
  // RULED 2026-09-17: empowerment lives inside the polish band (+25 % max) — a fully empowered T1 Artifact
  // still cannot reach a rating-1 T5 Common; empower is never a way to jump a tier
  assert.ok(weaponAttackPower({ ...t1artifact(100), empower: 100 }) < weaponAttackPower(t5common(1)));
  // empower only applies to weapons
  const armor = makeArmor({ tier: 3, rarity: 'Rare', rating: 100 });
  assert.equal(armor.empower, 0);
  close(itemMult({ ...armor, empower: 100 }), Math.pow(1.8, 2) * Math.pow(1.158, 2) * 1.15, 'armor ignores empower');
});

test('§2 armor types: four fixed types spanning every rarity; head / hands / feet give HALF the body values', () => {
  assert.deepEqual(Object.keys(ARMOR_TYPES), ['Cuirass', 'Helm', 'Gauntlets', 'Greaves']);
  assert.deepEqual(Object.values(ARMOR_TYPES).map((a) => a.slot), ['body', 'head', 'hands', 'feet']);
  const at = (type) => armorBonus(makeArmor({ tier: 1, rarity: 'Common', type, rating: 100 }));
  close(at('Cuirass').hp, 25 * 1.15, 'body HP');
  close(at('Cuirass').mit, 0.02, 'body mitigation');
  for (const type of ['Helm', 'Gauntlets', 'Greaves']) {
    close(at(type).hp, at('Cuirass').hp / 2, `${type} HP`);
    close(at(type).mit, at('Cuirass').mit / 2, `${type} mitigation`);
  }
  assert.deepEqual(armorBonus(null), { hp: 0, mit: 0 });
  const set = ['Cuirass', 'Helm', 'Gauntlets', 'Greaves'].map((type) => makeArmor({ tier: 1, rarity: 'Common', type, rating: 100 }));
  close(armorTotals(set).hp, 25 * 1.15 * 2.5, 'a full set is 2.5 × the body piece');
  assert.deepEqual(EQUIP_SLOTS, ['weapon', 'body', 'head', 'hands', 'feet', 'gem']);
});

test('§2 the item shape, and the special-name rule: weapons show theirs in the bag and the sheet, nowhere else', () => {
  const w = makeWeapon({ tier: 2, rarity: 'Epic', type: 'Bow', rating: 44, rng: () => 0 });
  assert.deepEqual(Object.keys(w).sort(), ['empower', 'id', 'kind', 'name', 'rarity', 'rating', 'tier', 'type'].sort());
  assert.match(w.id, /^w-/);
  assert.equal(plainName(w), 'Epic Bow', 'everywhere except the bag list and the sheet header');
  assert.equal(displayName(w), w.name, 'the bag list and the sheet header show the special name');
  assert.notEqual(displayName(w), plainName(w));
  // armor is named by TIER (RULED 2026-09-17): one island prefix per tier; plain everywhere else
  const a = makeArmor({ tier: 1, rarity: 'Rare', type: 'Helm', rating: 10 });
  assert.equal(displayName(a), 'Gullwatch Helm');
  assert.equal(plainName(a), 'Rare Helm');
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((t) => armorName(t, 'Cuirass')), ['Gullwatch Cuirass', 'Saltcliff Cuirass', 'Quay Cuirass', 'Serpent Cuirass', 'Forge Cuirass', 'Bastion Cuirass', 'Worldforge Cuirass']);
  assert.equal(makeArmor({ tier: 2, rarity: 'Epic', type: 'Helm', rating: 1 }).name, 'Saltcliff Helm');
  // cores and materials use their type name in both places
  assert.match(makeCore({ tier: 6, rarity: 'Artifact', type: CORE_TYPES.Artifact }).id, /^k-/);
  assert.equal(makeMaterial({ tier: 1, rarity: 'Common', type: 'metal', qty: 14 }).qty, 14);
  // rating is the gear score, 1–100, never a composite
  assert.equal(gearScore(makeArmor({ tier: 7, rarity: 'Mythic', rating: 72 })), 72);
  assert.equal(makeItem({ kind: 'weapon', type: 'Bow', tier: 99, rarity: 'nope', rating: 999 }).tier, 7);
  assert.equal(makeItem({ kind: 'weapon', type: 'Bow', tier: 0, rarity: 'nope', rating: -5 }).rating, 1);
  assert.equal(makeItem({ kind: 'weapon', type: 'Bow', tier: 1, rarity: 'nope' }).rarity, 'Common');
});

test('§2 weapon names: a pool per type per tier (8 × 7), drawn at drop time — DESIGN-OPEN placeholders for now', () => {
  assert.deepEqual(Object.keys(WEAPON_NAMES), WEAPON_TYPES);
  assert.equal(WEAPON_TYPES.length, 8);
  assert.deepEqual(TIERS, [1, 2, 3, 4, 5, 6, 7]);
  for (const type of WEAPON_TYPES) {
    assert.deepEqual(Object.keys(WEAPON_NAMES[type]).map(Number), TIERS, type);
    for (const tier of TIERS) {
      assert.ok(WEAPON_NAMES[type][tier].length >= 1, `${type} T${tier} has a pool`);
      assert.equal(weaponSpecialName(type, tier, () => 0), WEAPON_NAMES[type][tier][0]);
    }
  }
  assert.equal(NAMES_PER_POOL, 4, 'the lock: four names per type per tier = 224');
  // the placeholders are still placeholders — this flips when the Design Chat delivers the names
  assert.equal(poolIsNamed('Greatsword', 1), false, 'DESIGN-OPEN: the 224 names are pending');
  assert.equal(weaponSpecialName('Greatsword', 1, () => 0), 'Greatsword of T1');
  assert.equal(weaponSpecialName('Greatsword', 7, () => 0), 'Greatsword of T7', 'the name signals the tier');
});

// ---------------------------------------------------------------- §1 drops
test('§1 drops: rares and bosses roll the lock’s weight table up to ARTIFACT from ANY area; Mythic never drops', () => {
  assert.deepEqual(RARE_DROP_WEIGHTS, { Common: 30, Uncommon: 28, Rare: 20, Epic: 12, Legendary: 7, Artifact: 3 });
  assert.equal(DROP_CAP, 'Artifact');
  const c = tally((rng) => rollRarity(rng, { area: 1, nodeType: 'rare' }));
  assert.ok(Math.abs(share(c, 'Artifact') - 0.03) < 0.01, `area-1 rares drop Artifacts: ${JSON.stringify(c)}`);
  assert.ok(Math.abs(share(c, 'Common') - 0.30) < 0.02);
  assert.equal(c.Mythic, undefined, 'Mythic is upgrade-only');
  // an area-1 rare really can hand you an Artifact at T1 — exciting, but T1 power
  let seen = null;
  for (let i = 0; i < 4000 && !seen; i++) {
    const g = rollRewards({ area: 1, nodeType: 'rare', rng: rngOf(i + 1) }).gears.find((x) => x.rarity === 'Artifact');
    if (g) seen = g;
  }
  assert.ok(seen, 'an area-1 rare can drop an Artifact');
  assert.equal(seen.tier, 1, 'tier always comes from the area');
});

test('§1 drops: normal nodes cap at Epic and lean higher with the area (DESIGN-OPEN weights)', () => {
  const c1 = tally((rng) => rollRarity(rng, { area: 1, nodeType: 'normal' }));
  assert.deepEqual(Object.keys(dropWeights('normal', 1)), ['Common', 'Uncommon', 'Rare', 'Epic']);
  assert.equal(c1.Legendary, undefined);
  assert.equal(c1.Artifact, undefined);
  const c9 = tally((rng) => rollRarity(rng, { area: 9, nodeType: 'normal' }));
  assert.ok(share(c9, 'Epic') > share(c1, 'Epic'), 'deeper areas lean higher');
  assert.ok(share(c9, 'Common') < share(c1, 'Common'));
});

test('§1 drops: bosses step one rung up with a rating floor of 40, and Attune Vein doubles the TOP TWO chances', () => {
  assert.equal(BOSS_RATING_FLOOR, 40);
  assert.equal(stepUp('Common'), 'Uncommon');
  assert.equal(stepUp('Artifact'), 'Artifact', 'the step never passes the drop cap');
  const plain = tally((rng) => rollRarity(rng, { area: 5, nodeType: 'rare' }));
  const boss = tally((rng) => rollRarity(rng, { area: 5, nodeType: 'boss', steps: 1 }));
  assert.ok(share(boss, 'Common') < share(plain, 'Common') && share(boss, 'Artifact') > share(plain, 'Artifact'));
  const attuned = applyAttune(RARE_DROP_WEIGHTS);
  assert.equal(attuned.Legendary, 14);
  assert.equal(attuned.Artifact, 6);
  assert.equal(attuned.Common, 30, 'only the top two double');
  for (let i = 0; i < 40; i++) {
    for (const g of rollRewards({ area: 3, nodeType: 'boss', rng: rngOf(i + 1) }).gears) {
      if (g.kind === 'weapon') assert.ok(g.rating >= BOSS_RATING_FLOOR, `boss drop rating ${g.rating}`);
      assert.equal(g.tier, tierForArea(3));
    }
  }
});

test('§2 boss weapon drops draw from a boss-named pool (3 per boss) — DESIGN-OPEN placeholders "<Boss>\'s <Type>" until the Design Chat pushes them', () => {
  assert.deepEqual(Object.keys(BOSS_WEAPON_NAMES), AREAS.map((a) => a.boss));
  assert.equal(NAMES_PER_BOSS, 3);
  assert.equal(bossShortName('The Brinewarden'), 'Brinewarden');
  assert.equal(bossWeaponName('The Brinewarden', 'Greatsword', () => 0), "Brinewarden's Greatsword");
  assert.equal(bossWeaponName('Nobody', 'Bow'), null, 'unknown boss → tier pool');
  assert.equal(bossPoolIsNamed('The Brinewarden'), false, 'DESIGN-OPEN: the pools are pending');
  // a boss drop carries the boss name; a rare's drop carries the tier-pool name
  let bossDrop = null; let rareDrop = null;
  for (let i = 0; i < 200 && !(bossDrop && rareDrop); i++) {
    bossDrop = bossDrop || rollRewards({ area: 1, nodeType: 'boss', rng: rngOf(i + 1), bossName: 'The Brinewarden' }).gears.find((g) => g.kind === 'weapon');
    rareDrop = rareDrop || rollRewards({ area: 1, nodeType: 'rare', rng: rngOf(i + 1) }).gears.find((g) => g.kind === 'weapon');
  }
  assert.match(bossDrop.name, /^Brinewarden's /);
  assert.equal(bossDrop.name, `Brinewarden's ${bossDrop.type}`);
  assert.match(rareDrop.name, / of T1$/);
});

// ---------------------------------------------------------------- §1 gating and cores
test('§1 craft gating by area: ≤ Epic anywhere, Legendary 6–7, Artifact 8–9, Mythic 10', () => {
  assert.deepEqual([1, 5, 6, 7, 8, 9, 10].map(craftCapForArea), ['Epic', 'Epic', 'Legendary', 'Legendary', 'Artifact', 'Artifact', 'Mythic']);
  assert.equal(canCraftRarity('Epic', 1), true);
  assert.equal(canCraftRarity('Legendary', 5), false);
  assert.equal(canCraftRarity('Legendary', 6), true);
  assert.equal(canCraftRarity('Artifact', 7), false);
  assert.equal(canCraftRarity('Artifact', 8), true);
  assert.equal(canCraftRarity('Mythic', 9), false);
  assert.equal(canCraftRarity('Mythic', 10), true);
  assert.deepEqual(craftableRarities(1), ['Common', 'Uncommon', 'Rare', 'Epic']);
  assert.deepEqual(craftableRarities(10), RARITIES);
});

test('§1 cores: the upgrade step carries rating AND empower, and never changes the tier', () => {
  assert.deepEqual(CORE_TYPES, { Artifact: 'Artifact Core', Mythic: 'Mythic Core' });
  const leg = makeWeapon({ tier: 5, rarity: 'Legendary', type: 'Bow', rating: 91, empower: 44, rng: () => 0 });
  assert.deepEqual(upgradeStepFor(leg), { to: 'Artifact', core: 'Artifact Core' });
  assert.equal(upgradeStepFor(makeWeapon({ tier: 5, rarity: 'Epic', type: 'Bow', rating: 1, rng: () => 0 })), null);
  const up = upgradeGrade(leg, makeCore({ tier: 5, rarity: 'Artifact', type: CORE_TYPES.Artifact }));
  assert.deepEqual([up.rarity, up.tier, up.rating, up.empower], ['Artifact', 5, 91, 44]);
});

// ---------------------------------------------------------------- §4 sell value
test('§4 sell value (RULED 2026-09-19): 5 × rarityIndex² × (1 + rating/200) ❖ — Common 5–7, Legendary 125–187; materials 1 × rarityIndex', () => {
  assert.deepEqual(Object.keys(SELL_BASE), RARITIES);
  assert.deepEqual(Object.values(SELL_BASE), [5, 20, 45, 80, 125, 180, 245]);
  const sell = (rarity, rating) => sellValue(makeArmor({ tier: 1, rarity, rating }));
  assert.deepEqual([sell('Common', 1), sell('Common', 100)], [5, 7]);
  assert.deepEqual([sell('Legendary', 1), sell('Legendary', 100)], [125, 187]);
  assert.deepEqual(RARITIES.map((r) => sellValue(makeMaterial({ tier: 1, rarity: r, type: 'Infused wood' }))), [1, 2, 3, 4, 5, 6, 7]);
  const item = makeArmor({ tier: 1, rarity: 'Epic', rating: 100 });
  assert.equal(sellValue(item), Math.floor(SELL_BASE.Epic * 1.5));
  assert.ok(sellValue(makeArmor({ tier: 1, rarity: 'Mythic', rating: 1 })) > sellValue(makeArmor({ tier: 1, rarity: 'Common', rating: 100 })));
  assert.equal(sellValue(null), 0);
});

// ---------------------------------------------------------------- §5 the bag
test('§5 bag: the six filters (Gems added by M2 lock 2), the three sorts, and a slot-filtered view for an empty character slot', () => {
  assert.deepEqual(FILTERS.map((f) => f.label), ['All', 'Weapons', 'Armor', 'Gems', 'Cores', 'Materials']);
  assert.deepEqual(SORTS.map((s) => s.label), ['Rating ↓', 'Rarity', 'Newest']);
  const bag = [
    makeWeapon({ tier: 1, rarity: 'Common', type: 'Bow', rating: 10, rng: () => 0 }),
    makeArmor({ tier: 1, rarity: 'Legendary', type: 'Helm', rating: 60 }),
    makeArmor({ tier: 1, rarity: 'Common', type: 'Cuirass', rating: 90 }),
    makeCore({ tier: 6, rarity: 'Artifact', type: CORE_TYPES.Artifact }),
    makeMaterial({ tier: 1, rarity: 'Rare', type: 'metal', qty: 14 }),
  ];
  assert.deepEqual(bagView(bag, { filter: 'armor' }).map((i) => i.type), ['Cuirass', 'Helm'], 'rating ↓');
  assert.deepEqual(bagView(bag, { filter: 'armor', sort: 'rarity' }).map((i) => i.type), ['Helm', 'Cuirass']);
  assert.deepEqual(bagView(bag, { filter: 'weapon' }).map((i) => i.kind), ['weapon']);
  assert.deepEqual(bagView(bag, { filter: 'core' }).map((i) => i.kind), ['core']);
  assert.deepEqual(bagView(bag, { filter: 'material' }).map((i) => i.qty), [14]);
  assert.equal(bagView(bag, { filter: 'all' }).length, 5, 'no bag cap, everything in one list');
  assert.deepEqual(bagView(bag, { slot: 'head' }).map((i) => i.type), ['Helm'], 'an empty head slot shows only helms');
  assert.deepEqual(bagView(bag, { slot: 'weapon' }).map((i) => i.kind), ['weapon']);
  assert.deepEqual(bagView(bag, { sort: 'newest' })[0].kind, 'material');
});

test('§5 bulk sell skips EQUIPPED items and pays per unit for material stacks', () => {
  const worn = makeArmor({ tier: 1, rarity: 'Epic', type: 'Cuirass', rating: 50 });
  const spare = makeArmor({ tier: 1, rarity: 'Rare', type: 'Helm', rating: 50 });
  const mats = makeMaterial({ tier: 1, rarity: 'Common', type: 'metal', qty: 10 });
  const bag = [worn, spare, mats];
  const r = bulkSell(bag, new Set([worn.id, spare.id, mats.id]), new Set([worn.id]));
  assert.equal(r.sold, 2);
  assert.equal(r.skipped, 1);
  assert.deepEqual(r.bag.map((i) => i.id), [worn.id], 'the equipped piece stays in the bag');
  assert.equal(r.vein, sellValue(spare) + sellValue(mats) * 10);
  assert.deepEqual(bulkSell(bag, new Set(), new Set()), { bag, vein: 0, sold: 0, skipped: 0 });
});

// ---------------------------------------------------------------- §12 the results line
test('§12 results: "↑ upgrade for <name>" only when the drop beats that Adventurer’s piece in the SAME slot', () => {
  const weak = makeWeapon({ tier: 1, rarity: 'Common', type: 'Bow', rating: 10, rng: () => 0 });
  const strong = makeWeapon({ tier: 5, rarity: 'Rare', type: 'Bow', rating: 90, rng: () => 0 });
  const helm = makeArmor({ tier: 5, rarity: 'Epic', type: 'Helm', rating: 90 });
  const party = [{ name: 'Kessa', weaponItem: weak, armorItems: [] }, { name: 'Orin', weaponItem: strong, armorItems: [helm] }];
  assert.equal(upgradeFor(strong, party), 'Kessa', 'beats Kessa’s bow, not Orin’s');
  assert.equal(upgradeFor(weak, party), null, 'beats nobody');
  assert.equal(upgradeFor(makeArmor({ tier: 1, rarity: 'Common', type: 'Helm', rating: 1 }), party), 'Kessa', 'Kessa has no helm at all');
  assert.equal(upgradeFor(makeCore({ tier: 6, rarity: 'Artifact', type: CORE_TYPES.Artifact }), party), null, 'cores are not gear');
  assert.equal(itemValue(null), 0);
});

// ---------------------------------------------------------------- §8 the roster
test('§8 roster: three candidates a day, stable within the day; first three recruits free, then 50 × (hired − 2) ❖', () => {
  assert.equal(FREE_RECRUITS, 3);
  assert.equal(CANDIDATES_PER_DAY, 3);
  assert.equal(RECRUIT_COST_STEP, 50);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 10].map(recruitCost), [0, 0, 0, 50, 100, 150, 400]);
  const a = candidatesForDay(20300);
  assert.equal(a.length, 3);
  assert.deepEqual(candidatesForDay(20300), a, 'stable within the day');
  assert.notDeepEqual(candidatesForDay(20301).map((c) => c.key), a.map((c) => c.key), 'refreshed daily');
  for (const c of a) {
    assert.ok(c.name && c.archetype && c.weapon);
    assert.ok(WEAPONS[c.weapon], `${c.weapon} is a real weapon type`);
  }
});

test('open numbers (RULED 2026-09-19): Artifact Core 8 % from rares / 20 % from bosses in areas 8–9 only; Mythic Core 25 % per Vaelyx kill', () => {
  assert.deepEqual(CORE_DROP_CHANCE, { rare: 0.08, boss: 0.2 });
  assert.deepEqual([CORE_AREA_MIN, CORE_AREA_MAX], [8, 9]);
  assert.equal(MYTHIC_CORE_CHANCE, 0.25);
  let seed = 12345; const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const rate = (args, type, n = 6000) => { let hits = 0; for (let i = 0; i < n; i++) if (rollRewards({ rng, ...args }).gears.some((g) => g.kind === 'core' && g.type === type)) hits += 1; return hits / n; };
  const near = (a, b, tol) => assert.ok(Math.abs(a - b) < tol, `${a.toFixed(3)} ≈ ${b}`);
  near(rate({ area: 8, nodeType: 'rare' }, 'Artifact Core'), 0.08, 0.02);
  near(rate({ area: 9, nodeType: 'boss' }, 'Artifact Core'), 0.2, 0.03);
  assert.equal(rate({ area: 7, nodeType: 'boss' }, 'Artifact Core', 1500), 0, 'no cores below area 8');
  assert.equal(rate({ area: 10, nodeType: 'boss' }, 'Artifact Core', 1500), 0, 'no Artifact cores above area 9');
  assert.equal(rate({ area: 8, nodeType: 'normal' }, 'Artifact Core', 1500), 0, 'only rares and bosses');
  near(rate({ area: 10, nodeType: 'boss', vaelyx: true }, 'Mythic Core'), 0.25, 0.03);
  assert.equal(rate({ area: 10, nodeType: 'boss' }, 'Mythic Core', 1500), 0, 'only Vaelyx drops a Mythic Core');
});
