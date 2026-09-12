import { ARCHETYPES } from '../data.js';

/**
 * Rally screen — world pin → here → Explore → route map.
 * Audit A2 ruling (2026-09-11): no difficulty bands; the World IS the difficulty band.
 * Shows the world, its boss, and the three fielded Adventurers, then one CTA.
 * // DESIGN-OPEN: final title wording ("Rally the bond" is the working kicker).
 */
export default function RallyScreen({ world, party, onExplore, onBack }) {
  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Rally the bond</div>
        <div className="eld-brand-name" style={S.title}>{world.name}</div>
        <div style={S.sub}>
          Tier {world.tier}
          {world.boss ? ` · Boss: ${world.boss}` : ''}
        </div>
      </div>

      <div className="eld-panel" style={S.panel}>
        <div style={S.panelLbl}>Your three</div>
        <div style={S.list}>
          {party.map((m, i) => {
            const a = ARCHETYPES[m.archetype] || {};
            return (
              <div key={i} className="eld-card" style={{ ...S.member, borderLeftColor: a.color || 'var(--eld-accent)' }}>
                <div style={{ ...S.memberName, color: a.color || 'inherit' }}>{m.name}</div>
                <div style={S.memberMeta}>
                  {m.archetype} · {m.weapon} · Lv {m.level}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={S.actions}>
        <button type="button" className="eld-btn eld-btn-ghost" onClick={onBack} style={S.btn}>
          Back
        </button>
        <button type="button" className="eld-btn" onClick={onExplore} style={S.btn}>
          Explore
        </button>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '14px 16px 12px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  head: { flexShrink: 0 },
  kick: {
    fontSize: 9,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    fontFamily: 'var(--eld-font-display)',
  },
  title: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  sub: { fontSize: 12, color: 'var(--eld-muted)', marginTop: 4 },
  panel: { padding: 14, flex: '0 0 auto' },
  panelLbl: {
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    marginBottom: 10,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  member: { padding: '10px 12px', borderLeft: '3px solid' },
  memberName: { fontSize: 14, fontWeight: 700 },
  memberMeta: { fontSize: 11, color: 'var(--eld-muted)', marginTop: 3 },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 8,
  },
  btn: { flex: 1, padding: '12px 10px' },
};
