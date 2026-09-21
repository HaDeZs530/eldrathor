# Five-rung proposal — measured by the simulator

*Generated 2026-09-21 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 6 % · Legendary 1.0 % · Mythic 0.3 %; areas 4–6 3.5 % · 0.3 % · 0.05 %; areas 7–10 2 % · 0.05 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 60 % of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~18 s and loses ~20 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor is left out of this pass; every party member holds a matching gem with about 4 imbues per area (40 by the dragon), and the wall party has every Bond upgrade its Resonance rank allows.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 1.6 | 1 | 33 | 7 | 2 | 1 → 1 (5) | T1 Rare +10 · T1 Legendary +7 · T1 Legendary +7 |
| 2 | 12.8 | 3.6 | 2 | 37 | 3 | 1 | 1 → 4 (9) | T2 Epic +10 · T2 Mythic +10 · T2 Legendary +10 |
| 3 | 12.8 | 8.4 | 4 | 93 | 20 | 5 | 4 → 11 (14) | T3 Legendary +10 · T2 Mythic +10 · T3 Mythic +10 |
| 4 | 16 | 10.9 | 7 | 113 | 15 | 1 | 11 → 16 (18) | T3 Legendary +10 · T4 Legendary +10 · T3 Mythic +10 |
| 5 | 16 | 10.8 | 10 | 159 | 26 | 2 | 16 → 22 (23) | T5 Epic +10 · T5 Mythic +10 · T5 Legendary +10 |
| 6 | 16 | 22.2 | 17 | 305 | 51 | 2 | 22 → 29 (27) | T5 Epic +10 · T5 Mythic +10 · T5 Legendary +10 |
| 7 | 16 | 9.2 | 19 | 85 | 11 | 5 | 29 → 30.7 (32) | T7 Epic +10 · T5 Mythic +10 · T7 Epic +10 |
| 8 | 16 | 25.4 | 26 | 162 | 6 | 3 | 30.7 → 39 (36) | T7 Epic +10 · T8 Epic +10 · T7 Epic +10 |
| 9 | 16 | 14.1 | 30 | 100 | 15 | 1 | 39 → 41 (41) | T9 Epic +10 · T9 Legendary +10 · T9 Epic +10 |
| 10 | 16 | 4.9 | 32 | 24 | 1 | 2 | 41 → 42 (45) | T10 Legendary +10 · T9 Legendary +10 · T10 Legendary +10 |
| **Total** | **150** | **111.1** | 32 | 1111 | 155 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 145 | 8 | 4 | 0 | 0.1 h | never |
| 2 | 357 | 36 | 4 | 1 | 2.6 h | 2.6 h |
| 3 | 886 | 60 | 13 | 5 | never | never |
| 4 | 1151 | 58 | 7 | 0 | never | never |
| 5 | 1025 | 48 | 2 | 1 | 10.2 h | 10.2 h |
| 6 | 2156 | 107 | 4 | 0 | never | never |
| 7 | 882 | 11 | 1 | 0 | never | never |
| 8 | 2652 | 79 | 2 | 0 | never | never |
| 9 | 1444 | 32 | 1 | 0 | 10.8 h | 10.8 h |
| 10 | 564 | 15 | 4 | 0 | never | never |
| **Total** | 11262 | 454 | 42 | 7 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | … 3 levels under | … no gem imbues | … upgrades as bought on arrival | Last tier Legendary +10 | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 10 % | 0 % | **60 %** | 17 % | 27 % | 20 % | 100 % | 100 % | 100 % | 77 s |
| 2 | 0 % | 0 % | **63 %** | 0 % | 13 % | 33 % | 67 % | 100 % | 100 % | 68 s |
| 3 | 0 % | 0 % | **60 %** | 0 % | 0 % | 10 % | 17 % | 100 % | 100 % | 74 s |
| 4 | 0 % | 0 % | **60 %** | 0 % | 0 % | 37 % | 37 % | 90 % | 100 % | 87 s |
| 5 | 0 % | 0 % | **63 %** | 0 % | 0 % | 63 % | 30 % | 97 % | 100 % | 86 s |
| 6 | 0 % | 0 % | **63 %** | 0 % | 0 % | 63 % | 3 % | 100 % | 100 % | 111 s |
| 7 | 0 % | 0 % | **67 %** | 3 % | 0 % | 67 % | 57 % | 97 % | 100 % | 280 s |
| 8 | 0 % | 0 % | **63 %** | 0 % | 0 % | 63 % | 3 % | 100 % | 100 % | 299 s |
| 9 | 0 % | 0 % | **77 %** | 0 % | 0 % | 77 % | 0 % | 100 % | 100 % | 259 s |
| 10 | 0 % | 0 % | **57 %** | 0 % | 0 % | 57 % | 0 % | 100 % | 100 % | 239 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 16 s, −15 % | 18 s, −20 % | 11.8 s, −10 % |
| 2 | 19.4 s, −24 % | 18 s, −21 % | 14.1 s, −6 % |
| 3 | 21.6 s, −32 % | 17.9 s, −21 % | 12.1 s, −5 % |
| 4 | 20.4 s, −24 % | 18 s, −20 % | 13.1 s, −6 % |
| 5 | 20 s, −23 % | 18 s, −20 % | 14.3 s, −8 % |
| 6 | 19.1 s, −21 % | 18.1 s, −20 % | 13.7 s, −7 % |
| 7 | 19 s, −21 % | 18 s, −20 % | 15.1 s, −7 % |
| 8 | 18.7 s, −21 % | 18 s, −20 % | 13.6 s, −4 % |
| 9 | 17.4 s, −19 % | 18.1 s, −21 % | 13.7 s, −5 % |
| 10 | 18.1 s, −19 % | 18 s, −20 % | 13.3 s, −2 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 11.188 | 3.199 | 2.5994 | 2.1473 | 4,702 |
| 2 | 12.992 | 2.484 | 2.7695 | 2.2591 | 3,148 |
| 3 | 12.643 | 2.871 | 3.5501 | 2.7555 | 4,094 |
| 4 | 12.333 | 3.067 | 3.1773 | 2.5215 | 11,258 |
| 5 | 10.93 | 3.171 | 2.9198 | 2.3566 | 14,429 |
| 6 | 9.56 | 3.362 | 2.505 | 2.0847 | 31,303 |
| 7 | 8.086 | 3.863 | 2.5721 | 2.1293 | 77,128 |
| 8 | 5.762 | 3.588 | 2.0932 | 1.8057 | 64,242 |
| 9 | 4.735 | 5.167 | 1.2672 | 1.2086 | 274,725 |
| 10 | 3.242 | 4.626 | 1.2472 | 1.1933 | 248,843 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 116.3 | 33 | 1191 | 178 | 43 | 10 |
| Efficient | 2 | yes | 119.5 | 34 | 1193 | 165 | 38 | 14 |
| Casual (2 h) | 1 | yes | 205.1 | 98 | 1044 | 139 | 32 | 5 |