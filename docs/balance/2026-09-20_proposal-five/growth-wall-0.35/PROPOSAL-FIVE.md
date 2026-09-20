# Five-rung proposal — measured by the simulator

*Generated 2026-09-20 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 6 % · Legendary 1.0 % · Mythic 0.3 %; areas 4–6 3.5 % · 0.3 % · 0.05 %; areas 7–10 2 % · 0.05 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 35 % of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~18 s and loses ~12 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor is left out of this pass; every party member holds a matching gem with about 4 imbues per area (40 by the dragon), and the wall party has every Bond upgrade its Resonance rank allows.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 1.9 | 1 | 20 | 1 | 1 | 1 → 1 (5) | T1 Epic +10 · T1 Legendary +10 · T1 Legendary +10 |
| 2 | 12.8 | 10.8 | 4 | 87 | 2 | 1 | 1 → 10 (9) | T2 Legendary +10 · T2 Mythic +10 · T2 Mythic +10 |
| 3 | 12.8 | 16.8 | 9 | 137 | 10 | 3 | 10 → 15 (14) | T3 Legendary +10 · T3 Mythic +10 · T3 Mythic +10 |
| 4 | 16 | 5.1 | 10 | 48 | 7 | 1 | 15 → 16 (18) | T3 Legendary +10 · T3 Mythic +10 · T3 Mythic +10 |
| 5 | 16 | 14.8 | 14 | 131 | 10 | 3 | 16 → 24 (23) | T5 Epic +10 · T5 Legendary +10 · T5 Mythic +10 |
| 6 | 16 | 6.6 | 16 | 64 | 6 | 1 | 24 → 25 (27) | T5 Epic +10 · T5 Legendary +10 · T5 Mythic +10 |
| 7 | 16 | 23.7 | 23 | 161 | 15 | 12 | 25 → 35 (32) | T7 Epic +10 · T5 Legendary +10 · T5 Mythic +10 |
| 8 | 16 | 13 | 26 | 80 | 3 | 4 | 35 → 35 (36) | T7 Epic +10 · T8 Epic +10 · T5 Mythic +10 |
| 9 | 16 | 5.1 | 28 | 24 | 3 | 3 | 35 → 40 (41) | T7 Epic +10 · T8 Epic +10 · T9 Epic +10 |
| 10 | 16 | 15.2 | 32 | 75 | 2 | 3 | 40 → 45 (45) | T10 Epic +10 · T10 Mythic +10 · T9 Epic +10 |
| **Total** | **150** | **113.0** | 32 | 827 | 59 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 209 | 11 | 4 | 0 | 0.6 h | 1.9 h |
| 2 | 1230 | 94 | 12 | 6 | 1 h | 2.1 h |
| 3 | 1917 | 133 | 28 | 5 | 16.3 h | 16.3 h |
| 4 | 502 | 22 | 4 | 0 | never | never |
| 5 | 1664 | 79 | 10 | 1 | 6.5 h | 6.5 h |
| 6 | 690 | 33 | 2 | 0 | never | never |
| 7 | 2556 | 71 | 0 | 0 | never | never |
| 8 | 1342 | 37 | 0 | 0 | never | never |
| 9 | 531 | 12 | 0 | 0 | never | never |
| 10 | 1729 | 40 | 1 | 1 | never | never |
| **Total** | 12370 | 532 | 61 | 13 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | … 3 levels under | … no gem imbues | … upgrades as bought on arrival | Last tier Legendary +10 | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 20 % | 10 % | **40 %** | 7 % | 17 % | 7 % | 57 % | 57 % | 77 % | 59 s |
| 2 | 0 % | 0 % | **37 %** | 0 % | 0 % | 0 % | 0 % | 63 % | 77 % | 37 s |
| 3 | 0 % | 0 % | **33 %** | 0 % | 0 % | 3 % | 0 % | 83 % | 90 % | 52 s |
| 4 | 0 % | 0 % | **27 %** | 0 % | 0 % | 27 % | 0 % | 60 % | 77 % | 55 s |
| 5 | 0 % | 0 % | **30 %** | 0 % | 0 % | 7 % | 3 % | 60 % | 90 % | 42 s |
| 6 | 10 % | 3 % | **37 %** | 0 % | 0 % | 37 % | 30 % | 57 % | 77 % | 46 s |
| 7 | 7 % | 7 % | **33 %** | 0 % | 0 % | 33 % | 33 % | 63 % | 73 % | 48 s |
| 8 | 20 % | 13 % | **50 %** | 7 % | 0 % | 50 % | 50 % | 63 % | 73 % | 55 s |
| 9 | 23 % | 23 % | **37 %** | 10 % | 0 % | 37 % | 40 % | 50 % | 50 % | 53 s |
| 10 | 33 % | 27 % | **37 %** | 20 % | 0 % | 27 % | 40 % | 47 % | 53 % | 32 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 16 s, −14 % | 18 s, −14 % | 11.6 s, −7 % |
| 2 | 23.6 s, −19 % | 17.9 s, −12 % | 11.1 s, −3 % |
| 3 | 21.4 s, −20 % | 17.9 s, −12 % | 12.5 s, −4 % |
| 4 | 19.4 s, −14 % | 17.9 s, −12 % | 13.8 s, −5 % |
| 5 | 19.9 s, −17 % | 17.9 s, −11 % | 12.9 s, −4 % |
| 6 | 17.9 s, −14 % | 17.9 s, −13 % | 14 s, −6 % |
| 7 | 19.4 s, −17 % | 17.9 s, −12 % | 13.5 s, −4 % |
| 8 | 17.2 s, −13 % | 17.9 s, −12 % | 15.2 s, −4 % |
| 9 | 17.5 s, −14 % | 17.9 s, −12 % | 15.5 s, −4 % |
| 10 | 17.9 s, −15 % | 17.9 s, −12 % | 13.6 s, −1 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 11.189 | 1.949 | 2.4918 | 1.5786 | 5,346 |
| 2 | 16.138 | 1.212 | 2.9664 | 1.7223 | 3,406 |
| 3 | 20.46 | 1.454 | 3.723 | 1.9295 | 11,105 |
| 4 | 20.592 | 1.212 | 2.9822 | 1.7269 | 28,245 |
| 5 | 18.144 | 0.999 | 2.7695 | 1.6642 | 15,342 |
| 6 | 16.91 | 0.956 | 2.0065 | 1.4165 | 65,013 |
| 7 | 13.895 | 0.831 | 1.9439 | 1.3943 | 39,480 |
| 8 | 13.589 | 0.77 | 1.4309 | 1.1962 | 444,612 |
| 9 | 10.5 | 0.767 | 1.0929 | 1.0454 | 100,950 |
| 10 | 9.286 | 0.698 | 1.0644 | 1.0317 | 192,816 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 109.1 | 31 | 779 | 44 | 73 | 16 |
| Efficient | 2 | yes | 109.3 | 31 | 782 | 42 | 60 | 16 |
| Casual (2 h) | 1 | yes | 238.3 | 111 | 873 | 46 | 57 | 15 |