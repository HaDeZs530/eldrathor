import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from './theme/ThemeProvider.jsx';
import { frame, colors, nodeTypeMeta } from './theme/tokens.js';
import { genTerritory, revealNeighbors } from './map/genTerritory.js';
import TerritoryMap from './map/TerritoryMap.jsx';
import { ARCHETYPES, DEFAULT_PARTY } from './data.js';
import { resolveFight, rollLoot } from './combat.js';
import { Header, Harbor, PlaceholderPanel } from './components/HarborViews.jsx';
import PlayerScreen from './components/PlayerScreen.jsx';
import PartyScreen from './components/PartyScreen.jsx';
import TabBar from './components/TabBar.jsx';
import IslandWorldMap from './components/IslandWorldMap.jsx';
import DifficultyScreen from './components/DifficultyScreen.jsx';
import FightScreen from './components/FightScreen.jsx';
import LootResults from './components/LootResults.jsx';

// Run stage machine (persisted across tab switches):
// island | difficulty | expedition | fight | loot
// TabBar ALWAYS visible — including during expedition & fight (LOCKED Anthony 2026-09-10).

const HUB_LABELS = {
  player: 'Veinbinder',
  party: 'Party',
  mountain: 'The Mountain',
  town: 'Veinharbor',
  market: 'Market',
};

const MIND_STAGES = new Set(['expedition', 'fight', 'loot']);
const FIGHT_RESOLVE_MS = 2200;

export default function Eldrathor() {
  const { enterMindView, exitMindView, currentMode, setHubSkinForTab } = useTheme();
  const [tab, setTab] = useState('mountain');

  // --- Run stage machine (NOT cleared when leaving Mountain) ---
  const [runStage, setRunStage] = useState('island');
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [difficulty, setDifficulty] = useState('normal'); // DESIGN-OPEN
  const [party, setParty] = useState(DEFAULT_PARTY);
  const [roster, setRoster] = useState([]); // extra characters beyond the bonded 3
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

  // Fight stage state (persists if user tabs away mid-fight)
  const [fightNode, setFightNode] = useState(null);
  const [fightPhase, setFightPhase] = useState('resolving'); // resolving | done
  const [fightResult, setFightResult] = useState(null);
  const [fightElapsed, setFightElapsed] = useState(0);
  const [pendingLoot, setPendingLoot] = useState(null);
  const fightTimers = useRef({ tick: null, done: null, startedAt: 0, result: null, loot: null });

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Hub skin follows active tab. Mind-view only while Mountain is showing a mind stage.
  // Run state is NEVER cleared by tab switches — fight timers keep running off-tab.
  useEffect(() => {
    setHubSkinForTab(tab);
    const wantMind = tab === 'mountain' && MIND_STAGES.has(runStage);
    if (wantMind) enterMindView();
    else exitMindView();
  }, [tab, runStage, setHubSkinForTab, enterMindView, exitMindView]);

  function selectTab(id) {
    // Never block tab switches — TabBar stays usable mid-run / mid-fight.
    setTab(id);
    setHubSkinForTab(id);
  }

  function pushLog(t, k = 'n') { setLog((l) => [...l, { t, k }]); }
  function doFlash(msg, color) {
    setFlash({ msg, color });
    setTimeout(() => setFlash(null), 1400);
  }

  function clearFightTimers() {
    const ft = fightTimers.current;
    if (ft.tick) window.clearInterval(ft.tick);
    if (ft.done) window.clearTimeout(ft.done);
    fightTimers.current = { tick: null, done: null, startedAt: 0, result: null, loot: null };
  }

  function resetRunToIsland() {
    clearFightTimers();
    exitMindView();
    setRunStage('island');
    setSelectedWorld(null);
    setDifficulty('normal');
    setTerritory(null);
    setWorld(null);
    setCurrentId(null);
    setRunVein(0);
    setFightNode(null);
    setFightPhase('resolving');
    setFightResult(null);
    setFightElapsed(0);
    setPendingLoot(null);
    setBusy(false);
  }

  function onSelectWorld(w) {
    setSelectedWorld(w);
    setRunStage('difficulty');
  }

  function onDifficultyBack() {
    setSelectedWorld(null);
    setRunStage('island');
  }

  function onDifficultyConfirm(diff) {
    // DESIGN-OPEN: difficulty modifiers not applied yet — Normal only.
    setDifficulty(diff);
    const w = selectedWorld;
    if (!w) return;
    const t = genTerritory(w);
    t.nodes.forEach((n) => { n.tier = w.tier; });
    setWorld(w);
    setTerritory(t);
    setCurrentId(t.entranceId);
    setLog([{ t: `You reach through the Vein… ${w.name} unfolds in mind-view.`, k: 'sys' }]);
    setPartyHP(1);
    setRunVein(0);
    setRunStage('expedition');
    enterMindView(); // crossfade into Mind-view / mana theme
  }

  const finishFightToLoot = useCallback(() => {
    const ft = fightTimers.current;
    const res = ft.result;
    const loot = ft.loot;
    if (!res) return;
    setFightPhase('done');
    setFightResult({
      ...res,
      feed: buildFightFeed(res, loot, fightTimers.current.nodeLabel),
    });
    setPendingLoot(loot);
    setRunStage('loot');
    setBusy(false);
  }, []);

  function startFight(n) {
    if (busy) return;
    clearFightTimers();
    setBusy(true);
    setTerritory((prev) => ({
      ...prev,
      nodes: prev.nodes.map((x) => (x.id === n.id ? { ...x, typeKnown: true } : x)),
    }));
    const label = n.type === 'boss' ? 'Boss' : n.type === 'rare' ? 'Rare' : n.type === 'crystal' ? 'Vein Crystal' : 'Skirmish';
    pushLog(`→ Entering a ${label} node…`, 'sys');

    const fightNodeFull = { ...n, tier: world.tier };
    const res = resolveFight(party, fightNodeFull);
    const loot = rollLoot(fightNodeFull);

    setFightNode(fightNodeFull);
    setFightPhase('resolving');
    setFightResult({
      win: res.win,
      hpPct: res.hpPct,
      duration: res.duration,
      feed: [{ t: 'The bond tightens. Blades find rhythm…', color: '#5f8494' }],
    });
    setFightElapsed(0);
    setPendingLoot(null);
    setRunStage('fight');
    enterMindView();

    const startedAt = Date.now();
    fightTimers.current.startedAt = startedAt;
    fightTimers.current.result = res;
    fightTimers.current.loot = loot;
    fightTimers.current.nodeLabel = label;

    fightTimers.current.tick = window.setInterval(() => {
      setFightElapsed(Date.now() - startedAt);
    }, 100);

    // Visible fight stage; resolve after resolveMs (timers survive tab switches).
    fightTimers.current.done = window.setTimeout(() => {
      if (fightTimers.current.tick) window.clearInterval(fightTimers.current.tick);
      fightTimers.current.tick = null;
      setFightElapsed(FIGHT_RESOLVE_MS);
      finishFightToLoot();
    }, FIGHT_RESOLVE_MS);
  }

  function visitNode(n, opts = {}) {
    if (busy) return;
    if (opts.repositionOnly) {
      setCurrentId(n.id);
      pushLog('Repositioned to a cleared node.', 'sys');
      return;
    }
    startFight(n);
  }

  function applyLootAndReturnToExpedition() {
    const res = fightResult;
    const loot = pendingLoot;
    const n = fightNode;
    if (!res || !n) {
      setRunStage('expedition');
      return;
    }

    if (!res.win) {
      doFlash('Party defeated — returned to Veinharbor', colors.mindDanger);
      setWorldvein((v) => v + runVein);
      resetRunToIsland();
      setTab('town');
      setHubSkinForTab('town');
      return;
    }

    setTerritory((prev) => revealNeighbors(prev, n.id));
    setCurrentId(n.id);
    setPartyHP(res.hpPct);
    setRunVein((v) => v + (loot?.worldvein || 0));
    pushLog(
      `✔ Cleared in ${res.duration}s. +${loot?.worldvein || 0} Worldvein.${n.type === 'crystal' ? ' The crystal splinters — rich harvest.' : ''}`,
      'good',
    );
    if (loot?.gear) {
      setStash((s) => [...s, loot.gear]);
      pushLog(`  ⬥ Loot: ${loot.gear.name} (${loot.gear.rating}/100)`, 'loot');
    }
    if (loot?.healCrystal) {
      setPartyHP((h) => Math.min(1, h + 0.3));
      pushLog('  ✚ A healing crystal restores the party.', 'heal');
    }

    if (n.type === 'boss') {
      pushLog(`${world.boss} is defeated. The way upward opens.`, 'boss');
      doFlash(`${world.name} cleared!`, world.accent);
      setUnlocked((u) => Math.max(u, world.id + 1));
      setWorldvein((v) => v + runVein + (loot?.worldvein || 0));
      clearFightTimers();
      setFightNode(null);
      setFightResult(null);
      setPendingLoot(null);
      resetRunToIsland();
      setTab('mountain');
      setHubSkinForTab('mountain');
      return;
    }

    // DESIGN-OPEN: tick respawns / roaming rares after clear
    clearFightTimers();
    setFightNode(null);
    setFightResult(null);
    setPendingLoot(null);
    setBusy(false);
    setRunStage('expedition');
  }

  function extract() {
    doFlash(`Extracted ${runVein} Worldvein`, colors.mythros);
    setWorldvein((v) => v + runVein);
    setTimeout(() => {
      resetRunToIsland();
      setTab('mountain');
      setHubSkinForTab('mountain');
    }, 600);
  }

  // Cleanup timers on unmount only — do NOT clear when switching tabs.
  useEffect(() => () => clearFightTimers(), []);

  const mountainHubLabel =
    runStage === 'island'
      ? 'The Mountain'
      : runStage === 'difficulty'
        ? 'Difficulty'
        : runStage === 'expedition'
          ? 'Mind View'
          : runStage === 'fight'
            ? 'Combat'
            : runStage === 'loot'
              ? 'Spoils'
              : HUB_LABELS.mountain;

  return (
    <div style={S.root}>
      <style>{BASE_CSS}</style>
      <div className="eld-frame" style={S.frame}>
        <Header
          worldvein={worldvein}
          mode={currentMode}
          colors={colors}
          hubLabel={tab === 'mountain' ? mountainHubLabel : HUB_LABELS[tab]}
        />
        {flash && (
          <div style={{ ...S.flash, borderColor: flash.color, color: flash.color }}>{flash.msg}</div>
        )}

        {tab === 'town' && (
          <Harbor party={party} stash={stash} setTab={selectTab} />
        )}
        {tab === 'party' && (
          <PartyScreen party={party} setParty={setParty} roster={roster} setRoster={setRoster} />
        )}
        {tab === 'player' && (
          <PlayerScreen worldvein={worldvein} />
        )}
        {tab === 'market' && (
          <PlaceholderPanel
            title="Market"
            blurb="System-controlled dynamic vendor (§7e). Own top-level tab — warm RPG chrome. DESIGN-OPEN: vendor inventory UI."
          />
        )}

        {/* Mountain owns the run stage machine — restore exact stage on return */}
        {tab === 'mountain' && runStage === 'island' && (
          <IslandWorldMap unlocked={unlocked} onSelectWorld={onSelectWorld} />
        )}
        {tab === 'mountain' && runStage === 'difficulty' && selectedWorld && (
          <DifficultyScreen
            world={selectedWorld}
            onConfirm={onDifficultyConfirm}
            onBack={onDifficultyBack}
          />
        )}
        {tab === 'mountain' && runStage === 'expedition' && world && territory && (
          <TerritoryMap
            world={world} territory={territory} currentId={currentId} busy={busy}
            partyHP={partyHP} runVein={runVein} party={party} archetypes={ARCHETYPES}
            log={log} logRef={logRef} onVisit={visitNode} onExtract={extract}
          />
        )}
        {tab === 'mountain' && runStage === 'fight' && fightNode && (
          <FightScreen
            world={world}
            node={fightNode}
            party={party}
            partyHP={partyHP}
            phase={fightPhase}
            result={fightResult}
            elapsedMs={fightElapsed}
            resolveMs={FIGHT_RESOLVE_MS}
          />
        )}
        {tab === 'mountain' && runStage === 'loot' && (
          <LootResults
            world={world}
            nodeLabel={fightNode ? (nodeTypeMeta[fightNode.type]?.label || 'Node') : null}
            win={fightResult?.win}
            loot={pendingLoot}
            duration={fightResult?.duration}
            onContinue={applyLootAndReturnToExpedition}
          />
        )}

        {/* LOCKED: TabBar visible during expeditions AND fights — mid-run hub access */}
        <TabBar activeTab={tab} onSelect={selectTab} />
      </div>
    </div>
  );
}

function buildFightFeed(res, loot, label) {
  const feed = [
    { t: 'The bond tightens. Blades find rhythm…', color: '#5f8494' },
    { t: res.win ? `Party holds the line against the ${label}.` : `The ${label} overwhelms the bond.`, color: res.win ? '#7fd6a0' : '#e05d6f' },
  ];
  if (res.win) {
    feed.push({ t: `Resolved in ${res.duration}s.`, color: '#9fb2bd' });
    if (loot?.worldvein) feed.push({ t: `+${loot.worldvein} Worldvein gleaned.`, color: '#5fc7e0' });
    if (loot?.gear) feed.push({ t: `Loot: ${loot.gear.name}`, color: '#e0a04d' });
  } else {
    feed.push({ t: `Fell after ${res.duration}s.`, color: '#e05d6f' });
  }
  return feed;
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
