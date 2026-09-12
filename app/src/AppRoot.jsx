import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from './theme/ThemeProvider.jsx';
import { frame, colors, nodeTypeMeta } from './theme/tokens.js';
import { genTerritory } from './map/genTerritory.js';
import { rareAt, effectiveType, isSealed, allCleared, scoutNode, clearNode, killRare, tickClock, threatBand } from './map/routeState.js';
import RouteMapScreen from './map/RouteMapScreen.jsx';
import { ARCHETYPES, DEFAULT_PARTY, AREAS } from './data.js';
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
import SanctuaryScreen from './components/SanctuaryScreen.jsx';
import { AFK_TICK_MS, emptyGatherSlot, tickAfk } from './afkRuntime.js';
import { BASE_CSS } from './appChromeCss.js';

const HUB_LABELS = {
  player: 'Veinbinder',
  party: 'Party',
  mountain: 'The Island',
  town: 'Veinharbor',
  afk: 'The Seam', // DESIGN-OPEN: final AFK tab name
};

// Theme ladder: island = warm RPG, route map = hybrid parchment, fight/loot/sanctuary = Mind-view.
const MIND_STAGES = new Set(['fight', 'loot', 'sanctuary']);
const PLAYBACK_TICK_MS = 100;
const RESULTS_HOLD_MS = 900; // pause on the final event before Spoils
const THREAT_DRY_RUNS = 6; // DESIGN-OPEN: quick-estimate sample size for the scout card
const NODE_LABEL = { normal: 'Fight', crystal: 'Crystal', sanctuary: 'Sanctuary', rare: 'Rare', boss: 'Boss' };

export default function Eldrathor() {
  const { enterMindView, exitMindView, currentMode, setHubSkinForTab } = useTheme();
  const [tab, setTab] = useState('mountain');
  const [runStage, setRunStage] = useState('island'); // island | rally | route | fight | loot | sanctuary
  const [selectedArea, setSelectedArea] = useState(null);
  const [party, setParty] = useState(DEFAULT_PARTY);
  const [roster, setRoster] = useState([
    { name: 'Nyra', archetype: 'Adept', weapon: 'Staff', level: 1 },
    { name: 'Thalen', archetype: 'Resonator', weapon: 'Orb + Tome', level: 1 },
  ]);
  const [worldvein, setWorldvein] = useState(80);
  const [stash, setStash] = useState([]);
  const [inventory, setInventory] = useState({ raw: { wood: 4, metal: 2, hunt: 1 }, infused: [], scrap: 0, armor: [] });
  const [area, setArea] = useState(null);
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
  // --- run state (route map v2) ---
  const [scout, setScout] = useState(null); // ScoutCard data for the tapped node
  const [runMods, setRunMods] = useState({ dmgMult: 1, mitAdd: 0 }); // sanctuary bonuses, per run
  const [runHpFrac, setRunHpFrac] = useState(null); // per-Adventurer HP carried across fights (0 = fallen)
  const [fightNode, setFightNode] = useState(null);
  const [fight, setFight] = useState(null); // { enemies, derived, events, result, stats, rewards, named, rare }
  const [fightElapsed, setFightElapsed] = useState(0);
  const [fightSpeed, setFightSpeed] = useState(1);
  const runRng = useRef(Math.random);
  const runSeed = useRef(1);
  const fightIndex = useRef(0);
  const fightTimers = useRef({ tick: null });
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
  useEffect(() => () => clearFightTimers(), []);

  function selectTab(id) { setTab(id); setHubSkinForTab(id); }
  function pushLog(t, k = 'n') { setLog((l) => [...l, { t, k }]); }
  function doFlash(msg, color) { setFlash({ msg, color }); setTimeout(() => setFlash(null), 1400); }
  function clearFightTimers() {
    const ft = fightTimers.current;
    if (ft.tick) window.clearInterval(ft.tick);
    fightTimers.current = { tick: null };
  }
  function resetRunToIsland() {
    clearFightTimers(); exitMindView(); setRunStage('island'); setSelectedArea(null);
    setTerritory(null); setArea(null); setCurrentId(null); setRunVein(0); setFightNode(null);
    setFight(null); setFightElapsed(0); setFightSpeed(1); setRunHpFrac(null); setScout(null);
    setRunMods({ dmgMult: 1, mitAdd: 0 }); setBusy(false);
  }

  // ---------- island → rally → route ----------
  function onSelectArea(a) { setSelectedArea(a); setRunStage('rally'); }
  function onRallyBack() { setSelectedArea(null); setRunStage('island'); }
  function onRallySwap(slot, rosterIndex) {
    const incoming = roster[rosterIndex];
    if (!incoming) return;
    const outgoing = party[slot] || null;
    setParty((p) => { const next = [...p]; next[slot] = incoming; return next.filter(Boolean); });
    setRoster((r) => { const without = r.filter((_, i) => i !== rosterIndex); return outgoing ? [...without, outgoing] : without; });
  }
  function onRallyExplore() {
    const a = selectedArea; if (!a) return;
    runSeed.current = (Math.random() * 0xffffffff) >>> 0;
    runRng.current = mulberry32(runSeed.current);
    fightIndex.current = 0;
    const t = genTerritory(a, { rng: runRng.current });
    setArea(a); setTerritory(t); setCurrentId(t.entranceId);
    setLog([{ t: `You unroll the route map. ${a.name} lies unexplored beyond the entry — ${t.rares.length} rares roam it and the boss is sealed.`, k: 'sys' }]);
    setRunHpFrac(null); setRunMods({ dmgMult: 1, mitAdd: 0 }); setScout(null);
    setPartyHP(1); setRunVein(0); setRunStage('route');
  }

  // ---------- node-action clock ----------
  /** Advance the clock on a territory; logs rare moves / respawns. Returns the new territory. */
  function advanceClock(t, curId) {
    const { territory: next, events } = tickClock(t, { currentId: curId, rng: runRng.current });
    for (const e of events) {
      if (e.type === 'rareMoved') pushLog('☠ A rare moves through the fog.', 'rare');
      if (e.type === 'respawn') pushLog(e.named ? '✦ Something NAMED stirs on cleared ground.' : '✦ Cleared ground stirs — a node repopulates.', 'rare');
    }
    return next;
  }

  // ---------- scout → engage / leave ----------
  function depthMultFor(n) { return 1 + 0.5 * (n.depth01 || 0); }
  function enemiesFor(t, n, rng) {
    const eff = effectiveType(t, n);
    if (eff === 'sanctuary') return [];
    return spawnEnemies(area.tier, eff, false, { rng, bossName: area.boss, depthMult: eff === 'rare' || eff === 'boss' ? 1 : depthMultFor(n), named: !!n.namedRare });
  }
  function buildScout(t, n) {
    const eff = effectiveType(t, n);
    const sealedBoss = n.type === 'boss' && isSealed(t);
    const rng = mulberry32((runSeed.current ^ Math.imul(Number(n.id.slice(1)) + 1, 0x85ebca6b)) >>> 0);
    const enemies = enemiesFor(t, n, rng);
    let threat = null;
    if (enemies.length && !sealedBoss) {
      let wins = 0;
      for (let i = 0; i < THREAT_DRY_RUNS; i++) {
        const r = simulateFight({ party, enemies: enemies.map((e) => ({ ...e })), seed: i * 7919 + 1, startHpFrac: runHpFrac || undefined, runMods });
        if (r.result.win) wins += 1;
      }
      threat = threatBand(wins / THREAT_DRY_RUNS);
    }
    const count = enemies.length;
    const named = n.namedRare;
    let title = NODE_LABEL[eff] || 'Node';
    if (eff === 'boss') title = area.boss;
    if (named) title = `Named ${title}`;
    let body;
    let yieldText = null;
    if (sealedBoss) body = `The boss node is chained. ${t.rares.filter((r) => r.alive).length} rare${t.rares.filter((r) => r.alive).length === 1 ? '' : 's'} still roam — hunt them to break the seal.`;
    else if (eff === 'sanctuary') { body = 'A wild healing crystal. No fight.'; yieldText = 'Full HP + mana, revives the fallen, and one bonus for this run.'; }
    else if (eff === 'crystal') { body = `${count} enem${count === 1 ? 'y guards' : 'ies guard'} a Vein deposit.`; yieldText = '×2 Worldvein on victory.'; }
    else if (eff === 'rare') { body = `A roaming rare${named ? ' — named, ×1.3 stats' : ''}. Big loot; may drop a class gem.`; }
    else if (eff === 'boss') { body = `${area.boss} waits. The seal is broken.`; }
    else { body = `${count} enem${count === 1 ? 'y' : 'ies'}${n.respawned ? ' — repopulated ground' : ''}${named ? ' — named, ×1.3 stats, +1 loot roll' : ''}.`; }
    return { nodeId: n.id, type: eff, title, body, yieldText, threat, count, enemies, named: !!named, engageDisabled: sealedBoss, engageLabel: eff === 'sanctuary' ? 'Rest' : 'Engage' };
  }
  function onTapNode(n) {
    if (busy || !territory) return;
    const t = territory;
    if (n.id === currentId) return;
    // free reposition onto cleared ground
    if (n.cleared && !n.respawned) { setCurrentId(n.id); setScout(null); pushLog('Repositioned to a cleared node.', 'sys'); return; }
    // a rare next to the party ambushes — no scout card
    if (rareAt(t, n.id)) { pushLog('☠ The rare turns on you — no time to scout.', 'rare'); startFight(n, { ambush: true }); return; }
    if (!n.scouted) {
      // scouting is a node-action: the clock ticks
      let next = scoutNode(t, n.id);
      next = advanceClock(next, currentId);
      setTerritory(next);
      const nn = next.nodes.find((x) => x.id === n.id);
      setScout(buildScout(next, nn));
      pushLog(`👁 Scouted a ${NODE_LABEL[effectiveType(next, nn)] || 'node'} node.`, 'sys');
      return;
    }
    setScout(buildScout(t, n));
  }
  function onLeave() { setScout(null); }
  function onEngage() {
    const s = scout; if (!s || !territory) return;
    const n = territory.nodes.find((x) => x.id === s.nodeId); if (!n) return;
    setScout(null);
    if (effectiveType(territory, n) === 'sanctuary') { setFightNode(n); setRunStage('sanctuary'); enterMindView(); return; }
    startFight(n, { enemies: s.enemies });
  }

  // ---------- sanctuary ----------
  function onSanctuaryChoose(bonusId) {
    const n = fightNode; if (!n || !territory) return;
    const pouch = 10 * area.tier; // DESIGN-OPEN: pouch size
    if (bonusId === 'dmg') { setRunMods((m) => ({ ...m, dmgMult: m.dmgMult + 0.1 })); pushLog('✧ Sanctuary: the bond strikes +10% harder this run.', 'heal'); }
    if (bonusId === 'mit') { setRunMods((m) => ({ ...m, mitAdd: m.mitAdd + 0.1 })); pushLog('✧ Sanctuary: the bond takes 10% less this run.', 'heal'); }
    if (bonusId === 'vein') { setRunVein((v) => v + pouch); pushLog(`✧ Sanctuary: a pouch of ${pouch} Worldvein.`, 'loot'); }
    setRunHpFrac(party.map(() => 1)); setPartyHP(1);
    pushLog('✧ The party rests at the crystal — healed, restored, the fallen revived.', 'heal');
    let t = { ...territory, nodes: territory.nodes.map((x) => (x.id === n.id ? { ...x, sanctuaryUsed: true } : x)) };
    t = clearNode(t, n.id, runRng.current);
    t = advanceClock(t, n.id);
    setTerritory(t); setCurrentId(n.id); setFightNode(null); setRunStage('route');
  }

  // ---------- fights ----------
  const finishFightToLoot = useCallback(() => {
    clearFightTimers();
    setFight((f) => { if (f) setFightElapsed(f.result.durationMs); return f; });
    setRunStage('loot'); setBusy(false);
  }, []);
  function startFight(n, opts = {}) {
    if (busy || !territory) return;
    clearFightTimers(); setBusy(true); setScout(null);
    const t = { ...territory, nodes: territory.nodes.map((x) => (x.id === n.id ? { ...x, typeKnown: true, scouted: true } : x)) };
    setTerritory(t);
    const eff = effectiveType(t, n);
    const rare = rareAt(t, n.id);
    pushLog(`→ ${opts.ambush ? 'Ambushed at' : 'Engaging'} a ${NODE_LABEL[eff] || 'node'} node…`, 'sys');
    fightIndex.current += 1;
    const seed = (runSeed.current ^ Math.imul(fightIndex.current, 0x9e3779b1)) >>> 0;
    const rng = mulberry32(seed ^ 0x5bd1e995);
    const enemies = (opts.enemies && opts.enemies.length ? opts.enemies : enemiesFor(t, n, rng)).map((e) => ({ ...e }));
    const sim = simulateFight({ party, enemies, seed, startHpFrac: runHpFrac || undefined, runMods });
    const bossKill = sim.result.win && eff === 'boss';
    const mapClear = bossKill && allCleared({ ...t, nodes: t.nodes.map((x) => (x.id === n.id ? { ...x, cleared: true, respawned: false } : x)) });
    const rewards = sim.result.win
      ? rollRewards({ tier: area.tier, nodeType: eff, attuneVein: sim.result.attuneVein, rng, named: !!n.namedRare, mapClear })
      : null;
    const derived = party.map((m) => deriveStats(m));
    setFight({ enemies, derived, events: sim.events, result: sim.result, stats: sim.stats, rewards, seed, named: !!n.namedRare, rare: !!rare, eff, mapClear, ambush: !!opts.ambush });
    setFightNode({ ...n, tier: area.tier, type: eff });
    setFightElapsed(0); setFightSpeed(1);
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
  function applyLootAndReturnToRoute() {
    const f = fight; const n = fightNode;
    if (!f || !n || !territory) { setRunStage('route'); return; }
    const res = f.result; const rewards = f.rewards;
    if (!res.win) {
      // §6 wipe: banked kept, map discarded, home to Veinharbor.
      doFlash('The bond pulls them home', colors.mindDanger);
      setWorldvein((v) => v + runVein); resetRunToIsland(); setTab('town'); setHubSkinForTab('town'); return;
    }
    let t = territory;
    if (f.rare) { t = killRare(t, n.id); }
    t = clearNode(t, n.id, runRng.current);
    const sealJustBroke = f.rare && !isSealed(t) && isSealed(territory);
    t = advanceClock(t, n.id);
    setTerritory(t); setCurrentId(n.id);
    setPartyHP(res.hpPct); setRunHpFrac(res.partyHpFrac);
    setRunVein((v) => v + (rewards?.worldvein || 0));
    pushLog(`✔ Cleared in ${res.durationSec}s. +${rewards?.worldvein || 0} Worldvein.${f.eff === 'crystal' ? ' The deposit splinters — ×2 harvest.' : ''}`, 'good');
    for (const g of rewards?.gears || []) { setStash((s) => [...s, g]); pushLog(`  ⬥ Loot: ${g.name} (${g.rating}/100)`, 'loot'); }
    if (f.rare) pushLog(`☠ Rare slain. ${t.rares.filter((r) => r.alive).length} remain.`, 'rare');
    if (sealJustBroke) { pushLog('♛ The seal breaks — the boss node pulses and the way is lit.', 'boss'); doFlash('Seal broken', colors.mythros); }
    if (f.eff === 'boss') {
      pushLog(`${area.boss} is defeated. ${area.name} is cleared.${f.mapClear ? ' Every node cleared — map-clear bonus!' : ''}`, 'boss');
      doFlash(`${area.name} cleared!`, area.accent);
      setUnlocked((u) => Math.max(u, area.id + 1));
      setWorldvein((v) => v + runVein + (rewards?.worldvein || 0));
      clearFightTimers(); setFightNode(null); setFight(null);
      resetRunToIsland(); setTab('mountain'); setHubSkinForTab('mountain'); return;
    }
    clearFightTimers(); setFightNode(null); setFight(null); setBusy(false); setRunStage('route');
  }
  function extract() {
    doFlash(`Extracted ${runVein} Worldvein`, colors.mythros);
    setWorldvein((v) => v + runVein);
    setTimeout(() => { resetRunToIsland(); setTab('mountain'); setHubSkinForTab('mountain'); }, 600);
  }

  // ---------- AFK handlers ----------
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

  const mountainHubLabel = { island: 'The Island', rally: 'Rally', route: 'Route Map', fight: 'Combat', loot: 'Spoils', sanctuary: 'Sanctuary' }[runStage] || HUB_LABELS.mountain;
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
        {tab === 'mountain' && runStage === 'island' && <IslandWorldMap areas={AREAS} unlocked={unlocked} onSelectArea={onSelectArea} onHarbor={() => selectTab('town')} />}
        {tab === 'mountain' && runStage === 'rally' && selectedArea && <RallyScreen area={selectedArea} party={party} roster={roster} onSwap={onRallySwap} onExplore={onRallyExplore} onBack={onRallyBack} />}
        {tab === 'mountain' && runStage === 'route' && area && territory && <RouteMapScreen area={area} territory={territory} currentId={currentId} busy={busy} partyHP={partyHP} runVein={runVein} party={party} archetypes={ARCHETYPES} log={log} logRef={logRef} scout={scout} onTapNode={onTapNode} onEngage={onEngage} onLeave={onLeave} onExtract={extract} />}
        {tab === 'mountain' && runStage === 'sanctuary' && fightNode && <SanctuaryScreen area={area} party={party} runHpFrac={runHpFrac} pouch={10 * area.tier} onChoose={onSanctuaryChoose} />}
        {tab === 'mountain' && runStage === 'fight' && fightNode && fight && <FightScreen area={area} node={fightNode} party={party} fight={fight} elapsedMs={fightElapsed} speed={fightSpeed} onSpeed={setFightSpeed} onSkip={skipFight} />}
        {tab === 'mountain' && runStage === 'loot' && fight && <LootResults area={area} nodeLabel={fightNode ? (nodeTypeMeta[fightNode.type]?.label || 'Node') : null} fight={fight} onContinue={applyLootAndReturnToRoute} />}
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
