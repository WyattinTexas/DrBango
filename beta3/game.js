'use strict';
/* ============================================================
   STARSPELL — word-roguelite (Corkscrew Games)
   v0.2: Home / Campaign (3 acts) / Quick Play / Daily Hunt with
   share + leaderboards (daily & weekly) / Profile with stats and
   achievements / 10 constellation beasts / 16 sigils / ambient
   music and a heavy coat of star-magic. Versus: next moon.
   ?demo=1 — self-playing solver   ?daily=1 — jump into the Daily
   ============================================================ */

const BUILD = 'STARSPELL v0.3.3';
// Full-DPR back-buffer: capping at 2 left 3x phones upscaling 1.5x — text
// went soft (Runefall's v0.18 blur, same cause). MSAA off at retina instead.
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const DIAG = (m) => { if (window.SSDIAG) window.SSDIAG(m); };
const QS = new URLSearchParams(location.search);
const DEMO = QS.get('demo') === '1';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

// seeded RNG (mulberry32); reseeded per run — daily runs share a date seed
let _seed = Math.floor(Math.random() * 1e9);
function setSeed(s) { _seed = s | 0; }
function rng() {
  _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rpick = (arr) => arr[Math.floor(rng() * arr.length)];

const WORDSET = new Set(STARSPELL_WORDS.split(' '));
const VALS = { a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 9, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10 };
const BAG = [];
for (const [ch, n] of Object.entries({ e: 12, a: 9, i: 9, o: 8, n: 6, r: 6, t: 6, l: 4, s: 4, u: 4, d: 4, g: 3, b: 2, c: 2, m: 2, p: 2, f: 2, h: 2, v: 2, w: 2, y: 2, k: 1, j: 1, x: 1, q: 1, z: 1 })) {
  for (let i = 0; i < n; i++) BAG.push(ch);
}
const VOWELS = 'aeiou';
const LEN_MULT = [0, 0, 0, 1, 1.15, 1.35, 1.6, 1.9, 2.3];
const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

/* ============================================================
   Profile, stats, achievements (local-first; best-effort sync)
   ============================================================ */
const SS = {
  prof: null,
  load() {
    try { this.prof = JSON.parse(localStorage.getItem('beta3.profile')) || {}; } catch (e) { this.prof = {}; }
    const p = this.prof;
    p.runs = p.runs | 0; p.wins = p.wins | 0; p.words = p.words | 0; p.beasts = p.beasts | 0;
    p.longest = p.longest || ''; p.bigHit = p.bigHit | 0; p.bestQuick = p.bestQuick | 0;
    p.vsWords = p.vsWords | 0; p.vsWins = p.vsWins | 0;
    p.daily = p.daily || {}; p.ach = p.ach || {};
    return p;
  },
  save() { try { localStorage.setItem('beta3.profile', JSON.stringify(this.prof)); } catch (e) { } },
  sync() {
    SSNET.syncProfile({
      runs: this.prof.runs, wins: this.prof.wins, words: this.prof.words, beasts: this.prof.beasts,
      longest: this.prof.longest, bigHit: this.prof.bigHit, bestQuick: this.prof.bestQuick,
      vsWins: this.prof.vsWins,
      achCount: Object.keys(this.prof.ach).length,
    });
  },
  has(id) { return !!this.prof.ach[id]; },
  award(id, game) {
    if (this.prof.ach[id]) return;
    this.prof.ach[id] = Date.now();
    this.save();
    const def = SS_ACH.find((a) => a.id === id);
    if (def && game) game.events.emit('ss-ach', def);
    if (SFX.ok) SFX.ach();
  },
};
SS.load();

/* ============================================================
   Shared drawing helpers (textures + constellation rendering)
   ============================================================ */
function ssMakeTextures(scene) {
  const mk = (key, w, h, fn) => {
    if (scene.textures.exists(key)) return;
    const t = scene.textures.createCanvas(key, w, h);
    fn(t.context, w, h); t.refresh();
  };
  mk('dot', 16, 16, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  mk('glowbig', 256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.8)'); g.addColorStop(0.55, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const tileTex = (key, top, bottom, edge) => mk(key, 128, 128, (c) => {
    const r = 24;
    c.beginPath(); c.roundRect(6, 6, 116, 116, r);
    const g = c.createLinearGradient(0, 6, 0, 122);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = edge; c.stroke();
    c.beginPath(); c.roundRect(12, 11, 104, 30, 16);
    const g2 = c.createLinearGradient(0, 11, 0, 41);
    g2.addColorStop(0, 'rgba(255,255,255,0.5)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2; c.fill();
    c.beginPath(); c.roundRect(10, 92, 108, 28, 14);
    const g3 = c.createLinearGradient(0, 92, 0, 120);
    g3.addColorStop(0, 'rgba(0,0,0,0)'); g3.addColorStop(1, 'rgba(60,40,10,0.22)');
    c.fillStyle = g3; c.fill();
  });
  tileTex('tile0', '#f7f1e2', '#dfd3b8', '#b8a67f');
  tileTex('tile1', '#ffe9a8', '#e8b84b', '#a97c1c');
  tileTex('tile2', '#e6f6ff', '#a8d9f2', '#5f9fc4');
  mk('veil', 8, 8, (c, w, h) => { c.fillStyle = '#060812'; c.fillRect(0, 0, w, h); });
  mk('panel', 256, 256, (c) => {
    c.beginPath(); c.roundRect(4, 4, 248, 248, 22);
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#f8f2e4'); g.addColorStop(1, '#e4d7ba');
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#a98d51'; c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = '#ffffffaa';
    c.beginPath(); c.roundRect(8, 8, 240, 240, 18); c.stroke();
  });
  mk('btn', 256, 96, (c) => {
    c.beginPath(); c.roundRect(4, 4, 248, 88, 46);
    const g = c.createLinearGradient(0, 4, 0, 92);
    g.addColorStop(0, '#ffdf8f'); g.addColorStop(0.5, '#f0b93e'); g.addColorStop(1, '#c98f1d');
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#8a6210'; c.stroke();
    c.beginPath(); c.roundRect(14, 10, 228, 34, 20);
    const g2 = c.createLinearGradient(0, 10, 0, 44);
    g2.addColorStop(0, 'rgba(255,255,255,0.65)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2; c.fill();
  });
  mk('btndark', 256, 96, (c) => {
    c.beginPath(); c.roundRect(4, 4, 248, 88, 46);
    c.fillStyle = '#161d38'; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = '#4a5a8c'; c.stroke();
  });
}

function ssStarfield(scene, count) {
  const W = scene.scale.width, H = scene.scale.height;
  for (let i = 0; i < count; i++) {
    const st = scene.add.image(Math.random() * W, Math.random() * H, 'dot')
      .setScale(0.3 + Math.random() * 0.8).setAlpha(0.15 + Math.random() * 0.5).setTint(0xcfd8ff);
    scene.tweens.add({ targets: st, alpha: 0.08 + Math.random() * 0.2, duration: 1200 + Math.random() * 2600, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
  }
}

function ssShootingStars(scene) {
  const fire = () => {
    if (!scene.scene.isActive()) return;
    const W = scene.scale.width, H = scene.scale.height;
    const x = Math.random() * W * 0.8, y = scene.cameras.main.scrollY + Math.random() * H * 0.35;
    const s = scene.add.image(x, y, 'dot').setScale(1.1).setTint(0xfff2c9).setBlendMode('ADD').setDepth(1);
    const trail = [];
    for (let i = 0; i < 7; i++) trail.push(scene.add.image(x, y, 'dot').setScale(0.7 - i * 0.08).setAlpha(0.5 - i * 0.06).setTint(0xcfe0ff).setBlendMode('ADD').setDepth(1));
    const dx = 200 + Math.random() * 240, dy = 90 + Math.random() * 120;
    scene.tweens.add({
      targets: s, x: x + dx, y: y + dy, alpha: 0, duration: 800, ease: 'Cubic.easeOut',
      onUpdate: () => { for (let i = trail.length - 1; i > 0; i--) { trail[i].x = trail[i - 1].x; trail[i].y = trail[i - 1].y; } trail[0].x = s.x; trail[0].y = s.y; },
      onComplete: () => { s.destroy(); trail.forEach((t) => t.destroy()); },
    });
  };
  scene.time.addEvent({ delay: 4200 + Math.random() * 4000, loop: true, callback: fire });
}

/* ============================================================
   THE ASCENT — one vertical world, meadow at the bottom, the
   battle sky at the zenith. Camera rises 2 frames (design
   worldY 0..2400; home frame = 1600..2400; zenith = 0..800,
   drawn at l.y(d) - 1600s so the battle handoff is invisible).
   Spec: SKY-DESIGN.md · demo: ascent.html (curve ported 1:1).
   ============================================================ */
const ASC = { DIP_MS: 260, TOTAL_MS: 2600, DESCEND_MS: 1150 };
const ssReduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
// dip → rise → settle with overshoot; p: 0 = meadow, 1 = zenith
function ssAscentP(ms) {
  const easeOutSine = (t) => Math.sin(t * Math.PI / 2);
  const quint = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
  if (ms <= ASC.DIP_MS) return -0.011 * easeOutSine(ms / ASC.DIP_MS);
  const u = Math.min(1, (ms - ASC.DIP_MS) / (ASC.TOTAL_MS - ASC.DIP_MS));
  const q = quint(u);
  const bump = u > 0.82 ? 0.009 * Math.sin(Math.min(1, (u - 0.82) / 0.18) * Math.PI) : 0;
  return -0.011 * (1 - Math.min(1, u * 3)) + q + bump;
}

function ssSkyTextures(scene) {
  const mk = (key, w, h, fn) => {
    if (scene.textures.exists(key)) return;
    const t = scene.textures.createCanvas(key, w, h);
    fn(t.context, w, h); t.refresh();
  };
  mk('skygrad', 64, 1024, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    [[0, '#0a0d1c'], [0.09, '#0a0d1c'], [0.27, '#10142e'], [0.43, '#1c2350'], [0.575, '#3a3068'],
     [0.685, '#6b4585'], [0.76, '#a05a8c'], [0.805, '#c96a8e'], [0.83, '#f0997a'], [0.846, '#ffc98a'],
     [0.852, '#ffe4b0'], [0.86, '#0c0918'], [1, '#070510']].forEach(([p, col]) => g.addColorStop(p, col));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // banding law: ±1.5 RGB scanline dither — grain is what makes it look expensive
    const im = c.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) {
      const row = (Math.random() - 0.5) * 3;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, px = row + (Math.random() - 0.5) * 1.5;
        d[i] += px; d[i + 1] += px; d[i + 2] += px;
      }
    }
    c.putImageData(im, 0, 0);
  });
  mk('grain', 128, 128, (c, w, h) => {
    const im = c.createImageData(w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    c.putImageData(im, 0, 0);
  });
  mk('moon', 144, 144, (c, w, h) => {
    c.translate(w / 2, h / 2);
    c.fillStyle = 'rgba(247,232,200,0.07)';                       // earthshine disk
    c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f7e8c8';
    c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out';                // bite = the crescent
    c.beginPath(); c.arc(31, -24, 53, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(247,232,200,0.06)';
    c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fill();
  });
  mk('cloudwisp', 256, 80, (c, w, h) => {
    const blob = (cx, cy, rx, ry, col, a) => {
      c.save(); c.translate(cx, cy); c.scale(rx / 40, ry / 40);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 40);
      g.addColorStop(0, col.replace('A', String(a))); g.addColorStop(1, col.replace('A', '0'));
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 40, 0, Math.PI * 2); c.fill(); c.restore();
    };
    blob(128, 46, 120, 26, 'rgba(20,16,40,A)', 0.9);               // dark body
    blob(88, 50, 70, 18, 'rgba(20,16,40,A)', 0.7);
    blob(120, 30, 90, 12, 'rgba(255,228,176,A)', 0.16);            // moonlit top edge
  });
  mk('spark4', 64, 64, (c, w, h) => {                              // hero-star diffraction cross
    const arm = (ang) => {
      c.save(); c.translate(w / 2, h / 2); c.rotate(ang);
      const g = c.createLinearGradient(-30, 0, 30, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(-30, -1.2, 60, 2.4); c.restore();
    };
    arm(0); arm(Math.PI / 2);
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 7);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(w / 2 - 7, h / 2 - 7, 14, 14);
  });
  mk('grasstrip', 512, 32, (c, w, h) => {   // 512x32: POT both ways — WebGL1 iPhones can't REPEAT an NPOT texture
    c.fillStyle = '#050310';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 9) c.lineTo(x + Math.random() * 5, 8 + Math.random() * 19);
    c.lineTo(w, h); c.closePath(); c.fill();
    for (let i = 0; i < 4; i++) {                                  // wildflower silhouettes
      const x = 30 + Math.random() * (w - 60), top = 2 + Math.random() * 6;
      c.strokeStyle = '#050310'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x, h); c.quadraticCurveTo(x + 3, h - 14, x, top + 5); c.stroke();
      c.fillStyle = '#050310'; c.beginPath(); c.arc(x, top + 4, 3.2, 0, Math.PI * 2); c.fill();
    }
  });
}

const SS_STAR_COLORS = [0xcfd8ff, 0xcfd8ff, 0xcfd8ff, 0xffe9c9, 0xffd1dc, 0xc9fff2];
function ssSkyWorld(scene) {
  const l = ssLayout(scene);
  ssSkyTextures(scene);
  const T = 1600 * l.s;                                            // camera travel, px
  const wy = (d) => l.y(d - 1600);                                 // worldY (0..2400) → scene y

  // master gradient: spans the whole column, zenith top pinned to the game bg
  scene.add.image(l.W / 2, wy(0), 'skygrad').setOrigin(0.5, 0).setDisplaySize(l.W, 2400 * l.s);
  scene.add.rectangle(l.W / 2, l.y(800), l.W, Math.max(1, l.H - l.y(800)) + 120 * l.s, 0x070510).setOrigin(0.5, 0);

  // aurora — lives at the zenith; one faint teal tease bleeds into the meadow sky
  for (const [tint, dx, dy, a] of [[0x2fe0d0, -120, 160, 0.055], [0x8a5ae0, 130, 120, 0.055], [0xd7b45c, 0, 640, 0.055], [0x2fe0d0, 40, 1660, 0.03]]) {
    const g = scene.add.image(l.x(dx), wy(dy), 'glowbig').setScale(l.u(2.6)).setTint(tint).setAlpha(a).setBlendMode('ADD');
    scene.tweens.add({ targets: g, x: g.x + l.u(30), y: g.y - l.u(20), scale: l.u(3.1), duration: 7000 + Math.random() * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // star tiers — density ramps toward the zenith end of each parallax span
  const tier = (f, n, s0, s1, twinkle) => {
    const out = [], top = -T * f, span = T * f + l.H;
    for (let i = 0; i < n; i++) {
      const y = top + Math.pow(Math.random(), 1.8) * span;
      const sc = (s0 + Math.random() * (s1 - s0)) * l.s;
      const baseA = 0.25 + Math.random() * 0.55;
      const st = scene.add.image(Math.random() * l.W, y, 'dot')
        .setScale(sc).setAlpha(baseA).setTint(SS_STAR_COLORS[Math.floor(Math.random() * SS_STAR_COLORS.length)])
        .setScrollFactor(1, f);
      st.baseS = sc; st.baseA = baseA;
      if (twinkle && Math.random() < 0.5)
        scene.tweens.add({ targets: st, alpha: baseA * 0.35, duration: 1600 + Math.random() * 2600, yoyo: true, repeat: -1, delay: Math.random() * 2500 });
      out.push(st);
    }
    return out;
  };
  tier(0.55, 110, 0.28, 0.5, true);
  const tierM = tier(0.70, 75, 0.42, 0.68, true);
  const tierN = tier(0.85, 48, 0.66, 0.95, false);
  tierN.forEach((st) => st.setBlendMode('ADD'));

  // hero stars — the ones a player would wish on, in the meadow's dusk sky
  for (let i = 0; i < 6; i++) {
    const hs = scene.add.image(l.x(-190 + Math.random() * 380), l.y(50 + Math.random() * 320), 'spark4')
      .setScale(l.u(0.22 + Math.random() * 0.16)).setAlpha(0.6).setBlendMode('ADD').setScrollFactor(1, 0.85);
    scene.tweens.add({ targets: hs, angle: 360, duration: 42000 + Math.random() * 40000, repeat: -1 });
    scene.tweens.add({ targets: hs, alpha: 0.45, duration: 2200 + Math.random() * 1800, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
  }

  // moon — low on the horizon's left shoulder, clear of the buttons,
  // slides down and out during the first half of the rise
  const moon = scene.add.image(l.x(-140), l.y(425), 'moon').setScale(l.u(0.72)).setAngle(24).setScrollFactor(1, 0.85);
  const halo = scene.add.image(moon.x, moon.y, 'glowbig').setScale(l.u(0.95)).setTint(0xf7e8c8).setAlpha(0.14).setBlendMode('ADD').setScrollFactor(1, 0.85);
  scene.tweens.add({ targets: halo, alpha: 0.1, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // clouds — parked in the climb band, crossed mid-flight
  for (const [cx, cy, cw, chh] of [[-51, -650, 242, 43], [108, -475, 280, 50], [-121, -313, 229, 38]]) {
    const c = scene.add.image(l.x(cx), l.y(cy), 'cloudwisp').setDisplaySize(l.u(cw), l.u(chh)).setAlpha(0.55);
    scene.tweens.add({ targets: c, x: c.x + l.u(20), duration: 6000 + Math.random() * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // the meadow: hills, ground, swaying grass, fireflies
  scene.add.ellipse(l.x(-108), l.y(545), l.u(432), l.u(250), 0x141026);
  scene.add.ellipse(l.x(184), l.y(607), l.u(534), l.u(325), 0x0c0918);
  scene.add.rectangle(l.W / 2, l.y(553), l.W, Math.max(1, l.H - l.y(553)) + 120 * l.s, 0x0a0714).setOrigin(0.5, 0);
  const grassY = Math.max(l.y(772), l.H - l.u(30));
  for (const [off, ph] of [[0, 0], [l.u(5), 1300]]) {
    const gr = scene.add.tileSprite(l.W / 2, grassY + off, l.W, l.u(32), 'grasstrip').setOrigin(0.5, 0);
    gr.setTileScale(l.s); gr.tilePositionX = off * 20;
    scene.tweens.add({ targets: gr, x: gr.x + l.u(1.5), duration: 2600, yoyo: true, repeat: -1, delay: ph, ease: 'Sine.easeInOut' });
  }
  const flies = [];
  for (let i = 0; i < 12; i++) {
    const f = scene.add.image(l.x(-180 + Math.random() * 360), l.y(600 + Math.random() * 165), 'dot')
      .setScale(l.u(0.22 + Math.random() * 0.14)).setTint(0xffdf8f).setBlendMode('ADD').setAlpha(0);
    scene.tweens.add({ targets: f, alpha: 0.85, duration: 1700 + Math.random() * 1700, yoyo: true, repeat: -1, delay: Math.random() * 3000 });
    scene.tweens.add({ targets: f, x: f.x + l.u(-14 + Math.random() * 28), y: f.y - l.u(6 + Math.random() * 10), duration: 2600 + Math.random() * 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    flies.push(f);
  }

  // film grain over everything — fixed to the camera
  scene.add.tileSprite(l.W / 2, l.H / 2, l.W, l.H, 'grain').setScrollFactor(0).setAlpha(0.04).setDepth(500);

  // camera driver: p 0 = meadow · 1 = zenith; vel drives the star-stretch
  const setP = (p, vel) => {
    scene.cameras.main.scrollY = -p * T;
    const kN = Math.min(2.2, 1 + (vel || 0) * 560), kM = Math.min(1.6, 1 + (vel || 0) * 280);
    for (const st of tierN) { st.setScale(st.baseS, st.baseS * kN); if (kN > 1.01) st.setAlpha(Math.min(1, st.baseA + (kN - 1) * 0.17)); }
    for (const st of tierM) st.setScale(st.baseS, st.baseS * kM);
  };
  const scatterFlies = () => {
    for (const f of flies) {
      scene.tweens.killTweensOf(f);
      scene.tweens.add({ targets: f, y: f.y - l.u(90 + Math.random() * 80), alpha: 0, duration: 700 + Math.random() * 500, ease: 'Sine.easeOut' });
    }
  };
  return { setP, scatterFlies, T };
}

// Assemble a constellation inside a container: stars fly in, lines fade up.
function ssAssembleBeast(scene, cont, beast, unitScale, onDone) {
  cont.removeAll(true);
  const sc = unitScale * (beast.boss ? 1.15 : 1);
  const g = scene.add.graphics().setAlpha(0);
  g.lineStyle(unitScale * 1.25, 0xffffff, 0.35);
  for (const [a, b] of beast.edges) g.lineBetween(beast.stars[a][0] * sc, beast.stars[a][1] * sc, beast.stars[b][0] * sc, beast.stars[b][1] * sc);
  cont.add(g);
  const stars = [];
  beast.stars.forEach((p, i) => {
    const big = i % 3 === 0;
    const ang = Math.random() * Math.PI * 2, d = 260 * unitScale + Math.random() * 200;
    const st = scene.add.image(p[0] * sc + Math.cos(ang) * d, p[1] * sc + Math.sin(ang) * d, 'dot')
      .setScale(0.1).setAlpha(0).setTint(beast.tint).setBlendMode('ADD');
    cont.add(st); stars.push(st);
    scene.tweens.add({
      targets: st, x: p[0] * sc, y: p[1] * sc, alpha: 1, scale: big ? 1.1 : 0.7,
      delay: i * 40, duration: 620, ease: 'Cubic.easeOut',
      onComplete: () => scene.tweens.add({ targets: st, scale: (big ? 1.1 : 0.7) * 0.75, duration: 900 + (i * 137) % 900, yoyo: true, repeat: -1 }),
    });
  });
  const eyes = [];
  scene.time.delayedCall(beast.stars.length * 40 + 500, () => {
    scene.tweens.add({ targets: g, alpha: 1, duration: 500 });
    for (const e of beast.eyes) {
      const eye = scene.add.image(e[0] * sc, e[1] * sc, 'dot').setScale(0.9).setTint(beast.eye).setBlendMode('ADD').setAlpha(0);
      cont.add(eye); eyes.push(eye);
      scene.tweens.add({ targets: eye, alpha: 1, duration: 400 });
      scene.tweens.add({ targets: eye, alpha: 0.5, duration: 700, yoyo: true, repeat: -1, delay: 500 });
    }
    if (SFX.ok) SFX.noise(0.7, 800, 2, 0.05, 2600);
    if (onDone) onDone();
  });
  return { lines: g, stars, eyes };
}

function ssTxt(scene, x, y, str, size, color, style) {
  return scene.add.text(x, y, str, {
    fontFamily: SERIF, fontSize: size + 'px', color: color || '#f0e8d2', fontStyle: style || 'bold',
  }).setShadow(0, size * 0.07, '#000000', size * 0.25);
}

// Layout: 420 x 800 design space, scaled + centered
function ssLayout(scene) {
  const W = scene.scale.width, H = scene.scale.height;
  const s = Math.min(W / 420, H / 800);
  return { W, H, s, x: (d) => W / 2 + d * s, y: (d) => H / 2 + (d - 400) * s, u: (d) => d * s };
}

// achievement toast, usable from any scene
function ssAchToast(scene, def) {
  const l = ssLayout(scene);
  const c = scene.add.container(l.x(0), l.y(-40)).setDepth(400);
  const bg = scene.add.image(0, 0, 'btn').setDisplaySize(l.u(300), l.u(58));
  const t1 = ssTxt(scene, 0, -l.u(10), '✦ ' + def.name + ' ✦', l.u(15), '#4a3305').setOrigin(0.5);
  const t2 = ssTxt(scene, 0, l.u(12), def.desc, l.u(10), '#6a5a35', 'italic').setOrigin(0.5);
  c.add([bg, t1, t2]);
  scene.tweens.add({ targets: c, y: l.y(52), duration: 450, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: c, alpha: 0, delay: 2600, duration: 400, onComplete: () => c.destroy() });
}

/* ============================================================
   HOME — a twilight meadow at the bottom of the world column.
   Entering a battle rises through the dusk to the zenith.
   ============================================================ */
let PENDING_ASCENT = null;   // survives a mid-ascent resize-restart: finish to battle
class Home extends Phaser.Scene {
  constructor() { super('home'); }
  create() {
    if (PENDING_ASCENT) { DIAG('restart mid-ascent → straight to battle'); const d = PENDING_ASCENT; PENDING_ASCENT = null; this.scene.start('battle', d); return; }
    const l = ssLayout(this);
    ssMakeTextures(this);
    this.sky = ssSkyWorld(this);
    ssShootingStars(this);
    this.uiItems = [];
    this.ascending = false; this.descending = false; this.arrived = false;
    const ui = (o) => { this.uiItems.push(o); return o; };

    // beast showcase — tonight's hunt, rising in the dusk sky
    this.showC = this.add.container(l.x(0), l.y(150));
    const ids = Object.keys(SS_BEASTS);
    let showIdx = Math.floor(Math.random() * ids.length);
    const cycle = () => {
      if (!this.scene.isActive()) return;
      ssAssembleBeast(this, this.showC, SS_BEASTS[ids[showIdx % ids.length]], l.u(0.8));
      showIdx++;
    };
    cycle();
    this.time.addEvent({ delay: 9000, loop: true, callback: () => { this.tweens.add({ targets: this.showC, alpha: 0, duration: 500, onComplete: () => { this.showC.setAlpha(1); cycle(); } }); } });

    // title — just above the horizon glow, which acts as its halo
    const title = ui(ssTxt(this, l.x(0), l.y(300), 'STARSPELL', l.u(46), '#f3e5b4').setOrigin(0.5)
      .setShadow(0, 0, '#c9a94f', l.u(18), true, true));
    this.tweens.add({ targets: title, scale: 1.02, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    ui(ssTxt(this, l.x(0), l.y(354), 'weave words · fell the star-beasts', l.u(12), '#8a94c4', 'italic').setOrigin(0.5));

    // buttons
    const ck = this.campaignCheckpoint();
    const today = SS.prof.daily[String(SSNET.dayKey())];
    const rows = [
      { y: 420, label: ck ? 'CONTINUE  ·  ' + SS_ACTS[ck.actIdx].name.split('·')[0].trim() : 'CAMPAIGN', sub: ck ? 'fight ' + (ck.fightIdx % 5 + 1) + ' of 5' : 'three acts · one long night', fn: () => this.startMode('campaign') },
      { y: 488, label: 'QUICK PLAY', sub: 'five beasts, then the Star Eater', fn: () => this.startMode('quick') },
      { y: 556, label: 'DAILY HUNT', sub: today ? 'today: ' + today + ' — again for glory' : 'one sky, shared by all', fn: () => this.startMode('daily') },
      { y: 624, label: 'LEADERBOARD', sub: null, fn: () => { SFX.ui(); this.scene.start('board'); }, dark: true },
      { y: 692, label: 'PROFILE', sub: null, fn: () => { SFX.ui(); this.scene.start('profile'); }, dark: true },
    ];
    for (const r of rows) {
      const b = ui(this.add.image(l.x(0), l.y(r.y), r.dark ? 'btndark' : 'btn').setDisplaySize(l.u(300), l.u(r.sub ? 58 : 46)).setInteractive({ useHandCursor: true }));
      ui(ssTxt(this, l.x(0), l.y(r.y - (r.sub ? 9 : 0)), r.label, l.u(16), r.dark ? '#9fb0e8' : '#4a3305').setOrigin(0.5));
      if (r.sub) ui(ssTxt(this, l.x(0), l.y(r.y + 13), r.sub, l.u(10), r.dark ? '#5a6390' : '#7a6535', 'italic').setOrigin(0.5));
      b.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); this.bloomBtn = b; r.fn(); });
      b.on('pointerover', () => b.setScale(b.scaleX * 1.03, b.scaleY * 1.03));
      b.on('pointerout', () => b.setDisplaySize(l.u(300), l.u(r.sub ? 58 : 46)));
    }
    // versus
    const vs = ui(ssTxt(this, l.x(0), l.y(742), '⚔  VERSUS — duel beneath the stars  ⚔', l.u(13), '#9fb0e8').setOrigin(0.5).setInteractive({ useHandCursor: true }));
    vs.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); SFX.ui(); this.scene.start('vsmenu'); });
    this.tweens.add({ targets: vs, alpha: 0.65, duration: 1400, yoyo: true, repeat: -1 });

    ui(ssTxt(this, l.x(0), l.y(784), BUILD + ' · Corkscrew Games' + (SSNET.mode === 'local' ? ' · offline' : ''), l.u(9), '#39406b').setOrigin(0.5));
    this.muteB = ui(ssTxt(this, l.x(-195), l.y(784), SFX.muted ? '🔇' : '🔊', l.u(14)).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7));
    this.muteB.on('pointerdown', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });

    this.input.once('pointerdown', () => SFX.ensure());
    this.events.on('ss-achproxy', (def) => ssAchToast(this, def));

    // crickets sing while we stand in the grass
    SFX.crickets(true);
    this.events.once('shutdown', () => SFX.crickets(false));

    // arriving from a battle: descend home · from defeat: wake up on the grass
    const entry = (this.scene.settings.data || {}).from;
    if (entry === 'battle') this.descendHome(l);
    else if (entry === 'defeat') {
      const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(600);
      this.tweens.add({ targets: veil, alpha: 0, duration: 350, onComplete: () => veil.destroy() });
    }

    localStorage.setItem('beta3.boot', BUILD);
    console.log(BUILD);
    DIAG(BUILD + ' · ' + (this.game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas') + ' ' + this.game.scale.width + 'x' + this.game.scale.height + ' dprCap ' + DPR);
    if (QS.get('vsdemo') === '1') this.time.delayedCall(500, () => this.scene.start('vsmenu'));
    else if (DEMO || QS.get('daily') === '1') this.time.delayedCall(400, () => this.startMode(DEMO ? 'quick' : 'daily'));
  }
  campaignCheckpoint() {
    try { return JSON.parse(localStorage.getItem('beta3.campaign')); } catch (e) { return null; }
  }
  busy() { return this.ascending || this.descending; }
  startMode(mode) {
    if (this.busy()) return;
    SFX.ui();
    const resume = mode === 'campaign' ? this.campaignCheckpoint() : null;
    this.beginAscent({ mode, resume, ascended: true });
  }

  /* ---------- the rise (SKY-DESIGN §5) ---------- */
  beginAscent(data) {
    this.ascending = true;
    PENDING_ASCENT = data;
    DIAG('ascent begin (' + data.mode + ')');
    try {
      const l = ssLayout(this);
      SFX.crickets(false); SFX.riser();
      this.sky.scatterFlies();
      for (const o of this.uiItems) this.tweens.killTweensOf(o);
      if (this.bloomBtn) this.tweens.add({ targets: this.bloomBtn, scale: { from: this.bloomBtn.scaleX, to: this.bloomBtn.scaleX * 1.08 }, duration: 130, yoyo: true });
      this.tweens.add({ targets: this.uiItems, alpha: 0, duration: 300 });
      if (ssReduceMotion()) {
        DIAG('ascent: reduce-motion is ON → veil crossfade instead of the rise');
        const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setAlpha(0).setDepth(600);
        this.tweens.add({ targets: veil, alpha: 1, duration: 200, onComplete: () => this.arrive() });
        return;
      }
      this.ascentStart = this.time.now;
      this.skipAt = null; this.lastP = 0; this.lastT = this.time.now;
      // arm the tap-to-skip only after the launching tap has fully cleared —
      // Phaser delivers the button's own pointerdown to scene listeners added
      // during dispatch, so arming immediately made every real tap self-skip
      this.time.delayedCall(400, () => {
        if (!this.ascending || this.arrived) return;
        this.input.on('pointerdown', this.skipFn = () => { if (this.ascending && !this.skipAt) this.skipAt = ASC.TOTAL_MS - 220; });
      });
      if (DEMO) this.skipAt = ASC.TOTAL_MS - 220;   // the solver has no time for wonder
    } catch (e) {
      this.fallbackToBattle(e);                      // the rise must never strand the player
    }
  }
  fallbackToBattle(e) {
    DIAG('ascent FALLBACK: ' + (e && e.message || '?'));
    const data = PENDING_ASCENT || { mode: 'quick', resume: null };
    PENDING_ASCENT = null;
    this.arrived = true;
    this.scene.start('battle', data);
  }
  update(time) {
    if (!this.ascending || this.arrived || !this.ascentStart) return;
    try {
      let ms = time - this.ascentStart;
      if (this.skipAt && ms < this.skipAt) { this.ascentStart = time - this.skipAt; ms = this.skipAt; }
      if (ms >= ASC.TOTAL_MS) { this.arrive(); return; }
      const p = ssAscentP(ms);
      const vel = Math.max(0, (p - this.lastP) / Math.max(1, time - this.lastT));
      this.sky.setP(p, vel);
      this.lastP = p; this.lastT = time;
    } catch (e) {
      this.fallbackToBattle();
    }
  }
  arrive() {
    if (this.arrived) return;
    this.arrived = true;
    DIAG('ascent arrive' + (this.skipAt ? ' (skipped)' : ''));
    if (this.skipFn) this.input.off('pointerdown', this.skipFn);
    SFX.arriveChime();                              // the hush, then the forge voice
    const data = PENDING_ASCENT; PENDING_ASCENT = null;
    try {
      this.sky.setP(1, 0);
      localStorage.setItem('beta3.ascent', JSON.stringify({ v: BUILD, skipped: !!this.skipAt, t: Date.now() }));
      this.scene.transition({ target: 'battle', duration: 450, data, moveAbove: true });
    } catch (e) {
      this.scene.start('battle', data);
    }
  }

  /* ---------- the way back down ---------- */
  descendHome(l) {
    this.descending = true;
    this.sky.setP(1, 0);
    SFX.descendSweep();
    this.tweens.addCounter({
      from: 1, to: 0, duration: ASC.DESCEND_MS, ease: 'Cubic.easeInOut',
      onUpdate: (tw) => this.sky.setP(tw.getValue(), 0),
      onComplete: () => { this.descending = false; this.sky.setP(0, 0); SFX.crickets(true); },
    });
  }
}

/* ============================================================
   BATTLE — one scene, three modes
   ============================================================ */
class Battle extends Phaser.Scene {
  constructor() { super('battle'); }
  init(data) { this.mode = data.mode || 'quick'; this.resume = data.resume || null; this.ascended = !!data.ascended; }

  create() {
    const l = this.L = ssLayout(this);
    ssMakeTextures(this);
    if (this.ascended) {   // arriving from the rise: fade in over the zenith — bg matches, no pop
      this.cameras.main.setAlpha(0);
      this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 420, ease: 'Sine.easeOut' });
    }
    ssStarfield(this, 110);
    ssShootingStars(this);
    for (const [tint, dx, dy] of [[0x2fe0d0, -140, 140], [0x8a5ae0, 140, 620]]) {
      const a = this.add.image(l.x(dx), l.y(dy), 'glowbig').setScale(l.u(2.2)).setTint(tint).setAlpha(0.04).setBlendMode('ADD');
      this.tweens.add({ targets: a, x: a.x + l.u(24), scale: l.u(2.6), duration: 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ---- build the fight list ----
    if (this.mode === 'daily') setSeed(SSNET.dayKey());
    else setSeed(Math.floor(Math.random() * 1e9));
    this.fights = [];
    if (this.mode === 'campaign') {
      SS_ACTS.forEach((act, ai) => act.fights.forEach((id, fi) => this.fights.push({ id, actIdx: ai, mult: act.mult, atkAdd: act.atkAdd, umbral: act.umbral, actStart: fi === 0 })));
    } else {
      const pool = [...SS_QUICK_POOL];
      for (let i = 0; i < 4; i++) this.fights.push({ id: pool.splice(Math.floor(rng() * pool.length), 1)[0], actIdx: 0, mult: 1 + i * 0.12, atkAdd: Math.floor(i / 2), umbral: false });
      this.fights.push({ id: SS_QUICK_BOSS, actIdx: 0, mult: 1, atkAdd: 0, umbral: false });
    }

    // ---- run state ----
    this.run = this.resume ? {
      fightIdx: this.resume.fightIdx, hpMax: this.resume.hpMax, hp: this.resume.hp,
      sigils: this.resume.sigils || [], words: this.resume.words | 0, longest: this.resume.longest || '',
      totalDmg: this.resume.totalDmg | 0, scried: !!this.resume.scried, featherUsed: !!this.resume.featherUsed,
    } : { fightIdx: 0, hpMax: 50, hp: 50, sigils: [], words: 0, longest: '', totalDmg: 0, scried: false, featherUsed: false };
    this.run.firstUsed = false;
    this.state = 'boot';
    this.board = []; this.sel = []; this.lineTiles = [];
    SS.prof.runs++; SS.save();

    this.buildUi();
    this.startFight();

    if (DEMO) this.demoTimer = this.time.addEvent({ delay: 1400, loop: true, callback: () => this.demoStep() });
    this.input.on('pointerdown', () => SFX.ensure());
    this.game.events.on('ss-ach', this.onAch, this);
    this.events.once('shutdown', () => this.game.events.off('ss-ach', this.onAch, this));
  }
  onAch(def) { ssAchToast(this, def); }

  // ---------- ui ----------
  buildUi() {
    const l = this.L;
    const txt = (x, y, s, size, color, style) => ssTxt(this, x, y, s, l.u(size), color, style);

    this.headT = txt(l.x(0), l.y(24), this.modeTitle(), 13, '#c9b676').setOrigin(0.5).setAlpha(0.9);
    this.pips = [];
    const nP = this.mode === 'campaign' ? 5 : this.fights.length;
    for (let i = 0; i < nP; i++) this.pips.push(this.add.image(l.x(-40 + i * 20), l.y(46), 'dot').setScale(0.6).setTint(0x4a5480));
    this.scoreT = txt(l.x(190), l.y(24), '0', 15).setOrigin(1, 0.5);

    txt(l.x(-190), l.y(68), 'YOU', 12, '#c9b676').setOrigin(0, 0.5);
    this.hpBarBg = this.add.rectangle(l.x(-150), l.y(68), l.u(250), l.u(9), 0x1a2038).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(l.x(-150), l.y(68), l.u(250), l.u(9), 0xd7b45c).setOrigin(0, 0.5);
    this.hpT = txt(l.x(190), l.y(68), '', 12).setOrigin(1, 0.5);

    this.beastC = this.add.container(l.x(0), l.y(170));
    this.beastName = txt(l.x(0), l.y(280), '', 17, '#ffffff').setOrigin(0.5);
    this.beastTitle = txt(l.x(0), l.y(300), '', 11, '#8a94c4').setOrigin(0.5);
    this.ehpBarBg = this.add.rectangle(l.x(-110), l.y(322), l.u(220), l.u(8), 0x1a2038).setOrigin(0, 0.5);
    this.ehpBar = this.add.rectangle(l.x(-110), l.y(322), l.u(220), l.u(8), 0xe66a6a).setOrigin(0, 0.5);
    this.strikeT = txt(l.x(0), l.y(342), '', 12, '#e6a2a2').setOrigin(0.5);

    this.lineC = this.add.container(l.x(0), l.y(372));
    this.lineHint = txt(l.x(0), l.y(372), 'tap letters to weave a word', 12, '#5a6390').setOrigin(0.5).setAlpha(0.9);

    this.boardC = this.add.container(0, 0);
    this.tileSize = l.u(78); this.tileGap = l.u(8);
    this.slotPos = (i) => ({
      x: l.x(0) + ((i % 4) - 1.5) * (this.tileSize + this.tileGap),
      y: l.y(556) + (Math.floor(i / 4) - 1.5) * (this.tileSize + this.tileGap),
    });

    this.castB = this.add.image(l.x(70), l.y(754), 'btn').setDisplaySize(l.u(180), l.u(56)).setInteractive({ useHandCursor: true });
    this.castT = txt(l.x(70), l.y(754), 'CAST', 20, '#4a3305').setOrigin(0.5).setShadow(0, l.u(1), '#ffe9b0', l.u(1));
    this.castB.on('pointerdown', () => this.tryCast());
    this.scryB = this.add.rectangle(l.x(-150), l.y(754), l.u(100), l.u(50), 0x151b33).setStrokeStyle(l.u(1.5), 0x4a5a8c).setInteractive({ useHandCursor: true });
    txt(l.x(-150), l.y(754), 'SCRY ↻', 14, '#9fb0e8').setOrigin(0.5);
    this.scryB.on('pointerdown', () => this.scry());
    this.hintB = this.add.rectangle(l.x(-62), l.y(754), l.u(50), l.u(50), 0x151b33).setStrokeStyle(l.u(1.5), 0x8c7a4a).setInteractive({ useHandCursor: true }).setVisible(false);
    this.hintT = txt(l.x(-62), l.y(754), '◉', 18, '#d7b45c').setOrigin(0.5).setVisible(false);
    this.hintB.on('pointerdown', () => this.useHint());

    this.homeB = txt(l.x(-195), l.y(24), '‹', 22, '#5a6390').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    this.homeB.on('pointerdown', () => { SFX.ui(); this.scene.start('home', { from: 'battle' }); });
    this.muteB = txt(l.x(-195), l.y(784), SFX.muted ? '🔇' : '🔊', 14).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7);
    this.muteB.on('pointerdown', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });
    txt(l.x(195), l.y(784), BUILD, 9, '#39406b').setOrigin(1, 0.5);

    this.fxC = this.add.container(0, 0).setDepth(50);
    this.starBurst = this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 320 }, lifespan: { min: 300, max: 800 }, scale: { start: 0.9, end: 0 },
      blendMode: 'ADD', emitting: false,
    }).setDepth(60);
    this.goldRain = this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: this.scale.width }, y: -20,
      speedY: { min: 120, max: 260 }, speedX: { min: -30, max: 30 },
      lifespan: 2200, scale: { start: 0.7, end: 0.1 }, quantity: 2,
      tint: [0xffd77a, 0xfff2c9, 0xd7b45c], blendMode: 'ADD', emitting: false,
    }).setDepth(55);
    this.overlayC = this.add.container(0, 0).setDepth(100);
  }
  modeTitle() {
    if (this.mode === 'campaign') return SS_ACTS[this.fights[this.run.fightIdx].actIdx].name;
    if (this.mode === 'daily') return '☀ DAILY HUNT · ' + SSNET.dayKey();
    return 'QUICK PLAY';
  }

  // ---------- board ----------
  boardVowels() { return this.board.filter((s) => s && VOWELS.includes(s.ch[0])).length; }
  fillBoard(initial) {
    for (let i = 0; i < 16; i++) {
      if (this.board[i]) continue;
      let ch = rpick(BAG);
      if (this.boardVowels() < 5 && !VOWELS.includes(ch)) ch = rpick(['a', 'e', 'i', 'o', 'u']);
      if (ch === 'q') ch = 'qu';
      let tier = this.pendingTier || 0;
      this.pendingTier = 0;
      this.spawnTile(i, ch, tier, initial);
    }
  }
  spawnTile(i, ch, tier, initial) {
    const l = this.L, p = this.slotPos(i);
    const c = this.add.container(p.x, p.y - (initial ? l.u(500) + i * l.u(14) : l.u(420)));
    const img = this.add.image(0, 0, 'tile' + tier).setDisplaySize(this.tileSize, this.tileSize);
    const letter = this.add.text(0, -l.u(2), ch === 'qu' ? 'Qu' : ch.toUpperCase(), {
      fontFamily: SERIF, fontSize: l.u(ch === 'qu' ? 30 : 36) + 'px', fontStyle: 'bold',
      color: tier === 2 ? '#1d4a66' : tier === 1 ? '#5a3c05' : '#3a3020',
    }).setOrigin(0.5);
    const val = this.add.text(l.u(25), l.u(21), String(this.tileVal(ch, tier)), {
      fontFamily: SERIF, fontSize: l.u(12) + 'px', fontStyle: 'bold',
      color: tier === 2 ? '#2a6a8e' : tier === 1 ? '#7a5510' : '#8d7f60',
    }).setOrigin(0.5);
    c.add([img, letter, val]);
    if (tier > 0) {
      const glow = this.add.image(0, 0, 'dot').setScale(this.tileSize / 9).setAlpha(tier === 2 ? 0.35 : 0.25)
        .setTint(tier === 2 ? 0x9fd8ff : 0xffd77a).setBlendMode('ADD');
      c.addAt(glow, 0);
    }
    c.setSize(this.tileSize, this.tileSize).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.tapTile(i));
    this.boardC.add(c);
    this.board[i] = { ch, tier, c };
    this.tweens.add({ targets: c, y: p.y, duration: initial ? 550 : 420, ease: 'Bounce.easeOut', delay: initial ? i * 45 : Math.random() * 90 });
  }
  tileVal(ch, tier) { return (VALS[ch[0]] || 1) + (ch === 'qu' ? 1 : 0) + (tier === 1 ? 6 : 0); }

  // ---------- selection ----------
  tapTile(i) {
    if (this.state !== 'pick') return;
    SFX.ensure();
    const k = this.sel.indexOf(i);
    if (k >= 0) { this.unselectFrom(k); return; }
    if (this.sel.length >= 8) return;
    this.sel.push(i);
    this.board[i].c.setAlpha(0.28);
    SFX.chime(this.sel.length - 1);
    this.layoutLine();
  }
  unselectFrom(k) {
    if (!this.sel.length) return;
    SFX.unchime();
    const removed = this.sel.splice(k);
    for (const i of removed) if (this.board[i]) this.board[i].c.setAlpha(1);
    this.layoutLine();
  }
  currentWord() { return this.sel.map((i) => this.board[i].ch).join(''); }
  layoutLine() {
    const l = this.L;
    for (const t of this.lineTiles) t.destroy();
    this.lineTiles = [];
    const n = this.sel.length;
    this.lineHint.setAlpha(n ? 0 : 0.9);
    const word = this.currentWord();
    const valid = n >= 3 && WORDSET.has(word);
    const sz = l.u(44), gap = l.u(6);
    const w = n * sz + (n - 1) * gap;
    this.sel.forEach((bi, k) => {
      const s = this.board[bi];
      const mc = this.add.container(-w / 2 + sz / 2 + k * (sz + gap), 0);
      const img = this.add.image(0, 0, 'tile' + s.tier).setDisplaySize(sz, sz);
      const letter = this.add.text(0, 0, s.ch === 'qu' ? 'Qu' : s.ch.toUpperCase(), {
        fontFamily: SERIF, fontSize: l.u(s.ch === 'qu' ? 16 : 20) + 'px', fontStyle: 'bold',
        color: valid ? '#1d6a35' : '#3a3020',
      }).setOrigin(0.5);
      mc.add([img, letter]);
      mc.setSize(sz, sz).setInteractive({ useHandCursor: true });
      mc.on('pointerdown', () => this.unselectFrom(k));
      this.lineC.add(mc);
      this.lineTiles.push(mc);
      mc.setScale(0.6); this.tweens.add({ targets: mc, scale: 1, duration: 140, ease: 'Back.easeOut' });
    });
    this.castB.setAlpha(valid ? 1 : 0.45);
    this.castT.setAlpha(valid ? 1 : 0.5);
    this.castT.setText(valid ? 'CAST ' + this.previewDamage() : 'CAST');
  }

  // ---------- damage ----------
  hasSigil(id) { return this.run.sigils.includes(id); }
  wordDamage(tiles) {
    let base = 0, starMult = 1, vowelsN = 0, letters = 0;
    for (const s of tiles) {
      base += this.tileVal(s.ch, s.tier);
      if (s.tier === 2) starMult = 1.5;
      letters += s.ch.length;
      const c0 = s.ch[0];
      if (VOWELS.includes(c0)) vowelsN++;
      if (this.hasSigil('runes') && 'sret'.includes(c0)) base += 2;
    }
    if (this.hasSigil('choir')) base += vowelsN * 2;
    let dmg = base * (LEN_MULT[Math.min(letters, 8)] || 2.3) * starMult;
    if (this.hasSigil('quill')) dmg += 4;
    if (this.hasSigil('longbow') && letters >= 6) dmg += 12;
    if (this.hasSigil('blood')) dmg *= 1.25;
    if (this.hasSigil('first') && !this.run.firstUsed) dmg *= 2;
    return Math.round(dmg);
  }
  previewDamage() { return this.wordDamage(this.sel.map((i) => this.board[i])); }

  // ---------- fights ----------
  beastFor(f) {
    const base = SS_BEASTS[f.id];
    const b = { ...base };
    b.hp = Math.round(base.hp * f.mult);
    b.atk = base.atk + f.atkAdd;
    if (this.hasSigil('blood')) b.atk = Math.round(b.atk * 1.25);
    if (f.umbral && !base.boss) { b.tint = SS_UMBRAL.tint; b.eye = SS_UMBRAL.eye; b.name = SS_UMBRAL.prefix + base.name; }
    if (f.umbral && base.boss && f.id !== 'phoenix') { b.tint = SS_UMBRAL.tint; b.eye = SS_UMBRAL.eye; b.name = SS_UMBRAL.prefix + base.name; }
    return b;
  }
  startFight() {
    const l = this.L;
    const f = this.fights[this.run.fightIdx];
    this.beast = this.beastFor(f);
    if (this.hasSigil('hush')) this.beast.timer += 1;
    this.beast.hpNow = this.beast.hp;
    this.beast.count = this.beast.timer;
    this.run.firstUsed = false;
    this.struckThisBattle = false;
    this.shieldUsed = false;
    this.hintUsed = false;
    this.headT.setText(this.modeTitle());
    const pipBase = this.mode === 'campaign' ? Math.floor(this.run.fightIdx / 5) * 5 : 0;
    this.pips.forEach((p, i) => {
      const gi = pipBase + i;
      p.setTint(gi < this.run.fightIdx ? 0xd7b45c : gi === this.run.fightIdx ? 0xffffff : 0x4a5480)
        .setScale(gi === this.run.fightIdx ? 0.9 : 0.6);
    });
    this.beastName.setText(''); this.beastTitle.setText('');
    const asm = ssAssembleBeast(this, this.beastC, this.beast, l.u(1.15), () => {
      this.beastName.setText(this.beast.name);
      this.beastTitle.setText(this.beast.title + (this.beast.boss ? ' · BOSS' : ''));
    });
    this.beastLines = asm.lines; this.beastStars = asm.stars;
    this.breathTween = this.tweens.add({ targets: this.beastC, scaleX: 1.04, scaleY: 0.97, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.sel = [];
    for (const s of this.board) if (s) s.c.destroy();
    this.board = [];
    this.tweens.killTweensOf([this.boardC, this.lineC]);
    this.boardC.setAlpha(1); this.lineC.setAlpha(1);
    this.layoutLine();
    if (this.hasSigil('gilded')) this.pendingTier = 1;
    this.fillBoard(true);
    this.hintB.setVisible(this.hasSigil('tome')); this.hintT.setVisible(this.hasSigil('tome'));
    this.hintB.setAlpha(1); this.hintT.setAlpha(1);
    this.updateBars();
    this.state = 'pick';
  }
  updateBars() {
    const l = this.L;
    this.hpBar.width = l.u(250) * clamp(this.run.hp / this.run.hpMax, 0, 1);
    this.hpT.setText(this.run.hp + ' / ' + this.run.hpMax);
    this.ehpBar.width = l.u(220) * clamp(this.beast.hpNow / this.beast.hp, 0, 1);
    this.strikeT.setText(this.beast.hpNow > 0 ? '✦ strikes in ' + this.beast.count + (this.beast.count === 1 ? ' cast ✦' : ' casts ✦') : '');
    this.scoreT.setText(String(this.runScore()));
  }
  runScore() { return this.run.totalDmg + this.run.longest.length * 15 + this.run.fightIdx * 50; }

  // ---------- casting ----------
  tryCast() {
    if (this.state !== 'pick') return;
    const word = this.currentWord();
    const l = this.L;
    if (this.sel.length < 3 || !WORDSET.has(word)) {
      SFX.invalid();
      this.cameras.main.shake(120, 0.004);
      this.tweens.add({ targets: this.lineC, x: this.lineC.x + l.u(8), duration: 50, yoyo: true, repeat: 3, onComplete: () => this.lineC.setX(l.x(0)) });
      return;
    }
    this.state = 'anim';
    const tiles = this.sel.map((i) => this.board[i]);
    const dmg = this.wordDamage(tiles);
    const letters = tiles.reduce((a, s) => a + s.ch.length, 0);
    this.run.words++; this.run.firstUsed = true;
    SS.prof.words++;
    if (letters > this.run.longest.length) this.run.longest = word;
    if (word.length > SS.prof.longest.length) SS.prof.longest = word;
    if (dmg > SS.prof.bigHit) SS.prof.bigHit = dmg;
    SS.save();
    if (letters >= 7) SS.award('lexicon-7', this.game);
    if (letters >= 8) SS.award('grand-weaver', this.game);
    if (dmg >= 60) SS.award('heavy-hit', this.game);
    if (tiles.some((t) => t.ch === 'qu')) SS.award('q-mage', this.game);
    if (SS.prof.words >= 100) SS.award('century', this.game);
    SFX.cast(this.sel.length);
    if (letters >= 6) {
      SFX.bigWord();
      this.cameras.main.flash(260, 240, 210, 120, false);
      const word6 = letters >= 8 ? 'CELESTIAL!' : letters >= 7 ? 'MAGNIFICENT!' : 'SPLENDID!';
      const bt = ssTxt(this, l.x(0), l.y(430), word6, l.u(24), '#ffe9a8').setOrigin(0.5).setDepth(70).setScale(0.5);
      this.tweens.add({ targets: bt, scale: 1, duration: 200, ease: 'Back.easeOut' });
      this.tweens.add({ targets: bt, alpha: 0, y: l.y(410), delay: 800, duration: 400, onComplete: () => bt.destroy() });
    }

    const tx = this.beastC.x - this.lineC.x, ty = this.beastC.y - this.lineC.y;
    this.lineTiles.forEach((mc, k) => {
      this.tweens.add({
        targets: mc, x: tx + (rng() - 0.5) * l.u(60), y: ty + (rng() - 0.5) * l.u(40),
        scale: 0.25, alpha: 0.9, delay: k * 55, duration: 280, ease: 'Cubic.easeIn',
        onUpdate: () => { if (Math.random() < 0.3) this.starBurst.emitParticleAt(this.lineC.x + mc.x, this.lineC.y + mc.y, 1); },
        onComplete: () => { this.starBurst.emitParticleAt(this.beastC.x + (rng() - 0.5) * l.u(60), this.beastC.y + (rng() - 0.5) * l.u(40), 4); mc.destroy(); },
      });
    });

    this.time.delayedCall(this.sel.length * 55 + 320, () => {
      SFX.impact();
      this.cameras.main.shake(140, 0.006);
      if (this.hasSigil('salve') && letters >= 5) this.heal(4);
      if (this.hasSigil('leech')) this.heal(1);
      const used = [...this.sel];
      this.sel = [];
      this.lineTiles = [];
      let tier = letters >= 7 ? 2 : letters >= 5 ? 1 : 0;
      if (tier > 0 && this.hasSigil('forge')) tier = 2;
      for (const i of used) { this.board[i].c.destroy(); this.board[i] = null; }
      if (tier > 0) { this.pendingTier = tier; SFX.forge(); }
      this.layoutLine();
      this.beastHit(dmg);
      this.time.delayedCall(200, () => {
        if (this.beast.hpNow <= 0) return;
        this.fillBoard(false);
        this.tickEnemy(() => { this.state = 'pick'; });
      });
    });
  }

  beastHit(dmg) {
    const l = this.L;
    this.beast.hpNow -= dmg;
    this.run.totalDmg += dmg;
    const dt = ssTxt(this, this.beastC.x, this.beastC.y - l.u(40), String(dmg), l.u(34), '#ffe9a8').setOrigin(0.5).setDepth(70);
    this.tweens.add({ targets: dt, y: dt.y - l.u(46), alpha: 0, scale: 1.25, duration: 800, ease: 'Cubic.easeOut', onComplete: () => dt.destroy() });
    this.tweens.add({ targets: this.beastC, x: l.x(0) + l.u(10), duration: 60, yoyo: true, repeat: 1, onComplete: () => this.beastC.setX(l.x(0)) });
    if (this.beastLines) { this.beastLines.setAlpha(1); this.tweens.add({ targets: this.beastLines, alpha: 0.35, duration: 300 }); }
    this.updateBars();
    if (this.beast.hpNow <= 0) this.beastDeath();
  }

  beastDeath() {
    this.state = 'anim';
    SFX.victory();
    const l = this.L;
    if (this.breathTween) this.breathTween.stop();
    for (const st of this.beastStars) {
      this.tweens.killTweensOf(st);
      const ang = Math.atan2(st.y, st.x) + (rng() - 0.5);
      this.tweens.add({ targets: st, x: st.x + Math.cos(ang) * l.u(140), y: st.y + Math.sin(ang) * l.u(140), alpha: 0, scale: 0.1, duration: 900, ease: 'Cubic.easeOut' });
    }
    this.starBurst.emitParticleAt(this.beastC.x, this.beastC.y, 26);
    this.goldRain.start();
    this.time.delayedCall(1300, () => this.goldRain.stop());
    if (this.beastLines) this.tweens.add({ targets: this.beastLines, alpha: 0, duration: 350 });
    this.strikeT.setText('');
    SS.prof.beasts++;
    SS.award('first-blood', this.game);
    if (this.fights[this.run.fightIdx].id === 'draco') SS.award('dragonfall', this.game);
    if (this.fights[this.run.fightIdx].id === 'phoenix') SS.award('first-flame', this.game);
    if (!this.struckThisBattle) SS.award('untouched', this.game);
    SS.save();
    this.run.fightIdx++;
    this.heal(6);
    if (this.mode === 'campaign') this.saveCheckpoint();
    this.time.delayedCall(1150, () => {
      if (this.run.fightIdx >= this.fights.length) this.endRun(true);
      else this.showSigilPick();
    });
  }
  saveCheckpoint() {
    if (this.run.fightIdx >= this.fights.length) { localStorage.removeItem('beta3.campaign'); return; }
    const f = this.fights[this.run.fightIdx];
    localStorage.setItem('beta3.campaign', JSON.stringify({
      fightIdx: this.run.fightIdx, actIdx: f.actIdx, hp: this.run.hp, hpMax: this.run.hpMax,
      sigils: this.run.sigils, words: this.run.words, longest: this.run.longest,
      totalDmg: this.run.totalDmg, scried: this.run.scried, featherUsed: this.run.featherUsed,
    }));
  }

  heal(n) { this.run.hp = clamp(this.run.hp + n, 0, this.run.hpMax); this.updateBars(); }

  tickEnemy(done) {
    this.beast.count--;
    this.updateBars();
    if (this.beast.count > 0) { done(); return; }
    const l = this.L;
    this.beast.count = this.beast.timer;
    if (this.hasSigil('shield') && !this.shieldUsed) {
      this.shieldUsed = true;
      SFX.blocked();
      const bt = ssTxt(this, l.x(0), l.y(240), '✦ BLOCKED ✦', l.u(20), '#9fd8ff').setOrigin(0.5).setDepth(70);
      this.tweens.add({ targets: bt, alpha: 0, y: l.y(220), delay: 600, duration: 400, onComplete: () => bt.destroy() });
      this.updateBars();
      done();
      return;
    }
    SFX.hurt();
    this.tweens.add({ targets: this.beastC, y: l.y(170) + l.u(60), duration: 160, yoyo: true, ease: 'Cubic.easeIn', onComplete: () => this.beastC.setY(l.y(170)) });
    this.cameras.main.shake(260, 0.012);
    this.cameras.main.flash(220, 120, 20, 30);
    this.time.delayedCall(220, () => {
      this.struckThisBattle = true;
      this.run.hp -= this.beast.atk;
      const dt = ssTxt(this, l.x(-160), l.y(68), '-' + this.beast.atk, l.u(22), '#ff8a8a').setOrigin(0.5).setDepth(70);
      this.tweens.add({ targets: dt, y: dt.y + l.u(30), alpha: 0, duration: 800, onComplete: () => dt.destroy() });
      if (this.run.hp <= 0 && this.hasSigil('feather') && !this.run.featherUsed) {
        this.run.featherUsed = true;
        this.run.hp = 1;
        this.cameras.main.flash(500, 255, 160, 60);
        SFX.bigWord();
        const ft = ssTxt(this, l.x(0), l.y(400), '🔥 THE FEATHER BURNS 🔥', l.u(20), '#ffa94d').setOrigin(0.5).setDepth(70);
        this.tweens.add({ targets: ft, alpha: 0, delay: 1200, duration: 500, onComplete: () => ft.destroy() });
      }
      this.updateBars();
      if (this.run.hp <= 0) this.endRun(false);
      else done();
    });
  }

  scry() {
    if (this.state !== 'pick') return;
    SFX.ensure(); SFX.noise(0.4, 600, 1, 0.12, 1800);
    this.state = 'anim';
    this.run.scried = true;
    this.unselectFrom(0);
    for (let i = 0; i < 16; i++) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
    this.fillBoard(false);
    if (this.hasSigil('comet')) { this.time.delayedCall(300, () => { this.state = 'pick'; }); return; }
    this.tickEnemy(() => { this.state = 'pick'; });
  }

  useHint() {
    if (this.state !== 'pick' || !this.hasSigil('tome') || this.hintUsed) return;
    this.hintUsed = true;
    this.hintB.setAlpha(0.3); this.hintT.setAlpha(0.3);
    SFX.forge();
    const best = this.bestWord();
    if (!best) return;
    for (const bi of best) {
      const c = this.board[bi].c;
      const g = this.add.image(c.x, c.y, 'dot').setScale(this.tileSize / 10).setTint(0xffd77a).setAlpha(0).setBlendMode('ADD').setDepth(40);
      this.tweens.add({ targets: g, alpha: 0.55, duration: 250, yoyo: true, repeat: 3, onComplete: () => g.destroy() });
    }
  }

  // ---------- sigil pick ----------
  showSigilPick() {
    const l = this.L;
    this.state = 'sigil';
    const avail = SS_SIGILS.filter((s) => !this.run.sigils.includes(s.id));
    const opts = [];
    while (opts.length < 3 && avail.length) opts.push(avail.splice(Math.floor(rng() * avail.length), 1)[0]);
    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.82).setInteractive();
    const head = ssTxt(this, l.x(0), l.y(150), '— CHOOSE A SIGIL —', l.u(18), '#c9b676').setOrigin(0.5)
      .setShadow(0, 0, '#c9b676', l.u(10), true, true);
    const items = [veil, head];
    opts.forEach((sg, k) => {
      const cy = l.y(280 + k * 150);
      const card = this.add.image(l.x(0), cy, 'panel').setDisplaySize(l.u(330), l.u(124)).setInteractive({ useHandCursor: true });
      const nm = ssTxt(this, l.x(0), cy - l.u(26), sg.name, l.u(17), '#6a4e11').setOrigin(0.5);
      const ds = this.add.text(l.x(0), cy + l.u(8), sg.desc, {
        fontFamily: SERIF, fontSize: l.u(13) + 'px', color: '#4a4030', fontStyle: 'italic',
        wordWrap: { width: l.u(290) },
      }).setOrigin(0.5);
      items.push(card, nm, ds);
      card.setAlpha(0); nm.setAlpha(0); ds.setAlpha(0);
      this.tweens.add({ targets: [card, nm, ds], alpha: 1, delay: 150 + k * 130, duration: 300 });
      card.on('pointerdown', () => {
        SFX.sigil();
        this.run.sigils.push(sg.id);
        if (sg.id === 'aegis') { this.run.hpMax += 20; this.run.hp = this.run.hpMax; }
        if (this.mode === 'campaign') this.saveCheckpoint();
        for (const it of items) it.destroy();
        this.startFight();
      });
    });
    this.overlayC.add(items);
  }

  // ---------- run end ----------
  endRun(won) {
    const l = this.L;
    this.state = 'end';
    const score = this.runScore();
    if (!won) SFX.defeat();
    if (won && this.mode === 'quick') {
      SS.award('star-caller', this.game);
      if (!this.run.scried) SS.award('no-scry', this.game);
      if (score > SS.prof.bestQuick) SS.prof.bestQuick = score;
    }
    if (won && this.mode === 'campaign') SS.award('sky-sweeper', this.game);
    if (this.mode === 'campaign') localStorage.removeItem('beta3.campaign');
    if (this.mode === 'daily') {
      SS.award('daily-devout', this.game);
      const dk = String(SSNET.dayKey());
      if (!SS.prof.daily[dk] || score > SS.prof.daily[dk]) SS.prof.daily[dk] = score;
    }
    if (won) SS.prof.wins++;
    SS.save(); SS.sync();
    if (this.mode !== 'campaign' || won) SSNET.submitScore(score, this.run.longest);

    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.82).setInteractive();
    const items = [veil];
    items.push(ssTxt(this, l.x(0), l.y(190), won ? 'THE SKY IS QUIET' : 'THE STARS CLAIM YOU', l.u(26), won ? '#ffe9a8' : '#e66a6a').setOrigin(0.5)
      .setShadow(0, 0, won ? '#c9b676' : '#802020', l.u(12), true, true));
    const lines = [
      'score  ' + score,
      'beasts felled  ' + this.run.fightIdx + ' / ' + this.fights.length,
      'words woven  ' + this.run.words,
      'finest word  ' + (this.run.longest ? this.run.longest.toUpperCase() : '—'),
    ];
    lines.forEach((s, k) => items.push(ssTxt(this, l.x(0), l.y(270 + k * 34), s, l.u(16), '#d8d2bd').setOrigin(0.5)));

    let by = 470;
    if (this.mode === 'daily') {
      const share = this.add.image(l.x(0), l.y(by), 'btndark').setDisplaySize(l.u(220), l.u(52)).setInteractive({ useHandCursor: true });
      const shareT = ssTxt(this, l.x(0), l.y(by), '✶ SHARE TODAY\'S HUNT', l.u(14), '#9fb0e8').setOrigin(0.5);
      items.push(share, shareT);
      share.on('pointerdown', () => {
        const d = new Date();
        const txt = 'STARSPELL Daily ' + d.toISOString().slice(0, 10) + '\n' +
          '✶ ' + score + ' pts · ' + this.run.fightIdx + '/' + this.fights.length + ' beasts\n' +
          '❦ finest word: ' + (this.run.longest || '—').toUpperCase() + '\n' +
          'https://drbango.com/beta3/?daily=1';
        try {
          if (navigator.clipboard) navigator.clipboard.writeText(txt);
          else { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
          shareT.setText('✶ COPIED — GO BOAST');
        } catch (e) { shareT.setText('✶ COPY FAILED'); }
      });
      by += 66;
    }
    const again = this.add.image(l.x(0), l.y(by + 10), 'btn').setDisplaySize(l.u(220), l.u(58)).setInteractive({ useHandCursor: true });
    const againT = ssTxt(this, l.x(0), l.y(by + 10), won || this.mode !== 'campaign' ? 'NEW RUN' : 'TRY AGAIN', l.u(18), '#4a3305').setOrigin(0.5);
    const homeB = this.add.image(l.x(0), l.y(by + 78), 'btndark').setDisplaySize(l.u(220), l.u(50)).setInteractive({ useHandCursor: true });
    const homeT = ssTxt(this, l.x(0), l.y(by + 78), 'HOME', l.u(14), '#9fb0e8').setOrigin(0.5);
    items.push(again, againT, homeB, homeT);
    again.on('pointerdown', () => { SFX.ui(); this.scene.restart({ mode: this.mode, resume: null }); });
    homeB.on('pointerdown', () => { SFX.ui(); this.scene.start('home', { from: won ? 'battle' : 'defeat' }); });
    this.overlayC.add(items);

    if (DEMO) {
      localStorage.setItem('beta3.result', JSON.stringify({ won, mode: this.mode, score, words: this.run.words, longest: this.run.longest }));
      this.time.delayedCall(2500, () => again.emit('pointerdown'));
    }
  }

  // ---------- solver (hint + demo) ----------
  buildTrie() {
    if (Battle.trie) return;
    const root = {};
    for (const w of WORDSET) {
      if (w.length > 8) continue;
      let n = root;
      for (const ch of w) n = n[ch] || (n[ch] = {});
      n.$ = true;
    }
    Battle.trie = root;
  }
  bestWord() {
    this.buildTrie();
    const tiles = this.board.map((s, i) => ({ i, s })).filter((x) => x.s);
    let best = null, bestScore = -1;
    const used = new Array(tiles.length).fill(false);
    const pick = [];
    const dive = (node) => {
      if (node.$ && pick.length >= 3) {
        const dmg = this.wordDamage(pick.map((k) => tiles[k].s));
        if (dmg > bestScore) { bestScore = dmg; best = pick.map((k) => tiles[k].i); }
      }
      if (pick.length >= 8) return;
      const seen = new Set();
      for (let k = 0; k < tiles.length; k++) {
        if (used[k]) continue;
        const key = tiles[k].s.ch + ':' + tiles[k].s.tier;
        if (seen.has(key)) continue;
        seen.add(key);
        let n = node, ok = true;
        for (const ch of tiles[k].s.ch) { n = n[ch]; if (!n) { ok = false; break; } }
        if (!ok) continue;
        used[k] = true; pick.push(k);
        dive(n);
        used[k] = false; pick.pop();
      }
    };
    dive(Battle.trie);
    return best;
  }
  demoStep() {
    if (this.state === 'sigil') {
      if (!this.sigilShownAt) this.sigilShownAt = this.time.now;
      if (this.time.now - this.sigilShownAt > 2200) {
        this.sigilShownAt = 0;
        const cards = this.overlayC.list.filter((o) => o.texture && o.texture.key === 'panel');
        if (cards.length) cards[Math.floor(Math.random() * cards.length)].emit('pointerdown');
      }
      return;
    }
    if (this.state !== 'pick' || this.sel.length) return;
    const best = this.bestWord();
    if (!best) { this.scry(); return; }
    best.forEach((bi, k) => this.time.delayedCall(k * 120, () => this.tapTile(bi)));
    this.time.delayedCall(best.length * 120 + 320, () => this.tryCast());
    localStorage.setItem('beta3.stat', JSON.stringify({
      v: BUILD, mode: this.mode, fight: this.run.fightIdx, hp: this.run.hp,
      words: this.run.words, longest: this.run.longest, score: this.runScore(), t: Date.now(),
    }));
  }
}

/* ============================================================
   PROFILE
   ============================================================ */
class Profile extends Phaser.Scene {
  constructor() { super('profile'); }
  create() {
    const l = ssLayout(this);
    ssMakeTextures(this);
    ssStarfield(this, 90);

    const back = ssTxt(this, l.x(-195), l.y(24), '‹ HOME', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('home'); });

    ssTxt(this, l.x(0), l.y(60), '— STARGAZER —', l.u(13), '#8a94c4').setOrigin(0.5);
    this.nameT = ssTxt(this, l.x(0), l.y(92), SSNET.myName(), l.u(26), '#f3e5b4').setOrigin(0.5)
      .setShadow(0, 0, '#c9a94f', l.u(12), true, true).setInteractive({ useHandCursor: true });
    ssTxt(this, l.x(0), l.y(120), 'tap your name to change it', l.u(10), '#5a6390', 'italic').setOrigin(0.5);
    this.nameT.on('pointerdown', () => this.editName(l));

    const p = SS.prof;
    const rows = [
      ['runs begun', p.runs], ['runs won', p.wins], ['beasts felled', p.beasts],
      ['words woven', p.words], ['finest word', p.longest ? p.longest.toUpperCase() : '—'],
      ['mightiest hit', p.bigHit || '—'], ['best quick play', p.bestQuick || '—'],
      ['versus victories', p.vsWins || '—'],
    ];
    rows.forEach(([k, v], i) => {
      const y = l.y(170 + i * 30);
      ssTxt(this, l.x(-150), y, k, l.u(13), '#8a94c4').setOrigin(0, 0.5);
      ssTxt(this, l.x(150), y, String(v), l.u(13), '#f0e8d2').setOrigin(1, 0.5);
    });

    ssTxt(this, l.x(0), l.y(408), '— ACHIEVEMENTS  ' + Object.keys(p.ach).length + ' / ' + SS_ACH.length + ' —', l.u(13), '#c9b676').setOrigin(0.5);
    SS_ACH.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = l.x(col === 0 ? -100 : 100), y = l.y(448 + row * 44);
      const got = !!p.ach[a.id];
      ssTxt(this, x - l.u(88), y, a.icon, l.u(15), got ? '#ffd77a' : '#39406b').setOrigin(0.5);
      ssTxt(this, x - l.u(68), y - l.u(8), a.name, l.u(11), got ? '#f0e8d2' : '#4a5480').setOrigin(0, 0.5);
      ssTxt(this, x - l.u(68), y + l.u(9), a.desc, l.u(8), got ? '#8a94c4' : '#39406b', 'italic').setOrigin(0, 0.5);
    });

    ssTxt(this, l.x(0), l.y(784), 'seal: ' + SSNET.uid().slice(0, 12) + ' · ' + (SSNET.mode === 'local' ? 'offline' : 'synced'), l.u(9), '#39406b').setOrigin(0.5);
  }
  editName(l) {
    SFX.ui();
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.maxLength = 18;
    inp.value = SSNET.myName();
    inp.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:9999;font:700 ' +
      Math.round(l.u(20)) + 'px Georgia,serif;text-align:center;background:#141a33;color:#f3e5b4;border:2px solid #c9a94f;border-radius:10px;padding:8px 14px;outline:none;width:70%;max-width:320px;';
    document.body.appendChild(inp);
    inp.focus(); inp.select();
    const commit = () => {
      const n = SSNET.setName(inp.value);
      this.nameT.setText(n);
      inp.remove();
      SS.sync();
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') inp.remove(); });
    inp.addEventListener('blur', commit);
  }
}

/* ============================================================
   LEADERBOARD
   ============================================================ */
class Board extends Phaser.Scene {
  constructor() { super('board'); }
  create() {
    const l = ssLayout(this);
    ssMakeTextures(this);
    ssStarfield(this, 90);
    const back = ssTxt(this, l.x(-195), l.y(24), '‹ HOME', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('home'); });
    ssTxt(this, l.x(0), l.y(60), '— THE NIGHT\'S FINEST —', l.u(15), '#c9b676').setOrigin(0.5)
      .setShadow(0, 0, '#c9b676', l.u(8), true, true);

    this.tab = 'daily';
    this.tabD = ssTxt(this, l.x(-60), l.y(100), 'DAILY', l.u(15), '#f0e8d2').setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tabW = ssTxt(this, l.x(60), l.y(100), 'WEEKLY', l.u(15), '#5a6390').setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tabD.on('pointerdown', () => this.setTab('daily'));
    this.tabW.on('pointerdown', () => this.setTab('weekly'));

    if (SSNET.mode === 'local') {
      ssTxt(this, l.x(0), l.y(130), '· local standings — the wider sky is unreachable ·', l.u(10), '#8c5a5a', 'italic').setOrigin(0.5);
    }
    this.rowsC = this.add.container(0, 0);
    this.loadingT = ssTxt(this, l.x(0), l.y(300), 'consulting the stars…', l.u(13), '#5a6390', 'italic').setOrigin(0.5);
    this.refresh();
  }
  setTab(t) {
    if (this.tab === t) return;
    SFX.ui();
    this.tab = t;
    this.tabD.setColor(t === 'daily' ? '#f0e8d2' : '#5a6390');
    this.tabW.setColor(t === 'weekly' ? '#f0e8d2' : '#5a6390');
    this.refresh();
  }
  async refresh() {
    const l = ssLayout(this);
    this.rowsC.removeAll(true);
    this.loadingT.setVisible(true);
    const tab = this.tab;
    const b = await SSNET.getBoard(tab);
    if (this.tab !== tab || !this.scene.isActive()) return;
    this.loadingT.setVisible(false);
    if (!b.rows.length) {
      this.rowsC.add(ssTxt(this, l.x(0), l.y(300), 'no hunts recorded yet — be the first', l.u(13), '#5a6390', 'italic').setOrigin(0.5));
      return;
    }
    const meId = SSNET.uid();
    b.rows.slice(0, 16).forEach((r, i) => {
      const y = l.y(160 + i * 38);
      const me = r.id === meId;
      if (me) this.rowsC.add(this.add.rectangle(l.x(0), y, l.u(380), l.u(32), 0xd7b45c, 0.12));
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
      this.rowsC.add(ssTxt(this, l.x(-180), y, String(medal), l.u(13), me ? '#ffd77a' : '#8a94c4').setOrigin(0, 0.5));
      this.rowsC.add(ssTxt(this, l.x(-138), y, r.name, l.u(13), me ? '#ffe9a8' : '#f0e8d2').setOrigin(0, 0.5));
      if (r.word) this.rowsC.add(ssTxt(this, l.x(60), y, r.word, l.u(10), '#5a6390', 'italic').setOrigin(0, 0.5));
      this.rowsC.add(ssTxt(this, l.x(180), y, String(r.score), l.u(13), me ? '#ffe9a8' : '#d8d2bd').setOrigin(1, 0.5));
    });
    if (b.me >= 16) {
      this.rowsC.add(ssTxt(this, l.x(0), l.y(160 + 16 * 38 + 8), 'you: #' + (b.me + 1) + ' of ' + b.total, l.u(12), '#ffd77a').setOrigin(0.5));
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
  backgroundColor: '#0a0d1c',
  scale: { mode: Phaser.Scale.NONE },
  render: { antialias: DPR < 2, powerPreference: 'high-performance' },
  scene: [Home, Battle, Profile, Board],
});
function fitCanvas() {
  const c = game.canvas;
  if (!c) return;
  c.style.width = window.innerWidth + 'px';
  c.style.height = window.innerHeight + 'px';
}
game.events.once('ready', fitCanvas);
SSNET.connect().then(() => { });
let resizeTo = null;
let lastRW = window.innerWidth, lastRH = window.innerHeight;
window.addEventListener('resize', () => {
  game.scale.resize(Math.round(window.innerWidth * DPR), Math.round(window.innerHeight * DPR));
  fitCanvas();
  // iOS Safari fires resize when the URL bar collapses (height-only, ~50-115px)
  // — that must NOT restart scenes or it cuts the ascent and resets battles.
  // Only a real reshape (rotation / window drag) relays out.
  const major = Math.abs(window.innerWidth - lastRW) > 4 || Math.abs(window.innerHeight - lastRH) > 200;
  if (window.SSDIAG) window.SSDIAG('resize ' + window.innerWidth + 'x' + window.innerHeight + (major ? ' MAJOR → scene restart' : ' minor (ignored)'));
  lastRW = window.innerWidth; lastRH = window.innerHeight;
  if (!major) return;
  clearTimeout(resizeTo);
  resizeTo = setTimeout(() => {
    for (const k of ['home', 'battle', 'profile', 'board']) {
      const sc = game.scene.getScene(k);
      if (sc && sc.scene.isActive()) sc.scene.restart();
    }
  }, 250);
});
