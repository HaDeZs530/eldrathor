import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from './theme/ThemeProvider.jsx';
import { frame, colors, nodeTypeMeta } from './theme/tokens.js';
import { genTerritory, revealNeighbors } from './map/genTerritory.js';
import TerritoryMap from './map/TerritoryMap.jsx';
import { ARCHETYPES, DEFAULT_PARTY } from './data.js';
import { simulateFight, spawnEnemies, rollRewards, deriveStats, mulberry32 } from './combat.js';
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
const PLAYBACK_TICK_MS = 100;
const RESULTS_HOLD_MS = 900; // pause on the final event before Spoils

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
  const [fight, setFight] = useState(null); // { enemies, derived, events, result, stats, rewards }
  const [fightElapsed, setFightElapsed] = useState(0);
  const [fightSpeed, setFightSpeed] = useState(1);
  // DESIGN-OPEN: per-Adventurer HP carries across fights within a run (§8c vitality pressure); reset on wipe/extract.
  const [runHpFrac, setRunHpFrac] = useState(null);
  const runSeed = useRef(1);
  const fightIndex = useRef(0);
  const fightTimers = useRef({ tick: null, done: null });
  const fightSpeedRef = useRef(1);
  useEffect(() => { fightSpeedRef.current = fightSpeed; }, [fightSpeed]);
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
    fightTimers.current = { tick: null, done: null };
  }
  function resetRunToIsland() {
    clearFightTimers(); exitMindView(); setRunStage('island'); setSelectedWorld(null);
    setTerritory(null); setWorld(null); setCurrentId(null); setRunVein(0); setFightNode(null);
    setFight(null); setFightElapsed(0); setFightSpeed(1); setRunHpFrac(null); setBusy(false);
  }
  // World pin → Rally screen (audit A2: no difficulty bands — the World is the band).
  function onSelectWorld(w) { setSelectedWorld(w); setRunStage('rally'); }
  function onRallyBack() { setSelectedWorld(null); setRunStage('island'); }
  function onRallyExplore() {
    const w = selectedWorld; if (!w) return;
    const t = genTerritory(w); t.nodes.forEach((n) => { n.tier = w.tier; });
    setWorld(w); setTerritory(t); setCurrentId(t.entranceId);
    setLog([{ t: `You unroll the route map. ${w.name} lies unexplored beyond the entry.`, k: 'sys' }]);
    runSeed.current = (Math.random() * 0xffffffff) >>> 0; fightIndex.current = 0; setRunHpFrac(null);
    setPartyHP(1); setRunVein(0); setRunStage('expedition');
  }
  /** Playback reached the end (or Skip) → Spoils. */
  const finishFightToLoot = useCallback(() => {
    clearFightTimers();
    setFight((f) => { if (f) setFightElapsed(f.result.durationMs); return f; });
    setRunStage('loot'); setBusy(false);
  }, []);
  /**
   * Node tap → simulate the whole fight instantly (combat v2 §1), then play the script back.
   * Deterministic per run seed + fight index.
   */
  function startFight(n) {
    if (busy) return;
    clearFightTimers(); setBusy(true);
    setTerritory((prev) => ({ ...prev, nodes: prev.nodes.map((x) => (x.id === n.id ? { ...x, typeKnown: true } : x)) }));
    const label = n.type === 'boss' ? 'Boss' : n.type === 'rare' ? 'Rare' : n.type === 'crystal' ? 'Vein Crystal' : 'Skirmish';
    pushLog(`→ Entering a ${label} node…`, 'sys');
    const fightNodeFull = { ...n, tier: world.tier };
    fightIndex.current += 1;
    const seed = (runSeed.current ^ Math.imul(fightIndex.current, 0x9e3779b1)) >>> 0;
    const rng = mulberry32(seed ^ 0x5bd1e995);
    const enemies = spawnEnemies(world.tier, n.type, !!n.namedRare, { rng, bossName: world.boss });
    const sim = simulateFight({ party, enemies, seed, startHpFrac: runHpFrac || undefined });
    const rewards = sim.result.win ? rollRewards({ worldTier: world.tier, nodeType: n.type, attuneVein: sim.result.attuneVein, rng }) : null;
    const derived = party.map((m) => deriveStats(m));
    setFight({ enemies, derived, events: sim.events, result: sim.result, stats: sim.stats, rewards, seed });
    setFightNode(fightNodeFull); setFightElapsed(0); setFightSpeed(1);
    setRunStage('fight'); enterMindView();
    fightTimers.current.tick = window.setInterval(() => {
      setFightElapsed((e) => {
        const next = e + PLAYBACK_TICK_MS * fightSpeedRef.current;
        if (next >= sim.result.durationMs + RESULTS_HOLD_MS) {
          window.clearInterval(fightTimers.current.tick); fightTimers.current.tick = null;
          window.setTimeout(finishFightToLoot, 0);
          return sim.result.durationMs;
        }
        return next;
      });
    }, PLAYBACK_TICK_MS);
  }
  function skipFight() { finishFightToLoot(); }
  function visitNode(n, opts = {}) {
    if (busy) return;
    if (opts.repositionOnly) { setCurrentId(n.id); pushLog('Repositioned to a cleared node.', 'sys'); return; }
    startFight(n);
  }
  function applyLootAndReturnToExpedition() {
    const f = fight; const n = fightNode;
    if (!f || !n) { setRunStage('expedition'); return; }
    const res = f.result; const rewards = f.rewards;
    if (!res.win) {
      // §8c death rule: banked kept, map resets, home to Veinharbor.
      doFlash('The bond pulls them home', colors.mindDanger);
      setWorldvein((v) => v + runVein); resetRunToIsland(); setTab('town'); setHubSkinForTab('town'); return;
    }
    setTerritory((prev) => revealNeighbors(prev, n.id)); setCurrentId(n.id);
    setPartyHP(res.hpPct); setRunHpFrac(res.partyHpFrac);
    setRunVein((v) => v + (rewards?.worldvein || 0));
    pushLog(`✔ Cleared in ${res.durationSec}s. +${rewards?.worldvein || 0} Worldvein.${n.type === 'crystal' ? ' The crystal splinters — rich harvest.' : ''}`, 'good');
    if (rewards?.gear) { setStash((s) => [...s, rewards.gear]); pushLog(`  ⬥ Loot: ${rewards.gear.name} (${rewards.gear.rating}/100)`, 'loot'); }
    if (n.type === 'boss') {
      pushLog(`${world.boss} is defeated. The way upward opens.`, 'boss');
      doFlash(`${world.name} cleared!`, world.accent);
      setUnlocked((u) => Math.max(u, world.id + 1));
      setWorldvein((v) => v + runVein + (rewards?.worldvein || 0));
      clearFightTimers(); setFightNode(null); setFight(null);
      resetRunToIsland(); setTab('mountain'); setHubSkinForTab('mountain'); return;
    }
    clearFightTimers(); setFightNode(null); setFight(null); setBusy(false); setRunStage('expedition');
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
        {tab === 'mountain' && runStage === 'fight' && fightNode && fight && <FightScreen world={world} node={fightNode} party={party} fight={fight} elapsedMs={fightElapsed} speed={fightSpeed} onSpeed={setFightSpeed} onSkip={skipFight} />}
        {tab === 'mountain' && runStage === 'loot' && fight && <LootResults world={world} nodeLabel={fightNode ? (nodeTypeMeta[fightNode.type]?.label || 'Node') : null} fight={fight} onContinue={applyLootAndReturnToExpedition} />}
        <TabBar activeTab={tab} onSelect={selectTab} />
      </div>
    </div>
  );
}

const S = {
  root: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12px 0', background: '#05080a', boxSizing: 'border-box' },
  frame: { width: frame.width, height: frame.height, maxWidth: '100%', maxHeight: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 12, color: 'var(--eld-text, #cfe0e8)', fontFamily: 'var(--eld-font-body, system-ui, sans-serif)', position: 'relative' },
  flash: { textAlign: 'center', padding: '8px', margin: '8px 12px 0', border: '1px solid', borderRadius: 8, fontSize: 12, letterSpacing: '0.06em', background: 'rgba(0,0,0,0.35)', animation: 'fadein 0.3s ease', flexShrink: 0 },
};
