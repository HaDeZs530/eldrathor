import { ARCHETYPES, TIER_COLOR } from '../data.js';

/**
 * Results screen — docs/Eldrathor_Combat_v2_Lock.md §7.
 * Victory: per-Adventurer damage dealt / taken / healing, fight time, Worldvein gained
 * (with the Attune Vein bonus line), loot (weapon + tier + rating 1–100), kill count.
 * Wipe: same card in red, "The bond pulls them home" → Veinharbor.
 */
export default function LootResults({ world, nodeLabel, fight, onContinue }) {
  const { result, stats, rewards } = fight;
  const win = result.win;
  const accent = win ? '#5fc7e0' : '#e05d6f';

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Mind View · Spoils</div>
        <div className="eld-brand-name" style={{ ...S.title, color: win ? '#e6f2f7' : '#e05d6f' }}>{win ? 'Victory' : 'The bond breaks'}</div>
        <div style={S.sub}>
          {world?.name}
          {nodeLabel ? ` · ${nodeLabel}` : ''}
          {` · ${result.durationSec}s`}
          {` · ${stats.kills} ${stats.kills === 1 ? 'kill' : 'kills'}`}
        </div>
      </div>

      <div className="eld-panel" style={{ ...S.panel, borderColor: win ? undefined : '#5a1f28' }}>
        <div style={S.secLbl}>The three</div>
        <div style={S.table}>
          <div style={S.tHead}>
            <span />
            <span>Dealt</span>
            <span>Taken</span>
            <span>Healed</span>
          </div>
          {stats.party.map((p) => (
            <div key={p.id} style={{ ...S.tRow, opacity: p.alive ? 1 : 0.55 }}>
              <span style={{ color: ARCHETYPES[p.archetype]?.color || accent, fontWeight: 700 }}>
                {p.name}
                {!p.alive && <span style={S.fallen}> · fallen</span>}
              </span>
              <span>{p.dealt}</span>
              <span>{p.taken}</span>
              <span>{p.healed}</span>
            </div>
          ))}
        </div>

        {win ? (
          <>
            <div style={S.row}>
              <span style={S.lbl}>Worldvein</span>
              <span style={{ ...S.val, color: accent }}>+{rewards.worldvein} ❖</span>
            </div>
            {result.attuneVein && (
              <div style={{ ...S.line, color: '#e0c090' }}>
                Attune Vein ▸ +{rewards.attuneBonus} Worldvein · loot tier biased +1
              </div>
            )}
            {rewards.gear ? (
              <div style={{ ...S.gear, borderColor: TIER_COLOR[rewards.gear.tier] || accent }}>
                <div style={{ color: TIER_COLOR[rewards.gear.tier] || '#e0a04d', fontWeight: 700 }}>{rewards.gear.name}</div>
                <div style={S.gearMeta}>
                  {rewards.gear.tier} · rating {rewards.gear.rating}/100 · weapon drop
                </div>
              </div>
            ) : (
              <div style={{ ...S.line, color: '#5f8494', fontStyle: 'italic' }}>No weapon this time — the Vein still yields dust.</div>
            )}
          </>
        ) : (
          <div style={{ ...S.line, color: '#e05d6f' }}>
            The bond pulls them home. Banked Worldvein from this run returns with you; the territory resets.
          </div>
        )}
      </div>

      <button type="button" className="eld-btn" onClick={onContinue} style={S.btn}>
        {win ? 'Continue' : 'Return to Veinharbor'}
      </button>
    </div>
  );
}

const S = {
  wrap: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 16px 12px', textAlign: 'left', overflowY: 'auto' },
  head: { flexShrink: 0 },
  kick: { fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5f8494', fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)' },
  title: { fontSize: 20, fontWeight: 700, marginTop: 4 },
  sub: { fontSize: 12, color: '#5f8494', marginTop: 4, fontStyle: 'italic' },
  panel: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  secLbl: { fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5f8494' },
  table: { display: 'flex', flexDirection: 'column', gap: 4 },
  tHead: { display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5f8494', textAlign: 'right' },
  tRow: { display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', fontSize: 12, textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  fallen: { fontSize: 9, color: '#e05d6f', fontWeight: 400 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  lbl: { fontSize: 12, color: '#5f8494', letterSpacing: '0.1em', textTransform: 'uppercase' },
  val: { fontSize: 18, fontWeight: 700 },
  gear: { border: '1px solid', borderLeftWidth: 3, padding: '10px 12px', borderRadius: 8 },
  gearMeta: { fontSize: 11, color: '#5f8494', marginTop: 4 },
  line: { fontSize: 13, lineHeight: 1.45 },
  btn: { marginTop: 'auto', padding: '14px 12px', width: '100%' },
};
