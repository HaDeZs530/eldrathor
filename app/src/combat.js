import { ARCHETYPES, WEAPONS, rand, pick } from './data.js';

/** Auto-resolve fight (retained from prototype). */
export function resolveFight(party, node) {
  const tierMult = 1 + (node.tier - 1) * 0.6;
  const typeMult = node.type === 'boss' ? 6 : node.type === 'rare' ? 2.4 : node.type === 'crystal' ? 1.5 : 1;
  const enemyHP = Math.round(rand(90, 130) * tierMult * typeMult);
  const enemyDPS = rand(6, 10) * tierMult * (node.type === 'boss' ? 1.6 : node.type === 'rare' ? 1.2 : 1);

  let partyDPS = 0;
  party.forEach((m) => {
    const a = ARCHETYPES[m.archetype];
    const w = WEAPONS[m.weapon];
    partyDPS += ((a.atk + m.level * 2) * w.dmg) / w.tempo;
  });
  if (party.some((m) => m.archetype === 'Resonator')) partyDPS *= 1.08;

  let partyHP = party.reduce((s, m) => s + (ARCHETYPES[m.archetype].hp + m.level * 12), 0);
  const partyMaxHP = partyHP;
  const partyMit =
    party.reduce((s, m) => s + WEAPONS[m.weapon].mit, 0) / party.length +
    party.reduce((s, m) => s + ARCHETYPES[m.archetype].def, 0) / party.length / 100;
  const hasHealer = party.some((m) => m.archetype === 'Warden');

  let eHP = enemyHP;
  let pHP = partyHP;
  let t = 0;
  while (eHP > 0 && pHP > 0 && t < 400) {
    eHP -= partyDPS * 0.1;
    pHP -= enemyDPS * 0.1 * (1 - Math.min(0.6, partyMit));
    if (hasHealer) pHP = Math.min(partyMaxHP, pHP + partyMaxHP * 0.006);
    t++;
  }
  return { win: eHP <= 0, hpPct: Math.max(0, pHP / partyMaxHP), duration: (t * 0.1).toFixed(1) };
}

export function rollLoot(node) {
  const base = node.type === 'boss' ? 5 : node.type === 'rare' ? 3 : node.type === 'crystal' ? 2 : 1;
  const worldvein = Math.round(rand(4, 9) * base * node.tier);
  let gear = null;
  const gearChance = node.type === 'boss' ? 1 : node.type === 'rare' ? 0.6 : node.type === 'crystal' ? 0.25 : 0.12;
  if (Math.random() < gearChance) {
    const tiers = ['Common', 'Fine', 'Rare', 'Epic', 'Legendary'];
    const ti =
      node.type === 'boss'
        ? Math.min(4, node.tier)
        : Math.min(node.tier - 1 + (Math.random() < 0.3 ? 1 : 0), 4);
    const qtier = tiers[Math.max(0, ti)];
    gear = { name: `${qtier} ${pick(['Blade', 'Guard', 'Vestment', 'Charm', 'Crown'])}`, tier: qtier, rating: Math.round(rand(1, 100)) };
  }
  return { worldvein, gear, healCrystal: Math.random() < 0.14 };
}

/**
 * Flee roll — placeholder numbers. Partial lock (session log 2026-09-11): flee risks a
 * roll, clean escape vs AMBUSH, harder when the party is low on HP or the encounter is
 * tougher. Directed by Anthony (Claude Code chat 2026-09-11): attack/flee buttons on
 * the fight screen; success → back to node map; ambush → note + combat starts.
 * // DESIGN-OPEN: exact odds, ambush fight rules (currently a normal fight), UI copy.
 */
export function fleeChance(node, partyHP) {
  const base = 0.7;
  const hpTerm = (Math.max(0, Math.min(1, partyHP)) - 0.5) * 0.4; // -0.2 … +0.2
  const typePenalty = node.type === 'boss' ? 0.35 : node.type === 'rare' ? 0.2 : node.type === 'crystal' ? 0.05 : 0;
  const tierPenalty = Math.max(0, (node.tier || 1) - 1) * 0.03;
  return Math.max(0.1, Math.min(0.95, base + hpTerm - typePenalty - tierPenalty));
}

export function rollFlee(node, partyHP) {
  const chance = fleeChance(node, partyHP);
  return { chance, escaped: Math.random() < chance };
}

/** Flee-success flash / log copy — one is picked at random. Anthony (2026-09-11): ~5,
 *  mix of straight and funny. Edit freely; Boss may lock final copy. */
export const FLEE_SUCCESS_MESSAGES = [
  'Fled successfully!',
  'Successful escape!',
  'Avoided danger!',
  'Bravely ran away!',
  'Nope. Not today.',
];
