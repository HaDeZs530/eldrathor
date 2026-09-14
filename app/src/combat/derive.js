/**
 * Derived combat values from the nine seeds — docs/Eldrathor_Combat_v2_Lock.md §2, with equipment
 * applied per docs/Eldrathor_Progression_Loop_Lock.md §4 and the §5 crit correction (M1b).
 * Seeds come from ARCHETYPE_SEEDS (10 base / 15 specialty). Gem multipliers `g` are 0 until the gem
 * tree ships. Level L is 1+. Equipment: `adventurer.weaponItem` (a stash weapon: weaponType,
 * baseRating, empower) sets the weapon type and scales hit damage; `adventurer.armorItem` (tier,
 * rating) adds HP and mitigation. Without a weapon item the archetype's default type applies at
 * rating 0 / empower 0 (×0.8) — being unarmed hurts.
 */
import { ARCHETYPE_SEEDS, WEAPONS } from '../data.js';
import { weaponDamageMult, armorBonus, critMult, MITIGATION_CAP } from '../progression/progression.js';

const NO_GEMS = Object.freeze({
  hp: 0, mana: 0, manaRegen: 0, power: 0, mitigation: 0, attackSpeed: 0, critChance: 0, critDamage: 0, healingPower: 0,
});

const FALLBACK_SEEDS = Object.freeze({
  hp: 10, mana: 10, manaRegen: 10, power: 10, mitigation: 10, attackSpeed: 10, critChance: 10, critDamage: 10, healingPower: 10,
});

/**
 * @param {{archetype:string, weapon?:string, weaponItem?:object, armorItem?:object, level?:number, gems?:object}} adventurer
 * @returns {{maxHp:number,maxMana:number,manaRegen:number,hitDamage:number,swingInterval:number,
 *   critChance:number,critMult:number,mitigation:number,healScale:number,weapon:object,weaponType:string,seeds:object,level:number,
 *   weaponMult:number,armor:{hp:number,mit:number}}}
 */
export function deriveStats(adventurer) {
  const s = ARCHETYPE_SEEDS[adventurer.archetype] || FALLBACK_SEEDS;
  const g = { ...NO_GEMS, ...(adventurer.gems || {}) };
  const wi = adventurer.weaponItem || null;
  const weaponType = wi?.weaponType || adventurer.weapon || 'Sword + Shield';
  const w = WEAPONS[weaponType] || WEAPONS['Sword + Shield'];
  const L = Math.max(1, adventurer.level || 1);
  const lvl = 1 + 0.05 * (L - 1);
  const wm = weaponDamageMult(wi || { baseRating: 0, empower: 0 });
  const ar = armorBonus(adventurer.armorItem || null);

  return {
    level: L,
    seeds: s,
    weapon: w,
    weaponType,
    weaponMult: wm,
    armor: ar,
    maxHp: s.hp * 20 * (1 + g.hp) * lvl + ar.hp,
    maxMana: s.mana * 10 * (1 + g.mana),
    manaRegen: s.manaRegen * 0.5 * (1 + g.manaRegen), // per second
    hitDamage: w.dmg * (s.power / 10) * (1 + g.power) * lvl * wm,
    swingInterval: w.tempo / ((s.attackSpeed / 10) * (1 + g.attackSpeed)), // seconds
    critChance: s.critChance * 0.01 * (1 + g.critChance),
    critMult: critMult(s.critDamage, g.critDamage),
    mitigation: Math.min(MITIGATION_CAP, (s.mitigation * 0.02 + w.mit) * (1 + g.mitigation) + ar.mit),
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
    weaponType: d.weaponType,
    weaponMult: +d.weaponMult.toFixed(2),
    armorHp: Math.round(d.armor.hp),
    armorMit: Math.round(d.armor.mit * 100),
  };
}

/** Attach the equipped items (by id) to an Adventurer so deriveStats / the simulator see them. */
export function equip(member, stash = [], armor = []) {
  const weaponItem = member.weaponId ? stash.find((w) => w.id === member.weaponId) || null : null;
  const armorItem = member.armorId ? armor.find((a) => a.id === member.armorId) || null : null;
  return { ...member, weaponItem, armorItem };
}
