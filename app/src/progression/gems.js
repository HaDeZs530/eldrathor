/**
 * Class gem items — docs/Eldrathor_Growth_Model_Lock.md §1 + docs/Eldrathor_ClassGems_Live_Lock.md §4–§5.
 *   { id, kind: 'gem', gemClass, lattice: LatticeState, fragments: { unspent, imbued }, name }
 * Gems have no tier and no rarity. Everything is per gem: fragments are earned BY the gem (its wearer
 * levelling up), spent ON the gem, and travel with it. An unequipped gem never grows.
 */
import { newId } from '../data.js';
import { GEM_TUNING, GEM_CLASSES, ROLE_MATCH, latticeFor } from '../lattice/classGems.js';
import { emptyLatticeState, normalizeLatticeState, canImbue, imbue, derive, canSwapFinisher, swapFinisher, facetById } from '../lattice/engine.js';

export const isGem = (item) => item?.kind === 'gem';
export const gemName = (gemClass) => `${gemClass} Gem`;

export function makeGem({ gemClass, id, lattice, fragments } = {}) {
  const k = GEM_CLASSES.includes(gemClass) ? gemClass : GEM_CLASSES[0];
  return {
    id: id || newId('g'), kind: 'gem', gemClass: k, name: gemName(k),
    lattice: normalizeLatticeState(lattice || emptyLatticeState()),
    fragments: { unspent: Math.max(0, fragments?.unspent | 0), imbued: Math.max(0, fragments?.imbued | 0) },
  };
}

/** `Tank Gem  [12/40]  3 frag` — the bag row's chips. */
export const gemProgress = (gem) => `${gem?.lattice?.imbues || 0}/${GEM_TUNING.points}`;

// ---------- §4 drops ----------
/** Chance a node drops a gem: rares 20 %, bosses 35 %, a named variant +10 %. */
export const gemDropChance = (nodeType, named = false) => (GEM_TUNING.drops[nodeType] || 0) + (named ? GEM_TUNING.drops.named : 0);
/** Roll a gem drop. Class is uniform over the four; there is no pity. Consumes rng only when a drop is possible. */
export function rollGemDrop(rng, { nodeType, named = false } = {}) {
  const chance = gemDropChance(nodeType, named);
  if (chance <= 0 || rng() >= chance) return null;
  return makeGem({ gemClass: GEM_CLASSES[Math.floor(rng() * GEM_CLASSES.length) % GEM_CLASSES.length] });
}

// ---------- §5 crossing / matching ----------
/** Matching = the gem's class is the archetype's own role. A Resonator matches nothing. */
export const isMatching = (archetype, gemClass) => ROLE_MATCH[archetype] === gemClass;
export const isCrossing = (archetype, gemClass) => !isMatching(archetype, gemClass);
/** Matching amplifies the archetype's personal innate by `1 + 0.5 × imbues/40` (max ×1.5). */
export const matchAmp = (gem) => 1 + GEM_TUNING.matchAmp * Math.min(1, (gem?.lattice?.imbues || 0) / GEM_TUNING.points);

/**
 * What a worn gem does for its wearer.
 * @returns {null | { gemClass, crossing, coreAbility: object|null, innateAmp: number, statMods, procs: string[], finisher: {id, level}|null, imbues }}
 */
export function gemEffects(archetype, gem) {
  if (!isGem(gem)) return null;
  const def = latticeFor(gem.gemClass);
  const d = derive(def, gem.lattice);
  const crossing = isCrossing(archetype, gem.gemClass);
  return {
    gemClass: gem.gemClass, crossing,
    coreAbility: crossing ? { ...GEM_TUNING.core[gem.gemClass] } : null, // crossing grants exactly one ability
    innateAmp: crossing ? 1 : matchAmp(gem), // matching amplifies the innate instead
    statMods: d.statMods, procs: d.procs, finisher: d.finisher, imbues: d.imbues,
  };
}
/** The `gems` multipliers deriveStats reads (the nine stats only — flavor stats act in the simulator). */
export function gemStatMods(gem) {
  if (!isGem(gem)) return null;
  return derive(latticeFor(gem.gemClass), gem.lattice).statMods;
}

// ---------- §1 fragments (gem-bound) ----------
/** The gem id an Adventurer wears, if any. */
export const wornGemId = (member) => member?.equipped?.gem || null;
/** Add `n` unspent fragments to one gem in the bag. Returns the same bag when the gem isn't there. */
export function addFragments(bag, gemId, n) {
  if (!gemId || !(n > 0)) return bag;
  let hit = false;
  const next = (bag || []).map((i) => (i.id === gemId && isGem(i) ? ((hit = true), { ...i, fragments: { ...i.fragments, unspent: (i.fragments?.unspent || 0) + n } }) : i));
  return hit ? next : bag;
}
/**
 * Level-ups feed the WORN gem: 1 fragment per level gained. Unworn gems gain nothing.
 * @param {{member: object, levelsGained: number}[]} gains
 * @returns {{ bag: object[], awards: { memberName, gemId, gemName, n }[] }}
 */
export function awardLevelFragments(bag, gains) {
  let next = bag || [];
  const awards = [];
  for (const { member, levelsGained } of gains || []) {
    const n = (levelsGained || 0) * GEM_TUNING.fragmentsPerLevel;
    const gemId = wornGemId(member);
    if (n <= 0 || !gemId) continue;
    const gem = next.find((i) => i.id === gemId && isGem(i));
    if (!gem) continue;
    next = addFragments(next, gemId, n);
    awards.push({ memberName: member.name, gemId, gemName: gem.name, n });
  }
  return { bag: next, awards };
}
/** `Kessa's Tank Gem +1 fragment` */
export const fragmentLine = (a) => `${a.memberName}'s ${a.gemName} +${a.n} fragment${a.n === 1 ? '' : 's'}`;

// ---------- imbue / finisher swap on a gem ----------
/** Why a gem can or can't take a level on `facetId`. `worn` false → "Equip to grow". */
export function canImbueGem(gem, facetId, { worldvein = 0, worn = true } = {}) {
  return canImbue(latticeFor(gem.gemClass), gem.lattice, facetId, {
    fragments: gem.fragments?.unspent || 0, worldvein, tuning: GEM_TUNING.imbue, blocked: worn ? null : 'Equip to grow',
  });
}
/** Imbue one level: −1 unspent fragment, +1 imbued, Worldvein sunk into the gem. @returns {{ gem, cost }} */
export function imbueGem(gem, facetId) {
  const def = latticeFor(gem.gemClass);
  const before = gem.lattice.worldveinSpent;
  const lattice = imbue(def, gem.lattice, facetId, { tuning: GEM_TUNING.imbue });
  return {
    gem: { ...gem, lattice, fragments: { unspent: (gem.fragments?.unspent || 0) - 1, imbued: (gem.fragments?.imbued || 0) + 1 } },
    cost: lattice.worldveinSpent - before,
  };
}
export function canSwapGemFinisher(gem, toId, { worldvein = 0, worn = true } = {}) {
  const fee = GEM_TUNING.finisherSwap;
  const base = canSwapFinisher(latticeFor(gem.gemClass), gem.lattice, toId);
  if (!base.ok) return { ...base, fee };
  if (!worn) return { ok: false, reason: 'Equip to grow', fee };
  if ((gem.fragments?.unspent || 0) < fee.fragments) return { ok: false, reason: `Needs ${fee.fragments} Vein Fragments`, fee };
  if (worldvein < fee.worldvein) return { ok: false, reason: 'Not enough Worldvein', fee };
  return { ok: true, reason: null, fee };
}
/** Swap the finisher: 200 ❖ + 2 fragments; the set finisher's levels move across. */
export function swapGemFinisher(gem, toId) {
  const fee = GEM_TUNING.finisherSwap;
  const lattice = swapFinisher(latticeFor(gem.gemClass), gem.lattice, toId, { fee: fee.worldvein });
  return { gem: { ...gem, lattice, fragments: { unspent: (gem.fragments?.unspent || 0) - fee.fragments, imbued: (gem.fragments?.imbued || 0) + fee.fragments } }, cost: fee.worldvein };
}
export const gemFacet = (gem, facetId) => facetById(latticeFor(gem.gemClass), facetId);
