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

## Update — walls tuned against gems and player upgrades (same day)

Wall party = three maxed Epics at the area's level **plus** a matching gem at ~4 imbues per area (40 by the dragon, placeholder Anthony OK'd) **plus** every Bond upgrade its Resonance rank allows. The bot holds the same gem pace and pays for it. 18 s fights, original drop rates.

| Wall definition | Efficient | 2 h/day player |
|---|---|---|
| Epic +10 wins ~60 % (`growth-wall-0.6/`) | ~99 h | 216 h · 102 days |
| Epic +10 wins ~35 % (`growth-wall-0.35/`) | ~109 h | 238 h · 111 days |

- **Gems are the biggest single piece of power.** The same wall party with no imbues wins 0 % from wall 2 on. Bond upgrades matter early (wall 1–3: 60 % → 10–25 % without them) and barely at all later.
- **A flat +10 per tier stops mattering high up.** Tier 9 → 10 is +10 %, less than one rarity rung (+14 %), so last area's Legendary +10 beats the next boss as well as the new tier's Epic +10 (walls 6–10). Walls there are skipped on old gear.
- Still ~100 days against a 150-day target.
