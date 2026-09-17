import { useEffect, useMemo, useRef } from 'react';
import { ARCHETYPES } from '../data.js';
import { nodeTypeMeta } from '../theme/tokens.js';
import { INNATES, partyAuras } from '../combat/simulate.js';
import { MODES } from '../theme/styleBible.js';
import { enemySlug, slug } from '../art/manifest.js';
import Art from '../art/Art.jsx';
import { useArtStatuses } from '../art/useArt.js';
import PendingArt from '../art/PendingArt.jsx';
import { useTestNumbers } from '../debug/useTestNumbers.js';
import { rawToMitigated } from '../debug/testNumbers.js';
import { Bar, PartyCard } from './ui/index.jsx';
import '../combat/fight.css';

/**
 * Combat v2 fight screen — playback of a pre-rolled event script (spec §5–§6) on the Style Bible's
 * Mind View: the stage is the `enemy-<slug>` backdrop with the enemy HP bar overlaid at its top
 * (§A), then three party cards (portrait 64 px in a gold frame, name Cinzel 15, HP/MP 14 px bars, two
 * innate/aura icons), then 1× / 2× / Skip, then the feed. Auto-resolves; the player never taps attacks.
 */
const FLASH_MS = 320;
const FEED_TYPES = new Set(['crit', 'kill', 'innate', 'enrage', 'death', 'stun', 'victory', 'wipe']);
const ENEMY_GLYPH = { boss: '☠', rare: '◈', normal: '✦', crystal: '❖' };
const M = MODES.mind;

export default function FightScreen({ area, node, party, fight, elapsedMs, speed, onSpeed, onSkip }) {
  const { events, result } = fight;
  const meta = nodeTypeMeta[node?.type] || nodeTypeMeta.normal;
  const auras = useMemo(() => partyAuras(party), [party]);
  const snaps = useMemo(() => events.filter((e) => e.type === 'snap'), [events]);
  const testNumbers = useTestNumbers();
  // brief §4: every ENEMY hit on a party member is a feed line (party hits stay crit-only to keep the feed short)
  const feedAll = useMemo(
    () => events.filter((e) => FEED_TYPES.has(e.type) || (e.type === 'heal' && !e.aura) || (e.type === 'hit' && e.enemy)),
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
  const lastT = feed.length ? feed[feed.length - 1].t : -1; // bug-fix pass 1 §6: length stalls at the 40-line cap
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feed.length, lastT]);

  const done = elapsedMs >= result.durationMs;
  const enemyLabel = node?.type === 'boss' ? area?.boss || 'Boss' : fight.named ? 'Named foe' : meta.label;
  // stage backdrop: the boss's own scene, else the lead enemy's type scene
  const lead = fight.enemies[0];
  const stageArt = `enemy-${node?.type === 'boss' ? slug(area?.boss || lead?.name) : enemySlug(lead?.name)}`;
  const stageHit = fight.enemies.some((e) => hitTargets.has(e.id));
  // §C: every missing asset on this screen is listed as a chip
  const artNames = useMemo(() => [stageArt, ...party.flatMap((m) => { const inn = INNATES[m.archetype]; return [`portrait-${slug(m.archetype)}-1`, ...(inn ? [`icon-innate-${slug(inn.name)}`, `icon-aura-${slug(inn.aura.id)}`] : [])]; })], [stageArt, party]);
  const artStatus = useArtStatuses(artNames);
  const pendingArt = artNames.filter((n) => artStatus[n] === 'pending');

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div className="eld-kicker">Mind View · Combat</div>
        <div style={S.sub}>
          {area?.name} · {meta.label}{fight.ambush ? ' · ambush' : ''} · {done ? (result.win ? 'victory' : 'defeat') : `${(elapsedMs / 1000).toFixed(1)}s`}
          {!done && speed === 2 ? ' · 2×' : ''}
        </div>
      </div>

      {/* --- stage: enemy backdrop with the enemy HP bars overlaid at the top --- */}
      <div className={`eld-fight-stage eld-panel${stageHit ? ' is-hit' : ''}`}>
        <Art name={stageArt} className="eld-fight-stage-art" alt="" position="50% 40%" quiet />
        <div className="eld-fight-stage-scrim" />
        <div className="eld-fight-stage-top">
          <div className="eld-fight-stage-title" title={enemyLabel}>{enemyLabel}</div>
          <div className="eld-fight-stage-enemies" style={{ '--foes': fight.enemies.length }}>
          {fight.enemies.map((e, i) => {
            const es = snap?.enemies?.[i] || { hp: e.hp, alive: true };
            const cls = ['eld-fight-unit', 'eld-fight-enemy', hitTargets.has(e.id) && 'is-hit', critTargets.has(e.id) && 'is-crit', !es.alive && 'is-dead', es.stunnedUntil > elapsedMs && 'is-stunned'].filter(Boolean).join(' ');
            const color = e.isBoss ? M.damage : e.isRare ? M.crit : '#8aa0b5';
            return (
              <div key={e.id} className={cls}>
                <div className="eld-fight-enemy-row">
                  <span className="eld-fight-enemy-glyph" style={{ color }} aria-hidden="true">{ENEMY_GLYPH[e.isBoss ? 'boss' : e.isRare ? 'rare' : node?.type === 'crystal' ? 'crystal' : 'normal']}</span>
                  <span className="eld-fight-enemy-name">{e.name}</span>
                  {es.enraged && <span className="eld-fight-enrage">ENRAGED</span>}
                </div>
                <Bar value={es.hp / e.maxHp} color={M.damage} label={`${Math.max(0, Math.round(es.hp))} / ${Math.round(e.maxHp)}`} />
              </div>
            );
          })}
          </div>
        </div>
        <PendingArt names={pendingArt} style={{ position: 'absolute', right: 8, bottom: 8 }} />
      </div>

      {/* --- party cards (§A): 3 across, ≥ 120 px, portrait, Cinzel 15 name, 14 px HP/MP, two 28 px icons --- */}
      <div className="eld-party-cards">
        {party.map((m, i) => {
          const ps = snap?.party?.[i] || { hp: 1, mana: 1, cdReady: 0, stacks: 0, alive: true };
          const a = ARCHETYPES[m.archetype] || {};
          const d = fight.derived[i];
          const inn = INNATES[m.archetype];
          const id = `p${i}`;
          const onCd = inn && !inn.passive && ps.cdReady > elapsedMs;
          const fired = firedBy.has(id);
          const cls = ['eld-fight-unit', hitTargets.has(id) && 'is-hit', critTargets.has(id) && 'is-crit'].filter(Boolean).join(' ');
          const icons = inn ? [
            { key: 'innate', art: `icon-innate-${slug(inn.name)}`, glyph: inn.glyph, title: `${inn.name}${inn.passive && ps.stacks > 0 ? ` ×${ps.stacks}` : ''} ${onCd ? '(cooling down)' : '(ready)'}`, lit: fired, dim: onCd },
            { key: 'aura', art: `icon-aura-${slug(inn.aura.id)}`, glyph: inn.aura.glyph, title: `${inn.aura.name}: ${inn.aura.text}`, lit: auras.some((au) => au.id === inn.aura.id) && fired },
          ] : [];
          return (
            <PartyCard
              key={id}
              className={cls}
              name={m.name}
              accent={a.color}
              portraitArt={`portrait-${slug(m.archetype)}-1`}
              hp={ps.hp} hpMax={d.maxHp} hpColor={hpColor(ps.hp / d.maxHp)}
              mp={ps.mana} mpMax={d.maxMana} mpColor={M.mp}
              icons={icons}
              dead={!ps.alive}
            />
          );
        })}
      </div>

      {/* --- speed --- */}
      <div style={S.speedRow}>
        <button type="button" className={`eld-btn eld-btn-ghost eld-speed-btn${speed === 1 ? ' is-active' : ''}`} onClick={() => onSpeed(1)} disabled={done}>1×</button>
        <button type="button" className={`eld-btn eld-btn-ghost eld-speed-btn${speed === 2 ? ' is-active' : ''}`} onClick={() => onSpeed(2)} disabled={done}>2×</button>
        <button type="button" className="eld-btn eld-btn-ghost eld-speed-btn" onClick={onSkip}>Skip ▸</button>
      </div>

      {/* --- feed --- */}
      <div className="eld-panel" style={S.feedBox} ref={feedRef}>
        {feed.length === 0 && <div className="eld-feed-line">The bond tightens. Blades find rhythm…</div>}
        {feed.map((e, i) => (
          <div key={`${e.t}-${i}`} className={`eld-feed-line ${feedClass(e)}`}>{feedText(e)}{testNumbers && (e.type === 'hit' || e.type === 'crit') ? rawToMitigated(e) : ''}</div>
        ))}
      </div>
    </div>
  );
}

function hpColor(f) {
  return f > 0.5 ? M.hp : f > 0.25 ? M.crit : M.damage;
}

function feedClass(e) {
  if (e.type === 'hit') return e.enemy ? 'is-taken' : '';
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
    case 'hit': return e.enemy ? `${e.sourceName} hits ${e.targetName} for ${e.amount}` : `${e.sourceName} hits ${e.targetName} for ${e.amount}`;
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
  sub: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', marginTop: 2, fontStyle: 'italic' },
  speedRow: { display: 'flex', gap: 6, flexShrink: 0 },
  feedBox: { padding: '8px 10px', flex: '1 1 96px', minHeight: 84, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, fontSize: 'var(--mv-feed, 17px)', lineHeight: 'var(--mv-feed-lh, 1.45)' },
};
