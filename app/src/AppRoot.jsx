import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from './theme/ThemeProvider.jsx';
import { frame, colors, nodeTypeMeta } from './theme/tokens.js';
import { genTerritory, revealNeighbors } from './map/genTerritory.js';
import TerritoryMap from './map/TerritoryMap.jsx';
import { ARCHETYPES, DEFAULT_PARTY } from './data.js';
import { resolveFight, rollLoot } from './combat.js';
import { Header } from './components/HarborViews.jsx';
import PlayerScreen from './components/PlayerScreen.jsx';
import PartyScreen from './components/PartyScreen.jsx';
import TownScreen from './components/TownScreen.jsx';
import AfkScreen from './components/AfkScreen.jsx';
import TabBar from './components/TabBar.jsx';
import IslandWorldMap from './components/IslandWorldMap.jsx';
import RallyScreen from './components/RallyScreen.jsx';
import FightScreen from './components/FightScreen.jsx';
import LootResults from './components/LootResults.jsx';
import {
  AFK_TICK_MS, emptyGatherSlot, tickAfk,
} from './afkRuntime.js';
import { BASE_CSS } from './appChromeCss.js';

const HUB_LABELS = {
  player: 'Veinbinder',
  party: 'Party',
  mountain: 'The Mountain',
  town: 'Veinharbor',
  afk: 'The Seam', // DESIGN-OPEN: final AFK tab name
};

// Theme ladder (NodeMap art lock): island = warm RPG, node map = hybrid parchment, fight/loot = Mind-view.
const MIND_STAGES = new Set(['fight', 'loot']);
const FIGHT_RESOLVE_MS = 2200;

export default function Eldrathor() {
  const { enterMindView, exitMindView, currentMode, setHubSkinForTab } = useTheme();
  const [tab, setTab] = useState('mountain');
  const [runStage, setRunStage] = useState('island');
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [party, setParty] = useState(DEFAULT_PARTY);
  const [roster, setRoster] = useState([
    { name: 'Nyra', archetype: 'Adept', weapon: 'Staff', level: 1 },
    { name: 'Thalen', archetype: 'Resonator', weapon: 'Orb + Tome', level: 1 },
  ]);
  const [worldvein, setWorldvein] = useState(80);
  const [stash, setStash] = useState([]);
  const [inventory, setInventory] = useState({ raw: { wood: 4, metal: 2, hunt: 1 }, infused: [], scrap: 0, armor: [] });
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
  const [afk, setAfk] = useState({
    gatherSlots: [emptyGatherSlot(), emptyGatherSlot(), emptyGatherSlot()],
    gatherSkillXp: { wood: 0, metal: 0, hunt: 0 },
    process: { charKey: null, family: 'wood', running: false, progress: 0 },
    processSkillXp: 0,
    idle: { charKey: null, running: false, progress: 0 },
  });
  const [fightNode, setFightNode] = useState(null);
  const [fightPhase, setFightPhase] = useState('resolving');
  const [fightResult, setFightResult] = useState(null);
  const [fightElapsed, setFightElapsed] = useState(0);
  const [pendingLoot, setPendingLoot] = useState(null);
  const fightTimers = useRef({ tick: null, done: null, startedAt: 0, result: null, loot: null });
  const afkRef = useRef(afk);
  const inventoryRef = useRef(inventory);
  const worldveinRef = useRef(worldvein);
  const partyRef = useRef(party);
  const rosterRef = useRef(roster);
  const unlockedRef = useRef(unlocked);
  useEffect(() => { afkRef.current = afk; }, [afk]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => { worldveinRef.current = worldvein; }, [worldvein]);
  useEffect(() => { partyRef.current = party; }, [party]);
  useEffect(() => { rosterRef.current = roster; }, [roster]);
  useEffect(() => { unlockedRef.current = unlocked; }, [unlocked]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);
  useEffect(() => {
    const id = window.setInterval(() => {
      const patch = tickAfk({
        state: afkRef.current, inventory: inventoryRef.current, worldvein: worldveinRef.current,
        party: partyRef.current, roster: rosterRef.current, unlocked: unlockedRef.current, dt: AFK_TICK_MS,
      });
      if (!patch) return;
      setAfk(patch.next);
      if (patch.inv !== inventoryRef.current) setInventory(patch.inv);
      if (patch.vein !== worldveinRef.current) setWorldvein(patch.vein);
      if (patch.partyNext) setParty(patch.partyNext);
      if (patch.rosterNext) setRoster(patch.rosterNext);
    }, AFK_TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    setHubSkinForTab(tab);
    const wantMind = tab === 'mountain' && MIND_STAGES.has(runStage);
    if (wantMind) enterMindView(); else exitMindView();
  }, [tab, runStage, setHubSkinForTab, enterMindView, exitMindView]);
  function selectTab(id) { setTab(id); setHubSkinForTab(id); }
  function pushLog(t, k = 'n') { setLog((l) => [...l, { t, k }]); }
  function doFlash(msg, color) { setFlash({ msg, color }); setTimeout(() => setFlash(null), 1400); }
  function clearFightTimers() {
    const ft = fightTimers.current;
    if (ft.tick) window.clearInterval(ft.tick);
    if (ft.done) window.clearTimeout(ft.done);
    fightTimers.current = { tick: null, done: null, startedAt: 0, result: null, loot: null };
  }
  function resetRunToIsland() {
    clearFightTimers(); exitMindView(); setRunStage('island'); setSelectedWorld(null);
    setTerritory(null); setWorld(null); setCurrentId(null); setRunVein(0); setFightNode(null);
    setFightPhase('resolving'); setFightResult(null); setFightElapsed(0); setPendingLoot(null); setBusy(false);
  }
  // World pin → Rally screen (audit A2: no difficulty bands — the World is the band).
  function onSelectWorld(w) { setSelectedWorld(w); setRunStage('rally'); }
  function onRallyBack() { setSelectedWorld(null); setRunStage('island'); }
  function onRallyExplore() {
    const w = selectedWorld; if (!w) return;
    const t = genTerritory(w); t.nodes.forEach((n) => { n.tier = w.tier; });
    setWorld(w); setTerritory(t); setCurrentId(t.entranceId);
    setLog([{ t: `You unroll the route map. ${w.name} lies unexplored beyond the entry.`, k: 'sys' }]);
    setPartyHP(1); setRunVein(0); setRunStage('expedition');
  }
  const finishFightToLoot = useCallback(() => {
    const ft = fightTimers.current; const res = ft.result; const loot = ft.loot;
    if (!res) return;
    setFightPhase('done');
    setFightResult({ ...res, feed: buildFightFeed(res, loot, fightTimers.current.nodeLabel) });
    setPendingLoot(loot); setRunStage('loot'); setBusy(false);
  }, []);
  function startFight(n) {
    if (busy) return;
    clearFightTimers(); setBusy(true);
    setTerritory((prev) => ({ ...prev, nodes: prev.nodes.map((x) => (x.id === n.id ? { ...x, typeKnown: true } : x)) }));
    const label = n.type === 'boss' ? 'Boss' : n.type === 'rare' ? 'Rare' : n.type === 'crystal' ? 'Vein Crystal' : 'Skirmish';
    pushLog(`→ Entering a ${label} node…`, 'sys'); // node tap = fight begins (audit A1: no engage step)
    const fightNodeFull = { ...n, tier: world.tier };
    const res = resolveFight(party, fightNodeFull); const loot = rollLoot(fightNodeFull);
    setFightNode(fightNodeFull); setFightPhase('resolving');
    setFightResult({ win: res.win, hpPct: res.hpPct, duration: res.duration, feed: [{ t: 'The bond tightens. Blades find rhythm…', color: '#5f8494' }] });
    setFightElapsed(0); setPendingLoot(null); setRunStage('fight'); enterMindView();
    const startedAt = Date.now();
    fightTimers.current = { ...fightTimers.current, startedAt, result: res, loot, nodeLabel: label };
    fightTimers.current.tick = window.setInterval(() => setFightElapsed(Date.now() - startedAt), 100);
    fightTimers.current.done = window.setTimeout(() => {
      if (fightTimers.current.tick) window.clearInterval(fightTimers.current.tick);
      fightTimers.current.tick = null; setFightElapsed(FIGHT_RESOLVE_MS); finishFightToLoot();
    }, FIGHT_RESOLVE_MS);
  }
  function visitNode(n, opts = {}) {
    if (busy) return;
    if (opts.repositionOnly) { setCurrentId(n.id); pushLog('Repositioned to a cleared node.', 'sys'); return; }
    startFight(n);
  }
  function applyLootAndReturnToExpedition() {
    const res = fightResult; const loot = pendingLoot; const n = fightNode;
    if (!res || !n) { setRunStage('expedition'); return; }
    if (!res.win) {
      doFlash('Party defeated — returned to Veinharbor', colors.mindDanger);
      setWorldvein((v) => v + runVein); resetRunToIsland(); setTab('town'); setHubSkinForTab('town'); return;
    }
    setTerritory((prev) => revealNeighbors(prev, n.id)); setCurrentId(n.id); setPartyHP(res.hpPct);
    setRunVein((v) => v + (loot?.worldvein || 0));
    pushLog(`✔ Cleared in ${res.duration}s. +${loot?.worldvein || 0} Worldvein.${n.type === 'crystal' ? ' The crystal splinters — rich harvest.' : ''}`, 'good');
    if (loot?.gear) { setStash((s) => [...s, loot.gear]); pushLog(`  ⬥ Loot: ${loot.gear.name} (${loot.gear.rating}/100)`, 'loot'); }
    if (loot?.healCrystal) { setPartyHP((h) => Math.min(1, h + 0.3)); pushLog('  ✚ A healing crystal restores the party.', 'heal'); }
    if (n.type === 'boss') {
      pushLog(`${world.boss} is defeated. The way upward opens.`, 'boss');
      doFlash(`${world.name} cleared!`, world.accent);
      setUnlocked((u) => Math.max(u, world.id + 1));
      setWorldvein((v) => v + runVein + (loot?.worldvein || 0));
      clearFightTimers(); setFightNode(null); setFightResult(null); setPendingLoot(null);
      resetRunToIsland(); setTab('mountain'); setHubSkinForTab('mountain'); return;
    }
    clearFightTimers(); setFightNode(null); setFightResult(null); setPendingLoot(null); setBusy(false); setRunStage('expedition');
  }
  function extract() {
    doFlash(`Extracted ${runVein} Worldvein`, colors.mythros);
    setWorldvein((v) => v + runVein);
    setTimeout(() => { resetRunToIsland(); setTab('mountain'); setHubSkinForTab('mountain'); }, 600);
  }
  useEffect(() => () => clearFightTimers(), []);
  function onUpdateGatherSlot(index, patch) {
    setAfk((a) => ({ ...a, gatherSlots: a.gatherSlots.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  }
  function onToggleGather(index) {
    setAfk((a) => ({ ...a, gatherSlots: a.gatherSlots.map((s, i) => (i !== index || !s.charKey ? s : { ...s, running: !s.running, progress: s.running ? 0 : s.progress })) }));
  }
  function onUpdateProcess(patch) { setAfk((a) => ({ ...a, process: { ...a.process, ...patch } })); }
  function onToggleProcess() {
    setAfk((a) => { if (!a.process.charKey) return a; const starting = !a.process.running; return { ...a, process: { ...a.process, running: starting, progress: starting ? a.process.progress : 0 } }; });
  }
  function onUpdateIdle(patch) { setAfk((a) => ({ ...a, idle: { ...a.idle, ...patch } })); }
  function onToggleIdle() {
    setAfk((a) => { if (!a.idle.charKey) return a; const starting = !a.idle.running; return { ...a, idle: { ...a.idle, running: starting, progress: starting ? a.idle.progress : 0 } }; });
  }
  const mountainHubLabel = runStage === 'island' ? 'The Mountain' : runStage === 'rally' ? 'Rally' : runStage === 'expedition' ? 'Route Map' : runStage === 'fight' ? 'Combat' : runStage === 'loot' ? 'Spoils' : HUB_LABELS.mountain;
  return (
    <div style={S.root}>
      <style>{BASE_CSS}</style>
      <div className="eld-frame" style={S.frame}>
        <Header worldvein={worldvein} mode={currentMode} colors={colors} hubLabel={tab === 'mountain' ? mountainHubLabel : HUB_LABELS[tab]} />
        {flash && <div style={{ ...S.flash, borderColor: flash.color, color: flash.color }}>{flash.msg}</div>}
        {tab === 'town' && <TownScreen party={party} stash={stash} setStash={setStash} inventory={inventory} setInventory={setInventory} worldvein={worldvein} setWorldvein={setWorldvein} setTab={selectTab} />}
        {tab === 'party' && <PartyScreen party={party} setParty={setParty} roster={roster} setRoster={setRoster} />}
        {tab === 'player' && <PlayerScreen worldvein={worldvein} />}
        {tab === 'afk' && <AfkScreen unlocked={unlocked} party={party} roster={roster} inventory={inventory} afk={afk} worldvein={worldvein} onUpdateGatherSlot={onUpdateGatherSlot} onToggleGather={onToggleGather} onUpdateProcess={onUpdateProcess} onToggleProcess={onToggleProcess} onUpdateIdle={onUpdateIdle} onToggleIdle={onToggleIdle} />}
        {tab === 'mountain' && runStage === 'island' && <IslandWorldMap unlocked={unlocked} onSelectWorld={onSelectWorld} onHarbor={() => selectTab('town')} />}
        {tab === 'mountain' && runStage === 'rally' && selectedWorld && <RallyScreen world={selectedWorld} party={party} onExplore={onRallyExplore} onBack={onRallyBack} />}
        {tab === 'mountain' && runStage === 'expedition' && world && territory && <TerritoryMap world={world} territory={territory} currentId={currentId} busy={busy} partyHP={partyHP} runVein={runVein} party={party} archetypes={ARCHETYPES} log={log} logRef={logRef} onVisit={visitNode} onExtract={extract} />}
        {tab === 'mountain' && runStage === 'fight' && fightNode && <FightScreen world={world} node={fightNode} party={party} partyHP={partyHP} phase={fightPhase} result={fightResult} elapsedMs={fightElapsed} resolveMs={FIGHT_RESOLVE_MS} />}
        {tab === 'mountain' && runStage === 'loot' && <LootResults world={world} nodeLabel={fightNode ? (nodeTypeMeta[fightNode.type]?.label || 'Node') : null} win={fightResult?.win} loot={pendingLoot} duration={fightResult?.duration} onContinue={applyLootAndReturnToExpedition} />}
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
  } else feed.push({ t: `Fell after ${res.duration}s.`, color: '#e05d6f' });
  return feed;
}

const S = {
  root: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12px 0', background: '#05080a', boxSizing: 'border-box' },
  frame: { width: frame.width, height: frame.height, maxWidth: '100%', maxHeight: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 12, color: 'var(--eld-text, #cfe0e8)', fontFamily: 'var(--eld-font-body, system-ui, sans-serif)', position: 'relative' },
  flash: { textAlign: 'center', padding: '8px', margin: '8px 12px 0', border: '1px solid', borderRadius: 8, fontSize: 12, letterSpacing: '0.06em', background: 'rgba(0,0,0,0.35)', animation: 'fadein 0.3s ease', flexShrink: 0 },
};
