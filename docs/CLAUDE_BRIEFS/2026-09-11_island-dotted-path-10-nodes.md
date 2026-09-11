# BRIEF — Island dotted path (10 nodes, land-hugging)

**Status:** READY for Claude  
**Date:** 2026-09-11  
**Author:** Boss (Grok Bot)

## Goal
Update the Mountain island map so players see a **clear linear route**: numbered pins **1→10** clockwise from harbor to crystal, connected by a **dotted path** that follows land (especially **4→5**, no ocean shortcut).

## Read first
- `docs/Eldrathor_Island_Path_Lock.md` (hotspot table + waypoints)
- `app/public/maps/island-path-sketch-anthony.png` (Anthony SoT sketch)
- `app/public/maps/island-path-refined-preview.png` (Boss land-hug preview)
- Existing `IslandWorldMap.jsx` + `app/public/maps/README.md`

## Requirements
1. Replace / extend current ~7 hotspots with the **10-node table** in the Island Path lock.
2. Render a **dotted polyline** through nodes in order; insert the **4→5 land waypoints** from the lock (path-only).
3. Nudge pin positions slightly onto visible roads/landmarks if needed — keep order and clockwise intent.
4. Keep pan/zoom, warm RPG theme, difficulty → node map flow, tab persistence.
5. Update `app/public/maps/README.md` hotspot table.
6. Do **not** invent engage/flee UI in this PR unless trivial stub — that’s a separate brief.

## Success criteria
- [ ] Dotted path visible 1→10 on portrait phone
- [ ] 4→5 stays on land in the preview sense
- [ ] Pins tappable; locked state still works
- [ ] `npm run build` / playtest on phone via `--host`

## Out of scope
Flee/ambush confirm screen; combat v2; renaming worlds permanently.
