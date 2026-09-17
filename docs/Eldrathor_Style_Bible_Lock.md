# Style Bible — production spec for the approved visual target (LOCKED 2026-09-14)

*Author: Claude Design Chat. Target image: `docs/art/concept/style-target-2026-09-14.png` (ChatGPT concept, Anthony-approved). This doc turns that one composite into (A) UI tokens Claude Code builds chrome from and (B) an asset manifest of individually generated art files. The concept's **text and mechanics are NOT canon** (it shows a seal and party bars in the stage; ignore) — only its look is.*

## A. Three modes, one frame
> **Superseded in part 2026-09-17:** screen → bracket mapping now lives ONLY in `Eldrathor_UI_Brackets_Lock.md` (six brackets). The Veinharbor / Exploration / Mind View token values below still hold; Bond, Veinbinder and Hearth are defined there.

**Shared frame (all modes):** 2 px outer border in antique gold `#b8973f` with a 1 px inner line `#5a4a22`, 10 px radius; app header 57 px with the wordmark **ELDRATHOR** in Cinzel 22 px, letter-spacing 0.08 em, colour `#e6d6a8`; Worldvein counter (crystal glyph + number, Cinzel numerals); `?` and `☰` as 32 px round-outlined icons. Tab bar 76 px, dark slate `#0f151d`, icons 28 px, labels 12 px Cinzel; active tab gold `#e8c46a` with a top hairline.

| | **Veinharbor (Town / Party / Player)** | **Exploration (Route map)** | **Mind View (Fight / Results / cards)** |
|---|---|---|---|
| Tagline | Sunlit wood — home lives here | Parchment — worlds unfold | Sapphire crystal — farther sees |
| Background | near-black warm `#080807` behind panels; wood texture only in the outer frame | parchment `#e8d5b7` with fog `#f3ead9` at 85% over unexplored regions | deep navy `#0c1a2b` → `#152a41` vertical gradient, faint crystal noise |
| Panel fill | `#141210` | parchment card `#f1e6cf`, 1 px `#8a7350` border | `#1a2b3b` (cards `#23353f`), 1 px `#3d6fa8` border with 6 px outer glow `#2cabf8` at 25% |
| Borders | 1 px `#5a4a22` + 1 px `#292823` inner | 1 px `#8a7350`, hand-drawn feel (slight radius 6 px) | 1 px `#3d6fa8`, 8 px radius, glow |
| Display font | Cinzel 26/20 px, `#f0e2bd` | Cinzel 20 px, ink `#2b2118` | Cinzel 20 px, `#dfe9f5` |
| Body font | system UI 16 px, `#c9bfae` | system UI 16 px, ink `#3a2e22` | system UI 16 px, `#b7c6d8` |
| Accent | gold `#e8c46a` | teal ink `#345d66` (cleared), gold `#c9962e` (party ring / Explore) | Mythros `#2cabf8`; HP `#20a95e`; MP `#2cabf8`; crit `#f2c14e`; damage `#e5484d` |
| Buttons | dark panel, gold text | primary = filled gold `#c9962e` with dark text; secondary = parchment outline | outline `#3d6fa8` on `#1a2b3b`; active = gold outline |
| Destination rows | 92 px tall, left 120 px illustration, title Cinzel 22 + subtitle 13 `#a89c88` + chevron | — | — |
| Party cards (fight) | — | — | 3 across, ≥120 px, portrait 64 px in 1 px gold frame, name Cinzel 15, HP/MP bars 14 px, two innate/aura icons 28 px |

Rules: no drop shadows on Town (flat warm); parchment has paper grain at 6% opacity; Mind View is the only mode with glow. Cinzel is loaded once as a webfont; body stays system UI.

## B. Asset manifest — one file each, generated separately
All at **@2x for a 390 pt phone** (widths below are px at 2×), **PNG**, sRGB. Illustrations are **rectangular, opaque**; icons and portraits are **transparent**. Filenames under `app/public/art/`. Generate **one asset per prompt** with the prompt below; never a sheet.

| File | Size (px) | Content | Prompt suffix (prepend the style base) |
|---|---|---|---|
| `veinharbor-hero.png` | 1560×500 | harbor town, ships, mountain + castle behind, warm sun | "painted fantasy harbor town at golden hour, stone quay, timber houses with red roofs, sailing ships, a great mountain with a ruined castle on the summit behind, blue banners, lively market, no text, wide 3:1 crop" |
| `town-party.png` `town-crafter.png` `town-smith.png` `town-market.png` | 240×184 each | row illustrations | party: "three adventurers seen from behind looking at a mountain path" · crafter: "alchemist workbench with glowing potions and a lantern" · smith: "blacksmith's anvil with a glowing blade and sparks" · market: "canopied market stall with fruit, cloth and crates" |
| `island-map.png` | 1560×2400 | the island overview (pin art placed by code) | "top-down painted parchment map of a coastal island with one central mountain, ruined castle on the summit, a harbor at the south-east, forest to the south-west, cliffs west, a ruined town on a north-west peninsula, a ravine north-east, black-sand coast east, forge vents high on the east face; ink linework, muted watercolour, no labels, no pins" |
| `parchment-tile.png` | 1024×1024 | seamless paper texture | "seamless aged parchment paper texture, subtle fibres, warm cream, no marks" |
| `fog-tile.png` | 1024×1024 | seamless fog for unexplored | "seamless soft cloud fog texture, pale cream on transparent, painterly" (transparent) |
| `biome-*.png` ×9 | 1024×1024 each | one per area, painted terrain under the node web | e.g. `biome-gullwatch.png`: "painted map-illustration terrain of a shore forest with tall wrong-coloured trees, coast on one side, ink outlines, parchment tone, no labels" — one per `Eldrathor_Island_Areas_Lock.md` area character |
| `node-*.png` ×8 | 96×96, transparent | unknown rune · fight blades · crystal shard · sanctuary shard · rare skull · boss crown · cleared dot · named rim | "single map icon, ink and watercolour on transparent, <subject>, no background" |
| `party-ring.png` | 128×128, transparent | gold ring + pennant | "thin antique-gold ring with a small gold pennant above, glowing, on transparent" |
| `enemy-<slug>.png` | 1560×720 | fight stage backdrop with the enemy, per enemy type (start with area 1's 4 types + Brinewarden) | "night scene through blue crystal light, <enemy>, ruins, mist, cold sapphire palette, cinematic, no text, 2.2:1" |
| `portrait-<archetype>-<n>.png` | 256×256, transparent | Adventurer portraits, 3 per archetype to start | "bust portrait of a <archetype description>, painted fantasy, cold blue rim light, on transparent" |
| `icon-innate-*.png` ×10, `icon-aura-*.png` ×5 | 96×96, transparent | innate/aura glyphs | "flat glowing sapphire glyph of <shield / leaf / plus / snowflake / spiral>, on transparent" |
| `icon-tab-*.png` ×5 | 96×96, transparent | Player helm · Party trio · Mountain · Town house · Hearth crystal (`icon-tab-hearth.png`) | "flat pale-grey icon of <subject>, single colour, on transparent" |

**Style base (prepend to every prompt):** "Concept art for a fantasy mobile game in the exact style of the reference: painterly with clean ink linework, rich but slightly muted colour, soft light, no photorealism, no text, no watermark, no UI elements."

**Generation rules for Tony:** one asset per image request; upload the target image as the style reference each time; ask for the exact pixel size and "transparent background" where marked; reject anything with baked-in text, borders or UI. Save with the exact filename. Deliver assets in batches by dropping files into `app/public/art/` via Claude Code ("add these art files and commit").

## C. What Claude Code builds vs what art provides
- Code: all frames, panels, borders, glows, fonts, bars, buttons, tab bar, cards, the parchment/fog rendering, node placement, path lines (ink-dotted `#345d66`), camera. **Never** hand-draws illustrations or portraits in CSS/SVG.
- Art files: everything in the manifest. Until a file exists, a styled placeholder renders (flat panel in the mode's colour with the asset name in 11 px), so missing art is obvious on the phone.

## D. Sheets, cards and dialogs inherit the mode underneath them (RULED 2026-09-14)
Every overlay — Help (?), Menu (☰), Settings, Run log, Offline summary, Explore/Reveal/Ambush cards, Sanctuary, Results, roster picker, confirms — takes the **§A column of the screen it opens over**, never a fixed style:
- Over **Town / Party / Player / Hearth** → Veinharbor: `#141210` panel, 1 px `#5a4a22`+`#292823` borders, Cinzel `#f0e2bd` title, gold primary button, no glow.
- Over the **Route map** → Exploration: parchment `#f1e6cf` card, 1 px `#8a7350` hand-drawn border, ink text, gold-filled primary / parchment-outline secondary, paper grain.
- Over **Fight / Results / Sanctuary** (Mind View) → `#1a2b3b` panel, 1 px `#3d6fa8` border with the blue glow, `#dfe9f5` title, outline buttons.
Implementation: the shared `Sheet` reads the active mode from `ThemeProvider` at open time and keeps it until closed (a sheet doesn't re-skin if the theme transitions underneath). Test: open Menu on Town, Route map and Fight → three different panel colours.
