import { useState } from 'react';
import { Sheet } from '../components/ui/index.jsx';
import { artEntry } from './manifest.js';
import './art.css';

/**
 * One small pill per screen — "N art pending" — instead of a chip per file (Style Bible §C: missing art
 * stays obvious on the phone, but must not cover the map or the fight stage). Tapping it opens a sheet
 * listing every pending file with its §B size, ready to hand to the art pipeline.
 */
export default function PendingArt({ names = [], className = '', style }) {
  const [open, setOpen] = useState(false);
  if (!names.length) return null;
  return (
    <>
      <button type="button" className={`eld-art-pending-pill ${className}`.trim()} style={style} onClick={() => setOpen(true)} aria-label={`${names.length} art files pending — tap to list`} data-no-map-gesture="true">
        ▨ {names.length} art pending
      </button>
      {open && (
        <Sheet onClose={() => setOpen(false)} label="Pending art" title={<>▨ Pending art · {names.length}</>}>
          <div className="eld-sheet-sub">Drop these into app/public/art/ with the exact filename (Style Bible §B). Until then the app shows a placeholder.</div>
          <ul className="eld-sheet-bullets eld-art-pending-ul">
            {names.map((n) => { const e = artEntry(n); return <li key={n}><code>{e?.file || `${n}.png`}</code>{e ? ` — ${e.w}×${e.h}${e.transparent ? ', transparent' : ''}` : ''}</li>; })}
          </ul>
          <div className="eld-sheet-actions"><button type="button" className="eld-btn" onClick={() => setOpen(false)}>Close</button></div>
        </Sheet>
      )}
    </>
  );
}
