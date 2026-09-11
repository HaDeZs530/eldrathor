import { useEffect, useMemo, useRef, useState } from 'react';
import { nodeTypeMeta } from '../theme/tokens.js';
import { getReachableIds } from './genTerritory.js';
import { biomeForWorld, renderBiomeLayer } from './biomeStamps.jsx';
import './parchment.css';

/**
 * Location / node travel map — HYBRID chrome + parchment fog-of-war route surface.
 * Lock: docs/Eldrathor_NodeMap_Art_Lock.md. The player plans a route on a hand-drawn
 * map; unexplored territory is blank parchment / mist; revealed ground shows simple
 * biome stamps (forge / castle = interior rooms + hallways). Fights stay Mind-view.
 *
 * Fog of war (design doc §8c): only revealed nodes render; types hidden until entered.
 */

const PARCHMENT_INK = {
  normal: '#4a3620',
  rare: '#9a5a14',
  crystal: '#2c6a86',
  boss: '#8a2626',
  unknown: '#6b563b',
};
const TAP_SLOP = 8;

/** Keep pointer events flowing to the viewport during a drag; tolerate synthetic pointers. */
function capturePointer(el, pointerId) {
  try {
    el?.setPointerCapture?.(pointerId);
  } catch {
    /* no active pointer (synthetic event) — panning still works via bubbling */
  }
}

export default function TerritoryMap({
  world,
  territory,
  currentId,
  busy,
  partyHP,
  runVein,
  party,
  archetypes,
  log,
  logRef,
  onVisit,
  onExtract,
}) {
  const vpRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  // null = untouched → derived "centre on the party" pan below
  const [pan, setPan] = useState(null);
  const [anim, setAnim] = useState(false);
  const gesture = useRef({ active: false, dist: 0, moved: false, target: null, last: null });

  const byId = useMemo(() => Object.fromEntries(territory.nodes.map((n) => [n.id, n])), [territory.nodes]);
  const reachable = getReachableIds(territory, currentId);
  const biome = biomeForWorld(world);
  const W = territory.width;
  const H = territory.height;

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function clampPan(p) {
    if (!vp.w || !vp.h) return p;
    const minX = Math.min(0, vp.w - W);
    const minY = Math.min(0, vp.h - H);
    return { x: Math.max(minX, Math.min(0, p.x)), y: Math.max(minY, Math.min(0, p.y)) };
  }
  function centerOn(node) {
    if (!node) return { x: 0, y: 0 };
    return clampPan({ x: vp.w / 2 - node.x, y: vp.h / 2 - node.y });
  }
  const view = pan ? clampPan(pan) : centerOn(byId[currentId]);

  function localPt(e) {
    const r = vpRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function activateNode(id) {
    const n = byId[id];
    if (!n || busy || !reachable.has(n.id)) return;
    if (n.cleared) {
      // Soft reposition onto cleared ground (no fight) — glide the sheet with the party.
      setAnim(true);
      setPan(centerOn(n));
      onVisit(n, { repositionOnly: true });
      return;
    }
    onVisit(n);
  }

  function onPointerDown(e) {
    const g = gesture.current;
    if (g.active) return; // single-pointer pan only on the route map
    g.active = true;
    g.dist = 0;
    g.moved = false;
    g.last = localPt(e);
    g.target = e.target.closest?.('[data-node]')?.dataset.node || null;
    capturePointer(vpRef.current, e.pointerId);
  }
  function onPointerMove(e) {
    const g = gesture.current;
    if (!g.active) return;
    const p = localPt(e);
    const dx = p.x - g.last.x;
    const dy = p.y - g.last.y;
    g.last = p;
    g.dist += Math.abs(dx) + Math.abs(dy);
    if (g.dist > TAP_SLOP) g.moved = true;
    setAnim(false);
    setPan((prev) => {
      const c = prev ?? view;
      return clampPan({ x: c.x + dx, y: c.y + dy });
    });
  }
  function onPointerUp() {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    if (!g.moved && g.target) activateNode(g.target);
    g.target = null;
  }

  const revealed = territory.nodes.filter((n) => n.revealed);

  return (
    <div className="eld-map-wrap" style={styles.wrap}>
      <div style={styles.head}>
        <div>
          <div className="eld-brand-name" style={styles.title}>{world.name}</div>
          <div style={styles.sub}>
            Route map · {biome.label}
            {biome.interior ? ' — rooms open as you advance' : ''}
            {biome.designOpen ? ' · stamps DESIGN-OPEN' : ''}
          </div>
        </div>
        <button type="button" className="eld-btn" onClick={onExtract} disabled={busy} style={{ padding: '10px 14px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Extract ({runVein} ❖)
        </button>
      </div>

      <div
        ref={vpRef}
        className="eld-route-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`eld-parchment-sheet${anim ? ' is-anim' : ''}`}
          style={{ width: W, height: H, transform: `translate(${view.x}px, ${view.y}px)` }}
        >
          <svg className="eld-parchment-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <defs>
              <radialGradient id="eld-fog-hole">
                <stop offset="0" stopColor="#000" />
                <stop offset={biome.interior ? '0.62' : '0.5'} stopColor="#000" />
                <stop offset="1" stopColor="#fff" />
              </radialGradient>
              <pattern id="eld-mist" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
                <path d="M0 13 q6.5 -6 13 0 t13 0" fill="none" stroke="rgba(255,250,236,0.4)" strokeWidth="2" />
              </pattern>
              <mask id="eld-fog-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                <rect width={W} height={H} fill="#fff" />
                {revealed.map((n) => (
                  <circle
                    key={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={biome.interior ? (n.cleared ? 128 : 104) : n.cleared ? 150 : 118}
                    fill="url(#eld-fog-hole)"
                  />
                ))}
              </mask>
            </defs>

            {renderBiomeLayer({ territory, byId, biome })}

            {/* fog of war — blank parchment + soft mist over the unknown */}
            <g mask="url(#eld-fog-mask)">
              <rect width={W} height={H} fill="#e2d2ab" opacity="0.95" />
              <rect width={W} height={H} fill="url(#eld-mist)" opacity="0.4" />
            </g>
          </svg>

          {revealed.map((n) => {
            const here = n.id === currentId;
            const canGo = reachable.has(n.id);
            const known = n.typeKnown || n.cleared;
            const meta = known ? nodeTypeMeta[n.type] : null;
            const ink = known ? PARCHMENT_INK[n.type] || PARCHMENT_INK.normal : PARCHMENT_INK.unknown;
            const cls = [
              'eld-pnode',
              here && 'is-here',
              canGo && 'is-reach',
              n.cleared && !here && 'is-cleared',
              biome.interior && 'is-room',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={n.id}
                type="button"
                data-node={n.id}
                className={cls}
                title={known ? meta.label : 'Unknown'}
                aria-disabled={busy || (!canGo && !here) || undefined}
                style={{ left: n.x - 26, top: n.y - 26, '--ink': ink, opacity: canGo || here ? undefined : 0.7 }}
                // Pointer taps resolve on pointerup (viewport captures the pointer);
                // onClick only serves keyboard activation (detail === 0).
                onClick={(e) => {
                  if (e.detail === 0) activateNode(n.id);
                }}
              >
                <span className="eld-pnode-glyph">{known ? meta.glyph : '?'}</span>
                <span className="eld-pnode-lbl">{here ? 'Party' : known ? meta.label : 'Unknown'}</span>
              </button>
            );
          })}
        </div>
        <div className="eld-route-hint" aria-hidden="true">
          <span>Drag to pan · tap an inked node to advance</span>
        </div>
      </div>

      <div style={styles.side}>
        <div className="eld-panel" style={styles.hpBox}>
          <div style={styles.hpLbl}>Party Vitality</div>
          <div style={styles.hpBar}>
            <div
              style={{
                ...styles.hpFill,
                width: `${Math.round(partyHP * 100)}%`,
                background: partyHP > 0.5 ? '#7fd6a0' : partyHP > 0.25 ? '#e0a04d' : '#e05d6f',
              }}
            />
          </div>
          <div style={styles.partyMini}>
            {party.map((m, i) => (
              <span key={i} style={{ color: archetypes[m.archetype]?.color || '#5fc7e0', fontSize: 11, fontWeight: 600 }}>
                {m.name}
              </span>
            ))}
          </div>
        </div>

        <div className="eld-panel" style={styles.logBox} ref={logRef}>
          {log.map((l, i) => (
            <div key={i} style={{ ...styles.logLine, color: LOG_COLOR[l.k] || '#c8d4d8' }}>
              {l.t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LOG_COLOR = {
  sys: '#8fb0bd',
  good: '#7fd6a0',
  bad: '#e05d6f',
  loot: '#e0a04d',
  heal: '#7fd6c0',
  boss: '#e05d6f',
  n: '#c8d4d8',
};

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
    minHeight: 0,
    padding: '8px 10px 12px',
    textAlign: 'left',
  },
  head: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: 700 },
  sub: { fontSize: 11, color: 'var(--eld-muted, #8aa09a)', marginTop: 3, fontStyle: 'italic' },
  side: { display: 'flex', flexDirection: 'column', gap: 8 },
  hpBox: { padding: 12 },
  hpLbl: {
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted, #8aa09a)',
    marginBottom: 8,
  },
  hpBar: {
    height: 10,
    background: 'rgba(0,0,0,0.35)',
    borderRadius: 5,
    overflow: 'hidden',
    border: '1px solid var(--eld-border, #3a5a68)',
  },
  hpFill: { height: '100%', transition: 'width 0.4s, background 0.4s' },
  partyMini: { display: 'flex', gap: 10, marginTop: 10 },
  logBox: {
    padding: 10,
    height: 104,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  logLine: { fontSize: 11, lineHeight: 1.4, textAlign: 'left' },
};
