# Claude Code — start here (home handoff)

**Updated:** 2026-09-11 by Claude Design Chat  
**Repo:** `HaDeZs530/eldrathor` · Agent split: Design Chat locks + briefs; **you code**; Grok = art.

## First 60 seconds
1. `git pull` on `main`.
2. Read `CLAUDE.md` + `docs/SESSION_LOG.md`.
3. Work the **active briefs** below in order (unless Anthony says otherwise).
4. Open PRs; don't invent LOCKED design — use `// DESIGN-OPEN:` for gaps.

## Active briefs (priority)
1. ~~`2026-09-11_agent-roles-update.md`~~ — DONE (pushed by Design Chat)
2. **`docs/CLAUDE_BRIEFS/2026-09-11_playtest-ux-polish.md`** — pan-only mountain, Explore CTA, character create, AFK copy, Process pick+amounts, Train label.
3. **`docs/CLAUDE_BRIEFS/2026-09-11_island-dotted-path-10-nodes.md`** — if not already on main. Check `IslandWorldMap` before rebuilding.

## Recently DONE (don't redo)
- PR #10 — pannable island + parchment node map
- PR #13 — island path lock/brief (docs/assets)
- PR #16 — node engage Attack/Flee + flee/ambush roll on fight screen
- PR #17 — home handoff + playtest polish brief

## Still OPEN (Anthony deciding / later)
- AFK **root tab** final name (working label **Seam** — do not rename until locked)
- Rally / Prepare-the-bond screen title
- Flee odds numbers; peninsula stamps; combat v2; growth trees
- Design Chat audit of shipped features vs. design doc (Difficulty screen, 10-pin path, Attack/Flee engage) — pending; do not pre-empt.

## Playtest
Phone: `cd app && npm run dev -- --host` → LAN URL. Mountain should pan; zoom off after polish brief.

## Rules reminder
Weapons drop / armor craft; Worldvein currency; tab bar stays during runs; themes crossfade; no new deps without reason.
