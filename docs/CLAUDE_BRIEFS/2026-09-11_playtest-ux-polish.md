# BRIEF — Playtest UX polish (Mountain / Party / Seam)

**Status:** READY for Claude  
**Date:** 2026-09-11  
**Author:** Boss (Grok Bot)  
**Handoff:** See also `docs/CLAUDE_HOME_HANDOFF.md`

## Goal
Ship the playtest UX batch Anthony locked (names that are still OPEN stay as working labels).

## Read first
- `CLAUDE.md`, `docs/GROK_BOT_SESSION_LOG.md`, `docs/Eldrathor_AFK_Town_Lock.md`
- `IslandWorldMap`, difficulty/confirm UI, Party create flow, `AfkScreen` (Gather / Process / Idle)

## Requirements

### 1) Mountain island — pan only
- **Disable zoom** (pinch/wheel/buttons). Keep **panning** only.
- Start view still harbor-centered as today.

### 2) Difficulty / embark CTA copy
- Replace **Confirm** (or equivalent) with **`Explore`** (alt acceptable: Begin / Embark — prefer **Explore**).
- “Prepare the bond” style title: if present, rename toward **`Rally`** (or leave a clear `DESIGN-OPEN` comment if multiple strings exist — Anthony still soft on final wording).

### 3) Create new character
- **Character creation screen**: player picks a **class** and enters a **name**, then confirms.
- Don’t dump a nameless/classless unit into the roster.
- Use existing class list from design/code; Mind-view chrome.

### 4) Seam (AFK) tab — copy + Train
- **Do not** rename the root tab away from **Seam** (final name OPEN).
- Rename the **Idle** sub-tab label to **`Train`** (same Idle/Train catch-up job; label only unless code keys need an alias).
- Add **more plain-language info** on Gather / Process / Train: what the job does, what you get, what’s spent (Worldvein on Process), short helper text so the screen isn’t cryptic.

### 5) Process screen UX
- Player **picks the item/recipe to process** (not an opaque auto job only).
- Show **how many of each input mat** that process consumes (and Worldvein cost if any).
- Keep quality/rarity chase behavior from AFK lock; placeholder rates OK with `DESIGN-OPEN`.

## Out of scope
- Renaming Seam root tab
- Flee math balance
- Combat v2 spectacle
- Capacitor / App Store

## Success criteria
- [ ] Island: pan works; zoom gone
- [ ] Embark CTA reads Explore (or Begin)
- [ ] New character requires name + class
- [ ] Seam → Train sub-tab; clearer helper copy on AFK panels
- [ ] Process: select target + visible mat amounts
- [ ] PR with summary + phone test notes; `npm run build` OK
