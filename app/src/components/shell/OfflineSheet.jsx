import { Sheet } from '../ui/index.jsx';
import { summaryLines } from '../../afkRuntime.js';
import './shell.css';

/**
 * Offline summary — Progression Loop Lock §6: after a reconciled span longer than 60 s (app open,
 * app resume, or a long background stretch) the Hearth reports what accrued: "While you were away:
 * 14 wood, 3 infused, Sera +1 level". One tap to continue.
 */
function fmt(ms) {
  const s = Math.round(ms / 1000);
  if (s < 90) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 90) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m - h * 60} min`;
}

export default function OfflineSheet({ summary, onClose }) {
  const lines = summaryLines(summary);
  return (
    <Sheet onClose={onClose} label="While you were away" title={<>∞ While you were away</>}>
      <div className="eld-sheet-sub">{fmt(summary.elapsedMs)} of Hearth work reconciled</div>
      <ul className="eld-sheet-bullets">
        {lines.length === 0 && <li>Nothing changed.</li>}
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
      <div className="eld-sheet-actions">
        <button type="button" className="eld-btn" onClick={onClose}>Continue</button>
      </div>
    </Sheet>
  );
}
