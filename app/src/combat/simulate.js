/**
 * Pre-rolled script resolver — docs/Eldrathor_Combat_v2_Lock.md §1, §2, §3, §5.
 * The whole fight is simulated instantly in 100 ms ticks into an ordered event list,
 * then played back on the fight screen. Deterministic per `seed`.
 *
 * Events: swing, hit, crit, kill, innate, gem, proc, finisher, heal, stun, enrage, death, victory, wipe
 * (each with t in ms, source, target, amount) plus `snap` every 200 ms carrying all bars.
 */
import { deriveStats } from './derive.js';
import { gemEffects } from '../progression/gems.js';
import { GEM_TUNING } from '../lattice/classGems.js';

export const TICK_MS = 100;
export const SNAP_MS = 200;
// DESIGN-OPEN: no max fight length in the spec — safety cap so a stalemate can't run forever.
export const MAX_FIGHT_MS = 300000;
export const AOE_SPLASH = 0.35; // every other living enemy takes 35% of a swing (§2, tune)

/** Archetype innates — §3. Personal = cooldown ability (auto-fires); group = passive aura. */
/** Sustain numbers — Progression Loop Lock §9 / Combat v2 §3 (retuned 2026-09-14). Asserted by balance.test.js. */
export const SUSTAIN = { renewalPct: 0.01, renewalEveryMs: 3000, mendBase: 30, mendCdMs: 7000, guardianPct: 0.08 };

export const INNATES = {
  // Progression Loop Lock §9 (2026-09-14): sustain retuned — Guardian 8 %, Mend 30 × heal scale / CD 7 s, Renewal 1 % every 3 s
  Bulwark: { name: 'Aegis', glyph: '🛡', cd: 8000, mana: 20, aura: { id: 'guardian', name: "Guardian's Bulwark", glyph: '⛨', text: 'Party takes 8% less damage' } },
  Warden: { name: 'Mend', glyph: '✚', cd: 7000, mana: 25, aura: { id: 'renewal', name: 'Renewal', glyph: '❦', text: 'Party heals 1% max HP every 3 s' } },
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

  const GT = GEM_TUNING;
  const P = party.map((m, i) => {
    const d = deriveStats(m);
    const frac = startHpFrac?.[i] ?? 1;
    const fallen = frac <= 0;
    // Class gem (Growth Model §1 / ClassGems_Live §5): stat facets already sit in `d`; here the Core ability
    // (crossing), the innate amplifier (matching), procs and the finisher. No gem → fx is null and nothing below runs.
    const fx = m.gemItem ? gemEffects(m.archetype, m.gemItem) : null;
    const start = enemyFirst ? ENEMY_FIRST_MS : 0;
    return {
      id: `p${i}`, i, name: m.name, archetype: m.archetype, d,
      fx, amp: fx?.innateAmp || 1,
      has: (proc) => !!fx && fx.procs.includes(proc),
      fin: (id) => (fx?.finisher?.id === id ? fx.finisher.level : 0),
      tauntStr: 1 + (fx?.statMods?.tauntStrength || 0), controlStr: 1 + (fx?.statMods?.controlStrength || 0),
      gemCdReady: start + 1200 + i * 100, gemMitUntil: 0,
      secondSkinReady: 0, secondSkinUntil: 0, execReady: 0, witherNext: start + GT.procs.wither.every, guardianReady: 0,
      cullNext: start, wallNext: start, sanctNext: start, lifeveinReady: 0, shield: 0, hots: [],
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
    ...e, id: e.id || `e${i}`, i, hp: e.hp, maxHp: e.hp, alive: true,
    burn: null, vulnStacks: 0, vulnUntil: 0, witherUntil: 0, chainedUntil: 0,
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
  const holdsTaunt = (p) => t < taunt.until && taunt.unitId === p.id;
  // the party's strongest Ruinous Mark / Warden's Chains (finishers never stack across wearers)
  const markVuln = () => Math.max(0, ...P.filter((p) => p.alive && p.fin('ruinousMark')).map((p) => GT.finishers.ruinousMark.vuln[p.fin('ruinousMark') - 1]));
  const chainsLevel = () => Math.max(0, ...P.filter((p) => p.alive).map((p) => p.fin('wardensChains')));
  // DESIGN-OPEN: Chains L1 works "from Wither / stun targets" — read as: while Wither is on the enemy, and for Wither's
  // duration after a stun ends. L2 is every enemy, always.
  const isChained = (e) => { const lv = chainsLevel(); return lv >= 2 || (lv === 1 && t < e.chainedUntil); };
  /** Every point of party damage goes through here: mitigation, then vulnerability (Enfeeble stacks + Ruinous Mark). */
  const strike = (p, e, raw, { type = 'hit', splash = false, extra = {} } = {}) => {
    const vuln = 1 + (t < e.vulnUntil ? e.vulnStacks * GT.procs.enfeeble.vuln : 0) + markVuln();
    const amt = round(raw * (1 - e.mit) * vuln);
    if (amt <= 0) return 0;
    e.hp -= amt;
    p.dealt += amt;
    ev({ t, type, source: p.id, sourceName: p.name, target: e.id, targetName: e.name, amount: amt, hp: Math.max(0, e.hp), splash, raw: round(raw), mit: e.mit, ...extra });
    if (e.hp <= 0 && e.alive) {
      e.alive = false;
      p.kills += 1;
      ev({ t, type: 'kill', source: p.id, sourceName: p.name, target: e.id, targetName: e.name });
    }
    return amt;
  };
  /** A heal from `p` on `target`. Lifebloom: 30 % of the wearer's heals leave a HoT worth 20 % of the heal over 4 s. */
  const healFrom = (p, target, amount, extra = {}) => {
    const amt = round(amount);
    const before = target.hp;
    target.hp = Math.min(target.d.maxHp, target.hp + amt);
    p.healed += target.hp - before;
    ev({ t, type: 'heal', source: p.id, target: target.id, targetName: target.name, amount: amt, hp: target.hp, ...extra });
    if (p.has('lifebloom') && !extra.hot && rng() < GT.procs.lifebloom.chance) {
      const L = GT.procs.lifebloom; const ticks = Math.round(L.ms / 1000);
      target.hots.push({ src: p, per: (amt * L.hot) / ticks, left: ticks, next: t + 1000 });
      ev({ t, type: 'proc', source: p.id, sourceName: p.name, name: L.name, target: target.id, targetName: target.name, text: `Lifebloom ▸ ${target.name} blooms` });
    }
    return amt;
  };
  const outMult = (p) => (1 + 0.08 * p.amp * p.stacks) * (t < resonanceUntil ? 1.06 : 1) * (auras.has('sunder') ? 1.12 : 1) * modDmg
    * (p.fin('onslaught') ? 1 + GT.finishers.onslaught.cap[p.fin('onslaught') - 1] * Math.min(1, t / GT.finishers.onslaught.rampMs) : 1);

  const snap = () => ev({
    t, type: 'snap',
    party: P.map((p) => ({ hp: p.hp, mana: p.mana, stacks: p.stacks, cdReady: p.cdReady, alive: p.alive, aegisUntil: p.aegisUntil, gemCdReady: p.gemCdReady, shield: p.shield })),
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
    if (auras.has('renewal') && t % SUSTAIN.renewalEveryMs === 0) {
      for (const p of livingP()) {
        const amt = round(p.d.maxHp * SUSTAIN.renewalPct);
        const before = p.hp;
        p.hp = Math.min(p.d.maxHp, p.hp + amt);
        p.healed += p.hp - before;
        ev({ t, type: 'heal', source: 'Renewal', target: p.id, targetName: p.name, amount: amt, hp: p.hp, aura: true });
      }
    }

    // --- enemy regeneration: only for enemies that carry `regen` (share of max HP per second). No enemy in the game does yet —
    // DESIGN-OPEN: balance-test hook (Anthony, 2026-09-21: late monsters with their own healing); fights without it are unchanged.
    if (t % 1000 === 0) for (const e of livingE()) if (e.regen > 0 && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + round(e.maxHp * e.regen));
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
        const tauntMs = Math.round(4000 * p.tauntStr);
        taunt = { until: t + tauntMs, unitId: p.id };
        p.aegisUntil = t + tauntMs;
        ev({ t, type: 'innate', source: p.id, sourceName: p.name, name: inn.name, target: p.id, text: `Aegis ▸ ${p.name} taunts` });
        fired = true;
      } else if (inn.name === 'Mend') {
        const hurt = livingP().filter((x) => x.hp < x.d.maxHp).sort((a, b) => a.hp / a.d.maxHp - b.hp / b.d.maxHp)[0];
        if (hurt) {
          const amt = round(SUSTAIN.mendBase * p.d.healScale * p.amp); // a matching Healer gem amplifies Mend
          ev({ t, type: 'innate', source: p.id, sourceName: p.name, name: inn.name, target: hurt.id, targetName: hurt.name, amount: amt, text: `Mend ▸ ${hurt.name} +${amt}` });
          healFrom(p, hurt, amt);
          fired = true;
        }
      } else if (inn.name === 'Lock') {
        const target = enemiesAlive.filter((e) => t >= e.stunImmuneUntil).sort((a, b) => b.hp - a.hp)[0];
        if (target) {
          const dur = Math.round((target.isBoss ? 1000 : 2000) * p.amp * p.controlStr); // a matching Controller gem amplifies Lock
          target.stunnedUntil = t + dur;
          target.chainedUntil = t + dur + GT.procs.wither.ms;
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

    // --- class gems: the Core ability (crossing only), then procs and finishers on their own clocks ---
    for (const p of livingP()) {
      if (!p.fx) continue;
      const core = p.fx.coreAbility;
      if (core && t >= p.gemCdReady && p.mana >= core.mana && livingE().length) {
        let fired = false;
        if (core.id === 'gemTaunt') {
          const ms = Math.round(core.tauntMs * p.tauntStr);
          taunt = { until: t + ms, unitId: p.id }; p.gemMitUntil = t + ms;
          ev({ t, type: 'gem', source: p.id, sourceName: p.name, name: core.name, target: p.id, text: `Gem Taunt ▸ ${p.name} taunts` }); fired = true;
        } else if (core.id === 'gemHeal') {
          const hurt = livingP().filter((x) => x.hp < x.d.maxHp).sort((a, b) => a.hp / a.d.maxHp - b.hp / b.d.maxHp)[0];
          if (hurt) {
            const amt = round(core.base * p.d.healScale);
            ev({ t, type: 'gem', source: p.id, sourceName: p.name, name: core.name, target: hurt.id, targetName: hurt.name, amount: amt, text: `Gem Heal ▸ ${hurt.name} +${amt}` });
            healFrom(p, hurt, amt, { gem: true }); fired = true;
          }
        } else if (core.id === 'gemBurst') {
          const target = livingE()[0];
          ev({ t, type: 'gem', source: p.id, sourceName: p.name, name: core.name, target: target.id, targetName: target.name, text: `Gem Burst ▸ ${target.name}` });
          strike(p, target, p.d.hitDamage * core.mult * outMult(p), { extra: { gem: true } }); fired = true;
        } else if (core.id === 'gemStun') {
          const target = livingE().filter((e) => t >= e.stunImmuneUntil).sort((a, b) => b.hp - a.hp)[0];
          if (target) {
            const dur = Math.round((target.isBoss ? core.bossStunMs : core.stunMs) * p.controlStr);
            target.stunnedUntil = t + dur; target.chainedUntil = t + dur + GT.procs.wither.ms;
            if (target.isBoss) target.stunImmuneUntil = t + dur + core.bossImmuneMs;
            ev({ t, type: 'gem', source: p.id, sourceName: p.name, name: core.name, target: target.id, targetName: target.name, amount: dur, text: `Gem Stun ▸ ${target.name} stunned` });
            ev({ t, type: 'stun', source: p.id, target: target.id, targetName: target.name, amount: dur, until: t + dur }); fired = true;
          }
        }
        if (fired) { p.mana -= core.mana; p.gemCdReady = t + core.cd; }
      }
      // Execution: a bonus strike at 150 % on an enemy below 25 % HP
      if (p.has('execution') && t >= p.execReady) {
        const X = GT.procs.execution; const low = livingE().find((e) => e.hp / e.maxHp < X.below);
        if (low) { p.execReady = t + X.cd; ev({ t, type: 'proc', source: p.id, sourceName: p.name, name: X.name, target: low.id, targetName: low.name, text: `Execution ▸ ${low.name}` }); strike(p, low, p.d.hitDamage * X.mult * outMult(p), { extra: { proc: X.name } }); }
      }
      // Wither: −20 % enemy attack speed for 3 s, every 8 s (the healthiest enemy)
      if (p.has('wither') && t >= p.witherNext) {
        const W = GT.procs.wither; const target = [...livingE()].sort((a, b) => b.hp - a.hp)[0];
        p.witherNext = t + W.every;
        if (target) { target.witherUntil = t + W.ms; target.chainedUntil = Math.max(target.chainedUntil, t + W.ms); ev({ t, type: 'proc', source: p.id, sourceName: p.name, name: W.name, target: target.id, targetName: target.name, text: `Wither ▸ ${target.name} slowed` }); }
      }
      // Guardian Spirit: heal the lowest ally 25 % max HP when below 30 %
      if (p.has('guardianSpirit') && t >= p.guardianReady) {
        const G = GT.procs.guardianSpirit; const low = livingP().filter((x) => x.hp / x.d.maxHp < G.below).sort((a, b) => a.hp / a.d.maxHp - b.hp / b.d.maxHp)[0];
        if (low) { p.guardianReady = t + G.cd; ev({ t, type: 'proc', source: p.id, sourceName: p.name, name: G.name, target: low.id, targetName: low.name, text: `Guardian Spirit ▸ ${low.name}` }); healFrom(p, low, low.d.maxHp * G.heal, { proc: G.name }); }
      }
      // --- finishers ---
      const cull = p.fin('cullingStrike');
      if (cull && t >= p.cullNext + GT.finishers.cullingStrike.every[cull - 1] && livingE().length) {
        const C = GT.finishers.cullingStrike; const target = livingE()[0]; p.cullNext = t;
        ev({ t, type: 'finisher', source: p.id, sourceName: p.name, name: C.name, target: target.id, targetName: target.name, text: `Culling Strike ▸ ${target.name}` });
        strike(p, target, p.d.hitDamage * C.mult * outMult(p), { type: 'crit', extra: { finisher: C.name } });
      }
      const wall = p.fin('aegisWall');
      if (wall && t >= p.wallNext + GT.finishers.aegisWall.every) {
        const A = GT.finishers.aegisWall; p.wallNext = t; const amt = round(p.d.maxHp * A.shield[wall - 1]);
        for (const x of livingP()) x.shield = Math.max(x.shield, amt);
        ev({ t, type: 'finisher', source: p.id, sourceName: p.name, name: A.name, amount: amt, text: `Aegis Wall ▸ party shielded ${amt}` });
      }
      const sanct = p.fin('sanctuary');
      if (sanct && t >= p.sanctNext + GT.finishers.sanctuary.every) {
        const S = GT.finishers.sanctuary; p.sanctNext = t;
        ev({ t, type: 'finisher', source: p.id, sourceName: p.name, name: S.name, text: `Sanctuary ▸ the party mends` });
        for (const x of livingP()) if (x.hp < x.d.maxHp) healFrom(p, x, x.d.maxHp * S.tick[sanct - 1], { hot: true, finisher: S.name });
      }
      const vein = p.fin('lifevein');
      if (vein && t >= p.lifeveinReady) {
        const L = GT.finishers.lifevein; const low = livingP().filter((x) => x.hp / x.d.maxHp < L.below).sort((a, b) => a.hp / a.d.maxHp - b.hp / b.d.maxHp)[0];
        if (low) { p.lifeveinReady = t + L.cd[vein - 1]; ev({ t, type: 'finisher', source: p.id, sourceName: p.name, name: L.name, target: low.id, targetName: low.name, text: `Lifevein ▸ ${low.name}` }); healFrom(p, low, low.d.maxHp * L.heal, { finisher: L.name }); }
      }
    }
    // heal-over-time ticks (Lifebloom) and burns (Ember Brand) — only ever populated by a gem
    for (const x of livingP()) {
      if (!x.hots.length) continue;
      for (const h of x.hots) if (t >= h.next && h.left > 0) { h.left -= 1; h.next += 1000; healFrom(h.src, x, h.per, { hot: true, proc: GT.procs.lifebloom.name }); }
      x.hots = x.hots.filter((h) => h.left > 0);
    }
    let burned = false;
    for (const e of livingE()) {
      const b = e.burn;
      if (!b) continue;
      if (t >= b.until) { e.burn = null; continue; }
      if (t >= b.next) { b.next += 1000; burned = true; strike(b.src, e, b.perStack * b.stacks, { extra: { proc: GT.procs.emberBrand.name, dot: true } }); }
    }
    if (burned && livingE().length === 0) { outcome = 'victory'; break; }

    // --- party swings (all weapons partial-AoE) ---
    for (const p of livingP()) {
      if (t < p.nextSwing) continue;
      const alive = livingE();
      if (alive.length === 0) break;
      // DESIGN-OPEN: primary target selection — lowest index living enemy (focus fire).
      const primary = alive[0];
      const mult = outMult(p);
      const crit = rng() < p.d.critChance;
      const base = p.d.hitDamage * mult * (crit ? p.d.critMult : 1);
      ev({ t, type: 'swing', source: p.id, sourceName: p.name, target: primary.id, targetName: primary.name });
      for (const e of alive) {
        const share = e === primary ? 1 : AOE_SPLASH;
        strike(p, e, base * share, { type: crit ? 'crit' : 'hit', splash: e !== primary });
      }
      // on-hit procs land on the primary target
      if (primary.alive && p.has('emberBrand') && rng() < GT.procs.emberBrand.chance) {
        const B = GT.procs.emberBrand; const stacks = Math.min(B.maxStacks, (primary.burn?.stacks || 0) + 1);
        primary.burn = { src: p, stacks, perStack: p.d.hitDamage * B.burnPerSec, until: t + B.ms, next: primary.burn?.next ?? t + 1000 };
        ev({ t, type: 'proc', source: p.id, sourceName: p.name, name: B.name, target: primary.id, targetName: primary.name, amount: stacks, text: `Ember Brand ▸ ${primary.name} ×${stacks}` });
      }
      if (primary.alive && p.has('enfeeble') && rng() < GT.procs.enfeeble.chance) {
        const F = GT.procs.enfeeble; primary.vulnStacks = Math.min(F.maxStacks, (t < primary.vulnUntil ? primary.vulnStacks : 0) + 1); primary.vulnUntil = t + F.ms;
        ev({ t, type: 'proc', source: p.id, sourceName: p.name, name: F.name, target: primary.id, targetName: primary.name, amount: primary.vulnStacks, text: `Enfeeble ▸ ${primary.name} ×${primary.vulnStacks}` });
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
      const chained = isChained(e);
      if (chained) dmg *= 1 - GT.finishers.wardensChains.weaken; // Warden's Chains: weakened
      // DESIGN-OPEN: Aegis "+25% mitigation" applied as +0.25 additive (capped 0.9); Resonance +6% likewise.
      let mit = target.d.mitigation + modMit + (t < target.aegisUntil ? 0.25 * target.amp : 0) + (resonance ? 0.06 : 0)
        + (t < target.gemMitUntil ? GT.core.Tank.mitAdd : 0) + (t < target.secondSkinUntil ? GT.procs.secondSkin.mitAdd : 0);
      mit = Math.min(0.9, mit);
      let amt = dmg * (1 - mit);
      if (auras.has('guardian')) amt *= 1 - SUSTAIN.guardianPct;
      amt = round(amt);
      const imm = target.fin('immovable');
      if (imm && holdsTaunt(target)) amt = Math.min(amt, round(target.d.maxHp * GT.finishers.immovable.cap[imm - 1])); // Immovable: a hit is capped while taunting
      if (target.shield > 0) { const soak = Math.min(target.shield, amt); target.shield -= soak; amt -= soak; } // Aegis Wall
      target.hp -= amt;
      target.taken += amt;
      // brief §4/§5: every enemy hit is a feed event; `raw` and the effective `mit` let the feed show "14 (22 − 36%)"
      ev({ t, type: enraged ? 'crit' : 'hit', source: e.id, sourceName: e.name, target: target.id, targetName: target.name, amount: amt, hp: Math.max(0, target.hp), enemy: true, enraged, raw: round(dmg), mit: dmg > 0 ? Math.max(0, 1 - amt / dmg) : 0 });
      if (target.hp <= 0 && target.alive) {
        target.alive = false;
        target.hp = 0;
        ev({ t, type: 'death', source: e.id, sourceName: e.name, target: target.id, targetName: target.name });
      }
      if (target.alive && amt > 0 && target.has('thornward') && holdsTaunt(target)) { // Thornward: reflect while holding taunt
        const R = GT.procs.thornward; const back = round(amt * R.reflect);
        if (back > 0 && e.alive) {
          e.hp -= back; target.dealt += back;
          ev({ t, type: 'proc', source: target.id, sourceName: target.name, name: R.name, target: e.id, targetName: e.name, amount: back, hp: Math.max(0, e.hp), text: `Thornward ▸ ${e.name} −${back}` });
          if (e.hp <= 0) { e.alive = false; target.kills += 1; ev({ t, type: 'kill', source: target.id, sourceName: target.name, target: e.id, targetName: e.name }); }
        }
      }
      if (target.alive && target.has('secondSkin') && t >= target.secondSkinReady && target.hp / target.d.maxHp < GT.procs.secondSkin.below) { // Second Skin
        const K = GT.procs.secondSkin; target.secondSkinUntil = t + K.ms; target.secondSkinReady = t + K.cd;
        ev({ t, type: 'proc', source: target.id, sourceName: target.name, name: K.name, target: target.id, text: `Second Skin ▸ ${target.name} hardens` });
      }
      const slow = chained ? GT.finishers.wardensChains.slow : t < e.witherUntil ? GT.procs.wither.slow : 0;
      e.nextSwing += (e.interval * 1000) / (1 - slow);
    }
    if (livingP().length === 0) { outcome = 'wipe'; break; }

    if (t % SNAP_MS === 0) snap();
  }

  if (!outcome) outcome = 'wipe'; // DESIGN-OPEN: timeout counts as a wipe
  snap();
  ev({ t, type: outcome });

  const win = outcome === 'victory';
  // maxHp and carried-in HP are fractional, so a heal clamped at full HP adds a fraction — totals are whole numbers
  const stats = {
    party: P.map((p) => ({ id: p.id, name: p.name, archetype: p.archetype, dealt: round(p.dealt), taken: round(p.taken), healed: round(p.healed), kills: p.kills, alive: p.alive, hpFrac: Math.max(0, p.hp / p.d.maxHp) })),
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
