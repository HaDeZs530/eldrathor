import { useState, useEffect, useRef, useReducer, useCallback, useMemo } from 'react';
import { useTheme } from './theme/ThemeProvider.jsx';
import { frame, colors, nodeTypeMeta } from './theme/tokens.js';
import { genTerritory } from './map/genTerritory.js';
import { rareAt, effectiveType, raresAlive, allCleared, scoutNode, clearNode, killRare, tickClock, threatBand, explorePath, isAdjacent, nodeState, fleeChance } from './map/routeState.js';
import RouteMapScreen from './map/RouteMapScreen.jsx';
import { DEFAULT_PARTY, AREAS, withIds } from './data.js';
import { simulateFight, spawnEnemies, rollRewards, deriveStats, mulberry32 } from './combat.js';
import { equip } from './combat/derive.js';
import { isTestFightLength, tuneFightLength } from './debug/testFightLength.js';
import { withStarterWeapons, equippedIds, fightXp, splitXp, applyXp, xpToNext } from './progression/progression.js';
import { awardLevelFragments, fragmentLine } from './progression/gems.js';
import { bondMods, craftMods, normalizeUpgrades, canBuy, buy } from './player/upgrades.js';
import { rankFor, resonance } from './player/resonance.js';
import { grantTestGems, TEST_KIT } from './debug/testKit.js';
import { gatherSlotCount, withGatherSlots } from './afkRuntime.js';
import { plainName } from './progression/items.js';
import { Frame, Header } from './components/ui/index.jsx';
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
import { AFK_TICK_MS, reconcileAfk, assignJob, toggleJob, suspendJobs, resumeJobs, normalizeAfk, wantsOfflineSummary } from './afkRuntime.js';
import { BASE_CSS } from './appChromeCss.js';
import ScreenHeaderActions from './components/shell/ScreenHeaderActions.jsx';
import HelpSheet from './components/shell/HelpSheet.jsx';
import MenuSheet from './components/shell/MenuSheet.jsx';
import RunLogSheet from './map/RunLogSheet.jsx';
import DebugTraceSheet from './debug/DebugTraceSheet.jsx';
import { trace, isTraceOn, BUILD } from './debug/trace.js';
import { travelDuration, cameraReducer, CARD_PAUSE_MS, OVERLAY_FADE_MS } from './map/camera.js';
import { createStore, createSaver, countedRng } from './save/save.js';
import SettingsSheet from './components/shell/SettingsSheet.jsx';
import LatticeScreen from './components/lattice/LatticeScreen.jsx';
import { retapAction } from './nav/tabRetap.js';
import OfflineSheet from './components/shell/OfflineSheet.jsx';

// ---------- save & resume (Progression Loop Lock §1 / M1a) ----------
// One store + one debounced saver per page. The save is read once, before the first render, and every
// piece of persisted state below initialises from it (BOOT). A snapshot effect re-schedules a write on
// every state transition; the saver flushes when the page goes hidden or unloads.
const SAVE_STORE = createStore();
const SAVER = createSaver({ store: SAVE_STORE });
const BOOT = SAVE_STORE.load();
const S0 = BOOT.state || {};
const R0 = S0.run || null;
// M1b: every Adventurer boots with an equipped weapon (fresh game: Common starters; migrated saves are
// already geared, so this is a no-op for them). Party and roster are split back by their counts.
const DEFAULT_ROSTER = [
  { name: 'Nyra', archetype: 'Adept', weapon: 'Staff', level: 1, xp: 0 },
  { name: 'Thalen', archetype: 'Resonator', weapon: 'Orb + Tome', level: 1, xp: 0 },
];
const P0 = S0.party ? withIds(S0.party) : withIds(DEFAULT_PARTY);
const RO0 = withIds(S0.roster || DEFAULT_ROSTER);
const GEARED = withStarterWeapons([...P0, ...RO0], S0.bag || []);
const PARTY0 = GEARED.members.slice(0, P0.length);
const ROSTER0 = GEARED.members.slice(P0.length);
const BAG0 = GEARED.bag; // Item Model §5: ONE bag — weapons, armor, cores and materials together

const HUB_LABELS = {
  player: 'Veinbinder',
  party: 'Party',
  mountain: 'The Island',
  town: 'Veinharbor',
  afk: 'The Hearth', // Progression Loop Lock §9: the bench works at the hearth while the party is away
};

// Theme ladder: island = warm RPG, route map = hybrid parchment, fight/loot/sanctuary = Mind-view.
const MIND_STAGES = new Set(['fight', 'loot', 'sanctuary']);
const RUN_STAGES = new Set(['route', 'fight', 'loot', 'sanctuary']); // §13: the route map stays mounted through all of these
const PLAYBACK_TICK_MS = 100;
const RESULTS_HOLD_MS = 900; // pause on the final event before Spoils
const THREAT_DRY_RUNS = 6; // DESIGN-OPEN: quick-estimate sample size for the scout card
const NODE_LABEL = { normal: 'Fight', crystal: 'Crystal', sanctuary: 'Sanctuary', rare: 'Rare', boss: 'Boss' };
const TYPE_GLYPH = { normal: '⚔', crystal: '❖', sanctuary: '✧', rare: '☠', boss: '♛' };

export default function Eldrathor() {
  const { enterMindView, exitMindView, setHubSkinForTab } = useTheme();
  const [tab, setTab] = useState(() => (R0 ? 'mountain' : S0.tab || 'mountain'));
  // a run saved mid-fight resumes at its Results (the fight is pre-rolled data); otherwise at its own stage
  const [runStage, setRunStage] = useState(() => (R0 ? (R0.runStage === 'fight' ? 'loot' : R0.runStage) : 'island')); // island | rally | route | fight | loot | sanctuary
  const [selectedArea, setSelectedArea] = useState(null);
  const [party, setParty] = useState(() => PARTY0);
  const [roster, setRoster] = useState(() => ROSTER0);
  // bug-fix pass 1 §7 (design ruling 2026-09-14): the fielded party is SNAPSHOT at Rally → Explore and
  // frozen for the run; the Party tab can't swap/promote while a territory exists.
  const [runParty, setRunParty] = useState(() => R0?.runParty || null);
  const [worldvein, setWorldvein] = useState(() => (typeof S0.worldvein === 'number' ? S0.worldvein : 80));
  const [bag, setBag] = useState(() => BAG0);
  const [inventory, setInventory] = useState(() => S0.inventory || { raw: { wood: 4, metal: 2, hunt: 1 } }); // raw gather mats only — everything else is in the bag
  const [area, setArea] = useState(() => (R0 ? AREAS.find((a) => a.id === R0.areaId) || null : null));
  const [territory, setTerritory] = useState(() => R0?.territory || null);
  const [currentId, setCurrentId] = useState(() => R0?.currentId || null);
  const [log, setLog] = useState(() => R0?.log || []); // run log (v3 §9): every run event, newest last
  const [logSeen, setLogSeen] = useState(() => R0?.logSeen || 0); // entries seen when the Run log sheet was last opened
  const logSeq = useRef(R0?.logSeq || 0);
  const [busy, setBusy] = useState(false);
  const [partyHP, setPartyHP] = useState(() => R0?.partyHP ?? 1);
  const [runVein, setRunVein] = useState(() => R0?.runVein || 0);
  const [unlocked, setUnlocked] = useState(() => S0.unlocked || 1);
  const [flash, setFlash] = useState(null);
  const [sheet, setSheet] = useState(null); // null | 'help' | 'help+basics' | 'menu' | 'runlog'
  const logRef = useRef(null);
  // M1c §6: jobs carry timestamps; a loaded save is normalised so a legacy running job counts time away
  // from the save's own afkSavedAt. The first tick after boot reconciles the whole absence (→ Offline sheet).
  // Craft · Hearth: +1 Gather slot at levels 4 and 8 — appended when bought (see buyUpgrade) and on load; never taken away
  const [afk, setAfk] = useState(() => withGatherSlots(normalizeAfk(S0.afk, { savedAt: S0.afkSavedAt ?? null, now: Date.now() }), gatherSlotCount(craftMods(normalizeUpgrades(S0.player?.upgrades)).extraSlots)));
  // Growth Model §2: the Veinbinder's Worldvein-bought upgrades — Bond (every Adventurer) and Craft (the economy)
  const [playerUpgrades, setPlayerUpgrades] = useState(() => normalizeUpgrades(S0.player?.upgrades));
  const [latticeGemId, setLatticeGemId] = useState(null); // Growth Model §4: the Lattice screen, opened from a Gem slot or a gem sheet
  const [offline, setOffline] = useState(null); // summary for the "While you were away" sheet
  // --- run state (route map v2) ---
  const [ambush, setAmbush] = useState(null); // AmbushCard (v3 §3): { nodeId, prevId, kind, enemies, fleeChance, ... }
  const [travel, setTravel] = useState(null); // §14 trip: { path, startTs, duration, after, skipAt? }
  const [camera, dispatchCameraRaw] = useReducer(cameraReducer, { pan: R0?.cameraPan || null, motion: 'none', focus: null }); // §13/§17 explicit run camera (resumes in place)
  /** Every camera action goes through here so the debug trace sees its cause. */
  const dispatchCamera = useCallback((action) => {
    if (isTraceOn()) {
      const d = { type: action.type };
      if (action.pan) { d.to = [action.pan.x, action.pan.y]; }
      if (action.motion) d.motion = action.motion;
      if (action.partyId) d.party = action.partyId;
      if (action.dx != null) { d.dx = action.dx; d.dy = action.dy; }
      trace('camera', d);
    }
    dispatchCameraRaw(action);
  }, []);
  const [card, setCard] = useState(null); // §15 the one card under the map: explore / reveal / ambush
  const [overlayLeaving, setOverlayLeaving] = useState(null); // snapshot of the last overlay while it fades out (350 ms)
  const overlayTimer = useRef(null);
  const [prevId, setPrevId] = useState(() => R0?.prevId || null); // node the party came from (flee steps back here)
  const travelTimer = useRef(null);
  const [runMods, setRunMods] = useState(() => R0?.runMods || { dmgMult: 1, mitAdd: 0 }); // sanctuary bonuses, per run
  const [runHp, setRunHp] = useState(() => R0?.runHp || null); // per-Adventurer HP carried across fights, keyed by character id (0 = fallen); null = fresh
  const fieldedRaw = runParty || party; // the party that fights this run
  // M1b §4: equipment applies — the simulator and stat sheets see the equipped weapon / armor items
  const bond = useMemo(() => bondMods(playerUpgrades), [playerUpgrades]);
  const craft = useMemo(() => craftMods(playerUpgrades), [playerUpgrades]);
  const fielded = useMemo(() => fieldedRaw.map((m) => equip(m, bag, bond)), [fieldedRaw, bag, bond]);
  const hpArrFor = (list) => (runHp ? list.map((m) => runHp[m.id] ?? 1) : undefined);
  const equipped = useMemo(() => equippedIds(party, roster), [party, roster]);
  const latticeGem = latticeGemId ? bag.find((i) => i.id === latticeGemId && i.kind === 'gem') || null : null;
  const extractingRef = useRef(false); // §2: one extraction credit per run
  const fightRef = useRef(null); // §10: latest fight for finishFightToLoot (no setter inside an updater)
  const [fightNode, setFightNode] = useState(() => R0?.fightNode || null);
  const [fight, setFight] = useState(() => R0?.fight || null); // { enemies, derived, events, result, stats, rewards, named, rare }
  useEffect(() => { fightRef.current = fight; }, [fight]);
  const [fightElapsed, setFightElapsed] = useState(() => R0?.fight?.result?.durationMs || 0);
  const [fightSpeed, setFightSpeed] = useState(1);
  const runRng = useRef(R0 ? countedRng(R0.seed, R0.rngCount || 0) : Math.random);
  const runSeed = useRef(R0?.seed || 1);
  const fightIndex = useRef(R0?.fightIndex || 0);
  const fightTimers = useRef({ tick: null });
  const fightSpeedRef = useRef(1);
  useEffect(() => { fightSpeedRef.current = fightSpeed; }, [fightSpeed]);
  const afkRef = useRef(afk);
  const inventoryRef = useRef(inventory);
  const bagRef = useRef(bag);
  const worldveinRef = useRef(worldvein);
  const partyRef = useRef(party);
  const rosterRef = useRef(roster);
  const unlockedRef = useRef(unlocked);
  useEffect(() => { afkRef.current = afk; }, [afk]);
  const craftRef = useRef(craft);
  useEffect(() => { craftRef.current = craft; }, [craft]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => { bagRef.current = bag; }, [bag]);
  useEffect(() => { worldveinRef.current = worldvein; }, [worldvein]);
  useEffect(() => { partyRef.current = party; }, [party]);
  useEffect(() => { rosterRef.current = roster; }, [roster]);
  useEffect(() => { unlockedRef.current = unlocked; }, [unlocked]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);
  // ---- save snapshot on every persisted transition (debounced ≤ 1 s; flushed on hide/unload) ----
  useEffect(() => {
    const inRunStage = territory && ['route', 'fight', 'loot', 'sanctuary'].includes(runStage);
    const run = inRunStage ? {
      areaId: area?.id, runStage, currentId, prevId, territory, runParty, runHp, runMods, runVein, partyHP, log, logSeen,
      logSeq: logSeq.current, fight, fightNode, cameraPan: camera.pan, seed: runSeed.current,
      rngCount: typeof runRng.current?.count === 'number' ? runRng.current.count : 0, fightIndex: fightIndex.current,
    } : null;
    SAVER.schedule({ tab, party, roster, worldvein, bag, inventory, unlocked, afk, afkSavedAt: Date.now(), player: { upgrades: playerUpgrades }, run });
  }, [tab, party, roster, worldvein, bag, inventory, unlocked, afk, playerUpgrades, runStage, area, territory, currentId, prevId, runParty, runHp, runMods, runVein, partyHP, log, logSeen, fight, fightNode, camera.pan]);
  useEffect(() => {
    if (BOOT.reset) doFlash('Save reset for a game update', colors.mythros); // Item Model §9: older saves are discarded while M2–M3 build
    else if (BOOT.quarantined) doFlash('Save was unreadable — started fresh (copy kept)', colors.mindDanger);
    if (R0 && ['loot', 'sanctuary', 'fight'].includes(R0.runStage)) enterMindView();
    return () => SAVER.flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // §6 true idle: reconcile wall-clock time on every tick, on app resume (visibilitychange) and on open
  // (the first tick). A span longer than 60 s with anything accrued opens the Offline summary sheet.
  useEffect(() => {
    const reconcile = () => {
      const patch = reconcileAfk({
        state: afkRef.current, inventory: inventoryRef.current, bag: bagRef.current, worldvein: worldveinRef.current,
        party: partyRef.current, roster: rosterRef.current, unlocked: unlockedRef.current, now: Date.now(), craft: craftRef.current,
      });
      if (!patch) return;
      afkRef.current = patch.next; // the next tick must not re-run this span before React commits
      setAfk(patch.next);
      if (patch.inv !== inventoryRef.current) { inventoryRef.current = patch.inv; setInventory(patch.inv); }
      if (patch.bag !== bagRef.current) { bagRef.current = patch.bag; setBag(patch.bag); }
      if (patch.vein !== worldveinRef.current) { worldveinRef.current = patch.vein; setWorldvein(patch.vein); }
      if (patch.partyNext) { partyRef.current = patch.partyNext; setParty(patch.partyNext); }
      if (patch.rosterNext) { rosterRef.current = patch.rosterNext; setRoster(patch.rosterNext); }
      if (wantsOfflineSummary(patch.summary)) setOffline(patch.summary);
    };
    reconcile();
    const id = window.setInterval(reconcile, AFK_TICK_MS);
    const onVis = () => { if (!document.hidden) reconcile(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  useEffect(() => {
    setHubSkinForTab(tab);
    const wantMind = tab === 'mountain' && MIND_STAGES.has(runStage);
    if (wantMind) enterMindView(); else exitMindView();
  }, [tab, runStage, setHubSkinForTab, enterMindView, exitMindView]);
  useEffect(() => () => { clearFightTimers(); if (travelTimer.current) window.clearTimeout(travelTimer.current); if (overlayTimer.current) window.clearTimeout(overlayTimer.current); }, []);

  // Tab re-tap pops to root (brief 2026-09-15): the tab's screen remounts (sub-state + scroll reset) via
  // its `rootKey`; Rally goes back to the island; a live run stays on the route map.
  const [rootKey, setRootKey] = useState({});
  /** TEMPORARY test kit (Settings → Grant test gems): gems on the party, every class in the bag, fragments + Worldvein. Not offered mid-run. */
  function grantGems() {
    const r = grantTestGems({ party, bag, worldvein });
    setParty(r.party); setBag(r.bag); setWorldvein(r.worldvein);
    trace('debug', { testGems: true, equipped: r.equipped.length });
    return `${r.equipped.length ? `Equipped: ${r.equipped.map((e) => `${e.name} · ${e.gem}`).join(', ')}. ` : 'The party already wears gems. '}Added ${r.spares.length} spare gems to the Bag and +${TEST_KIT.worldvein.toLocaleString()} ❖.`;
  }
  /** Buy one level of a Veinbinder upgrade — capped at the current Resonance rank, paid in Worldvein. */
  function buyUpgrade(id) {
    const check = canBuy(playerUpgrades, id, { rank: rankFor(resonance([...party, ...roster])), worldvein });
    if (!check.ok) return;
    setWorldvein((v) => v - check.cost);
    setPlayerUpgrades((u) => buy(u, id));
    if (id === 'hearth') setAfk((a) => withGatherSlots(a, gatherSlotCount(craftMods(buy(playerUpgrades, id)).extraSlots)));
    trace('player', { buy: id, level: check.level + 1, cost: check.cost });
  }
  function selectTab(id) {
    setLatticeGemId(null); // the Lattice belongs to the screen it was opened from
    if (id === tab) {
      const action = retapAction(id, { runStage, inRun: !!territory });
      trace('tab', { id, retap: action });
      if (action === 'stay') return;
      if (action === 'island') { setSelectedArea(null); setRunStage('island'); }
      setRootKey((k) => ({ ...k, [id]: (k[id] || 0) + 1 }));
      return;
    }
    trace('tab', { id }); setTab(id); setHubSkinForTab(id);
  }
  function pushLog(t, k = 'n') { logSeq.current += 1; const id = logSeq.current; setLog((l) => [...l, { id, t, k, clock: territoryRef.current?.clock ?? null }]); }
  const territoryRef = useRef(null);
  useEffect(() => { territoryRef.current = territory; }, [territory]);
  function doFlash(msg, color) { setFlash({ msg, color }); setTimeout(() => setFlash(null), 1400); }
  function clearFightTimers() {
    const ft = fightTimers.current;
    if (ft.tick) window.clearInterval(ft.tick);
    fightTimers.current = { tick: null };
  }
  function resetRunToIsland() {
    clearFightTimers(); exitMindView(); setRunStage('island'); setSelectedArea(null);
    setTerritory(null); setArea(null); setCurrentId(null); setRunVein(0); setFightNode(null);
    setFight(null); setFightElapsed(0); setFightSpeed(1); setRunHp(null); setRunParty(null); extractingRef.current = false;
    clearTravel(); setTravel(null); setAmbush(null); setCard(null); setPrevId(null); dispatchCamera({ type: 'set', pan: null }); setOverlayLeaving(null);
    setRunMods({ dmgMult: 1, mitAdd: 0 }); setBusy(false);
    setAfk((s) => resumeJobs(s, Date.now())); // §6: back from the run — suspended jobs resume from now
  }

  // ---------- island → rally → route ----------
  function onSelectArea(a) { trace('island', { pin: a.id, name: a.name }); setSelectedArea(a); setRunStage('rally'); }
  function onRallyBack() { trace('rally', { back: true }); setSelectedArea(null); setRunStage('island'); }
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
    runRng.current = countedRng(runSeed.current); // counted so a resumed run continues the same stream
    fightIndex.current = 0;
    const t = genTerritory(a, { rng: runRng.current });
    trace('run', { start: a.name, seed: runSeed.current, nodes: t.nodes.length, rares: t.rares.length, entrance: t.entranceId });
    // M1d: a state snapshot at run start so a trace can be reproduced — build, party (level / gear), banked Worldvein, unlocks
    if (isTraceOn()) {
      trace('snapshot', {
        build: BUILD, tier: a.tier, worldvein, unlocked,
        party: fielded.map((m) => ({ id: m.id, name: m.name, arch: m.archetype, lv: m.level, xp: Math.floor(m.xp || 0), weapon: m.weaponItem ? `T${m.weaponItem.tier} ${m.weaponItem.rarity} ${m.weaponItem.type} ${m.weaponItem.rating}+${m.weaponItem.empower || 0}` : 'unarmed', armor: (m.armorItems || []).map((a) => `T${a.tier} ${a.rarity} ${a.type} ${a.rating}`) })),
        bag: bag.length,
      });
    }
    setArea(a); setTerritory(t); setCurrentId(t.entranceId); setCard(null);
    dispatchCamera({ type: 'runStart', partyId: t.entranceId }); // the only centring of a run: its first frame
    setLog([{ t: `You unroll the route map. ${a.name} lies unexplored beyond the entry — ${t.rares.length} rares roam it (optional hunts, big loot) and ${a.boss} waits at the far end.`, k: 'sys' }]);
    setRunHp(null); setRunParty(party.map((m) => ({ ...m }))); setRunMods({ dmgMult: 1, mitAdd: 0 }); setLogSeen(0);
    setAfk((s) => suspendJobs(s, party.map((m) => m.id), Date.now())); // §6: deployed characters' jobs pause
    setPartyHP(1); setRunVein(0); setRunStage('route');
  }

  // ---------- node-action clock ----------
  /** Scout/clear action clock (v3 §6): rares may roam — onto the party's node = ambush. Returns the new territory. */
  const lastClockEvents = useRef([]);
  function advanceClock(t, curId) {
    const { territory: next, events } = tickClock(t, { currentId: curId, rng: runRng.current });
    lastClockEvents.current = events;
    for (const e of events) {
      if (e.type === 'rareMoved') {
        if (e.ontoParty) pushLog('☠ A rare falls upon the party!', 'rare');
        else if (e.visible) pushLog('☠ A rare prowls onto a node you have seen.', 'rare'); // §15: the icon changes only on a revealed node
      }
    }
    return next;
  }
  /**
   * After an action: a rare that ROAMED onto the party's node ambushes (v3 §3/§6/§15 — the flee roll
   * applies only then). `movedOnly` ignores a rare that was already standing on the node the party
   * just explored onto: that node reveals as a rare with a free Flee instead.
   */
  function maybeAmbush(t, curId, prev, { movedOnly = false } = {}) {
    const r = rareAt(t, curId);
    if (!r) return false;
    if (movedOnly && !lastClockEvents.current.some((e) => e.type === 'rareMoved' && e.ontoParty && e.rareId === r.id)) return false;
    window.setTimeout(() => openAmbush(t, { kind: 'rare', nodeId: curId, rareId: r.id, prevId: prev }), 0);
    return true;
  }

  // ---------- scout → engage / leave ----------
  function depthMultFor(n) { return 1 + 0.5 * (n.depth01 || 0); }
  function enemiesFor(t, n, rng) {
    const eff = effectiveType(t, n);
    if (eff === 'sanctuary') return [];
    return spawnEnemies(area.tier, eff, false, { rng, bossName: area.boss, depthMult: eff === 'rare' || eff === 'boss' ? 1 : depthMultFor(n), named: !!n.namedRare });
  }
  /** §15 reveal card: type, enemy count, threat band, yield — Fight / Flee (Sanctuary: Use / Leave). */
  function buildReveal(t, n, { onNode }) {
    const eff = effectiveType(t, n);
    const rng = mulberry32((runSeed.current ^ Math.imul(Number(n.id.slice(1)) + 1, 0x85ebca6b)) >>> 0);
    const enemies = enemiesFor(t, n, rng);
    let threat = null;
    if (enemies.length) {
      let wins = 0;
      for (let i = 0; i < THREAT_DRY_RUNS; i++) {
        const r = simulateFight({ party: fielded, enemies: enemies.map((e) => ({ ...e })), seed: i * 7919 + 1, startHpFrac: hpArrFor(fielded), runMods });
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
    if (eff === 'sanctuary') { body = 'A wild healing crystal. No fight.'; yieldText = 'Full HP + mana, revives the fallen, and one bonus for this run.'; }
    else if (eff === 'crystal') { body = `${count} enem${count === 1 ? 'y guards' : 'ies guard'} a Vein deposit.`; yieldText = '×2 Worldvein on victory.'; }
    else if (eff === 'rare') { body = `A roaming rare${named ? ' — named, ×1.3 stats' : ''}. Big loot; may drop a class gem.`; }
    else if (eff === 'boss') { const left = raresAlive(t); body = `${area.boss} waits.${left ? ` ${left} rare${left === 1 ? '' : 's'} still roam — optional.` : ''}`; }
    else { body = `${count} enem${count === 1 ? 'y' : 'ies'}${named ? ' — named, ×1.3 stats, +1 loot roll' : ''}.`; }
    if (eff === 'sanctuary') {
      return { kind: 'reveal', nodeId: n.id, onNode, type: eff, glyph: TYPE_GLYPH[eff], title, body, yieldText, threat: null, enemies, actions: [{ id: 'leave', label: 'Leave', ghost: true }, { id: 'use', label: 'Use' }] };
    }
    return { kind: 'reveal', nodeId: n.id, onNode, type: eff, glyph: TYPE_GLYPH[eff], title, body, yieldText, threat, enemies, tier: area.tier, actions: [{ id: 'flee', label: 'Flee', ghost: true }, { id: 'fight', label: 'Fight' }] };
  }
  /** §15 explore card: rune, "Unexplored", hops away — Explore / Cancel. Nothing moves until Explore. */
  function buildExplore(n, hops) {
    return { kind: 'explore', nodeId: n.id, type: null, color: '#5b6a8a', glyph: 'ᚱ', title: nodeState(n) === 'revealed' ? 'Revealed — not adjacent' : 'Unexplored', tag: `${hops} hop${hops === 1 ? '' : 's'} away`, body: nodeState(n) === 'revealed' ? 'The party must travel there before acting on it.' : 'Nothing is known until the party stands on it. Explore commits the party to travel there.', yieldText: null, threat: null, actions: [{ id: 'cancel', label: 'Cancel', ghost: true }, { id: 'explore', label: 'Explore' }] };
  }
  // ---------- §15/§16 travel: Explore commits the party; the trip is one continuous tween ----------
  function clearTravel() {
    if (travelTimer.current) { window.clearTimeout(travelTimer.current); travelTimer.current = null; }
  }
  /**
   * §16 (amended, slower): the trip is ONE continuous tween run by RouteMapScreen (900 ms/hop, eased at the ends).
   * Travel is FREE (§6): no clock ticks, no interruptions. On arrival the party stands on the
   * destination, then (§12) a 200 ms pause before the card opens.
   */
  function beginTrip(path, after) {
    if (!path || path.length < 2) { if (after) runAfter(territory, currentId, after); return; }
    trace('trip', { start: path[0], to: path[path.length - 1], hops: path.length - 1, ms: travelDuration(path.length - 1), after: after?.type || null });
    setCard(null); setAmbush(null);
    setTravel({ path, startTs: performance.now(), duration: travelDuration(path.length - 1), after, skipAt: null });
  }
  function onTravelEnd() {
    const tr = travel; if (!tr) return;
    const dest = tr.path[tr.path.length - 1];
    trace('trip', { arrived: dest, elapsed: Math.round(performance.now() - tr.startTs), skipped: tr.skipAt != null });
    setPrevId(tr.path[tr.path.length - 2] || currentId);
    setCurrentId(dest);
    setTravel(null);
    if (tr.after) travelTimer.current = window.setTimeout(() => runAfter(territoryRef.current || territory, dest, tr.after), CARD_PAUSE_MS);
  }
  function skipTrip() {
    trace('trip', { skip: true });
    setTravel((tr) => (tr && tr.skipAt == null ? { ...tr, skipAt: performance.now() } : tr));
  }
  /** Arrival: the node the party now stands on becomes Revealed and its card opens. */
  function runAfter(t, curId, after) {
    if (!after) return;
    if (after.type === 'settle') { maybeAmbush(t, curId, null); return; }
    const n = t.nodes.find((x) => x.id === after.nodeId);
    if (after.type === 'fight') { if (n) startFight(n, { enemies: after.enemies }); return; }
    if (after.type === 'use') { if (n) { setFightNode(n); setRunStage('sanctuary'); enterMindView(); } return; }
    if (after.type !== 'arrive') return;
    if (!n) return;
    revealOnArrival(t, curId, n);
  }
  function revealOnArrival(t, curId, n) {
    if (!n.scouted) {
      // exploring is a node-action: the clock ticks (rares may roam — onto the party = ambush)
      let next = scoutNode(t, n.id);
      next = advanceClock(next, curId);
      setTerritory(next);
      const nn = next.nodes.find((x) => x.id === n.id);
      const eff = effectiveType(next, nn);
      pushLog(`👁 Explored: a ${NODE_LABEL[eff] || 'node'} node${nn.namedRare && eff === 'normal' ? ' (named)' : ''}.`, 'sys');
      if (maybeAmbush(next, curId, prevId, { movedOnly: true })) return;
      setCard(buildReveal(next, nn, { onNode: true }));
      return;
    }
    setCard(buildReveal(t, n, { onNode: true }));
  }
  /**
   * §15 tap: never moves the party. Party node / completed node → nothing. Unexplored, or revealed
   * but not adjacent → Explore / Cancel. Revealed + adjacent → the reveal card directly.
   */
  function onTapNode(n) {
    if (busy || !territory) { trace('tap', { node: n?.id || null, ignored: busy ? 'busy' : 'no-territory' }); return; }
    if (travel) { skipTrip(); return; } // tap anywhere while travelling = eased skip
    if (!n || n.id === currentId || ambush) { trace('tap', { node: n?.id || null, ignored: !n ? 'no-node' : n.id === currentId ? 'party-node' : 'ambush-open' }); return; }
    const t = territory;
    const st = nodeState(n);
    if (st === 'completed') { trace('tap', { node: n.id, state: st, ignored: 'completed' }); return; }
    const adjacent = isAdjacent(t, currentId, n.id);
    trace('tap', { node: n.id, state: st, type: n.scouted ? effectiveType(t, n) : 'hidden', adjacent, card: st === 'revealed' && adjacent ? 'reveal' : 'explore' });
    if (st === 'revealed' && adjacent) {
      setCard(buildReveal(t, n, { onNode: false }));
      return;
    }
    const path = explorePath(t, currentId, n.id);
    if (!path) return;
    // camera: the map itself pans slowly to centre the tapped node (never a snap)
    setCard(buildExplore(n, path.length - 1));
  }
  /** One handler for every card button (§15). */
  function onCardAction(id) {
    trace('card', { action: id, kind: ambush ? 'ambush' : card?.kind || null, node: ambush?.nodeId || card?.nodeId || null });
    // the ambush card is derived from `ambush`, not `card` — route its buttons first (a null `card` must not swallow them)
    if (id === 'ambushFight') { onAmbushFight(); return; }
    if (id === 'ambushFlee') { onAmbushFlee(); return; }
    const c = card; if (!c || !territory) return;
    const n = territory.nodes.find((x) => x.id === c.nodeId); if (!n) return;
    switch (id) {
      case 'cancel': setCard(null); pushLog('· Cancelled — the party holds.', 'sys'); return;
      case 'explore': {
        const path = explorePath(territory, currentId, n.id); if (!path) { setCard(null); return; }
        pushLog(`→ Explore: ${path.length - 1} hop${path.length - 1 === 1 ? '' : 's'} to a${nodeState(n) === 'revealed' ? ' revealed' : 'n unexplored'} node.`, 'sys');
        beginTrip(path, { type: 'arrive', nodeId: n.id });
        return;
      }
      case 'flee': {
        setCard(null);
        if (c.onNode && prevId && prevId !== currentId) {
          // chosen flee: a free step back to the previous node, no roll, node stays Revealed
          pushLog('↩ Flee — the party steps back. The node stays revealed.', 'good');
          beginTrip([currentId, prevId], null);
        } else pushLog('↩ Flee — the party holds its ground.', 'good');
        return;
      }
      case 'fight': {
        setCard(null);
        pushLog(`⚔ Fight — ${c.title}.`, 'sys');
        // adjacent revealed node: the party PANS onto it (one eased hop), then the fight opens — never a jump
        if (!c.onNode) { beginTrip([currentId, n.id], { type: 'fight', nodeId: n.id, enemies: c.enemies }); return; }
        startFight(n, { enemies: c.enemies });
        return;
      }
      case 'use': {
        setCard(null);
        if (!c.onNode) { beginTrip([currentId, n.id], { type: 'use', nodeId: n.id }); return; }
        trace('overlay', { open: 'sanctuary', node: n.id });
        setFightNode(n); setRunStage('sanctuary'); enterMindView();
        return;
      }
      case 'leave': {
        // Leave = the same free step back as a chosen Flee: the crystal stays revealed and adjacent, so it can be
        // used later from the reveal card. (Standing on it would dead-end the party — the party node tap does nothing.)
        setCard(null);
        pushLog('✧ The crystal is left unused — it stays revealed.', 'sys');
        if (c.onNode && prevId && prevId !== currentId) beginTrip([currentId, prevId], null);
        return;
      }
      default:
    }
  }

  // ---------- v3 §3 ambush + flee ----------
  function openAmbush(t, halt) {
    const node = t.nodes.find((x) => x.id === halt.nodeId);
    if (!node) return;
    trace('ambush', { node: node.id, kind: halt.kind, prev: halt.prevId || null });
    const isRare = halt.kind === 'rare';
    const rng = mulberry32((runSeed.current ^ Math.imul(t.clock + 7, 0x27d4eb2f)) >>> 0);
    const enemies = enemiesFor(t, node, rng);
    const chance = fleeChance(fielded, isRare);
    const count = enemies.length;
    setCard(null);
    setAmbush({
      nodeId: node.id, prevId: halt.prevId, kind: halt.kind, enemies, fleeChance: chance,
      type: isRare ? 'rare' : effectiveType(t, node),
      title: isRare ? 'Rare ambush' : 'Ambush',
      body: isRare
        ? `A roaming rare — ${enemies[0]?.name || 'a rare'}. Fight it, or try to slip away.`
        : `${count} enem${count === 1 ? 'y' : 'ies'} block the way${node.namedRare ? ' — a NAMED one' : ''}.`,
      yieldText: `Flee: ${Math.round(chance * 100)}% — success steps the party back one node; failure lets them strike first.`,
    });
    pushLog(isRare ? '☠ Ambush — a rare is on you!' : '✦ Ambush!', 'rare');
  }
  const ambushCard = ambush ? {
    kind: 'ambush', nodeId: ambush.nodeId, type: ambush.type, glyph: '☠', title: ambush.title, body: ambush.body, yieldText: ambush.yieldText, threat: null, enemies: ambush.enemies,
    actions: [{ id: 'ambushFlee', label: `Flee (${Math.round(ambush.fleeChance * 100)}%)`, ghost: true }, { id: 'ambushFight', label: 'Fight' }],
  } : null;
  function onAmbushFight() {
    const a = ambush; if (!a || !territory) return;
    const n = territory.nodes.find((x) => x.id === a.nodeId); if (!n) return;
    setAmbush(null);
    pushLog('⚔ Ambush — the party stands and fights.', 'rare');
    startFight(n, { enemies: a.enemies, ambush: true });
  }
  function onAmbushFlee() {
    const a = ambush; if (!a || !territory) return;
    const pct = Math.round(a.fleeChance * 100);
    if (runRng.current() < a.fleeChance) {
      setAmbush(null);
      const back = a.prevId && a.prevId !== currentId ? a.prevId : currentId;
      setTerritory(advanceClock(territory, back)); // costs one node-action; the ambusher stays
      pushLog(`↩ Fled (${pct}%). The party falls back.`, 'good');
      doFlash('Fled', colors.mindGood);
      // every movement is a pan (one eased hop), never a jump; a rare that roamed onto `back` ambushes on arrival
      if (back !== currentId) beginTrip([currentId, back], { type: 'settle' });
      return;
    }
    pushLog(`✖ Flee failed (${pct}%) — they strike first.`, 'bad');
    const n = territory.nodes.find((x) => x.id === a.nodeId);
    setAmbush(null);
    startFight(n, { enemies: a.enemies, ambush: true, enemyFirst: true });
  }
  // ---------- sanctuary ----------
  function onSanctuaryChoose(bonusId) {
    const n = fightNode; if (!n || !territory) return;
    // pan to centre, slowly: the camera glides onto the party as the overlay fades (never a snap)
    dispatchCamera({ type: 'overlayClose', partyId: n.id });
    applySanctuary(bonusId);
  }
  function applySanctuary(bonusId) {
    const n = fightNode; if (!n || !territory) return;
    const pouch = 10 * area.tier; // DESIGN-OPEN: pouch size
    if (bonusId === 'dmg') { setRunMods((m) => ({ ...m, dmgMult: m.dmgMult + 0.1 })); pushLog('✧ Sanctuary: the bond strikes +10% harder this run.', 'heal'); }
    if (bonusId === 'mit') { setRunMods((m) => ({ ...m, mitAdd: m.mitAdd + 0.1 })); pushLog('✧ Sanctuary: the bond takes 10% less this run.', 'heal'); }
    if (bonusId === 'vein') { setRunVein((v) => v + pouch); pushLog(`✧ Sanctuary: a pouch of ${pouch} Worldvein.`, 'loot'); }
    setRunHp(Object.fromEntries(fielded.map((m) => [m.id, 1]))); setPartyHP(1);
    pushLog('✧ The party rests at the crystal — healed, restored, the fallen revived.', 'heal');
    let t = { ...territory, nodes: territory.nodes.map((x) => (x.id === n.id ? { ...x, sanctuaryUsed: true } : x)) };
    t = clearNode(t, n.id, runRng.current);
    t = advanceClock(t, n.id);
    fadeOutOverlay('sanctuary');
    setTerritory(t); setFightNode(null); setRunStage('route'); setCard(null);
    maybeAmbush(t, n.id, prevId);
  }

  // ---------- fights ----------
  const finishFightToLoot = useCallback(() => {
    if (fightTimers.current.finished) return; // the playback tick and Skip can both land here
    clearFightTimers();
    fightTimers.current.finished = true; // (clearFightTimers resets the record; startFight clears it for the next fight)
    const f = fightRef.current; if (f) setFightElapsed(f.result.durationMs); // §10: no setter inside an updater
    trace('overlay', { open: 'results' });
    setRunStage('loot'); setBusy(false);
  }, []);
  function startFight(n, opts = {}) {
    if (busy || !territory) return;
    clearFightTimers(); setBusy(true); setCard(null); setAmbush(null); clearTravel(); setTravel(null);
    const t = { ...territory, nodes: territory.nodes.map((x) => (x.id === n.id ? { ...x, typeKnown: true, scouted: true } : x)) };
    setTerritory(t);
    const eff = effectiveType(t, n);
    const rare = rareAt(t, n.id);
    pushLog(`→ ${opts.ambush ? 'Ambushed at' : 'Engaging'} a ${NODE_LABEL[eff] || 'node'} node…`, 'sys');
    fightIndex.current += 1;
    const seed = (runSeed.current ^ Math.imul(fightIndex.current, 0x9e3779b1)) >>> 0;
    const rng = mulberry32(seed ^ 0x5bd1e995);
    let enemies = (opts.enemies && opts.enemies.length ? opts.enemies : enemiesFor(t, n, rng)).map((e) => ({ ...e }));
    // TEMPORARY (Anthony, 2026-09-20): Settings → Test fight length — pack fights rescaled to ~16 s. Remove before TestFlight.
    if (isTestFightLength() && eff !== 'boss' && eff !== 'rare' && enemies.length) {
      const tuned = tuneFightLength({ party: fielded, enemies, seed, startHpFrac: hpArrFor(fielded), runMods, enemyFirst: !!opts.enemyFirst });
      enemies = tuned.enemies; pushLog(`Test fight length: enemy health ×${tuned.hpMult.toFixed(2)}, damage ×${tuned.dmgMult.toFixed(2)} → ${tuned.sec.toFixed(1)} s`, 'sys');
    }
    const sim = simulateFight({ party: fielded, enemies, seed, startHpFrac: hpArrFor(fielded), runMods, enemyFirst: !!opts.enemyFirst });
    const bossKill = sim.result.win && eff === 'boss';
    const mapClear = bossKill && allCleared({ ...t, nodes: t.nodes.map((x) => (x.id === n.id ? { ...x, cleared: true } : x)) });
    const rewards = sim.result.win
      ? rollRewards({ area: area.id, nodeType: eff, attuneVein: sim.result.attuneVein, rng, named: !!n.namedRare, mapClear, bossName: eff === 'boss' ? area.boss : null, veinMult: craft.veinMult, oneUpChance: craft.oneUpChance })
      : null;
    const derived = fielded.map((m) => deriveStats(m));
    // Progression Loop Lock §3: fight XP on a win, split evenly, the fallen at half; applied at Continue
    let xp = null;
    if (sim.result.win) {
      const total = Math.round(fightXp(enemies, area.tier));
      const gains = splitXp(total, fielded, sim.result.partyHpFrac);
      const per = fielded.map((m, i) => {
        const r = applyXp(m, gains[i]);
        return { id: m.id, name: m.name, gain: gains[i], fallen: (sim.result.partyHpFrac[i] ?? 1) <= 0, from: m.level || 1, to: r.member.level, levelsGained: r.levelsGained, xpAfter: Math.floor(r.member.xp), xpNeeded: xpToNext(r.member.level) };
      });
      // Growth Model §1: every level-up feeds the gem its Adventurer WEARS (shown on Results, credited at Continue)
      const fragments = awardLevelFragments(bagRef.current, fielded.map((m, i) => ({ member: m, levelsGained: per[i].levelsGained }))).awards;
      xp = { total, per, fragments };
    }
    setFight({ enemies, derived, events: sim.events, result: sim.result, stats: sim.stats, rewards, xp, seed, named: !!n.namedRare, rare: !!rare, eff, mapClear, ambush: !!opts.ambush });
    setFightNode({ ...n, tier: area.tier, type: eff });
    setFightElapsed(0); setFightSpeed(1);
    trace('overlay', { open: 'fight', node: n.id, type: eff, win: sim.result.win, durMs: sim.result.durationMs, ambush: !!opts.ambush });
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
  /** Keep the last overlay rendered for 350 ms while it fades out (§13 single crossfade). */
  function fadeOutOverlay(kind) {
    trace('overlay', { close: kind, fadeMs: OVERLAY_FADE_MS });
    setOverlayLeaving({ kind, fight, fightNode, area });
    if (overlayTimer.current) window.clearTimeout(overlayTimer.current);
    overlayTimer.current = window.setTimeout(() => setOverlayLeaving(null), OVERLAY_FADE_MS);
  }
  function onResultsContinue() {
    const f = fight; const n = fightNode;
    if (f && n && territory && f.result.win && f.eff !== 'boss') {
      // pan to centre, slowly: the camera glides onto the party as Results fades (never a snap)
      dispatchCamera({ type: 'overlayClose', partyId: n.id });
    }
    applyLootAndReturnToRoute();
  }
  function applyLootAndReturnToRoute() {
    const f = fight; const n = fightNode;
    if (f && n && territory && f.result.win && f.eff !== 'boss') fadeOutOverlay('loot');
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
    const lastRareDown = f.rare && raresAlive(t) === 0;
    t = advanceClock(t, n.id);
    setTerritory(t);
    setPartyHP(res.hpPct); setRunHp(Object.fromEntries(fielded.map((m, i) => [m.id, res.partyHpFrac[i] ?? 1])));
    setRunVein((v) => v + (rewards?.worldvein || 0));
    pushLog(`✔ Cleared in ${res.durationSec}s. +${rewards?.worldvein || 0} Worldvein.${f.eff === 'crystal' ? ' The deposit splinters — ×2 harvest.' : ''}`, 'good');
    for (const g of rewards?.gears || []) { setBag((b) => [...b, g]); pushLog(`  ⬥ Loot: ${plainName(g)} (${g.rating}/100)`, 'loot'); }
    for (const g of rewards?.gems || []) { setBag((b) => [...b, g]); pushLog(`  ◆ Loot: ${g.name} — a class gem!`, 'loot'); }
    if (f.xp) applyFightXp(f.xp);
    if (f.rare) pushLog(`☠ Rare slain. ${t.rares.filter((r) => r.alive).length} remain.`, 'rare');
    if (lastRareDown) { pushLog('☠ Every rare on this map is slain.', 'rare'); doFlash('All rares slain', colors.mythros); }
    if (f.eff === 'boss') {
      pushLog(`${area.boss} is defeated. ${area.name} is cleared.${f.mapClear ? ' Every node cleared — map-clear bonus!' : ''}`, 'boss');
      doFlash(`${area.name} cleared!`, area.accent);
      setUnlocked((u) => Math.max(u, area.id + 1));
      setWorldvein((v) => v + runVein + (rewards?.worldvein || 0));
      clearFightTimers(); setFightNode(null); setFight(null);
      resetRunToIsland(); setTab('mountain'); setHubSkinForTab('mountain'); return;
    }
    clearFightTimers(); setFightNode(null); setFight(null); setBusy(false); setRunStage('route'); setCard(null);
    maybeAmbush(t, n.id, prevId);
  }
  /** §3: credit the fight's XP to the run party AND the persistent Adventurers (by id); log level-ups. */
  function applyFightXp(xp) {
    const gainOf = Object.fromEntries(xp.per.map((p) => [p.id, p.gain]));
    const bump = (m) => (gainOf[m.id] != null ? applyXp(m, gainOf[m.id]).member : m);
    setRunParty((rp) => (rp ? rp.map(bump) : rp));
    setParty((p) => p.map(bump));
    setRoster((r) => r.map(bump));
    pushLog(`  ✦ +${xp.total} XP shared by the bond.`, 'good');
    for (const p of xp.per) if (p.levelsGained) { pushLog(`  ✦ ${p.name} reaches level ${p.to}!`, 'good'); }
    // the worn gems grow: 1 Vein Fragment per level gained (an unequipped gem gains nothing)
    const all = [...party, ...roster];
    const gains = xp.per.filter((p) => p.levelsGained).map((p) => ({ member: all.find((m) => m.id === p.id), levelsGained: p.levelsGained })).filter((g) => g.member);
    if (gains.length) {
      setBag((b) => awardLevelFragments(b, gains).bag);
      for (const a of awardLevelFragments(bagRef.current, gains).awards) pushLog(`  ◆ ${fragmentLine(a)}`, 'good');
    }
  }
  function extract() {
    if (extractingRef.current) return; // §2: a second tap before the 600 ms reset must not credit twice
    extractingRef.current = true;
    trace('run', { extract: true, vein: runVein });
    pushLog(`⇱ Extracted with ${runVein} Worldvein banked.`, 'good');
    doFlash(`Extracted ${runVein} Worldvein`, colors.mythros);
    setWorldvein((v) => v + runVein);
    setTimeout(() => { resetRunToIsland(); setTab('mountain'); setHubSkinForTab('mountain'); }, 600);
  }

  // ---------- AFK handlers ----------
  // §8: assigning a character to a job clears them from any other job (assignJob); other fields patch in place
  function onUpdateGatherSlot(index, patch) {
    const { charKey, ...rest } = patch;
    setAfk((a) => {
      const base = 'charKey' in patch ? assignJob(a, { kind: 'gather', index }, charKey) : a;
      return Object.keys(rest).length ? { ...base, gatherSlots: base.gatherSlots.map((s, i) => (i === index ? { ...s, ...rest } : s)) } : base;
    });
  }
  function onToggleGather(index) {
    setAfk((a) => ({ ...a, gatherSlots: a.gatherSlots.map((s, i) => (i !== index || !s.charKey ? s : toggleJob(s, Date.now()))) }));
  }
  function onUpdateProcess(patch) {
    const { charKey, ...rest } = patch;
    setAfk((a) => { const base = 'charKey' in patch ? assignJob(a, { kind: 'process' }, charKey) : a; return Object.keys(rest).length ? { ...base, process: { ...base.process, ...rest } } : base; });
  }
  function onToggleProcess() {
    setAfk((a) => (a.process.charKey ? { ...a, process: toggleJob(a.process, Date.now()) } : a));
  }
  function onUpdateIdle(patch) {
    const { charKey, ...rest } = patch;
    setAfk((a) => { const base = 'charKey' in patch ? assignJob(a, { kind: 'idle' }, charKey) : a; return Object.keys(rest).length ? { ...base, idle: { ...base.idle, ...rest } } : base; });
  }
  function onToggleIdle() {
    setAfk((a) => (a.idle.charKey ? { ...a, idle: toggleJob(a.idle, Date.now()) } : a));
  }

  // Screen id for the ? help sheet — every tab root and every drilled-in screen.
  const screenId = tab === 'mountain'
    ? (runStage === 'route' && (card || ambush) ? 'scout' : { island: 'island', rally: 'rally', route: 'route', fight: 'fight', loot: 'results', sanctuary: 'sanctuary' }[runStage] || 'island')
    : { player: 'player', party: 'party', town: 'town', afk: 'hearth' }[tab] || 'basics';
  const inRun = tab === 'mountain' && !!territory && runStage !== 'island' && runStage !== 'rally';
  const canExtract = inRun && runStage === 'route'; // DESIGN-OPEN: menu Extract mid-fight/results is held until the fight resolves
  const mountainHubLabel = { island: 'The Island', rally: 'Rally', route: 'Route Map', fight: 'Combat', loot: 'Spoils', sanctuary: 'Sanctuary' }[runStage] || HUB_LABELS.mountain;
  return (
    <div className="eld-page" style={S.root}>
      <style>{BASE_CSS}</style>
      <Frame style={S.frame}>
        <Header worldvein={worldvein} hubLabel={tab === 'mountain' ? mountainHubLabel : HUB_LABELS[tab]} actions={<ScreenHeaderActions onMenu={() => setSheet('menu')} onHelp={() => setSheet('help')} />} />
        {flash && <div style={{ ...S.flash, borderColor: flash.color, color: flash.color }}>{flash.msg}</div>}
        <div className="eld-tab-view" key={tab} data-tab={tab}>
        {latticeGem && (
          <LatticeScreen
            gem={latticeGem}
            wearer={[...party, ...roster].find((m) => m.equipped?.gem === latticeGem.id) || null}
            worldvein={worldvein}
            onSpend={(cost) => setWorldvein((v) => Math.max(0, v - cost))}
            onChangeGem={(next) => setBag((b) => b.map((i) => (i.id === next.id ? next : i)))}
            onClose={() => setLatticeGemId(null)}
          />
        )}
        {tab === 'town' && <TownScreen key={rootKey.town || 0} onOpenLattice={setLatticeGemId} party={party} roster={roster} setParty={setParty} setRoster={setRoster} bag={bag} setBag={setBag} worldvein={worldvein} setWorldvein={setWorldvein} setTab={selectTab} equipped={equipped} unlocked={unlocked} locked={!!territory} />}
        {tab === 'party' && <PartyScreen key={rootKey.party || 0} onOpenLattice={setLatticeGemId} bond={bond} party={party} setParty={setParty} roster={roster} setRoster={setRoster} locked={!!territory} bag={bag} setBag={setBag} setWorldvein={setWorldvein} equipped={equipped} onEmpower={() => selectTab('town')} />}
        {tab === 'player' && <PlayerScreen key={rootKey.player || 0} worldvein={worldvein} party={party} roster={roster} upgrades={playerUpgrades} onBuy={buyUpgrade} />}
        {tab === 'afk' && <AfkScreen key={rootKey.afk || 0} unlocked={unlocked} party={party} roster={roster} inventory={inventory} bag={bag} afk={afk} worldvein={worldvein} deployedIds={runParty ? runParty.map((m) => m.id) : []} onUpdateGatherSlot={onUpdateGatherSlot} onToggleGather={onToggleGather} onUpdateProcess={onUpdateProcess} onToggleProcess={onToggleProcess} onUpdateIdle={onUpdateIdle} onToggleIdle={onToggleIdle} />}
        {tab === 'mountain' && runStage === 'island' && <IslandWorldMap key={rootKey.mountain || 0} areas={AREAS} unlocked={unlocked} onSelectArea={onSelectArea} onHarbor={() => selectTab('town')} />}
        {tab === 'mountain' && runStage === 'rally' && selectedArea && <RallyScreen area={selectedArea} party={party} roster={roster} onSwap={onRallySwap} onExplore={onRallyExplore} onBack={onRallyBack} />}
        {tab === 'mountain' && RUN_STAGES.has(runStage) && area && territory && (
          <div className="eld-stage">
            <RouteMapScreen area={area} territory={territory} currentId={currentId} busy={busy} partyHP={partyHP} runVein={runVein} party={fielded} log={log} logUnread={Math.max(0, log.length - logSeen)} onOpenLog={() => { setSheet('runlog'); setLogSeen(log.length); }} camera={camera} setCamera={dispatchCamera} travel={travel} onTravelEnd={onTravelEnd} card={ambushCard || card} onTapNode={onTapNode} onCardAction={onCardAction} onExtract={extract} />
            {MIND_STAGES.has(runStage) && (
              <div className="eld-overlay eld-mode-mind" data-mode-column="mind" key={fightIndex.current}>
                {runStage === 'sanctuary' && fightNode && <SanctuaryScreen area={area} party={fielded} runHpFrac={hpArrFor(fielded)} pouch={10 * area.tier} onChoose={onSanctuaryChoose} />}
                {runStage === 'fight' && fightNode && fight && <FightScreen area={area} node={fightNode} party={fielded} fight={fight} elapsedMs={fightElapsed} speed={fightSpeed} onSpeed={setFightSpeed} onSkip={skipFight} />}
                {runStage === 'loot' && fight && <LootResults area={area} nodeLabel={fightNode ? (nodeTypeMeta[fightNode.type]?.label || 'Node') : null} fight={fight} party={fielded} onContinue={onResultsContinue} />}
              </div>
            )}
            {!MIND_STAGES.has(runStage) && overlayLeaving && (
              <div className="eld-overlay is-leaving eld-mode-mind" data-mode-column="mind" aria-hidden="true">
                {overlayLeaving.kind === 'loot' && overlayLeaving.fight && <LootResults area={overlayLeaving.area} nodeLabel={overlayLeaving.fightNode ? (nodeTypeMeta[overlayLeaving.fightNode.type]?.label || 'Node') : null} fight={overlayLeaving.fight} party={fielded} onContinue={() => {}} />}
                {overlayLeaving.kind === 'sanctuary' && <SanctuaryScreen area={overlayLeaving.area} party={fielded} runHpFrac={hpArrFor(fielded)} pouch={10 * (overlayLeaving.area?.tier || 1)} onChoose={() => {}} />}
              </div>
            )}
          </div>
        )}
        </div>
        <TabBar activeTab={tab} onSelect={selectTab} />
        {(sheet === 'help' || sheet === 'help+basics') && <HelpSheet screenId={screenId} showBasics={sheet === 'help+basics'} onClose={() => setSheet(null)} />}
        {sheet === 'runlog' && <RunLogSheet log={log} areaName={area?.name} onClose={() => { setLogSeen(log.length); setSheet(null); }} />}
        {sheet === 'debug' && <DebugTraceSheet onClose={() => setSheet(null)} />}
        {sheet === 'settings' && <SettingsSheet store={SAVE_STORE} onClose={() => setSheet(null)} onGrantTestGems={territory ? null : grantGems} />}
        {offline && !sheet && <OfflineSheet summary={offline} onClose={() => setOffline(null)} />}
        {sheet === 'menu' && (
          <MenuSheet
            activeTab={tab}
            inRun={inRun}
            canExtract={canExtract}
            runVein={runVein}
            traceOn={isTraceOn()}
            onNavigate={(id) => { setSheet(null); selectTab(id); }}
            onHelp={() => setSheet('help+basics')}
            onDebug={() => setSheet('debug')}
            onSettings={() => setSheet('settings')}
            onExtract={() => { setSheet(null); extract(); }}
            onClose={() => setSheet(null)}
          />
        )}
      </Frame>
    </div>
  );
}

const S = {
  // Viewport fit (Veinharbor pass §1): the decorative 12 px vertical padding lives in CSS (`.eld-page`) and is
  // removed on compact viewports; the frame budget is 100svh minus that padding, so the document never scrolls.
  root: { minHeight: '100svh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: '#05080a', boxSizing: 'border-box' },
  frame: { width: frame.width, height: frame.height, maxWidth: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'var(--eld-text)', fontFamily: 'var(--eld-font-body)', position: 'relative' },
  flash: { textAlign: 'center', padding: '8px', margin: '8px 12px 0', border: '1px solid', borderRadius: 8, fontSize: 12, letterSpacing: '0.06em', background: 'rgba(0,0,0,0.35)', animation: 'fadein 0.3s ease', flexShrink: 0 },
};
