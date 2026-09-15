# UI Shell — Island zoom, Mind-view scale, Help & Menu (LOCKED 2026-09-12)

*Author: Claude Design Chat, from Anthony's 2026-09-12 playtest.*

## Island map
- Two zoom states, toggled by a **+ / −** control (bottom-right, above the tab bar): **Close** (current default scale, pan both axes) and **Overview** (island art fitted to the viewport **height**; still wider than the screen, so horizontal pan remains). Crossfade 250 ms; camera keeps the same focal point.
- **Dotted spline path restored** per `Eldrathor_Island_Path_Lock.md` (it was lost in the pan-only polish). Pins 2–10 sit on the spline; harbor at pin 1.

## Mind-view scale
All Mind-view screens (route map HUD, scout card, fight, results) scale up: body text min 16 px, labels min 13 px, numbers 18 px, buttons min 48 px tall, party cards ≥ 96 px tall, feed ≥ 15 px with 1.4 line-height. Define these once as CSS vars in `theme/` (`--mv-text`, `--mv-label`, `--mv-num`, `--mv-tap`) and use them everywhere Mind-view renders.

## Help (?) and Menu (☰) — on every screen
- Top-right of every screen, in the header: **☰** then **?**. 32 px targets. Present on tab roots and every drilled-in screen (Rally, route map, fight, results, town functions, AFK).
- **? = screen help sheet.** Bottom sheet with a title and 3–6 short bullets explaining *this* screen and its systems. Copy lives in `app/src/help/helpText.js` keyed by screen id; the Design Chat owns the copy (first pass in the brief).
- **☰ = quick menu sheet.** Items: Island · Party · Town · Hearth · Player · **Help** (opens the same help sheet for the current screen plus a "Game basics" entry) · Settings (placeholder). During a run, adds **Extract** with a confirm.
- Both sheets are warm on reality screens and Mind-view on projection screens (Dual-mode lock).

## Help copy — first pass (Design Chat; edit in place later)
- **Island map:** "The island. Each pin is an area with its own route map and boss. Beat an area's boss to unlock the next pin — permanently. Tap a pin to rally your party. + / − switches between close and overview."
- **Rally:** "Read the area, pick your three, then Explore. Tap an Adventurer to swap them from your roster."
- **Route map:** "You see only what you've reached. Tap an unknown node to scout it, then Engage or Leave. Every scout or clear moves the clock: cleared nodes can repopulate, and rares roam. Rares are optional hunts with the best loot; the boss is fightable once you find it. Extract any time to bank what you have — the map is gone when you leave."
- **Scout card:** "What's on this node and how it measures against your party. Leave costs nothing but time."
- **Fight:** "Your bond fights for you. Innates fire on their own — watch the buttons. 2× to hurry, Skip to jump to the result."
- **Results:** "What each Adventurer did, what you earned, what dropped. Weapon ratings run 1–100; higher is better and never changes."
- **Party:** "Your roster. Three fight; the rest can train or gather. Archetype is permanent; weapon and gem are swappable."
- **Town:** "Veinharbor. Spend Worldvein: merge weapons at the Upgrade bench, craft armor from gathered materials, trade at the Market."
- **Hearth (AFK):** "Bench Adventurers work while you're away: Gather materials, Process them, or Train to level. One job per Adventurer."
- **Player:** "You — the Veinbinder. Your trees strengthen the whole bond (Bond) or your economy (Craft)."
- **Game basics:** "You are a Veinbinder. You don't fight — your bonded Adventurers do. Send three into an area, explore its route map, hunt the rares if you want their loot, beat the boss. Bring home Worldvein and weapons; spend them to come back stronger. Nothing you earn is ever lost."
