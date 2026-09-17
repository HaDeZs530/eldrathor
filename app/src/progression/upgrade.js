/**
 * "Is this drop an upgrade?" — docs/Eldrathor_Item_Model_Lock.md §12.
 * Pure, so the results screen's "↑ upgrade for <name>" line is asserted directly.
 */
import { weaponAttackPower, armorBonus, ARMOR_TYPES } from './items.js';

/** An item's own contribution in its slot, so it can be judged against the equipped piece. */
export function itemValue(item) {
  if (!item) return 0;
  if (item.kind === 'weapon') return weaponAttackPower(item);
  if (item.kind === 'armor') { const b = armorBonus(item); return b.hp + b.mit * 1000; }
  return 0;
}
export const slotOfItem = (item) => (item?.kind === 'weapon' ? 'weapon' : ARMOR_TYPES[item?.type]?.slot || null);

/** The equipped piece in the same slot for a geared member (as returned by `equip()`). */
export function equippedInSlot(member, slot) {
  if (slot === 'weapon') return member?.weaponItem || null;
  return (member?.armorItems || []).find((a) => ARMOR_TYPES[a.type]?.slot === slot) || null;
}

/** The first party member `item` would improve, or null when it beats nobody. */
export function upgradeFor(item, party = []) {
  const slot = slotOfItem(item);
  if (!slot) return null;
  const v = itemValue(item);
  const beaten = (party || []).find((m) => v > itemValue(equippedInSlot(m, slot)));
  return beaten ? beaten.name : null;
}
