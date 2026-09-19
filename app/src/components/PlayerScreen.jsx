import { useEffect, useMemo, useState } from 'react';
import { resonanceStatus, MAX_RANK, rankNumeral } from '../player/resonance.js';
import { BOND_IDS, CRAFT_IDS, PLAYER_TUNING, canBuy, levelOf, levelCap, effectText } from '../player/upgrades.js';
import { useTestNumbers } from '../debug/useTestNumbers.js';
import './player.css';

/**
 * Player tab — the Veinbinder (Mind View). docs/Eldrathor_Growth_Model_Lock.md §2.
 * Top: Resonance (Σ √level over the whole roster), the rank it sets, and the bar to the next rank with
 * its threshold. Below: the Bond and Craft upgrade rows — `Might  lvl 3/4  +6% Power · Buy 98 ❖` — bought
 * with Worldvein level by level and CAPPED at the rank. Buy is disabled with its reason. Ranking up
 * lights every row's next level with a brief glow.
 */
const SEEN_RANK_KEY = 'eld.player.seenRank';
const GLOW_MS = 1800;
const readSeen = () => { try { return Number(window.localStorage.getItem(SEEN_RANK_KEY)) || 0; } catch { return 0; } };
const writeSeen = (r) => { try { window.localStorage.setItem(SEEN_RANK_KEY, String(r)); } catch { /* private mode */ } };

export default function PlayerScreen({ worldvein = 0, party = [], roster = [], upgrades = {}, onBuy }) {
  const members = useMemo(() => [...party, ...roster], [party, roster]);
  const st = useMemo(() => resonanceStatus(members), [members]);
  const testNumbers = useTestNumbers();
  // a rank gained since the tab was last seen: every row's next level glows briefly
  const [glow, setGlow] = useState(() => { const seen = readSeen(); return seen > 0 && st.rank > seen; });
  useEffect(() => {
    writeSeen(st.rank);
    if (!glow) return undefined;
    const id = window.setTimeout(() => setGlow(false), GLOW_MS);
    return () => window.clearTimeout(id);
  }, [st.rank, glow]);

  const row = (id) => {
    const def = PLAYER_TUNING.bond[id] || PLAYER_TUNING.craft[id];
    const level = levelOf(upgrades, id);
    const cap = levelCap(id, st.rank);
    const check = canBuy(upgrades, id, { rank: st.rank, worldvein });
    const opened = glow && level < cap;
    return (
      <div key={id} className={`eld-card eld-up-row${opened ? ' is-opened' : ''}`} data-upgrade={id}>
        <div className="eld-up-main">
          <span className="eld-up-name">{def.name}</span>
          <span className="eld-up-level">lvl {level}/{cap}</span>
          <span className="eld-up-effect">{level > 0 ? effectText(id, level) : `next: ${effectText(id, id === 'hearth' ? PLAYER_TUNING.craft.hearth.slotsAt[0] : 1)}`}</span>
        </div>
        <button type="button" className="eld-btn eld-up-buy" disabled={!check.ok} onClick={() => onBuy?.(id)} aria-label={`Buy ${def.name} level ${level + 1}`}>
          {check.ok ? `Buy ${check.cost} ❖` : check.reason}
        </button>
      </div>
    );
  };

  return (
    <div className="eld-player">
      <div className="eld-player-kick">Mind View · Veinbinder</div>
      <div className="eld-display eld-screen-title eld-player-title">You</div>
      <div className="eld-player-sub">The conduit. Your roster's breadth is your reach.</div>

      <div className={`eld-panel eld-res${glow ? ' is-ranked-up' : ''}`} aria-label={`Resonance ${st.value.toFixed(1)}, rank ${st.numeral}`}>
        <div className="eld-res-top">
          <div>
            <div className="eld-res-k">Resonance</div>
            <div className="eld-res-v">{st.value.toFixed(1)}</div>
          </div>
          <div className="eld-res-rank">
            <div className="eld-res-k">Rank</div>
            <div className="eld-res-numeral">{st.numeral}</div>
          </div>
        </div>
        <div className="eld-res-bar" role="progressbar" aria-valuemin={st.at} aria-valuemax={st.next ?? st.at} aria-valuenow={Number(st.value.toFixed(1))}>
          <div className="eld-res-fill" style={{ width: `${Math.round(st.progress * 100)}%` }} />
        </div>
        <div className="eld-res-next">
          {st.next == null
            ? `Rank ${rankNumeral(MAX_RANK)} — the highest`
            : <>Rank {rankNumeral(st.rank + 1)} at <strong>{st.next}</strong> · {st.toNext.toFixed(1)} to go</>}
        </div>
        <div className="eld-res-note">Σ √level over all {members.length} Adventurers, fielded or benched. Your rank caps every upgrade below at level {st.rank}.</div>
        {testNumbers && (
          <div className="eld-test-numbers" aria-label="Resonance sources (test numbers)">
            {members.map((m) => `${m.name} √${m.level || 1} = ${Math.sqrt(Math.max(1, m.level || 1)).toFixed(2)}`).join(' · ')}
          </div>
        )}
      </div>

      <div className="eld-player-vein"><span>Banked Worldvein</span><strong>{worldvein.toLocaleString()} ❖</strong></div>

      <div className="eld-player-sec">Bond</div>
      <div className="eld-player-note">Party-wide — every Adventurer carries these.</div>
      <div className="eld-up-list">{BOND_IDS.map(row)}</div>

      <div className="eld-player-sec">Craft</div>
      <div className="eld-player-note">The economy — gathering, Worldvein, loot, Process time, Hearth job slots.</div>
      <div className="eld-up-list">{CRAFT_IDS.map(row)}</div>
    </div>
  );
}
