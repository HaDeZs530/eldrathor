import { useMemo, useState } from 'react';
import { sellValue } from '../progression/items.js';
import { FILTERS, SORTS, bagView, bulkSell } from '../progression/bag.js';
import ItemRow from './items/ItemRow.jsx';
import GemSheet from './items/GemSheet.jsx';
import { pickAction, needsReplaceConfirm, replaceMessage, wornFirst } from '../progression/equipFlow.js';
import ItemSheet from './items/ItemSheet.jsx';
import { PrimaryButton, SecondaryButton, Sheet } from './ui/index.jsx';
import './items/items.css';

/**
 * The Bag — docs/Eldrathor_Item_Model_Lock.md §5. ONE list (it replaces the old stash / armor /
 * materials lists): filter chips **All · Weapons · Armor · Cores · Materials**, sort
 * **Rating ↓ · Rarity · Newest**, rows per §3, no bag cap. Long-press (or the Select button) starts a
 * bulk **Sell** with a confirm; equipped items are skipped, never sold.
 */
export default function BagScreen({ bag, setBag, equipped, ownerOf, wearerOf, forArchetype = null, onOpenLattice, onUnequip, setWorldvein, slotFilter = null, compareTo = null, compareWith = null, onEquip, onEmpower, onUpgrade, onBack, title = 'Bag', emptyNote = 'Nothing here yet.' }) {
  const [filter, setFilter] = useState(slotFilter ? (slotFilter === 'weapon' ? 'weapon' : slotFilter === 'gem' ? 'gem' : 'armor') : 'all');
  const [sort, setSort] = useState('rating');
  const [open, setOpen] = useState(null);
  const [picking, setPicking] = useState(false);
  const [chosen, setChosen] = useState(() => new Set());
  const [confirming, setConfirming] = useState(false);
  // the equip flow (Anthony, 2026-09-19): in a slot list a row prompts Equip / Cancel; a filled slot then asks to Replace
  const slotMode = !!slotFilter && !!onEquip;
  const [replacing, setReplacing] = useState(null); // the item waiting on "Replace current with new?"
  const [blocked, setBlocked] = useState(null); // why a row can't be taken

  const rows = useMemo(() => { const list = bagView(bag, { filter, sort, slot: slotFilter }); return slotMode ? wornFirst(list, compareTo?.id) : list; }, [bag, filter, sort, slotFilter, slotMode, compareTo]);
  const isCurrent = (item) => !!compareTo && item.id === compareTo.id;
  function tapRow(item) {
    if (!slotMode) { setOpen(item); return; }
    const owner = ownerOf?.(item.id) || null;
    const a = pickAction(item, { currentId: compareTo?.id, wornByOther: owner && !isCurrent(item) ? owner : null });
    if (a.kind === 'blocked') setBlocked(a.reason); else setOpen(item);
  }
  function tryEquip(item) {
    setOpen(null);
    if (needsReplaceConfirm(compareTo, item)) setReplacing(item); else onEquip(item);
  }
  const toggle = (id) => setChosen((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const preview = useMemo(() => bulkSell(bag, chosen, equipped), [bag, chosen, equipped]);

  function sellOne(item) {
    if (equipped.has(item.id)) return;
    setBag(bag.filter((i) => i.id !== item.id));
    setWorldvein((v) => v + sellValue(item) * (item.qty || 1));
    setOpen(null);
  }
  function commitBulk() {
    const r = bulkSell(bag, chosen, equipped);
    setBag(r.bag);
    setWorldvein((v) => v + r.vein);
    setChosen(new Set()); setPicking(false); setConfirming(false);
  }

  return (
    <div className="eld-bag">
      <div className="eld-bag-controls">
        {onBack && <SecondaryButton onClick={onBack}>← Back</SecondaryButton>}
        {title && <div className="eld-display" style={{ fontSize: 'var(--mv-title, 26px)' }}>{title}</div>}
        {!slotFilter && (
          <div className="eld-bag-chips">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className={`eld-bag-chip${filter === f.id ? ' is-on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
          </div>
        )}
        <div className="eld-bag-chips">
          {SORTS.map((s) => (
            <button key={s.id} type="button" className={`eld-bag-chip${sort === s.id ? ' is-on' : ''}`} onClick={() => setSort(s.id)}>{s.label}</button>
          ))}
          <button type="button" className={`eld-bag-chip${picking ? ' is-on' : ''}`} onClick={() => { setPicking((p) => !p); setChosen(new Set()); }}>
            {picking ? 'Cancel' : 'Select'}
          </button>
        </div>
      </div>

      {rows.length === 0 && <div className="eld-bag-empty">{emptyNote}</div>}
      <div className="eld-bag-list">
        {rows.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            equippedBy={ownerOf?.(item.id)}
            selected={picking && chosen.has(item.id)}
            onClick={() => (picking ? toggle(item.id) : tapRow(item))}
            onLongPress={() => { setPicking(true); toggle(item.id); }}
            right={picking ? <span className="eld-item-chip">{chosen.has(item.id) ? '✓' : ''}</span> : null}
          />
        ))}
      </div>

      {picking && chosen.size > 0 && (
        <div className="eld-bag-bulk">
          <PrimaryButton onClick={() => setConfirming(true)}>Sell {chosen.size} · {preview.vein} ❖</PrimaryButton>
        </div>
      )}

      {open && open.kind === 'gem' && (
        <GemSheet
          gem={bag.find((i) => i.id === open.id) || open}
          wearer={wearerOf?.(open.id) || null}
          forArchetype={forArchetype}
          onClose={() => setOpen(null)}
          onEquip={onEquip && !equipped.has(open.id) ? tryEquip : undefined}
          onUnequip={slotMode && isCurrent(open) && onUnequip ? () => { setOpen(null); onUnequip(open); } : undefined}
          onOpenLattice={onOpenLattice && (!slotMode || isCurrent(open)) ? (g) => { setOpen(null); onOpenLattice(g.id); } : undefined}
          closeLabel={slotMode && !isCurrent(open) ? 'Cancel' : 'Close'}
        />
      )}
      {open && open.kind !== 'gem' && (
        <ItemSheet
          item={open}
          current={compareTo && compareTo.id !== open.id ? compareTo : null}
          compareWith={compareTo && compareTo.id !== open.id ? compareWith : null}
          equippedBy={ownerOf?.(open.id)}
          onClose={() => setOpen(null)}
          onEquip={onEquip && !isCurrent(open) ? tryEquip : undefined}
          onUnequip={slotMode && isCurrent(open) && onUnequip ? () => { setOpen(null); onUnequip(open); } : undefined}
          onEmpower={onEmpower && (!slotMode || isCurrent(open)) ? (i) => { onEmpower(i); setOpen(null); } : undefined}
          onUpgrade={onUpgrade ? (i) => { onUpgrade(i); setOpen(null); } : undefined}
          onSell={slotMode ? undefined : sellOne}
          closeLabel={slotMode && !isCurrent(open) ? 'Cancel' : 'Close'}
        />
      )}

      {replacing && (
        <Sheet onClose={() => setReplacing(null)} label="Replace equipped item" title="Replace?">
          <div className="eld-item-stats">
            <div className="eld-item-note" style={{ fontSize: 'var(--mv-text, 18px)', lineHeight: 1.4 }}>{replaceMessage(compareTo, replacing)}</div>
            <div className="eld-item-note">{compareWith ? `${compareWith} keeps the old one in the Bag.` : 'The old one goes back to the Bag.'}</div>
          </div>
          <div className="eld-item-actions">
            <PrimaryButton onClick={() => { const item = replacing; setReplacing(null); onEquip(item); }}>OK</PrimaryButton>
            <SecondaryButton onClick={() => setReplacing(null)}>Cancel</SecondaryButton>
          </div>
        </Sheet>
      )}
      {blocked && (
        <Sheet onClose={() => setBlocked(null)} label="Cannot equip" title="Already worn">
          <div className="eld-item-stats"><div className="eld-item-note" style={{ fontSize: 'var(--mv-text, 18px)', lineHeight: 1.4 }}>{blocked}</div></div>
          <div className="eld-item-actions"><SecondaryButton onClick={() => setBlocked(null)}>OK</SecondaryButton></div>
        </Sheet>
      )}

      {confirming && (
        <Sheet onClose={() => setConfirming(false)} label="Confirm bulk sell" title="Sell these?">
          <div className="eld-item-stats">
            <div className="eld-item-stat"><span className="eld-item-stat-k">Items</span><span className="eld-item-stat-v">{preview.sold}</span></div>
            <div className="eld-item-stat"><span className="eld-item-stat-k">Worldvein</span><span className="eld-item-stat-v">+{preview.vein} ❖</span></div>
            {preview.skipped > 0 && <div className="eld-item-note">{preview.skipped} equipped {preview.skipped === 1 ? 'item is' : 'items are'} skipped — equipped gear is never sold.</div>}
          </div>
          <div className="eld-item-actions">
            <PrimaryButton onClick={commitBulk} disabled={preview.sold === 0}>Sell</PrimaryButton>
            <SecondaryButton onClick={() => setConfirming(false)}>Cancel</SecondaryButton>
          </div>
        </Sheet>
      )}
    </div>
  );
}
