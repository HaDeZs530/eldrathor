// DESIGN-OPEN: legacy prototype numbers (hp/atk/def); replaced by ARCHETYPE_SEEDS in combat v2.
export const ARCHETYPES = {
  Bulwark: { role: 'Tank', hp: 220, atk: 10, def: 14, color: '#6fb7d6', blurb: 'Draws focus, endures.' },
  Warden: { role: 'Healer', hp: 150, atk: 9, def: 8, color: '#7fd6a0', blurb: 'Mends the party.' },
  Striker: { role: 'Damage', hp: 130, atk: 22, def: 6, color: '#e0a04d', blurb: 'Ramps damage in a fight.' },
  Adept: { role: 'Control', hp: 140, atk: 14, def: 7, color: '#b58fe0', blurb: 'Locks and sunders foes.' },
  Resonator: { role: 'Support', hp: 145, atk: 12, def: 8, color: '#d6c86f', blurb: 'Empowers the party & harvest.' },
};

export const WEAPONS = {
  'Dual Daggers': { tempo: 0.55, dmg: 0.85, mit: 0.02, group: 'Melee DPS' },
  'Dual Swords': { tempo: 0.8, dmg: 1.0, mit: 0.05, group: 'Melee DPS' },
  Greatsword: { tempo: 1.5, dmg: 1.7, mit: 0.1, group: 'Tank' },
  'Sword + Shield': { tempo: 1.0, dmg: 0.7, mit: 0.22, group: 'Tank' },
  Bow: { tempo: 0.7, dmg: 0.95, mit: 0.02, group: 'Ranged' },
  Crossbow: { tempo: 1.3, dmg: 1.5, mit: 0.03, group: 'Ranged' },
  Staff: { tempo: 0.9, dmg: 1.1, mit: 0.04, group: 'Caster' },
  'Orb + Tome': { tempo: 1.4, dmg: 1.6, mit: 0.05, group: 'Caster' },
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
