'use strict';
/* ============================================================
   STARSPELL — word-roguelite (Corkscrew Games)
   v0.2: Home / Campaign (3 acts) / Quick Play / Daily Hunt with
   share + leaderboards (daily & weekly) / Profile with stats and
   achievements / 10 constellation beasts / 16 sigils / ambient
   music and a heavy coat of star-magic. Versus: next moon.
   ?demo=1 — self-playing solver   ?daily=1 — jump into the Daily
   ============================================================ */

const BUILD = 'STARSPELL v0.13.1';
// Full-DPR back-buffer: capping at 2 left 3x phones upscaling 1.5x — text
// went soft (Runefall's v0.18 blur, same cause). MSAA off at retina instead.
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const DIAG = (m) => { if (window.SSDIAG) window.SSDIAG(m); };
const QS = new URLSearchParams(location.search);
const DEMO = QS.get('demo') === '1';

/* ---- painted art (buttons + letter tiles + meadow plate), DEFAULT ON -----
   Everything else in this game is drawn to canvas at boot; these five files
   are the only downloaded images (webp, ~230 KB total — the PNGs were 1.5 MB,
   which is why default-on waited for the conversion). Buttons/tiles swap in
   at texture-build time under the SAME texture keys, so nothing downstream
   changes; the meadow is a landscape plate ssSkyWorld lays over the
   procedural ground. If any file fails, is slow, or the browser predates
   webp, ART stays off and the procedural art draws as before — and ?art=0
   forces that fallback for debugging. */
const ART = QS.get('art') !== '0';
const SSART = { ready: false, img: {} };
function ssLoadArt() {
  const names = ['btn', 'btndark', 'tile_face', 'tile_over', 'meadow'];
  return Promise.all(names.map((n) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { SSART.img[n] = im; res(true); };
    im.onerror = () => { DIAG('art MISSING ' + n); res(false); };
    im.src = 'art/' + n + '.webp?v=' + encodeURIComponent(BUILD);
  }))).then((r) => { SSART.ready = r.every(Boolean); DIAG('art ' + (SSART.ready ? 'loaded' : 'FAILED — procedural')); });
}

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
const LEN_MULT = [0, 0, 0.6, 1, 1.15, 1.35, 1.6, 1.9, 2.3];
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
// Texture crispness factor: box art (buttons, tiles, panels) is authored in a
// small design-space canvas; on retina the upscale smeared every edge. Draw
// those canvases at R x and let setDisplaySize map them 1:1-ish to device px.
function ssTexRes(scene) {
  return Math.min(Math.max(Math.min(scene.scale.width / 420, scene.scale.height / 800), 1), 3);
}
function ssMakeTextures(scene) {
  const R = ssTexRes(scene);
  const ARTON = ART && SSART.ready;
  const mk = (key, w, h, fn, r) => {
    if (scene.textures.exists(key)) return;
    r = r || 1;
    const t = scene.textures.createCanvas(key, Math.round(w * r), Math.round(h * r));
    t.context.scale(r, r);
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
  }, R);
  // Painted tiles: one neutral glass face multiplied by the tier colour, with the gold rim
  // composited on top untinted — a straight setTint would colour the rim too, and tint is a
  // silent no-op under the Canvas renderer (the game boots Phaser.AUTO). Adding a bonus
  // colour stays one line, same as the procedural path below.
  // The 6px inset matches the procedural tile's roundRect(6,6,116,116): board and word-line
  // gaps were tuned against that ~5% breathing room, and a full-bleed painted tile ate it —
  // the board rows and the staged word visibly overlapped.
  const tileArt = (key, color) => mk(key, 128, 128, (c, w, h) => {
    const f = SSART.img.tile_face, o = SSART.img.tile_over;
    c.drawImage(f, 6, 6, w - 12, h - 12);
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = color; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-in';   // multiply floods the box; restore alpha
    c.drawImage(f, 6, 6, w - 12, h - 12);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(o, 6, 6, w - 12, h - 12);
  }, R);
  if (ARTON) {
    tileArt('tile0', '#e2deec');   // plain
    tileArt('tile1', '#ffcd6e');   // +6 value
    tileArt('tile2', '#96d7ff');   // 1.5x word
  } else {
    tileTex('tile0', '#f7f1e2', '#dfd3b8', '#b8a67f');
    tileTex('tile1', '#ffe9a8', '#e8b84b', '#a97c1c');
    tileTex('tile2', '#e6f6ff', '#a8d9f2', '#5f9fc4');
  }
  mk('veil', 8, 8, (c, w, h) => { c.fillStyle = '#060812'; c.fillRect(0, 0, w, h); });
  // battle chrome, in the wordmark's dress: a ribbon behind the strikes line and
  // framed troughs + gradient fills for the health bars (progress = setCrop)
  mk('ribbon', 256, 40, (c, w, h) => {
    c.beginPath(); c.roundRect(2, 2, w - 4, h - 4, (h - 4) / 2);
    c.fillStyle = 'rgba(16,12,34,0.62)'; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(215,180,92,0.40)'; c.stroke();
  }, R);
  mk('bartrough', 256, 24, (c, w, h) => {
    c.beginPath(); c.roundRect(1, 1, w - 2, h - 2, (h - 2) / 2);
    c.fillStyle = '#10142a'; c.fill();
    const g = c.createLinearGradient(0, 1, 0, h * 0.5);            // inner top shadow
    g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(215,180,92,0.5)'; c.stroke();
  }, R);
  const barFill = (key, top, bottom) => mk(key, 256, 16, (c, w, h) => {
    c.beginPath(); c.roundRect(0, 0, w, h, h / 2);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fill();
    c.beginPath(); c.roundRect(3, 1.5, w - 6, h * 0.4, h * 0.2);   // top sheen
    const g2 = c.createLinearGradient(0, 0, 0, h * 0.45);
    g2.addColorStop(0, 'rgba(255,255,255,0.45)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2; c.fill();
  }, R);
  barFill('barfill-gold', '#ffe08d', '#b9924a');
  barFill('barfill-rose', '#f2969b', '#b34d55');
  mk('panel', 256, 256, (c) => {
    c.beginPath(); c.roundRect(4, 4, 248, 248, 22);
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#f8f2e4'); g.addColorStop(1, '#e4d7ba');
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#a98d51'; c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = '#ffffffaa';
    c.beginPath(); c.roundRect(8, 8, 240, 240, 18); c.stroke();
  }, R);
  // Painted buttons are authored 627x344, so the slot is 256x140 rather than the procedural
  // 256x96 — that keeps the frame's vertical detail instead of pre-squashing it. Actual
  // button consumers go through ssBtn(), which bakes an aspect-correct 9-slice per display
  // size; this base texture remains for anything that grabs 'btn' directly.
  if (ARTON) {
    mk('btn', 256, 140, (c, w, h) => { c.drawImage(SSART.img.btn, 0, 0, w, h); }, R);
    mk('btndark', 256, 140, (c, w, h) => { c.drawImage(SSART.img.btndark, 0, 0, w, h); }, R);
  } else {
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
    }, R);
    mk('btndark', 256, 96, (c) => {
      c.beginPath(); c.roundRect(4, 4, 248, 88, 46);
      c.fillStyle = '#161d38'; c.fill();
      c.lineWidth = 2.5; c.strokeStyle = '#4a5a8c'; c.stroke();
    }, R);
  }
}

// Label colour for text sitting on a 'btn'. The procedural button is light gold, the painted
// one is dark navy — every gold-button label has to flip with it.
const BTN_INK = () => (ART && SSART.ready ? '#f4e6bd' : '#4a3305');
const BTN_INK2 = () => (ART && SSART.ready ? '#c9b48a' : '#7a6535');

// Time until the next daily, worded by the current language. Minutes round UP
// so the label never sits on "0m" — it reads 1m, then the sky turns over.
// Each language owns cdHM/cdH/cdM: ja wants no space, de wants 'Std', fr spaces 'min'.
function ssCountdown(ms) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  if (!h) return SS_T('cdM', m);
  return m ? SS_T('cdHM', h, m) : SS_T('cdH', h);   // "1h", not "1h 0m"
}

// Button texture for a given display size. The painted source is 627x344 but consumers
// display buttons anywhere from ~3.2:1 to ~6.5:1, and a flat stretch smears the braided
// frame corners ~3x wide. So under ?art=1 each aspect gets its own baked 9-slice
// ('btn@300x58', created on demand): corners keep the painting's proportions, the braid
// runs are mirror-tiled (alternate tiles flipped so the pattern joins seamlessly at the
// cuts) rather than stretched, and only the plain face stretches. Baking beats Phaser's
// NineSlice object here because that object is WebGL-only and the game boots Phaser.AUTO.
// The procedural path keeps the shared 'btn'/'btndark' — its plain rounded rect never
// minded the stretch.
function ssBtn(scene, dark, w, h) {
  const base = dark ? 'btndark' : 'btn';
  if (!(ART && SSART.ready)) return base;
  const key = base + '@' + w + 'x' + h;
  if (scene.textures.exists(key)) return key;
  const img = SSART.img[base], sw = img.width, sh = img.height;
  const R = ssTexRes(scene);
  // All dest maths in integer DEVICE pixels: at R=3 the slice boundaries land on
  // fractions otherwise (corner height 18.5u = 55.5px), and the antialiased edges
  // of adjacent draws let the background peek through as bright hairline seams.
  const W = Math.round(w * R), H = Math.round(h * R);
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context;
  const cs = 110;                                     // source corner block, > the 96px rim radius
  const s = H / sh;                                   // uniform frame scale follows height
  const CW = Math.min(Math.round(cs * s), Math.floor(W * 0.33));  // corner dest (capped: never collide)
  const CH = Math.round(cs * s);
  const mx = sw - 2 * cs, my = sh - 2 * cs;           // source middle spans
  // corners — the only pieces drawn at the painting's own aspect
  c.drawImage(img, 0, 0, cs, cs, 0, 0, CW, CH);
  c.drawImage(img, sw - cs, 0, cs, cs, W - CW, 0, CW, CH);
  c.drawImage(img, 0, sh - cs, cs, cs, 0, H - CH, CW, CH);
  c.drawImage(img, sw - cs, sh - cs, cs, cs, W - CW, H - CH, CW, CH);
  // horizontal braid runs — mirror-tiled at the corner scale (alternate tiles are
  // flipped so the pattern joins seamlessly at the cuts), never stretched
  const tileX = (sy, dy) => {
    const tw = Math.max(1, Math.round(mx * s));
    for (let x = CW, i = 0; x < W - CW; x += tw, i++) {
      const dw = Math.min(tw, W - CW - x), sW = (dw / tw) * mx;
      c.save();
      if (i % 2) { c.translate(x + dw, 0); c.scale(-1, 1); c.drawImage(img, cs + mx - sW, sy, sW, cs, 0, dy, dw, CH); }
      else c.drawImage(img, cs, sy, sW, cs, x, dy, dw, CH);
      c.restore();
    }
  };
  tileX(0, 0); tileX(sh - cs, H - CH);
  // vertical braid runs — same treatment
  const tileY = (sx, dx) => {
    const th = Math.max(1, Math.round(my * s));
    for (let y = CH, i = 0; y < H - CH; y += th, i++) {
      const dh = Math.min(th, H - CH - y), sH = (dh / th) * my;
      c.save();
      if (i % 2) { c.translate(0, y + dh); c.scale(1, -1); c.drawImage(img, sx, cs + my - sH, cs, sH, dx, 0, CW, dh); }
      else c.drawImage(img, sx, cs, cs, sH, dx, y, CW, dh);
      c.restore();
    }
  };
  tileY(0, 0); tileY(sw - cs, W - CW);
  // the face — plain navy with a soft vignette; a stretch keeps the vignette whole
  // where tiling would repeat its speckle clusters
  c.drawImage(img, cs, cs, mx, my, CW, CH, W - 2 * CW, H - 2 * CH);
  t.refresh();
  return key;
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

function ssSkyTextures(scene, dawn) {
  const mk = (key, w, h, fn, r) => {
    if (scene.textures.exists(key)) return;
    r = r || 1;
    const t = scene.textures.createCanvas(key, Math.round(w * r), Math.round(h * r));
    t.context.scale(r, r);
    fn(t.context, w, h); t.refresh();
  };
  const gradTex = (key, stops) => mk(key, 64, 1024, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    stops.forEach(([p, col]) => g.addColorStop(p, col));
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
  // With the painted meadow plate on, the gradient must not bake its own razor
  // horizon (bright line + plunge to dark ground): the plate's ridge sits lower
  // than the old procedural hills in places, and the baked edge shows above the
  // painted forest as a straight grey band. The plate brings the ground; the
  // gradient's tail becomes a dusk haze settling behind the painted mountains.
  const artHz = ART && SSART.ready;
  gradTex('skygrad', artHz ? [
    [0, '#0a0d1c'], [0.09, '#0a0d1c'], [0.27, '#10142e'], [0.43, '#1c2350'], [0.575, '#3a3068'],
    [0.685, '#6b4585'], [0.76, '#a05a8c'], [0.805, '#c96a8e'], [0.83, '#f0997a'], [0.846, '#ffc98a'],
    [0.852, '#ffd095'], [0.88, '#b06080'], [0.93, '#4a3560'], [1, '#241a38']] : [
    [0, '#0a0d1c'], [0.09, '#0a0d1c'], [0.27, '#10142e'], [0.43, '#1c2350'], [0.575, '#3a3068'],
    [0.685, '#6b4585'], [0.76, '#a05a8c'], [0.805, '#c96a8e'], [0.83, '#f0997a'], [0.846, '#ffc98a'],
    [0.852, '#ffe4b0'], [0.86, '#0c0918'], [1, '#070510']]);
  // the Act III payoff sky: you rose at dusk, fought one long night,
  // and come down at sunrise. Zenith still matches the battle bg.
  if (dawn) gradTex('skygrad-dawn', [
    [0, '#0a0d1c'], [0.09, '#0a0d1c'], [0.27, '#141c40'], [0.43, '#28376e'], [0.575, '#4d5da4'],
    [0.685, '#8f7cb8'], [0.76, '#d9a0ac'], [0.805, '#f2bd9c'], [0.83, '#ffd9a0'], [0.846, '#ffedc4'],
    [0.852, '#fff7dc'], [0.86, '#120d22'], [1, '#0b0716']]);
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
  }, 2);
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
  }, 2);
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
  }, 2);   // 1024x64 — still power-of-two both ways for WebGL1 REPEAT
}

const SS_STAR_COLORS = [0xcfd8ff, 0xcfd8ff, 0xcfd8ff, 0xffe9c9, 0xffd1dc, 0xc9fff2];
// Small standalone mulberry32 — seeded skies (versus: shared seed = same sky)
function ssMulberry(seed) {
  let s = (seed | 0) || 1;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// opts: { dawn }        — sunrise palette, no moon/fireflies, washed stars
//       { seed }        — deterministic star placement (shared versus sky)
//       { zenithAtZero }— zenith frame sits at scrollY 0, meadow at +T
//                         (for single-scene flows like versus; Home uses the
//                          default: meadow at 0, zenith at -T)
function ssSkyWorld(scene, opts) {
  opts = opts || {};
  const l = ssLayout(scene);
  ssSkyTextures(scene, opts.dawn);
  const T = 1600 * l.s;                                  // camera travel, px
  const B = opts.zenithAtZero ? 1600 : 0;                // design-unit shift
  const my = (m, f) => l.y(m + B * (f == null ? 1 : f)); // meadow-frame coord (factor-aware)
  const wy = (d) => l.y(d - 1600 + B);                   // worldY (0..2400) → scene y
  const rnd = opts.seed ? ssMulberry(opts.seed) : Math.random;
  const starDim = opts.dawn ? 0.5 : 1;

  // master gradient: spans the whole column, zenith top pinned to the game bg
  scene.add.image(l.W / 2, wy(0), opts.dawn ? 'skygrad-dawn' : 'skygrad').setOrigin(0.5, 0).setDisplaySize(l.W, 2400 * l.s);
  scene.add.rectangle(l.W / 2, my(800), l.W, Math.max(1, l.H - l.y(800)) + 120 * l.s, opts.dawn ? 0x0b0716 : 0x070510).setOrigin(0.5, 0);

  // aurora — lives at the zenith; one faint teal tease bleeds into the meadow sky
  for (const [tint, dx, dy, a] of [[0x2fe0d0, -120, 160, 0.055], [0x8a5ae0, 130, 120, 0.055], [0xd7b45c, 0, 640, 0.055], [0x2fe0d0, 40, 1660, 0.03]]) {
    const g = scene.add.image(l.x(dx), wy(dy), 'glowbig').setScale(l.u(2.6)).setTint(tint).setAlpha(a).setBlendMode('ADD');
    scene.tweens.add({ targets: g, x: g.x + l.u(30), y: g.y - l.u(20), scale: l.u(3.1), duration: 7000 + rnd() * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // star tiers — density ramps toward the zenith end of each parallax span
  const tier = (f, n, s0, s1, twinkle) => {
    const out = [], top = opts.zenithAtZero ? 0 : -T * f, span = T * f + l.H;
    for (let i = 0; i < n; i++) {
      const y = top + Math.pow(rnd(), 1.8) * span;
      const sc = (s0 + rnd() * (s1 - s0)) * l.s;
      const baseA = (0.25 + rnd() * 0.55) * starDim;
      const st = scene.add.image(rnd() * l.W, y, 'dot')
        .setScale(sc).setAlpha(baseA).setTint(SS_STAR_COLORS[Math.floor(rnd() * SS_STAR_COLORS.length)])
        .setScrollFactor(1, f);
      st.baseS = sc; st.baseA = baseA;
      if (twinkle && rnd() < 0.5)
        scene.tweens.add({ targets: st, alpha: baseA * 0.35, duration: 1600 + rnd() * 2600, yoyo: true, repeat: -1, delay: rnd() * 2500 });
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
    const hsz = l.u(14 + rnd() * 10);
    const hs = scene.add.image(l.x(-190 + rnd() * 380), my(50 + rnd() * 320, 0.85), 'spark4')
      .setDisplaySize(hsz, hsz).setAlpha(0.6 * starDim).setBlendMode('ADD').setScrollFactor(1, 0.85);
    scene.tweens.add({ targets: hs, angle: 360, duration: 42000 + rnd() * 40000, repeat: -1 });
    scene.tweens.add({ targets: hs, alpha: 0.45 * starDim, duration: 2200 + rnd() * 1800, yoyo: true, repeat: -1, delay: rnd() * 2000 });
  }

  // moon — low on the horizon's left shoulder; at dawn it has already set
  if (!opts.dawn) {
    const moon = scene.add.image(l.x(-140), my(425, 0.85), 'moon').setDisplaySize(l.u(104), l.u(104)).setAngle(24).setScrollFactor(1, 0.85);
    const halo = scene.add.image(moon.x, moon.y, 'glowbig').setScale(l.u(0.95)).setTint(0xf7e8c8).setAlpha(0.14).setBlendMode('ADD').setScrollFactor(1, 0.85);
    scene.tweens.add({ targets: halo, alpha: 0.1, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // clouds — parked in the climb band, crossed mid-flight
  for (const [cx, cy, cw, chh] of [[-51, -650, 242, 43], [108, -475, 280, 50], [-121, -313, 229, 38]]) {
    const c = scene.add.image(l.x(cx), my(cy), 'cloudwisp').setDisplaySize(l.u(cw), l.u(chh)).setAlpha(opts.dawn ? 0.35 : 0.55);
    scene.tweens.add({ targets: c, x: c.x + l.u(20), duration: 6000 + rnd() * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // the meadow: hills, ground, swaying grass, fireflies
  // (near hill raised + widened so the bright horizon band can't peek
  //  through the saddle between the two silhouettes)
  // painted meadow plate (?art=1, dusk only — the cut is graded for dusk): the MJ
  // landscape with its own sky keyed out at the ridge, so the painted mountains
  // stand against the procedural horizon glow. The procedural silhouettes and
  // grass strip stand down — anything drawn under the ridge's feathered alpha
  // shows through it as a phantom hump. Height is pinned (ridge ~horizon, foot
  // just past the screen bottom so the anticipation dip can't peek under it);
  // width follows the screen, so very wide frames stretch the painting rather
  // than run out of it.
  const artMeadow = ART && SSART.ready && !opts.dawn;
  if (artMeadow) {
    if (!scene.textures.exists('meadowart')) scene.textures.addImage('meadowart', SSART.img.meadow);
    const src = scene.textures.get('meadowart').getSourceImage();
    const bot = Math.max(my(800), l.H + B * l.s) + l.u(30);
    const h = bot - my(398);
    scene.add.image(l.W / 2, bot, 'meadowart').setOrigin(0.5, 1)
      .setDisplaySize(Math.max(l.W, h * src.width / src.height), h);
  } else {
    scene.add.ellipse(l.x(-108), my(545), l.u(432), l.u(250), opts.dawn ? 0x1a1430 : 0x141026);
    scene.add.ellipse(l.x(150), my(588), l.u(620), l.u(340), opts.dawn ? 0x120d22 : 0x0c0918);
    scene.add.rectangle(l.W / 2, my(553), l.W, Math.max(1, l.H - l.y(553)) + 120 * l.s, opts.dawn ? 0x0f0a1c : 0x0a0714).setOrigin(0.5, 0);
    const grassY = Math.max(l.y(772), l.H - l.u(30)) + B * l.s;
    for (const [off, ph] of [[0, 0], [l.u(5), 1300]]) {
      const gr = scene.add.tileSprite(l.W / 2, grassY + off, l.W, l.u(32), 'grasstrip').setOrigin(0.5, 0);
      gr.setTileScale(l.s / 2); gr.tilePositionX = off * 20;   // texture is drawn at 2x
      scene.tweens.add({ targets: gr, x: gr.x + l.u(1.5), duration: 2600, yoyo: true, repeat: -1, delay: ph, ease: 'Sine.easeInOut' });
    }
  }
  const flies = [];
  if (!opts.dawn) {
    for (let i = 0; i < 12; i++) {
      const f = scene.add.image(l.x(-180 + rnd() * 360), my(600 + rnd() * 165), 'dot')
        .setScale(l.u(0.22 + rnd() * 0.14)).setTint(0xffdf8f).setBlendMode('ADD').setAlpha(0);
      scene.tweens.add({ targets: f, alpha: 0.85, duration: 1700 + rnd() * 1700, yoyo: true, repeat: -1, delay: rnd() * 3000 });
      scene.tweens.add({ targets: f, x: f.x + l.u(-14 + rnd() * 28), y: f.y - l.u(6 + rnd() * 10), duration: 2600 + rnd() * 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      flies.push(f);
    }
  }

  // film grain over everything — fixed to the camera
  scene.add.tileSprite(l.W / 2, l.H / 2, l.W, l.H, 'grain').setScrollFactor(0).setAlpha(0.04).setDepth(500);

  // camera driver: p 0 = meadow · 1 = zenith; vel drives the star-stretch
  const setP = (p, vel) => {
    scene.cameras.main.scrollY = opts.zenithAtZero ? (1 - p) * T : -p * T;
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
  // shadow stays tight — a soft wide black blur turned small text to smear on
  // gold buttons at retina; a crisp 1px-ish drop keeps contrast without mush
  return scene.add.text(x, y, str, {
    fontFamily: SERIF, fontSize: size + 'px', color: color || '#f0e8d2', fontStyle: style || 'bold',
  }).setShadow(0, Math.max(1, size * 0.05), 'rgba(0,0,0,0.45)', size * 0.09);
}

// The title wordmark — live text drawn once into a canvas texture in the palette
// of the painted set. Latin titles get the hand-set treatment (gentle arch,
// bookend letters a touch larger, tight tracking, per-letter tilt along the
// curve); any non-Latin title falls back to a single run, because per-letter
// transforms would break Arabic shaping and RTL ordering. Layers, in paint
// order: warm halo · letterpress drop · outer gold hairline · navy rim ·
// per-letter gold gradient · inner bevel · dust speckle · top sheen.
// Returns { key, w, h, anchors } in design units; anchors are letter-tip
// points (relative to the texture centre) where the home scene sets sparkles.
function ssTitleTex(scene) {
  const R = Math.max(2, ssTexRes(scene));
  const key = 'title@' + SS_LANG;
  const text = SS_T('title'), px = 46 * R;
  const font = (s) => '900 ' + Math.round(s) + 'px ' + SERIF;
  if (scene.textures.exists(key)) {
    const tex = scene.textures.get(key), f = tex.getSourceImage();
    return { key, w: f.width / R, h: f.height / R, anchors: tex.ssAnchors || [] };
  }
  const latin = !/[^ -ɏ\s]/.test(text);
  const meas = document.createElement('canvas').getContext('2d');
  const A = latin ? px * 0.16 : 0;             // arch height
  let letters = null, tw = 0, asc = 0, desc = 0;
  if (latin) {
    letters = [];
    const n = text.length;
    let x = 0;
    for (let i = 0; i < n; i++) {
      const lt = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;      // -1 .. 1 across the word
      const sc = 1 + 0.09 * lt * lt;                     // bookends slightly larger
      meas.font = font(px * sc);
      const m = meas.measureText(text[i]);
      letters.push({ ch: text[i], x, lw: m.width, sc, lt });
      x += m.width - px * 0.015;                         // tight tracking
      asc = Math.max(asc, Math.ceil(m.actualBoundingBoxAscent || px * 0.8));
      desc = Math.max(desc, Math.ceil(m.actualBoundingBoxDescent || px * 0.05));
    }
    tw = x + px * 0.015;
  } else {
    meas.font = font(px);
    const m = meas.measureText(text);
    tw = m.width;
    asc = Math.ceil(m.actualBoundingBoxAscent || px * 0.8);
    desc = Math.ceil(m.actualBoundingBoxDescent || px * 0.25);
  }
  const padX = Math.ceil(px * 0.42), padY = Math.ceil(px * 0.40);
  const W = Math.ceil(tw) + padX * 2, H = Math.ceil(asc + desc + A) + padY * 2;
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context, by = padY + A + asc;    // baseline of an unarched letter
  c.textBaseline = 'alphabetic';
  // each(fn) walks the word with the arch transform applied; every layer below
  // paints through it, so the layers stay registered. fn draws at (0,0) on the
  // letter's baseline centre and gets that letter's scale for local gradients.
  const each = (fn) => {
    if (!latin) {
      c.save(); c.translate(W / 2, by);
      c.font = font(px); c.textAlign = 'center';
      if (SS_LANG === 'ar') c.direction = 'rtl';
      fn(text, 1);
      c.restore(); return;
    }
    for (const L of letters) {
      c.save();
      c.translate(padX + L.x + L.lw / 2, by - A * (1 - L.lt * L.lt));
      c.rotate(Math.atan((2 * A * L.lt) / (tw / 2)) * 0.8);   // tilt along the curve
      c.font = font(px * L.sc); c.textAlign = 'center';
      fn(L.ch, L.sc);
      c.restore();
    }
  };
  // warm halo
  c.shadowColor = 'rgba(201,169,79,0.5)'; c.shadowBlur = px * 0.28;
  c.fillStyle = '#c9a94f';
  each((ch) => { c.fillText(ch, 0, 0); c.fillText(ch, 0, 0); });
  c.shadowColor = 'transparent'; c.shadowBlur = 0;
  // letterpress drop
  c.fillStyle = 'rgba(16,12,34,0.85)';
  each((ch) => c.fillText(ch, 0, px * 0.05));
  // outer gold hairline, then the navy rim the buttons taught us
  c.lineJoin = 'round';
  c.strokeStyle = '#e6c87e'; c.lineWidth = px * 0.085;
  each((ch) => c.strokeText(ch, 0, 0));
  c.strokeStyle = '#241c40'; c.lineWidth = px * 0.055;
  each((ch) => c.strokeText(ch, 0, 0));
  // gold gradient fill, per letter so the tone is uniform along the arch
  each((ch, sc) => {
    const g = c.createLinearGradient(0, -asc * sc, 0, desc + px * 0.04);
    g.addColorStop(0, '#fff7dc'); g.addColorStop(0.35, '#ffe08d');
    g.addColorStop(0.62, '#d7b45c'); g.addColorStop(1, '#9c7a28');
    c.fillStyle = g;
    c.fillText(ch, 0, 0);
  });
  // inner bevel — clipped strokes: light under the top edges, shade above the bottom
  c.globalCompositeOperation = 'source-atop';
  c.strokeStyle = 'rgba(255,252,240,0.28)'; c.lineWidth = px * 0.03;
  each((ch) => c.strokeText(ch, 0, px * 0.014));
  c.strokeStyle = 'rgba(60,32,4,0.30)';
  each((ch) => c.strokeText(ch, 0, -px * 0.014));
  // dust speckle, like the button faces wear
  if (latin) {
    for (const L of letters) {
      const cx = padX + L.x + L.lw / 2, cy = by - A * (1 - L.lt * L.lt);
      for (let i = 0; i < 9; i++) {
        const dark = i % 3 === 0;
        c.fillStyle = dark ? 'rgba(50,30,6,0.22)' : 'rgba(255,246,220,0.20)';
        c.beginPath();
        c.arc(cx + (Math.random() - 0.5) * L.lw * 0.8, cy - Math.random() * asc * L.sc * 0.9 + Math.random() * desc,
          px * (0.008 + Math.random() * 0.014), 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  // top sheen across the whole mark
  const sh = c.createLinearGradient(0, by - A - asc, 0, by - A - asc + (asc + desc + A) * 0.42);
  sh.addColorStop(0, 'rgba(255,255,255,0.34)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sh;
  c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over';
  t.refresh();
  // sparkle anchors: letter-tip points, so the sky feels like it owns the mark
  let anchors = [];
  if (latin && letters.length > 2) {
    const n = letters.length;
    const pick = [[1, 0.8, -1], [Math.round(n * 0.55), 0.5, -1], [n - 1, 0.9, 0.35]];
    anchors = pick.map(([i, fx, fy]) => {
      const L = letters[Math.min(i, n - 1)];
      const cy = by - A * (1 - L.lt * L.lt);
      return { x: (padX + L.x + L.lw * fx - W / 2) / R, y: (cy + (fy < 0 ? fy * asc * L.sc : fy * desc + px * 0.04) - H / 2) / R };
    });
  }
  t.ssAnchors = anchors;
  return { key, w: W / R, h: H / R, anchors };
}

// The divider under the title. With the painted art on it is a strip of the
// actual button braid — the title and the buttons literally share material —
// with a ✦ set in the middle; the procedural build gets a plain gold hairline
// so the layout doesn't jump between modes. Both ends fade out.
function ssBraidTex(scene) {
  const key = 'titlebraid';
  const R = Math.max(2, ssTexRes(scene));
  if (scene.textures.exists(key)) {
    const f = scene.textures.get(key).getSourceImage();
    return { key, w: f.width / R, h: f.height / R };
  }
  const W = Math.round(250 * R), H = Math.round(16 * R);
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context, mid = W / 2, gap = 13 * R;
  if (ART && SSART.ready) {
    const img = SSART.img.btn;
    const bh = 7 * R, byy = (H - bh) / 2;
    // the button's top braid run, between the corners
    c.drawImage(img, 130, 10, img.width - 260, 30, 0, byy, mid - gap / 2, bh);
    c.save(); c.translate(W, 0); c.scale(-1, 1);       // mirrored right half
    c.drawImage(img, 130, 10, img.width - 260, 30, 0, byy, mid - gap / 2, bh);
    c.restore();
  } else {
    const line = (x0, x1) => {
      const g = c.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, 'rgba(215,180,92,0)'); g.addColorStop(1, 'rgba(215,180,92,0.9)');
      c.fillStyle = g; c.fillRect(Math.min(x0, x1), H / 2 - R * 0.6, Math.abs(x1 - x0), R * 1.2);
    };
    line(0, mid - gap / 2); line(W, mid + gap / 2);
  }
  // fade the outer ends
  for (const [x0, x1] of [[0, 26 * R], [W, W - 26 * R]]) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = g; c.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), H);
    c.globalCompositeOperation = 'source-over';
  }
  // the ✦, in the same gold-on-navy dress as the letters
  c.font = '900 ' + Math.round(11 * R) + 'px serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = 2.2 * R; c.strokeStyle = '#241c40';
  c.strokeText('✦', mid, H / 2 + R * 0.5);
  const g = c.createLinearGradient(0, H / 2 - 6 * R, 0, H / 2 + 6 * R);
  g.addColorStop(0, '#fff7dc'); g.addColorStop(0.6, '#ffe08d'); g.addColorStop(1, '#c9a057');
  c.fillStyle = g;
  c.fillText('✦', mid, H / 2 + R * 0.5);
  t.refresh();
  return { key, w: W / R, h: H / R };
}

// Small gold-lettered texture in the wordmark's dress — single run, no arch:
// beast nameplates, flying damage numbers. Cached by text+size; battle removes
// its number textures on shutdown so a long session doesn't hoard canvases.
function ssGoldTex(scene, text, sizeU) {
  const R = Math.max(2, ssTexRes(scene));
  const key = 'gold@' + sizeU + '@' + text;
  if (scene.textures.exists(key)) {
    const f = scene.textures.get(key).getSourceImage();
    return { key, w: f.width / R, h: f.height / R };
  }
  const px = sizeU * R;
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = '900 ' + Math.round(px) + 'px ' + SERIF;
  const m = meas.measureText(text);
  const asc = Math.ceil(m.actualBoundingBoxAscent || px * 0.8), desc = Math.ceil(m.actualBoundingBoxDescent || px * 0.25);
  const padX = Math.ceil(px * 0.30), padY = Math.ceil(px * 0.26);
  const W = Math.ceil(m.width) + padX * 2, H = asc + desc + padY * 2;
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context, bx = W / 2, by = padY + asc;
  c.font = meas.font; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
  c.shadowColor = 'rgba(201,169,79,0.45)'; c.shadowBlur = px * 0.22;
  c.fillStyle = '#c9a94f'; c.fillText(text, bx, by);
  c.shadowColor = 'transparent'; c.shadowBlur = 0;
  c.fillStyle = 'rgba(16,12,34,0.85)'; c.fillText(text, bx, by + px * 0.05);
  c.strokeStyle = '#e6c87e'; c.lineWidth = px * 0.085; c.strokeText(text, bx, by);
  c.strokeStyle = '#241c40'; c.lineWidth = px * 0.055; c.strokeText(text, bx, by);
  const g = c.createLinearGradient(0, by - asc, 0, by + desc + px * 0.04);
  g.addColorStop(0, '#fff7dc'); g.addColorStop(0.35, '#ffe08d');
  g.addColorStop(0.62, '#d7b45c'); g.addColorStop(1, '#9c7a28');
  c.fillStyle = g; c.fillText(text, bx, by);
  c.globalCompositeOperation = 'source-atop';
  const sh = c.createLinearGradient(0, by - asc, 0, by - asc + (asc + desc) * 0.42);
  sh.addColorStop(0, 'rgba(255,255,255,0.34)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sh; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over';
  t.refresh();
  return { key, w: W / R, h: H / R };
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
  const bg = scene.add.image(0, 0, ssBtn(scene, false, 300, 58)).setDisplaySize(l.u(300), l.u(58));
  const t1 = ssTxt(scene, 0, -l.u(10), '✦ ' + def.name + ' ✦', l.u(15), BTN_INK()).setOrigin(0.5);
  const t2 = ssTxt(scene, 0, l.u(12), def.desc, l.u(10), BTN_INK2(), 'italic').setOrigin(0.5);
  c.add([bg, t1, t2]);
  scene.tweens.add({ targets: c, y: l.y(52), duration: 450, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: c, alpha: 0, delay: 2600, duration: 400, onComplete: () => c.destroy() });
}

/* Every DOM element the game floats above the canvas (rename input, seal-code
   input) goes through here. Phaser preventDefaults canvas touches, so tapping
   '‹ HOME' never blurs a focused input — left to its own devices the element
   outlives its scene and sits on top of whatever screen comes next. This ties
   its life to the scene: Enter/blur commit, Escape cancels, and scene shutdown
   (back link, scene.start, resize-restart) always removes it — committing only
   if commitOnShutdown says the commit is safe to run against a dead scene.
   One shared id doubles as a belt-and-suspenders sweep: a second overlay
   replaces the first instead of stacking. */
function ssDomInput(scene, inp, commit, commitOnShutdown) {
  // removing a FOCUSED input fires its blur synchronously, whose close()
  // detaches it mid-remove — Chrome then throws NotFoundError on the outer
  // call. Harmless (the element is gone either way), so swallow it.
  const prev = document.getElementById('ss-overlay-input');
  if (prev) { try { prev.remove(); } catch (e) { } }
  inp.id = 'ss-overlay-input';
  let open = true;
  const close = (save) => {
    if (!open) return;
    open = false;
    scene.events.off('shutdown', onShut);
    try { inp.remove(); } catch (e) { }
    if (save) commit(inp.value);
  };
  const onShut = () => close(!!commitOnShutdown);
  scene.events.once('shutdown', onShut);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(true); if (e.key === 'Escape') close(false); });
  inp.addEventListener('blur', () => close(true));
  document.body.appendChild(inp);
  inp.focus();
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
    this.isDawn = !!((this.scene.settings.data || {}).dawn) || QS.get('dawn') === '1';
    this.sky = ssSkyWorld(this, { dawn: this.isDawn });
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

    // title — the painted wordmark, just above the horizon glow. Sparkles are
    // separate sprites so they can twinkle without redrawing the texture.
    const tk = ssTitleTex(this);
    const tScale = Math.min(1, 384 / tk.w);           // long localized titles fit the frame
    const title = this.titleT = ui(this.add.image(l.x(0), l.y(300), tk.key)
      .setDisplaySize(l.u(tk.w * tScale), l.u(tk.h * tScale)));
    this.tweens.add({ targets: title, scaleX: title.scaleX * 1.02, scaleY: title.scaleY * 1.02, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // sparkles sit on letter-tip anchors from the renderer; fractional fallback
    // covers a non-Latin title, which reports no anchors
    const spots = tk.anchors.length
      ? tk.anchors.map((a, i) => [a.x * tScale, a.y * tScale, [15, 11, 13][i % 3]])
      : [[-0.36 * tk.w * tScale, -0.30 * tk.h * tScale, 15], [0.30 * tk.w * tScale, -0.38 * tk.h * tScale, 11], [0.42 * tk.w * tScale, 0.24 * tk.h * tScale, 13]];
    for (const [fx, fy, fs] of spots) {
      const sp = ui(this.add.image(l.x(fx), l.y(300 + fy), 'spark4')
        .setDisplaySize(l.u(fs), l.u(fs)).setAlpha(0.75).setBlendMode('ADD'));
      this.tweens.add({ targets: sp, angle: 360, duration: 36000 + Math.random() * 20000, repeat: -1 });
      this.tweens.add({ targets: sp, alpha: 0.3, duration: 1600 + Math.random() * 1400, yoyo: true, repeat: -1, delay: Math.random() * 1500 });
    }
    const bk = ssBraidTex(this);
    ui(this.add.image(l.x(0), l.y(300 + tk.h * tScale * 0.5 + 6), bk.key).setDisplaySize(l.u(bk.w), l.u(bk.h)).setAlpha(0.9));
    ui(ssTxt(this, l.x(0), l.y(358), SS_T('tagline'), l.u(12), '#8a94c4', 'italic').setOrigin(0.5));

    // buttons
    const ck = this.campaignCheckpoint();
    const rows = [
      { y: 420, label: ck ? SS_T('cont') + '  ·  ' + SS_ACTS[ck.actIdx].name.split('·')[0].trim() : SS_T('campaign'), sub: ck ? SS_T('fightN', ck.fightIdx % 5 + 1) : SS_T('campaignSub'), fn: () => this.startMode('campaign') },
      { y: 488, label: SS_T('quick'), sub: SS_T('quickSub'), fn: () => this.startMode('quick') },
      { y: 556, label: SS_T('daily'), sub: this.dailySub(), key: 'daily', fn: () => this.startMode('daily') },
      { y: 624, label: SS_T('board'), sub: null, fn: () => { SFX.ui(); this.scene.start('board'); }, dark: true },
      // PROFILE moved to the chip up in the corner, which frees this row for
      // VERSUS — it is a play mode, so it gets a real button like the rest.
      { y: 692, label: SS_T('versus'), sub: SS_T('versusSub'), key: 'versus', fn: () => { SFX.ui(); this.scene.start('vsmenu'); } },
    ];
    this.rowBtns = {};
    for (const r of rows) {
      const b = ui(this.add.image(l.x(0), l.y(r.y), ssBtn(this, r.dark, 300, r.sub ? 58 : 46)).setDisplaySize(l.u(300), l.u(r.sub ? 58 : 46)).setInteractive({ useHandCursor: true }));
      ui(ssTxt(this, l.x(0), l.y(r.y - (r.sub ? 9 : 0)), r.label, l.u(16), r.dark ? '#9fb0e8' : BTN_INK()).setOrigin(0.5));
      if (r.sub) {
        const sub = ui(ssTxt(this, l.x(0), l.y(r.y + 13), r.sub, l.u(10), r.dark ? '#5a6390' : BTN_INK2(), 'italic').setOrigin(0.5));
        if (r.key === 'daily') this.dailySubT = sub;
      }
      if (r.key) this.rowBtns[r.key] = b;
      b.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); this.bloomBtn = b; r.fn(); });
      b.on('pointerover', () => b.setScale(b.scaleX * 1.03, b.scaleY * 1.03));
      b.on('pointerout', () => b.setDisplaySize(l.u(300), l.u(r.sub ? 58 : 46)));
    }
    // Profile chip — the stargazer's name, up in the corner on the same line as
    // every other scene's back link. Long or non-Latin names are trimmed to the
    // chip rather than sized to it, so the pill keeps one baked texture.
    const CW = 152, CH = 30;
    const chip = this.profileChip = ui(this.add.image(l.x(195), l.y(26), ssBtn(this, true, CW, CH))
      .setDisplaySize(l.u(CW), l.u(CH)).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    const chipT = ui(ssTxt(this, l.x(195 - CW / 2), l.y(26), '✦ ' + SSNET.myName(), l.u(11), '#9fb0e8').setOrigin(0.5));
    let nm = SSNET.myName();
    while (chipT.width > l.u(CW - 18) && nm.length > 2) { nm = nm.slice(0, -1); chipT.setText('✦ ' + nm + '…'); }
    chip.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); SFX.ui(); this.scene.start('profile'); });
    chip.on('pointerover', () => chip.setScale(chip.scaleX * 1.04, chip.scaleY * 1.04));
    chip.on('pointerout', () => chip.setDisplaySize(l.u(CW), l.u(CH)));

    ui(ssTxt(this, l.x(0), l.y(784), BUILD + ' · Corkscrew Games' + (SSNET.mode === 'local' ? ' · offline' : ''), l.u(9), '#39406b').setOrigin(0.5));
    this.muteB = ui(ssTxt(this, l.x(-195), l.y(784), SFX.muted ? '🔇' : '🔊', l.u(14)).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7));
    this.muteB.on('pointerdown', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });
    // language switcher — opposite the mute toggle; opens the sheet of native names
    this.langB = ui(ssTxt(this, l.x(195), l.y(784), '🌐', l.u(14)).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7));
    this.langB.on('pointerdown', () => this.langSheet());

    // the daily's countdown has to keep moving while the home screen sits open.
    // Ticking also carries the label across midnight UTC on its own: dayKey()
    // moves, today's score stops matching, and the sub falls back to the
    // "unplayed" wording for the new sky without a reload.
    this.time.addEvent({ delay: 15000, loop: true, callback: () => this.refreshDailySub() });

    this.input.once('pointerdown', () => SFX.ensure());
    this.events.on('ss-achproxy', (def) => ssAchToast(this, def));

    // crickets sing while we stand in the grass — at dawn, the birds do
    SFX.crickets(!this.isDawn);
    SFX.birds(this.isDawn);
    this.events.once('shutdown', () => { SFX.crickets(false); SFX.birds(false); });

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
  // Subtitle under DAILY HUNT. Unplayed, it invites and shows how long the sky
  // stays up; played, it shows today's score and when the next one lands.
  dailySub() {
    const cd = ssCountdown(SSNET.msToNextDay());
    const done = SS.prof.daily[String(SSNET.dayKey())];
    return done ? SS_T('dailyDone', done, cd) : SS_T('dailyOpen', cd);
  }
  refreshDailySub() {
    if (this.dailySubT && this.dailySubT.active) this.dailySubT.setText(this.dailySub());
  }
  // the language sheet — a parchment list of native names. Picking one rewrites
  // ?lang= and reloads: strings.js saves the choice, and every string plus the
  // baked wordmark texture re-render in the new language. Rewriting the URL
  // (rather than only saving) matters because a ?lang= already in the address
  // would out-rank the saved preference on the next load.
  langSheet() {
    if (this.busy() || this.langC) return;
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.langC = this.add.container(0, 0).setDepth(700);
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.55).setInteractive();
    veil.on('pointerdown', () => { c.destroy(); this.langC = null; });
    const keys = Object.keys(SS_STR);
    const rowH = 30, ph = keys.length * rowH + 34;
    c.add(veil);
    c.add(this.add.image(l.x(0), l.y(400), 'panel').setDisplaySize(l.u(232), l.u(ph)));
    keys.forEach((k, i) => {
      const y = 400 - ph / 2 + 32 + i * rowH;
      const cur = k === SS_LANG;
      const t = ssTxt(this, l.x(0), l.y(y), (cur ? '✦  ' : '') + (SS_LANGS[k] || k) + (cur ? '  ✦' : ''),
        l.u(15), cur ? '#8a6210' : '#4a3305').setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        SFX.ui();
        const u = new URL(location.href);
        u.searchParams.set('lang', k);
        location.replace(u.toString());
      });
      c.add(t);
    });
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
      SFX.crickets(false); SFX.birds(false); SFX.riser();
      this.sky.scatterFlies();
      for (const o of this.uiItems) this.tweens.killTweensOf(o);
      // BUGFIX: this tweened `scale`, whose setter writes BOTH axes — a setDisplaySize'd
      // button (scaleX ~1.17, scaleY ~0.60) had its height snapped to the scaleX value, so
      // the pressed button doubled in height for 130ms and never came back. Drive the axes
      // separately. (Same trap as the Runefall note: never tween `scale` on these.)
      if (this.bloomBtn) {
        const b = this.bloomBtn;
        this.tweens.add({
          targets: b, duration: 130, yoyo: true,
          scaleX: { from: b.scaleX, to: b.scaleX * 1.08 },
          scaleY: { from: b.scaleY, to: b.scaleY * 1.08 },
        });
      }
      this.tweens.add({ targets: this.uiItems, alpha: 0, duration: 300 });
      this.dissolveTitle();
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
  // the title doesn't just fade — it comes apart into stardust as the
  // world starts to fall away (SKY-DESIGN P3)
  dissolveTitle() {
    if (ssReduceMotion()) return;
    this.time.delayedCall(340, () => {
      if (!this.ascending || this.arrived || !this.titleT) return;
      const b = this.titleT.getBounds();
      const em = this.add.particles(0, 0, 'dot', {
        speed: { min: 8, max: 60 }, lifespan: { min: 700, max: 1500 }, gravityY: -30,
        scale: { start: 0.55, end: 0 }, alpha: { start: 0.9, end: 0 },
        blendMode: 'ADD', tint: [0xf3e5b4, 0xffe9c9, 0xcfd8ff], emitting: false,
      }).setDepth(60);
      for (let k = 0; k < 46; k++) em.emitParticleAt(b.x + Math.random() * b.width, b.y + b.height * 0.15 + Math.random() * b.height * 0.7);
      this.time.delayedCall(1700, () => em.destroy());
    });
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
      onComplete: () => { this.descending = false; this.sky.setP(0, 0); if (this.isDawn) SFX.birds(true); else SFX.crickets(true); },
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
    // framed troughs + gradient fills; progress is a setCrop in updateBars
    this.add.image(l.x(-152), l.y(68), 'bartrough').setOrigin(0, 0.5).setDisplaySize(l.u(254), l.u(15));
    this.hpBar = this.add.image(l.x(-150), l.y(68), 'barfill-gold').setOrigin(0, 0.5).setDisplaySize(l.u(250), l.u(9));
    this.hpT = txt(l.x(190), l.y(68), '', 12).setOrigin(1, 0.5);

    this.beastC = this.add.container(l.x(0), l.y(170));
    this.beastNameI = null;   // gold nameplate image, built per beast in setBeastName
    this.beastTitle = txt(l.x(0), l.y(301), '', 10, '#8a94c4').setOrigin(0.5).setLetterSpacing(l.u(2));
    this.add.image(l.x(-112), l.y(322), 'bartrough').setOrigin(0, 0.5).setDisplaySize(l.u(224), l.u(13));
    this.ehpBar = this.add.image(l.x(-110), l.y(322), 'barfill-rose').setOrigin(0, 0.5).setDisplaySize(l.u(220), l.u(8));
    this.strikeRib = this.add.image(l.x(0), l.y(342), 'ribbon').setAlpha(0);
    this.strikeT = txt(l.x(0), l.y(342), '', 12, '#e6a2a2').setOrigin(0.5);

    this.lineC = this.add.container(l.x(0), l.y(372));
    this.lineHint = txt(l.x(0), l.y(372), 'tap letters to weave a word', 12, '#5a6390').setOrigin(0.5).setAlpha(0.9);

    this.boardC = this.add.container(0, 0);
    this.tileSize = l.u(78); this.tileGap = l.u(8);
    this.slotPos = (i) => ({
      x: l.x(0) + ((i % 4) - 1.5) * (this.tileSize + this.tileGap),
      y: l.y(556) + (Math.floor(i / 4) - 1.5) * (this.tileSize + this.tileGap),
    });

    this.castB = this.add.image(l.x(70), l.y(754), ssBtn(this, false, 180, 56)).setDisplaySize(l.u(180), l.u(56)).setInteractive({ useHandCursor: true });
    this.castT = txt(l.x(70), l.y(754), 'CAST', 20, BTN_INK()).setOrigin(0.5)
      .setShadow(0, l.u(1), ART && SSART.ready ? '#2a1c05' : '#ffe9b0', l.u(1));
    this.castB.on('pointerdown', () => this.tryCast());
    // scry + hint wear the painted dark button (aspect-correct via ssBtn), same
    // as the home screen's LEADERBOARD/PROFILE — no more bare dev rectangles
    this.scryB = this.add.image(l.x(-150), l.y(754), ssBtn(this, true, 100, 50)).setDisplaySize(l.u(100), l.u(50)).setInteractive({ useHandCursor: true });
    txt(l.x(-150), l.y(754), 'SCRY ↻', 14, '#9fb0e8').setOrigin(0.5);
    this.scryB.on('pointerdown', () => this.scry());
    this.hintB = this.add.image(l.x(-62), l.y(754), ssBtn(this, true, 50, 50)).setDisplaySize(l.u(50), l.u(50)).setInteractive({ useHandCursor: true }).setVisible(false);
    this.hintT = txt(l.x(-62), l.y(754), '◉', 18, '#d7b45c').setOrigin(0.5).setVisible(false);
    this.hintB.on('pointerdown', () => this.useHint());

    this.homeB = txt(l.x(-195), l.y(24), '‹', 22, '#5a6390').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    this.homeB.on('pointerdown', () => { SFX.ui(); this.scene.start('home', { from: 'battle' }); });
    this.muteB = txt(l.x(-195), l.y(784), SFX.muted ? '🔇' : '🔊', 14).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7);
    this.muteB.on('pointerdown', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });
    // version stamp lives beside the mute icon — right-aligned it collided with
    // the widened painted CAST button
    txt(l.x(-172), l.y(784), BUILD, 9, '#39406b').setOrigin(0, 0.5);
    // flying damage numbers mint one texture per distinct value; drop them when
    // the battle ends so a long session doesn't hoard canvases
    this.events.once('shutdown', () => {
      for (const k of this.textures.getTextureKeys()) if (k.indexOf('gold@') === 0) this.textures.remove(k);
    });

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
    if (this.mode === 'daily') return '☀ DAILY HUNT · ' + SSNET.dayKeyISO();
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
    const valid = n >= 2 && WORDSET.has(word);
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
    this.setBeastName(''); this.beastTitle.setText('');
    const asm = ssAssembleBeast(this, this.beastC, this.beast, l.u(1.15), () => {
      this.setBeastName(this.beast.name);
      this.beastTitle.setText((this.beast.title + (this.beast.boss ? ' · BOSS' : '')).toUpperCase());
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
    const crop = (bar, f) => bar.setCrop(0, 0, bar.frame.width * clamp(f, 0, 1), bar.frame.height);
    crop(this.hpBar, this.run.hp / this.run.hpMax);
    this.hpT.setText(this.run.hp + ' / ' + this.run.hpMax);
    crop(this.ehpBar, this.beast.hpNow / this.beast.hp);
    this.strikeT.setText(this.beast.hpNow > 0 ? '✦ strikes in ' + this.beast.count + (this.beast.count === 1 ? ' cast ✦' : ' casts ✦') : '');
    this.strikeRib.setAlpha(this.strikeT.text ? 0.9 : 0);
    if (this.strikeT.text) this.strikeRib.setDisplaySize(this.strikeT.width + l.u(26), l.u(19));
    // while a damage number is in flight the tally animation owns the counter
    if (!this.scoreAnim) this.scoreT.setText(String(this.runScore()));
  }
  runScore() { return this.run.totalDmg + this.run.longest.length * 15 + this.run.fightIdx * 50; }
  setBeastName(name) {
    if (this.beastNameI) { this.beastNameI.destroy(); this.beastNameI = null; }
    if (!name) return;
    const gk = ssGoldTex(this, name, 19);
    const sc = Math.min(1, 340 / gk.w);   // umbral prefixes get long
    this.beastNameI = this.add.image(this.L.x(0), this.L.y(280), gk.key)
      .setDisplaySize(this.L.u(gk.w * sc), this.L.u(gk.h * sc));
  }

  // ---------- casting ----------
  tryCast() {
    if (this.state !== 'pick') return;
    const word = this.currentWord();
    const l = this.L;
    if (this.sel.length < 2 || !WORDSET.has(word)) {
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
    // the tally beat: a big gold number pops at the beast, arcs up to the score
    // trailing stars, and the score counts up when it lands. The counter is read
    // from the label (not runScore) so back-to-back casts chain smoothly.
    const from = parseInt(this.scoreT.text, 10) || 0;
    this.run.totalDmg += dmg;
    const to = this.runScore();
    this.scoreAnim = (this.scoreAnim || 0) + 1;
    const gk = ssGoldTex(this, '+' + dmg, 30);
    const nI = this.add.image(this.beastC.x, this.beastC.y - l.u(34), gk.key)
      .setDisplaySize(l.u(gk.w), l.u(gk.h)).setDepth(70);
    const sx = nI.scaleX, sy = nI.scaleY;
    nI.setScale(sx * 0.3, sy * 0.3).setAlpha(0);
    this.tweens.add({ targets: nI, scaleX: sx * 1.15, scaleY: sy * 1.15, alpha: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: nI, scaleX: sx, scaleY: sy, delay: 180, duration: 120 });
    const start = { x: nI.x, y: nI.y }, dst = { x: this.scoreT.x - l.u(16), y: this.scoreT.y };
    const ctrl = { x: (start.x + dst.x) / 2 + l.u(46), y: Math.min(start.y, dst.y) - l.u(64) };
    const pt = { t: 0 };
    this.tweens.add({
      targets: pt, t: 1, delay: 500, duration: 520, ease: 'Cubic.easeIn',
      onUpdate: () => {
        const u = pt.t, v = 1 - u;
        nI.x = v * v * start.x + 2 * v * u * ctrl.x + u * u * dst.x;
        nI.y = v * v * start.y + 2 * v * u * ctrl.y + u * u * dst.y;
        const k = 1 - u * 0.65;
        nI.setScale(sx * k, sy * k);
        if (Math.random() < 0.35) this.starBurst.emitParticleAt(nI.x, nI.y, 1);
      },
      onComplete: () => {
        nI.destroy();
        this.starBurst.emitParticleAt(dst.x, dst.y, 3);
        this.tweens.add({ targets: this.scoreT, scale: 1.3, duration: 110, yoyo: true });
        const cnt = { v: from };
        this.tweens.add({
          targets: cnt, v: to, duration: Math.min(700, 90 + (to - from) * 6), ease: 'Cubic.easeOut',
          onUpdate: () => this.scoreT.setText(String(Math.round(cnt.v))),
          onComplete: () => { this.scoreAnim--; if (!this.scoreAnim) this.updateBars(); },
        });
      },
    });
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
    this.strikeT.setText(''); this.strikeRib.setAlpha(0);
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
      const share = this.add.image(l.x(0), l.y(by), ssBtn(this, true, 220, 52)).setDisplaySize(l.u(220), l.u(52)).setInteractive({ useHandCursor: true });
      const shareT = ssTxt(this, l.x(0), l.y(by), '✶ SHARE TODAY\'S HUNT', l.u(14), '#9fb0e8').setOrigin(0.5);
      items.push(share, shareT);
      share.on('pointerdown', () => {
        const txt = 'STARSPELL Daily ' + SSNET.dayKeyISO() + '\n' +
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
    const again = this.add.image(l.x(0), l.y(by + 10), ssBtn(this, false, 220, 58)).setDisplaySize(l.u(220), l.u(58)).setInteractive({ useHandCursor: true });
    const againT = ssTxt(this, l.x(0), l.y(by + 10), won || this.mode !== 'campaign' ? 'NEW RUN' : 'TRY AGAIN', l.u(18), BTN_INK()).setOrigin(0.5);
    const homeB = this.add.image(l.x(0), l.y(by + 78), ssBtn(this, true, 220, 50)).setDisplaySize(l.u(220), l.u(50)).setInteractive({ useHandCursor: true });
    const homeT = ssTxt(this, l.x(0), l.y(by + 78), 'HOME', l.u(14), '#9fb0e8').setOrigin(0.5);
    items.push(again, againT, homeB, homeT);
    again.on('pointerdown', () => { SFX.ui(); this.scene.restart({ mode: this.mode, resume: null }); });
    // the Act III payoff: win the campaign and you descend into sunrise
    homeB.on('pointerdown', () => { SFX.ui(); this.scene.start('home', { from: won ? 'battle' : 'defeat', dawn: won && this.mode === 'campaign' }); });
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
      if (node.$ && pick.length >= 2) {
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
    // commitOnShutdown: backing out mid-rename still keeps what was typed
    ssDomInput(this, inp, (v) => {
      const n = SSNET.setName(v);
      if (this.nameT.active) this.nameT.setText(n);
      SS.sync();
    }, true);
    inp.select();
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
let game = null;
// versus.js registers its scenes at load time, which now happens before the game exists on
// the ?art=1 path. Queue them until boot.
const SS_LATE_SCENES = [];
function ssAddScene(key, cls) {
  if (game) game.scene.add(key, cls); else SS_LATE_SCENES.push([key, cls]);
}
function ssBoot() {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: Math.round(window.innerWidth * DPR),
    height: Math.round(window.innerHeight * DPR),
    backgroundColor: '#0a0d1c',
    scale: { mode: Phaser.Scale.NONE },
    render: { antialias: DPR < 2, powerPreference: 'high-performance' },
    scene: [Home, Battle, Profile, Board],
  });
  window.game = game;
  while (SS_LATE_SCENES.length) { const [k, c] = SS_LATE_SCENES.shift(); game.scene.add(k, c); }
  game.events.once('ready', fitCanvas);
}
function fitCanvas() {
  const c = game && game.canvas;
  if (!c) return;
  c.style.width = window.innerWidth + 'px';
  c.style.height = window.innerHeight + 'px';
  // We own the canvas CSS size (Scale.NONE), and Phaser caches the canvas bounding rect to
  // map pointer coords into game space. It must be told after we change that rect or
  // displayScale stays 1 while the canvas is really 1/DPR of the back-buffer — every tap
  // then lands at a third of where it should and nothing is clickable. Latent until the
  // ?art=1 deferred boot ran ssBoot() after document-complete and flipped the order.
  if (game.scale) game.scale.refresh();
}
// Textures are built inside the first scene's create(), so the art has to be decoded before
// Phaser starts. Capped at 2.5s — a slow or dead image never blocks the game, it just falls
// back to the procedural art. Without ?art=1 this is a straight synchronous boot as before.
if (ART) {
  let booted = false;
  const go = () => { if (!booted) { booted = true; ssBoot(); } };
  setTimeout(() => { if (!booted) DIAG('art TIMEOUT — procedural'); go(); }, 2500);
  ssLoadArt().then(go);
} else {
  ssBoot();
}
SSNET.connect().then(() => { });
/* ---------- viewport: resize + rotation ----------
   iOS Safari can fire resize while innerWidth/Height still report the OLD
   orientation, and doesn't always fire again once they settle — trusting the
   event's numbers once left the canvas laid out landscape in a portrait
   window, bottom half cut off. So any viewport signal starts a short settle
   loop: re-fit now, keep re-checking until the numbers hold still, and only
   relayout against the dims the scenes were actually built for.
   The game is portrait-only on phones: while the CSS rotate-veil covers a
   landscape coarse-pointer screen, the loop just sleeps the game and waits —
   no landscape relayout, nothing to mangle — then lays out once, upright,
   when the device turns back.
   iOS also fires resize when the URL bar collapses (height-only, ~50-115px)
   — that must NOT restart scenes or it cuts the ascent and resets battles;
   only a real reshape (rotation / window drag) relays out. */
let vpW = window.innerWidth, vpH = window.innerHeight;   // the dims the scenes are laid out for
let vpTimer = null, vpPolls = 0;
function ssVeiled() {
  try { return window.matchMedia('(orientation: landscape) and (pointer: coarse)').matches; } catch (e) { return false; }
}
function ssVpSettle() {
  vpTimer = null;
  // not made yet (?art=1 defers boot until the art decodes) or mid-boot
  // (scale.resize before the renderer exists throws) — come back shortly
  if (!game || !game.isBooted) { vpTimer = setTimeout(ssVpSettle, 300); return; }
  if (ssVeiled()) {
    if (game.loop.running) game.loop.sleep();
    vpPolls = Math.max(vpPolls, 2);      // relayout checks still owed once we're upright
    vpTimer = setTimeout(ssVpSettle, 350);
    return;
  }
  if (!game.loop.running) game.loop.wake();
  const w = window.innerWidth, h = window.innerHeight;
  game.scale.resize(Math.round(w * DPR), Math.round(h * DPR));
  fitCanvas();
  const major = Math.abs(w - vpW) > 4 || Math.abs(h - vpH) > 200;
  DIAG('vp ' + w + 'x' + h + (major ? ' MAJOR → scene restart' : ' minor'));
  if (major) {
    vpW = w; vpH = h;
    // every active scene, versus included — restart() with no args keeps the
    // original scene data, so a vsbattle rejoins its room by seal code
    for (const sc of game.scene.getScenes(true)) sc.scene.restart();
  }
  if (vpPolls-- > 0) vpTimer = setTimeout(ssVpSettle, 300);
}
function ssVpKick() {
  vpPolls = 4;                           // ~1.3s of re-checks outlasts iOS's stale reports
  clearTimeout(vpTimer);
  vpTimer = setTimeout(ssVpSettle, 60);
}
window.addEventListener('resize', ssVpKick);
window.addEventListener('orientationchange', ssVpKick);
if (window.visualViewport) window.visualViewport.addEventListener('resize', ssVpKick);
ssVpKick();   // opened in landscape? park under the veil from the very start
