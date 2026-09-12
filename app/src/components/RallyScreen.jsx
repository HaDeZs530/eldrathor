import { useState } from 'react';
import { ARCHETYPES } from '../data.js';

/**
 * Rally screen — docs/Eldrathor_RouteMap_v2_Lock.md §7. Between the island pin and the
 * route map: area header, lore panel, the three fielded Adventurers (tap to swap from the
 * roster), Explore. Warns when fewer than three are fielded.
 * // DESIGN-OPEN: final title wording ("Rally the bond" is the working kicker).
 */
export default function RallyScreen({ area, party, roster, onSwap, onExplore, onBack }) {
  const [pickingSlot, setPickingSlot] = useState(null); // slot index whose picker sheet is open
  const slots = [0, 1, 2].map((i) => party[i] || null);
  const fielded = slots.filter(Boolean).length;

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Rally the bond</div>
        <div className="eld-brand-name" style={S.title}>{area.name}</div>
        <div style={S.sub}>
          Tier {area.tier} · Boss: {area.boss}
          {area.bossBlurb ? ` — ${area.bossBlurb}` : ''}
        </div>
      </div>

      <div className="eld-panel" style={S.lore}>
        <div style={S.panelLbl}>{area.character}</div>
        <div style={S.loreText}>{area.lore}</div>
      </div>

      <div className="eld-panel" style={S.panel}>
        <div style={S.panelLbl}>Your three · tap to swap</div>
        <div style={S.list}>
          {slots.map((m, i) => {
            const a = m ? ARCHETYPES[m.archetype] || {} : {};
            return (
              <button
                key={i}
                type="button"
                className="eld-card"
                onClick={() => setPickingSlot(i)}
                style={{ ...S.member, borderLeftColor: m ? a.color || 'var(--eld-accent)' : '#e05d6f' }}
              >
                {m ? (
                  <>
                    <div style={{ ...S.memberName, color: a.color || 'inherit' }}>{m.name}</div>
                    <div style={S.memberMeta}>
                      {m.archetype} · {m.weapon} · Lv {m.level}
                    </div>
                  </>
                ) : (
                  <div style={{ ...S.memberName, color: '#e05d6f' }}>Empty slot — tap to field an Adventurer</div>
                )}
                <div style={S.swapHint}>⇄</div>
              </button>
            );
          })}
        </div>
        {fielded < 3 && <div style={S.warn}>Only {fielded} of 3 fielded. The bond is weaker with fewer than three.</div>}
      </div>

      <div style={S.actions}>
        <button type="button" className="eld-btn eld-btn-ghost" onClick={onBack} style={S.btn}>
          Back
        </button>
        <button type="button" className="eld-btn" onClick={onExplore} style={S.btn} disabled={fielded === 0}>
          Explore
        </button>
      </div>

      {pickingSlot != null && (
        <div style={S.sheetBackdrop} onClick={() => setPickingSlot(null)} role="presentation">
          <div className="eld-panel" style={S.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pick an Adventurer">
            <div style={S.sheetTitle}>Slot {pickingSlot + 1} · pick from the roster</div>
            {roster.length === 0 && <div style={S.empty}>No reserves. Create one on the Party tab.</div>}
            <div style={S.list}>
              {roster.map((m, ri) => {
                const a = ARCHETYPES[m.archetype] || {};
                return (
                  <button
                    key={ri}
                    type="button"
                    className="eld-card"
                    style={{ ...S.member, borderLeftColor: a.color }}
                    onClick={() => {
                      onSwap(pickingSlot, ri);
                      setPickingSlot(null);
                    }}
                  >
                    <div style={{ ...S.memberName, color: a.color }}>{m.name}</div>
                    <div style={S.memberMeta}>
                      {m.archetype} · {m.weapon} · Lv {m.level}
                    </div>
                  </button>
                );
              })}
            </div>
            <button type="button" className="eld-btn eld-btn-ghost" style={{ ...S.btn, marginTop: 10 }} onClick={() => setPickingSlot(null)}>
              Keep {slots[pickingSlot]?.name || 'slot empty'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' },
  head: { flexShrink: 0 },
  kick: { fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--eld-muted)', fontFamily: 'var(--eld-font-display)' },
  title: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  sub: { fontSize: 12, color: 'var(--eld-muted)', marginTop: 4, lineHeight: 1.4 },
  lore: { padding: 14 },
  loreText: { fontSize: 13, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--eld-text)' },
  panel: { padding: 14, flex: '0 0 auto' },
  panelLbl: { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--eld-muted)', marginBottom: 8 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  member: { padding: '10px 12px', borderLeft: '3px solid', textAlign: 'left', width: '100%', color: 'inherit', fontFamily: 'inherit', cursor: 'pointer', position: 'relative', minHeight: 48 },
  memberName: { fontSize: 14, fontWeight: 700 },
  memberMeta: { fontSize: 11, color: 'var(--eld-muted)', marginTop: 3 },
  swapHint: { position: 'absolute', right: 12, top: 12, color: 'var(--eld-muted)', fontSize: 14 },
  warn: { marginTop: 10, fontSize: 12, color: '#e05d6f' },
  actions: { display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 },
  btn: { flex: 1, padding: '12px 10px', minHeight: 48 },
  sheetBackdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 30 },
  sheet: { width: '100%', maxHeight: '75%', overflowY: 'auto', padding: 14, borderRadius: '12px 12px 0 0' },
  sheetTitle: { fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)', marginBottom: 10 },
  empty: { fontSize: 12, color: 'var(--eld-muted)', fontStyle: 'italic', marginBottom: 8 },
};
