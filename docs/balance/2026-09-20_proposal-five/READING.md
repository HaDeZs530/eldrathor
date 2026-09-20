# Five-rung item model — four simulator runs

*Claude Code, 2026-09-20. Simulator only; nothing in the game changed. Target: the 2-hour player at the dragon in ~5 months (~300 h; efficient ~150 h).*

| Run | Packs as played | Efficient | 2 h/day player |
|---|---|---|---|
| 12 s fights | 7–10 s | ~80 h | 155 h · 75 days |
| 18 s fights | 11–16 s | ~91 h | 180 h · 86 days |
| 25 s fights | 15–22 s | ~89 h | 171 h · 81 days |
| 18 s, Epic/Legendary/Mythic rates halved | 12–16 s | ~86 h | 209 h · 100 days |

- Fight length barely moves the total. Halving drop rates barely moves it either.
- The wall rule holds (Rare +10 0–33 %, Epic +10 ~60 %, Legendary +10 70–90 %) but walls fall at about half their target hours: last area's Legendary/Mythic or Epic +10 plus sanctuary boosts is already enough for a ~60 % boss, and the bot gets many tries.
- Levels undershoot in places (area 1 ends at level 1; wall 4 L12→13) — the wall falls before the XP target is reached.
- Early areas hand out Legendary/Mythic +10 within hours.
- Assumed, not ruled: upgrade cost (level n = n spare same-tier weapons + 20 × tier × n Worldvein), +4 % per level compounding, armor and gems off.

Next lever to test: a harder wall (maxed Epic set wins ~35 %, or only at the area's level target), not rarer drops.

Rerun: `PACK_SEC=18 RATE_SCALE=1 node scripts/sim/calibrateFive.mjs <outDir> 150` from `app/`.
