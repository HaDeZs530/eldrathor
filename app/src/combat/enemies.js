/**
 * Enemy stat blocks — docs/Eldrathor_Combat_v2_Lock.md §4.
 * Base trash unit by world tier T (1–6): hp 60×1.6^(T−1), dmg 9×1.45^(T−1), interval 1.4 s,
 * mit 0.05+0.03T. Enemies have no abilities in v2 (boss enrage tick only).
 * Enemy roster identities are a separate lock (design doc §9 item 2).
 */

// DESIGN-OPEN: enemy names — placeholder labels until the roster lock lands.
const TRASH_NAMES = ['Manifestation', 'Vein Husk', 'Shore Drake', 'Hollow Warden', 'Splinter Wraith'];
const RARE_NAME = 'Rare Manifestation';

function baseUnit(T) {
  return {
    hp: 60 * Math.pow(1.6, T - 1),
    dmg: 9 * Math.pow(1.45, T - 1),
    interval: 1.4,
    mit: 0.05 + 0.03 * T,
  };
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
 * @param {number} worldTier 1–6
 * @param {'normal'|'crystal'|'rare'|'boss'} nodeType
 * @param {boolean} rareFlag named/rare variant (×1.3 on top of rare)
 * @param {{rng?:()=>number, bossName?:string}} [opts]
 * @returns {Array<{id:string,name:string,hp:number,maxHp:number,dmg:number,interval:number,mit:number,isBoss:boolean,isRare:boolean}>}
 */
export function spawnEnemies(worldTier, nodeType, rareFlag = false, opts = {}) {
  const rng = opts.rng || Math.random;
  const T = Math.max(1, Math.min(6, worldTier || 1));
  const b = baseUnit(T);
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
    // ×18 hp, ×2.2 dmg, interval 1.6 s, mit +0.1; enrage tick every 15 s handled by the simulator.
    units.push(mk(opts.bossName || 'Boss', b.hp * 18, b.dmg * 2.2, 1.6, b.mit + 0.1, { isBoss: true }));
    return units;
  }
  if (nodeType === 'rare') {
    let hp = b.hp * 6;
    let dmg = b.dmg * 1.6;
    if (rareFlag) {
      // DESIGN-OPEN: "×1.3 on top" applied to both hp and dmg for the named variant.
      hp *= 1.3;
      dmg *= 1.3;
    }
    units.push(mk(rareFlag ? `Named ${RARE_NAME}` : RARE_NAME, hp, dmg, 1.2, b.mit, { isRare: true, named: !!rareFlag }));
    return units;
  }
  if (nodeType === 'crystal') {
    // 2–3 units at ×1.2 hp. DESIGN-OPEN: 2-vs-3 split not given — 50/50 used.
    const n = weightedPick(rng, [[2, 50], [3, 50]]);
    for (let i = 0; i < n; i++) {
      units.push(mk(TRASH_NAMES[Math.floor(rng() * TRASH_NAMES.length)], b.hp * 1.2, b.dmg, b.interval, b.mit));
    }
    return units;
  }
  // normal: 1–3 units, weights 30/50/20
  const n = weightedPick(rng, [[1, 30], [2, 50], [3, 20]]);
  for (let i = 0; i < n; i++) {
    units.push(mk(TRASH_NAMES[Math.floor(rng() * TRASH_NAMES.length)], b.hp, b.dmg, b.interval, b.mit));
  }
  return units;
}
