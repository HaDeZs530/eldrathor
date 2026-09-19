# BRIEF — M2 lock 3: Player tab — Resonance, ranks, rank-capped Bond & Craft upgrades
**Status:** READY (after the lattice brief) · **Date:** 2026-09-19 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_Growth_Model_Lock.md` §2 (authoritative). Bump `SAVE_VERSION`.

## Deliverables
1. `app/src/player/resonance.js` — `resonance(roster) = Σ √level`, rank thresholds table `RESONANCE_RANKS` (0·8·14·22·32·44·58·74·92·112), pure + tested (the three worked examples from the lock).
2. `app/src/player/upgrades.js` — Bond lines (Vitality, Might, Ward, Tempo, Grace, Keen, Flow) and Craft lines (Yield, Vein, Fortune, Haste, Hearth slots at 4 and 8), per-level effects and cost `50 × 1.25^n`, **level cap = current rank**; all numbers in `PLAYER_TUNING`.
3. Effects applied: Bond → `derive` for every Adventurer; Craft → gather yield, node Worldvein, loot one-up chance, Process time, Hearth slot count.
4. **Player tab** (Mind View): Resonance value + rank + bar to next rank with the threshold; Bond section and Craft section as rows `Might  lvl 3/4  +6% Power  ·  Buy 98 ❖`; Buy disabled with reason (at rank cap / not enough Worldvein). Ranking up lights every row's next level with a brief glow. Remove the placeholder stat tiles (Vein Sense / Will / Resonance 9 / Stash cap) — Resonance is the real number now. Help copy for the Player screen updated.
5. Tests: resonance examples; cap follows rank; cost curve; each line's effect lands where the spec says (one test per line); Hearth slot count at levels 4/8.

PR: `feat(player): resonance ranks + rank-capped Bond/Craft upgrades`
