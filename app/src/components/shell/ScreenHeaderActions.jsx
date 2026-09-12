import './shell.css';

/** ☰ then ? — 32 px targets, top-right of every screen header (docs/Eldrathor_UI_Shell_Lock.md). */
export default function ScreenHeaderActions({ onMenu, onHelp }) {
  return (
    <div className="eld-hdr-actions">
      <button type="button" className="eld-hdr-btn" aria-label="Menu" onClick={onMenu}>☰</button>
      <button type="button" className="eld-hdr-btn" aria-label="Help for this screen" onClick={onHelp}>?</button>
    </div>
  );
}
