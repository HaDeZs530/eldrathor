import { Sheet, PrimaryButton, SecondaryButton } from '../ui/index.jsx';
import { GEM_TUNING, latticeFor, coreText, STAT_LABEL } from '../../lattice/classGems.js';
import { summary } from '../../lattice/engine.js';
import { isCrossing, matchAmp } from '../../progression/gems.js';
import { ARCHETYPES } from '../../data.js';
import './items.css';

/**
 * The gem sheet — Growth Model §1 / ClassGems_Live §4. Opened from a bag row or the character sheet's
 * Gem slot. Shows what the gem is, how far its lattice has grown, its own fragments, and what it does
 * for whoever wears it. Actions: **Equip / Unequip · Open lattice**. Gems are never sold.
 */
export const gemReadout = (gem) => summary(latticeFor(gem.gemClass), gem.lattice, {
  statLabel: (k) => STAT_LABEL[k] || k,
  procLabel: (k) => GEM_TUNING.procs[k]?.name || k,
  finisherLabel: (k) => GEM_TUNING.finishers[k]?.name || k,
});

export default function GemSheet({ gem, wearer = null, forArchetype = null, onClose, onEquip, onUnequip, onOpenLattice }) {
  if (!gem) return null;
  const archetype = wearer?.archetype || forArchetype;
  const crossing = archetype ? isCrossing(archetype, gem.gemClass) : null;
  const lines = gemReadout(gem);
  return (
    <Sheet onClose={onClose} label={gem.name} title={null}>
      <div className="eld-item-sheet-head">
        <div className="eld-item-sheet-special" style={{ color: 'var(--eld-mythros)' }}>◆ {gem.name}</div>
        <div className="eld-item-sheet-plain">
          Class gem · {gem.lattice.imbues}/{GEM_TUNING.points} imbued{wearer ? ` · worn by ${wearer.name}` : ' · not worn'}
        </div>
      </div>
      <div className="eld-item-stats">
        <div className="eld-item-stat"><span className="eld-item-stat-k">Fragments</span><span className="eld-item-stat-v">{gem.fragments?.unspent || 0} unspent · {gem.fragments?.imbued || 0} imbued</span></div>
        <div className="eld-item-stat"><span className="eld-item-stat-k">Worldvein sunk</span><span className="eld-item-stat-v">{Math.round(gem.lattice.worldveinSpent || 0)} ❖</span></div>
        <div className="eld-item-note"><strong>Core</strong> · {coreText(gem.gemClass)}</div>
        {archetype && (
          <div className="eld-item-note">
            {crossing
              ? `${ARCHETYPES[archetype]?.role || archetype} crossing → grants the Core ability.`
              : `Matching → no second ability; the personal innate is amplified ×${matchAmp(gem).toFixed(2)}.`}
          </div>
        )}
        {lines.length ? lines.map((l) => <div key={l} className="eld-item-note">{l}</div>) : <div className="eld-item-empty">Nothing imbued yet.</div>}
        {!wearer && <div className="eld-item-note">Equip to grow — an unworn gem gains no fragments.</div>}
      </div>
      <div className="eld-item-actions">
        {onEquip && <PrimaryButton onClick={() => onEquip(gem)}>Equip</PrimaryButton>}
        {onOpenLattice && <PrimaryButton onClick={() => onOpenLattice(gem)}>Open lattice</PrimaryButton>}
        {onUnequip && <SecondaryButton onClick={() => onUnequip(gem)}>Unequip</SecondaryButton>}
        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
      </div>
    </Sheet>
  );
}
