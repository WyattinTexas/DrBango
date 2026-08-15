'use strict';
/* ============================================================
   STARSPELL audio — synth SFX + a generative ambient pad.
   Zero asset files. Everything hangs off one master gain so the
   mute toggle silences the whole night sky at once.
   ============================================================ */

class SynthAudio {
  constructor() { this.ok = false; this.muted = localStorage.getItem('beta3.mute') === '1'; }
  ensure() {
    if (this.ok) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      this.ok = true;
      this.pad = new AmbientPad(this);
      this.pad.start();
      if (this.meadowOn) this._cricketBoot();
      if (this.dawnOn) this._birdBoot();
    } catch (e) { /* garnish only */ }
  }
  setMuted(m) { this.muted = m; localStorage.setItem('beta3.mute', m ? '1' : '0'); if (this.ok) this.master.gain.value = m ? 0 : 0.5; }
  tone(freq, dur, type, gain, when, glideTo, dest) {
    if (!this.ok) return;
    const t = (when || 0) + this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || this.master); o.start(t); o.stop(t + dur + 0.03);
  }
  // noise sweep with a swelling envelope (the ascent riser / descent wind)
  sweep(f0, f1, dur, gain, lowwind, when) {
    if (!this.ok) return;
    const t = this.ctx.currentTime + (when || 0);
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = lowwind ? 'lowpass' : 'bandpass'; f.Q.value = lowwind ? 0.7 : 1.4;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + dur + 0.1);
  }
  /* meadow crickets — two staggered voices, gated by meadowOn so they only
     sing while the home scene is at rest on the grass */
  crickets(on) {
    this.meadowOn = on;
    if (!this.ok) return;
    this._cricketBoot();
    this.cricketGain.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, on ? 0.5 : 0.25);
  }
  _cricketBoot() {
    if (this.cricketGain) return;
    this.cricketGain = this.ctx.createGain();
    this.cricketGain.gain.value = this.meadowOn ? 1 : 0;
    this.cricketGain.connect(this.master);
    const voice = (base) => {
      const next = () => {
        if (this.meadowOn) {
          const n = 4 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) this.tone(base + Math.random() * 220, 0.028, 'sine', 0.014, i * 0.052, 0, this.cricketGain);
        }
        setTimeout(next, 340 + Math.random() * 620);
      };
      next();
    };
    voice(4150); setTimeout(() => voice(4420), 700);
  }
  /* dawn birds — sparse descending chirps, the meadow at sunrise */
  birds(on) {
    this.dawnOn = on;
    if (!this.ok) return;
    this._birdBoot();
    this.birdGain.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, on ? 0.6 : 0.25);
  }
  _birdBoot() {
    if (this.birdGain) return;
    this.birdGain = this.ctx.createGain();
    this.birdGain.gain.value = this.dawnOn ? 1 : 0;
    this.birdGain.connect(this.master);
    const voice = (lo) => {
      const next = () => {
        if (this.dawnOn) {
          const f0 = lo + Math.random() * 900, n = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) this.tone(f0 * (1 - 0.11 * i), 0.07, 'sine', 0.012, i * 0.1, f0 * (1 - 0.11 * i) * 0.85, this.birdGain);
        }
        setTimeout(next, 1100 + Math.random() * 2800);
      };
      next();
    };
    voice(2100); setTimeout(() => voice(2600), 1600);
  }
  riser() { this.sweep(300, 2600, 2.3, 0.10); this.sweep(190, 520, 2.3, 0.05, true); }
  arriveChime() { this.tone(880, 0.35, 'sine', 0.08, 0.12); this.tone(1318.5, 0.5, 'sine', 0.07, 0.22); }
  descendSweep() { this.sweep(1900, 320, 1.1, 0.07); }
  noise(dur, freq, q, gain, sweepTo) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  }
  chime(n) { const F = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5]; this.tone(F[Math.min(n, F.length - 1)], 0.35, 'sine', 0.1); this.tone(F[Math.min(n, F.length - 1)] * 2, 0.18, 'sine', 0.03); }
  unchime() { this.tone(392, 0.12, 'sine', 0.06); }
  invalid() { this.tone(140, 0.2, 'square', 0.07); this.tone(110, 0.25, 'square', 0.06, 0.06); }
  cast(len) { this.noise(0.3, 900, 1.2, 0.14, 3400); for (let i = 0; i < len; i++) this.tone(660 + i * 80, 0.1, 'triangle', 0.05, i * 0.055); }
  impact() { this.noise(0.16, 300, 1, 0.2); this.tone(180, 0.18, 'sine', 0.18, 0, 70); }
  bigWord() { [784, 987.8, 1174.7, 1568].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.08, i * 0.06)); this.noise(0.6, 2000, 2, 0.06, 5000); }
  forge() { this.tone(880, 0.3, 'sine', 0.1); this.tone(1318.5, 0.45, 'sine', 0.09, 0.09); }
  // the forge's mirror: a quiet descending shimmer — an unspent bonus tile
  // drains back to plain (must never overpower the cast/impact it rides under)
  fizzle() { this.tone(1046.5, 0.22, 'sine', 0.045); this.tone(784, 0.28, 'sine', 0.04, 0.08); this.tone(587.3, 0.4, 'sine', 0.035, 0.17); }
  hurt() { this.noise(0.35, 200, 0.8, 0.26, 70); this.tone(90, 0.4, 'sawtooth', 0.12, 0, 50); }
  blocked() { this.tone(660, 0.15, 'triangle', 0.14); this.noise(0.12, 1200, 2, 0.1); }
  sigil() { [659.3, 784, 987.8].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.09, i * 0.08)); }
  victory() { [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.1, i * 0.11)); }
  /* the win fanfare — a swelling sting sized to the feat: 1 = a hunt won,
     2 = a rival bested, 3 = the whole campaign conquered. Built from swells
     and bells over the victory chord's key — celebration, never a stab. */
  fanfare(tier) {
    if (!this.ok) return;
    this.sweep(420, 2400, 0.9, 0.09);                                    // the swell in
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.1, i * 0.085));
    const at = 0.4;                                                      // the crown chord lands as the run peaks
    [523.3, 659.3, 784, 1046.5].forEach((f) => { this.tone(f, 1.5, 'sine', 0.065, at); this.tone(f / 2, 1.7, 'triangle', 0.035, at); });
    this.tone(130.8, 1.6, 'sine', 0.13, at, 65);                         // the deep drum under it
    this.noise(0.9, 4200, 2, 0.05, 8200);                                // stardust hiss
    if (tier >= 2) {                                                     // the rival tier: a bold counter-line answers
      [659.3, 784, 987.8, 1174.7].forEach((f, i) => this.tone(f, 0.7, 'sawtooth', 0.024, at + 0.18 + i * 0.11));
      this.tone(98, 1.0, 'sine', 0.1, at + 0.55, 62);
    }
    if (tier >= 3) {                                                     // the campaign tier: bells cascade, the key lifts to D
      [1046.5, 1318.5, 1568, 2093, 1568, 2093].forEach((f, i) => this.tone(f, 0.55, 'sine', 0.05, 1.05 + i * 0.13));
      this.sweep(360, 3000, 1.8, 0.07, false, 1.0);
      [587.3, 739.99, 880, 1174.7].forEach((f) => { this.tone(f, 2.4, 'sine', 0.055, 1.85); this.tone(f * 2, 1.4, 'sine', 0.022, 1.85); });
      this.tone(73.4, 2.6, 'sine', 0.12, 1.85, 58);
    }
  }
  defeat() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.6, 'sine', 0.1, i * 0.16)); }
  ach() { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => this.tone(f, 0.35, 'sine', 0.07, i * 0.07)); }
  ui() { this.tone(740, 0.08, 'sine', 0.05); }
}

/* Generative pad: slow detuned triads drifting through an Aeolian
   progression, plus the occasional distant pluck. Very quiet — felt
   more than heard. */
class AmbientPad {
  constructor(sfx) {
    this.sfx = sfx;
    this.chords = [
      [220.0, 261.63, 329.63],   // Am
      [174.61, 220.0, 261.63],   // F
      [196.0, 246.94, 293.66],   // G
      [164.81, 196.0, 246.94],   // Em
    ];
    this.i = 0; this.on = false;
  }
  start() {
    if (this.on || !this.sfx.ok) return;
    this.on = true;
    const ctx = this.sfx.ctx;
    this.bus = ctx.createGain(); this.bus.gain.value = 0.05;
    this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 900;
    this.bus.connect(this.lp).connect(this.sfx.master);
    this.voices = [];
    for (let v = 0; v < 3; v++) {
      const o = ctx.createOscillator(); o.type = 'sine';
      const g = ctx.createGain(); g.gain.value = 0;
      o.detune.value = (v - 1) * 4;
      o.connect(g).connect(this.bus);
      o.start();
      this.voices.push({ o, g });
    }
    this.step();
    this.timer = setInterval(() => this.step(), 9000);
    this.pluckTimer = setInterval(() => {
      if (Math.random() < 0.6) {
        const F = [1046.5, 1174.7, 1318.5, 1568, 1760];
        this.sfx.tone(F[Math.floor(Math.random() * F.length)], 2.2, 'sine', 0.018);
      }
    }, 7000);
  }
  step() {
    if (!this.on) return;
    const ctx = this.sfx.ctx, t = ctx.currentTime;
    const chord = this.chords[this.i % this.chords.length];
    this.i++;
    this.voices.forEach((v, k) => {
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setValueAtTime(v.g.gain.value, t);
      v.g.gain.linearRampToValueAtTime(0.0001, t + 2.2);
      v.o.frequency.setTargetAtTime(chord[k % chord.length] * (k === 2 ? 0.5 : 1), t + 2.2, 0.6);
      v.g.gain.linearRampToValueAtTime(0.32, t + 6.5);
    });
  }
}

const SFX = new SynthAudio();
