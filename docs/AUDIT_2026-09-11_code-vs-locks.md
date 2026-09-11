# Audit — shipped code vs. locked design (2026-09-11)

**Author:** Claude Design Chat. **Scope:** `app/src` on `main` @ 5a4107b vs `Eldrathor_Design_Doc.md` + lock docs.  
**Rulings (Anthony, 2026-09-11):** A1 cut flee · A2 convert to Rally screen · A3 10 pins visual, 6 tappable · seeds approved for build. All in `CLAUDE_BRIEFS/2026-09-11_loop-cleanup-and-stat-spine.md`.  
**Purpose:** list every place the prototype diverges from LOCKED design so Anthony can rule on each. Nothing here is a lock — each item is DECIDE or FIX.

## A. DECIDE — Anthony's call (design conflicts)

### A1. Attack / Flee engage step (PR #16) vs §8b/§8c
Code: tapping a node reveals its type and shows a Mind-view standoff with **Attack / Flee**; Flee rolls ~70% base (`combat.js fleeChance`).  
Conflict: §8c LOCKED says node types are unknown until *entered* and §8b says interactivity lives *entirely in traversal*. With a cheap Flee, every node can be scouted by approach-and-flee, which hollows out the fog-of-war two-layer mystery, and every node now costs two taps (phone-light).  
Options: (a) remove Flee, node tap = auto-engage (doc as written); (b) keep the engage screen as a *commit* screen with type still hidden (Flee then has no information value — pointless); (c) keep Flee but make it expensive (HP cost / rares can't be fled / Worldvein tax) so scouting isn't free.  
**Recommendation: (a)**, or (c) if the "standoff" moment tested well on the phone.

### A2. Difficulty screen vs §2
Code: world pin → `DifficultyScreen` (Normal / Hard / Brutal; only Normal wired) → Confirm.  
Conflict: the design doc has no difficulty bands — the *World* is the difficulty band, hand-authored. A difficulty selector is a new system, and it is the first step toward the scaling treadmill §2 rejects.  
**Recommendation:** drop difficulty. Keep the screen as an **embark/Rally** screen (world name, boss name, your three, **Explore** button) — that's useful; Hard/Brutal stubs are not.

### A3. Island map = 10 pins vs §5b 5 worlds + summit
Code: `WORLDS` has 6 entries (W1–W5 + Vaelyx as world 6); `IslandWorldMap` places 7 hotspots. Island Path Lock says 10 pins with working labels (Shore trail, West cliffs, NW shore, NE lookout, East coast, East ruins, Forge gate, High walls, Crystal).  
Question: are the 10 pins **10 worlds** (each a procedural map with a boss — a content-load decision) or **10 visual waypoints** on the path with only 6 tappable? The lock doc doesn't say. §5b LOCKED is 5 worlds + summit; World 4 = 4 wings, World 5 = 3 boss nodes.  
**Recommendation:** 10 pins = visual waypoints; 6 are tappable worlds (W1–W5 + Summit). If Anthony actually wants ~10 worlds, that reopens §5b and the W4/W5 multi-boss structure.

### A4. Boss seal / roaming rares — not implemented, boss is fightable on reach
Code: `genTerritory` sets `bossSealed: true` and places 2–3 static rares, but nothing enforces the seal; the boss node engages like any node. No respawns, no named variants, no roaming.  
Not a conflict — it's the queued territory-model work — but it means the **core loop has not been validated yet**. The prototype today is: reveal → tap → 2.2 s timer → loot. Flagged so priorities stay honest: this comes before art and before growth screens.

## B. FIX — clear errors, no decision needed (bundle into one brief)

- **B1. Armor names in weapon drops.** `rollLoot` names drops Blade/Guard/**Vestment/Charm/Crown**. Armor never drops (§7c LOCKED). Restrict to the 8 weapon types.
- **B2. "Vaelyx the Bound"** (`data.js` world 6). Canon: **Vaelyx the Eternal**; he is the binder, not bound.
- **B3. Random-name, no-class character create** — covered by the playtest-ux-polish brief.
- **B4. Handoff doc is stale** — still says Market is a root tab and the bar hides on expedition (both superseded by TabBar lock). Design Chat will rewrite §3–§5 of `Eldrathor_Handoff_Doc.md` after the A-items are ruled.
- **B5. Design doc §3b** still lists the old tab bar; add a one-line pointer to `Eldrathor_TabBar_Lock.md` + `Eldrathor_AFK_Town_Lock.md`.

## C. Confirmed in line with locks (no action)
Territory generator (32–44 organic nodes, fog reveal, hidden types, guaranteed path); 5 archetypes / 8 weapons with tempo·dmg·mit only; Worldvein single currency; weapons merge at Town Upgrade; armor crafted from infused mats; AFK Gather/Process/Idle with slots; tab bar persistent during runs; Mind-view for fight/loot; extract → island → fresh map; death = no penalty.
