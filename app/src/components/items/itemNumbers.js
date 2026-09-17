/**
 * Test-numbers lines for item rows / sheets (item-numbers brief §5): the item's computed power
 * contribution and its multiplier breakdown tier × rarity × rating × empower.
 */
import { tierMult, rarityMult, ratingScale, empowerScale, itemMult, weaponAttackPower, armorBonus } from '../../progression/items.js';
import { fmtMult } from '../../debug/testNumbers.js';

export function itemPowerLine(item) {
  if (!item) return '';
  if (item.kind === 'weapon') return `power ${weaponAttackPower(item).toFixed(2)} hit · mult ${itemMult(item).toFixed(3)}`;
  if (item.kind === 'armor') { const b = armorBonus(item); return `power +${b.hp.toFixed(1)} HP · +${(b.mit * 100).toFixed(2)}% mit · mult ${itemMult(item).toFixed(3)}`; }
  return `mult ${itemMult(item).toFixed(3)}`;
}
export function itemMultLine(item) {
  if (!item) return '';
  const parts = [`tier T${item.tier} ${fmtMult(tierMult(item.tier))}`, `rarity ${item.rarity} ${fmtMult(rarityMult(item.rarity))}`, `rating ${item.rating} ${fmtMult(ratingScale(item.rating))}`];
  if (item.kind === 'weapon') parts.push(`empower +${item.empower || 0} ${fmtMult(empowerScale(item.empower))}`);
  return parts.join(' × ');
}
