# Five-rung proposal — measured by the simulator

*Generated 2026-09-20 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 3 % · Legendary 0.5 % · Mythic 0.1 %; areas 4–6 1.8 % · 0.1 % · 0.03 %; areas 7–10 1 % · 0.03 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 60 % of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~18 s and loses ~12 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor and gems are left out of this pass.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 2 | 1 | 20 | 2 | 1 | 1 → 1 (5) | T1 Rare +10 · T1 Legendary +10 · T1 Epic +10 |
| 2 | 12.8 | 7.1 | 3 | 78 | 13 | 1 | 1 → 7 (9) | T2 Epic +10 · T2 Legendary +10 · T2 Epic +10 |
| 3 | 12.8 | 7.8 | 5 | 84 | 12 | 2 | 7 → 12 (14) | T3 Legendary +10 · T3 Mythic +10 · T3 Legendary +10 |
| 4 | 16 | 3.7 | 6 | 48 | 8 | 1 | 12 → 13 (18) | T3 Legendary +10 · T3 Mythic +10 · T3 Legendary +10 |
| 5 | 16 | 9.5 | 9 | 100 | 12 | 1 | 13 → 21 (23) | T5 Epic +10 · T3 Mythic +10 · T5 Epic +10 |
| 6 | 16 | 9.6 | 12 | 114 | 16 | 1 | 21 → 24 (27) | T5 Epic +10 · T6 Epic +10 · T5 Epic +10 |
| 7 | 16 | 16.8 | 16 | 197 | 23 | 3 | 24 → 34 (32) | T7 Epic +10 · T6 Epic +10 · T7 Epic +10 |
| 8 | 16 | 8.5 | 19 | 113 | 12 | 1 | 34 → 35 (36) | T7 Epic +10 · T8 Epic +10 · T7 Epic +10 |
| 9 | 16 | 11.8 | 22 | 165 | 28 | 1 | 35 → 39.7 (41) | T7 Epic +10 · T8 Epic +10 · T9 Epic +10 |
| 10 | 16 | 9.6 | 25 | 130 | 27 | 2 | 39.7 → 43.7 (45) | T10 Epic +10 · T8 Epic +10 · T9 Epic +10 |
| **Total** | **150** | **86.4** | 25 | 1049 | 153 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 226 | 5 | 4 | 0 | never | never |
| 2 | 733 | 23 | 5 | 0 | 0.7 h | 2.1 h |
| 3 | 847 | 31 | 9 | 2 | 0.7 h | 2 h |
| 4 | 356 | 7 | 0 | 0 | never | never |
| 5 | 952 | 23 | 1 | 0 | never | never |
| 6 | 943 | 25 | 1 | 1 | never | never |
| 7 | 1577 | 21 | 0 | 0 | never | never |
| 8 | 802 | 7 | 0 | 0 | never | never |
| 9 | 1144 | 15 | 0 | 0 | never | never |
| 10 | 926 | 16 | 0 | 0 | never | never |
| **Total** | 8506 | 173 | 20 | 3 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | Epic +10, 3 levels under | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|
| 1 | 23 % | 10 % | **60 %** | 13 % | 80 % | 93 % | 52 s |
| 2 | 10 % | 0 % | **60 %** | 0 % | 87 % | 97 % | 47 s |
| 3 | 23 % | 7 % | **63 %** | 7 % | 90 % | 97 % | 44 s |
| 4 | 10 % | 3 % | **60 %** | 0 % | 83 % | 97 % | 55 s |
| 5 | 20 % | 7 % | **60 %** | 13 % | 87 % | 90 % | 34 s |
| 6 | 3 % | 0 % | **60 %** | 0 % | 87 % | 97 % | 49 s |
| 7 | 0 % | 0 % | **57 %** | 0 % | 77 % | 80 % | 42 s |
| 8 | 23 % | 3 % | **57 %** | 0 % | 70 % | 90 % | 39 s |
| 9 | 23 % | 0 % | **63 %** | 3 % | 70 % | 93 % | 40 s |
| 10 | 27 % | 7 % | **57 %** | 17 % | 73 % | 97 % | 37 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 15.3 s, −13 % | 18 s, −14 % | 11.7 s, −6 % |
| 2 | 23.8 s, −19 % | 18 s, −12 % | 13.7 s, −6 % |
| 3 | 21.3 s, −18 % | 18 s, −12 % | 12.6 s, −6 % |
| 4 | 19.5 s, −15 % | 18 s, −12 % | 15.3 s, −7 % |
| 5 | 19.9 s, −15 % | 17.9 s, −12 % | 14.8 s, −6 % |
| 6 | 18.1 s, −14 % | 18 s, −12 % | 15.7 s, −7 % |
| 7 | 18.5 s, −14 % | 18 s, −12 % | 15.6 s, −7 % |
| 8 | 16.4 s, −11 % | 18.1 s, −12 % | 15.3 s, −7 % |
| 9 | 17.5 s, −14 % | 18.1 s, −12 % | 14.5 s, −7 % |
| 10 | 16.7 s, −12 % | 18 s, −12 % | 14.5 s, −7 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 9.871 | 1.707 | 1.9033 | 1.3796 | 5,303 |
| 2 | 14.982 | 1.052 | 2.1379 | 1.4621 | 3,198 |
| 3 | 15.972 | 0.926 | 1.8933 | 1.376 | 5,793 |
| 4 | 14.56 | 0.739 | 1.5904 | 1.2611 | 12,950 |
| 5 | 11.824 | 0.537 | 1.2472 | 1.1168 | 9,872 |
| 6 | 11.079 | 0.508 | 1.0872 | 1.0427 | 28,039 |
| 7 | 8.971 | 0.403 | 0.8801 | 0.9381 | 27,065 |
| 8 | 7.797 | 0.352 | 0.5922 | 0.7695 | 196,406 |
| 9 | 5.833 | 0.277 | 0.4499 | 0.6708 | 91,907 |
| 10 | 4.742 | 0.216 | 0.3365 | 0.5801 | 134,696 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 85.1 | 24 | 1040 | 119 | 21 | 5 |
| Efficient | 2 | yes | 87.3 | 25 | 981 | 112 | 30 | 8 |
| Casual (2 h) | 1 | yes | 209.3 | 100 | 1111 | 93 | 21 | 5 |