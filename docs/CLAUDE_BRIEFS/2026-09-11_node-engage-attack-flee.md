# BRIEF — Node engage: Attack / Flee on the fight screen

**Status:** IMPLEMENTED (placeholder odds) — awaiting Boss lock of numbers + copy  
**Date:** 2026-09-11  
**Author:** Claude Code, recording Anthony's direction given in chat (Boss did not write this one — noted here so the session log can catch up)  
**Source lock:** `docs/GROK_BOT_SESSION_LOG.md` → "Node advance / engage (PARTIAL — playtest 2026-09-11)"

## Anthony's direction (verbatim intent)
- Node tap transfers to the **fight page** (Mind-view).
- Below the character section: two buttons, **Attack** / **Flee**.
- Attack → initiate the fight. Flee → flee check.
- Flee success → back to the node map with a **successful flee message**.
- Ambush → something noting the ambush, then combat starts.

## What was built (branch `feat/engage-attack-flee`)
- `AppRoot.jsx`: node tap → `engageNode()` sets `runStage='fight'`, `fightPhase='engage'` (no auto-combat). `commitFight({ambush})` runs the existing auto-resolver. `attemptFlee()` rolls; success → `runStage='expedition'` + flash and log line using a random pick from `FLEE_SUCCESS_MESSAGES` in `combat.js` (Anthony: ~5 messages, some funny — currently "Fled successfully!", "Successful escape!", "Avoided danger!", "Bravely ran away!", "Nope. Not today."); failure → `fightPhase='ambush'` banner for ~1.1 s, then `commitFight({ambush:true})` with an `AMBUSH —` feed line.
- `FightScreen.jsx`: phases `engage | ambush | resolving | done`. In `engage`: Attack (primary) + Flee (ghost, shows "% clean escape") under the party/foe panel; foe HP bar full; hint "It has not noticed you yet." In `ambush`: red banner. Header label reads **Engage** until combat starts.
- `combat.js`: `fleeChance(node, partyHP)` and `rollFlee()`.
- Entering a node still reveals its type (design doc: hidden until entered) — that is what the party sees when deciding.
- Position: a fled node stays uncleared; the party stays where it was. Tab switching mid-engage restores the engage screen (stage persistence unchanged).

## Placeholder numbers — DESIGN-OPEN (Boss to lock)
```
chance = clamp(0.10 … 0.95,
  0.70
  + (partyHP − 0.5) × 0.4          // −0.20 at 0 HP … +0.20 at full
  − { boss 0.35 | rare 0.20 | crystal 0.05 | skirmish 0 }
  − (tier − 1) × 0.03 )
```
- Ambush fight = a normal fight today (no penalty beyond being forced to fight). Ambush rules OPEN.
- Whether the player sees the % is OPEN (currently shown, easy to hide).
- Button labels ("Attack"/"Flee"), banner and log copy are OPEN.

## Success criteria
- [x] Tap node → Engage screen, no auto-combat
- [x] Attack → resolving → Spoils → Continue → route map
- [x] Flee success → route map + random success message (flash + log)
- [x] Flee failure → AMBUSH banner → combat → Spoils
- [x] `npm run build` OK; eslint clean on touched files (pre-existing unused-React warnings aside)
- [ ] Anthony phone playtest; Boss locks odds/copy and updates the session log

## Out of scope
Combat v2 visuals; respawn/rare wards; difficulty modifiers.
