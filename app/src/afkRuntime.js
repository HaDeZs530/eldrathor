import { AREAS } from './data.js';
import { MAT_QUALITY } from './theme/tokens.js';
import { trainXpPerMinute, applyXp } from './progression/progression.js';

export const AFK_TICK_MS = 100; // DESIGN-OPEN: persistence/offline
export const GATHER_CYCLE_MS = 4000;
export const PROCESS_CYCLE_MS = 5000;
export const IDLE_CYCLE_MS = 6000;
export const PROCESS_VEIN_COST = 5;

/** Highest unlocked area tier (Tmax in the lock's Train formula). */
export function maxUnlockedTier(unlocked) {
  return AREAS.filter((a) => a.id <= (unlocked || 1)).reduce((t, a) => Math.max(t, a.tier || 1), 1);
}
/** XP one Train cycle of `cycleMs` grants at the highest unlocked tier. */
export function trainXpGain(unlocked, cycleMs = IDLE_CYCLE_MS) {
  return trainXpPerMinute(maxUnlockedTier(unlocked)) * (cycleMs / 60000);
}

export function emptyGatherSlot() {
  return { charKey: null, areaId: 1, family: 'wood', running: false, progress: 0 };
}

export function rollInfusedQuality() {
  const entries = Object.entries(MAT_QUALITY);
  const total = entries.reduce((n, [, v]) => n + v.weight, 0);
  let r = Math.random() * total;
  for (const [name, meta] of entries) {
    r -= meta.weight;
    if (r <= 0) return name;
  }
  return 'Common';
}

/**
 * Resolve a job's character key. Keys are stable character ids (bug-fix pass 1 §8) — a roster swap
 * or promotion never moves an assignment. Legacy positional keys (`party:i` / `roster:i`) still resolve.
 */
export function resolveCharKey(key, party, roster) {
  if (!key) return null;
  const pi = party.findIndex((m) => m.id === key);
  if (pi >= 0) return { source: 'party', index: pi, member: party[pi] };
  const ri = roster.findIndex((m) => m.id === key);
  if (ri >= 0) return { source: 'roster', index: ri, member: roster[ri] };
  const [source, idxStr] = String(key).split(':');
  const idx = Number(idxStr);
  if (source === 'party' && party[idx]) return { source, index: idx, member: party[idx] };
  if (source === 'roster' && roster[idx]) return { source, index: idx, member: roster[idx] };
  return null;
}

/**
 * One job per character: assigning `charKey` to `target` ({kind:'gather', index} | {kind:'process'} |
 * {kind:'idle'}) clears that character from every other job (and stops it). `charKey` null clears the slot.
 */
export function assignJob(state, target, charKey) {
  const strip = (job) => (charKey && job.charKey === charKey ? { ...job, charKey: null, running: false, progress: 0 } : job);
  const next = {
    ...state,
    gatherSlots: state.gatherSlots.map((g) => strip(g)),
    process: strip(state.process),
    idle: strip(state.idle),
  };
  if (target.kind === 'gather') next.gatherSlots = next.gatherSlots.map((g, i) => (i === target.index ? { ...g, charKey, running: charKey ? g.running : false, progress: charKey ? g.progress : 0 } : g));
  else if (target.kind === 'process') next.process = { ...next.process, charKey, running: charKey ? next.process.running : false, progress: charKey ? next.process.progress : 0 };
  else if (target.kind === 'idle') next.idle = { ...next.idle, charKey, running: charKey ? next.idle.running : false, progress: charKey ? next.idle.progress : 0 };
  return next;
}

/** One AFK tick. Mutates via returned patches. DESIGN-OPEN: persistence/offline. */
export function tickAfk({ state, inventory, worldvein, party, roster, unlocked, dt }) {
  const anyGather = state.gatherSlots.some((s) => s.running);
  const anyWork = anyGather || state.process.running || state.idle.running;
  if (!anyWork) return null;

  let next = {
    ...state,
    gatherSlots: state.gatherSlots.map((s) => ({ ...s })),
    gatherSkillXp: { ...state.gatherSkillXp },
    process: { ...state.process },
    idle: { ...state.idle },
  };
  let inv = inventory;
  let vein = worldvein;
  let partyNext = null;
  let rosterNext = null;

  next.gatherSlots = next.gatherSlots.map((slot) => {
    if (!slot.running || !slot.charKey) return slot;
    const area = AREAS.find((w) => w.id === slot.areaId);
    const tier = area?.tier || 1;
    if ((area?.id || 1) > unlocked) return { ...slot, running: false, progress: 0 };
    let progress = slot.progress + dt / GATHER_CYCLE_MS;
    if (progress >= 1) {
      progress = 0;
      const gain = 1 + Math.floor(tier / 2);
      const xpGain = 3 + tier * 2;
      inv = { ...inv, raw: { ...inv.raw, [slot.family]: (inv.raw[slot.family] || 0) + gain } };
      next.gatherSkillXp[slot.family] = (next.gatherSkillXp[slot.family] || 0) + xpGain;
      if (Math.random() < 0.15) vein += 1;
    }
    return { ...slot, progress };
  });

  if (next.process.running && next.process.charKey) {
    let progress = next.process.progress + dt / PROCESS_CYCLE_MS;
    let running = true;
    if (progress >= 1) {
      progress = 0;
      const fam = next.process.family;
      const rawHave = inv.raw[fam] || 0;
      if (rawHave < 1 || vein < PROCESS_VEIN_COST) {
        running = false;
      } else {
        vein -= PROCESS_VEIN_COST;
        inv = { ...inv, raw: { ...inv.raw, [fam]: rawHave - 1 } };
        const quality = rollInfusedQuality();
        const infused = inv.infused.map((m) => ({ ...m }));
        const existing = infused.find((m) => m.family === fam && m.quality === quality);
        if (existing) existing.qty += 1;
        else infused.push({ family: fam, quality, qty: 1 });
        inv = { ...inv, infused };
        next.processSkillXp += 4;
      }
    }
    next.process = { ...next.process, running, progress: running ? progress : 0 };
  }

  if (next.idle.running && next.idle.charKey) {
    let progress = next.idle.progress + dt / IDLE_CYCLE_MS;
    if (progress >= 1) {
      progress = 0;
      const resolved = resolveCharKey(next.idle.charKey, party, roster);
      if (resolved?.member) {
        // Progression Loop Lock §3: Train grants trainXpPerMinute(Tmax) XP per minute at the highest
        // unlocked area tier — a flat rate, no catch-up cap, slower than fighting.
        const gain = trainXpGain(unlocked, IDLE_CYCLE_MS);
        const { member: bumped } = applyXp(resolved.member, gain);
        if (resolved.source === 'party') partyNext = party.map((m, i) => (i === resolved.index ? bumped : m));
        else rosterNext = roster.map((m, i) => (i === resolved.index ? bumped : m));
      }
    }
    next.idle = { ...next.idle, progress };
  }

  return { next, inv, vein, partyNext, rosterNext };
}
