import { helpFor, HELP } from '../../help/helpText.js';
import './shell.css';

/**
 * ? — screen help bottom sheet (docs/Eldrathor_UI_Shell_Lock.md). Title + 3–6 bullets for
 * the current screen; "Game basics" available underneath. Themed by the current mode.
 */
export default function HelpSheet({ screenId, showBasics = false, onClose }) {
  const h = helpFor(screenId);
  return (
    <div className="eld-sheet-backdrop" onClick={onClose} role="presentation">
      <div className="eld-sheet eld-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Help: ${h.title}`}>
        <div className="eld-sheet-grip" />
        <div className="eld-sheet-title">? {h.title}</div>
        <ul className="eld-sheet-bullets">
          {h.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
        {(showBasics || screenId === 'basics') && h !== HELP.basics && (
          <>
            <div className="eld-sheet-sub">Game basics</div>
            <ul className="eld-sheet-bullets">
              {HELP.basics.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </>
        )}
        <div className="eld-sheet-actions">
          <button type="button" className="eld-btn" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
