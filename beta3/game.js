'use strict';
/* ============================================================
   STARSPELL — word-roguelite (Corkscrew Games)
   v0.2: Home / Campaign (3 acts) / Quick Play / Daily Hunt with
   share + leaderboards (daily & weekly) / Profile with stats and
   achievements / 10 constellation beasts / 24 tiered sigils / ambient
   music and a heavy coat of star-magic. Versus: next moon.
   ?demo=1 — self-playing solver   ?daily=1 — jump into the Daily
   ============================================================ */

const BUILD = 'STARSPELL v0.20.0';
// Full-DPR back-buffer: capping at 2 left 3x phones upscaling 1.5x — text
// went soft (Runefall's v0.18 blur, same cause). MSAA off at retina instead.
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const DIAG = (m) => { if (window.SSDIAG) window.SSDIAG(m); };
const QS = new URLSearchParams(location.search);
const DEMO = QS.get('demo') === '1';

/* ---- frame-time probe (part of ?diag=1) --------------------------------
   The rise and the descent are the game's signature moves and must stay
   silky, so they self-report: start() at motion begin, stop() at motion end,
   and every RAF-to-RAF delta in between is recorded raw (loop.rawDelta, not
   Phaser's smoothed delta — smoothing is exactly what hides a hitch). The
   first recorded delta is split out as `entry`: it covers the game step that
   ran the previous scene's shutdown + this scene's create, which is where
   texture bakes and uploads land. Summaries go to the diag box and pile up
   on window.__ssperf so a headless run can read them programmatically.
   Costs one array push per frame while a flight is live, nothing otherwise. */
const PERF = {
  rec: null,
  // limit: auto-stop after that many frames — for flights with no natural end
  // marker in this scene (the arrival handoff runs in the next scene's create)
  start(label, scene, limit) {
    if (!this.hooked) {
      this.hooked = true;
      const loop = scene.game.loop;
      scene.game.events.on('prestep', () => {
        if (!this.rec) return;
        this.rec.f.push(loop.rawDelta);
        if (this.rec.limit && this.rec.f.length >= this.rec.limit) this.stop();
      });
    }
    this.rec = { label, f: [], limit };
  },
  stop() {
    const r = this.rec;
    this.rec = null;
    if (!r || r.f.length < 3) return;
    // start() runs inside a game step (create or input handler), after that
    // step's prestep fired — so f[0] is the first delta measured AFTER the
    // heavy entry work, i.e. it spans it. That's the shutdown+create frame.
    const entry = r.f[0];
    const flight = r.f.slice(1);
    const n = flight.length, total = flight.reduce((a, b) => a + b, 0);
    const sorted = flight.slice().sort((a, b) => b - a);
    const sum = {
      label: r.label, entryMs: Math.round(entry), frames: n,
      avgMs: +(total / n).toFixed(1),
      worst: sorted.slice(0, 4).map((v) => Math.round(v)),
      over25: flight.filter((v) => v > 25).length,
      over40: flight.filter((v) => v > 40).length,
    };
    (window.__ssperf = window.__ssperf || []).push(sum);
    DIAG('perf ' + sum.label + ': entry ' + sum.entryMs + 'ms · ' + n + 'f avg ' + sum.avgMs +
      ' · worst ' + sum.worst.join('/') + ' · >25ms ' + sum.over25 + ' · >40ms ' + sum.over40);
  },
};
window.SSPERF = PERF;   // the headless perf harness reads/starts probes through this

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
    p.bestCampaign = p.bestCampaign | 0;
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
  // End-of-run window: midnight glass in a double gold frame. Drawn at the
  // display aspect (~372x580) so the corners stay true when stretched.
  mk('endpanel', 186, 290, (c, w, h) => {
    c.beginPath(); c.roundRect(2.5, 2.5, w - 5, h - 5, 13);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#161d3e'); g.addColorStop(0.5, '#0f142c'); g.addColorStop(1, '#0b0f21');
    c.fillStyle = g; c.fill();
    c.lineWidth = 1.8; c.strokeStyle = '#c9a84c'; c.stroke();
    c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 10);
    c.lineWidth = 0.7; c.strokeStyle = 'rgba(215,180,92,0.45)'; c.stroke();
    const g2 = c.createLinearGradient(0, 2.5, 0, 46);      // faint starlight sheen
    g2.addColorStop(0, 'rgba(159,176,232,0.11)'); g2.addColorStop(1, 'rgba(159,176,232,0)');
    c.beginPath(); c.roundRect(2.5, 2.5, w - 5, h - 5, 13); c.fillStyle = g2; c.fill();
  }, R);
  // the daily herald's chip — a small crimson pill with an ember rim, up in
  // the home screen's corner where notifications live
  mk('chipred', 128, 32, (c, w, h) => {
    c.beginPath(); c.roundRect(1.5, 1.5, w - 3, h - 3, (h - 3) / 2);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#a32433'); g.addColorStop(0.55, '#7c1626'); g.addColorStop(1, '#570e1b');
    c.fillStyle = g; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,138,110,0.6)'; c.stroke();
    c.beginPath(); c.roundRect(6, 3.5, w - 12, h * 0.4, h * 0.22);
    const g2 = c.createLinearGradient(0, 3, 0, h * 0.5);
    g2.addColorStop(0, 'rgba(255,255,255,0.28)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2; c.fill();
  }, R);
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

// The live countdown for the leaderboard / daily pre-screen — same wording at
// hour scale, but under an hour it ticks in seconds so the deadline visibly
// moves, and above a day it speaks in days (the weekly board needs them).
function ssCountdownLive(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, sec = s % 60;
  if (d) return h ? SS_T('cdDH', d, h) : SS_T('cdD', d);
  if (h) return m ? SS_T('cdHM', h, m) : SS_T('cdH', h);
  if (m) return SS_T('cdMS', m, sec);
  return SS_T('cdS', sec);
}

// The daily chip's clock: bare digits, H:MM:SS — reads in every language and
// visibly moves every second, which is the whole point of a live herald.
function ssClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n) => String(n).padStart(2, '0');
  return Math.floor(s / 3600) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60);
}

// The player's own daily-completion streak, from the local score log. A streak
// broken only by TODAY still counts — today's sky is still up, go keep it.
// (RTDB can't answer this: daily boards prune to today+yesterday.)
function ssDailyStreak() {
  const log = (SS.prof && SS.prof.daily) || {};
  let t = Date.now(), n = 0;
  if (!log[String(SSNET.dayKey(new Date(t)))]) t -= 86400000;
  while (log[String(SSNET.dayKey(new Date(t)))]) { n++; t -= 86400000; }
  return n;
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

// one shooting star, fired now — the ambient loop below uses it, and the
// boot intro calls it directly (its 4-8s cadence would miss a 3s intro)
function ssShootingStar(scene) {
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
}

function ssShootingStars(scene) {
  scene.time.addEvent({ delay: 4200 + Math.random() * 4000, loop: true, callback: () => ssShootingStar(scene) });
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
      if (twinkle && rnd() < 0.5) twinkles.push(st);
      out.push(st);
    }
    return out;
  };
  // ~90 twinkle tweens were a real slice of a create that sometimes opens a
  // descent — starting them a beat later is invisible and off the entry frame
  const twinkles = [];
  scene.time.delayedCall(400, () => {
    for (const st of twinkles)
      scene.tweens.add({ targets: st, alpha: st.baseA * 0.35, duration: 1600 + rnd() * 2600, yoyo: true, repeat: -1, delay: rnd() * 2500 });
  });
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
  const flyTweens = (f) => {
    scene.tweens.add({ targets: f, alpha: 0.85, duration: 1700 + rnd() * 1700, yoyo: true, repeat: -1, delay: rnd() * 3000 });
    scene.tweens.add({ targets: f, x: f.baseX + l.u(-14 + rnd() * 28), y: f.baseY - l.u(6 + rnd() * 10), duration: 2600 + rnd() * 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };
  if (!opts.dawn) {
    for (let i = 0; i < 12; i++) {
      const f = scene.add.image(l.x(-180 + rnd() * 360), my(600 + rnd() * 165), 'dot')
        .setScale(l.u(0.22 + rnd() * 0.14)).setTint(0xffdf8f).setBlendMode('ADD').setAlpha(0);
      f.baseX = f.x; f.baseY = f.y;
      flyTweens(f);
      flies.push(f);
    }
  }

  // film grain over everything — fixed to the camera. The rise/descent hides
  // it: at alpha 0.04 it is invisible over a fast-scrolling sky, and it is a
  // full back-buffer of blended fill per frame at DPR 3 — exactly the frames
  // that must not drop.
  const grain = scene.add.tileSprite(l.W / 2, l.H / 2, l.W, l.H, 'grain').setScrollFactor(0).setAlpha(0.04).setDepth(500);

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
  // the wake path (descending home without a re-create) puts them back
  const restoreFlies = () => {
    for (const f of flies) {
      scene.tweens.killTweensOf(f);
      f.setPosition(f.baseX, f.baseY).setAlpha(0);
      flyTweens(f);
    }
  };
  return { setP, scatterFlies, restoreFlies, grain, T };
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

/* ---- tile glyph cache ----------------------------------------------------
   Board tiles used to carry two live Text objects each — 32 fresh canvas
   rasters + GPU uploads landing in the single frame that builds a board,
   the biggest slice of the arrival hitch at the top of the rise (and a
   smaller one on every mid-battle refill and word-line tap). Letters and
   values bake once per (glyph, ink) into small canvas textures — idle-
   prewarmed from the meadow — and tiles just point images at them.
   Box is 64x48 design units with the letter at font 36 (Qu at 30); consumers
   scale the box, so the word-line's font-20 look is the same texture at
   20/36 scale. */
const SS_TILE_INK = ['#3a3020', '#5a3c05', '#1d4a66'];    // letter ink per tier
const SS_TILE_VINK = ['#8d7f60', '#7a5510', '#2a6a8e'];   // value ink per tier
const SS_LINE_GREEN = '#1d6a35';                          // word-line "valid" ink
function ssGlyph(scene, ch, color) {
  const key = 'gl-' + ch + '-' + color;
  if (!scene.textures.exists(key)) {
    const R = ssTexRes(scene), fs = ch === 'qu' ? 30 : 36;
    const t = scene.textures.createCanvas(key, Math.round(64 * R), Math.round(48 * R));
    const c = t.context;
    c.scale(R, R);
    c.font = 'bold ' + fs + 'px ' + SERIF;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = color;
    // caps sit a touch above the em middle in serifs — nudge to optical centre
    c.fillText(ch === 'qu' ? 'Qu' : ch.toUpperCase(), 32, 24 + fs * 0.06);
    t.refresh();
  }
  return key;
}
function ssGlyphVal(scene, v, color) {
  const key = 'gv-' + v + '-' + color;
  if (!scene.textures.exists(key)) {
    const R = ssTexRes(scene);
    const t = scene.textures.createCanvas(key, Math.round(26 * R), Math.round(16 * R));
    const c = t.context;
    c.scale(R, R);
    c.font = 'bold 12px ' + SERIF;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = color;
    c.fillText(String(v), 13, 8.7);
    t.refresh();
  }
  return key;
}
function ssPrewarmGlyphs(scene) {
  const jobs = [];
  for (const base of 'abcdefghijklmnopqrstuvwxyz') {
    const ch = base === 'q' ? 'qu' : base;
    for (let tier = 0; tier < 3; tier++) {
      const v = (VALS[base] || 1) + (ch === 'qu' ? 1 : 0) + (tier === 1 ? 6 : 0);
      jobs.push(() => { ssGlyph(scene, ch, SS_TILE_INK[tier]); ssGlyphVal(scene, v, SS_TILE_VINK[tier]); });
    }
    jobs.push(() => ssGlyph(scene, ch, SS_LINE_GREEN));
  }
  // a few per tick — baking all ~130 in one frame would itself hitch the idle
  const ev = scene.time.addEvent({
    delay: 40, loop: true, callback: () => {
      for (let i = 0; i < 6 && jobs.length; i++) jobs.shift()();
      if (!jobs.length) ev.remove();
    },
  });
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
  const latin = !/[^\u0000-ɏ\s]/.test(text);
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

/* ---- leaderboard medals -------------------------------------------------
   Gold / silver / bronze medallions for the podium — a metallic disc in the
   sigil-medallion's language (rim, inner hairline, compass points), with rays
   baked around the gold. The rank numeral is drawn over it by the scene in
   the matching ink. Consumed via setDisplaySize (R-scaled texture rule). */
const SS_MEDAL_INK = ['#3a2a08', '#2c3350', '#3a2408'];
function ssMedalTex(scene, tier) {
  const key = 'lbmedal' + tier;
  if (scene.textures.exists(key)) return key;
  const R = ssTexRes(scene), S = 96;
  const t = scene.textures.createCanvas(key, Math.round(S * R), Math.round(S * R));
  const c = t.context;
  c.scale(R, R);
  const cx = S / 2, cy = S / 2, r = S / 2 - 10;
  const M = [
    { hi: '#fff3c9', mid: '#ffd77a', lo: '#9c7a28', rim: '#e6c87e', faint: 'rgba(255,215,122,' },
    { hi: '#f4f7ff', mid: '#c9d4e8', lo: '#6a7590', rim: '#dfe6f4', faint: 'rgba(201,212,232,' },
    { hi: '#ffd9b0', mid: '#d29a5f', lo: '#7a4d20', rim: '#e8b57f', faint: 'rgba(232,181,127,' },
  ][tier];
  if (tier === 0) {                                  // the champion's rays
    c.strokeStyle = M.faint + '0.35)'; c.lineWidth = 1.4;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.26;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * (r + 2), cy + Math.sin(a) * (r + 2));
      c.lineTo(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9)); c.stroke();
    }
  }
  const g = c.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, M.hi); g.addColorStop(0.5, M.mid); g.addColorStop(1, M.lo);
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
  c.lineWidth = 3; c.strokeStyle = M.rim; c.stroke();
  c.lineWidth = 1.2; c.strokeStyle = 'rgba(16,12,34,0.4)';
  c.beginPath(); c.arc(cx, cy, r - 5.5, 0, Math.PI * 2); c.stroke();
  c.fillStyle = M.rim;                               // compass points on the ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.beginPath(); c.arc(cx + Math.cos(a) * (r - 5.5), cy + Math.sin(a) * (r - 5.5), 1.5, 0, Math.PI * 2); c.fill();
  }
  const sh = c.createLinearGradient(0, cy - r, 0, cy);   // top sheen
  sh.addColorStop(0, 'rgba(255,255,255,0.4)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  c.beginPath(); c.arc(cx, cy, r - 2, 0, Math.PI * 2); c.fillStyle = sh; c.fill();
  t.refresh();
  return key;
}

/* ---- sigil rarity dress ------------------------------------------------
   Three tiers, unmistakable at a glance: basic wears the house gold, rare a
   cool gem-blue frame with an icy glow, legendary a gold radiance with rays
   baked around its medallion (the scene adds particles and an arrival flash
   on top). Card chrome is baked per tier+size like ssBtn's slices. */
const SS_RARITY = [
  { glow: 0xd7b45c, ink: '#e6d9ac', shadow: '#c9b676', label: null, labelColor: '' },
  { glow: 0x6fa8ff, ink: '#d4e4ff', shadow: '#6fa8ff', label: 'rarityRare', labelColor: '#9fc8ff' },
  { glow: 0xffd77a, ink: '#ffe9a8', shadow: '#ffc94d', label: 'rarityLegendary', labelColor: '#ffdf8f' },
];

// Baked card chrome: midnight glass, tier frame + hairline, corner ornaments,
// and a medallion socket on the left for the glyph. Returns { key, mx, mr } —
// medallion centre/radius in design units (recomputed on cache hits).
function ssSigilCardTex(scene, tier, w, h) {
  const mr = Math.min(h * 0.30, 40), mx = Math.max(mr + 14, h * 0.42);
  const key = 'sigcard' + tier + '@' + w + 'x' + h;
  if (scene.textures.exists(key)) return { key, mx, mr };
  const R = ssTexRes(scene);
  const t = scene.textures.createCanvas(key, Math.round(w * R), Math.round(h * R));
  const c = t.context;
  c.scale(R, R);
  const frame = ['#c9a84c', '#7fb4ff', '#ffd77a'][tier];
  const faint = ['rgba(215,180,92,', 'rgba(127,180,255,', 'rgba(255,215,122,'][tier];
  const rad = Math.min(16, h * 0.2);
  const rr = (inset, r) => { c.beginPath(); c.roundRect(inset, inset, w - inset * 2, h - inset * 2, r); };
  // midnight glass — cooler for rare, a warmer dusk-violet for legendary
  rr(2.5, rad);
  const g = c.createLinearGradient(0, 0, 0, h);
  if (tier === 1) { g.addColorStop(0, '#152247'); g.addColorStop(0.55, '#0e1530'); g.addColorStop(1, '#0a0f24'); }
  else if (tier === 2) { g.addColorStop(0, '#2a2142'); g.addColorStop(0.55, '#171129'); g.addColorStop(1, '#100c1e'); }
  else { g.addColorStop(0, '#171d3c'); g.addColorStop(0.55, '#10142c'); g.addColorStop(1, '#0b0f21'); }
  c.fillStyle = g; c.fill();
  const g2 = c.createLinearGradient(0, 2.5, 0, h * 0.4);        // starlight sheen
  g2.addColorStop(0, tier === 2 ? 'rgba(255,224,141,0.13)' : 'rgba(159,176,232,0.11)');
  g2.addColorStop(1, 'rgba(159,176,232,0)');
  rr(2.5, rad); c.fillStyle = g2; c.fill();
  c.lineWidth = 2; c.strokeStyle = frame; rr(2.5, rad); c.stroke();
  c.lineWidth = 0.8; c.strokeStyle = faint + '0.5)'; rr(6.5, rad * 0.72); c.stroke();
  // corner ornaments: a small diamond with two trailing ticks, mirrored 4x
  const orn = (x, y, sx, sy) => {
    c.save(); c.translate(x, y); c.scale(sx, sy);
    c.fillStyle = frame;
    c.beginPath(); c.moveTo(11, 15); c.lineTo(15, 11); c.lineTo(19, 15); c.lineTo(15, 19); c.closePath(); c.fill();
    c.strokeStyle = faint + '0.7)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(15, 19); c.lineTo(15, 26); c.moveTo(19, 15); c.lineTo(26, 15); c.stroke();
    c.restore();
  };
  orn(0, 0, 1, 1); orn(w, 0, -1, 1); orn(0, h, 1, -1); orn(w, h, -1, -1);
  // the medallion socket
  const my = h / 2;
  if (tier === 2) {                                              // legendary rays
    c.strokeStyle = 'rgba(255,215,122,0.20)'; c.lineWidth = 1.2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.26;
      c.beginPath(); c.moveTo(mx + Math.cos(a) * (mr + 3), my + Math.sin(a) * (mr + 3));
      c.lineTo(mx + Math.cos(a) * (mr + 12), my + Math.sin(a) * (mr + 12)); c.stroke();
    }
  }
  const rg = c.createRadialGradient(mx, my, 2, mx, my, mr);
  rg.addColorStop(0, faint + '0.30)'); rg.addColorStop(0.75, faint + '0.10)'); rg.addColorStop(1, faint + '0)');
  c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fillStyle = rg; c.fill();
  c.lineWidth = 1.6; c.strokeStyle = frame; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 0.8; c.strokeStyle = faint + '0.5)'; c.beginPath(); c.arc(mx, my, mr - 3.5, 0, Math.PI * 2); c.stroke();
  c.fillStyle = frame;                                           // compass points on the ring
  for (const [dx, dy] of [[0, -mr], [0, mr], [-mr, 0], [mr, 0]]) {
    c.beginPath(); c.arc(mx + dx, my + dy, 1.6, 0, Math.PI * 2); c.fill();
  }
  t.refresh();
  return { key, mx, mr };
}

// One ornate pick card: baked chrome, glyph in the medallion, gold-letterpress
// nameplate, rarity ribbon, italic desc. Interactive container, w x h design
// units; heights under 100 lay out as the compact (versus) one-liner.
function ssSigilCard(scene, l, sg, w, h) {
  const tier = sg.rarity | 0;
  const RC = SS_RARITY[tier];
  const loc = SS_SIG(sg);
  const tex = ssSigilCardTex(scene, tier, w, h);
  const c = scene.add.container(0, 0);
  c.add(scene.add.image(0, 0, tex.key).setDisplaySize(l.u(w), l.u(h)));
  const gx = -w / 2 + tex.mx;
  c.add(ssTxt(scene, l.u(gx), 0, sg.icon, l.u(tex.mr * 0.98), RC.ink).setOrigin(0.5)
    .setShadow(0, 0, RC.shadow, l.u(5), true, true));
  const lx = gx + tex.mr + 14, maxW = w / 2 - lx - 12;
  const compact = h < 100;
  const gk = ssGoldTex(scene, loc.name, compact ? 12 : 15);
  const nsc = Math.min(1, maxW / gk.w);
  const nameY = compact ? -h / 2 + 16 : (RC.label ? -h / 2 + 42 : -h / 2 + 52);
  c.add(scene.add.image(l.u(lx), l.u(nameY), gk.key).setOrigin(0, 0.5)
    .setDisplaySize(l.u(gk.w * nsc), l.u(gk.h * nsc)));
  if (RC.label) {
    const lab = compact
      ? ssTxt(scene, l.u(w / 2 - 24), l.u(-h / 2 + 19), SS_T(RC.label), l.u(9), RC.labelColor).setOrigin(1, 0.5)
      : ssTxt(scene, l.u(lx), l.u(nameY + 19), '✦ ' + SS_T(RC.label) + ' ✦', l.u(10), RC.labelColor).setOrigin(0, 0.5);
    c.add(lab.setLetterSpacing(l.u(2)).setShadow(0, 0, RC.shadow, l.u(6), true, true));
  }
  const descY = compact ? 0 : (RC.label ? nameY + 30 : nameY + 15);
  c.add(scene.add.text(l.u(lx), l.u(descY), loc.desc, {
    fontFamily: SERIF, fontSize: l.u(compact ? 10 : 12.5) + 'px', color: '#c3c6da', fontStyle: 'italic',
    wordWrap: { width: l.u(maxW + 4) }, lineSpacing: l.u(2),
  }).setOrigin(0, 0));
  c.setSize(l.u(w), l.u(h)).setInteractive({ useHandCursor: true });
  c.setData('sigilCard', true);
  return c;
}

// Layout: 420 x 800 design space, scaled + centered
function ssLayout(scene) {
  const W = scene.scale.width, H = scene.scale.height;
  const s = Math.min(W / 420, H / 800);
  return { W, H, s, x: (d) => W / 2 + d * s, y: (d) => H / 2 + (d - 400) * s, u: (d) => d * s };
}

/* ---- the campaign star chart --------------------------------------------
   The whole long night on one window of sky: every fight of every act is a
   constellation node on a winding path that climbs from the meadow's edge
   (bottom) to the crown of dawn (top). Felled beasts burn gold, the next one
   breathes under a glow and waits for a tap, the ones ahead hang dim in their
   own colors, and the final boss stands haloed at the summit as the visible
   destination. Data-driven: pass any acts array (SS_ACTS today; more acts or
   whole alternate campaigns later just work). Returns { c, zone } — zone is
   the tappable current node (null when the campaign is complete); the
   container carries it as data 'mapZone' for the demo driver. */
function ssStarChart(scene, opts) {
  const l = ssLayout(scene);
  const acts = opts.acts || SS_ACTS;
  const fightIdx = opts.fightIdx | 0;
  const c = scene.add.container(0, 0);
  const fights = [];   // flattened in the exact order Battle marches them
  acts.forEach((act, ai) => act.fights.forEach((id, fi) => fights.push({ id, actIdx: ai, fi, len: act.fights.length, umbral: act.umbral, boss: fi === act.fights.length - 1 })));
  const N = fights.length;

  // the window + header
  c.add(scene.add.image(l.x(0), l.y(400), 'endpanel').setDisplaySize(l.u(384), l.u(664)).setInteractive());
  const hk = ssGoldTex(scene, SS_T('mapTitle'), 20);
  const hsc = Math.min(1, 300 / hk.w);
  c.add(scene.add.image(l.x(0), l.y(106), hk.key).setDisplaySize(l.u(hk.w * hsc), l.u(hk.h * hsc)));
  const complete = fightIdx >= N;
  const cur = complete ? null : fights[fightIdx];
  c.add(ssTxt(scene, l.x(0), l.y(132), complete ? SS_T('endWinSub') : acts[cur.actIdx].name + '  ·  ' + SS_T('fightN', cur.fi + 1),
    l.u(10.5), '#8a94c4', 'italic').setOrigin(0.5));

  // node positions: a serpentine sweep per act, mirrored on alternate acts so
  // the path braids left-right-left as it climbs; act bosses stand centered
  const pos = [];
  const wob = [0, 22, -16, 10];                       // organic jitter on the sweep
  let y = 632;
  const step = 29, actGap = 25;
  for (let i = 0; i < N; i++) {
    const f = fights[i];
    if (i > 0 && f.actIdx !== fights[i - 1].actIdx) {
      y -= actGap;                                    // breathing room for the act label
    }
    const dir = f.actIdx % 2 === 0 ? 1 : -1;
    let x = 0;
    if (!f.boss) {
      const t = f.len > 2 ? f.fi / (f.len - 2) : 0;
      x = (-118 + t * 218 + wob[f.fi % 4]) * dir;
    }
    pos.push({ x, y });
    y -= step;
  }
  // act labels sit in the gaps, offset off the path's diagonal
  acts.forEach((act, ai) => {
    if (ai === 0) return;
    const first = fights.findIndex((f) => f.actIdx === ai);
    const gy = (pos[first].y + pos[first - 1].y) / 2;
    const gx = -Math.sign(pos[first].x || 1) * 62;
    c.add(ssTxt(scene, l.x(gx), l.y(gy), act.name, l.u(8.5), '#6a74a4').setOrigin(0.5).setAlpha(0.9));
  });
  c.add(ssTxt(scene, l.x(0), l.y(656), acts[0].name, l.u(8.5), '#6a74a4').setOrigin(0.5).setAlpha(0.9));

  // the path: dotted starlight between nodes — gold where you have walked
  const pathG = scene.add.graphics();
  for (let i = 0; i < N - 1; i++) {
    const a = pos[i], b = pos[i + 1];
    const walked = i < fightIdx;
    pathG.fillStyle(walked ? 0xd7b45c : 0x4a5480, walked ? 0.5 : 0.28);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(3, Math.round(dist / 9));
    for (let k = 2; k <= n - 2; k++) {
      const t = k / n;
      pathG.fillCircle(l.x(a.x + (b.x - a.x) * t), l.y(a.y + (b.y - a.y) * t), l.u(1.2));
    }
  }
  c.add(pathG);

  // the nodes: little constellations in the beasts' own stars
  const staticG = scene.add.graphics();
  c.add(staticG);
  let zone = null;
  for (let i = 0; i < N; i++) {
    const f = fights[i], p = pos[i];
    const b = SS_BEASTS[f.id];
    const um = f.umbral && f.id !== 'phoenix';       // beastFor's umbral rule
    const name = (um ? SS_UMBRAL.prefix : '') + b.name;
    const state = i < fightIdx ? 'won' : i === fightIdx ? 'now' : 'far';
    const last = i === N - 1;
    const sc = (b.boss ? 0.20 : 0.145) * (last ? 1.3 : 1);
    const k = l.u(sc);
    const tint = state === 'won' ? 0xd7b45c : state === 'now' ? 0xffe9a8 : (um ? SS_UMBRAL.tint : b.tint);
    const aLine = state === 'won' ? 0.4 : state === 'now' ? 0.85 : 0.2;
    const aStar = state === 'won' ? 0.85 : state === 'now' ? 1 : 0.5;

    // the summit halo: the destination is visible from the very first step
    if (last) {
      c.add(scene.add.image(l.x(p.x), l.y(p.y), 'glowbig').setDisplaySize(l.u(120), l.u(96))
        .setTint(state === 'won' ? 0xffd77a : 0xffc46b).setAlpha(0.13).setBlendMode('ADD'));
    }
    const drawInto = (g, gx, gy) => {
      g.lineStyle(l.u(0.9), tint, aLine);
      for (const [e1, e2] of b.edges) {
        g.lineBetween(gx + b.stars[e1][0] * k, gy + b.stars[e1][1] * k, gx + b.stars[e2][0] * k, gy + b.stars[e2][1] * k);
      }
      g.fillStyle(tint, aStar);
      for (let s = 0; s < b.stars.length; s++) {
        g.fillCircle(gx + b.stars[s][0] * k, gy + b.stars[s][1] * k, l.u(s % 3 === 0 ? 1.5 : 1.0));
      }
    };
    if (state === 'now') {
      // the breathing node: its own container so it can pulse and be tapped
      const nc = scene.add.container(l.x(p.x), l.y(p.y));
      nc.add(scene.add.image(0, 0, 'glowbig').setDisplaySize(l.u(96), l.u(78)).setTint(0xffd77a).setAlpha(0.17).setBlendMode('ADD'));
      const ng = scene.add.graphics();
      drawInto(ng, 0, 0);
      for (const e of b.eyes) {
        const eye = scene.add.image(e[0] * k, e[1] * k, 'dot').setScale(0.32).setTint(b.eye).setBlendMode('ADD');
        scene.tweens.add({ targets: eye, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
        nc.add(eye);
      }
      nc.add(ng);
      scene.tweens.add({ targets: nc, scaleX: 1.09, scaleY: 1.09, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      c.add(nc);
      // the waiting ring, swelling like a held breath
      const ring = scene.add.graphics({ x: l.x(p.x), y: l.y(p.y) });
      ring.lineStyle(l.u(1.4), 0xffd77a, 0.55);
      ring.strokeCircle(0, 0, l.u(b.boss ? 27 : 23));
      scene.tweens.add({ targets: ring, scaleX: 1.16, scaleY: 1.16, alpha: 0.15, duration: 1100, repeat: -1, ease: 'Sine.easeOut' });
      c.add(ring);
      zone = scene.add.zone(l.x(p.x), l.y(p.y), l.u(88), l.u(66)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      let entered = false;
      zone.on('pointerdown', () => { if (entered) return; entered = true; SFX.ensure(); SFX.ui(); opts.onEnter(); });
      c.add(zone);
    } else {
      drawInto(staticG, l.x(p.x), l.y(p.y));
    }

    // the name beside each node, hugging the path's inside edge
    const off = b.boss ? 32 : 27;
    const nx = p.x > 8 ? p.x - off : p.x + off;
    const t = ssTxt(scene, l.x(nx), l.y(p.y), name,
      l.u(state === 'now' ? 9.5 : 8.5),
      state === 'won' ? '#8f7f4e' : state === 'now' ? '#ffe9a8' : '#5a6390')
      .setOrigin(p.x > 8 ? 1 : 0, 0.5);
    if (state === 'now') t.setShadow(0, 0, '#c9b676', l.u(6), true, true);
    c.add(t);
    if (last) {
      c.add(ssTxt(scene, l.x(nx), l.y(p.y + 12), SS_T('mapDest'), l.u(7.5), '#c98f4d', 'italic')
        .setOrigin(p.x > 8 ? 1 : 0, 0.5));
    }
  }
  if (!complete) c.add(ssTxt(scene, l.x(0), l.y(680), SS_T('mapHint'), l.u(10), '#c9b676', 'italic').setOrigin(0.5).setAlpha(0.9));
  c.setData('mapZone', zone);
  return { c, zone };
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
   A cold boot opens at the zenith and settles down (playIntro).
   ============================================================ */
let PENDING_ASCENT = null;   // survives a mid-ascent resize-restart: finish to battle
let INTRO_SEEN = false;      // once per page load — a rotation restart must not replay it
// The language sheet reloads the page to re-render every baked string; sitting
// through the intro again for each language tried would be miserable, so that
// reload sets a one-shot flag this consumes.
function ssIntroBypassed() {
  try {
    if (sessionStorage.getItem('beta3.skipIntro')) { sessionStorage.removeItem('beta3.skipIntro'); return true; }
  } catch (e) { }
  return false;
}
class Home extends Phaser.Scene {
  constructor() { super('home'); }
  create() {
    if (PENDING_ASCENT) { DIAG('restart mid-ascent → straight to battle'); const d = PENDING_ASCENT; PENDING_ASCENT = null; this.scene.start('battle', d); return; }
    const tCr = performance.now();
    const l = ssLayout(this);
    ssMakeTextures(this);
    this.isDawn = !!((this.scene.settings.data || {}).dawn) || QS.get('dawn') === '1';
    this.sky = ssSkyWorld(this, { dawn: this.isDawn });
    ssShootingStars(this);
    const tSky = performance.now();
    this.uiItems = [];
    this.ascending = false; this.descending = false; this.arrived = false; this.introPlaying = false;
    // scene instances persist across restarts — a rotation mid-sheet would
    // otherwise leave these truthy forever and the sheets could never reopen
    this.langC = null; this.dailyC = null; this.mapC = null; this.confirmC = null;

    // Everything at the meadow (showcase, title, buttons, chip, footer) is a
    // full frame's work on a slow phone, and a descent-by-create (the dawn
    // return, or any fallback) starts with the camera at the ZENITH — none of
    // it is visible yet. Building it one frame later halves the entry hitch of
    // those descents; on a plain boot it builds inline as before.
    const entry = (this.scene.settings.data || {}).from;
    // the cinematic opening plays on a cold boot only: restarts (rotation),
    // battle/defeat returns, demo/daily/vsdemo runs and the lang-switch reload
    // all land straight on the interactive meadow
    const intro = !entry && !INTRO_SEEN && !DEMO && QS.get('vsdemo') !== '1' && QS.get('daily') !== '1' && !ssIntroBypassed();
    if (entry) this.time.delayedCall(0, () => { if (this.sys.isActive()) this.buildMeadowUi(l); });
    else if (intro) this.playIntro(l);
    else this.buildMeadowUi(l);
    // the daily chip's clock ticks every second while the meadow sits open.
    // Ticking also carries it across midnight UTC on its own: dayKey() moves,
    // today's score stops matching, and the chip lights back up for the new
    // sky without a reload.
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateDailyChip() });

    this.input.once('pointerdown', () => SFX.ensure());
    this.events.on('ss-achproxy', (def) => ssAchToast(this, def));

    // crickets sing while we stand in the grass — at dawn, the birds do.
    // During the intro we're still up at the zenith; they start on landing.
    if (!this.introPlaying) { SFX.crickets(!this.isDawn); SFX.birds(this.isDawn); }
    this.events.once('shutdown', () => { SFX.crickets(false); SFX.birds(false); });

    // the ascent puts this scene to SLEEP, not to rest — returning from battle
    // wakes it and glides down, skipping the 200-370ms create() freeze that
    // used to open every descent (see arrive())
    this.createdW = this.scale.width; this.createdH = this.scale.height;
    this.events.on('wake', (sys, data) => this.onWake(data || {}));
    // pre-bake the dawn gradient while the meadow idles: the campaign-win
    // descent re-creates the scene with the other sky, and baking + uploading
    // skygrad-dawn inside that create was a measurable slice of its entry hitch
    if (!this.isDawn) this.time.delayedCall(600, () => { if (this.scene.isActive()) ssSkyTextures(this, true); });
    // …and the tile glyphs, so the board build at the top of the rise is
    // sprite reuse instead of 32 live text rasters (see ssGlyph)
    this.time.delayedCall(700, () => { if (this.scene.isActive()) ssPrewarmGlyphs(this); });

    // arriving from a battle: descend home · from defeat: wake up on the grass
    if (entry === 'battle') this.descendHome();
    else if (entry === 'defeat') {
      const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(600);
      this.tweens.add({ targets: veil, alpha: 0, duration: 350, onComplete: () => veil.destroy() });
    }

    DIAG('home create sky ' + Math.round(tSky - tCr) + 'ms' + (entry ? ' · ui deferred (' + entry + ')' : ''));
    localStorage.setItem('beta3.boot', BUILD);
    console.log(BUILD);
    DIAG(BUILD + ' · ' + (this.game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas') + ' ' + this.game.scale.width + 'x' + this.game.scale.height + ' dprCap ' + DPR);
    if (QS.get('vsdemo') === '1') this.time.delayedCall(500, () => this.scene.start('vsmenu'));
    else if (DEMO || QS.get('daily') === '1') this.time.delayedCall(400, () => this.startMode(DEMO ? 'quick' : 'daily'));
  }
  buildMeadowUi(l) {
    // baseAlpha: the ascent fades all ui to 0 — the wake path (return from
    // battle without a re-create) restores each item to the alpha it was born
    // with, which is not 1 for sparkles, braid, mute/lang buttons
    const ui = (o) => { o.baseAlpha = o.alpha; this.uiItems.push(o); return o; };
    const tUi = performance.now();

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
    this.titleBase = { sx: title.scaleX, sy: title.scaleY };
    // sparkles sit on letter-tip anchors from the renderer; fractional fallback
    // covers a non-Latin title, which reports no anchors
    const spots = tk.anchors.length
      ? tk.anchors.map((a, i) => [a.x * tScale, a.y * tScale, [15, 11, 13][i % 3]])
      : [[-0.36 * tk.w * tScale, -0.30 * tk.h * tScale, 15], [0.30 * tk.w * tScale, -0.38 * tk.h * tScale, 11], [0.42 * tk.w * tScale, 0.24 * tk.h * tScale, 13]];
    this.sparkles = [];
    for (const [fx, fy, fs] of spots) {
      this.sparkles.push(ui(this.add.image(l.x(fx), l.y(300 + fy), 'spark4')
        .setDisplaySize(l.u(fs), l.u(fs)).setAlpha(0.75).setBlendMode('ADD')));
    }
    // the breath and sparkle idle tweens are re-armed on wake (beginAscent
    // kills them so its fade-to-0 doesn't fight the alpha yoyos)
    this.idleTweens = () => {
      title.setScale(this.titleBase.sx, this.titleBase.sy);
      this.tweens.add({ targets: title, scaleX: this.titleBase.sx * 1.02, scaleY: this.titleBase.sy * 1.02, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      for (const sp of this.sparkles) {
        this.tweens.add({ targets: sp, angle: 360, duration: 36000 + Math.random() * 20000, repeat: -1 });
        this.tweens.add({ targets: sp, alpha: 0.3, duration: 1600 + Math.random() * 1400, yoyo: true, repeat: -1, delay: Math.random() * 1500 });
      }
      // the daily herald's ember breath (guarded: the first idleTweens call
      // runs before the chip is built; the wake path re-arms it here)
      if (this.dailyGlow) {
        this.dailyGlow.setAlpha(0.13);
        this.tweens.add({ targets: this.dailyGlow, alpha: 0.05, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    };
    this.idleTweens();
    const bk = ssBraidTex(this);
    ui(this.add.image(l.x(0), l.y(300 + tk.h * tScale * 0.5 + 6), bk.key).setDisplaySize(l.u(bk.w), l.u(bk.h)).setAlpha(0.9));
    ui(ssTxt(this, l.x(0), l.y(358), SS_T('tagline'), l.u(12), '#8a94c4', 'italic').setOrigin(0.5));

    // buttons
    const campRow = () => {
      const ck = this.campaignCheckpoint();
      return {
        label: ck ? SS_T('cont') + '  ·  ' + SS_ACTS[ck.actIdx].name.split('·')[0].trim() : SS_T('campaign'),
        sub: ck ? SS_T('fightN', ck.fightIdx % 5 + 1) : SS_T('campaignSub'),
      };
    };
    this.campRow = campRow;
    const cr = campRow();
    const rows = [
      // CAMPAIGN / CONTINUE opens the star chart — the campaign always enters
      // through the map, at the checkpoint when one is standing
      { y: 420, label: cr.label, sub: cr.sub, key: 'campaign', fn: () => this.mapSheet() },
      // NEW CAMPAIGN took the daily's old row (the daily is a chip now):
      // abandon the checkpoint (confirmed) and start the long night over
      { y: 488, label: SS_T('newCamp'), sub: SS_T('newCampSub'), key: 'newcamp', dark: true, fn: () => this.newCampaign() },
      { y: 556, label: SS_T('quick'), sub: SS_T('quickSub'), fn: () => this.startMode('quick') },
      { y: 624, label: SS_T('board'), sub: null, fn: () => { SFX.ui(); this.scene.start('board'); }, dark: true },
      // PROFILE moved to the chip up in the corner, which frees this row for
      // VERSUS — it is a play mode, so it gets a real button like the rest.
      { y: 692, label: SS_T('versus'), sub: SS_T('versusSub'), key: 'versus', fn: () => { SFX.ui(); this.scene.start('vsmenu'); } },
    ];
    this.rowBtns = {};
    for (const r of rows) {
      const b = ui(this.add.image(l.x(0), l.y(r.y), ssBtn(this, r.dark, 300, r.sub ? 58 : 46)).setDisplaySize(l.u(300), l.u(r.sub ? 58 : 46)).setInteractive({ useHandCursor: true }));
      const lab = ui(ssTxt(this, l.x(0), l.y(r.y - (r.sub ? 9 : 0)), r.label, l.u(16), r.dark ? '#9fb0e8' : BTN_INK()).setOrigin(0.5));
      if (r.key === 'campaign') this.campLabelT = lab;
      if (r.sub) {
        const sub = ui(ssTxt(this, l.x(0), l.y(r.y + 13), r.sub, l.u(10), r.dark ? '#5a6390' : BTN_INK2(), 'italic').setOrigin(0.5));
        if (r.key === 'campaign') this.campSubT = sub;
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

    // Daily hunt herald — a small red chip in the top-left corner, counting
    // tonight's sky down second by second. Alive while the hunt is unplayed
    // (ember glow breathing behind it), quiet with a ✓ once you've hunted.
    // Tapping it opens the daily pre-screen, same door as the old button.
    const DW = 108, DH = 26;
    this.dailyGlow = ui(this.add.image(l.x(-195 + DW / 2), l.y(26), 'glowbig')
      .setDisplaySize(l.u(DW * 1.8), l.u(62)).setTint(0xff5e4d).setAlpha(0.13).setBlendMode('ADD'));
    const dchip = this.dailyChipB = ui(this.add.image(l.x(-195), l.y(26), 'chipred')
      .setDisplaySize(l.u(DW), l.u(DH)).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }));
    this.dailyChipT = ui(ssTxt(this, l.x(-195 + DW / 2), l.y(26), '', l.u(10.5), '#ffe2c9').setOrigin(0.5)
      .setShadow(0, l.u(1), 'rgba(40,4,10,0.8)', l.u(1.5)));
    dchip.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); this.dailySheet(); });
    dchip.on('pointerover', () => dchip.setScale(dchip.scaleX * 1.05, dchip.scaleY * 1.05));
    dchip.on('pointerout', () => dchip.setDisplaySize(l.u(DW), l.u(DH)));
    this.tweens.add({ targets: this.dailyGlow, alpha: 0.05, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.updateDailyChip();

    ui(ssTxt(this, l.x(0), l.y(784), BUILD + ' · Corkscrew Games' + (SSNET.mode === 'local' ? ' · offline' : ''), l.u(9), '#39406b').setOrigin(0.5));
    this.muteB = ui(ssTxt(this, l.x(-195), l.y(784), SFX.muted ? '🔇' : '🔊', l.u(14)).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7));
    this.muteB.on('pointerdown', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });
    // language switcher — opposite the mute toggle; opens the sheet of native names
    this.langB = ui(ssTxt(this, l.x(195), l.y(784), '🌐', l.u(14)).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7));
    this.langB.on('pointerdown', () => this.langSheet());
    DIAG('meadow ui built ' + Math.round(performance.now() - tUi) + 'ms');
  }

  /* ---------- the opening: born at the zenith (cold boot only) ----------
     The first thing a player ever sees is the top of the sky — deep twilight,
     the aurora, the dense star field, shooting stars — then the wordmark
     condenses out of stardust and the whole column settles down into the
     meadow: the intro IS the home scene arriving, not a page before it.
     Always tappable-through — one tap settles straight onto the grass (the
     listener is armed a beat late via delayedCall: the v0.3.3 lesson, a
     listener added during a dispatch sees the tap that created it).
     prefers-reduced-motion swaps the flight for a veil fade on the grass.
     No new assets: every texture here already exists for the ascent. */
  playIntro(l) {
    INTRO_SEEN = true;
    this.buildMeadowUi(l);
    if (ssReduceMotion()) {
      // gentle: open on the grass under a lifting veil. introPlaying never
      // sticks on this path, so create() starts the crickets as usual.
      DIAG('intro: reduce-motion → veil fade');
      const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(650);
      this.tweens.add({ targets: veil, alpha: 0, duration: 700, onComplete: () => veil.destroy() });
      window.__ssintro = 'reduced';
      return;
    }
    try {
      this.introPlaying = true;
      window.__ssintro = 'playing';   // headless verification reads this
      DIAG('intro begin');
      // the meadow ui waits at alpha 0 for the camera to come down
      for (const o of this.uiItems) { this.tweens.killTweensOf(o); o.setAlpha(0); }
      this.sky.grain.setVisible(false);          // never during a flight
      // a shade below the true zenith: the violet dusk band peeks in at the
      // bottom edge — deeper twilight than the battle sky's flat navy, and a
      // hint that there is a world below to settle into
      this.introP = 0.92;
      this.sky.setP(this.introP, 0);
      // wordmark + halo, fixed to the camera at the zenith; they fade on the
      // way down and hand off to the real title waiting in the meadow
      const tk = ssTitleTex(this);
      const tScale = Math.min(1, 384 / tk.w);
      const t = this.add.image(l.W / 2, l.H * 0.4, tk.key)
        .setDisplaySize(l.u(tk.w * tScale), l.u(tk.h * tScale)).setScrollFactor(0).setDepth(610).setAlpha(0);
      const bs = { sx: t.scaleX, sy: t.scaleY };
      t.setScale(bs.sx * 1.12, bs.sy * 1.12);
      const glow = this.add.image(t.x, t.y, 'glowbig').setScale(l.u(2.1)).setTint(0xf3e5b4)
        .setBlendMode('ADD').setScrollFactor(0).setDepth(605).setAlpha(0);
      const em = this.add.particles(0, 0, 'dot', {
        speed: { min: 6, max: 46 }, lifespan: { min: 500, max: 1100 }, gravityY: -14,
        scale: { start: 0.5, end: 0 }, alpha: { start: 0.85, end: 0 },
        blendMode: 'ADD', tint: [0xf3e5b4, 0xffe9c9, 0xcfd8ff], emitting: false,
      }).setScrollFactor(0).setDepth(612);
      // fade up from black — the page was black a moment ago; meet it there
      const bootVeil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(650);
      this.tweens.add({ targets: bootVeil, alpha: 0, duration: 450, onComplete: () => bootVeil.destroy() });

      const timers = [];
      const at = (ms, fn) => timers.push(this.time.delayedCall(ms, fn));
      const finish = (skipped) => {
        if (!this.introPlaying) return;
        this.introPlaying = false;
        for (const tm of timers) tm.remove(false);
        if (this.introSkipFn) { this.input.off('pointerdown', this.introSkipFn); this.introSkipFn = null; }
        this.tweens.killTweensOf([t, glow]);
        t.destroy(); glow.destroy(); em.destroy();
        this.sky.setP(0, 0);
        this.sky.grain.setVisible(true);
        for (const o of this.uiItems) { this.tweens.killTweensOf(o); o.setAlpha(o.baseAlpha); }
        this.idleTweens();
        SFX.crickets(!this.isDawn); SFX.birds(this.isDawn);
        window.__ssintro = skipped ? 'skipped' : 'done';
        DIAG('intro ' + (skipped ? 'SKIPPED' : 'done'));
      };
      // the pan down into the meadow — the sky settling IS the scene change.
      // Re-entrant on purpose: a skip mid-glide re-calls it with a short ms to
      // accelerate from wherever introP currently is.
      const settle = (ms, skipped) => {
        if (this.introGlide) { this.introGlide.stop(); this.introGlide = null; }
        this.tweens.killTweensOf([t, glow]);
        this.tweens.add({ targets: [t, glow], alpha: 0, duration: Math.min(500, ms * 0.55), delay: ms * 0.2 });
        for (const o of this.uiItems) { this.tweens.killTweensOf(o); this.tweens.add({ targets: o, alpha: o.baseAlpha, duration: 450, delay: Math.max(0, ms - 420) }); }
        this.introGlide = this.tweens.addCounter({
          from: this.introP, to: 0, duration: ms, ease: 'Cubic.easeInOut',
          onUpdate: (tw) => { this.introP = tw.getValue(); this.sky.setP(this.introP, 0); },
          onComplete: () => finish(skipped),
        });
      };
      // the show: a beat of pure sky, stars streak, the word arrives, then down
      at(350, () => ssShootingStar(this));
      at(500, () => {
        if (!this.introPlaying) return;
        this.tweens.add({ targets: glow, alpha: 0.32, duration: 600, yoyo: true, hold: 250 });
        this.tweens.add({ targets: t, alpha: 1, duration: 900, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: t, scaleX: bs.sx, scaleY: bs.sy, duration: 1200, ease: 'Cubic.easeOut' });
        const b = t.getBounds();
        for (let k = 0; k < 42; k++) em.emitParticleAt(b.x + Math.random() * b.width, b.y + b.height * 0.2 + Math.random() * b.height * 0.6);
      });
      at(1300, () => ssShootingStar(this));
      at(1800, () => settle(1250, false));
      at(300, () => {
        if (!this.introPlaying) return;
        this.input.on('pointerdown', this.introSkipFn = () => {
          if (!this.introPlaying) return;
          for (const tm of timers) tm.remove(false);
          settle(Math.max(240, 340 * this.introP), true);
        });
      });
    } catch (e) {
      // the opening must never strand the player above their own meadow
      DIAG('intro FALLBACK: ' + (e && e.message || '?'));
      this.introPlaying = false;
      this.sky.setP(0, 0);
      this.sky.grain.setVisible(true);
      for (const o of this.uiItems) { this.tweens.killTweensOf(o); o.setAlpha(o.baseAlpha); }
      this.idleTweens();
    }
  }
  // Subtitle under DAILY HUNT. Unplayed, it invites and shows how long the sky
  // stays up; played, it shows today's score and when the next one lands.
  // the herald's second-by-second clock; also flips the chip between its
  // alive (unplayed — ember glow) and quiet (✓ hunted) dress
  updateDailyChip() {
    if (!this.dailyChipT || !this.dailyChipT.active) return;
    const played = !!SS.prof.daily[String(SSNET.dayKey())];
    this.dailyChipT.setText((played ? '✓ ' : '☀ ') + ssClock(SSNET.msToNextDay()));
    if (this.dailyGlow && this.dailyGlow.active) this.dailyGlow.setVisible(!played);
  }
  // the language sheet — a parchment list of native names. Picking one rewrites
  // ?lang= and reloads: strings.js saves the choice, and every string plus the
  // baked wordmark texture re-render in the new language. Rewriting the URL
  // (rather than only saving) matters because a ?lang= already in the address
  // would out-rank the saved preference on the next load.
  langSheet() {
    if (this.busy() || this.langC || this.dailyC || this.mapC || this.confirmC) return;
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
        // this reload is navigation, not a fresh visit — don't replay the intro
        try { sessionStorage.setItem('beta3.skipIntro', '1'); } catch (e) { }
        const u = new URL(location.href);
        u.searchParams.set('lang', k);
        location.replace(u.toString());
      });
      c.add(t);
    });
  }
  /* ---------- the daily pre-screen ----------
     Tapping DAILY opens tonight's notice board instead of dropping straight
     into the game: today's top hunters (live from RTDB), the reset countdown
     ticking in seconds, whether you've already hunted, your completion streak,
     and one big PLAY that rides the full ascent. This is also the home of the
     daily-challenge leaderboard — everyone on it completed today's sky. (A
     separate "completed the daily" board would list the same names: the score
     list IS the completion list, and RTDB prunes past days, so the streak
     shown here is the player's own, kept in the local profile log.) */
  dailySheet() {
    if (this.busy() || this.dailyC || this.langC || this.mapC || this.confirmC) return;
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.dailyC = this.add.container(0, 0).setDepth(700);
    let tick = null;
    const closeSheet = () => {
      if (this.dailyC !== c) return;
      this.dailyC = null;
      if (tick) { tick.remove(false); tick = null; }
      c.destroy();
    };
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.72, duration: 220 });
    veil.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    c.add(veil);

    const PH = 560, top = 400 - PH / 2;
    const py = (d) => l.y(top + d);
    const items = [];
    // the window swallows its own taps so a press inside never falls through to the veil
    const win = this.add.image(l.x(0), py(PH / 2), 'endpanel').setDisplaySize(l.u(372), l.u(PH)).setInteractive();
    items.push(win);
    const xB = ssTxt(this, l.x(164), py(28), '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xB.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    items.push(xB);

    // header: the hunt's name in gold, tonight's date, the shared-sky line
    const hk = ssGoldTex(this, '☀ ' + SS_T('daily'), 21);
    const hsc = Math.min(1, 300 / hk.w);
    items.push(this.add.image(l.x(0), py(46), hk.key).setDisplaySize(l.u(hk.w * hsc), l.u(hk.h * hsc)));
    items.push(ssTxt(this, l.x(0), py(76), SSNET.dayKeyISO() + ' · ' + SS_T('dpOneSky'), l.u(11), '#8a94c4', 'italic').setOrigin(0.5));
    const cdT = ssTxt(this, l.x(0), py(98), '', l.u(12), '#c9b676').setOrigin(0.5);
    const tickCd = () => { if (cdT.active) cdT.setText('☾ ' + SS_T('lbNewSky', ssCountdownLive(SSNET.msToNextDay()))); };
    tickCd();
    tick = this.time.addEvent({ delay: 1000, loop: true, callback: tickCd });
    items.push(cdT);
    const rule = (d) => items.push(this.add.rectangle(l.x(0), py(d), l.u(316), Math.max(1, l.u(1)), 0xc9a84c, 0.35));
    rule(116);

    // your standing under today's sky
    const played = SS.prof.daily[String(SSNET.dayKey())] | 0;
    items.push(ssTxt(this, l.x(0), py(140), played ? SS_T('dpPlayed', played) : SS_T('dpAwait'),
      l.u(13.5), played ? '#f0e8d2' : '#ffe9a8').setOrigin(0.5)
      .setShadow(0, 0, played ? 'rgba(0,0,0,0.45)' : '#c9b676', l.u(played ? 2 : 8), true, true));
    const streak = ssDailyStreak();
    if (streak >= 2) {
      items.push(ssTxt(this, l.x(0), py(161), '✶ ' + SS_T('dpStreak', streak) + ' ✶', l.u(10.5), '#d7b45c').setOrigin(0.5));
    }
    rule(178);

    // today's board — live from RTDB while the sheet stands open
    items.push(ssTxt(this, l.x(0), py(198), '— ' + SS_T('dpTop') + ' —', l.u(12), '#c9b676').setOrigin(0.5));
    const loadT = ssTxt(this, l.x(0), py(300), SS_T('lbLoading'), l.u(11.5), '#5a6390', 'italic').setOrigin(0.5);
    items.push(loadT);
    SSNET.getBoard('daily').then((b) => {
      if (this.dailyC !== c || !this.scene.isActive()) return;
      loadT.destroy();
      const meId = SSNET.uid();
      const rows = [];
      if (!b.rows.length) {
        rows.push(ssTxt(this, l.x(0), py(300), SS_T('lbEmpty'), l.u(11.5), '#5a6390', 'italic').setOrigin(0.5));
      }
      b.rows.slice(0, 6).forEach((r, i) => {
        const y = py(226 + i * 34);
        const me = r.id === meId;
        if (me) rows.push(this.add.rectangle(l.x(0), y, l.u(324), l.u(28), 0xd7b45c, 0.13));
        if (i < 3) {
          rows.push(this.add.image(l.x(-146), y, ssMedalTex(this, i)).setDisplaySize(l.u(24), l.u(24)));
          rows.push(ssTxt(this, l.x(-146), y, String(i + 1), l.u(12), SS_MEDAL_INK[i]).setOrigin(0.5, 0.52));
        } else {
          rows.push(ssTxt(this, l.x(-146), y, '#' + (i + 1), l.u(11), '#8a94c4').setOrigin(0.5));
        }
        const nm = ssTxt(this, l.x(-124), y, r.name, l.u(12.5), me ? '#ffe9a8' : '#e8e0c8').setOrigin(0, 0.5);
        while (nm.width > l.u(190) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
        rows.push(nm);
        rows.push(ssTxt(this, l.x(146), y, String(r.score), l.u(13), me ? '#ffe9a8' : '#d8d2bd').setOrigin(1, 0.5));
      });
      if (b.me >= 0) {
        const mine = b.me >= 6 && b.rows[b.me]
          ? '#' + (b.me + 1) + ' · ' + b.rows[b.me].name + ' · ' + b.rows[b.me].score + '   ·   '
          : '';
        rows.push(ssTxt(this, l.x(0), py(438), mine + SS_T('lbYouRank', b.me + 1, b.total), l.u(11), '#ffd77a').setOrigin(0.5));
      }
      rows.forEach((o, i) => { o.alpha = 0; this.tweens.add({ targets: o, alpha: 1, duration: 260, delay: i * 24 }); });
      c.add(rows);
    }).catch(() => { });

    // the big door: PLAY — closes the sheet and rides the ascent
    const pb = this.add.image(l.x(0), py(492), ssBtn(this, false, 260, 58)).setDisplaySize(l.u(260), l.u(58)).setInteractive({ useHandCursor: true });
    const pbT = ssTxt(this, l.x(0), py(492), played ? SS_T('dpAgain') : SS_T('dpPlay'), l.u(17), BTN_INK()).setOrigin(0.5);
    items.push(pb, pbT);
    pb.on('pointerover', () => pb.setScale(pb.scaleX * 1.03, pb.scaleY * 1.03));
    pb.on('pointerout', () => pb.setDisplaySize(l.u(260), l.u(58)));
    pb.on('pointerdown', () => {
      if (this.busy()) return;
      SFX.ui();
      closeSheet();
      this.bloomBtn = this.dailyChipB;   // the corner chip blooms as we lift off
      this.startMode('daily');
    });

    c.add(items);
    // entrance: the notice board settles up into place like the end-run window
    items.forEach((it) => { it.y += l.u(14); it.alpha = 0; });
    this.tweens.add({ targets: items, y: '-=' + l.u(14), alpha: 1, duration: 300, ease: 'Back.easeOut' });
  }

  /* ---------- the campaign map sheet ----------
     The campaign's only door: CAMPAIGN/CONTINUE opens the star chart over the
     meadow — the whole climb laid out, the checkpoint breathing — and tapping
     the glowing constellation closes the sheet and rides the full ascent into
     that fight. Fresh campaigns enter the same way, at the first node. */
  mapSheet() {
    if (this.busy() || this.mapC || this.dailyC || this.langC || this.confirmC) return;
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.mapC = this.add.container(0, 0).setDepth(700);
    const closeSheet = () => {
      if (this.mapC !== c) return;
      this.mapC = null;
      c.destroy();
    };
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.72, duration: 220 });
    veil.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    c.add(veil);
    const ck = this.campaignCheckpoint();
    const chart = ssStarChart(this, {
      fightIdx: ck ? ck.fightIdx : 0,
      onEnter: () => {
        closeSheet();
        this.bloomBtn = this.rowBtns && this.rowBtns.campaign;
        this.startMode('campaign');
      },
    });
    const xB = ssTxt(this, l.x(170), l.y(96), '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xB.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    chart.c.add(xB);
    c.add(chart.c);
    // entrance: the chart settles up into place like the other sheets
    chart.c.y = l.u(14); chart.c.alpha = 0;
    this.tweens.add({ targets: chart.c, y: 0, alpha: 1, duration: 300, ease: 'Back.easeOut' });
  }

  /* NEW CAMPAIGN — abandon the standing checkpoint (confirmed first: a
     checkpoint is hours of climb) and open the chart at the first node.
     With no checkpoint there is nothing to abandon: it is simply the door. */
  newCampaign() {
    if (this.busy() || this.mapC || this.dailyC || this.langC || this.confirmC) return;
    const ck = this.campaignCheckpoint();
    if (!ck) { this.mapSheet(); return; }
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.confirmC = this.add.container(0, 0).setDepth(720);
    const closeSheet = () => {
      if (this.confirmC !== c) return;
      this.confirmC = null;
      c.destroy();
    };
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.66, duration: 200 });
    veil.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    c.add(veil);
    const items = [];
    items.push(this.add.image(l.x(0), l.y(400), 'endpanel').setDisplaySize(l.u(336), l.u(272)).setInteractive());
    const tk = ssGoldTex(this, SS_T('abandonTitle'), 17);
    const tsc = Math.min(1, 280 / tk.w);
    items.push(this.add.image(l.x(0), l.y(304), tk.key).setDisplaySize(l.u(tk.w * tsc), l.u(tk.h * tsc)));
    items.push(ssTxt(this, l.x(0), l.y(362), SS_T('abandonBody', SS_ACTS[ck.actIdx].name.split('·')[0].trim(), ck.fightIdx % 5 + 1),
      l.u(12), '#c9c3ae', 'italic').setOrigin(0.5).setWordWrapWidth(l.u(280)).setAlign('center'));
    // KEEP CLIMBING wears the gold — walking away from a checkpoint should
    // never be the brightest thing on screen
    const keepB = this.add.image(l.x(0), l.y(438), ssBtn(this, false, 250, 50)).setDisplaySize(l.u(250), l.u(50)).setInteractive({ useHandCursor: true });
    const keepT = ssTxt(this, l.x(0), l.y(438), SS_T('abandonNo'), l.u(15), BTN_INK()).setOrigin(0.5);
    const abB = this.add.image(l.x(0), l.y(492), ssBtn(this, true, 250, 40)).setDisplaySize(l.u(250), l.u(40)).setInteractive({ useHandCursor: true });
    const abT = ssTxt(this, l.x(0), l.y(492), SS_T('abandonYes'), l.u(13), '#e6a2a2').setOrigin(0.5);
    items.push(keepB, keepT, abB, abT);
    keepB.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    abB.on('pointerdown', () => {
      SFX.ui();
      localStorage.removeItem('beta3.campaign');
      const cr = this.campRow();
      if (this.campLabelT && this.campLabelT.active) this.campLabelT.setText(cr.label);
      if (this.campSubT && this.campSubT.active) this.campSubT.setText(cr.sub);
      closeSheet();
      this.mapSheet();   // the fresh climb, from the first constellation
    });
    c.add(items);
    items.forEach((it) => { it.y += l.u(12); it.alpha = 0; });
    this.tweens.add({ targets: items, y: '-=' + l.u(12), alpha: 1, duration: 260, ease: 'Back.easeOut' });
  }

  campaignCheckpoint() {
    try { return JSON.parse(localStorage.getItem('beta3.campaign')); } catch (e) { return null; }
  }
  busy() { return this.ascending || this.descending || this.introPlaying; }
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
        // kept on this.ascVeil: if the scene sleeps and later wakes, the wake
        // path lands under this veil instead of gliding (respects the setting)
        const veil = this.ascVeil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setAlpha(0).setDepth(600);
        this.tweens.add({ targets: veil, alpha: 1, duration: 200, onComplete: () => this.arrive() });
        return;
      }
      this.sky.grain.setVisible(false);   // full-screen blended fill — not during the flight
      PERF.start('ascent', this);
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
    PERF.stop();
    DIAG('ascent arrive' + (this.skipAt ? ' (skipped)' : ''));
    if (this.skipFn) this.input.off('pointerdown', this.skipFn);
    SFX.arriveChime();                              // the hush, then the forge voice
    const data = PENDING_ASCENT; PENDING_ASCENT = null;
    try {
      this.sky.setP(1, 0);
      localStorage.setItem('beta3.ascent', JSON.stringify({ v: BUILD, skipped: !!this.skipAt, t: Date.now() }));
      // sleep (don't stop): the meadow keeps its 300+ objects alive so the trip
      // home is a wake + camera glide instead of a full re-create — the create
      // ran 200-370ms on a throttled phone profile, a visible freeze exactly at
      // the "leave battle" moment. Dawn returns still restart the scene (other
      // sky); rotation is caught on wake by the layout check there.
      this.scene.transition({ target: 'battle', duration: 450, data, moveAbove: true, sleep: true });
      // the handoff frame runs Battle.create — probe it (auto-stops)
      PERF.start('arrive', this, 30);
    } catch (e) {
      this.scene.start('battle', data);
    }
  }

  /* ---------- the way back down ---------- */
  descendHome() {
    this.descending = true;
    PERF.start('descend' + (this.isDawn ? '-dawn' : ''), this);
    this.sky.grain.setVisible(false);
    this.sky.setP(1, 0);
    SFX.descendSweep();
    this.tweens.addCounter({
      from: 1, to: 0, duration: ASC.DESCEND_MS, ease: 'Cubic.easeInOut',
      onUpdate: (tw) => this.sky.setP(tw.getValue(), 0),
      onComplete: () => { this.descending = false; PERF.stop(); this.sky.grain.setVisible(true); this.sky.setP(0, 0); if (this.isDawn) SFX.birds(true); else SFX.crickets(true); },
    });
  }
  /* the woken meadow: everything still exists, so returning is bookkeeping —
     restore what the ascent faded/killed, refresh what battle changed, glide */
  onWake(data) {
    // rotated while asleep: the viewport loop only restarts ACTIVE scenes, so
    // a stale layout lands here — rebuild rather than glide a broken frame
    if (this.scale.width !== this.createdW || this.scale.height !== this.createdH) { this.scene.restart(data); return; }
    // the dawn meadow is a once-per-campaign-win moment: if the sleeping scene
    // and the return disagree about it, rebuild with the sky the return wants
    // (matches the old create-path behavior — dusk again on the next descent)
    if (this.isDawn !== !!data.dawn) { this.scene.restart(data); return; }
    this.ascending = false; this.arrived = false; this.ascentStart = null;
    // the outgoing transition disabled this scene's input for the crossfade;
    // a stopped scene would re-enable it in create, a slept one must here
    this.input.enabled = true;
    for (const o of this.uiItems) { this.tweens.killTweensOf(o); o.setAlpha(o.baseAlpha); }
    this.idleTweens();
    this.sky.restoreFlies();
    const cr = this.campRow();   // battle moved the campaign checkpoint
    if (this.campLabelT.active) this.campLabelT.setText(cr.label);
    if (this.campSubT.active) this.campSubT.setText(cr.sub);
    this.updateDailyChip();
    const l = ssLayout(this);
    if (this.ascVeil) {          // reduce-motion rise → reduce-motion return
      this.sky.setP(0, 0);
      this.sky.grain.setVisible(true);
      const veil = this.ascVeil; this.ascVeil = null;
      this.tweens.add({ targets: veil, alpha: 0, duration: 350, onComplete: () => veil.destroy() });
      SFX.crickets(true);
    } else if (data.from === 'battle') this.descendHome();
    else {                       // defeat: wake up on the grass under a lifting veil
      this.sky.setP(0, 0);
      this.sky.grain.setVisible(true);
      const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(600);
      this.tweens.add({ targets: veil, alpha: 0, duration: 350, onComplete: () => veil.destroy() });
      SFX.crickets(true);
    }
  }
}

/* ============================================================
   BATTLE — one scene, three modes
   ============================================================ */
class Battle extends Phaser.Scene {
  constructor() { super('battle'); }
  init(data) { this.mode = data.mode || 'quick'; this.resume = data.resume || null; this.ascended = !!data.ascended; }

  create() {
    const tCr = performance.now();
    const l = this.L = ssLayout(this);
    ssMakeTextures(this);
    if (this.ascended) {   // arriving from the rise: fade in over the zenith — bg matches, no pop
      this.cameras.main.setAlpha(0);
      this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 420, ease: 'Sine.easeOut' });
    }
    ssStarfield(this, 110);
    ssShootingStars(this);
    const tSky = performance.now();
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
      letters: this.resume.letters | 0, bigHit: this.resume.bigHit | 0, playMs: this.resume.playMs | 0,
      overkill: this.resume.overkill | 0,
    } : { fightIdx: 0, hpMax: 50, hp: 50, sigils: [], words: 0, longest: '', totalDmg: 0, scried: false, featherUsed: false, letters: 0, bigHit: 0, playMs: 0, overkill: 0 };
    this.run.startAt = Date.now();
    this.run.firstUsed = false;
    this.state = 'boot';
    this.board = []; this.sel = []; this.lineTiles = [];
    SS.prof.runs++; SS.save();

    const tState = performance.now();
    this.buildUi();
    const tUi = performance.now();
    this.startFight();
    const tEnd = performance.now();
    DIAG('battle create ' + Math.round(tEnd - tCr) + 'ms (sky ' + Math.round(tSky - tCr) +
      ' · state ' + Math.round(tState - tSky) + ' · ui ' + Math.round(tUi - tState) + ' · fight ' + Math.round(tEnd - tUi) + ')');

    if (DEMO) this.demoTimer = this.time.addEvent({ delay: 1400, loop: true, callback: () => this.demoStep() });
    this.input.on('pointerdown', () => SFX.ensure());
    this.game.events.on('ss-ach', this.onAch, this);
    this.events.once('shutdown', () => this.game.events.off('ss-ach', this.onAch, this));
  }
  onAch(def) { ssAchToast(this, def); }

  // Wake the sleeping meadow instead of re-creating it — the descent must
  // start on the very next frame. The dawn return (campaign win) needs the
  // other sky so it takes the full re-create, and so does a home that a
  // mid-ascent resize restart already stopped.
  goHome(data) {
    const h = this.scene.get('home');
    if (!data.dawn && h && h.sys.isSleeping()) { this.scene.wake('home', data); this.scene.stop(); }
    else this.scene.start('home', data);
  }

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
    // trough + fill + numbers live in one container so a heavy hit can shake
    // the whole bar as a unit
    this.ehpC = this.add.container(0, 0);
    const eTrough = this.add.image(l.x(-112), l.y(322), 'bartrough').setOrigin(0, 0.5).setDisplaySize(l.u(224), l.u(13));
    this.ehpBar = this.add.image(l.x(-110), l.y(322), 'barfill-rose').setOrigin(0, 0.5).setDisplaySize(l.u(220), l.u(8));
    // numeric HP on the bar itself — players plan lethal ("15 left, build 15+")
    this.ehpT = txt(l.x(0), l.y(321), '', 11, '#ffe9e0')
      .setOrigin(0.5).setShadow(0, l.u(1), 'rgba(16,4,12,0.95)', l.u(2.5));
    this.ehpC.add([eTrough, this.ehpBar, this.ehpT]);
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
    this.homeB.on('pointerdown', () => { SFX.ui(); this.goHome({ from: 'battle' }); });
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
    const letter = this.add.image(0, -l.u(2), ssGlyph(this, ch, SS_TILE_INK[tier]))
      .setDisplaySize(l.u(64), l.u(48));
    const val = this.add.image(l.u(25), l.u(21), ssGlyphVal(this, this.tileVal(ch, tier), SS_TILE_VINK[tier]))
      .setDisplaySize(l.u(26), l.u(16));
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
      // same glyph texture as the board, at the line's font-16/20 proportions
      const gsc = s.ch === 'qu' ? 16 / 30 : 20 / 36;
      const letter = this.add.image(0, 0, ssGlyph(this, s.ch, valid ? SS_LINE_GREEN : SS_TILE_INK[0]))
        .setDisplaySize(l.u(64 * gsc), l.u(48 * gsc));
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
    if (this.hasSigil('roots')) dmg += 2 * this.run.sigils.length;
    if (this.hasSigil('verse')) dmg += this.run.words;
    if (this.hasSigil('blood')) dmg *= 1.25;
    if (this.hasSigil('nova') && letters >= 7) dmg *= 2;
    if (this.hasSigil('storm') && this.run.words % 3 === 2) dmg *= 2;   // every 3rd cast
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
    if ((this.run.overkill | 0) > 0) {                 // ECHO OF RUIN carries the surplus
      const carve = Math.min(this.run.overkill | 0, this.beast.hp - 1);
      this.beast.hpNow -= carve;
      this.run.overkill = 0;
      const et = ssTxt(this, l.x(0), l.y(238), '☍ −' + carve, l.u(18), '#d9b0ff').setOrigin(0.5).setDepth(70)
        .setShadow(0, 0, '#a86be0', l.u(8), true, true);
      this.tweens.add({ targets: et, alpha: 0, y: l.y(214), delay: 1100, duration: 500, onComplete: () => et.destroy() });
    }
    // what the bar/numbers SHOW — trails hpNow, catching up when a flying
    // damage number lands on the bar
    this.ehpShown = { v: this.beast.hpNow };
    this.dying = false;
    this.beast.count = this.beast.timer;
    this.run.firstUsed = false;
    this.struckThisBattle = false;
    this.shieldUsed = false;
    this.hintUsed = false;
    this.clearHintFx();
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
    this.drawEhp();
    this.strikeT.setText(this.beast.hpNow > 0 ? '✦ strikes in ' + this.beast.count + (this.beast.count === 1 ? ' cast ✦' : ' casts ✦') : '');
    this.strikeRib.setAlpha(this.strikeT.text ? 0.9 : 0);
    if (this.strikeT.text) this.strikeRib.setDisplaySize(this.strikeT.width + l.u(26), l.u(19));
    // while a damage number is in flight the tally animation owns the counter
    if (!this.scoreAnim) this.scoreT.setText(String(this.runScore()));
  }
  // enemy bar + numbers render the SHOWN hp (which trails hpNow during a
  // damage flight); numbers count down as the drain tween runs
  drawEhp() {
    const shown = Math.max(0, Math.round(this.ehpShown.v));
    this.ehpBar.setCrop(0, 0, this.ehpBar.frame.width * clamp(shown / this.beast.hp, 0, 1), this.ehpBar.frame.height);
    this.ehpT.setText(shown + ' / ' + this.beast.hp);
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
    this.clearHintFx(true);
    const tiles = this.sel.map((i) => this.board[i]);
    const dmg = this.wordDamage(tiles);
    const letters = tiles.reduce((a, s) => a + s.ch.length, 0);
    const stormProc = this.hasSigil('storm') && this.run.words % 3 === 2;   // before words++
    this.run.words++; this.run.firstUsed = true;
    this.run.letters += letters;
    if (dmg > this.run.bigHit) this.run.bigHit = dmg;
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
    if (stormProc) {                                   // STORMBINDER doubles this one
      const st = ssTxt(this, l.x(0), l.y(498), '↯ ×2', l.u(18), '#bfe0ff').setOrigin(0.5).setDepth(70)
        .setShadow(0, 0, '#6fa8ff', l.u(9), true, true);
      this.tweens.add({ targets: st, alpha: 0, y: l.y(474), delay: 650, duration: 400, onComplete: () => st.destroy() });
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
    const from = parseInt(this.scoreT.text, 10) || 0;
    this.run.totalDmg += dmg;
    const to = this.runScore();
    this.scoreAnim = (this.scoreAnim || 0) + 1;
    // beast recoil + hull flash read instantly; the bar waits for the number
    this.tweens.add({ targets: this.beastC, x: l.x(0) + l.u(10), duration: 60, yoyo: true, repeat: 1, onComplete: () => this.beastC.setX(l.x(0)) });
    if (this.beastLines) { this.beastLines.setAlpha(1); this.tweens.add({ targets: this.beastLines, alpha: 0.35, duration: 300 }); }
    this.updateBars();

    // the hit beat: the damage pops big at center screen, slams up into the
    // enemy HP bar, and only when it lands does the bar drain + count down.
    // Then the same value arcs on from the bar to the score tally.
    const big = dmg >= 25;
    const gk = ssGoldTex(this, String(dmg), 34);
    const nI = this.add.image(l.x(0), l.y(468), gk.key)
      .setDisplaySize(l.u(gk.w), l.u(gk.h)).setDepth(70);
    const sx = nI.scaleX, sy = nI.scaleY;
    nI.setScale(sx * 0.2, sy * 0.2).setAlpha(0);
    const pop = big ? 1.45 : 1.18;
    this.tweens.add({ targets: nI, scaleX: sx * pop, scaleY: sy * pop, alpha: 1, duration: 190, ease: 'Back.easeOut' });
    this.tweens.add({ targets: nI, scaleX: sx, scaleY: sy, delay: 190, duration: 130 });
    const start = { x: nI.x, y: nI.y }, dst = { x: l.x(0), y: l.y(322) };
    const pt = { t: 0 };
    this.tweens.add({
      targets: pt, t: 1, delay: 430, duration: 340, ease: 'Cubic.easeIn',
      onUpdate: () => {
        nI.x = start.x + (dst.x - start.x) * pt.t;
        nI.y = start.y + (dst.y - start.y) * pt.t;
        const k = 1 - pt.t * 0.55;
        nI.setScale(sx * k, sy * k);
        if (Math.random() < 0.3) this.starBurst.emitParticleAt(nI.x, nI.y, 1);
      },
      onComplete: () => {
        nI.destroy();
        this.starBurst.emitParticleAt(dst.x, dst.y, big ? 6 : 3);
        // small bar shake — only when the hit is worth bragging about
        if (big) {
          this.tweens.killTweensOf(this.ehpC);
          this.ehpC.setX(0);
          this.tweens.add({ targets: this.ehpC, x: l.u(3), duration: 40, yoyo: true, repeat: 3, onComplete: () => this.ehpC.setX(0) });
        }
        // drain now — the number has landed. Landing always retargets the
        // latest hpNow so chained casts stay truthful.
        this.tweens.killTweensOf(this.ehpShown);
        this.tweens.add({
          targets: this.ehpShown, v: Math.max(0, this.beast.hpNow), duration: 300, ease: 'Cubic.easeOut',
          onUpdate: () => this.drawEhp(),
          onComplete: () => {
            this.drawEhp();
            if (this.beast.hpNow <= 0 && !this.dying) { this.dying = true; this.beastDeath(); }
          },
        });
        this.flyScore(dst, dmg, from, to);
      },
    });
  }

  // the tally beat (v0.9.0), re-anchored: a smaller +N lifts off the enemy bar
  // where the damage landed, arcs up to the score trailing stars, and the score
  // counts up when it lands. The counter is read from the label (not runScore)
  // so back-to-back casts chain smoothly.
  flyScore(startPt, dmg, from, to) {
    const l = this.L;
    const gk = ssGoldTex(this, '+' + dmg, 22);
    const nI = this.add.image(startPt.x, startPt.y, gk.key)
      .setDisplaySize(l.u(gk.w), l.u(gk.h)).setDepth(70);
    const sx = nI.scaleX, sy = nI.scaleY;
    const dst = { x: this.scoreT.x - l.u(16), y: this.scoreT.y };
    const ctrl = { x: (startPt.x + dst.x) / 2 + l.u(40), y: Math.min(startPt.y, dst.y) - l.u(52) };
    const pt = { t: 0 };
    this.tweens.add({
      targets: pt, t: 1, duration: 430, ease: 'Cubic.easeIn',
      onUpdate: () => {
        const u = pt.t, v = 1 - u;
        nI.x = v * v * startPt.x + 2 * v * u * ctrl.x + u * u * dst.x;
        nI.y = v * v * startPt.y + 2 * v * u * ctrl.y + u * u * dst.y;
        const k = 1 - u * 0.45;
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
    if (this.hasSigil('echo')) this.run.overkill = Math.max(0, -this.beast.hpNow);
    this.run.fightIdx++;
    this.heal(this.hasSigil('meteor') ? this.run.hpMax : 6);
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
      letters: this.run.letters, bigHit: this.run.bigHit, playMs: this.runElapsed(),
      overkill: this.run.overkill | 0,
    }));
  }
  runElapsed() { return (this.run.playMs | 0) + Math.max(0, Date.now() - this.run.startAt); }

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
      let atk = this.beast.atk;
      if (this.hasSigil('eclipse')) atk = Math.ceil(atk / 2);
      if (this.hasSigil('ward')) atk = Math.max(1, atk - 3);
      this.run.hp -= atk;
      const dt = ssTxt(this, l.x(-160), l.y(68), '-' + atk, l.u(22), '#ff8a8a').setOrigin(0.5).setDepth(70);
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
    this.clearHintFx();
    this.unselectFrom(0);
    for (let i = 0; i < 16; i++) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
    this.fillBoard(false);
    if (this.hasSigil('comet')) { this.time.delayedCall(300, () => { this.state = 'pick'; }); return; }
    this.tickEnemy(() => { this.state = 'pick'; });
  }

  // The hint teaches the ORDER, not just the letters: tiles light one at a
  // time in word order, a gold thread grows from tile to tile as it goes, the
  // finished path holds a couple of seconds, then fades. A simultaneous
  // highlight told you WHICH letters but never WHAT word.
  useHint() {
    if (this.state !== 'pick' || !this.hasSigil('tome') || this.hintUsed) return;
    const best = this.bestWord();
    if (!best) return;
    this.hintUsed = true;
    this.hintB.setAlpha(0.3); this.hintT.setAlpha(0.3);
    SFX.forge();
    const l = this.L;
    this.clearHintFx();
    const fx = this.hintFx = this.add.container(0, 0).setDepth(45);
    const line = this.add.graphics().setBlendMode('ADD');
    fx.add(line);
    // slot positions, not live containers — tiles may pop/shift under the fx
    const pts = best.map((bi) => ({ x: this.board[bi].c.x, y: this.board[bi].c.y, bi }));
    const segs = [];
    const drawAll = (a, b, t) => {
      line.clear();
      line.lineStyle(l.u(4), 0xffd77a, 0.7);
      for (const [p1, p2] of segs) { line.beginPath(); line.moveTo(p1.x, p1.y); line.lineTo(p2.x, p2.y); line.strokePath(); }
      if (a && t > 0) {
        line.beginPath(); line.moveTo(a.x, a.y);
        line.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); line.strokePath();
      }
    };
    const step = (k) => {
      if (this.hintFx !== fx) return;   // cancelled mid-reveal
      const p = pts[k];
      SFX.chime(k);   // same rising scale the taps will make — ear learns it too
      // soft halo, not a floodlight — the letter has to stay readable so the
      // player can read the word off the board as the path grows
      const g = this.add.image(p.x, p.y, 'dot').setScale(this.tileSize / 14)
        .setTint(0xffc95c).setAlpha(0).setBlendMode('ADD');
      fx.add(g);
      this.tweens.add({ targets: g, alpha: 0.55, duration: 160, ease: 'Sine.easeOut', yoyo: true, hold: 60, repeat: 0, onComplete: () => g.setAlpha(0.3) });
      const bc = this.board[p.bi] && this.board[p.bi].c;
      if (bc) this.tweens.add({ targets: bc, scale: 1.1, duration: 130, yoyo: true });
      if (k > 0) {
        const a = pts[k - 1], seg = { t: 0 };
        this.tweens.add({
          targets: seg, t: 1, duration: 220, ease: 'Sine.easeOut',
          onUpdate: () => { if (this.hintFx === fx) drawAll(a, p, seg.t); },
          onComplete: () => { if (this.hintFx === fx) { segs.push([a, p]); drawAll(null, null, 0); } },
        });
      }
      if (k + 1 < pts.length) this.time.delayedCall(340, () => step(k + 1));
      else this.time.delayedCall(2200, () => { if (this.hintFx === fx) this.clearHintFx(true); });
    };
    step(0);
  }
  clearHintFx(fade) {
    if (!this.hintFx) return;
    const fx = this.hintFx;
    this.hintFx = null;
    if (fade) this.tweens.add({ targets: fx, alpha: 0, duration: 450, onComplete: () => fx.destroy() });
    else fx.destroy();
  }

  // ---------- sigil pick ----------
  // Rarity gating. Campaign: rares surface from late Act I and climb with the
  // ascent, legendaries from mid Act II — power arrives with the difficulty.
  // Quick/daily: any tier can appear anywhere, but at LOW odds, so an early
  // lucky legendary stays a story, not a strategy (the legendary effects are
  // also tuned to scale — none of them flat-nukes an early beast).
  sigilChances() {
    if (this.mode === 'campaign') {
      const p = this.run.fightIdx / Math.max(1, this.fights.length - 1);
      return {
        rare: this.run.fightIdx >= 3 ? 0.12 + 0.28 * p : 0,
        leg: this.run.fightIdx >= 7 ? 0.04 + 0.14 * Math.max(0, p - 0.5) / 0.5 : 0,
      };
    }
    return { rare: 0.10, leg: 0.03 };
  }
  rollSigilOpts() {
    const { rare, leg } = this.sigilChances();
    const pools = [0, 1, 2].map((r) => SS_SIGILS.filter((s) => (s.rarity | 0) === r && !this.run.sigils.includes(s.id)));
    const opts = [];
    for (let k = 0; k < 3; k++) {
      const roll = rng();
      let tier = roll < leg ? 2 : roll < leg + rare ? 1 : 0;
      while (tier > 0 && !pools[tier].length) tier--;          // pool dry → fall a tier
      const pool = pools[tier].length ? pools[tier] : pools.find((p) => p.length);
      if (!pool || !pool.length) break;
      opts.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
    return opts;
  }
  showSigilPick() {
    const l = this.L;
    this.state = 'sigil';
    const opts = this.rollSigilOpts();
    if (!opts.length) { this.afterSigil(); return; }           // every sigil owned — ride on
    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.86, duration: 300 });
    const head = ssTxt(this, l.x(0), l.y(128), SS_T('sigilHead'), l.u(18), '#c9b676').setOrigin(0.5)
      .setShadow(0, 0, '#c9b676', l.u(10), true, true);
    const items = [veil, head];
    // pick-screen sparkles ride above the cards (added to overlayC last)
    const sparks = this.add.particles(0, 0, 'dot', {
      speed: { min: 40, max: 240 }, lifespan: { min: 300, max: 900 }, scale: { start: 0.8, end: 0 },
      tint: [0xffd77a, 0xfff2c9], blendMode: 'ADD', emitting: false,
    });
    opts.forEach((sg, k) => {
      const cy = l.y(268 + k * 168);
      const tier = sg.rarity | 0;
      const glow = this.add.image(l.x(0), cy, 'glowbig').setDisplaySize(l.u(470), l.u(240))
        .setTint(SS_RARITY[tier].glow).setAlpha(0).setBlendMode('ADD');
      const card = ssSigilCard(this, l, sg, 336, 146).setPosition(l.x(0), cy + l.u(26)).setAlpha(0);
      items.push(glow, card);
      const delay = 160 + k * 150;
      this.tweens.add({ targets: card, alpha: 1, y: cy, delay, duration: 320, ease: 'Cubic.easeOut' });
      if (tier > 0) {
        // arrival glow settles into a slow breathing pulse
        this.tweens.add({
          targets: glow, alpha: tier === 2 ? 0.22 : 0.12, delay, duration: 400,
          onComplete: () => this.tweens.add({ targets: glow, alpha: tier === 2 ? 0.10 : 0.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
        });
        this.time.delayedCall(delay + 280, () => {
          if (this.state !== 'sigil') return;
          if (tier === 2) {                                    // the legendary announces itself
            SFX.forge();
            this.cameras.main.flash(300, 255, 214, 120, false);
            sparks.emitParticleAt(l.x(0), cy, 22);
          } else sparks.emitParticleAt(l.x(0), cy, 8);
        });
      }
      card.on('pointerover', () => { if (this.state === 'sigil') this.tweens.add({ targets: card, scale: 1.03, duration: 120 }); });
      card.on('pointerout', () => this.tweens.add({ targets: card, scale: 1, duration: 120 }));
      card.on('pointerdown', () => {
        if (this.state !== 'sigil') return;
        this.state = 'anim';
        SFX.sigil();
        this.run.sigils.push(sg.id);
        if (sg.id === 'aegis') { this.run.hpMax += 20; this.run.hp = this.run.hpMax; }
        if (this.mode === 'campaign') this.saveCheckpoint();
        sparks.emitParticleAt(card.x, card.y, tier === 2 ? 26 : 12);
        this.tweens.add({ targets: card, scale: 1.05, duration: 130, yoyo: true });
        for (const it of items) if (it !== card && it !== sparks) this.tweens.add({ targets: it, alpha: 0, duration: 200 });
        this.time.delayedCall(260, () => { sparks.destroy(); for (const it of items) it.destroy(); this.afterSigil(); });
      });
    });
    items.push(sparks);
    this.overlayC.add(items);
  }

  // ---------- the map between fights ----------
  // Campaign only: after the sigil settles, the star chart rises — where the
  // night stands, what has been felled, what waits above — and the player
  // taps the breathing constellation to march on. Quick/daily keep their
  // straight fight → sigil → fight rhythm.
  afterSigil() {
    if (this.mode === 'campaign') this.showMap();
    else this.startFight();
  }
  showMap() {
    const l = this.L;
    this.state = 'map';
    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.86, duration: 300 });
    const chart = ssStarChart(this, {
      fightIdx: this.run.fightIdx,
      onEnter: () => {
        if (this.state !== 'map') return;
        this.state = 'anim';
        this.tweens.add({ targets: [veil, chart.c], alpha: 0, duration: 220 });
        this.time.delayedCall(240, () => { veil.destroy(); chart.c.destroy(); this.startFight(); });
      },
    });
    this.overlayC.add([veil, chart.c]);
    chart.c.y = l.u(16); chart.c.alpha = 0;
    this.tweens.add({ targets: chart.c, y: 0, alpha: 1, duration: 320, ease: 'Back.easeOut' });
  }

  // ---------- run end ----------
  endRun(won) {
    const l = this.L;
    this.state = 'end';
    const score = this.runScore();
    const elapsed = this.runElapsed();
    if (!won) SFX.defeat();
    // best-run reference, captured before the books are updated below
    const dk = String(SSNET.dayKey());
    let prevBest = -1;                                     // -1 = no best line for this mode/result
    if (won && this.mode === 'quick') prevBest = SS.prof.bestQuick;
    if (won && this.mode === 'campaign') prevBest = SS.prof.bestCampaign;
    if (this.mode === 'daily') prevBest = SS.prof.daily[dk] | 0;
    if (won && this.mode === 'quick') {
      SS.award('star-caller', this.game);
      if (!this.run.scried) SS.award('no-scry', this.game);
      if (score > SS.prof.bestQuick) SS.prof.bestQuick = score;
    }
    if (won && this.mode === 'campaign') {
      SS.award('sky-sweeper', this.game);
      if (score > SS.prof.bestCampaign) SS.prof.bestCampaign = score;
    }
    if (this.mode === 'campaign') localStorage.removeItem('beta3.campaign');
    if (this.mode === 'daily') {
      SS.award('daily-devout', this.game);
      if (!SS.prof.daily[dk] || score > SS.prof.daily[dk]) SS.prof.daily[dk] = score;
    }
    if (won) SS.prof.wins++;
    SS.save(); SS.sync();
    if (this.mode !== 'campaign' || won) SSNET.submitScore(score, this.run.longest);

    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: won ? 0.7 : 0.8, duration: won ? 300 : 550 });
    const items = [];

    // the window: an opaque midnight/gold panel, sized to its contents
    const ph = this.mode === 'daily' ? 610 : 566;
    const top = 410 - ph / 2;
    const py = (d) => l.y(top + d);
    items.push(this.add.image(l.x(0), py(ph / 2), 'endpanel').setDisplaySize(l.u(372), l.u(ph)));

    const title = ssTxt(this, l.x(0), py(42), SS_T(won ? 'endWin' : 'endLose'), l.u(24), won ? '#ffe9a8' : '#e66a6a').setOrigin(0.5)
      .setShadow(0, 0, won ? '#c9b676' : '#802020', l.u(12), true, true);
    items.push(title);
    items.push(ssTxt(this, l.x(0), py(70), SS_T(won ? 'endWinSub' : 'endLoseSub'), l.u(12), won ? '#c9b676' : '#8f8090', 'italic').setOrigin(0.5));
    const rule = (d) => items.push(this.add.rectangle(l.x(0), py(d), l.u(316), Math.max(1, l.u(1)), 0xc9a84c, 0.35));
    rule(92);

    // the score, in gold letterpress, with the best-run reference under it
    items.push(ssTxt(this, l.x(0), py(112), SS_T('stScore'), l.u(11), '#8f8873').setOrigin(0.5));
    const gk = ssGoldTex(this, String(score), 30);
    items.push(this.add.image(l.x(0), py(140), gk.key).setDisplaySize(l.u(gk.w), l.u(gk.h)));
    if (prevBest >= 0 && score > prevBest && prevBest > 0) {
      const nb = ssTxt(this, l.x(0), py(170), SS_T('newBest'), l.u(14), '#ffe9a8').setOrigin(0.5)
        .setShadow(0, 0, '#c9b676', l.u(10), true, true);
      items.push(nb);
      this.tweens.add({ targets: nb, alpha: 0.55, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1000 });
    } else if (prevBest > 0) {
      items.push(ssTxt(this, l.x(0), py(170), SS_T('stBest', prevBest), l.u(12), '#8f8873').setOrigin(0.5));
    }

    // the finest word gets the nameplate treatment
    items.push(ssTxt(this, l.x(0), py(196), SS_T('stFinest'), l.u(11), '#8f8873').setOrigin(0.5));
    if (this.run.longest) {
      const wk = ssGoldTex(this, this.run.longest.toUpperCase(), 20);
      const sc = Math.min(1, 300 / wk.w);
      items.push(this.add.image(l.x(0), py(222), wk.key).setDisplaySize(l.u(wk.w * sc), l.u(wk.h * sc)));
    } else {
      items.push(ssTxt(this, l.x(0), py(222), '—', l.u(18), '#d8d2bd').setOrigin(0.5));
    }
    rule(246);

    // the ledger: label left, value right
    const mins = Math.floor(elapsed / 60000), secs = Math.floor(elapsed / 1000) % 60;
    const rows = [
      [SS_T('stBeasts'), this.run.fightIdx + ' / ' + this.fights.length],
      [SS_T('stWords'), String(this.run.words)],
      [SS_T('stLetters'), String(this.run.letters)],
      [SS_T('stBigHit'), this.run.bigHit ? String(this.run.bigHit) : '—'],
      [SS_T('stTime'), mins + ':' + String(secs).padStart(2, '0')],
    ];
    rows.forEach(([k, v], i) => {
      items.push(ssTxt(this, l.x(-150), py(266 + i * 26), k, l.u(13), '#a89f85').setOrigin(0, 0.5));
      items.push(ssTxt(this, l.x(150), py(266 + i * 26), v, l.u(13.5), '#e8e0c8').setOrigin(1, 0.5));
    });

    // sigils held, as their icons
    items.push(ssTxt(this, l.x(-150), py(400), SS_T('stSigils'), l.u(13), '#a89f85').setOrigin(0, 0.5));
    const glyphs = this.run.sigils.map((id) => (SS_SIGILS.find((s) => s.id === id) || {}).icon || '✦');
    items.push(ssTxt(this, l.x(150), py(400), glyphs.length ? glyphs.join(' ') : '—', l.u(glyphs.length > 10 ? 12 : 14), '#d7b45c').setOrigin(1, 0.5)
      .setShadow(0, 0, '#c9b676', l.u(6), true, true));

    let by = 470;
    if (this.mode === 'daily') {
      const share = this.add.image(l.x(0), py(452), ssBtn(this, true, 240, 44)).setDisplaySize(l.u(240), l.u(44)).setInteractive({ useHandCursor: true });
      const shareT = ssTxt(this, l.x(0), py(452), SS_T('shareBtn'), l.u(13), '#9fb0e8').setOrigin(0.5);
      items.push(share, shareT);
      share.on('pointerdown', () => {
        const txt = 'STARSPELL Daily ' + SSNET.dayKeyISO() + '\n' +
          '✶ ' + score + ' pts · ' + this.run.fightIdx + '/' + this.fights.length + ' beasts\n' +
          '❦ finest word: ' + (this.run.longest || '—').toUpperCase() + '\n' +
          'https://drbango.com/beta3/?daily=1';
        try {
          if (navigator.clipboard) navigator.clipboard.writeText(txt);
          else { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
          shareT.setText(SS_T('shareCopied'));
        } catch (e) { shareT.setText(SS_T('shareFail')); }
      });
      by = 506;
    }
    const again = this.add.image(l.x(0), py(by), ssBtn(this, false, 240, 56)).setDisplaySize(l.u(240), l.u(56)).setInteractive({ useHandCursor: true });
    const againT = ssTxt(this, l.x(0), py(by), SS_T(won || this.mode !== 'campaign' ? 'newRun' : 'tryAgain'), l.u(17), BTN_INK()).setOrigin(0.5);
    const homeB = this.add.image(l.x(0), py(by + 58), ssBtn(this, true, 240, 46)).setDisplaySize(l.u(240), l.u(46)).setInteractive({ useHandCursor: true });
    const homeT = ssTxt(this, l.x(0), py(by + 58), SS_T('home'), l.u(14), '#9fb0e8').setOrigin(0.5);
    items.push(again, againT, homeB, homeT);
    again.on('pointerdown', () => { SFX.ui(); this.scene.restart({ mode: this.mode, resume: null }); });
    // the Act III payoff: win the campaign and you descend into sunrise
    homeB.on('pointerdown', () => { SFX.ui(); this.goHome({ from: won ? 'battle' : 'defeat', dawn: won && this.mode === 'campaign' }); });
    this.overlayC.add([veil, ...items]);

    // entrance: the window settles up into place; a defeat sinks in more slowly
    items.forEach((it) => { it.y += l.u(16); it.alpha = 0; });
    this.tweens.add({ targets: items, y: '-=' + l.u(16), alpha: 1, duration: won ? 380 : 600, ease: won ? 'Back.easeOut' : 'Sine.easeOut', delay: won ? 120 : 250 });
    if (won) this.time.delayedCall(300, () => {           // gold motes crown a victory
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, r = l.u(30 + rng() * 40);
        const m = this.add.image(title.x, title.y - l.u(16), 'dot').setScale(0.5 + rng() * 0.5)
          .setTint(0xffe9a8).setBlendMode('ADD').setDepth(101);
        this.overlayC.add(m);
        this.tweens.add({ targets: m, x: title.x + Math.cos(a) * r * 2.4, y: title.y - l.u(16) + Math.sin(a) * r, alpha: 0, scale: 0.1, duration: 900 + rng() * 500, ease: 'Cubic.easeOut', onComplete: () => m.destroy() });
      }
    });

    if (DEMO) {
      localStorage.setItem('beta3.result', JSON.stringify({ won, mode: this.mode, score, words: this.run.words, longest: this.run.longest, letters: this.run.letters, bigHit: this.run.bigHit, elapsed }));
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
    if (this.state === 'map') {
      const ch = this.overlayC.list.find((o) => o.getData && o.getData('mapZone'));
      const z = ch && ch.getData('mapZone');
      if (z && z.active) z.emit('pointerdown');
      return;
    }
    if (this.state === 'sigil') {
      if (!this.sigilShownAt) this.sigilShownAt = this.time.now;
      if (this.time.now - this.sigilShownAt > 2200) {
        this.sigilShownAt = 0;
        const cards = this.overlayC.list.filter((o) => o.getData && o.getData('sigilCard'));
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
   LEADERBOARD — the night's finest, held like a ceremony:
   a medallion podium for the top three, glass pills for the
   roll below, your own row in gold wherever you stand, and
   the reset clock ticking over both boards.
   ============================================================ */
class Board extends Phaser.Scene {
  constructor() { super('board'); }
  create() {
    const l = ssLayout(this);
    ssMakeTextures(this);
    ssStarfield(this, 110);
    // a faint gold dawn crowns the summit of the list
    this.add.image(l.x(0), l.y(160), 'glowbig').setScale(l.u(2.6)).setTint(0xd7b45c).setAlpha(0.05).setBlendMode('ADD');

    const back = ssTxt(this, l.x(-195), l.y(24), '‹ ' + SS_T('home'), l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('home'); });

    // the title in the wordmark's gold letterpress, flanked by flourishes
    const tk = ssGoldTex(this, SS_T('lbTitle'), 19);
    const tsc = Math.min(1, 320 / tk.w);
    this.add.image(l.x(0), l.y(58), tk.key).setDisplaySize(l.u(tk.w * tsc), l.u(tk.h * tsc));
    for (const s of [-1, 1]) {
      ssTxt(this, l.x(s * (tk.w * tsc / 2 + 20)), l.y(58), '✦', l.u(12), '#c9b676').setOrigin(0.5)
        .setShadow(0, 0, '#c9b676', l.u(6), true, true);
    }

    // tabs: two pills — the active board wears the gold
    this.tab = 'daily';
    this.tabBtns = {};
    const mkTab = (key, dx, label) => {
      const bg = this.add.image(l.x(dx), l.y(104), ssBtn(this, true, 150, 38)).setDisplaySize(l.u(150), l.u(38)).setInteractive({ useHandCursor: true });
      const lab = ssTxt(this, l.x(dx), l.y(104), label, l.u(14), '#5a6390').setOrigin(0.5);
      bg.on('pointerdown', () => this.setTab(key));
      this.tabBtns[key] = { bg, lab };
    };
    mkTab('daily', -80, SS_T('lbDaily'));
    mkTab('weekly', 80, SS_T('lbWeekly'));
    this.dressTabs(l);

    // the reset clock, ticking every second. Both flips are UTC (daily 00:00,
    // weekly Monday 00:00) so the countdown is the same for the whole planet,
    // worded in the player's own units.
    this.cdT = ssTxt(this, l.x(0), l.y(138), '', l.u(11.5), '#c9b676').setOrigin(0.5);
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickCd() });
    this.tickCd();

    if (SSNET.mode === 'local') {
      ssTxt(this, l.x(0), l.y(772), '· ' + SS_T('lbLocal') + ' ·', l.u(9.5), '#8c5a5a', 'italic').setOrigin(0.5);
    }
    this.rowsC = this.add.container(0, 0);
    this.loadingT = ssTxt(this, l.x(0), l.y(340), SS_T('lbLoading'), l.u(13), '#5a6390', 'italic').setOrigin(0.5);
    this.refresh();
  }
  dressTabs(l) {
    for (const [key, t] of Object.entries(this.tabBtns)) {
      const on = key === this.tab;
      t.bg.setTexture(ssBtn(this, !on, 150, 38)).setDisplaySize(l.u(150), l.u(38));
      t.lab.setColor(on ? BTN_INK() : '#5a6390');
    }
  }
  tickCd() {
    if (!this.cdT || !this.cdT.active) return;
    const daily = this.tab === 'daily';
    const ms = daily ? SSNET.msToNextDay() : SSNET.msToNextWeek();
    this.cdT.setText((daily ? '☾ ' : '✦ ') + SS_T(daily ? 'lbNewSky' : 'lbWeekEnds', ssCountdownLive(ms)));
  }
  setTab(t) {
    if (this.tab === t) return;
    SFX.ui();
    this.tab = t;
    this.dressTabs(ssLayout(this));
    this.tickCd();
    this.refresh();
  }
  async refresh() {
    const l = ssLayout(this);
    if (this.rowsC.list.length) this.tweens.killTweensOf(this.rowsC.list);
    this.rowsC.removeAll(true);
    this.loadingT.setVisible(true);
    const tab = this.tab;
    const b = await SSNET.getBoard(tab);
    if (this.tab !== tab || !this.scene.isActive()) return;
    this.loadingT.setVisible(false);
    if (!b.rows.length) {
      this.rowsC.add(ssTxt(this, l.x(0), l.y(340), SS_T('lbEmpty'), l.u(13), '#5a6390', 'italic').setOrigin(0.5));
      return;
    }
    const meId = SSNET.uid();
    const ent = [];                       // entrance-animated, in cascade order
    const trim = (t2, w) => { while (t2.width > l.u(w) && t2.text.length > 2) t2.setText(t2.text.slice(0, -2) + '…'); return t2; };

    // ---- the podium: three medallions afloat in the dusk, champion highest ----
    const POD = [
      { dx: 0, my: 216, r: 38, big: 18, glow: 0xffd77a, ga: 0.2 },
      { dx: -132, my: 240, r: 29, big: 14, glow: 0xcfd8ff, ga: 0.11 },
      { dx: 132, my: 248, r: 26, big: 13, glow: 0xe8b57f, ga: 0.1 },
    ];
    b.rows.slice(0, 3).forEach((r, i) => {
      const P = POD[i], me = r.id === meId;
      const glow = this.add.image(l.x(P.dx), l.y(P.my), 'glowbig').setDisplaySize(l.u(P.r * 5.2), l.u(P.r * 5.2))
        .setTint(P.glow).setAlpha(P.ga).setBlendMode('ADD');
      this.rowsC.add(glow);
      if (i === 0) this.tweens.add({ targets: glow, alpha: P.ga * 0.45, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const grp = [];
      grp.push(this.add.image(l.x(P.dx), l.y(P.my), ssMedalTex(this, i)).setDisplaySize(l.u(P.r * 2), l.u(P.r * 2)));
      grp.push(ssTxt(this, l.x(P.dx), l.y(P.my), String(i + 1), l.u(P.r * 0.95), SS_MEDAL_INK[i]).setOrigin(0.5, 0.55));
      if (me) grp.push(ssTxt(this, l.x(P.dx), l.y(P.my - P.r - 14), '✦ ' + SS_T('lbYou') + ' ✦', l.u(10), '#ffe9a8').setOrigin(0.5)
        .setShadow(0, 0, '#c9b676', l.u(6), true, true));
      grp.push(trim(ssTxt(this, l.x(P.dx), l.y(P.my + P.r + 15), r.name, l.u(i === 0 ? 13.5 : 12), me ? '#ffe9a8' : '#e8e0c8').setOrigin(0.5), 124));
      const gk = ssGoldTex(this, String(r.score), P.big);
      grp.push(this.add.image(l.x(P.dx), l.y(P.my + P.r + 37), gk.key).setDisplaySize(l.u(gk.w), l.u(gk.h)));
      if (r.word) grp.push(trim(ssTxt(this, l.x(P.dx), l.y(P.my + P.r + 56), r.word, l.u(9), '#8a94c4', 'italic').setOrigin(0.5), 124));
      ent.push(...grp);
      this.rowsC.add(grp);
    });
    // gold motes crown the champion as the podium settles
    this.time.delayedCall(280, () => {
      if (this.tab !== tab || !this.scene.isActive()) return;
      const em = this.add.particles(0, 0, 'dot', {
        speed: { min: 20, max: 90 }, lifespan: { min: 400, max: 1000 }, scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 }, tint: [0xffd77a, 0xfff2c9], blendMode: 'ADD', emitting: false,
      });
      this.rowsC.add(em);
      em.emitParticleAt(l.x(0), l.y(216), 16);
      this.time.delayedCall(1200, () => em.destroy());
    });

    // ---- the roll: ranks 4-10 on glass pills ----
    b.rows.slice(3, 10).forEach((r, k) => {
      const y = l.y(392 + k * 40), me = r.id === meId;
      const grp = [];
      grp.push(this.add.image(l.x(0), y, 'ribbon').setDisplaySize(l.u(384), l.u(34)));
      if (me) grp.push(this.add.rectangle(l.x(0), y, l.u(376), l.u(28), 0xd7b45c, 0.13));
      grp.push(ssTxt(this, l.x(-172), y, '#' + (k + 4), l.u(11), me ? '#ffd77a' : '#8a94c4').setOrigin(0, 0.5));
      grp.push(trim(ssTxt(this, l.x(-140), y, r.name, l.u(13), me ? '#ffe9a8' : '#f0e8d2').setOrigin(0, 0.5), 176));
      if (r.word) grp.push(ssTxt(this, l.x(64), y, r.word, l.u(9.5), '#5a6390', 'italic').setOrigin(0, 0.5));
      grp.push(ssTxt(this, l.x(172), y, String(r.score), l.u(13.5), me ? '#ffe9a8' : '#d8d2bd').setOrigin(1, 0.5));
      ent.push(...grp);
      this.rowsC.add(grp);
    });

    // ---- you, wherever you stand ----
    if (b.me >= 0) {
      const grp = [];
      if (b.me >= 10 && b.rows[b.me]) {
        const y = l.y(688), r = b.rows[b.me];
        grp.push(this.add.image(l.x(0), y, 'ribbon').setDisplaySize(l.u(384), l.u(34)));
        grp.push(this.add.rectangle(l.x(0), y, l.u(376), l.u(28), 0xd7b45c, 0.13));
        grp.push(ssTxt(this, l.x(-172), y, '#' + (b.me + 1), l.u(11), '#ffd77a').setOrigin(0, 0.5));
        grp.push(trim(ssTxt(this, l.x(-130), y, r.name, l.u(13), '#ffe9a8').setOrigin(0, 0.5), 166));
        if (r.word) grp.push(ssTxt(this, l.x(64), y, r.word, l.u(9.5), '#8a94c4', 'italic').setOrigin(0, 0.5));
        grp.push(ssTxt(this, l.x(172), y, String(r.score), l.u(13.5), '#ffe9a8').setOrigin(1, 0.5));
      }
      grp.push(ssTxt(this, l.x(0), l.y(b.me >= 10 ? 718 : 700), SS_T('lbYouRank', b.me + 1, b.total), l.u(11.5), '#c9b676').setOrigin(0.5));
      ent.push(...grp);
      this.rowsC.add(grp);
    }

    // entrance: the podium pops first, the roll follows in a soft cascade
    ent.forEach((o, i) => {
      const ty = o.y;
      o.y = ty + l.u(10); o.alpha = 0;
      this.tweens.add({ targets: o, y: ty, alpha: 1, duration: 300, delay: Math.min(620, i * 22), ease: 'Cubic.easeOut' });
    });
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
