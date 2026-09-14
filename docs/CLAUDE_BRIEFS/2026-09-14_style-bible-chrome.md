# BRIEF — Build the UI chrome to the Style Bible; wire the asset manifest with placeholders

**Status:** READY (run before M1a so the milestone lands on the right skin) · **Date:** 2026-09-14 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_Style_Bible_Lock.md` (authoritative; hex/px values are exact). Reference: `docs/art/concept/style-target-2026-09-14.png`.

## Deliverables
1. `theme/tokens.js` + the three mode stylesheets rewritten to §A: colours, fonts (load Cinzel once), border/glow treatments, button styles, bar heights, tab bar. Remove Press Start 2P and any leftover neon/Chakra styling.
2. Shared components: `Frame` (outer gold frame + header), `Panel` (mode-aware), `PrimaryButton`/`SecondaryButton`, `Bar` (HP/MP 14 px), `DestinationRow` (92 px, 120 px illustration slot), `PartyCard` (fight), `Sheet`. Replace ad-hoc inline styles with these.
3. `app/src/art/manifest.js` listing every file in §B with size and transparency; `<Art name="…">` component that renders the PNG if present or the labelled placeholder; wire every slot: harbor hero, four rows, island map, parchment + fog tiles, biome per area, node icons, party ring, enemy stage per enemy type, portraits, innate/aura icons, tab icons.
4. Route map renders on the parchment/biome/fog stack with ink-dotted path lines; node icons from the manifest.
5. Fight stage uses `enemy-<slug>` backdrop with enemy HP bar overlaid at top; party cards per §A.

## Test plan (phone)
Side-by-side with the reference: Town, route map and fight each read as the same design language; every missing asset shows a labelled placeholder (list them in the PR); no Press Start 2P anywhere; Cinzel titles everywhere; build + tests green.

PR: `feat(ui): style bible chrome + art manifest with placeholders`
