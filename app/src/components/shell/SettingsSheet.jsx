import { useRef, useState } from 'react';
import './shell.css';

/**
 * ☰ Menu → Settings (Progression Loop Lock §1): Export save (JSON to clipboard, with a selectable box
 * as the fallback on plain http), Import (paste → validated → installed → reload), Reset (confirm →
 * cleared → reload). The save store is injected from AppRoot.
 */
export default function SettingsSheet({ store, onClose }) {
  const [mode, setMode] = useState('menu'); // menu | export | import | reset
  const [text, setText] = useState('');
  const [note, setNote] = useState(null);
  const taRef = useRef(null);

  async function doExport() {
    const t = store.exportText();
    setText(t); setMode('export'); setNote(t ? null : 'No save yet — play a little first.');
    if (!t) return;
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(t); setNote('Copied to clipboard'); return; } } catch { /* fall through */ }
    setNote('Select the text and copy it');
  }
  function doImport() {
    const r = store.importText(text);
    if (!r.ok) { setNote(`Not a valid Eldrathor save: ${r.error}`); return; }
    setNote('Imported — reloading…');
    window.setTimeout(() => window.location.reload(), 300);
  }
  function doReset() {
    store.reset();
    window.setTimeout(() => window.location.reload(), 100);
  }

  return (
    <div className="eld-sheet-backdrop" onClick={onClose} role="presentation">
      <div className="eld-sheet eld-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Settings" style={{ maxHeight: '88%' }}>
        <div className="eld-sheet-grip" />
        <div className="eld-sheet-title">⚙ Settings</div>
        {mode === 'menu' && (
          <div className="eld-menu-list">
            <button type="button" className="eld-card eld-menu-item" onClick={doExport}><span className="eld-menu-glyph">⇪</span><span>Export save</span><span className="eld-menu-note">JSON to clipboard</span></button>
            <button type="button" className="eld-card eld-menu-item" onClick={() => { setText(''); setNote(null); setMode('import'); }}><span className="eld-menu-glyph">⇩</span><span>Import save</span><span className="eld-menu-note">paste JSON</span></button>
            <button type="button" className="eld-card eld-menu-item" onClick={() => setMode('reset')}><span className="eld-menu-glyph">⟲</span><span>Reset save</span><span className="eld-menu-note">start over</span></button>
          </div>
        )}
        {(mode === 'export' || mode === 'import') && (
          <>
            <div className="eld-sheet-sub">{mode === 'export' ? 'Your save (JSON). Keep it somewhere safe.' : 'Paste a save exported from Eldrathor.'}</div>
            <textarea ref={taRef} readOnly={mode === 'export'} value={text} onChange={(e) => setText(e.target.value)} aria-label={mode === 'export' ? 'Exported save' : 'Save to import'} spellCheck={false}
              style={{ width: '100%', minHeight: 160, maxHeight: '38vh', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 11, lineHeight: 1.35, background: 'rgba(0,0,0,0.35)', color: 'var(--eld-text)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 8, resize: 'none', boxSizing: 'border-box', whiteSpace: 'pre', overflow: 'auto' }} />
          </>
        )}
        {mode === 'reset' && (
          <div className="eld-sheet-sub" style={{ fontSize: 'var(--mv-text, 18px)', lineHeight: 1.4 }}>
            Reset erases the roster, stash, materials, Worldvein, unlocked areas and any run in progress on this device. This cannot be undone. Export first if you want a copy.
          </div>
        )}
        {note && <div className="eld-sheet-sub" style={{ marginTop: 6 }}>{note}</div>}
        <div className="eld-sheet-actions" style={{ flexWrap: 'wrap' }}>
          {mode === 'import' && <button type="button" className="eld-btn" onClick={doImport} disabled={!text.trim()}>Import</button>}
          {mode === 'reset' && <button type="button" className="eld-btn" onClick={doReset} style={{ borderColor: '#e05d6f', color: '#e05d6f' }}>Yes, reset</button>}
          {mode !== 'menu' && <button type="button" className="eld-btn eld-btn-ghost" onClick={() => { setMode('menu'); setNote(null); }}>Back</button>}
          <button type="button" className="eld-btn eld-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
