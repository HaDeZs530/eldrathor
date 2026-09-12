/**
 * Pre-rolled script resolver — docs/Eldrathor_Combat_v2_Lock.md §1, §2, §3, §5.
 * The whole fight is simulated instantly in 100 ms ticks into an ordered event list,
 * then played back on the fight screen. Deterministic per `seed`.
 *
 * Events: swing, hit, crit, kill, innate, heal, stun, enrage, death, victory, wipe
 * (each with t in ms, source, target, amount) plus `snap` every 200 ms carrying all bars.
 */
import { deriveStats } from './derive.js';

export const TICK_MS = 100;
export const SNAP_MS = 200;
// DESIGN-OPEN: no max fight length in the spec — safety cap so a stalemate can't run forever.
export const MAX_FIGHT_MS = 300000;
export const AOE_SPLASH = 0.35; // every other living enemy takes 35% of a swing (§2, tune)

/** Archetype innates — §3. Personal = cooldown ability (auto-fires); group = passive aura. */
export const INNATES = {
  Bulwark: { name: 'Aegis', glyph: '🛡', cd: 8000, mana: 20, aura: { id: 'guardian', name: "Guardian's Bulwark", glyph: '⛨', text: 'Party takes 10% less damage' } },
  Warden: { name: 'Mend', glyph: '✚', cd: 5000, mana: 25, aura: { id: 'renewal', name: 'Renewal', glyph: '❦', text: 'Party heals 2% max HP every 2 s' } },
  Striker: { name: 'Onslaught', glyph: '⚔', cd: 0, mana: 0, passive: true, aura: { id: 'cadence', name: 'Cadence', glyph: '♪', text: 'Party attack speed +12%' } },
  Adept: { name: 'Lock', glyph: '✴', cd: 10000, mana: 30, aura: { id: 'sunder', name: 'Sunder', glyph: '⌁', text: 'Enemies take +12% damage' } },
  Resonator: { name: 'Resonance', glyph: '☯', cd: 12000, mana: 20, aura: { id: 'attune', name: 'Attune Vein', glyph: '❖', text: '+20% Worldvein, +1 loot-tier bias' } },
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Group auras present (same kind never stacks — two Strikers = one Cadence). */
export function partyAuras(party) {
  const ids = new Set();
  const list = [];
  for (const m of party) {
    const inn = INNATES[m.archetype];
    if (inn && !ids.has(inn.aura.id)) {
      ids.add(inn.aura.id);
      list.push(inn.aura);
    }
  }
  return list;
}

/**
 * @param {{party: object[], enemies: object[], seed?: number, startHpFrac?: number[], runMods?: {dmgMult?:number, mitAdd?:number}, enemyFirst?: boolean}} args
 *   enemyFirst  — failed flee (v3 §3): enemies act first, the party gets no swings or innates for 1.5 s
 *   startHpFrac — per-Adventurer HP fraction carried from the run (≤0 = fallen, sits the fight out)
 *   runMods     — sanctuary bonuses for the run: damage multiplier, additive mitigation
 * @returns {{events: object[], result: object, stats: object}}
 */
export const ENEMY_FIRST_MS = 1500;

export function simulateFight({ party, enemies, seed = 1, startHpFrac, runMods, enemyFirst = false }) {
  const rng = mulberry32(seed);
  const modDmg = runMods?.dmgMult || 1;
  const modMit = runMods?.mitAdd || 0;
  const auras = new Set(partyAuras(party).map((a) => a.id));
  const cadence = auras.has('cadence') ? 1.12 : 1;

  const P = party.map((m, i) => {
    const d = deriveStats(m);
    const frac = startHpFrac?.[i] ?? 1;
    const fallen = frac <= 0;
    return {
      id: `p${i}`, i, name: m.name, archetype: m.archetype, d,
      hp: fallen ? 0 : Math.max(1, d.maxHp * Math.min(1, frac)),
      mana: d.maxMana,
      alive: !fallen,
      // DESIGN-OPEN: small opening stagger so the three don't swing on the same tick.
      nextSwing: (enemyFirst ? ENEMY_FIRST_MS : 0) + 300 + i * 150,
      cdReady: (enemyFirst ? ENEMY_FIRST_MS : 0) + 500 + i * 100,
      stacks: 0, nextStack: 3000,
      aegisUntil: 0,
      dealt: 0, taken: 0, healed: 0, kills: 0,
    };
  });
  const E = enemies.map((e, i) => ({
    ...e, id: e.id || `e${i}`, i, hp: e.hp, alive: true,
    nextSwing: (enemyFirst ? 200 : 700) + i * 250, stunnedUntil: 0, stunImmuneUntil: 0,
    nextEnrage: e.isBoss ? 15000 : Infinity, enraged: false,
  }));

  const events = [];
  const ev = (o) => events.push(o);
  let taunt = { until: 0, unitId: null };
  let resonanceUntil = 0;
  let t = 0;
  let outcome = null;

  const livingP = () => P.filter((p) => p.alive);
  const livingE = () => E.filter((e) => e.alive);
  const round = (n) => Math.round(n);

  const snap = () => ev({
    t, type: 'snap',
    party: P.map((p) => ({ hp: p.hp, mana: p.mana, stacks: p.stacks, cdReady: p.cdReady, alive: p.alive, aegisUntil: p.aegisUntil })),
    enemies: E.map((e) => ({ hp: e.hp, alive: e.alive, stunnedUntil: e.stunnedUntil, enraged: e.enraged })),
    taunt: { ...taunt }, resonanceUntil,
  });

  ev({ t: 0, type: 'start', auras: [...auras], enemyFirst });
  snap();
  if (livingP().length === 0) outcome = 'wipe';

  while (!outcome && t < MAX_FIGHT_MS) {
    t += TICK_MS;
    const dt = TICK_MS / 1000;
    const resonance = t < resonanceUntil;

    // --- upkeep: mana regen, Renewal aura ---
    for (const p of livingP()) {
      p.mana = Math.min(p.d.maxMana, p.mana + p.d.manaRegen * dt);
    }
    if (auras.has('renewal') && t % 2000 === 0) {
      for (const p of livingP()) {
        const amt = round(p.d.maxHp * 0.02);
        const before = p.hp;
        p.hp = Math.min(p.d.maxHp, p.hp + amt);
        p.healed += p.hp - before;
        ev({ t, type: 'heal', source: 'Renewal', target: p.id, targetName: p.name, amount: amt, hp: p.hp, aura: true });
      }
    }

    // --- boss enrage tick: next hit ×2 ---
    for (const e of livingE()) {
      if (t >= e.nextEnrage) {
        e.enraged = true;
        e.nextEnrage += 15000;
        ev({ t, type: 'enrage', source: e.id, sourceName: e.name });
      }
    }

    // --- party innates (auto-fire) ---
    for (const p of livingP()) {
      const inn = INNATES[p.archetype];
      if (!inn) continue;
      if (inn.passive) {
        // Onslaught: +8% damage per stack, a stack every 3 s in combat, max 6.
        if (t >= p.nextStack && p.stacks < 6) {
          p.stacks += 1;
          p.nextStack += 3000;
          ev({ t, type: 'innate', source: p.id, sourceName: p.name, name: inn.name, amount: p.stacks, text: `Onslaught ▸ ${p.name} ×${p.stacks}` });
        }
        continue;
      }
      if (t < p.cdReady || p.mana < inn.mana) continue;
      const enemiesAlive = livingE();
      if (enemiesAlive.length === 0) continue;
      let fired = false;
      if (inn.name === 'Aegis') {
        taunt = { until: t + 4000, unitId: p.id };
        p.aegisUntil = t + 4000;
        ev({ t, type: 'innate', source: p.id, sourceName: p.name, name: inn.name, target: p.id, text: `Aegis ▸ ${p.name} taunts` });
        fired = true;
      } else if (inn.name === 'Mend') {
        const hurt = livingP().filter((x) => x.hp < x.d.maxHp).sort((a, b) => a.hp / a.d.maxHp - b.hp / b.d.maxHp)[0];
        if (hurt) {
          const amt = round(40 * p.d.healScale);
          const before = hurt.hp;
          hurt.hp = Math.min(hurt.d.maxHp, hurt.hp + amt);
          p.healed += hurt.hp - before;
          ev({ t, type: 'innate', source: p.id, sourceName: p.name, name: inn.name, target: hurt.id, targetName: hurt.name, amount: amt, text: `Mend ▸ ${hurt.name} +${amt}` });
          ev({ t, type: 'heal', source: p.id, target: hurt.id, targetName: hurt.name, amount: amt, hp: hurt.hp });
          fired = true;
        }
      } else if (inn.name === 'Lock') {
        const target = enemiesAlive.filter((e) => t >= e.stunImmuneUntil).sort((a, b) => b.hp - a.hp)[0];
        if (target) {
          const dur = target.isBoss ? 1000 : 2000;
          target.stunnedUntil = t + dur;
          if (target.isBoss) target.stunImmuneUntil = t + dur + 10000;
          ev({ t, type: 'innate', source: p.id, sourceName: p.name, name: inn.name, target: target.id, targetName: target.name, amount: dur, text: `Lock ▸ ${target.name} stunned` });
          ev({ t, type: 'stun', source: p.id, target: target.id, targetName: target.name, amount: dur, until: t + dur });
          fired = true;
        }
      } else if (inn.name === 'Resonance') {
        resonanceUntil = t + 6000;
        ev({ t, type: 'innate', source: p.id, sourceName: p.name, name: inn.name, text: `Resonance ▸ party +6% dmg / +6% mit` });
        fired = true;
      }
      if (fired) {
        p.mana -= inn.mana;
        p.cdReady = t + inn.cd;
        events[events.length - 1].cdEnd = p.cdReady;
        // annotate the innate event (it may be the last or second-to-last event)
        for (let k = events.length - 1; k >= 0 && events[k].t === t; k--) {
          if (events[k].type === 'innate' && events[k].source === p.id) { events[k].cdEnd = p.cdReady; events[k].mana = p.mana; break; }
        }
      }
    }

    // --- party swings (all weapons partial-AoE) ---
    for (const p of livingP()) {
      if (t < p.nextSwing) continue;
      const alive = livingE();
      if (alive.length === 0) break;
      // DESIGN-OPEN: primary target selection — lowest index living enemy (focus fire).
      const primary = alive[0];
      const mult = (1 + 0.08 * p.stacks) * (t < resonanceUntil ? 1.06 : 1) * (auras.has('sunder') ? 1.12 : 1) * modDmg;
      const crit = rng() < p.d.critChance;
      const base = p.d.hitDamage * mult * (crit ? p.d.critMult : 1);
      ev({ t, type: 'swing', source: p.id, sourceName: p.name, target: primary.id, targetName: primary.name });
      for (const e of alive) {
        const share = e === primary ? 1 : AOE_SPLASH;
        const amt = round(base * share * (1 - e.mit));
        if (amt <= 0) continue;
        e.hp -= amt;
        p.dealt += amt;
        ev({ t, type: crit ? 'crit' : 'hit', source: p.id, sourceName: p.name, target: e.id, targetName: e.name, amount: amt, hp: Math.max(0, e.hp), splash: e !== primary });
        if (e.hp <= 0 && e.alive) {
          e.alive = false;
          p.kills += 1;
          ev({ t, type: 'kill', source: p.id, sourceName: p.name, target: e.id, targetName: e.name });
        }
      }
      p.nextSwing += (p.d.swingInterval / cadence) * 1000;
    }
    if (livingE().length === 0) { outcome = 'victory'; break; }

    // --- enemy swings ---
    for (const e of livingE()) {
      if (t < e.stunnedUntil) { e.nextSwing = Math.max(e.nextSwing, e.stunnedUntil); continue; }
      if (t < e.nextSwing) continue;
      const alive = livingP();
      if (alive.length === 0) break;
      let target = null;
      if (t < taunt.until) target = alive.find((p) => p.id === taunt.unitId) || null;
      if (!target) {
        // random living Adventurer weighted by lowest mitigation
        const weights = alive.map((p) => Math.max(0.05, 1 - p.d.mitigation));
        const total = weights.reduce((a, b) => a + b, 0);
        let r = rng() * total;
        target = alive[alive.length - 1];
        for (let k = 0; k < alive.length; k++) { r -= weights[k]; if (r <= 0) { target = alive[k]; break; } }
      }
      let dmg = e.dmg;
      const enraged = e.enraged;
      if (enraged) { dmg *= 2; e.enraged = false; }
      // DESIGN-OPEN: Aegis "+25% mitigation" applied as +0.25 additive (capped 0.9); Resonance +6% likewise.
      let mit = target.d.mitigation + modMit + (t < target.aegisUntil ? 0.25 : 0) + (resonance ? 0.06 : 0);
      mit = Math.min(0.9, mit);
      let amt = dmg * (1 - mit);
      if (auras.has('guardian')) amt *= 0.9;
      amt = round(amt);
      target.hp -= amt;
      target.taken += amt;
      ev({ t, type: enraged ? 'crit' : 'hit', source: e.id, sourceName: e.name, target: target.id, targetName: target.name, amount: amt, hp: Math.max(0, target.hp), enemy: true, enraged });
      if (target.hp <= 0 && target.alive) {
        target.alive = false;
        target.hp = 0;
        ev({ t, type: 'death', source: e.id, sourceName: e.name, target: target.id, targetName: target.name });
      }
      e.nextSwing += e.interval * 1000;
    }
    if (livingP().length === 0) { outcome = 'wipe'; break; }

    if (t % SNAP_MS === 0) snap();
  }

  if (!outcome) outcome = 'wipe'; // DESIGN-OPEN: timeout counts as a wipe
  snap();
  ev({ t, type: outcome });

  const win = outcome === 'victory';
  const stats = {
    party: P.map((p) => ({ id: p.id, name: p.name, archetype: p.archetype, dealt: p.dealt, taken: p.taken, healed: p.healed, kills: p.kills, alive: p.alive, hpFrac: Math.max(0, p.hp / p.d.maxHp) })),
    kills: P.reduce((n, p) => n + p.kills, 0),
    durationMs: t,
    auras: [...auras],
  };
  const result = {
    win,
    durationMs: t,
    durationSec: +(t / 1000).toFixed(1),
    hpPct: stats.party.reduce((s, p) => s + p.hpFrac, 0) / Math.max(1, stats.party.length),
    partyHpFrac: stats.party.map((p) => p.hpFrac),
    attuneVein: auras.has('attune'),
    kills: stats.kills,
  };
  return { events, result, stats };
}

export const lastEventTime = (events) => (events.length ? events[events.length - 1].t : 0);
