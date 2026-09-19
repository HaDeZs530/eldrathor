/**
 * The equip flow — Anthony's ruling from the phone, 2026-09-19 (supersedes Item Model lock §6's
 * "tap a filled slot → that item's sheet"):
 *   1. Tapping ANY slot — filled or empty — opens the list of every item that fits it.
 *   2. Tapping an item in that list prompts **Equip** or **Cancel**.
 *   3. If the slot already holds something, Equip asks once more: "Replace <current> with <new>?" — **OK** or **Cancel**.
 *   The worn item sits first in the list; tapping IT opens its own sheet (Unequip · Empower · Open lattice).
 * Pure, so the prompts and the refusals are asserted directly.
 */
import { displayName } from './items.js';

/** What tapping a row in the slot list does: 'current' → the worn item's own sheet; 'blocked' → can't be taken; 'equip' → the Equip / Cancel prompt. */
export function pickAction(item, { currentId = null, wornByOther = null } = {}) {
  if (!item) return { kind: 'none' };
  if (currentId && item.id === currentId) return { kind: 'current' };
  if (wornByOther) return { kind: 'blocked', reason: `Worn by ${wornByOther} — unequip it there first` };
  return { kind: 'equip' };
}
/** A second confirmation is needed exactly when the slot already holds a DIFFERENT item. */
export const needsReplaceConfirm = (current, next) => !!current && !!next && current.id !== next.id;
/** `Replace Gullwatch Cleaver with Tidebreaker?` */
export const replaceMessage = (current, next) => `Replace ${displayName(current)} with ${displayName(next)}?`;
/** The slot list shows the worn item first, then everything else in the chosen sort order. */
export const wornFirst = (rows, currentId) => (currentId ? [...rows.filter((i) => i.id === currentId), ...rows.filter((i) => i.id !== currentId)] : rows);
