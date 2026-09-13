# TRUCK LOADER — نسخة الويب

لعبة ألغاز فيزيائية بالمتصفح: تقود **لودراً مغناطيسياً** وتنقل الصناديق الخشبية إلى **صندوق الشاحنة**،
عبر 24 مستوى تشمل **المصاعد** و**ألواح الضغط** و**البوابات**. مبنية بـ HTML5 Canvas + JavaScript خالص،
**بدون أي تبعيات خارجية**، وتعمل على الحاسوب والجوال.

---

## ✨ المزايا

| الميزة | التفاصيل |
|---|---|
| 24 مستوى | أربعة أنماط هندسية: ساحة أرضية، مصعد، برج بطابقين، بوابة بلوح ضغط |
| فيزياء بسيطة | جاذبية، تصادم، حمل/إفلات بالمغناطيس، ركوب المصعد (لودر وصناديق) |
| نظام النجوم والنقاط | 1–3 نجوم حسب السرعة + نقاط تُحفَظ في `localStorage` |
| شاشات كاملة | تحميل 0→100%، الشاشة الرئيسية، شبكة 24 مستوى، الإيقاف المؤقت، نتيجة المستوى |
| صوت | مُولَّد بالكامل عبر WebAudio (بدون أي ملفات صوتية) — موسيقى + مؤثرات + طنين المغناطيس |
| يعمل بلا خادم | GitHub Pages يكفي؛ أو خادم Node صغير على Render |
| RTL عربي | الواجهة عربية كاملة مع تلميحات المستويات |

## 🗂️ بنية المشروع

```
truck-loader/
├── index.html                      # كل الشاشات والواجهة (RTL عربي)
├── server.js                       # خادم Node صفري التبعيات (لـ Render)
├── package.json
├── render.yaml                     # Blueprint للنشر التلقائي على Render
├── src/
│   ├── style.css                   # تصميم معدني/صناعي
│   ├── game.js                     # المحرّك: الحالة، الفيزياء، الحلقة، الأزرار
│   ├── art.js                      # رسم Canvas (لودر، شاحنة، صناديق، مصعد، خلفية)
│   ├── levels.js                   # بناء الـ 24 مستوى + التحقق البنيوي
│   └── audio.js                    # محرّك الصوت (WebAudio)
├── assets/
│   ├── logo.svg                    # الشعار (لودر يحمل صندوقاً بمغناطيس)
│   └── icon.svg                    # أيقونة الموقع
├── test/smoke.js                   # اختبارات: سلامة المستويات + تشغيل المحرّك 1000+ خطوة
└── .github/workflows/
    ├── ci.yml                      # فحص الصياغة + الاختبارات + التحقق من الخادم
    ├── pages.yml                   # نشر تلقائي على GitHub Pages
    └── render-deploy.yml           # طلب إعادة نشر Render عبر Deploy Hook
```

## 🎮 طريقة اللعب

| الإجراء | الجوال | الكيبورد |
|---|---|---|
| التحرك يميناً/يساراً | ◀ ▶ | `←` `→` أو `A` `D` |
| تدوير الذراع | ▲ ▼ | `↑` `↓` أو `Q` `E` |
| تشغيل/إطفاء المغناطيس | ◉ | `مسافة` |
| تحريك المصعد (أثناء الوقوف عليه) | أزرار المصعد | `W` `S` |
| إعادة المستوى | ⟳ | `R` |
| إيقاف مؤقت | ❚❚ | `Esc` |

**الهدف:** انقل كل الصناديق الخشبية إلى صندوق الشاحنة. قرّب المغناطيس من الصندوق ثم شغّله،
ارفع الذراع، اذهب إلى أعلى الشاحنة، ثم أطفئ المغناطيس ليستقر الصندوق في مكانه.
استخدم المصعد للصعود، ولوح الضغط لفتح البوابات المغلقة.

## 🚀 التشغيل محلياً

```bash
git clone <رابط-مستودعك>
cd truck-loader
npm start          # ثم افتح http://localhost:3000
```

بديل بدون Node (لأن اللعبة ثابتة بالكامل):

```bash
python3 -m http.server 8080
# افتح http://localhost:8080
```

الاختبارات:

```bash
npm test           # يفحص المستويات ويشغّل المحرّك في DOM وهمي
```

## 📤 الرفع إلى GitHub

```bash
cd truck-loader
git init
git add .
git commit -m "Truck Loader: لعبة ألغاز فيزيائية بالمغناطيس (24 مستوى)"
git branch -M main
git remote add origin https://github.com/<اسم-حسابك>/truck-loader.git
git push -u origin main
```
> أنشئ المستودع أولاً من github.com/new باسم `truck-loader` (بدون README حتى لا يحدث تعارض).

## 🌐 النشر على GitHub Pages

1. ارفع الكود إلى GitHub (الخطوات أعلاه).
2. من المستودع: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. يعمل `pages.yml` تلقائياً عند كل دفع إلى `main`، ورابط اللعبة يكون:
   `https://<اسم-حسابك>.github.io/truck-loader/`
4. يمكن أيضاً تشغيله يدوياً من تبويب **Actions → نشر على GitHub Pages → Run workflow**.

## 🟣 النشر على Render

### الطريقة أ (Blueprint — الأسهل)
1. اذهب إلى [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**.
2. اختر مستودع GitHub. سيكتشف Render ملف `render.yaml` ويُنشئ الخدمة تلقائياً.
3. اضغط **Apply**؛ سيصبح الرابط متاحاً على شكل `https://truck-loader.onrender.com`.

### الطريقة ب (يدوياً)
1. **New → Web Service** → اختر المستودع.
2. الإعدادات:
   - **Runtime:** Node
   - **Build Command:** `npm install --no-audit --no-fund`
   - **Start Command:** `node server.js`
   - **Health Check Path:** `/healthz`
   - **Plan:** Free
3. **Create Web Service**.

### الطريقة ج (من GitHub Actions)
1. من صفحة الخدمة في Render: **Settings → Deploy Hook** → انسخ الرابط.
2. في GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   باسم `RENDER_DEPLOY_HOOK` والصق الرابط.
3. بعد ذلك، كل دفع إلى `main` يشغّل الاختبارات ثم يطلب من Render إعادة النشر
   عبر `render-deploy.yml`.

> ملاحظة: الخطة المجانية في Render تُنيم الخدمة بعد ~15 دقيقة خمول، فأول طلب بعدها
> يستغرق ~30 ثانية للاستيقاظ. لنشر ثابت بلا إيقاظ استخدم GitHub Pages.

## 🧩 كيف تضيف مستوى؟

افتح `src/levels.js` وأضف عنصراً إلى `RECIPES` (النمط: `flat` / `lift` / `tower` / `gate`)
ثم أضف اسماً في `NAMES`. ملف `validateLevels` يتحقق تلقائياً من:
استقرار كل صندوق على أرضية، بقاء الشاحنة داخل الملعب، ووجود مصعد عند الحاجة.

## 📄 الرخصة

MIT — راجع ملف `LICENSE`.
