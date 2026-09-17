import { ARCHETYPES } from '../data.js';
import { upgradeFor } from '../progression/upgrade.js';
import ItemRow from './items/ItemRow.jsx';

/**
 * Results screen — docs/Eldrathor_Combat_v2_Lock.md §7.
 * Victory: per-Adventurer damage dealt / taken / healing, fight time, Worldvein gained
 * (with the Attune Vein bonus line), loot, kill count.
 * Wipe: same card in red, "The bond pulls them home" → Veinharbor.
 *
 * Item Model §3 / §12: loot lines are `ItemRow`s, with an "↑ upgrade for <name>" note when the drop
 * beats what that Adventurer has equipped in the same slot.
 */
export default function LootResults({ area, nodeLabel, fight, party = [], onContinue }) {
  const { result, stats, rewards } = fight;
  const win = result.win;
  const accent = win ? 'var(--eld-accent)' : 'var(--eld-danger)';

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Mind View · Spoils</div>
        <div className="eld-display eld-screen-title" style={{ ...S.title, color: win ? 'var(--eld-display)' : 'var(--eld-danger)' }}>{win ? 'Victory' : 'The bond breaks'}</div>
        <div style={S.sub}>
          {area?.name}
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
              <div style={{ ...S.line, color: 'var(--eld-gold)' }}>
                Attune Vein ▸ +{rewards.attuneBonus} Worldvein · the top-two drop chances doubled
              </div>
            )}
            {rewards.mapClearBonus > 0 && (
              <div style={{ ...S.line, color: 'var(--eld-gold)' }}>Map cleared ▸ +{rewards.mapClearBonus} Worldvein · a guaranteed Rare-or-better weapon</div>
            )}
            {fight.named && <div style={{ ...S.line, color: 'var(--eld-gold)' }}>Named variant ▸ one extra weapon roll one rung up</div>}
            {fight.xp && (
              <div style={S.xpBox}>
                <div style={S.row}>
                  <span style={S.lbl}>Experience</span>
                  <span style={{ ...S.val, color: 'var(--eld-good)' }}>+{fight.xp.total} XP</span>
                </div>
                {fight.xp.per.map((p) => (
                  <div key={p.id} style={{ ...S.line, color: p.levelsGained ? 'var(--eld-gold)' : '#8fb2bf' }}>
                    {p.name} +{p.gain} XP{p.fallen ? ' (fallen · half)' : ''}
                    {p.levelsGained ? ` ▸ Level ${p.from} → ${p.to}!` : ` · ${p.xpAfter} / ${p.xpNeeded} to Lv ${p.to + 1}`}
                  </div>
                ))}
              </div>
            )}
            {rewards.gears.length ? (
              <div style={S.lootList}>
                {rewards.gears.map((g, i) => {
                  const up = upgradeFor(g, party);
                  return <ItemRow key={g.id || i} item={g} note={up ? `↑ upgrade for ${up}` : undefined} />;
                })}
              </div>
            ) : (
              <div style={{ ...S.line, color: 'var(--eld-muted)', fontStyle: 'italic' }}>No weapon this time — the Vein still yields dust.</div>
            )}
          </>
        ) : (
          <div style={{ ...S.line, color: 'var(--eld-danger)' }}>
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
  lootList: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 },
  wrap: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 16px 12px', textAlign: 'left', overflowY: 'auto' },
  head: { flexShrink: 0 },
  kick: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--eld-muted)', fontFamily: 'var(--eld-font-display)' },
  title: { fontSize: 'var(--mv-title, 26px)', fontWeight: 700, marginTop: 4, lineHeight: 1.1 },
  sub: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', marginTop: 4, fontStyle: 'italic' },
  panel: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  secLbl: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  table: { display: 'flex', flexDirection: 'column', gap: 4 },
  tHead: { display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eld-muted)', textAlign: 'right' },
  tRow: { display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', fontSize: 'var(--mv-text, 18px)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  fallen: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-danger)', fontWeight: 400 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  lbl: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  val: { fontSize: 'var(--mv-num, 24px)', fontWeight: 700 },
  gear: { border: '1px solid', borderLeftWidth: 3, padding: '10px 12px', borderRadius: 8 },
  xpBox: { display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' },
  gearMeta: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', marginTop: 4 },
  line: { fontSize: 'var(--mv-text, 18px)', lineHeight: 1.45 },
  btn: { marginTop: 'auto', padding: '14px 12px', width: '100%', minHeight: 'var(--mv-tap, 52px)', fontSize: 'var(--mv-text, 18px)' },
};
