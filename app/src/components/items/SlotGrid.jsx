import Art from '../../art/Art.jsx';
import { EQUIP_SLOTS, SLOT_LABEL, RARITY_COLOR, gearScore } from '../../progression/items.js';
import './items.css';

/**
 * The character sheet's six equip slots — docs/Eldrathor_Item_Model_Lock.md §6.
 * Weapon · Body · Head · Hands · Feet · Gem, one premade icon each (art manifest `icon-slot-*`).
 * FILLED: the item's rarity tints the slot's top border and the rating shows under the icon.
 * EMPTY: greyed with a "nothing equipped" state. Tap a filled slot → the item sheet; tap an empty one
 * → the bag filtered to that slot for this Adventurer, with Compare on each row. The gem slot reads
 * "Coming — not yet active" until M2 lock 2.
 */
export const GEM_NOTE = 'Coming — not yet active';

export default function SlotGrid({ items = {}, onOpen, onPick, locked = false }) {
  return (
    <div className="eld-slot-grid">
      {EQUIP_SLOTS.map((slot) => {
        const item = items[slot] || null;
        const isGem = slot === 'gem';
        const color = item ? RARITY_COLOR[item.rarity] : null;
        const disabled = locked || isGem;
        return (
          <button
            key={slot}
            type="button"
            className={`eld-slot${item ? '' : ' is-empty'}${disabled ? ' is-locked' : ''}`}
            style={color ? { '--rarity': color } : undefined}
            disabled={disabled}
            aria-label={`${SLOT_LABEL[slot]}${item ? `: ${item.rarity} ${item.type}` : ': nothing equipped'}`}
            onClick={() => (item ? onOpen?.(item, slot) : onPick?.(slot))}
          >
            <span className="eld-slot-icon">
              <Art name={`icon-slot-${slot}`} alt="" fit="contain" fallback={<span aria-hidden="true">{GLYPH[slot]}</span>} />
            </span>
            <span className="eld-slot-label">{SLOT_LABEL[slot]}</span>
            {item
              ? <span className="eld-slot-rating">{gearScore(item)}{item.empower > 0 ? ` +${item.empower}` : ''}</span>
              : <span className="eld-slot-empty-note">{isGem ? GEM_NOTE : 'nothing equipped'}</span>}
          </button>
        );
      })}
    </div>
  );
}

const GLYPH = { weapon: '⚔', body: '▣', head: '⬡', hands: '▥', feet: '▤', gem: '◆' };
