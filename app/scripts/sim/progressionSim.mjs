/**
 * Progression simulator — plays the mountain with the game's OWN code (map generation, route rules, the
 * fight resolver, loot, XP, items, gems, the Veinbinder's upgrades, the Hearth) and a bot standing in for
 * the player. It changes no game numbers on disk; a `tuning` object overrides numbers IN THIS PROCESS ONLY
 * so a proposal can be measured before anything is ruled on.
 *
 * Target (Anthony, 2026-09-19): a player at 3–4 h/day takes the whole mountain in 2–3 months, ~210 h on
 * the efficient route. TEN walls: the nine area bosses, then the dragon above the King. Every boss is a
 * wall; areas take equal time, the first three ~20 % less; healing in a fight is minimal and every fight
 * costs a mid-geared party some life so sanctuaries matter; XP paces the levels; zones are ground repeatedly.
 */
import { AREAS as GAME_AREAS, DEFAULT_PARTY } from '../../src/data.js';
import { genTerritory } from '../../src/map/genTerritory.js';
import { byId, effectiveType, rareAt, clearNode, killRare, tickClock, explorePath, allCleared } from '../../src/map/routeState.js';
import { spawnEnemies, ENEMY_TUNING } from '../../src/combat/enemies.js';
import { simulateFight, mulberry32, SUSTAIN } from '../../src/combat/simulate.js';
import { deriveStats, equip } from '../../src/combat/derive.js';
import { rollRewards } from '../../src/combat/rewards.js';
import { fightXp, splitXp, xpToNext, withStarterWeapons, previewEmpower, starterWeapon, LEVEL_CAP } from '../../src/progression/progression.js';
import { ARMOR_TYPES, tierForArea, armorBonus, sellValue, craftableRarities, UNARMED_MULT } from '../../src/progression/items.js';
import { WEAPONS } from '../../src/data.js';
import { awardLevelFragments, isGem, isMatching, canImbueGem, imbueGem, makeGem } from '../../src/progression/gems.js';
import { ROLE_MATCH, GEM_TUNING } from '../../src/lattice/classGems.js';
import { latticeFor } from '../../src/lattice/classGems.js';
import { resonance, rankFor } from '../../src/player/resonance.js';
import { UPGRADE_IDS, BOND_IDS, canBuy, buy, bondMods, craftMods, levelCap } from '../../src/player/upgrades.js';
import { armorRecipe, canCraft, consume, craftArmor } from '../../src/town/recipes.js';
import { emptyAfkState, assignJob, startJob, reconcileAfk, withGatherSlots, gatherSlotCount, PROCESS_VEIN_COST } from '../../src/afkRuntime.js';
import { candidatesForDay, recruitCost, FREE_RECRUITS } from '../../src/progression/roster.js';

// the starting bench, as AppRoot.jsx defines it (it is not exported from data.js)
const DEFAULT_ROSTER = [
  { id: 'c-nyra', name: 'Nyra', archetype: 'Adept', weapon: 'Staff', level: 1, xp: 0 },
  { id: 'c-thalen', name: 'Thalen', archetype: 'Resonator', weapon: 'Orb + Tome', level: 1, xp: 0 },
];
/** The tenth wall: the dragon above the King. No map exists yet — the simulator reuses the generator at the top tier. */
export const DRAGON_AREA = { id: 10, pin: 11, name: 'Above the Worldforge (Vaelyx)', shortName: 'Vaelyx', tier: 10, boss: 'Vaelyx' };
export const areasFor = (walls) => (walls >= 10 ? [...GAME_AREAS, DRAGON_AREA] : GAME_AREAS);

export const ASSUMPTIONS = [
  'Play time counts fight playback at the chosen speed plus a results pause, 0.9 s per travel hop, a fixed decision time per node and a fixed town visit per run. Reading, idling in menus and breaks are not counted.',
  'The bot always fights an ambush (it never rolls to flee) and never flees a fight it chose.',
  'The bot judges a boss or a rare by dry-running it with the game\'s own resolver, like the threat badge does, and acts on that.',
  'Any Adventurer may wield any weapon type (as the game allows today); the bot gives each the weapon with the best damage per second, and keeps a shield-or-greatsword on the tank when one is within reach.',
  'Armor is crafted the moment materials allow a better piece; the rating roll is the game\'s own 1–100.',
  'The Hearth runs all 24 h: during the idle hours every Adventurer can hold a job, during play only the bench can. Process is budgeted to a share of banked Worldvein so it cannot drain the account.',
  'Only the three free recruits are hired. Recruits arrive at level 1 and are raised by Train.',
  'Areas 2–10 use the placeholder enemy formula (same units scaled by tier); there are no per-area rosters yet. The dragon\'s area reuses the top-tier map generator.',
  'No events, no daily rewards, no market purchases — none exist in the game yet.',
];

export const POLICIES = {
  efficient: { label: 'Efficient', hoursPerDay: 3.5, fightSpeed: 2, skipFights: false, clearShare: 0.55, bossAt: 0.6, rareAt: 0.75, farmBelow: 0.55, decisionSec: 4, townSec: 40, processShare: 0.2 },
  typical: { label: 'Typical', hoursPerDay: 3.5, fightSpeed: 1, skipFights: false, clearShare: 0.85, bossAt: 0.75, rareAt: 0.85, farmBelow: 0.65, decisionSec: 8, townSec: 90, processShare: 0.15 },
  casual: { label: 'Casual (2 h)', hoursPerDay: 2, fightSpeed: 1, skipFights: false, clearShare: 0.85, bossAt: 0.8, rareAt: 0.9, farmBelow: 0.7, decisionSec: 10, townSec: 120, processShare: 0.1 },
};
const RESULTS_PAUSE_SEC = 3, SKIP_SEC = 1.5, HOP_SEC = 0.9, DRY_RUNS = 3;
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/**
 * Tuning overrides (this process only). `pack` / `boss` are per-area multipliers on the spawned units' hp and dmg
 * (index = area id); `heal` scales the party's sustain; `xp[level]` replaces xpToNext; `gems:false` drops no gems.
 */
export const NO_TUNING = { walls: 9, pack: {}, boss: {}, heal: 1, xp: null, gems: true, levelPower: null, items: null, dropRates: null };
/**
 * `levelPower` (e.g. 0.10): what one level is worth, compounding. The game gives +5 % of BASE per level (additive), so a
 * level late on is worth under 2 %. To try a stronger level without touching derive.js, the simulator hands the resolver
 * the level that produces the wanted multiplier under the game's own formula.
 */
const effLevel = (L, lp) => (lp == null ? L : 1 + ((1 + lp) ** (Math.max(1, L) - 1) - 1) / 0.05);
const BASE_SUSTAIN = { ...SUSTAIN };
export function applyGlobalTuning(tuning) {
  SUSTAIN.mendBase = BASE_SUSTAIN.mendBase * (tuning.heal ?? 1);
  SUSTAIN.renewalPct = BASE_SUSTAIN.renewalPct * (tuning.heal ?? 1);
}
const xpNeed = (tuning, L) => (tuning.xp && tuning.xp[L] != null ? tuning.xp[L] : xpToNext(L));
function applyXpT(member, gain, tuning) {
  let level = Math.max(1, member.level || 1); let xp = Math.max(0, member.xp || 0) + Math.max(0, gain); const from = level;
  while (level < LEVEL_CAP && xp >= xpNeed(tuning, level)) { xp -= xpNeed(tuning, level); level += 1; }
  if (level >= LEVEL_CAP) xp = 0;
  return { member: { ...member, level, xp }, levelsGained: level - from };
}

// ------------------------------------------------------------------------------------------------ state (plain JSON, so it can be snapshotted)
const nextRand = (S) => { S.rs = (S.rs + 0x6d2b79f5) | 0; let t = Math.imul(S.rs ^ (S.rs >>> 15), 1 | S.rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function newGame(seed) {
  const members = [...DEFAULT_PARTY, ...DEFAULT_ROSTER].map((m) => ({ ...m, xp: 0, level: 1, equipped: {} }));
  const geared = withStarterWeapons(members, []);
  return {
    rs: seed | 0, seed, day: 1, dayLeft: null, playSec: 0, party: geared.members.slice(0, 3), roster: geared.members.slice(3), bag: geared.bag,
    worldvein: 80, unlocked: 1, upgrades: {}, inventory: { raw: { wood: 4, metal: 2, hunt: 1 } }, hired: 0, afk: emptyAfkState(),
    stats: { areas: {}, fights: 0, wins: 0, wipes: 0, runs: 0, veinEarned: 0, veinSpent: {}, gemsFound: 0, xpEarned: 0 },
  };
}
export const snapshot = (S) => structuredClone(S);
const spend = (S, what, n) => { S.worldvein -= n; S.stats.veinSpent[what] = (S.stats.veinSpent[what] || 0) + n; };
/**
 * The FIVE-RUNG item model under test (Anthony, 2026-09-20) — `tuning.items === 'five'`:
 *   Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8 of the tier's Common
 *   one item tier per wall, a FLAT step: tier T Common = base × (1 + 0.5 × (T − 1))  → Greatsword 20, 30 … 110
 *   upgrades +1 … +10, each +2.5 % of base (a 20-damage Common gains +1 per 2 upgrades)
 * The game's resolver is fed the resulting multiplier through the Bond power slot with no weapon item, so no game code changes.
 */
export const FIVE = { rarities: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'], mult: { Common: 1, Rare: 1.2, Epic: 1.4, Legendary: 1.6, Mythic: 1.8 }, tierStep: 0.5, upgPer: 0.025, upgMax: 10 };
// TIER_GROWTH (env) swaps the flat step for an upward curve: tier T Common = base × growth^(T − 1) — 1.2 → Greatsword 20, 24, 29 … 103
const TIER_GROWTH = Number(process.env.TIER_GROWTH || 0);
export const tierBase = (tier) => (TIER_GROWTH ? TIER_GROWTH ** (tier - 1) : 1 + FIVE.tierStep * (tier - 1));
export const w5Mult = (w) => (w ? tierBase(w.tier) * FIVE.mult[w.rarity] * (1 + FIVE.upgPer * (w.upg || 0)) : 1);
export const w5Power = (w) => (WEAPONS[w.type]?.dmg || 0) * w5Mult(w);
const w5Dps = (w) => ((WEAPONS[w.type]?.dmg || 0) / (WEAPONS[w.type]?.tempo || 1)) * w5Mult(w);
let w5Seq = 0;
export const makeW5 = (type, tier, rarity, upg = 0) => ({ id: `w5-${++w5Seq}`, kind: 'w5', type, tier, rarity, upg });
// ASSUMPTION (armor has no five-rung rules yet): with `tuning.armor`, each Adventurer's armor mirrors the worn weapon's tier, rung and
// upgrade — HP grows at 60 % of the weapon's curve, mitigation +2 points per rung and +0.3 per upgrade. So old gear is weak on BOTH sides.
const a5 = (w) => (w ? { hp: 0.6 * (w5Mult(w) - 1), mit: 0.02 * FIVE.rarities.indexOf(w.rarity) + 0.003 * (w.upg || 0) } : { hp: 0, mit: 0 });
function fiveMember(m, w, tuning, bond0, gem = null) {
  const ar = tuning.armor ? a5(w) : { hp: 0, mit: 0 };
  const bond = { mult: { ...bond0.mult, hp: (1 + (bond0.mult.hp || 0)) * (1 + ar.hp) - 1 }, add: { ...bond0.add, mitigation: (bond0.add.mitigation || 0) + ar.mit } };
  const bp = (w5Mult(w) / UNARMED_MULT) * (1 + (bond.mult.power || 0)) - 1;
  return { ...m, level: effLevel(m.level, tuning.levelPower), weapon: w ? w.type : m.weapon, weaponItem: null, armorItems: [], gemItem: gem, bond: { mult: { ...bond.mult, power: bp }, add: bond.add } };
}
/** A party as it would stand with the given gear and level — used to DEFINE a wall (e.g. three maxed Epics at the area's level). */
export function referenceParty(S, tuning, { tier, rarity, upg, level, imbues = 0, bondAtCap = false }) {
  const bond = bondMods(bondAtCap ? expectedUpgrades(S, level) : S.upgrades);
  return S.party.map((m) => fiveMember({ ...m, level }, makeW5(S.bag.find((i) => i.id === m.equipped?.w5)?.type || m.weapon, tier, rarity, upg), tuning, bond, imbues > 0 ? gemWithImbues(ROLE_MATCH[m.archetype], imbues) : null));
}
/** A matching gem grown to `n` imbues, inner ring first — the growth a player is ASSUMED to have at a wall (`tuning.gemPace`). */
const gemCache = new Map();
export function gemWithImbues(gemClass, n) {
  const key = `${gemClass}:${n}`; if (gemCache.has(key)) return gemCache.get(key);
  let gem = makeGem({ gemClass, id: `ref-${key}`, fragments: { unspent: GEM_TUNING.points, imbued: 0 } });
  for (let k = 0; k < n; k++) { const next = nextFacet(gem, Infinity); if (!next) break; gem = imbueGem(gem, next.id).gem; }
  gemCache.set(key, gem); return gem;
}
const nextFacet = (gem, worldvein) => latticeFor(gem.gemClass).facets.filter((f) => f.kind !== 'dormant').sort((a, b) => a.ring - b.ring).find((f) => canImbueGem(gem, f.id, { worldvein, worn: true }).ok);
/** Every Bond upgrade at the cap its Resonance rank allows, with the party at `level` — what a steady player has bought by a wall. */
export function expectedUpgrades(S, level) {
  const rank = rankFor(resonance([...S.party.map((m) => ({ ...m, level: Math.max(m.level, level) })), ...S.roster]));
  return Object.fromEntries(BOND_IDS.map((id) => [id, levelCap(id, rank)]));
}
const fieldedOf = (S, tuning = NO_TUNING) => (tuning.items === 'five'
  ? S.party.map((m) => fiveMember(m, S.bag.find((i) => i.id === m.equipped?.w5) || null, tuning, bondMods(S.upgrades), S.bag.find((i) => i.id === m.equipped?.gem) || null))
  : S.party.map((m) => equip({ ...m, level: effLevel(m.level, tuning.levelPower) }, S.bag, bondMods(S.upgrades))));
const blankArea = (a) => ({ area: a.id, name: a.name, firstDay: null, clearedDay: null, playHours: 0, runs: 0, fights: 0, wins: 0, wipes: 0, extracts: 0, bossAttempts: 0, levelOnArrival: null, levelOnClear: null, weaponOnClear: null, armorOnClear: null, powerOnClear: null, items: 0, epics: 0, legendaries: 0, mythics: 0, epicSetHour: null, maxedEpicHour: null, packSec: 0, packFights: 0, packLoss: 0, packHealShare: 0, bossSec: 0, bossFights: 0, sanctuaries: 0, firstBossWinRate: null });
const areaStat = (S, a) => (S.stats.areas[a.id] ||= blankArea(a));

// ------------------------------------------------------------------------------------------------ fights
export function enemiesFor(area, nodeType, { rng, depth01 = 0, named = false } = {}, tuning = NO_TUNING) {
  if (nodeType === 'sanctuary') return [];
  const units = spawnEnemies(Math.min(9, area.tier), nodeType, false, { rng, bossName: area.boss, depthMult: nodeType === 'rare' || nodeType === 'boss' ? 1 : 1 + 0.5 * depth01, named });
  // the dragon's tier sits one step above the generator's top tier
  const step = area.tier > 9 ? { hp: ENEMY_TUNING.hpGrowth ** (area.tier - 9), dmg: ENEMY_TUNING.dmgGrowth ** (area.tier - 9) } : { hp: 1, dmg: 1 };
  const m = (nodeType === 'boss' ? tuning.boss : tuning.pack)?.[area.id] || { hp: 1, dmg: 1 };
  const def = tuning.enemyDef ? tuning.enemyDef(area.id, nodeType) : null; // late monsters mitigate and heal (Anthony, 2026-09-21)
  return units.map((u) => ({ ...u, hp: u.hp * step.hp * m.hp, maxHp: u.hp * step.hp * m.hp, dmg: u.dmg * step.dmg * m.dmg, ...(def ? { mit: Math.min(0.75, (u.mit || 0) + def.mit), regen: def.regen } : {}) }));
}
export function estimate(party, enemies, hp, runMods, seed0, n = DRY_RUNS) {
  let wins = 0;
  for (let i = 0; i < n; i++) if (simulateFight({ party, enemies: enemies.map((e) => ({ ...e })), seed: seed0 + i * 7919 + 1, startHpFrac: hp, runMods }).result.win) wins += 1;
  return wins / n;
}

/** One run in `area`. Mutates S (loot, XP, Worldvein, time). */
function playRun(S, area, P, tuning) {
  const A = areaStat(S, area);
  const runSeed = Math.floor(nextRand(S) * 2 ** 31);
  const rng = mulberry32(runSeed);
  let t = genTerritory({ id: area.id, tier: Math.min(9, area.tier) }, { rng });
  let cur = t.entranceId; let hp = S.party.map(() => 1); let runMods = { dmgMult: 1, mitAdd: 0 };
  let runVein = 0; let sec = P.townSec; let fightIndex = 0; let outcome = 'extract';
  const craft = craftMods(S.upgrades);
  A.runs += 1; S.stats.runs += 1;
  if (A.firstDay == null) { A.firstDay = S.day; A.levelOnArrival = avg(S.party.map((m) => m.level)); }
  const total = t.nodes.length;
  const spawn = (node, frng) => enemiesFor(area, effectiveType(t, node), { rng: frng, depth01: node.depth01 || 0, named: !!node.namedRare }, tuning);

  const doFight = (node) => {
    const party = fieldedOf(S, tuning);
    fightIndex += 1;
    const seed = (runSeed ^ Math.imul(fightIndex, 0x9e3779b1)) >>> 0;
    const frng = mulberry32(seed ^ 0x5bd1e995);
    const eff = effectiveType(t, node);
    const enemies = spawn(node, frng);
    const before = avg(hp);
    const sim = simulateFight({ party, enemies: enemies.map((e) => ({ ...e })), seed, startHpFrac: hp, runMods });
    const dur = sim.result.durationMs / 1000;
    sec += (P.skipFights ? SKIP_SEC : dur / P.fightSpeed) + RESULTS_PAUSE_SEC; A.fights += 1; S.stats.fights += 1;
    if (eff === 'boss') { A.bossAttempts += 1; A.bossSec += dur; A.bossFights += 1; }
    if (!sim.result.win) return { win: false, eff };
    A.wins += 1; S.stats.wins += 1;
    if (eff === 'normal' || eff === 'crystal') {
      const taken = sim.stats.party.reduce((n, p) => n + p.taken, 0); const healed = sim.stats.party.reduce((n, p) => n + p.healed, 0);
      A.packSec += dur; A.packFights += 1; A.packLoss += Math.max(0, before - avg(sim.result.partyHpFrac)); A.packHealShare += taken > 0 ? healed / taken : 0;
    }
    hp = sim.result.partyHpFrac;
    const bossKill = eff === 'boss';
    const mapClear = bossKill && allCleared({ ...t, nodes: t.nodes.map((x) => (x.id === node.id ? { ...x, cleared: true } : x)) });
    const rewards = rollRewards({ area: area.id, nodeType: eff, attuneVein: sim.result.attuneVein, rng: frng, named: !!node.namedRare, mapClear, bossName: bossKill ? area.boss : null, veinMult: craft.veinMult, oneUpChance: craft.oneUpChance });
    runVein += rewards.worldvein;
    if (tuning.items === 'five') {
      // a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop, at three times the odds.
      const special = eff === 'rare' || eff === 'boss';
      if (special || frng() < 0.5) {
        const rt = tuning.dropRates(area.id); const k = special ? 3 : 1; const roll = frng();
        const rarity = roll < rt.mythic * k ? 'Mythic' : roll < (rt.mythic + rt.legendary) * k ? 'Legendary' : roll < (rt.mythic + rt.legendary + rt.epic) * k ? 'Epic' : roll < (rt.mythic + rt.legendary + rt.epic) * k + rt.rare ? 'Rare' : 'Common';
        const types = Object.keys(WEAPONS);
        S.bag.push(makeW5(types[Math.floor(frng() * types.length)], area.id, rarity));
        A.items += 1; if (rarity === 'Epic') A.epics += 1; if (rarity === 'Legendary') A.legendaries += 1; if (rarity === 'Mythic') A.mythics += 1;
      } else runVein += rewards.worldvein;
    } else for (const g of rewards.gears) S.bag.push(g);
    if (tuning.gems !== false) for (const g of rewards.gems || []) { S.bag.push(g); S.stats.gemsFound += 1; }
    const total$ = Math.round(fightXp(enemies, area.tier)); S.stats.xpEarned += total$;
    const gains = splitXp(total$, party, sim.result.partyHpFrac);
    const lvGains = [];
    S.party = S.party.map((m, i) => { const r = applyXpT(m, gains[i], tuning); lvGains.push({ member: m, levelsGained: r.levelsGained }); return r.member; });
    S.bag = awardLevelFragments(S.bag, lvGains).bag;
    if (rareAt(t, node.id)) t = killRare(t, node.id);
    t = clearNode(t, node.id, rng);
    return { win: true, eff, bossKill };
  };

  let bossChecked = -1;
  for (let guard = 0; guard < 400; guard++) {
    const frontier = t.nodes.filter((n) => n.revealed && !n.cleared && explorePath(t, cur, n.id));
    if (!frontier.length) break;
    const hpAvg = avg(hp);
    const cleared = t.nodes.filter((n) => n.cleared).length;
    const dist = (n) => explorePath(t, cur, n.id).length - 1;
    const known = (n) => (n.scouted || n.typeKnown ? effectiveType(t, n) : 'unknown');
    const sanct = frontier.filter((n) => known(n) === 'sanctuary').sort((a, b) => dist(a) - dist(b))[0];
    const boss = frontier.find((n) => n.type === 'boss');
    let target = null;
    if (sanct && hpAvg < 0.55) target = sanct;
    if (!target && boss && cleared / total >= P.clearShare * 0.5 && bossChecked !== cleared) {
      bossChecked = cleared;
      const p = estimate(fieldedOf(S, tuning), spawn(boss, mulberry32(runSeed ^ 77)), hp, runMods, runSeed);
      if (p >= P.bossAt) target = boss;
      else if (sanct && hpAvg < 0.95) { target = sanct; bossChecked = -1; }
    }
    if (!target) target = frontier.filter((n) => n.type !== 'boss').sort((a, b) => dist(a) - dist(b) || a.depth - b.depth)[0] || null;
    if (!target) break; // only the boss is left and it is not winnable today
    const path = explorePath(t, cur, target.id); sec += (path.length - 1) * HOP_SEC + P.decisionSec; cur = target.id;
    t = { ...t, nodes: t.nodes.map((n) => (n.id === target.id ? { ...n, scouted: true, typeKnown: true, revealed: true } : n)) };
    const node = byId(t)[target.id];
    const eff = effectiveType(t, node);
    if (eff === 'sanctuary') {
      A.sanctuaries += 1; hp = S.party.map(() => 1);
      runMods = hpAvg > 0.8 ? { ...runMods, dmgMult: runMods.dmgMult + 0.1 } : { ...runMods, mitAdd: runMods.mitAdd + 0.1 };
      t = clearNode(t, node.id, rng);
    } else {
      if (eff === 'rare' || hpAvg < 0.5) { // a pack is only dry-run when the party is hurt; rares always
        const p = estimate(fieldedOf(S, tuning), spawn(node, mulberry32(runSeed ^ (fightIndex + 1))), hp, runMods, runSeed + guard);
        if (p < (eff === 'rare' ? P.rareAt : 0.5)) { if (sanct) { bossChecked = -1; continue; } break; }
      }
      const r = doFight(node);
      if (!r.win) { outcome = 'wipe'; break; }
      if (r.bossKill) { outcome = 'boss'; break; }
    }
    const tick = tickClock(t, { currentId: cur, rng }); t = tick.territory;
    if (tick.events.find((e) => e.ontoParty)) { const r = doFight(byId(t)[cur]); if (!r.win) { outcome = 'wipe'; break; } }
    if (avg(hp) < 0.25 && !t.nodes.some((n) => n.revealed && !n.cleared && n.type === 'sanctuary')) break;
  }

  S.worldvein += runVein; S.stats.veinEarned += runVein;
  if (outcome === 'wipe') { A.wipes += 1; S.stats.wipes += 1; } else if (outcome === 'extract') A.extracts += 1;
  if (outcome === 'boss' && A.clearedDay == null) {
    A.clearedDay = S.day; A.levelOnClear = avg(S.party.map((m) => m.level));
    const f = fieldedOf(S, tuning);
    A.weaponOnClear = tuning.items === 'five' ? S.party.map((m) => { const w = S.bag.find((i) => i.id === m.equipped?.w5); return w ? `T${w.tier} ${w.rarity} +${w.upg}` : '—'; }).join(' · ') : f.map((m) => (m.weaponItem ? `T${m.weaponItem.tier} ${m.weaponItem.rarity}${m.weaponItem.empower ? ` +${m.weaponItem.empower}` : ''}` : 'unarmed')).join(' · ');
    A.armorOnClear = avg(f.map((m) => m.armorItems.length));
    A.powerOnClear = { hp: Math.round(avg(f.map((m) => deriveStats(m).maxHp))), dps: +f.reduce((n, m) => { const d = deriveStats(m); return n + d.hitDamage / d.swingInterval; }, 0).toFixed(1) };
  }
  if (outcome === 'boss') S.unlocked = Math.max(S.unlocked, area.id + 1);
  S.playSec += sec; A.playHours += sec / 3600;
  if (tuning.items === 'five') {
    const ws = S.party.map((m) => S.bag.find((i) => i.id === m.equipped?.w5)).filter(Boolean);
    const epicPlus = (w) => w.tier >= area.id && FIVE.rarities.indexOf(w.rarity) >= 2;
    if (A.epicSetHour == null && ws.length === 3 && ws.every(epicPlus)) A.epicSetHour = +A.playHours.toFixed(1);
    if (A.maxedEpicHour == null && ws.length === 3 && ws.every((w) => epicPlus(w) && w.upg >= FIVE.upgMax)) A.maxedEpicHour = +A.playHours.toFixed(1);
  }
  return { outcome, sec };
}

// ------------------------------------------------------------------------------------------------ town
function dpsWith(member, weapon, S) { const d = deriveStats({ ...equip(member, S.bag, bondMods(S.upgrades)), weaponItem: weapon }); return (d.hitDamage / d.swingInterval) * (1 + d.critChance * (d.critMult - 1)); }
function townVisit(S, P, tuning) {
  const all = () => [...S.party, ...S.roster];
  const setMember = (m2) => { S.party = S.party.map((m) => (m.id === m2.id ? m2 : m)); S.roster = S.roster.map((m) => (m.id === m2.id ? m2 : m)); };
  const me = (id) => S.party.find((x) => x.id === id);
  if (tuning.items === 'five') { townFive(S, tuning, me, setMember); townCommon(S, tuning, all); return; }
  const taken = new Set();
  for (const m of S.party) {
    const pool = S.bag.filter((w) => w.kind === 'weapon' && !taken.has(w.id) && !S.roster.some((r) => r.equipped?.weapon === w.id));
    if (!pool.length) continue;
    let best = pool.reduce((a, b) => (dpsWith(m, b, S) > dpsWith(m, a, S) ? b : a));
    if (m.archetype === 'Bulwark') { const tanky = pool.filter((w) => ['Sword + Shield', 'Greatsword'].includes(w.type)); if (tanky.length) { const tb = tanky.reduce((a, b) => (dpsWith(m, b, S) > dpsWith(m, a, S) ? b : a)); if (dpsWith(m, tb, S) >= 0.7 * dpsWith(m, best, S)) best = tb; } }
    taken.add(best.id); setMember({ ...me(m.id), equipped: { ...(me(m.id).equipped || {}), weapon: best.id }, weapon: best.type });
  }
  const tier = tierForArea(Math.min(10, S.unlocked));
  for (const m of S.party) for (const type of Object.keys(ARMOR_TYPES)) {
    const slot = ARMOR_TYPES[type].slot; const cur = S.bag.find((i) => i.id === me(m.id).equipped?.[slot]);
    for (const rarity of [...craftableRarities(Math.min(10, S.unlocked))].reverse()) {
      const recipe = armorRecipe(type, rarity, tier); if (!recipe || !canCraft(S.bag, recipe, S.unlocked)) continue;
      if (armorBonus({ ...recipe, kind: 'armor', rating: 50 }).hp <= (cur ? armorBonus(cur).hp : 0) * 1.05) break;
      S.bag = consume(S.bag, recipe, S.unlocked); const piece = craftArmor(recipe, () => nextRand(S)); S.bag.push(piece);
      setMember({ ...me(m.id), equipped: { ...(me(m.id).equipped || {}), [slot]: piece.id } }); break;
    }
  }
  if (tuning.gems !== false) {
    for (const m of S.party) if (!me(m.id).equipped?.gem) { const free = S.bag.filter((i) => isGem(i) && !all().some((x) => x.equipped?.gem === i.id)); const pick = free.find((g) => isMatching(m.archetype, g.gemClass)) || free[0]; if (pick) setMember({ ...me(m.id), equipped: { ...(me(m.id).equipped || {}), gem: pick.id } }); }
    for (const m of S.party) { const id = me(m.id).equipped?.gem; if (!id) continue;
      for (let k = 0; k < 40; k++) { const gem = S.bag.find((i) => i.id === id); const next = latticeFor(gem.gemClass).facets.filter((f) => f.kind !== 'dormant').sort((a, b) => a.ring - b.ring).find((f) => canImbueGem(gem, f.id, { worldvein: S.worldvein * 0.5, worn: true }).ok); if (!next) break; const r = imbueGem(gem, next.id); spend(S, 'gems', r.cost); S.bag = S.bag.map((i) => (i.id === id ? r.gem : i)); } }
  }
  townCommon(S, tuning, all);
  const worn = new Set(all().flatMap((m) => Object.values(m.equipped || {})));
  for (const m of S.party) { const wid = me(m.id).equipped?.weapon; if (!wid) continue;
    for (const f of S.bag.filter((i) => i.kind === 'weapon' && !worn.has(i.id))) { const pv = previewEmpower(S.bag.find((i) => i.id === wid), f, S.worldvein); if (!pv || !pv.useful || !pv.affordable || pv.cost > S.worldvein * 0.1) continue; spend(S, 'empower', pv.cost); S.bag = S.bag.filter((i) => i.id !== f.id).map((i) => (i.id === wid ? { ...i, empower: pv.next } : i)); } }
  const worn2 = new Set(all().flatMap((m) => Object.values(m.equipped || {})));
  const spare = S.bag.filter((x) => (x.kind === 'weapon' || x.kind === 'armor') && !worn2.has(x.id));
  for (const i of spare) { S.worldvein += sellValue(i); S.stats.veinEarned += sellValue(i); }
  S.bag = S.bag.filter((x) => !spare.includes(x));
}

/** Shared by both item models: the Veinbinder's upgrades and the free recruits. */
function townCommon(S, tuning, all) {
  const rank = rankFor(resonance(all()));
  for (let k = 0; k < 60; k++) {
    const o = UPGRADE_IDS.map((id) => ({ id, c: canBuy(S.upgrades, id, { rank, worldvein: S.worldvein }) })).filter((x) => x.c.ok && x.c.cost <= S.worldvein * 0.2).sort((a, b) => a.c.cost - b.c.cost)[0];
    if (!o) break;
    spend(S, 'upgrades', o.c.cost); S.upgrades = buy(S.upgrades, o.id);
    if (o.id === 'hearth') S.afk = withGatherSlots(S.afk, gatherSlotCount(craftMods(S.upgrades).extraSlots));
  }
  while (S.hired < FREE_RECRUITS) { const c = candidatesForDay(S.day + S.hired)[0]; if (recruitCost(S.hired) > 0) break; const eq = {}; if (tuning.items !== 'five') { const w = starterWeapon(c.weapon); S.bag.push(w); eq.weapon = w.id; } S.roster.push({ id: `c-rec${S.hired}`, name: `${c.name}${S.hired}`, archetype: c.archetype, weapon: c.weapon, level: 1, xp: 0, equipped: eq }); S.hired += 1; }
}

/**
 * Town, five-rung model: wear the best weapon by damage per second (the tank keeps a shield or greatsword when one is within 70 %),
 * then upgrade what is worn. ASSUMPTION (not ruled): upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖,
 * so +10 takes 55 spares. A better-rarity drop replaces the worn weapon and its upgrades start over.
 */
function townFive(S, tuning, me, setMember) {
  for (const m of S.party) if (!me(m.id).equipped?.w5) { const w = makeW5(m.weapon, 1, 'Common'); S.bag.push(w); setMember({ ...me(m.id), equipped: { ...(me(m.id).equipped || {}), w5: w.id } }); }
  const wornIds = () => new Set(S.party.map((m) => m.equipped?.w5));
  for (const m of S.party) {
    const cur = S.bag.find((i) => i.id === me(m.id).equipped.w5);
    const pool = S.bag.filter((i) => i.kind === 'w5' && (!wornIds().has(i.id) || i.id === cur.id));
    let best = pool.reduce((a, b) => (w5Dps(b) > w5Dps(a) ? b : a), cur);
    if (m.archetype === 'Bulwark') { const tanky = pool.filter((w) => ['Sword + Shield', 'Greatsword'].includes(w.type)); if (tanky.length) { const tb = tanky.reduce((a, b) => (w5Dps(b) > w5Dps(a) ? b : a)); if (w5Dps(tb) >= 0.7 * w5Dps(best)) best = tb; } }
    if (best.id !== cur.id) setMember({ ...me(m.id), equipped: { ...me(m.id).equipped, w5: best.id }, weapon: best.type });
  }
  for (const m of S.party) {
    for (let guard = 0; guard < FIVE.upgMax; guard++) {
      const w = S.bag.find((i) => i.id === me(m.id).equipped.w5); if (w.upg >= FIVE.upgMax) break;
      const need = w.upg + 1; const cost = 20 * w.tier * need;
      const worn = wornIds();
      const fodder = S.bag.filter((i) => i.kind === 'w5' && !worn.has(i.id) && i.tier === w.tier && (i.rarity === 'Common' || i.rarity === 'Rare')).sort((a, b) => w5Mult(a) - w5Mult(b)).slice(0, need);
      if (fodder.length < need || S.worldvein < cost) break;
      const gone = new Set(fodder.map((f) => f.id)); S.bag = S.bag.filter((i) => !gone.has(i.id)).map((i) => (i.id === w.id ? { ...i, upg: need } : i)); spend(S, 'upgrade weapons', cost);
    }
  }
  // gems, paced (ASSUMPTION until shards are designed): each party member is handed a matching gem and may hold `gemPace(area)` imbues, paid in Worldvein
  if (tuning.gemPace) for (const m of S.party) {
    if (!me(m.id).equipped?.gem) { const g = makeGem({ gemClass: ROLE_MATCH[m.archetype], fragments: { unspent: GEM_TUNING.points, imbued: 0 } }); S.bag.push(g); setMember({ ...me(m.id), equipped: { ...me(m.id).equipped, gem: g.id } }); }
    const id = me(m.id).equipped.gem;
    for (let k = 0; k < 40; k++) { const gem = S.bag.find((i) => i.id === id); if ((gem.lattice?.imbues || 0) >= tuning.gemPace(Math.min(tuning.walls || 10, S.unlocked))) break; const next = nextFacet(gem, S.worldvein * 0.5); if (!next) break; const r = imbueGem(gem, next.id); spend(S, 'gems', r.cost); S.bag = S.bag.map((i) => (i.id === id ? r.gem : i)); }
  }
  // keep a stock of spares at the current tier, sell the rest for a little Worldvein
  const worn = wornIds(); const topTier = Math.max(...S.party.map((m) => S.bag.find((i) => i.id === m.equipped.w5).tier));
  let kept = 0; const out = [];
  for (const i of S.bag) { if (i.kind !== 'w5' || worn.has(i.id)) { out.push(i); continue; } if (i.tier >= topTier && kept < 80) { kept += 1; out.push(i); } else { const v = 2 * i.tier * (FIVE.rarities.indexOf(i.rarity) + 1); S.worldvein += v; S.stats.veinEarned += v; } }
  S.bag = out;
}

// ------------------------------------------------------------------------------------------------ the Hearth
function hearthBlock(S, P, hours, partyFree) {
  const staff = [...(partyFree ? S.party : []), ...S.roster];
  if (!staff.length || hours <= 0) return;
  const cap = Math.max(...[...S.party, ...S.roster].map((m) => m.level));
  let afk = { ...S.afk, gatherSlots: S.afk.gatherSlots.map((g) => ({ ...g, charKey: null, running: false })), process: { ...S.afk.process, charKey: null, running: false }, idle: { ...S.afk.idle, charKey: null, running: false } };
  const pool = [...staff].sort((a, b) => a.level - b.level);
  const trainee = pool.find((m) => m.level < cap); const used = new Set();
  if (trainee) { afk = assignJob(afk, { kind: 'idle' }, trainee.id); afk = { ...afk, idle: startJob(afk.idle, 0) }; used.add(trainee.id); }
  const rest = pool.filter((m) => !used.has(m.id)); const proc = rest.pop();
  const families = ['metal', 'hunt', 'metal', 'hunt', 'metal'];
  afk.gatherSlots.forEach((g, i) => { const who = rest[i]; if (!who) return; afk = assignJob(afk, { kind: 'gather', index: i }, who.id); afk = { ...afk, gatherSlots: afk.gatherSlots.map((x, k) => (k === i ? startJob({ ...x, areaId: Math.min(9, S.unlocked), family: families[i] }, 0) : x)) }; });
  const rawMost = ['metal', 'hunt'].sort((a, b) => (S.inventory.raw[b] || 0) - (S.inventory.raw[a] || 0))[0];
  const budget = Math.floor(S.worldvein * P.processShare);
  if (proc && budget >= PROCESS_VEIN_COST) { afk = assignJob(afk, { kind: 'process' }, proc.id); afk = { ...afk, process: startJob({ ...afk.process, family: rawMost }, 0) }; }
  const r = reconcileAfk({ state: afk, inventory: S.inventory, bag: S.bag, worldvein: budget, party: S.party, roster: S.roster, unlocked: Math.min(10, S.unlocked), now: hours * 3600 * 1000, rng: () => nextRand(S), craft: craftMods(S.upgrades) });
  if (!r) return;
  S.afk = r.next; S.inventory = r.inv; S.bag = r.bag; const used$ = budget - r.vein; if (used$ > 0) spend(S, 'process', used$);
  if (r.partyNext) S.party = r.partyNext; if (r.rosterNext) S.roster = r.rosterNext;
}

// ------------------------------------------------------------------------------------------------ stepping
/** Play until `until(S)` is true or `maxHours` more play hours pass. Days roll over with the Hearth running around the play block. */
export function advance(S, P, tuning, { until, maxHours = Infinity }) {
  const AREAS = areasFor(tuning.walls || 9); const stopAt = S.playSec + maxHours * 3600;
  applyGlobalTuning(tuning);
  if (S.dayLeft == null) { S.dayLeft = P.hoursPerDay * 3600; townVisit(S, P, tuning); }
  for (let guard = 0; guard < 200000; guard++) {
    if (until(S) || S.playSec >= stopAt || S.unlocked > AREAS.length) break;
    if (S.dayLeft <= 60) { hearthBlock(S, P, P.hoursPerDay, false); hearthBlock(S, P, 24 - P.hoursPerDay, true); S.day += 1; S.dayLeft = P.hoursPerDay * 3600; townVisit(S, P, tuning); }
    let area = AREAS.find((a) => a.id === Math.min(AREAS.length, S.unlocked));
    if (area.id > 1) { const p = estimate(fieldedOf(S, tuning), enemiesFor(area, 'normal', { rng: mulberry32(S.day * 31 + area.id), depth01: 0.5 }, tuning), S.party.map(() => 1), { dmgMult: 1, mitAdd: 0 }, S.day); if (p < P.farmBelow) area = AREAS.find((a) => a.id === area.id - 1); }
    const r = playRun(S, area, P, tuning); S.dayLeft -= r.sec;
    townVisit(S, P, tuning);
  }
  return S;
}
export const cleared = (S, areaId) => S.stats.areas[areaId]?.clearedDay != null;

export function playCampaign({ seed = 1, policy = 'efficient', maxHours = 1200, tuning = NO_TUNING } = {}) {
  const P = POLICIES[policy]; const S = newGame(seed); const walls = tuning.walls || 9;
  advance(S, P, tuning, { until: (s) => cleared(s, walls), maxHours });
  return summarize(S, P, tuning);
}
export function summarize(S, P, tuning) {
  const walls = tuning.walls || 9;
  return { seed: S.seed, label: P.label, done: cleared(S, walls), days: S.day, playHours: +(S.playSec / 3600).toFixed(1), unlocked: S.unlocked, party: S.party.map((m) => ({ name: m.name, archetype: m.archetype, level: m.level })), rosterSize: S.party.length + S.roster.length, rank: rankFor(resonance([...S.party, ...S.roster])), upgrades: { ...S.upgrades }, worldvein: Math.round(S.worldvein), stats: S.stats };
}
export const partyOf = (S, tuning = NO_TUNING) => fieldedOf(S, tuning);
