import { AREAS } from './data.js';
import { MAT_QUALITY } from './theme/tokens.js';

export const AFK_TICK_MS = 100; // DESIGN-OPEN: persistence/offline
export const GATHER_CYCLE_MS = 4000;
export const PROCESS_CYCLE_MS = 5000;
export const IDLE_CYCLE_MS = 6000;
export const PROCESS_VEIN_COST = 5;

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

export function resolveCharKey(key, party, roster) {
  if (!key) return null;
  const [source, idxStr] = key.split(':');
  const idx = Number(idxStr);
  if (source === 'party') return { source, index: idx, member: party[idx] };
  if (source === 'roster') return { source, index: idx, member: roster[idx] };
  return null;
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
        const top = Math.max(1, ...party.map((m) => m.level), ...roster.map((m) => m.level || 1));
        const lvl = resolved.member.level;
        const catchUp = lvl < top;
        const levelChance = catchUp ? 0.55 : 0.12;
        if ((Math.random() < levelChance || (catchUp && Math.random() < 0.08)) && lvl < top) {
          const bumped = { ...resolved.member, level: lvl + 1 };
          if (resolved.source === 'party') partyNext = party.map((m, i) => (i === resolved.index ? bumped : m));
          else rosterNext = roster.map((m, i) => (i === resolved.index ? bumped : m));
        }
      }
    }
    next.idle = { ...next.idle, progress };
  }

  return { next, inv, vein, partyNext, rosterNext };
}
