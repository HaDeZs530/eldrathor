/**
 * Enemy stat blocks — docs/Eldrathor_Combat_v2_Lock.md §4, boss multipliers retuned under
 * docs/Eldrathor_Progression_Loop_Lock.md §8 (M1b): boss ×22 hp / ×20 dmg (was ×18 / ×2.2) so a
 * fresh party hits the gear wall and a level-5 Fine-geared party breaks through — see balance.test.js.
 * Base trash unit by world tier T (1–9): hp 60×1.6^(T−1), dmg 9×1.45^(T−1), interval 1.4 s,
 * mit 0.05+0.03T. Enemies have no abilities in v2 (boss enrage tick only).
 * Enemy roster identities are a separate lock (design doc §9 item 2).
 */

// DESIGN-OPEN: enemy names — placeholder labels until the roster lock lands.
const TRASH_NAMES = ['Manifestation', 'Vein Husk', 'Shore Drake', 'Hollow Warden', 'Splinter Wraith'];
const RARE_NAME = 'Rare Manifestation';
// DESIGN-OPEN: named-variant adjectives — `<Adjective> <Enemy>` until the area roster lock lands.
const NAMED_ADJECTIVES = ['Grim', 'Hollow', 'Ashen', 'Vein-Scarred', 'Bright-Eyed', 'Old'];

/**
 * Tuning knobs — Progression Loop Lock §8 (M1b): these numbers are set by the balance gates in
 * balance.test.js (fresh party loses the area-1 boss ≥ 8/10 and wins area-1 trash ≥ 9/10; a level-5
 * Fine-geared party beats the boss ≥ 8/10). Change them only with the gates green.
 */
export const ENEMY_TUNING = {
  baseHp: 60, hpGrowth: 1.6, baseDmg: 9, dmgGrowth: 1.45, interval: 1.4, mitBase: 0.05, mitPerTier: 0.03,
  boss: { hp: 22, dmg: 20, interval: 1.6, mitAdd: 0.1 },
  rare: { hp: 6, dmg: 1.6, interval: 1.2 },
  crystalHp: 1.2,
};

function baseUnit(T) {
  const k = ENEMY_TUNING;
  return {
    hp: k.baseHp * Math.pow(k.hpGrowth, T - 1),
    dmg: k.baseDmg * Math.pow(k.dmgGrowth, T - 1),
    interval: k.interval,
    mit: k.mitBase + k.mitPerTier * T,
  };
}

/** Apply the depth multiplier (fight/crystal units only) and the named variant (×1.3, prefixed name). */
function finish(units, { depthMult, named, rng }) {
  return units.map((u) => {
    let { hp, dmg, name } = u;
    if (!u.isBoss && !u.isRare && depthMult !== 1) { hp *= depthMult; dmg *= depthMult; }
    if (named) { hp *= 1.3; dmg *= 1.3; name = `${NAMED_ADJECTIVES[Math.floor(rng() * NAMED_ADJECTIVES.length)]} ${name}`; }
    return { ...u, hp, maxHp: hp, dmg, name, named };
  });
}

function weightedPick(rng, entries) {
  const total = entries.reduce((n, [, w]) => n + w, 0);
  let r = rng() * total;
  for (const [v, w] of entries) {
    r -= w;
    if (r <= 0) return v;
  }
  return entries[entries.length - 1][0];
}

/**
 * @param {number} worldTier area tier 1–9
 * @param {'normal'|'crystal'|'rare'|'boss'} nodeType
 * @param {boolean} rareFlag named/rare variant (×1.3 on top of rare)
 * @param {{rng?:()=>number, bossName?:string, depthMult?:number, named?:boolean}} [opts]
 *   depthMult — route-map depth multiplier (1 + 0.5×depth) applied to fight/crystal units only;
 *   named — named variant: ×1.3 hp and dmg, `<Adjective> <Enemy>` name.
 * @returns {Array<{id:string,name:string,hp:number,maxHp:number,dmg:number,interval:number,mit:number,isBoss:boolean,isRare:boolean}>}
 */
export function spawnEnemies(worldTier, nodeType, rareFlag = false, opts = {}) {
  const rng = opts.rng || Math.random;
  const T = Math.max(1, Math.min(9, worldTier || 1));
  const b = baseUnit(T);
  const depthMult = opts.depthMult || 1;
  const named = !!opts.named;
  const units = [];
  const mk = (name, hp, dmg, interval, mit, extra = {}) => ({
    id: `e${units.length}`,
    name,
    hp,
    maxHp: hp,
    dmg,
    interval,
    mit,
    isBoss: false,
    isRare: false,
    ...extra,
  });

  if (nodeType === 'boss') {
    // ENEMY_TUNING.boss (M1b §8): hp/dmg multipliers, interval 1.6 s, mit +0.1; enrage tick every 15 s handled by the simulator.
    const k = ENEMY_TUNING.boss;
    units.push(mk(opts.bossName || 'Boss', b.hp * k.hp, b.dmg * k.dmg, k.interval, b.mit + k.mitAdd, { isBoss: true }));
    return finish(units, { depthMult, named, rng });
  }
  if (nodeType === 'rare') {
    let hp = b.hp * ENEMY_TUNING.rare.hp;
    let dmg = b.dmg * ENEMY_TUNING.rare.dmg;
    if (rareFlag) {
      // DESIGN-OPEN: "×1.3 on top" applied to both hp and dmg for the named variant.
      hp *= 1.3;
      dmg *= 1.3;
    }
    units.push(mk(rareFlag ? `Named ${RARE_NAME}` : RARE_NAME, hp, dmg, ENEMY_TUNING.rare.interval, b.mit, { isRare: true, named: !!rareFlag }));
    return finish(units, { depthMult, named, rng });
  }
  if (nodeType === 'crystal') {
    // 2–3 units at ×1.2 hp. DESIGN-OPEN: 2-vs-3 split not given — 50/50 used.
    const n = weightedPick(rng, [[2, 50], [3, 50]]);
    for (let i = 0; i < n; i++) {
      units.push(mk(TRASH_NAMES[Math.floor(rng() * TRASH_NAMES.length)], b.hp * ENEMY_TUNING.crystalHp, b.dmg, b.interval, b.mit));
    }
    return finish(units, { depthMult, named, rng });
  }
  // normal: 1–3 units, weights 30/50/20
  const n = weightedPick(rng, [[1, 30], [2, 50], [3, 20]]);
  for (let i = 0; i < n; i++) {
    units.push(mk(TRASH_NAMES[Math.floor(rng() * TRASH_NAMES.length)], b.hp, b.dmg, b.interval, b.mit));
  }
  return finish(units, { depthMult, named, rng }); // bug-fix pass 1 §1: depth + named modifiers apply to normal units too
}
