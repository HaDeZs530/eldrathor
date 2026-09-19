/**
 * Derived combat values from the nine seeds — docs/Eldrathor_Combat_v2_Lock.md §2, with equipment
 * applied per docs/Eldrathor_Progression_Loop_Lock.md §4 and the §5 crit correction (M1b).
 * Seeds come from ARCHETYPE_SEEDS (10 base / 15 specialty). Gem multipliers `g` come from the worn class
 * gem's lattice (Growth Model §1: a stat facet is +4 % OF THAT STAT per level) — 0 with no gem. Level L is 1+.
 *
 * Equipment is the six-slot map of docs/Eldrathor_Item_Model_Lock.md §6, resolved by `equip()`:
 * `adventurer.weaponItem` sets the weapon type and scales hit damage by tier × rarity × rating ×
 * empower, and `adventurer.armorItems` (body / head / hands / feet) add HP and mitigation, with head,
 * hands and feet worth half the body values. Without a weapon the archetype's default type applies at
 * ×0.8 — being unarmed hurts.
 */
import { ARCHETYPE_SEEDS, WEAPONS } from '../data.js';
import { critMult, MITIGATION_CAP } from '../progression/progression.js';
import { weaponDamageMult, armorTotals, ARMOR_SLOTS, UNARMED_MULT } from '../progression/items.js';
import { gemStatMods } from '../progression/gems.js';

const NO_GEMS = Object.freeze({
  hp: 0, mana: 0, manaRegen: 0, power: 0, mitigation: 0, attackSpeed: 0, critChance: 0, critDamage: 0, healingPower: 0,
});

/** The nine-stat gem multipliers: an explicit `gems` map wins (tests), else the worn gem's lattice. Flavor stats are not among the nine. */
function gemMods(adventurer) {
  const src = adventurer.gems || gemStatMods(adventurer.gemItem) || {};
  const g = { ...NO_GEMS };
  for (const k of Object.keys(NO_GEMS)) if (src[k]) g[k] = src[k];
  return g;
}

/**
 * The Veinbinder's Bond upgrades (Growth Model §2) — party-wide, so every Adventurer carries them as
 * `adventurer.bond = { mult, add }`: relative bonuses on the nine-stat keys, and percentage POINTS for
 * mitigation / crit chance. Absent → no effect.
 */
function bondOf(adventurer) {
  const m = adventurer.bond?.mult || {}; const a = adventurer.bond?.add || {};
  return { hp: m.hp || 0, power: m.power || 0, attackSpeed: m.attackSpeed || 0, healingPower: m.healingPower || 0, manaRegen: m.manaRegen || 0, mitigation: a.mitigation || 0, critChance: a.critChance || 0 };
}

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
  const g = gemMods(adventurer);
  const b = bondOf(adventurer);
  const wi = adventurer.weaponItem || null;
  const weaponType = wi?.type || adventurer.weapon || 'Sword + Shield';
  const w = WEAPONS[weaponType] || WEAPONS['Sword + Shield'];
  const L = Math.max(1, adventurer.level || 1);
  const lvl = 1 + 0.05 * (L - 1);
  const wm = wi ? weaponDamageMult(wi) : UNARMED_MULT; // unarmed: ×0.8
  const ar = armorTotals(adventurer.armorItems || []);

  return {
    level: L,
    seeds: s,
    weapon: w,
    weaponType,
    weaponMult: wm,
    armor: ar,
    maxHp: s.hp * 20 * (1 + g.hp) * (1 + b.hp) * lvl + ar.hp,
    maxMana: s.mana * 10 * (1 + g.mana),
    manaRegen: s.manaRegen * 0.5 * (1 + g.manaRegen) * (1 + b.manaRegen), // per second
    hitDamage: w.dmg * (s.power / 10) * (1 + g.power) * (1 + b.power) * lvl * wm,
    swingInterval: w.tempo / ((s.attackSpeed / 10) * (1 + g.attackSpeed) * (1 + b.attackSpeed)), // seconds
    critChance: s.critChance * 0.01 * (1 + g.critChance) + b.critChance,
    critMult: critMult(s.critDamage, g.critDamage), // Progression lock §5: gem crit damage is ADDITIVE — a +4 % Crit Damage facet level adds +0.04× to the multiplier
    mitigation: Math.min(MITIGATION_CAP, (s.mitigation * 0.02 + w.mit) * (1 + g.mitigation) + ar.mit + b.mitigation),
    healScale: (s.healingPower / 10) * (1 + g.healingPower) * (1 + b.healingPower),
  };
}

/**
 * Test-numbers mode (item-numbers brief §5): every derived stat with its sources — seed, level, gear.
 * Each entry is `{ k, v, parts }` where `parts` is an ordered list of `[label, value]` factors / terms
 * whose product / sum is `v` (asserted by derive.test.js).
 */
export function deriveBreakdown(adventurer) {
  const d = deriveStats(adventurer);
  const s = d.seeds; const g = gemMods(adventurer); const b = bondOf(adventurer);
  const lvl = 1 + 0.05 * (d.level - 1);
  const w = d.weapon;
  const x = (label, v) => [label, v];
  return [
    { k: 'Max HP', v: d.maxHp, op: 'sum', parts: [x(`seed ${s.hp} × 20`, s.hp * 20), x('gem', s.hp * 20 * g.hp), x('bond (Vitality)', s.hp * 20 * (1 + g.hp) * b.hp), x(`level ×${lvl.toFixed(2)}`, s.hp * 20 * (1 + g.hp) * (1 + b.hp) * (lvl - 1)), x('gear (armor)', d.armor.hp)] },
    { k: 'Hit', v: d.hitDamage, op: 'product', parts: [x(`weapon ${d.weaponType} ${w.dmg}`, w.dmg), x(`power seed ${s.power}/10`, s.power / 10), x('gem', 1 + g.power), x('bond (Might)', 1 + b.power), x(`level ×${lvl.toFixed(2)}`, lvl), x('gear (weapon item)', d.weaponMult)] },
    { k: 'Swing', v: d.swingInterval, op: 'product', parts: [x(`tempo ${w.tempo}s`, w.tempo), x(`÷ speed seed ${s.attackSpeed}/10`, 1 / (s.attackSpeed / 10)), x('÷ gem', 1 / (1 + g.attackSpeed)), x('÷ bond (Tempo)', 1 / (1 + b.attackSpeed))] },
    { k: 'Crit chance', v: d.critChance, op: 'sum', parts: [x(`seed ${s.critChance} × 1% × gems`, s.critChance * 0.01 * (1 + g.critChance)), x('bond (Keen)', b.critChance)] },
    { k: 'Crit mult', v: d.critMult, op: 'sum', parts: [x('base 1.5', 1.5), x(`seed (${s.critDamage} − 10) × 0.05`, (s.critDamage - 10) * 0.05), x('gem', g.critDamage)] },
    { k: 'Mitigation', v: d.mitigation, op: 'sum', parts: [x(`seed ${s.mitigation} × 2%`, s.mitigation * 0.02 * (1 + g.mitigation)), x(`weapon ${d.weaponType}`, w.mit * (1 + g.mitigation)), x('gear (armor)', d.armor.mit), x('bond (Ward)', b.mitigation)], cap: MITIGATION_CAP },
    { k: 'Max mana', v: d.maxMana, op: 'product', parts: [x(`seed ${s.mana} × 10`, s.mana * 10), x('gems', 1 + g.mana)] },
    { k: 'Mana regen', v: d.manaRegen, op: 'product', parts: [x(`seed ${s.manaRegen} × 0.5`, s.manaRegen * 0.5), x('gems', 1 + g.manaRegen), x('bond (Flow)', 1 + b.manaRegen)] },
    { k: 'Heal scale', v: d.healScale, op: 'product', parts: [x(`seed ${s.healingPower}/10`, s.healingPower / 10), x('gems', 1 + g.healingPower), x('bond (Grace)', 1 + b.healingPower)] },
  ];
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

/**
 * Attach the equipped items (by id, from the one bag) to an Adventurer so deriveStats / the simulator
 * see them. `member.equipped` is the six-slot map `{weapon, body, head, hands, feet, gem}` (§6).
 * `bond` is the Veinbinder's party-wide Bond upgrades (`bondMods(upgrades)`), carried by every Adventurer.
 */
export function equip(member, bag = [], bond = null) {
  const eq = member.equipped || {};
  const byId = (id) => (id ? bag.find((i) => i.id === id) || null : null);
  const armorItems = ARMOR_SLOTS.map((slot) => byId(eq[slot])).filter(Boolean);
  return { ...member, weaponItem: byId(eq.weapon), armorItems, gemItem: byId(eq.gem), ...(bond ? { bond } : {}) };
}
