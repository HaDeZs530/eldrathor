# Bottom Tab Bar Lock (2026-09-10; AFK swap 2026-09-11)

> **Status:** LOCKED (Anthony). Agents must not invent alternate nav layouts.
>
> **AFK/Town update (2026-09-11):** Root **Market** tab replaced by **AFK tab** (working label **Seam**; final name DESIGN-OPEN). **Market** is a **Town sub-section**. See `docs/Eldrathor_AFK_Town_Lock.md`.
>
> **Supersedes** `docs/Eldrathor_Design_Doc.md` §3b prior tab list. This lock file + CLAUDE.md + AFK/Town lock + session log are authoritative.

## Tabs (left → right)

1. **Player** — Mind-view UI (Mythros-blue refined / cold projection)
2. **Party** — Mind-view UI
3. **Mountain** — CENTER, emphasized (larger / glowing). Hybrid look between mind-view and warm RPG. Owns mountain map / world select / expedition entry.
4. **Town** — Warm RPG / world coloration. Veinharbor hub (painted harbor hero + illustrated destination rows, see Dual-Mode lock amendment 2026-09-14) + **Party** row (opens the Party tab) + **Crafter** + **Smith** (id `upgrade`) + **Market** (sub-areas). Each sub-area has "← Back to Veinharbor"; harbor scroll position preserved; Town tab stays selected.
5. **AFK / Seam** — Mind-view for Gather & Idle; Process theme OPEN (mind + slight forge glow). Replaces former root Market tab. Name OPEN (Seam / Echoes / Bound / …).

## Hub chrome theme families

| Skin id | Tabs | Look |
|---------|------|------|
| `mind` | Player, Party, AFK/Seam | Cold Mythros-blue refined projection chrome |
| `mountain` | Mountain | Hybrid between mind-view and warm RPG |
| `rpg` | Town | Warm micro-pixel RPG / world |

Switching between families must **crossfade/transition** background, border, and color (~300–450ms). Never an instant pop.

## Hub skins vs expedition dual-mode

- **Hub skins** (`mind` | `mountain` | `rpg`) = bottom-bar / hub navigation chrome.
- **Expedition dual-mode** (`WORLD` | `MIND`) still applies when entering/leaving Mind View for territory map / combat (§3c).
- Bottom tab bar is **hub chrome**: stays **VISIBLE during expeditions AND fights** (LOCKED Anthony 2026-09-10) so players can visit Town/AFK/Party/Player while waiting for fights to resolve. Returning to Mountain restores the exact run stage (island / difficulty / expedition / active fight / loot). See `docs/SESSION_LOG.md`.

## Code map

- `app/src/components/TabBar.jsx` — persistent 5-tab bar (`player|party|mountain|town|afk`)
- `app/src/components/AfkScreen.jsx` — Gather | Process | Idle
- `app/src/components/TownScreen.jsx` — Harbor | Crafter | Upgrade | Market
- `app/src/theme/` — hub skin CSS vars + transitions; WORLD/MIND kits unchanged for expedition
- Design source: `docs/Eldrathor_AFK_Town_Lock.md` + design doc §3b
