import { useEffect, useMemo, useRef } from 'react';
import { ARCHETYPES } from '../data.js';
import { nodeTypeMeta } from '../theme/tokens.js';
import { INNATES, partyAuras } from '../combat/simulate.js';
import '../combat/fight.css';

/**
 * Combat v2 fight screen — playback of a pre-rolled event script (spec §5–§6).
 * Top ⅓: stage (enemies row + party row with HP bars, hit flashes, crit shake).
 * Middle: three party cards — HP + mana bars, innate button (dims on cooldown, flashes on
 * fire), group aura icons lit. Bottom: feed (~6 lines, newest at bottom). 1× / 2× / Skip.
 * Auto-resolves; the player never taps attacks. Tab bar stays visible (parent).
 */
const FLASH_MS = 320;
const FEED_TYPES = new Set(['crit', 'kill', 'innate', 'enrage', 'death', 'stun', 'victory', 'wipe']);
const ENEMY_GLYPH = { boss: '☠', rare: '◈', normal: '✦', crystal: '❖' };

export default function FightScreen({ world, node, party, fight, elapsedMs, speed, onSpeed, onSkip }) {
  const { events, result } = fight;
  const meta = nodeTypeMeta[node?.type] || nodeTypeMeta.normal;
  const auras = useMemo(() => partyAuras(party), [party]);
  const snaps = useMemo(() => events.filter((e) => e.type === 'snap'), [events]);
  const feedAll = useMemo(
    () => events.filter((e) => FEED_TYPES.has(e.type) || (e.type === 'heal' && !e.aura)),
    [events],
  );

  // latest snapshot at or before the playback clock
  const snap = useMemo(() => {
    let s = snaps[0];
    for (const x of snaps) { if (x.t <= elapsedMs) s = x; else break; }
    return s;
  }, [snaps, elapsedMs]);

  // events in the last FLASH_MS window drive the flashes
  const recent = useMemo(() => events.filter((e) => e.t > elapsedMs - FLASH_MS && e.t <= elapsedMs), [events, elapsedMs]);
  const hitTargets = new Set(recent.filter((e) => e.type === 'hit' || e.type === 'crit').map((e) => e.target));
  const critTargets = new Set(recent.filter((e) => e.type === 'crit').map((e) => e.target));
  const firedBy = new Set(recent.filter((e) => e.type === 'innate').map((e) => e.source));

  const feed = feedAll.filter((e) => e.t <= elapsedMs).slice(-40);
  const feedRef = useRef(null);
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feed.length]);

  const done = elapsedMs >= result.durationMs;
  const enemyLabel = node?.type === 'boss' ? world?.boss || 'Boss' : meta.label;

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Mind View · Combat</div>
        <div className="eld-brand-name" style={S.title}>{enemyLabel}</div>
        <div style={S.sub}>
          {world?.name} · {meta.label} · {done ? (result.win ? 'victory' : 'defeat') : `${(elapsedMs / 1000).toFixed(1)}s`}
          {!done && speed === 2 ? ' · 2×' : ''}
        </div>
      </div>

      {/* --- stage --- */}
      <div className="eld-aura-frame eld-panel" style={S.stage}>
        <div style={S.rowLbl}>Foes</div>
        <div style={S.enemyRow}>
          {fight.enemies.map((e, i) => {
            const es = snap?.enemies?.[i] || { hp: e.hp, alive: true };
            const cls = ['eld-fight-unit', hitTargets.has(e.id) && 'is-hit', critTargets.has(e.id) && 'is-crit', !es.alive && 'is-dead', es.stunnedUntil > elapsedMs && 'is-stunned'].filter(Boolean).join(' ');
            const color = e.isBoss ? '#e05d6f' : e.isRare ? '#e0a04d' : '#8aa0b5';
            return (
              <div key={e.id} className={cls} style={{ ...S.unit, borderColor: color }}>
                <div style={{ ...S.unitGlyph, color }}>{ENEMY_GLYPH[e.isBoss ? 'boss' : e.isRare ? 'rare' : node?.type === 'crystal' ? 'crystal' : 'normal']}</div>
                <div style={S.unitName}>{e.name}</div>
                <Bar value={es.hp / e.maxHp} color={color} />
                {es.enraged && <div style={S.enrageTag}>ENRAGED</div>}
              </div>
            );
          })}
        </div>
        <div style={S.rowLbl}>Party</div>
        <div style={S.partyRow}>
          {party.map((m, i) => {
            const ps = snap?.party?.[i] || { hp: 1, alive: true };
            const a = ARCHETYPES[m.archetype] || {};
            const maxHp = fight.derived[i].maxHp;
            const id = `p${i}`;
            const cls = ['eld-fight-unit', hitTargets.has(id) && 'is-hit', critTargets.has(id) && 'is-crit', !ps.alive && 'is-dead'].filter(Boolean).join(' ');
            return (
              <div key={id} className={cls} style={{ ...S.unit, borderColor: a.color || '#5fc7e0' }}>
                <div style={{ ...S.unitGlyph, color: a.color }}>{INNATES[m.archetype]?.glyph || '♟'}</div>
                <div style={S.unitName}>{m.name}</div>
                <Bar value={ps.hp / maxHp} color={hpColor(ps.hp / maxHp)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* --- speed --- */}
      <div style={S.speedRow}>
        <button type="button" className={`eld-btn eld-btn-ghost eld-speed-btn${speed === 1 ? ' is-active' : ''}`} onClick={() => onSpeed(1)} disabled={done}>1×</button>
        <button type="button" className={`eld-btn eld-btn-ghost eld-speed-btn${speed === 2 ? ' is-active' : ''}`} onClick={() => onSpeed(2)} disabled={done}>2×</button>
        <button type="button" className="eld-btn eld-speed-btn" onClick={onSkip}>Skip ▸</button>
      </div>

      {/* --- party cards --- */}
      <div style={S.cards}>
        {party.map((m, i) => {
          const ps = snap?.party?.[i] || { hp: 1, mana: 1, cdReady: 0, stacks: 0, alive: true };
          const a = ARCHETYPES[m.archetype] || {};
          const d = fight.derived[i];
          const inn = INNATES[m.archetype];
          const id = `p${i}`;
          const onCd = inn && !inn.passive && ps.cdReady > elapsedMs;
          const cdFrac = onCd ? Math.max(0, Math.min(1, 1 - (ps.cdReady - elapsedMs) / inn.cd)) : 1;
          const fired = firedBy.has(id);
          return (
            <div key={id} className="eld-card" style={{ ...S.card, borderLeftColor: a.color || '#5fc7e0', opacity: ps.alive ? 1 : 0.45 }}>
              <div style={S.cardTop}>
                <span style={{ ...S.cardName, color: a.color }}>{m.name}</span>
                <span style={S.cardMeta}>{m.archetype}</span>
              </div>
              <Bar value={ps.hp / d.maxHp} color={hpColor(ps.hp / d.maxHp)} label={`${Math.round(ps.hp)}/${Math.round(d.maxHp)}`} />
              <Bar value={ps.mana / d.maxMana} color="#5fc7e0" label={`${Math.round(ps.mana)}/${Math.round(d.maxMana)} mana`} thin />
              {inn && (
                <div className={`eld-innate-btn${onCd ? ' is-cooldown' : ''}${fired ? ' is-fired' : ''}`} role="img" aria-label={`${inn.name} ${onCd ? 'cooling down' : 'ready'}`}>
                  <span>{inn.glyph}</span>
                  <span>{inn.name}</span>
                  {inn.passive && ps.stacks > 0 && <span style={S.stacks}>×{ps.stacks}</span>}
                  {onCd && <div className="eld-innate-cd" style={{ width: `${cdFrac * 100}%` }} />}
                </div>
              )}
              <div style={S.auraRow}>
                {auras.map((au) => (
                  <span key={au.id} className={`eld-aura-icon${au.id === inn?.aura.id ? ' is-lit' : ''}`} title={`${au.name}: ${au.text}`}>{au.glyph}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- feed --- */}
      <div className="eld-panel" style={S.feedBox} ref={feedRef}>
        {feed.length === 0 && <div className="eld-feed-line">The bond tightens. Blades find rhythm…</div>}
        {feed.map((e, i) => (
          <div key={`${e.t}-${i}`} className={`eld-feed-line ${feedClass(e)}`}>{feedText(e)}</div>
        ))}
      </div>
    </div>
  );
}

function Bar({ value, color, label, thin }) {
  const pct = Math.max(0, Math.min(1, value || 0)) * 100;
  return (
    <div style={{ ...S.barWrap, marginTop: thin ? 3 : 5 }}>
      <div style={{ ...S.barTrack, height: thin ? 5 : 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 120ms linear' }} />
      </div>
      {label && <div style={S.barLbl}>{label}</div>}
    </div>
  );
}

function hpColor(f) {
  return f > 0.5 ? '#7fd6a0' : f > 0.25 ? '#e0a04d' : '#e05d6f';
}

function feedClass(e) {
  if (e.type === 'crit') return e.enemy ? 'is-bad' : 'is-crit';
  if (e.type === 'innate') return 'is-innate';
  if (e.type === 'heal') return 'is-heal';
  if (e.type === 'kill') return 'is-kill';
  if (e.type === 'death') return 'is-bad';
  if (e.type === 'enrage') return 'is-enrage';
  if (e.type === 'stun') return 'is-innate';
  if (e.type === 'victory' || e.type === 'wipe') return 'is-end';
  return '';
}

function feedText(e) {
  switch (e.type) {
    case 'crit': return e.enemy ? `${e.sourceName} ENRAGED hit ▸ ${e.targetName} for ${e.amount}` : `${e.sourceName} crits ${e.targetName} for ${e.amount}`;
    case 'kill': return `${e.sourceName} fells ${e.targetName}`;
    case 'innate': return e.text || `${e.name} ▸ ${e.sourceName}`;
    case 'heal': return `${e.source === 'Renewal' ? 'Renewal' : 'Mend'} ▸ ${e.targetName} +${e.amount}`;
    case 'enrage': return `${e.sourceName} enrages — next hit doubles`;
    case 'death': return `${e.targetName} falls`;
    case 'stun': return `${e.targetName} stunned ${(e.amount / 1000).toFixed(0)}s`;
    case 'victory': return 'Victory — the manifestations scatter.';
    case 'wipe': return 'The bond breaks. The Vein pulls them home.';
    default: return '';
  }
}

const S = {
  wrap: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px 8px', textAlign: 'left', overflow: 'hidden' },
  head: { flexShrink: 0 },
  kick: { fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5f8494', fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)' },
  title: { fontSize: 15, fontWeight: 700, marginTop: 2, color: '#e6f2f7' },
  sub: { fontSize: 11, color: '#5f8494', marginTop: 2, fontStyle: 'italic' },
  stage: { padding: '8px 10px', flexShrink: 0, background: 'radial-gradient(circle at 50% 40%, #0e2430 0%, #060d11 80%)' },
  rowLbl: { fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5f8494', margin: '2px 0 4px' },
  enemyRow: { display: 'flex', gap: 6, marginBottom: 6 },
  partyRow: { display: 'flex', gap: 6 },
  unit: { flex: 1, minWidth: 0, border: '1px solid', borderRadius: 8, padding: '5px 6px', background: 'rgba(0,0,0,0.3)' },
  unitGlyph: { fontSize: 16, lineHeight: 1, textAlign: 'center' },
  unitName: { fontSize: 9, color: '#cfe0e8', textAlign: 'center', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  enrageTag: { fontSize: 7, letterSpacing: '0.12em', color: '#ff7a6e', textAlign: 'center', marginTop: 2 },
  speedRow: { display: 'flex', gap: 6, flexShrink: 0 },
  cards: { display: 'flex', gap: 6, flexShrink: 0 },
  card: { flex: 1, minWidth: 0, padding: '6px 7px', borderLeft: '3px solid' },
  cardTop: { display: 'flex', flexDirection: 'column' },
  cardName: { fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardMeta: { fontSize: 8, color: '#5f8494' },
  stacks: { fontSize: 10, color: '#e0a04d' },
  auraRow: { display: 'flex', gap: 4, marginTop: 6 },
  barWrap: {},
  barTrack: { background: '#08141a', borderRadius: 4, overflow: 'hidden', border: '1px solid #16303a' },
  barLbl: { fontSize: 8, color: '#5f8494', marginTop: 1, fontVariantNumeric: 'tabular-nums' },
  feedBox: { padding: '8px 10px', flex: '1 1 90px', minHeight: 84, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 },
};
