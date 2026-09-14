import { useState } from 'react';
import './shell.css';

/**
 * ☰ — quick menu bottom sheet (docs/Eldrathor_UI_Shell_Lock.md).
 * Items: Island · Party · Town · Seam · Player · Help · Settings (placeholder).
 * During a run adds Extract with a confirm.
 */
const NAV = [
  { id: 'mountain', label: 'Island', glyph: '⛰' },
  { id: 'party', label: 'Party', glyph: '♟' },
  { id: 'town', label: 'Town', glyph: '⌂' },
  { id: 'afk', label: 'Seam', glyph: '∞' }, // DESIGN-OPEN: final AFK tab name
  { id: 'player', label: 'Player', glyph: '◎' },
];

export default function MenuSheet({ activeTab, inRun, canExtract, runVein, traceOn = false, onNavigate, onHelp, onDebug, onExtract, onClose }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="eld-sheet-backdrop" onClick={onClose} role="presentation">
      <div className="eld-sheet eld-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Menu">
        <div className="eld-sheet-grip" />
        <div className="eld-sheet-title">☰ Menu</div>
        <div className="eld-menu-list">
          {NAV.map((n) => (
            <button key={n.id} type="button" className={`eld-card eld-menu-item${activeTab === n.id ? ' is-current' : ''}`} onClick={() => onNavigate(n.id)}>
              <span className="eld-menu-glyph">{n.glyph}</span>
              <span>{n.label}</span>
              {activeTab === n.id && <span className="eld-menu-note">current</span>}
            </button>
          ))}
          <button type="button" className="eld-card eld-menu-item" onClick={onHelp}>
            <span className="eld-menu-glyph">?</span>
            <span>Help</span>
            <span className="eld-menu-note">this screen + basics</span>
          </button>
          <button type="button" className="eld-card eld-menu-item" onClick={onDebug} title="Playtest debug trace">
            <span className="eld-menu-glyph">🐞</span>
            <span>Debug trace</span>
            <span className="eld-menu-note">{traceOn ? 'recording' : 'off'}</span>
          </button>
          <button type="button" className="eld-card eld-menu-item" disabled title="Settings — placeholder">
            <span className="eld-menu-glyph">⚙</span>
            <span>Settings</span>
            <span className="eld-menu-note">soon {/* DESIGN-OPEN: settings contents */}</span>
          </button>
          {inRun && (
            <button type="button" className="eld-card eld-menu-item" disabled={!canExtract} onClick={() => setConfirming(true)}
              title={canExtract ? 'Extract from the run' : 'Finish the current fight first'}>
              <span className="eld-menu-glyph">⇱</span>
              <span>Extract</span>
              <span className="eld-menu-note">{canExtract ? `bank ${runVein} ❖` : 'after this fight'}</span>
            </button>
          )}
        </div>
        {confirming && (
          <div style={{ marginTop: 12 }}>
            <div className="eld-sheet-sub">Extract?</div>
            <div style={{ fontSize: 'var(--mv-text, 16px)', lineHeight: 1.4 }}>
              Bank {runVein} ❖ Worldvein and everything found. The map is gone when you leave.
            </div>
            <div className="eld-sheet-actions">
              <button type="button" className="eld-btn eld-btn-ghost" onClick={() => setConfirming(false)}>Stay</button>
              <button type="button" className="eld-btn" onClick={() => { setConfirming(false); onExtract(); }}>Extract</button>
            </div>
          </div>
        )}
        {!confirming && (
          <div className="eld-sheet-actions">
            <button type="button" className="eld-btn eld-btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
