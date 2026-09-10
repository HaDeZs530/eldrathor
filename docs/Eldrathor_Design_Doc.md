# ELDRATHOR — Game Design Document

*Master design record, current through September 10, 2026. Split into **LOCKED** (decided), **OPEN/FLAGGED** (still to resolve), and **PARKED** (shelved for later). Later sections supersede earlier ones where noted; §9 lists everything still open.*

---

## CRITICAL — Temporary stub (restore staged — assemble pending)

The full body was truncated during a large MCP push. **All LOCKED design from commit `dc59b7a3` remains in force.** Dual-mode art lock also in `docs/Eldrathor_DualMode_Art_Lock.md`.

### Restore payload (ready on this branch)
Verified base64 parts live under `docs/_restore_b64/` (parts 00–05 whole; 06–09 as `partNNq*` quarters). Expected SHA256 of decoded body: `2162368bf7186ba2b12e1ede4a09de03fe1f5fce2b19670e525b574e3ac8f7a3` (~56945 bytes). Includes **DUAL GRAPHICAL MODES** in §3c and §9 item 14 **RESOLVED**, plus **§8c The Expedition Map**.

**Assemble locally (no clone of secrets needed if you already have the tree):**
```bash
bash docs/_restore_b64/assemble.sh
# writes docs/Eldrathor_Design_Doc.md ; commit message:
# Restore full Eldrathor_Design_Doc.md with dual-mode art lock
```

**Or via Actions:** copy `docs/_restore_b64/RESTORE_WORKFLOW.yml` → `.github/workflows/restore-design-doc.yml` (requires GitHub token `workflow` scope; user-Github MCP returned 404 writing workflows), then `workflow_dispatch` or push under `docs/_restore_b64/**`.

### Dual-mode summary (LOCKED)
- **WORLD** = fun MICRO-PIXEL, warm/sunlit (Veinbinder in Veinharbor).
- **MIND VIEW** = refined fantasy-sim + Mythros-blue aura (diegetic Vein projection, not a second place).
- Mode switch on enter/leave mind view must feel intentional.
- Warm reality = pixel kit; cold projection = refined mind-view kit.
