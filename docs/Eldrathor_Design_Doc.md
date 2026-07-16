# ELDRATHOR — Game Design Document

*Master design record, current through July 2026. Split into **LOCKED** (decided), **OPEN/FLAGGED** (still to resolve), and **PARKED** (shelved for later). Later sections supersede earlier ones where noted; §9 lists everything still open.*

---

## 1. THE GAME IN ONE BREATH

You build a roster of self-made characters, field a party of 3, and send them up a monster-saturated mountain to farm bosses for gear and gems, growing stronger to break through gated Worlds — a climb framed by lore as a battle that can be held but never won.

**Genre:** UI-based (menu-driven, no character movement) loot RPG with idle-resolve combat, party-building, and world-gated progression. Single-player *feel*, built server-authoritative for a later player market and possible co-op.

**Platform:** iPhone (iOS). Build approach TBD — leaning web-tech prototype (HTML5/JS) → Capacitor wrap for App Store, to allow fast iteration.

**Reference touchstones:** Eternal Hero (world-gated progression, weapon = attack type, gear walls), Melvor Idle (UI-driven skill/farm grind), Granado Espada (party/roster building), Legends of Kesmai (boss-kill item quality). Tap Titans studied and **rejected** (prestige treadmill, active-play grind, astronomical numbers).

---

## 2. CORE STRUCTURE — World-Gated Progression (LOCKED)

- The game is divided into **4–5 Worlds** = the mountain tiers: Harbor → lower slopes → ruined artisan city → caves → peaks/summit.
- Each World is **balanced around a player-level + gear band** (hand-authored, human-scale numbers — NOT infinite exponential scaling).
- **Bosses are progression walls.** You cannot beat a World's boss until sufficiently geared. The wall sends you back to farm that World's content for drops until your gear crosses the threshold, then you break through.
- **End Worlds are farmable** for the best drops (endgame loot zones).
- **No prestige, no progress reset.** Progression is permanent and linear-by-World. Once a World is unlocked, it stays unlocked.
- **Long-term retention** = end-World farming for best-in-slot + periodic content updates adding Worlds (accepted developer content-treadmill; healthier than infinite-prestige grind).

### The Expedition Loop (LOCKED)
The satisfying "venture and return" rhythm, WITHOUT progress loss:
1. Portal out from the Harbor to a World.
2. Farm it (gear drops + Worldvein).
3. Portal back to the Harbor (home hub).
4. Spend Worldvein to strengthen characters.
5. Portal back out. Repeat.

Nothing is lost on return — the "reset feel" is the round trip, not a rollback.

---

## 3. UI-NATIVE PRESENTATION (LOCKED direction)

The problem: a UI game has no physical space, so "distance climbed / far from home" must be manufactured through interface, not geography. Solved via:

- **Vertical mountain map as the hero visual / progression spine.** Your marker climbs node by node; cleared zones glow (warded/sealed) below you, dark unexplored zones above. Watching your marker sit high with a long tail of conquered zones = the core "I've come far" signal.
- **Harbor as a distinct home-base screen** (hub: upgrade, spend Worldvein, manage roster, craft). Worlds are separate screens. The portal-out / portal-home transition sells distance.
- **Color as altitude:** warm ambers/wood/sea-blue at Harbor → sickly greens → dark Mythros-blue caves → cold pale peaks → ash + ruin + dragon-green at summit. Screen gets colder/darker/more Mythros-saturated as you climb.
- **Per-World decoration/framing:** UI chrome (borders, textures, ambient particles) is location-specific.
- **Motion + sound** per World (pulsing crystals, drifting embers, gulls at harbor, drips in caves, wind at summit).
- **Extract/redeploy ritual:** portaling back is a deliberate act; going out returns you to your high-water mark.

*Insight: UI-based is an ADVANTAGE — the whole screen is art-directable, giving tighter control of mood/progress than tile-based art.*

---

## 3b. UI NAVIGATION & SCREEN STRUCTURE (LOCKED)

**Bottom tab bar (persistent, mobile-standard):**
- **Town** — Veinharbor hub
- **Characters** — roster / Adventurer management
- **World** — the mountain-crystal map (direct)
- **Player** — Veinbinder info / progression

**Town (Veinharbor hub):**
- **Top 1/3:** a living visual of the harbor town with the mountain behind it — subtly animated later (water, drifting smoke/clouds, pulsing Mythros glow). Design the frame now; animation is a later polish add.
- **Bottom 2/3:** a **scrollable list of rounded bars**, one per town function (Market, Crafter, Gathering, Idle Slots, Recruit, etc.). Tap a bar → that function's screen. **Market lives INSIDE Town** (not a tab).

**World tab → the mountain map directly:** the whole mountain with a **crystal/jewel marker per World** (5 Worlds + summit). Tap a World's crystal → enter its **Expedition Map**.

**The expedition drill-down flow:**
1. World tab → mountain-crystal map.
2. Tap a World crystal → **Expedition Map** (node network — see §8c: ~30+ nodes, dots connected by dotted ley-lines, contents hidden until entered, organic layout NOT a pyramid/rows).
3. Tap a node → **Combat Screen** (encounter type revealed on arrival).
4. Combat auto-resolves → **detailed results/breakdown screen** (fight summary + loot + Worldvein, gear w/ 1–100 rating) → OK → back to Expedition Map.
5. Beat the boss → back to the **World map** (World cleared / next unlocked).
Each tap drills one level deeper; each completion pops one level back.

**Combat Screen layout (the "TV screen" — watch your party fight):**
- **Top 1/3:** stylized battle visual — party of 3 vs monsters (or working a crystal node). Stylized representations + health bars + hit-flashes (no real character art yet).
- **Middle:** health bars + specials for each of the 3 characters.
- **Bottom:** scrolling combat text (every action — hits, damage, specials, heals — flowing down in real time, like watching your party through a screen).
- Combat auto-resolves (watch, no attack inputs); intended: speed toggle (1×/2×/skip).

*Design/tone note: dark Mythros-blue glowing aesthetic throughout (a magical energy map, not paper); warm ambers only at the safe harbor. Aesthetic-as-altitude on the mountain (§3).*

## 3c. ART DIRECTION — The Worldvein Interface (LOCKED — core creative pillar)

**The interface is DIEGETIC.** The player (the Veinbinder) is NOT physically on the mountain with the party — they **channel Worldvein power to remotely view** the expedition (map, locations, combat). So the cool, glowing, semi-technological look is NOT sci-fi — it's **arcane-tech**: raw magical energy refined until it reads like technology. The glowing precise interface literally IS the Worldvein scrying itself. True to lore (the People of the Vein were master crafters of this energy); gives a distinctive art identity most fantasy games never achieve.

**THE WARM/COLD RULE (master art principle — resolves every "does this look right?" question):**
- **WARM / light / sunlit = REALITY.** Screens where the player physically IS: **Town/Veinharbor + all town functions (Market, Crafter, Gathering, Idle, Recruit), plus Characters and Player/Veinbinder screens** (party is "with you" in town; the Veinbinder screen is you). Warm ambers, golden sunlight, real-place warmth.
- **COLD / dark / glowing Mythros-blue = PROJECTION.** Everything viewed THROUGH the Vein: **World Map, Expedition Map, Combat.** Remote, cold, energy-lit — scrying a distant dangerous place through raw magic.
- **Transition town→expedition = "reaching out through the Vein"** — signature moment: sunlight shifts to blue energy as you connect. A magical act, not just a screen change.
- Temperature tells the player instantly: *am I here (warm/real) or projecting (cold/Vein)?*

**Fantasy re-skin note** (for the cold/arcane-tech screens so they read fantasy not sci-fi): no techy fonts (no Chakra Petch/monospace) — use classic-fantasy display faces (Cinzel/Marcellus/Cormorant) + warm serif/humanist body; deepen electric neon toward richer crystal/sapphire blue + jewel tones (ruby/emerald/amethyst not neon); soften geometric HUD borders toward carved/ornamented frames; map nodes = glowing crystal shards/runes not clean diamonds; connecting lines = organic energy veins not dashed circuit traces.

**Workflow note:** Claude Design burns tokens on iteration — each screen's feel/content/layout is fully specified in the doc/chat FIRST, then handed to Claude Design as one complete build-brief per screen (build once correctly vs. many expensive iterations).

---

## 4. WORLD LORE (CANON — from source lore doc)

- **Eldrathor:** coastal island dominated by one mountain. Harbor town SE shore. Rises through ruins, peaks, caves to a ruined castle at the summit. Saturated with residual magic that empowers (and twists) wildlife.
- **Worldvein:** ancient geological seam of raw magical energy through the mountain. **Mythros** = the substance itself, appears as **blue crystal**, radiates energy.
- **Worldforge:** the master Mythros crystal deep beneath the castle. Eternal, inexhaustible, indestructible. Lesser crystals branch outward.
- **People of the Vein:** the fallen colony. Master warders + smiths. Warded the crystals to make the island habitable; forged Mythros weapons/armor (prime export). Built harbor, artisan city, tunnels, summit castle.
- **The Fracture:** centuries of drawing energy stressed the Worldforge until it cracked and leaked. Could not be sealed — the crystal rejects all bindings.
- **Vaelyx the Eternal:** ancient green-scaled dragon that feeds on raw Mythros. Came for the Worldforge. Cannot be permanently killed — only defeated in fights; he endures.
- **The Last Battle / Guardians:** the royal court fell defending the Worldforge; saturated with Mythros, their spirits bound to the crystal lattice. Vaelyx arranged them as bound "court" — each anchored to a specific lesser Mythros crystal, still carrying the arms they died with. Destroying a lesser crystal severs the anchor and releases what it binds.
- **A century later:** the harbor town survived (those below the mountain during the battle). Descendants keep the old craft — but **warding knowledge is lost.** Wards decay generation by generation; each failure sends another stretch of island wild.
- **Design canon:** Worldforge can't be fixed/destroyed. Vaelyx endures. Court spirits anchored to specific crystals. "Managed catastrophe" — heroes hold the line, no final victory. Mythros = blue. Dragon = green.

---

## 5. THE KEYSTONE — Why the Party Climbs (LOCKED)

**Player role: you are a CONDUIT.** One of the rare few who can carry the raw Worldvein and give it form. No single body can wield that much raw power alone — it lives only when shared. So you gather **Adventurers** (recruited from across the sea — see Recruitment below) and **bind your essence to theirs**, forming a lifelong bond (between you and them, and between them and each other, forged on the mountain). Your power flows through your party; they climb and fight, you are the source, will, and organizer.

**Recruitment, not creation:** party members are **hired/recruited adventurers**, not manufactured. On joining, they're infused with your essence — a warm fellowship bond, not servitude. (This replaces the earlier "you create characters" framing — mechanically identical, warmer fiction.)

**The world: Veinharbor.** Not a grim last stand — a **destination**. The mountain is saturated with Worldvein power; that energy spawns the bosses/manifestations and can be **harvested** for power. Word spread across the islands, and adventurers + Conduits flock here drawn by power worth harvesting, a mountain worth climbing, and a name worth making. Over a century this turned the harbor into a thriving trade hub — **Veinharbor**, a prosperous, competitive, alive port at the mountain's foot, a little dangerous, named for the Vein that draws everyone to it. You are a **newcomer** — you crossed the sea, like the others, for the same reasons — a fresh start.

**The harvest loop as canon:** the Worldvein spawns manifestations (bosses) and **respawns them on intervals** — this is the in-world justification for farming (bosses regenerate because the energy is inexhaustible; the Worldforge is eternal). You harvest Worldvein, infuse it into your Adventurers (the whole upgrade economy = you empowering your conduits), climb higher, harvest more. **Managed catastrophe:** the energy can't be stopped, so the work never ends — but neither does the good, the glory, or the growth.

**Stakes: glory-forward, help-the-island as byproduct.** Adventurers come for glory/purpose/strength; holding the line and protecting the harbor's people is *how* you make your name here. Good and glory align — heart underneath, but not preachy. Light enough to enjoy grinding for months; real enough to matter.

**Social backdrop is NATIVE to the fiction:** other players = **other Conduits** in the boomtown. The hub feels full because it is (real players). Justifies the marketplace (Conduit/adventurer economy), leaderboards/renown (a place to "make a name"), and later co-op/shared instances (Conduits climbing together). The "backdrop of other parties" = the real player population, framed in-world.

**Tone reference:** Solo Leveling's ever-spawning gates/hold-the-line structure, but reframed as a hopeful, prosperous port (Veinharbor) rather than a grim crisis. Player is a Conduit among peers, NOT a lone hunter (that clashed with party-management) and NOT a guild cog (too bureaucratic) and NOT a House/bloodline (rejected).

**Player-facing frame (working copy):**
> You are a Conduit — one of the rare few who can carry the raw Worldvein and give it form. Like the others, you crossed the sea drawn by what this island offers: power worth harvesting, a mountain worth climbing, and a name worth making. Alone, your gift is only potential — it lives when you share it. So you gather adventurers who came for the same reasons, and bind your essence to theirs. The bond makes them more than they were and you more than one; forged on the mountain, it lasts a lifetime. Together you climb, harvest the Vein, and carve your place in a land where the work never ends and the strong are never finished.

**Terms:** Player = **Veinbinder** *(FRONTRUNNER, not final — on the fence; other candidates: Conduit, Veinwarden, Mythwarden, Mythbinder. The role: one who binds/channels the Worldvein's power into their bonded adventurers — a benevolent echo of how Vaelyx bound the court)*; party members = **Adventurers**; hub = **Veinharbor** (the harbor town at the mountain's foot).

**Story tie-ins:** (1) Vaelyx = the **summit apex boss** (recurring endgame) — RESOLVED via §5b. (2) The **bound court spirits = the 7 forge+castle bosses** (Worlds 4–5), source of court-art gems — RESOLVED via §5b. (3) Deeper personal hook for the player — still open, minor.

---

## 5b. WORLD / ZONE STRUCTURE — The Mountain (LOCKED)

**One level (one procedural map) per World.** The mountain is climbed as a **clockwise spiral from 6 o'clock upward** (the mountain is not a perfect circle). Each World's boss unlocks the next.

**Hub — Veinharbor** (6 o'clock, base). City hub, NOT a combat level (marketplace, roster, gathering/idle slots, empowerment). A road leads out to World 1.

**World 1 — Shoreline Forest** (~7–10 o'clock)
- Forest along the shore at the mountain's base; road from the harbor leads in. Twisted, Mythros-empowered wildlife (the wild reclaiming the land). Starter gear band — where new Veinbinders learn the loop.
- Single pinnacle boss → unlocks World 2.

**World 2 — Overrun Peninsula Town** (~9–12 o'clock)
- An overrun town on a peninsula, higher up. Road leads THROUGH the town, then back into the mountainside, which you traverse to a **cave exit at 12 o'clock.**
- Boss at the cave exit → unlocks World 3.

**World 3 — The Ravine Path** (~11–2 o'clock)
- Winding mountainside path through a ravine, with **rope bridges.** Boss sits at the **base of a stairway** up to a higher ravine platform → leads to the forge.
- Boss → unlocks World 4.

**World 4 — The Magical Forge** (the platform) — *FIRST court-art bosses*
- Presented as a **hub of 4 selectable sub-level "wings"** (forge-halls), each a self-contained procedural expedition ending in **one boss** (4 bosses total). UI stays simple — same pick-a-level/run-map/kill-boss flow as Worlds 1–3, just 4 entries under one region.
- **Clear all 4 wing-bosses → central portal to World 5 unlocks** (persistent milestone; farm the 4 across runs, portal lights when all down).
- **Court-art gems + items begin dropping here** (lore-fit: the forge = the People of the Vein's master-craft heart).

**World 5 — The Upper Castle** — *more court-art bosses*
- **One procedural map with 3 BOSS-NODES** (bosses are just a node type — fits the existing traversal system; plus normal/rare/crystal nodes between). Farm individual castle-bosses across runs for their court-arts.
- **Clear all 3 boss-nodes → portal to the summit unlocks.**

**Summit — Vaelyx the Eternal** (top of the castle)
- The apex/final boss. **Recurring endgame** — defeated per-fight, never permanently killed (canon). The perpetual top of the climb.

**UNIFORM GRINDABLE STRUCTURE (LOCKED):** every combat area has the FULL node mix — **plenty of normal mobs (farm fodder) + roaming rares + Worldvein crystals + boss(es).** No World is ever "just bosses." All Worlds are grindable for XP/loot/Worldvein, so players can farm whichever tier suits their level (you gear up by farming the tier you're stuck on).
- Worlds 1–3: one farmable map each, boss at the end.
- World 4: each of the 4 wings is a FULL farmable map (mobs/rares/crystals + wing-boss) — since W4 sits right before endgame, the 4 wings double as **large pre-endgame grinding grounds**, not just boss gates.
- World 5: the one map has normal mobs/rares/crystals filling it between the 3 boss-nodes — grindable, not a 3-boss sprint.

**PERMANENT UNLOCKS (LOCKED):** clearing a World's boss permanently unlocks the next World. **Unlocks never reset** — no re-clearing the mountain each session. Jump straight to any unlocked World. (Rejected the idea of forcing a full-set clear every time — that would be a mandatory grind-wall, against the core philosophy.) Players farm where they want; end-Worlds stay farmable for their specific drops. Works with the beeline mechanic: pick your unlocked World → full-clear (grind everything) OR beeline the boss (if its rares are cleared).

**Boss structure ESCALATES in form (not just difficulty):** Worlds 1–3 = single-boss linear climb; World 4 = 4-wing boss gauntlet (portal gate); World 5 = 3-boss-node map (portal gate); Summit = Vaelyx. Late-game Worlds are multi-boss challenges — a structural ramp, not just harder single bosses.

**COURT-ART GEMS — placement RESOLVED:** the **7 forge+castle bosses (4 + 3) ARE the bound court spirits** from the lore (king, queen, court members — severed from their crystals). They drop the **court-art gems** (marquee endgame chases). Court-arts start at **World 4** (mid-late, farmable, NOT pure-summit) and continue through World 5.

**Aesthetic-as-altitude** (locked earlier): warm harbor ambers → sickly forest greens → overrun-town decay → dark Mythros-blue caves/ravine → forge-fire and cold stone → ash + ruin + dragon-green at the summit.

---

## 6. CHARACTER SYSTEM

### 6a. The Stack (LOCKED)
A character = **Archetype (permanent bones) + Weapon (power/delivery) + Class Gem (role) + [Court-art gem — parked] + Armor/Sets (situational).**

- **Damage is unified: all damage is Mythros.** No physical/magic split. This removed the entire weapon-vs-damage-type knot and the need for duplicate magic/phys archetypes. Variety comes from what your Mythros *does*, not its element.

### 6b. Archetypes — "the bones" (LOCKED: 5 total)
Each archetype = **role pull (soft, not a lock) + stat spine + 2 innate skills (1 personal buff + 1 group buff)**. Archetype is permanent, chosen at creation. It is a **flavor TILT, never a cap** — it never makes a build invalid, only tilts it. All archetype×class combos are valid and distinct.

| Archetype | Role | Personal Innate | Group Innate |
|---|---|---|---|
| **Bulwark** | Tank / soak | **Aegis** — draws enemy focus, takes reduced damage while holding it | **Guardian's Bulwark** — party damage-reduction / shield |
| **Warden** | Sustain / heal | **Single-target heal** (strong, one ally) | **Renewal** — small party heal-over-time + cleanses radiance debuffs |
| **Striker** | Damage | **Onslaught** — self damage ramps the longer in a fight | **Cadence** — party-wide attack-speed boost |
| **Adept** | Enemy control | **Hard single-target lock** (stun/charm — fully disables one enemy) | **Sunder** — enemies take increased damage (protection debuff) |
| **Resonator** | Support / farm | **Resonance** — broad shallow party buff (minor attack + minor defense to all) | **Attune Vein** — party farming buff (drop rarity / yield / Mythros gain) |

*Notes:* Resonator is the intentional exception (both innates group-facing) — acceptable because the class-gem layer bends it into a real role anyway. No two group effects use the same lever (shield / heal / attack-speed / enemy-vuln / broad-buff). Weapons are free — any archetype, any weapon.

### 6c. Weapons — Pure Damage Delivery (LOCKED)
- **Weapon = damage delivery ONLY.** Rhythm/speed + damage flavor. **NO specials, NO effects, NO role/utility** — all effects (taunt, control, buffs, heals) live in the Archetype + Class Gem layers. This keeps the three layers non-overlapping (zero redundancy — e.g. taunt exists only on Bulwark archetype / Guardian gem, never on a weapon).
- **Two-hand model (Eternal Hero-style):** every weapon is a full two-hand loadout — no off-hand/shield-slot juggling. One weapon = both hands = one attack pattern = one skill tree. (e.g. Dual Daggers, Dual Swords, Bow, Greatsword, Staff+Tome as a set.)
- **All weapons partial-AoE** (fits the ~1–3 enemies-per-node fights — no explicit single-target vs AoE axis; classes are roles, not target-count splits).
- **Differentiation = tempo + damage flavor + mitigation:**
  - Rhythm/speed: fast (daggers) ↔ slow-heavy (greatsword)
  - Damage flavor: DoT (poison/bleed) vs burst (high on-hit) vs sustained (elemental) vs ranged
  - **Mitigation:** all weapons block/mitigate as a passive STAT (not an active effect); tank weapons mitigate most. This is the second balance axis that justifies e.g. Sword+Shield vs Dual Swords.
- **Weapon skill level = damage output** (the power engine, from §6c earlier). Each weapon type has a **skill tree** that deepens its damage identity as leveled. Skills tab lists all weapon skills = base damage.
- **Freeform:** any archetype can wield any weapon. Weapon is a *damage-style* choice, never a role choice.
- **Weapon roster (LOCKED — 8 weapons, 4 groups of 2):** Each weapon has THREE tunable stats: **tempo** (attack speed), **damage profile** (burst/sustained/DoT), and **mitigation** (a passive defensive stat — all weapons block/mitigate to some degree; NOT an active effect). No active effects/specials on any weapon.

| Group | Weapons | Notes |
|---|---|---|
| **Tank** | Greatsword, Sword + Shield | High mitigation. Greatsword = burst-tank (high dmg, medium mitig); Sword+Shield = max-mitigation (low dmg, high mitig) |
| **Melee DPS** | Dual Daggers, Dual Swords | Low mitigation, high offense. Daggers = fast/DoT; Swords = balanced |
| **Ranged** | Bow, Crossbow | Bow = fast/sustained ranged; Crossbow = slow/burst ranged |
| **Caster DPS** | Staff, Orb/Tome | Staff = sustained elemental; Orb/Tome = heavy magic burst |

- Groupings map naturally onto armor tiers/archetypes (Tank↔Heavy↔Bulwark/Guardian; DPS↔Medium/Light↔Striker/Slayer) but are **guidance, not gates** — weapons stay freeform (a Bulwark can wield daggers as a low-mitigation bruiser).

### 6h. Build Combination Math (for reference)
Three swappable layers per character:
1. **Archetype** — 5 (permanent; 2 innates each: personal + group buff)
2. **Class Gem** — 4 (swappable role toolkit: Tank/DPS/Controller/Healer)
3. **Weapon** — 8 (swappable; damage-style only)

- **Per character:** 5 × 4 × 8 = **160 distinct builds** (~20 archetype×gem role identities before weapons).
- **Per 3-character party:** effectively unbounded comps.
- **Role-coverage meta-game:** a party needs jobs covered (tank/heal/damage/control). **Archetype = heavy/permanent (incl. exclusive GROUP innates), Class Gem = medium/swappable (personal-tier grant/amplify).** Building a party = covering group buffs via archetypes + patching personal-tier roles via gems.
- **BALANCE APPROACH (locked principle):** never balance combos directly. Balance each archetype/gem/weapon **individually**; let combinations be emergent.

### 6d. Class Gems — the role toolkit layer (LOCKED)
- **4 class gems** (the core roles): **Tank, DPS, Controller, Healer.** (No support/Resonator-mirror class — that role stays archetype-only via Resonator.) **DPS covers melee/ranged/magic — the WEAPON decides delivery** (all damage is Mythros; no separate mage).
- **Bonus flavor classes** (e.g. Summoner) = optional ADDITIONS to this list later, not core. (Court-art gems sidelined for now — see below.)
- **Gems mirror the archetype's PERSONAL innate, NOT the group innate (LOCKED):**
  - Tank gem ↔ Bulwark's personal *Aegis*; Healer gem ↔ Warden's personal single-target heal; DPS gem ↔ Striker's personal *Onslaught*; Controller gem ↔ Adept's personal hard-lock.
  - Contextual stacking applies to the **personal-tier** ability: matching amplifies the archetype's personal ability; crossing grants a personal-tier version of that role.
  - **Group innates stay EXCLUSIVE to the archetype** — a gem can NEVER grant an archetype's group buff. A Striker with a Healer gem gets a personal heal (self-sustain) but NOT Warden's *Renewal* (party heal+cleanse). This protects archetype identity: the group-tier party effect is the permanent "commitment reward" for choosing that archetype, uncopyable by gems.
  - **Consequence:** Resonator's exclusivity is strongest — with no support class gem, Resonator's party-buff + farm-buff (both group-oriented) are obtainable ONLY by being a Resonator (a distinct must-pick for farming parties).
- **One ability per gem:** Tank→taunt/mitigation, Healer→heal, DPS→damage burst, Controller→control (lock/root). A SECOND ability, if a gem needs one, arrives as a **talent in the tree**, not as a base ability.
- **Contextual stacking (the elegant core rule):**
  - **Crossing** (gem role ≠ archetype role) → the gem **GRANTS** the ability the character lacks (a Healer gem on a Striker gives the Striker a heal).
  - **Matching** (gem role = archetype role) → the gem **AMPLIFIES** the archetype's existing ability instead of giving a redundant second copy (a Healer gem on a Warden makes the Warden's heal stronger).
  - Result: no wasted/redundant abilities ever; matching = specialist, crossing = role coverage.
- **Matching boost scales with TREE INVESTMENT** — the more points poured into that gem's tree, the bigger the same-role amplification. Going pure-specialist is an earned grind commitment, not an automatic bonus.
- **Gems have NO quality tier** (unlike gear). Acquire once, flat — purely tree-driven.
- **PROCUREMENT (LOCKED): gems are RANDOM drops from rares.** No guaranteed first drop, no pity timer — you may farm several rare kills before the type you want drops. RNG is deliberate: more reasons to re-run maps and hunt rares. Later worlds drop the same 4 types (extra drops = gems for bench/second-of-role). Nobody starts with a gem — first expeditions are archetype + weapon only; the first drop is a milestone.
- **GROWTH (LOCKED): gem trees are bought with WORLDVEIN, not use-XP.** The Veinbinder infuses/empowers the gem directly (lore-clean; avoids a fourth parallel XP bar — character XP = fighting, weapon tree = weapon use, gathering = AFK time, gem tree = Worldvein investment). SEPARATE system from the Veinbinder skill tree — two distinct Worldvein sinks (gem trees = party power; Veinbinder tree = account/meta power). Worldvein demand is the lore: it's why everyone is on the island.
- **Talent tree lives PERMANENTLY on the gem, PER-GEM.** Points live on that physical gem. **Consequence:** to run the same class on two characters (e.g. two healers), you need TWO Healer gems, each invested separately. No shared pool — per-gem commitment and a long-tail farm target.
- **Talent tree structure:** a main **spine** (linearly scale the ability's core numbers + role stats), **branch** nodes (specialization forks — e.g. Healer: single-target-burst vs party-heal; Tank: self-survival vs party-protection), and **capstone(s)** deep in the tree. The tree also governs the size of the matching-amplify.
- **Archetype tilts the gem:** all combos valid, no bad pairings.

### 6f. Veinbinder Skill Trees (LOCKED — structure; node contents open)
The player character's own permanent progression — the roguelite meta-layer. **Funded by Worldvein** (pure currency spend; every run's harvest converts into permanent account power). Separate from gem trees.
- **TREE 1 — The Bond (party buffs):** permanent stat boosts your essence grants ALL bonded Adventurers — attack, defense, vitality, etc. Party-wide combat power.
- **TREE 2 — The Craft (passive/economy buffs):** crafting improvements, gathering yield/speed, idle-slot speed, farming bonuses (drop luck, Worldvein per node, crystal yields) — the "in-UI passives."
- Core tension: power now (Bond) vs. economy compounding (Craft).
- Node contents/costs: OPEN (balancing work).

### 6g. Court-Art Gems (SIDELINED — revisit later)
- Concept intact but parked: rare powerful gems from bound court spirits; likely the home for **bonus/flavor specials** (e.g. Summoner). 
- Open structural question (not mechanics): WHERE they drop — if only at the summit they're pure-endgame; may want them placed midway up the mountain instead. A content-placement decision, deferred.

### 6e. Character identity (LOCKED)
- **You CREATE your characters** (not gacha-pulled, not looted). Character creation = the acquisition method. This is the "bound to the player" feel and the anti-gacha guarantee.
- **Party of 3 fielded** from a larger self-made roster (Granado Espada-style stable).
- **No gacha-gated power. Ever.** Nothing required for endgame is locked behind pulls or a cash shop.

---

## 7. LOOT & ECONOMY

### 7a. Gear (LOCKED — updated July 2026)
- **Weapons drop; armor is crafted** (full model in §7c). Set-based armor (set bonuses) remains a design option within crafted sets.
- **Ratings are final per item** — no reforging, no stat rerolling. Growth = weapon merging (weapons) / sockets + better crafts (armor).
- **Weapon quality:** content difficulty sets the tier; 1–100 rating RNG within tier. **Armor quality:** material tier sets the tier; craft rolls the rating.

### 7b. Anti-Collapse Guardrails (LOCKED — learned from Eternal Hero's endgame convergence)
- **Rule 1: Building an alternative loadout must stay affordable.** The moment a second setup costs "months," you've rebuilt Eternal Hero's trap where everyone converges on one best-in-slot.
- **Rule 2: Gear/trinkets/sets must be SITUATIONALLY best, not globally best.** Make rarity-set best for farming, defense-set best for progression bosses, etc. — so the "best" changes by activity and players own/swap several. (Eternal Hero shipped 20 trinkets, players used 3–4 — dead content to avoid.)

### 7c. Crafting, Gathering & Empowerment (LOCKED at principle level; numbers to prototype)

**GEAR ACQUISITION — two clean streams (LOCKED July 2026, supersedes the earlier two-axis model & "no merging"):**
- **WEAPONS = the DROP chase.** RNG loot from fighting only. Drop at a quality tier (Common → … → Legendary) set by content difficulty, with a **1–100 rating** within each tier (a Legendary can roll 1/100 to 100/100) — re-farming chases a higher roll; the jackpot axis.
  - **Weapon merging (EQ Legends-style, LOCKED):** feed dropped weapons into your main weapon to EMPOWER it (+ Worldvein cost per infusion) — lore: "draining the dropped weapon's magic into yours," a Veinbinder act. Same-type fodder = full value; off-type = partial. Higher quality/rating fodder = more empowerment value. Rating stays the base jackpot; empowerment stacks on top ("great base, fully infused" = the dream). Makes EVERY weapon drop fuel — the item-farming economy.
- **ARMOR = the CRAFT chase (armor NEVER drops).** Recipes known from the start (never drop). Crafted at the town Crafter from gathered materials (Fabric + Metal per the universal rule below); **each craft ROLLS a 1–100 rating** — materials are your attempts, keep crafting for a better roll.
  - **Quality tiers gate on materials:** the next armor quality requires better foraged materials from **higher-World gathering** — gathering progression IS armor progression (tiers the gathering skills by World).
  - **Sockets: one slot every 2 quality tiers** (quality 2 = 1 socket, quality 4 = 2, …). **Armor gems** (socket gems) DROP from bosses/rares and grant **PASSIVE buffs only** (stat boosts — crit, regen, yield, etc.; never active abilities — actives live exclusively in class gems). Craft the shell from gathering; socket the magic from fighting — both loops feed the same piece.
  - Merging = weapons only (armor doesn't drop, doesn't merge; its growth = craft better + socket gems).
- **The division's purpose:** fighting feeds weapons, gathering feeds armor — BOTH production loops are load-bearing, and armor gems + weapon fodder keep combat farming rich beyond Worldvein alone.

**Gathering trio (passive / idle, Melvor Idle-style skill progression):**
- **Mining** → ore → (Harbor smelt) → **ingots** (metal).
- **Woodcutting** → timber → **planks/hafts** (wood).
- **Fabric/Textile** → fibers/hide → **cloth/leather** (fabric).

**Universal material rule (LOCKED — solves dead-skill problem):**
- **Every WEAPON needs Wood + Metal** (haft/stave = wood; blade/head/fittings = metal) → requires Woodcutting + Mining.
- **Every ARMOR needs Fabric + Metal** (even light armor uses chainlink / metal-woven fabric; heavy armor = metal-heavy w/ fabric backing) → requires Fabric + Mining.
- **Mining (metal) is the universal backbone** — in ALL gear. Wood and Fabric are the two specialization axes (weapon side vs armor side). No player ever ignores a gathering skill: everyone needs metal always, wood for weapons, fabric for armor.
- Only **2 materials per item** (not 3) — avoids the tedious "max 3 skills to upgrade one thing" trap.
- **Material PROPORTIONS vary by gear type** (signals the item's nature without new systems): plate = metal-heavy/little fabric; robe = fabric-heavy/little metal; greatsword = metal-heavy/some wood; bow = wood-heavy/some metal.
- **Empowerment consumes BOTH of an item's materials each upgrade** (+ Worldvein).

| Item type | Materials | Gathering skills |
|---|---|---|
| Any weapon | Wood + Metal (proportion varies) | Woodcutting + Mining |
| Any armor | Fabric + Metal (proportion varies) | Fabric + Mining |

Processed at the **Harbor** (ore→ingot, timber→plank, fiber→cloth), then spent with **Worldvein** to empower. Lore-fit: the People of the Vein were smiths; Harbor reviving forge/weave craft is their heritage. **Party composition still tilts gathering priorities** (a metal-heavy party leans mining harder) on top of the universal baseline.

**GOVERNING RULE (the balance value — hold this):**
> **No single grind-wall. Progression must be reliable and FAST enough to feel steady. Never require weeks of gathering to upgrade one item (×5–6 slots) just to pass one boss.**
- Grinding should be reliable and fast; walls surmountable through normal play, not marathon grinding.
- Power curves tuned so you gear up → empower a bit → break the wall → move up. No month-long gates.
- The 3+ character roster spreads the load — progress several characters, not a month into one item.
- Exact numbers/curves are a PROTOTYPE-tuning problem, not a paper problem.

### 7d. Worldvein — THE Single Currency (LOCKED)
- **Worldvein is the game's ONE currency.** No separate idle currency, no split economies — everything runs on Worldvein. (Simplification locked to avoid balancing two currencies.)
- Collected on active combat-map expeditions, carried back to the Harbor.
- **Spent on:** permanent character upgrades, unlocking idle slots, accelerating idle gain speed, and (likely) whatever crafting/warding becomes.
- Not a prestige currency — no reset.

### 7f. Monetization Principle (LOCKED — hold as hard as the no-gacha rule)
> **Monetization sells TIME, CONVENIENCE, and COSMETICS — never POWER. Everything purchasable with cash is ALSO purchasable with Worldvein (in-game currency). Nothing affecting combat strength is ever paywalled.**

- **Governing test:** everything sold must be a **rate / convenience / cosmetic** boost, never a **power / stat** boost.
- **Passes cleanly:**
  - **Guild boost** (monthly) — small overall bonuses to **gathering amounts + processing time**. Pure time/convenience (materials are free-earnable by anyone). ✓
  - **Cosmetic standout / visual prestige** for paying/subscribed players — pure vanity, zero power. The *healthiest* monetization; lean into it. ✓
- **Conditional (rate-only, never power):**
  - **Monthly character boost** — OK only if it boosts XP/gathering *rate* (time), NOT combat stats/power.
  - **Idle-slot unlocks/rentals** — OK because idle only levels player-level/skills (power-neutral; active play grants the same). Player flagged rentals as feeling "predatory"; acceptable under the principle but consider one-time unlock vs recurring rental. 
- **The through-line:** anything sold must be buyable with Worldvein too (Melvor-style — their premium unlocks are buyable with in-game currency). Cash = a shortcut, never an exclusive.

### 7h. Gathering & Processing — Melvor-Derived Detail (LOCKED direction)
Melvor studied as the model for gather→process→use chains (Melvor itself is single-player, NO player trading — so it informs gathering/crafting only, not the market).
- **Gather → process → empower chain:** Mining→ore→(Harbor smelt)→ingots→empower metal gear; Woodcutting→timber→planks; Fabric→fibers→cloth. Mirrors Melvor's Mining→Smithing→gear dependency.
- **Per-item Mastery (steal this — it's Melvor's depth engine):** beyond the *skill* level, each individual material/action has its own **Mastery** level that rises by gathering it (faster gather, less failure, more yield). Keeps low-tier materials worth gathering; gives thousands of hours of depth. Recommend adopting per-material mastery for Mining/Woodcutting/Fabric.
- **Node flavor:** small liveliness touches (Melvor: mining rocks have HP + respawn; trees infinite). Optional polish.
- **True idle:** gathering accrues while away.

### 7e. Marketplace — System-Controlled Dynamic Vendor (LOCKED; gear-trade deferred)
Chosen over a player-listing auction house to eliminate the exploit/moderation surface that kills player economies (no price-fixing, undercutting wars, listing scams, minimal RMT/bot incentive) and to be far simpler to build and fully controllable.

- **Central-pool dynamic vendor:** players buy from / sell to a **system pool** at the current price. **No direct player-to-player trades.**
- **Currency: Worldvein** (single currency for market + everything).
- **Pricing: hybrid** — an authored **simulated baseline curve** (we control cycles, dampen swings, prevent crashes/hyperinflation) + **real aggregate-demand nudges** (more buying → price rises; more selling → price falls). Feels alive from day one with few players; grows more real as population grows.
- **Price floor = vendor sell price.** An item never drops below its NPC-vendor value — gathering/farming always has baseline worth.
- **The SINK:** Worldvein spent on item empowerment/upgrades (§7c) pulls currency out, countering inflation. Critical — the empowerment system IS the economic sink.
- **Meta-game:** players watch prices, time sales, buy dips, hold for rises — real engagement from a system we fully control, without P2P toxicity.
- **At launch: commodities only** — raw + processed materials and consumables (fungible, easy to price on a supply/demand curve).
- **DEFERRED (later phase): full gear trading.** Player is open to a full gear-trade market *because* gear is player-farmed and each item is varied (the 1–100 rating makes every piece unique). NOT at launch. **Open problem when built:** unique-rated gear doesn't fit a simple fungible supply/demand curve — likely needs player-set or per-item pricing, reintroducing some complexity the commodity market avoids. Since Worldvein can't be bought with cash and gear is farmed (not cash-bought), a gear market doesn't inherently break pay-to-win — but revisit against the monetization principle when building.

### 7g. Item Tradeability by Type
- **Materials (raw + processed):** the commodity-market backbone (gatherers sell to crafters). Launch.
- **Consumables/wards:** steady-demand commodity trade. Launch.
- **Gear:** deferred gear-trade phase (see §7e). Farmed, unique-rated.
- **Gems (class/court-art):** tradeability TBD — they're build power; flag against monetization principle before enabling.

---

## 8. GAMEPLAY — Two Modes (LOCKED)

The game is split into two distinct activities, each with its own mode. This deliberately separates passive progression from active play so neither contaminates the other (solves the "most UI games just idle-farm a zone and feel dead" problem).

### 8a. Idle Slots & Gathering Slots — Two Separate Systems (LOCKED)

**Idle slots and gathering slots are DISTINCT — a character can only be in one at a time** (you decide: is this Adventurer skill-grinding, or gathering?).

**Idle slots (character advancement):**
- Park a **bench** character to passively gain **player-level + skills** — **per-character** growth (this specific Adventurer improves). NOT gear, NOT Worldvein, NOT loot.
- Up to 3 idle slots (1st free, 2nd/3rd unlockable — cash-shop-style OR earnable in-game). Worldvein can accelerate idle gain speed.
- A bonus/catch-up layer for the bench; true idle (progresses while away). Suits mobile/limited playtime.

**Gathering slots (material production):**
- Park a character to run a **gathering skill** (Mining/Woodcutting/Fabric).
- **Gathering skills are bound to the PLAYER (the Veinbinder) — account-wide.** The *player's* gathering-skill level defines the **yield**.
- **The character produces nothing for themselves** — no personal XP/growth. They're the labor; your player skill sets output. (This is the tradeoff vs idle: idle grows the *character*, gathering grows your *material stockpile*.)
- True idle (produces while away).

**The core allocation decision:** each bench character is EITHER growing themselves (idle) OR producing materials for your operation (gathering) — never both. Meaningful resource-allocation every session.

**Roster purpose:** creates a real reason to build MORE than 3 characters (fielded party of 3 + idle-slotted + gathering-slotted) — Granado-style stable with mechanical purpose.

### 8b. Active Combat Map — ACTIVE PLAY (LOCKED)
- The branching **mountain map** is active-only gameplay, played in 15–30 min sittings.
- **Rewards: gear + Worldvein + weapon-skill XP + player level.** (Active play advances your damage engine and level, not just idle.)
- **Combat auto-RESOLVES** (idle-fighter style — classes auto-fire their skills; you do NOT tap individual attacks), but you ACTIVELY **navigate and make choices** — the interactivity is in *traversal and routing*, not in combat inputs.
- Combat itself is fully automatic per earlier decision (classes fire skills like most idle-fighter games). Interactivity lives entirely in map traversal.

### 8c. The Expedition Map — "Unexplored Territory" Model (LOCKED)
**Territory, not a route.** Large sprawling map (vertical AND horizontal, pannable, bigger than one screen), ~30–45 nodes (Forge wings 25–35 each; Castle 40+). The feel: dropped into unexplored wilderness — genuine frontier choices in multiple directions, not a hiking path.

**Entrances/exits per map (tied to the mountain spiral):**
- W1 Shoreline Forest: **south entrance → northeast exit**
- W2 Peninsula Town: **southwest entrance → northwest exit**
- W3 Ravine Path: **southeast entrance → northeast-quadrant exit**
- W4 Forge: **central entrance/exit; 4 bosses, one per quadrant**
- W5 Upper Castle: **central entrance, stairs just above; 3 bosses at west, north, east**
- W6 Summit: Vaelyx
- Boss/exit placement has random variance within its quadrant — "north-ish" is knowable, the exact spot isn't. Entrance/exit locations learnable from the map visual (eventual art) or **previous runs** — repeat runs build earned insight.

**Fog of war (core exploration mechanic):** at start you see only the entry node + immediate connections. Clearing a node reveals its connected neighbors (positions only — types stay hidden until entered; two-layer mystery). The revealed-but-uncleared frontier always offers multiple directions.

**Connectivity & texture:** organic web with loops (2–4 edges per node), occasional long edges to lone distant nodes (curiosity bait), **dense encounter-clusters AND quiet "deep-forest trail" stretches, dead ends and map edges — all randomly placed.** The generator creates texture, not uniform spread. Vein crystals biased away from the entry→boss drift (reward wandering).

**Rares as wards (the beeline rework):** the boss node, once discovered, is **sealed** — warded by the World's 2–3 roaming rares. Kill all rares this run → seal breaks → boss fightable, and the shortest revealed path lights up. Rares roam the revealed map (move ~1 edge per node you clear). Run rhythm: explore outward → hunt the roaming rares → break the seal → push to the boss.

**Travel & RESPAWNS (LOCKED — supersedes "cleared = safe forever"):** move to any node adjacent to cleared territory. **Cleared nodes RESPAWN behind you** (EQ-dungeon style): each cleared node has a chance to repopulate as you clear others (~every 3–4 node-actions elsewhere; tunable). Moving through a respawned node = a fight, or route around it — the positioning/pacing game. **Your clearing speed vs. respawn pressure IS the power-curve read** (weak parties bog down; strong parties outpace). **Named spawns:** a respawned node has a small chance (~10%, tunable) to return as a **named rare variant with boosted/special loot** — visibly different glow when revealed; the reason re-clearing excites. Lore is native: the Worldvein literally regenerates manifestations (canon).

**Extraction & persistence (LOCKED):** **extract = bank everything, map RESETS** — next entry generates a fresh territory (roguelite reset; growth between runs is what makes fresh starts feel good, via the Veinbinder tree + gear/gem investment). Death = same reset, keeping only banked. Boss-kill = clear, back to World map. The ONLY mid-run persistence is app-close (map frozen, resume in place).

**Combat screen — "eye candy" requirement (LOCKED direction):** fights must show real information and spectacle, not just draining bars — **special-ability buttons visibly click/flash as they auto-fire**, attacks/hits/heals/crits all visible. Tension comes from swinginess (crits, enemy spikes, healer catch-up moments) and run-level vitality pressure, with short fights (~10–20s; rares/bosses longer). **Diegetic frame: the player watches through mana-forged imagination/telepathy — the Veinbinder's remote sight through the essence bond** (fits the cold/projection art rule).

**Node types (LOCKED — 4 types):**
1. **Normal fight** — standard combat vs zone manifestations (~1–3 enemies). Standard loot + Worldvein. Map filler / steady farm.
2. **Rare fight** — the roaming rare mobs (mini-bosses) that WANDER the map. Tougher, better loot. Clearing the 2–3 rares unlocks the beeline to the boss.
3. **Worldvein crystal** — a fight **slightly harder than normal**, with a crystal deposit yielding **more Worldvein** (concentrated harvest). The reason to fully explore vs beeline.
4. **Boss fight** — the fixed main boss at the pinnacle. The World's gear-wall. Best drops for the tier.

- **All nodes are UNKNOWN until entered** — you see a node on the map but not its type/contents until you engage. Makes traversal genuinely exploratory (reveal, don't pre-optimize a route); keeps roaming rares hidden until encountered.
- **All fights reward Worldvein**; crystal nodes reward more (the full-clear incentive; supports the ~2–3× full-clear-vs-beeline balance).
- **Random healing crystal** can appear for party sustain (NOT a 5th node type — a pleasant random surprise that balances the tension of unknown nodes).
- **DEATH = teleport party back to Veinharbor, map resets, NO PENALTY.** You keep everything banked; the expedition simply ends. Rationale: death becomes pure *information* — a clean read on party power ("not strong enough yet, go empower and retry"), consistent with the anti-grind-wall / phone-light / low-stress philosophy. Death is a measuring stick, not a punishment.
- **Goal = explore and clear the map**, not pick one path (fits a loot game — you want to hoover up all the loot, not agonize over skipping nodes).
- **2–3 mini-bosses = roaming rare mobs** that WANDER the map (dynamic — not fixed nodes). Hunt them down; each drops loot. Locations differ per run.
- **Main boss = fixed at the pinnacle/top** of the map. It is the World's gear-wall (can't beat it until geared enough).
- **Beeline mechanic:** once the 2–3 mini-bosses are cleared, the player can rush straight to the main boss and skip the rest. So: full-explore = more loot, longer; beeline = fast farm of just the main boss.
  - Early runs = forced exploration (learn the World, gear up). Repeat runs = optional exploration for bonus loot, or beeline to farm efficiently.
- **Full-clear vs. beeline balance target:** full clear ≈ 2–3× the time of a beeline for ≈ 2–3× the loot — roughly linear, so neither is a trap. Plus a **map-clear completion bonus** (bonus Worldvein / guaranteed rare / chest) to make full-clear a real choice when maximizing yield.

### 8d. Timing Spec (LOCKED as targets; fight lengths to revisit)
- **Full level clear:** 30–60 min, played across multiple **15–30 min sittings** (immersive but segmented — dip in and out over an evening).
- **Beeline (main boss only):** ~15 min — the short-session farm path for nights without much time.
- **Fight lengths (REVISIT later):** rough targets — trash 20–40s, mini-boss/rare 1–2 min, main boss several min.
- **Map size:** large — ~30–50 nodes, roaming rares, possibly sub-areas. A World is "a place you spend an evening in."
- **Persistence (HARD REQUIREMENT):** combat-map run state must save continuously and resume across app closes (where you are, what's cleared, which rares are dead, current HP/resources). Server-authoritative helps here.

### 8e. Skill/Progression Sourcing (LOCKED)
- **Weapon skills + player level** gained via BOTH active combat AND (for gathering skills) idle.
- **Idle** = skill XP + currency, no loot.
- **Active combat** = gear + Worldvein + weapon-skill XP + player level.
- **Skill gain philosophy (from earlier):** grind + risk — repetition levels safely; pushing above level gives multiplied XP but real fail chance.

- **Combat-map close-app behavior (LOCKED):** the map is **persistent/frozen** — close the app mid-expedition, reopen, and you're exactly where you were on the map. It does NOT resolve while away (combat map is active-mode, not idle).
- **Map generation (LOCKED):** the combat map is **procedurally generated every time it's opened** — fresh random layout, random node placement, roaming rares spawn fresh. **A clear path to the boss always exists** at the pinnacle (every run is different but always completable).

---

## 9. OUTSTANDING / FLAGGED ITEMS (current as of July 2026)

### High priority (spine-level, still open)
1. **Class gem talent tree contents** — actual spine/branch/capstone nodes per gem (Tank/DPS/Controller/Healer). Framework locked; contents undesigned. The biggest open system.
2. **World content detail** — per-World enemy rosters, specific boss designs/identities (the 7 court members + Vaelyx + Worlds 1–3 bosses), gear/level bands per World.
3. **Veinbinder tree node contents** — The Bond + The Craft structures locked (§6f); actual nodes/costs open (balancing work).
4. **Combat screen detail design** — eye-candy layout locked in direction (§8c); the concrete screen (button placement, special-fire visuals, feed format) needs design.

### Medium priority (systems needing detail)
5. **Armor tier stat-spreads** — Heavy/Medium/Light directions locked; actual numbers = prototype tuning.
6. **Weapon skill trees** — each of the 8 weapons needs its tree designed (content load; consider phasing some post-launch).
7. **Fight lengths & respawn/named-spawn rates** — locked as tunable targets; tune via prototype.
8. **Court-art gem mechanics** (PARKED) — placement resolved (§5b: the 7 forge+castle bosses). Mechanic leaning: a 2nd gem slot augmenting the matching class gem (adds behavior, not just numbers). Summoner-style specials live here.
9. **Armor gem (socket gem) roster** — the passive buff list and drop distribution.
10. **Player-role name** — **Veinbinder** is the frontrunner, not final (alts: Conduit, Veinwarden, Mythwarden, Mythbinder).

### Lower priority (later layers)
11. **Seasonal / long-term retention content** beyond end-World farming.
12. **Player gear-trade market** (§7e) — deferred; keep data model market-ready.
13. **Build/tech** — HTML5/JS (Vite React) → Capacitor iOS wrap; Apple Developer acct + Mac + Xcode at publish.
14. **Art production** — pixel-art vs painterly direction UNDECIDED (PixelLab connected & working; test targeted assets — esp. a glowing Mythros crystal — before committing). Per-World palettes, UI chrome, harbor painting (spec: ~2400×2048, ¾ elevated view, warm town / cold mountain), mountain map asset.

---

## 10. HARD "NEVER" LIST (LOCKED constraints)
- No gacha-gated power / no pay-to-win / no farm-one-specific-character-or-endgame-breaks.
- No ore/material grind that creates a **single grind-wall** (weeks to upgrade one item to pass a boss). Material-based armor crafting IS the armor path (§7c) — governed by "no grind-wall, reliable & fast."
- No reforging / no stat rerolling (drop/craft ratings are final per item; growth = weapon merging / armor sockets, never rerolls). *(NOTE: "no duplicate merging" was SUPERSEDED July 2026 — weapon merging is now a core system, §7c.)*
- No prestige treadmill / no progress reset / no astronomical number-scaling.
- No forced active-play grind (must respect idle-resolve + phone-light).
- No character movement (all actions via UI).
- No active abilities outside class gems (weapons = stats only; armor gems = passive only).
