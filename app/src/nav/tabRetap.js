/**
 * Tab re-tap — docs/CLAUDE_BRIEFS/2026-09-15_tab-retap-resets-root.md. Standard iOS behaviour: tapping
 * the ACTIVE tab pops its stack to root. Town → Harbor landing, Party → roster, Player / Hearth → root,
 * Mountain → island map UNLESS a run is active (then the route map is the root; Extract is the only way
 * back to the island). Switching tabs is unchanged. Pure: the app maps the action to state.
 *
 * @param {string} tab           the active tab id (the one being re-tapped)
 * @param {{runStage:string, inRun:boolean}} s  Mountain state: `inRun` = a territory exists
 * @returns {'root'|'island'|'stay'}  root = remount the tab's screen at its root (scroll to top);
 *          island = leave Rally for the island map; stay = do nothing (a run is active)
 */
export function retapAction(tab, { runStage = 'island', inRun = false } = {}) {
  if (tab !== 'mountain') return 'root';
  if (inRun) return 'stay';
  if (runStage === 'rally') return 'island';
  return 'root';
}
