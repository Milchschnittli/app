'use strict';
/* ================= utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const num = v => { if (v === '' || v == null) return null; const n = +String(v).replace(',', '.'); return isFinite(n) ? n : null; };
const r2 = x => Math.round(x * 100) / 100;
const roundTo = (x, inc) => inc > 0 ? r2(Math.round(x / inc + 1e-9) * inc) : r2(x);
const floorTo = (x, inc) => inc > 0 ? r2(Math.floor(x / inc + 1e-9) * inc) : r2(x);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pad = n => String(n).padStart(2, '0');
const DAY = 864e5;
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtN = (x, d = 0) => x == null || !isFinite(x) ? '–' : Number(x).toLocaleString(undefined, { maximumFractionDigits: d });
const fmtW = x => x == null ? '' : String(r2(x));
function fmtDur(ms) { const m = Math.max(0, Math.round(ms / 60000)); const h = Math.floor(m / 60); return h ? `${h}h ${m % 60}min` : `${m}min`; }
function fmtClock(sec) { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`; }
const fmtDate = (ts, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(ts).toLocaleDateString(undefined, o);
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
function weekStart(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); }
function addDays(ts, n) { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); }
function monthStart(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(1); return d.getTime(); }
function addMonths(ts, n) { const d = new Date(ts); d.setMonth(d.getMonth() + n); return d.getTime(); }
const monthKey = ts => { const d = new Date(ts); return `m-${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ================= exercise library ================= */
const MUSCLES = { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', reardelts: 'Rear delts', traps: 'Traps', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', abs: 'Abs', cardio: 'Cardio', other: 'Other' };
const EQUIP = { barbell: 'Barbell', dumbbell: 'Dumbbell', cable: 'Cable', machine: 'Machine', bodyweight: 'Bodyweight', other: 'Other' };
const EQUIP_INC = { barbell: 2.5, dumbbell: 2, cable: 2.5, machine: 5, bodyweight: 2.5, other: 2.5 };
const TYPES = {
  wr: { label: 'Weight and reps', cols: [['w', 'kg'], ['r', 'Reps'], ['rir', 'RIR']], g: 'g3', need: 'r' },
  aw: { label: 'Assisted (kg of help)', cols: [['w', 'Help kg'], ['r', 'Reps'], ['rir', 'RIR']], g: 'g3', need: 'r' },
  bw: { label: 'Bodyweight reps', cols: [['r', 'Reps'], ['rir', 'RIR']], g: 'g2', need: 'r' },
  wd: { label: 'Weight and distance', cols: [['w', 'kg'], ['d', 'm']], g: 'g2', need: 'd' },
  dur: { label: 'Duration', cols: [['t', 'Sec']], g: 'g1', need: 't' },
  cd: { label: 'Cardio (km, min)', cols: [['d', 'km'], ['t', 'Min']], g: 'g2', need: 't' },
};
const LIB_RAW = `Bench Press (Barbell)|chest|triceps,shoulders|barbell|wr|1
Incline Bench Press (Barbell)|chest|shoulders,triceps|barbell|wr|1
Decline Bench Press (Barbell)|chest|triceps|barbell|wr|1
Bench Press (Dumbbell)|chest|triceps,shoulders|dumbbell|wr|1
Incline Bench Press (Dumbbell)|chest|shoulders,triceps|dumbbell|wr|1
Chest Press (Machine)|chest|triceps,shoulders|machine|wr|1
Chest Fly (Cable)|chest|shoulders|cable|wr|0
Chest Fly (Dumbbell)|chest|shoulders|dumbbell|wr|0
Pec Deck (Machine)|chest||machine|wr|0
Push Up|chest|triceps,shoulders|bodyweight|bw|1
Chest Dip|chest|triceps,shoulders|bodyweight|bw|1
Chest Dip (Assisted)|chest|triceps,shoulders|machine|aw|1
Deadlift (Barbell)|glutes|hamstrings,back,traps,forearms|barbell|wr|1
Romanian Deadlift (Barbell)|hamstrings|glutes,back|barbell|wr|1
Romanian Deadlift (Dumbbell)|hamstrings|glutes,back|dumbbell|wr|1
Single Leg Romanian Deadlift (Dumbbell)|hamstrings|glutes|dumbbell|wr|1
Good Morning (Barbell)|hamstrings|glutes,back|barbell|wr|1
Lat Pulldown (Cable)|back|biceps,reardelts|cable|wr|1
Reverse Grip Lat Pulldown (Cable)|back|biceps|cable|wr|1
Lat Pulldown - Close Grip (Cable)|back|biceps|cable|wr|1
Pull Up|back|biceps,reardelts|bodyweight|bw|1
Chin Up|back|biceps|bodyweight|bw|1
Pull Up (Assisted)|back|biceps|machine|aw|1
Seated Cable Row - Bar Grip|back|biceps,reardelts,traps|cable|wr|1
Seated Cable Row - V Grip|back|biceps,traps|cable|wr|1
Bent Over Row (Barbell)|back|biceps,reardelts,traps|barbell|wr|1
Dumbbell Row|back|biceps,reardelts|dumbbell|wr|1
T Bar Row|back|biceps,reardelts,traps|barbell|wr|1
Chest Supported Row (Machine)|back|biceps,reardelts|machine|wr|1
Straight Arm Pulldown (Cable)|back||cable|wr|0
Back Extension|back|glutes,hamstrings|bodyweight|bw|0
Overhead Press (Barbell)|shoulders|triceps|barbell|wr|1
Shoulder Press (Dumbbell)|shoulders|triceps|dumbbell|wr|1
Shoulder Press (Machine)|shoulders|triceps|machine|wr|1
Arnold Press (Dumbbell)|shoulders|triceps|dumbbell|wr|1
Lateral Raise (Dumbbell)|shoulders||dumbbell|wr|0
Lateral Raise (Cable)|shoulders||cable|wr|0
Lateral Raise (Machine)|shoulders||machine|wr|0
Single Arm Lateral Raise (Cable)|shoulders||cable|wr|0
Rear Delt Reverse Fly (Machine)|reardelts|traps|machine|wr|0
Rear Delt Fly (Dumbbell)|reardelts|traps|dumbbell|wr|0
Face Pull (Cable)|reardelts|traps|cable|wr|0
Shrug (Barbell)|traps|forearms|barbell|wr|0
Shrug (Dumbbell)|traps|forearms|dumbbell|wr|0
Bicep Curl (Barbell)|biceps|forearms|barbell|wr|0
Bicep Curl (Dumbbell)|biceps|forearms|dumbbell|wr|0
Bicep Curl (Cable)|biceps|forearms|cable|wr|0
EZ Bar Curl|biceps|forearms|barbell|wr|0
Hammer Curl (Dumbbell)|biceps|forearms|dumbbell|wr|0
Incline Curl (Dumbbell)|biceps||dumbbell|wr|0
Preacher Curl (Machine)|biceps||machine|wr|0
Triceps Pushdown (Cable)|triceps||cable|wr|0
Overhead Triceps Extension (Cable)|triceps||cable|wr|0
Overhead Triceps Extension (Dumbbell)|triceps||dumbbell|wr|0
Skullcrusher (EZ Bar)|triceps||barbell|wr|0
Close Grip Bench Press (Barbell)|triceps|chest,shoulders|barbell|wr|1
Triceps Dip|triceps|chest,shoulders|bodyweight|bw|1
Wrist Curl (Dumbbell)|forearms||dumbbell|wr|0
Reverse Wrist Curl (Dumbbell)|forearms||dumbbell|wr|0
Seated Wrist Curl (Barbell)|forearms||barbell|wr|0
Seated Wrist Extension (Barbell)|forearms||barbell|wr|0
Reverse Curl (Barbell)|forearms|biceps|barbell|wr|0
Farmers Walk|forearms|traps,abs|dumbbell|wd|1
Dead Hang|forearms|back|bodyweight|dur|0
Squat (Barbell)|quads|glutes,back|barbell|wr|1
Front Squat (Barbell)|quads|glutes,abs|barbell|wr|1
Zercher Squat|quads|glutes,back,abs|barbell|wr|1
Hack Squat (Machine)|quads|glutes|machine|wr|1
Leg Press (Machine)|quads|glutes|machine|wr|1
Goblet Squat (Dumbbell)|quads|glutes|dumbbell|wr|1
Bulgarian Split Squat (Dumbbell)|quads|glutes|dumbbell|wr|1
Walking Lunge (Dumbbell)|quads|glutes|dumbbell|wr|1
Leg Extension (Machine)|quads||machine|wr|0
Lying Leg Curl (Machine)|hamstrings||machine|wr|0
Seated Leg Curl (Machine)|hamstrings||machine|wr|0
Nordic Hamstring Curl|hamstrings||bodyweight|bw|0
Hip Thrust (Barbell)|glutes|hamstrings|barbell|wr|1
Hip Thrust (Dumbbell)|glutes|hamstrings|dumbbell|wr|1
Hip Abduction (Machine)|glutes||machine|wr|0
Cable Kickback|glutes||cable|wr|0
Standing Calf Raise (Machine)|calves||machine|wr|0
Seated Calf Raise (Machine)|calves||machine|wr|0
Single Leg Calf Raise (Dumbbell)|calves||dumbbell|wr|0
Cable Crunch|abs||cable|wr|0
Hanging Leg Raise|abs||bodyweight|bw|0
Ab Wheel Rollout|abs||bodyweight|bw|0
Crunch|abs||bodyweight|bw|0
Plank|abs||bodyweight|dur|0
Pallof Press (Cable)|abs||cable|wr|0
Treadmill|cardio||machine|cd|0
Cycling|cardio||machine|cd|0
Rowing Machine|cardio||machine|cd|0
Running|cardio||other|cd|0`;
const BUILTIN = {};
LIB_RAW.trim().split('\n').forEach(line => {
  const [name, m, sec, eq, type, c] = line.split('|');
  const id = slug(name);
  BUILTIN[id] = { id, name, m, sec: sec ? sec.split(',') : [], eq, type, comp: c === '1' };
});
function EX(id) { return BUILTIN[id] || S.customEx[id] || { id, name: 'Removed exercise', m: 'other', sec: [], eq: 'other', type: 'wr', comp: false }; }
function allEx() { return [...Object.values(BUILTIN), ...Object.values(S.customEx)].sort((a, b) => a.name.localeCompare(b.name)); }
function exByName(name) { const k = name.trim().toLowerCase(); return allEx().find(e => e.name.toLowerCase() === k); }
function incFor(id) { const o = S.settings.inc?.[id]; if (o != null) return o; const e = EX(id); return e.type === 'aw' ? 5 : (EQUIP_INC[e.eq] ?? 2.5); }
function guessMuscle(n) {
  n = ' ' + n.toLowerCase();
  const rules = [['leg curl', 'hamstrings'], ['hamstring', 'hamstrings'], ['wrist', 'forearms'], ['farmer', 'forearms'], ['calf', 'calves'], ['tricep', 'triceps'], ['skull', 'triceps'], ['pushdown', 'triceps'], ['curl', 'biceps'], ['rear delt', 'reardelts'], ['face pull', 'reardelts'], ['lateral', 'shoulders'], ['front raise', 'shoulders'], ['upright row', 'shoulders'], ['shoulder', 'shoulders'], ['overhead press', 'shoulders'], ['military', 'shoulders'], ['bench', 'chest'], ['chest', 'chest'], ['fly', 'chest'], ['push up', 'chest'], ['dip', 'triceps'], ['rowing', 'cardio'], ['row', 'back'], ['pulldown', 'back'], ['pull up', 'back'], ['chin up', 'back'], ['deadlift', 'hamstrings'], ['squat', 'quads'], ['lunge', 'quads'], ['leg press', 'quads'], ['leg extension', 'quads'], ['hip thrust', 'glutes'], ['glute', 'glutes'], ['shrug', 'traps'], ['crunch', 'abs'], ['plank', 'abs'], ['leg raise', 'abs'], ['run', 'cardio'], ['bike', 'cardio'], ['cycl', 'cardio']];
  for (const [k, m] of rules) if (new RegExp('[^a-z]' + k).test(n)) return m;
  return 'other';
}
function guessEquip(n) { n = n.toLowerCase(); for (const k of ['barbell', 'dumbbell', 'cable', 'machine']) if (n.includes(k)) return k; if (n.includes('ez bar') || n.includes('smith')) return 'barbell'; return 'other'; }

/* ================= starter data (from the routines in your screenshots) ================= */
/* Your 3-day plan. Weights are kg (kg of help for assisted dips); reps start at the bottom of each range. */
const HYBRID_PLAN = {
  name: 'Hybrid 3-day plan',
  inc: { 'incline-bench-press-dumbbell': 2.5, 'hammer-curl-dumbbell': 2.5, 'farmers-walk': 5 },
  // [exercise, set weights, rep range low, high, rest seconds, superset tag, distance m]
  routines: [
    ['Hybrid A', [
      ['Deadlift (Barbell)', [97.5, 100, 102.5, 105, 105], 5, 7, 180],
      ['Zercher Squat', [52.5, 55, 57.5, 60], 6, 8, 150],
      ['Overhead Press (Barbell)', [35, 37.5, 40, 40], 8, 10, 120],
      ['Bent Over Row (Barbell)', [45, 50, 55, 55], 6, 8, 120, 'x'],
      ['Single Arm Lateral Raise (Cable)', [12.5, 15, 17.5], 12, 15, 120, 'x'],
      ['Bicep Curl (Barbell)', [20, 22.5, 25], 10, 12, 90],
      ['Farmers Walk', [60, 65, 70], null, null, 120, null, 40],
    ]],
    ['Hybrid B', [
      ['Bench Press (Barbell)', [55, 57.5, 60, 60, 62.5], 5, 7, 180],
      ['Incline Bench Press (Dumbbell)', [20, 22.5, 25], 8, 10, 120],
      ['Chest Dip (Assisted)', [20, 15, 10], 8, 10, 120],
      ['Seated Cable Row - Bar Grip', [55, 60, 65], 8, 10, 120, 'x'],
      ['Lat Pulldown - Close Grip (Cable)', [50, 55, 60], 8, 10, 120, 'x'],
      ['Overhead Triceps Extension (Cable)', [20, 22.5, 25], 10, 12, 90, 'y'],
      ['Hammer Curl (Dumbbell)', [null, null, null], 10, 12, 90, 'y'],
    ]],
    ['Hybrid C', [
      ['Zercher Squat', [52.5, 55, 57.5, 60, 62.5], 5, 7, 180],
      ['Romanian Deadlift (Barbell)', [60, 65, 70, 75], 8, 10, 150],
      ['T Bar Row', [50, 55, 60], 8, 10, 120],
      ['Reverse Grip Lat Pulldown (Cable)', [50, 55, 60], 8, 10, 90],
      ['Face Pull (Cable)', [25, 30, 30], 15, 20, 90, 'x'],
      ['Single Arm Lateral Raise (Cable)', [null, null, null], 12, 15, 90, 'x'],
      ['Hammer Curl (Dumbbell)', [17.5, 20, 22.5], 10, 12, 90],
    ]],
  ],
};
function planRoutines(plan) {
  return plan.routines.map(([name, list]) => {
    const tags = {};
    const ex = list.map(([n, ws, lo, hi, rest, tag, dist]) => {
      const e = { exId: slug(n), lo: lo ?? null, hi: hi ?? null, rir: null, rest: rest ?? null, sets: ws.map(w => ({ w: w ?? null, r: dist ? null : (lo ?? null), d: dist ?? null, t: null })) };
      if (tag) e.ss = tags[tag] || (tags[tag] = 's' + uid().slice(0, 6));
      return e;
    });
    return { id: uid(), name, ex };
  });
}
function starterRoutines() { return planRoutines(HYBRID_PLAN); }
const META_KEYS = ['settings', 'routines', 'customEx', 'measures', 'program'];
function defaultSettings() { return { theme: 'dark', rest: 120, rir: 2, bw: null, bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25], sound: true, inc: {}, autoLock: 5, lastBackup: null, backupSnooze: 0 }; }
function defaultState() {
  return { v: 1, settings: { ...defaultSettings(), inc: { ...HYBRID_PLAN.inc } }, routines: starterRoutines(), customEx: {}, measures: [], program: null, workouts: [], active: null };
}

/* ================= state ================= */
let S = null;
function normalize(s) {
  const d = defaultState();
  s = s && typeof s === 'object' ? s : d;
  s.settings = Object.assign(defaultSettings(), s.settings || {});
  s.settings.inc = s.settings.inc || {};
  for (const k of ['routines', 'measures', 'workouts']) if (!Array.isArray(s[k])) s[k] = [];
  s.customEx = s.customEx || {};
  if (s.program === undefined) s.program = null;
  if (s.active === undefined) s.active = null;
  return s;
}
/* memo cache, cleared whenever workouts change */
let memo = new Map();
const bust = () => { memo = new Map(); };
function cached(k, fn) { if (!memo.has(k)) memo.set(k, fn()); return memo.get(k); }

/* ================= training data helpers ================= */
const isWork = s => s.done && (s.type === 'n' || s.type === 'f');
const isWorkT = s => s.type === 'n' || s.type === 'f';
function e1rm(w, r) { if (!w || !r) return 0; return r === 1 ? w : w * (1 + r / 30); } // Epley
function setVolume(s, ex) {
  if (!s.done || s.type === 'w') return 0;
  if (ex.type === 'wr') return (s.w || 0) * (s.r || 0);
  if (ex.type === 'aw') return S.settings.bw ? Math.max(0, S.settings.bw - (s.w || 0)) * (s.r || 0) : 0;
  return 0;
}
function workoutStats(w) {
  let vol = 0, sets = 0, reps = 0;
  for (const e of w.ex) { const ex = EX(e.exId); for (const s of e.sets) { if (!s.done || s.type === 'w') continue; sets++; reps += s.r || 0; vol += setVolume(s, ex); } }
  return { vol, sets, reps, dur: (w.end || Date.now()) - w.start };
}
function sortedWorkouts() { return cached('sw', () => [...S.workouts].sort((a, b) => b.start - a.start)); }
function exHistory(exId) {
  return cached('h:' + exId, () => {
    const out = [];
    for (const w of sortedWorkouts()) {
      const all = [];
      for (const e of w.ex) if (e.exId === exId) for (const s of e.sets) if (s.done) all.push(s);
      const sets = all.filter(s => s.type !== 'w');
      if (all.length) out.push({ wid: w.id, start: w.start, rid: w.routineId || null, wname: w.name, sets, all });
    }
    return out;
  });
}
function prevSets(exId, exclude) {
  const h = exHistory(exId).find(x => x.wid !== exclude);
  if (!h) return null;
  return { warm: h.all.filter(s => s.type === 'w'), work: h.all.filter(isWorkT), start: h.start };
}
/* History the coach reads: this routine's sessions since its plan started, then this routine's own plan numbers,
   then any other session. Lets one lift run different rep schemes on different days. */
function pickHist(exId, o = {}) {
  const hist = exHistory(exId).filter(h => h.wid !== o.exclude);
  const recent = o.since ? hist.filter(h => h.start >= o.since) : hist;
  const same = recent.filter(h => (o.rid && h.rid === o.rid) || (o.rname && h.wname === o.rname));
  if (same.length) return same;
  if (o.tmplHas) return []; // this day's plan numbers beat another day's history
  return recent.length ? recent : hist;
}
function fixSupersets(list) {
  let i = 0;
  while (i < list.length) {
    const s = list[i].ss; if (!s) { i++; continue; }
    let j = i; while (j + 1 < list.length && list[j + 1].ss === s) j++;
    if (j === i) delete list[i].ss; else { const id = 's' + uid().slice(0, 6); for (let k = i; k <= j; k++) list[k].ss = id; }
    i = j + 1;
  }
}
function superWith(list, i) { const a = list[i], b = list[i + 1]; if (!a || !b) return; const id = a.ss || b.ss || 's' + uid().slice(0, 6); a.ss = id; b.ss = id; fixSupersets(list); }
function unsuper(list, i) { if (list[i]) delete list[i].ss; fixSupersets(list); }
function bestsBefore(exId, beforeTs, excludeWid) {
  const b = { w: 0, e1: 0, vol: 0, reps: 0, d: 0, t: 0, n: 0 };
  for (const h of exHistory(exId)) {
    if (h.start >= beforeTs || h.wid === excludeWid) continue;
    b.n++;
    for (const s of h.sets) {
      b.w = Math.max(b.w, s.w || 0); b.e1 = Math.max(b.e1, e1rm(s.w, s.r)); b.vol = Math.max(b.vol, (s.w || 0) * (s.r || 0));
      b.reps = Math.max(b.reps, s.r || 0); b.d = Math.max(b.d, s.d || 0); b.t = Math.max(b.t, s.t || 0);
    }
  }
  return b;
}
function isPR(exId, s, beforeTs, excludeWid) {
  const ex = EX(exId), b = bestsBefore(exId, beforeTs, excludeWid);
  if (!b.n || s.type === 'w') return false;
  if (ex.type === 'wr') return (s.w || 0) > b.w || e1rm(s.w, s.r) > b.e1 + 0.01;
  if (ex.type === 'bw') return (s.r || 0) > b.reps;
  if (ex.type === 'wd') return (s.w || 0) > b.w || (s.d || 0) > b.d;
  if (ex.type === 'dur') return (s.t || 0) > b.t;
  return false;
}
function computePRs(w) {
  const out = [];
  for (const e of w.ex) {
    const ex = EX(e.exId), b = bestsBefore(e.exId, w.start, w.id);
    if (!b.n) continue;
    const ss = e.sets.filter(s => s.done && s.type !== 'w');
    if (!ss.length) continue;
    const mx = f => Math.max(...ss.map(f));
    if (ex.type === 'wr') {
      const hw = mx(s => s.w || 0), he = mx(s => e1rm(s.w, s.r)), hv = mx(s => (s.w || 0) * (s.r || 0));
      if (hw > b.w) out.push({ exId: e.exId, kind: 'Heaviest weight', val: `${fmtW(hw)} kg` });
      if (he > b.e1 + 0.01) out.push({ exId: e.exId, kind: 'Best estimated 1RM', val: `${fmtN(he, 1)} kg` });
      if (hv > b.vol) out.push({ exId: e.exId, kind: 'Best set volume', val: `${fmtN(hv)} kg` });
    } else if (ex.type === 'bw') { const hr = mx(s => s.r || 0); if (hr > b.reps) out.push({ exId: e.exId, kind: 'Most reps', val: `${hr}` }); }
    else if (ex.type === 'wd') { const hw = mx(s => s.w || 0), hd = mx(s => s.d || 0); if (hw > b.w) out.push({ exId: e.exId, kind: 'Heaviest weight', val: `${fmtW(hw)} kg` }); if (hd > b.d) out.push({ exId: e.exId, kind: 'Longest distance', val: `${fmtW(hd)} m` }); }
    else if (ex.type === 'dur') { const ht = mx(s => s.t || 0); if (ht > b.t) out.push({ exId: e.exId, kind: 'Longest hold', val: `${ht} s` }); }
  }
  return out;
}
function muscleSets(workouts) {
  const m = {};
  for (const w of workouts) for (const e of w.ex) {
    const ex = EX(e.exId); const n = e.sets.filter(isWork).length; if (!n) continue;
    m[ex.m] = (m[ex.m] || 0) + n;
    for (const s of ex.sec) m[s] = (m[s] || 0) + n * 0.5;
  }
  return m;
}
function fmtSet(s, type) {
  const w = fmtW(s.w);
  switch (type) {
    case 'wr': return s.w != null && s.w !== 0 ? `${w} × ${s.r ?? '–'}` : `${s.r ?? '–'} reps`;
    case 'aw': return `${s.r ?? '–'} reps, ${w || 0} kg help`;
    case 'wd': return `${w || 0} kg, ${fmtW(s.d) || 0} m`;
    case 'bw': return `${s.r ?? '–'} reps`;
    case 'dur': return `${s.t ?? '–'} s`;
    case 'cd': return `${fmtW(s.d) || 0} km, ${fmtW(s.t) || 0} min`;
  }
  return '';
}
function fmtPrev(s, type) {
  if (!s) return '';
  switch (type) {
    case 'wr': return s.w != null ? `${fmtW(s.w)}×${s.r ?? ''}` : `${s.r ?? ''}`;
    case 'aw': return `−${fmtW(s.w) || 0}×${s.r ?? ''}`;
    case 'wd': return `${fmtW(s.w) || 0}kg ${fmtW(s.d) || 0}m`;
    case 'bw': return `${s.r ?? ''}`;
    case 'dur': return `${s.t ?? ''}s`;
    case 'cd': return `${fmtW(s.d) || 0}km ${fmtW(s.t) || 0}′`;
  }
  return '';
}

/* ================= the coach: progression engine =================
   Double progression with RIR autoregulation:
   - every working set at the top of the rep range (and not past the RIR target) -> add load,
     and estimate the new rep target from an RIR-adjusted e1RM (Epley);
   - otherwise add a rep on sets that had reps in reserve;
   - under the range -> hold; under the range twice in a row -> reset ~10%;
   - programme deload weeks -> half the sets, ~90% load, 4+ RIR. */
function defaultRange(ex, role) {
  if (ex.type === 'wd' || ex.type === 'dur' || ex.type === 'cd') return [null, null];
  if (role === 'main') return [6, 10];
  return ex.comp ? [6, 10] : [10, 15];
}
function defaultRest(role) { return role === 'main' ? 180 : role === 'comp' ? 150 : 90; }
function rxFor(re, routine) {
  const ex = EX(re.exId); const role = re.role || (ex.comp ? 'comp' : 'iso');
  const [dlo, dhi] = defaultRange(ex, role);
  return { lo: re.lo ?? dlo, hi: re.hi ?? dhi, rir: re.rir ?? null, rest: re.rest ?? defaultRest(role), role, prog: !!(routine && routine.programId) };
}
function progWeek() {
  const p = S.program; if (!p) return null;
  const len = p.rirs.length + 1;
  const days = Math.round((startOfDay(Date.now()) - startOfDay(p.start)) / DAY);
  const w = Math.floor(days / 7);
  const idx = ((w % len) + len) % len;
  return { idx, week: idx + 1, len, cycle: Math.floor(w / len) + 1, deload: idx === len - 1, rir: idx < len - 1 ? p.rirs[idx] : 4 };
}
function targetRirFor(rx) {
  if (rx.rir != null) return rx.rir;
  const pw = rx.prog ? progWeek() : null;
  if (pw) {
    if (pw.deload) return 4;
    let r = pw.rir; const goal = S.program?.cfg?.goal;
    if (rx.role === 'main' && goal === 'strength') r = Math.max(2, r);
    else if (rx.role !== 'iso') r = Math.max(1, r);
    return r;
  }
  return S.settings.rir;
}
function bestAdj(h, rir) { return Math.max(0, ...h.sets.filter(isWorkT).map(s => e1rm(s.w, (s.r || 0) + (s.rir ?? rir)))); }
function isStalled(hist, rir) {
  const hs = hist.filter(h => h.sets.some(isWorkT)).slice(0, 3);
  if (hs.length < 3) return false;
  const [b0, b1, b2] = hs.map(h => bestAdj(h, rir));
  return b2 > 0 && b0 <= b2 * 1.005 && b1 <= b2 * 1.005;
}
function fmtTargets(ex, t) {
  if (!t || !t.length) return '';
  const ws = t.map(x => x.w), rs = t.map(x => x.r), same = a => a.every(v => v === a[0]);
  switch (ex.type) {
    case 'wr': case 'aw': {
      const help = ex.type === 'aw' ? ' of help' : '';
      if (ws[0] == null && same(ws)) return same(rs) ? `${t.length} × ${rs[0]} reps` : `${rs.join(', ')} reps`;
      if (same(ws) && same(rs)) return `${t.length} × ${rs[0]} at ${fmtW(ws[0])} kg${help}`;
      if (same(ws)) return `${fmtW(ws[0])} kg${help} for ${rs.join(', ')} reps`;
      return t.map(x => `${fmtW(x.w)} kg × ${x.r}`).join(', ');
    }
    case 'wd': return same(ws) && same(t.map(x => x.d)) ? `${t.length} × ${fmtW(t[0].d)} m at ${fmtW(ws[0])} kg` : t.map(x => `${fmtW(x.w)} kg for ${fmtW(x.d)} m`).join(', ');
    case 'bw': return same(rs) ? `${t.length} × ${rs[0]} reps` : `${rs.join(', ')} reps`;
    case 'dur': return `${t.map(x => x.t).join(', ')} s`;
  }
  return '';
}
function suggest(exId, rx, o = {}) {
  const ex = EX(exId), type = ex.type, inc = incFor(exId);
  if (type === 'cd') return null;
  const tmplHas = (o.template || []).some(s => s && (s.type || 'n') !== 'w' && (s.w != null || s.r != null || s.d != null || s.t != null));
  const hist = pickHist(exId, { ...o, tmplHas });
  const lo = rx.lo ?? 8, hi = rx.hi ?? 12, rir = o.rir ?? 2, n = Math.max(1, o.nSets || 1);
  const last = hist.find(h => h.sets.some(isWorkT));
  const mk = (kind, title, why, targets) => ({ kind, title, why, targets, detail: fmtTargets(ex, targets) });
  if (!last) {
    const t = (o.template || []).filter(s => s && (s.type || 'n') !== 'w');
    if (t.some(s => s.w != null || s.r != null || s.d != null || s.t != null))
      return mk('first', 'From your routine', `Starting from your routine's numbers. Log RIR on each working set and the coach sets your next targets.`, t.map(s => ({ w: s.w ?? null, r: s.r ?? null, d: s.d ?? null, t: s.t ?? null })));
    if (type === 'wr' || type === 'aw') return mk('first', 'Find your working weight', `Pick a load you could lift about ${hi + rir} times and stop at ${hi}, leaving roughly ${rir} in reserve. The coach takes over next session.`, []);
    return mk('first', 'First session', 'Log your sets and the coach sets targets next time.', []);
  }
  const work = last.sets.filter(isWorkT);
  const base = k => work[Math.min(k, work.length - 1)];
  const rr = s => s.rir ?? rir;
  const arr = m => Array.from({ length: m }, (_, k) => k);

  if (o.deload) {
    const m = Math.max(1, Math.ceil(n / 2));
    const targets = arr(m).map(k => {
      const b = base(k);
      if (type === 'wr') return { w: b.w ? roundTo(b.w * 0.9, inc) : b.w, r: lo };
      if (type === 'aw') return { w: roundTo((b.w || 0) + inc, inc), r: lo };
      if (type === 'wd') return { w: b.w ? roundTo(b.w * 0.85, inc) : b.w, d: b.d };
      if (type === 'dur') return { t: b.t };
      return { r: Math.max(1, Math.round((b.r || lo) * 0.7)) };
    });
    return mk('deload', 'Deload week', `Half the sets at about 90% of your recent load, stopping with 4 or more reps in reserve. Strength holds while fatigue drops.`, targets);
  }

  if (type === 'wd') {
    const td = (o.template || []).find(s => s && s.d)?.d ?? Math.max(...work.map(s => s.d || 0));
    const hit = work.every(s => (s.d || 0) >= td);
    if (hit) return mk('load', 'Add load', `You covered ${fmtW(td)} m on every set. Go ${fmtW(inc)} kg heavier for the same distance.`, arr(n).map(k => ({ w: roundTo((base(k).w || 0) + inc, inc), d: td })));
    return mk('hold', 'Hold the weight', `Cover the full ${fmtW(td)} m on every set before going heavier.`, arr(n).map(k => ({ w: base(k).w, d: td })));
  }
  if (type === 'dur') return mk('reps', 'Add time', 'Hold each set about 5 seconds longer than last time.', arr(n).map(k => ({ t: (base(k).t || 20) + 5 })));

  const hasW = type === 'aw' || work.some(s => (s.w || 0) > 0);
  const allTop = work.every(s => (s.r || 0) >= hi);
  const tooHard = work.some(s => s.rir != null && s.rir < rir - 1);
  const stall = type === 'wr' && hasW && isStalled(hist, rir);
  const stallNote = stall ? ' Progress has been flat for three sessions. If it stays flat, take a deload or swap the variation.' : '';
  const repsUp = () => {
    let any = false;
    const t = arr(n).map(k => {
      const b = base(k); let r = b.r || lo;
      if (k < work.length && (b.rir == null || b.rir >= rir) && r < hi) { r += 1; any = true; }
      return hasW ? { w: b.w, r: Math.min(hi, Math.max(r, 1)) } : { w: null, r: Math.min(hi, Math.max(r, 1)) };
    });
    return { t, any };
  };

  if (type === 'bw' || !hasW) {
    if (allTop) return mk('load', 'Top of the range', `Every set reached ${hi}+ reps. Add a little weight (belt or dumbbell) or move to a harder variation, then build the reps back up.`, arr(n).map(k => ({ w: null, r: hi })));
    const { t, any } = repsUp();
    return any ? mk('reps', 'Add reps', `One more rep on each set where you had ${rir}+ in reserve, until every set reaches ${hi}.`, t)
      : mk('hold', 'Repeat and own it', `Some sets went closer to failure than ${rir} RIR. Repeat these reps with a little more in reserve.`, t);
  }

  const assisted = type === 'aw';
  const underN = work.filter(s => (s.r || 0) < lo).length;
  const under = underN >= Math.ceil(work.length / 2);
  const prevH = hist.slice(hist.indexOf(last) + 1).find(h => h.sets.some(isWorkT));
  const prevUnder = prevH ? (() => { const pw = prevH.sets.filter(isWorkT); return pw.filter(s => (s.r || 0) < lo).length >= Math.ceil(pw.length / 2); })() : false;

  if (allTop && !tooHard && assisted && work.every(s => !((s.w || 0) > 0))) return mk('load', 'No help needed any more', `You hit ${hi}+ reps with zero assistance. Switch to the bodyweight version, then add weight with a belt once you top the range again.`, arr(n).map(() => ({ w: 0, r: hi })));
  if (allTop && !tooHard) {
    const targets = arr(n).map(k => {
      const b = base(k);
      if (assisted) return { w: Math.max(0, roundTo((b.w || 0) - inc, inc)), r: Math.max(lo, hi - 2) };
      const nw = roundTo((b.w || 0) + inc, inc);
      const est = Math.floor(30 * (e1rm(b.w, (b.r || 0) + rr(b)) / nw - 1) - rir + 1e-6);
      return { w: nw, r: clamp(est, lo, hi) };
    });
    return mk('load', assisted ? 'Less assistance' : 'Add load', `Every set reached ${hi}+ reps last time. ${assisted ? `Take ${fmtW(inc)} kg of help away` : `Add ${fmtW(inc)} kg`} and work back up through ${lo} to ${hi}.`, targets);
  }
  if (allTop && tooHard) return mk('hold', 'Repeat this weight', `You reached ${hi} reps, but some sets went past ${rir} RIR. Match it with reps in reserve before adding load.`, arr(n).map(k => ({ w: base(k).w, r: hi })));
  if (under && prevUnder) {
    const targets = arr(n).map(k => {
      const b = base(k);
      if (assisted) return { w: roundTo((b.w || 0) + inc, inc), r: lo };
      let nw = floorTo((b.w || 0) * 0.9, inc); if (nw >= (b.w || 0)) nw = r2((b.w || 0) - inc); nw = Math.max(0, nw);
      const est = nw > 0 ? Math.floor(30 * (e1rm(b.w, (b.r || 0) + rr(b)) / nw - 1) - rir + 1e-6) : lo;
      return { w: nw, r: clamp(est, lo, hi) };
    });
    return mk('reset', 'Reset the load', `Two sessions in a row under ${lo} reps. Take about 10% off and build back up. A small step back usually clears a stall.`, targets);
  }
  if (under) return mk('hold', 'Hold the weight', `${underN} of ${work.length} sets landed under ${lo} reps. Stay at this load and aim for ${lo}+ on every set.${stallNote}`, arr(n).map(k => ({ w: base(k).w, r: lo })));
  const { t, any } = repsUp();
  if (!any) return mk('hold', 'Repeat and own it', `Some sets went closer to failure than ${rir} RIR. Repeat these numbers with a little more in reserve, then push on.${stallNote}`, t);
  return mk('reps', 'Add reps', `Same weight, one more rep on sets where you had ${rir}+ in reserve. When every set reaches ${hi}, the load goes up.${stallNote}`, t);
}

/* ================= program builder ================= */
const PAT = {
  squat: { gym: ['Squat (Barbell)', 'Hack Squat (Machine)', 'Leg Press (Machine)'], home: ['Goblet Squat (Dumbbell)', 'Bulgarian Split Squat (Dumbbell)'] },
  hinge: { gym: ['Romanian Deadlift (Barbell)', 'Deadlift (Barbell)'], home: ['Romanian Deadlift (Dumbbell)', 'Single Leg Romanian Deadlift (Dumbbell)'] },
  lunge: { gym: ['Bulgarian Split Squat (Dumbbell)', 'Walking Lunge (Dumbbell)'], home: ['Walking Lunge (Dumbbell)', 'Bulgarian Split Squat (Dumbbell)'] },
  hpush: { gym: ['Bench Press (Barbell)', 'Incline Bench Press (Dumbbell)', 'Chest Press (Machine)'], home: ['Bench Press (Dumbbell)', 'Incline Bench Press (Dumbbell)', 'Push Up'] },
  vpush: { gym: ['Overhead Press (Barbell)', 'Shoulder Press (Dumbbell)'], home: ['Shoulder Press (Dumbbell)', 'Arnold Press (Dumbbell)'] },
  hpull: { gym: ['Seated Cable Row - Bar Grip', 'Chest Supported Row (Machine)', 'Bent Over Row (Barbell)'], home: ['Dumbbell Row', 'Chin Up'] },
  vpull: { gym: ['Lat Pulldown (Cable)', 'Pull Up', 'Reverse Grip Lat Pulldown (Cable)'], home: ['Pull Up', 'Chin Up'] },
  legcurl: { gym: ['Seated Leg Curl (Machine)', 'Lying Leg Curl (Machine)'], home: ['Nordic Hamstring Curl', 'Single Leg Romanian Deadlift (Dumbbell)'] },
  legext: { gym: ['Leg Extension (Machine)', 'Walking Lunge (Dumbbell)'], home: ['Walking Lunge (Dumbbell)', 'Goblet Squat (Dumbbell)'] },
  glute: { gym: ['Hip Thrust (Barbell)', 'Hip Abduction (Machine)'], home: ['Hip Thrust (Dumbbell)'] },
  chestiso: { gym: ['Chest Fly (Cable)', 'Pec Deck (Machine)'], home: ['Chest Fly (Dumbbell)'] },
  lateral: { gym: ['Lateral Raise (Cable)', 'Lateral Raise (Dumbbell)'], home: ['Lateral Raise (Dumbbell)'] },
  reardelt: { gym: ['Rear Delt Reverse Fly (Machine)', 'Face Pull (Cable)'], home: ['Rear Delt Fly (Dumbbell)'] },
  biceps: { gym: ['Bicep Curl (Cable)', 'Incline Curl (Dumbbell)', 'Hammer Curl (Dumbbell)'], home: ['Incline Curl (Dumbbell)', 'Hammer Curl (Dumbbell)', 'Bicep Curl (Dumbbell)'] },
  triceps: { gym: ['Overhead Triceps Extension (Cable)', 'Triceps Pushdown (Cable)', 'Skullcrusher (EZ Bar)'], home: ['Overhead Triceps Extension (Dumbbell)', 'Triceps Dip'] },
  calves: { gym: ['Standing Calf Raise (Machine)', 'Seated Calf Raise (Machine)'], home: ['Single Leg Calf Raise (Dumbbell)'] },
  abs: { gym: ['Cable Crunch', 'Hanging Leg Raise'], home: ['Hanging Leg Raise', 'Ab Wheel Rollout'] },
};
const DAYT = {
  FBA: ['Full body A', [['squat', 0, 'main'], ['hpush', 0, 'comp'], ['hpull', 0, 'comp'], ['legcurl', 0, 'iso'], ['lateral', 0, 'iso'], ['triceps', 0, 'iso']]],
  FBB: ['Full body B', [['hinge', 0, 'main'], ['vpush', 0, 'comp'], ['vpull', 0, 'comp'], ['legext', 0, 'iso'], ['biceps', 0, 'iso'], ['calves', 0, 'iso']]],
  FBC: ['Full body C', [['squat', 1, 'main'], ['hpush', 1, 'comp'], ['vpull', 1, 'comp'], ['glute', 0, 'comp'], ['reardelt', 0, 'iso'], ['abs', 0, 'iso']]],
  UA: ['Upper A', [['hpush', 0, 'main'], ['hpull', 0, 'comp'], ['vpush', 0, 'comp'], ['vpull', 0, 'comp'], ['lateral', 0, 'iso'], ['biceps', 0, 'iso'], ['triceps', 0, 'iso']]],
  LA: ['Lower A', [['squat', 0, 'main'], ['hinge', 0, 'comp'], ['legext', 0, 'iso'], ['legcurl', 0, 'iso'], ['calves', 0, 'iso'], ['abs', 0, 'iso']]],
  UB: ['Upper B', [['hpush', 1, 'main'], ['vpull', 1, 'comp'], ['hpull', 1, 'comp'], ['chestiso', 0, 'iso'], ['reardelt', 0, 'iso'], ['triceps', 1, 'iso'], ['biceps', 1, 'iso']]],
  LB: ['Lower B', [['hinge', 1, 'main'], ['squat', 2, 'comp'], ['glute', 0, 'comp'], ['legcurl', 1, 'iso'], ['calves', 1, 'iso'], ['abs', 1, 'iso']]],
  PU: ['Push', [['hpush', 0, 'main'], ['vpush', 0, 'comp'], ['hpush', 1, 'comp'], ['lateral', 0, 'iso'], ['chestiso', 0, 'iso'], ['triceps', 0, 'iso']]],
  PL: ['Pull', [['vpull', 0, 'main'], ['hpull', 0, 'comp'], ['hpull', 1, 'comp'], ['reardelt', 0, 'iso'], ['biceps', 0, 'iso'], ['biceps', 1, 'iso']]],
  LG: ['Legs', [['squat', 0, 'main'], ['hinge', 0, 'comp'], ['glute', 0, 'comp'], ['legext', 0, 'iso'], ['legcurl', 0, 'iso'], ['calves', 0, 'iso'], ['abs', 0, 'iso']]],
  PU2: ['Push B', [['hpush', 1, 'main'], ['vpush', 1, 'comp'], ['chestiso', 1, 'iso'], ['lateral', 1, 'iso'], ['triceps', 1, 'iso'], ['triceps', 2, 'iso']]],
  PL2: ['Pull B', [['hpull', 2, 'main'], ['vpull', 1, 'comp'], ['reardelt', 1, 'iso'], ['biceps', 1, 'iso'], ['biceps', 2, 'iso']]],
  LG2: ['Legs B', [['hinge', 1, 'main'], ['squat', 1, 'comp'], ['lunge', 0, 'comp'], ['legcurl', 1, 'iso'], ['calves', 1, 'iso'], ['abs', 1, 'iso']]],
};
const SPLITS = { 2: ['FBA', 'FBB'], 3: ['FBA', 'FBB', 'FBC'], 4: ['UA', 'LA', 'UB', 'LB'], 5: ['UA', 'LA', 'PU', 'PL', 'LG'], 6: ['PU', 'PL', 'LG', 'PU2', 'PL2', 'LG2'] };
const SPLIT_NAME = { 2: 'Full body, twice a week', 3: 'Full body, three days', 4: 'Upper / lower', 5: 'Upper / lower + push / pull / legs', 6: 'Push / pull / legs, twice a week' };
const RANGES = { muscle: { main: [6, 10], comp: [8, 12], iso: [10, 15] }, strength: { main: [3, 6], comp: [5, 8], iso: [8, 12] }, both: { main: [5, 8], comp: [6, 10], iso: [10, 15] } };
const RIRS = { beginner: [3, 3, 2, 2, 2], intermediate: [3, 2, 2, 1], advanced: [3, 2, 1, 0] };
const VOLT = { beginner: [8, 12], intermediate: [10, 16], advanced: [14, 20] };
const BAL = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes'];
const CAP = { 45: 13, 60: 18, 75: 22, 90: 26 };
const FOCUS = { chest: ['chest'], back: ['back', 'reardelts'], shoulders: ['shoulders', 'reardelts'], arms: ['biceps', 'triceps', 'forearms'], legs: ['quads', 'hamstrings', 'calves'], glutes: ['glutes'] };
const GOAL_NAME = { muscle: 'Build muscle', strength: 'Get stronger', both: 'Strength and size' };
function progVolume(days) {
  const v = {};
  for (const d of days) for (const s of d.slots) { const ex = EX(s.exId); v[ex.m] = (v[ex.m] || 0) + s.sets; for (const m of ex.sec) v[m] = (v[m] || 0) + s.sets * 0.5; }
  return v;
}
function buildProgram(cf) {
  const eq = cf.equip;
  const base = { beginner: { main: 3, comp: 3, iso: 2 }, intermediate: { main: 3, comp: 3, iso: 3 }, advanced: { main: 4, comp: 3, iso: 3 } }[cf.exp];
  const days = SPLITS[cf.days].map(key => {
    const [name, slots] = DAYT[key]; const used = new Set();
    const out = [];
    for (const [p, v, role] of slots) {
      const opts = PAT[p][eq]; let pick = null;
      for (let k = 0; k < opts.length; k++) { const c = opts[(v + k) % opts.length]; if (!used.has(c)) { pick = c; break; } }
      if (!pick) continue; used.add(pick);
      out.push({ exId: slug(pick), role, sets: base[role] });
    }
    return { key, name, slots: out };
  });
  const focusM = new Set((cf.focus || []).flatMap(f => FOCUS[f]));
  days.forEach(d => d.slots.forEach(s => { if (focusM.has(EX(s.exId).m) && s.role !== 'main') s.sets++; }));
  const [lo0, hi0] = VOLT[cf.exp]; const cap = CAP[cf.mins] || 18;
  const tgt = m => focusM.has(m) ? [lo0 + 4, hi0 + 4] : [lo0, hi0];
  const floorOf = m => BAL.includes(m) ? tgt(m)[0] : 6;
  const dayTotal = d => d.slots.reduce((n, s) => n + s.sets, 0);
  const pickMax = arr => arr.sort((a, b) => b.sets - a.sets)[0];
  const LOWPRI = ['calves', 'abs', 'reardelts', 'traps', 'forearms'];
  days.forEach(d => { // fit the session: trim isolation sets, then drop low-priority isolation work, then trim compounds
    let guard = 0;
    while (dayTotal(d) > cap && guard++ < 80) {
      const iso3 = pickMax(d.slots.filter(x => x.role === 'iso' && x.sets > 2));
      if (iso3) { iso3.sets--; continue; }
      const isos = d.slots.filter(x => x.role === 'iso');
      const drop = [...isos].reverse().find(x => LOWPRI.includes(EX(x.exId).m)) || isos[isos.length - 1];
      if (drop && isos.length > 1) { d.slots.splice(d.slots.indexOf(drop), 1); continue; }
      const comp = pickMax(d.slots.filter(x => x.role !== 'main' && x.sets > 2));
      if (comp) { comp.sets--; continue; }
      if (drop) { d.slots.splice(d.slots.indexOf(drop), 1); continue; }
      break;
    }
  });
  for (let it = 0; it < 150; it++) {
    const vol = progVolume(days); let changed = false;
    const need = BAL.filter(m => (vol[m] || 0) < tgt(m)[0])
      .sort((a, b) => (focusM.has(b) - focusM.has(a)) || ((tgt(b)[0] - (vol[b] || 0)) - (tgt(a)[0] - (vol[a] || 0))));
    for (const m of need) {
      let best = null;
      for (const d of days) if (dayTotal(d) < cap) for (const s of d.slots) if (EX(s.exId).m === m && s.sets < 5 && (!best || s.sets < best.sets)) best = s;
      if (best) { best.sets++; changed = true; break; }
      let mv = null; // no spare time that day: move a set from a muscle that is above its floor
      for (const d of days) for (const s of d.slots) {
        if (EX(s.exId).m !== m || s.sets >= 5) continue;
        for (const o of d.slots) {
          if (o === s || o.sets <= 2 || o.role === 'main') continue;
          const om = EX(o.exId).m; if (om === m || need.includes(om)) continue;
          const surplus = (vol[om] || 0) - 1 - floorOf(om);
          if (surplus >= 0 && (!mv || surplus > mv.surplus)) mv = { s, o, surplus };
        }
      }
      if (mv) { mv.s.sets++; mv.o.sets--; changed = true; break; }
    }
    if (changed) continue;
    for (const m of BAL) {
      if ((vol[m] || 0) <= tgt(m)[1]) continue;
      let best = null;
      for (const d of days) for (const s of d.slots) if (EX(s.exId).m === m && s.sets > 2 && (!best || s.sets > best.sets)) best = s;
      if (best) { best.sets--; changed = true; break; }
    }
    if (!changed) break;
  }
  const R = RANGES[cf.goal];
  days.forEach(d => d.slots.forEach(s => { [s.lo, s.hi] = R[s.role]; s.rest = defaultRest(s.role); if (EX(s.exId).type === 'bw' && s.role !== 'iso') { s.lo = 5; s.hi = Math.max(8, Math.min(s.hi, 10)); } }));
  return { cfg: clone(cf), days, rirs: RIRS[cf.exp], vol: progVolume(days), target: [lo0, hi0], focusM: [...focusM] };
}
function nextProgramRoutine() {
  const p = S.program; if (!p) return null;
  const order = (p.order || []).filter(id => S.routines.some(r => r.id === id));
  if (!order.length) return null;
  const last = sortedWorkouts().find(w => order.includes(w.routineId));
  const i = last ? (order.indexOf(last.routineId) + 1) % order.length : 0;
  return S.routines.find(r => r.id === order[i]);
}

/* ================= charts (inline SVG) ================= */
function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p; return 10 * p; }
function barChart(vals, labels, { h = 160, fmt = v => fmtN(v), hi = vals.length - 1, label = 'Bar chart' } = {}) {
  const W = 340, H = h, pl = 36, pb = 22, pt = 10, ch = H - pb - pt;
  const max = niceMax(Math.max(0, ...vals)); const bw = (W - pl) / Math.max(1, vals.length);
  const step = Math.ceil(vals.length / 6);
  let g = '';
  [0, 0.5, 1].forEach(f => { const y = pt + ch * (1 - f); g += `<line class="grid" x1="${pl}" x2="${W}" y1="${y}" y2="${y}"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end">${fmt(max * f)}</text>`; });
  vals.forEach((v, i) => {
    const bh = ch * (v / max); const x = pl + i * bw + bw * 0.18;
    if (v > 0) g += `<rect class="bar${i === hi ? ' hi' : ''}" x="${x.toFixed(1)}" y="${(pt + ch - bh).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(1, bh).toFixed(1)}" rx="4"><title>${esc(labels[i])}: ${fmt(v)}</title></rect>`;
    if (i % step === 0 || i === vals.length - 1 && vals.length <= 8) g += `<text x="${(pl + i * bw + bw / 2).toFixed(1)}" y="${H - 5}" text-anchor="middle">${esc(labels[i])}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}</svg>`;
}
let chartN = 0;
function lineChart(pts, { h = 180, fmt = v => fmtN(v, 1), label = 'Line chart' } = {}) {
  if (!pts.length) return '';
  const W = 340, H = h, pl = 40, pr = 8, pb = 22, pt = 12, ch = H - pb - pt, cw = W - pl - pr;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 === x0) { x0 -= DAY; x1 += DAY; }
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const padY = (y1 - y0) * 0.15 || Math.max(1, y1 * 0.05); y0 = Math.max(0, y0 - padY); y1 = y1 + padY;
  const X = x => pl + cw * (x - x0) / (x1 - x0), Y = y => pt + ch * (1 - (y - y0) / (y1 - y0));
  let g = '';
  [0, 0.5, 1].forEach(f => { const v = y0 + (y1 - y0) * f, y = Y(v); g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="${pl - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`; });
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const gid = 'lg' + (++chartN);
  g += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></linearGradient></defs>`;
  g += `<path class="area" fill="url(#${gid})" d="${path}L${X(pts[pts.length - 1].x).toFixed(1)},${pt + ch}L${X(pts[0].x).toFixed(1)},${pt + ch}Z"/>`;
  g += `<path class="ln" d="${path}"/>`;
  if (pts.length <= 40) pts.forEach(p => { g += `<circle class="dot" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3.5"><title>${fmtDate(p.x, { day: 'numeric', month: 'short', year: 'numeric' })}: ${fmt(p.y)}</title></circle>`; });
  const dl = t => fmtDate(t, { day: 'numeric', month: 'short' });
  g += `<text x="${pl}" y="${H - 5}">${dl(x0)}</text><text x="${W - pr}" y="${H - 5}" text-anchor="end">${dl(x1)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}</svg>`;
}
const PLATE_COL = { 25: '#D52B3A', 20: '#2D5DB3', 15: '#F2B300', 10: '#2E9E5B', 5: '#F4F5F6', 2.5: '#D52B3A', 2: '#2D5DB3', 1.25: '#B9C0C7', 1: '#B9C0C7', 0.5: '#B9C0C7' };
function plateMath(total) {
  const bar = S.settings.bar || 0; let side = (total - bar) / 2; const used = [];
  if (side < 0) return { used, rem: total - bar, side: 0 };
  for (const p of [...S.settings.plates].sort((a, b) => b - a)) { while (side >= p - 1e-9) { used.push(p); side = r2(side - p); } }
  return { used, rem: r2(side * 2) };
}
function plateSvg(used) {
  const W = 340, H = 120, cy = 60, cl = 112, cr = 228;
  let g = `<rect x="6" y="${cy - 4}" width="${W - 12}" height="8" rx="3" fill="var(--hub)"/><rect x="${cl - 6}" y="${cy - 10}" width="6" height="20" rx="2" fill="var(--ink-2)"/><rect x="${cr}" y="${cy - 10}" width="6" height="20" rx="2" fill="var(--ink-2)"/>`;
  const dims = p => p >= 10 ? [96, p >= 25 ? 13 : p >= 20 ? 12 : p >= 15 ? 10 : 9] : p >= 5 ? [62, 8] : p >= 2 ? [50, 6] : [40, 5];
  let xl = cl - 7, xr = cr + 7;
  for (const p of used) {
    const [ph, pw] = dims(p); const col = PLATE_COL[p] || '#B9C0C7';
    g += `<rect x="${xl - pw}" y="${cy - ph / 2}" width="${pw}" height="${ph}" rx="2" fill="${col}" stroke="rgba(0,0,0,.25)"/>`;
    g += `<rect x="${xr}" y="${cy - ph / 2}" width="${pw}" height="${ph}" rx="2" fill="${col}" stroke="rgba(0,0,0,.25)"/>`;
    xl -= pw + 1; xr += pw + 1;
  }
  return `<svg class="plates-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Loaded barbell">${g}</svg>`;
}

/* ================= UI state and small helpers ================= */
const ui = {
  tab: 'train', view: null, statsRange: '3m', statsMetric: 'dur', mvol: 'week', calMonth: monthStart(Date.now()),
  exq: '', exm: '', pick: null, draft: null, exAll: false, exMetric: null, mMetric: 'bw', plateW: null, pendingImport: null,
  cf: { goal: 'muscle', exp: 'intermediate', days: 4, mins: 60, equip: 'gym', focus: [] }, preview: null, rebuild: false,
};
const I = {
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  coach: '<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>',
  stats: '<path d="M5 20v-8M12 20V5M19 20v-12"/>',
  history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.4 3.9-8.3.6 1.9 1.7 2.9 2.9 3.4.1-2.6 1.2-4.9 3.2-6.4.4 3.4 3 5.6 3 9.4 0 4.6-2.7 8.1-6.5 8.1z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v4M8.5 20h7"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M8.8 10a4 4 0 0 1 6.4 0M12 10.5l1.4-1.8"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const da = o => Object.entries(o).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
const btnSeg = (a, k, opts, cur) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" aria-pressed="${String(cur) === String(v)}"${da({ a, k, v })}>${esc(l)}</button>`).join('')}</div>`;
const rirOptions = (cur, auto) => (auto ? `<option value=""${cur == null ? ' selected' : ''}>${esc(auto)}</option>` : `<option value=""${cur == null ? ' selected' : ''}>–</option>`) + [0, 1, 2, 3, 4, 5].map(v => `<option value="${v}"${cur === v ? ' selected' : ''}>${v === 5 ? '5+' : v}</option>`).join('');
const restOptions = cur => [45, 60, 90, 120, 150, 180, 240, 300].map(v => `<option value="${v}"${cur === v ? ' selected' : ''}>${fmtClock(v)}</option>`).join('');
const backHdr = (title, right = '', act = 'back') => `<header class="top"><button class="icon-btn" data-a="${act}" aria-label="Back">${icon('back')}</button><div class="grow"><h1 class="title sm">${esc(title)}</h1></div>${right}</header>`;

/* ================= train (home dashboard) ================= */
const RCOL = ['var(--accent)', 'var(--reps)', 'var(--orange)', 'var(--violet)', 'var(--go)'];
function fmtK(v) { return v >= 1e6 ? fmtN(v / 1e6, 1) + 'M' : v >= 1e4 ? fmtN(v / 1e3, 1) + 'k' : fmtN(v); }
function agoText(ts) { const d = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / DAY); return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d < 14 ? `${d} days ago` : fmtDate(ts, { day: 'numeric', month: 'short' }); }
function nextOwnRoutine() {
  const own = S.routines.filter(r => !r.programId && r.ex.length); if (!own.length) return null;
  const last = sortedWorkouts().find(w => own.some(r => r.id === w.routineId));
  return last ? own[(own.findIndex(r => r.id === last.routineId) + 1) % own.length] : own[0];
}
function ringSvg(frac, col, size = 58, sw = 6) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, f = clamp(frac || 0, 0, 1), m = size / 2;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${sw}"/>${f > 0 ? `<circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${m} ${m})"/>` : ''}</svg>`;
}
function dotsTile() {
  const weeks = 13, start = addDays(weekStart(Date.now()), -7 * (weeks - 1)), today = startOfDay(Date.now());
  const on = new Set(S.workouts.map(w => startOfDay(w.start)));
  let months = '', dots = '', lastM = -1;
  for (let c = 0; c < weeks; c++) {
    const d0 = addDays(start, 7 * c), m = new Date(d0).getMonth();
    months += `<span>${m !== lastM ? esc(fmtDate(d0, { month: 'short' })) : ''}</span>`; lastM = m;
    for (let r = 0; r < 7; r++) { const d = addDays(d0, r); dots += `<i class="${on.has(d) ? 'on' : ''}${d === today ? ' now' : ''}${d > today ? ' fut' : ''}"></i>`; }
  }
  const n = S.workouts.filter(w => w.start >= start).length;
  return `<button class="tile wide" data-a="tab" data-t="history" aria-label="Training days, last 13 weeks: ${n} sessions"><div class="months">${months}</div><div class="dots">${dots}</div><div class="row between" style="margin-top:14px"><div><div class="tl">Training days</div><div class="ts">Last 13 weeks</div></div><div class="big sm">${n}<small> sessions</small></div></div></button>`;
}
function rtile(r, idx) {
  const last = sortedWorkouts().find(w => w.routineId === r.id), done = last && last.start >= weekStart(Date.now());
  return `<button class="rtile" data-a="routineMenu" data-id="${r.id}" aria-label="${esc(r.name)}: preview and start"><span class="rnum" style="--rc:${RCOL[idx % RCOL.length]};--p:${done ? 1 : 0.3}">${idx + 1}</span><span class="grow"><b>${esc(r.name)}</b><small>${r.ex.length} exercises${done ? ', done this week' : last ? `, last ${esc(fmtDate(last.start, { weekday: 'short' }))}` : ''}</small></span>${icon('chevR')}</button>`;
}
function vTrain() {
  const now = Date.now(), wk = weekStart(now), today = startOfDay(now), hr = new Date().getHours();
  const thisWeek = S.workouts.filter(w => w.start >= wk);
  const wst = thisWeek.reduce((a, w) => { const s = workoutStats(w); a.vol += s.vol; a.dur += s.dur; return a; }, { vol: 0, dur: 0 });
  const prs30 = S.workouts.filter(w => w.start >= now - 30 * DAY).reduce((n, w) => n + (w.prs || []).length, 0);
  let h = `<header class="top"><div class="grow"><div class="eyebrow">${hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'}</div><h1 class="title">Workouts</h1></div><button class="icon-btn round" data-a="go" data-v="settings" aria-label="Settings">${icon('sliders')}</button><button class="icon-btn round" data-a="newRoutine" aria-label="New routine">${icon('plus')}</button></header>`;
  h += `<div class="weekstrip">`;
  for (let i = 0; i < 7; i++) { const d = addDays(wk, i), on = S.workouts.some(w => startOfDay(w.start) === d); h += `<div class="wd${d === today ? ' today' : ''}${on ? ' on' : ''}"><span>${esc(new Date(d).toLocaleDateString(undefined, { weekday: 'short' }))}</span><b>${new Date(d).getDate()}</b><i></i></div>`; }
  h += `</div>` + noticesHtml();
  if (S.active) {
    h += `<section class="hero"><div class="eyebrow">${S.active.editOf ? 'Editing' : 'In progress'}</div><div class="hero-t">${esc(S.active.name)}</div><div class="chipsrow"><span class="pill">${icon('clock')} ${S.active.editOf ? 'Saved workout' : fmtClock((now - S.active.start) / 1000)}</span><span class="pill">${icon('dumbbell')} ${S.active.ex.length} exercises</span></div><button class="btn pri block big" data-a="resume">${icon('play')} Resume workout</button></section>`;
  } else {
    const nx = nextProgramRoutine() || nextOwnRoutine(), pw = progWeek();
    if (nx) {
      const sets = nx.ex.reduce((n, e) => n + (e.sets ? e.sets.length : 0), 0), g = exGroups(nx.ex);
      h += `<section class="hero"><div class="eyebrow">Up next${nx.programId && pw ? (pw.deload ? ', deload week' : `, week ${pw.week} of ${pw.len - 1}`) : ''}</div><div class="hero-t">${esc(nx.name)}</div><div class="hero-s">${esc(g.slice(0, 3).map(x => x[0]).join(', '))}${g.length > 3 ? ' and more' : ''}</div><div class="chipsrow"><span class="pill">${icon('clock')} ~${Math.round(sets * 2.9 + 6)} min</span><span class="pill">${icon('dumbbell')} ${nx.ex.length} exercises</span></div><button class="btn pri block big" data-a="startRoutine" data-id="${nx.id}">${icon('play')} Start workout</button><button class="btn block ghost" style="margin-top:6px" data-a="startEmpty">Empty workout instead</button></section>`;
    } else h += `<section class="hero"><div class="eyebrow">Today</div><div class="hero-t">Ready to train</div><button class="btn pri block big" data-a="startEmpty">${icon('play')} Start empty workout</button></section>`;
  }
  h += `<div class="stats3"><div class="stat"><span class="chipi c-blue">${icon('clock')}</span><b>${fmtN(wst.dur / 3.6e6, 1)}</b><small>Hours this week</small></div><div class="stat"><span class="chipi c-orange">${icon('flame')}</span><b>${fmtK(wst.vol)}</b><small>kg this week</small></div><div class="stat"><span class="chipi c-lime">${icon('trophy')}</span><b>${prs30}</b><small>Records in 30 days</small></div></div>`;
  const lastBw = S.measures.filter(m => m.bw != null).sort((a, b) => b.date - a.date)[0];
  const target = S.program ? S.program.cfg.days : 3, vol7 = S.workouts.filter(w => w.start >= now - 7 * DAY).reduce((a, w) => a + workoutStats(w).vol, 0);
  h += `<div class="bento">`;
  h += `<button class="tile" data-a="go" data-v="measures"><span class="chipi c-violet">${icon('scale')}</span><div class="big">${lastBw ? fmtW(lastBw.bw) : '–'}<small> kg</small></div><div class="tl">Body weight</div><div class="ts">${lastBw ? esc(agoText(lastBw.date)) : 'Tap to log'}</div></button>`;
  h += `<button class="tile" data-a="tab" data-t="stats"><div class="ringwrap">${ringSvg(thisWeek.length / target, 'var(--accent)')}<b>${thisWeek.length}</b></div><div class="tl">${thisWeek.length} of ${target} this week</div><div class="ts">${weekStreak()} week streak</div></button>`;
  h += dotsTile();
  h += `<button class="tile wide row" data-a="tab" data-t="stats"><div class="grow"><div class="tl">Volume lifted</div><div class="ts">Last 7 days</div></div><div class="big">${fmtN(vol7)}<small> kg</small></div></button>`;
  h += `</div>`;
  const prog = S.routines.filter(r => r.programId), mine = S.routines.filter(r => !r.programId);
  if (prog.length) h += `<div class="sec"><h2 class="h">Coach program</h2><button class="btn sm" data-a="tab" data-t="coach">Details</button></div><div class="rgrid">${prog.map(rtile).join('')}</div>`;
  h += `<div class="sec"><h2 class="h">Routines</h2><button class="btn sm" data-a="newRoutine">${icon('plus')} New</button></div>`;
  h += mine.length ? `<div class="rgrid">${mine.map(rtile).join('')}</div>` : `<p class="muted">No routines yet. Create one, or let the coach build a program.</p>`;
  return h;
}

/* ================= live workout ================= */
function liveSug(e) {
  if (S.active.editOf) return null;
  const nSets = e.sets.filter(isWorkT).length || 1;
  const pw = e.rx.prog ? progWeek() : null;
  return suggest(e.exId, e.rx, { nSets, rir: targetRirFor(e.rx), deload: !!(pw && pw.deload), template: e.tmpl, exclude: S.active.editOf, ...routineCtx() });
}
function routineCtx() { const a = S.active, r = a && S.routines.find(x => x.id === a.routineId); return { rid: a ? a.routineId : null, rname: r ? r.name : null, since: r ? (r.planStart || 0) : 0 }; }
function prevFor(e) { const a = S.active; if (!a || a.editOf) return null; const h = pickHist(e.exId, { ...routineCtx() })[0]; return h ? { warm: h.all.filter(s => s.type === 'w'), work: h.all.filter(isWorkT), start: h.start } : null; }
function ssCls(L, i) { const e = L[i]; if (!e || !e.ss) return ''; const p = L[i - 1] && L[i - 1].ss === e.ss, n = L[i + 1] && L[i + 1].ss === e.ss; return ' ss' + (n ? ' ss-a' : '') + (p ? ' ss-b' : ''); }
function ssTag(L, i, live) { const e = L[i]; if (!e || !e.ss) return ''; const n = L[i + 1] && L[i + 1].ss === e.ss; return `<div class="sstag">${icon('link')} ${n ? (live ? `Superset, then ${esc(EX(L[i + 1].exId).name)}` : 'Superset with the next exercise') : 'Superset, rest after this one'}</div>`; }
function placeholderFor(e, j, sug, prev) {
  const s = e.sets[j]; if (!s || s.type === 'w' || s.type === 'd') {
    if (s && s.type === 'd') { const p = e.sets[j - 1]; return p ? { w: p.w != null ? roundTo(p.w * 0.75, incFor(e.exId)) : null, r: p.r } : {}; }
    return {};
  }
  let k = 0; for (let x = 0; x < j; x++) if (isWorkT(e.sets[x])) k++;
  if (sug && sug.targets && sug.targets.length) {
    if (k < sug.targets.length) return sug.targets[k];
    return sug.kind === 'deload' ? {} : sug.targets[sug.targets.length - 1];
  }
  if (prev && prev.work.length) return prev.work[Math.min(k, prev.work.length - 1)];
  const t = (e.tmpl || []).filter(x => (x.type || 'n') !== 'w');
  return t[k] || {};
}
function vWorkout() {
  const w = S.active;
  if (!w) { ui.view = null; return vTrain(); }
  const edit = !!w.editOf, st = workoutStats(w);
  const routine = S.routines.find(r => r.id === w.routineId);
  const pw = routine && routine.programId ? progWeek() : null;
  let h = `<header class="wk-hdr"><button class="icon-btn" data-a="minimize" aria-label="Back to the app (workout keeps running)">${icon('down')}</button><div class="grow"><input class="wk-name" data-in="wname" value="${esc(w.name)}" aria-label="Workout name"><div class="wk-sub">${edit ? esc(fmtDate(w.start, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) : `<span id="elapsed">${fmtClock((Date.now() - w.start) / 1000)}</span>`}<span class="sep"></span>${fmtN(st.vol)} kg<span class="sep"></span>${st.sets} sets</div></div><button class="btn pri sm" data-a="finish">${edit ? 'Save' : 'Finish'}</button></header>`;
  if (pw && !edit) h += `<div class="banner"><span class="disc ${pw.deload ? 'k-deload' : 'k-first'}" aria-hidden="true"></span><div>${pw.deload ? 'Deload week: half the sets, lighter loads, stop with 4+ reps in reserve.' : `Week ${pw.week} of ${pw.len - 1}. Finish working sets with about ${pw.rir} reps in reserve.`}</div></div>`;
  if (!w.ex.length) h += `<p class="muted" style="margin:24px 4px">Add your first exercise to get going.</p>`;
  h += w.ex.map((e, i) => exCard(e, i, edit)).join('');
  h += `<div class="stack" style="margin-top:16px"><button class="btn block" data-a="addEx">${icon('plus')} Add exercise</button><button class="btn block danger" data-a="discard">${edit ? 'Cancel editing' : 'Discard workout'}</button></div>`;
  return h;
}
function exCard(e, i, edit) {
  const ex = EX(e.exId), T = TYPES[ex.type];
  const sug = edit ? null : liveSug(e);
  const prev = edit ? null : prevFor(e);
  const ranged = ex.type === 'wr' || ex.type === 'aw' || ex.type === 'bw';
  const rxText = (ranged ? `${e.rx.lo}–${e.rx.hi} reps, RIR ${targetRirFor(e.rx)}, ` : '') + `rest ${fmtClock(e.rx.rest ?? S.settings.rest)}`;
  let h = `<section class="exc${ssCls(w0().ex, i)}"><div class="exc-h"><div class="grow"><button class="exname" data-a="go" data-v="exdetail" data-id="${ex.id}">${esc(ex.name)}</button><div class="tagline">${esc(MUSCLES[ex.m] || '')}<span class="sep"></span><button class="link" data-a="exRx" data-i="${i}">${rxText}</button></div></div><button class="icon-btn" data-a="exMenu" data-i="${i}" aria-label="Options for ${esc(ex.name)}">${icon('more')}</button></div>`;
  h += ssTag(w0().ex, i, true);
  if (sug) h += `<div class="sug k-${sug.kind}"><span class="disc" aria-hidden="true"></span><div class="grow"><div class="t">${esc(sug.title)}</div>${sug.detail ? `<div class="d">${esc(sug.detail)}</div>` : ''}<div class="why">${esc(sug.why)}</div></div>${sug.targets && sug.targets.length ? `<button class="btn sm line" data-a="useSug" data-i="${i}" aria-label="Fill in these targets">Fill</button>` : ''}</div>`;
  h += `<input class="note" data-in="exnote" data-i="${i}" value="${esc(e.note || '')}" placeholder="Add a note" aria-label="Note for ${esc(ex.name)}">`;
  h += `<div class="sets-head ${T.g}"><span>Set</span><span>Previous</span>${T.cols.map(c => `<span>${c[1]}</span>`).join('')}<span><span hidden>Done</span></span></div>`;
  let nW = 0, nWarm = 0;
  e.sets.forEach((s, j) => {
    const warm = s.type === 'w', k = warm ? nWarm++ : (isWorkT(s) ? nW++ : -1);
    const label = warm ? 'W' : s.type === 'd' ? 'D' : s.type === 'f' ? 'F' : String(k + 1);
    const pv = prev ? (warm ? prev.warm[k] : k >= 0 ? prev.work[k] : null) : null;
    const ph = placeholderFor(e, j, sug, prev);
    h += `<div class="set ${T.g}${s.done ? ' done' : ''}"><button class="lbl t-${s.type}" data-a="setMenu" data-i="${i}" data-j="${j}" aria-label="Set ${label} options">${label}${s.pr ? '<i class="pr">PR</i>' : ''}</button>`;
    h += `<button class="prev" data-a="usePrev" data-i="${i}" data-j="${j}" aria-label="Copy previous">${pv ? esc(fmtPrev(pv, ex.type)) : '–'}</button>`;
    for (const [key, lab] of T.cols) {
      if (key === 'rir') { h += `<select class="in" data-in="set" data-i="${i}" data-j="${j}" data-k="rir" aria-label="Reps in reserve">${rirOptions(s.rir)}</select>`; continue; }
      const im = key === 'r' || (key === 't' && ex.type === 'dur') ? 'numeric' : 'decimal';
      h += `<input class="in" inputmode="${im}" autocomplete="off" data-in="set" data-i="${i}" data-j="${j}" data-k="${key}" value="${s[key] ?? ''}" placeholder="${ph && ph[key] != null ? esc(fmtW(ph[key])) : ''}" aria-label="${lab}">`;
    }
    h += `<button class="chk" data-a="check" data-i="${i}" data-j="${j}" aria-pressed="${!!s.done}" aria-label="${s.done ? 'Mark not done' : 'Complete set'}">${icon('check')}</button></div>`;
  });
  h += `<div class="exc-f"><button class="btn sm" data-a="addSet" data-i="${i}">${icon('plus')} Add set</button>`;
  if (!edit && (ex.type === 'wr') && ex.eq !== 'bodyweight') h += `<button class="btn sm" data-a="warmup" data-i="${i}">Warm-up sets</button>`;
  if (ex.eq === 'barbell' && ex.type === 'wr') h += `<button class="btn sm" data-a="plates" data-i="${i}">Plates</button>`;
  return h + `</div></section>`;
}
const w0 = () => S.active || {};

/* ================= routine editor ================= */
function vRoutine() {
  const d = ui.draft; if (!d) { ui.view = null; return vTrain(); }
  let h = backHdr(d.id ? 'Edit routine' : 'New routine', `<button class="btn pri sm" data-a="saveRoutine">Save</button>`, 'cancelDraft');
  h += `<label class="lab" for="rname">Name</label><input id="rname" class="field" data-in="rname" value="${esc(d.name)}" placeholder="e.g. Upper A">`;
  if (d.programId) h += `<p class="small muted">Part of your coach program. Edits are kept until you build a new program.</p>`;
  d.ex.forEach((re, i) => {
    const ex = EX(re.exId), T = TYPES[ex.type], rx = rxFor(re, d);
    const ranged = ex.type === 'wr' || ex.type === 'aw' || ex.type === 'bw';
    const cols = T.cols.filter(c => c[0] !== 'rir');
    h += `<section class="exc${ssCls(d.ex, i)}"><div class="exc-h"><div class="grow"><div class="exname">${esc(ex.name)}</div><div class="tagline">${esc(MUSCLES[ex.m] || '')}</div></div><button class="icon-btn" data-a="rExMenu" data-i="${i}" aria-label="Options for ${esc(ex.name)}">${icon('more')}</button></div>`;
    h += ssTag(d.ex, i, false);
    h += `<div class="rx-grid" style="margin:10px 4px 8px">`;
    if (ranged) h += `<div><label>Rep range</label><div class="row" style="gap:4px"><input class="in" inputmode="numeric" data-in="rrx" data-i="${i}" data-k="lo" value="${rx.lo ?? ''}" aria-label="Lowest reps"><span class="faint">–</span><input class="in" inputmode="numeric" data-in="rrx" data-i="${i}" data-k="hi" value="${rx.hi ?? ''}" aria-label="Highest reps"></div></div>
      <div><label>Target RIR</label><select class="in" data-in="rrx" data-i="${i}" data-k="rir">${rirOptions(re.rir, 'Auto')}</select></div>`;
    h += `<div><label>Rest</label><select class="in" data-in="rrx" data-i="${i}" data-k="rest">${restOptions(rx.rest)}</select></div></div>`;
    h += `<div class="small faint" style="padding:0 4px">Starting numbers (the coach uses your history once you have some)</div>`;
    re.sets.forEach((s, j) => {
      h += `<div class="rset${cols.length === 1 ? ' one' : ''}"><span class="n">${j + 1}</span>${cols.map(([k, lab]) => `<input class="in" inputmode="${k === 'r' ? 'numeric' : 'decimal'}" data-in="rset" data-i="${i}" data-j="${j}" data-k="${k}" value="${s[k] ?? ''}" placeholder="${lab}" aria-label="${lab}">`).join('')}<button class="icon-btn" data-a="rDelSet" data-i="${i}" data-j="${j}" aria-label="Remove set">${icon('x')}</button></div>`;
    });
    h += `<div class="exc-f"><button class="btn sm" data-a="rAddSet" data-i="${i}">${icon('plus')} Add set</button></div></section>`;
  });
  h += `<div class="stack" style="margin-top:16px"><button class="btn block" data-a="rAddEx">${icon('plus')} Add exercise</button>${d.id ? `<button class="btn block danger" data-a="deleteRoutine" data-id="${d.id}">Delete routine</button>` : ''}</div>`;
  return h;
}

/* ================= history ================= */
function vHistory() {
  let h = `<header class="top"><div class="grow"><h1 class="title">History</h1></div></header>`;
  const ws = sortedWorkouts();
  if (!ws.length) return h + `<div class="card"><p>No workouts logged yet.</p><p class="muted small">Finish a workout and it shows up here. You can also bring over your Hevy history from Settings.</p><button class="btn block" data-a="go" data-v="settings">Open settings</button></div>`;
  let cur = '';
  for (const w of ws) {
    const ml = fmtDate(w.start, { month: 'long', year: 'numeric' });
    if (ml !== cur) { cur = ml; h += `<div class="sec"><h2 class="h3 muted">${esc(ml)}</h2></div>`; }
    const st = workoutStats(w), prs = (w.prs || []).length;
    const lines = w.ex.slice(0, 4).map(e => `<div class="small muted">${e.sets.filter(s => s.type !== 'w').length} × ${esc(EX(e.exId).name)}</div>`).join('');
    h += `<button class="card" style="display:block;width:100%;text-align:left" data-a="go" data-v="wdetail" data-id="${w.id}"><div class="row between"><span class="h3">${esc(w.name)}</span><span class="small faint">${esc(fmtDate(w.start))}</span></div>
    <div class="small" style="margin:4px 0 8px">${fmtDur(st.dur)}<span class="sep"></span>${fmtN(st.vol)} kg<span class="sep"></span>${st.sets} sets${prs ? `<span class="sep"></span><span class="tag">${prs} PR${prs > 1 ? 's' : ''}</span>` : ''}</div>${lines}${w.ex.length > 4 ? `<div class="small faint">and ${w.ex.length - 4} more</div>` : ''}</button>`;
  }
  return h;
}
function vWDetail(id) {
  const w = S.workouts.find(x => x.id === id);
  if (!w) { ui.view = null; return vHistory(); }
  const st = workoutStats(w);
  let h = backHdr(w.name, `<button class="icon-btn" data-a="wMenu" data-id="${w.id}" aria-label="Workout options">${icon('more')}</button>`);
  h += `<p class="muted small" style="margin-top:0">${esc(fmtDate(w.start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}, ${esc(new Date(w.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))}</p>`;
  h += `<div class="tiles"><div class="tile"><div class="v">${fmtDur(st.dur)}</div><div class="l">Time</div></div><div class="tile"><div class="v">${fmtN(st.vol)} kg</div><div class="l">Volume</div></div><div class="tile"><div class="v">${st.sets}</div><div class="l">Working sets</div></div><div class="tile"><div class="v">${(w.prs || []).length}</div><div class="l">Records</div></div></div>`;
  if (w.note) h += `<div class="card flat"><p style="margin:0">${esc(w.note)}</p></div>`;
  const ms = muscleSets([w]); const tot = Object.values(ms).reduce((a, b) => a + b, 0);
  if (tot) {
    h += `<section class="card"><h2 class="h3">Muscles worked</h2><p class="small muted">Share of sets, counting secondary muscles as half a set.</p>`;
    Object.entries(ms).sort((a, b) => b[1] - a[1]).forEach(([m, v]) => { const p = v / tot; h += `<div class="mbar"><span>${esc(MUSCLES[m] || m)}</span><div class="mtrack"><div class="mfill in" style="width:${(p * 100).toFixed(1)}%"></div></div><span class="v">${Math.round(p * 100)}%</span></div>`; });
    h += `</section>`;
  }
  for (const e of w.ex) {
    const ex = EX(e.exId); const prs = (w.prs || []).filter(p => p.exId === e.exId);
    let n = 0;
    h += `<section class="card"><button class="exname" data-a="go" data-v="exdetail" data-id="${ex.id}">${esc(ex.name)}</button>${e.ss ? `<div class="sstag">${icon('link')} Superset</div>` : ''}${prs.length ? `<div style="margin:6px 0">${prs.map(p => `<span class="tag">${esc(p.kind)}: ${esc(p.val)}</span>`).join(' ')}</div>` : ''}${e.note ? `<p class="small muted">${esc(e.note)}</p>` : ''}`;
    for (const s of e.sets) {
      const lab = s.type === 'w' ? 'W' : s.type === 'd' ? 'D' : s.type === 'f' ? 'F' : String(++n);
      h += `<div class="wset"><span class="s t-${s.type}">${lab}</span><span class="grow">${esc(fmtSet(s, ex.type))}</span>${s.rir != null ? `<span class="small muted">RIR ${s.rir}</span>` : ''}</div>`;
    }
    h += `</section>`;
  }
  return h;
}

/* ================= stats ================= */
function rangeBuckets() {
  const now = Date.now(), r = ui.statsRange;
  if (r === '1m' || r === '3m') {
    const n = r === '1m' ? 5 : 13, ws = weekStart(now), out = [];
    for (let i = n - 1; i >= 0; i--) { const s = addDays(ws, -7 * i); out.push({ s, e: addDays(s, 7), label: fmtDate(s, { day: 'numeric', month: 'short' }) }); }
    return out;
  }
  let n = 12;
  if (r === 'all') { const first = S.workouts.length ? Math.min(...S.workouts.map(w => w.start)) : now; const a = new Date(first), b = new Date(now); n = clamp((b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() + 1, 1, 60); }
  const ms = monthStart(now), out = [];
  for (let i = n - 1; i >= 0; i--) { const s = addMonths(ms, -i); out.push({ s, e: addMonths(s, 1), label: fmtDate(s, { month: 'short' }) }); }
  return out;
}
function weekStreak() {
  let ws = weekStart(Date.now()), n = 0;
  const has = s => S.workouts.some(w => w.start >= s && w.start < addDays(s, 7));
  if (!has(ws)) ws = addDays(ws, -7);
  while (has(ws) && n < 520) { n++; ws = addDays(ws, -7); }
  return n;
}
function vStats() {
  let h = `<header class="top"><div class="grow"><div class="eyebrow">Your progress</div><h1 class="title">Stats</h1></div></header>`;
  const n30 = Date.now() - 30 * DAY, p30 = n30 - 30 * DAY;
  const in30 = S.workouts.filter(w => w.start >= n30), pr30 = S.workouts.filter(w => w.start >= p30 && w.start < n30);
  const v30 = in30.reduce((a, w) => a + workoutStats(w).vol, 0), vp = pr30.reduce((a, w) => a + workoutStats(w).vol, 0);
  const delta = vp > 0 ? Math.round((v30 - vp) / vp * 100) : null;
  const heavy = Math.max(0, ...in30.flatMap(w => w.ex.flatMap(e => EX(e.exId).type === 'wr' ? e.sets.filter(isWork).map(s => s.w || 0) : [])));
  const wk9 = Array.from({ length: 9 }, (_, i) => { const s = addDays(weekStart(Date.now()), -7 * (8 - i)); return { x: s, y: S.workouts.filter(w => w.start >= s && w.start < addDays(s, 7)).reduce((a, w) => a + workoutStats(w).vol, 0) }; });
  h += `<section class="hero"><div class="eyebrow">Last 30 days</div><div class="row" style="align-items:center;gap:10px;margin-top:4px"><div class="huge">${fmtK(v30)}</div>${delta != null ? `<span class="delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}%</span>` : ''}</div><div class="hero-s strong">kg total volume</div><p class="small muted">${in30.length ? `Roughly ${fmtK(v30 / in30.length)} kg per session. Heaviest single set: ${fmtW(heavy)} kg.` : 'Log a workout to start your trend.'}</p>${wk9.some(p => p.y > 0) ? `<div class="chartbox"><div class="tl">Volume</div><div class="ts">9-week trend</div>${lineChart(wk9, { h: 150, fmt: v => fmtK(v), label: 'Weekly volume, last 9 weeks' })}</div>` : ''}</section>`;
  h += btnSeg('statsRange', 'r', [['1m', '1 month'], ['3m', '3 months'], ['1y', '1 year'], ['all', 'All']], ui.statsRange);
  const B = rangeBuckets(), from = B[0].s;
  const inR = S.workouts.filter(w => w.start >= from);
  const tot = inR.reduce((a, w) => { const s = workoutStats(w); a.vol += s.vol; a.dur += s.dur; a.sets += s.sets; return a; }, { vol: 0, dur: 0, sets: 0 });
  h += `<div class="tiles" style="margin-top:12px"><div class="tile"><div class="v">${inR.length}</div><div class="l">Workouts</div></div><div class="tile"><div class="v">${fmtN(tot.dur / 3.6e6, 1)} h</div><div class="l">Training time</div></div><div class="tile"><div class="v">${fmtN(tot.vol / 1000, 1)} t</div><div class="l">Volume lifted</div></div><div class="tile"><div class="v">${weekStreak()}</div><div class="l">Week streak</div></div></div>`;
  const metric = ui.statsMetric;
  const val = w => { const s = workoutStats(w); return metric === 'dur' ? s.dur / 3.6e6 : metric === 'vol' ? s.vol : metric === 'sets' ? s.sets : s.reps; };
  const vals = B.map(b => S.workouts.filter(w => w.start >= b.s && w.start < b.e).reduce((a, w) => a + val(w), 0));
  const fmt = metric === 'dur' ? v => fmtN(v, 1) + ' h' : metric === 'vol' ? v => v >= 1000 ? fmtN(v / 1000, 1) + 't' : fmtN(v) : v => fmtN(v);
  h += `<section class="card"><div class="row between"><h2 class="h3">${ui.statsRange === '1m' || ui.statsRange === '3m' ? 'Per week' : 'Per month'}</h2></div>${btnSeg('statsMetric', 'm', [['dur', 'Time'], ['vol', 'Volume'], ['sets', 'Sets'], ['reps', 'Reps']], metric)}<div style="margin-top:12px">${barChart(vals, B.map(b => b.label), { fmt, label: 'Training per period' })}</div></section>`;

  // weekly sets per muscle vs evidence-based target
  const tgt = S.program ? VOLT[S.program.cfg.exp] : [10, 20];
  let ms;
  if (ui.mvol === 'week') ms = muscleSets(S.workouts.filter(w => w.start >= weekStart(Date.now())));
  else { const s4 = addDays(weekStart(Date.now()), -28); ms = muscleSets(S.workouts.filter(w => w.start >= s4 && w.start < weekStart(Date.now()))); for (const k in ms) ms[k] /= 4; }
  const mlist = [...new Set([...BAL, 'reardelts', 'traps', 'forearms', 'calves', 'abs', ...Object.keys(ms)])].filter(m => m !== 'cardio' && m !== 'other' && (BAL.includes(m) || ms[m]));
  const top = Math.max(24, tgt[1] + 4, ...mlist.map(m => ms[m] || 0));
  h += `<section class="card"><h2 class="h3">Hard sets per muscle</h2><p class="small muted">Shaded band is the target zone (${tgt[0]}–${tgt[1]} sets a week). Secondary muscles count as half a set.</p>${btnSeg('mvol', 'v', [['week', 'This week'], ['avg', '4-week average']], ui.mvol)}<div style="margin-top:10px">`;
  for (const m of mlist) {
    const v = ms[m] || 0, cls = v < tgt[0] ? '' : v <= tgt[1] ? 'in' : 'over';
    h += `<div class="mbar"><span>${esc(MUSCLES[m])}</span><div class="mtrack"><div class="mzone" style="left:${(tgt[0] / top * 100).toFixed(1)}%;width:${((tgt[1] - tgt[0]) / top * 100).toFixed(1)}%"></div><div class="mfill ${cls}" style="width:${(Math.min(v, top) / top * 100).toFixed(1)}%"></div></div><span class="v">${fmtN(v, 1)}</span></div>`;
  }
  h += `</div><div class="legend"><span><i style="background:var(--ink-2)"></i>Below</span><span><i style="background:var(--go)"></i>In zone</span><span><i style="background:var(--accent)"></i>Above</span></div></section>`;

  // exercises
  const seen = new Map();
  for (const w of sortedWorkouts()) for (const e of w.ex) if (!seen.has(e.exId)) seen.set(e.exId, w.start);
  const exIds = [...seen.keys()];
  h += `<section class="card"><h2 class="h3">Exercise progress</h2>`;
  if (!exIds.length) h += `<p class="muted small">Your exercises appear here after your first workout.</p>`;
  (ui.exAll ? exIds : exIds.slice(0, 8)).forEach(id => {
    const ex = EX(id), hist = exHistory(id);
    const best = ex.type === 'wr' ? Math.max(0, ...hist.flatMap(h => h.sets.map(s => e1rm(s.w, s.r)))) : 0;
    h += `<button class="list-row" data-a="go" data-v="exdetail" data-id="${id}"><div class="grow"><b>${esc(ex.name)}</b><div class="small muted">${hist.length} ${hist.length === 1 ? 'session' : 'sessions'}${best ? `, best e1RM ${fmtN(best, 1)} kg` : ''}</div></div>${icon('chevR')}</button>`;
  });
  if (exIds.length > 8) h += `<button class="btn sm block" style="margin-top:8px" data-a="exAll">${ui.exAll ? 'Show fewer' : `Show all ${exIds.length}`}</button>`;
  h += `</section>`;

  // calendar
  const cm = ui.calMonth, first = new Date(cm), lead = (first.getDay() + 6) % 7, dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const daysOn = new Set(S.workouts.map(w => startOfDay(w.start))), today = startOfDay(Date.now());
  h += `<section class="card"><div class="row between"><button class="icon-btn" data-a="calNav" data-n="-1" aria-label="Previous month">${icon('back')}</button><h2 class="h3">${esc(fmtDate(cm, { month: 'long', year: 'numeric' }))}</h2><button class="icon-btn" data-a="calNav" data-n="1" aria-label="Next month">${icon('chevR')}</button></div><div class="cal">`;
  for (let i = 0; i < 7; i++) h += `<div class="h">${esc(new Date(addDays(weekStart(Date.now()), i)).toLocaleDateString(undefined, { weekday: 'narrow' }))}</div>`;
  for (let i = 0; i < lead; i++) h += `<div></div>`;
  for (let d = 1; d <= dim; d++) { const ts = new Date(first.getFullYear(), first.getMonth(), d).getTime(); h += `<div class="d${daysOn.has(ts) ? ' on' : ''}${ts === today ? ' today' : ''}">${d}</div>`; }
  h += `</div></section>`;

  const lastM = [...S.measures].sort((a, b) => b.date - a.date)[0];
  h += `<section class="card"><div class="row"><div class="grow"><h2 class="h3">Body measurements</h2><p class="small muted">${lastM ? `Last entry ${esc(fmtDate(lastM.date, { day: 'numeric', month: 'short' }))}${lastM.bw ? `, ${fmtW(lastM.bw)} kg` : ''}` : 'Track body weight, body fat and tape measurements.'}</p></div><button class="btn" data-a="go" data-v="measures">Open</button></div></section>`;
  return h;
}
function vExDetail(id) {
  const ex = EX(id), hist = exHistory(id), chron = hist.slice().reverse();
  const M = { wr: [['e1', 'Best e1RM'], ['w', 'Heaviest'], ['vol', 'Volume'], ['reps', 'Best reps']], aw: [['reps', 'Best reps'], ['help', 'Least help']], bw: [['reps', 'Best reps'], ['tot', 'Total reps']], wd: [['w', 'Heaviest'], ['d', 'Distance']], dur: [['t', 'Longest']], cd: [['d', 'Distance'], ['t', 'Time']] }[ex.type];
  if (!ui.exMetric || !M.some(m => m[0] === ui.exMetric)) ui.exMetric = M[0][0];
  const mx = (h, f) => Math.max(0, ...h.sets.map(f));
  const F = { e1: h => mx(h, s => e1rm(s.w, s.r)), w: h => mx(h, s => s.w || 0), vol: h => h.sets.reduce((a, s) => a + (s.w || 0) * (s.r || 0), 0), reps: h => mx(h, s => s.r || 0), tot: h => h.sets.reduce((a, s) => a + (s.r || 0), 0), help: h => Math.min(...h.sets.map(s => s.w ?? 0)), d: h => ex.type === 'cd' ? h.sets.reduce((a, s) => a + (s.d || 0), 0) : mx(h, s => s.d || 0), t: h => ex.type === 'cd' ? h.sets.reduce((a, s) => a + (s.t || 0), 0) : mx(h, s => s.t || 0) }[ui.exMetric];
  const pts = chron.filter(h => h.sets.length).map(h => ({ x: h.start, y: F(h) })).filter(p => ui.exMetric === 'help' ? true : p.y > 0);
  let h = backHdr(ex.name);
  h += `<p class="muted small" style="margin-top:0">${esc(MUSCLES[ex.m] || '')}${ex.sec.length ? `, also ${esc(ex.sec.map(m => (MUSCLES[m] || m).toLowerCase()).join(', '))}` : ''}<span class="sep"></span>${esc(EQUIP[ex.eq] || '')}</p>`;
  if (!hist.length) h += `<div class="card"><p class="muted">No sessions logged for this exercise yet.</p></div>`;
  else {
    h += `<section class="card">${btnSeg('exMetric', 'm', M, ui.exMetric)}<div style="margin-top:12px">${pts.length > 1 ? lineChart(pts, { label: ex.name + ' progress' }) : `<p class="muted small">Log one more session to see a trend.</p>`}</div></section>`;
    if (ex.type === 'wr') {
      const all = hist.flatMap(x => x.sets.map(s => ({ ...s, start: x.start })));
      const best = (f) => all.reduce((b, s) => f(s) > f(b) ? s : b, all[0]);
      const bw = best(s => s.w || 0), be = best(s => e1rm(s.w, s.r)), bv = best(s => (s.w || 0) * (s.r || 0)), br = best(s => s.r || 0);
      const dd = s => esc(fmtDate(s.start, { day: 'numeric', month: 'short', year: '2-digit' }));
      h += `<section class="card"><h2 class="h3">Records</h2><table class="t"><tbody>
      <tr><td>Heaviest weight</td><td class="r">${fmtW(bw.w)} kg × ${bw.r}</td><td class="r faint">${dd(bw)}</td></tr>
      <tr><td>Best e1RM</td><td class="r">${fmtN(e1rm(be.w, be.r), 1)} kg</td><td class="r faint">${dd(be)}</td></tr>
      <tr><td>Best set volume</td><td class="r">${fmtW(bv.w)} × ${bv.r}</td><td class="r faint">${dd(bv)}</td></tr>
      <tr><td>Most reps</td><td class="r">${br.r} × ${fmtW(br.w)} kg</td><td class="r faint">${dd(br)}</td></tr></tbody></table></section>`;
      const E = e1rm(be.w, be.r);
      h += `<section class="card"><h2 class="h3">Estimated maxes</h2><p class="small muted">From your best e1RM. Most accurate within a few reps of what you actually lifted.</p><table class="t"><thead><tr><th>Reps</th><th class="r">kg (to failure)</th><th class="r">kg at 2 RIR</th></tr></thead><tbody>${[1, 3, 5, 8, 10, 12, 15].map(r => `<tr><td>${r}</td><td class="r">${fmtW(roundTo(r === 1 ? E : E / (1 + r / 30), 0.5))}</td><td class="r">${fmtW(roundTo(E / (1 + (r + 2) / 30), 0.5))}</td></tr>`).join('')}</tbody></table></section>`;
    }
    h += `<section class="card"><h2 class="h3">Sessions</h2>`;
    hist.slice(0, 30).forEach(x => { h += `<div class="list-row" style="display:block"><div class="small faint">${esc(fmtDate(x.start, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))}</div><div>${x.all.map(s => `${s.type === 'w' ? 'W ' : ''}${esc(fmtSet(s, ex.type))}${s.rir != null ? ` <span class="faint">@${s.rir}</span>` : ''}`).join('<span class="sep"></span>')}</div></div>`; });
    h += `</section>`;
  }
  if (ex.type !== 'bw' && ex.type !== 'dur' && ex.type !== 'cd') h += `<section class="card"><label class="lab" for="incIn" style="margin-top:0">Load step for this exercise (kg)</label><input id="incIn" class="field" inputmode="decimal" data-ch="inc" data-id="${id}" value="${fmtW(incFor(id))}"><p class="small muted">The smallest jump the coach suggests. Match it to your gym's plates, dumbbells or weight stack.</p></section>`;
  if (S.customEx[id] && !hist.length) h += `<button class="btn block danger" data-a="delCustom" data-id="${id}">Delete custom exercise</button>`;
  return h;
}
const MEAS = [['bw', 'Body weight', 'kg'], ['bf', 'Body fat', '%'], ['waist', 'Waist', 'cm'], ['chest', 'Chest', 'cm'], ['arms', 'Arms', 'cm'], ['thighs', 'Thighs', 'cm'], ['hips', 'Hips', 'cm'], ['neck', 'Neck', 'cm']];
function vMeasures() {
  let h = backHdr('Body', `<button class="btn pri sm" data-a="addMeasure">${icon('plus')} Add</button>`);
  const ms = [...S.measures].sort((a, b) => a.date - b.date);
  const avail = MEAS.filter(([k]) => ms.some(m => m[k] != null));
  if (!ms.length) return h + `<div class="card"><p>No measurements yet.</p><p class="muted small">Weigh in under similar conditions each time, for example in the morning before eating, and watch the weekly trend rather than single days.</p><button class="btn pri block" data-a="addMeasure">Add first entry</button></div>`;
  if (!avail.some(([k]) => k === ui.mMetric) && avail.length) ui.mMetric = avail[0][0];
  const unit = (MEAS.find(m => m[0] === ui.mMetric) || [])[2] || '';
  const pts = ms.filter(m => m[ui.mMetric] != null).map(m => ({ x: m.date, y: m[ui.mMetric] }));
  h += `<section class="card"><div class="chips">${avail.map(([k, l]) => `<button class="chip${ui.mMetric === k ? ' on' : ''}" data-a="mMetric" data-k="${k}">${l}</button>`).join('')}</div><div style="margin-top:12px">${pts.length > 1 ? lineChart(pts, { fmt: v => fmtN(v, 1), label: 'Measurement trend' }) : `<p class="muted small">Add another entry to see a trend.</p>`}</div>${pts.length ? `<p class="small muted">Latest ${fmtW(pts[pts.length - 1].y)} ${unit}${pts.length > 1 ? `, ${(pts[pts.length - 1].y - pts[0].y >= 0 ? '+' : '')}${fmtN(pts[pts.length - 1].y - pts[0].y, 1)} ${unit} since ${esc(fmtDate(pts[0].x, { day: 'numeric', month: 'short' }))}` : ''}</p>` : ''}</section>`;
  h += `<section class="card"><h2 class="h3">Entries</h2>`;
  [...ms].reverse().forEach(m => { h += `<div class="list-row"><div class="grow"><b>${esc(fmtDate(m.date, { day: 'numeric', month: 'short', year: 'numeric' }))}</b><div class="small muted">${MEAS.filter(([k]) => m[k] != null).map(([k, l, u]) => `${l} ${fmtW(m[k])} ${u}`).join(', ')}</div></div><button class="icon-btn" data-a="delMeasure" data-id="${m.id}" aria-label="Delete entry">${icon('x')}</button></div>`; });
  return h + `</section>`;
}

/* ================= coach ================= */
function progressReport() {
  const map = new Map();
  for (const r of S.routines) for (const re of r.ex) if (!map.has(re.exId)) map.set(re.exId, { rx: rxFor(re, r), n: (re.sets || []).length || 3, tmpl: re.sets || [], ctx: { rid: r.id, rname: r.name, since: r.planStart || 0 } });
  const rows = [];
  for (const [exId, { rx, n, tmpl, ctx }] of map) {
    const ex = EX(exId); if (ex.type === 'cd') continue;
    const hist = exHistory(exId); if (!hist.length) continue;
    const rir = targetRirFor(rx);
    const s = suggest(exId, rx, { nSets: n, rir, template: tmpl, ...ctx });
    if (!s) continue;
    rows.push({ exId, s, stalled: ex.type === 'wr' && isStalled(hist, rir), last: hist[0].start });
  }
  return rows;
}
function vCoach() {
  let h = `<header class="top"><div class="grow"><h1 class="title">Coach</h1></div></header>`;
  const P = S.program, pw = progWeek();
  if (P && pw) {
    const nx = nextProgramRoutine();
    h += `<section class="card"><div class="next"><span class="disc lg ${pw.deload ? 'k-deload' : 'k-first'}" aria-hidden="true"></span><div class="grow"><div class="h">${pw.deload ? 'Deload week' : `Week ${pw.week} of ${pw.len - 1}`}</div><div class="muted small">${pw.deload ? 'Half the sets, about 90% load, 4+ reps in reserve.' : `Finish working sets with about ${pw.rir} reps in reserve`}</div></div></div>
    <div class="weeks" aria-label="Mesocycle progress">${Array.from({ length: pw.len }, (_, i) => `<span class="${i < pw.idx ? 'done' : ''}${i === pw.idx ? ' now' : ''}${i === pw.len - 1 ? ' dl' : ''}" title="${i === pw.len - 1 ? 'Deload' : `Week ${i + 1}: RIR ${P.rirs[i]}`}"></span>`).join('')}</div>
    <p class="small muted" style="margin-top:10px">${esc(GOAL_NAME[P.cfg.goal])}, ${P.cfg.days} days a week (${esc(SPLIT_NAME[P.cfg.days].toLowerCase())}), block ${pw.cycle}. Effort plan: ${P.rirs.map((r, i) => `week ${i + 1} at RIR ${r}`).join(', ')}, then deload.</p>
    ${nx ? `<button class="btn pri block" data-a="startRoutine" data-id="${nx.id}">Start next: ${esc(nx.name)}</button>` : ''}</section>`;
    const rows = progressReport();
    const stalls = rows.filter(r => r.stalled);
    if (stalls.length >= 3 && !pw.deload) h += `<div class="banner"><span class="disc k-deload" aria-hidden="true"></span><div class="grow">${stalls.length} lifts have stalled. Taking your deload now usually helps more than grinding.<div style="margin-top:8px"><button class="btn sm" data-a="deloadNow">Start deload now</button></div></div></div>`;
    h += reportHtml(rows);
    h += `<section class="card"><h2 class="h3">Program settings</h2><div class="stack" style="margin-top:10px"><button class="btn block" data-a="restartMeso">Restart at week 1</button>${pw.deload ? '' : `<button class="btn block" data-a="deloadNow">Skip to deload week</button>`}<button class="btn block" data-a="rebuild">Build a new program</button><button class="btn block danger" data-a="endProgram">End program</button></div></section>`;
  } else {
    const rows = progressReport();
    h += `<p class="muted" style="margin-top:4px">The coach sets the next weight and reps for every exercise, in any routine, using your last sessions and how many reps you had left in the tank.</p>`;
    if (rows.length) h += reportHtml(rows);
  }
  if (!P || ui.rebuild) h += ui.preview ? previewHtml() : builderHtml();
  h += `<section class="card"><h2 class="h3">Your own routines</h2><p class="small muted">Default effort target for routines you made yourself, like Hybrid A, B and C. You can override it per exercise.</p><label class="lab" for="defRir">Target reps in reserve</label><select id="defRir" class="field" data-ch="defRir">${[0, 1, 2, 3, 4].map(v => `<option value="${v}"${S.settings.rir === v ? ' selected' : ''}>${v} RIR${v === 2 ? ' (recommended)' : ''}</option>`).join('')}</select></section>`;
  h += howHtml();
  return h;
}
function reportHtml(rows) {
  if (!rows.length) return '';
  const order = { load: 0, reps: 1, first: 2, hold: 3, reset: 4, deload: 5 };
  rows.sort((a, b) => (order[a.s.kind] ?? 9) - (order[b.s.kind] ?? 9) || b.last - a.last);
  let h = `<section class="card"><h2 class="h3">Next targets</h2><p class="small muted">What the coach will ask for next time, per exercise.</p>`;
  for (const r of rows) h += `<button class="list-row" data-a="go" data-v="exdetail" data-id="${r.exId}"><span class="disc k-${r.s.kind}" aria-hidden="true"></span><div class="grow"><b>${esc(EX(r.exId).name)}</b><div class="small muted">${esc(r.s.title)}${r.s.detail ? `: ${esc(r.s.detail)}` : ''}${r.stalled ? ', stalled' : ''}</div></div></button>`;
  return h + `<div class="legend" style="margin-top:10px"><span><span class="disc xs k-load"></span> add load</span><span><span class="disc xs k-reps"></span> add reps</span><span><span class="disc xs k-hold"></span> hold</span><span><span class="disc xs k-reset"></span> reset or deload</span></div></section>`;
}
function builderHtml() {
  const c = ui.cf;
  return `<section class="card" id="builder"><h2 class="h">Build a program</h2><p class="small muted">Answer a few questions. The coach picks a split, exercises, sets and rep ranges, then runs your progression week to week.</p>
  <span class="lab">Goal</span>${btnSeg('cf', 'goal', [['muscle', 'Build muscle'], ['strength', 'Get stronger'], ['both', 'Both']], c.goal)}
  <span class="lab">Training experience</span>${btnSeg('cf', 'exp', [['beginner', 'Under 1 yr'], ['intermediate', '1–3 yrs'], ['advanced', '3+ yrs']], c.exp)}
  <span class="lab">Days per week</span>${btnSeg('cf', 'days', [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']], c.days)}
  <span class="lab">Time per session</span>${btnSeg('cf', 'mins', [[45, '45 min'], [60, '60 min'], [75, '75 min'], [90, '90 min']], c.mins)}
  <span class="lab">Equipment</span>${btnSeg('cf', 'equip', [['gym', 'Full gym'], ['home', 'Dumbbells, bench, pull-up bar']], c.equip)}
  <span class="lab">Extra focus (optional)</span><div class="chips">${['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes'].map(f => `<button class="chip${c.focus.includes(f) ? ' on' : ''}" aria-pressed="${c.focus.includes(f)}" data-a="cfFocus" data-f="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
  <button class="btn pri block" style="margin-top:18px" data-a="preview">Preview program</button>${S.program ? `<button class="btn block" style="margin-top:8px" data-a="cancelRebuild">Keep current program</button>` : ''}</section>`;
}
function previewHtml() {
  const P = ui.preview, [lo, hi] = P.target;
  let h = `<section class="card" id="preview"><h2 class="h">Your program</h2><p class="small muted">${esc(SPLIT_NAME[P.cfg.days])}. ${P.rirs.length}-week build (${P.rirs.map(r => `RIR ${r}`).join(', ')}), then a deload week, repeating.</p>`;
  for (const d of P.days) {
    const tot = d.slots.reduce((n, s) => n + s.sets, 0);
    h += `<div style="margin-top:14px"><div class="row between"><h3 class="h3">${esc(d.name)}</h3><span class="small faint">${tot} sets, about ${Math.round(tot * 2.9 + 6)} min</span></div>`;
    for (const s of d.slots) { const ex = EX(s.exId); h += `<div class="row between small" style="padding:5px 0;border-bottom:1px solid var(--line)"><span>${esc(ex.name)}</span><span class="num" style="font-size:16px">${s.sets} × ${s.lo}–${s.hi}</span></div>`; }
    h += `</div>`;
  }
  const top = Math.max(24, hi + 6);
  h += `<h3 class="h3" style="margin-top:18px">Weekly sets per muscle</h3><p class="small muted">Target zone ${lo}–${hi}${P.focusM.length ? ', plus 4 for focus muscles' : ''}.</p>`;
  for (const m of BAL) { const v = P.vol[m] || 0, t = P.focusM.includes(m) ? [lo + 4, hi + 4] : [lo, hi], cls = v < t[0] ? '' : v <= t[1] ? 'in' : 'over'; h += `<div class="mbar"><span>${esc(MUSCLES[m])}</span><div class="mtrack"><div class="mzone" style="left:${(t[0] / top * 100).toFixed(1)}%;width:${((t[1] - t[0]) / top * 100).toFixed(1)}%"></div><div class="mfill ${cls}" style="width:${(Math.min(v, top) / top * 100).toFixed(1)}%"></div></div><span class="v">${fmtN(v, 1)}</span></div>`; }
  const short = BAL.filter(m => (P.vol[m] || 0) < (P.focusM.includes(m) ? lo + 4 : lo));
  if (short.length) h += `<p class="small muted">${esc(short.map(m => MUSCLES[m]).join(', '))} ${short.length > 1 ? 'fall' : 'falls'} short of the target because the sessions are full. Longer sessions or another training day would close the gap. Fewer sets still build muscle, just more slowly.</p>`;
  if (S.program) h += `<p class="small muted">Saving replaces your current program routines. Your workout history and your own routines stay.</p>`;
  return h + `<button class="btn pri block" style="margin-top:14px" data-a="saveProgram">Save program</button><button class="btn block" style="margin-top:8px" data-a="cancelPreview">Change answers</button></section>`;
}
function howHtml() {
  return `<details class="more card"><summary>How the coach picks your next targets</summary><ul>
  <li>Each exercise has a rep range and a target RIR (reps in reserve: how many more clean reps you could have done).</li>
  <li>Every working set at the top of the range, without going past the RIR target: add one load step. The new rep target comes from your estimated 1RM, adjusted for RIR.</li>
  <li>Inside the range: same load, one more rep on sets where you had reps in reserve.</li>
  <li>Below the range: hold the load. Below it two sessions running: drop about 10% and build back up.</li>
  <li>No estimated-1RM progress across three sessions counts as a stall. Three or more stalls and the coach suggests a deload.</li>
  <li>Program blocks ramp effort from about 3 RIR toward 0–1 RIR, then deload with half the sets. Big compound lifts stay at 1+ RIR.</li>
  <li>Log RIR when you can. Without it, the coach assumes you hit the target and progresses on reps alone.</li></ul></details>
  <details class="more card"><summary>The research behind it</summary><ul>
  <li>Volume: more weekly hard sets per muscle tend to produce more growth, with diminishing returns. Around 10 or more sets a week is a common target (Schoenfeld, Ogborn and Krieger, 2017; Pelland et al., 2024).</li>
  <li>Load: light and heavy loads build similar muscle when sets are taken close to failure, while heavier loads build more maximal strength (Schoenfeld et al., 2017).</li>
  <li>Effort: muscle growth improves as sets get closer to failure; strength is less sensitive to it (Refalo et al., 2023; Robinson et al., 2024).</li>
  <li>Frequency: training each muscle at least twice a week is a sensible default (Schoenfeld, Ogborn and Krieger, 2016).</li>
  <li>Autoregulation: the RIR scale lets load track how you are actually performing on the day (Zourdos et al., 2016; Helms et al., 2016).</li>
  <li>Rest: 2–3 minutes between hard compound sets supported better gains than very short rests (Schoenfeld et al., 2016).</li>
  <li>Exercise choice: training muscles at long lengths, as in overhead triceps extensions and seated leg curls, has outperformed shorter-length versions (Maeo et al., 2021 and 2023).</li>
  <li>Deloads: planned lighter weeks are standard practice among coaches for managing fatigue (Bell et al., 2023).</li></ul>
  <p>These are strong defaults, not laws. Sleep, food and showing up matter more than any single rule.</p></details>`;
}

/* ================= settings ================= */
function noticesHtml() {
  let h = '';
  if (STORE.err) h += `<div class="banner"><span class="disc k-reset" aria-hidden="true"></span><div class="grow">${esc(STORE.err)}</div></div>`;
  if (STORE.update) h += `<div class="banner"><span class="disc k-load" aria-hidden="true"></span><div class="grow">A new version of the app is ready.<div style="margin-top:8px"><button class="btn sm" data-a="applyUpdate">Restart to update</button></div></div></div>`;
  if (installEvt && !isStandalone()) h += `<div class="banner"><span class="disc k-first" aria-hidden="true"></span><div class="grow">Install Overload as an app: its own icon, full screen, works offline.<div style="margin-top:8px"><button class="btn sm" data-a="install">Install app</button></div></div></div>`;
  const st = S.settings, now = Date.now();
  if (S.workouts.length >= 3 && (!st.lastBackup || now - st.lastBackup > 30 * DAY) && now > (st.backupSnooze || 0)) {
    h += `<div class="banner"><span class="disc k-hold" aria-hidden="true"></span><div class="grow">Your log lives only on this phone. Last backup: ${st.lastBackup ? esc(fmtDate(st.lastBackup, { day: 'numeric', month: 'short' })) : 'never'}.<div class="row" style="margin-top:8px;gap:8px"><button class="btn sm" data-a="exportJson">Back up now</button><button class="btn sm line" data-a="snoozeBackup">Later</button></div></div></div>`;
  }
  return h;
}
function vSettings() {
  const st = S.settings, L = STORE.lock;
  let h = backHdr('Settings');
  h += noticesHtml().replace(/<div class="banner"><span class="disc k-hold"[\s\S]*$/, '');
  const where = STORE.memOnly ? '<p class="err">On-device storage is blocked in this browser, so nothing is being saved. Open the installed app instead.</p>'
    : `<p class="small muted">Everything is stored only on this phone, inside the app's private storage. The app makes no network requests, so nothing is sent anywhere.${L ? ' Your data is encrypted with your passcode.' : ''}</p>
       <p class="small muted">${STORE.persisted ? 'Protected storage is on: Android will not clear it to free up space.' : 'Android can clear website data when storage runs very low. Installing the app and keeping backups protects you.'}</p>`;
  h += `<section class="card"><h2 class="h3">Your data</h2>${where}
  <p class="small"><b>Last backup:</b> ${st.lastBackup ? esc(fmtDate(st.lastBackup, { day: 'numeric', month: 'short', year: 'numeric' })) : 'never'}</p>
  <div class="stack" style="margin-top:10px"><button class="btn pri block" data-a="exportJson">Back up now${L ? ' (encrypted)' : ''}</button><button class="btn block" data-a="importFile">Restore a backup or import Hevy CSV</button><button class="btn block" data-a="exportCsv">Export workouts as CSV</button></div>
  <p class="small muted" style="margin-top:10px">Backups are single files you keep wherever you like (Downloads, Google Drive, a USB stick). If you lose or reset your phone, they are the only copy. ${L ? 'CSV exports are not encrypted.' : ''}</p>
  <p class="small muted">To bring your Hevy history over, export your workouts as CSV in Hevy, then use Restore or import here.</p></section>`;
  h += `<section class="card"><h2 class="h3">App lock</h2>`;
  if (!hasCrypto()) h += `<p class="small muted">Passcode lock needs the installed app (opened over a secure https address).</p>`;
  else if (!L) h += `<p class="small muted">Lock the app with a passcode. Your log is then encrypted on the phone (AES-256, key derived from your passcode), and opening the app asks for it.</p><button class="btn block" data-a="lockSetup">Set a passcode</button>`;
  else h += `<p class="small muted">On. Your data is encrypted on this phone.</p>
    <label class="lab" for="sAuto">Lock again after the app is in the background for</label><select id="sAuto" class="field" data-ch="autoLock">${[[0, 'Straight away'], [1, '1 minute'], [5, '5 minutes'], [15, '15 minutes'], [60, '1 hour']].map(([v, l]) => `<option value="${v}"${(st.autoLock ?? 5) === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
    <div class="stack" style="margin-top:12px"><button class="btn block" data-a="lockNow">Lock now</button><button class="btn block" data-a="lockChange">Change passcode</button><button class="btn block danger" data-a="lockOff">Turn off lock</button></div>`;
  h += `</section>`;
  h += `<section class="card"><h2 class="h3">Workout</h2>
  <label class="lab" for="sRest">Default rest timer</label><select id="sRest" class="field" data-ch="set" data-k="rest">${restOptions(st.rest)}</select>
  <label class="lab" for="sBw">Body weight (kg), used for assisted-exercise volume</label><input id="sBw" class="field" inputmode="decimal" data-ch="set" data-k="bw" value="${fmtW(st.bw)}" placeholder="e.g. 80">
  <label class="lab" for="sBar">Barbell weight (kg)</label><input id="sBar" class="field" inputmode="decimal" data-ch="set" data-k="bar" value="${fmtW(st.bar)}">
  <span class="lab">Plates you have (kg)</span><div class="chips">${[25, 20, 15, 10, 5, 2.5, 2, 1.25, 1, 0.5].map(p => `<button class="chip${st.plates.includes(p) ? ' on' : ''}" aria-pressed="${st.plates.includes(p)}" data-a="togPlate" data-p="${p}">${p}</button>`).join('')}</div>
  <span class="lab">Rest timer sound</span>${btnSeg('setSound', 'v', [['1', 'On'], ['0', 'Off']], st.sound ? '1' : '0')}</section>`;
  h += `<section class="card"><h2 class="h3">Appearance</h2>${btnSeg('theme', 'v', [['system', 'Match phone'], ['light', 'Light'], ['dark', 'Dark']], st.theme)}</section>`;
  h += `<section class="card"><h2 class="h3">App</h2><p class="small muted">${isStandalone() ? 'Running as an installed app.' : 'Running in the browser. Install it for its own icon, full screen and offline use.'} Version ${APP_VERSION}.</p>${installEvt && !isStandalone() ? '<button class="btn block" data-a="install">Install app</button>' : ''}${STORE.update ? '<button class="btn block" data-a="applyUpdate">Restart to update</button>' : ''}</section>`;
  h += `<section class="card"><h2 class="h3">Start over</h2><p class="small muted">Erases every workout, routine, measurement and setting on this phone, including the passcode.</p><button class="btn block danger" data-a="resetAll">Erase all data</button></section>`;
  return h;
}

/* ================= render ================= */
function tabsHtml() {
  const t = [['train', 'Train', 'dumbbell'], ['coach', 'Coach', 'coach'], ['stats', 'Stats', 'stats'], ['history', 'History', 'history']];
  return `<div class="in">${t.map(([k, l, ic]) => `<button class="tab${ui.tab === k && !ui.view ? ' on' : ui.tab === k ? ' on' : ''}" data-a="tab" data-t="${k}" aria-current="${ui.tab === k ? 'page' : 'false'}">${icon(ic)}<span>${l}</span></button>`).join('')}</div>`;
}
let lastView = '';
function render() {
  if (!S) return;
  const v = ui.view, name = v ? v.name : ui.tab, key = name + (v && v.id ? ':' + v.id : '');
  const y = window.scrollY;
  let html;
  try {
    switch (name) {
      case 'workout': html = vWorkout(); break;
      case 'routine': html = vRoutine(); break;
      case 'wdetail': html = vWDetail(v.id); break;
      case 'exdetail': html = vExDetail(v.id); break;
      case 'measures': html = vMeasures(); break;
      case 'settings': html = vSettings(); break;
      case 'coach': html = vCoach(); break;
      case 'stats': html = vStats(); break;
      case 'history': html = vHistory(); break;
      default: html = vTrain();
    }
  } catch (e) { console.error(e); html = `<div class="card"><p class="err">Something went wrong drawing this screen.</p><p class="small muted">${esc(e.message)}</p><button class="btn block" data-a="tab" data-t="train">Back to Train</button></div>`; }
  $('#view').innerHTML = html;
  const inW = (ui.view && ui.view.name) === 'workout';
  document.body.classList.toggle('in-workout', inW);
  $('#tabs').hidden = inW;
  $('#tabs').innerHTML = tabsHtml();
  const showMini = !inW && S.active;
  $('#mini').innerHTML = showMini ? `<button class="mini" data-a="resume"><span class="grow"><b>${esc(S.active.name)}</b><span class="t" id="miniT">${S.active.editOf ? 'Editing' : fmtClock((Date.now() - S.active.start) / 1000)}</span></span><span class="btn pri sm">Resume</span></button>` : '';
  document.body.classList.toggle('has-mini', !!showMini);
  if (key === lastView) window.scrollTo(0, y); else window.scrollTo(0, 0);
  lastView = key;
  renderRest();
  keepAwake(inW && !!S.active && !S.active.editOf);
}

/* ================= sheets, toast, theme, audio ================= */
const A = {}, IN = {}, CH = {};
function openSheet(html) { $('#sheet').innerHTML = `<div class="sheet-bg" data-a="closeSheet"><div class="sheet" data-a="noop" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`; }
function swapSheet(html) { const s = $('#sheet .sheet'); if (s) s.innerHTML = '<div class="grab"></div>' + html; else openSheet(html); }
function closeSheet() { $('#sheet').innerHTML = ''; }
const confirmSheet = (title, text, act, label, data = {}, keep = 'Cancel') => openSheet(`<h2 class="h3">${esc(title)}</h2><p class="muted">${esc(text)}</p><div class="stack" style="margin-top:14px"><button class="btn block danger"${da({ a: act, ...data })}>${esc(label)}</button><button class="btn block" data-a="closeSheet">${esc(keep)}</button></div>`);
A.closeSheet = () => closeSheet();
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2800); }
function applyTheme() { const t = S.settings.theme, r = document.documentElement; if (t === 'light' || t === 'dark') r.dataset.theme = t; else delete r.dataset.theme; }
let AC = null;
function ensureAudio() { try { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (AC && AC.state === 'suspended') AC.resume(); } catch (e) { /* no audio */ } }
function beep() {
  if (!S.settings.sound || !AC) return;
  try {
    const t0 = AC.currentTime + 0.02;
    [[0, 880], [0.22, 880], [0.44, 1320]].forEach(([dt, f]) => {
      const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.18);
      o.connect(g); g.connect(AC.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.2);
    });
  } catch (e) { /* ignore */ }
}
let wake = null;
async function keepAwake(on) {
  try {
    if (on && !wake && 'wakeLock' in navigator && document.visibilityState === 'visible') { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
    else if (!on && wake) { const w = wake; wake = null; await w.release(); }
  } catch (e) { wake = null; }
}

/* ================= rest timer and clocks ================= */
function renderRest() {
  const el = $('#rest'), r = S && S.active && S.active.rest;
  const show = !!r && ui.view && ui.view.name === 'workout';
  if (!show) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  if (!el.firstChild) el.innerHTML = `<div class="restbox"><div class="grow"><div class="lab2">Rest</div><div class="rest-t" id="restT"></div></div><button class="btn" data-a="restAdj" data-n="-15" aria-label="15 seconds less">−15</button><button class="btn" data-a="restAdj" data-n="15" aria-label="15 seconds more">+15</button><button class="btn" data-a="restSkip">Skip</button><div class="restfill" id="restF"></div></div>`;
  updateRestText();
}
const runRest = renderRest;
function updateRestText() {
  const r = S.active && S.active.rest; if (!r) return;
  const left = Math.max(0, (r.end - Date.now()) / 1000);
  const t = $('#restT'); if (t) t.textContent = fmtClock(Math.ceil(left));
  const f = $('#restF'); if (f) f.style.width = (100 * (1 - left / r.total)).toFixed(1) + '%';
}
function startRest(sec) { if (!S.active || !sec) return; S.active.rest = { end: Date.now() + sec * 1000, total: sec }; renderRest(); }
function restDone() { beep(); try { if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } catch (e) { /* blocked */ } toast('Rest over. Next set when you are ready.'); }
function onTick() {
  if (!S) return;
  const a = S.active; if (!a) return;
  if (!a.editOf) {
    const t = fmtClock((Date.now() - a.start) / 1000);
    const e = $('#elapsed'); if (e) e.textContent = t;
    const m = $('#miniT'); if (m) m.textContent = a.rest ? `Resting ${fmtClock(Math.ceil((a.rest.end - Date.now()) / 1000))}` : t;
  }
  if (a.rest) {
    if (a.rest.end <= Date.now()) { a.rest = null; touchActive(); restDone(); renderRest(); }
    else updateRestText();
  }
}
A.restAdj = d => { const r = S.active && S.active.rest; if (!r) return; const n = +d.n; r.end += n * 1000; r.total = Math.max(1, r.total + n); if (r.end <= Date.now()) S.active.rest = null; touchActive(); renderRest(); };
A.restSkip = () => { if (S.active) { S.active.rest = null; touchActive(); } renderRest(); };

/* ================= navigation ================= */
A.tab = d => { ui.tab = d.t; ui.view = null; ui.rebuild = false; closeSheet(); render(); };
A.go = d => { ui.view = { name: d.v, id: d.id, from: ui.view }; if (d.v === 'exdetail') ui.exMetric = null; closeSheet(); render(); };
A.back = () => { ui.view = (ui.view && ui.view.from) || null; render(); };
A.resume = () => { ui.view = { name: 'workout' }; render(); };
A.minimize = () => { ui.view = null; ui.tab = 'train'; render(); };

/* ================= starting and logging workouts ================= */
function defaultWorkoutName() { const h = new Date().getHours(); return h < 11 ? 'Morning workout' : h < 17 ? 'Afternoon workout' : 'Evening workout'; }
function blankSet(type = 'n') { return { type, w: null, r: null, rir: null, d: null, t: null, done: false }; }
function makeLiveEx(exId, re, routine) {
  const rx = rxFor(re || { exId }, routine);
  let tmpl = re && re.sets && re.sets.length ? clone(re.sets) : [];
  let n = tmpl.length;
  if (!n) { const p = prevSets(exId); const ex = EX(exId); n = p && p.work.length ? p.work.length : (ex.type === 'wd' || ex.type === 'cd' ? 1 : 3); }
  return { exId, rx, tmpl, note: '', sets: Array.from({ length: n }, (_, k) => blankSet((tmpl[k] && tmpl[k].type) || 'n')), ...(re && re.ss ? { ss: re.ss } : {}) };
}
A.startEmpty = () => {
  if (S.active) return A.resume();
  S.active = { id: uid(), name: defaultWorkoutName(), routineId: null, start: Date.now(), ex: [], rest: null };
  touchActive(); ui.view = { name: 'workout' }; render(); openPicker('add');
};
A.startRoutine = d => {
  if (S.active) { closeSheet(); toast('Finish or discard the current workout first'); return A.resume(); }
  const r = S.routines.find(x => x.id === d.id); if (!r) return;
  ensureAudio();
  S.active = { id: uid(), name: r.name, routineId: r.id, start: Date.now(), rest: null, ex: r.ex.map(re => makeLiveEx(re.exId, re, r)) };
  touchActive(); closeSheet(); ui.view = { name: 'workout' }; render();
};
IN.wname = (d, el) => { S.active.name = el.value; touchActive(); };
IN.exnote = (d, el) => { S.active.ex[d.i].note = el.value; touchActive(); };
IN.set = (d, el) => {
  const s = S.active && S.active.ex[d.i] && S.active.ex[d.i].sets[d.j]; if (!s) return;
  s[d.k] = d.k === 'rir' ? (el.value === '' ? null : +el.value) : num(el.value);
  touchActive();
};
A.check = d => {
  const a = S.active, e = a.ex[d.i], s = e.sets[d.j], ex = EX(e.exId), T = TYPES[ex.type];
  ensureAudio();
  if (s.done) { s.done = false; s.pr = false; touchActive(); render(); return; }
  const ph = placeholderFor(e, +d.j, liveSug(e), prevFor(e)) || {};
  for (const [k] of T.cols) if (k !== 'rir' && s[k] == null && ph[k] != null) s[k] = ph[k];
  if (s[T.need] == null) { toast(`Enter ${T.need === 'r' ? 'reps' : T.need === 'd' ? 'a distance' : 'a time'} first`); render(); return; }
  s.done = true;
  s.pr = !a.editOf && isPR(e.exId, s, a.start, a.editOf);
  let restNow = true, goTo = null;
  if (!a.editOf && e.ss && isWorkT(s)) { // supersets: alternate, rest after the last exercise of the pair
    const i = +d.i, L = a.ex, nx = L[i + 1], doneN = x => x.sets.filter(y => y.done && isWorkT(y)).length;
    if (nx && nx.ss === e.ss) { if (nx.sets.some(y => !y.done && isWorkT(y)) && doneN(nx) < doneN(e)) { restNow = false; goTo = i + 1; } }
    else { let f = i; while (f > 0 && L[f - 1].ss === e.ss) f--; if (f !== i && L[f].sets.some(y => !y.done && isWorkT(y))) goTo = f; }
  }
  if (!a.editOf && restNow) startRest(s.type === 'w' ? Math.min(60, e.rx.rest ?? S.settings.rest) : (e.rx.rest ?? S.settings.rest));
  touchActive(); render();
  if (goTo != null) scrollToEx(goTo);
  if (s.pr) toast('New personal record');
};
A.usePrev = d => {
  const a = S.active, e = a.ex[d.i], s = e.sets[d.j];
  const prev = prevFor(e); if (!prev || s.done) return;
  let k = 0, kw = 0;
  for (let x = 0; x < +d.j; x++) { const t = e.sets[x]; if (t.type === 'w') kw++; else if (isWorkT(t)) k++; }
  const pv = s.type === 'w' ? prev.warm[kw] : prev.work[k]; if (!pv) return;
  for (const key of ['w', 'r', 'd', 't']) if (pv[key] != null) s[key] = pv[key];
  touchActive(); render();
};
A.useSug = d => {
  const e = S.active.ex[d.i], sug = liveSug(e); if (!sug) return;
  if (sug.kind === 'deload') { let k = 0; e.sets = e.sets.filter(s => { if (!isWorkT(s)) return true; k++; return k <= sug.targets.length || s.done; }); }
  e.sets.forEach((s, j) => { if (s.done || !isWorkT(s)) return; const ph = placeholderFor(e, j, sug, null); for (const k of ['w', 'r', 'd', 't']) if (ph[k] != null) s[k] = ph[k]; });
  touchActive(); render();
};
A.addSet = d => { S.active.ex[d.i].sets.push(blankSet()); touchActive(); render(); };
A.setMenu = d => openSheet(`<h2 class="h3">Set type</h2><div class="menu">${[['w', 'Warm-up set'], ['n', 'Working set'], ['f', 'Set to failure'], ['d', 'Drop set']].map(([t, l]) => `<button${da({ a: 'setType', i: d.i, j: d.j, t })}>${l}</button>`).join('')}<button class="danger"${da({ a: 'delSet', i: d.i, j: d.j })}>Remove set</button></div>`);
A.setType = d => { S.active.ex[d.i].sets[d.j].type = d.t; touchActive(); closeSheet(); render(); };
A.delSet = d => { S.active.ex[d.i].sets.splice(+d.j, 1); touchActive(); closeSheet(); render(); };
A.exMenu = d => {
  const e = S.active.ex[d.i], n = S.active.ex.length, i = +d.i;
  openSheet(`<h2 class="h3">${esc(EX(e.exId).name)}</h2><div class="menu"><button${da({ a: 'exRx', i })}>Rep range, RIR, rest and load step</button><button${da({ a: 'exReplace', i })}>Replace exercise</button>${i < n - 1 && !(e.ss && e.ss === S.active.ex[i + 1].ss) ? `<button${da({ a: 'exSuper', i })}>Superset with next exercise</button>` : ''}${e.ss ? `<button${da({ a: 'exUnsuper', i })}>Remove from superset</button>` : ''}${i > 0 ? `<button${da({ a: 'exMove', i, n: -1 })}>Move up</button>` : ''}${i < n - 1 ? `<button${da({ a: 'exMove', i, n: 1 })}>Move down</button>` : ''}<button${da({ a: 'go', v: 'exdetail', id: e.exId })}>History and records</button><button class="danger"${da({ a: 'exRemove', i })}>Remove exercise</button></div>`);
};
A.exMove = d => { const L = S.active.ex, i = +d.i, j = i + (+d.n); if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; fixSupersets(L); touchActive(); closeSheet(); render(); };
A.exSuper = d => { superWith(S.active.ex, +d.i); touchActive(); closeSheet(); render(); };
A.exUnsuper = d => { unsuper(S.active.ex, +d.i); touchActive(); closeSheet(); render(); };
function scrollToEx(i) { setTimeout(() => { const c = document.querySelectorAll('#view .exc')[i]; if (!c) return; const row = c.querySelector('.set:not(.done)') || c; row.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }, 40); }
A.exRemove = d => { S.active.ex.splice(+d.i, 1); fixSupersets(S.active.ex); touchActive(); closeSheet(); render(); };
A.exReplace = d => openPicker('replace', +d.i);
A.addEx = () => openPicker('add');
A.exRx = d => {
  const e = S.active.ex[d.i], ex = EX(e.exId), ranged = ['wr', 'aw', 'bw'].includes(ex.type);
  swapSheet(`<h2 class="h3">${esc(ex.name)}</h2>
  ${ranged ? `<div class="rx-grid" style="grid-template-columns:1fr 1fr"><div><label class="lab" for="xLo">Lowest reps</label><input id="xLo" class="field" inputmode="numeric" value="${e.rx.lo ?? ''}"></div><div><label class="lab" for="xHi">Highest reps</label><input id="xHi" class="field" inputmode="numeric" value="${e.rx.hi ?? ''}"></div></div>
  <label class="lab" for="xRir">Target reps in reserve</label><select id="xRir" class="field">${rirOptions(e.rx.rir, e.rx.prog ? 'Auto (follows program week)' : `Auto (your default, ${S.settings.rir})`)}</select>` : ''}
  <label class="lab" for="xRest">Rest timer</label><select id="xRest" class="field">${restOptions(e.rx.rest ?? S.settings.rest)}</select>
  ${!['bw', 'dur', 'cd'].includes(ex.type) ? `<label class="lab" for="xInc">Load step (kg)</label><input id="xInc" class="field" inputmode="decimal" value="${fmtW(incFor(e.exId))}">` : ''}
  ${S.active.routineId && !S.active.editOf ? '<p class="small muted">Also saved to the routine for next time.</p>' : ''}
  <button class="btn pri block" style="margin-top:16px"${da({ a: 'saveRx', i: d.i })}>Save</button>`);
};
A.saveRx = d => {
  const e = S.active.ex[d.i];
  if ($('#xLo')) {
    const lo = num($('#xLo').value), hi = num($('#xHi').value);
    if (lo == null || hi == null || lo < 1 || hi < lo) { toast('Set a valid rep range, low to high'); return; }
    e.rx.lo = lo; e.rx.hi = hi; const rv = $('#xRir').value; e.rx.rir = rv === '' ? null : +rv;
  }
  e.rx.rest = +$('#xRest').value;
  const inc = $('#xInc') ? num($('#xInc').value) : null; if (inc != null && inc > 0) S.settings.inc[e.exId] = inc;
  const r = S.routines.find(x => x.id === S.active.routineId);
  if (r && !S.active.editOf) { const re = r.ex.find(x => x.exId === e.exId); if (re) { re.lo = e.rx.lo; re.hi = e.rx.hi; re.rir = e.rx.rir; re.rest = e.rx.rest; } }
  touchMeta(); touchActive(); closeSheet(); render();
};
A.warmup = d => {
  const e = S.active.ex[d.i], ex = EX(e.exId);
  const k = e.sets.findIndex(isWorkT);
  const ph = k >= 0 ? placeholderFor(e, k, liveSug(e), prevFor(e)) : {};
  const W = (k >= 0 && e.sets[k].w) || (ph && ph.w);
  if (!W) { toast('Enter a working weight first'); return; }
  const inc = incFor(e.exId), bar = ex.eq === 'barbell' ? (S.settings.bar || 0) : 0;
  const scheme = ex.comp ? (W >= 60 ? [[0.4, 8], [0.6, 5], [0.8, 3]] : [[0.5, 8], [0.75, 4]]) : [[0.5, 10]];
  let ws = scheme.map(([p, r]) => ({ w: Math.max(bar, roundTo(W * p, inc)), r })).filter(x => x.w < W);
  if (bar && ex.comp && W >= bar + 20 && !ws.some(x => x.w === bar)) ws.unshift({ w: bar, r: 10 });
  ws = ws.filter((x, i, arr) => arr.findIndex(y => y.w === x.w) === i);
  if (!ws.length) { toast('No warm-up needed at this weight'); return; }
  const keep = e.sets.filter(s => !(s.type === 'w' && !s.done));
  e.sets = [...keep.filter(s => s.type === 'w'), ...ws.map(x => ({ ...blankSet('w'), w: x.w, r: x.r })), ...keep.filter(s => s.type !== 'w')];
  touchActive(); render(); toast(`Added ${ws.length} warm-up sets`);
};
A.plates = d => {
  const e = S.active && S.active.ex[d.i]; let W = null;
  if (e) {
    let j = e.sets.findIndex(s => isWorkT(s) && !s.done); if (j < 0) j = e.sets.findIndex(isWorkT);
    if (j >= 0) W = e.sets[j].w ?? (placeholderFor(e, j, liveSug(e), prevFor(e)) || {}).w;
  }
  ui.plateW = W || (S.settings.bar || 20);
  openSheet(`<h2 class="h3">Plate loader</h2><label class="lab" for="plW">Total weight (kg)</label><input id="plW" class="field" inputmode="decimal" data-in="plateW" value="${fmtW(ui.plateW)}"><div id="plOut">${plateOut(ui.plateW)}</div>`);
};
function plateOut(W) {
  if (W < (S.settings.bar || 0)) return `<p class="muted small">That is less than the bar (${fmtW(S.settings.bar)} kg).</p>`;
  const { used, rem } = plateMath(W);
  return plateSvg(used) + `<p><b>Each side:</b> ${used.length ? used.map(fmtW).join(', ') + ' kg' : 'empty bar'}</p>${rem > 0 ? `<p class="err">${fmtW(rem)} kg can't be made with your plates.</p>` : ''}<p class="small muted">Bar ${fmtW(S.settings.bar)} kg. Change the bar and your plates in Settings.</p>`;
}
IN.plateW = (d, el) => { const W = num(el.value); if (W == null) return; ui.plateW = W; $('#plOut').innerHTML = plateOut(W); };

/* finishing */
function buildWorkout(w) {
  return {
    id: w.editOf || w.id, name: (w.name || '').trim() || 'Workout', routineId: w.routineId || null, start: w.start,
    end: w.editOf ? (w.end || w.start + 3600e3) : Date.now(), note: w.note || '',
    ex: w.ex.map(e => ({ exId: e.exId, note: e.note || '', rx: e.rx, ...(e.ss ? { ss: e.ss } : {}), sets: e.sets.filter(s => s.done).map(s => ({ type: s.type, w: s.w, r: s.r, rir: s.rir, d: s.d, t: s.t, done: true })) })).filter(e => e.sets.length),
  };
}
A.finish = () => {
  const w = S.active, done = w.ex.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  if (!done) { openSheet(`<h2 class="h3">No sets completed</h2><p class="muted">Tick at least one set to save, or ${w.editOf ? 'cancel editing' : 'discard the workout'}.</p><div class="stack" style="margin-top:14px"><button class="btn block" data-a="closeSheet">Keep going</button><button class="btn block danger" data-a="confirmDiscard">${w.editOf ? 'Cancel editing' : 'Discard workout'}</button></div>`); return; }
  const und = w.ex.reduce((n, e) => n + e.sets.filter(s => !s.done && (s.w != null || s.r != null || s.d != null || s.t != null)).length, 0);
  const out = buildWorkout(w), st = workoutStats(out), prs = computePRs(out);
  openSheet(`<h2 class="h">${w.editOf ? 'Save changes' : 'Finish workout'}</h2>
  <div class="tiles" style="margin-top:10px"><div class="tile"><div class="v">${fmtDur(st.dur)}</div><div class="l">Time</div></div><div class="tile"><div class="v">${fmtN(st.vol)} kg</div><div class="l">Volume</div></div><div class="tile"><div class="v">${st.sets}</div><div class="l">Working sets</div></div><div class="tile"><div class="v">${prs.length}</div><div class="l">Records</div></div></div>
  ${prs.length ? `<div style="margin-top:10px">${prs.map(p => `<div class="small" style="margin:4px 0"><span class="tag">PR</span> ${esc(EX(p.exId).name)}: ${esc(p.kind.toLowerCase())}, ${esc(p.val)}</div>`).join('')}</div>` : ''}
  ${und ? `<p class="err small" style="margin-top:10px">${und} ${und > 1 ? 'sets have numbers but are not ticked, so they' : 'set has numbers but is not ticked, so it'} won't be saved.</p>` : ''}
  <label class="lab" for="fName">Name</label><input id="fName" class="field" value="${esc(w.name)}">
  <label class="lab" for="fNote">Notes</label><textarea id="fNote" class="field" placeholder="How did it feel? Sleep, energy, anything that hurt">${esc(w.note || '')}</textarea>
  <div class="stack" style="margin-top:16px"><button class="btn pri block" data-a="saveWorkout">${w.editOf ? 'Save changes' : 'Save workout'}</button><button class="btn block" data-a="closeSheet">Keep going</button></div>`);
};
A.saveWorkout = () => {
  const w = S.active; if (!w) return;
  w.name = ($('#fName') ? $('#fName').value : w.name).trim() || w.name || 'Workout';
  w.note = ($('#fNote') ? $('#fNote').value : w.note || '').trim();
  const out = buildWorkout(w); out.prs = computePRs(out);
  const keys = new Set([monthKey(out.start)]);
  if (w.editOf) { const old = S.workouts.find(x => x.id === w.editOf); if (old) keys.add(monthKey(old.start)); S.workouts = S.workouts.filter(x => x.id !== w.editOf); }
  S.workouts.push(out); S.active = null;
  touchActive(); touchMonths([...keys]); closeSheet();
  ui.tab = 'history'; ui.view = { name: 'wdetail', id: out.id }; render();
  toast(out.prs.length ? `Saved, with ${out.prs.length} new record${out.prs.length > 1 ? 's' : ''}` : 'Workout saved');
};
A.discard = () => confirmSheet(S.active.editOf ? 'Cancel editing?' : 'Discard this workout?', S.active.editOf ? 'Your saved workout stays as it was.' : 'Nothing from this session will be saved.', 'confirmDiscard', S.active.editOf ? 'Cancel editing' : 'Discard workout', {}, 'Keep it');
A.confirmDiscard = () => { S.active = null; touchActive(); closeSheet(); ui.view = null; render(); };

/* ================= exercise picker and custom exercises ================= */
function openPicker(mode, i) { ui.pick = { mode, i }; ui.exq = ''; ui.exm = ''; openSheet(pickerHtml()); }
function pickerHtml() {
  const title = ui.pick && ui.pick.mode.includes('replace') ? 'Replace exercise' : 'Add exercise';
  return `<div class="row between"><h2 class="h3">${title}</h2><button class="icon-btn" data-a="closeSheet" aria-label="Close">${icon('x')}</button></div>
  <input class="field" data-in="exq" placeholder="Search exercises" value="${esc(ui.exq)}" autocomplete="off" aria-label="Search exercises">
  <div class="chips" style="margin-top:10px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px">${['', ...Object.keys(MUSCLES).filter(m => m !== 'other')].map(m => `<button class="chip${ui.exm === m ? ' on' : ''}" style="flex:none"${da({ a: 'exm', m })}>${m ? MUSCLES[m] : 'All'}</button>`).join('')}</div>
  <div class="pick" id="pickList">${pickList()}</div>
  <button class="btn block" style="margin-top:10px" data-a="newCustom">${icon('plus')} Create custom exercise</button>`;
}
const pickBtn = e => `<button${da({ a: 'pickEx', id: e.id })}><b>${esc(e.name)}</b><span>${esc(MUSCLES[e.m] || '')}, ${esc(EQUIP[e.eq] || '')}${S.customEx[e.id] ? ', custom' : ''}</span></button>`;
function pickList() {
  const q = ui.exq.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const list = allEx().filter(e => (!ui.exm || e.m === ui.exm) && q.every(w => e.name.toLowerCase().includes(w)));
  if (!q.length && !ui.exm) {
    const seen = []; for (const w of sortedWorkouts()) for (const e of w.ex) if (!seen.includes(e.exId) && (BUILTIN[e.exId] || S.customEx[e.exId])) seen.push(e.exId);
    const recent = seen.slice(0, 8).map(EX);
    if (recent.length) return `<div class="small faint" style="padding:6px 4px">Recent</div>${recent.map(pickBtn).join('')}<div class="small faint" style="padding:14px 4px 6px">All exercises</div>${list.map(pickBtn).join('')}`;
  }
  return list.length ? list.map(pickBtn).join('') : `<p class="muted small" style="padding:8px 4px">No match. Create it as a custom exercise below.</p>`;
}
IN.exq = (d, el) => { ui.exq = el.value; const p = $('#pickList'); if (p) p.innerHTML = pickList(); };
A.exm = d => { ui.exm = d.m; swapSheet(pickerHtml()); };
function newRoutineEx(id) { const ex = EX(id); const [lo, hi] = defaultRange(ex, ex.comp ? 'comp' : 'iso'); const n = ex.type === 'wd' || ex.type === 'cd' ? 1 : 3; return { exId: id, lo, hi, rir: null, rest: null, sets: Array.from({ length: n }, () => ({ w: null, r: null, d: null, t: null })) }; }
A.pickEx = d => {
  const p = ui.pick; closeSheet(); ui.pick = null; if (!p) return;
  const id = d.id;
  if (p.mode === 'add') {
    S.active.ex.push(makeLiveEx(id, null, null)); touchActive(); render();
    setTimeout(() => { const c = document.querySelectorAll('.exc'); const last = c[c.length - 1]; if (last) last.scrollIntoView({ block: 'center' }); }, 30);
  } else if (p.mode === 'replace') {
    const e = S.active.ex[p.i], ne = makeLiveEx(id, null, null);
    const n = Math.max(1, e.sets.filter(s => !s.done).length);
    ne.sets = Array.from({ length: n }, () => blankSet());
    if (e.ss) ne.ss = e.ss; S.active.ex[p.i] = ne; touchActive(); render();
  } else if (p.mode === 'radd') { ui.draft.ex.push(newRoutineEx(id)); render(); }
  else if (p.mode === 'rreplace') { const old = ui.draft.ex[p.i]; ui.draft.ex[p.i] = { ...newRoutineEx(id), sets: old.sets.map(() => ({ w: null, r: null, d: null, t: null })), ...(old.ss ? { ss: old.ss } : {}) }; render(); }
};
A.newCustom = () => {
  const nm = ui.exq.trim(), m = guessMuscle(nm), eq = guessEquip(nm);
  swapSheet(`<h2 class="h3">Custom exercise</h2>
  <label class="lab" for="cName">Name</label><input id="cName" class="field" value="${esc(nm)}" placeholder="e.g. Belt Squat (Machine)">
  <label class="lab" for="cM">Main muscle</label><select id="cM" class="field">${Object.entries(MUSCLES).map(([k, l]) => `<option value="${k}"${k === m ? ' selected' : ''}>${l}</option>`).join('')}</select>
  <label class="lab" for="cEq">Equipment</label><select id="cEq" class="field">${Object.entries(EQUIP).map(([k, l]) => `<option value="${k}"${k === eq ? ' selected' : ''}>${l}</option>`).join('')}</select>
  <label class="lab" for="cT">What you log</label><select id="cT" class="field">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join('')}</select>
  <label class="lab" for="cC">Movement</label><select id="cC" class="field"><option value="0">Isolation (one joint, e.g. curls)</option><option value="1">Compound (several joints, e.g. presses)</option></select>
  <div class="stack" style="margin-top:16px"><button class="btn pri block" data-a="saveCustom">Create and add</button><button class="btn block" data-a="backPicker">Back to the list</button></div>`);
};
A.backPicker = () => swapSheet(pickerHtml());
A.saveCustom = () => {
  const name = $('#cName').value.trim();
  if (!name) { toast('Give it a name'); return; }
  if (exByName(name)) { toast('That exercise already exists'); return; }
  const id = 'c-' + uid();
  S.customEx[id] = { id, name, m: $('#cM').value, sec: [], eq: $('#cEq').value, type: $('#cT').value, comp: $('#cC').value === '1', custom: true };
  touchMeta(); A.pickEx({ id });
};
A.delCustom = d => { delete S.customEx[d.id]; S.routines.forEach(r => { r.ex = r.ex.filter(e => e.exId !== d.id); }); touchMeta(); A.back(); toast('Exercise deleted'); };

/* ================= routines ================= */
A.newRoutine = () => { ui.draft = { id: null, name: '', ex: [] }; ui.view = { name: 'routine' }; render(); };
A.editRoutine = d => { const r = S.routines.find(x => x.id === d.id); if (!r) return; closeSheet(); ui.draft = clone(r); ui.view = { name: 'routine' }; render(); };
A.cancelDraft = () => { ui.draft = null; ui.view = null; render(); };
IN.rname = (d, el) => { ui.draft.name = el.value; };
IN.rset = (d, el) => { ui.draft.ex[d.i].sets[d.j][d.k] = num(el.value); };
IN.rrx = (d, el) => { const re = ui.draft.ex[d.i]; if (d.k === 'rir') re.rir = el.value === '' ? null : +el.value; else if (d.k === 'rest') re.rest = +el.value; else re[d.k] = num(el.value); };
A.rAddSet = d => { const re = ui.draft.ex[d.i]; const last = re.sets[re.sets.length - 1]; re.sets.push(last ? { ...last } : { w: null, r: null, d: null, t: null }); render(); };
A.rDelSet = d => { ui.draft.ex[d.i].sets.splice(+d.j, 1); render(); };
A.rAddEx = () => openPicker('radd');
A.rExMenu = d => { const i = +d.i, n = ui.draft.ex.length; openSheet(`<h2 class="h3">${esc(EX(ui.draft.ex[i].exId).name)}</h2><div class="menu"><button${da({ a: 'rExReplace', i })}>Replace exercise</button>${i < n - 1 && !(ui.draft.ex[i].ss && ui.draft.ex[i].ss === ui.draft.ex[i + 1].ss) ? `<button${da({ a: 'rSuper', i })}>Superset with next exercise</button>` : ''}${ui.draft.ex[i].ss ? `<button${da({ a: 'rUnsuper', i })}>Remove from superset</button>` : ''}${i > 0 ? `<button${da({ a: 'rExMove', i, n: -1 })}>Move up</button>` : ''}${i < n - 1 ? `<button${da({ a: 'rExMove', i, n: 1 })}>Move down</button>` : ''}<button class="danger"${da({ a: 'rExRemove', i })}>Remove exercise</button></div>`); };
A.rExReplace = d => openPicker('rreplace', +d.i);
A.rExMove = d => { const L = ui.draft.ex, i = +d.i, j = i + (+d.n); if (j >= 0 && j < L.length) [L[i], L[j]] = [L[j], L[i]]; fixSupersets(L); closeSheet(); render(); };
A.rSuper = d => { superWith(ui.draft.ex, +d.i); closeSheet(); render(); };
A.rUnsuper = d => { unsuper(ui.draft.ex, +d.i); closeSheet(); render(); };
A.rExRemove = d => { ui.draft.ex.splice(+d.i, 1); fixSupersets(ui.draft.ex); closeSheet(); render(); };
A.saveRoutine = () => {
  const d = ui.draft; d.name = (d.name || '').trim() || 'Untitled routine';
  for (const re of d.ex) if (re.lo != null && re.hi != null && re.hi < re.lo) { const t = re.lo; re.lo = re.hi; re.hi = t; }
  if (d.id) { const i = S.routines.findIndex(r => r.id === d.id); if (i >= 0) S.routines[i] = d; else S.routines.push(d); }
  else { d.id = uid(); S.routines.push(d); }
  touchMeta(); ui.draft = null; ui.view = null; ui.tab = 'train'; render(); toast('Routine saved');
};
A.deleteRoutine = d => confirmSheet('Delete this routine?', 'Workouts you logged with it stay in your history.', 'confirmDelRoutine', 'Delete routine', { id: d.id }, 'Keep it');
A.confirmDelRoutine = d => { S.routines = S.routines.filter(r => r.id !== d.id); if (S.program) S.program.order = (S.program.order || []).filter(x => x !== d.id); touchMeta(); closeSheet(); ui.draft = null; ui.view = null; render(); toast('Routine deleted'); };
function exGroups(list) { const out = []; list.forEach((e, i) => { const nm = EX(e.exId).name; if (i > 0 && e.ss && list[i - 1].ss === e.ss) out[out.length - 1].push(nm); else out.push([nm]); }); return out; }
A.routineMenu = d => {
  const r = S.routines.find(x => x.id === d.id); if (!r) return;
  const sets = r.ex.reduce((n, e) => n + (e.sets ? e.sets.length : 0), 0);
  openSheet(`<div class="row"><div class="grow"><h2 class="h">${esc(r.name)}</h2><p class="small muted" style="margin:2px 0 0">${r.ex.length} exercises, ${sets} sets, about ${Math.round(sets * 2.9 + 6)} min</p></div></div>
  <ol class="rlist">${exGroups(r.ex).map(g => `<li>${g.length > 1 ? `<span class="sstag">Superset</span> ` : ''}${g.map(esc).join(' <span class="faint">+</span> ')}</li>`).join('')}</ol>
  <button class="btn pri block big"${da({ a: 'startRoutine', id: r.id })}>${icon('play')} Start ${esc(r.name)}</button>
  <div class="menu" style="margin-top:8px"><button${da({ a: 'editRoutine', id: r.id })}>Edit routine</button><button${da({ a: 'dupRoutine', id: r.id })}>Duplicate</button><button${da({ a: 'moveRoutine', id: r.id, n: -1 })}>Move up</button><button${da({ a: 'moveRoutine', id: r.id, n: 1 })}>Move down</button><button class="danger"${da({ a: 'deleteRoutine', id: r.id })}>Delete routine</button></div>`);
};
A.dupRoutine = d => { const r = S.routines.find(x => x.id === d.id); if (!r) return; const c = clone(r); c.id = uid(); c.name = r.name + ' (copy)'; delete c.programId; S.routines.push(c); touchMeta(); closeSheet(); render(); toast('Routine duplicated'); };
A.moveRoutine = d => {
  const arr = S.routines, i = arr.findIndex(r => r.id === d.id), step = +d.n; if (i < 0) return;
  const grp = !!arr[i].programId; let j = i + step;
  while (j >= 0 && j < arr.length && !!arr[j].programId !== grp) j += step;
  closeSheet(); if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  if (grp && S.program) S.program.order = arr.filter(r => r.programId === S.program.id).map(r => r.id);
  touchMeta(); render();
};

/* ================= history actions ================= */
A.wMenu = d => openSheet(`<h2 class="h3">Workout</h2><div class="menu"><button${da({ a: 'editWorkout', id: d.id })}>Edit workout</button><button${da({ a: 'saveAsRoutine', id: d.id })}>Save as routine</button><button class="danger"${da({ a: 'delWorkout', id: d.id })}>Delete workout</button></div>`);
A.editWorkout = d => {
  if (S.active) { closeSheet(); toast('Finish or discard the current workout first'); return; }
  const w = S.workouts.find(x => x.id === d.id); if (!w) return;
  const a = clone(w); a.editOf = w.id; a.id = uid(); a.rest = null;
  a.ex.forEach(e => { if (!e.rx) e.rx = rxFor({ exId: e.exId }); e.tmpl = []; });
  S.active = a; touchActive(); closeSheet(); ui.view = { name: 'workout' }; render();
};
A.saveAsRoutine = d => {
  const w = S.workouts.find(x => x.id === d.id); if (!w) return;
  const r = { id: uid(), name: w.name, ex: w.ex.map(e => { const ws = e.sets.filter(s => s.type !== 'w'); return { exId: e.exId, ...(e.ss ? { ss: e.ss } : {}), lo: e.rx ? e.rx.lo : null, hi: e.rx ? e.rx.hi : null, rir: e.rx ? e.rx.rir : null, rest: e.rx ? e.rx.rest : null, sets: (ws.length ? ws : e.sets).map(s => ({ w: s.w ?? null, r: s.r ?? null, d: s.d ?? null, t: s.t ?? null })) }; }) };
  S.routines.push(r); touchMeta(); closeSheet(); toast('Saved as a routine on the Train tab');
};
A.delWorkout = d => confirmSheet('Delete this workout?', 'It is removed from your history and stats. This cannot be undone.', 'confirmDelWorkout', 'Delete workout', { id: d.id }, 'Keep it');
A.confirmDelWorkout = d => { const w = S.workouts.find(x => x.id === d.id); if (!w) return; S.workouts = S.workouts.filter(x => x.id !== d.id); touchMonths([monthKey(w.start)]); closeSheet(); ui.view = null; render(); toast('Workout deleted'); };

/* ================= stats and body ================= */
A.statsRange = d => { ui.statsRange = d.v; render(); };
A.statsMetric = d => { ui.statsMetric = d.v; render(); };
A.mvol = d => { ui.mvol = d.v; render(); };
A.exMetric = d => { ui.exMetric = d.v; render(); };
A.exAll = () => { ui.exAll = !ui.exAll; render(); };
A.calNav = d => { ui.calMonth = addMonths(ui.calMonth, +d.n); render(); };
A.mMetric = d => { ui.mMetric = d.k; render(); };
CH.inc = (d, el) => { const v = num(el.value); if (v != null && v > 0) { S.settings.inc[d.id] = v; touchMeta(); toast('Load step saved'); } else el.value = fmtW(incFor(d.id)); };
A.addMeasure = () => {
  const last = [...S.measures].sort((a, b) => b.date - a.date)[0] || {}, t = new Date();
  const iso = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  openSheet(`<h2 class="h3">New measurement</h2><label class="lab" for="mDate">Date</label><input id="mDate" type="date" class="field" value="${iso}">
  <div class="rx-grid" style="grid-template-columns:1fr 1fr">${MEAS.map(([k, l, u]) => `<div><label class="lab" for="m_${k}">${l} (${u})</label><input id="m_${k}" class="field" inputmode="decimal" placeholder="${last[k] != null ? fmtW(last[k]) : ''}"></div>`).join('')}</div>
  <button class="btn pri block" style="margin-top:16px" data-a="saveMeasure">Save entry</button>`);
};
A.saveMeasure = () => {
  const v = $('#mDate').value, [y, m, dd] = v.split('-').map(Number);
  const e = { id: uid(), date: y ? new Date(y, m - 1, dd, 12).getTime() : Date.now() };
  let any = false;
  for (const [k] of MEAS) { const x = num($('#m_' + k).value); if (x != null) { e[k] = x; any = true; } }
  if (!any) { toast('Fill in at least one measurement'); return; }
  S.measures.push(e);
  const latest = [...S.measures].sort((a, b) => b.date - a.date).find(x => x.bw != null); if (latest) S.settings.bw = latest.bw;
  touchMeta(); closeSheet(); render(); toast('Entry saved');
};
A.delMeasure = d => { S.measures = S.measures.filter(m => m.id !== d.id); touchMeta(); render(); };

/* ================= coach actions ================= */
A.cf = d => { let v = d.v; if (d.k === 'days' || d.k === 'mins') v = +v; ui.cf[d.k] = v; ui.preview = null; render(); };
A.cfFocus = d => { const f = ui.cf.focus, i = f.indexOf(d.f); if (i >= 0) f.splice(i, 1); else f.push(d.f); ui.preview = null; render(); };
A.preview = () => { ui.preview = buildProgram(ui.cf); render(); setTimeout(() => { const p = $('#preview'); if (p) p.scrollIntoView({ block: 'start' }); }, 30); };
A.cancelPreview = () => { ui.preview = null; render(); };
A.rebuild = () => { ui.rebuild = true; ui.preview = null; if (S.program) ui.cf = clone(S.program.cfg); render(); setTimeout(() => { const p = $('#builder'); if (p) p.scrollIntoView({ block: 'start' }); }, 30); };
A.cancelRebuild = () => { ui.rebuild = false; ui.preview = null; render(); };
A.saveProgram = () => {
  const P = ui.preview; if (!P) return;
  if (S.program) S.routines = S.routines.filter(r => r.programId !== S.program.id);
  const pid = uid();
  const routines = P.days.map(d => ({ id: uid(), name: d.name, programId: pid, ex: d.slots.map(s => ({ exId: s.exId, role: s.role, lo: s.lo, hi: s.hi, rir: null, rest: s.rest, sets: Array.from({ length: s.sets }, () => ({ w: null, r: null, d: null, t: null })) })) }));
  S.routines = [...routines, ...S.routines];
  S.program = { id: pid, cfg: P.cfg, rirs: P.rirs, start: weekStart(Date.now()), order: routines.map(r => r.id) };
  ui.preview = null; ui.rebuild = false; touchMeta(); render(); window.scrollTo(0, 0);
  toast('Program saved. Its routines are on the Train tab.');
};
A.restartMeso = () => { S.program.start = weekStart(Date.now()); touchMeta(); render(); toast('Back to week 1'); };
A.deloadNow = () => { const len = S.program.rirs.length + 1; S.program.start = addDays(weekStart(Date.now()), -7 * (len - 1)); touchMeta(); render(); toast('Deload week started'); };
A.endProgram = () => confirmSheet('End this program?', 'Its routines move to My routines and keep their progression. Your history stays.', 'confirmEndProgram', 'End program', {}, 'Keep program');
A.confirmEndProgram = () => { const id = S.program && S.program.id; S.routines.forEach(r => { if (r.programId === id) delete r.programId; }); S.program = null; touchMeta(); closeSheet(); render(); };
CH.defRir = (d, el) => { S.settings.rir = +el.value; touchMeta(); render(); };

/* ================= settings and data ================= */
CH.set = (d, el) => {
  if (d.k === 'rest') S.settings.rest = +el.value;
  else { const v = num(el.value); if (d.k === 'bar') { if (v == null || v < 0) { toast('Enter a bar weight'); el.value = fmtW(S.settings.bar); return; } S.settings.bar = v; } if (d.k === 'bw') S.settings.bw = v; }
  touchMeta(); toast('Saved');
};
A.togPlate = d => { const p = +d.p, a = S.settings.plates, i = a.indexOf(p); if (i >= 0) a.splice(i, 1); else a.push(p); touchMeta(); render(); };
A.setSound = d => { S.settings.sound = d.v === '1'; touchMeta(); render(); if (S.settings.sound) { ensureAudio(); beep(); } };
A.theme = d => { S.settings.theme = d.v; touchMeta(); applyTheme(); render(); };
const isoDate = () => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const hevyDate = ts => { const d = new Date(ts); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
function toCSV() {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['title', 'start_time', 'end_time', 'description', 'exercise_title', 'superset_id', 'exercise_notes', 'set_index', 'set_type', 'weight_kg', 'reps', 'distance_km', 'duration_seconds', 'rpe'].map(q).join(',')];
  for (const w of [...S.workouts].sort((a, b) => a.start - b.start)) for (const e of w.ex) {
    const ex = EX(e.exId);
    e.sets.forEach((s, i) => {
      const km = ex.type === 'wd' ? (s.d != null ? r2(s.d / 1000) : '') : ex.type === 'cd' ? (s.d ?? '') : '';
      const sec = ex.type === 'dur' ? (s.t ?? '') : ex.type === 'cd' ? (s.t != null ? Math.round(s.t * 60) : '') : '';
      const sid = e.ss ? w.ex.filter((x, k) => x.ss && (k === 0 || w.ex[k - 1].ss !== x.ss)).findIndex(x => x.ss === e.ss) : '';
      lines.push([w.name, hevyDate(w.start), hevyDate(w.end || w.start), w.note || '', ex.name, sid, e.note || '', i, { n: 'normal', w: 'warmup', d: 'dropset', f: 'failure' }[s.type] || 'normal', ['wr', 'aw', 'wd'].includes(ex.type) ? (s.w ?? '') : '', s.r ?? '', km, sec, s.rir != null ? 10 - s.rir : ''].map(q).join(','));
    });
  }
  return lines.join('\n');
}
A.exportCsv = () => saveFile(`overload-workouts-${isoDate()}.csv`, toCSV(), 'text/csv', false);
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
function parseHevyDate(s) {
  if (!s) return null;
  const m = s.trim().match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4}),? (\d{1,2}):(\d{2})/);
  if (m) { const mon = MON.findIndex(x => x.toLowerCase() === m[2].toLowerCase()); if (mon >= 0) return new Date(+m[3], mon, +m[1], +m[4], +m[5]).getTime(); }
  const t = Date.parse(s); return isNaN(t) ? null : t;
}
function importHevyCSV(text) {
  const rows = parseCSV(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('The file is empty.');
  const head = rows.shift().map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const col = n => head.indexOf(n);
  const ci = { title: col('title'), start: col('start_time'), end: col('end_time'), desc: col('description'), ex: col('exercise_title'), exnote: col('exercise_notes'), type: col('set_type'), kg: col('weight_kg'), lbs: col('weight_lbs'), reps: col('reps'), km: col('distance_km'), mi: col('distance_miles'), dur: col('duration_seconds'), rpe: col('rpe'), ss: col('superset_id') };
  if (ci.start < 0 || ci.ex < 0) throw new Error("This doesn't look like a Hevy workout export. It needs start_time and exercise_title columns.");
  const byW = new Map(); let newEx = 0;
  const get = (r, i) => i >= 0 ? r[i] : '';
  for (const r of rows) {
    if (r.length < 3) continue;
    const start = parseHevyDate(get(r, ci.start)); if (!start) continue;
    const title = get(r, ci.title) || 'Workout', key = title + '|' + start;
    let w = byW.get(key);
    if (!w) { w = { id: uid(), name: title, routineId: null, start, end: parseHevyDate(get(r, ci.end)) || start + 3600e3, note: get(r, ci.desc) || '', ex: [], prs: [] }; byW.set(key, w); }
    const exName = (get(r, ci.ex) || '').trim(); if (!exName) continue;
    const kg = ci.kg >= 0 ? num(get(r, ci.kg)) : (ci.lbs >= 0 && num(get(r, ci.lbs)) != null ? r2(num(get(r, ci.lbs)) * 0.45359237) : null);
    const reps = num(get(r, ci.reps)), km = ci.km >= 0 ? num(get(r, ci.km)) : (ci.mi >= 0 && num(get(r, ci.mi)) != null ? num(get(r, ci.mi)) * 1.609344 : null);
    const dur = num(get(r, ci.dur)), rpe = num(get(r, ci.rpe));
    let ex = exByName(exName);
    if (!ex) {
      const type = km != null && kg != null ? 'wd' : km != null ? 'cd' : dur != null && reps == null ? 'dur' : reps != null && (kg == null || kg === 0) ? 'bw' : 'wr';
      const id = 'c-' + uid(); ex = { id, name: exName, m: guessMuscle(exName), sec: [], eq: guessEquip(exName), type, comp: false, custom: true };
      S.customEx[id] = ex; newEx++;
    }
    let e = w.ex[w.ex.length - 1];
    if (!e || e.exId !== ex.id) { e = { exId: ex.id, note: get(r, ci.exnote) || '', sets: [] }; const sid = get(r, ci.ss); if (sid !== '' && sid != null) e.ss = 'h' + sid; w.ex.push(e); }
    const t = (get(r, ci.type) || 'normal').toLowerCase();
    const s = { type: t.startsWith('warm') ? 'w' : t.startsWith('drop') ? 'd' : t.startsWith('fail') ? 'f' : 'n', w: kg, r: reps, rir: rpe != null ? Math.max(0, Math.round(10 - rpe)) : null, d: null, t: null, done: true };
    if (ex.type === 'wd') s.d = km != null ? r2(km * 1000) : null;
    if (ex.type === 'cd') { s.d = km != null ? r2(km) : null; s.t = dur != null ? r2(dur / 60) : null; }
    if (ex.type === 'dur') s.t = dur;
    e.sets.push(s);
  }
  let added = 0, skipped = 0; const keys = new Set();
  const list = [...byW.values()].sort((a, b) => a.start - b.start);
  for (const w of list) {
    if (S.workouts.some(x => Math.abs(x.start - w.start) < 60000 && x.name === w.name)) { skipped++; continue; }
    S.workouts.push(w); keys.add(monthKey(w.start)); added++;
  }
  bust();
  for (const w of list) if (S.workouts.includes(w)) w.prs = computePRs(w);
  return { added, skipped, newEx, keys: [...keys] };
}

/* ================= on-device storage: IndexedDB, optional passcode encryption ================= */
const APP_VERSION = '1.1.0';
const STORE = { ready: false, locked: false, lock: null, memOnly: false, busy: false, again: false, err: null, t: null, hiddenAt: 0, persisted: false, update: null, updating: false, suppressLock: false };
const DIRTY = new Set();
let CKEY = null; // AES-GCM key while unlocked; never stored, never extractable
let installEvt = null;
const te = new TextEncoder(), td = new TextDecoder();
const IDB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('IndexedDB is not available'));
      const r = indexedDB.open('overload', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { IDB.db = r.result; IDB.db.onversionchange = () => IDB.db.close(); res(); };
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('Storage is busy. Close other copies of the app and reopen it.'));
    });
  },
  get(k) { return new Promise((res, rej) => { const q = IDB.db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  all() {
    return new Promise((res, rej) => {
      const out = {}, q = IDB.db.transaction('kv').objectStore('kv').openCursor();
      q.onsuccess = () => { const c = q.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      q.onerror = () => rej(q.error);
    });
  },
  batch(puts, dels = [], clearAll = false) {
    return new Promise((res, rej) => {
      const t = IDB.db.transaction('kv', 'readwrite', { durability: 'strict' }), st = t.objectStore('kv');
      if (clearAll) st.clear();
      for (const [k, v] of puts) st.put(v, k);
      for (const k of dels) st.delete(k);
      t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('Write aborted'));
    });
  },
};
const hasCrypto = () => !!(window.isSecureContext && window.crypto && crypto.subtle);
const PBKDF2_ITER = 600000;
async function deriveKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encObj(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj)));
  return { enc: 1, iv, ct: new Uint8Array(ct) };
}
async function decObj(key, rec) { return JSON.parse(td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: rec.iv }, key, rec.ct))); }
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

/* records: 'meta' (settings, routines…), 'active' (workout in progress), 'm-YYYY-MM' (that month's workouts), 'lock' */
function buildDoc(id) {
  if (id === 'meta') { const d = { v: 1 }; META_KEYS.forEach(k => { d[k] = S[k]; }); return d; }
  if (id === 'active') return { w: S.active || null };
  const ws = S.workouts.filter(w => monthKey(w.start) === id);
  return ws.length ? { workouts: ws } : null;
}
const allDocIds = () => ['meta', 'active', ...new Set(S.workouts.map(w => monthKey(w.start)))];
function markDirty(id) { DIRTY.add(id); clearTimeout(STORE.t); STORE.t = setTimeout(flush, 350); }
function touchMeta() { markDirty('meta'); }
function touchActive() { markDirty('active'); }
function touchMonths(keys) { keys.forEach(markDirty); bust(); }
async function flush() {
  if (!STORE.ready || STORE.locked || STORE.memOnly || !S) return;
  if (STORE.busy) { STORE.again = true; return; }
  STORE.busy = true;
  try {
    do {
      STORE.again = false;
      const ids = [...DIRTY]; DIRTY.clear();
      if (!ids.length) break;
      try {
        const puts = [], dels = [];
        for (const id of ids) { const body = buildDoc(id); if (!body) dels.push(id); else puts.push([id, CKEY ? await encObj(CKEY, body) : clone(body)]); }
        await IDB.batch(puts, dels);
        if (STORE.err && STORE.err.startsWith('Could not save')) STORE.err = null;
      } catch (e) {
        ids.forEach(i => DIRTY.add(i));
        STORE.err = 'Could not save to the phone: ' + ((e && e.message) || e) + '. Free up storage, then reopen the app.';
        toast(STORE.err); clearTimeout(STORE.t); STORE.t = setTimeout(flush, 4000); break;
      }
    } while (DIRTY.size || STORE.again);
  } finally { STORE.busy = false; }
}
async function flushAll() { clearTimeout(STORE.t); for (let i = 0; i < 200 && STORE.busy; i++) await sleep(25); await flush(); }
async function readAll(key) {
  const recs = await IDB.all(), out = {};
  for (const [k, v] of Object.entries(recs)) { if (k === 'lock') continue; out[k] = v && v.enc ? await decObj(key, v) : v; }
  return out;
}
function stateFrom(R) {
  const months = Object.entries(R).filter(([k, v]) => k.startsWith('m-') && v && Array.isArray(v.workouts));
  if (!R.meta && !months.length) return null;
  const s = R.meta ? { v: 1 } : defaultState();
  if (R.meta) META_KEYS.forEach(k => { s[k] = R.meta[k]; });
  s.workouts = months.flatMap(([, v]) => v.workouts);
  s.active = R.active ? R.active.w : null;
  return normalize(s);
}
async function requestPersist() {
  try { if (navigator.storage && navigator.storage.persist) STORE.persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist()); } catch (e) { /* not supported */ }
}

/* ================= boot and lock screen ================= */
async function boot() {
  try { await IDB.open(); }
  catch (e) { STORE.memOnly = true; STORE.err = 'On-device storage is blocked here, so nothing will be saved. ' + e.message; S = defaultState(); STORE.ready = true; startApp(); return; }
  try { STORE.lock = (await IDB.get('lock')) || null; } catch (e) { STORE.lock = null; }
  if (STORE.lock) { STORE.locked = true; showLock(); return; }
  await loadAndStart(null);
}
async function loadAndStart(key) {
  const R = await readAll(key);
  CKEY = key;
  const st = stateFrom(R);
  S = st || defaultState();
  bust();
  STORE.ready = true; STORE.locked = false;
  if (!st) touchMeta();
  hideLock(); startApp(); requestPersist().then(() => { if (ui.view && ui.view.name === 'settings') render(); });
}
function startApp() {
  applyTheme();
  ui.view = S.active ? { name: 'workout' } : null;
  render();
  if (!startApp.tick) startApp.tick = setInterval(onTick, 500);
}
function showLock(msg = '') {
  document.body.classList.add('locked');
  const el = $('#lock'), L = STORE.lock;
  el.innerHTML = `<div class="lockbox"><span class="disc lg k-first" aria-hidden="true"></span><h1 class="title">Overload</h1><p class="muted">Enter your passcode to open your training log.</p>
  <input id="lockPass" class="field" type="password" ${L && L.numeric ? 'inputmode="numeric"' : ''} autocomplete="current-password" aria-label="Passcode" placeholder="Passcode">
  <p class="err" id="lockErr" role="alert">${esc(msg)}</p><button class="btn pri block big" id="unlockBtn" data-a="unlock">Unlock</button>
  <button class="link" style="margin-top:22px" data-a="forgotPass">Forgot passcode?</button></div>`;
  el.hidden = false;
  setTimeout(() => { const i = $('#lockPass'); if (i) i.focus(); }, 60);
}
function hideLock() { document.body.classList.remove('locked'); const el = $('#lock'); el.hidden = true; el.innerHTML = ''; }
A.unlock = async () => {
  const inp = $('#lockPass'), btn = $('#unlockBtn'), pass = inp.value;
  if (!pass) { inp.focus(); return; }
  btn.disabled = true; btn.textContent = 'Unlocking…';
  try {
    const key = await deriveKey(pass, STORE.lock.salt, STORE.lock.iter);
    await decObj(key, STORE.lock.check);
    inp.value = '';
    await loadAndStart(key);
  } catch (e) {
    $('#lockErr').textContent = e && e.name === 'OperationError' ? 'Wrong passcode. Try again.' : 'Could not open your data: ' + ((e && e.message) || e);
    btn.disabled = false; btn.textContent = 'Unlock'; inp.select();
  }
};
A.forgotPass = () => {
  $('#lock').innerHTML = `<div class="lockbox"><h1 class="title sm">Forgot your passcode?</h1><p class="muted">Your log is encrypted with it, so it can't be recovered or reset. You can erase the app and start fresh, then restore a backup file if you have one (you'll need that backup's passcode too).</p>
  <div class="stack" style="margin-top:18px"><button class="btn block danger" data-a="eraseFromLock">Erase everything and start fresh</button><button class="btn block" data-a="backToLock">Back</button></div></div>`;
};
A.backToLock = () => showLock();
A.eraseFromLock = async () => { await IDB.batch([], [], true); STORE.lock = null; CKEY = null; await loadAndStart(null); toast('App erased'); };
A.lockNow = async () => {
  if (!STORE.lock) return;
  await flushAll();
  CKEY = null; S = null; STORE.ready = false; STORE.locked = true;
  closeSheet(); keepAwake(false); $('#view').innerHTML = ''; $('#mini').innerHTML = ''; renderRest();
  showLock();
};
const verifyPass = async pass => { try { const k = await deriveKey(pass, STORE.lock.salt, STORE.lock.iter); await decObj(k, STORE.lock.check); return true; } catch (e) { return false; } };
async function rewriteAll(key, lock) {
  await flushAll();
  const puts = [];
  for (const id of allDocIds()) { const body = buildDoc(id); if (body) puts.push([id, key ? await encObj(key, body) : clone(body)]); }
  if (lock) puts.push(['lock', lock]);
  await IDB.batch(puts, [], true); // one transaction: all encrypted or all plain, never a mix
  CKEY = key; STORE.lock = lock || null;
}
async function setPasscode(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pass, salt, PBKDF2_ITER);
  const lock = { v: 1, salt, iter: PBKDF2_ITER, check: await encObj(key, { ok: 'overload' }), numeric: /^\d+$/.test(pass) };
  await rewriteAll(key, lock);
}
const busyBtn = (sel, label) => { const b = $(sel); if (b) { b.disabled = true; b.textContent = label; } };
A.lockSetup = () => openSheet(`<h2 class="h3">Set a passcode</h2><p class="small muted">Your log gets encrypted on this phone with a key made from your passcode (AES-256-GCM, PBKDF2 with 600,000 rounds). Nobody can read it without the passcode, and that includes you.</p>
  <label class="lab" for="pc1">New passcode (at least 4 characters; digits only gives you a number pad)</label><input id="pc1" class="field" type="password" autocomplete="new-password">
  <label class="lab" for="pc2">Type it again</label><input id="pc2" class="field" type="password" autocomplete="new-password">
  <p class="small err" style="margin-top:12px">If you forget it, your data can't be recovered. Back up first and keep the passcode somewhere safe.</p>
  <button class="btn pri block" id="pcGo" data-a="lockEnable">Turn on lock</button>`);
A.lockEnable = async () => {
  const a = $('#pc1').value, b = $('#pc2').value;
  if (a.length < 4) { toast('Use at least 4 characters'); return; }
  if (a !== b) { toast("The two passcodes don't match"); return; }
  busyBtn('#pcGo', 'Encrypting…');
  try { await setPasscode(a); closeSheet(); render(); toast('Lock on. Your data is encrypted.'); }
  catch (e) { closeSheet(); toast('Could not turn on the lock: ' + e.message); }
};
A.lockChange = () => openSheet(`<h2 class="h3">Change passcode</h2><label class="lab" for="pc0">Current passcode</label><input id="pc0" class="field" type="password" autocomplete="current-password">
  <label class="lab" for="pc1">New passcode</label><input id="pc1" class="field" type="password" autocomplete="new-password"><label class="lab" for="pc2">Type the new one again</label><input id="pc2" class="field" type="password" autocomplete="new-password">
  <p class="small muted" style="margin-top:12px">Older backup files keep the passcode they were made with.</p><button class="btn pri block" id="pcGo" data-a="lockChangeGo">Change passcode</button>`);
A.lockChangeGo = async () => {
  const c = $('#pc0').value, a = $('#pc1').value, b = $('#pc2').value;
  if (a.length < 4) { toast('Use at least 4 characters'); return; }
  if (a !== b) { toast("The new passcodes don't match"); return; }
  busyBtn('#pcGo', 'Checking…');
  if (!(await verifyPass(c))) { toast('Current passcode is wrong'); closeSheet(); return; }
  busyBtn('#pcGo', 'Re-encrypting…');
  try { await setPasscode(a); closeSheet(); render(); toast('Passcode changed'); } catch (e) { closeSheet(); toast('Could not change it: ' + e.message); }
};
A.lockOff = () => openSheet(`<h2 class="h3">Turn off the lock?</h2><p class="small muted">Your data stays on this phone but is no longer encrypted by the app.</p><label class="lab" for="pc0">Current passcode</label><input id="pc0" class="field" type="password" autocomplete="current-password"><button class="btn block danger" style="margin-top:14px" id="pcGo" data-a="lockOffGo">Turn off lock</button>`);
A.lockOffGo = async () => {
  busyBtn('#pcGo', 'Checking…');
  if (!(await verifyPass($('#pc0').value))) { toast('Wrong passcode'); closeSheet(); return; }
  try { await rewriteAll(null, null); closeSheet(); render(); toast('Lock turned off'); } catch (e) { closeSheet(); toast('Could not turn it off: ' + e.message); }
};
CH.autoLock = (d, el) => { S.settings.autoLock = +el.value; touchMeta(); };

/* ================= backups: files you keep ================= */
async function saveFile(filename, text, mime, isBackup) {
  const blob = new Blob([text], { type: mime });
  ui.file = { filename, blob, mime, isBackup };
  const shareName = /\.json$/.test(filename) ? filename.replace(/\.json$/, '.txt') : filename;
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([blob], shareName, { type: mime === 'application/json' ? 'text/plain' : mime })] }));
  openSheet(`<h2 class="h3">${isBackup ? 'Backup ready' : 'Export ready'}</h2><p class="small muted">${esc(filename)}, ${fmtN(blob.size / 1024, 0)} KB. Keep it somewhere other than this phone too, like Google Drive or an email to yourself.</p>
  <div class="stack" style="margin-top:12px"><button class="btn pri block" data-a="dlFile">Save to Downloads</button>${canShare ? '<button class="btn block" data-a="shareFile">Share or save to Drive</button>' : ''}</div>`);
}
const markBackup = () => { if (ui.file && ui.file.isBackup) { S.settings.lastBackup = Date.now(); touchMeta(); } };
A.dlFile = () => {
  const { filename, blob } = ui.file, url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  markBackup(); closeSheet(); render(); toast('Saved to Downloads');
};
A.shareFile = async () => {
  const { filename, blob, mime } = ui.file;
  const name = /\.json$/.test(filename) ? filename.replace(/\.json$/, '.txt') : filename;
  STORE.suppressLock = true;
  try { await navigator.share({ files: [new File([blob], name, { type: mime === 'application/json' ? 'text/plain' : mime })], title: name }); markBackup(); closeSheet(); render(); }
  catch (e) { if (e && e.name !== 'AbortError') toast('Sharing failed: ' + e.message); }
};
A.snoozeBackup = () => { S.settings.backupSnooze = Date.now() + 14 * DAY; touchMeta(); render(); };
const backupData = () => ({ settings: S.settings, routines: S.routines, customEx: S.customEx, measures: S.measures, program: S.program, workouts: S.workouts });
A.exportJson = async () => {
  let text;
  if (CKEY && STORE.lock) {
    const e = await encObj(CKEY, backupData());
    text = JSON.stringify({ app: 'overload', v: 2, exported: Date.now(), enc: { alg: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iter: STORE.lock.iter, salt: b64(STORE.lock.salt), iv: b64(e.iv), ct: b64(e.ct) } });
  } else text = JSON.stringify({ app: 'overload', v: 1, exported: Date.now(), data: backupData() });
  saveFile(`overload-backup-${isoDate()}.json`, text, 'application/json', true);
};
A.importFile = () => { STORE.suppressLock = true; const f = $('#file'); f.value = ''; f.click(); };
async function handleImport(file) {
  try {
    const text = await file.text(), t = text.trim();
    if (/\.json$/i.test(file.name) || (t.startsWith('{') && t.includes('"overload"'))) {
      const data = JSON.parse(t);
      if (data && data.app === 'overload' && data.kind === 'routines' && Array.isArray(data.routines)) { packSheet(data); return; }
      if (!data || data.app !== 'overload' || !(data.data || data.enc)) throw new Error("This file isn't an Overload backup.");
      ui.pendingFile = data;
      if (data.enc) { openSheet(`<h2 class="h3">Encrypted backup</h2><p class="small muted">Enter the passcode that was set when this backup was made.</p><input id="bkPass" class="field" type="password" autocomplete="off" aria-label="Backup passcode"><button class="btn pri block" style="margin-top:12px" id="bkGo" data-a="decryptBackup">Open backup</button>`); setTimeout(() => { const i = $('#bkPass'); if (i) i.focus(); }, 60); }
      else confirmRestoreSheet(data.data, data.exported);
    } else {
      const r = importHevyCSV(text);
      touchMonths(r.keys); if (r.newEx) touchMeta();
      render();
      openSheet(`<h2 class="h3">Import finished</h2><p>${r.added} workouts added${r.skipped ? `, ${r.skipped} skipped because they were already here` : ''}.</p>${r.newEx ? `<p class="muted small">${r.newEx} exercises weren't in the library, so they became custom exercises with a best-guess muscle group.</p>` : ''}<p class="muted small">The coach now uses this history for your next targets.</p><button class="btn pri block" data-a="closeSheet">Done</button>`);
    }
  } catch (err) { openSheet(`<h2 class="h3">Import failed</h2><p class="err">${esc(err.message)}</p><button class="btn block" data-a="closeSheet">OK</button>`); }
}
function packSheet(P) {
  ui.pendingPack = P;
  openSheet(`<h2 class="h3">Add ${esc(P.name || 'this plan')}?</h2><p class="muted">Adds ${P.routines.map(r => esc(r.name)).join(', ')}. Routines with the same name are updated in place, so your past workouts stay linked to them.</p><p class="small muted">The first session of each uses the plan's numbers. After that the coach takes over from what you actually lift.</p><div class="stack" style="margin-top:14px"><button class="btn pri block" data-a="confirmPack">Add plan</button><button class="btn block" data-a="closeSheet">Cancel</button></div>`);
}
A.confirmPack = () => {
  const P = ui.pendingPack; if (!P) return;
  const now = Date.now(); let added = 0, updated = 0; const missing = new Set();
  for (const r of P.routines) {
    const ex = (r.ex || []).filter(e => { const ok = !!(BUILTIN[e.exId] || S.customEx[e.exId]); if (!ok) missing.add(e.exId); return ok; })
      .map(e => ({ exId: e.exId, lo: e.lo ?? null, hi: e.hi ?? null, rir: e.rir ?? null, rest: e.rest ?? null, sets: (e.sets || []).map(s => ({ w: s.w ?? null, r: s.r ?? null, d: s.d ?? null, t: s.t ?? null })), ...(e.ss ? { ss: String(e.ss) } : {}) }));
    fixSupersets(ex);
    const name = String(r.name || 'Routine').slice(0, 60);
    const old = S.routines.find(x => !x.programId && x.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (old) { old.ex = ex; old.planStart = now; updated++; } else { S.routines.push({ id: uid(), name, ex, planStart: now }); added++; }
  }
  if (P.inc && typeof P.inc === 'object') for (const [k, v] of Object.entries(P.inc)) if (typeof v === 'number' && v > 0 && v < 50) S.settings.inc[k] = v;
  ui.pendingPack = null; touchMeta(); closeSheet(); ui.view = null; ui.tab = 'train'; render();
  toast(`Plan added: ${updated ? updated + ' updated' : ''}${updated && added ? ', ' : ''}${added ? added + ' new' : ''}${missing.size ? `. ${missing.size} unknown exercises skipped` : ''}`);
};
A.decryptBackup = async () => {
  const f = ui.pendingFile, e = f.enc; busyBtn('#bkGo', 'Opening…');
  try { const key = await deriveKey($('#bkPass').value, unb64(e.salt), e.iter); const data = await decObj(key, { iv: unb64(e.iv), ct: unb64(e.ct) }); confirmRestoreSheet(data, f.exported); }
  catch (err) { const b = $('#bkGo'); if (b) { b.disabled = false; b.textContent = 'Open backup'; } toast(err && err.name === 'OperationError' ? 'Wrong passcode for this backup' : 'Could not open it: ' + err.message); }
};
function confirmRestoreSheet(data, exported) {
  ui.pendingImport = data;
  openSheet(`<h2 class="h3">Restore this backup?</h2><p class="muted">${(data.workouts || []).length} workouts and ${(data.routines || []).length} routines, saved ${esc(fmtDate(exported || Date.now(), { day: 'numeric', month: 'short', year: 'numeric' }))}. This replaces everything currently in the app. Your passcode setting stays as it is.</p><div class="stack" style="margin-top:14px"><button class="btn pri block" data-a="confirmRestore">Replace with backup</button><button class="btn block" data-a="closeSheet">Cancel</button></div>`);
}
A.confirmRestore = async () => {
  const d = ui.pendingImport; if (!d) return;
  S = normalize({ ...clone(d), active: null });
  ui.pendingImport = null; ui.pendingFile = null; bust();
  await rewriteAll(CKEY, STORE.lock);
  applyTheme(); closeSheet(); ui.view = null; ui.tab = 'train'; render(); toast('Backup restored');
};
A.resetAll = () => confirmSheet('Erase everything?', 'All workouts, routines, measurements, settings and the passcode are deleted from this phone. Back up first if you might want them.', 'confirmReset', 'Erase all data', {}, 'Cancel');
A.confirmReset = async () => {
  if (!STORE.memOnly) await IDB.batch([], [], true);
  CKEY = null; STORE.lock = null;
  S = normalize({ ...defaultState(), routines: [] });
  touchMeta(); applyTheme(); closeSheet(); ui.view = null; ui.tab = 'train'; render(); toast('All data erased');
};

/* ================= install, offline and updates ================= */
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (S) render(); });
window.addEventListener('appinstalled', () => { installEvt = null; if (S) { render(); toast('Installed. Open Overload from your home screen.'); } });
A.install = async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { /* dismissed */ } installEvt = null; render(); };
A.applyUpdate = async () => { await flushAll(); const w = STORE.update && STORE.update.waiting; STORE.updating = true; if (w) w.postMessage('skipWaiting'); else location.reload(); };
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    if (reg.waiting && navigator.serviceWorker.controller) { STORE.update = reg; if (S) render(); }
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) { STORE.update = reg; if (S) render(); } });
    });
  }).catch(() => { /* offline install unavailable */ });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (STORE.updating) location.reload(); });
}

/* ================= event wiring ================= */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t) return;
  const a = t.dataset.a; if (a === 'noop') return;
  const fn = A[a]; if (!fn) return;
  e.preventDefault();
  try { const r = fn(t.dataset, t, e); if (r && r.catch) r.catch(err => { console.error(err); toast('Something went wrong: ' + err.message); }); }
  catch (err) { console.error(err); toast('Something went wrong: ' + err.message); }
});
document.addEventListener('input', e => { const t = e.target, k = t.dataset && t.dataset.in; if (k && IN[k] && S) IN[k](t.dataset, t, e); });
document.addEventListener('change', e => { const t = e.target, k = t.dataset && t.dataset.ch; if (k && CH[k] && S) CH[k](t.dataset, t, e); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'lockPass') { e.preventDefault(); A.unlock(); return; }
  if (e.key === 'Escape' && $('#sheet').innerHTML) { closeSheet(); return; }
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('in')) {
    const all = [...document.querySelectorAll('#view input.in')], i = all.indexOf(e.target);
    if (i >= 0 && all[i + 1]) { e.preventDefault(); all[i + 1].focus(); } else e.target.blur();
  }
});
$('#file').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) handleImport(f); });
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden') { STORE.hiddenAt = Date.now(); keepAwake(false); flushAll(); return; }
  const away = Date.now() - (STORE.hiddenAt || Date.now());
  if (STORE.suppressLock) { STORE.suppressLock = false; }
  else if (STORE.lock && !STORE.locked && S && STORE.hiddenAt && away >= (S.settings.autoLock ?? 5) * 60000) { await A.lockNow(); return; }
  if (S) { onTick(); keepAwake((ui.view && ui.view.name) === 'workout' && !!S.active && !S.active.editOf); }
});
window.addEventListener('pagehide', () => { flushAll(); });

boot();
