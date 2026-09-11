# Dual-Mode Art Direction Lock (2026-09-10)

> **Status:** LOCKED. Supersedes any conflicting language in `Eldrathor_Design_Doc.md` §3c / §9 item 14 until the full design doc body is restored from pre-placeholder history + these patches.
>
> **Also read:** `docs/Eldrathor_NodeMap_Art_Lock.md` (2026-09-11) for Mountain island → node map → fight theme ladder.

## §3c extension — DUAL GRAPHICAL MODES (LOCKED — Anthony + Boss, 2026-09-10)

Not pixel *or* painterly — **both**, mapped to the warm/cold rule.

- **WORLD mode** (town / planning / hub — Veinbinder physically in Veinharbor): **fun MICRO-PIXEL**, warm/sunlit. Chunky pixel-kit UI (hard edges, image-rendering crispness, warm ambers/wood). Warm reality = the pixel kit.
- **MIND VIEW mode** (Vein projection — combat / mind hub screens): **refined fantasy-sim** with **Mythros-blue magic aura**. Diegetic — the Veinbinder seeing the party in his head via blue magic, **NOT a second physical place**. Cold projection = the refined mind-view kit (Cinzel/fantasy display, soft aura frames, sapphire glow).
- **Mode switch** when entering/leaving Mind View must feel intentional — the signature "reaching out through the Vein" moment (sunlight → blue energy), not a silent theme flip.
- Asset pipeline: Boss generates candidates; Claude wires approved assets into the build.

Warm/cold master rule remains: warm reality ↔ WORLD pixel kit; cold projection ↔ MIND refined kit.

## Mountain theme ladder (LOCKED — Anthony + Boss, 2026-09-11)

1. **Island world map** → warm RPG micro-pixel (pannable landscape on portrait phone).
2. **Location/node travel map** → **hybrid** mana/RPG chrome + **parchment** hand-drawn fog-of-war route map (see `Eldrathor_NodeMap_Art_Lock.md`). Not full Mind-view.
3. **Fight / loot** → full Mind-view.

Forge/temple biome on the node map: **interior rooms/hallways with walls**, not outdoor stamps.

## Hub skins vs dual-mode (AFK/Town — 2026-09-11)

Aligned with `docs/Eldrathor_AFK_Town_Lock.md` / TabBar lock:
- **Town** (incl. Crafter / Upgrade / Market sub) → warm WORLD / `hub-rpg`.
- **AFK Gather + Idle/Train** → Mind-view / `hub-mind`.
- **AFK Process** → theme OPEN; prototype uses mind chrome + slight forge glow.
- Root Market tab removed; Market is under Town only.

## §9 item 14 — Art production RESOLVED

~~pixel-art vs painterly UNDECIDED~~ → **RESOLVED (2026-09-10): dual-mode, not either/or.** WORLD = fun micro-pixel (warm reality); MIND VIEW = refined fantasy-sim + Mythros-blue aura (cold Vein projection). Remaining production: Per-World palettes, UI chrome, harbor painting (~2400×2048), mountain map asset, hands-off asset pipeline later. PixelLab still useful for WORLD-mode assets (PC-only).

## Restore note for maintainers

Full `docs/Eldrathor_Design_Doc.md` body should be restored from git history at commit `dc59b7a3` (or blob `752c082e3279fb8729c794f3b2ffed1328d6d0aa`) with the three patches already applied in the working copy on this branch's build machine:
1. Date bump → September 10, 2026
2. Insert DUAL GRAPHICAL MODES block into §3c (see above)
3. Mark §9 item 14 RESOLVED as dual-mode

The current design doc on this branch holds a short stub pointing here so the lock is not lost.
