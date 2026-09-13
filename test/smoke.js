/* اختبار دخاني: يتحقق من سلامة المستويات + تشغيل محرّك اللعبة في DOM مزيّف */
import { LEVELS, validateLevels, slotPos, TRUCK } from '../src/levels.js';

let failed = 0;
const ok = (cond, msg) => { console.log((cond ? '✔ ' : '✘ ') + msg); if (!cond) failed++; };

/* ---------- 1) سلامة المستويات ---------- */
const errs = validateLevels();
ok(LEVELS.length === 24, `عدد المستويات = 24 (فعلي: ${LEVELS.length})`);
ok(errs.length === 0, errs.length ? 'أخطاء بنيوية: ' + errs.join(' | ') : 'كل المستويات سليمة بنيوياً (صناديق مستقرة، شاحنة داخل الملعب)');
ok(LEVELS.every((l) => l.crates.length >= 2 && l.crates.length <= 6), 'كل مستوى بين صندوقين و6 صناديق (سعة الشاحنة)');
ok(LEVELS.every((l) => l.bedZone && l.bedZone.w > 0), 'منطقة التحميل موجودة في كل مستوى');

/* ---------- 2) DOM مزيّف ---------- */
function fakeCtx() {
  const store = {};
  const target = {
    canvas: null,
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, arc() {}, arcTo() {}, rect() {}, clip() {}, fill() {}, stroke() {}, fillRect() {},
    strokeRect() {}, clearRect() {}, setLineDash() {}, measureText() { return { width: 10 }; },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1, font: '', textAlign: '', textBaseline: '',
    fillText() {}, strokeText() {}, quadraticCurveTo() {}, bezierCurveTo() {}
  };
  return new Proxy(target, {
    get(t, p) { return p in t ? t[p] : (typeof p === 'string' ? (store[p] !== undefined ? store[p] : function () {}) : undefined); },
    set(t, p, v) { t[p] = v; return true; }
  });
}

function fakeEl(id) {
  const el = {
    id, children: [], style: {}, className: '', innerHTML: '', textContent: '', onclick: null,
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c, v) { v ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {}, removeEventListener() {}, querySelectorAll() { return []; },
    getContext() { return fakeCtx(); },
    width: 960, height: 540, setAttribute() {}, focus() {}
  };
  return el;
}

const els = new Map();
const screens = ['scrLoading', 'scrTitle', 'scrLevels', 'scrComplete', 'scrPause', 'scrHow', 'scrFinal', 'scrNone', 'hud'];
const documentStub = {
  getElementById(id) { if (!els.has(id)) els.set(id, fakeEl(id)); return els.get(id); },
  querySelectorAll(sel) {
    if (sel === '.screen') { for (const s of screens) this.getElementById(s); return screens.map((s) => els.get(s)); }
    return [];
  },
  createElement(tag) { return fakeEl(tag + '#' + Math.random().toString(36).slice(2, 6)); },
  addEventListener() {}
};

globalThis.document = documentStub;
globalThis.window = globalThis;
globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.addEventListener = () => {};
const mem = {};
globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };

/* ---------- 3) تشغيل المحرّك ---------- */
const mod = await import('../src/game.js');
const T = mod.__test;
ok(!!T && !!T.S, 'تم تحميل وحدة المحرّك بنجاح');
ok(T.S.lv && T.S.crates.length > 0, `بدأ المستوى الأول بصناديق (${T.S.crates.length})`);

// محاكاة 240 خطوة فيزيائية (4 ثوانٍ) على عدة مستويات
let crashed = null;
try {
  for (const n of [1, 4, 7]) {
    T.initLevel(n);
    for (let i = 0; i < 240; i++) T.step(1 / 60);
  }
  // قيادة + مغناطيس + ذراع
  T.initLevel(5);
  T.keys.right = true; T.keys.up = true;
  for (let i = 0; i < 120; i++) T.step(1 / 60);
  T.S.loader.magnet = true;
  for (let i = 0; i < 300; i++) T.step(1 / 60);
  T.keys.up = false; T.keys.down = true;
  for (let i = 0; i < 120; i++) T.step(1 / 60);
  T.S.loader.magnet = false;
  for (let i = 0; i < 120; i++) T.step(1 / 60);
} catch (e) { crashed = e; }
ok(!crashed, crashed ? 'تعطّل المحرّك: ' + crashed.message : 'المحرّك يعمل 1000+ خطوة بدون أخطاء (قيادة/ذراع/مغناطيس/تحميل)');

// التحقق من آلية المغناطيس: قيادة نحو الصندوق ثم التقاطه ثم إفلاته داخل الشاحنة
T.initLevel(1);
T.S.loader.arm = 100;
T.S.loader.magnet = true;
T.keys.right = true;
for (let i = 0; i < 200 && !T.S.holding; i++) T.step(1 / 60);
T.keys.right = false;
ok(!!T.S.holding, 'المغناطيس يلتقط صندوقاً عند الاقتراب منه');

// القيادة يميناً إلى موضع الإفلات فوق صندوق الشاحنة ثم خفض الذراع وإطفاء المغناطيس
let guard = 0;
while (T.S.loader.x < 596 && guard++ < 400) { T.keys.right = true; T.step(1 / 60); }
T.keys.right = false;
T.S.loader.arm = -20;
for (let i = 0; i < 20; i++) T.step(1 / 60);
T.S.loader.magnet = false;
for (let i = 0; i < 30; i++) T.step(1 / 60);
ok(T.S.loaded >= 1, `يستقر الصندوق داخل صندوق الشاحنة ويتحتسب (محمل=${T.S.loaded})`);

// التحقق من إمكانية التحقق من الفوز: تحميل صناديق المستوى الأول قسرياً
T.initLevel(1);
const lv = T.S.lv;
T.S.crates.forEach((c, i) => { const sp = slotPos(lv.truck, i); c.locked = true; c.slot = i; c.x = sp.x - 29; c.y = sp.y - 29; });
T.step(1 / 60);
ok(T.S.done, 'يتم إعلان انتهاء المستوى عند تحميل كل الصناديق');
ok(T.S.stars >= 1 && T.S.score > 0, `يُحتسب النقاط والنجوم (نجوم=${T.S.stars}, نقاط=${T.S.score})`);
ok(T.save.total > 0, 'يُحفظ المجموع في الذاكرة المحلية');

const evDraw = () => T.render();

/* ---------- 4) تشغيل طبقة الرسم فعلياً ---------- */
let drawErr = null;
try {
  for (const n of [1, 6, 9, 24]) {
    T.initLevel(n);
    evDraw();
    T.S.loader.magnet = true;
    for (let i = 0; i < 90; i++) { T.step(1 / 60); evDraw(); }
    T.S.loader.magnet = false;
    for (let i = 0; i < 60; i++) { T.step(1 / 60); evDraw(); }
  }
} catch (e) { drawErr = e; }
ok(!drawErr, drawErr ? 'خطأ في الرسم: ' + drawErr.stack.split('\n').slice(0, 2).join(' | ') : 'طبقة الرسم تعمل على كل أنماط المستويات (بما فيها الإمساك بالمغناطيس)');

/* ---------- النتيجة ---------- */
console.log(failed === 0 ? '\nكل الاختبارات نجحت ✅' : `\nفشل ${failed} اختبار ❌`);
process.exit(failed === 0 ? 0 : 1);
