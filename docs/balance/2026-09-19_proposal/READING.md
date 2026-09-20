# How to read the tuning proposal

*Claude Code, 2026-09-20. Companion to `PROPOSAL.md` (generated) and `proposal.json` (raw). **Nothing in the game has been changed.** Rulings it was tuned to: `docs/notes/2026-09-19_progression-rulings.md`.*

## The result in one table

| Player | Hours to the dragon | Days | Reads as |
|---|---|---|---|
| Efficient, 3.5 h/day, three fresh seeds | 201 · 211 · 219 | 57 · 60 · 62 | **2 months** — on target, and stable where the baseline swung 48–135 h |
| Typical, 3.5 h/day | 393 | 111 | 3.7 months — just past the 2–3 month band |
| Casual, 2 h/day | 430 | 207 | **6.9 months — breaks the "not six months without the dragon" rule** |

Every wall falls within a few hours of its target (areas 1–3 ≈ 18 h, areas 4–10 ≈ 22 h), no boss is ever beaten on a first visit, and wipes go from 3 in 24,700 fights to about one run in seven.

## What had to change to get there

1. **Pack health has to rise enormously, and keeps rising.** ×9 in area 1, ×73 in area 4, ×437 in area 9, on top of today's ×1.6 per tier. That is the clearest single finding: **the weapon curve (×1.8 per item tier, then rarity, rating and empower on top) runs away from enemy health.** A proposal that multiplies health by hundreds is a patch. The cleaner fix is to flatten weapon growth so enemy health can grow at a sane rate — the simulator can tune either way.
2. **A level has to be worth more for XP to pace anything.** Today a level is +5 % of *base* power, which is under 2 % late on; with that, walls were timed by gear luck and one seed stalled at 54 hours on a wall meant to take 18. The proposal uses **+10 % compounding per level**. With it the same wall lands within 10 % on every seed. This is what makes "control speed through experience" actually work.
3. **XP per level is priced per area**, from the XP per hour the party really earns there, so each area gives about 4.5 levels in its hours and the dragon is met near level 45. Past an area's level target each further level costs 25 % more, so extra grinding always helps a little less.
4. **Healing is halved** (Mend and Renewal × 0.5). On arrival a pack fight heals back about a quarter to a third of what it takes.
5. **Boss multipliers climb ×4 → ×50** on top of today's ×62 health, with boss damage scaled by the square root so a wall is health and time, never a one-shot.
6. **Gems are off** in this test.

## Where it still misses the rulings

- **Fights get easy inside an area.** Packs are tuned against the arriving party at ~22 s and ~26 % of health lost. By mid-area the average is 6–18 s and 3–15 % lost, because gear inside one item tier roughly triples damage in the first hours. The ruling was "a mid-geared party loses life every fight"; areas 1 and 3 fall short of it (3–4 % lost on average). The real fix is the same as finding 1: slower gear growth inside a tier, so an area's fights stay honest for longer.
- **Healing share drifts up** as fights get easier (82 % healed back on average in area 1). Minimal healing on arrival is not minimal healing all area.
- **The slower players are too slow.** Tuning the *efficient* route to 210 h puts the 2-hour player at seven months. To bring that player under six months the efficient target would need to be about **170–180 h**, which also pulls the typical player back inside three months. Anthony to choose.
- **The economy is untouched.** 4.6 million Worldvein earned against a few thousand of real sinks. Walls are not yet broken by anything Worldvein buys.
- **Armor is still Hearth-timed.** It arrives on a clock, not from play.
- **Level bands overshoot** in places (area 3 ends at 18 against a target of 14) because XP per hour rises as fights shorten. It self-corrects in the next area, but a smoother curve is a second pass.

## Decisions this needs

1. Efficient target: **210 h** (2-hour player ≈ 7 months) or **~175 h** (2-hour player ≈ 5.5 months)?
2. Fix the runaway by **flattening the weapon curve**, or keep ×1.8 per tier and accept very large enemy health numbers?
3. Is **+10 % per level, compounding**, acceptable as what a level is worth?
4. Should **armor materials drop from fights** so walls are broken by playing rather than waiting?

After those, the next pass tunes the chosen levers, adds Worldvein sinks and shard pacing, and turns the curve into one enforced test per wall.

## Rerun

```bash
npm run sim:calibrate
```

About fifteen minutes. `npm run sim:baseline` reruns the untuned baseline.
