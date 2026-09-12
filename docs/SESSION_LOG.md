# Eldrathor — Session Log

**Purpose:** Transferable memory so any agent can pick up without re-deriving locks from chat. Update when locks change or milestones land.

**Repo:** `HaDeZs530/eldrathor` · Prototype: Vite + React under `app/`

**Agent split (LOCKED 2026-09-11, evening — supersedes the Boss/Claude split below):** **Claude Design Chat** = design authority, locks, briefs, this log. **Claude Code** = all coding. **Grok Bot** = art / image candidates + ad-hoc. See `docs/AGENT_COORDINATION.md`.

**Chronology addition:**
- **2026-09-11 (late):** Role change locked by Anthony. Design authority moves from Grok Bot ("Boss") to the Claude Design Chat (claude.ai Project). File renamed from `SESSION_LOG.md`; everything below is preserved verbatim as history and its locks remain in force.

---

# Grok Bot / Boss — Session Log (Eldrathor)

**Purpose:** Transferable memory so Claude (or any other agent) can pick up without re-deriving locks from chat. Update this file when locks change or major milestones land.

**Repo:** `HaDeZs530/eldrathor` · Prototype: Vite + React under `app/`

**Agent split (LOCKED 2026-09-11):** Boss = planning / management / image gen / briefs / session log. **Claude = all coding.** See `docs/AGENT_COORDINATION.md` + `docs/CLAUDE_BRIEFS/`.

**Home handoff:** `docs/CLAUDE_HOME_HANDOFF.md`

---

## Source of truth
1. `docs/Eldrathor_Design_Doc.md` — game design (older bits may lag; prefer locks below when they conflict).
2. `docs/Eldrathor_DualMode_Art_Lock.md` — dual graphical modes.
3. `docs/Eldrathor_NodeMap_Art_Lock.md` — island / node-map theme ladder + parchment biomes.
4. `docs/Eldrathor_Island_Path_Lock.md` — 10-pin clockwise path + spline rules.
5. `docs/Eldrathor_TabBar_Lock.md` — nav chrome (5th tab = AFK/Seam).
6. **`docs/Eldrathor_AFK_Town_Lock.md`** — AFK Gather/Process/Idle·Train + Town Crafter/Upgrade/Market.
7. `docs/AGENT_COORDINATION.md` + `docs/CLAUDE_BRIEFS/` + `docs/CLAUDE_HOME_HANDOFF.md`.
8. **This file** — chronology + cross-cutting locks.

---

## LOCKED (do not reverse without Anthony)

### Agent roles
- Boss (Grok Bot): plan, manage, lock design/art, image candidates, Claude briefs, session log, phone GitHub help.
- Claude: implement all `app/` code from briefs.

### Dual graphical modes + Mountain ladder
- Island world map → warm RPG.
- Location/node travel map → hybrid + parchment fog-of-war.
- Fight/loot → full Mind-view.
- Crossfade; never snap.

### Island world map UX
- **Pan only** (playtest 2026-09-11) — **zoom disabled**.
- Start on south harbor.
- Path: **10 pins**, dotted **spline in code** (`Eldrathor_Island_Path_Lock.md`); **4→5** mid segment **hidden behind castle**.

### Node engage (PR #16)
- Node tap → engage on fight screen: **Attack** / **Flee** (not auto-combat).
- Flee: roll clean escape vs **ambush**; odds still DESIGN-OPEN placeholders.

### Difficulty / embark CTA
- Prefer button label **Explore** (not Confirm). Soft lock 2026-09-11.

### Character create
- Creating a character requires **name + class** screen (brief READY).

### Bottom TabBar
**Player | Party | Mountain | Town | Seam (working label)** — Seam final name **OPEN** (Anthony holding). Market under Town. Tab bar visible during runs.

### AFK
- Jobs: Gather / Process / Idle·Train (sub-tab label → **Train** in polish brief).
- Process UX: **pick item to process** + show **mat amounts** consumed (+ Worldvein).
- More helper copy on AFK panels (polish brief).

### Gear / currency
- Weapons drop; armor crafted from processed mats. Worldvein UI currency.

---

## Still TODO / DESIGN-OPEN
- Seam **final** tab name
- “Prepare the bond” / Rally final title
- Hunt/Forage names; rates/recipes; flee odds
- Peninsula stamps; fog VFX; real PNG for island art
- Combat v2; growth trees; Capacitor; AFK offline persistence

---

## Chronology
- **2026-09-11:** AFK/Town locks + Seam UI (PR #7 era); Boss=plan/Claude=code coordination.
- **2026-09-11:** PR #10 parchment node map + pannable island; PR #13 path lock (spline brief); phone `--host` playtest.
- **2026-09-11:** PR #16 Attack/Flee engage + ambush roll.
- **2026-09-11 evening:** Playtest UX batch brief + `CLAUDE_HOME_HANDOFF.md` for Anthony’s home Claude session (pan-only, Explore, character create, Train label, Process pick+amounts, more AFK copy; Seam name held).

---

*Last updated: 2026-09-11 evening by Boss (Grok Bot).*
- **2026-09-11 (late):** Role-change docs pushed directly to main by Claude Design Chat (`CLAUDE.md`, `AGENT_COORDINATION.md`, `CLAUDE_HOME_HANDOFF.md`, briefs README, log rename). Next: Claude Code runs the playtest-ux-polish brief; Design Chat audits Difficulty screen / 10-pin path / Attack-Flee vs design doc.
- **2026-09-11 (late):** Design Chat audit of code vs locks pushed: `docs/AUDIT_2026-09-11_code-vs-locks.md`. Open rulings: A1 Attack/Flee, A2 Difficulty screen, A3 10 pins vs 6 worlds, A4 boss seal/respawns not yet built.
- **2026-09-11 (late):** Recovered the July 2026 design work that never reached the repo: `Eldrathor_BaseStats_Lock.md` (9-stat spine), `Eldrathor_ClassGemTrees_Lock.md` (all four 40-pt trees), `Eldrathor_Archetype_Seeds_DRAFT.md` (10/15 seed table, under review). Design doc §6d + §9 item 1 now point to them; §3b points to the TabBar/AFK locks.
- **2026-09-11 (late):** Audit rulings: cut Attack/Flee (reverses PR #16), Difficulty → Rally screen, 10 pins = path art with 6 tappable worlds, archetype seed table approved for build. Brief `2026-09-11_loop-cleanup-and-stat-spine.md` pushed as next Claude Code task. Combat v2 spec in progress in Design Chat.
- **2026-09-11 (late):** Combat v2 LOCKED (`Eldrathor_Combat_v2_Lock.md`): pre-rolled script resolver, derived stats off the 9 seeds, concrete archetype innates, enemy tier formulas, feed/screen/results spec. Brief `2026-09-11_combat-v2.md` queued after loop-cleanup.
