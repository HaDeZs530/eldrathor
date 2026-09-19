/**
 * Progression simulator — plays the mountain with the game's OWN code (map generation, route rules, the
 * fight resolver, loot, XP, items, gems, the Veinbinder's upgrades, the Hearth) and a bot standing in for
 * the player. It changes no game numbers; it measures what the current numbers do.
 *
 * Target it is measured against (Anthony, 2026-09-19): a player at 3–4 h/day takes the whole mountain in
 * 2–3 months; ~2 months on the most efficient route. Longevity is the goal.
 *
 * What is modelled: runs (explore → fight / sanctuary → boss / extract / wipe), HP carried between fights,
 * sanctuary heal + bonus, roaming rares and ambushes, XP and levels, weapon drops + best-weapon equip,
 * empowering with spare weapons, class gem drops → equip → imbue, Resonance rank → Bond / Craft upgrades,
 * free recruits, the Hearth (Train / Gather / Process) for the 24 h of every day, armor crafted from
 * infused materials. What is NOT modelled: see ASSUMPTIONS.
 */
import { AREAS, DEFAULT_PARTY } from '../../src/data.js';
// the starting bench, as AppRoot.jsx defines it (it is not exported from data.js)
const DEFAULT_ROSTER = [
  { id: 'c-nyra', name: 'Nyra', archetype: 'Adept', weapon: 'Staff', level: 1, xp: 0 },
  { id: 'c-thalen', name: 'Thalen', archetype: 'Resonator', weapon: 'Orb + Tome', level: 1, xp: 0 },
];
import { genTerritory } from '../../src/map/genTerritory.js';
import { byId, effectiveType, rareAt, clearNode, killRare, tickClock, explorePath, allCleared } from '../../src/map/routeState.js';
import { spawnEnemies } from '../../src/combat/enemies.js';
import { simulateFight, mulberry32, INNATES } from '../../src/combat/simulate.js';
import { deriveStats, equip } from '../../src/combat/derive.js';
import { rollRewards } from '../../src/combat/rewards.js';
import { fightXp, splitXp, applyXp, withStarterWeapons, previewEmpower, LEVEL_CAP } from '../../src/progression/progression.js';
import { ARMOR_TYPES, ARMOR_SLOTS, tierForArea, armorBonus, sellValue, craftableRarities } from '../../src/progression/items.js';
import { awardLevelFragments, isGem, isMatching, canImbueGem, imbueGem } from '../../src/progression/gems.js';
import { latticeFor } from '../../src/lattice/classGems.js';
import { resonance, rankFor } from '../../src/player/resonance.js';
import { UPGRADE_IDS, canBuy, buy, bondMods, craftMods } from '../../src/player/upgrades.js';
import { armorRecipe, canCraft, consume, craftArmor } from '../../src/town/recipes.js';
import { emptyAfkState, assignJob, startJob, reconcileAfk, withGatherSlots, gatherSlotCount, PROCESS_VEIN_COST } from '../../src/afkRuntime.js';
import { candidatesForDay, recruitCost, FREE_RECRUITS } from '../../src/progression/roster.js';
import { starterWeapon } from '../../src/progression/progression.js';

export const ASSUMPTIONS = [
  'Play time counts fight playback at the chosen speed plus a results pause, 0.9 s per travel hop, a fixed decision time per node and a fixed town visit per run. Reading, idling in menus and breaks are not counted.',
  'The bot always fights an ambush (it never rolls to flee) and never flees a fight it chose.',
  'The bot judges a fight by dry-running it a few times with the game\'s own resolver, like the threat badge does, and acts on that.',
  'Any Adventurer may wield any weapon type (as the game allows today); the bot gives each the weapon with the best damage per second, and keeps a shield-or-greatsword on the tank when one is within reach.',
  'Armor is crafted the moment materials allow a better piece; the rating roll is the game\'s own 1–100.',
  'The Hearth runs all 24 h: during the idle hours every Adventurer can hold a job, during play only the bench can. Process is budgeted to a share of banked Worldvein so it cannot drain the account.',
  'Only the three free recruits are hired unless a policy says otherwise. Recruits arrive at level 1 and are raised by Train.',
  'Areas 2–9 use the placeholder enemy formula (same units scaled by tier); there are no per-area rosters yet.',
  'No events, no daily rewards, no market purchases — none exist in the game yet.',
];

export const POLICIES = {
  efficient: { label: 'Efficient', hoursPerDay: 3.5, fightSpeed: 2, skipFights: false, clearShare: 0.55, bossAt: 0.6, fightAt: 0.5, rareAt: 0.75, farmBelow: 0.55, decisionSec: 4, townSec: 40, processShare: 0.2, paidRecruits: 0 },
  typical: { label: 'Typical', hoursPerDay: 3.5, fightSpeed: 1, skipFights: false, clearShare: 0.85, bossAt: 0.75, fightAt: 0.6, rareAt: 0.85, farmBelow: 0.65, decisionSec: 8, townSec: 90, processShare: 0.15, paidRecruits: 0 },
  casual: { label: 'Casual (2 h)', hoursPerDay: 2, fightSpeed: 1, skipFights: false, clearShare: 0.85, bossAt: 0.8, fightAt: 0.65, rareAt: 0.9, farmBelow: 0.7, decisionSec: 10, townSec: 120, processShare: 0.1, paidRecruits: 0 },
  skipper: { label: 'Skips every fight', hoursPerDay: 3.5, fightSpeed: 2, skipFights: true, clearShare: 0.55, bossAt: 0.6, fightAt: 0.5, rareAt: 0.75, farmBelow: 0.55, decisionSec: 4, townSec: 40, processShare: 0.2, paidRecruits: 0 },
};
const RESULTS_PAUSE_SEC = 3;
const SKIP_SEC = 1.5;
const HOP_SEC = 0.9;
const DRY_RUNS = 3;

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const clone = (o) => JSON.parse(JSON.stringify(o));

// ------------------------------------------------------------------------------------------------ state
export function newGame(seed) {
  const rng = mulberry32(seed);
  const members = [...DEFAULT_PARTY, ...DEFAULT_ROSTER].map((m) => ({ ...m, xp: 0, level: 1, equipped: {} }));
  let bag = [];
  const geared = withStarterWeapons(members, bag);
  return {
    rng, seed, day: 0, playSec: 0, party: geared.members.slice(0, 3), roster: geared.members.slice(3), bag: geared.bag,
    worldvein: 80, unlocked: 1, upgrades: {}, inventory: { raw: { wood: 4, metal: 2, hunt: 1 } }, hired: 0,
    afk: emptyAfkState(), stats: { areas: {}, fights: 0, wins: 0, wipes: 0, runs: 0, extracts: 0, veinEarned: 0, veinSpent: {}, gemsFound: 0, timeline: [] },
  };
}
const spend = (S, what, n) => { S.worldvein -= n; S.stats.veinSpent[what] = (S.stats.veinSpent[what] || 0) + n; };
const fieldedOf = (S) => S.party.map((m) => equip(m, S.bag, bondMods(S.upgrades)));
const areaStat = (S, id) => (S.stats.areas[id] ||= { area: id, name: AREAS.find((a) => a.id === id).name, tier: AREAS.find((a) => a.id === id).tier, firstDay: null, clearedDay: null, playHours: 0, runs: 0, fights: 0, wins: 0, wipes: 0, bossAttempts: 0, bossWins: 0, extracts: 0, levelOnArrival: null, levelOnClear: null, weaponOnClear: null, armorOnClear: null, veinEarned: 0, fightSecs: [] });

// ------------------------------------------------------------------------------------------------ fights
function enemiesFor(S, area, t, node, rng) {
  const eff = effectiveType(t, node);
  if (eff === 'sanctuary') return [];
  return spawnEnemies(area.tier, eff, false, { rng, bossName: area.boss, depthMult: eff === 'rare' || eff === 'boss' ? 1 : 1 + 0.5 * (node.depth01 || 0), named: !!node.namedRare });
}
function estimate(party, enemies, hp, runMods, seed0) {
  let wins = 0;
  for (let i = 0; i < DRY_RUNS; i++) if (simulateFight({ party, enemies: enemies.map((e) => ({ ...e })), seed: seed0 + i * 7919 + 1, startHpFrac: hp, runMods }).result.win) wins += 1;
  return wins / DRY_RUNS;
}

/** One run in `area`. Returns what happened; mutates S (loot, XP, Worldvein, time). */
function playRun(S, area, P) {
  const A = areaStat(S, area.id);
  const runSeed = Math.floor(S.rng() * 2 ** 31);
  const rng = mulberry32(runSeed);
  let t = genTerritory(area, { rng });
  let cur = t.entranceId;
  let hp = S.party.map(() => 1);
  let runMods = { dmgMult: 1, mitAdd: 0 };
  let runVein = 0; let sec = P.townSec; let fightIndex = 0; let outcome = 'extract';
  const craft = craftMods(S.upgrades);
  A.runs += 1; S.stats.runs += 1;
  if (A.firstDay == null) { A.firstDay = S.day; A.levelOnArrival = avg(S.party.map((m) => m.level)); }
  const total = t.nodes.length;

  const doFight = (node, { ambush = false } = {}) => {
    const party = fieldedOf(S);
    fightIndex += 1;
    const seed = (runSeed ^ Math.imul(fightIndex, 0x9e3779b1)) >>> 0;
    const frng = mulberry32(seed ^ 0x5bd1e995);
    const enemies = enemiesFor(S, area, t, node, frng);
    const eff = effectiveType(t, node);
    const sim = simulateFight({ party, enemies: enemies.map((e) => ({ ...e })), seed, startHpFrac: hp, runMods, enemyFirst: false });
    const watch = P.skipFights ? SKIP_SEC : sim.result.durationMs / 1000 / P.fightSpeed;
    sec += watch + RESULTS_PAUSE_SEC; A.fights += 1; S.stats.fights += 1; A.fightSecs.push(sim.result.durationMs / 1000);
    if (eff === 'boss') A.bossAttempts += 1;
    if (!sim.result.win) return { win: false, eff, ambush };
    A.wins += 1; S.stats.wins += 1;
    hp = sim.result.partyHpFrac;
    const bossKill = eff === 'boss';
    const mapClear = bossKill && allCleared({ ...t, nodes: t.nodes.map((x) => (x.id === node.id ? { ...x, cleared: true } : x)) });
    const rewards = rollRewards({ area: area.id, nodeType: eff, attuneVein: sim.result.attuneVein, rng: frng, named: !!node.namedRare, mapClear, bossName: bossKill ? area.boss : null, veinMult: craft.veinMult, oneUpChance: craft.oneUpChance });
    runVein += rewards.worldvein;
    for (const g of rewards.gears) S.bag.push(g);
    for (const g of rewards.gems || []) { S.bag.push(g); S.stats.gemsFound += 1; }
    // XP → levels → fragments on the worn gems
    const gains = splitXp(Math.round(fightXp(enemies, area.tier)), party, sim.result.partyHpFrac);
    const lvGains = [];
    S.party = S.party.map((m, i) => { const r = applyXp(m, gains[i]); lvGains.push({ member: m, levelsGained: r.levelsGained }); return r.member; });
    S.bag = awardLevelFragments(S.bag, lvGains).bag;
    if (rareAt(t, node.id)) t = killRare(t, node.id);
    t = clearNode(t, node.id, rng);
    return { win: true, eff, bossKill };
  };

  for (let guard = 0; guard < 400; guard++) {
    const map = byId(t);
    const frontier = t.nodes.filter((n) => n.revealed && !n.cleared && explorePath(t, cur, n.id));
    if (!frontier.length) break;
    const party = fieldedOf(S);
    const hpAvg = avg(hp);
    const cleared = t.nodes.filter((n) => n.cleared).length;
    // choose: a sanctuary when hurt; the boss when ready; otherwise the nearest ordinary node
    const dist = (n) => explorePath(t, cur, n.id).length - 1;
    const known = (n) => (n.scouted || n.typeKnown ? effectiveType(t, n) : 'unknown');
    const sanct = frontier.filter((n) => known(n) === 'sanctuary' && !n.sanctuaryUsed).sort((a, b) => dist(a) - dist(b))[0];
    const boss = frontier.find((n) => n.type === 'boss');
    let target = null;
    if (sanct && hpAvg < 0.6) target = sanct;
    if (!target && boss && cleared / total >= P.clearShare * 0.5) {
      const p = estimate(party, enemiesFor(S, area, t, boss, mulberry32(runSeed ^ 77)), hp, runMods, runSeed);
      if (p >= P.bossAt) target = boss;
      else if (sanct && hpAvg < 0.95) target = sanct; // top up, then look again
    }
    if (!target) {
      const rest = frontier.filter((n) => n.type !== 'boss').sort((a, b) => dist(a) - dist(b) || a.depth - b.depth);
      target = rest[0] || null;
    }
    if (!target) { outcome = 'extract'; break; } // only the boss is left and it is not winnable today
    // walk there
    const path = explorePath(t, cur, target.id); sec += (path.length - 1) * HOP_SEC + P.decisionSec; cur = target.id;
    t = { ...t, nodes: t.nodes.map((n) => (n.id === target.id ? { ...n, scouted: true, typeKnown: true, revealed: true } : n)) };
    const node = byId(t)[target.id];
    const eff = effectiveType(t, node);
    if (eff === 'sanctuary') {
      hp = S.party.map(() => 1);
      runMods = hpAvg > 0.8 ? { ...runMods, dmgMult: runMods.dmgMult + 0.1 } : { ...runMods, mitAdd: runMods.mitAdd + 0.1 };
      t = clearNode({ ...t, nodes: t.nodes.map((n) => (n.id === node.id ? { ...n, sanctuaryUsed: true } : n)) }, node.id, rng);
    } else {
      const p = estimate(party, enemiesFor(S, area, t, node, mulberry32(runSeed ^ (fightIndex + 1))), hp, runMods, runSeed + guard);
      const need = eff === 'rare' ? P.rareAt : eff === 'boss' ? P.bossAt : P.fightAt;
      if (p < need) {
        // too dangerous right now: rest at a sanctuary if one is known, otherwise bank what we have
        if (sanct && hpAvg < 0.95) { continue; }
        outcome = 'extract'; break;
      }
      const r = doFight(node);
      if (!r.win) { outcome = 'wipe'; break; }
      if (r.bossKill) { outcome = 'boss'; break; }
    }
    // the clock: rares roam, and one may land on the party
    const tick = tickClock(t, { currentId: cur, rng }); t = tick.territory;
    const amb = tick.events.find((e) => e.ontoParty);
    if (amb) { const r = doFight(byId(t)[cur], { ambush: true }); if (!r.win) { outcome = 'wipe'; break; } }
    if (avg(hp) < 0.3 && !t.nodes.some((n) => n.revealed && !n.cleared && n.type === 'sanctuary')) { outcome = 'extract'; break; }
    if (cleared / total >= P.clearShare && !boss) continue;
  }

  S.worldvein += runVein; S.stats.veinEarned += runVein; A.veinEarned += runVein;
  if (outcome === 'wipe') { A.wipes += 1; S.stats.wipes += 1; }
  if (outcome === 'extract') { A.extracts += 1; S.stats.extracts += 1; }
  if (outcome === 'boss') {
    A.bossWins += 1;
    if (A.clearedDay == null) {
      A.clearedDay = S.day; A.levelOnClear = avg(S.party.map((m) => m.level));
      const f = fieldedOf(S);
      A.weaponOnClear = f.map((m) => (m.weaponItem ? `T${m.weaponItem.tier} ${m.weaponItem.rarity}${m.weaponItem.empower ? ` +${m.weaponItem.empower}` : ''}` : 'unarmed')).join(' · ');
      A.armorOnClear = avg(f.map((m) => m.armorItems.length));
      A.powerOnClear = { hp: Math.round(avg(f.map((m) => deriveStats(m).maxHp))), dps: +f.reduce((n, m) => { const d = deriveStats(m); return n + d.hitDamage / d.swingInterval; }, 0).toFixed(1) };
      S.stats.timeline.push({ day: S.day, playHours: +(S.playSec / 3600).toFixed(1), event: `cleared ${area.name}` });
    }
    S.unlocked = Math.max(S.unlocked, Math.min(9, area.id + 1));
  }
  S.playSec += sec; A.playHours += sec / 3600;
  return { outcome, sec };
}

// ------------------------------------------------------------------------------------------------ town
function dpsWith(member, weapon, S) { const d = deriveStats({ ...equip(member, S.bag, bondMods(S.upgrades)), weaponItem: weapon }); return (d.hitDamage / d.swingInterval) * (1 + d.critChance * (d.critMult - 1)); }
function townVisit(S, P) {
  const all = () => [...S.party, ...S.roster];
  const setMember = (m2) => { S.party = S.party.map((m) => (m.id === m2.id ? m2 : m)); S.roster = S.roster.map((m) => (m.id === m2.id ? m2 : m)); };
  // 1. weapons: the party takes the best by DPS; the tank keeps a Tank-group weapon when one is within 70 %
  const weapons = () => S.bag.filter((i) => i.kind === 'weapon');
  const taken = new Set();
  for (const m of S.party) {
    const pool = weapons().filter((w) => !taken.has(w.id) && !S.roster.some((r) => r.equipped?.weapon === w.id));
    if (!pool.length) continue;
    let best = pool.reduce((a, b) => (dpsWith(m, b, S) > dpsWith(m, a, S) ? b : a));
    if (m.archetype === 'Bulwark') { const tanky = pool.filter((w) => ['Sword + Shield', 'Greatsword'].includes(w.type)); if (tanky.length) { const tb = tanky.reduce((a, b) => (dpsWith(m, b, S) > dpsWith(m, a, S) ? b : a)); if (dpsWith(m, tb, S) >= 0.7 * dpsWith(m, best, S)) best = tb; } }
    taken.add(best.id); setMember({ ...S.party.find((x) => x.id === m.id), equipped: { ...(m.equipped || {}), weapon: best.id }, weapon: best.type });
  }
  // 2. armor: craft the best piece the materials allow, per party member and slot
  const tier = tierForArea(S.unlocked);
  for (const m of S.party) for (const type of Object.keys(ARMOR_TYPES)) {
    const slot = ARMOR_TYPES[type].slot; const cur = S.bag.find((i) => i.id === S.party.find((x) => x.id === m.id).equipped?.[slot]);
    for (const rarity of [...craftableRarities(S.unlocked)].reverse()) {
      const recipe = armorRecipe(type, rarity, tier); if (!recipe || !canCraft(S.bag, recipe, S.unlocked)) continue;
      const curVal = cur ? armorBonus(cur).hp : 0; const expect = armorBonus({ ...recipe, kind: 'armor', rating: 50 }).hp;
      if (expect <= curVal * 1.05) break;
      S.bag = consume(S.bag, recipe, S.unlocked); const piece = craftArmor(recipe, S.rng); S.bag.push(piece);
      const mm = S.party.find((x) => x.id === m.id); setMember({ ...mm, equipped: { ...(mm.equipped || {}), [slot]: piece.id } }); break;
    }
  }
  // 3. gems: wear one (matching first), then imbue while it is affordable
  for (const m of S.party) {
    const mm = S.party.find((x) => x.id === m.id);
    if (!mm.equipped?.gem) { const free = S.bag.filter((i) => isGem(i) && !all().some((x) => x.equipped?.gem === i.id)); const pick = free.find((g) => isMatching(mm.archetype, g.gemClass)) || free[0]; if (pick) setMember({ ...mm, equipped: { ...(mm.equipped || {}), gem: pick.id } }); }
  }
  for (const m of S.party) {
    const id = S.party.find((x) => x.id === m.id).equipped?.gem; if (!id) continue;
    for (let k = 0; k < 40; k++) {
      const gem = S.bag.find((i) => i.id === id); const def = latticeFor(gem.gemClass);
      const order = def.facets.filter((f) => f.kind !== 'dormant').sort((a, b) => a.ring - b.ring);
      const next = order.find((f) => canImbueGem(gem, f.id, { worldvein: S.worldvein * 0.5, worn: true }).ok);
      if (!next) break;
      const r = imbueGem(gem, next.id); spend(S, 'gems', r.cost); S.bag = S.bag.map((i) => (i.id === id ? r.gem : i));
    }
  }
  // 4. the Veinbinder's upgrades: cheapest first, never more than a fifth of the bank on one level
  const rank = rankFor(resonance(all()));
  for (let k = 0; k < 60; k++) {
    const options = UPGRADE_IDS.map((id) => ({ id, c: canBuy(S.upgrades, id, { rank, worldvein: S.worldvein }) })).filter((o) => o.c.ok && o.c.cost <= S.worldvein * 0.2).sort((a, b) => a.c.cost - b.c.cost);
    if (!options.length) break;
    spend(S, 'upgrades', options[0].c.cost); S.upgrades = buy(S.upgrades, options[0].id);
    if (options[0].id === 'hearth') S.afk = withGatherSlots(S.afk, gatherSlotCount(craftMods(S.upgrades).extraSlots));
  }
  // 5. empower the party's weapons with the spare ones, then sell what is left
  const worn = new Set(all().flatMap((m) => Object.values(m.equipped || {})));
  for (const m of S.party) {
    const wid = S.party.find((x) => x.id === m.id).equipped?.weapon; if (!wid) continue;
    for (const f of S.bag.filter((i) => i.kind === 'weapon' && !worn.has(i.id))) {
      const target = S.bag.find((i) => i.id === wid); const pv = previewEmpower(target, f, S.worldvein);
      if (!pv || !pv.useful || !pv.affordable || pv.cost > S.worldvein * 0.1) continue;
      spend(S, 'empower', pv.cost); S.bag = S.bag.filter((i) => i.id !== f.id).map((i) => (i.id === wid ? { ...i, empower: pv.next } : i));
    }
  }
  const worn2 = new Set(all().flatMap((m) => Object.values(m.equipped || {})));
  for (const i of S.bag.filter((x) => (x.kind === 'weapon' || x.kind === 'armor') && !worn2.has(x.id))) { S.worldvein += sellValue(i); S.stats.veinEarned += sellValue(i); }
  S.bag = S.bag.filter((x) => !((x.kind === 'weapon' || x.kind === 'armor') && !worn2.has(x.id)));
  // 6. the free recruits
  while (S.hired < FREE_RECRUITS + P.paidRecruits) {
    const cost = recruitCost(S.hired); if (cost > S.worldvein * 0.25) break;
    const c = candidatesForDay(S.day + S.hired)[0]; const w = starterWeapon(c.weapon);
    if (cost) spend(S, 'recruits', cost);
    S.bag.push(w); S.roster.push({ id: `c-rec${S.hired}`, name: `${c.name}${S.hired}`, archetype: c.archetype, weapon: c.weapon, level: 1, xp: 0, equipped: { weapon: w.id } }); S.hired += 1;
  }
}

// ------------------------------------------------------------------------------------------------ the Hearth
function hearthBlock(S, P, hours, { partyFree }) {
  const staff = [...(partyFree ? S.party : []), ...S.roster];
  if (!staff.length) return;
  const cap = Math.max(...[...S.party, ...S.roster].map((m) => m.level));
  let afk = { ...S.afk, gatherSlots: S.afk.gatherSlots.map((g) => ({ ...g, charKey: null, running: false })), process: { ...S.afk.process, charKey: null, running: false }, idle: { ...S.afk.idle, charKey: null, running: false } };
  const pool = [...staff].sort((a, b) => a.level - b.level);
  const trainee = pool.find((m) => m.level < cap);
  const used = new Set();
  if (trainee) { afk = assignJob(afk, { kind: 'idle' }, trainee.id); afk = { ...afk, idle: startJob(afk.idle, 0) }; used.add(trainee.id); }
  const rest = pool.filter((m) => !used.has(m.id));
  const families = ['metal', 'hunt', 'metal', 'hunt', 'metal'];
  const proc = rest.pop();
  afk.gatherSlots.forEach((g, i) => { const who = rest[i]; if (!who) return; afk = assignJob(afk, { kind: 'gather', index: i }, who.id); afk = { ...afk, gatherSlots: afk.gatherSlots.map((x, k) => (k === i ? startJob({ ...x, areaId: S.unlocked, family: families[i] }, 0) : x)) }; });
  const rawMost = ['metal', 'hunt'].sort((a, b) => (S.inventory.raw[b] || 0) - (S.inventory.raw[a] || 0))[0];
  const budget = Math.floor(S.worldvein * P.processShare);
  if (proc && budget >= PROCESS_VEIN_COST) { afk = assignJob(afk, { kind: 'process' }, proc.id); afk = { ...afk, process: startJob({ ...afk.process, family: rawMost }, 0) }; }
  const r = reconcileAfk({ state: afk, inventory: S.inventory, bag: S.bag, worldvein: budget, party: S.party, roster: S.roster, unlocked: S.unlocked, now: hours * 3600 * 1000, rng: S.rng, craft: craftMods(S.upgrades) });
  if (!r) return;
  S.afk = r.next; S.inventory = r.inv; S.bag = r.bag;
  const used$ = budget - r.vein; if (used$ > 0) spend(S, 'process', used$); else S.worldvein += -used$;
  if (r.partyNext) S.party = r.partyNext; if (r.rosterNext) S.roster = r.rosterNext;
}

// ------------------------------------------------------------------------------------------------ campaign
export function playCampaign({ seed = 1, policy = 'efficient', maxDays = 150 } = {}) {
  const P = POLICIES[policy]; const S = newGame(seed);
  const daily = [];
  for (S.day = 1; S.day <= maxDays; S.day++) {
    let left = P.hoursPerDay * 3600;
    townVisit(S, P);
    while (left > 60) {
      // where to run: the highest unlocked area, unless an ordinary fight there is not reliably winnable → farm the one below
      let area = AREAS.find((a) => a.id === S.unlocked);
      if (area.id > 1) { const p = estimate(fieldedOf(S), spawnEnemies(area.tier, 'normal', false, { rng: mulberry32(S.day * 31 + area.id), depthMult: 1.25 }), S.party.map(() => 1), { dmgMult: 1, mitAdd: 0 }, S.day); if (p < P.farmBelow) area = AREAS.find((a) => a.id === area.id - 1); }
      const r = playRun(S, area, P); left -= r.sec;
      townVisit(S, P);
      if (areaStat(S, 9).clearedDay != null) break;
    }
    hearthBlock(S, P, P.hoursPerDay, { partyFree: false });
    hearthBlock(S, P, 24 - P.hoursPerDay, { partyFree: true });
    daily.push({ day: S.day, unlocked: S.unlocked, level: +avg(S.party.map((m) => m.level)).toFixed(1), vein: Math.round(S.worldvein), rank: rankFor(resonance([...S.party, ...S.roster])), playHours: +(S.playSec / 3600).toFixed(1) });
    if (areaStat(S, 9).clearedDay != null) break;
    if (S.party.every((m) => m.level >= LEVEL_CAP) && S.day > 30 && daily.at(-1).unlocked === daily.at(-20)?.unlocked) break; // hard wall: capped and stuck
  }
  const done = areaStat(S, 9).clearedDay != null;
  return { seed, policy, label: P.label, done, days: S.day > maxDays ? maxDays : S.day, playHours: +(S.playSec / 3600).toFixed(1), unlocked: S.unlocked, party: S.party.map((m) => ({ name: m.name, archetype: m.archetype, level: m.level })), rosterSize: S.party.length + S.roster.length, rank: rankFor(resonance([...S.party, ...S.roster])), upgrades: clone(S.upgrades), worldvein: Math.round(S.worldvein), stats: S.stats, daily, innates: Object.keys(INNATES).length, armorSlots: ARMOR_SLOTS.length };
}
