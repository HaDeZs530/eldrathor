import { ARCHETYPES } from '../data.js';

/**
 * Sanctuary event — docs/Eldrathor_RouteMap_v2_Lock.md §3. No fight.
 * A wild healing crystal: full HP + mana for the party, revives any fallen Adventurer,
 * and the player picks one bonus for the rest of the run. Consumed on use. Mind-view.
 */
export const SANCTUARY_BONUSES = [
  { id: 'dmg', label: '+10% damage', blurb: 'The bond strikes harder for the rest of this run.', glyph: '⚔' },
  { id: 'mit', label: '+10% mitigation', blurb: 'The bond takes less for the rest of this run.', glyph: '⛨' },
  // DESIGN-OPEN: pouch size — 10 × area tier Worldvein.
  { id: 'vein', label: 'Worldvein pouch', blurb: 'A small pouch of Worldvein, banked with the run.', glyph: '❖' },
];

export default function SanctuaryScreen({ area, party, runHpFrac, pouch, onChoose }) {
  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Mind View · Sanctuary</div>
        <div className="eld-display eld-screen-title" style={S.title}>A wild healing crystal</div>
        <div style={S.sub}>{area?.name} · the light comes up green through the stone</div>
      </div>

      <div className="eld-aura-frame eld-panel" style={S.panel}>
        <div style={S.line}>The party rests. Wounds close; mana refills; the fallen stand again.</div>
        <div style={S.partyRow}>
          {party.map((m, i) => {
            const a = ARCHETYPES[m.archetype] || {};
            const before = runHpFrac?.[i] ?? 1;
            return (
              <div key={i} style={{ ...S.member, borderLeftColor: a.color }}>
                <div style={{ ...S.memberName, color: a.color }}>{m.name}</div>
                <div style={S.memberMeta}>{before <= 0 ? 'revived' : `${Math.round(before * 100)}% → 100%`}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={S.secLbl}>Choose one</div>
      <div style={S.choices}>
        {SANCTUARY_BONUSES.map((b) => (
          <button key={b.id} type="button" className="eld-btn" style={S.choice} onClick={() => onChoose(b.id)}>
            <span style={S.choiceGlyph}>{b.glyph}</span>
            <span style={S.choiceLabel}>{b.id === 'vein' ? `+${pouch} Worldvein` : b.label}</span>
            <span style={S.choiceBlurb}>{b.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const S = {
  wrap: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px 12px', textAlign: 'left', overflowY: 'auto' },
  head: { flexShrink: 0 },
  kick: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--eld-muted)', fontFamily: 'var(--eld-font-display)' },
  title: { fontSize: 'var(--mv-title, 26px)', fontWeight: 700, marginTop: 4, lineHeight: 1.1, color: '#bfffe0', textShadow: '0 0 16px rgba(127,214,160,0.5)' },
  sub: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', marginTop: 4, fontStyle: 'italic' },
  panel: { padding: 14, background: 'radial-gradient(circle at 50% 30%, #0f2a22 0%, #060d11 80%)', border: '1px solid rgba(127,214,160,0.45)', boxShadow: '0 0 24px rgba(127,214,160,0.25)' },
  line: { fontSize: 'var(--mv-text, 18px)', lineHeight: 1.45, color: 'var(--eld-text)' },
  partyRow: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 },
  member: { borderLeft: '3px solid', padding: '6px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' },
  memberName: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700 },
  memberMeta: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-good)' },
  secLbl: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  choices: { display: 'flex', flexDirection: 'column', gap: 8 },
  choice: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '12px 14px', minHeight: 'var(--mv-tap, 52px)', textAlign: 'left' },
  choiceGlyph: { fontSize: 'var(--mv-num, 24px)' },
  choiceLabel: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700 },
  choiceBlurb: { fontSize: 'var(--mv-label, 15px)', opacity: 0.8, textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--eld-font-body)' },
};
