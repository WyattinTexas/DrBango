'use strict';
/* ============================================================
   DRIFTLINE — one-thumb drift racer prototype (Corkscrew Games)
   Hold LEFT / RIGHT half of the screen (or arrow keys / A-D) to
   steer. Throttle is automatic. Drifting charges a boost; release
   the drift to fire it. Tracks are pure data (tracks.js) so a
   player course builder can ship later without touching the engine.
   ?demo=1  — autopilot attract/capture mode (ad clips, testing)
   ?track=<id> — start on a specific track
   ============================================================ */

const BUILD = 'DRIFTLINE v0.1.0';
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const QS = new URLSearchParams(location.search);
const DEMO = QS.get('demo') === '1';

// ---------- tiny math helpers ----------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const wrapAng = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const angLerp = (a, b, t) => a + wrapAng(b - a) * t;
const fmtTime = (s) => {
  if (s == null || !isFinite(s)) return '--.--';
  const m = Math.floor(s / 60), r = s - m * 60;
  return (m ? m + ':' : '') + (m && r < 10 ? '0' : '') + r.toFixed(2);
};

// ---------- track building (centripetal Catmull-Rom → dense centerline) ----
// Centripetal parameterization (alpha 0.5) is the variant that never loops or
// overshoots on uneven control spacing — essential once players draw courses.
function crSample(p0, p1, p2, p3, t) {
  const dt = (a, b) => Math.max(Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5), 1e-4);
  const t0 = 0, t1 = t0 + dt(p0, p1), t2 = t1 + dt(p1, p2), t3 = t2 + dt(p2, p3);
  const u = t1 + (t2 - t1) * t;
  const mix = (pa, pb, ta, tb) => {
    const f = (u - ta) / (tb - ta);
    return [pa[0] + (pb[0] - pa[0]) * f, pa[1] + (pb[1] - pa[1]) * f];
  };
  const A1 = mix(p0, p1, t0, t1), A2 = mix(p1, p2, t1, t2), A3 = mix(p2, p3, t2, t3);
  const B1 = mix(A1, A2, t0, t2), B2 = mix(A2, A3, t1, t3);
  return mix(B1, B2, t1, t2);
}
function buildTrack(def) {
  const P = def.points, K = P.length;
  const pts = [];
  for (let i = 0; i < K; i++) {
    const p0 = P[(i - 1 + K) % K], p1 = P[i], p2 = P[(i + 1) % K], p3 = P[(i + 2) % K];
    const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(6, Math.ceil(segLen / 12));
    for (let s = 0; s < steps; s++) {
      const q = crSample(p0, p1, p2, p3, s / steps);
      pts.push({ x: q[0], y: q[1] });
    }
  }
  const n = pts.length;
  const theta = new Float32Array(n), nx = new Float32Array(n), ny = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const t = Math.atan2(b.y - a.y, b.x - a.x);
    theta[i] = t; nx[i] = -Math.sin(t); ny[i] = Math.cos(t); // unit normal = right-hand side of travel
  }
  // curvature apexes → auto cone clusters (outside of each turn)
  const curv = new Float32Array(n);
  for (let i = 0; i < n; i++) curv[i] = wrapAng(theta[(i + 6) % n] - theta[(i - 6 + n) % n]);
  const apexes = [];
  for (let i = 0; i < n; i++) {
    const c = Math.abs(curv[i]);
    if (c < 0.38) continue;
    let isMax = true;
    for (let j = -25; j <= 25; j++) if (Math.abs(curv[(i + j + n) % n]) > c) { isMax = false; break; }
    if (isMax && !apexes.some((a) => Math.min(Math.abs(a - i), n - Math.abs(a - i)) < 60)) apexes.push(i);
  }
  apexes.sort((a, b) => Math.abs(curv[b]) - Math.abs(curv[a]));
  const halfW = def.width / 2;
  const cones = [];
  for (const ap of apexes.slice(0, 8)) {
    const side = -Math.sign(curv[ap]); // outside of the turn
    for (const off of [-11, 0, 11]) {
      const i = (ap + off + n) % n;
      cones.push({ x: pts[i].x + nx[i] * side * halfW * 0.62, y: pts[i].y + ny[i] * side * halfW * 0.62 });
    }
  }
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const p of pts) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  const M = halfW + 60;
  return {
    def, pts, theta, nx, ny, n, halfW, cones,
    bounds: { x: minX - M, y: minY - M, w: maxX - minX + M * 2, h: maxY - minY + M * 2 },
    startX: pts[0].x, startY: pts[0].y, startAng: theta[0],
  };
}

/* ============================================================
   Synth audio — zero asset files, built on first user gesture
   ============================================================ */
class SynthAudio {
  constructor() { this.ok = false; this.muted = localStorage.getItem('beta2.mute') === '1'; }
  ensure() {
    if (this.ok) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      // engine hum
      this.eng = this.ctx.createOscillator(); this.eng.type = 'sawtooth'; this.eng.frequency.value = 70;
      this.engLP = this.ctx.createBiquadFilter(); this.engLP.type = 'lowpass'; this.engLP.frequency.value = 700;
      this.engG = this.ctx.createGain(); this.engG.gain.value = 0;
      this.eng.connect(this.engLP).connect(this.engG).connect(this.master); this.eng.start();
      // tire skid (looped noise)
      const len = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      this.skid = this.ctx.createBufferSource(); this.skid.buffer = buf; this.skid.loop = true;
      this.skidBP = this.ctx.createBiquadFilter(); this.skidBP.type = 'bandpass'; this.skidBP.frequency.value = 950; this.skidBP.Q.value = 0.8;
      this.skidG = this.ctx.createGain(); this.skidG.gain.value = 0;
      this.skid.connect(this.skidBP).connect(this.skidG).connect(this.master); this.skid.start();
      this.ok = true;
    } catch (e) { /* audio is a garnish — never let it break the game */ }
  }
  setMuted(m) { this.muted = m; localStorage.setItem('beta2.mute', m ? '1' : '0'); if (this.ok) this.master.gain.value = m ? 0 : 0.5; }
  drive(speedN, boost, skidN) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    this.eng.frequency.setTargetAtTime(65 + speedN * 150 + (boost ? 45 : 0), t, 0.06);
    this.engLP.frequency.setTargetAtTime(600 + speedN * 1800, t, 0.08);
    this.engG.gain.setTargetAtTime(speedN > 0.02 ? 0.05 + speedN * 0.04 : 0, t, 0.1);
    this.skidG.gain.setTargetAtTime(skidN * 0.13, t, 0.05);
  }
  blip(freq, dur, type, gain, when) {
    const t = (when || 0) + this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(gain || 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, freq, q, gain, sweepTo) {
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  }
  conePop() { if (this.ok) { this.noise(0.09, 350, 1.2, 0.22); this.blip(150, 0.09, 'triangle', 0.15); } }
  nearMiss() { if (this.ok) this.noise(0.38, 420, 2.5, 0.2, 2900); }
  tierUp(tier) { if (this.ok) { const f = [660, 880, 1046][tier - 1] || 660; this.blip(f, 0.1, 'square', 0.09); this.blip(f * 1.33, 0.14, 'square', 0.09, 0.07); } }
  boost() { if (this.ok) { this.noise(0.45, 500, 1, 0.22, 3400); this.blip(320, 0.35, 'sawtooth', 0.1); } }
  wipeout() { if (this.ok) { this.noise(0.5, 200, 0.7, 0.3, 60); this.blip(110, 0.5, 'sine', 0.25); } }
  lap() { if (this.ok) { this.blip(784, 0.1, 'square', 0.1); this.blip(988, 0.1, 'square', 0.1, 0.09); this.blip(1318, 0.22, 'square', 0.12, 0.18); } }
}
const SFX = new SynthAudio();

/* ============================================================
   Game scene
   ============================================================ */
class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create() {
    // ---- track selection ----
    const wantId = QS.get('track');
    let ti = this.registry.get('trackIndex');
    if (ti == null) {
      ti = Math.max(0, DRIFTLINE_TRACKS.findIndex((t) => t.id === wantId));
      this.registry.set('trackIndex', ti);
    }
    this.T = buildTrack(DRIFTLINE_TRACKS[ti]);
    this.registry.set('trackData', { name: this.T.def.name, pts: this.T.pts.filter((_, i) => i % 8 === 0), bounds: this.T.bounds });

    this.makeTextures();
    this.drawWorld();

    // ---- car ----
    this.car = { x: this.T.startX, y: this.T.startY, vx: 0, vy: 0, heading: this.T.startAng, idx: 0, steer: 0 };
    this.carGlow = this.add.image(0, 0, 'glow').setScale(1.5).setTint(0x2fe0ff).setAlpha(0.4).setBlendMode('ADD').setDepth(2.5);
    this.carSpr = this.add.image(0, 0, 'car').setDepth(3);
    this.skidStamp = this.make.image({ key: 'skid', add: false });

    // ---- particles ----
    const spark = (tint) => this.add.particles(0, 0, 'spark', {
      speed: { min: 40, max: 300 }, lifespan: { min: 150, max: 450 },
      scale: { start: 0.8, end: 0 }, blendMode: 'ADD', emitting: false, tint,
    }).setDepth(4);
    this.sparkTier = [spark(0x66e0ff), spark(0xffb347), spark(0xd46bff)];
    this.sparkWall = spark(0xffffff);
    this.debris = this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 340 }, lifespan: 500, scale: { start: 0.9, end: 0.1 },
      blendMode: 'ADD', emitting: false, tint: 0xff8c1a, gravityY: 0,
    }).setDepth(4);
    this.flame = this.add.particles(0, 0, 'flame', {
      speed: { min: 10, max: 60 }, lifespan: 240, scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', emitting: false,
    }).setDepth(2.8);

    // ---- cones ----
    this.cones = this.T.cones.map((c) => {
      const s = this.add.image(c.x, c.y, 'cone').setDepth(2);
      return { spr: s, hx: c.x, hy: c.y, alive: true };
    });

    // ---- state ----
    this.state = 'title';         // title | race | spin
    this.ts = 1; this.tsTarget = 1; this.slowmoCd = 0;
    this.boostCharge = 0; this.boostTier = 0; this.boostTime = 0;
    this.driftTime = 0; this.nearMissCd = 0; this.spinTime = 0; this.spinDir = 1;
    this.score = 0; this.chain = 0; this.chainDecay = 0; this.driftTick = 0;
    this.lap = 0; this.lapTime = 0; this.visitedHalf = false;
    this.best = parseFloat(localStorage.getItem('beta2.best.' + this.T.def.id)) || null;
    this.hudAcc = 0; this.statAcc = 0;

    // nearest centerline index (global search once)
    let bd = 1e18;
    for (let i = 0; i < this.T.n; i += 4) {
      const dx = this.T.pts[i].x - this.car.x, dy = this.T.pts[i].y - this.car.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; this.car.idx = i; }
    }

    // ---- camera ----
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x0b0817);
    this.baseZoom = Math.min(this.scale.width, this.scale.height) / 780;
    this.camRot = -Math.PI / 2 - this.car.heading;
    cam.setRotation ? cam.setRotation(this.camRot) : (cam.rotation = this.camRot);
    cam.setZoom(this.baseZoom);
    cam.centerOn(this.car.x, this.car.y);
    this.lookX = this.car.x; this.lookY = this.car.y;

    // ---- input ----
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D,R,T');
    this.input.addPointer(2);
    this.input.on('pointerdown', () => { SFX.ensure(); if (this.state === 'title' && !DEMO) this.startRace(); });
    this.keys.R.on('down', () => this.scene.restart());
    this.keys.T.on('down', () => this.cycleTrack());
    this.game.events.on('dl-restart', this.onRestart, this);
    this.game.events.on('dl-cycle', this.onCycle, this);
    this.events.once('shutdown', () => {
      this.game.events.off('dl-restart', this.onRestart, this);
      this.game.events.off('dl-cycle', this.onCycle, this);
    });

    // ---- UI scene ----
    if (this.scene.isActive('ui')) this.game.events.emit('dl-track');
    else this.scene.launch('ui');

    if (DEMO) this.time.delayedCall(900, () => this.startRace());

    localStorage.setItem('beta2.boot', BUILD);
    console.log(BUILD + ' — track: ' + this.T.def.name);
  }

  onRestart() { this.scene.restart(); }
  onCycle() { this.cycleTrack(); }
  cycleTrack() {
    this.registry.set('trackIndex', (this.registry.get('trackIndex') + 1) % DRIFTLINE_TRACKS.length);
    this.scene.restart();
  }

  startRace() {
    if (this.state !== 'title') return;
    this.state = 'race';
    this.lap = 1; this.lapTime = 0; this.visitedHalf = false;
    this.game.events.emit('dl-go');
  }

  // ---------- generated textures ----------
  makeTextures() {
    const mk = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      const t = this.textures.createCanvas(key, w, h);
      fn(t.context, w, h); t.refresh();
    };
    mk('car', 64, 40, (c, w, h) => {
      c.translate(w / 2, h / 2);
      // tire set
      c.fillStyle = '#0a0a12';
      for (const [x, y] of [[-14, -12], [-14, 12], [12, -11], [12, 11]]) { c.beginPath(); c.roundRect(x - 5, y - 4, 11, 8, 3); c.fill(); }
      // body
      const g = c.createLinearGradient(-22, 0, 24, 0);
      g.addColorStop(0, '#232041'); g.addColorStop(0.6, '#312a5e'); g.addColorStop(1, '#3c2f6e');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(-22, -9); c.quadraticCurveTo(-24, 0, -22, 9); c.lineTo(14, 11);
      c.quadraticCurveTo(26, 4, 26, 0); c.quadraticCurveTo(26, -4, 14, -11); c.closePath(); c.fill();
      // neon rim
      c.strokeStyle = '#2fe0ff'; c.lineWidth = 2; c.stroke();
      // hot stripe
      c.strokeStyle = '#ff2f9e'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-20, 0); c.lineTo(20, 0); c.stroke();
      // cockpit
      c.fillStyle = '#9fecff';
      c.beginPath(); c.ellipse(2, 0, 7, 5.5, 0, 0, Math.PI * 2); c.fill();
      // spoiler
      c.fillStyle = '#16123a'; c.fillRect(-24, -12, 5, 24);
      c.strokeStyle = '#2fe0ff'; c.lineWidth = 1.5; c.strokeRect(-24, -12, 5, 24);
    });
    mk('glow', 128, 128, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    mk('spark', 14, 14, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    mk('flame', 32, 32, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(0.45, 'rgba(255,140,40,0.8)'); g.addColorStop(1, 'rgba(255,60,20,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    mk('skid', 20, 8, (c, w, h) => {
      c.fillStyle = 'rgba(5,4,12,0.85)';
      c.beginPath(); c.roundRect(0, 0, w, h, 4); c.fill();
    });
    mk('cone', 28, 28, (c, w, h) => {
      c.translate(w / 2, h / 2);
      c.fillStyle = '#b34700'; c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ff8c1a'; c.beginPath(); c.arc(0, 0, 9.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ff8c1a'; c.beginPath(); c.arc(0, 0, 3, 0, Math.PI * 2); c.fill();
    });
  }

  // ---------- static world (grid + road baked into render textures) ----------
  drawWorld() {
    const T = this.T, B = T.bounds, TH = T.def.theme;
    // neon floor grid
    const grid = this.add.graphics().setDepth(-3);
    const GX = 160, x0 = Math.floor(B.x / GX) * GX - GX * 3, y0 = Math.floor(B.y / GX) * GX - GX * 3;
    const x1 = B.x + B.w + GX * 3, y1 = B.y + B.h + GX * 3;
    let k = 0;
    for (let x = x0; x <= x1; x += GX, k++) { grid.lineStyle(k % 4 === 0 ? 2.5 : 1.2, k % 4 === 0 ? 0x241a52 : 0x1a1340, 0.7); grid.lineBetween(x, y0, x, y1); }
    k = 0;
    for (let y = y0; y <= y1; y += GX, k++) { grid.lineStyle(k % 4 === 0 ? 2.5 : 1.2, k % 4 === 0 ? 0x241a52 : 0x1a1340, 0.7); grid.lineBetween(x0, y, x1, y); }

    // road: baked once into a half-res render texture (one draw call/frame)
    const RTS = 0.5;
    const rt = this.add.renderTexture(B.x, B.y, Math.ceil(B.w * RTS), Math.ceil(B.h * RTS))
      .setOrigin(0).setScale(1 / RTS).setDepth(-2);
    const g = this.make.graphics({ add: false });
    const lx = (wx) => (wx - B.x) * RTS, ly = (wy) => (wy - B.y) * RTS;
    // asphalt: overlapping discs along the centerline = seamless ribbon
    g.fillStyle(TH.road, 1);
    for (let i = 0; i < T.n; i += 2) g.fillCircle(lx(T.pts[i].x), ly(T.pts[i].y), T.halfW * RTS);
    // edge glow underlay + crisp edge, both sides. Where the turn radius is
    // tighter than halfW the offset curve folds over itself — lift the pen
    // there instead of stroking bowtie loops across the road.
    for (const side of [-1, 1]) {
      const color = side === 1 ? TH.edge : TH.edge2;
      for (const [width, alpha] of [[26, 0.16], [10, 0.35], [4.5, 1]]) {
        g.lineStyle(width * RTS, color, alpha);
        g.beginPath();
        let pen = false;
        for (let i = 0; i <= T.n; i += 3) {
          const j = i % T.n, j2 = (j + 3) % T.n;
          const dth = wrapAng(T.theta[j2] - T.theta[j]);
          const ds = Math.max(Math.hypot(T.pts[j2].x - T.pts[j].x, T.pts[j2].y - T.pts[j].y), 1);
          if (1 - side * (dth / ds) * T.halfW < 0.12) { pen = false; continue; }
          const ex = T.pts[j].x + T.nx[j] * side * T.halfW, ey = T.pts[j].y + T.ny[j] * side * T.halfW;
          if (pen) g.lineTo(lx(ex), ly(ey));
          else { g.moveTo(lx(ex), ly(ey)); pen = true; }
        }
        g.strokePath();
      }
    }
    // center dashes (skipped through tight bends where a chord would cut across)
    g.lineStyle(4 * RTS, TH.dash, 0.4);
    for (let i = 0; i < T.n; i += 14) {
      const j = (i + 5) % T.n;
      if (Math.abs(wrapAng(T.theta[j] - T.theta[i])) > 0.45) continue;
      g.beginPath();
      g.moveTo(lx(T.pts[i].x), ly(T.pts[i].y));
      g.lineTo(lx(T.pts[j].x), ly(T.pts[j].y));
      g.strokePath();
    }
    // start line: checkered band across the road
    const sx = T.pts[0].x, sy = T.pts[0].y, snx = T.nx[0], sny = T.ny[0];
    const cell = (T.halfW * 2) / 10;
    for (let r = 0; r < 2; r++) for (let cix = 0; cix < 10; cix++) {
      g.fillStyle((r + cix) % 2 ? 0xe8e8f0 : 0x1b1b26, 1);
      const along = (r - 1) * cell, off = -T.halfW + cix * cell;
      const cx = sx + Math.cos(T.theta[0]) * along + snx * (off + cell / 2);
      const cy = sy + Math.sin(T.theta[0]) * along + sny * (off + cell / 2);
      g.fillRect(lx(cx) - cell * RTS / 2, ly(cy) - cell * RTS / 2, cell * RTS, cell * RTS);
    }
    rt.draw(g); g.destroy();

    // persistent skid-mark layer (accumulates the whole session — racing lines!)
    this.skidRT = this.add.renderTexture(B.x, B.y, Math.ceil(B.w * RTS), Math.ceil(B.h * RTS))
      .setOrigin(0).setScale(1 / RTS).setDepth(-1);
    this.RTS = RTS;
  }

  // ---------- per-frame ----------
  update(_, dtms) {
    const dtReal = Math.min(dtms, 50) / 1000;
    // slow-mo envelope
    this.ts = lerp(this.ts, this.tsTarget, 1 - Math.exp(-dtReal * 8));
    if (this.tsTarget < 1) { this.tsHold -= dtReal; if (this.tsHold <= 0) this.tsTarget = 1; }
    this.slowmoCd = Math.max(0, this.slowmoCd - dtReal);
    const dt = dtReal * this.ts;
    const car = this.car, T = this.T;

    // ---- steering input ----
    let steer = 0;
    if (this.state === 'race') {
      if (DEMO) steer = this.autopilot();
      else {
        if (this.keys.LEFT.isDown || this.keys.A.isDown) steer -= 1;
        if (this.keys.RIGHT.isDown || this.keys.D.isDown) steer += 1;
        const ptrs = [this.input.pointer1, this.input.pointer2, this.input.activePointer];
        for (const p of ptrs) {
          if (p && p.isDown && p.y > this.scale.height * 0.16) { steer += p.x < this.scale.width / 2 ? -1 : 1; break; }
        }
        steer = clamp(steer, -1, 1);
      }
    }
    car.steer = lerp(car.steer, steer, 1 - Math.exp(-dt * 14));

    // ---- physics ----
    const speed = Math.hypot(car.vx, car.vy);
    const speedN = clamp(speed / 900, 0, 1);
    const fx = Math.cos(car.heading), fy = Math.sin(car.heading);
    const rx = -fy, ry = fx;
    let f = car.vx * fx + car.vy * fy;   // forward component
    let l = car.vx * rx + car.vy * ry;   // lateral component
    const slip = speed > 40 ? wrapAng(Math.atan2(car.vy, car.vx) - car.heading) : 0;
    const drifting = this.state === 'race' && speed > 230 && Math.abs(slip) > 0.22;

    if (this.state === 'spin') {
      this.spinTime -= dt;
      car.heading += this.spinDir * 9 * (this.spinTime / 0.8) * dt;
      f *= Math.exp(-dt * 1.6); l *= Math.exp(-dt * 1.6);
      if (this.spinTime <= 0) { this.state = 'race'; this.chain = 0; }
    } else if (this.state === 'race') {
      const rate = 3.1 * clamp(speed / 280, 0, 1) * (drifting ? 1.18 : 1);
      car.heading += car.steer * rate * dt;
      const maxCur = 900 * (this.boostTime > 0 ? 1.38 : 1);
      f += 660 * (this.boostTime > 0 ? 2 : 1) * dt;
      f = Math.min(f * Math.exp(-dt * 0.35), maxCur);
      l *= Math.exp(-dt * (drifting ? 2.1 : 9));
    } else { // title
      f *= Math.exp(-dt * 3); l *= Math.exp(-dt * 3);
    }
    car.vx = fx * f + rx * l; car.vy = fy * f + ry * l;
    car.x += car.vx * dt; car.y += car.vy * dt;

    // ---- track index tracking ----
    let bi = car.idx, bd = 1e18;
    for (let j = -35; j <= 35; j++) {
      const i = (car.idx + j + T.n) % T.n;
      const dx = T.pts[i].x - car.x, dy = T.pts[i].y - car.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; bi = i; }
    }
    const prevIdx = car.idx; car.idx = bi;
    const cpt = T.pts[bi];
    const d = (car.x - cpt.x) * T.nx[bi] + (car.y - cpt.y) * T.ny[bi]; // signed offset from centerline

    // ---- walls ----
    const lim = T.halfW - 12;
    if (Math.abs(d) > lim && this.state !== 'title') {
      const sgn = Math.sign(d);
      car.x -= T.nx[bi] * sgn * (Math.abs(d) - lim);
      car.y -= T.ny[bi] * sgn * (Math.abs(d) - lim);
      const vn = car.vx * T.nx[bi] * sgn + car.vy * T.ny[bi] * sgn;
      if (vn > 0) {
        car.vx -= T.nx[bi] * sgn * vn * 1.55; car.vy -= T.ny[bi] * sgn * vn * 1.55;
        this.sparkWall.emitParticleAt(car.x, car.y, Math.min(3 + vn / 40, 14));
        if (vn > 430 && this.state === 'race') this.wipeout(-sgn);
        else if (vn > 90) { this.cameras.main.shake(90, 0.004 * clamp(vn / 400, 0.3, 1)); if (SFX.ok) SFX.noise(0.12, 250, 1, 0.12); }
      }
    }
    // near-miss: shaving the wall mid-drift at speed
    this.nearMissCd = Math.max(0, this.nearMissCd - dt);
    if (drifting && speed > 480 && lim - Math.abs(d) < 26 && lim - Math.abs(d) > 0 && this.nearMissCd <= 0) {
      this.nearMissCd = 0.9;
      this.bump(2); this.addScore(250, 'CLOSE!');
      SFX.nearMiss();
      if (this.slowmoCd <= 0) { this.tsTarget = 0.45; this.tsHold = 0.22; this.slowmoCd = 3; this.tsTarget = 0.45; }
    }

    // ---- drift charge / boost ----
    if (drifting) {
      this.driftTime += dt; this.chainDecay = 0;
      this.boostCharge += dt * (1 + Math.abs(slip) * 1.4);
      const tier = this.boostCharge > 3.6 ? 3 : this.boostCharge > 2.2 ? 2 : this.boostCharge > 1.0 ? 1 : 0;
      if (tier > this.boostTier) { this.boostTier = tier; SFX.tierUp(tier); this.cameras.main.shake(60, 0.002); }
      this.driftTick += dt;
      if (this.driftTick >= 1) { this.driftTick -= 1; this.bump(1); this.addScore(100); }
      this.addScore(120 * dt * [1, 1, 1.5, 2.2][this.boostTier]);
      // sparks + skids from rear wheels
      if (this.boostTier > 0) {
        const bx = car.x - fx * 20, by = car.y - fy * 20;
        this.sparkTier[this.boostTier - 1].emitParticleAt(bx + rx * (slip > 0 ? 12 : -12), by + ry * (slip > 0 ? 12 : -12), 2);
      }
      this.skidFrame = (this.skidFrame || 0) + 1;
      if (this.skidFrame % 2 === 0) {
        this.skidStamp.setRotation(car.heading).setScale(this.RTS).setAlpha(0.3);
        for (const s of [-11, 11]) {
          this.skidRT.draw(this.skidStamp, (car.x - fx * 16 + rx * s - T.bounds.x) * this.RTS, (car.y - fy * 16 + ry * s - T.bounds.y) * this.RTS);
        }
      }
    } else {
      this.driftTime = 0; this.driftTick = 0;
      if (this.boostTier > 0 && this.state === 'race') { // drift released → fire boost
        this.boostTime = [0, 0.55, 0.85, 1.25][this.boostTier];
        SFX.boost(); this.cameras.main.shake(120, 0.003);
        this.game.events.emit('dl-boost', this.boostTier);
      }
      this.boostCharge = 0; this.boostTier = 0;
      this.chainDecay += dt;
      if (this.chainDecay > 2.5 && this.chain > 0) this.chain = 0;
    }
    if (this.boostTime > 0) {
      this.boostTime -= dt;
      this.flame.emitParticleAt(car.x - fx * 26, car.y - fy * 26, 2);
    }

    // ---- cones ----
    for (const c of this.cones) {
      if (!c.alive) continue;
      const dx = c.spr.x - car.x, dy = c.spr.y - car.y;
      if (dx * dx + dy * dy < 30 * 30 && speed > 150 && this.state === 'race') {
        c.alive = false;
        this.debris.emitParticleAt(c.spr.x, c.spr.y, 8);
        SFX.conePop(); this.bump(1); this.addScore(100, '+CONE');
        this.cameras.main.shake(50, 0.002);
        const ang = Math.atan2(dy, dx);
        this.tweens.add({
          targets: c.spr, x: c.spr.x + Math.cos(ang) * 90 + car.vx * 0.25, y: c.spr.y + Math.sin(ang) * 90 + car.vy * 0.25,
          angle: 540, alpha: 0, scale: 1.4, duration: 600, ease: 'Cubic.easeOut',
        });
      }
    }

    // ---- laps ----
    if (this.state === 'race' || this.state === 'spin') {
      this.lapTime += dtReal;
      const p = bi / T.n, pPrev = prevIdx / T.n;
      if (p > 0.4 && p < 0.6) this.visitedHalf = true;
      if (pPrev > 0.85 && p < 0.15 && this.visitedHalf) {
        this.visitedHalf = false;
        const t = this.lapTime; this.lapTime = 0;
        const isBest = this.best == null || t < this.best;
        if (isBest) { this.best = t; localStorage.setItem('beta2.best.' + T.def.id, String(t)); }
        this.addScore(1000);
        this.lap++;
        SFX.lap(); this.cameras.main.flash(180, 120, 240, 255, false);
        this.game.events.emit('dl-lap', { lap: this.lap, time: t, best: this.best, isBest });
        for (const c of this.cones) { c.alive = true; this.tweens.killTweensOf(c.spr); c.spr.setPosition(c.hx, c.hy).setAlpha(1).setScale(1).setAngle(0); }
        if (DEMO) localStorage.setItem('beta2.lap', String(this.lap - 1));
      }
    }

    // ---- car visuals ----
    this.carSpr.setPosition(car.x, car.y).setRotation(car.heading);
    this.carGlow.setPosition(car.x, car.y).setAlpha(0.25 + speedN * 0.3 + (this.boostTime > 0 ? 0.3 : 0));
    this.carGlow.setTint(this.boostTime > 0 ? 0xffb347 : [0x2fe0ff, 0x66e0ff, 0xffb347, 0xd46bff][this.boostTier]);

    // ---- camera ----
    const cam = this.cameras.main;
    const rotT = -Math.PI / 2 - car.heading;
    this.camRot = angLerp(this.camRot, rotT, 1 - Math.exp(-dtReal * (this.state === 'spin' ? 1.1 : 3.6)));
    cam.rotation = this.camRot;
    this.lookX = lerp(this.lookX, car.x + car.vx * 0.34, 1 - Math.exp(-dtReal * 5));
    this.lookY = lerp(this.lookY, car.y + car.vy * 0.34, 1 - Math.exp(-dtReal * 5));
    cam.centerOn(this.lookX, this.lookY);
    const zTarget = this.baseZoom * (1 - speedN * 0.24) * (this.boostTime > 0 ? 0.965 : 1);
    cam.setZoom(lerp(cam.zoom, zTarget, 1 - Math.exp(-dtReal * 3)));

    // ---- audio + HUD feed ----
    SFX.drive(speedN, this.boostTime > 0, drifting ? clamp(Math.abs(slip), 0, 1) : 0);
    this.hudAcc += dtReal;
    if (this.hudAcc > 0.07) {
      this.hudAcc = 0;
      this.game.events.emit('dl-hud', {
        state: this.state, speed, lap: this.lap, lapTime: this.lapTime, best: this.best,
        score: Math.floor(this.score), mult: this.mult(), charge: this.boostCharge, tier: this.boostTier,
        boosting: this.boostTime > 0, drifting, cx: car.x, cy: car.y,
      });
    }
    if (DEMO) { // heartbeat for the Chrome probe
      this.statAcc += dtReal;
      if (this.statAcc > 1) {
        this.statAcc = 0;
        localStorage.setItem('beta2.stat', JSON.stringify({ v: BUILD, state: this.state, speed: Math.round(speed), lap: this.lap, score: Math.floor(this.score), t: Date.now() }));
      }
    }
  }

  mult() { return 1 + Math.min(this.chain, 28) * 0.25; }
  bump(n) { this.chain += n; this.chainDecay = 0; }
  addScore(base, label) {
    this.score += base * this.mult();
    if (label) this.game.events.emit('dl-pop', { text: label + ' +' + Math.floor(base * this.mult()), });
  }

  wipeout(dir) {
    this.state = 'spin'; this.spinTime = 0.8; this.spinDir = dir || 1;
    this.boostCharge = 0; this.boostTier = 0; this.boostTime = 0;
    this.tsTarget = 0.35; this.tsHold = 0.3; this.slowmoCd = 3;
    this.cameras.main.shake(280, 0.012);
    SFX.wipeout();
    this.game.events.emit('dl-wipeout');
  }

  autopilot() {
    const car = this.car, T = this.T;
    const speed = Math.hypot(car.vx, car.vy);
    const look = Math.round(clamp(speed * 0.05, 18, 42));
    const tp = T.pts[(car.idx + look) % T.n];
    const err = wrapAng(Math.atan2(tp.y - car.y, tp.x - car.x) - car.heading);
    return clamp(err * 2.4, -1, 1);
  }
}

/* ============================================================
   UI scene (screen-space — unaffected by the rotating camera)
   ============================================================ */
class UIScene extends Phaser.Scene {
  constructor() { super('ui'); }

  create() {
    const W = () => this.scale.width, H = () => this.scale.height;
    const u = (v) => v * DPR;
    this.u = u;
    const txt = (x, y, str, size, color, weight) =>
      this.add.text(x, y, str, {
        fontFamily: '"Arial Black", "Helvetica Neue", sans-serif', fontSize: u(size) + 'px',
        fontStyle: weight || 'bold', color: color || '#ffffff',
      }).setShadow(0, u(2), '#000000', u(6));

    const safeT = u(14) + (window.visualViewport ? 0 : 0);

    // top-left: lap + times
    this.lapT = txt(u(16), safeT, '', 15, '#9fecff').setOrigin(0, 0);
    this.timeT = txt(u(16), safeT + u(24), '0.00', 26, '#ffffff').setOrigin(0, 0);
    this.bestT = txt(u(16), safeT + u(60), '', 13, '#898781').setOrigin(0, 0);

    // top-right: score + combo
    this.scoreT = txt(W() - u(16), safeT, '0', 26, '#ffffff').setOrigin(1, 0);
    this.multT = txt(W() - u(16), safeT + u(36), '', 16, '#ffb347').setOrigin(1, 0);

    // minimap (top-center) — drawn from track data, doubles as course-shape preview
    this.mmG = this.add.graphics();
    this.mmDot = this.add.image(0, 0, 'spark').setTint(0x2fe0ff).setScale(DPR * 0.9);
    this.mmBox = { x: W() / 2 - u(55), y: safeT, w: u(110), h: u(78) };
    this.drawMinimap();

    // boost meter (bottom-center)
    this.boostG = this.add.graphics();

    // steer hint zones
    this.hintL = txt(W() * 0.25, H() * 0.82, '◀ HOLD', 17, '#9fecff').setOrigin(0.5).setAlpha(0.55);
    this.hintR = txt(W() * 0.75, H() * 0.82, 'HOLD ▶', 17, '#9fecff').setOrigin(0.5).setAlpha(0.55);

    // pop label (CLOSE! / +CONE)
    this.popT = txt(W() / 2, H() * 0.34, '', 22, '#9fecff').setOrigin(0.5).setAlpha(0);

    // center banners
    this.bannerT = txt(W() / 2, H() * 0.42, '', 34, '#ffffff').setOrigin(0.5).setAlpha(0);

    // title overlay
    this.title1 = txt(W() / 2, H() * 0.30, 'DRIFTLINE', 54, '#ffffff', '900')
      .setOrigin(0.5).setShadow(0, 0, '#ff2f9e', u(24), true, true);
    this.title2 = txt(W() / 2, H() * 0.30 + u(52), (this.registry.get('trackData') || {}).name || '', 17, '#2fe0ff').setOrigin(0.5);
    this.title3 = txt(W() / 2, H() * 0.62, DEMO ? 'DEMO MODE' : 'TAP TO RACE', 22, '#ffffff').setOrigin(0.5);
    this.title4 = txt(W() / 2, H() * 0.62 + u(34), 'hold LEFT / RIGHT · drift everything · shave walls', 13, '#c3c2b7').setOrigin(0.5);
    this.title5 = txt(W() / 2, H() - u(26), BUILD + ' prototype · Corkscrew Games', 11, '#52514e').setOrigin(0.5);
    this.tweens.add({ targets: this.title3, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    // corner buttons
    const btn = (x, str, fn) => {
      const b = txt(x, H() - u(30), str, 20, '#c3c2b7').setOrigin(0.5).setAlpha(0.8)
        .setInteractive({ useHandCursor: true });
      b.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); fn(); });
      return b;
    };
    this.muteB = btn(u(30), SFX.muted ? '🔇' : '🔊', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });
    this.trackB = btn(W() - u(30), '⇄', () => this.game.events.emit('dl-cycle'));
    this.restartB = btn(W() - u(74), '↻', () => this.game.events.emit('dl-restart'));

    // ---- events from the game scene ----
    const on = (ev, fn) => { this.game.events.on(ev, fn, this); this.events.once('shutdown', () => this.game.events.off(ev, fn, this)); };
    on('dl-hud', this.onHud);
    on('dl-go', () => {
      for (const t of [this.title1, this.title2, this.title3, this.title4]) {
        this.tweens.killTweensOf(t);
        this.tweens.add({ targets: t, alpha: 0, duration: 250 });
      }
      this.banner('GO!', '#2fe0ff');
    });
    on('dl-lap', (d) => this.banner('LAP ' + fmtTime(d.time) + (d.isBest ? '  ★ BEST' : ''), d.isBest ? '#ffb347' : '#ffffff'));
    on('dl-wipeout', () => this.banner('WIPEOUT!', '#ff5566'));
    on('dl-boost', (t) => this.banner(['', 'BOOST!', 'BIG BOOST!', 'MAX BOOST!'][t], ['', '#66e0ff', '#ffb347', '#d46bff'][t], 14));
    on('dl-pop', (d) => {
      this.popT.setText(d.text).setAlpha(1).setY(H() * 0.34).setScale(1);
      this.tweens.killTweensOf(this.popT);
      this.tweens.add({ targets: this.popT, y: H() * 0.29, alpha: 0, duration: 700, ease: 'Cubic.easeOut' });
    });
    on('dl-track', () => { this.scene.restart(); });
    this.scale.on('resize', () => this.scene.restart());
  }

  banner(str, color, size) {
    this.bannerT.setText(str).setColor(color || '#ffffff').setAlpha(1)
      .setFontSize(this.u(size || 34) + 'px').setScale(0.6);
    this.tweens.killTweensOf(this.bannerT);
    this.tweens.add({ targets: this.bannerT, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.bannerT, alpha: 0, delay: 900, duration: 350 });
  }

  drawMinimap() {
    const td = this.registry.get('trackData');
    if (!td) return;
    const b = this.mmBox, g = this.mmG;
    const sc = Math.min(b.w / td.bounds.w, b.h / td.bounds.h);
    this.mmMap = (x, y) => ({ x: b.x + (b.w - td.bounds.w * sc) / 2 + (x - td.bounds.x) * sc, y: b.y + (b.h - td.bounds.h * sc) / 2 + (y - td.bounds.y) * sc });
    g.clear();
    g.lineStyle(this.u(2.5), 0xff2f9e, 0.55);
    g.beginPath();
    td.pts.forEach((p, i) => { const m = this.mmMap(p.x, p.y); i === 0 ? g.moveTo(m.x, m.y) : g.lineTo(m.x, m.y); });
    g.closePath(); g.strokePath();
  }

  onHud(d) {
    const u = this.u, W = this.scale.width, H = this.scale.height;
    this.lapT.setText(d.state === 'title' ? '' : 'LAP ' + d.lap);
    this.timeT.setText(d.state === 'title' ? '' : fmtTime(d.lapTime));
    this.bestT.setText(d.best ? 'BEST ' + fmtTime(d.best) : '');
    this.scoreT.setText(String(d.score));
    this.multT.setText(d.mult > 1 ? '×' + d.mult.toFixed(2).replace(/\.?0+$/, '') : '');
    if (this.mmMap) { const m = this.mmMap(d.cx, d.cy); this.mmDot.setPosition(m.x, m.y); }
    if (d.state !== 'title' && (d.drifting || d.speed > 400)) { this.hintL.setAlpha(Math.max(0, this.hintL.alpha - 0.04)); this.hintR.setAlpha(this.hintL.alpha); }
    // boost meter
    const g = this.boostG; g.clear();
    if (d.state !== 'title') {
      const w = u(150), h = u(9), x = W / 2 - w / 2, y = H - u(58);
      const frac = clamp(d.charge / 3.6, 0, 1);
      const col = [0x3a3a4a, 0x66e0ff, 0xffb347, 0xd46bff][d.tier];
      g.fillStyle(0x0d0d16, 0.7); g.fillRoundedRect(x - u(2), y - u(2), w + u(4), h + u(4), h / 2);
      if (frac > 0.01) { g.fillStyle(col, 1); g.fillRoundedRect(x, y, Math.max(w * frac, h), h, h / 2); }
      if (d.boosting) { g.lineStyle(u(2), 0xffb347, 0.9); g.strokeRoundedRect(x - u(4), y - u(4), w + u(8), h + u(8), h); }
      for (const f of [1.0 / 3.6, 2.2 / 3.6]) { g.fillStyle(0x0b0817, 0.9); g.fillRect(x + w * f, y, u(1.5), h); }
    }
  }
}

/* ============================================================
   Boot
   ============================================================ */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: Math.round(window.innerWidth * DPR),
  height: Math.round(window.innerHeight * DPR),
  backgroundColor: '#0b0817',
  scale: { mode: Phaser.Scale.NONE },
  input: { activePointers: 3 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [GameScene, UIScene],
});
function fitCanvas() {
  const c = game.canvas;
  if (!c) return;
  c.style.width = window.innerWidth + 'px';
  c.style.height = window.innerHeight + 'px';
}
game.events.once('ready', fitCanvas);
window.addEventListener('resize', () => {
  game.scale.resize(Math.round(window.innerWidth * DPR), Math.round(window.innerHeight * DPR));
  fitCanvas();
  const gs = game.scene.getScene('game');
  if (gs && gs.scene.isActive()) gs.baseZoom = Math.min(gs.scale.width, gs.scale.height) / 780;
});
