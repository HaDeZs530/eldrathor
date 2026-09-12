/**
 * Derived combat values from the nine seeds — docs/Eldrathor_Combat_v2_Lock.md §2.
 * Seeds come from ARCHETYPE_SEEDS (10 base / 15 specialty). Gem multipliers `g` are 0
 * until the gem tree ships. Level L is 1+. Weapon w = { dmg, tempo, mit } from WEAPONS.
 */
import { ARCHETYPE_SEEDS, WEAPONS } from '../data.js';

const NO_GEMS = Object.freeze({
  hp: 0, mana: 0, manaRegen: 0, power: 0, mitigation: 0, attackSpeed: 0, critChance: 0, critDamage: 0, healingPower: 0,
});

const FALLBACK_SEEDS = Object.freeze({
  hp: 10, mana: 10, manaRegen: 10, power: 10, mitigation: 10, attackSpeed: 10, critChance: 10, critDamage: 10, healingPower: 10,
});

/**
 * @param {{archetype:string, weapon:string, level?:number, gems?:object}} adventurer
 * @returns {{maxHp:number,maxMana:number,manaRegen:number,hitDamage:number,swingInterval:number,
 *   critChance:number,critMult:number,mitigation:number,healScale:number,weapon:object,seeds:object,level:number}}
 */
export function deriveStats(adventurer) {
  const s = ARCHETYPE_SEEDS[adventurer.archetype] || FALLBACK_SEEDS;
  const g = { ...NO_GEMS, ...(adventurer.gems || {}) };
  const w = WEAPONS[adventurer.weapon] || WEAPONS['Sword + Shield'];
  const L = Math.max(1, adventurer.level || 1);
  const lvl = 1 + 0.05 * (L - 1);

  return {
    level: L,
    seeds: s,
    weapon: w,
    maxHp: s.hp * 20 * (1 + g.hp) * lvl,
    maxMana: s.mana * 10 * (1 + g.mana),
    manaRegen: s.manaRegen * 0.5 * (1 + g.manaRegen), // per second
    hitDamage: w.dmg * (s.power / 10) * (1 + g.power) * lvl,
    swingInterval: w.tempo / ((s.attackSpeed / 10) * (1 + g.attackSpeed)), // seconds
    critChance: s.critChance * 0.01 * (1 + g.critChance),
    critMult: 1.5 + (s.critDamage - 10) * 0.05 * (1 + g.critDamage),
    mitigation: Math.min(0.6, (s.mitigation * 0.02 + w.mit) * (1 + g.mitigation)),
    healScale: (s.healingPower / 10) * (1 + g.healingPower),
  };
}

/** Rounded, display-friendly copy for stat sheets. */
export function deriveDisplay(adventurer) {
  const d = deriveStats(adventurer);
  return {
    maxHp: Math.round(d.maxHp),
    maxMana: Math.round(d.maxMana),
    manaRegen: +d.manaRegen.toFixed(1),
    hitDamage: Math.round(d.hitDamage),
    swingInterval: +d.swingInterval.toFixed(2),
    critChance: Math.round(d.critChance * 100),
    critMult: +d.critMult.toFixed(2),
    mitigation: Math.round(d.mitigation * 100),
    healScale: +d.healScale.toFixed(2),
    dps: +((d.hitDamage / d.swingInterval) * (1 + d.critChance * (d.critMult - 1))).toFixed(1),
  };
}
