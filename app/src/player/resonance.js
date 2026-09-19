/**
 * Resonance — docs/Eldrathor_Growth_Model_Lock.md §2. How the player (the Veinbinder) grows.
 *   Resonance = Σ over the WHOLE roster of √level — every Adventurer counts, fielded or benched.
 *   Ten level-5 Adventurers (22.4) out-resonate three at level 17 (12.4) or one at 50 (7.1).
 *   Breadth beats depth by design.
 * Resonance sets a RANK (I–X). A rank is a cap, not a reward: it limits how far each purchasable
 * upgrade can be taken (rank IV → every upgrade can reach level 4). Pure; asserted by player.test.js.
 */
export const RESONANCE_RANKS = [0, 8, 14, 22, 32, 44, 58, 74, 92, 112]; // (tune) the Resonance needed for ranks I … X
export const MAX_RANK = RESONANCE_RANKS.length;
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Σ √level over every Adventurer passed in (party + roster). */
export const resonance = (members = []) => (members || []).reduce((n, m) => n + Math.sqrt(Math.max(1, m?.level || 1)), 0);

/** The rank (1–10) a Resonance value reaches: the number of thresholds at or below it. */
export const rankFor = (value) => Math.max(1, RESONANCE_RANKS.filter((t) => value >= t).length);
export const rankNumeral = (rank) => NUMERALS[Math.max(1, Math.min(MAX_RANK, rank)) - 1];

/**
 * Everything the Player tab's header shows.
 * @returns {{ value, rank, numeral, at, next, toNext, progress }} `next` is null at rank X; `progress` is 0–1 across the current rank's span.
 */
export function resonanceStatus(members = []) {
  const value = resonance(members);
  const rank = rankFor(value);
  const at = RESONANCE_RANKS[rank - 1];
  const next = rank < MAX_RANK ? RESONANCE_RANKS[rank] : null;
  return {
    value, rank, numeral: rankNumeral(rank), at, next,
    toNext: next == null ? 0 : Math.max(0, next - value),
    progress: next == null ? 1 : Math.max(0, Math.min(1, (value - at) / (next - at))),
  };
}
