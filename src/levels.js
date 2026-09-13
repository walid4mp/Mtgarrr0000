export const W = 960, H = 540;
export const CRATE = 58;
export const WALL_L = 84, WALL_R = 876;
export const GROUND_Y = 470;
export const FLOOR_H = 34;

export const TRUCK = {
  w: 322, h: 200,
  bedLift: 80,
  cols: 3, rows: 2,
  slotW: 68, slotH: 58
};

const F = (x, y, w, h, kind = 'brick') => ({ x, y, w, h, kind });
const GROUND = () => F(40, GROUND_Y, 880, 70, 'brick');

export function truckParts(t) {
  const bedY = t.y - TRUCK.bedLift;
  const floors = [
    F(t.x + 6, bedY, 206, 12, 'metal'),
    F(t.x + 212, bedY - 130, 12, 130, 'metal')
  ];
  const lip = F(t.x + 2, bedY - 16, 8, 16, 'metal');
  const zone = { x: t.x - 6, y: bedY - 132, w: 214, h: 140 };
  return { floors, lip, zone, bedY };
}

export function slotPos(t, i) {
  const col = i % TRUCK.cols, row = Math.floor(i / TRUCK.cols);
  return { x: t.x + 8 + col * TRUCK.slotW + 34, y: t.y - TRUCK.bedLift - row * TRUCK.slotH - 29 };
}

function flat(cfg) {
  const floors = [GROUND()];
  const truck = { x: cfg.truckX || 546, y: GROUND_Y };
  const crates = [];
  const n = cfg.crates;
  for (let i = 0; i < n; i++) crates.push({ x: 176 + i * (n > 3 ? 70 : 84), y: GROUND_Y - CRATE });
  return { floors, truck, crates, elevator: null, elevators: [], plates: [], doors: [], spawn: { x: 120, y: GROUND_Y } };
}

function lift(cfg) {
  const upY = 300;
  const floors = [GROUND(), F(340, upY, 560, FLOOR_H, 'brick')];
  const truck = { x: cfg.truckX || 546, y: upY };
  const elevator = { x: 210, y: GROUND_Y, w: 128, h: 14, top: upY, bottom: GROUND_Y };
  const crates = [];
  const groundCount = cfg.ground == null ? cfg.crates : cfg.ground;
  for (let i = 0; i < groundCount; i++) crates.push({ x: 392 + i * 76, y: GROUND_Y - CRATE });
  if (cfg.up) crates.push({ x: 470, y: upY - CRATE });
  return { floors, truck, crates, elevator, elevators: [elevator], plates: [], doors: [], spawn: { x: 120, y: GROUND_Y }, hintKey: 'magnet' };
}

function tower(cfg) {
  const midY = 386, topY = 292;
  const floors = [GROUND(), F(300, midY, 420, FLOOR_H, 'brick'), F(470, topY, 430, FLOOR_H, 'brick')];
  const truck = { x: cfg.truckX || 552, y: topY };
  const elevators = [
    { x: 150, y: GROUND_Y, w: 124, h: 14, top: midY, bottom: GROUND_Y },
    { x: 356, y: midY, w: 124, h: 14, top: topY, bottom: midY }
  ];
  const crates = cfg.upwards
    ? [{ x: 560, y: GROUND_Y - CRATE }, { x: 634, y: GROUND_Y - CRATE }, { x: 590, y: midY - CRATE }, { x: 656, y: midY - CRATE }]
    : [{ x: 524, y: midY - CRATE }, { x: 590, y: midY - CRATE }, { x: 656, y: midY - CRATE }];
  if (cfg.extra) crates.push({ x: 490, y: midY - CRATE });
  return { floors, truck, crates, elevators, elevator: elevators[0], plates: [], doors: [], spawn: { x: 120, y: GROUND_Y } };
}

function gate(cfg) {
  const upY = 300;
  const floors = [GROUND(), F(340, upY, 560, FLOOR_H, 'brick')];
  const truck = { x: cfg.truckX || 560, y: upY };
  const doors = [{ x: 452, y: upY - 116, w: 20, h: 116, kind: 'gate', closedY: upY - 116, openY: upY + 10 }];
  const plates = [{ x: 254, y: GROUND_Y - 14, w: 92, h: 14, color: 'blue', latch: true }];
  const crates = [];
  for (let i = 0; i < cfg.crates; i++) crates.push({ x: 386 + i * 74, y: GROUND_Y - CRATE });  return {
    floors, truck, crates,
    elevator: { x: 196, y: GROUND_Y, w: 124, h: 14, top: upY, bottom: GROUND_Y },
    elevators: [{ x: 196, y: GROUND_Y, w: 124, h: 14, top: upY, bottom: GROUND_Y }],
    plates, doors, spawn: { x: 126, y: GROUND_Y }, hintKey: 'plate'
  };
}

const ARCH = { flat, lift, tower, gate };

const NAMES = [
  ['التدريب', 'Training Yard'], ['المزدوج', 'Doublet'], ['الرافعة الأولى', 'First Lift'], ['المصعد', 'The Elevator'],
  ['الحمولة', 'Payload'], ['البرج', 'The Tower'], ['المفتاح', 'The Key'], ['مصعدان', 'Two Lifts'],
  ['الجسر', 'The Bridge'], ['بوابة المصنع', 'Factory Gate'], ['عنبر الشحن', 'Cargo Bay'], ['السماء', 'Skyline'],
  ['العقدة', 'The Knot'], ['الشحن السريع', 'Rush Load'], ['السقالة', 'Scaffold'], ['الطابق الأوسط', 'Mezzanine'],
  ['الحظيرة', 'The Hangar'], ['المخطّط', 'Blueprint'], ['المعبر', 'Overpass'], ['المستودع', 'Warehouse'],
  ['المصعدان معاً', 'Twin Lifts'], ['المسبك', 'Foundry'], ['الميناء', 'Harbor'], ['الحمولة الأخيرة', 'Final Load']
];

const HINTS = {
  magnet: 'حاول أخذ هذه الصناديق بالمغناطيس',
  plate: 'قف على لوح الضغط لفتح البوابة',
  lift: 'استخدم المصعد للصعود إلى الشاحنة'
};

const RECIPES = [
  { a: 'flat', crates: 2, par: 26 },
  { a: 'flat', crates: 2, par: 28, hint: 'magnet' },
  { a: 'lift', crates: 2, par: 40, hint: 'lift' },
  { a: 'lift', crates: 3, par: 46, hint: 'lift' },
  { a: 'flat', crates: 3, par: 36 },
  { a: 'tower', crates: 3, par: 54, hint: 'lift' },
  { a: 'gate', crates: 2, par: 48, hint: 'plate' },
  { a: 'lift', crates: 3, par: 48, up: true },
  { a: 'tower', crates: 4, par: 68, upwards: true },
  { a: 'gate', crates: 3, par: 58 },
  { a: 'lift', crates: 4, par: 60 },
  { a: 'tower', crates: 3, par: 60 },
  { a: 'gate', crates: 2, par: 52 },
  { a: 'lift', crates: 4, par: 62, up: true },
  { a: 'tower', crates: 4, par: 72, extra: true },
  { a: 'gate', crates: 3, par: 62 },
  { a: 'lift', crates: 4, par: 64 },
  { a: 'tower', crates: 4, par: 74, upwards: true },
  { a: 'gate', crates: 3, par: 64 },
  { a: 'lift', crates: 4, par: 66, up: true },
  { a: 'tower', crates: 4, par: 76 },
  { a: 'gate', crates: 3, par: 66 },
  { a: 'lift', crates: 4, par: 68 },
  { a: 'tower', crates: 4, par: 80, upwards: true, extra: true }
];

export const LEVELS = RECIPES.map((r, i) => {
  const built = ARCH[r.a](r);
  const nm = NAMES[i];
  const lv = {
    n: i + 1,
    name: { ar: nm[0], en: nm[1] },
    arch: r.a,
    hint: r.hint ? HINTS[r.hint] : (built.hintKey ? HINTS[built.hintKey] : null),
    floors: built.floors,
    crates: built.crates,
    truck: built.truck,
    elevator: built.elevator,
    elevators: built.elevators || [],
    plates: built.plates || [],
    doors: built.doors || [],
    spawn: built.spawn,
    par: r.par,
    goal: built.crates.length
  };
  const parts = truckParts(lv.truck);
  lv.floors = lv.floors.concat(parts.floors, [parts.lip]);
  lv.bedZone = parts.zone;
  return lv;
});

export function validateLevels(list = LEVELS) {
  const errs = [];
  if (list.length !== 24) errs.push(`عدد المستويات ${list.length} بدل 24`);
  for (const lv of list) {
    if (!lv.floors.length) errs.push(`مستوى ${lv.n}: لا أرضيات`);
    if (!lv.crates.length) errs.push(`مستوى ${lv.n}: لا صناديق`);
    if (lv.crates.length > TRUCK.cols * TRUCK.rows) errs.push(`مستوى ${lv.n}: عدد الصناديق أكبر من سعة الشاحنة`);
    const tRight = lv.truck.x + TRUCK.w;
    if (tRight > WALL_R + 6 || lv.truck.x < WALL_L) errs.push(`مستوى ${lv.n}: الشاحنة خارج الملعب`);
    for (const c of lv.crates) {
      const ok = lv.floors.some((f) => c.x >= f.x - 2 && c.x + CRATE <= f.x + f.w + 2 && Math.abs((c.y + CRATE) - f.y) <= 3);
      if (!ok) errs.push(`مستوى ${lv.n}: صندوق عند x=${c.x} غير مستقر على أرضية`);
      if (c.x < WALL_L || c.x + CRATE > WALL_R) errs.push(`مستوى ${lv.n}: صندوق خارج الملعب`);
    }
    const groundCrates = lv.crates.filter((c) => c.y + CRATE > 400).length;
    if (groundCrates > 0 && lv.truck.y < 400 && !lv.elevators.length) errs.push(`مستوى ${lv.n}: يحتاج مصعداً`);
  }
  return errs;
}
