import { useMemo, useRef, useState } from 'react';
import { Sheet, PrimaryButton, SecondaryButton } from '../ui/index.jsx';
import { GEM_TUNING, latticeFor, facetEffectText, coreText } from '../../lattice/classGems.js';
import { hexToPixel, hexPoints, CORE_ID } from '../../lattice/hexLayout.js';
import { levelOf, isReachable, imbueCost, derive } from '../../lattice/engine.js';
import { canImbueGem, imbueGem, canSwapGemFinisher, swapGemFinisher, gemEffects } from '../../progression/gems.js';
import { gemReadout } from '../items/GemSheet.jsx';
import { useTestNumbers } from '../../debug/useTestNumbers.js';
import './lattice.css';

/**
 * The Lattice screen — docs/Eldrathor_Growth_Model_Lock.md §4 (Mind View). An SVG hex lattice centred on
 * the Core; pinch-zoom and pan with the route map's rule (eased, never a cut); imbued facets lit in Mythros
 * blue with a glow, available facets a dim outline, unreachable facets dark. Header: gem, wearer, imbued/40,
 * this gem's unspent fragments, Worldvein, the live cumulative readout — "Equip to grow" when unworn.
 * Tap a facet → its sheet: effect per level, cost (1 fragment + ❖), **Imbue** with a stated reason when
 * disabled; finishers show the swap fee. Test-numbers mode shows the derive output.
 */
const HEX = 34; // circumradius in lattice units
const VIEW = 235; // half-extent of the viewBox (the four rings span ±~236 units; pan reaches the rest)
const ZOOM_MIN = 0.7, ZOOM_MAX = 2.4, EASE_MS = 350;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function LatticeScreen({ gem, wearer, worldvein, onSpend, onChangeGem, onClose }) {
  const def = latticeFor(gem.gemClass);
  const worn = !!wearer;
  const testNumbers = useTestNumbers();
  const [cam, setCam] = useState({ x: 0, y: 0, k: 1 });
  const [easing, setEasing] = useState(false);
  const [openId, setOpenId] = useState(null);
  const svgRef = useRef(null);
  const g = useRef({ pointers: new Map(), start: null, moved: false });

  const cells = useMemo(() => def.facets.map((f) => ({ f, ...hexToPixel(f.pos, HEX) })), [def]);
  const lit = (id) => id === CORE_ID || levelOf(gem.lattice, id) > 0;
  const stateOf = (f) => (f.kind === 'dormant' ? 'dormant'
    : levelOf(gem.lattice, f.id) > 0 ? (levelOf(gem.lattice, f.id) >= f.maxLevel ? 'full' : 'lit')
      : f.exclusiveGroup && gem.lattice.finisher && gem.lattice.finisher !== f.id ? 'darkened'
        : isReachable(def, gem.lattice, f.id) ? 'available' : 'unreachable');

  // ---- camera: drag to pan, pinch / wheel to zoom; programmatic moves ease (never a cut) ----
  const unit = () => { const r = svgRef.current?.getBoundingClientRect(); return r ? (2 * VIEW) / Math.min(r.width, r.height) : 1; };
  const bound = (c) => { const lim = VIEW * c.k; return { ...c, x: clamp(c.x, -lim, lim), y: clamp(c.y, -lim, lim) }; };
  const easeTo = (next) => { setEasing(true); setCam(bound(next)); window.setTimeout(() => setEasing(false), EASE_MS); };
  function onPointerDown(e) {
    const s = g.current; s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    svgRef.current?.setPointerCapture?.(e.pointerId);
    s.moved = false;
    if (s.pointers.size === 1) s.start = { cam, x: e.clientX, y: e.clientY };
    else if (s.pointers.size === 2) { const [a, b] = [...s.pointers.values()]; s.start = { cam, dist: Math.hypot(a.x - b.x, a.y - b.y) }; }
  }
  function onPointerMove(e) {
    const s = g.current; if (!s.pointers.has(e.pointerId) || !s.start) return;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (s.pointers.size === 1 && s.start.x != null) {
      const dx = e.clientX - s.start.x, dy = e.clientY - s.start.y;
      if (Math.hypot(dx, dy) > 6) s.moved = true;
      if (s.moved) setCam(bound({ ...s.start.cam, x: s.start.cam.x + dx * unit(), y: s.start.cam.y + dy * unit() }));
    } else if (s.pointers.size === 2 && s.start.dist) {
      const [a, b] = [...s.pointers.values()]; s.moved = true;
      setCam(bound({ ...s.start.cam, k: clamp(s.start.cam.k * (Math.hypot(a.x - b.x, a.y - b.y) / s.start.dist), ZOOM_MIN, ZOOM_MAX) }));
    }
  }
  function onPointerUp(e) { const s = g.current; s.pointers.delete(e.pointerId); if (s.pointers.size === 0) s.start = null; else { const [p] = [...s.pointers.values()]; s.start = { cam, x: p.x, y: p.y }; } }
  const onWheel = (e) => setCam((c) => bound({ ...c, k: clamp(c.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12), ZOOM_MIN, ZOOM_MAX) }));
  const tapFacet = (id) => { if (!g.current.moved) setOpenId(id); };

  const open = openId && openId !== CORE_ID ? def.facets.find((f) => f.id === openId) : null;
  const lv = open ? levelOf(gem.lattice, open.id) : 0;
  const check = open ? canImbueGem(gem, open.id, { worldvein, worn }) : null;
  const isOtherFinisher = open?.exclusiveGroup && gem.lattice.finisher && gem.lattice.finisher !== open.id;
  const swap = isOtherFinisher ? canSwapGemFinisher(gem, open.id, { worldvein, worn }) : null;
  const doImbue = () => { const r = imbueGem(gem, open.id); onSpend(r.cost); onChangeGem(r.gem); };
  const doSwap = () => { const r = swapGemFinisher(gem, open.id); onSpend(r.cost); onChangeGem(r.gem); };
  const readout = gemReadout(gem);
  const fx = testNumbers ? gemEffects(wearer?.archetype || 'Resonator', gem) : null;

  return (
    <div className="eld-lattice eld-mode-mind" data-mode-column="mind">
      <div className="eld-lattice-head">
        <div className="eld-lattice-top">
          <SecondaryButton onClick={onClose}>← Back</SecondaryButton>
          <div className="eld-lattice-vein" aria-label={`${worldvein} Worldvein`}>❖ {Number(worldvein).toLocaleString()}</div>
        </div>
        <div className="eld-lattice-kick">Mind View · The Lattice</div>
        <div className="eld-display eld-lattice-title">◆ {gem.name}</div>
        <div className="eld-lattice-meta">
          {worn ? <>Worn by <strong>{wearer.name}</strong></> : <strong className="eld-lattice-warn">Equip to grow</strong>}
          {' · '}<strong>{gem.lattice.imbues}/{GEM_TUNING.points}</strong> imbued{' · '}<strong>{gem.fragments?.unspent || 0}</strong> fragment{(gem.fragments?.unspent || 0) === 1 ? '' : 's'} unspent
        </div>
        <div className="eld-lattice-readout" aria-label="What this gem grants">
          {readout.length ? readout.join(' · ') : 'Nothing imbued yet — the Core is always lit.'}
        </div>
        {testNumbers && fx && (
          <div className="eld-test-numbers" aria-label="Lattice derive output (test numbers)">
            derive → {JSON.stringify(derive(def, gem.lattice))} · next imbue {imbueCost(gem.lattice.imbues, GEM_TUNING.imbue)} ❖ · {fx.crossing ? `crossing → ${fx.coreAbility.id}` : `matching ×${fx.innateAmp.toFixed(3)}`}
          </div>
        )}
      </div>

      <div className="eld-lattice-stage">
        <svg
          ref={svgRef} className="eld-lattice-svg" viewBox={`${-VIEW} ${-VIEW} ${2 * VIEW} ${2 * VIEW}`} role="group" aria-label={`${gem.name} lattice`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}
        >
          <defs>
            <filter id="eld-facet-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <g style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.k})`, transition: easing ? `transform ${EASE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none' }}>
            {/* veins: a line between two touching facets once both are lit */}
            {cells.flatMap(({ f, x, y }) => f.neighbors.filter((n) => n < f.id || n === CORE_ID).map((n) => {
              const o = n === CORE_ID ? { x: 0, y: 0 } : cells.find((c) => c.f.id === n);
              const on = lit(f.id) && lit(n);
              return <line key={`${f.id}-${n}`} x1={x} y1={y} x2={o.x} y2={o.y} className={`eld-vein${on ? ' is-lit' : ''}`} />;
            }))}
            <g className="eld-facet is-core" onClick={() => tapFacet(CORE_ID)} role="button" aria-label={`Core: ${def.core.name}`} tabIndex={0}>
              <polygon points={hexPoints(0, 0, HEX - 2)} filter="url(#eld-facet-glow)" />
              <text y="-4" className="eld-facet-glyph">{def.core.glyph}</text>
              <text y="14" className="eld-facet-name">Core</text>
            </g>
            {cells.map(({ f, x, y }) => {
              const st = stateOf(f); const level = levelOf(gem.lattice, f.id);
              return (
                <g key={f.id} className={`eld-facet is-${st} kind-${f.kind}`} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} data-facet={f.id}
                  onClick={() => tapFacet(f.id)} role="button" tabIndex={f.kind === 'dormant' ? -1 : 0}
                  aria-label={f.kind === 'dormant' ? 'Dormant facet' : `${f.name}, level ${level} of ${f.maxLevel}, ${st}`}>
                  <polygon points={hexPoints(0, 0, HEX - 2)} filter={st === 'lit' || st === 'full' ? 'url(#eld-facet-glow)' : undefined} />
                  {f.kind !== 'dormant' && <text y="-3" className="eld-facet-name">{short(f.name)}</text>}
                  {f.kind !== 'dormant' && <text y="13" className="eld-facet-lv">{f.kind === 'proc' ? (level ? '✦' : '◇') : `${level}/${f.maxLevel}`}</text>}
                </g>
              );
            })}
          </g>
        </svg>
        <div className="eld-lattice-ctl" data-no-map-gesture>
          <button type="button" className="eld-btn eld-btn-ghost" aria-label="Zoom in" onClick={() => easeTo({ ...cam, k: clamp(cam.k * 1.3, ZOOM_MIN, ZOOM_MAX) })}>+</button>
          <button type="button" className="eld-btn eld-btn-ghost" aria-label="Zoom out" onClick={() => easeTo({ ...cam, k: clamp(cam.k / 1.3, ZOOM_MIN, ZOOM_MAX) })}>−</button>
          <button type="button" className="eld-btn eld-btn-ghost" aria-label="Centre on the Core" onClick={() => easeTo({ x: 0, y: 0, k: 1 })}>◆</button>
        </div>
        <div className="eld-lattice-legend" aria-hidden="true"><span className="is-lit">lit</span><span className="is-available">available</span><span className="is-unreachable">unreachable</span></div>
      </div>

      {openId === CORE_ID && (
        <Sheet onClose={() => setOpenId(null)} label="Core" title={<>◆ Core · {def.core.name}</>} column="mind">
          <div className="eld-item-stats">
            <div className="eld-item-note">Always lit. {coreText(gem.gemClass)}</div>
            <div className="eld-item-note">A wearer whose archetype is not this gem's class (crossing) is granted this ability. A matching wearer gets no second ability — their own innate is amplified by 1 + 0.5 × imbued/40 instead.</div>
          </div>
          <div className="eld-item-actions"><SecondaryButton onClick={() => setOpenId(null)}>Close</SecondaryButton></div>
        </Sheet>
      )}
      {open && (
        <Sheet onClose={() => setOpenId(null)} label={open.name} title={<>{open.kind === 'finisher' ? '✷' : open.kind === 'proc' ? '✦' : '⬡'} {open.name}</>} column="mind">
          <div className="eld-item-stats">
            {open.kind === 'dormant' ? <div className="eld-item-empty">Nothing is written on this facet yet.</div> : (
              <>
                <div className="eld-item-stat"><span className="eld-item-stat-k">Level</span><span className="eld-item-stat-v">{lv} / {open.maxLevel}</span></div>
                {Array.from({ length: open.maxLevel }, (_, i) => i + 1).map((n) => (
                  <div key={n} className={`eld-item-note${n === lv ? ' is-now' : ''}`}>L{n} · {facetEffectText(open, n)}{n === lv ? ' ← now' : n === lv + 1 ? ' ← next' : ''}</div>
                ))}
                {!isOtherFinisher && lv < open.maxLevel && <div className="eld-item-stat"><span className="eld-item-stat-k">Cost</span><span className="eld-item-stat-v">1 fragment + {check.cost} ❖</span></div>}
                {isOtherFinisher && <div className="eld-item-stat"><span className="eld-item-stat-k">Swap fee</span><span className="eld-item-stat-v">{swap.fee.fragments} fragments + {swap.fee.worldvein} ❖</span></div>}
                {isOtherFinisher && <div className="eld-item-note">One finisher per gem. Swapping moves the set finisher's levels here.</div>}
              </>
            )}
          </div>
          <div className="eld-item-actions">
            {open.kind !== 'dormant' && !isOtherFinisher && <PrimaryButton onClick={doImbue} disabled={!check.ok}>{check.ok ? 'Imbue' : check.reason}</PrimaryButton>}
            {isOtherFinisher && <PrimaryButton onClick={doSwap} disabled={!swap.ok}>{swap.ok ? 'Swap finisher' : swap.reason}</PrimaryButton>}
            <SecondaryButton onClick={() => setOpenId(null)}>Close</SecondaryButton>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** Facet names are short, but a hex is small — keep the first word, or the whole name when it fits. */
const short = (name) => (name.length <= 11 ? name : name.split(' ')[0].slice(0, 11));
