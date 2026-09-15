/**
 * AFK runtime — docs/Eldrathor_AFK_Town_Lock.md jobs (Gather / Process / Train) as TRUE IDLE
 * (docs/Eldrathor_Progression_Loop_Lock.md §6, M1c): every job stores `startedAt` and
 * `lastReconciledAt`; on every tick, app resume and app open the runtime reconciles elapsed wall-clock
 * time — every complete cycle in the span is processed, the remainder is carried as `progress`,
 * a job stops cleanly at resource exhaustion — and returns a summary the app shows as the Offline
 * sheet when the span was longer than OFFLINE_SUMMARY_MS. One job per character id; deploying a
 * character to a run suspends their job (kept, paused) and returning resumes it. Pure: `now` and
 * `rng` are injected, so the tests are the spec.
 */
import { AREAS } from './data.js';
import { MAT_QUALITY } from './theme/tokens.js';
import { trainXpPerMinute, applyXp } from './progression/progression.js';

/**
 * AFK_TUNING — Progression Loop Lock §9: the prototype's rates are v1, as one named table (tune later via
 * playtest, not now). Every number the Hearth uses lives here; afkRuntime.test.js asserts it.
 */
export const AFK_TUNING = Object.freeze({
  tickMs: 100, // how often the app reconciles while open (the accrual itself is timestamp-based)
  gatherCycleMs: 4000,
  processCycleMs: 5000,
  trainCycleMs: 6000,
  processVeinCost: 5, // ❖ per Process cycle
  gatherVeinChance: 0.15, // chance of +1 ❖ per Gather cycle
  gatherYield: (tier) => 1 + Math.floor(tier / 2), // raw mats per Gather cycle at an area tier
  gatherXp: (tier) => 3 + tier * 2, // gather skill XP per cycle
  processXp: 4, // process skill XP per infused mat
  qualityWeights: { Common: 55, Fine: 25, Rare: 12, Epic: 6, Legendary: 2 }, // = MAT_QUALITY weights (theme/tokens.js)
  offlineSummaryMs: 60000, // §6: show "While you were away" when the reconciled span exceeds 60 s
});
export const AFK_TICK_MS = AFK_TUNING.tickMs;
export const GATHER_CYCLE_MS = AFK_TUNING.gatherCycleMs;
export const PROCESS_CYCLE_MS = AFK_TUNING.processCycleMs;
export const IDLE_CYCLE_MS = AFK_TUNING.trainCycleMs;
export const PROCESS_VEIN_COST = AFK_TUNING.processVeinCost;
export const OFFLINE_SUMMARY_MS = AFK_TUNING.offlineSummaryMs;
export const GATHER_VEIN_CHANCE = AFK_TUNING.gatherVeinChance;
export const CYCLE_MS = { gather: GATHER_CYCLE_MS, process: PROCESS_CYCLE_MS, idle: IDLE_CYCLE_MS };

/** Highest unlocked area tier (Tmax in the lock's Train formula). */
export function maxUnlockedTier(unlocked) {
  return AREAS.filter((a) => a.id <= (unlocked || 1)).reduce((t, a) => Math.max(t, a.tier || 1), 1);
}
/** XP one Train cycle of `cycleMs` grants at the highest unlocked tier. */
export function trainXpGain(unlocked, cycleMs = IDLE_CYCLE_MS) {
  return trainXpPerMinute(maxUnlockedTier(unlocked)) * (cycleMs / 60000);
}
/** Gather yield per cycle at an area tier (DESIGN-OPEN: prototype rates). */
export const gatherYield = (tier) => ({ gain: AFK_TUNING.gatherYield(tier), xp: AFK_TUNING.gatherXp(tier) });

export function emptyGatherSlot() {
  return { charKey: null, areaId: 1, family: 'wood', running: false, progress: 0, startedAt: null, lastReconciledAt: null, suspended: false };
}
export function emptyJob(extra = {}) {
  return { charKey: null, running: false, progress: 0, startedAt: null, lastReconciledAt: null, suspended: false, ...extra };
}
export function emptyAfkState() {
  return {
    gatherSlots: [emptyGatherSlot(), emptyGatherSlot(), emptyGatherSlot()],
    gatherSkillXp: { wood: 0, metal: 0, hunt: 0 },
    process: emptyJob({ family: 'wood' }),
    processSkillXp: 0,
    idle: emptyJob(),
  };
}

export function rollInfusedQuality(rng = Math.random) {
  const entries = Object.entries(MAT_QUALITY);
  const total = entries.reduce((n, [, v]) => n + v.weight, 0);
  let r = rng() * total;
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

const stopped = (job) => ({ ...job, running: false, progress: 0, startedAt: null, lastReconciledAt: null, suspended: false });

/**
 * One job per character: assigning `charKey` to `target` ({kind:'gather', index} | {kind:'process'} |
 * {kind:'idle'}) clears that character from every other job (and stops it). `charKey` null clears the slot.
 */
export function assignJob(state, target, charKey) {
  const strip = (job) => (charKey && job.charKey === charKey ? { ...stopped(job), charKey: null } : job);
  const next = {
    ...state,
    gatherSlots: state.gatherSlots.map((g) => strip(g)),
    process: strip(state.process),
    idle: strip(state.idle),
  };
  const put = (job) => (charKey ? { ...job, charKey } : { ...stopped(job), charKey: null });
  if (target.kind === 'gather') next.gatherSlots = next.gatherSlots.map((g, i) => (i === target.index ? put(g) : g));
  else if (target.kind === 'process') next.process = put(next.process);
  else if (target.kind === 'idle') next.idle = put(next.idle);
  return next;
}

/** Start a job now (stamps startedAt / lastReconciledAt, keeps any carried remainder). */
export function startJob(job, now) {
  if (!job.charKey) return job;
  return { ...job, running: true, suspended: false, startedAt: job.startedAt ?? now, lastReconciledAt: now };
}
/** Stop a job (remainder discarded). */
export function stopJob(job) {
  return stopped(job);
}
/** Start/stop toggle for the UI. */
export function toggleJob(job, now) {
  return job.running ? stopJob(job) : startJob(job, now);
}

const mapJobs = (state, fn) => ({
  ...state,
  gatherSlots: state.gatherSlots.map((g, i) => fn(g, { kind: 'gather', index: i })),
  process: fn(state.process, { kind: 'process' }),
  idle: fn(state.idle, { kind: 'idle' }),
});

/**
 * §6: deploying characters to a run suspends their running jobs (kept, paused — nothing accrues while
 * the job is suspended, the remainder is preserved).
 */
export function suspendJobs(state, charIds, now) {
  const ids = new Set(charIds);
  return mapJobs(state, (job) => (job.running && !job.suspended && ids.has(job.charKey) ? { ...job, suspended: true, suspendedAt: now } : job));
}
/** …and returning from the run resumes them from the moment of return (no catch-up for the run's span). */
export function resumeJobs(state, now, charIds = null) {
  const ids = charIds ? new Set(charIds) : null;
  return mapJobs(state, (job) => (job.suspended && (!ids || ids.has(job.charKey)) ? { ...job, suspended: false, suspendedAt: undefined, lastReconciledAt: now } : job));
}
/** Ids of every character holding a job right now. */
export function busyCharIds(state) {
  return [...state.gatherSlots, state.process, state.idle].filter((j) => j.charKey).map((j) => j.charKey);
}

/**
 * Bring a loaded save's jobs up to the v3 shape: a running job without `lastReconciledAt` is stamped
 * with the save's own `afkSavedAt` (so time away still counts) or `now`.
 */
export function normalizeAfk(state, { savedAt = null, now }) {
  const base = { ...emptyAfkState(), ...(state || {}) };
  const fix = (job) => ({ ...emptyJob(), ...job, lastReconciledAt: job.running && job.lastReconciledAt == null ? (savedAt ?? now) : job.lastReconciledAt ?? null, startedAt: job.running ? (job.startedAt ?? savedAt ?? now) : job.startedAt ?? null, suspended: !!job.suspended });
  return { ...base, gatherSlots: base.gatherSlots.map(fix), process: fix(base.process), idle: fix(base.idle) };
}

/** Complete cycles in `elapsedMs` given a carried fraction; returns { cycles, progress } with the new remainder. */
export function cyclesElapsed(progress, elapsedMs, cycleMs) {
  const total = Math.max(0, progress || 0) * cycleMs + Math.max(0, elapsedMs);
  const cycles = Math.floor(total / cycleMs);
  return { cycles, progress: (total - cycles * cycleMs) / cycleMs };
}

/**
 * Reconcile every running job up to `now`. Returns patches + a summary of what accrued in the span:
 * { elapsedMs, raw: {family: n}, gatherXp, vein, infused: {quality: n}, processXp, xp: [{id,name,gain,from,to}],
 *   stops: ['process: out of raw wood'] }. `null` when no job is running.
 */
export function reconcileAfk({ state, inventory, worldvein, party, roster, unlocked, now, rng = Math.random }) {
  const jobs = [...state.gatherSlots, state.process, state.idle];
  if (!jobs.some((j) => j.running && !j.suspended)) return null;

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
  const summary = { elapsedMs: 0, raw: {}, gatherXp: 0, vein: 0, infused: {}, processXp: 0, xp: [], stops: [] };
  const span = (job) => { const e = job.lastReconciledAt == null ? 0 : Math.max(0, now - job.lastReconciledAt); summary.elapsedMs = Math.max(summary.elapsedMs, e); return e; };

  next.gatherSlots = next.gatherSlots.map((slot, i) => {
    if (!slot.running || slot.suspended || !slot.charKey) return slot;
    const area = AREAS.find((w) => w.id === slot.areaId);
    const tier = area?.tier || 1;
    if ((area?.id || 1) > unlocked) { summary.stops.push(`gather ${i + 1}: area locked`); return stopped(slot); }
    const { cycles, progress } = cyclesElapsed(slot.progress, span(slot), GATHER_CYCLE_MS);
    if (cycles > 0) {
      const y = gatherYield(tier);
      const gain = y.gain * cycles;
      inv = { ...inv, raw: { ...inv.raw, [slot.family]: (inv.raw[slot.family] || 0) + gain } };
      next.gatherSkillXp[slot.family] = (next.gatherSkillXp[slot.family] || 0) + y.xp * cycles;
      summary.raw[slot.family] = (summary.raw[slot.family] || 0) + gain;
      summary.gatherXp += y.xp * cycles;
      for (let c = 0; c < cycles; c++) if (rng() < GATHER_VEIN_CHANCE) { vein += 1; summary.vein += 1; }
    }
    return { ...slot, progress, lastReconciledAt: now };
  });

  if (next.process.running && !next.process.suspended && next.process.charKey) {
    const job = next.process;
    const fam = job.family;
    const { cycles, progress } = cyclesElapsed(job.progress, span(job), PROCESS_CYCLE_MS);
    let done = 0;
    let exhausted = null;
    let infused = inv.infused.map((m) => ({ ...m }));
    let raw = { ...inv.raw };
    for (let c = 0; c < cycles; c++) {
      if ((raw[fam] || 0) < 1) { exhausted = `out of raw ${fam}`; break; }
      if (vein < PROCESS_VEIN_COST) { exhausted = 'out of Worldvein'; break; }
      vein -= PROCESS_VEIN_COST;
      raw[fam] -= 1;
      const quality = rollInfusedQuality(rng);
      const existing = infused.find((m) => m.family === fam && m.quality === quality);
      if (existing) existing.qty += 1; else infused.push({ family: fam, quality, qty: 1 });
      summary.infused[quality] = (summary.infused[quality] || 0) + 1;
      done += 1;
    }
    if (done) { inv = { ...inv, raw, infused }; next.processSkillXp += AFK_TUNING.processXp * done; summary.processXp += AFK_TUNING.processXp * done; }
    if (exhausted) { summary.stops.push(`process: ${exhausted}`); next.process = stopped(job); }
    else next.process = { ...job, progress, lastReconciledAt: now };
  }

  if (next.idle.running && !next.idle.suspended && next.idle.charKey) {
    const job = next.idle;
    const { cycles, progress } = cyclesElapsed(job.progress, span(job), IDLE_CYCLE_MS);
    if (cycles > 0) {
      const resolved = resolveCharKey(job.charKey, party, roster);
      if (resolved?.member) {
        // Progression Loop Lock §3: Train grants trainXpPerMinute(Tmax) XP per minute at the highest
        // unlocked area tier — a flat rate, no catch-up cap, slower than fighting.
        const gain = trainXpGain(unlocked, IDLE_CYCLE_MS) * cycles;
        const { member: bumped } = applyXp(resolved.member, gain);
        if (resolved.source === 'party') partyNext = party.map((m, i) => (i === resolved.index ? bumped : m));
        else rosterNext = roster.map((m, i) => (i === resolved.index ? bumped : m));
        summary.xp.push({ id: resolved.member.id, name: resolved.member.name, gain, from: resolved.member.level || 1, to: bumped.level });
      }
    }
    next.idle = { ...job, progress, lastReconciledAt: now };
  }

  return { next, inv, vein, partyNext, rosterNext, summary };
}

/** True when the reconciled span deserves the Offline summary sheet (§6: > 60 s) and something happened. */
export function wantsOfflineSummary(summary, thresholdMs = OFFLINE_SUMMARY_MS) {
  if (!summary || summary.elapsedMs <= thresholdMs) return false;
  const any = Object.keys(summary.raw).length || Object.keys(summary.infused).length || summary.vein || summary.xp.length || summary.stops.length;
  return !!any;
}

/** "While you were away: 14 wood, 3 infused, Sera +1 level" */
export function summaryLines(summary) {
  const lines = [];
  for (const [fam, n] of Object.entries(summary.raw)) lines.push(`+${n} raw ${fam}`);
  const infusedTotal = Object.values(summary.infused).reduce((a, b) => a + b, 0);
  if (infusedTotal) lines.push(`+${infusedTotal} infused (${Object.entries(summary.infused).map(([q, n]) => `${n} ${q}`).join(', ')})`);
  if (summary.vein) lines.push(`+${summary.vein} ❖ Worldvein`);
  for (const x of summary.xp) lines.push(x.to > x.from ? `${x.name} +${x.to - x.from} level${x.to - x.from === 1 ? '' : 's'} (Lv ${x.from} → ${x.to})` : `${x.name} +${Math.round(x.gain)} XP`);
  for (const s of summary.stops) lines.push(`Stopped — ${s}`);
  return lines;
}
