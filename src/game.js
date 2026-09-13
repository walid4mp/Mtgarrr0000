/* ============================================================
   Truck Loader — محرّك اللعبة (منطق + حلقة زمنية + واجهة)
   ============================================================ */
import { W, H, LEVELS, TRUCK, CRATE, WALL_L, WALL_R, GROUND_Y, slotPos } from './levels.js';
import * as A from './art.js';
import { AudioKit } from './audio.js';

const STEP = 1 / 60;
const SPEED = 2.7;
const ELEV_SPEED = 2.1;
const GRAV = 0.62;
const MAG_RANGE = 58;
const ARM_MIN = -25, ARM_MAX = 152, ARM_SPEED = 1.9;
const SAVE_KEY = 'truckloader.save.v1';

/* ---------- أدوات ---------- */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const center = (r) => ({ x: r.x + (r.w || CRATE) / 2, y: r.y + (r.h || CRATE) / 2 });

function loadSave() {
  const empty = { v: 1, total: 0, levels: {} };
  try {
    const raw = globalThis.localStorage && globalThis.localStorage.getItem(SAVE_KEY);
    if (!raw) return empty;
    const s = JSON.parse(raw);
    return { ...empty, ...s, levels: s.levels || {} };
  } catch (e) { return empty; }
}
function writeSave() {
  try { globalThis.localStorage && globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
}

/* ---------- الحالة ---------- */
const save = loadSave();
const audio = new AudioKit();
const keys = Object.create(null);

const S = {
  screen: 'loading', n: 1, lv: null,
  crates: [], elevators: [], plates: [], doors: [],
  loader: null, holding: null,
  t: 0, limit: 60, timeLeft: 60, done: false, paused: false,
  loaded: 0, stars: 0, score: 0, shake: 0, toast: 0,
  lastTime: 0, acc: 0
};

let canvas = null, ctx = null, raf = 0, idleStep = 0;

/* ---------- شاشات ---------- */
function show(id) {
  const list = document.querySelectorAll('.screen');
  for (let i = 0; i < list.length; i++) list[i].classList.remove('show');
  const el = $(id);
  if (el) el.classList.add('show');
  S.screen = id;
  const hud = $('hud');
  if (hud) hud.classList.toggle('hidden', !(id === 'scrNone'));
}

/* ---------- بناء المستوى ---------- */
function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function initLevel(n) {
  S.n = clamp(n, 1, LEVELS.length);
  const src = LEVELS[S.n - 1];
  S.lv = clone(src);
  S.crates = S.lv.crates.map((c, i) => ({ x: c.x, y: c.y, w: CRATE, h: CRATE, vx: 0, vy: 0, id: i, locked: false, slot: -1 }));
  S.elevators = clone(S.lv.elevators || []);
  S.plates = clone(S.lv.plates || []);
  S.doors = clone(S.lv.doors || []);
  S.doors.forEach((d) => { d.anim = 0; d.open = false; d.y = d.closedY; });
  S.loader = {
    x: S.lv.spawn.x - A.LOADER.w / 2, y: S.lv.spawn.y - A.LOADER.h, w: A.LOADER.w, h: A.LOADER.h,
    vx: 0, vy: 0, arm: S.lv.arch === 'flat' ? 34 : 6, magnet: false, facing: 1,
    onGround: true, riding: null, drive: 0
  };
  S.holding = null;
  S.t = 0;
  S.limit = Math.max(35, S.lv.par + 16);
  S.timeLeft = S.limit;
  S.done = false; S.paused = false; S.loaded = 0; S.stars = 0; S.score = 0; S.shake = 0;
  audio.hum(false);
  syncHud();
  show('scrNone');
}

function solids() {
  const out = S.lv.floors.slice();
  for (const d of S.doors) if (!d.open) out.push({ x: d.x, y: d.y, w: d.w, h: d.h, gate: true });
  // مقدمة الشاحنة كعائق أرضي
  const t = S.lv.truck;
  out.push({ x: t.x + 200, y: t.y - 76, w: 122, h: 76, hard: true });
  return out;
}

/* ---------- واجهة HUD ---------- */
function syncHud() {
  const lv = S.lv; if (!lv) return;
  const tEl = $('levelNum'), nEl = $('levelName');
  if (tEl) tEl.innerHTML = `LEVEL <em>${String(S.n).padStart(2, '0')}</em>`;
  if (nEl) nEl.textContent = lv.name.ar;
  const hint = $('hintEl');
  if (hint) {
    if (lv.hint) { hint.textContent = lv.hint.ar; hint.classList.remove('hidden'); }
    else hint.classList.add('hidden');
  }
  const gt = $('goalTotal');
  if (gt) gt.textContent = S.crates.length;
  updateGoal();
  updateStars();
  updateTimer(true);
  const skip = $('btnSkip');
  if (skip) skip.style.display = S.n >= LEVELS.length ? 'none' : '';
}

function updateGoal() {
  const box = $('goalBox');
  if (box) box.innerHTML = `الصناديق: <b>${S.loaded}</b> / <span id="goalTotal">${S.crates.length}</span>`;
}
function updateTimer(force) {
  const el = $('timer'); if (!el) return;
  const v = Math.max(0, Math.ceil(S.timeLeft));
  const txt = String(v).padStart(4, '0');
  if (force || el.textContent !== txt) el.textContent = txt;
}
function updateStars() {
  const box = $('hudStars'); if (!box) return;
  const st = box.children;
  for (let i = 0; i < st.length; i++) st[i].classList.toggle('on', i < starPreview());
}
function starPreview() {
  const r = S.timeLeft / S.limit;
  return r >= 0.55 ? 3 : r >= 0.3 ? 2 : r > 0 ? 1 : 0;
}

/* ---------- الفيزياء ---------- */
function moveX(e, dx, list) {
  e.x += dx;
  for (const s of list) {
    if (!hit(e, s)) continue;
    if (dx > 0) e.x = s.x - e.w;
    else if (dx < 0) e.x = s.x + s.w;
    e.vx = 0;
  }
  e.x = clamp(e.x, 66, 874 - e.w);
}
function moveY(e, dy, list, platforms) {
  const prevBottom = e.y + e.h;
  e.y += dy;
  e.onGround = false;
  for (const s of list) {
    if (!hit(e, s)) continue;
    if (dy >= 0) { e.y = s.y - e.h; e.vy = 0; e.onGround = true; e.landOn = s; }
    else { e.y = s.y + s.h; e.vy = 0; }
  }
  if (!e.onGround && platforms) {
    for (const p of platforms) {
      const b = e.y + e.h;
      if (dy >= 0 && prevBottom <= p.y + 6 && b >= p.y && e.x + e.w > p.x + 4 && e.x < p.x + p.w - 4) {
        e.y = p.y - e.h; e.vy = 0; e.onGround = true; e.landOn = p; break;
      }
    }
  }
}

function armTip() {
  const p = A.armPoints(S.loader);
  return p.T;
}

function press(name) {
  if (name === 'left') return keys.left || keys.ArrowLeft;
  if (name === 'right') return keys.right || keys.ArrowRight;
  if (name === 'up') return keys.up || keys.ArrowUp;
  if (name === 'down') return keys.down || keys.ArrowDown;
  return false;
}

function step(dt) {
  const L = S.loader;
  if (!L) return;
  S.t += dt;

  const ground = solids();

  // --- عدّاد الوقت ---
  if (!S.done && !S.paused) {
    S.timeLeft = Math.max(0, S.timeLeft - dt);
    updateTimer(false);
    updateStars();
  }

  // --- القيادة ---
  L.drive = 0;
  if (press('left')) { L.drive = -1; L.facing = -1; }
  else if (press('right')) { L.drive = 1; L.facing = 1; }
  // اللودر يواجه اليمين دائماً (كاللعبة الأصلية) لكن الاتجاه يؤثر على الرسم الطفيف
  L.vx = L.drive * SPEED;

  // --- المصاعد: تحديد الراكبين ثم تحريكهم مع المنصّة ---
  const ridesOn = (o, e) => !!o && o.x + o.w > e.x + 8 && o.x < e.x + e.w - 8 && Math.abs((o.y + o.h) - e.y) <= 8;
  for (const e of S.elevators) {
    e._riders = [];
    if (ridesOn(L, e)) e._riders.push(L);
    for (const c of S.crates) if (c !== S.holding && ridesOn(c, e)) e._riders.push(c);
  }
  L.riding = S.elevators.find((e) => e._riders.indexOf(L) >= 0) || null;
  for (const e of S.elevators) {
    const cmdUp = keys.elevUp || keys.w;
    const cmdDn = keys.elevDown || keys.s;
    let ny = e.y;
    if (cmdUp && L.riding === e) ny = clamp(e.y - ELEV_SPEED, e.top, e.bottom);
    if (cmdDn && L.riding === e) ny = clamp(e.y + ELEV_SPEED, e.top, e.bottom);
    const d = ny - e.y;
    if (d !== 0) { e.y = ny; for (const r of e._riders) r.y += d; }
  }

  // --- حركة اللودر ---
  L.onGround = false;
  moveX(L, L.vx, ground);
  L.vy = Math.min(L.vy + GRAV, 14);
  moveY(L, L.vy, ground, S.elevators);
  L.landOn = null;

  // منع اصطدام اللودر بالصناديق المركونة (تُعالج كعوائق)
  for (const c of S.crates) {
    if (!c.locked) continue;
    if (hit(L, c)) {
      if (L.vx > 0) L.x = c.x - L.w; else if (L.vx < 0) L.x = c.x + c.w;
    }
  }

  // --- الذراع ---
  if (press('up')) L.arm = clamp(L.arm - ARM_SPEED, ARM_MIN, ARM_MAX);
  if (press('down')) L.arm = clamp(L.arm + ARM_SPEED, ARM_MIN, ARM_MAX);

  // --- المغناطيس ---
  const tip = armTip();
  if (L.magnet && !S.holding && !S.done) {
    let best = null, bd = MAG_RANGE;
    for (const c of S.crates) {
      if (c.locked) continue;
      const cc = center(c);
      const d = Math.hypot(cc.x - tip.x, cc.y - tip.y);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) { S.holding = best; audio.grab(); audio.hum(true); S.toast = 0.6; }
    else { audio.locked(); S.shake = 3; }
  }
  if (S.holding) {
    if (!L.magnet) releaseCrate();
    else {
      S.holding.x = tip.x - CRATE / 2 + (S.lv.arch === 'flat' ? 0 : 0);
      S.holding.y = tip.y - CRATE / 2;
      S.holding.vx = 0; S.holding.vy = 0;
    }
  }

  // --- الصناديق الحرّة ---
  for (const c of S.crates) {
    if (c.locked || c === S.holding) continue;
    c.vy = Math.min(c.vy + GRAV, 14);
    moveX(c, c.vx * 0.6, ground.filter((s) => !s.hard));
    c.vx *= 0.72;
    moveY(c, c.vy, ground.filter((s) => !s.hard), S.elevators);
  }
  // تصادم الصناديق مع بعضها
  for (let i = 0; i < S.crates.length; i++) {
    const a = S.crates[i];
    if (a.locked || a === S.holding) continue;
    for (let j = i + 1; j < S.crates.length; j++) {
      const b = S.crates[j];
      if (b.locked || b === S.holding) continue;
      if (!hit(a, b)) continue;
      const ox = Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
      const oy = Math.min(a.y + a.h - b.y, b.y + b.h - a.y);
      if (ox < oy) {
        const push = ox / 2;
        if (a.x < b.x) { a.x -= push; b.x += push; } else { a.x += push; b.x -= push; }
      } else {
        const push = oy / 2;
        if (a.y < b.y) { a.y -= push; b.y += push; } else { a.y += push; b.y -= push; }
      }
    }
  }

  // --- ألواح الضغط والبوابات ---
  for (const p of S.plates) {
    const zone = { x: p.x + 6, y: p.y - 8, w: p.w - 12, h: 10 };
    const onLoad = hit(L, zone) || S.crates.some((c) => hit(c, zone));
    if (onLoad) p.on = true;
    else if (!p.latch) p.on = false;
    if (p.on && !p._snd) { audio.locked(); p._snd = true; }
    if (!p.on) p._snd = false;
  }
  for (const d of S.doors) {
    const open = S.plates.some((p) => p.on) || d.forceOpen;
    d.open = !!open;
    d.anim = clamp(d.anim + (d.open ? 0.06 : -0.06), 0, 1);
    const from = d.closedY, to = d.openY;
    d.y = from + (to - from) * (1 - Math.pow(1 - d.anim, 2));
  }
  if (S.shake > 0) S.shake *= 0.85;

  // --- فحص الفوز ---
  if (!S.done && S.crates.length && S.crates.every((c) => c.locked)) finishLevel();
}

function releaseCrate() {
  const c = S.holding;
  S.holding = null;
  audio.hum(false);
  if (!c) return;
  const z = S.lv.bedZone;
  const cc = center(c);
  const inside = cc.x > z.x && cc.x < z.x + z.w && cc.y > z.y && cc.y < z.y + z.h;
  if (inside) {
    const used = new Set(S.crates.filter((k) => k.locked).map((k) => k.slot));
    let best = -1, bd = 1e9;
    for (let i = 0; i < TRUCK.cols * TRUCK.rows; i++) {
      if (used.has(i)) continue;
      const sp = slotPos(S.lv.truck, i);
      const d = Math.hypot(sp.x - cc.x, sp.y - cc.y);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0) {
      const sp = slotPos(S.lv.truck, best);
      c.locked = true; c.slot = best;
      c.x = sp.x - CRATE / 2; c.y = sp.y - CRATE / 2;
      c.vx = c.vy = 0;
      S.loaded++;
      updateGoal();
      audio.star();
      return;
    }
  }
  c.vy = 1;
  audio.drop();
}

function finishLevel() {
  S.done = true;
  audio.hum(false);
  const stars = starPreview();
  const score = stars * 100 + Math.floor(S.timeLeft) * 2;
  S.stars = stars; S.score = score;
  const prev = save.levels[S.n] || { stars: 0, score: 0 };
  if (stars > prev.stars || score > prev.score) {
    save.levels[S.n] = { stars: Math.max(stars, prev.stars || 0), score: Math.max(score, prev.score || 0) };
  }
  save.total = Object.values(save.levels).reduce((a, b) => a + (b.score || 0), 0);
  writeSave();
  audio.win();

  const dt = $('doneTime'), ds = $('doneScore'), dT = $('doneTotal');
  if (dt) dt.textContent = fmtTime(S.limit - S.timeLeft);
  if (ds) ds.textContent = score;
  if (dT) dT.textContent = save.total;
  const box = $('doneStars');
  if (box) for (let i = 0; i < box.children.length; i++) box.children[i].classList.toggle('on', i < stars);
  const ttl = $('doneTitle');
  if (ttl) ttl.textContent = 'أحسنت! تم تحميل الشاحنة بالكامل';
  const next = $('btnNext');
  if (next) next.style.display = S.n >= LEVELS.length ? 'none' : '';
  setTimeout(() => show('scrComplete'), 650);
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ---------- الرسم ---------- */
function render() {
  if (!ctx || !S.lv) return;
  ctx.save();
  if (S.shake > 0.2) ctx.translate((Math.random() - .5) * S.shake, (Math.random() - .5) * S.shake);

  A.drawBackground(ctx, S.t);
  for (const f of S.lv.floors) A.drawFloor(ctx, f);
  A.drawLamp(ctx, S.t);
  for (const e of S.elevators) A.drawElevator(ctx, e);
  for (const d of S.doors) A.drawGate(ctx, d);
  for (const p of S.plates) A.drawPlate(ctx, p, !!p.on, S.t);

  A.drawTruck(ctx, S.lv.truck, S.loaded);
  for (const c of S.crates) if (c.locked) A.drawCrate(ctx, c.x, c.y, CRATE, false);

  A.drawLoader(ctx, S.loader, !!S.holding);
  for (const c of S.crates) if (!c.locked && c !== S.holding) A.drawCrate(ctx, c.x, c.y, CRATE, false);
  if (S.holding) A.drawCrate(ctx, S.holding.x, S.holding.y, CRATE, true);

  A.drawWalls(ctx);
  A.drawVignette(ctx);
  ctx.restore();
}

/* ---------- الحلقة الزمنية ---------- */
function loop(now) {
  raf = requestAnimationFrame(loop);
  if (!S.lastTime) S.lastTime = now;
  let delta = (now - S.lastTime) / 1000;
  S.lastTime = now;
  if (delta > 0.25) delta = 0.25;
  S.acc += delta;
  let guard = 0;
  while (S.acc >= STEP && guard < 8) { step(STEP); S.acc -= STEP; guard++; }
  if (S.screen === 'loading') tickLoad(delta);
  render();
}

/* ---------- شاشة التحميل ---------- */
let loadVal = 0;
function tickLoad(dt) {
  loadVal = Math.min(100, loadVal + dt * 95);
  const p = $('loadPct'), f = $('loadFill');
  if (p) p.textContent = Math.round(loadVal) + '%';
  if (f) f.style.width = loadVal + '%';
  if (loadVal >= 100) setTimeout(() => show('scrTitle'), 350);
}

/* ---------- قائمة المستويات ---------- */
function buildGrid() {
  const g = $('levelGrid'); if (!g) return;
  g.innerHTML = '';
  for (let i = 1; i <= LEVELS.length; i++) {
    const rec = save.levels[i] || { stars: 0 };
    const unlocked = i === 1 || save.levels[i - 1] || rec.stars > 0;
    const b = document.createElement('div');
    b.className = 'lv' + (rec.stars > 0 ? ' done' : '') + (unlocked ? '' : ' locked') + (i === S.n ? ' cur' : '');
    b.innerHTML = `<span>${String(i).padStart(2, '0')}</span><div class="ro">${
      [0, 1, 2].map((k) => `<i class="${k < (rec.stars || 0) ? 'on' : ''}"></i>`).join('')
    }</div>${unlocked ? '' : '<div class="lock">🔒</div>'}`;
    b.onclick = () => { if (!unlocked) { audio.fail(); return; } audio.click(); initLevel(i); };
    g.appendChild(b);
  }
  const ts = $('totalScore');
  if (ts) ts.textContent = String(save.total || 0).padStart(4, '0');
}

function nextLevel() {
  if (S.n >= LEVELS.length) { show('scrFinal'); const fs = $('finalScore'); if (fs) fs.textContent = save.total; return; }
  initLevel(S.n + 1);
}

/* ---------- الأزرار ---------- */
function bindHold(el, key) {
  if (!el) return;
  const on = (e) => { e.preventDefault(); keys[key] = true; audio.resume(); };
  const off = (e) => { e.preventDefault(); keys[key] = false; };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointerleave', off);
  el.addEventListener('pointercancel', off);
}
function on(el, fn) { if (el) el.addEventListener('click', (e) => { audio.resume(); fn(e); }); }

function wire() {
  bindHold($('btnLeft'), 'left');
  bindHold($('btnRight'), 'right');
  bindHold($('btnArmUp'), 'up');
  bindHold($('btnArmDown'), 'down');

  const mag = $('btnMagnet');
  if (mag) {
    mag.addEventListener('pointerdown', (e) => {
      e.preventDefault(); audio.resume();
      if (S.paused || S.done) return;
      S.loader.magnet = !S.loader.magnet;
      mag.classList.toggle('on', S.loader.magnet);
      audio.click();
    });
  }
  on($('btnRestart'), () => { initLevel(S.n); });
  on($('btnRestart2'), () => { initLevel(S.n); });
  on($('btnGrid'), () => { buildGrid(); show('scrLevels'); });
  on($('btnMusic'), (e) => {
    audio.resume(); audio.setMusic(!audio.musicOn);
    e.currentTarget.classList.toggle('on', audio.musicOn);
    e.currentTarget.classList.toggle('off', !audio.musicOn);
  });
  on($('btnSound'), (e) => {
    audio.resume(); audio.setSound(!audio.soundOn);
    e.currentTarget.classList.toggle('on', audio.soundOn);
    e.currentTarget.classList.toggle('off', !audio.soundOn);
  });
  on($('btnPause'), () => { S.paused = true; show('scrPause'); });
  on($('btnResume'), () => { S.paused = false; show('scrNone'); });
  on($('btnSkip'), () => {
    if (S.done) return;
    if (!save.levels[S.n]) save.levels[S.n] = { stars: 0, score: 0 };
    writeSave();
    audio.click();
    nextLevel();
  });
  on($('btnPlay'), () => { let n = 1; for (let i = 1; i <= LEVELS.length; i++) if (save.levels[i]) n = Math.min(LEVELS.length, i + 1); initLevel(n); });
  on($('btnChoose'), () => { buildGrid(); show('scrLevels'); });
  on($('btnHow'), () => show('scrHow'));
  on($('btnHowBack'), () => show('scrTitle'));
  on($('btnBackTitle'), () => show('scrTitle'));
  on($('btnMenu2'), () => show('scrTitle'));
  on($('btnMenu3'), () => show('scrTitle'));
  on($('btnRetry'), () => initLevel(S.n));
  on($('btnNext'), () => nextLevel());
  on($('btnFinalMenu'), () => show('scrTitle'));
  on($('btnFinalLevels'), () => { buildGrid(); show('scrLevels'); });
  on($('btnReset'), () => {
    if (globalThis.confirm && !globalThis.confirm('تصفير كل التقدّم؟')) return;
    save.total = 0; save.levels = {}; writeSave(); buildGrid(); audio.click();
  });

  // الكيبورد
  const map = {
    ArrowLeft: 'left', ArrowRight: 'right', a: 'left', d: 'right',
    ArrowUp: 'up', ArrowDown: 'down', w: 'elevUp', s: 'elevDown',
    q: 'up', e: 'down'
  };
  globalThis.addEventListener('keydown', (ev) => {
    audio.resume();
    const k = map[ev.key] || ev.key.toLowerCase();
    if (k && typeof k === 'string') keys[k] = true;
    if (ev.key === ' ') {
      ev.preventDefault();
      if (!S.paused && !S.done && S.loader) {
        S.loader.magnet = !S.loader.magnet;
        const m = $('btnMagnet'); if (m) m.classList.toggle('on', S.loader.magnet);
      }
    }
    if (ev.key === 'r' || ev.key === 'R') initLevel(S.n);
    if (ev.key === 'Escape') {
      if (S.screen === 'scrNone') { S.paused = true; show('scrPause'); }
      else if (S.screen === 'scrPause') { S.paused = false; show('scrNone'); }
    }
  });
  globalThis.addEventListener('keyup', (ev) => {
    const k = map[ev.key] || ev.key.toLowerCase();
    if (k && typeof k === 'string') keys[k] = false;
  });

  // تشغيل الموسيقى عند أول تفاعل (سياسة المتصفحات تمنع التشغيل التلقائي)
  const kick = () => { audio.resume(); if (audio.musicOn) audio.startMusic(); globalThis.removeEventListener("pointerdown", kick); globalThis.removeEventListener("keydown", kick); };
  globalThis.addEventListener("pointerdown", kick);
  globalThis.addEventListener("keydown", kick);

  // إيقاف الحلقة عند تبديل التبويب
  globalThis.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
}

/* ---------- الإقلاع ---------- */
export function boot() {
  canvas = document.getElementById('game');
  ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  wire();
  initLevel(1);
  show('scrLoading');
  audio.init();
  if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
}

export const __test = { S, step, render, initLevel, buildGrid, boot, tickLoad, releaseCrate, solids, keys, save };

if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.getElementById) {
  boot();
}
