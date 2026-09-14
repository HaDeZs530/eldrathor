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

/**
 * The nine areas — docs/Eldrathor_Island_Areas_Lock.md (LOCKED 2026-09-12; supersedes design doc §5b).
 * Climbed in pin order (pin 1 = Veinharbor; pins 2–10 = areas 1–9). One area boss each; clearing it
 * permanently unlocks the next pin. `boss` of area 9 is the King; Vaelyx waits above him.
 */
export const AREAS = [
  { id: 1, pin: 2, name: 'Gullwatch Trail', shortName: 'Gullwatch Trail', tier: 1, character: 'Shoreline forest, road out of the harbor', boss: 'The Brinewarden', bossBlurb: 'a hulking Mythros-swollen shore bear', court: false, accent: '#8fae6b',
    lore: 'The road out of Veinharbor runs under the gulls and into the shore forest, where the Vein first touches the land. The trees here grow wrong — too tall, too bright — and the things that den beneath them have learned the road. Every Veinbinder\u2019s first climb begins on this trail.' },
  { id: 2, pin: 3, name: 'The Saltcliffs', shortName: 'Saltcliffs', tier: 2, character: 'Wind-cut sea cliffs, nesting grounds', boss: 'Skarra of the Ledge', bossBlurb: 'matriarch cliff-drake', court: false, accent: '#7fb7c9',
    lore: 'West of the harbor the island stands up out of the sea in wind-cut ledges. Drakes nest in the cliff faces, fattened on crystal-light, and the path threads between their roosts. Look down and you\u2019ll see the harbor small below you.' },
  { id: 3, pin: 4, name: 'Drowned Quay', shortName: 'Drowned Quay', tier: 3, character: 'The colony\u2019s fallen seaside town, half in the water', boss: 'The Harbormaster', bossBlurb: 'a warded lighthouse spirit gone wrong', court: false, accent: '#6f8fb7',
    lore: 'This was the colony\u2019s second town, before the Fracture. The sea has taken half of it; the wards took the rest. Lights still burn in the old lighthouse, and nobody in Veinharbor will say what tends them.' },
  { id: 4, pin: 5, name: 'Serpent\u2019s Stair', shortName: 'Serpent\u2019s Stair', tier: 4, character: 'Rope bridges and switchbacks over the ravine', boss: 'The Marshal', bossBlurb: 'court — captain of the fallen guard', court: true, accent: '#b8a05a',
    lore: 'The ravine cuts the mountain in two and the old bridges cross it in switchbacks, rope and plank over a long fall. The Marshal held this pass on the third day of the battle. He holds it still.' },
  { id: 5, pin: 6, name: 'Ashfall Strand', shortName: 'Ashfall Strand', tier: 5, character: 'Black sand, cinder rain from the forge vents above', boss: 'The Seer', bossBlurb: 'court — the king\u2019s oracle', court: true, accent: '#c46a4a',
    lore: 'On the east coast the beach is black and cinders fall like snow from the forge vents overhead. The Seer walked here to read the Vein. What she read, she never told the king in time.' },
  { id: 6, pin: 7, name: 'The Hollow Ward', shortName: 'Hollow Ward', tier: 6, character: 'The artisan city, warded streets now dark', boss: 'The Chamberlain', bossBlurb: 'court — keeper of the wards', court: true, accent: '#9d6fd6',
    lore: 'The artisan city climbed the mountain in tiers of warded stone. The wards are dark now, and the streets belong to whatever the Vein makes of the things that died in them. The Chamberlain still walks his rounds.' },
  { id: 7, pin: 8, name: 'The Temple Forge', shortName: 'Temple Forge', tier: 7, character: 'The People of the Vein\u2019s master forge', boss: 'The Warden-Smith', bossBlurb: 'court — who forged the arsenal', court: true, accent: '#d67d4d',
    lore: 'Here the People of the Vein drew fire from the mountain and made the weapons that once armed the world. The forge still burns; the Warden-Smith still works it. What he makes now, he makes for Vaelyx.' },
  { id: 8, pin: 9, name: 'The Bastion', shortName: 'The Bastion', tier: 8, character: 'Castle walls and the outer court', boss: 'The Queen', bossBlurb: 'court', court: true, accent: '#b58fe0',
    lore: 'The outer walls of the summit castle, where the court made its last stand. The Queen commanded the walls while the King held the crystal. Vaelyx set her here to keep them for him.' },
  { id: 9, pin: 10, name: 'The Worldforge', shortName: 'Worldforge', tier: 9, character: 'Throne hall above the master crystal', boss: 'The King', bossBlurb: 'court gatekeeper — Vaelyx the Eternal waits above', court: true, summit: true, accent: '#5fc7e0',
    // DESIGN-OPEN: Vaelyx the Eternal as the recurring summit encounter after the King.
    lore: 'The throne hall sits above the master crystal, and the crystal\u2019s light comes up through the floor. The King waits before the throne. Above him, on the broken roof, the dragon sleeps with one eye open.' },
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

// M1b: a new game IS the lock's "fresh party" (§8) — level 1, Common starter weapons (equipped at boot), no armor.
export const DEFAULT_PARTY = [
  { id: 'c-kessa', name: 'Kessa', archetype: 'Bulwark', weapon: 'Sword + Shield', level: 1, xp: 0 },
  { id: 'c-orin', name: 'Orin', archetype: 'Warden', weapon: 'Staff', level: 1, xp: 0 },
  { id: 'c-vayle', name: 'Vayle', archetype: 'Striker', weapon: 'Dual Daggers', level: 1, xp: 0 },
];

/** Stable character id (bug-fix pass 1 §7/§8: run HP and AFK jobs are keyed by id, never by position). */
/** Permanent id for any entity (Progression Loop Lock §1): `c-` Adventurer, `w-` weapon, `a-` armor. */
export const newId = (prefix = 'i') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const newCharId = () => newId('c');
export const withIds = (list) => list.map((m) => (m.id ? m : { ...m, id: newCharId() }));

export const TIER_COLOR = {
  Common: '#9fb2bd', Fine: '#7fd6a0', Rare: '#6fb7d6', Epic: '#b58fe0', Legendary: '#e0a04d',
};

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
