# Tuning proposal — ten walls, ~210 hours, measured by the simulator

*Generated 2026-09-20 by `app/scripts/sim/calibrate.mjs`. **Nothing in the game has been changed.** These are the multipliers, on top of today's formulas, that make the mountain play to the rulings below. They are a proposal for Anthony and the Design Chat to rule on.*

## The rulings this was tuned to (Anthony, 2026-09-19)

- **Ten walls**: the nine area bosses, then the dragon above the King. Every boss is a wall.
- **~210 hours** on the efficient route. Areas take equal time; the first three about 20 % less: **17.9 h** each for areas 1–3, **22.3 h** each for areas 4–10.
- A pack fight is **watchable (aim ~10 s mid-area; ~22 s on arrival)** and **costs life (aim ~12 % mid-area; ~26 % on arrival)**; **healing is minimal** (a fight heals back no more than about a third of what it takes), so sanctuaries pace a run.
- **XP paces the levels**: about 4.5 levels per area, so the party meets the dragon near level 45. **A level is worth +10 % compounding in this proposal** (today: +5 % of base, which is under 2 % late on — too little for XP to pace a wall).
- Zones are **ground repeatedly**; that is the game.
- Gems are **off** for this test (acquisition is being redesigned around shards).

## 1. Result, area by area (the calibration playthrough, efficient route)

| Wall | Target h | Played h | Day cleared | Runs | Wipes | Boss tries | Boss won on first visit | Level in → out (target) |
|---|---|---|---|---|---|---|---|---|
| 1 Gullwatch Trail | 17.9 | 17.8 | 5 | 193 | 12 | 1 | 0 % | 1 → 6 (5) |
| 2 The Saltcliffs | 17.9 | 11.6 | 9 | 283 | 45 | 1 | 0 % | 6 → 8 (9) |
| 3 Drowned Quay | 17.9 | 22.2 | 15 | 260 | 33 | 4 | 0 % | 8 → 18 (14) |
| 4 Serpent’s Stair | 22.3 | 28.2 | 23 | 448 | 80 | 2 | 0 % | 18 → 19 (18) |
| 5 Ashfall Strand | 22.3 | 21.5 | 29 | 266 | 35 | 1 | 0 % | 19 → 25 (23) |
| 6 The Hollow Ward | 22.3 | 24.8 | 36 | 462 | 85 | 1 | 0 % | 25 → 27 (27) |
| 7 The Temple Forge | 22.3 | 18.4 | 41 | 200 | 28 | 1 | 0 % | 27 → 34 (32) |
| 8 The Bastion | 22.3 | 25.2 | 48 | 363 | 39 | 1 | 0 % | 34 → 36.7 (36) |
| 9 The Worldforge | 22.3 | 21.3 | 54 | 238 | 20 | 1 | 0 % | 36.7 → 42.3 (41) |
| 10 Above the Worldforge (Vaelyx) | 22.3 | 20.3 | 60 | 282 | 37 | 1 | 0 % | 42.3 → 45.3 (45) |
| **Total** | **210** | **211.3** | day 60 | 2995 | 414 | | | |

## 2. What a fight feels like

| Wall | Pack fight on arrival | Life lost on arrival | Pack fight, area average | Life lost, area average | Healed back | Boss fight | Sanctuaries used / run |
|---|---|---|---|---|---|---|---|
| 1 | 22 s | 28 % | 5.5 s | 3 % | 82 % | 45 s | 2.0 |
| 2 | 22 s | 26 % | 18.8 s | 15 % | 44 % | 76 s | 0.4 |
| 3 | 22 s | 26 % | 7.5 s | 4 % | 53 % | 37 s | 1.7 |
| 4 | 22 s | 26 % | 11.6 s | 8 % | 31 % | 65 s | 1.0 |
| 5 | 22 s | 26 % | 10.1 s | 6 % | 35 % | 44 s | 1.4 |
| 6 | 22.1 s | 24 % | 10.8 s | 9 % | 23 % | 41 s | 0.8 |
| 7 | 23.3 s | 20 % | 14.1 s | 6 % | 38 % | 35 s | 1.4 |
| 8 | 23.4 s | 20 % | 14 s | 8 % | 28 % | 37 s | 1.0 |
| 9 | 25 s | 20 % | 17.8 s | 7 % | 38 % | 37 s | 0.9 |
| 10 | 22.6 s | 22 % | 11.6 s | 7 % | 25 % | 36 s | 0.8 |

## 3. The numbers proposed

**Healing:** Mend and Renewal × **0.5**.

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level in this band | XP / hour / member |
|---|---|---|---|---|---|---|
| 1 | 8.939 | 2.27 | 4.0365 | 2.0091 | 7,180 | 1,605 |
| 2 | 32.521 | 2.103 | 4.4304 | 2.1049 | 9,579 | 1,605 |
| 3 | 23.804 | 1.684 | 7.746 | 2.7832 | 6,808 | 2,282 |
| 4 | 72.55 | 2.724 | 13.5427 | 3.68 | 92,398 | 4,143 |
| 5 | 91.713 | 2.345 | 17.9069 | 4.2317 | 32,581 | 5,844 |
| 6 | 165.096 | 2.695 | 21.5723 | 4.6446 | 101,494 | 9,103 |
| 7 | 251.754 | 1.623 | 28.524 | 5.3408 | 50,533 | 11,330 |
| 8 | 326.064 | 2.223 | 31.3075 | 5.5953 | 199,023 | 17,850 |
| 9 | 436.606 | 1.823 | 37.716 | 6.1413 | 121,855 | 27,322 |
| 10 | 429.616 | 2.632 | 49.8701 | 7.0619 | 364,692 | 49,062 |

*All multipliers sit on top of today's enemy formula (health ×1.6 and damage ×1.45 per tier; boss ×62 health, ×7 damage). Boss damage is scaled by the square root of the health multiplier so a wall is health and time, never a one-shot.*

## 4. What the party wore at each wall

| Wall | Weapons | Armor pieces / member | Avg max HP | Party DPS |
|---|---|---|---|---|
| 1 | T1 Legendary +100 · T1 Artifact +100 · T1 Legendary +100 | 0.0 | 398 | 253 |
| 2 | T1 Legendary +100 · T1 Artifact +100 · T1 Legendary +100 | 0.0 | 482 | 306 |
| 3 | T2 Artifact +100 · T2 Artifact +100 · T2 Legendary +100 | 0.0 | 1,274 | 1,553 |
| 4 | T3 Artifact +100 · T3 Artifact +100 · T3 Legendary +100 | 0.0 | 1,427 | 3,218 |
| 5 | T4 Legendary +100 · T4 Artifact +100 · T4 Legendary +100 | 0.0 | 2,528 | 9,586 |
| 6 | T5 Artifact +100 · T5 Artifact +100 · T5 Legendary +100 | 0.0 | 3,059 | 23,084 |
| 7 | T5 Artifact +100 · T5 Artifact +100 · T5 Artifact +100 | 0.0 | 5,961 | 49,269 |
| 8 | T6 Artifact +100 · T6 Artifact +100 · T6 Legendary +100 | 0.0 | 7,625 | 103,401 |
| 9 | T6 Artifact +100 · T6 Artifact +100 · T6 Legendary +100 | 0.0 | 13,568 | 180,422 |
| 10 | T7 Artifact +100 · T7 Artifact +100 · T7 Legendary +100 | 0.0 | 18,059 | 429,274 |

## 5. Does it hold on other seeds and other players?

| Play style | Seed | Cleared | Play hours | Days | Wipes | Hours per wall |
|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 210.5 | 60 | 412 | 18.9 · 14.5 · 15.4 · 32.2 · 20.3 · 24.4 · 24.8 · 15.8 · 22.9 · 21.2 |
| Efficient | 2 | yes | 218.8 | 62 | 434 | 16 · 20.1 · 18.1 · 28.2 · 22 · 20.9 · 22.5 · 20.6 · 24.9 · 25.5 |
| Efficient | 3 | yes | 200.6 | 57 | 410 | 18.2 · 7.6 · 20.4 · 31.8 · 21.5 · 20.5 · 22.6 · 20.2 · 18 · 19.8 |
| Typical | 1 | yes | 392.5 | 111 | 418 | 23.3 · 38.2 · 26.8 · 62.4 · 32.8 · 40.5 · 50.3 · 24.6 · 37.1 · 56.6 |
| Casual (2 h) | 1 | yes | 430.1 | 207 | 380 | 31.9 · 31.3 · 41.1 · 53.8 · 47.6 · 38.3 · 58.7 · 32.5 · 58.6 · 36.2 |

## 6. Economy during the calibration playthrough (not tuned in this pass)

Worldvein earned 2,918,838 ❖ · spent empower 56,461, upgrades 6,768, process 2,523,585 · banked 332,104 ❖ · Resonance rank 6 of 10.

## 7. How the bot plays

- Play time counts fight playback at the chosen speed plus a results pause, 0.9 s per travel hop, a fixed decision time per node and a fixed town visit per run. Reading, idling in menus and breaks are not counted.
- The bot always fights an ambush (it never rolls to flee) and never flees a fight it chose.
- The bot judges a boss or a rare by dry-running it with the game's own resolver, like the threat badge does, and acts on that.
- Any Adventurer may wield any weapon type (as the game allows today); the bot gives each the weapon with the best damage per second, and keeps a shield-or-greatsword on the tank when one is within reach.
- Armor is crafted the moment materials allow a better piece; the rating roll is the game's own 1–100.
- The Hearth runs all 24 h: during the idle hours every Adventurer can hold a job, during play only the bench can. Process is budgeted to a share of banked Worldvein so it cannot drain the account.
- Only the three free recruits are hired. Recruits arrive at level 1 and are raised by Train.
- Areas 2–10 use the placeholder enemy formula (same units scaled by tier); there are no per-area rosters yet. The dragon's area reuses the top-tier map generator.
- No events, no daily rewards, no market purchases — none exist in the game yet.