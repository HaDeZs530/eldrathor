import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { nodeTypeMeta } from '../theme/tokens.js';
import { biomeForArea, renderBiomeLayer } from './biomeStamps.jsx';
import { rareAt, effectiveType, isSealed, reachableIds, revealedPath, isWalkable } from './routeState.js';
import { clampPan, centerOn, easeInOut, easeOut, polylinePointAt, SKIP_MS } from './camera.js';
import './parchment.css';

/**
 * Route map — docs/Eldrathor_RouteMap_v2_Lock.md + docs/Eldrathor_RouteMap_v3_Travel_Lock.md
 * on the hybrid parchment surface (docs/Eldrathor_NodeMap_Art_Lock.md).
 * §13: this screen stays mounted for the whole run; fights/results/sanctuary render as overlays
 * above it and never touch the camera. The camera is explicit run state (`camera` prop) — never
 * derived from the party's node, so nothing recentres on return. §14: travel is ONE continuous
 * requestAnimationFrame tween along the polyline (450 ms/hop, eased at the ends only); the camera
 * follows the marker every frame; tap-to-skip eases 200 ms to the destination; no snaps.
 */

/** v3 §2 palette — colour distinguishes type. */
const TYPE_COLOR = {
  normal: '#a9b4c7',
  crystal: '#4fa3ff',
  sanctuary: '#5fbf8a',
  rare: '#c0392b',
  boss: '#8e6bd1',
};
const TYPE_GLYPH = { normal: '⚔', crystal: '❖', sanctuary: '✧', rare: '☠', boss: '♛' };
/** Default camera zoom — ~12–16 nodes visible on a phone (§7); pan for the rest. */
const ZOOM = 0.72;
const NODE_HIT = 64;
const TAP_SLOP = 8;
/** Fogged parchment margin (screen px) so rim nodes can be centred clear of the HUD and cards. */
const MARGIN = { top: 56, bottom: 96, side: 48 };
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
  scout, ambush, onTapNode, onEngage, onLeave, onFight, onFlee, onExtract,
}) {
  const vpRef = useRef(null);
  const sheetRef = useRef(null);
  const markerRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [confirmExtract, setConfirmExtract] = useState(false);
  const gesture = useRef({ active: false, dist: 0, moved: false, target: null, last: null });

  const byId = useMemo(() => Object.fromEntries(territory.nodes.map((n) => [n.id, n])), [territory.nodes]);
  const reachable = reachableIds(territory, currentId);
  const biome = biomeForArea(area);
  const sealed = isSealed(territory);
  const raresLeft = territory.rares.filter((r) => r.alive).length;
  const litPath = useMemo(() => (sealed ? null : revealedPath(territory, currentId, territory.bossId)), [territory, currentId, sealed]);
  const planEdges = useMemo(() => {
    const s = new Set();
    const p = travel?.path;
    if (p) for (let i = 0; i < p.length - 1; i++) s.add(`${p[i]}|${p[i + 1]}`);
    return s;
  }, [travel]);
  const W = territory.width;
  const H = territory.height;
  const M = { x: MARGIN.side / ZOOM, top: MARGIN.top / ZOOM, bottom: MARGIN.bottom / ZOOM };
  const VW = W + 2 * M.x;
  const VH = H + M.top + M.bottom;
  const sheet = { w: VW * ZOOM, h: VH * ZOOM };
  const sx = (x) => (x + M.x) * ZOOM; // map → sheet px
  const sy = (y) => (y + M.top) * ZOOM;
  const sheetPt = (n) => ({ x: sx(n.x), y: sy(n.y) });

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // First measurement of a fresh run: put the camera on the party once. After that the camera
  // is only ever moved by drag, travel, or an explicit tap — never by a node change (§13).
  const cur = byId[currentId];
  const [initialised, setInitialised] = useState(false);
  if (!initialised && vp.w && vp.h && cur) {
    setInitialised(true);
    if (!camera?.pan) setCamera({ pan: centerOn(sheetPt(cur), vp, sheet, MARGIN), motion: 'none' });
  }
  const pan = camera?.pan || { x: 0, y: 0 };

  // ---------- §14 continuous travel tween (rAF; writes the marker + sheet directly) ----------
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
        setCamera({ pan: tw.pan, motion: 'none' });
        onTravelEnd();
        return;
      }
      tw.raf = window.requestAnimationFrame(step);
    };
    tween.current.raf = window.requestAnimationFrame(step);
    return () => { done = true; if (tween.current.raf) window.cancelAnimationFrame(tween.current.raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel?.startTs]);

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
    g.active = true; g.dist = 0; g.moved = false; g.last = localPt(e);
    g.target = e.target.closest?.('[data-node]')?.dataset.node || null;
    capturePointer(vpRef.current, e.pointerId);
  }
  function onPointerMove(e) {
    const g = gesture.current;
    if (!g.active || travel) return;
    const p = localPt(e);
    const dx = p.x - g.last.x;
    const dy = p.y - g.last.y;
    g.last = p;
    g.dist += Math.abs(dx) + Math.abs(dy);
    if (g.dist > TAP_SLOP) g.moved = true;
    // the sheet follows the finger unclamped; release eases it back inside the bounds (§12)
    setCamera((c) => ({ pan: { x: (c?.pan?.x ?? 0) + dx, y: (c?.pan?.y ?? 0) + dy }, motion: 'none' }));
  }
  function onPointerUp() {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    if (!g.moved) {
      if (travel) onTapNode(null); // tap anywhere while travelling = 200 ms eased skip
      else if (g.target) activateNode(g.target);
    } else if (!travel) {
      setCamera((c) => ({ pan: clampPan(c?.pan || { x: 0, y: 0 }, vp, sheet), motion: 'ease' }));
    }
    g.target = null;
  }

  const revealed = territory.nodes.filter((n) => n.revealed);
  const clearedCount = territory.nodes.filter((n) => n.cleared).length;
  const card = ambush || scout;
  const markerPos = cur ? sheetPt(cur) : { x: 0, y: 0 };
  const sheetMotion = !travel && camera?.motion === 'ease' ? ' is-anim' : '';
  // A re-render mid-trip (toast, HUD) must not reset the DOM to the pre-trip pose: re-apply the
  // tween's latest frame synchronously after every commit while it is running.
  useLayoutEffect(() => {
    const tw = tween.current;
    if (!tw.active || !tw.pos || !tw.pan) return;
    if (markerRef.current) { markerRef.current.style.left = `${tw.pos.x}px`; markerRef.current.style.top = `${tw.pos.y}px`; }
    if (sheetRef.current) sheetRef.current.style.transform = `translate(${tw.pan.x}px, ${tw.pan.y}px)`;
  });

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
            {/* edges by state (v3 §2) */}
            <g>
              {territory.edges.map(([a, b]) => {
                const na = byId[a];
                const nb = byId[b];
                if (!na || !nb || (!na.revealed && !nb.revealed)) return null;
                const bothWalkable = isWalkable(na) && isWalkable(nb);
                const planned = planEdges.has(`${a}|${b}`) || planEdges.has(`${b}|${a}`);
                const lit = litPath && litPath.includes(a) && litPath.includes(b) && Math.abs(litPath.indexOf(a) - litPath.indexOf(b)) === 1;
                const cls = planned ? 'eld-edge-plan' : lit ? 'eld-lit-path' : bothWalkable ? 'eld-edge-cleared' : 'eld-edge-frontier';
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
            const canGo = reachable.has(n.id);
            const rare = rareAt(territory, n.id);
            const known = n.typeKnown || n.cleared;
            const eff = effectiveType(territory, n);
            const bossSealed = n.type === 'boss' && sealed;
            let state;
            if (here) state = 'is-here';
            else if (rare) state = 'is-rare';
            else if (n.type === 'boss') state = `is-boss ${bossSealed ? 'is-sealed' : 'is-unsealed'}`;
            else if (!known) state = 'is-unknown';
            else if (n.cleared) state = 'is-cleared';
            else state = n.namedRare ? 'is-named' : 'is-scouted';
            const cls = ['eld-pnode', state, canGo && 'is-reach', isWalkable(n) && 'is-walkable'].filter(Boolean).join(' ');
            const glyph = here ? '' : rare ? '☠' : !known ? 'ᚱ' : TYPE_GLYPH[n.type] || '⚔';
            const label = here ? 'Party' : !known ? 'Unknown' : rare ? 'Rare' : bossSealed ? 'Boss (sealed)' : n.cleared ? 'Cleared' : n.namedRare ? `Named ${nodeTypeMeta[eff]?.label || 'foe'}` : nodeTypeMeta[eff]?.label || 'Node';
            return (
              <button
                key={n.id}
                type="button"
                data-node={n.id}
                className={cls}
                title={label}
                aria-label={label}
                style={{ left: sx(n.x) - NODE_HIT / 2, top: sy(n.y) - NODE_HIT / 2, '--type': TYPE_COLOR[n.type] || TYPE_COLOR.normal }}
                onClick={(e) => { if (e.detail === 0) activateNode(n.id); }}
              >
                <span className="eld-pnode-shape" aria-hidden="true">{glyph}</span>
                {n.type === 'boss' && bossSealed && <span className="eld-pnode-chain" aria-hidden="true">⛓</span>}
              </button>
            );
          })}

          {/* §14 the party marker glides along the polyline in one continuous tween */}
          {cur && <div ref={markerRef} className="eld-party-marker" style={{ left: markerPos.x, top: markerPos.y }} aria-hidden="true" />}
        </div>

        {/* §7 — single 44 px run HUD strip overlaid on the map */}
        <div className="eld-run-hud" role="status">
          <div className="eld-run-hud-left" title={area.name}>
            <span style={{ color: sealed ? '#b8a0e8' : '#7fd6a0' }}>{sealed ? `☠ ${raresLeft} rare${raresLeft === 1 ? '' : 's'} · ⛓ sealed` : '♛ seal broken'}</span>
            <span className="eld-run-hud-sep">·</span>
            <span title="nodes cleared">{clearedCount}/{territory.nodes.length}</span>
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

        {card && !confirmExtract && (
          <div className={`eld-scout-card eld-panel${ambush ? ' is-ambush' : ''}`} role="dialog" aria-label={ambush ? 'Ambush' : 'Scout report'}>
            <div className="eld-scout-top">
              <span className="eld-scout-type" style={{ color: ambush ? '#c0392b' : TYPE_COLOR[card.type] || undefined }}>
                {ambush ? '☠ Ambush!' : `${TYPE_GLYPH[card.type] || ''} ${card.title}`}
              </span>
              {card.threat && <span className="eld-scout-threat" style={{ color: card.threat.color, borderColor: card.threat.color }}>{card.threat.label}</span>}
            </div>
            <div className="eld-scout-body">{card.body}</div>
            {card.yieldText && <div className="eld-scout-yield">{card.yieldText}</div>}
            <div className="eld-scout-actions">
              {ambush ? (
                <>
                  <button type="button" className="eld-btn eld-btn-ghost" onClick={onFlee} disabled={busy}>Flee ({Math.round(ambush.fleeChance * 100)}%)</button>
                  <button type="button" className="eld-btn" onClick={onFight} disabled={busy}>Fight</button>
                </>
              ) : (
                <>
                  <button type="button" className="eld-btn eld-btn-ghost" onClick={onLeave}>Leave</button>
                  <button type="button" className="eld-btn" onClick={onEngage} disabled={card.engageDisabled || busy}>{card.engageLabel || 'Engage'}</button>
                </>
              )}
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
