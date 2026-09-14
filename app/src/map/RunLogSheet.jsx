import { useEffect, useRef } from 'react';
import '../components/shell/shell.css';
import { Sheet } from '../components/ui/index.jsx';

/**
 * Run log — docs/Eldrathor_RouteMap_v3_Travel_Lock.md §9. Mind-view bottom sheet listing every
 * run event, scrollable, newest at the bottom. Opened from the scroll icon on the HUD strip.
 */
const KIND_COLOR = { sys: '#8fb0bd', good: '#7fd6a0', bad: '#e05d6f', loot: '#e0a04d', heal: '#7fd6c0', boss: '#b58fe0', rare: '#e08a8a', n: '#cfe0e8' };

export default function RunLogSheet({ log, areaName, onClose }) {
  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [log.length]);
  return (
    <Sheet onClose={onClose} label="Run log" title={<>📜 Run log{areaName ? ` · ${areaName}` : ''}</>} className="eld-runlog">
        <div className="eld-runlog-list" ref={listRef}>
          {log.length === 0 && <div className="eld-runlog-line" style={{ color: KIND_COLOR.sys }}>Nothing yet — scout a node.</div>}
          {log.map((l, i) => (
            <div key={l.id ?? i} className="eld-runlog-line" style={{ color: KIND_COLOR[l.k] || KIND_COLOR.n }}>
              {l.clock != null && <span className="eld-runlog-clock">{l.clock}</span>}
              <span>{l.t}</span>
            </div>
          ))}
        </div>
        <div className="eld-sheet-actions">
          <button type="button" className="eld-btn" onClick={onClose}>Close</button>
        </div>
    </Sheet>
  );
}
