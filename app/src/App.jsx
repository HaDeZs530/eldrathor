import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './theme/ThemeProvider.jsx';
import { frame, colors } from './theme/tokens.js';
import { genTerritory, revealNeighbors } from './map/genTerritory.js';
import TerritoryMap from './map/TerritoryMap.jsx';
import { ARCHETYPES, DEFAULT_PARTY } from './data.js';
import { resolveFight, rollLoot } from './combat.js';
import { Header, Harbor, PartyEditor } from './components/HarborViews.jsx';

// Dual-mode vertical slice: WORLD harbor/party · MIND TerritoryMap expedition (§8c).

export default function Eldrathor() {
  const { enterMindView, exitMindView, currentMode } = useTheme();
  const [screen, setScreen] = useState('harbor');
  const [party, setParty] = useState(DEFAULT_PARTY);
  const [worldvein, setWorldvein] = useState(0);
  const [stash, setStash] = useState([]);
  const [world, setWorld] = useState(null);
  const [territory, setTerritory] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [partyHP, setPartyHP] = useState(1);
  const [runVein, setRunVein] = useState(0);
  const [unlocked, setUnlocked] = useState(1);
  const [flash, setFlash] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function pushLog(t, k = 'n') { setLog((l) => [...l, { t, k }]); }
  function doFlash(msg, color) {
    setFlash({ msg, color });
    setTimeout(() => setFlash(null), 1400);
  }

  function enterWorld(w) {
    const t = genTerritory(w);
    t.nodes.forEach((n) => { n.tier = w.tier; });
    setWorld(w); setTerritory(t); setCurrentId(t.entranceId);
    setLog([{ t: `You reach through the Vein… ${w.name} unfolds in mind-view.`, k: 'sys' }]);
    setPartyHP(1); setRunVein(0); setScreen('map');
    enterMindView();
  }

  function visitNode(n, opts = {}) {
    if (busy) return;
    if (opts.repositionOnly) {
      setCurrentId(n.id);
      pushLog('Repositioned to a cleared node.', 'sys');
      return;
    }
    setBusy(true);
    setTerritory((prev) => ({
      ...prev,
      nodes: prev.nodes.map((x) => (x.id === n.id ? { ...x, typeKnown: true } : x)),
    }));
    const label = n.type === 'boss' ? 'Boss' : n.type === 'rare' ? 'Rare' : n.type === 'crystal' ? 'Vein Crystal' : 'Skirmish';
    pushLog(`→ Entering a ${label} node…`, 'sys');

    setTimeout(() => {
      const fightNode = { ...n, tier: world.tier };
      const res = resolveFight(party, fightNode);
      if (!res.win) {
        pushLog(`The party falls at the ${label}. (survived ${res.duration}s)`, 'bad');
        doFlash('Party defeated — returned to Veinharbor', colors.mindDanger);
        setTimeout(() => {
          setWorldvein((v) => v + runVein);
          exitMindView(); setScreen('harbor'); setBusy(false);
          setTerritory(null); setWorld(null); setCurrentId(null); setRunVein(0);
        }, 1200);
        return;
      }

      setTerritory((prev) => revealNeighbors(prev, n.id));
      setCurrentId(n.id);
      setPartyHP(res.hpPct);
      const loot = rollLoot(fightNode);
      setRunVein((v) => v + loot.worldvein);
      pushLog(
        `✔ Cleared in ${res.duration}s. +${loot.worldvein} Worldvein.${n.type === 'crystal' ? ' The crystal splinters — rich harvest.' : ''}`,
        'good',
      );
      if (loot.gear) {
        setStash((s) => [...s, loot.gear]);
        pushLog(`  ⬥ Loot: ${loot.gear.name} (${loot.gear.rating}/100)`, 'loot');
      }
      if (loot.healCrystal) {
        setPartyHP((h) => Math.min(1, h + 0.3));
        pushLog('  ✚ A healing crystal restores the party.', 'heal');
      }
      if (n.type === 'boss') {
        pushLog(`${world.boss} is defeated. The way upward opens.`, 'boss');
        doFlash(`${world.name} cleared!`, world.accent);
        setUnlocked((u) => Math.max(u, world.id + 1));
        setTimeout(() => {
          setWorldvein((v) => v + runVein + loot.worldvein);
          exitMindView(); setScreen('harbor'); setBusy(false);
          setTerritory(null); setWorld(null); setCurrentId(null); setRunVein(0);
        }, 1500);
        return;
      }
      // DESIGN-OPEN: tick respawns / roaming rares after clear
      setBusy(false);
    }, 700);
  }

  function extract() {
    doFlash(`Extracted ${runVein} Worldvein`, colors.mythros);
    setWorldvein((v) => v + runVein);
    setTimeout(() => {
      exitMindView(); setScreen('harbor');
      setTerritory(null); setWorld(null); setCurrentId(null); setRunVein(0);
    }, 600);
  }

  return (
    <div style={S.root}>
      <style>{BASE_CSS}</style>
      <div className="eld-frame" style={S.frame}>
        <Header worldvein={worldvein} mode={currentMode} colors={colors} />
        {flash && (
          <div style={{ ...S.flash, borderColor: flash.color, color: flash.color }}>{flash.msg}</div>
        )}
        {screen === 'harbor' && (
          <Harbor party={party} unlocked={unlocked} enterWorld={enterWorld} stash={stash} setScreen={setScreen} />
        )}
        {screen === 'party' && (
          <PartyEditor party={party} setParty={setParty} back={() => setScreen('harbor')} />
        )}
        {screen === 'map' && world && territory && (
          <TerritoryMap
            world={world} territory={territory} currentId={currentId} busy={busy}
            partyHP={partyHP} runVein={runVein} party={party} archetypes={ARCHETYPES}
            log={log} logRef={logRef} onVisit={visitNode} onExtract={extract}
          />
        )}
      </div>
    </div>
  );
}

const S = {
  root: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12px 0', background: '#05080a', boxSizing: 'border-box' },
  frame: { width: frame.width, height: frame.height, maxWidth: '100%', maxHeight: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 12, color: 'var(--eld-text, #cfe0e8)', fontFamily: 'var(--eld-font-body, system-ui, sans-serif)', position: 'relative' },
  flash: { textAlign: 'center', padding: '8px', margin: '8px 12px 0', border: '1px solid', borderRadius: 8, fontSize: 12, letterSpacing: '0.06em', background: 'rgba(0,0,0,0.35)', animation: 'fadein 0.3s ease', flexShrink: 0 },
};

const BASE_CSS = `
  @keyframes fadein { from { opacity: 0; transform: translateY(-6px);} to {opacity:1; transform:none;} }
  * { box-sizing: border-box; }
  button { font: inherit; }
  button:focus-visible { outline: 2px solid #5fc7e0; outline-offset: 2px; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1c3a44; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;
