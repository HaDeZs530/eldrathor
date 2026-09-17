# NOTE — UI mode ownership: why Player / Party look "brown", and the rule gap behind it
*2026-09-17 · written by Claude Code at Anthony's request · for the Claude Design Chat (Anthony wants a set of rules for how UI is treated)*

## What Anthony saw
Player and Party render in the **Veinharbor** column (near-black warm `#141210` panels, `#5a4a22` gold-brown borders, gold button text). Next to the sapphire Mind View screens that reads as "still brown / the old Town skin". Anthony expected these tabs to have moved off the Town look.

## What the code does, and why (this is not a bug)
- `theme/styleBible.js` `MODE_FOR_SKIN = { mind: 'veinharbor', rpg: 'veinharbor', mountain: 'explore' }` — the Player / Party / Hearth hub skin maps to the Veinharbor column. `theme/world.css` applies the Veinharbor tokens to every non-Mountain hub in WORLD mode.
- That mapping follows two written rulings: the Style Bible column heading **"Veinharbor (Town / Party / Player)"** and Progression Loop lock **§9 (2026-09-14): "Party / Player / Seam use the Veinharbor column with v3 text scale"** (accepted after Claude Code flagged it in the Style Bible PR #52).
- The ORIGINAL dual-mode lock (`Eldrathor_DualMode_Art_Lock.md`, design doc §3c) put Player and Party in **Mind View** (the Vein projection). The Style Bible superseded it without an explicit "Player/Party leave Mind View" line — the change rode in on a column heading, and the ruling that confirmed it was one clause in a list of accepted items.

## The issue underneath
Three documents can each say where a tab's look comes from (dual-mode lock, Style Bible §A, lock-doc rulings), and the newest one wins silently. Anthony never saw a single line that said *"Player and Party change from blue to warm"*, so the shipped result surprised him even though it matched the docs.

## Suggested rules (for the Design Chat to turn into a lock)
1. **One table owns "tab → column".** A single, explicit mapping (tab / stage → Veinharbor | Exploration | Mind View) lives in ONE lock doc and in `MODE_FOR_SKIN` + `TAB_HUB_SKIN`; every other doc references it rather than restating it.
2. **A visual change to a whole screen is its own ruling line**, named by screen ("Player → Veinharbor"), never implied by a heading or bundled into a list.
3. **Briefs that recolour a screen name the before and after** ("Party: Mind View → Veinharbor") and require a phone capture in the PR, so Anthony approves the look, not the token values.
4. **Anthony approves from the phone, not from hex codes.** Any PR that changes a mode mapping ships captures of every affected tab.
5. Until the rule set exists: Claude Code keeps the current mapping and asks before changing any tab's column.

## To flip Player / Party (and Hearth) to Mind View now
One-line change in `app/src/theme/styleBible.js` (`MODE_FOR_SKIN.mind = 'mind'`), plus the §D scopes follow automatically; fight / results / Town / route map unaffected. Claude Code will do it on Anthony's word and log the reversal as a Style Bible amendment.
