# Claude Code — start here (home handoff)

**Updated:** 2026-09-11 by Claude Design Chat  
**Repo:** `HaDeZs530/eldrathor` · Agent split: Design Chat locks + briefs; **you code**; Grok = art.

## First 60 seconds
1. `git pull` on `main`.
2. Read `CLAUDE.md` + `docs/SESSION_LOG.md`.
3. Work the **active briefs** below in order (unless Anthony says otherwise).
4. Open PRs; don't invent LOCKED design — use `// DESIGN-OPEN:` for gaps.

## Active briefs (priority)
1. **`docs/CLAUDE_BRIEFS/2026-09-12_route-map-v2.md`** — core loop: web gen, scout/engage/leave, 5 node types, roaming rares + seal, respawns, Rally party-edit + lore. Specs: `Eldrathor_RouteMap_v2_Lock.md`, `Eldrathor_Island_Areas_Lock.md`.
2. **`docs/CLAUDE_BRIEFS/2026-09-12_ui-shell.md`** — island zoom + dotted path, Mind-view scale-up, ? and ☰ on every screen. Spec: `Eldrathor_UI_Shell_Lock.md`.
3. `docs/CLAUDE_BRIEFS/2026-09-11_island-dotted-path-10-nodes.md` — folded into brief 2 (mark DONE when 2 lands).

## Recently DONE (don't redo)
- PR #10 — pannable island + parchment node map
- PR #13 — island path lock/brief (docs/assets)
- PR #16 — node engage Attack/Flee + flee/ambush roll on fight screen
- PR #17 — home handoff + playtest polish brief
- PR #18 — loop cleanup, Rally screen, stat spine
- PR #19 — combat v2
- PR #20 — playtest polish

## Still OPEN (Anthony deciding / later)
- AFK **root tab** final name (working label **Seam** — do not rename until locked)
- Rally / Prepare-the-bond screen title
- Gem tree screen; enemy rosters per area; weapon skill trees (Design Chat specs next)
- Note: A1/A3 were re-ruled 2026-09-12 — scouting replaces cut-flee; all 9 pins are areas (`Eldrathor_Island_Areas_Lock.md`).

## Playtest
Phone: `cd app && npm run dev -- --host` → LAN URL. Mountain should pan; zoom off after polish brief.

## Rules reminder
Weapons drop / armor craft; Worldvein currency; tab bar stays during runs; themes crossfade; no new deps without reason.
