import React from 'react';
import { TIER_COLOR } from '../data.js';

/**
 * Post-fight loot stage — shown before returning to expedition map.
 */
export default function LootResults({
  world,
  nodeLabel,
  win,
  loot,
  duration,
  onContinue,
}) {
  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Mind View · Spoils</div>
        <div className="eld-brand-name" style={S.title}>
          {win ? 'Victory' : 'Defeat'}
        </div>
        <div style={S.sub}>
          {world?.name}
          {nodeLabel ? ` · ${nodeLabel}` : ''}
          {duration != null ? ` · ${duration}s` : ''}
        </div>
      </div>

      <div className="eld-panel" style={S.panel}>
        {!win && (
          <div style={{ ...S.line, color: '#e05d6f' }}>
            The party falls. Banked Worldvein from this run returns with you.
          </div>
        )}
        {win && (
          <>
            <div style={S.row}>
              <span style={S.lbl}>Worldvein</span>
              <span style={S.val}>+{loot?.worldvein ?? 0} ❖</span>
            </div>
            {loot?.gear && (
              <div style={{ ...S.gear, borderColor: TIER_COLOR[loot.gear.tier] || '#5fc7e0' }}>
                <div style={{ color: TIER_COLOR[loot.gear.tier] || '#e0a04d' }}>{loot.gear.name}</div>
                <div style={S.gearMeta}>
                  {loot.gear.tier} · {loot.gear.rating}/100
                </div>
              </div>
            )}
            {loot?.healCrystal && (
              <div style={{ ...S.line, color: '#7fd6c0' }}>Healing crystal restores the party.</div>
            )}
            {!loot?.gear && (
              <div style={{ ...S.line, color: '#5f8494', fontStyle: 'italic' }}>
                No gear this time — the Vein still yields dust.
              </div>
            )}
          </>
        )}
      </div>

      <button type="button" className="eld-btn" onClick={onContinue} style={S.btn}>
        {win ? 'Continue' : 'Return to Veinharbor'}
      </button>
    </div>
  );
}

const S = {
  wrap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: '16px 16px 12px',
    textAlign: 'left',
    overflowY: 'auto',
  },
  head: { flexShrink: 0 },
  kick: {
    fontSize: 9,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#5f8494',
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
  },
  title: { fontSize: 20, fontWeight: 700, marginTop: 4, color: '#e6f2f7' },
  sub: { fontSize: 12, color: '#5f8494', marginTop: 4, fontStyle: 'italic' },
  panel: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  lbl: { fontSize: 12, color: '#5f8494', letterSpacing: '0.1em', textTransform: 'uppercase' },
  val: { fontSize: 18, fontWeight: 700, color: '#5fc7e0' },
  gear: {
    border: '1px solid',
    borderLeftWidth: 3,
    padding: '10px 12px',
    borderRadius: 8,
  },
  gearMeta: { fontSize: 11, color: '#5f8494', marginTop: 4 },
  line: { fontSize: 13, lineHeight: 1.45 },
  btn: { marginTop: 'auto', padding: '14px 12px', width: '100%' },
};
