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
    } catch (e) { /* garnish only */ }
  }
  setMuted(m) { this.muted = m; localStorage.setItem('beta3.mute', m ? '1' : '0'); if (this.ok) this.master.gain.value = m ? 0 : 0.5; }
  tone(freq, dur, type, gain, when, glideTo) {
    if (!this.ok) return;
    const t = (when || 0) + this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.03);
  }
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
  hurt() { this.noise(0.35, 200, 0.8, 0.26, 70); this.tone(90, 0.4, 'sawtooth', 0.12, 0, 50); }
  blocked() { this.tone(660, 0.15, 'triangle', 0.14); this.noise(0.12, 1200, 2, 0.1); }
  sigil() { [659.3, 784, 987.8].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.09, i * 0.08)); }
  victory() { [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.1, i * 0.11)); }
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
