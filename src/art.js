/* ============================================================
   Truck Loader — طبقة الرسم (Canvas 2D)
   كل الدوال ترسم بإحداثيات الملعب المنطقية 960×540
   ============================================================ */

export const LOADER = {
  w: 96, h: 60,
  wheelR: 19,
  pivot: { dx: 10, dy: 12 },   // نقطة ارتكاز الذراع (بالنسبة لأعلى جسم اللودر)
  armLen1: 70, armLen2: 56, bend: 30
};

/* ---------- أدوات عامة ---------- */
export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hazard(ctx, x, y, w, h, stripe = 20, c1 = '#f2c418', c2 = '#191919') {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = c2; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c1;
  for (let i = -h; i < w + h; i += stripe) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + stripe * 0.5, y + h);
    ctx.lineTo(x + i + h + stripe * 0.5, y); ctx.lineTo(x + i + h, y);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function rivets(ctx, x, y, w, h, step = 34) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  for (let px = x + 10; px < x + w - 4; px += step)
    for (let py = y + 10; py < y + h - 4; py += step) {
      ctx.beginPath(); ctx.arc(px, py, 2, 0, 7); ctx.fill();
    }
  ctx.restore();
}

/* ---------- الخلفية الصناعية ---------- */
export function drawBackground(ctx, t = 0) {
  ctx.fillStyle = '#0c0f08';
  ctx.fillRect(0, 0, 960, 540);

  // ألواح معدنية داكنة
  const px = 96, py = 86;
  for (let gx = 0; gx < 960; gx += px) {
    for (let gy = 0; gy < 540; gy += py) {
      const seed = ((gx * 7 + gy * 13) % 17) / 17;
      ctx.fillStyle = `hsl(${74 + seed * 12}, ${13 + seed * 6}%, ${13 + seed * 6}%)`;
      ctx.fillRect(gx, gy, px - 2, py - 2);
      ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 2;
      ctx.strokeRect(gx + .5, gy + .5, px - 2, py - 2);
      rivets(ctx, gx, gy, px, py, 40);
    }
  }
  // بقعة ضوء من المصباح
  const g = ctx.createRadialGradient(470, 30, 20, 470, 30, 320);
  g.addColorStop(0, 'rgba(255,236,150,.22)');
  g.addColorStop(1, 'rgba(255,236,150,0)');
  ctx.fillStyle = g; ctx.fillRect(200, 0, 560, 340);
}

export function drawWalls(ctx) {
  // جداران جانبيان بخطوط التحذير (كالشاشات الأصلية)
  hazard(ctx, 0, 0, 62, 540, 22);
  hazard(ctx, 898, 0, 62, 540, 22);
  ctx.fillStyle = '#4b5344';
  ctx.fillRect(62, 0, 22, 540);
  ctx.fillRect(876, 0, 22, 540);
  rivets(ctx, 62, 0, 22, 540, 40);
  rivets(ctx, 876, 0, 22, 540, 40);
}

export function drawLamp(ctx, t) {
  ctx.save();
  ctx.translate(470, 0);
  ctx.fillStyle = '#2f362b'; ctx.fillRect(-16, 0, 32, 16);
  ctx.fillStyle = '#e8d24a';
  ctx.beginPath(); ctx.moveTo(16, 16); ctx.lineTo(24, 34); ctx.lineTo(-24, 34); ctx.lineTo(-16, 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,160,.9)';
  ctx.beginPath(); ctx.arc(0, 36, 5, 0, 7); ctx.fill();
  ctx.restore();
}

/* ---------- الأرضيات ---------- */
export function drawFloor(ctx, f) {
  const { x, y, w, h } = f;
  if (f.kind === 'metal') {
    ctx.fillStyle = '#4c554a'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#68715f'; ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y + h - 3, w, 3);
    rivets(ctx, x, y, w, h, 34);
    return;
  }
  // طوب
  const bw = 46, bh = 16;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(x, y, w, h);
  let row = 0;
  for (let ry = y; ry < y + h; ry += bh, row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let rx = x - bw; rx < x + w + bw; rx += bw) {
      const bx = rx + off;
      const shade = 0.72 + ((Math.abs(bx * 31 + ry * 17) % 23) / 23) * 0.5;
      ctx.fillStyle = `rgba(${Math.round(150 * shade)},${Math.round(92 * shade)},${Math.round(44 * shade)},1)`;
      ctx.fillRect(bx + 2, ry + 2, bw - 4, bh - 4);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
  for (let ry = y; ry < y + h; ry += bh) { ctx.beginPath(); ctx.moveTo(x, ry + .5); ctx.lineTo(x + w, ry + .5); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y + h, w, 6);
}

/* ---------- الصندوق الخشبي ---------- */
export function drawCrate(ctx, x, y, s, held = false) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  rr(ctx, x + 3, y + 4, s, s, 4); ctx.fill();
  // جسم خشبي
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, '#d99a4e'); g.addColorStop(1, '#a9682c');
  ctx.fillStyle = g;
  rr(ctx, x, y, s, s, 4); ctx.fill();
  // ألواح
  ctx.strokeStyle = 'rgba(90,45,10,.65)'; ctx.lineWidth = 1.6;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(x + 4, y + (s / 4) * i); ctx.lineTo(x + s - 4, y + (s / 4) * i); ctx.stroke();
  }
  // شرائط معدنية
  ctx.fillStyle = '#b9bfae';
  ctx.fillRect(x, y + s * 0.16, 7, s * 0.68);
  ctx.fillRect(x + s - 7, y + s * 0.16, 7, s * 0.68);
  ctx.fillStyle = '#e2e6d8';
  ctx.fillRect(x + 2, y + s * 0.20, 3, 3); ctx.fillRect(x + s - 5, y + s * 0.20, 3, 3);
  ctx.fillRect(x + 2, y + s * 0.74, 3, 3); ctx.fillRect(x + s - 5, y + s * 0.74, 3, 3);
  ctx.strokeStyle = 'rgba(40,20,4,.8)'; ctx.lineWidth = 2;
  rr(ctx, x + 1, y + 1, s - 2, s - 2, 4); ctx.stroke();
  if (held) {
    ctx.strokeStyle = 'rgba(120,225,255,.85)'; ctx.lineWidth = 2.4;
    rr(ctx, x - 3, y - 3, s + 6, s + 6, 6); ctx.stroke();
  }
  ctx.restore();
}

/* ---------- ذراع اللودر ---------- */
export function armPoints(L) {
  const cx = L.x + L.w / 2;
  const P = { x: cx + LOADER.pivot.dx, y: L.y + LOADER.pivot.dy };
  const a = (L.arm || 0) * Math.PI / 180;
  const d1 = { x: Math.sin(a), y: -Math.cos(a) };
  const E = { x: P.x + d1.x * LOADER.armLen1, y: P.y + d1.y * LOADER.armLen1 };
  const a2 = a + (LOADER.bend * Math.PI / 180);
  const d2 = { x: Math.sin(a2), y: -Math.cos(a2) };
  const T = { x: E.x + d2.x * LOADER.armLen2, y: E.y + d2.y * LOADER.armLen2 };
  return { P, E, T, d2, a };
}

function wheel(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#15171a'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2c3034'; ctx.lineWidth = r * 0.42;
  ctx.beginPath(); ctx.arc(x, y, r * 0.82, 0, 7); ctx.stroke();
  ctx.fillStyle = '#e2b21c'; ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 7); ctx.fill();
  ctx.fillStyle = '#3b3f2a'; ctx.beginPath(); ctx.arc(x, y, r * 0.17, 0, 7); ctx.fill();
  for (let i = 0; i < 5; i++) {
    const an = i * Math.PI * 2 / 5;
    ctx.fillStyle = 'rgba(60,64,40,.85)';
    ctx.beginPath(); ctx.arc(x + Math.cos(an) * r * 0.3, y + Math.sin(an) * r * 0.3, r * 0.09, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/* ---------- اللودر ---------- */
export function drawLoader(ctx, L, holding) {
  const { P, E, T, d2 } = armPoints(L);
  const cx = L.x + L.w / 2, bot = L.y + L.h;

  // الذراع خلف الجسم
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3a3f34'; ctx.lineWidth = 18;
  ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(E.x, E.y); ctx.stroke();
  ctx.strokeStyle = '#e6c31d'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(E.x, E.y); ctx.stroke();
  // شرائط سوداء على الذراع
  ctx.strokeStyle = '#1a1c16'; ctx.lineWidth = 12;
  for (let k = 0.22; k < 0.95; k += 0.28) {
    const px = P.x + (E.x - P.x) * k, py = P.y + (E.y - P.y) * k;
    ctx.beginPath();
    ctx.moveTo(px - 5, py + 5); ctx.lineTo(px + 5, py - 5); ctx.stroke();
  }
  ctx.strokeStyle = '#3a3f34'; ctx.lineWidth = 15;
  ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(T.x, T.y); ctx.stroke();
  ctx.strokeStyle = '#cfd4c6'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(T.x, T.y); ctx.stroke();
  ctx.fillStyle = '#20241c'; ctx.beginPath(); ctx.arc(E.x, E.y, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#e6c31d'; ctx.beginPath(); ctx.arc(E.x, E.y, 4.5, 0, 7); ctx.fill();
  ctx.restore();

  // المغناطيس
  ctx.save();
  ctx.translate(T.x, T.y);
  ctx.rotate(Math.atan2(d2.x, d2.y) * -1 + Math.PI * 0);
  ctx.rotate(Math.atan2(-d2.x, d2.y));
  ctx.strokeStyle = '#e8862a'; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.arc(0, 0, 15, Math.PI * 0.05, Math.PI * 0.95, false); ctx.stroke();
  ctx.strokeStyle = '#cfd4c6'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 15, Math.PI * 0.62, Math.PI * 0.95, false); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 15, Math.PI * 0.05, Math.PI * 0.38, false); ctx.stroke();
  ctx.restore();

  // sparks عند الإمساك
  if (holding) sparks(ctx, T.x, T.y, performance_now(), 0);

  // الجسم
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  rr(ctx, L.x + 4, L.y + 34, L.w, 26, 8); ctx.fill();
  const g = ctx.createLinearGradient(L.x, L.y, L.x, bot);
  g.addColorStop(0, '#ffd52a'); g.addColorStop(0.55, '#f0b614'); g.addColorStop(1, '#c88a09');
  ctx.fillStyle = g;
  rr(ctx, L.x, L.y + 6, L.w, 44, 9); ctx.fill();
  ctx.strokeStyle = '#6a4a05'; ctx.lineWidth = 2;
  rr(ctx, L.x, L.y + 6, L.w, 44, 9); ctx.stroke();
  // قناع أسود (كالعلم على الجانب)
  ctx.fillStyle = '#1a1c16';
  ctx.beginPath();
  ctx.moveTo(cx - 30, L.y + 40); ctx.lineTo(cx + 2, L.y + 40);
  ctx.lineTo(cx - 6, L.y + 24); ctx.lineTo(cx - 34, L.y + 30);
  ctx.closePath(); ctx.fill();
  // خطوط تحذير على الجسم
  ctx.save(); ctx.beginPath(); rr(ctx, L.x, L.y + 6, L.w, 44, 9); ctx.clip();
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#1a1c16';
    ctx.save(); ctx.translate(cx + 18 + i * 15, L.y + 30); ctx.rotate(-0.5);
    ctx.fillRect(0, 0, 6, 22); ctx.restore();
  }
  ctx.restore();
  // كابينة
  ctx.fillStyle = '#2c3128';
  rr(ctx, L.x + 8, L.y, 34, 22, 5); ctx.fill();
  ctx.fillStyle = '#9fd8e8';
  rr(ctx, L.x + 12, L.y + 3, 26, 14, 4); ctx.fill();
  ctx.restore();

  wheel(ctx, cx - 24, bot - LOADER.wheelR, LOADER.wheelR);
  wheel(ctx, cx + 26, bot - LOADER.wheelR, LOADER.wheelR);
}

function performance_now() { return (typeof performance !== 'undefined' ? performance.now() : 0); }

export function sparks(ctx, x, y, t, seed) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120,225,255,.95)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = (t / 90 + i * 1.05 + seed) % 6.283;
    const r1 = 6, r2 = 16 + ((i * 7) % 9);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    ctx.lineTo(x + Math.cos(a + .3) * r2, y + Math.sin(a + .3) * r2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(190,245,255,.9)';
  ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  ctx.restore();
}

/* ---------- الشاحنة ---------- */
export function drawTruck(ctx, t) {
  const { x, y } = t;
  const top = y - 200, bedY = y - 80;

  // ظل
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  rr(ctx, x + 6, y - 14, 312, 16, 8); ctx.fill();

  // الهيكل
  ctx.fillStyle = '#3d443c';
  rr(ctx, x + 4, y - 86, 312, 26, 6); ctx.fill();

  // الكابينة
  const cg = ctx.createLinearGradient(x + 216, top, x + 216, y - 60);
  cg.addColorStop(0, '#ffe04a'); cg.addColorStop(1, '#d9930c');
  ctx.fillStyle = cg;
  rr(ctx, x + 216, top, 106, 130, 10); ctx.fill();
  ctx.strokeStyle = '#7a5306'; ctx.lineWidth = 2.5; rr(ctx, x + 216, top, 106, 130, 10); ctx.stroke();
  // زجاج
  ctx.fillStyle = '#bfe6f2'; rr(ctx, x + 246, top + 12, 64, 44, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; rr(ctx, x + 252, top + 16, 22, 30, 4); ctx.fill();
  // شبك أمامي
  ctx.fillStyle = '#2c3128'; rr(ctx, x + 288, top + 64, 32, 34, 5); ctx.fill();
  // مصد
  ctx.fillStyle = '#c9cfc0'; rr(ctx, x + 292, y - 74, 30, 12, 4); ctx.fill();
  // عجلة القيادة/السائق
  ctx.fillStyle = '#2c3128'; ctx.beginPath(); ctx.arc(x + 240, top + 34, 8, 0, 7); ctx.fill();

  // الحاوية
  ctx.save();
  ctx.beginPath(); rr(ctx, x + 6, top - 10, 212, 132, 8); ctx.clip();
  const bg = ctx.createLinearGradient(x + 6, top - 10, x + 218, top + 122);
  bg.addColorStop(0, '#4fc3e8'); bg.addColorStop(.5, '#63d2c0'); bg.addColorStop(1, '#6ec95c');
  ctx.fillStyle = bg;
  ctx.fillRect(x + 6, top - 10, 212, 132);
  // خطوط زجاجية
  ctx.strokeStyle = 'rgba(255,255,255,.30)'; ctx.lineWidth = 3;
  for (let i = -140; i < 240; i += 26) {
    ctx.beginPath(); ctx.moveTo(x + 6 + i, top + 122); ctx.lineTo(x + 6 + i + 90, top - 10); ctx.stroke();
  }
  ctx.restore();
  // إطار الحاوية
  ctx.strokeStyle = '#6f7a68'; ctx.lineWidth = 5; rr(ctx, x + 6, top - 10, 212, 132, 8); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 200, top - 8); ctx.lineTo(x + 200, top + 120); ctx.stroke();

  // أرضية الصندوق
  ctx.fillStyle = '#59614f'; ctx.fillRect(x + 6, bedY, 206, 12);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 6, bedY + 9, 206, 3);
  ctx.fillStyle = '#7d8674'; ctx.fillRect(x + 6, bedY, 206, 3);
  // حاجز خلفي صغير
  ctx.fillStyle = '#6f7a68'; ctx.fillRect(x + 2, bedY - 16, 8, 16);

  // عجلات
  truckWheel(ctx, x + 150, y - 26, 26);
  truckWheel(ctx, x + 232, y - 26, 26);
  truckWheel(ctx, x + 296, y - 26, 26);

  // تفاصيل جانبية
  ctx.fillStyle = '#2f352b';
  rr(ctx, x + 118, y - 60, 40, 28, 5); ctx.fill();
}

function truckWheel(ctx, x, y, r) {
  ctx.fillStyle = '#14161a'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2a2e33'; ctx.lineWidth = r * 0.45;
  ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 7); ctx.stroke();
  ctx.fillStyle = '#c8a51a'; ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#2f352b'; ctx.beginPath(); ctx.arc(x, y, r * 0.15, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(60,64,40,.9)';
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.28, y + Math.sin(a) * r * 0.28, r * 0.08, 0, 7); ctx.fill();
  }
}

/* ---------- المصعد ---------- */
export function drawElevator(ctx, e) {
  // سلاسل
  ctx.strokeStyle = 'rgba(160,168,150,.55)'; ctx.lineWidth = 3;
  ctx.setLineDash([8, 7]);
  ctx.beginPath(); ctx.moveTo(e.x + 12, e.y); ctx.lineTo(e.x + 12, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(e.x + e.w - 12, e.y); ctx.lineTo(e.x + e.w - 12, 0); ctx.stroke();
  ctx.setLineDash([]);
  // المنصّة
  ctx.fillStyle = '#5b6455';
  rr(ctx, e.x, e.y, e.w, 14, 4); ctx.fill();
  ctx.fillStyle = '#8b9481';
  rr(ctx, e.x, e.y, e.w, 5, 3); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(e.x, e.y + 11, e.w, 4);
  // تروس
  [e.x + 8, e.x + e.w - 8].forEach((gx) => {
    ctx.fillStyle = '#9aa38d'; ctx.beginPath(); ctx.arc(gx, e.y + 7, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#4c5546'; ctx.beginPath(); ctx.arc(gx, e.y + 7, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4c5546'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(gx + Math.cos(a) * 6, e.y + 7 + Math.sin(a) * 6);
      ctx.lineTo(gx + Math.cos(a) * 10, e.y + 7 + Math.sin(a) * 10);
      ctx.stroke();
    }
  });
  // أسهم
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  const cx = e.x + e.w / 2;
  ctx.beginPath(); ctx.moveTo(cx, e.y - 26); ctx.lineTo(cx - 9, e.y - 12); ctx.lineTo(cx + 9, e.y - 12); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, e.y + 26); ctx.lineTo(cx - 9, e.y + 12); ctx.lineTo(cx + 9, e.y + 12); ctx.closePath(); ctx.fill();
}

/* ---------- لوح الضغط ---------- */
export function drawPlate(ctx, p, on, t) {
  const colors = { blue: ['#39c6f0', '#0d6f9c'], orange: ['#ff9b2f', '#a34d05'], green: ['#7cc242', '#3d7a12'] };
  const [c1, c2] = colors[p.color] || colors.blue;
  ctx.save();
  ctx.fillStyle = '#2a3025';
  rr(ctx, p.x - 4, p.y - 2, p.w + 8, p.h + 8, 4); ctx.fill();
  ctx.fillStyle = on ? c1 : c2;
  const lift = on ? 5 : 0;
  rr(ctx, p.x, p.y + lift, p.w, p.h - lift + 4, 3); ctx.fill();
  if (on) {
    const g = ctx.createRadialGradient(p.x + p.w / 2, p.y, 2, p.x + p.w / 2, p.y, p.w);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(p.x - p.w / 2, p.y - p.w / 2, p.w * 2, p.w);
    // وميض
    ctx.globalAlpha = 0.4 + Math.sin(t / 180) * 0.25;
    ctx.strokeStyle = c1; ctx.lineWidth = 3;
    rr(ctx, p.x - 6, p.y - 6, p.w + 12, p.h + 12, 6); ctx.stroke();
  }
  ctx.restore();
}

/* ---------- البوابة ---------- */
export function drawGate(ctx, d) {
  hazard(ctx, d.x, d.y, d.w, d.h, 12);
  ctx.fillStyle = '#3c4338';
  ctx.fillRect(d.x - 3, d.y, d.w + 6, 8);
  ctx.fillRect(d.x - 3, d.y + d.h - 8, d.w + 6, 8);
}

/* ---------- الواجهة داخل الملعب ---------- */
export function drawHudExtras(ctx, S) {
  // لا شيء (الواجهة HTML)
}

export function drawVignette(ctx) {
  const g = ctx.createRadialGradient(480, 270, 200, 480, 270, 620);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 540);
}
