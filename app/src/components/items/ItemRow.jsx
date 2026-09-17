import { useRef } from 'react';
import { RARITY_COLOR, displayName, plainName, gearScore } from '../../progression/items.js';
import { useTestNumbers } from '../../debug/useTestNumbers.js';
import { itemPowerLine } from './itemNumbers.js';
import './items.css';

/**
 * The one item row — docs/Eldrathor_Item_Model_Lock.md §3.
 *   `Tidebreaker  [T3] [Rare] [72] +12   Equipped · Kessa`
 * Name in the rarity colour, tier chip, rarity chip, rating chip, +N when empowered, an "Equipped"
 * tag (with who) when worn. **No icons in lists.** Materials read as `[Rare] Ingot ×14` (§5).
 * Every item rendering in the app goes through this component.
 * `onLongPress` fires after LONG_PRESS_MS of held contact — the bag uses it to start a bulk selection.
 */
export const LONG_PRESS_MS = 450;

export default function ItemRow({ item, equippedBy, onClick, onLongPress, selected = false, right, note, disabled = false }) {
  const timer = useRef(null);
  const fired = useRef(false);
  const testNumbers = useTestNumbers();
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const down = onLongPress ? () => {
    fired.current = false;
    clear();
    timer.current = setTimeout(() => { fired.current = true; timer.current = null; onLongPress(item); }, LONG_PRESS_MS);
  } : undefined;
  const up = onLongPress ? () => clear() : undefined;
  const tap = onClick ? () => { if (fired.current) { fired.current = false; return; } onClick(item); } : undefined;
  if (!item) return null;
  const color = RARITY_COLOR[item.rarity] || 'var(--eld-text)';
  const isMaterial = item.kind === 'material';
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`eld-item-row${selected ? ' is-selected' : ''}${item.rarity === 'Mythic' ? ' is-mythic' : ''}`}
      style={{ '--rarity': color }}
      onClick={tap}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      disabled={onClick ? disabled : undefined}
    >
      <span className="eld-item-main">
        <span className="eld-item-name" style={{ color }}>{displayName(item)}</span>
        <span className="eld-item-chips">
          <span className="eld-item-chip">T{item.tier}</span>
          <span className="eld-item-chip" style={{ color }}>{item.rarity}</span>
          {!isMaterial && <span className="eld-item-chip">{gearScore(item)}</span>}
          {item.empower > 0 && <span className="eld-item-chip is-empower">+{item.empower}</span>}
          {isMaterial && <span className="eld-item-qty">×{item.qty || 1}</span>}
        </span>
        {note && <span className="eld-item-note">{note}</span>}
        {testNumbers && <span className="eld-item-note eld-test-numbers">{itemPowerLine(item)}</span>}
      </span>
      {equippedBy && <span className="eld-item-equipped">Equipped · {equippedBy}</span>}
      {right}
    </Tag>
  );
}

/** The item's plain name — what every surface except the bag list and the sheet header shows (§2). */
export { plainName };
