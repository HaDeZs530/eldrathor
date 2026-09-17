# UI Brackets — one table owns "screen → bracket" (LOCKED 2026-09-17)

*Author: Claude Design Chat from Anthony's ruling: every tab must transport you into another mode. Supersedes the Style Bible §A column headings and Progression lock §9's "Party / Player / Seam use the Veinharbor column". Adopts the rules in `docs/notes/2026-09-17_ui-mode-ownership.md`.*

## Rules
1. **This table is the only place that says which bracket a screen uses.** `MODE_FOR_SKIN` / `TAB_HUB_SKIN` mirror it; no other doc restates it.
2. Changing any screen's bracket is its own named ruling line here ("Party: Veinharbor → Bond"), never implied.
3. A brief that recolours a screen states before → after and the PR ships a phone capture of every affected screen; Anthony approves from the phone, not from hex.
4. Shared frame stays constant across brackets: header, tab bar, outer gold frame (Style Bible §A). Everything inside the frame is the bracket's.
5. Sheets/cards inherit the bracket beneath them (Style Bible §D), frozen for the sheet's life.

## The six brackets
| Bracket | Screens | Place it evokes | Background / panel | Border | Accent (buttons, chips, active) | Display text | Glow / ambient | Signature motif |
|---|---|---|---|---|---|---|---|---|
| **Veinharbor** | Town + Crafter / Smith / Market / Bag / Recruit | sunlit harbor, wood and rope | bg `#080807`, panel `#141210` | 1 px `#5a4a22` + `#292823` | gold `#e8c46a`, primary button filled `#c9962e` | Cinzel `#f0e2bd` | none (flat sunlight) | wood grain in the outer frame, brass fittings on row chevrons |
| **The Bond** | Party root, Adventurer sheet, character slots, roster/bench | a campfire circle at night — the party around the fire | bg `#0e0a08`, panel `#1c1410` | 1 px copper `#8a5a2b` + `#3a2a1c` | ember `#e0782f`, primary filled `#c9642a` | Cinzel `#f2d9b8` | soft warm firelight glow under cards (the only warm glow in the game), slow ember drift 2–3 particles | slot icons rimmed in copper; HP/MP bars keep game colours |
| **The Veinbinder** | Player root, Bond & Craft trees, Settings | the conduit's own chamber — power held, not projected | bg `#0f0a14`, panel `#1b1220` | 1 px amethyst `#6b4fa0` + silver `#3b3746` | amethyst `#a678f0`, primary filled `#7a55c9`, Worldvein counter here uses `#c9a6ff` | Cinzel `#e6d8f5` | faint violet inner glow on tree nodes only | rune ring watermark behind tree spines |
| **The Hearth** | Hearth root, Gather / Process / Train slots, Offline summary | a workshop and hearth while the party is away | bg `#0a1010`, panel `#121a1a` | 1 px verdigris `#3f8f7a` + bronze `#5a4a2b` | verdigris `#4fb39a`, primary filled `#2f8a72` | Cinzel `#d9ede6` | none; slow smoke wisp behind the header | job cards carry a tool glyph (pick / crucible / training post) |
| **Exploration** | Island map, Rally, Route map + its HUD, cards, run log | a hand-drawn map on a table | parchment `#e8d5b7`, card `#f1e6cf` | 1 px `#8a7350` hand-drawn | teal ink `#345d66`, party gold `#c9962e`, primary filled `#c9962e` | Cinzel ink `#2b2118` | none; paper grain 6% | ink-dotted paths, compass rose, fog wash |
| **Mind View** | Fight, Results, Sanctuary, Ambush/Reveal outcome | seeing through the Vein — cold, remote, electric | gradient `#0c1a2b` → `#152a41`, panel `#1a2b3b`, card `#23353f` | 1 px `#3d6fa8` | Mythros `#2cabf8`; HP `#20a95e`, crit `#f2c14e`, damage `#e5484d` | Cinzel `#dfe9f5` | the only blue glow; crystal noise | crystal facets in the stage frame, glyph-flash innate buttons |

## Transitions
Tab switch = 250 ms crossfade of everything inside the frame; the frame, header and tab bar do not move. Town → Rally/Route → Fight keeps the existing "reaching through the Vein" crossfades. Bond and Hearth get no special transition beyond the crossfade.

## Ruling lines (2026-09-17)
- Party: Veinharbor → **The Bond**.
- Player: Veinharbor → **The Veinbinder**.
- Hearth: Veinharbor → **The Hearth**.
- Bag and Recruit stay **Veinharbor** (they are Town functions). Settings moves to **The Veinbinder** (it's yours).
