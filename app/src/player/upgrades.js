/**
 * The Veinbinder's upgrades — docs/Eldrathor_Growth_Model_Lock.md §2. Bought with Worldvein, level by
 * level, each with its own level, **capped at the current Resonance rank**. No respec.
 *   Bond  (party-wide — applies to EVERY Adventurer)      Craft (economy)
 *   state: `{ [upgradeId]: level }` — saved under `player.upgrades`.
 * Every number lives in PLAYER_TUNING. Pure; asserted by player.test.js (one test per line).
 */
export const PLAYER_TUNING = {
  cost: { base: 50, growth: 1.25 }, // (tune) Worldvein for the next level on an upgrade at level n: 50 × 1.25^n
  bond: {
    vitality: { name: 'Vitality', per: 0.02, stat: 'hp', label: 'HP' },
    might: { name: 'Might', per: 0.02, stat: 'power', label: 'Power' },
    // DESIGN-OPEN: "+1 % mitigation / +1 % crit chance per level" is read as percentage POINTS (both stats are
    // already percentages, and a relative +1 % of a 10 % crit chance would be nothing). The other lines are relative.
    ward: { name: 'Ward', per: 0.01, stat: 'mitigation', label: 'mitigation', points: true },
    tempo: { name: 'Tempo', per: 0.015, stat: 'attackSpeed', label: 'attack speed' },
    grace: { name: 'Grace', per: 0.02, stat: 'healingPower', label: 'healing' },
    keen: { name: 'Keen', per: 0.01, stat: 'critChance', label: 'crit chance', points: true },
    flow: { name: 'Flow', per: 0.02, stat: 'manaRegen', label: 'mana regen' },
  },
  craft: {
    yield: { name: 'Yield', per: 0.05, label: 'gather output' },
    vein: { name: 'Vein', per: 0.05, label: 'Worldvein from nodes' },
    fortune: { name: 'Fortune', per: 0.03, label: 'loot one-up chance' },
    haste: { name: 'Haste', per: 0.05, label: 'Process time', negative: true },
    hearth: { name: 'Hearth', slotsAt: [4, 8], cap: 8, label: 'job slot' }, // +1 Gather slot at levels 4 and 8
  },
};
export const BOND_IDS = Object.keys(PLAYER_TUNING.bond);
export const CRAFT_IDS = Object.keys(PLAYER_TUNING.craft);
export const UPGRADE_IDS = [...BOND_IDS, ...CRAFT_IDS];
const defOf = (id) => PLAYER_TUNING.bond[id] || PLAYER_TUNING.craft[id] || null;
export const upgradeGroup = (id) => (PLAYER_TUNING.bond[id] ? 'bond' : PLAYER_TUNING.craft[id] ? 'craft' : null);

export const emptyUpgrades = () => ({});
/** Keep only known lines with whole, non-negative levels (a loaded save may be partial). */
export function normalizeUpgrades(u) {
  const out = {};
  for (const id of UPGRADE_IDS) { const n = Math.floor(Number(u?.[id]) || 0); if (n > 0) out[id] = n; }
  return out;
}
export const levelOf = (upgrades, id) => upgrades?.[id] || 0;
/** Worldvein for the next level of an upgrade currently at level `n`. */
export const upgradeCost = (n) => Math.round(PLAYER_TUNING.cost.base * Math.pow(PLAYER_TUNING.cost.growth, Math.max(0, n)));
/** How far a line can be taken right now: the rank, and never past the line's own cap (Hearth: 8). */
export const levelCap = (id, rank) => Math.min(Math.max(1, rank), defOf(id)?.cap ?? Infinity);

export const BUY_REASON = { cap: 'At the rank cap — raise your Resonance', max: 'Fully upgraded', worldvein: 'Not enough Worldvein', unknown: 'No such upgrade' };
/** @returns {{ ok: boolean, reason: string | null, cost: number, level: number, cap: number }} */
export function canBuy(upgrades, id, { rank = 1, worldvein = 0 } = {}) {
  const level = levelOf(upgrades, id);
  const cap = levelCap(id, rank);
  const cost = upgradeCost(level);
  const d = defOf(id);
  if (!d) return { ok: false, reason: BUY_REASON.unknown, cost, level, cap };
  if (d.cap != null && level >= d.cap) return { ok: false, reason: BUY_REASON.max, cost, level, cap };
  if (level >= cap) return { ok: false, reason: BUY_REASON.cap, cost, level, cap };
  if (worldvein < cost) return { ok: false, reason: BUY_REASON.worldvein, cost, level, cap };
  return { ok: true, reason: null, cost, level, cap };
}
/** Buy one level (the caller has checked `canBuy` and pays `cost`). */
export const buy = (upgrades, id) => ({ ...upgrades, [id]: levelOf(upgrades, id) + 1 });

// ---------- effects ----------
/**
 * Bond → every Adventurer's derive. `mult` are relative bonuses on the nine-stat keys, `add` are
 * percentage-point bonuses (mitigation, crit chance).
 */
export function bondMods(upgrades) {
  const mult = {}; const add = {};
  for (const id of BOND_IDS) {
    const lv = levelOf(upgrades, id); if (!lv) continue;
    const d = PLAYER_TUNING.bond[id];
    (d.points ? add : mult)[d.stat] = +(d.per * lv).toFixed(6);
  }
  return { mult, add };
}
/** Hearth job slots: +1 Gather slot at levels 4 and 8. */
export const extraHearthSlots = (upgrades) => PLAYER_TUNING.craft.hearth.slotsAt.filter((at) => levelOf(upgrades, 'hearth') >= at).length;
/** Craft → the economy: gather output ×, node Worldvein ×, loot one-up chance, Process time ×, extra Hearth slots. */
export function craftMods(upgrades) {
  const c = PLAYER_TUNING.craft;
  return {
    yieldMult: 1 + c.yield.per * levelOf(upgrades, 'yield'),
    veinMult: 1 + c.vein.per * levelOf(upgrades, 'vein'),
    oneUpChance: c.fortune.per * levelOf(upgrades, 'fortune'),
    processTimeMult: Math.max(0.1, 1 - c.haste.per * levelOf(upgrades, 'haste')),
    extraSlots: extraHearthSlots(upgrades),
  };
}
export const NO_CRAFT = Object.freeze({ yieldMult: 1, veinMult: 1, oneUpChance: 0, processTimeMult: 1, extraSlots: 0 });

/** `+6% Power` — what a line gives at `level` (the row's middle text). */
export function effectText(id, level) {
  const d = defOf(id); if (!d) return '';
  if (id === 'hearth') { const n = PLAYER_TUNING.craft.hearth.slotsAt.filter((at) => level >= at).length; return `+${n} ${d.label}${n === 1 ? '' : 's'} (at levels 4 and 8)`; }
  const pct = +(d.per * level * 100).toFixed(1);
  return `${d.negative ? '−' : '+'}${pct}% ${d.label}`;
}
