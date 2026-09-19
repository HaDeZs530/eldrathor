/**
 * The four class-gem lattices — docs/Eldrathor_Growth_Model_Lock.md §1, contents from
 * docs/Eldrathor_ClassGemTrees_Lock.md (July), numbers from docs/Eldrathor_ClassGems_Live_Lock.md §3.
 * Every magnitude lives in GEM_TUNING — tune there, never in the defs.
 *
 * LOCK CONFLICT (flagged for the Design Chat, PR feat/m2-2): the Growth Model asks for 40 hexes
 * (6 + 12 + 18 + 4 finishers) with 3-level stat facets, AND says the contents are "exactly the July lists".
 * The July lists are 16 facets — 5 + 3 stat facets, 2 procs, 4 stat facets, 2 finishers — worth exactly
 * 40 imbues (15 + 9 + 2 + 12 + 2), which is also what the cost curve (40th ≈ 1,660 ❖), the bag row
 * `[12/40]` and the matching multiplier `1 + 0.5 × imbued/40` are calibrated to. Filling all 40 hexes
 * with 3-level facets would be ~106 imbues, ~2.8× the July power budget and a last imbue near 3 M ❖.
 * So: the full 40-hex geometry is built, the 16 July facets are written onto it ring by ring, and the
 * remaining 24 hexes are DORMANT (dark, never imbuable) until more facets are written. Filling them is
 * a data edit in PLACEMENT / CONTENTS below — nothing else changes. `imbued/40` counts imbues.
 */
import { GEOMETRY, CORE_ID, hexId, COMPASS, PROC_HEXES } from './hexLayout.js';
import { capacity } from './engine.js';

export const GEM_TUNING = {
  statPerLevel: 0.04, // +4 % of that stat per level (max +12 % per facet)
  flavorPerLevel: 0.10, // Taunt Strength / Control Strength: +10 % per level
  statLevels: 3, procLevels: 1, finisherLevels: 2,
  imbue: { base: 20, growth: 1.12 }, // Worldvein for the n-th imbue on that gem: 20 × 1.12^n (+ 1 Vein Fragment)
  finisherSwap: { worldvein: 200, fragments: 2 },
  points: 40, // a full gem: 15 + 9 + 2 + 12 + 2
  matchAmp: 0.5, // matching: personal innate × (1 + 0.5 × imbues/40) — max ×1.5
  fragmentsPerLevel: 1, // (tune) the worn gem gains 1 Vein Fragment per level-up of its wearer
  drops: { rare: 0.2, boss: 0.35, named: 0.1 }, // class uniform over the four, no pity
  // The Core ability a CROSSING wearer is granted (ClassGems_Live §3)
  core: {
    Tank: { id: 'gemTaunt', name: 'Taunt', glyph: '🛡', tauntMs: 4000, mitAdd: 0.15, cd: 10000, mana: 20 },
    Healer: { id: 'gemHeal', name: 'Heal', glyph: '✚', base: 25, cd: 7000, mana: 25 },
    DPS: { id: 'gemBurst', name: 'Burst', glyph: '✦', mult: 2.5, cd: 8000, mana: 20 },
    Controller: { id: 'gemStun', name: 'Stun', glyph: '✴', stunMs: 1500, bossStunMs: 750, bossImmuneMs: 10000, cd: 12000, mana: 30 },
  },
  procs: {
    thornward: { name: 'Thornward', reflect: 0.15 }, // while holding taunt
    secondSkin: { name: 'Second Skin', below: 0.35, mitAdd: 0.3, ms: 3000, cd: 20000 },
    emberBrand: { name: 'Ember Brand', chance: 0.25, burnPerSec: 0.04, maxStacks: 5, ms: 4000 }, // % of the wearer's hit damage per second, per stack
    execution: { name: 'Execution', below: 0.25, mult: 1.5, cd: 6000 },
    enfeeble: { name: 'Enfeeble', chance: 0.25, vuln: 0.05, maxStacks: 5, ms: 6000 },
    wither: { name: 'Wither', slow: 0.2, ms: 3000, every: 8000 },
    lifebloom: { name: 'Lifebloom', chance: 0.3, hot: 0.2, ms: 4000 },
    guardianSpirit: { name: 'Guardian Spirit', below: 0.3, heal: 0.25, cd: 15000 },
  },
  finishers: {
    immovable: { name: 'Immovable', cap: [0.3, 0.2] }, // no hit > X of max HP while taunting
    aegisWall: { name: 'Aegis Wall', shield: [0.1, 0.15], every: 10000 }, // party shield, % of the wearer's max HP
    // DESIGN-OPEN: the lock gives the ramp's CAP (+60 % / +80 %) but not its rate — linear to the cap over 60 s.
    onslaught: { name: 'Onslaught', cap: [0.6, 0.8], rampMs: 60000 },
    cullingStrike: { name: 'Culling Strike', mult: 2.0, every: [8000, 6000] },
    wardensChains: { name: "Warden's Chains", slow: 0.35, weaken: 0.35 }, // L1: on Wither / stun targets · L2: all enemies, always
    ruinousMark: { name: 'Ruinous Mark', vuln: [0.2, 0.3] }, // spreads to every enemy
    sanctuary: { name: 'Sanctuary', tick: [0.02, 0.03], every: 2000 },
    // DESIGN-OPEN: the lock gives Lifevein's size and cooldown but not its trigger — fires on an ally below 50 %.
    lifevein: { name: 'Lifevein', heal: 0.9, cd: [15000, 10000], below: 0.5 },
  },
};

export const GEM_CLASSES = ['Tank', 'Healer', 'DPS', 'Controller'];
/** Matching pairs (ClassGems_Live §5). A Resonator matches nothing — it always crosses. */
export const ROLE_MATCH = { Bulwark: 'Tank', Warden: 'Healer', Striker: 'DPS', Adept: 'Controller' };

export const STAT_LABEL = {
  hp: 'HP', mitigation: 'Mitigation', power: 'Power', attackSpeed: 'Attack Speed', critChance: 'Crit Chance', critDamage: 'Crit Damage',
  mana: 'Mana', manaRegen: 'Mana Regen', healingPower: 'Healing Power', tauntStrength: 'Taunt Strength', controlStrength: 'Control Strength',
};
const FLAVOR = new Set(['tauntStrength', 'controlStrength']);

/** July contents, ring by ring: Row 1 → ring 1, Row 2 → ring 2, procs → the two ring-2 specials, Row 4 → ring 3, finishers → compass points. */
export const CONTENTS = {
  Tank: {
    ring1: [['Fortified', 'hp'], ['Ironscale', 'mitigation'], ['Provocation', 'tauntStrength'], ['Tempered', 'hp'], ['Bracing', 'attackSpeed']],
    ring2: [['Stoneblood', 'hp'], ['Deflection', 'mitigation'], ['Retribution', 'power']],
    procs: ['thornward', 'secondSkin'],
    ring3: [['Bulwark', 'hp'], ['Aegis Plating', 'mitigation'], ['Defiance', 'tauntStrength'], ['Resolve', 'critChance']],
    finishers: ['immovable', 'aegisWall'],
  },
  DPS: {
    ring1: [['Sharpen', 'power'], ['Killing Edge', 'critChance'], ['Frenzy', 'attackSpeed'], ['Malice', 'power'], ['Bloodlust', 'critDamage']],
    ring2: [['Savagery', 'power'], ['Precision', 'critChance'], ['Vitality', 'hp']],
    procs: ['emberBrand', 'execution'],
    ring3: [['Ruin', 'power'], ['Bloodthirst', 'critDamage'], ['Overdrive', 'attackSpeed'], ['Rupture', 'critChance']],
    finishers: ['onslaught', 'cullingStrike'],
  },
  Controller: {
    ring1: [['Focus', 'power'], ['Disrupt', 'controlStrength'], ['Quicken', 'attackSpeed'], ['Acuity', 'critChance'], ['Insight', 'mana']],
    ring2: [['Subjugate', 'controlStrength'], ['Clarity', 'manaRegen'], ['Malignance', 'power']],
    procs: ['enfeeble', 'wither'],
    ring3: [['Overpower', 'controlStrength'], ['Penetration', 'power'], ['Cascade', 'critChance'], ['Wellspring', 'hp']],
    finishers: ['wardensChains', 'ruinousMark'],
  },
  Healer: {
    ring1: [['Mend', 'healingPower'], ['Wellspring', 'mana'], ['Grace', 'manaRegen'], ['Vitality', 'hp'], ['Swift Hands', 'attackSpeed']],
    ring2: [['Restoration', 'healingPower'], ['Serenity', 'manaRegen'], ['Warding', 'mitigation']],
    procs: ['lifebloom', 'guardianSpirit'],
    ring3: [['Benediction', 'healingPower'], ['Endurance', 'hp'], ['Radiance', 'power'], ['Communion', 'mana']],
    finishers: ['sanctuary', 'lifevein'],
  },
};

/**
 * Which hexes carry the written facets (shared by every class). Chosen so the lattice stays connected
 * under adjacency: N spine Core → (0,−1) → (0,−2) → (0,−3) → finisher ①; S spine likewise to finisher ②;
 * the two procs touch ring 1 on the east and west; the remaining ring-3 facets hang off ring 2 / a proc.
 */
export const PLACEMENT = {
  ring1: [{ q: 0, r: -1 }, { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 0 }],
  ring2: [{ q: 0, r: -2 }, { q: 0, r: 2 }, { q: 2, r: -2 }],
  procs: PROC_HEXES,
  ring3: [{ q: 0, r: -3 }, { q: 0, r: 3 }, { q: 3, r: -2 }, { q: -3, r: 2 }],
  finishers: [COMPASS.N, COMPASS.S],
};

function buildLattice(gemClass) {
  const c = CONTENTS[gemClass];
  const T = GEM_TUNING;
  const written = new Map();
  const stat = ([name, key]) => ({ name, kind: 'stat', maxLevel: T.statLevels, effect: { stat: key, perLevel: FLAVOR.has(key) ? T.flavorPerLevel : T.statPerLevel } });
  PLACEMENT.ring1.forEach((pos, i) => written.set(hexId(pos), stat(c.ring1[i])));
  PLACEMENT.ring2.forEach((pos, i) => written.set(hexId(pos), stat(c.ring2[i])));
  PLACEMENT.ring3.forEach((pos, i) => written.set(hexId(pos), stat(c.ring3[i])));
  PLACEMENT.procs.forEach((pos, i) => written.set(hexId(pos), { name: T.procs[c.procs[i]].name, kind: 'proc', maxLevel: T.procLevels, effect: { proc: c.procs[i] } }));
  PLACEMENT.finishers.forEach((pos, i) => written.set(hexId(pos), { name: T.finishers[c.finishers[i]].name, kind: 'finisher', maxLevel: T.finisherLevels, effect: { finisher: c.finishers[i] }, exclusiveGroup: 'finisher' }));
  const facets = GEOMETRY.map((g) => {
    const w = written.get(g.id);
    return w
      ? { id: g.id, ring: g.ring, pos: g.pos, neighbors: g.neighbors, slot: g.slot, ...w }
      // DESIGN-OPEN: an unwritten hex — see the LOCK CONFLICT note at the top of this file
      : { id: g.id, ring: g.ring, pos: g.pos, neighbors: g.neighbors, slot: g.slot, name: 'Dormant', kind: 'dormant', maxLevel: 0, effect: {} };
  });
  return { id: `gem-${gemClass.toLowerCase()}`, name: `${gemClass} Gem`, gemClass, core: { id: CORE_ID, ...T.core[gemClass] }, facets };
}

export const CLASS_LATTICES = Object.fromEntries(GEM_CLASSES.map((k) => [k, buildLattice(k)]));
export const latticeFor = (gemClass) => CLASS_LATTICES[gemClass] || null;
export const gemCapacity = (gemClass) => capacity(latticeFor(gemClass));

/** One line of plain words per facet level, for the facet sheet and the live readout. */
export function facetEffectText(facet, level) {
  const T = GEM_TUNING;
  const lv = Math.max(1, level);
  if (facet.kind === 'stat') return `+${Math.round(facet.effect.perLevel * lv * 100)}% ${STAT_LABEL[facet.effect.stat] || facet.effect.stat}`;
  if (facet.kind === 'proc') {
    const p = T.procs[facet.effect.proc];
    const pct = (v) => `${Math.round(v * 100)}%`;
    switch (facet.effect.proc) {
      case 'thornward': return `While holding taunt, reflect ${pct(p.reflect)} of damage taken`;
      case 'secondSkin': return `Below ${pct(p.below)} HP: +${pct(p.mitAdd)} mitigation for ${p.ms / 1000} s (every ${p.cd / 1000} s)`;
      case 'emberBrand': return `${pct(p.chance)} on hit: burn ${pct(p.burnPerSec)} Power/s, stacks ×${p.maxStacks}, ${p.ms / 1000} s`;
      case 'execution': return `Bonus strike at ${pct(p.mult)} on enemies below ${pct(p.below)} HP (every ${p.cd / 1000} s)`;
      case 'enfeeble': return `${pct(p.chance)} on hit: +${pct(p.vuln)} vulnerability, stacks ×${p.maxStacks}, ${p.ms / 1000} s`;
      case 'wither': return `−${pct(p.slow)} enemy attack speed for ${p.ms / 1000} s, every ${p.every / 1000} s`;
      case 'lifebloom': return `${pct(p.chance)} of heals leave a heal-over-time worth ${pct(p.hot)} of the heal over ${p.ms / 1000} s`;
      case 'guardianSpirit': return `Heal the lowest ally ${pct(p.heal)} max HP when below ${pct(p.below)} (every ${p.cd / 1000} s)`;
      default: return p?.name || facet.effect.proc;
    }
  }
  if (facet.kind === 'finisher') {
    const f = T.finishers[facet.effect.finisher];
    const i = Math.min(2, lv) - 1;
    const pct = (v) => `${Math.round(v * 100)}%`;
    switch (facet.effect.finisher) {
      case 'immovable': return `While holding taunt, no single hit exceeds ${pct(f.cap[i])} of max HP`;
      case 'aegisWall': return `Party shield worth ${pct(f.shield[i])} of the wearer's max HP every ${f.every / 1000} s`;
      case 'onslaught': return `Damage climbs through the fight, up to +${pct(f.cap[i])}`;
      case 'cullingStrike': return `A guaranteed crit at ${pct(f.mult)} every ${f.every[i] / 1000} s`;
      case 'wardensChains': return i === 0 ? `−${pct(f.slow)} attack speed and −${pct(f.weaken)} damage on Wither / stun targets` : `−${pct(f.slow)} attack speed and −${pct(f.weaken)} damage on all enemies, always`;
      case 'ruinousMark': return `+${pct(f.vuln[i])} vulnerability, spread to every enemy`;
      case 'sanctuary': return `Party heal-over-time: ${pct(f.tick[i])} max HP every ${f.every / 1000} s`;
      case 'lifevein': return `${pct(f.heal)} instant heal on one ally, every ${f.cd[i] / 1000} s`;
      default: return f?.name || facet.effect.finisher;
    }
  }
  return 'Nothing is written on this facet yet';
}

/** The Core ability in plain words (what a crossing wearer is granted). */
export function coreText(gemClass) {
  const c = GEM_TUNING.core[gemClass];
  switch (gemClass) {
    case 'Tank': return `Taunt + own mitigation +${Math.round(c.mitAdd * 100)}% for ${c.tauntMs / 1000} s · every ${c.cd / 1000} s · ${c.mana} mana`;
    case 'Healer': return `Heal the lowest ally ${c.base} × healing scale · every ${c.cd / 1000} s · ${c.mana} mana`;
    case 'DPS': return `Burst strike at ${Math.round(c.mult * 100)}% hit damage · every ${c.cd / 1000} s · ${c.mana} mana`;
    case 'Controller': return `Stun ${c.stunMs / 1000} s (bosses ${c.bossStunMs / 1000} s, then immune ${c.bossImmuneMs / 1000} s) · every ${c.cd / 1000} s · ${c.mana} mana`;
    default: return '';
  }
}
