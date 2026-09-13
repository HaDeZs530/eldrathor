import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { biomeForArea, renderBiomeLayer } from './biomeStamps.jsx';
import { rareAt, isSealed, isWalkable, nodeState } from './routeState.js';
import { centerOn, resolveFocus, easeInOut, easeOut, polylinePointAt, SKIP_MS } from './camera.js';
import './parchment.css';

/**
 * Route map — docs/Eldrathor_RouteMap_v2_Lock.md + docs/Eldrathor_RouteMap_v3_Travel_Lock.md
 * on the hybrid parchment surface (docs/Eldrathor_NodeMap_Art_Lock.md).
 *
 * §15 three node states only: unexplored (identical rune for every type — nothing is auto-marked),
 * revealed (type icon; skull if a rare stands there; crown + chains for a sealed boss) and
 * completed (dim dot, tap = nothing). Tapping never moves the party: the cards below the map
 * (Explore / Cancel, Fight / Flee, Use / Leave, seal, ambush) carry every commitment.
 * §13: this screen stays mounted for the whole run; fights render as overlays above it.
 * §17: the camera is explicit run state (`camera` prop = { pan, motion, focus }); a `focus` is a
 * framing request resolved here at render time — never a recentre on mount or return.
 * §16: travel is ONE continuous requestAnimationFrame tween along the polyline (600 ms/hop,
 * eased at the ends only); the camera follows the marker every frame; tap-to-skip eases 250 ms.
 */

/** v3 §2 palette — colour distinguishes type (only once a node is revealed). */
const TYPE_COLOR = {
  normal: '#a9b4c7',
  crystal: '#4fa3ff',
  sanctuary: '#5fbf8a',
  rare: '#c0392b',
  boss: '#8e6bd1',
};
const TYPE_GLYPH = { normal: '⚔', crystal: '❖', sanctuary: '✧', rare: '☠', boss: '♛' };
const TYPE_LABEL = { normal: 'Fight', crystal: 'Crystal', sanctuary: 'Sanctuary', rare: 'Rare', boss: 'Boss' };
/** Default camera zoom — ~12–16 nodes visible on a phone (§7); pan for the rest. */
const ZOOM = 0.72;
const NODE_HIT = 64;
const TAP_SLOP = 8;
/**
 * Fogged parchment margin (screen px) around the map so ANY node — rim nodes included — can be
 * centred or framed at 30 % height (§17). Grows with the viewport: a node at the map's bottom edge
 * needs ~½ a screen of margin below it to reach the centre band; the margin is fog-covered
 * parchment, never the desk.
 */
const MARGIN_MIN = { top: 56, bottom: 96, side: 48 };
function marginFor(vp) {
  return { top: Math.max(MARGIN_MIN.top, Math.ceil(vp.h * 0.5)), bottom: Math.max(MARGIN_MIN.bottom, Math.ceil(vp.h * 0.55)), side: Math.max(MARGIN_MIN.side, Math.ceil(vp.w * 0.5)) };
}
const TOAST_MS = 3000;

/** Keep pointer events flowing to the viewport during a drag; tolerate synthetic pointers. */
function capturePointer(el, pointerId) {
  try {
    el?.setPointerCapture?.(pointerId);
  } catch {
    /* synthetic pointer — panning still works via bubbling */
  }
}

export default function RouteMapScreen({
  area, territory, currentId, busy, partyHP, runVein, party, log, logUnread = 0, onOpenLog,
  camera, setCamera, travel, onTravelEnd,
  card, onTapNode, onCardAction, onExtract,
}) {
  const vpRef = useRef(null);
  const sheetRef = useRef(null);
  const markerRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [confirmExtract, setConfirmExtract] = useState(false);
  const gesture = useRef({ active: false, dist: 0, moved: false, target: null, start: null, basePan: null });

  const byId = useMemo(() => Object.fromEntries(territory.nodes.map((n) => [n.id, n])), [territory.nodes]);
  const biome = biomeForArea(area);
  const sealed = isSealed(territory);
  const raresLeft = territory.rares.filter((r) => r.alive).length;
  const planEdges = useMemo(() => {
    const s = new Set();
    const p = travel?.path;
    if (p) for (let i = 0; i < p.length - 1; i++) s.add(`${p[i]}|${p[i + 1]}`);
    return s;
  }, [travel]);
  const W = territory.width;
  const H = territory.height;
  const MARGIN = marginFor(vp);
  const M = { x: MARGIN.side / ZOOM, top: MARGIN.top / ZOOM, bottom: MARGIN.bottom / ZOOM };
  const VW = W + 2 * M.x;
  const VH = H + M.top + M.bottom;
  const sheet = { w: VW * ZOOM, h: VH * ZOOM };
  const sx = (x) => (x + M.x) * ZOOM; // map → sheet px
  const sy = (y) => (y + M.top) * ZOOM;
  const sheetPt = (n) => ({ x: sx(n.x), y: sy(n.y) });
  const ptOf = (id) => (byId[id] ? sheetPt(byId[id]) : null);

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // §17: a pending framing request resolves to a pan here, at render time (needs vp + sheet).
  // Nothing else ever derives the camera from the party's node — no recentre on mount or return.
  const cur = byId[currentId];
  const measured = vp.w > 0 && vp.h > 0;
  const focusPan = measured && camera?.focus ? resolveFocus(camera.focus, ptOf, vp, sheet, MARGIN) : null;
  const pan = focusPan || camera?.pan || { x: 0, y: 0 };

  // ---------- §16 continuous travel tween (rAF; writes the marker + sheet directly) ----------
  const tween = useRef({ active: false, pos: null, pan: null, skipFrom: null, skipAt: null, raf: null });
  const travelRef = useRef(travel);
  useEffect(() => { travelRef.current = travel; });
  useEffect(() => {
    if (!travel) { tween.current.active = false; return undefined; }
    const points = travel.path.map((id) => sheetPt(byId[id]));
    const dest = points[points.length - 1];
    const t0 = travel.startTs;
    const dur = Math.max(1, travel.duration);
    tween.current = { active: true, pos: points[0], pan: null, skipFrom: null, skipAt: null, raf: null };
    let done = false;
    const step = (now) => {
      if (done) return;
      const tw = tween.current;
      const trv = travelRef.current;
      let pos;
      let finished;
      if (trv?.skipAt != null) {
        if (tw.skipAt == null) { tw.skipAt = now; tw.skipFrom = tw.pos || points[0]; }
        const u = Math.min(1, (now - tw.skipAt) / SKIP_MS);
        const k = easeOut(u);
        pos = { x: tw.skipFrom.x + (dest.x - tw.skipFrom.x) * k, y: tw.skipFrom.y + (dest.y - tw.skipFrom.y) * k };
        finished = u >= 1;
      } else {
        const u = Math.min(1, (now - t0) / dur);
        pos = polylinePointAt(points, easeInOut(u));
        finished = u >= 1;
      }
      if (finished) pos = { ...dest };
      tw.pos = pos;
      tw.pan = centerOn(pos, vp, sheet, MARGIN);
      if (markerRef.current) { markerRef.current.style.left = `${pos.x}px`; markerRef.current.style.top = `${pos.y}px`; }
      if (sheetRef.current) sheetRef.current.style.transform = `translate(${tw.pan.x}px, ${tw.pan.y}px)`;
      if (finished) {
        done = true;
        tw.active = false;
        // the camera is now exactly where the tween left it — no correction, no snap
        setCamera({ type: 'travelEnd', pan: tw.pan });
        onTravelEnd();
        return;
      }
      tw.raf = window.requestAnimationFrame(step);
    };
    tween.current.raf = window.requestAnimationFrame(step);
    return () => { done = true; if (tween.current.raf) window.cancelAnimationFrame(tween.current.raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel?.startTs]);

  // A re-render mid-trip (toast, HUD) must not reset the DOM to the pre-trip pose: re-apply the
  // tween's latest frame synchronously after every commit while it is running.
  useLayoutEffect(() => {
    const tw = tween.current;
    if (!tw.active || !tw.pos || !tw.pan) return;
    if (markerRef.current) { markerRef.current.style.left = `${tw.pos.x}px`; markerRef.current.style.top = `${tw.pos.y}px`; }
    if (sheetRef.current) sheetRef.current.style.transform = `translate(${tw.pan.x}px, ${tw.pan.y}px)`;
  });

  // §9: 3 s toast of the latest log line under the HUD strip
  const last = log.length ? log[log.length - 1] : null;
  const [toast, setToast] = useState(null);
  const [toastFor, setToastFor] = useState(null);
  if (last && last.id !== toastFor) {
    setToastFor(last.id);
    setToast(last);
  }
  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  function localPt(e) {
    const r = vpRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function activateNode(id) {
    const n = byId[id];
    if (!n || busy || !n.revealed) return;
    onTapNode(n);
  }
  function onPointerDown(e) {
    const g = gesture.current;
    if (g.active) return;
    g.active = true; g.dist = 0; g.moved = false; g.start = localPt(e); g.basePan = pan;
    g.target = e.target.closest?.('[data-node]')?.dataset.node || null;
    capturePointer(vpRef.current, e.pointerId);
  }
  function onPointerMove(e) {
    const g = gesture.current;
    if (!g.active || travel) return;
    const p = localPt(e);
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    g.dist = Math.abs(dx) + Math.abs(dy);
    if (g.dist > TAP_SLOP) g.moved = true;
    // the sheet follows the finger unclamped; release eases it back inside the bounds (§12)
    if (g.moved) setCamera({ type: 'drag', basePan: g.basePan, dx, dy });
  }
  function onPointerUp() {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    if (!g.moved) {
      if (travel) onTapNode(null); // tap anywhere while travelling = eased skip
      else if (g.target) activateNode(g.target);
    } else if (!travel) {
      setCamera({ type: 'release', vp, sheet });
    }
    g.target = null;
  }

  const revealed = territory.nodes.filter((n) => n.revealed);
  const completedCount = territory.nodes.filter((n) => n.cleared).length;
  const markerPos = cur ? sheetPt(cur) : { x: 0, y: 0 };
  const sheetMotion = !travel && camera?.motion === 'ease' ? ' is-anim' : '';

  return (
    <div className="eld-map-wrap" style={styles.wrap}>
      <div ref={vpRef} className="eld-route-viewport eld-route-viewport--full" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div ref={sheetRef} className={`eld-parchment-sheet${sheetMotion}`} style={{ width: sheet.w, height: sheet.h, transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          <svg className="eld-parchment-svg" width={sheet.w} height={sheet.h} viewBox={`${-M.x} ${-M.top} ${VW} ${VH}`}>
            <defs>
              <radialGradient id="eld-fog-hole">
                <stop offset="0" stopColor="#000" />
                <stop offset={biome.interior ? '0.62' : '0.5'} stopColor="#000" />
                <stop offset="1" stopColor="#fff" />
              </radialGradient>
              <pattern id="eld-mist" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
                <path d="M0 13 q6.5 -6 13 0 t13 0" fill="none" stroke="rgba(255,250,236,0.4)" strokeWidth="2" />
              </pattern>
              <mask id="eld-fog-mask" maskUnits="userSpaceOnUse" x={-M.x} y={-M.top} width={VW} height={VH}>
                <rect x={-M.x} y={-M.top} width={VW} height={VH} fill="#fff" />
                {revealed.map((n) => (
                  <circle key={n.id} cx={n.x} cy={n.y} r={biome.interior ? (n.cleared ? 128 : 104) : n.cleared ? 150 : 118} fill="url(#eld-fog-hole)" />
                ))}
              </mask>
            </defs>
            {renderBiomeLayer({ territory, byId, biome })}
            {/* edges: completed trail vs frontier; the planned trip lights up gold while travelling (§15: no lit path to the boss) */}
            <g>
              {territory.edges.map(([a, b]) => {
                const na = byId[a];
                const nb = byId[b];
                if (!na || !nb || (!na.revealed && !nb.revealed)) return null;
                const bothWalkable = isWalkable(na) && isWalkable(nb);
                const planned = planEdges.has(`${a}|${b}`) || planEdges.has(`${b}|${a}`);
                const cls = planned ? 'eld-edge-plan' : bothWalkable ? 'eld-edge-cleared' : 'eld-edge-frontier';
                return <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} className={cls} fill="none" />;
              })}
            </g>
            <g mask="url(#eld-fog-mask)">
              <rect x={-M.x} y={-M.top} width={VW} height={VH} fill="#e2d2ab" opacity="0.95" />
              <rect x={-M.x} y={-M.top} width={VW} height={VH} fill="url(#eld-mist)" opacity="0.4" />
            </g>
          </svg>

          {revealed.map((n) => {
            const here = n.id === currentId;
            const st = nodeState(n);
            // §15: on an unexplored node NOTHING is known — same rune, same colour, no chains, no skulls.
            let state = 'is-unknown';
            let glyph = 'ᚱ';
            let label = 'Unexplored';
            let color = TYPE_COLOR.normal;
            if (st === 'completed') { state = 'is-cleared'; glyph = ''; label = 'Completed'; }
            else if (st === 'revealed') {
              const rare = rareAt(territory, n.id);
              const bossSealed = n.type === 'boss' && sealed;
              color = TYPE_COLOR[n.type] || TYPE_COLOR.normal;
              if (rare) { state = 'is-rare'; glyph = '☠'; label = 'Rare'; }
              else if (n.type === 'boss') { state = `is-boss ${bossSealed ? 'is-sealed' : 'is-unsealed'}`; glyph = '♛'; label = bossSealed ? 'Boss (sealed)' : 'Boss'; }
              else { state = n.namedRare ? 'is-named' : 'is-scouted'; glyph = TYPE_GLYPH[n.type] || '⚔'; label = `${n.namedRare ? 'Named ' : ''}${TYPE_LABEL[n.type] || 'Node'}`; }
            }
            const cls = ['eld-pnode', state, here && 'is-here', st !== 'completed' && !here && 'is-tappable'].filter(Boolean).join(' ');
            return (
              <button
                key={n.id}
                type="button"
                data-node={n.id}
                className={cls}
                title={label}
                aria-label={here ? `${label} (party here)` : label}
                style={{ left: sx(n.x) - NODE_HIT / 2, top: sy(n.y) - NODE_HIT / 2, '--type': color }}
                onClick={(e) => { if (e.detail === 0) activateNode(n.id); }}
              >
                <span className="eld-pnode-shape" aria-hidden="true">{glyph}</span>
                {state.startsWith('is-boss') && sealed && <span className="eld-pnode-chain" aria-hidden="true">⛓</span>}
              </button>
            );
          })}

          {/* the party marker sits on top of whichever node the party occupies; §16 it glides along the polyline */}
          {cur && <div ref={markerRef} className="eld-party-marker" style={{ left: markerPos.x, top: markerPos.y }} aria-hidden="true" />}
        </div>

        {/* §7 — single 44 px run HUD strip overlaid on the map */}
        <div className="eld-run-hud" role="status">
          <div className="eld-run-hud-left" title={area.name}>
            <span style={{ color: sealed ? '#b8a0e8' : '#7fd6a0' }}>{sealed ? `☠ ${raresLeft} rare${raresLeft === 1 ? '' : 's'} · ⛓ sealed` : '♛ seal broken'}</span>
            <span className="eld-run-hud-sep">·</span>
            <span title="nodes completed">{completedCount}/{territory.nodes.length}</span>
          </div>
          <div className="eld-run-hud-right">
            <span className="eld-run-hud-vein">❖ {runVein}</span>
            <button type="button" className="eld-run-hud-log" aria-label={`Run log${logUnread ? `, ${logUnread} new` : ''}`} onClick={onOpenLog}>
              📜
              {logUnread > 0 && <span className="eld-run-hud-badge">{logUnread > 99 ? '99+' : logUnread}</span>}
            </button>
            <button type="button" className="eld-btn eld-run-hud-extract" onClick={() => setConfirmExtract(true)} disabled={busy}>Extract</button>
          </div>
          {/* DESIGN-OPEN: party vitality shown as a hairline under the strip (the lock lists Worldvein, rares, Extract, log) */}
          <div className="eld-run-hud-vit" title={`Party vitality ${Math.round(partyHP * 100)}% · ${party.map((m) => m.name).join(', ')}`}>
            <div style={{ width: `${Math.round(partyHP * 100)}%`, background: partyHP > 0.5 ? '#7fd6a0' : partyHP > 0.25 ? '#e0a04d' : '#e05d6f' }} />
          </div>
        </div>

        {toast && !card && !confirmExtract && (
          <div className="eld-run-toast" key={toast.id} aria-live="polite">
            <span>{travel ? 'Travelling… tap to skip' : toast.t}</span>
          </div>
        )}

        {/* §15 cards — every commitment happens here; the map itself never moves the party */}
        {card && !confirmExtract && (
          <div className={`eld-scout-card eld-panel${card.kind === 'ambush' ? ' is-ambush' : ''}${card.kind === 'explore' ? ' is-explore' : ''}`} role="dialog" aria-label={card.ariaLabel || card.title}>
            <div className="eld-scout-top">
              <span className="eld-scout-type" style={{ color: card.color || TYPE_COLOR[card.type] || undefined }}>
                {card.glyph ? `${card.glyph} ` : ''}{card.title}
              </span>
              {card.threat && <span className="eld-scout-threat" style={{ color: card.threat.color, borderColor: card.threat.color }}>{card.threat.label}</span>}
              {card.tag && !card.threat && <span className="eld-scout-threat" style={{ color: '#5b6a8a', borderColor: '#5b6a8a' }}>{card.tag}</span>}
            </div>
            <div className="eld-scout-body">{card.body}</div>
            {card.yieldText && <div className="eld-scout-yield">{card.yieldText}</div>}
            <div className="eld-scout-actions">
              {card.actions.map((a) => (
                <button key={a.id} type="button" className={`eld-btn${a.ghost ? ' eld-btn-ghost' : ''}`} onClick={() => onCardAction(a.id)} disabled={a.disabled || (busy && !a.ghost)}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {confirmExtract && (
          <div className="eld-scout-card eld-panel" role="dialog" aria-label="Extract">
            <div className="eld-scout-top"><span className="eld-scout-type">Extract from {area.name}?</span></div>
            <div className="eld-scout-body">Bank {runVein} ❖ Worldvein and everything found. The map is gone when you leave — the next visit generates a fresh one.</div>
            <div className="eld-scout-actions">
              <button type="button" className="eld-btn eld-btn-ghost" onClick={() => setConfirmExtract(false)}>Stay</button>
              <button type="button" className="eld-btn" onClick={() => { setConfirmExtract(false); onExtract(); }}>Extract</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: 0, textAlign: 'left' },
};
