/** Archetype identity only — combat numbers come from ARCHETYPE_SEEDS via combat/derive.js. */
export const ARCHETYPES = {
  Bulwark: { role: 'Tank', color: '#6fb7d6', blurb: 'Draws focus, endures.' },
  Warden: { role: 'Healer', color: '#7fd6a0', blurb: 'Mends the party.' },
  Striker: { role: 'Damage', color: '#e0a04d', blurb: 'Ramps damage in a fight.' },
  Adept: { role: 'Control', color: '#b58fe0', blurb: 'Locks and sunders foes.' },
  Resonator: { role: 'Support', color: '#d6c86f', blurb: 'Empowers the party & harvest.' },
};

/** Weapon table — docs/Eldrathor_Combat_v2_Lock.md §2: dmg per hit, tempo = seconds per swing, mit. */
export const WEAPONS = {
  Greatsword: { dmg: 22, tempo: 1.6, mit: 0.1, group: 'Tank' },
  'Sword + Shield': { dmg: 12, tempo: 1.2, mit: 0.25, group: 'Tank' },
  'Dual Daggers': { dmg: 7, tempo: 0.8, mit: 0.02, group: 'Melee DPS' },
  'Dual Swords': { dmg: 11, tempo: 1.0, mit: 0.04, group: 'Melee DPS' },
  Bow: { dmg: 10, tempo: 0.9, mit: 0.03, group: 'Ranged' },
  Crossbow: { dmg: 20, tempo: 1.5, mit: 0.03, group: 'Ranged' },
  Staff: { dmg: 12, tempo: 1.1, mit: 0.05, group: 'Caster' },
  'Orb + Tome': { dmg: 19, tempo: 1.4, mit: 0.05, group: 'Caster' },
};

export const WORLDS = [
  { id: 1, name: 'Shoreline Forest', shortName: 'Shoreline Forest', clock: '7–10', tier: 1, boss: 'The Gorewood Stag', accent: '#8fae6b' },
  { id: 2, name: 'Overrun Peninsula Town', shortName: 'Peninsula Town', clock: '9–12', tier: 2, boss: 'The Hollow Bellringer', accent: '#b8a05a' },
  { id: 3, name: 'The Ravine Path', shortName: 'Ravine Path', clock: '11–2', tier: 3, boss: 'The Bridgewright', accent: '#6f8fb7' },
  { id: 4, name: 'The Magical Forge', shortName: 'The Forge', clock: 'top', tier: 4, boss: 'Forge Warden (Wing)', accent: '#d67d4d', court: true },
  { id: 5, name: 'The Upper Castle', shortName: 'Upper Castle', clock: 'top', tier: 5, boss: 'The Bound Court', accent: '#9d6fd6', court: true },
  // Summit node — Vaelyx (fits 5–7 island map nodes). DESIGN-OPEN: full Vaelyx encounter design.
  { id: 6, name: 'Vaelyx', shortName: 'Vaelyx', clock: 'summit', tier: 6, boss: 'Vaelyx the Eternal', accent: '#e0687a', summit: true },
];

/** The nine base stats every system uses — docs/Eldrathor_BaseStats_Lock.md (LOCKED July 2026). */
export const STATS = ['hp', 'mana', 'manaRegen', 'power', 'mitigation', 'attackSpeed', 'critChance', 'critDamage', 'healingPower'];

export const STAT_LABELS = {
  hp: 'HP',
  mana: 'Mana', // DESIGN-OPEN: placeholder name ("Mythros" candidate)
  manaRegen: 'Mana Regen',
  power: 'Power',
  mitigation: 'Worldvein Mitigation',
  attackSpeed: 'Attack Speed',
  critChance: 'Crit Chance',
  critDamage: 'Crit Damage',
  healingPower: 'Healing Power',
};

/**
 * Archetype base seeds — docs/Eldrathor_Archetype_Seeds_DRAFT.md (approved for build 2026-09-11).
 * 10 on every stat, 15 on each archetype's two specialty stats. Flat numbers; never change —
 * growth comes from levels, gear, and gems (class gems multiply these by %).
 * Resonator is all 10s on purpose (its value is the Attune Vein group innate).
 */
export const ARCHETYPE_SEEDS = {
  Bulwark:   { hp: 15, mana: 10, manaRegen: 10, power: 10, mitigation: 15, attackSpeed: 10, critChance: 10, critDamage: 10, healingPower: 10 },
  Warden:    { hp: 10, mana: 10, manaRegen: 15, power: 10, mitigation: 10, attackSpeed: 10, critChance: 10, critDamage: 10, healingPower: 15 },
  Striker:   { hp: 10, mana: 10, manaRegen: 10, power: 15, mitigation: 10, attackSpeed: 15, critChance: 10, critDamage: 10, healingPower: 10 },
  Adept:     { hp: 10, mana: 15, manaRegen: 10, power: 10, mitigation: 10, attackSpeed: 10, critChance: 15, critDamage: 10, healingPower: 10 },
  Resonator: { hp: 10, mana: 10, manaRegen: 10, power: 10, mitigation: 10, attackSpeed: 10, critChance: 10, critDamage: 10, healingPower: 10 },
};

export const DEFAULT_PARTY = [
  { name: 'Kessa', archetype: 'Bulwark', weapon: 'Sword + Shield', level: 3 },
  { name: 'Orin', archetype: 'Warden', weapon: 'Staff', level: 3 },
  { name: 'Vayle', archetype: 'Striker', weapon: 'Dual Daggers', level: 3 },
];

export const TIER_COLOR = {
  Common: '#9fb2bd', Fine: '#7fd6a0', Rare: '#6fb7d6', Epic: '#b58fe0', Legendary: '#e0a04d',
};

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
