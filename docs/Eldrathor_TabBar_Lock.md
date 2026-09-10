# Bottom Tab Bar Lock (2026-09-10)

> **Status:** LOCKED (Anthony). Agents must not invent alternate nav layouts.

## Tabs (left → right)

1. **Player** — Mind-view UI (Mythros-blue refined / cold projection)
2. **Party** — Mind-view UI
3. **Mountain** — CENTER, emphasized (larger / glowing). Hybrid look between mind-view and warm RPG. Owns mountain map / world select / expedition entry.
4. **Town** — Warm RPG / world coloration (micro-pixel warm). Veinharbor hub + town functions.
5. **Market** — Warm RPG / world coloration. **Own top-level tab** (supersedes design-doc language that Market lived only inside Town).

## Hub chrome theme families

| Skin id | Tabs | Look |
|---------|------|------|
| `mind` | Player, Party | Cold Mythros-blue refined projection chrome |
| `mountain` | Mountain | Hybrid between mind-view and warm RPG |
| `rpg` | Town, Market | Warm micro-pixel RPG / world |

Switching between families must **crossfade/transition** background, border, and color (~300–450ms). Never an instant pop.

## Hub skins vs expedition dual-mode

- **Hub skins** (`mind` | `mountain` | `rpg`) = bottom-bar / hub navigation chrome.
- **Expedition dual-mode** (`WORLD` | `MIND`) still applies when entering/leaving Mind View for territory map / combat (§3c).
- Bottom tab bar is **hub chrome**: prefer **hidden** during active expedition map / combat (full mind-view).

## Code map

- `app/src/components/TabBar.jsx` — persistent 5-tab bar
- `app/src/theme/` — hub skin CSS vars + transitions; WORLD/MIND kits unchanged for expedition
- Design source: `docs/Eldrathor_Design_Doc.md` §3b
