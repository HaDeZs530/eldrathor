/**
 * Bag list logic — docs/Eldrathor_Item_Model_Lock.md §5. Pure, so the filters, the sort order and the
 * "equipped items are skipped" rule of bulk sell are asserted directly by items.test.js.
 */
import { rarityIndex, sellValue, ARMOR_TYPES } from './items.js';

export const FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'weapon', label: 'Weapons', match: (i) => i.kind === 'weapon' },
  { id: 'armor', label: 'Armor', match: (i) => i.kind === 'armor' },
  { id: 'core', label: 'Cores', match: (i) => i.kind === 'core' },
  { id: 'material', label: 'Materials', match: (i) => i.kind === 'material' },
];
export const SORTS = [
  { id: 'rating', label: 'Rating ↓', cmp: (a, b) => b.rating - a.rating || rarityIndex(b.rarity) - rarityIndex(a.rarity) },
  { id: 'rarity', label: 'Rarity', cmp: (a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || b.tier - a.tier },
  { id: 'newest', label: 'Newest', cmp: () => 0 }, // the bag is append-ordered, so "newest" is the reverse
];
const slotOf = (type) => ARMOR_TYPES[type]?.slot || null;

/** The visible rows for a filter + sort, optionally narrowed to one equip slot (§6's empty-slot tap). */
export function bagView(bag, { filter = 'all', sort = 'rating', slot = null } = {}) {
  const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
  let list = (bag || []).filter((i) => i && f.match(i));
  if (slot) list = list.filter((i) => (slot === 'weapon' ? i.kind === 'weapon' : i.kind === 'armor' && slotOf(i.type) === slot));
  const s = SORTS.find((x) => x.id === sort) || SORTS[0];
  return sort === 'newest' ? [...list].reverse() : [...list].sort(s.cmp);
}

/**
 * Bulk sell (§5). **Equipped items are skipped**, never sold. Returns the next bag, the Worldvein
 * earned, and how many were sold / skipped so the confirm can say so.
 */
export function bulkSell(bag, ids, equipped = new Set()) {
  const wanted = ids instanceof Set ? ids : new Set(ids || []);
  const chosen = (bag || []).filter((i) => wanted.has(i.id));
  const sellable = chosen.filter((i) => !equipped.has(i.id));
  const vein = sellable.reduce((n, i) => n + sellValue(i) * (i.qty || 1), 0);
  const sold = new Set(sellable.map((i) => i.id));
  return { bag: (bag || []).filter((i) => !sold.has(i.id)), vein, sold: sellable.length, skipped: chosen.length - sellable.length };
}
