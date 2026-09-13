/* ===== محرّك صوت بسيط بدون ملفات خارجية (WebAudio) ===== */
export class AudioKit {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.soundOn = true;
    this._musicTimer = null;
    this._musicStep = 0;
    this._hum = null;
  }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { this.ctx = null; }
  }
  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  _tone(freq, dur, type = 'square', vol = 0.14, when = 0, slideTo = null) {
    if (!this.ctx || !this.soundOn) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }
  _noise(dur, vol = 0.2, freq = 900, q = 1) {
    if (!this.ctx || !this.soundOn) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(bp).connect(g).connect(this.ctx.destination);
    src.start(t0);
  }

  // ==== مؤثرات ====
  grab()   { this._tone(620, 0.10, 'square', 0.10); this._noise(0.07, 0.10, 2400, 2); }
  drop()   { this._noise(0.09, 0.16, 700, 1.2); }
  clank()  { this._tone(180, 0.10, 'triangle', 0.16, 0, 90); this._noise(0.10, 0.12, 500, 1); }
  locked() { this._tone(440, 0.08, 'square', 0.11); this._tone(660, 0.12, 'square', 0.10, 0.07); }
  star()   { [660, 880, 1180].forEach((f, i) => this._tone(f, 0.20, 'triangle', 0.12, i * 0.10)); }
  win()    { [523, 659, 784, 1046, 1318].forEach((f, i) => this._tone(f, 0.28, 'square', 0.11, i * 0.12)); }
  fail()   { this._tone(240, 0.35, 'sawtooth', 0.12, 0, 110); }
  click()  { this._tone(520, 0.05, 'square', 0.08); }
  bump()   { this._tone(150, 0.07, 'square', 0.07); }
  engine() { this._tone(90 + Math.random() * 30, 0.05, 'sawtooth', 0.035); }

  setMusic(on) {
    this.musicOn = on;
    if (!on) this.stopMusic(); else this.startMusic();
  }
  setSound(on) { this.soundOn = on; }

  startMusic() {
    if (!this.ctx || !this.musicOn || this._musicTimer) return;
    const bass = [110, 110, 146.8, 164.8, 110, 110, 98, 130.8];
    const lead = [440, 523, 659, 523, 587, 523, 440, 392];
    this._musicTimer = setInterval(() => {
      if (!this.musicOn || !this.ctx) return;
      const s = this._musicStep % 8;
      this._tone(bass[s], 0.34, 'triangle', 0.045);
      if (s % 2 === 0) this._tone(lead[s] / 2, 0.22, 'square', 0.022);
      if (s === 4) this._noise(0.06, 0.05, 3000, 2);
      this._musicStep++;
    }, 300);
  }
  stopMusic() { if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; } }

  // طنين المغناطيس أثناء الحمل
  hum(on) {
    if (!this.ctx) return;
    if (on && !this._hum && this.soundOn) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 74;
      g.gain.value = 0.03;
      o.connect(g).connect(this.ctx.destination); o.start();
      this._hum = { o, g };
    } else if (!on && this._hum) {
      try { this._hum.o.stop(); } catch (e) {}
      this._hum = null;
    }
  }
}
