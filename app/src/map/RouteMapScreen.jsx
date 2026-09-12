import { useEffect, useMemo, useRef, useState } from 'react';
import { nodeTypeMeta } from '../theme/tokens.js';
import { biomeForArea, renderBiomeLayer } from './biomeStamps.jsx';
import { rareAt, effectiveType, isSealed, reachableIds, revealedPath } from './routeState.js';
import './parchment.css';

/**
 * Route map — docs/Eldrathor_RouteMap_v2_Lock.md §2–§6 on the hybrid parchment surface
 * (docs/Eldrathor_NodeMap_Art_Lock.md). Frontier nodes are unknown runes; tapping one
 * scouts it and slides up the ScoutCard (Engage / Leave). Rares roam as red skulls, the
 * boss stays chained until the seal breaks, respawned nodes glow, named ones get a gold rim.
 */

const PARCHMENT_INK = {
  normal: '#4a3620',
  crystal: '#2c6a86',
  sanctuary: '#2f7a55',
  rare: '#8a2626',
  boss: '#6b4a10',
  unknown: '#3a3028',
};
const TAP_SLOP = 8;

/** Keep pointer events flowing to the viewport during a drag; tolerate synthetic pointers. */
function capturePointer(el, pointerId) {
  try {
    el?.setPointerCapture?.(pointerId);
  } catch {
    /* synthetic pointer — panning still works via bubbling */
  }
}

export default function RouteMapScreen({
  area, territory, currentId, busy, partyHP, runVein, party, archetypes, log, logRef,
  scout, onTapNode, onEngage, onLeave, onExtract,
}) {
  const vpRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [pan, setPan] = useState(null);
  const [anim, setAnim] = useState(false);
  const [confirmExtract, setConfirmExtract] = useState(false);
  const gesture = useRef({ active: false, dist: 0, moved: false, target: null, last: null });

  const byId = useMemo(() => Object.fromEntries(territory.nodes.map((n) => [n.id, n])), [territory.nodes]);
  const reachable = reachableIds(territory, currentId);
  const biome = biomeForArea(area);
  const sealed = isSealed(territory);
  const raresLeft = territory.rares.filter((r) => r.alive).length;
  const litPath = useMemo(() => (sealed ? null : revealedPath(territory, currentId, territory.bossId)), [territory, currentId, sealed]);
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
    if (!n || busy) return;
    if (!reachable.has(n.id) && n.id !== currentId) return;
    if (n.cleared && !n.respawned && n.id !== currentId) {
      setAnim(true);
      setPan(centerOn(n));
    }
    onTapNode(n);
  }
  function onPointerDown(e) {
    const g = gesture.current;
    if (g.active) return;
    g.active = true; g.dist = 0; g.moved = false; g.last = localPt(e);
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
    setPan((prev) => clampPan({ x: (prev ?? view).x + dx, y: (prev ?? view).y + dy }));
  }
  function onPointerUp() {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    if (!g.moved && g.target) activateNode(g.target);
    g.target = null;
  }

  const revealed = territory.nodes.filter((n) => n.revealed);
  const clearedCount = territory.nodes.filter((n) => n.cleared && !n.respawned).length;

  return (
    <div className="eld-map-wrap" style={styles.wrap}>
      <div style={styles.head}>
        <div style={{ minWidth: 0 }}>
          <div className="eld-brand-name" style={styles.title}>{area.name}</div>
          <div style={styles.sub}>
            Route map · {biome.label}
            {biome.interior ? ' — rooms open as you advance' : ''}
          </div>
          <div style={styles.hudLine}>
            <span style={{ color: sealed ? '#8a2626' : '#2f7a55' }}>{sealed ? `♛⛓ Boss sealed · ${raresLeft} rare${raresLeft === 1 ? '' : 's'} roaming` : '♛ Seal broken — the way is lit'}</span>
            <span style={styles.hudDim}>· {clearedCount}/{territory.nodes.length} cleared · clock {territory.clock}</span>
          </div>
        </div>
        <button type="button" className="eld-btn" onClick={() => setConfirmExtract(true)} disabled={busy} style={styles.extractBtn}>
          Extract ({runVein} ❖)
        </button>
      </div>

      <div ref={vpRef} className="eld-route-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className={`eld-parchment-sheet${anim ? ' is-anim' : ''}`} style={{ width: W, height: H, transform: `translate(${view.x}px, ${view.y}px)` }}>
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
                  <circle key={n.id} cx={n.x} cy={n.y} r={biome.interior ? (n.cleared ? 128 : 104) : n.cleared ? 150 : 118} fill="url(#eld-fog-hole)" />
                ))}
              </mask>
            </defs>
            {renderBiomeLayer({ territory, byId, biome })}
            {/* lit shortest path to the boss once the seal breaks */}
            {litPath && litPath.length > 1 && (
              <g>
                {litPath.slice(1).map((id, i) => {
                  const a = byId[litPath[i]];
                  const b = byId[id];
                  return <line key={`lit-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="eld-lit-path" />;
                })}
              </g>
            )}
            <g mask="url(#eld-fog-mask)">
              <rect width={W} height={H} fill="#e2d2ab" opacity="0.95" />
              <rect width={W} height={H} fill="url(#eld-mist)" opacity="0.4" />
            </g>
          </svg>

          {revealed.map((n) => {
            const here = n.id === currentId;
            const canGo = reachable.has(n.id);
            const rare = rareAt(territory, n.id);
            const known = n.typeKnown || n.cleared;
            const eff = effectiveType(territory, n);
            const meta = known ? nodeTypeMeta[eff] || nodeTypeMeta.normal : null;
            const ink = known ? PARCHMENT_INK[eff] || PARCHMENT_INK.normal : PARCHMENT_INK.unknown;
            const bossSealed = n.type === 'boss' && sealed;
            const cls = [
              'eld-pnode',
              here && 'is-here',
              canGo && 'is-reach',
              n.cleared && !here && 'is-cleared',
              !known && 'is-unknown',
              n.respawned && 'is-respawned',
              n.namedRare && 'is-named',
              rare && 'is-rare',
              n.type === 'boss' && (bossSealed ? 'is-sealed' : 'is-unsealed'),
              n.type === 'sanctuary' && known && !n.sanctuaryUsed && 'is-sanctuary',
              biome.interior && 'is-room',
            ].filter(Boolean).join(' ');
            const glyph = !known ? 'ᚱ' : rare ? '☠' : n.type === 'boss' ? (bossSealed ? '♛' : '♛') : meta.glyph;
            const label = here ? 'Party' : !known ? 'Unknown' : rare ? 'Rare' : n.type === 'boss' && bossSealed ? 'Sealed' : n.respawned ? (n.namedRare ? 'Named' : 'Respawned') : meta.label;
            return (
              <button
                key={n.id}
                type="button"
                data-node={n.id}
                className={cls}
                title={label}
                aria-disabled={busy || (!canGo && !here) || undefined}
                style={{ left: n.x - 26, top: n.y - 26, '--ink': ink, opacity: canGo || here ? undefined : 0.7 }}
                onClick={(e) => { if (e.detail === 0) activateNode(n.id); }}
              >
                <span className="eld-pnode-glyph">{glyph}</span>
                <span className="eld-pnode-lbl">{label}</span>
                {bossSealed && <span className="eld-pnode-chain" aria-hidden="true">⛓</span>}
              </button>
            );
          })}
        </div>
        <div className="eld-route-hint" aria-hidden="true">
          <span>Drag to pan · tap a rune to scout · Engage or Leave</span>
        </div>

        {scout && (
          <div className="eld-scout-card eld-panel" role="dialog" aria-label="Scout report">
            <div className="eld-scout-top">
              <span className="eld-scout-type" style={{ color: nodeTypeMeta[scout.type]?.color }}>
                {nodeTypeMeta[scout.type]?.glyph} {scout.title}
              </span>
              {scout.threat && <span className="eld-scout-threat" style={{ color: scout.threat.color, borderColor: scout.threat.color }}>{scout.threat.label}</span>}
            </div>
            <div className="eld-scout-body">{scout.body}</div>
            {scout.yieldText && <div className="eld-scout-yield">{scout.yieldText}</div>}
            <div className="eld-scout-actions">
              <button type="button" className="eld-btn eld-btn-ghost" style={styles.cardBtn} onClick={onLeave}>Leave</button>
              <button type="button" className="eld-btn" style={styles.cardBtn} onClick={onEngage} disabled={scout.engageDisabled || busy}>
                {scout.engageLabel || 'Engage'}
              </button>
            </div>
          </div>
        )}

        {confirmExtract && (
          <div className="eld-scout-card eld-panel" role="dialog" aria-label="Extract">
            <div className="eld-scout-top"><span className="eld-scout-type">Extract from {area.name}?</span></div>
            <div className="eld-scout-body">Bank {runVein} ❖ Worldvein and everything found. The map is gone when you leave — the next visit generates a fresh one.</div>
            <div className="eld-scout-actions">
              <button type="button" className="eld-btn eld-btn-ghost" style={styles.cardBtn} onClick={() => setConfirmExtract(false)}>Stay</button>
              <button type="button" className="eld-btn" style={styles.cardBtn} onClick={() => { setConfirmExtract(false); onExtract(); }}>Extract</button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.side}>
        <div className="eld-panel" style={styles.hpBox}>
          <div style={styles.hpLbl}>Party Vitality</div>
          <div style={styles.hpBar}>
            <div style={{ ...styles.hpFill, width: `${Math.round(partyHP * 100)}%`, background: partyHP > 0.5 ? '#7fd6a0' : partyHP > 0.25 ? '#e0a04d' : '#e05d6f' }} />
          </div>
          <div style={styles.partyMini}>
            {party.map((m, i) => (
              <span key={i} style={{ color: archetypes[m.archetype]?.color || '#5fc7e0', fontSize: 'var(--mv-label, 13px)', fontWeight: 600 }}>{m.name}</span>
            ))}
          </div>
        </div>
        <div className="eld-panel" style={styles.logBox} ref={logRef}>
          {log.map((l, i) => (
            <div key={i} style={{ ...styles.logLine, color: LOG_COLOR[l.k] || '#c8d4d8' }}>{l.t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LOG_COLOR = { sys: '#8fb0bd', good: '#7fd6a0', bad: '#e05d6f', loot: '#e0a04d', heal: '#7fd6c0', boss: '#e05d6f', rare: '#e08a8a', n: '#c8d4d8' };

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, padding: '8px 10px 10px', textAlign: 'left' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 16, fontWeight: 700 },
  sub: { fontSize: 'var(--mv-label, 13px)', color: 'var(--eld-muted, #8aa09a)', marginTop: 2, fontStyle: 'italic' },
  hudLine: { fontSize: 'var(--mv-label, 13px)', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' },
  hudDim: { color: 'var(--eld-muted, #8aa09a)' },
  extractBtn: { padding: '10px 12px', whiteSpace: 'nowrap', flexShrink: 0, minHeight: 'var(--mv-tap, 48px)' },
  cardBtn: { flex: 1, minHeight: 'var(--mv-tap, 48px)' },
  side: { display: 'flex', flexDirection: 'column', gap: 6 },
  hpBox: { padding: '8px 12px' },
  hpLbl: { fontSize: 'var(--mv-label, 13px)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--eld-muted, #8aa09a)', marginBottom: 6 },
  hpBar: { height: 10, background: 'rgba(0,0,0,0.35)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--eld-border, #3a5a68)' },
  hpFill: { height: '100%', transition: 'width 0.4s, background 0.4s' },
  partyMini: { display: 'flex', gap: 10, marginTop: 6 },
  logBox: { padding: '8px 10px', height: 86, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 },
  logLine: { fontSize: 'var(--mv-label, 13px)', lineHeight: 1.4, textAlign: 'left' },
};
