import {
  RARITY_COLOR, displayName, plainName, weaponAttackPower, weaponTempo, weaponMit,
  armorBonus, sellValue, upgradeStepFor,
} from '../../progression/items.js';
import { Sheet, PrimaryButton, SecondaryButton } from '../ui/index.jsx';
import './items.css';

/**
 * The item sheet — docs/Eldrathor_Item_Model_Lock.md §3. Opened from a bag row or a character slot.
 * Header: special name + plain name. Then REAL stats — Attack Power (the item's hit contribution at
 * its current rating and empower), Attack Speed, Mitigation, Bonus stats (empty until gems).
 * Actions: **Equip · Compare · Empower · Sell**. There is no Scrap.
 * Compare shows the delta against what the target Adventurer already wears in that slot.
 * The sheet inherits the mode underneath it (Style Bible §D — `Sheet` freezes the column).
 */
export function itemStats(item) {
  if (!item) return [];
  if (item.kind === 'weapon') {
    return [
      ['Attack Power', weaponAttackPower(item), (v) => v.toFixed(1)],
      ['Attack Speed', weaponTempo(item), (v) => `${v.toFixed(2)} s`, 'lower'],
      ['Mitigation', weaponMit(item) * 100, (v) => `${v.toFixed(0)} %`],
    ];
  }
  if (item.kind === 'armor') {
    const b = armorBonus(item);
    return [['HP', b.hp, (v) => v.toFixed(0)], ['Mitigation', b.mit * 100, (v) => `${v.toFixed(1)} %`]];
  }
  return [];
}

function Delta({ now, was, fmt, better = 'higher' }) {
  if (was == null) return null;
  const d = now - was;
  if (Math.abs(d) < 0.005) return <span className="eld-item-note"> · same</span>;
  const good = better === 'lower' ? d < 0 : d > 0;
  return <span className={good ? 'is-up' : 'is-down'}> {d > 0 ? '+' : '−'}{fmt(Math.abs(d))}</span>;
}

export default function ItemSheet({
  item, current = null, equippedBy, compareWith,
  onClose, onEquip, onEmpower, onSell, onUpgrade,
}) {
  if (!item) return null;
  const color = RARITY_COLOR[item.rarity] || 'var(--eld-text)';
  const rows = itemStats(item);
  const currentRows = current && current.id !== item.id ? itemStats(current) : null;
  const step = upgradeStepFor(item);
  return (
    <Sheet onClose={onClose} label={plainName(item)} title={null}>
      <div className="eld-item-sheet-head">
        <div className="eld-item-sheet-special" style={{ color }}>{displayName(item)}</div>
        <div className="eld-item-sheet-plain">
          T{item.tier} · {plainName(item)}
          {item.empower > 0 && ` · +${item.empower}`}
          {equippedBy && ` · equipped by ${equippedBy}`}
        </div>
      </div>

      <div className="eld-item-stats">
        {rows.length === 0 && <div className="eld-item-empty">No combat stats — {item.kind === 'core' ? 'a Smith upgrade component.' : 'a crafting material.'}</div>}
        {rows.map(([k, v, fmt, better], i) => (
          <div key={k} className="eld-item-stat">
            <span className="eld-item-stat-k">{k}</span>
            <span className="eld-item-stat-v">
              {fmt(v)}
              {currentRows && <Delta now={v} was={currentRows[i]?.[1]} fmt={fmt} better={better} />}
            </span>
          </div>
        ))}
        <div className="eld-item-stat">
          <span className="eld-item-stat-k">Bonus stats</span>
          <span className="eld-item-empty">none until gems</span>
        </div>
        {compareWith && <div className="eld-item-note">Compared with {compareWith}</div>}
      </div>

      <div className="eld-item-actions">
        {onEquip && <PrimaryButton onClick={() => onEquip(item)}>Equip</PrimaryButton>}
        {onEmpower && item.kind === 'weapon' && <SecondaryButton onClick={() => onEmpower(item)}>Empower</SecondaryButton>}
        {onUpgrade && step && <SecondaryButton onClick={() => onUpgrade(item)}>Upgrade → {step.to}</SecondaryButton>}
        {onSell && <SecondaryButton onClick={() => onSell(item)} disabled={!!equippedBy}>
          {equippedBy ? 'Equipped' : `Sell · ${sellValue(item) * (item.qty || 1)} ❖`}
        </SecondaryButton>}
        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
      </div>
    </Sheet>
  );
}
