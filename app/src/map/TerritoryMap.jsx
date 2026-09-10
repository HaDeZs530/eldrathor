import React, { useRef, useState, useCallback } from 'react';
import { nodeTypeMeta } from '../theme/tokens.js';
import { getReachableIds } from './genTerritory.js';

/**
 * Pannable organic territory map — MIND VIEW theme.
 * Fog of war: only revealed nodes render; types hidden until entered.
 */
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
  const [pan, setPan] = useState({ x: -250, y: -700 });
  const drag = useRef(null);

  const reachable = getReachableIds(territory, currentId);

  const onPointerDown = useCallback((e) => {
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      ox: pan.x,
      oy: pan.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [pan]);

  const onPointerMove = useCallback((e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    setPan({ x: drag.current.ox + dx, y: drag.current.oy + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  const handleNodeClick = (n, e) => {
    e.stopPropagation();
    if (drag.current?.moved) return;
    if (busy) return;
    if (!reachable.has(n.id)) return;
    if (n.cleared) {
      // Soft reposition onto cleared ground (no fight)
      onVisit(n, { repositionOnly: true });
      return;
    }
    onVisit(n);
  };

  const byId = Object.fromEntries(territory.nodes.map((n) => [n.id, n]));

  return (
    <div className="eld-map-wrap" style={styles.wrap}>
      <div style={styles.head}>
        <div>
          <div className="eld-brand-name" style={styles.title}>{world.name}</div>
          <div style={styles.sub}>Mind View — explore the Vein projection</div>
        </div>
        <button
          type="button"
          className="eld-btn"
          onClick={onExtract}
          disabled={busy}
          style={{ padding: '10px 14px' }}
        >
          Extract ({runVein} ❖)
        </button>
      </div>

      <div
        className="eld-aura-frame"
        style={styles.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          style={{
            ...styles.canvas,
            width: territory.width,
            height: territory.height,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <svg
            width={territory.width}
            height={territory.height}
            style={styles.svg}
          >
            {territory.edges.map(([a, b]) => {
              const na = byId[a];
              const nb = byId[b];
              if (!na || !nb) return null;
              // Draw edge only if at least one end revealed
              if (!na.revealed && !nb.revealed) return null;
              const both = na.revealed && nb.revealed;
              return (
                <line
                  key={`${a}-${b}`}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  stroke={both ? 'rgba(95,199,224,0.45)' : 'rgba(95,199,224,0.12)'}
                  strokeWidth={both ? 2 : 1}
                  strokeDasharray={both ? '0' : '4 6'}
                />
              );
            })}
          </svg>

          {territory.nodes.filter((n) => n.revealed).map((n) => {
            const here = n.id === currentId;
            const canGo = reachable.has(n.id);
            const known = n.typeKnown || n.cleared;
            const meta = known ? nodeTypeMeta[n.type] : { label: 'Unknown', glyph: '·', color: '#5f8494' };
            return (
              <button
                key={n.id}
                type="button"
                title={known ? meta.label : 'Unknown'}
                disabled={busy || (!canGo && !here)}
                onClick={(e) => handleNodeClick(n, e)}
                style={{
                  ...styles.node,
                  left: n.x - 28,
                  top: n.y - 28,
                  borderColor: here ? '#5fc7e0' : n.cleared ? '#2e4a52' : meta.color,
                  background: here
                    ? '#173038'
                    : n.cleared
                      ? '#0e1a1e'
                      : canGo
                        ? '#12232a'
                        : '#0c1519',
                  color: n.cleared && !here ? '#3d5a63' : meta.color,
                  boxShadow: canGo && !n.cleared
                    ? `0 0 14px ${meta.color}66`
                    : here
                      ? '0 0 18px rgba(95,199,224,0.55)'
                      : 'none',
                  opacity: canGo || here ? 1 : 0.65,
                  cursor: canGo ? 'pointer' : 'default',
                  transform: here ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <span style={styles.glyph}>{meta.glyph}</span>
                <span style={styles.lbl}>{known ? meta.label : '???'}</span>
              </button>
            );
          })}
        </div>
        <div style={styles.hint}>Drag to pan · tap a glowing node to advance</div>
      </div>

      <div style={styles.side}>
        <div className="eld-panel" style={styles.hpBox}>
          <div style={styles.hpLbl}>Party Vitality</div>
          <div style={styles.hpBar}>
            <div
              style={{
                ...styles.hpFill,
                width: `${Math.round(partyHP * 100)}%`,
                background:
                  partyHP > 0.5 ? '#7fd6a0' : partyHP > 0.25 ? '#e0a04d' : '#e05d6f',
              }}
            />
          </div>
          <div style={styles.partyMini}>
            {party.map((m, i) => (
              <span
                key={i}
                style={{ color: archetypes[m.archetype]?.color || '#5fc7e0', fontSize: 11, fontWeight: 600 }}
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>

        <div className="eld-panel" style={styles.logBox} ref={logRef}>
          {log.map((l, i) => (
            <div key={i} style={{ ...styles.logLine, color: LOG_COLOR[l.k] || '#9fb2bd' }}>
              {l.t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LOG_COLOR = {
  sys: '#5f8494',
  good: '#7fd6a0',
  bad: '#e05d6f',
  loot: '#e0a04d',
  heal: '#7fd6c0',
  boss: '#e05d6f',
  n: '#9fb2bd',
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
  sub: { fontSize: 11, color: '#5f8494', marginTop: 3, fontStyle: 'italic' },
  viewport: {
    position: 'relative',
    flex: '1 1 360px',
    minHeight: 320,
    overflow: 'hidden',
    touchAction: 'none',
    cursor: 'grab',
    background: 'radial-gradient(circle at 50% 30%, #0e2430 0%, #060d11 75%)',
  },
  canvas: {
    position: 'absolute',
    left: 0,
    top: 0,
    willChange: 'transform',
  },
  svg: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  node: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 12,
    border: '2px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    fontFamily: 'inherit',
    transition: 'transform 0.15s, box-shadow 0.15s',
    padding: 0,
  },
  glyph: { fontSize: 16, lineHeight: 1 },
  lbl: { fontSize: 7, letterSpacing: '0.06em', textTransform: 'uppercase' },
  hint: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#5f8494',
    pointerEvents: 'none',
  },
  side: { display: 'flex', flexDirection: 'column', gap: 8 },
  hpBox: { padding: 12 },
  hpLbl: {
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#5f8494',
    marginBottom: 8,
  },
  hpBar: {
    height: 10,
    background: '#08141a',
    borderRadius: 5,
    overflow: 'hidden',
    border: '1px solid #16303a',
  },
  hpFill: { height: '100%', transition: 'width 0.4s, background 0.4s' },
  partyMini: { display: 'flex', gap: 10, marginTop: 10 },
  logBox: {
    padding: 10,
    height: 120,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  logLine: { fontSize: 11, lineHeight: 1.4, textAlign: 'left' },
};
