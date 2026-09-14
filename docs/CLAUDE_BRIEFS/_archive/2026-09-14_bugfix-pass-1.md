# BRIEF — Bug-fix pass 1 (from external code review, verified by Design Chat)

**Status:** DONE (Claude Code, 2026-09-14, PR #46 `fix: bug-fix pass 1 (enemy modifiers, extraction, pointer cancel, theme timers, feed scroll, run-party freeze, AFK ids)`) · **Date:** 2026-09-14 · **Author:** Claude Design Chat (source: ChatGPT source-inspection review, findings verified against main)  
**Scope:** fixes only — no balance changes, no feature expansion, no broad rewrites. Preserve the camera and fight-finish work from PRs #35–#45.

## Confirmed — fix each with a focused regression test
1. **Depth/named modifiers skip normal enemies** — `combat/enemies.js` normal branch returns `units` without `finish()`. Route it through `finish()`. Test: normal spawn at depth 1.0 has ×1.5 hp/dmg; named normal has ×1.3 on top. *(Gameplay bug: locked depth scaling was inert.)*
2. **Double extraction credit** — `AppRoot.extract()` credits then resets 600 ms later. Guard with an `extracting` ref set synchronously on first call; second call is a no-op. Test: two rapid calls → one credit, one reset.
3. **pointercancel selects nodes** — `RouteMapScreen` and `IslandWorldMap` route `onPointerCancel` to `onPointerUp`. Separate handler: cancel clears gesture state and never fires a tap. Track the active `pointerId` and ignore moves/ups from other pointers. Test with two-finger touch: second finger cannot finish/move the first gesture.
4. **Map gesture capture swallows controls** — exclude interactive descendants (buttons, cards, HUD, log icon) from `setPointerCapture`/tap detection: if `event.target.closest('button, [data-no-map-gesture]')`, don't start a map gesture. Verify Explore/Fight/Flee/Extract/log activate once and never on drag.
5. **ThemeProvider timers not cancelled** — store timer ids; clear on every new transition and on unmount, or check a transition token before applying. Test: enter Mind-view and leave within 100 ms → final mode is the current screen's.
6. **Feed auto-scroll stalls at 40** — depend on the last event's `t`/id, not `feed.length`.

## Confirmed-by-structure — fix per the design ruling
7. **Party frozen during a run** (design ruling 2026-09-14): snapshot the fielded party at Rally → Explore into `runParty`; simulate and render from `runParty`; Party-tab swap/promote is disabled while `territory` exists, with the notice "Your bond is on the mountain — change the party at Rally." Health tracked by character id, not index.
8. **AFK one-job rule** — key assignments by a stable character `id` (add ids if missing), not `party:i`; assigning a character to a job clears them from any other job; roster swaps don't reassign. Test: one character cannot hold two jobs; swapping roster members doesn't move an assignment.

## Hygiene (do while there, no behaviour change)
9. One camera owner: cancel any running camera RAF before starting another; cancel all on unmount. Assert no camera writes after unmount in a test.
10. Pure state updaters: move `setX` calls and timers out of updater callbacks in TownScreen sale/scrap, PartyScreen promotion, ThemeProvider, AppRoot fight completion. Keep StrictMode on. Test: one sale/scrap/promotion under StrictMode produces one effect.

## Deliverable
One PR, `fix: bug-fix pass 1 (enemy modifiers, extraction, pointer cancel, theme timers, feed scroll, run-party freeze, AFK ids)`, with a table: finding → fix → test. Anything you could not reproduce: list under "Not reproduced" rather than changing behaviour.
