import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { biomeForArea, renderBiomeLayer } from './biomeStamps.jsx';
import { rareAt, isSealed, isWalkable, nodeState } from './routeState.js';
import { resolveFocus, centerOn, clampPan, easeInOut, easeOut, polylinePointAt, SKIP_MS, FOLLOW_TAU_MS, FRAME_EASE_MS } from './camera.js';
import { trace, isTraceOn } from '../debug/trace.js';
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
* Camera: ONE JS controller owns the sheet transform. Every move — tap pan, overlay-close pan,
 * drag release, the travel glide — starts from the controller's exact current pan and is stepped
 * frame by frame here (no CSS transitions, nothing ever read back from the DOM), so a move can
 * never start from a stale or mis-read position. `camera` (prop) holds the committed pan + pending
 * framing requests; the controller commits back when a move finishes.
 * §16 (amended 2026-09-13, slower): travel is ONE continuous requestAnimationFrame tween along the
 * polyline (900 ms/hop, eased at the ends only); the camera follows the marker every frame; tap-to-skip eases 300 ms.
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


/**
 * Frame scheduler: requestAnimationFrame while the page is visible; a coarse timer while it is
 * hidden (rAF pauses in a backgrounded tab / app, which would stall a trip until the player
 * returns — the trip is time-based, so it still lands on time and on the exact node).
 */
const HIDDEN_TICK_MS = 50;
function schedule(step) {
  if (typeof document !== 'undefined' && document.hidden) return { t: window.setTimeout(() => step(performance.now()), HIDDEN_TICK_MS) };
  return { r: window.requestAnimationFrame(step) };
}
function cancelScheduled(h) {
  if (!h) return;
  if (h.r) window.cancelAnimationFrame(h.r);
  if (h.t) window.clearTimeout(h.t);
}

/** Marker placement — transform only (its own compositor layer; no layout, no parchment repaint per frame). */
const markerTransform = (pos) => `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(45deg)`;
const sheetTransform = (pan) => `translate3d(${pan.x}px, ${pan.y}px, 0)`;

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
  const vpEl = useRef(null);
  const vpRO = useRef(null);
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

  // Measure synchronously on mount (callback ref) — ResizeObserver only delivers on a VISIBLE document,
  // so a map mounted while the app is backgrounded would otherwise never learn its viewport.
  const vpRef = useCallback((el) => {
    if (vpRO.current) { vpRO.current.disconnect(); vpRO.current = null; }
    vpEl.current = el;
    if (!el) return;
    setVp({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    vpRO.current = ro;
  }, []);

  const cur = byId[currentId];
  const measured = vp.w > 0 && vp.h > 0;
  const pan = camera?.pan || { x: 0, y: 0 }; // committed pan — the initial paint only; the controller owns the rest

  // ---------- camera controller (single owner of the sheet transform) ----------
  // the controller's mutable state lives in a ref; it is only ever touched from handlers, effects and frame callbacks
  const cam = useRef({ pan: { x: pan.x, y: pan.y }, anim: null, raf: null });
  const writeSheet = () => { if (sheetRef.current) sheetRef.current.style.transform = sheetTransform(cam.current.pan); };
  const stopCameraAnim = () => { const c = cam.current; if (c.raf) cancelScheduled(c.raf); c.raf = null; c.anim = null; };
  /** Eased pan from the controller's CURRENT pan to `target` over `ms` (0 = immediate); commits when done. */
  const panTo = (target, ms, cause, extra = {}) => {
    const c = cam.current;
    stopCameraAnim();
    const px = Math.hypot(target.x - c.pan.x, target.y - c.pan.y);
    trace('pan', { cause, from: [c.pan.x, c.pan.y], to: [target.x, target.y], px, ms, ...extra });
    if (px < 0.5 || ms <= 0) { c.pan = { ...target }; writeSheet(); setCamera({ type: 'set', pan: c.pan }); return; }
    c.anim = { from: { ...c.pan }, to: { ...target }, t0: performance.now(), ms };
    const step = (now) => {
      const a = c.anim; if (!a) return;
      const u = Math.min(1, (now - a.t0) / a.ms);
      const k = easeInOut(u, 0.5); // soft in and out
      c.pan = { x: a.from.x + (a.to.x - a.from.x) * k, y: a.from.y + (a.to.y - a.from.y) * k };
      writeSheet();
      if (u >= 1) { c.anim = null; c.raf = null; setCamera({ type: 'set', pan: c.pan }); return; }
      c.raf = schedule(step);
    };
    c.raf = schedule(step);
  };

  // Framing requests (run start = immediate centre; overlay close = slow pan onto the party) resolve
  // once the viewport is measured, from the controller's exact current pan.
  useLayoutEffect(() => {
    if (!measured || !camera?.focus) return;
    const target = resolveFocus(camera.focus, ptOf, vp, sheet, MARGIN, cam.current.pan);
    if (!target) return;
    panTo(target, camera.motion === 'ease' ? FRAME_EASE_MS : 0, camera.focus.mode === 'centre' && camera.motion !== 'ease' ? 'runStart' : 'overlayClose');
    // consume the request: a tap that cancels this pan must not leave it behind to be replayed by the
    // next layout change (a fight opening) — that pulled the camera back to the previous node mid-fade
    setCamera({ type: 'focusTaken' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera?.focus, vp.w, vp.h]);

  // ---------- §16 continuous travel tween (rAF; the marker + the camera glide, frame by frame) ----------
  const tween = useRef({ active: false, pos: null, skipFrom: null, skipAt: null, raf: null });
  const travelRef = useRef(travel);
  useEffect(() => { travelRef.current = travel; });
  useEffect(() => {
    if (!travel) { tween.current.active = false; return undefined; }
    const c = cam.current;
    stopCameraAnim(); // the trip takes over from wherever the camera is — exactly, no read-back
    cancelScheduled(tween.current.raf); // a previous trip still settling hands over here
    const points = travel.path.map((id) => sheetPt(byId[id]));
    const dest = points[points.length - 1];
    const t0 = travel.startTs;
    const dur = Math.max(1, travel.duration);
    const stat = { frames: 0, maxStep: 0, camPx: 0, t0: performance.now() }; // per-trip camera summary for the debug trace
    trace('tween', { start: [c.pan.x, c.pan.y], marker: [points[0].x, points[0].y], hops: points.length - 1, ms: dur });
    let lastTs = null;
    let prevPan = c.pan;
    tween.current = { active: true, pos: points[0], skipFrom: null, skipAt: null, raf: null };
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
      // pan-to-centre follow: glide toward "centred on the marker" with a slow exponential lag
      const target = centerOn(pos, vp, sheet, MARGIN);
      const dt = lastTs == null ? 16 : Math.min(100, now - lastTs);
      const k = 1 - Math.exp(-dt / FOLLOW_TAU_MS);
      c.pan = { x: c.pan.x + (target.x - c.pan.x) * k, y: c.pan.y + (target.y - c.pan.y) * k };
      lastTs = now;
      if (markerRef.current) markerRef.current.style.transform = markerTransform(pos);
      writeSheet();
      if (isTraceOn()) { const st = Math.hypot(c.pan.x - prevPan.x, c.pan.y - prevPan.y); stat.frames += 1; stat.camPx += st; if (st > stat.maxStep) stat.maxStep = st; if (st > 40) trace('camjump', { px: st, frameMs: dt, at: Math.round(now - stat.t0) }); }
      prevPan = c.pan;
      if (finished) {
        done = true;
        trace('tween', { arrived: true, elapsed: Math.round(now - stat.t0), frames: stat.frames, camPx: stat.camPx, maxStep: stat.maxStep, skipped: trv?.skipAt != null });
        onTravelEnd(); // the party is placed on arrival; the camera may still be gliding
        // settle: same slow glide until the camera rests centred on the marker (≤ 1.5 s), then commit — no snap
        const settleT0 = now;
        let lastSettle = now;
        const settle = (t) => {
          const sdt = Math.min(100, t - lastSettle); lastSettle = t;
          const tgt = centerOn(tw.pos, vp, sheet, MARGIN);
          const dist = Math.hypot(tgt.x - c.pan.x, tgt.y - c.pan.y);
          if (dist > 0.5 && t - settleT0 < 1500) {
            const kk = 1 - Math.exp(-sdt / FOLLOW_TAU_MS);
            c.pan = { x: c.pan.x + (tgt.x - c.pan.x) * kk, y: c.pan.y + (tgt.y - c.pan.y) * kk };
            writeSheet();
            tw.raf = schedule(settle);
            return;
          }
          tw.active = false;
          trace('tween', { settled: true, settleMs: Math.round(t - settleT0), pan: [c.pan.x, c.pan.y], restPx: dist });
          setCamera({ type: 'travelEnd', pan: c.pan });
        };
        tw.raf = schedule(settle);
        return;
      }
      tw.raf = schedule(step);
    };
    tween.current.raf = schedule(step);
    // cleanup cancels only a trip still in flight; once arrived, the settle glide must run to its end
    // (travel state clears on arrival, which re-runs this effect)
    return () => { if (!done) { done = true; cancelScheduled(tween.current.raf); } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel?.startTs]);

  // After EVERY commit the DOM shows the controller's pan (React's style prop is only the first paint),
  // and the marker its tween position while a trip runs.
  useLayoutEffect(() => {
    writeSheet();
    const tw = tween.current;
    if (tw.active && tw.pos && markerRef.current) markerRef.current.style.transform = markerTransform(tw.pos);
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
    const r = vpEl.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function activateNode(id) {
    const n = byId[id];
    if (!n || busy || !n.revealed) return;
    // pan to centre, slowly: the tapped node glides to the centre of the HUD/card band
    if (measured && n.id !== currentId && !n.cleared) panTo(centerOn(sheetPt(n), vp, sheet, MARGIN), FRAME_EASE_MS, 'tap', { node: n.id });
    onTapNode(n);
  }
  function onPointerDown(e) {
    const g = gesture.current;
    if (g.active) return;
    g.active = true; g.dist = 0; g.moved = false; g.start = localPt(e); g.basePan = { ...cam.current.pan };
    g.target = e.target.closest?.('[data-node]')?.dataset.node || null;
    capturePointer(vpEl.current, e.pointerId);
  }
  function onPointerMove(e) {
    const g = gesture.current;
    if (!g.active || travel) return;
    const p = localPt(e);
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    g.dist = Math.abs(dx) + Math.abs(dy);
    if (g.dist > TAP_SLOP) g.moved = true;
    // the sheet follows the finger unclamped (controller only — no React state per move); release eases it back
    if (g.moved) { stopCameraAnim(); cam.current.pan = { x: g.basePan.x + dx, y: g.basePan.y + dy }; writeSheet(); }
  }
  function onPointerUp() {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    if (!g.moved) {
      if (travel) { trace('gesture', { tap: 'skip-travel' }); onTapNode(null); } // tap anywhere while travelling = eased skip
      else if (g.target) activateNode(g.target);
      else trace('gesture', { tap: 'empty' });
    } else if (!travel) {
      trace('gesture', { drag: [g.start.x, g.start.y], px: g.dist });
      panTo(clampPan(cam.current.pan, vp, sheet), 500, 'release');
    }
    g.target = null;
  }

  const revealed = territory.nodes.filter((n) => n.revealed);
  const completedCount = territory.nodes.filter((n) => n.cleared).length;

  // ---------- fog of war: drawn ONCE per change into a bitmap ----------
  // Performance: the previous SVG <mask> (one radial gradient per revealed node over a sheet several
  // screens tall) was re-rasterised by the compositor for every tile that scrolled into view on a
  // Retina phone — pans and glides stuttered, more with every revealed node. A canvas is a plain
  // bitmap: painted here on change, then just copied while the camera moves.
  const fogRef = useRef(null);
  const fogKey = `${sheet.w}x${sheet.h}|${biome.interior ? 1 : 0}|${revealed.map((n) => `${n.id}${n.cleared ? 'c' : ''}`).join(',')}`;
  useLayoutEffect(() => {
    const cv = fogRef.current;
    if (!cv || !sheet.w || !sheet.h) return;
    const scale = 1; // fog is soft — a 1× backing store keeps the bitmap small on DPR 3 phones
    cv.width = Math.ceil(sheet.w * scale); cv.height = Math.ceil(sheet.h * scale);
    const g = cv.getContext('2d');
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(226, 210, 171, 0.95)';
    g.fillRect(0, 0, sheet.w, sheet.h);
    // mist: soft diagonal wisps
    g.save(); g.translate(sheet.w / 2, sheet.h / 2); g.rotate(-18 * Math.PI / 180);
    const R = Math.hypot(sheet.w, sheet.h);
    g.strokeStyle = 'rgba(255, 250, 236, 0.16)'; g.lineWidth = 2;
    for (let y = -R; y < R; y += 26) {
      g.beginPath();
      for (let x = -R; x < R; x += 26) { g.moveTo(x, y); g.quadraticCurveTo(x + 6.5, y - 6, x + 13, y); g.quadraticCurveTo(x + 19.5, y + 6, x + 26, y); }
      g.stroke();
    }
    g.restore();
    // holes around revealed nodes (larger once completed)
    g.globalCompositeOperation = 'destination-out';
    const inner = biome.interior ? 0.62 : 0.5;
    for (const n of revealed) {
      const r = (biome.interior ? (n.cleared ? 128 : 104) : n.cleared ? 150 : 118) * ZOOM;
      const cx = sx(n.x); const cy = sy(n.y);
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(inner, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fogKey]);
  const markerPos = cur ? sheetPt(cur) : { x: 0, y: 0 };

  return (
    <div className="eld-map-wrap" style={styles.wrap}>
      <div ref={vpRef} className="eld-route-viewport eld-route-viewport--full" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div ref={sheetRef} className="eld-parchment-sheet" style={{ width: sheet.w, height: sheet.h, transform: sheetTransform(pan) }}>
          <svg className="eld-parchment-svg" width={sheet.w} height={sheet.h} viewBox={`${-M.x} ${-M.top} ${VW} ${VH}`}>
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
          </svg>
          {/* fog of war — one pre-rendered bitmap (see the fog effect), not an SVG mask rasterised per tile per pan */}
          <canvas ref={fogRef} className="eld-fog" style={{ position: 'absolute', left: 0, top: 0, width: sheet.w, height: sheet.h, pointerEvents: 'none' }} aria-hidden="true" />

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
          {cur && <div ref={markerRef} className="eld-party-marker" style={{ transform: markerTransform(markerPos) }} aria-hidden="true" />}
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
