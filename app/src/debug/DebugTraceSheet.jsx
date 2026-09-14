import { useEffect, useRef, useState } from 'react';
import { clearTrace, isTraceOn, onTraceChange, setTraceOn, traceEntries, traceText, isAutosave, lastUpload, traceSession, uploadNow } from './trace.js';
import '../components/shell/shell.css';

/**
 * ☰ Menu → Debug trace. Toggle the trace, read the last events, copy them (clipboard API when the
 * page is a secure context, execCommand fallback on plain http over LAN, and the text is always in a
 * selectable box for a manual long-press copy). docs/DEBUG_TRACE.md.
 */
export default function DebugTraceSheet({ onClose }) {
  const [, bump] = useState(0);
  const [copied, setCopied] = useState(null);
  const taRef = useRef(null);
  useEffect(() => onTraceChange(() => bump((n) => n + 1)), []);
  const on = isTraceOn();
  const count = traceEntries().length;
  const text = traceText();

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); setCopied('Copied to clipboard'); return; }
    } catch { /* fall through */ }
    try {
      const ta = taRef.current;
      ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      setCopied(ok ? 'Copied to clipboard' : 'Select the text above and copy it');
    } catch { setCopied('Select the text above and copy it'); }
  }

  return (
    <div className="eld-sheet-backdrop" onClick={onClose} role="presentation">
      <div className="eld-sheet eld-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Debug trace" style={{ maxHeight: '88%' }}>
        <div className="eld-sheet-grip" />
        <div className="eld-sheet-title">🐞 Debug trace</div>
        <div className="eld-sheet-sub">{on ? `Recording · ${count} events kept` : 'Off — nothing is recorded'}</div>
        {isAutosave() && (
          <div className="eld-sheet-sub" style={{ color: lastUpload && !lastUpload.ok ? '#e05d6f' : undefined }}>
            {!on ? 'Auto-save to the dev server: on while recording'
              : !lastUpload ? `Auto-save: waiting for the first event · session ${traceSession()}`
                : lastUpload.ok ? `Auto-saved at ${new Date(lastUpload.at).toLocaleTimeString()} → ${lastUpload.file}`
                  : `Auto-save failed: ${lastUpload.error} (Copy still works)`}
          </div>
        )}
        <div style={{ fontSize: 'var(--mv-label, 15px)', lineHeight: 1.4, color: 'var(--eld-muted)', margin: '4px 0 8px' }}>
          Logs every tap, card action, camera move, trip and long frame for testing. Survives reloads. On the dev server it auto-saves into the repo every few seconds, so just tell Claude Code what felt wrong; Copy is the fallback.
        </div>
        <textarea
          ref={taRef}
          readOnly
          value={text}
          aria-label="Trace text"
          style={{ width: '100%', minHeight: 180, maxHeight: '38vh', flex: '1 1 auto', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 11, lineHeight: 1.35, background: 'rgba(0,0,0,0.35)', color: 'var(--eld-text)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 8, resize: 'none', boxSizing: 'border-box', whiteSpace: 'pre', overflow: 'auto' }}
        />
        {copied && <div className="eld-sheet-sub" style={{ marginTop: 6 }}>{copied}</div>}
        <div className="eld-sheet-actions" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="eld-btn" onClick={() => setTraceOn(!on)}>{on ? 'Turn off' : 'Turn on'}</button>
          {isAutosave() && <button type="button" className="eld-btn eld-btn-ghost" onClick={() => uploadNow()} disabled={!on || !count}>Save now</button>}
          <button type="button" className="eld-btn eld-btn-ghost" onClick={copy} disabled={!count}>Copy</button>
          <button type="button" className="eld-btn eld-btn-ghost" onClick={() => { clearTrace(); setCopied(null); }} disabled={!count}>Clear</button>
          <button type="button" className="eld-btn eld-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
